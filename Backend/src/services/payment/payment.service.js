const crypto = require("crypto");
const qs = require("qs");
const moment = require("moment");

const Order = require("../../models/order.model");
const Payment = require("../../models/payment.model");


// =========================
// SORT OBJECT
// =========================
const sortObject = (obj) => {

    const sorted = {};

    const keys = Object.keys(obj).sort();

    for (const key of keys) {
        sorted[key] = obj[key];
    }

    return sorted;

};


// =========================
// CREATE VNPAY URL
// =========================
const createVNPayPayment = async (
    orderId,
    ipAddr
) => {

    const order = await Order.findById(orderId);

    if (!order) {
        throw new Error("Order not found");
    }

    if (order.paymentStatus === "paid") {
        throw new Error("Order already paid");
    }

    const tmnCode =
        process.env.VNP_TMNCODE;

    const secretKey =
        process.env.VNP_HASHSECRET;

    const vnpUrl =
        process.env.VNP_URL;

    const returnUrl =
        process.env.VNP_RETURN_URL;

    const date = new Date();

    const createDate =
        moment(date).format(
            "YYYYMMDDHHmmss"
        );

    const txnRef =
        moment(date).format("DDHHmmss");

    const paymentAmount =
        order.finalAmount != null
            ? order.finalAmount
            : order.totalAmount;

    let vnp_Params = {

        vnp_Version: "2.1.0",

        vnp_Command: "pay",

        vnp_TmnCode: tmnCode,

        vnp_Locale: "vn",

        vnp_CurrCode: "VND",

        vnp_TxnRef: txnRef,

        vnp_OrderInfo:
            `Thanh toan don hang ${order._id}`,

        vnp_OrderType: "other",

        vnp_Amount:
            paymentAmount * 100,

        vnp_ReturnUrl: returnUrl,

        vnp_IpAddr: ipAddr,

        vnp_CreateDate: createDate

    };

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(
        vnp_Params,
        { encode: false }
    );

    const signed = crypto
        .createHmac(
            "sha512",
            secretKey
        )
        .update(
            Buffer.from(
                signData,
                "utf-8"
            )
        )
        .digest("hex");

    vnp_Params.vnp_SecureHash = signed;
    vnp_Params.vnp_SecureHashType = "SHA512";

    const paymentUrl =
        vnpUrl +
        "?" +
        qs.stringify(
            vnp_Params,
            { encode: true }
        );

    return paymentUrl;

};


// =========================
// VNPAY RETURN
// =========================
const vnpayReturn = async (query) => {

    const secureHash =
        query.vnp_SecureHash;

    delete query.vnp_SecureHash;
    delete query.vnp_SecureHashType;

    query = sortObject(query);

    const secretKey =
        process.env.VNP_HASHSECRET;

    const signData = qs.stringify(
        query,
        { encode: false }
    );

    const signed = crypto
        .createHmac(
            "sha512",
            secretKey
        )
        .update(
            Buffer.from(
                signData,
                "utf-8"
            )
        )
        .digest("hex");

    if (secureHash !== signed) {
        throw new Error("Invalid checksum");
    }

    const responseCode =
        query.vnp_ResponseCode;

    const orderInfo =
        query.vnp_OrderInfo;

    const transactionCode =
        query.vnp_TransactionNo;

    const amount =
        query.vnp_Amount / 100;

    const orderId =
        orderInfo.split(" ").pop();

    const order =
        await Order.findById(orderId);

    if (!order) {
        throw new Error("Order not found");
    }

    let paymentStatus = "failed";

    if (responseCode === "00") {

        paymentStatus = "paid";

        order.paymentStatus = "paid";

    } else {

        order.paymentStatus = "failed";

    }

    await order.save();

    // create payment history
    await Payment.create({

        orderId: order._id,

        transactionCode,

        paymentMethod: "VNPAY",

        paymentStatus,

        amount,

        paidAt:
            paymentStatus === "paid"
                ? new Date()
                : null

    });

    return order;

};


// =========================
// CASH ON DELIVERY
// =========================
const createCODPayment = async (
    orderId
) => {

    const order = await Order.findById(orderId);

    if (!order) {
        throw new Error("Order not found");
    }

    const paymentAmount =
        order.finalAmount != null
            ? order.finalAmount
            : order.totalAmount;

    await Payment.create({

        orderId: order._id,

        paymentMethod: "COD",

        paymentStatus: "pending",

        amount: paymentAmount

    });

    return {
        message: "COD payment created"
    };

};


// =========================
// GET PAYMENT BY ORDER
// =========================
const getPaymentByOrder = async (
    orderId
) => {

    return await Payment.findOne({
        orderId
    });

};


module.exports = {
    createVNPayPayment,
    vnpayReturn,
    createCODPayment,
    getPaymentByOrder
};