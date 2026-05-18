// models/productVariant.model.js

const mongoose = require("mongoose");

const attributeSchema = new mongoose.Schema(
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

const productVariantSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        sku: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        stock: {
            type: Number,
            default: 0,
            min: 0
        },

        images: [
            {
                type: String
            }
        ],

        attributes: [attributeSchema],

        status: {
            type: String,
            enum: ["active", "hidden", "out_of_stock"],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);

productVariantSchema.index({
    productId: 1
});

module.exports = mongoose.model("ProductVariant", productVariantSchema);