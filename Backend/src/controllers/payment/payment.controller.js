const mongoose = require("mongoose");
const paymentService =
require("../../services/payment/payment.service");

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


// =========================
// CREATE VNPAY PAYMENT
// =========================
const createVNPayPayment = async (
    req,
    res
) => {

    try {
        const orderId = req.body.orderId;

        // Validate ObjectId
        if (!isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID format"
            });
        }

        const paymentUrl =
            await paymentService
            .createVNPayPayment(
                orderId,
                req.ip
            );

        return res.status(200).json({
            success: true,
            paymentUrl
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// =========================
// VNPAY RETURN
// =========================
const vnpayReturn = async (
    req,
    res
) => {

    try {

        const order = await paymentService
            .vnpayReturn(req.query);

        return res.redirect(
            `http://localhost:5173/payment-success?orderId=${order._id}`
        );

    } catch (error) {

        return res.redirect(
            `http://localhost:5173/payment-failed?message=${encodeURIComponent(error.message)}`
        );

    }

};


// =========================
// CREATE COD PAYMENT
// =========================
const createCODPayment = async (
    req,
    res
) => {

    try {
        const orderId = req.body.orderId;

        // Validate ObjectId
        if (!isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID format"
            });
        }

        const result =
            await paymentService
            .createCODPayment(
                orderId
            );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// =========================
// GET PAYMENT DETAIL
// =========================
const getPaymentByOrder = async (
    req,
    res
) => {

    try {

        const payment =
            await paymentService
            .getPaymentByOrder(
                req.params.orderId
            );

        return res.status(200).json({
            success: true,
            data: payment
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


// =========================
// GET PAYMENT DETAIL
// =========================
const getOrderQR = async (req, res) => {
  try {
    const qrUrl = await paymentService.createVNPayPayment(req.params.orderId, req.ip);
    return res.json({ qrPayload: qrUrl });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


module.exports = {
    createVNPayPayment,
    vnpayReturn,
    createCODPayment,
    getPaymentByOrder,
    getOrderQR
};