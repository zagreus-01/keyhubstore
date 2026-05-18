const logoutService = require("../../services/auth/logout.service");

const logoutController = async (
    req,
    res
) => {
    try {
        await logoutService(
            req.body.refreshToken
        );

        return res.json({
            success: true,
            message: "Logout success"
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = logoutController;