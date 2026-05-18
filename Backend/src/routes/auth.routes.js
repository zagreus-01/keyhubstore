const express = require("express");

const router = express.Router();

const registerController = require("../controllers/auth/register.controller");

const loginController = require("../controllers/auth/login.controller");

const refreshTokenController = require("../controllers/auth/refreshToken.controller");

const logoutController = require("../controllers/auth/logout.controller");

const forgotPasswordController = require("../controllers/auth/forgotPassword.controller");

const verifyOtpController = require("../controllers/auth/verifyOtp.controller");

const resetPasswordController = require("../controllers/auth/resetPassword.controller");

router.post(
    "/register",
    registerController
);

router.post(
    "/login",
    loginController
);

router.post(
    "/refresh-token",
    refreshTokenController
);

router.post(
    "/logout",
    logoutController
);

router.post(
    "/forgot-password",
    forgotPasswordController
);

router.post(
    "/verify-otp",
    verifyOtpController
);

router.post(
    "/reset-password",
    resetPasswordController
);

module.exports = router;