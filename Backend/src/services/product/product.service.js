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
    const { keyword, categoryId, brandId, minPrice, maxPrice } = query;

    const filter = {
        isDeleted: false,
        status: "active"
    };

    if (categoryId) filter.categoryId = categoryId;
    if (brandId) filter.brandId = brandId;

    if (keyword) {
        filter.$text = { $search: keyword };
    }

    const products = await Product.find(filter)
        .populate("categoryId")
        .populate("brandId");

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
                if (max < minPrice || min > maxPrice) {
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

    return result.filter(Boolean);
};

const getProductById = async (id) => {
    const product = await Product.findOne({
        _id: id,
        isDeleted: false
    })
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