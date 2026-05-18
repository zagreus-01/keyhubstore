const couponService = require("../../services/payment/coupon.service");

const getAllCoupons = async (req, res) => {
    try {
        const data = await couponService.getAllCoupons();

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getCouponById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await couponService.getCouponById(id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found"
            });
        }

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const validateCoupon = async (req, res) => {
    try {
        const { code } = req.params;
        const data = await couponService.validateCoupon(code);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const createCoupon = async (req, res) => {
    try {
        const data = await couponService.createCoupon(req.body);

        return res.status(201).json({
            success: true,
            message: "Coupon created successfully",
            data
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await couponService.updateCoupon(id, req.body);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Coupon updated successfully",
            data
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const removeCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await couponService.removeCoupon(id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Coupon removed successfully",
            data
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAllCoupons,
    getCouponById,
    validateCoupon,
    createCoupon,
    updateCoupon,
    removeCoupon
};
