require("dotenv").config();

const express = require("express");
const cors = require("cors");

const path = require("path");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const uploadRoutes = require("./routes/upload.routes");
const managementUserRoutes = require("./routes/managementUser.routes");

// PRODUCT MODULE
const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const brandRoutes = require("./routes/brand.routes");
// app.js
const paymentRoutes = require("./routes/payment.routes");

const orderRoutes = require("./routes/order.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const couponRoutes = require("./routes/coupon.routes");

const cartRoutes = require("./routes/cart.routes");

const reviewRoutes = require("./routes/review.routes");
const app = express();

// middleware
app.use(cors());
app.use(express.json());

// AUTH
app.use("/api/auth", authRoutes);

// USER
app.use("/api/user", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin/users", managementUserRoutes);

// PRODUCT SYSTEM
app.use("/api/product", productRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/brand", brandRoutes);
// CART
app.use("/api/cart", cartRoutes);

// WISHLIST
app.use("/api/wishlist", wishlistRoutes);

// ORDER
app.use("/api/order", orderRoutes);

// DASHBOARD
app.use("/api/dashboard", dashboardRoutes);

// COUPON
app.use("/api/coupon", couponRoutes);

// PAYMENT
app.use("/api/payment", paymentRoutes);

// REVIEWS
app.use("/api/review", reviewRoutes);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

module.exports = app;