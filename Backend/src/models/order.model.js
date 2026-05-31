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

    finalPrice: Number,

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },

    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },

    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand"
    }

});

const orderSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    items: [orderItemSchema],

    totalAmount: Number,

    couponCode: String,


    discountType: {
        type: String,
        enum: ["percent", "fixed"],
        default: undefined
    },
    discountValue: {
        type: Number,
        default: undefined
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    pointsUsed: {
        type: Number,
        default: 0
    },
    pointsDiscount: {
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

    stockDeducted: {
        type: Boolean,
        default: false
    },

    soldCounted: {
        type: Boolean,
        default: false
    },

    orderStatus: {
        type: String,
        enum: [
            "pending",
            "confirmed",
            "preparing",
            "shipping",
            "delivered",
            "cancel_requested",
            "cancelled"
        ],
        default: "pending"
    }

}, {
    timestamps: true
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, paymentMethod: 1, createdAt: -1 });
orderSchema.index({ "items.variantId": 1, orderStatus: 1 });

module.exports = mongoose.model("Order", orderSchema);
