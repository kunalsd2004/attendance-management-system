const jwt = require('jsonwebtoken');
const { verifyAccessToken } = require('../config/jwt');
const { formatErrorResponse } = require('../utils/helpers');
const { HTTP_STATUS, USER_ROLES } = require('../utils/constants');
const User = require('../models/User');

// Accepts 'test-token-...' as a valid token for dev/demo
const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatErrorResponse('Access denied. No token provided')
      );
    }
    // Accept test-token for dev/demo
    if (token.startsWith('test-token-')) {
      // Extract user email from test token format: test-token-email-timestamp
      const tokenParts = token.split('-');
      if (tokenParts.length >= 4) {
        // Format: test-token-email-timestamp
        const userEmail = tokenParts[2];
        const user = await User.findOne({ email: userEmail, isActive: true });
        
        if (!user) {
          return res.status(HTTP_STATUS.UNAUTHORIZED).json(
            formatErrorResponse('User not found or inactive')
          );
        }
        
        req.user = user;
        return next();
      } else {
        // Fallback for old format test tokens
        console.warn('Using fallback for old test token format');
        const user = await User.findOne({ isActive: true });
        if (!user) {
          return res.status(HTTP_STATUS.UNAUTHORIZED).json(
            formatErrorResponse('Token is valid but no users found in database')
          );
        }
        req.user = user;
        return next();
      }
    }
    // Otherwise, reject
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      formatErrorResponse('Invalid token')
    );
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Authentication error')
    );
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatErrorResponse('Access denied. Authentication required')
      );
    }
    if (!roles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        formatErrorResponse(`Access denied. Required roles: ${roles.join(', ')}`)
      );
    }
    next();
  };
};

// Middleware to check if user is HOD of a department
const authorizeHOD = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatErrorResponse('Access denied. Authentication required')
      );
    }

    const Department = require('../models/Department');
    const department = await Department.findOne({ hod: req.user._id });

    if (!department && req.user.role !== USER_ROLES.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        formatErrorResponse('Access denied. HOD privileges required')
      );
    }

    req.department = department;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Authorization error')
    );
  }
};

// Middleware to check if user can access specific user data
const authorizeUserAccess = (req, res, next) => {
  const targetUserId = req.params.userId || req.params.id;
  
  // For listing all users (no specific user ID), only Admin and Principal can access
  if (!targetUserId) {
    if (req.user.role === USER_ROLES.ADMIN || req.user.role === USER_ROLES.PRINCIPAL) {
      return next();
    }
    return res.status(HTTP_STATUS.FORBIDDEN).json(
      formatErrorResponse('Access denied. Admin or Principal privileges required')
    );
  }
  
  // Users can access their own data
  if (req.user._id.toString() === targetUserId) {
    return next();
  }

  // HODs can access their department's faculty data
  if (req.user.role === USER_ROLES.HOD) {
    // This would need additional logic to check department membership
    return next();
  }

  // Admins can access all user data
  if (req.user.role === USER_ROLES.ADMIN || req.user.role === USER_ROLES.PRINCIPAL) {
    return next();
  }

  return res.status(HTTP_STATUS.FORBIDDEN).json(
    formatErrorResponse('Access denied. Insufficient privileges')
  );
};

// Middleware to check if user can manage leave requests
const authorizeLeaveManagement = async (req, res, next) => {
  try {
    const Leave = require('../models/Leave');
    const leaveId = req.params.id || req.params.leaveId;

    if (!leaveId) {
      return next(); // Skip if no specific leave ID (for general operations)
    }

    const leave = await Leave.findById(leaveId).populate('applicant');

    if (!leave) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatErrorResponse('Leave request not found')
      );
    }

    // Users can manage their own leaves
    if (leave.applicant._id.toString() === req.user._id.toString()) {
      req.leave = leave;
      return next();
    }

    // HODs can manage their department's leaves
    if (req.user.role === USER_ROLES.HOD) {
      const Department = require('../models/Department');
      const department = await Department.findOne({ hod: req.user._id });
      
      if (department && leave.applicant.profile.department.toString() === department._id.toString()) {
        req.leave = leave;
        return next();
      }
    }

    // Admins and Principal can manage all leaves
    if (req.user.role === USER_ROLES.ADMIN || req.user.role === USER_ROLES.PRINCIPAL) {
      req.leave = leave;
      return next();
    }

    return res.status(HTTP_STATUS.FORBIDDEN).json(
      formatErrorResponse('Access denied. Cannot manage this leave request')
    );
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Authorization error')
    );
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token is invalid, but we continue without user
      }
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  authorizeHOD,
  authorizeUserAccess,
  authorizeLeaveManagement,
  optionalAuth
}; 