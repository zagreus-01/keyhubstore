const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true
    },

    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductVariant"
        }
    ]

}, {
    timestamps: true
});

module.exports = mongoose.model("Wishlist", wishlistSchema);
