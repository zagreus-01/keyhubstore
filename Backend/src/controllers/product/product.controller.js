const productService = require("../../services/product/product.service");
const { asyncHandler } = require("../../middleware/error.middleware");

const createError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const create = asyncHandler(async (req, res) => {
    const result = await productService.createProduct(req.body);

    res.status(201).json({
        message: "Create product success",
        data: result
    });
});

const getAll = asyncHandler(async (req, res) => {
    const { data, total, page, limit } = await productService.getAllProducts(req.query);

    res.json({ data, total, page, limit });
});

const getOne = asyncHandler(async (req, res) => {
    const result = await productService.getProductById(req.params.id);

    if (!result) {
        throw createError(404, "Product not found");
    }

    res.json({ data: result });
});

const getSimilar = asyncHandler(async (req, res) => {
    const data = await productService.getSimilarProducts(
        req.params.id,
        req.query.limit
    );

    res.json({ data });
});

const recordView = asyncHandler(async (req, res) => {
    const data = await productService.recordProductView(
        req.user.id,
        req.params.id
    );

    res.json({ success: true, data });
});

const getViewed = asyncHandler(async (req, res) => {
    const data = await productService.getViewedProducts(
        req.user.id,
        req.query.limit
    );

    res.json({ data });
});

const update = asyncHandler(async (req, res) => {
    const result = await productService.updateProduct(
        req.params.id,
        req.body
    );

    res.json({
        message: "Update success",
        data: result
    });
});

const remove = asyncHandler(async (req, res) => {
    await productService.deleteProduct(req.params.id);

    res.json({ message: "Delete success" });
});

module.exports = {
    create,
    getAll,
    getOne,
    getSimilar,
    recordView,
    getViewed,
    update,
    remove
};
