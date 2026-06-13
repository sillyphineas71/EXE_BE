const errorHandler = (err, req, res, next) => {
  const status = err?.statusCode || err?.status || 500;

  // ✅ Luôn log 1 dòng (debug production)
  console.error("ERR", {
    status,
    method: req.method,
    url: req.originalUrl,
    name: err?.name,
    message: err?.message || String(err),
    details: err?.details,
    stack: err?.stack,
  });

  const payload = {
    message: status >= 500 ? "Lỗi hệ thống" : (err?.message || "Bad Request"),
  };

  if (err?.details && status < 500) payload.details = err.details;

  return res.status(status).json(payload);
};

module.exports = errorHandler;
