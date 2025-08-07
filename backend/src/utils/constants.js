// User roles
const USER_ROLES = {
  FACULTY: 'faculty',
  HOD: 'hod',
  ADMIN: 'admin',
  PRINCIPAL: 'principal'
};

// Leave statuses
const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

// Leave types
const LEAVE_TYPES = {
  CASUAL: 'casual',
  MEDICAL: 'medical',
  VACATION: 'vacation',
  COMPENSATORY_OFF: 'compensatory_off',
  ON_DUTY: 'on_duty',
  SPECIAL: 'special'
};

// Holiday types
const HOLIDAY_TYPES = {
  NATIONAL: 'national',
  REGIONAL: 'regional',
  INSTITUTIONAL: 'institutional'
};

// Approval status
const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Email templates
const EMAIL_TEMPLATES = {
  LEAVE_APPLICATION: 'leave_application',
  LEAVE_APPROVAL: 'leave_approval',
  LEAVE_REJECTION: 'leave_rejection',
  LEAVE_CANCELLATION: 'leave_cancellation',
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_CREATION: 'account_creation'
};

// Notification types
const NOTIFICATION_TYPES = {
  LEAVE_APPLIED: 'leave_applied',
  LEAVE_APPROVED: 'leave_approved',
  LEAVE_REJECTED: 'leave_rejected',
  LEAVE_CANCELLED: 'leave_cancelled',
  LEAVE_REMINDER: 'leave_reminder'
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// API Response codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

// Default leave balances (per year)
const DEFAULT_LEAVE_BALANCES = {
  [LEAVE_TYPES.CASUAL]: 12,        // 1 per month = 12 per year
  [LEAVE_TYPES.MEDICAL]: 10,       // 10 per year
  [LEAVE_TYPES.VACATION]: 0,       // Set to 0 as requested
  [LEAVE_TYPES.COMPENSATORY_OFF]: 0, // Set to 0 as requested
  [LEAVE_TYPES.ON_DUTY]: 5,        // 5 days for On-Duty Leave
  [LEAVE_TYPES.SPECIAL]: 0         // Set to 0 as requested
};

// Leave type configurations
const LEAVE_TYPE_CONFIG = {
  [LEAVE_TYPES.CASUAL]: {
    name: 'Casual Leave',
    code: 'CL',
    color: '#ff8c42',
    maxDays: 12,
    carryForward: false,
    requiresApproval: true
  },
  [LEAVE_TYPES.MEDICAL]: {
    name: 'Medical Leave',
    code: 'ML',
    color: '#00796b',
    maxDays: 10,         // Updated to match new allocation
    carryForward: false,
    requiresApproval: true
  },
  [LEAVE_TYPES.VACATION]: {
    name: 'Vacation Leave',
    code: 'VL',
    color: '#1976d2',
    maxDays: 0,          // Set to 0 as requested
    carryForward: false,
    requiresApproval: true
  },
  [LEAVE_TYPES.COMPENSATORY_OFF]: {
    name: 'Compensatory Off',
    code: 'CO',
    color: '#8c1d40',
    maxDays: 0,          // Set to 0 as requested
    carryForward: false,
    requiresApproval: true
  },
  [LEAVE_TYPES.ON_DUTY]: {
    name: 'On Duty Leave',
    code: 'OD',
    color: '#d9534f',
    maxDays: 5,          // 5 days for On-Duty Leave
    carryForward: false,
    requiresApproval: true
  },
  [LEAVE_TYPES.SPECIAL]: {
    name: 'Special Leave',
    code: 'SL',
    color: '#6c757d',
    maxDays: 0,          // Set to 0 as requested
    carryForward: false,
    requiresApproval: true
  }
};

module.exports = {
  USER_ROLES,
  LEAVE_STATUS,
  LEAVE_TYPES,
  HOLIDAY_TYPES,
  APPROVAL_STATUS,
  EMAIL_TEMPLATES,
  NOTIFICATION_TYPES,
  PAGINATION,
  HTTP_STATUS,
  DEFAULT_LEAVE_BALANCES,
  LEAVE_TYPE_CONFIG
}; 