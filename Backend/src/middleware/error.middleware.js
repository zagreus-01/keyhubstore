const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const isUploadValidationError =
    err.name === "MulterError" ||
    err.message === "Only image files are allowed";
  const statusCode = isUploadValidationError ? 400 : err.statusCode || err.status || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error"
  });
};

module.exports = {
  asyncHandler,
  notFoundHandler,
  errorHandler
};
