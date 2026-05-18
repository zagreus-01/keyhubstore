const brandService = require("../../services/product/brand.service");

const create = async (req, res) => {
    const result = await brandService.createBrand(req.body);
    res.status(201).json({ data: result });
};

const getAll = async (req, res) => {
    const result = await brandService.getAllBrands();
    res.json({ data: result });
};

const update = async (req, res) => {
    const result = await brandService.updateBrand(req.params.id, req.body);
    res.json({ data: result });
};

const remove = async (req, res) => {
    await brandService.deleteBrand(req.params.id);
    res.json({ message: "Deleted" });
};

module.exports = { create, getAll, update, remove };