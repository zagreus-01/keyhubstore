// controllers/auth/verifyOtp.controller.js

const verifyOtpService = require("../../services/auth/verifyOtp.service");

const verifyOtpController = async (
    req,
    res
) => {
    try {
        await verifyOtpService(
            req.body.email,
            req.body.otp,
            req.body.type
        );

        return res.json({
            success: true,
            message: "OTP verified"
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = verifyOtpController;