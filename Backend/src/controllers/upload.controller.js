const path = require("path");

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = path.relative(process.cwd(), req.file.path).replace(/\\/g, "/");

    return res.status(201).json({
      success: true,
      data: {
        path: filePath
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  uploadFile
};
