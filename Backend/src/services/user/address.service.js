const Address = require("../../models/address.model");

const addAddressService = async (userId, data) => {
    return await Address.create({
        userId,
        ...data
    });
};

const getAddressesService = async (userId) => {
    return await Address.find({
        userId,
        isDeleted: false
    });
};

const updateAddressService = async (userId, id, data) => {
    return await Address.findOneAndUpdate(
        { _id: id, userId },
        data,
        { new: true }
    );
};

const deleteAddressService = async (userId, id) => {
    return await Address.findOneAndUpdate(
        { _id: id, userId },
        { isDeleted: true }
    );
};

const setDefaultAddressService = async (userId, id) => {
    await Address.updateMany(
        { userId },
        { isDefault: false }
    );

    return await Address.findOneAndUpdate(
        { _id: id, userId },
        { isDefault: true },
        { new: true }
    );
};

module.exports = {
    addAddressService,
    getAddressesService,
    updateAddressService,
    deleteAddressService,
    setDefaultAddressService
};