const User = require("../../models/user.model");

const RefreshToken = require("../../models/refreshToken.model");

const {
    comparePassword
} = require("../../utils/hash");

const {
    generateAccessToken,
    generateRefreshToken
} = require("../../utils/jwt");

const loginService = async (
    email,
    password
) => {
    const user = await User.findOne({
        email
    });

    if (!user) {
        throw new Error(
            "Invalid email or password"
        );
    }

    if (user.status === "blocked") {
        throw new Error(
            "Account has been blocked"
        );
    }

    if (!user.isVerified) {
        throw new Error(
            "Email not verified. Please verify your email before logging in."
        );
    }
    if(user.isDeleted){
        throw new Error(
            "Account has been deleted"
        );
    }
    const isMatch =
        await comparePassword(
            password,
            user.passwordHash
        );

    if (!isMatch) {
        throw new Error(
            "Invalid email or password"
        );
    }

    const accessToken =
        generateAccessToken(user);

    const refreshToken =
        generateRefreshToken(user);

    await RefreshToken.create({
        userId: user._id,
        token: refreshToken,
        expiredAt: new Date(
            Date.now() +
                7 *
                    24 *
                    60 *
                    60 *
                    1000
        )
    });

    return {
        accessToken,
        refreshToken,
        user
    };
};

module.exports = loginService;