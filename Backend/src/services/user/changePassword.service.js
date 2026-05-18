const User = require("../../models/user.model");
const bcrypt = require("bcryptjs");

const changePasswordService = async (userId, oldPassword, newPassword) => {
    const user = await User.findById(userId).select("+passwordHash");

    if (!user) {
        throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);

    if (!isMatch) {
        throw new Error("Old password incorrect");
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return true;
};

module.exports = {
    changePasswordService
};