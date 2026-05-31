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
    ownerUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    source: {
        type: String,
        enum: ["admin", "review_reward"],
        default: "admin"
    },
    startAt: Date,
    expiredAt: Date,
}, {
    timestamps: true,
});

couponSchema.index({ source: 1, ownerUserId: 1, createdAt: -1 });
couponSchema.index({ startAt: 1, expiredAt: 1 });

module.exports = mongoose.model("Coupon", couponSchema);
