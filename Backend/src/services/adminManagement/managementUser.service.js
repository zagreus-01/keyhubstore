const User =
require("../../models/user.model");


// =========================
// GET ALL USERS
// =========================
const getAllUsers = async () => {

    return await User.find({
        isDeleted: false
    })
        .select("-passwordHash")
        .sort({ createdAt: -1 });

};


// =========================
// GET USER DETAIL
// =========================
const getUserById = async (
    id
) => {

    const user =
        await User.findOne({
            _id: id,
            isDeleted: false
        }).select("-passwordHash");

    if (!user) {

        throw new Error(
            "User not found"
        );

    }

    return user;

};


// =========================
// UPDATE USER ROLE
// =========================
const updateUserRole = async (
    id,
    role
) => {

    const user =
        await User.findOne({
            _id: id,
            isDeleted: false
        });

    if (!user) {

        throw new Error(
            "User not found"
        );

    }

    const normalizedRole = String(role || "").toLowerCase();
    const allowedRoles = ["customer", "staff", "admin"];

    if (!allowedRoles.includes(normalizedRole)) {
        throw new Error(
            "Invalid role"
        );
    }

    user.role = normalizedRole;

    await user.save();

    return user;

};


// =========================
// BLOCK USER
// =========================
const blockUser = async (
    id
) => {

    const user =
        await User.findOne({
            _id: id,
            isDeleted: false
        });

    if (!user) {

        throw new Error(
            "User not found"
        );

    }

    // cannot block admin
    if (user.role === "admin") {

        throw new Error(
            "Cannot block admin"
        );

    }

    user.status = "blocked";

    await user.save();

    return user;

};


// =========================
// UNBLOCK USER
// =========================
const unblockUser = async (
    id
) => {

    const user =
        await User.findOne({
            _id: id,
            isDeleted: false
        });

    if (!user) {

        throw new Error(
            "User not found"
        );

    }

    user.status = "active";

    await user.save();

    return user;

};


// =========================
// DELETE USER
// =========================
const deleteUser = async (
    id
) => {

    const user =
        await User.findOne({
            _id: id,
            isDeleted: false
        });

    if (!user) {

        throw new Error(
            "User not found"
        );

    }

    // cannot delete admin
    if (user.role === "admin") {

        throw new Error(
            "Cannot delete admin"
        );

    }

    user.isDeleted = true;

    await user.save();

    return {
        message:
            "User deleted successfully"
    };

};


module.exports = {
    getAllUsers,
    getUserById,
    updateUserRole,
    blockUser,
    unblockUser,
    deleteUser
};