const Wishlist = require("../../models/wishlist.model");
const ProductVariant = require("../../models/productVariant.model");

const groupByProductId = (variants) => {
    return variants.reduce((groups, variant) => {
        const key = String(variant.productId);
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(variant);
        return groups;
    }, new Map());
};

const getActiveVariantsByProductIds = async (productIds) => {
    if (!productIds.length) return new Map();

    const variants = await ProductVariant.find({
        productId: { $in: productIds },
        status: "active"
    })
        .sort({ price: 1, createdAt: 1 })
        .lean();

    return groupByProductId(variants);
};

const attachProductDetails = async (wishlist) => {
    await wishlist.populate({
        path: "products",
        match: {
            status: "active"
        },
        populate: {
            path: "productId",
            match: {
                isDeleted: false,
                status: "active"
            },
            populate: [
                { path: "categoryId" },
                { path: "brandId" }
            ]
        }
    });

    const populatedVariants = (wishlist.products || []).filter((variant) => variant?.productId);
    const variantsByProductId = await getActiveVariantsByProductIds(
        populatedVariants.map((variant) => variant.productId._id)
    );

    const products = populatedVariants.map((variant) => {
        const product = variant.productId;
        const variants = variantsByProductId.get(String(product._id)) || [];

        const prices = variants.map((item) => item.price);
        const selectedVariant = {
            ...variant.toObject(),
            productId: product._id
        };

        return {
            ...product.toObject(),
            selectedVariant,
            price: variant.price ?? (prices.length ? Math.min(...prices) : 0),
            variants
        };
    });

    return {
        ...wishlist.toObject(),
        products
    };
};

const getWishlist = async (userId) => {
    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        wishlist = await Wishlist.create({
            userId,
            products: []
        });
    }

    return attachProductDetails(wishlist);
};

const addToWishlist = async (userId, variantId) => {
    if (!variantId) {
        throw new Error("Variant ID is required");
    }

    const variant = await ProductVariant.findOne({
        _id: variantId,
        status: "active"
    }).populate({
        path: "productId",
        match: {
            isDeleted: false,
            status: "active"
        }
    });

    if (!variant || !variant.productId) {
        throw new Error("Variant not found");
    }

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        wishlist = new Wishlist({
            userId,
            products: [variantId]
        });
    } else {
        const exists = wishlist.products.some(
            (variant) => variant.toString() === variantId
        );

        if (!exists) {
            wishlist.products.push(variantId);
        }
    }

    await wishlist.save();

    return attachProductDetails(wishlist);
};

const removeFromWishlist = async (userId, variantId) => {
    if (!variantId) {
        throw new Error("Variant ID is required");
    }

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        throw new Error("Wishlist not found");
    }

    wishlist.products = wishlist.products.filter(
        (variant) => variant.toString() !== variantId
    );

    await wishlist.save();

    return attachProductDetails(wishlist);
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
};
