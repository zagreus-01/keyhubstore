// controllers/cart.controller.js

const cartService = require("../../services/payment/cart.service");


// =========================
// ADD TO CART
// =========================
const addToCart = async (req, res) => {

    try {

        const userId = req.user.id;

        const {
            variantId,
            quantity
        } = req.body;

        const cart = await cartService.addToCart(
            userId,
            variantId,
            quantity
        );

        return res.status(200).json({
            success: true,
            message: "Added to cart successfully",
            data: cart
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// =========================
// GET CART
// =========================
const getCart = async (req, res) => {

    try {

        const userId = req.user.id;

        const cart = await cartService.getCart(userId);

        return res.status(200).json({
            success: true,
            data: cart
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


// =========================
// UPDATE CART ITEM
// =========================
const updateCartItem = async (req, res) => {

    try {

        const userId = req.user.id;

        const {
            variantId,
            quantity
        } = req.body;

        const cart =
            await cartService.updateCartItem(
                userId,
                variantId,
                quantity
            );

        return res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            data: cart
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// =========================
// REMOVE CART ITEM
// =========================
const removeCartItem = async (req, res) => {

    try {

        const userId = req.user.id;

        const { variantId } = req.params;

        const cart =
            await cartService.removeCartItem(
                userId,
                variantId
            );

        return res.status(200).json({
            success: true,
            message: "Item removed successfully",
            data: cart
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


module.exports = {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem
};