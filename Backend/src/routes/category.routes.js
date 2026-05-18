const router = require("express").Router();

const auth = require("../middleware/auth.middleware");
const checkRole = require("../middleware/checkRole.middleware");

const controller = require("../controllers/product/category.controller");

router.get("/", controller.getAll);
router.post("/", auth, checkRole("admin"), controller.create);
router.put("/:id", auth, checkRole("admin"), controller.update);
router.delete("/:id", auth, checkRole("admin"), controller.remove);

module.exports = router;    