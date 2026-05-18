// controllers/auth/forgotPassword.controller.js

const forgotPasswordService = require("../../services/auth/forgotPassword.service");

const forgotPasswordController = async (
    req,
    res
) => {
    try {
        await forgotPasswordService(
            req.body.email
        );

        return res.json({
            success: true,
            message: "OTP sent successfully"
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports =
    forgotPasswordController;