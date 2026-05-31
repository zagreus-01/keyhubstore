const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Product = require("./src/models/product.model");
const Order = require("./src/models/order.model");

async function fixSoldCount() {
    try {
        await mongoose.connect(process.env.MONGO_DB_URL);
        console.log("Connected to MongoDB");

        // Get all delivered orders
        const orders = await Order.find({ orderStatus: "delivered" });
        console.log(`Found ${orders.length} delivered orders`);

        // Calculate sold count for each product
        const soldCounts = {};

        const ProductVariant = require("./src/models/productVariant.model");

        for (const order of orders) {
            for (const item of order.items) {
                let productId = item.productId;
                if (!productId) {
                    const variant = await ProductVariant.findById(item.variantId);
                    if (variant) {
                        productId = variant.productId;
                    }
                }
                if (!productId) continue;

                
                if (!soldCounts[productId]) {
                    soldCounts[productId] = 0;
                }
                soldCounts[productId] += item.quantity;
            }
        }

        console.log("Calculated sold counts:", soldCounts);

        // Update all products
        for (const productId in soldCounts) {
            await Product.findByIdAndUpdate(productId, { sold: soldCounts[productId] });
            console.log(`Updated product ${productId} with sold count ${soldCounts[productId]}`);
        }

        console.log("Done");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixSoldCount();
