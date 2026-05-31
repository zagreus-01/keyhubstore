// routes/payment.routes.js

const router = require("express").Router();

const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/checkRole.middleware");

const {
    createVNPayPayment,
    vnpayReturn,
    createCODPayment,
    getPaymentByOrder,
    getOrderQR
} = require("../controllers/payment/payment.controller");


// =========================
// USER
// =========================
router.post(
    "/vnpay",
    verifyToken,
    checkRole("customer"),
    createVNPayPayment
);

router.post(
    "/cod",
    verifyToken,
    checkRole("customer"),
    createCODPayment
);

router.get(
    "/order/:orderId",
    verifyToken,
    getPaymentByOrder
);


// =========================
// VNPAY RETURN
// =========================
router.get(
    "/vnpay-return",
    vnpayReturn
);

router.get(
    "/order/:orderId/qr",
    verifyToken,
    checkRole("customer"),
    getOrderQR
);


module.exports = router;
