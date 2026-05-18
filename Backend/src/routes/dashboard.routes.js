const router = require("express").Router();

const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/checkRole.middleware");

const {
    getDashboardStats
} = require("../controllers/dashboard.controller");

router.get(
    "/",
    verifyToken,
    checkRole("staff", "admin"),
    getDashboardStats
);

module.exports = router;
