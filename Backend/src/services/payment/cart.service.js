const Cart = require("../../models/cart.model");
const ProductVariant = require("../../models/productVariant.model");


// =========================
// ADD TO CART
// =========================
const addToCart = async (
    userId,
    variantId,
    quantity
) => {
    const requestedQuantity = Number(quantity || 1);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
        throw new Error("Invalid quantity");
    }

    const variant = await ProductVariant.findOne({
        _id: variantId,
        status: "active"
    });

    if (!variant) {
        throw new Error("Variant not found");
    }

    if (variant.stock < requestedQuantity) {
        throw new Error("Not enough stock");
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {

        cart = await Cart.create({
            userId,
            items: []
        });

    }

    const existingItem = cart.items.find(
        item => item.variantId.toString() === variantId
    );

    if (existingItem) {

        const newQuantity =
            existingItem.quantity + requestedQuantity;

        if (newQuantity > variant.stock) {
            throw new Error("Quantity exceeds stock");
        }

        existingItem.quantity = newQuantity;

    } else {

        cart.items.push({
            variantId,
            quantity: requestedQuantity
        });

    }

    await cart.save();

    return cart;

};


// =========================
// GET CART
// =========================
const getCart = async (userId) => {

    const cart = await Cart.findOne({ userId })
        .populate({
            path: "items.variantId",
            populate: {
                path: "productId",
                populate: [
                    {
                        path: "brandId"
                    },
                    {
                        path: "categoryId"
                    }
                ]
            }
        });

    if (!cart) {
        return {
            items: [],
            totalPrice: 0
        };
    }

    let totalPrice = 0;

    cart.items.forEach(item => {

        totalPrice +=
            item.variantId.price * item.quantity;

    });

    return {
        items: cart.items,
        totalPrice
    };

};


// =========================
// UPDATE CART ITEM
// =========================
const updateCartItem = async (
    userId,
    variantId,
    quantity
) => {
    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
        throw new Error("Invalid quantity");
    }

    const variant =
        await ProductVariant.findOne({
            _id: variantId,
            status: "active"
        });

    if (!variant) {
        throw new Error("Variant not found");
    }

    if (requestedQuantity > variant.stock) {
        throw new Error("Quantity exceeds stock");
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        throw new Error("Cart not found");
    }

    const item = cart.items.find(
        item => item.variantId.toString() === variantId
    );

    if (!item) {
        throw new Error("Item not found");
    }

    item.quantity = requestedQuantity;

    await cart.save();

    return cart;

};


// =========================
// REMOVE CART ITEM
// =========================
const removeCartItem = async (
    userId,
    variantId
) => {

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        throw new Error("Cart not found");
    }

    cart.items = cart.items.filter(
        item =>
            item.variantId.toString() !== variantId
    );

    await cart.save();

    return cart;

};


module.exports = {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem
};
