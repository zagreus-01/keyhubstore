const router = require("express").Router();

const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/checkRole.middleware");

const {
    getWishlist,
    addToWishlist,
    removeFromWishlist
} = require("../controllers/payment/wishlist.controller");

router.get(
    "/",
    verifyToken,
    checkRole("customer"),
    getWishlist
);

router.post(
    "/add",
    verifyToken,
    checkRole("customer"),
    addToWishlist
);

router.delete(
    "/remove/:variantId",
    verifyToken,
    checkRole("customer"),
    removeFromWishlist
);

module.exports = router;
