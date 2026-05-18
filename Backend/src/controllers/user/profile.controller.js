const {
    getProfileService,
    updateProfileService
} = require("../../services/user/profile.service");

// GET PROFILE
const getProfile = async (req, res) => {
    try {
        const data = await getProfileService(req.user.id);

        res.json({
            success: true,
            data
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UPDATE PROFILE
const updateProfile = async (req, res) => {
    try {
        const data = await updateProfileService(req.user.id, req.body);

        res.json({
            success: true,
            data
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getProfile,
    updateProfile
};