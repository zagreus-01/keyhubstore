// controllers/order.controller.js

const mongoose = require("mongoose");
const orderService = require("../../services/payment/order.service");
const paymentService = require("../../services/payment/payment.service");

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


// =========================
// CHECKOUT
// =========================
const checkout = async (req, res) => {

    try {

        const order =
            await orderService.checkout(
                req.user.id,
                req.body.shippingAddress,
                req.body.paymentMethod,
                req.body.couponCode,
                req.body.pointsToUse
            );

        return res.status(201).json({
            success: true,
            message: "Checkout successfully",
            data: order
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// =========================
// GET MY ORDERS
// =========================
const getMyOrders = async (
    req,
    res
) => {

    try {

        const result =
            await orderService.getMyOrders(
                req.user.id,
                {
                    page: req.query.page,
                    limit: req.query.limit
                }
            );

        return res.status(200).json({
            success: true,
            data: result.orders,
            pagination: result.pagination
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


// =========================
// GET ORDER DETAIL
// =========================
const getOrderDetail = async (
    req,
    res
) => {

    try {
        const orderId = req.params.id;

        // Validate ObjectId
        if (!isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID format"
            });
        }

        const role = (req.user.role || "").toLowerCase();
        let order;

        if (role === "staff" || role === "admin") {
            order = await orderService.getOrderById(
                orderId
            );
        } else {
            order = await orderService.getOrderDetail(
                req.user.id,
                orderId
            );
        }

        return res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });

    }

};


// =========================
// GET ALL ORDERS
// =========================
const getAllOrders = async (
    req,
    res
) => {

    try {

        const orders =
            await orderService.getAllOrders();

        return res.status(200).json({
            success: true,
            data: orders
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


// =========================
// CANCEL ORDER
// =========================
const cancelOrder = async (
    req,
    res
) => {

    try {
        const orderId = req.params.id;

        // Validate ObjectId
        if (!isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID format"
            });
        }

        const order =
            await orderService.cancelOrder(
                req.user.id,
                orderId
            );

        return res.status(200).json({
            success: true,
            message: "Order cancelled",
            data: order
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// =========================
// UPDATE ORDER STATUS
// =========================
const updateOrderStatus = async (
    req,
    res
) => {

    try {
        const orderId = req.params.id;

        // Validate ObjectId
        if (!isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID format"
            });
        }

        const order =
            await orderService.updateOrderStatus(
                orderId,
                req.body.status
            );

        return res.status(200).json({
            success: true,
            message: "Order updated",
            data: order
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// =========================
// UPDATE PAYMENT STATUS COD
// =========================
const updatePaymentStatusCOD = async (
    req,
    res
) => {

    try {
        const orderId = req.params.id;

        // Validate ObjectId
        if (!isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID format"
            });
        }

        const order =
            await orderService.updatePaymentStatusCOD(
                orderId
            );

        return res.status(200).json({
            success: true,
            message: "Order payment status updated",
            data: order
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {
    checkout,
    getMyOrders,
    getOrderDetail,
    getAllOrders,
    cancelOrder,
    updateOrderStatus,
    updatePaymentStatusCOD
};

// =========================
// CONFIRM DELIVERY
// =========================
const confirmDelivery = async (req, res) => {
    try {
        const orderId = req.params.id;

        if (!isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID format"
            });
        }

        const order = await orderService.getOrderDetail(req.user.id, orderId);
        if (order.orderStatus !== "shipping") {
            throw new Error("Only orders that are currently shipping can be confirmed delivered.");
        }

        const updatedOrder = await orderService.updateOrderStatus(orderId, "delivered");
        return res.status(200).json({
            success: true,
            message: "Order delivery confirmed.",
            data: updatedOrder
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports.confirmDelivery = confirmDelivery;


// =========================
// GET QR PAYLOAD
// =========================
const getOrderQr = async (req, res) => {
    try {
        const role = (req.user.role || "").toLowerCase();
        const orderId = req.params.id;

        // Validate ObjectId
        if (!isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID format"
            });
        }

        let order;
        if (role === "staff" || role === "admin") {
            order = await orderService.getOrderById(orderId);
        } else {
            order = await orderService.getOrderDetail(req.user.id, orderId);
        }

        if (!order) throw new Error("Order not found");

        if (order.paymentMethod !== "VNPAY") {
            return res.status(400).json({ success: false, message: "Order is not a VNPAY/QR payment" });
        }

        // generate VNPAY payment URL to be rendered as QR code
        try {
            const paymentUrl = await paymentService.createVNPayPayment(order._id, req.ip, order.userId);
            return res.status(200).json({ success: true, data: { qrPayload: paymentUrl } });
        } catch (err) {
            // fallback to simple payload if VNPAY creation fails
            const payload = `QR_PAY|order:${order._id}|amount:${order.finalAmount}`;
            return res.status(200).json({ success: true, data: { qrPayload: payload, warning: err.message } });
        }

    } catch (error) {
        return res.status(404).json({ success: false, message: error.message });
    }

};

// export qr endpoint
module.exports.getOrderQr = getOrderQr;
