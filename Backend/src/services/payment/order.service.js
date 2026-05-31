const Cart = require("../../models/cart.model");
const Order = require("../../models/order.model");
const Product = require("../../models/product.model");
const ProductVariant = require("../../models/productVariant.model");
const User = require("../../models/user.model");
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
const POINT_VALUE = 1;

const validStatuses = Object.values(ORDER_STATUS);

const staffStatusTransitions = {
  [ORDER_STATUS.pending]: [ORDER_STATUS.confirmed, ORDER_STATUS.cancelled],
  [ORDER_STATUS.confirmed]: [ORDER_STATUS.preparing, ORDER_STATUS.cancelled],
  [ORDER_STATUS.preparing]: [ORDER_STATUS.shipping, ORDER_STATUS.cancelled],
  [ORDER_STATUS.cancelRequested]: [ORDER_STATUS.preparing, ORDER_STATUS.cancelled],
  [ORDER_STATUS.shipping]: [ORDER_STATUS.delivered],
  [ORDER_STATUS.delivered]: [],
  [ORDER_STATUS.cancelled]: []
};

const assertStaffStatusTransition = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) return;

  const allowedNextStatuses = staffStatusTransitions[currentStatus] || [];
  if (!allowedNextStatuses.includes(nextStatus)) {
    throw new Error(`Cannot change order status from ${currentStatus} to ${nextStatus}`);
  }
};

const getVariantName = (variant) => {
  if (variant.sku) return variant.sku;
  if (variant.attributes?.length) {
    return variant.attributes.map((attr) => `${attr.key}: ${attr.value}`).join(" / ");
  }
  return "Variant";
};

const getVariantImage = (variant, product) => {
  return variant.images?.[0] || product.images?.[0] || product.thumbnail || "";
};

const idsInclude = (ids = [], value) => ids.map(String).includes(String(value));

const deductStock = async (items) => {
  const deductedItems = [];

  try {
    for (const item of items) {
      const result = await ProductVariant.updateOne(
        {
          _id: item.variantId,
          status: "active",
          stock: { $gte: item.quantity }
        },
        {
          $inc: {
            stock: -item.quantity
          }
        }
      );

      if (result.modifiedCount !== 1) {
        throw new Error(`${item.productName} ${item.variantName || ""} is out of stock`);
      }

      deductedItems.push(item);
    }
  } catch (error) {
    await Promise.all(
      deductedItems.map((item) =>
        ProductVariant.findByIdAndUpdate(item.variantId, {
          $inc: {
            stock: item.quantity
          }
        })
      )
    );

    throw error;
  }
};

const restoreStock = async (items) => {
  await Promise.all(
    items.map((item) =>
      ProductVariant.findByIdAndUpdate(item.variantId, {
        $inc: {
          stock: item.quantity
        }
      })
    )
  );
};

const cancelOrderAndRestoreStock = async (order) => {
  order.orderStatus = ORDER_STATUS.cancelled;

  if (order.stockDeducted) {
    await restoreStock(order.items);
    order.stockDeducted = false;
  }

  if (order.pointsUsed > 0) {
    await User.findByIdAndUpdate(order.userId, {
      $inc: {
        loyaltyPoints: order.pointsUsed
      }
    });
    order.pointsUsed = 0;
    order.pointsDiscount = 0;
  }

  await order.save();
  return order;
};

const countSoldItems = async (order) => {
  if (order.soldCounted) return;

  await Promise.all(
    order.items.map(async (item) => {
      const productId = item.productId || (await ProductVariant.findById(item.variantId).select("productId"))?.productId;
      if (!productId) return;

      await Product.findByIdAndUpdate(productId, {
        $inc: {
          sold: item.quantity
        }
      });
    })
  );

  order.soldCounted = true;
};

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

const autoConfirmPendingOrders = async () => {
  const threshold = new Date(Date.now() - AUTOMATIC_CONFIRM_MINUTES * 60 * 1000);

  return Order.updateMany(
    {
      orderStatus: ORDER_STATUS.pending,
      createdAt: { $lte: threshold },
      $or: [
        { paymentStatus: "paid" },
        { paymentMethod: "COD" }
      ]
    },
    {
      $set: {
        orderStatus: ORDER_STATUS.confirmed
      }
    }
  );
};

