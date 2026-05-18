const categoryService = require("../../services/product/category.service");

const create = async (req, res) => {
    const result = await categoryService.createCategory(req.body);
    res.status(201).json({ data: result });
};

const getAll = async (req, res) => {
    const result = await categoryService.getAllCategories();
    res.json({ data: result });
};

const update = async (req, res) => {
    const result = await categoryService.updateCategory(req.params.id, req.body);
    res.json({ data: result });
};

const remove = async (req, res) => {
    await categoryService.deleteCategory(req.params.id);
    res.json({ message: "Deleted" });
};

module.exports = { create, getAll, update, remove };