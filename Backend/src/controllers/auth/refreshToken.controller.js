const refreshTokenService = require("../../services/auth/refreshToken.service");

const refreshTokenController = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        // 1. Validate input
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        // 2. Call service
        const accessToken = await refreshTokenService(refreshToken);

        // 3. Return result
        return res.json({
            success: true,
            data: {
                accessToken
            }
        });

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = refreshTokenController;