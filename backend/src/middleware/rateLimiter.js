const rateLimit = require('express-rate-limit');
const { HTTP_STATUS } = require('../utils/constants');
const { formatErrorResponse } = require('../utils/helpers');

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: formatErrorResponse('Too many requests from this IP, please try again later'),
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
      formatErrorResponse('Too many requests from this IP, please try again later')
    );
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// Strict rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 5, // More permissive in development
  message: formatErrorResponse('Too many authentication attempts, please try again later'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
      formatErrorResponse('Too many authentication attempts, please try again later')
    );
  }
});

// Password reset limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: formatErrorResponse('Too many password reset attempts, please try again later'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
      formatErrorResponse('Too many password reset attempts, please try again later')
    );
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter
}; 