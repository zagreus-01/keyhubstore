const Product = require("../../models/product.model");
const ProductVariant = require("../../models/productVariant.model");
const Order = require("../../models/order.model");
const ProductView = require("../../models/productView.model");

const DEFAULT_PRODUCT_LIMIT = 12;
const MAX_PRODUCT_LIMIT = 60;

const toPositiveInteger = (value, fallback, max = Number.MAX_SAFE_INTEGER) => {
    const number = Number.parseInt(value, 10);
    if (!Number.isFinite(number) || number < 1) return fallback;
    return Math.min(number, max);
};

const toOptionalNumber = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};

const groupByProductId = (variants) => {
    return variants.reduce((groups, variant) => {
        const key = String(variant.productId);
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(variant);
        return groups;
    }, new Map());
};

const getActiveVariantsByProductIds = async (productIds) => {
    if (!productIds.length) return new Map();

    const variants = await ProductVariant.find({
        productId: { $in: productIds },
        status: "active"
    })
        .sort({ price: 1, createdAt: 1 })
        .lean();

    return groupByProductId(variants);
};

const hasPriceInRange = (prices, minPrice, maxPrice) => {
    if (!prices.length) return false;

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (minPrice !== null && max < minPrice) return false;
    if (maxPrice !== null && min > maxPrice) return false;
    return true;
};

const attachVariantsToProducts = (products, variantsByProductId, options = {}) => {
    const minPrice = toOptionalNumber(options.minPrice);
    const maxPrice = toOptionalNumber(options.maxPrice);
    const shouldFilterByPrice = minPrice !== null && maxPrice !== null;

    return products
        .map((product) => {
            const variants = variantsByProductId.get(String(product._id)) || [];
            const prices = variants.map((variant) => variant.price);

            if (!prices.length) {
                return null;
            }

            if (shouldFilterByPrice && !hasPriceInRange(prices, minPrice, maxPrice)) {
                return null;
            }

            return {
                ...product,
                price: Math.min(...prices),
                variants
            };
        })
        .filter(Boolean);
};

const createServiceError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const createProduct = async (data) => {
    const { variants, ...productData } = data;

    const product = await Product.create(productData);

    if (variants?.length) {
        await ProductVariant.insertMany(
            variants.map(v => ({
                ...v,
                productId: product._id
            }))
        );
    }

    return product;
};

const getAllProducts = async (query) => {
    const { keyword, categoryId, brandId, minPrice, maxPrice, sortBy, page, limit } = query;
    const pageNum = toPositiveInteger(page, 1);
    const limitNum = limit ? toPositiveInteger(limit, DEFAULT_PRODUCT_LIMIT, MAX_PRODUCT_LIMIT) : null;

    const filter = {
        isDeleted: false,
        status: "active"
    };

    if (categoryId) filter.categoryId = categoryId;
    if (brandId) filter.brandId = brandId;

    if (keyword) {
        filter.$text = { $search: keyword };
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === "sold") {
        sortOptions = { sold: -1 };
    } else if (sortBy === "views") {
        sortOptions = { views: -1 };
    }

    const products = await Product.find(filter)
        .populate("categoryId")
        .populate("brandId")
        .sort(sortOptions)
        .lean();

    const variantsByProductId = await getActiveVariantsByProductIds(
        products.map((product) => product._id)
    );
    const filteredResult = attachVariantsToProducts(products, variantsByProductId, {
        minPrice,
        maxPrice
    });
    const total = filteredResult.length;

    let paginatedData = filteredResult;
    const responseLimit = limitNum || filteredResult.length;

    if (limitNum) {
        const startIndex = (pageNum - 1) * limitNum;
        paginatedData = filteredResult.slice(startIndex, startIndex + limitNum);
    }

    return {
        data: paginatedData,
        total,
        page: pageNum,
        limit: responseLimit
    };
};

