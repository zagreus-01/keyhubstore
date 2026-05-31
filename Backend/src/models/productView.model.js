const mongoose = require("mongoose");

const productViewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

productViewSchema.index({ userId: 1, productId: 1 }, { unique: true });
productViewSchema.index({ userId: 1, viewedAt: -1 });

module.exports = mongoose.model("ProductView", productViewSchema);
