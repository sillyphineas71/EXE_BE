const errorHandler = (err, req, res, next) => {
  if (!(err instanceof Error)) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }

  const status = err.statusCode || 500;
  const payload = {
    message: status >= 500 ? "Lỗi hệ thống" : err.message,
  };

  if (err.details && status < 500) {
    payload.details = err.details;
  }

  if (status >= 500) {
    console.error(err);
  }

  return res.status(status).json(payload);
};

module.exports = errorHandler;
