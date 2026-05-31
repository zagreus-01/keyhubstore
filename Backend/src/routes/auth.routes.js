const express = require("express");

const router = express.Router();
const {
    authLimiter,
    tokenRefreshLimiter
} = require("../middleware/rateLimit.middleware");

const registerController = require("../controllers/auth/register.controller");

const loginController = require("../controllers/auth/login.controller");

const refreshTokenController = require("../controllers/auth/refreshToken.controller");

const logoutController = require("../controllers/auth/logout.controller");

const forgotPasswordController = require("../controllers/auth/forgotPassword.controller");

const verifyOtpController = require("../controllers/auth/verifyOtp.controller");

const resetPasswordController = require("../controllers/auth/resetPassword.controller");

router.post(
    "/register",
    authLimiter,
    registerController
);

router.post(
    "/login",
    authLimiter,
    loginController
);

router.post(
    "/refresh-token",
    tokenRefreshLimiter,
    refreshTokenController
);

router.post(
    "/logout",
    logoutController
);

router.post(
    "/forgot-password",
    authLimiter,
    forgotPasswordController
);

router.post(
    "/verify-otp",
    authLimiter,
    verifyOtpController
);

router.post(
    "/reset-password",
    authLimiter,
    resetPasswordController
);

module.exports = router;
