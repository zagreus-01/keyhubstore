const User = require("../../models/user.model");

const getProfileService = async (userId) => {
    return await User.findById(userId).select("-passwordHash");
};

const updateProfileService = async (userId, data) => {
    return await User.findByIdAndUpdate(
        userId,
        {
            fullName: data.fullName,
            phone: data.phone,
            avatar: data.avatar
        },
        { new: true }
    ).select("-passwordHash");
};

module.exports = {
    getProfileService,
    updateProfileService
};