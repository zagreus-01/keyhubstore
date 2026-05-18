const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({

    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductVariant",
        required: true
    },

    quantity: {
        type: Number,
        default: 1,
        min: 1
    }

});

const cartSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true,
        required: true
    },

    items: [cartItemSchema]

}, {
    timestamps: true
});

module.exports = mongoose.model("Cart", cartSchema);