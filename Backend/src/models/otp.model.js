const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true
    },

    otp: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: [
            "register",
            "forgot-password",
            "verify-email"
        ]
    },

    expiredAt: {
        type: Date,
        required: true
    }

}, {
    timestamps: true
});

otpSchema.index(
    { expiredAt: 1 },
    { expireAfterSeconds: 0 }
);

module.exports = mongoose.model("Otp", otpSchema);