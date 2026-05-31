const crypto = require("crypto");
const qs = require("qs");
const moment = require("moment");
const mongoose = require("mongoose");

const Order = require("../../models/order.model");
const Payment = require("../../models/payment.model");
const orderService = require("./order.service");

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


// =========================
// SORT OBJECT
// =========================
const sortObject = (obj) => {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
};


// =========================
// CREATE VNPAY URL
// =========================
const createVNPayPayment = async (
    orderId,
    ipAddr,
    userId
) => {

    if (!isValidObjectId(orderId)) {
        throw new Error("Invalid order ID format");
    }

    const order = await Order.findOne({
        _id: orderId,
        userId
    });

    if (!order) {
        throw new Error("Order not found");
    }

    if (order.paymentMethod !== "VNPAY") {
        throw new Error("Order is not a VNPAY order");
    }

    if (order.orderStatus === "cancelled") {
        throw new Error("Cannot pay a cancelled order");
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

    if (!paymentAmount || paymentAmount <= 0) {
        throw new Error("Invalid payment amount");
    }

    let vnp_Params = {

        vnp_Version: "2.1.0",

        vnp_Command: "pay",

        vnp_TmnCode: tmnCode,

        vnp_Locale: "vn",

        vnp_CurrCode: "VND",

        vnp_TxnRef: txnRef,

        vnp_OrderInfo:
            order._id.toString(),

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
            { encode: false }
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

    // Decode orderInfo to handle URL encoding (+ for spaces)
    const orderId =
        decodeURIComponent(orderInfo);

    // Validate ObjectId
    if (!isValidObjectId(orderId)) {
        throw new Error("Invalid order ID format");
    }

    const order =
        await Order.findById(orderId);

    if (!order) {
        throw new Error("Order not found");
    }

    const expectedAmount =
        order.finalAmount != null
            ? order.finalAmount
            : order.totalAmount;

    if (amount !== expectedAmount) {
        await orderService.failOnlinePayment(order._id);
        await Payment.create({
            orderId: order._id,
            transactionCode,
            paymentMethod: "VNPAY",
            paymentStatus: "failed",
            amount
        });

        throw new Error("Invalid payment amount");
    }

    let paymentStatus = "failed";

    if (responseCode === "00") {
        try {
            await orderService.completeOnlinePayment(order._id);
            paymentStatus = "paid";
        } catch (error) {
            await orderService.failOnlinePayment(order._id);
            await Payment.create({
                orderId: order._id,
                transactionCode,
                paymentMethod: "VNPAY",
                paymentStatus: "failed",
                amount
            });

            throw error;
        }
    } else {
        await orderService.failOnlinePayment(order._id);
    }

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

    return Order.findById(order._id);

};


// =========================
// CASH ON DELIVERY
// =========================
const createCODPayment = async (
    orderId,
    userId
) => {

    if (!isValidObjectId(orderId)) {
        throw new Error("Invalid order ID format");
    }

    const order = await Order.findOne({
        _id: orderId,
        userId
    });

    if (!order) {
        throw new Error("Order not found");
    }

    if (order.paymentMethod !== "COD") {
        throw new Error("Order is not a COD order");
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
    orderId,
    userId,
    role
) => {
    const orderFilter = {
        _id: orderId
    };

    if (!["staff", "admin"].includes(String(role || "").toLowerCase())) {
        orderFilter.userId = userId;
    }

    const order = await Order.findOne(orderFilter);

    if (!order) {
        throw new Error("Order not found");
    }

    return await Payment.findOne({
        orderId: order._id
    });

};


module.exports = {
    createVNPayPayment,
    vnpayReturn,
    createCODPayment,
    getPaymentByOrder
};
