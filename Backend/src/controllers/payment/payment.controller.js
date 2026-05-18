const paymentService =
require("../../services/payment/payment.service");


// =========================
// CREATE VNPAY PAYMENT
// =========================
const createVNPayPayment = async (
    req,
    res
) => {

    try {

        const paymentUrl =
            await paymentService
            .createVNPayPayment(
                req.body.orderId,
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

        await paymentService
            .vnpayReturn(req.query);

        return res.redirect(
            "http://localhost:5173/payment-success"
        );

    } catch (error) {

        return res.redirect(
            "http://localhost:5173/payment-failed"
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

        const result =
            await paymentService
            .createCODPayment(
                req.body.orderId
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


module.exports = {
    createVNPayPayment,
    vnpayReturn,
    createCODPayment,
    getPaymentByOrder
};