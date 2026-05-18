const Category = require("../../models/category.model");

const createCategory = async (data) => {
    return await Category.create(data);
};

const getAllCategories = async () => {
    return await Category.find();
};

const updateCategory = async (id, data) => {
    return await Category.findByIdAndUpdate(id, data, { new: true });
};

const deleteCategory = async (id) => {
    return await Category.findByIdAndDelete(id);
};

module.exports = {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
};