const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: true,
    },
    discountType: {
        type: String,
        enum: ["percent", "fixed"],
        default: "percent",
    },
    discountValue: {
        type: Number,
        required: true,
        default: 0,
    },
    applyTo: {
        type: [String],
        enum: ["all", "product", "category", "brand"],
        default: "all",
    },
    targetId: [String],
    targetName: String,
    startAt: Date,
    expiredAt: Date,
}, {
    timestamps: true,
});

module.exports = mongoose.model("Coupon", couponSchema);