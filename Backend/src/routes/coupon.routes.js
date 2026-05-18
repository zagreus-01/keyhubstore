const router = require("express").Router();

const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/checkRole.middleware");

const {
    getAllCoupons,
    getCouponById,
    validateCoupon,
    createCoupon,
    updateCoupon,
    removeCoupon
} = require("../controllers/payment/coupon.controller");

router.get(
    "/",
    verifyToken,
    checkRole("admin"),
    getAllCoupons
);

router.get(
    "/validate/:code",
    verifyToken,
    validateCoupon
);

router.get(
    "/:id",
    verifyToken,
    checkRole("admin"),
    getCouponById
);

router.post(
    "/",
    verifyToken,
    checkRole("admin"),
    createCoupon
);

router.put(
    "/:id",
    verifyToken,
    checkRole("admin"),
    updateCoupon
);

router.delete(
    "/:id",
    verifyToken,
    checkRole("admin"),
    removeCoupon
);

module.exports = router;
