function notFoundMiddleware(req, res) {
  res.status(404).json({ message: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ message: err.message || 'Server error' });
}

module.exports = { notFoundMiddleware, errorMiddleware };
