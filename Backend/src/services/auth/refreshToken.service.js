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

    jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET
    );

    const decoded = jwt.decode(
        refreshToken
    );

    const user = await User.findById(
        decoded.id
    );

    const accessToken =
        generateAccessToken(user);

    return accessToken;
};

module.exports = refreshTokenService;