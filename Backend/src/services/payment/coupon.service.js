const Coupon = require("../../models/coupon.model");

const getAllCoupons = async () => {
    return Coupon.find().sort({ createdAt: -1 });
};

const getCouponById = async (id) => {
    return Coupon.findById(id);
};

const validateCoupon = async (code) => {
    if (!code) {
        throw new Error("Coupon code is required");
    }

    const normalizedCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: normalizedCode });

    if (!coupon) {
        throw new Error("Coupon not found");
    }

    const now = new Date();

    if (coupon.expiredAt && coupon.expiredAt < now) {
        throw new Error("Coupon has expired");
    }

    return coupon;
};

const createCoupon = async (payload) => {
    if (!payload.code) {
        throw new Error("Coupon code is required");
    }

    payload.code = payload.code.trim().toUpperCase();

    return Coupon.create(payload);
};

const updateCoupon = async (id, payload) => {
    if (payload.code) {
        payload.code = payload.code.trim().toUpperCase();
    }

    return Coupon.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true
    });
};

const removeCoupon = async (id) => {
    return Coupon.findByIdAndDelete(id);
};

module.exports = {
    getAllCoupons,
    getCouponById,
    validateCoupon,
    createCoupon,
    updateCoupon,
    removeCoupon
};
