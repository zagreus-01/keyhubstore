const Product = require("../../models/product.model");
const ProductVariant = require("../../models/productVariant.model");

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
        .sort(sortOptions);

    const result = await Promise.all(
        products.map(async (p) => {
            const variants = await ProductVariant.find({
                productId: p._id,
                status: "active"
            });

            if (!variants.length) return null;

            const prices = variants.map(v => v.price);

            const min = Math.min(...prices);
            const max = Math.max(...prices);

            if (minPrice && maxPrice) {
                if (max < Number(minPrice) || min > Number(maxPrice)) {
                    return null;
                }
            }

            return {
                ...p.toObject(),
                price: min,
                variants
            };
        })
    );

    const filteredResult = result.filter(Boolean);
    const total = filteredResult.length;
    
    let paginatedData = filteredResult;
    let pageNum = 1;
    let limitNum = filteredResult.length; // Default to all if no limit

    if (page && limit) {
        pageNum = parseInt(page, 10);
        limitNum = parseInt(limit, 10);
        const startIndex = (pageNum - 1) * limitNum;
        paginatedData = filteredResult.slice(startIndex, startIndex + limitNum);
    } else if (limit) {
        limitNum = parseInt(limit, 10);
        paginatedData = filteredResult.slice(0, limitNum);
    }

    return {
        data: paginatedData,
        total,
        page: pageNum,
        limit: limitNum
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
    });

    const prices = variants.map(v => v.price);

    return {
        ...product.toObject(),
        price: prices.length ? Math.min(...prices) : 0,
        variants
    };
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
    updateProduct,
    deleteProduct
};