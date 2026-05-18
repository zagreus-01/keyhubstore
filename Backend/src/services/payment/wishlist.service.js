const Wishlist = require("../../models/wishlist.model");

const getWishlist = async (userId) => {
    let wishlist = await Wishlist.findOne({ userId }).populate("products");

    if (!wishlist) {
        wishlist = await Wishlist.create({
            userId,
            products: []
        });
    }

    return wishlist;
};

const addToWishlist = async (userId, productId) => {
    if (!productId) {
        throw new Error("Product ID is required");
    }

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        wishlist = new Wishlist({
            userId,
            products: [productId]
        });
    } else {
        const exists = wishlist.products.some(
            (product) => product.toString() === productId
        );

        if (!exists) {
            wishlist.products.push(productId);
        }
    }

    await wishlist.save();

    return wishlist.populate("products");
};

const removeFromWishlist = async (userId, productId) => {
    if (!productId) {
        throw new Error("Product ID is required");
    }

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        throw new Error("Wishlist not found");
    }

    wishlist.products = wishlist.products.filter(
        (product) => product.toString() !== productId
    );

    await wishlist.save();

    return wishlist.populate("products");
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
};
