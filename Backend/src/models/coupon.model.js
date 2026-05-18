const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({

    code: {
        type: String,
        unique: true
    },

    discountPercent: Number,

    expiredAt: Date

}, {
    timestamps: true
});

module.exports = mongoose.model("Coupon", couponSchema);