const rateLimit = require("express-rate-limit");

const createLimiter = ({ windowMs, limit, message }) => rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message
    }
});

const apiLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    message: "Too many requests. Please try again later."
});

const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: "Too many authentication attempts. Please try again later."
});

const tokenRefreshLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    message: "Too many token refresh requests. Please sign in again later."
});

module.exports = {
    apiLimiter,
    authLimiter,
    tokenRefreshLimiter
};
