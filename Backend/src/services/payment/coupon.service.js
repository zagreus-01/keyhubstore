const Coupon = require("../../models/coupon.model");

const getAllCoupons = async () => {
    return Coupon.find().sort({ createdAt: -1 });
};

const getCouponById = async (id) => {
    return Coupon.findById(id);
};

const normalizeCouponPayload = (payload) => {
    const normalized = {
        ...payload,
        discountType: payload.discountType || "percent",
        discountValue: payload.discountValue != null ? Number(payload.discountValue) : 0,
        applyTo: payload.applyTo || "all",
    };

    if (normalized.discountType === "percent" && normalized.discountValue > 100) {
        throw new Error("Percent discount cannot exceed 100%");
    }

    if (normalized.applyTo !== "all") {
        if (!payload.targetId) {
            throw new Error("Target item is required for this coupon scope");
        }
        normalized.targetId = payload.targetId;
        normalized.targetName = payload.targetName || "";
    } else {
        normalized.targetId = undefined;
        normalized.targetName = undefined;
    }

    if (payload.startAt) {
        normalized.startAt = new Date(payload.startAt);
    }

    if (payload.expiredAt) {
        normalized.expiredAt = new Date(payload.expiredAt);
    }

    if (payload.code) {
        normalized.code = payload.code.trim().toUpperCase();
    }

    return normalized;
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

    if (coupon.startAt && coupon.startAt > now) {
        throw new Error("Coupon is not active yet");
    }

    if (coupon.expiredAt && coupon.expiredAt < now) {
        throw new Error("Coupon has expired");
    }

    return coupon;
};

const createCoupon = async (payload) => {
    if (!payload.code) {
        throw new Error("Coupon code is required");
    }

    const normalizedPayload = normalizeCouponPayload(payload);
    return Coupon.create(normalizedPayload);
};

const updateCoupon = async (id, payload) => {
    const normalizedPayload = normalizeCouponPayload(payload);
    return Coupon.findByIdAndUpdate(id, normalizedPayload, {
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
