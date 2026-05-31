// routes/order.routes.js

const router = require("express").Router();

const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/checkRole.middleware");

const {
    checkout,
    getMyOrders,
    getOrderDetail,
    cancelOrder,
    updateOrderStatus,
    confirmDelivery,
    getAllOrders,
    getOrderQr,
    updatePaymentStatusCOD
} = require("../controllers/payment/order.controller");


// =========================
// STAFF / ADMIN
// =========================
router.get(
    "/",
    verifyToken,
    checkRole("staff", "admin"),
    getAllOrders
);


// =========================
// USER
// =========================
router.post(
    "/checkout",
    verifyToken,
    checkRole("customer"),
    checkout
);

router.get(
    "/my-orders",
    verifyToken,
    checkRole("customer"),
    getMyOrders
);

router.get(
    "/:id",
    verifyToken,
    checkRole("customer", "staff", "admin"),
    getOrderDetail
);

// GET QR payload for order (owner or staff/admin)
router.get(
    "/:id/qr",
    verifyToken,
    checkRole("customer", "staff", "admin"),
    getOrderQr
);

router.put(
    "/:id/cancel",
    verifyToken,
    checkRole("customer"),
    cancelOrder
);


// =========================
// STAFF / ADMIN
// =========================
router.put(
    "/:id/status",
    verifyToken,
    checkRole("staff", "admin"),
    updateOrderStatus
);

router.put(
    "/:id/payment-status-cod",
    verifyToken,
    checkRole("staff", "admin"),
    updatePaymentStatusCOD
);

router.put(
    "/:id/confirm-delivered",
    verifyToken,
    checkRole("customer"),
    confirmDelivery
);
module.exports = router;