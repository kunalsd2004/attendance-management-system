const bcrypt = require('bcryptjs');
const { PAGINATION } = require('./constants');

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate random password
 * @param {number} length - Password length
 * @returns {string} - Random password
 */
const generateRandomPassword = (length = 8) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim(); // Remove leading/trailing whitespace
};

/**
 * Parse pagination parameters
 * @param {Object} query - Query parameters
 * @returns {Object} - Parsed pagination object
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Create pagination response
 * @param {Array} data - Data array
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} - Pagination response
 */
const createPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNext,
      hasPrev
    }
  };
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {Array} errors - Array of validation errors
 * @returns {Object} - Formatted error response
 */
const formatErrorResponse = (message, errors = []) => {
  return {
    success: false,
    message,
    errors
  };
};

/**
 * Format success response
 * @param {string} message - Success message
 * @param {*} data - Response data
 * @returns {Object} - Formatted success response
 */
const formatSuccessResponse = (message, data = null) => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return response;
};

/**
 * Generate SDRN
 * @param {string} department - Department code
 * @param {number} sequence - Sequence number
 * @returns {string} - SDRN
 */
const generateSdrn = (department, sequence) => {
  const year = new Date().getFullYear().toString().slice(-2);
  return `${department}${year}${sequence.toString().padStart(4, '0')}`;
};

/**
 * Check if email is valid
 * @param {string} email - Email address
 * @returns {boolean} - True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Capitalize first letter of each word
 * @param {string} str - Input string
 * @returns {string} - Capitalized string
 */
const capitalizeWords = (str) => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Remove undefined/null values from object
 * @param {Object} obj - Input object
 * @returns {Object} - Cleaned object
 */
const removeEmptyFields = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

module.exports = {
  hashPassword,
  comparePassword,
  generateRandomPassword,
  sanitizeInput,
  parsePagination,
  createPaginationResponse,
  formatErrorResponse,
  formatSuccessResponse,
  generateSdrn,
  isValidEmail,
  capitalizeWords,
  removeEmptyFields
}; 