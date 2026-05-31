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
        revenueResult,
        revenueByMonth,
        ordersByStatus,
        recentOrders
    ] = await Promise.all([
        User.countDocuments({ isDeleted: false }),
        Product.countDocuments({ isDeleted: false }),
        Order.countDocuments({}),
        Category.countDocuments({}),
        Brand.countDocuments({}),
        Order.aggregate([
            { $match: { paymentStatus: "paid" } },
            { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
        ]),
        Order.aggregate([
            { $match: { paymentStatus: "paid" } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 12 }
        ]),
        Order.aggregate([
            {
                $group: {
                    _id: "$orderStatus",
                    count: { $sum: 1 }
                }
            }
        ]),
        Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("userId", "fullName email")
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
        totalRevenue,
        revenueByMonth: revenueByMonth.map(item => ({
            month: item._id,
            revenue: item.revenue
        })),
        ordersByStatus: ordersByStatus.map(item => ({
            status: item._id,
            count: item.count
        })),
        recentOrders
    };
};

module.exports = {
    getDashboardStats
};
