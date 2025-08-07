const mongoose = require('mongoose');
const { USER_ROLES } = require('../utils/constants');

const userSchema = new mongoose.Schema({
  sdrn: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    designation: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: function() {
        // Department is required for faculty and hod roles
        // Admin and principal roles don't need departments
        return this.role === 'faculty' || this.role === 'hod';
      },
      validate: {
        validator: function(departmentId) {
          // If role requires department, departmentId must be provided
          if ((this.role === 'faculty' || this.role === 'hod') && !departmentId) {
            return false;
          }
          // If role doesn't require department, departmentId can be null
          if ((this.role === 'admin' || this.role === 'principal') && departmentId) {
            return false;
          }
          return true;
        },
        message: function(props) {
          if (props.value && (this.role === 'admin' || this.role === 'principal')) {
            return 'Admin and Principal users should not have a department assigned';
          }
          if (!props.value && (this.role === 'faculty' || this.role === 'hod')) {
            return 'Faculty and HOD users must have a department assigned';
          }
          return 'Invalid department assignment';
        }
      }
    },
    joiningDate: {
      type: Date,
      required: true
    },
    profileImage: {
      type: String,
      default: null
    },
    phoneNumber: {
      type: String,
      trim: true
    },
    gender: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    }
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.FACULTY
  },
  leaveBalances: [{
    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true
    },
    allocated: {
      type: Number,
      required: true,
      min: 0
    },
    used: {
      type: Number,
      default: 0,
      min: 0
    },
    remaining: {
      type: Number,
      required: true,
      min: 0
    },
    year: {
      type: Number,
      required: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('profile.fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Virtual for current year leave balances
userSchema.virtual('currentLeaveBalances').get(function() {
  const currentYear = new Date().getFullYear();
  return this.leaveBalances ? this.leaveBalances.filter(balance => balance.year === currentYear) : [];
});

// Index for better query performance
userSchema.index({ sdrn: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'profile.department': 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware to hash password and assign departments
userSchema.pre('save', async function(next) {
  // Hash password if modified or if it's a new user
  if (this.isModified('password') || this.isNew) {
    const bcrypt = require('bcryptjs');
    try {
      // Ensure password is not already hashed
      if (!this.password.startsWith('$2b$')) {
        this.password = await bcrypt.hash(this.password, 12);
        console.log(`🔐 Password hashed for user: ${this.email}`);
      } else {
        console.log(`🔐 Password already hashed for user: ${this.email}`);
      }
    } catch (error) {
      console.error(`❌ Password hashing failed for user: ${this.email}`, error);
      return next(error);
    }
  }
  
  // Auto-assign departments for new users based on role
  if (this.isNew && !this.profile.department) {
    const Department = require('./Department');
    
    try {
      if (this.role === 'hod') {
        // HOD users get IT department
        const itDepartment = await Department.findOne({ code: 'IT', isActive: true });
        if (itDepartment) {
          this.profile.department = itDepartment._id;
          console.log(`🏢 Assigned IT department to HOD user: ${this.email}`);
        } else {
          console.warn(`⚠️  No IT department found for HOD user: ${this.email}`);
        }
      } else if (this.role === 'faculty') {
        // Faculty users get random department (excluding IT)
        const availableDepartments = await Department.find({ 
          code: { $ne: 'IT' }, 
          isActive: true 
        });
        if (availableDepartments.length > 0) {
          const randomDept = availableDepartments[Math.floor(Math.random() * availableDepartments.length)];
          this.profile.department = randomDept._id;
          console.log(`🏢 Assigned ${randomDept.name} department to faculty user: ${this.email}`);
        } else {
          console.warn(`⚠️  No available departments found for faculty user: ${this.email}`);
        }
      }
      // Admin and Principal users don't get departments (null is fine)
    } catch (error) {
      console.error(`❌ Error auto-assigning department for user: ${this.email}`, error);
      // Don't fail the save, just log the error
    }
  }
  
  next();
});

// Post-save middleware to verify password was hashed correctly
userSchema.post('save', async function(doc) {
  // Verify password was hashed correctly
  if (doc.password && !doc.password.startsWith('$2b$')) {
    console.error(`❌ CRITICAL: Password not hashed for user: ${doc.email}`);
    // Re-hash the password
    const bcrypt = require('bcryptjs');
    try {
      doc.password = await bcrypt.hash(doc.password, 12);
      await doc.save();
      console.log(`🔧 Fixed unhashed password for user: ${doc.email}`);
    } catch (error) {
      console.error(`❌ Failed to fix unhashed password for user: ${doc.email}`, error);
    }
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get leave balance for a specific type
userSchema.methods.getLeaveBalance = function(leaveTypeId, year = new Date().getFullYear()) {
  return this.leaveBalances.find(
    balance => balance.leaveType.toString() === leaveTypeId.toString() && balance.year === year
  );
};

// Method to update leave balance
userSchema.methods.updateLeaveBalance = function(leaveTypeId, usedDays, year = new Date().getFullYear()) {
  const balance = this.getLeaveBalance(leaveTypeId, year);
  if (balance) {
    balance.used += usedDays;
    balance.remaining = Math.max(0, balance.allocated - balance.used);
  }
  return this.save();
};

// Method to check if user can take leave
userSchema.methods.canTakeLeave = function(leaveTypeId, requestedDays, year = new Date().getFullYear()) {
  const balance = this.getLeaveBalance(leaveTypeId, year);
  return balance && balance.remaining >= requestedDays;
};

// Method to update user department
userSchema.methods.updateDepartment = async function(departmentId) {
  const Department = require('./Department');
  
  // Validate department exists
  if (departmentId) {
    const department = await Department.findById(departmentId);
    if (!department) {
      throw new Error('Department not found');
    }
  }
  
  // Update department
  this.profile.department = departmentId;
  return this.save();
};

// Method to get department name
userSchema.methods.getDepartmentName = async function() {
  if (!this.profile.department) {
    return null;
  }
  
  const Department = require('./Department');
  const department = await Department.findById(this.profile.department);
  return department ? department.name : null;
};

// Static method to find users by department
userSchema.statics.findByDepartment = function(departmentId) {
  return this.find({ 'profile.department': departmentId, isActive: true });
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.refreshTokens;
  return userObject;
};

module.exports = mongoose.model('User', userSchema); 