// controllers/auth/resetPassword.controller.js

const resetPasswordService = require("../../services/auth/resetPassword.service");

const resetPasswordController = async (
    req,
    res
) => {
    try {
        await resetPasswordService(
            req.body.email,
            req.body.otp,
            req.body.newPassword
        );

        return res.json({
            success: true,
            message:
                "Password reset successfully"
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports =
    resetPasswordController;