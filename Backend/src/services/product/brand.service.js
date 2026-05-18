const Brand = require("../../models/brand.model");

const createBrand = async (data) => {
    return await Brand.create(data);
};

const getAllBrands = async () => {
    return await Brand.find();
};

const updateBrand = async (id, data) => {
    return await Brand.findByIdAndUpdate(id, data, { new: true });
};

const deleteBrand = async (id) => {
    return await Brand.findByIdAndDelete(id);
};

module.exports = {
    createBrand,
    getAllBrands,
    updateBrand,
    deleteBrand
};