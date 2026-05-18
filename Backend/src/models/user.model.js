const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        passwordHash: {
            type: String,
            required: true
        },

        avatar: {
            type: String,
            default: "uploads/avatars/default.png"
        },

        phone: {
            type: String,
            default: "",
            trim: true
        },

        role: {
            type: String,
            enum: ["customer", "admin","staff"],
            default: "customer"
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        status: {
            type: String,
            enum: ["active", "blocked"],
            default: "active"
        },

        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "User",
    userSchema
);