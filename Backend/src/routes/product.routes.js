const router = require("express").Router();

const auth = require("../middleware/auth.middleware");
const checkRole = require("../middleware/checkRole.middleware");

const controller = require("../controllers/product/product.controller");

router.get("/", controller.getAll);
router.get("/viewed/me", auth, checkRole("customer"), controller.getViewed);
router.get("/:id/similar", controller.getSimilar);
router.post("/:id/view", auth, checkRole("customer"), controller.recordView);
router.get("/:id", controller.getOne);

router.post("/", auth, checkRole("admin"), controller.create);
router.put("/:id", auth, checkRole("admin"), controller.update);
router.delete("/:id", auth, checkRole("admin"), controller.remove);

module.exports = router;
