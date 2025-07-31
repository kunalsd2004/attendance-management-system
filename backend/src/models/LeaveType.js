const mongoose = require('mongoose');
const { LEAVE_TYPES } = require('../utils/constants');

const leaveTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 5
  },
  type: {
    type: String,
    enum: Object.values(LEAVE_TYPES),
    required: true
  },
  color: {
    type: String,
    required: true,
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  },
  description: {
    type: String,
    trim: true
  },
  maxDays: {
    type: Number,
    required: true,
    min: 0
  },
  carryForward: {
    type: Boolean,
    default: false
  },
  carryForwardLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  requiresApproval: {
    type: Boolean,
    default: true
  },
  requiresDocuments: {
    type: Boolean,
    default: false
  },
  allowHalfDay: {
    type: Boolean,
    default: true
  },
  minAdvanceNoticeDays: {
    type: Number,
    default: 1,
    min: 0
  },
  maxAdvanceApplicationDays: {
    type: Number,
    default: 365,
    min: 1
  },
  maxContinuousDays: {
    type: Number,
    default: null
  },
  applicableToRoles: [{
    type: String,
    enum: ['faculty', 'hod', 'admin', 'principal']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    allowWeekends: {
      type: Boolean,
      default: false
    },
    allowHolidays: {
      type: Boolean,
      default: false
    },
    autoApprove: {
      type: Boolean,
      default: false
    },
    sendEmailNotification: {
      type: Boolean,
      default: true
    },
    allowCancellation: {
      type: Boolean,
      default: true
    },
    cancellationDeadlineDays: {
      type: Number,
      default: 1
    }
  },
  validityPeriod: {
    startMonth: {
      type: Number,
      min: 1,
      max: 12,
      default: 1
    },
    endMonth: {
      type: Number,
      min: 1,
      max: 12,
      default: 12
    }
  },
  statistics: {
    totalApplications: {
      type: Number,
      default: 0
    },
    totalApproved: {
      type: Number,
      default: 0
    },
    totalRejected: {
      type: Number,
      default: 0
    },
    averageDaysPerApplication: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for approval rate
leaveTypeSchema.virtual('approvalRate').get(function() {
  if (this.statistics.totalApplications === 0) return 0;
  return Math.round((this.statistics.totalApproved / this.statistics.totalApplications) * 100);
});

// Virtual for rejection rate
leaveTypeSchema.virtual('rejectionRate').get(function() {
  if (this.statistics.totalApplications === 0) return 0;
  return Math.round((this.statistics.totalRejected / this.statistics.totalApplications) * 100);
});

// Virtual for is currently applicable (based on validity period)
leaveTypeSchema.virtual('isCurrentlyApplicable').get(function() {
  const currentMonth = new Date().getMonth() + 1;
  const { startMonth, endMonth } = this.validityPeriod;
  
  if (startMonth <= endMonth) {
    return currentMonth >= startMonth && currentMonth <= endMonth;
  } else {
    // Handle year wrap-around (e.g., Oct to Feb)
    return currentMonth >= startMonth || currentMonth <= endMonth;
  }
});

// Indexes for better performance
leaveTypeSchema.index({ code: 1 });
leaveTypeSchema.index({ type: 1 });
leaveTypeSchema.index({ isActive: 1 });
leaveTypeSchema.index({ 'applicableToRoles': 1 });

// Pre-save middleware to validate settings
leaveTypeSchema.pre('save', function(next) {
  // Ensure carry forward limit doesn't exceed max days
  if (this.carryForward && this.carryForwardLimit > this.maxDays) {
    this.carryForwardLimit = this.maxDays;
  }
  
  // Ensure validity period is valid
  if (this.validityPeriod.startMonth < 1 || this.validityPeriod.startMonth > 12) {
    this.validityPeriod.startMonth = 1;
  }
  if (this.validityPeriod.endMonth < 1 || this.validityPeriod.endMonth > 12) {
    this.validityPeriod.endMonth = 12;
  }
  
  next();
});

// Method to check if leave type is applicable to a role
leaveTypeSchema.methods.isApplicableToRole = function(role) {
  return this.applicableToRoles.length === 0 || this.applicableToRoles.includes(role);
};

// Method to check if leave type is applicable in current period
leaveTypeSchema.methods.isApplicableNow = function() {
  return this.isCurrentlyApplicable && this.isActive;
};

// Method to validate leave application
leaveTypeSchema.methods.validateApplication = function(applicationData) {
  const errors = [];
  
  // Check advance notice
  const daysDiff = Math.ceil((new Date(applicationData.startDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysDiff < this.minAdvanceNoticeDays) {
    errors.push(`Minimum ${this.minAdvanceNoticeDays} days advance notice required`);
  }
  
  // Check maximum advance application
  if (daysDiff > this.maxAdvanceApplicationDays) {
    errors.push(`Cannot apply more than ${this.maxAdvanceApplicationDays} days in advance`);
  }
  
  // Check maximum continuous days
  if (this.maxContinuousDays && applicationData.workingDays > this.maxContinuousDays) {
    errors.push(`Maximum ${this.maxContinuousDays} continuous days allowed`);
  }
  
  // Check half-day support
  if (!this.allowHalfDay && (applicationData.isStartHalfDay || applicationData.isEndHalfDay)) {
    errors.push('Half-day leave not allowed for this leave type');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Method to update statistics
leaveTypeSchema.methods.updateStatistics = async function() {
  const Leave = mongoose.model('Leave');
  
  const stats = await Leave.aggregate([
    { $match: { leaveType: this._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalDays: { $sum: '$workingDays' }
      }
    }
  ]);
  
  let totalApplications = 0;
  let totalApproved = 0;
  let totalRejected = 0;
  let totalDays = 0;
  
  stats.forEach(stat => {
    totalApplications += stat.count;
    totalDays += stat.totalDays;
    
    if (stat._id === 'approved') {
      totalApproved = stat.count;
    } else if (stat._id === 'rejected') {
      totalRejected = stat.count;
    }
  });
  
  this.statistics.totalApplications = totalApplications;
  this.statistics.totalApproved = totalApproved;
  this.statistics.totalRejected = totalRejected;
  this.statistics.averageDaysPerApplication = totalApplications > 0 ? 
    Math.round((totalDays / totalApplications) * 100) / 100 : 0;
  this.statistics.lastUpdated = new Date();
  
  await this.save();
};

// Static method to find active leave types for role
leaveTypeSchema.statics.findForRole = function(role) {
  return this.find({
    isActive: true,
    $or: [
      { applicableToRoles: { $size: 0 } },
      { applicableToRoles: role }
    ]
  }).sort({ name: 1 });
};

// Static method to find currently applicable leave types
leaveTypeSchema.statics.findCurrentlyApplicable = function(role = null) {
  const currentMonth = new Date().getMonth() + 1;
  
  const query = {
    isActive: true,
    $or: [
      {
        'validityPeriod.startMonth': { $lte: currentMonth },
        'validityPeriod.endMonth': { $gte: currentMonth }
      },
      {
        'validityPeriod.startMonth': { $gt: '$validityPeriod.endMonth' },
        $or: [
          { 'validityPeriod.startMonth': { $lte: currentMonth } },
          { 'validityPeriod.endMonth': { $gte: currentMonth } }
        ]
      }
    ]
  };
  
  if (role) {
    query.$and = [
      {
        $or: [
          { applicableToRoles: { $size: 0 } },
          { applicableToRoles: role }
        ]
      }
    ];
  }
  
  return this.find(query).sort({ name: 1 });
};

// Static method to get leave type statistics
leaveTypeSchema.statics.getOverallStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalTypes: { $sum: 1 },
        activeTypes: {
          $sum: { $cond: ['$isActive', 1, 0] }
        },
        totalApplications: { $sum: '$statistics.totalApplications' },
        totalApproved: { $sum: '$statistics.totalApproved' },
        avgApprovalRate: { $avg: '$approvalRate' }
      }
    }
  ]);
};

module.exports = mongoose.model('LeaveType', leaveTypeSchema); 