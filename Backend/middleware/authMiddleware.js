const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Protect routes - require valid JWT
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, token missing');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('_id name email');

    if (!req.user) {
      throw new ApiError(401, 'Not authorized, user no longer exists');
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired, please login again');
    }
    if (err.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid token');
    }
    throw err;
  }
});

module.exports = {
  protect,
};

