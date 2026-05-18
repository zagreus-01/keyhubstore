const router = require("express").Router();

const auth = require("../middleware/auth.middleware");
const checkRole = require("../middleware/checkRole.middleware");

const controller = require("../controllers/product/product.controller");

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);

router.post("/", auth, checkRole("admin"), controller.create);
router.put("/:id", auth, checkRole("admin"), controller.update);
router.delete("/:id", auth, checkRole("admin"), controller.remove);

module.exports = router;