const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin/Principal)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}) // Get all users, both active and inactive
      .populate('profile.department', 'name code')
      .select('-password -passwordResetToken -passwordResetExpires -refreshTokens');

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin/Principal)
const createUser = async (req, res) => {
  try {
    const {
      sdrn,
      email,
      password,
      firstName,
      lastName,
      designation,
      departmentId,
      joiningDate,
      role,
      phoneNumber,
      address
    } = req.body;

    // Validate required fields
    if (!sdrn || !email || !password || !firstName || !lastName || !designation || !joiningDate || !role) {
      return res.status(400).json(formatErrorResponse('All required fields must be provided'));
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json(formatErrorResponse('Password must be at least 6 characters long'));
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { sdrn }]
    });

    if (existingUser) {
      return res.status(400).json(formatErrorResponse('User with this email or SDRN already exists'));
    }

    // Validate department if provided
    if (departmentId && departmentId !== '') {
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        return res.status(400).json(formatErrorResponse('Invalid department ID format'));
      }
    }

    // Create user object
    const userData = {
      sdrn,
      email: email.toLowerCase().trim(),
      password: password.trim(), // Ensure password is trimmed
      profile: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        designation: designation.trim(),
        department: departmentId || null,
        joiningDate: new Date(joiningDate),
        phoneNumber: phoneNumber?.trim() || null,
        address: address || null
      },
      role: role.toLowerCase()
    };

    const user = new User(userData);
    await user.save();

    // Verify the user was created correctly
    const createdUser = await User.findById(user._id).select('+password');
    if (!createdUser) {
      throw new Error('User creation failed');
    }

    // Verify password was hashed
    if (!createdUser.password.startsWith('$2b$')) {
      console.error(`❌ CRITICAL: Password not hashed for newly created user: ${createdUser.email}`);
      // Re-hash the password
      createdUser.password = password.trim();
      await createdUser.save();
    }

    // Return user without password
    const userResponse = createdUser.toJSON();

    logger.info(`New user created successfully: ${createdUser.sdrn} (${createdUser.email})`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });

  } catch (error) {
    logger.error('Create user error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json(formatErrorResponse('Validation error: ' + error.message));
    }
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin/Principal)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('profile.department', 'name code')
      .select('-password -passwordResetToken -passwordResetExpires -refreshTokens');

    if (!user) {
      return res.status(404).json(formatErrorResponse('User not found'));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin/Principal)
const updateUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      designation,
      departmentId,
      role,
      isActive,
      phoneNumber,
      gender,
      joiningDate,
      email,
      sdrn
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json(formatErrorResponse('User not found'));
    }

    // Update fields
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (designation) user.profile.designation = designation;
    if (departmentId) user.profile.department = departmentId;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (phoneNumber) user.profile.phoneNumber = phoneNumber;
    if (gender) user.profile.gender = gender;
    if (joiningDate) user.profile.joiningDate = new Date(joiningDate);
    if (email) user.email = email.toLowerCase().trim();
    if (sdrn) user.sdrn = sdrn;

    await user.save();

    const userResponse = user.toJSON();

    logger.info(`User updated: ${user.sdrn}`);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: userResponse
    });

  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Delete user (soft delete)
// @route   DELETE /api/users/:id
// @access  Private (Admin/Principal)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json(formatErrorResponse('User not found'));
    }

    // Clean up related data before deleting the user
    const Leave = require('../models/Leave');
    const Department = require('../models/Department');

    // Delete all leave applications by this user
    await Leave.deleteMany({ applicant: req.params.id });

    // Remove user from department faculty arrays
    await Department.updateMany(
      { faculty: req.params.id },
      { $pull: { faculty: req.params.id } }
    );

    // Clear HOD reference if this user was an HOD
    await Department.updateMany(
      { hod: req.params.id },
      { $unset: { hod: 1 } }
    );

    // Remove user from leave approval records
    await Leave.updateMany(
      { 'approvals.approver': req.params.id },
      { $pull: { approvals: { approver: req.params.id } } }
    );

    // Actually delete the user from the database
    await User.findByIdAndDelete(req.params.id);

    logger.info(`User permanently deleted: ${user.sdrn} (${user.email})`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Reset user password (Admin only)
// @route   PUT /api/users/:id/reset-password
// @access  Private (Admin only)
const resetUserPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.params.id;

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json(formatErrorResponse('Password must be at least 6 characters long'));
    }

    // Find user
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json(formatErrorResponse('User not found'));
    }

    // Reset password
    user.password = password.trim();
    await user.save();

    // Verify password was hashed correctly
    const updatedUser = await User.findById(userId).select('+password');
    if (!updatedUser.password.startsWith('$2b$')) {
      console.error(`❌ CRITICAL: Password not hashed after reset for user: ${updatedUser.email}`);
      // Re-hash the password
      updatedUser.password = password.trim();
      await updatedUser.save();
    }

    logger.info(`Password reset for user: ${user.sdrn} (${user.email})`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    logger.error('Reset password error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json(formatErrorResponse('Validation error: ' + error.message));
    }
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Fix all user passwords (Admin only)
// @route   POST /api/users/fix-passwords
// @access  Private (Admin only)
const fixAllUserPasswords = async (req, res) => {
  try {
    const { defaultPassword = 'password123' } = req.body;

    // Validate password
    if (!defaultPassword || defaultPassword.length < 6) {
      return res.status(400).json(formatErrorResponse('Default password must be at least 6 characters long'));
    }

    // Get all users
    const allUsers = await User.find({}).select('+password');
    console.log(`🔧 Fixing passwords for ${allUsers.length} users`);

    let fixedCount = 0;
    let alreadyWorkingCount = 0;

    for (const user of allUsers) {
      // Check if password works with default password
      const passwordWorks = await user.comparePassword(defaultPassword);
      
      if (!passwordWorks) {
        console.log(`🔧 Fixing password for user: ${user.email}`);
        user.password = defaultPassword.trim();
        await user.save();
        fixedCount++;
      } else {
        console.log(`✅ Password already working for user: ${user.email}`);
        alreadyWorkingCount++;
      }
    }

    logger.info(`Password fix completed. Fixed: ${fixedCount}, Already working: ${alreadyWorkingCount}`);

    res.status(200).json({
      success: true,
      message: 'Password fix completed',
      data: {
        totalUsers: allUsers.length,
        fixedCount,
        alreadyWorkingCount
      }
    });

  } catch (error) {
    logger.error('Fix passwords error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

module.exports = {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  resetUserPassword,
  fixAllUserPasswords
}; 