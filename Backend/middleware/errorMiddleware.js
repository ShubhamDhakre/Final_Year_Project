/* eslint-disable no-unused-vars */
const ApiError = require('../utils/ApiError');

// Not found handler
const notFound = (req, res, next) => {
  next(new ApiError(404, `Not Found - ${req.originalUrl}`));
};

// Global error handler
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Hide stack traces in production
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: err.message || 'Something went wrong',
    ...(isProduction ? null : { stack: err.stack }),
  });
};

module.exports = {
  notFound,
  errorHandler,
};

