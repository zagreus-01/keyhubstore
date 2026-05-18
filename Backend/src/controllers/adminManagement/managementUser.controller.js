const adminUserService = require("../../services/adminManagement/managementUser.service");


// =========================
// GET ALL USERS
// =========================
const getAllUsers = async (
    req,
    res
) => {

    try {

        const users =
            await adminUserService
            .getAllUsers();

        return res.status(200).json({

            success: true,

            data: users

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =========================
// GET USER DETAIL
// =========================
const getUserById = async (
    req,
    res
) => {

    try {

        const user =
            await adminUserService
            .getUserById(
                req.params.id
            );

        return res.status(200).json({

            success: true,

            data: user

        });

    } catch (error) {

        return res.status(404).json({

            success: false,

            message: error.message

        });

    }

};


// =========================
// UPDATE ROLE
// =========================
const updateUserRole = async (
    req,
    res
) => {

    try {

        const user =
            await adminUserService
            .updateUserRole(
                req.params.id,
                req.body.role
            );

        return res.status(200).json({

            success: true,

            message:
                "Role updated successfully",

            data: user

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};


// =========================
// BLOCK USER
// =========================
const blockUser = async (
    req,
    res
) => {

    try {

        const user =
            await adminUserService
            .blockUser(
                req.params.id
            );

        return res.status(200).json({

            success: true,

            message:
                "User blocked successfully",

            data: user

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};


// =========================
// UNBLOCK USER
// =========================
const unblockUser = async (
    req,
    res
) => {

    try {

        const user =
            await adminUserService
            .unblockUser(
                req.params.id
            );

        return res.status(200).json({

            success: true,

            message:
                "User unblocked successfully",

            data: user

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};


// =========================
// DELETE USER
// =========================
const deleteUser = async (
    req,
    res
) => {

    try {

        const result =
            await adminUserService
            .deleteUser(
                req.params.id
            );

        return res.status(200).json({

            success: true,

            data: result

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};


module.exports = {
    getAllUsers,
    getUserById,
    updateUserRole,
    blockUser,
    unblockUser,
    deleteUser
};