// =========================
// CHECKOUT
// =========================
const checkout = async (
  userId,
  shippingAddress,
  paymentMethod,
  couponCode,
  pointsToUse = 0
) => {
  const cart = await Cart.findOne({ userId }).populate({
    path: "items.variantId",
    populate: {
      path: "productId",
      populate: [
        {
          path: "brandId"
        },
        {
          path: "categoryId"
        }
      ]
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

    const product = variant.productId;

    if (!product || product.isDeleted || product.status !== "active") {
      throw new Error("Product not found");
    }

    if (variant.stock < item.quantity) {
      throw new Error(`${product.productName} ${getVariantName(variant)} is out of stock`);
    }

    const finalPrice = variant.price;
    totalAmount += finalPrice * item.quantity;

    orderItems.push({
      variantId: variant._id,
      productName: product.productName,
      variantName: getVariantName(variant),
      image: getVariantImage(variant, product),
      quantity: item.quantity,
      originalPrice: variant.price,
      finalPrice,
      productId: product._id,
      categoryId: product.categoryId?._id || product.categoryId,
      brandId: product.brandId?._id || product.brandId
    });
  }

  let discountType = null;
  let discountValue = 0;
  let discountAmount = 0;
  let pointsUsed = Math.max(Number(pointsToUse) || 0, 0);
  let pointsDiscount = 0;
  let finalAmount = totalAmount;
  let validatedCoupon = null;

  if (couponCode) {
    validatedCoupon = await couponService.validateCoupon(couponCode, userId);
    discountType = validatedCoupon.discountType;
    discountValue = validatedCoupon.discountValue;

    let eligibleItems = [];
    if (!validatedCoupon.applyTo || validatedCoupon.applyTo.includes("all")) {
      eligibleItems = orderItems;
    } else if (validatedCoupon.applyTo.includes("product")) {
      eligibleItems = orderItems.filter((item) =>
        idsInclude(validatedCoupon.targetId, item.productId)
      );
    } else if (validatedCoupon.applyTo.includes("category")) {
      eligibleItems = orderItems.filter((item) =>
        idsInclude(validatedCoupon.targetId, item.categoryId)
      );
    } else if (validatedCoupon.applyTo.includes("brand")) {
      eligibleItems = orderItems.filter((item) =>
        idsInclude(validatedCoupon.targetId, item.brandId)
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

  if (pointsUsed > 0) {
    const user = await User.findById(userId).select("loyaltyPoints");
    const availablePoints = Math.max(user?.loyaltyPoints || 0, 0);
    const maxUsablePoints = Math.floor(Math.max(finalAmount, 0) / POINT_VALUE);

    pointsUsed = Math.min(pointsUsed, availablePoints, maxUsablePoints);
    pointsDiscount = pointsUsed * POINT_VALUE;
    finalAmount = Math.max(finalAmount - pointsDiscount, 0);
  }

  const shouldDeductNow = paymentMethod === "COD";
  let pointsDeducted = false;

  if (shouldDeductNow) {
    await deductStock(orderItems);
  }

  if (pointsUsed > 0) {
    const pointUpdate = await User.updateOne(
      {
        _id: userId,
        loyaltyPoints: { $gte: pointsUsed }
      },
      {
        $inc: {
          loyaltyPoints: -pointsUsed
        }
      }
    );

    if (pointUpdate.modifiedCount !== 1) {
      if (shouldDeductNow) {
        await restoreStock(orderItems);
      }
      throw new Error("Not enough loyalty points");
    }

    pointsDeducted = true;
  }

  try {
    const order = await Order.create({
      userId,
      items: orderItems,
      totalAmount,
      couponCode: validatedCoupon ? validatedCoupon.code : undefined,
      discountType: discountType || undefined,
      discountValue: discountValue || undefined,
      discountAmount,
      pointsUsed,
      pointsDiscount,
      finalAmount,
      shippingAddress,
      paymentMethod,
      stockDeducted: shouldDeductNow
    });

    if (shouldDeductNow) {
      cart.items = [];
      await cart.save();
    }

    return order;
  } catch (error) {
    if (shouldDeductNow) {
      await restoreStock(orderItems);
    }

    if (pointsDeducted) {
      await User.findByIdAndUpdate(userId, {
        $inc: {
          loyaltyPoints: pointsUsed
        }
      });
    }

    throw error;
  }
};

// =========================
// GET MY ORDERS
// =========================
const getMyOrders = async (userId, options = {}) => {
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 5, 1), 50);
  const skip = (page - 1) * limit;
  const filter = { userId };

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter)
  ]);

  return {
    orders: await Promise.all(orders.map(autoConfirmOrderIfNeeded)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
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

  if (order.orderStatus === ORDER_STATUS.delivered || order.orderStatus === ORDER_STATUS.cancelled || order.orderStatus === ORDER_STATUS.cancelRequested) {
    throw new Error("Cannot cancel this order");
  }

  const now = new Date();
  const createdAt = new Date(order.createdAt);
  const diffMinutes = Math.floor((now - createdAt) / 60000);

  if (order.orderStatus === ORDER_STATUS.shipping) {
    throw new Error("Cannot cancel this order while it is shipping.");
  }

  if (order.orderStatus === ORDER_STATUS.preparing) {
    order.orderStatus = ORDER_STATUS.cancelRequested;
    await order.save();
    return order;
  }

  if (order.orderStatus !== ORDER_STATUS.pending && order.orderStatus !== ORDER_STATUS.confirmed) {
    throw new Error("Cannot cancel this order");
  }

  if (diffMinutes > AUTOMATIC_CONFIRM_MINUTES) {
    throw new Error("Cannot cancel this order after 30 minutes. Please contact the shop for cancellation.");
  }

  return cancelOrderAndRestoreStock(order);
};

const updatePaymentStatusCOD = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.paymentMethod !== "COD") {
    throw new Error("Only COD orders can have payment status manually updated");
  }

  if (order.paymentStatus !== "pending") {
    throw new Error("Order payment status is not pending");
  }

  order.paymentStatus = "paid";
  
  await order.save();
  return order;
};

