require("dotenv").config();

const express = require("express");
const cors = require("cors");

const path = require("path");
const { apiLimiter } = require("./middleware/rateLimit.middleware");
const {
  notFoundHandler,
  errorHandler
} = require("./middleware/error.middleware");
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

const apiRoutes = [
  ["/api/auth", authRoutes],
  ["/api/user", userRoutes],
  ["/api/upload", uploadRoutes],
  ["/api/admin/users", managementUserRoutes],
  ["/api/product", productRoutes],
  ["/api/category", categoryRoutes],
  ["/api/brand", brandRoutes],
  ["/api/cart", cartRoutes],
  ["/api/wishlist", wishlistRoutes],
  ["/api/order", orderRoutes],
  ["/api/dashboard", dashboardRoutes],
  ["/api/coupon", couponRoutes],
  ["/api/payment", paymentRoutes],
  ["/api/review", reviewRoutes]
];

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/api", apiLimiter);

apiRoutes.forEach(([routePath, router]) => {
  app.use(routePath, router);
});

app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"), {
    maxAge: "7d",
    immutable: true
  })
);

app.use("/api", notFoundHandler);
app.use(errorHandler);

module.exports = app;
