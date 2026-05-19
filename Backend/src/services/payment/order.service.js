const Cart = require("../../models/cart.model");
const Order = require("../../models/order.model");
const ProductVariant = require("../../models/productVariant.model");
const couponService = require("./coupon.service");


// =========================
// CHECKOUT
// =========================
const checkout = async (
    userId,
    shippingAddress,
    paymentMethod,
    couponCode
) => {

    const cart = await Cart.findOne({ userId })
        .populate({
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
            throw new Error(
                `${variant.variantName} out of stock`
            );
        }

        const finalPrice =
            variant.salePrice > 0
                ? variant.salePrice
                : variant.price;

        totalAmount +=
            finalPrice * item.quantity;

        orderItems.push({

            variantId: variant._id,

            productName:
                variant.productId.productName,

            variantName:
                variant.variantName,

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

        // Xác định sản phẩm áp dụng coupon
        let eligibleItems = [];
        if (
            !validatedCoupon.applyTo ||
            validatedCoupon.applyTo.includes("all")
        ) {
            eligibleItems = orderItems;
        } else if (validatedCoupon.applyTo.includes("product")) {
            eligibleItems = orderItems.filter(item =>
                validatedCoupon.targetId && validatedCoupon.targetId.includes(String(item.variantId.productId?._id || item.variantId.productId))
            );
        } else if (validatedCoupon.applyTo.includes("category")) {
            eligibleItems = orderItems.filter(item =>
                validatedCoupon.targetId && validatedCoupon.targetId.includes(String(item.variantId.productId?.categoryId))
            );
        } else if (validatedCoupon.applyTo.includes("brand")) {
            eligibleItems = orderItems.filter(item =>
                validatedCoupon.targetId && validatedCoupon.targetId.includes(String(item.variantId.productId?.brandId))
            );
        }

        if (!eligibleItems.length) {
            throw new Error("Coupon không áp dụng cho sản phẩm nào trong giỏ hàng.");
        }

        // Tính tổng tiền các sản phẩm được giảm giá
        const eligibleAmount = eligibleItems.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);

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

    // deduct stock
    for (const item of cart.items) {

        await ProductVariant.findByIdAndUpdate(
            item.variantId._id,
            {
                $inc: {
                    stock: -item.quantity
                }
            }
        );

    }

    // clear cart
    cart.items = [];

    await cart.save();

    return order;

};


// =========================
// GET MY ORDERS
// =========================
const getMyOrders = async (userId) => {

    return await Order.find({ userId })
        .sort({ createdAt: -1 });

};


// =========================
// GET ALL ORDERS
// =========================
const getAllOrders = async () => {

    return await Order.find()
        .sort({ createdAt: -1 });

};


// =========================
// GET ORDER BY ID
// =========================
const getOrderById = async (orderId) => {

    const order = await Order.findById(orderId);

    if (!order) {
        throw new Error("Order not found");
    }

    return order;

};


// =========================
// GET ORDER DETAIL
// =========================
const getOrderDetail = async (
    userId,
    orderId
) => {

    const order = await Order.findOne({
        _id: orderId,
        userId
    });

    if (!order) {
        throw new Error("Order not found");
    }

    return order;

};


// =========================
// CANCEL ORDER
// =========================
const cancelOrder = async (
    userId,
    orderId
) => {

    const order = await Order.findOne({
        _id: orderId,
        userId
    });

    if (!order) {
        throw new Error("Order not found");
    }

    if (order.orderStatus !== "pending") {
        throw new Error(
            "Cannot cancel this order"
        );
    }

    order.orderStatus = "cancelled";

    // restore stock
    for (const item of order.items) {

        await ProductVariant.findByIdAndUpdate(
            item.variantId,
            {
                $inc: {
                    stock: item.quantity
                }
            }
        );

    }

    await order.save();

    return order;

};


// =========================
// UPDATE ORDER STATUS
// =========================
const updateOrderStatus = async (
    orderId,
    status
) => {

    const validStatuses = [
        "pending",
        "processing",
        "shipping",
        "completed",
        "cancelled"
    ];

    if (!validStatuses.includes(status)) {
        throw new Error("Invalid status");
    }

    const order = await Order.findById(orderId);

    if (!order) {
        throw new Error("Order not found");
    }

    order.orderStatus = status;

    // If staff marks an order completed and it was paid via QR, mark payment as paid
    if (status === "completed" && order.paymentMethod === "VNPAY") {
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