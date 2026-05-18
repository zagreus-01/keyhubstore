const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },

    transactionCode: String,

    paymentMethod: String,

    paymentStatus: String,

    amount: Number,

    paidAt: Date

}, {
    timestamps: true
});

module.exports = mongoose.model("Payment", paymentSchema);