const registerService = require("../../services/auth/register.service");

const registerController = async (
    req,
    res
) => {
    try {
        const user = await registerService(
            req.body
        );

        return res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = registerController;