const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads");
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_UPLOAD_FOLDERS = {
  avatar: "avatars",
  avatars: "avatars",
  label: "label",
  product: "product",
  "product-image": "product",
  images: "product"
};

const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true,
    });
  }
};

const resolveUploadFolder = (req, file) => {
  const routePath = req.route?.path || "";
  const routeType = routePath.replace("/", "");
  const uploadType = req.params.type || file.fieldname || routeType;

  return IMAGE_UPLOAD_FOLDERS[uploadType] || "others";
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const finalPath = path.join(UPLOAD_ROOT, resolveUploadFolder(req, file));

    ensureDirectoryExists(finalPath);

    cb(null, finalPath);
  },

  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString("hex");
    const extension = path.extname(file.originalname).toLowerCase() || ".jpg";

    cb(
      null,
      `${timestamp}-${random}${extension}`
    );
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: MAX_IMAGE_SIZE,
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
