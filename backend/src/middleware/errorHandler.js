const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils/constants');
const { formatErrorResponse } = require('../utils/helpers');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      statusCode: HTTP_STATUS.NOT_FOUND,
      message
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message
    };
  }

  res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
    formatErrorResponse(
      error.message || 'Server Error',
      process.env.NODE_ENV === 'development' ? [err.stack] : []
    )
  );
};

module.exports = errorHandler; 