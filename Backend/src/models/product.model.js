// models/product.model.js

const mongoose = require("mongoose");

const specificationSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            trim: true
        },

        value: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        _id: false
    }
);

const productSchema = new mongoose.Schema(
    {
        productName: {
            type: String,
            required: true,
            trim: true
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },

        brandId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Brand",
            required: true
        },

        thumbnail: {
            type: String,
            default: ""
        },

        images: [
            {
                type: String
            }
        ],

        specifications: [specificationSchema],

        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },

        reviewCount: {
            type: Number,
            default: 0
        },

        sold: {
            type: Number,
            default: 0
        },

        status: {
            type: String,
            enum: ["active", "hidden"],
            default: "active"
        },

        isDeleted: {
            type: Boolean,
            default: false
        },
        averageRating: {
            type: Number,
            default: 0
        },

        reviewCount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

productSchema.index({
    productName: "text",
    description: "text"
});

module.exports = mongoose.model("Product", productSchema);