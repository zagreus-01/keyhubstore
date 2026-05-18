const router = require("express").Router();

const fs = require("fs");
const path = require("path");

const auth = require("../middleware/auth.middleware");
const checkRole = require("../middleware/checkRole.middleware");

const upload = require("../middleware/upload.middleware");

const uploadController = require("../controllers/upload.controller");

//
// GET LABEL IMAGES
//

router.get("/label", (req, res) => {
  const labelDir = path.join(
    __dirname,
    "..",
    "..",
    "uploads",
    "label"
  );

  try {
    // CREATE FOLDER IF NOT EXISTS
    if (!fs.existsSync(labelDir)) {
      fs.mkdirSync(labelDir, {
        recursive: true,
      });
    }

    const files = fs.readdirSync(labelDir);

    const images = files
      .filter((file) =>
        /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(
          file
        )
      )
      .map(
        (file) =>
          `/uploads/label/${file}`
      );

    return res.status(200).json({
      success: true,
      data: {
        images,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

//
// UPLOAD AVATAR
//

router.post(
  "/avatar",
  auth,
  upload.single("file"),
  uploadController.uploadFile
);

//
// UPLOAD LABEL IMAGES
//

router.post(
  "/label",
  auth,
  checkRole("admin"),
  upload.array("files", 10),
  (req, res) => {
    if (
      !req.files ||
      !req.files.length
    ) {
      return res.status(400).json({
        message: "No files uploaded",
      });
    }

    const paths = req.files.map(
      (file) =>
        `/uploads/label/${file.filename}`
    );

    return res.status(201).json({
      success: true,
      data: {
        paths,
      },
    });
  }
);

//
// UPLOAD PRODUCT IMAGES
//

router.post(
  "/product",
  auth,
  checkRole("admin"),
  upload.array("files", 12),
  (req, res) => {
    if (
      !req.files ||
      !req.files.length
    ) {
      return res.status(400).json({
        message: "No files uploaded",
      });
    }

    const paths = req.files.map(
      (file) =>
        `/uploads/product/${file.filename}`
    );

    return res.status(201).json({
      success: true,
      data: {
        paths,
      },
    });
  }
);

module.exports = router;