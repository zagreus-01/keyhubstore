const reviewService =
require("../../services/payment/review.service");


// =========================
// CREATE REVIEW
// =========================
const createReview = async (
    req,
    res
) => {

    try {

        const review =
            await reviewService
            .createReview(
                req.user.id,
                req.body
            );

        return res.status(201).json({

            success: true,

            message:
                "Review created successfully",

            data: review

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};


// =========================
// GET PRODUCT REVIEWS
// =========================
const getProductReviews = async (
    req,
    res
) => {

    try {

        const reviews =
            await reviewService
            .getProductReviews(
                req.params.productId
            );

        return res.status(200).json({

            success: true,

            data: reviews

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =========================
// DELETE REVIEW
// =========================
const deleteReview = async (
    req,
    res
) => {

    try {

        const result =
            await reviewService
            .deleteReview(
                req.user.id,
                req.params.id
            );

        return res.status(200).json({

            success: true,

            data: result

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};


module.exports = {
    createReview,
    getProductReviews,
    deleteReview
};