const completeOnlinePayment = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.paymentMethod !== "VNPAY") {
    throw new Error("Order is not a VNPAY order");
  }

  if (order.orderStatus === ORDER_STATUS.cancelled) {
    throw new Error("Cannot pay a cancelled order");
  }

  if (!order.stockDeducted) {
    await deductStock(order.items);
    order.stockDeducted = true;
  }

  order.paymentStatus = "paid";
  await order.save();

  await Cart.updateOne(
    { userId: order.userId },
    {
      $pull: {
        items: {
          variantId: {
            $in: order.items.map((item) => item.variantId)
          }
        }
      }
    }
  );

  return order;
};

const failOnlinePayment = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.paymentStatus !== "paid") {
    order.paymentStatus = "failed";
    if (order.pointsUsed > 0) {
      await User.findByIdAndUpdate(order.userId, {
        $inc: {
          loyaltyPoints: order.pointsUsed
        }
      });
      order.pointsUsed = 0;
      order.pointsDiscount = 0;
    }
    await order.save();
  }

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

  assertStaffStatusTransition(order.orderStatus, status);

  if (status === ORDER_STATUS.delivered && order.paymentMethod === "VNPAY" && order.paymentStatus !== "paid") {
    throw new Error("VNPAY order must be paid before delivery");
  }

  if (status === ORDER_STATUS.cancelled) {
    return cancelOrderAndRestoreStock(order);
  }

  order.orderStatus = status;

  if (status === ORDER_STATUS.delivered && order.paymentMethod === "COD") {
    order.paymentStatus = "paid";
  }

  if (status === ORDER_STATUS.delivered) {
    await countSoldItems(order);
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
  updateOrderStatus,
  updatePaymentStatusCOD,
  completeOnlinePayment,
  failOnlinePayment,
  autoConfirmPendingOrders
};
