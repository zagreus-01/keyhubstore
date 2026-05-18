// routes/cart.routes.js

const router = require("express").Router();

const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/checkRole.middleware");

const {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem
} = require("../controllers/payment/cart.controller");

// =========================
// ADD TO CART
// =========================
router.post(
    "/add",
    verifyToken,
    checkRole("customer"),
    addToCart
);


// =========================
// GET CART
// =========================
router.get(
    "/",
    verifyToken,
    getCart
);


// =========================
// UPDATE CART ITEM
// =========================
router.put(
    "/update",
    verifyToken,
    checkRole("customer"),
    updateCartItem
);


// =========================
// REMOVE CART ITEM
// =========================
router.delete(
    "/remove/:variantId",
    verifyToken,
    checkRole("customer"),
    removeCartItem
);


module.exports = router;