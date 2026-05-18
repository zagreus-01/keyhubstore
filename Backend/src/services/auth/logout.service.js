const RefreshToken = require("../../models/refreshToken.model");

const logoutService = async (refreshToken) => {
    if (!refreshToken) {
        throw new Error("Refresh token is required");
    }

    const deletedToken = await RefreshToken.findOneAndDelete({
        token: refreshToken
    });

    if (!deletedToken) {
        throw new Error("Invalid refresh token");
    }

    return true;
};

module.exports = logoutService;
