const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
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
    maxlength: 10
  },
  description: {
    type: String,
    trim: true
  },
  hod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  faculty: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    maxLeaveRequestsPerMonth: {
      type: Number,
      default: 5
    },
    requiresHODApproval: {
      type: Boolean,
      default: true
    },
    autoApproveOnDutyLeave: {
      type: Boolean,
      default: false
    },
    minAdvanceNoticeDays: {
      type: Number,
      default: 1
    },
    maxContinuousLeaveDays: {
      type: Number,
      default: 30
    }
  },
  leaveApprovalWorkflow: [{
    level: {
      type: Number,
      required: true
    },
    role: {
      type: String,
      required: true
    },
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  statistics: {
    totalFaculty: {
      type: Number,
      default: 0
    },
    averageLeavePerMonth: {
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

// Virtual for faculty count
departmentSchema.virtual('facultyCount').get(function() {
  if (!this.faculty || !Array.isArray(this.faculty)) {
    return 0;
  }
  return this.faculty.length;
});

// Virtual for active faculty
departmentSchema.virtual('activeFacultyCount').get(function() {
  // This would need to be populated to work properly
  if (!this.faculty || !Array.isArray(this.faculty)) {
    return 0;
  }
  return this.faculty.filter(f => f && f.isActive).length;
});

// Indexes for better performance
departmentSchema.index({ code: 1 });
departmentSchema.index({ name: 1 });
departmentSchema.index({ hod: 1 });
departmentSchema.index({ isActive: 1 });

// Pre-save middleware to update statistics
departmentSchema.pre('save', function(next) {
  if (this.isModified('faculty')) {
    this.statistics.totalFaculty = this.faculty.length;
    this.statistics.lastUpdated = new Date();
  }
  next();
});

// Method to add faculty member
departmentSchema.methods.addFaculty = function(userId) {
  if (!this.faculty.includes(userId)) {
    this.faculty.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove faculty member
departmentSchema.methods.removeFaculty = function(userId) {
  this.faculty = this.faculty.filter(id => id.toString() !== userId.toString());
  return this.save();
};

// Method to set HOD
departmentSchema.methods.setHOD = function(userId) {
  this.hod = userId;
  // Ensure HOD is also in faculty list
  if (!this.faculty.includes(userId)) {
    this.faculty.push(userId);
  }
  return this.save();
};

// Method to get approval workflow for leave type
departmentSchema.methods.getApprovalWorkflow = function(leaveType) {
  // Return default workflow if none specified
  if (!this.leaveApprovalWorkflow.length) {
    return [
      { level: 1, role: 'hod', isRequired: true }
    ];
  }
  return this.leaveApprovalWorkflow.sort((a, b) => a.level - b.level);
};

// Static method to find departments with HOD
departmentSchema.statics.findWithHOD = function() {
  return this.find({ hod: { $ne: null }, isActive: true }).populate('hod');
};

// Static method to get department statistics
departmentSchema.statics.getStatistics = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalDepartments: { $sum: 1 },
        totalFaculty: { $sum: '$statistics.totalFaculty' },
        averageFacultyPerDept: { $avg: '$statistics.totalFaculty' }
      }
    }
  ]);
};

// Static method to find by code
departmentSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase(), isActive: true });
};

// Method to update leave statistics
departmentSchema.methods.updateLeaveStatistics = async function() {
  const Leave = mongoose.model('Leave');
  const stats = await Leave.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'applicant',
        foreignField: '_id',
        as: 'applicantInfo'
      }
    },
    {
      $match: {
        'applicantInfo.profile.department': this._id,
        appliedAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1)
        }
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$appliedAt' },
          year: { $year: '$appliedAt' }
        },
        totalLeaves: { $sum: 1 },
        totalDays: { $sum: '$workingDays' }
      }
    },
    {
      $group: {
        _id: null,
        avgLeavesPerMonth: { $avg: '$totalLeaves' }
      }
    }
  ]);

  if (stats.length > 0) {
    this.statistics.averageLeavePerMonth = Math.round(stats[0].avgLeavesPerMonth * 100) / 100;
    this.statistics.lastUpdated = new Date();
    await this.save();
  }
};

module.exports = mongoose.model('Department', departmentSchema); 