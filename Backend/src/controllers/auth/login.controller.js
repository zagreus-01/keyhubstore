const loginService = require("../../services/auth/login.service");

const loginController = async (
    req,
    res
) => {
    try {
        const result = await loginService(
            req.body.email,
            req.body.password
        );

        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = loginController;