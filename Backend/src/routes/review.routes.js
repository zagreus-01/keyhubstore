// routes/review.routes.js

const router = require("express").Router();

const verifyToken =
require("../middleware/auth.middleware");

const checkRole =
require("../middleware/checkRole.middleware");

const {
    createReview,
    getProductReviews,
    deleteReview
} = require(
    "../controllers/payment/review.controller"
);


// =========================
// USER
// =========================
router.post(
    "/",
    verifyToken,
    checkRole("customer"),
    createReview
);

router.delete(
    "/:id",
    verifyToken,
    checkRole("customer"),
    deleteReview
);


// =========================
// PUBLIC
// =========================
router.get(
    "/product/:productId",
    getProductReviews
);


module.exports = router;