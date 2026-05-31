const jwt = require("jsonwebtoken");

const RefreshToken = require("../../models/refreshToken.model");

const User = require("../../models/user.model");

const {
    generateAccessToken
} = require("../../utils/jwt");

const refreshTokenService = async (
    refreshToken
) => {
    const existingToken =
        await RefreshToken.findOne({
            token: refreshToken
        });

    if (!existingToken) {
        throw new Error(
            "Invalid refresh token"
        );
    }

    if (existingToken.expiredAt <= new Date()) {
        await RefreshToken.deleteOne({
            token: refreshToken
        });

        throw new Error(
            "Refresh token expired"
        );
    }

    const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(
        decoded.id
    );

    if (!user || user.isDeleted || user.status === "blocked") {
        await RefreshToken.deleteOne({
            token: refreshToken
        });

        throw new Error(
            "Invalid refresh token"
        );
    }

    const accessToken =
        generateAccessToken(user);

    return accessToken;
};

module.exports = refreshTokenService;