const getProductById = async (id) => {
    const product = await Product.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false
        },
        { $inc: { views: 1 } },
        { new: true }
    )
        .populate("categoryId")
        .populate("brandId");

    if (!product) return null;

    const variants = await ProductVariant.find({
        productId: id,
        status: "active"
    }).lean();

    const prices = variants.map(v => v.price);
    const buyerCount = await countProductBuyers(id);

    return {
        ...product.toObject(),
        price: prices.length ? Math.min(...prices) : 0,
        variants,
        buyerCount
    };
};

const countProductBuyers = async (productId) => {
    const variantIds = await ProductVariant.find({ productId }).distinct("_id");

    if (!variantIds.length) return 0;

    const result = await Order.aggregate([
        {
            $match: {
                orderStatus: "delivered"
            }
        },
        {
            $unwind: "$items"
        },
        {
            $match: {
                "items.variantId": { $in: variantIds }
            }
        },
        {
            $group: {
                _id: "$userId"
            }
        },
        {
            $count: "total"
        }
    ]);

    return result[0]?.total || 0;
};

const getSimilarProducts = async (productId, limit = 8) => {
    const resultLimit = toPositiveInteger(limit, 8, MAX_PRODUCT_LIMIT);
    const product = await Product.findById(productId).lean();

    if (!product) return [];

    const products = await Product.find({
        _id: { $ne: productId },
        isDeleted: false,
        status: "active",
        $or: [
            { categoryId: product.categoryId },
            { brandId: product.brandId }
        ]
    })
        .populate("categoryId")
        .populate("brandId")
        .sort({ sold: -1, averageRating: -1, createdAt: -1 })
        .limit(resultLimit)
        .lean();

    const variantsByProductId = await getActiveVariantsByProductIds(
        products.map((item) => item._id)
    );

    return attachVariantsToProducts(products, variantsByProductId);
};

const recordProductView = async (userId, productId) => {
    const product = await Product.findOne({
        _id: productId,
        isDeleted: false,
        status: "active"
    });

    if (!product) {
        throw createServiceError("Product not found", 400);
    }

    await ProductView.findOneAndUpdate(
        { userId, productId },
        { viewedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return { success: true };
};

const getViewedProducts = async (userId, limit = 10) => {
    const resultLimit = toPositiveInteger(limit, 10, MAX_PRODUCT_LIMIT);
    const views = await ProductView.find({ userId })
        .sort({ viewedAt: -1 })
        .limit(resultLimit)
        .populate({
            path: "productId",
            match: {
                isDeleted: false,
                status: "active"
            },
            populate: [
                { path: "categoryId" },
                { path: "brandId" }
            ]
        });

    const activeViews = views.filter((view) => view.productId);
    const products = activeViews.map((view) => view.productId.toObject());
    const variantsByProductId = await getActiveVariantsByProductIds(
        products.map((product) => product._id)
    );
    const productsWithVariants = attachVariantsToProducts(products, variantsByProductId);
    const viewedAtByProductId = new Map(
        activeViews.map((view) => [String(view.productId._id), view.viewedAt])
    );

    return productsWithVariants.map((product) => ({
        ...product,
        viewedAt: viewedAtByProductId.get(String(product._id))
    }));
};

const updateProduct = async (id, data) => {
    const { variants, ...productData } = data;

    const product = await Product.findOneAndUpdate(
        { _id: id, isDeleted: false },
        productData,
        { new: true }
    );

    if (!product) return null;

    if (variants) {
        await ProductVariant.deleteMany({ productId: id });

        await ProductVariant.insertMany(
            variants.map(v => ({
                ...v,
                productId: id
            }))
        );
    }

    return product;
};

const deleteProduct = async (id) => {
    const product = await Product.findById(id);

    if (!product) return null;

    product.isDeleted = true;
    product.status = "hidden";

    await product.save();

    return product;
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    getSimilarProducts,
    recordProductView,
    getViewedProducts,
    updateProduct,
    deleteProduct
};
