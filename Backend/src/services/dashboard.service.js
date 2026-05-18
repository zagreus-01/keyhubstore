const User = require("../models/user.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const Category = require("../models/category.model");
const Brand = require("../models/brand.model");

const getDashboardStats = async () => {
    const [
        totalUsers,
        totalProducts,
        totalOrders,
        totalCategories,
        totalBrands,
        revenueResult
    ] = await Promise.all([
        User.countDocuments({ isDeleted: false }),
        Product.countDocuments({ isDeleted: false }),
        Order.countDocuments({}),
        Category.countDocuments({}),
        Brand.countDocuments({}),
        Order.aggregate([
            {
                $match: {
                    paymentStatus: "paid"
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" }
                }
            }
        ])
    ]);

    const totalRevenue = revenueResult.length
        ? revenueResult[0].totalRevenue
        : 0;

    return {
        totalUsers,
        totalProducts,
        totalOrders,
        totalCategories,
        totalBrands,
        totalRevenue
    };
};

module.exports = {
    getDashboardStats
};
