const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({

    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductVariant"
    },

    productName: String,

    variantName: String,

    image: String,

    quantity: Number,

    originalPrice: Number,

    finalPrice: Number

});

const orderSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    items: [orderItemSchema],

    totalAmount: Number,

    couponCode: String,

    discountPercent: {
        type: Number,
        default: 0
    },

    discountAmount: {
        type: Number,
        default: 0
    },

    finalAmount: Number,

    shippingAddress: {

        fullName: String,

        phone: String,

        address: String

    },

    paymentMethod: {
        type: String,
        enum: ["COD", "VNPAY"],
        default: "COD"
    },

    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending"
    },

    orderStatus: {
        type: String,
        enum: [
            "pending",
            "processing",
            "shipping",
            "completed",
            "cancelled"
        ],
        default: "pending"
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Order", orderSchema);