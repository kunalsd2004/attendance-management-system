const mongoose = require('mongoose');
const { HOLIDAY_TYPES } = require('../utils/constants');

const holidaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: Object.values(HOLIDAY_TYPES),
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  isOptional: {
    type: Boolean,
    default: false
  },
  applicableTo: {
    departments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    }],
    roles: [{
      type: String,
      enum: ['faculty', 'hod', 'admin', 'principal']
    }],
    locations: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: {
      type: String,
      enum: ['yearly', 'monthly', 'custom'],
      default: 'yearly'
    },
    interval: {
      type: Number,
      default: 1,
      min: 1
    },
    endDate: Date,
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    monthDay: {
      type: Number,
      min: 1,
      max: 31
    }
  },
  compensatoryWorkingDay: {
    isRequired: {
      type: Boolean,
      default: false
    },
    date: Date,
    reason: String
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    source: {
      type: String,
      enum: ['manual', 'import', 'system'],
      default: 'manual'
    },
    externalId: String,
    tags: [String]
  },
  notifications: {
    reminderDays: {
      type: [Number],
      default: [7, 1]
    },
    lastReminderSent: Date,
    notificationsSent: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for is upcoming (within next 30 days)
holidaySchema.virtual('isUpcoming').get(function() {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
  return this.date >= today && this.date <= thirtyDaysFromNow;
});

// Virtual for is past
holidaySchema.virtual('isPast').get(function() {
  return this.date < new Date();
});

// Virtual for days until holiday
holidaySchema.virtual('daysUntil').get(function() {
  const today = new Date();
  const diffTime = this.date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for formatted date
holidaySchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Indexes for better performance
holidaySchema.index({ date: 1 });
holidaySchema.index({ type: 1, date: 1 });
holidaySchema.index({ isActive: 1, date: 1 });
holidaySchema.index({ 'applicableTo.departments': 1 });
holidaySchema.index({ 'applicableTo.roles': 1 });

// Compound index for date range queries
holidaySchema.index({ date: 1, isActive: 1 });

// Pre-save middleware to handle recurring holidays
holidaySchema.pre('save', function(next) {
  // Ensure date is set to start of day for consistency
  if (this.isModified('date')) {
    this.date.setHours(0, 0, 0, 0);
  }
  
  // Set default reminder days if not specified
  if (!this.notifications.reminderDays.length) {
    this.notifications.reminderDays = [7, 1];
  }
  
  next();
});

// Method to check if holiday is applicable to a department
holidaySchema.methods.isApplicableToDepartment = function(departmentId) {
  if (this.applicableTo.departments.length === 0) return true;
  return this.applicableTo.departments.some(dept => dept.toString() === departmentId.toString());
};

// Method to check if holiday is applicable to a role
holidaySchema.methods.isApplicableToRole = function(role) {
  if (this.applicableTo.roles.length === 0) return true;
  return this.applicableTo.roles.includes(role);
};

// Method to check if holiday is applicable to a user
holidaySchema.methods.isApplicableToUser = function(user) {
  const deptApplicable = this.isApplicableToDepartment(user.profile.department);
  const roleApplicable = this.isApplicableToRole(user.role);
  return deptApplicable && roleApplicable;
};

// Method to generate next occurrence for recurring holidays
holidaySchema.methods.generateNextOccurrence = function() {
  if (!this.isRecurring) return null;
  
  const currentDate = new Date(this.date);
  let nextDate = new Date(currentDate);
  
  switch (this.recurringPattern.type) {
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + this.recurringPattern.interval);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + this.recurringPattern.interval);
      break;
    default:
      return null;
  }
  
  // Check if we've reached the end date
  if (this.recurringPattern.endDate && nextDate > this.recurringPattern.endDate) {
    return null;
  }
  
  return nextDate;
};

// Method to check if reminder should be sent
holidaySchema.methods.shouldSendReminder = function() {
  const daysUntil = this.daysUntil;
  const lastSent = this.notifications.lastReminderSent;
  
  // Check if any reminder day matches
  const shouldSend = this.notifications.reminderDays.includes(daysUntil);
  
  if (!shouldSend) return false;
  
  // Check if reminder was already sent today
  if (lastSent) {
    const today = new Date();
    const lastSentDate = new Date(lastSent);
    if (today.toDateString() === lastSentDate.toDateString()) {
      return false;
    }
  }
  
  return true;
};

// Method to mark reminder as sent
holidaySchema.methods.markReminderSent = function() {
  this.notifications.lastReminderSent = new Date();
  this.notifications.notificationsSent += 1;
  return this.save();
};

// Static method to find holidays in date range
holidaySchema.statics.findInDateRange = function(startDate, endDate, filters = {}) {
  const query = {
    ...filters,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    isActive: true
  };
  
  return this.find(query).sort({ date: 1 });
};

// Static method to find upcoming holidays
holidaySchema.statics.findUpcoming = function(days = 30, filters = {}) {
  const today = new Date();
  const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return this.findInDateRange(today, futureDate, filters);
};

// Static method to find holidays by type
holidaySchema.statics.findByType = function(type, year = null) {
  const query = { type, isActive: true };
  
  if (year) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    query.date = { $gte: startOfYear, $lte: endOfYear };
  }
  
  return this.find(query).sort({ date: 1 });
};

// Static method to find holidays for department
holidaySchema.statics.findForDepartment = function(departmentId, startDate = null, endDate = null) {
  const query = {
    isActive: true,
    $or: [
      { 'applicableTo.departments': { $size: 0 } },
      { 'applicableTo.departments': departmentId }
    ]
  };
  
  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  
  return this.find(query).sort({ date: 1 });
};

// Static method to find holidays requiring reminders
holidaySchema.statics.findRequiringReminders = function() {
  const today = new Date();
  const maxReminderDays = Math.max(...[7, 1]); // Default reminder days
  const maxDate = new Date(today.getTime() + (maxReminderDays * 24 * 60 * 60 * 1000));
  
  return this.find({
    isActive: true,
    date: { $gte: today, $lte: maxDate }
  }).sort({ date: 1 });
};

// Static method to get holiday statistics
holidaySchema.statics.getStatistics = function(year = new Date().getFullYear()) {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31);
  
  return this.aggregate([
    {
      $match: {
        date: { $gte: startOfYear, $lte: endOfYear },
        isActive: true
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        holidays: { $push: { name: '$name', date: '$date' } }
      }
    },
    {
      $project: {
        type: '$_id',
        count: 1,
        holidays: { $slice: ['$holidays', 5] } // Limit to 5 for preview
      }
    }
  ]);
};

module.exports = mongoose.model('Holiday', holidaySchema); 