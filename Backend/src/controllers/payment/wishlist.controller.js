const wishlistService = require("../../services/payment/wishlist.service");

const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await wishlistService.getWishlist(userId);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        const data = await wishlistService.addToWishlist(userId, productId);

        return res.status(200).json({
            success: true,
            message: "Product added to wishlist successfully",
            data
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        const data = await wishlistService.removeFromWishlist(userId, productId);

        return res.status(200).json({
            success: true,
            message: "Product removed from wishlist successfully",
            data
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
};
