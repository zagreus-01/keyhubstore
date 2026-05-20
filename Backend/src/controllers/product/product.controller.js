const productService = require("../../services/product/product.service");

const create = async (req, res) => {
    try {
        const result = await productService.createProduct(req.body);

        res.status(201).json({
            message: "Create product success",
            data: result
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAll = async (req, res) => {
    try {
        const { data, total, page, limit } = await productService.getAllProducts(req.query);

        res.json({ data, total, page, limit });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getOne = async (req, res) => {
    try {
        const result = await productService.getProductById(req.params.id);

        if (!result) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({ data: result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const update = async (req, res) => {
    try {
        const result = await productService.updateProduct(
            req.params.id,
            req.body
        );

        res.json({
            message: "Update success",
            data: result
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const remove = async (req, res) => {
    try {
        await productService.deleteProduct(req.params.id);

        res.json({ message: "Delete success" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    create,
    getAll,
    getOne,
    update,
    remove
};