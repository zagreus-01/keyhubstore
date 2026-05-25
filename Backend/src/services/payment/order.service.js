const Cart = require("../../models/cart.model");
const Order = require("../../models/order.model");
const ProductVariant = require("../../models/productVariant.model");
const couponService = require("./coupon.service");

const ORDER_STATUS = {
  pending: "pending",
  confirmed: "confirmed",
  preparing: "preparing",
  shipping: "shipping",
  delivered: "delivered",
  cancelRequested: "cancel_requested",
  cancelled: "cancelled"
};

const AUTOMATIC_CONFIRM_MINUTES = 30;

const validStatuses = Object.values(ORDER_STATUS);

const shouldAutoConfirm = (order) => {
  if (!order) return false;
  if (order.orderStatus !== ORDER_STATUS.pending) return false;
  if (!order.createdAt) return false;
  const ageMinutes = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
  return ageMinutes >= AUTOMATIC_CONFIRM_MINUTES && (order.paymentStatus === "paid" || order.paymentMethod === "COD");
};

const autoConfirmOrderIfNeeded = async (order) => {
  if (shouldAutoConfirm(order)) {
    order.orderStatus = ORDER_STATUS.confirmed;
    await order.save();
  }
  return order;
};

// =========================
// CHECKOUT
// =========================
const checkout = async (
  userId,
  shippingAddress,
  paymentMethod,
  couponCode
) => {
  const cart = await Cart.findOne({ userId }).populate({
    path: "items.variantId",
    populate: {
      path: "productId"
    }
  });

  if (!cart || !cart.items.length) {
    throw new Error("Cart is empty");
  }

  let totalAmount = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const variant = item.variantId;

    if (!variant) {
      throw new Error("Variant not found");
    }

    if (variant.stock < item.quantity) {
      throw new Error(`${variant.variantName} out of stock`);
    }

    const finalPrice = variant.salePrice > 0 ? variant.salePrice : variant.price;
    totalAmount += finalPrice * item.quantity;

    orderItems.push({
      variantId: variant._id,
      productName: variant.productId.productName,
      variantName: variant.variantName,
      image: variant.image,
      quantity: item.quantity,
      originalPrice: variant.price,
      finalPrice
    });
  }

  let discountType = null;
  let discountValue = 0;
  let discountAmount = 0;
  let finalAmount = totalAmount;
  let validatedCoupon = null;

  if (couponCode) {
    validatedCoupon = await couponService.validateCoupon(couponCode);
    discountType = validatedCoupon.discountType;
    discountValue = validatedCoupon.discountValue;

    let eligibleItems = [];
    if (!validatedCoupon.applyTo || validatedCoupon.applyTo.includes("all")) {
      eligibleItems = orderItems;
    } else if (validatedCoupon.applyTo.includes("product")) {
      eligibleItems = orderItems.filter((item) =>
        validatedCoupon.targetId && validatedCoupon.targetId.includes(String(item.variantId.productId?._id || item.variantId.productId))
      );
    } else if (validatedCoupon.applyTo.includes("category")) {
      eligibleItems = orderItems.filter((item) =>
        validatedCoupon.targetId && validatedCoupon.targetId.includes(String(item.variantId.productId?.categoryId))
      );
    } else if (validatedCoupon.applyTo.includes("brand")) {
      eligibleItems = orderItems.filter((item) =>
        validatedCoupon.targetId && validatedCoupon.targetId.includes(String(item.variantId.productId?.brandId))
      );
    }

    if (!eligibleItems.length) {
      throw new Error("Coupon không áp dụng cho sản phẩm nào trong giỏ hàng.");
    }

    const eligibleAmount = eligibleItems.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);

    if (discountType === "percent") {
      discountAmount = Math.round((eligibleAmount * discountValue) / 100);
    } else if (discountType === "fixed") {
      discountAmount = Math.min(discountValue, eligibleAmount);
    }

    finalAmount = totalAmount - discountAmount;
  }

  const order = await Order.create({
    userId,
    items: orderItems,
    totalAmount,
    couponCode: validatedCoupon ? validatedCoupon.code : undefined,
    discountType: discountType || undefined,
    discountValue: discountValue || undefined,
    discountAmount,
    finalAmount,
    shippingAddress,
    paymentMethod
  });

  for (const item of cart.items) {
    await ProductVariant.findByIdAndUpdate(item.variantId._id, {
      $inc: {
        stock: -item.quantity
      }
    });
  }

  cart.items = [];
  await cart.save();

  return order;
};

// =========================
// GET MY ORDERS
// =========================
const getMyOrders = async (userId) => {
  const orders = await Order.find({ userId }).sort({ createdAt: -1 });
  return await Promise.all(orders.map(autoConfirmOrderIfNeeded));
};

// =========================
// GET ALL ORDERS
// =========================
const getAllOrders = async () => {
  const orders = await Order.find().sort({ createdAt: -1 });
  return await Promise.all(orders.map(autoConfirmOrderIfNeeded));
};

// =========================
// GET ORDER BY ID
// =========================
const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  await autoConfirmOrderIfNeeded(order);
  return order;
};

// =========================
// GET ORDER DETAIL
// =========================
const getOrderDetail = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, userId });

  if (!order) {
    throw new Error("Order not found");
  }

  await autoConfirmOrderIfNeeded(order);
  return order;
};

// =========================
// CANCEL ORDER
// =========================
const cancelOrder = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, userId });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.orderStatus === ORDER_STATUS.delivered || order.orderStatus === ORDER_STATUS.cancelled) {
    throw new Error("Cannot cancel this order");
  }

  const now = new Date();
  const createdAt = new Date(order.createdAt);
  const diffMinutes = Math.floor((now - createdAt) / 60000);

  if (order.orderStatus === ORDER_STATUS.preparing || order.orderStatus === ORDER_STATUS.shipping) {
    order.orderStatus = ORDER_STATUS.cancelRequested;
    await order.save();
    return order;
  }

  if (diffMinutes > AUTOMATIC_CONFIRM_MINUTES) {
    throw new Error("Cannot cancel this order after 30 minutes. Please contact the shop for cancellation.");
  }

  order.orderStatus = ORDER_STATUS.cancelled;

  for (const item of order.items) {
    await ProductVariant.findByIdAndUpdate(item.variantId, {
      $inc: {
        stock: item.quantity
      }
    });
  }

  await order.save();
  return order;
};

// =========================
// UPDATE ORDER STATUS
// =========================
const updateOrderStatus = async (orderId, status) => {
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  order.orderStatus = status;

  if (status === ORDER_STATUS.delivered && order.paymentMethod === "VNPAY") {
    order.paymentStatus = "paid";
  }

  await order.save();
  return order;
};

module.exports = {
  checkout,
  getMyOrders,
  getOrderDetail,
  getAllOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus
};
