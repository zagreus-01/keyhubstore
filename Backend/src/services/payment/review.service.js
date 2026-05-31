const mongoose = require("mongoose");
const Review =
require("../../models/review.model");

const Order =
require("../../models/order.model");

const Product =
require("../../models/product.model");

const Coupon =
require("../../models/coupon.model");

const ProductVariant =
require("../../models/productVariant.model");

const User =
require("../../models/user.model");

const REVIEW_REWARD_POINTS = 20;
const REVIEW_REWARD_DISCOUNT_PERCENT = 5;

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


// =========================
// CREATE REVIEW
// =========================
const createReview = async (
    userId,
    data
) => {

    let {
        productId,
        variantId,
        orderId,
        rating,
        comment
    } = data;

    // Validate ObjectIds
    if (!isValidObjectId(orderId)) {
        throw new Error("Invalid order ID format");
    }

    if (!productId && variantId && isValidObjectId(variantId)) {
        const variant = await ProductVariant.findById(variantId);
        productId = variant?.productId?.toString();
    }

    if (!isValidObjectId(productId)) {
        throw new Error("Invalid product ID format");
    }

    // check order
    const order = await Order.findOne({
        _id: orderId,
        userId
    });

    if (!order) {

        throw new Error(
            "Order not found"
        );

    }

    // only delivered order
    if (
        order.orderStatus !== "delivered"
    ) {

        throw new Error(
            "Cannot review this order"
        );

    }

    // check purchased product
    let purchased = false;

    for (const item of order.items) {

        const variant =
            await ProductVariant.findById(
                item.variantId
            );

        if (
            variant &&
            variant.productId.toString() ===
            productId
        ) {

            purchased = true;

            break;

        }

    }

    if (!purchased) {

        throw new Error(
            "Product not found in order"
        );

    }

    // duplicate review
    const existingReview =
        await Review.findOne({
            userId,
            productId,
            orderId
        });

    if (existingReview) {

        throw new Error(
            "You already reviewed this product"
        );

    }

    // create review
    const review =
        await Review.create({

            userId,

            productId,

            orderId,

            rating,

            comment

        });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const rewardCode =
        `RV${String(userId).slice(-4).toUpperCase()}${String(review._id).slice(-6).toUpperCase()}`;

    const rewardCoupon = await Coupon.create({
        code: rewardCode,
        discountType: "percent",
        discountValue: REVIEW_REWARD_DISCOUNT_PERCENT,
        applyTo: ["all"],
        ownerUserId: userId,
        source: "review_reward",
        startAt: new Date(),
        expiredAt: expiresAt
    });

    await User.findByIdAndUpdate(userId, {
        $inc: {
            loyaltyPoints: REVIEW_REWARD_POINTS
        }
    });

    // update product rating
    await updateProductRating(
        productId
    );

    return {
        review,
        reward: {
            points: REVIEW_REWARD_POINTS,
            coupon: rewardCoupon
        }
    };

};


// =========================
// GET PRODUCT REVIEWS
// =========================
const getProductReviews = async (
    productId
) => {

    return await Review.find({
        productId
    })
        .populate(
            "userId",
            "fullName avatar"
        )
        .sort({ createdAt: -1 });

};


// =========================
// DELETE REVIEW
// =========================
const deleteReview = async (
    userId,
    reviewId
) => {

    const review =
        await Review.findOne({
            _id: reviewId,
            userId
        });

    if (!review) {

        throw new Error(
            "Review not found"
        );

    }

    const productId =
        review.productId;

    await review.deleteOne();

    // update rating
    await updateProductRating(
        productId
    );

    return {
        message:
            "Review deleted successfully"
    };

};


// =========================
// UPDATE PRODUCT RATING
// =========================
const updateProductRating = async (
    productId
) => {

    const reviews =
        await Review.find({
            productId
        });

    let averageRating = 0;

    if (reviews.length > 0) {

        const total =
            reviews.reduce(
                (sum, review) =>
                    sum + review.rating,
                0
            );

        averageRating =
            total / reviews.length;

    }

    await Product.findByIdAndUpdate(
        productId,
        {
            averageRating,
            reviewCount:
                reviews.length
        }
    );

};


module.exports = {
    createReview,
    getProductReviews,
    deleteReview
};
