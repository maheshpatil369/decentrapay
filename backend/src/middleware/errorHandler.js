// src/middleware/errorHandler.js
exports.errorHandler = (err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  const status  = err.status || 500;
  const message = process.env.NODE_ENV === "production"
    ? "An internal error occurred"
    : err.message;
  res.status(status).json({ error: message });
};
