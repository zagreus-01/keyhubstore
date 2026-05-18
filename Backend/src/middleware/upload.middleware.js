const multer = require("multer");
const fs = require("fs");
const path = require("path");

const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true,
    });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const routePath = req.route?.path || "";
    const uploadType =
      req.params.type ||
      file.fieldname ||
      "";

    const basePath = path.join(
      __dirname,
      "..",
      "..",
      "uploads"
    );

    let subFolder = "others";

    // AVATAR
    if (
      routePath === "/avatar" ||
      uploadType === "avatar"
    ) {
      subFolder = "avatars";
    }

    // LABEL / HERO SLIDER
    else if (
      routePath === "/label" ||
      uploadType === "label"
    ) {
      subFolder = "label";
    }

    // PRODUCT
    else if (
      routePath === "/product" ||
      uploadType === "product" ||
      uploadType === "product-image" ||
      uploadType === "images"
    ) {
      subFolder = "product";
    }

    const finalPath = path.join(
      basePath,
      subFolder
    );

    ensureDirectoryExists(finalPath);

    cb(null, finalPath);
  },

  filename: (req, file, cb) => {
    const timestamp = Date.now();

    const random = Math.round(
      Math.random() * 1e9
    );

    const extension =
      path.extname(file.originalname) ||
      ".jpg";

    cb(
      null,
      `${timestamp}-${random}${extension}`
    );
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (
      !file.mimetype.startsWith("image/")
    ) {
      return cb(
        new Error(
          "Only image files are allowed"
        ),
        false
      );
    }

    cb(null, true);
  },
});

module.exports = upload;