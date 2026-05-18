const {
    addAddressService,
    getAddressesService,
    updateAddressService,
    deleteAddressService,
    setDefaultAddressService
} = require("../../services/user/address.service");

// ADD
const addAddress = async (req, res) => {
    try {
        const data = await addAddressService(req.user.id, req.body);

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET
const getAddresses = async (req, res) => {
    try {
        const data = await getAddressesService(req.user.id);

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UPDATE
const updateAddress = async (req, res) => {
    try {
        const data = await updateAddressService(
            req.user.id,
            req.params.id,
            req.body
        );

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE
const deleteAddress = async (req, res) => {
    try {
        await deleteAddressService(req.user.id, req.params.id);

        res.json({ success: true, message: "Deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DEFAULT
const setDefaultAddress = async (req, res) => {
    try {
        const data = await setDefaultAddressService(
            req.user.id,
            req.params.id
        );

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};