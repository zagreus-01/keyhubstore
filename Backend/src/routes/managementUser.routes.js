// routes/admin.user.routes.js

const router = require("express").Router();

const verifyToken =
require("../middleware/auth.middleware");

const checkRole =
require("../middleware/checkRole.middleware");

const {

    getAllUsers,

    getUserById,

    updateUserRole,

    blockUser,

    unblockUser,

    deleteUser

} = require(
    "../controllers/adminManagement/managementUser.controller"
);


// =========================
// ADMIN ONLY
// =========================
router.use(
    verifyToken,
    checkRole("admin")
);


// GET ALL USERS
router.get(
    "/",
    getAllUsers
);


// GET USER DETAIL
router.get(
    "/:id",
    getUserById
);


// UPDATE ROLE
router.put(
    "/:id/role",
    updateUserRole
);


// BLOCK USER
router.put(
    "/:id/block",
    blockUser
);


// UNBLOCK USER
router.put(
    "/:id/unblock",
    unblockUser
);


// DELETE USER
router.delete(
    "/:id",
    deleteUser
);


module.exports = router;