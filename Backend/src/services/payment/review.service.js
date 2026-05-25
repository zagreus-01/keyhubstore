const mongoose = require("mongoose");
const Review =
require("../../models/review.model");

const Order =
require("../../models/order.model");

const Product =
require("../../models/product.model");

const ProductVariant =
require("../../models/productVariant.model");

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


// =========================
// CREATE REVIEW
// =========================
const createReview = async (
    userId,
    data
) => {

    const {
        productId,
        orderId,
        rating,
        comment
    } = data;

    // Validate ObjectIds
    if (!isValidObjectId(orderId)) {
        throw new Error("Invalid order ID format");
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

    // only completed order
    if (
        order.orderStatus !== "completed"
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

    // update product rating
    await updateProductRating(
        productId
    );

    return review;

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