const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const checkRole = require("../middleware/checkRole.middleware");
const upload = require("../middleware/upload.middleware");
const uploadController = require("../controllers/upload.controller");

router.post("/avatar", auth, upload.single("file"), uploadController.uploadFile);
router.post("/product", auth, checkRole("admin"), upload.array("files", 12), (req, res) => {
  if (!req.files || !req.files.length) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  const paths = req.files.map((file) => require("path").relative(process.cwd(), file.path).replace(/\\/g, "/"));
  return res.status(201).json({ success: true, data: { paths } });
});

module.exports = router;
