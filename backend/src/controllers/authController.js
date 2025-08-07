const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json(formatErrorResponse('Email and password are required'));
    }

    // Find user by email
    const user = await User.findOne({ email, isActive: true })
      .populate('profile.department', 'name code')
      .select('+password');

    if (!user) {
      return res.status(401).json(formatErrorResponse('Invalid credentials'));
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json(formatErrorResponse('Invalid credentials'));
    }

    // Simple response without JWT for testing
    const userResponse = {
      _id: user._id,
      sdrn: user.sdrn,
      email: user.email,
      role: user.role,
      profile: {
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        designation: user.profile?.designation,
        phoneNumber: user.profile?.phoneNumber,
        department: user.profile?.department ? {
          name: user.profile.department.name,
          code: user.profile.department.code
        } : null
      },
      isActive: user.isActive
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        accessToken: 'test-token-' + user.email + '-' + Date.now()
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private (simplified for development)
const logout = async (req, res) => {
  try {
    // Clear any cookies (if they exist)
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    logger.info('User logout successful');

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json(formatErrorResponse('Refresh token not provided'));
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user and check if refresh token exists
    const user = await User.findOne({
      _id: decoded.userId,
      'refreshTokens.token': refreshToken,
      isActive: true
    });

    if (!user) {
      return res.status(401).json(formatErrorResponse('Invalid refresh token'));
    }

    // Generate new access token
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId
    };

    const newAccessToken = generateAccessToken(payload);

            // Remove sensitive data
        const userResponse = {
          _id: user._id,
          employeeId: user.employeeId,
          email: user.email,
          role: user.role,
          profile: user.profile,
          leaveBalances: user.currentLeaveBalances || [],
          isActive: user.isActive,
          lastLogin: user.lastLogin
        };

    res.status(200).json(formatSuccessResponse({
      message: 'Token refreshed successfully',
      user: userResponse,
      accessToken: newAccessToken,
      expiresIn: '15m'
    }));

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json(formatErrorResponse('Invalid refresh token'));
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json(formatErrorResponse('User not found'));
    }

    res.status(200).json(formatSuccessResponse({
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        profile: user.profile,
        leaveBalances: user.currentLeaveBalances || [],
        isActive: user.isActive,
        lastLogin: user.lastLogin
      }
    }));

  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      address
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(formatErrorResponse('User not found'));
    }

    // Update profile fields
    if (firstName !== undefined) user.profile.firstName = firstName;
    if (lastName !== undefined) user.profile.lastName = lastName;
    if (phoneNumber !== undefined) user.profile.phoneNumber = phoneNumber;
    if (address !== undefined) user.profile.address = address;

    await user.save();

    // Return updated user without sensitive data
    const userResponse = {
      _id: user._id,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
      profile: user.profile,
      isActive: user.isActive
    };

    logger.info(`User profile updated: ${user.employeeId}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: userResponse
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json(formatErrorResponse('Validation error: ' + error.message));
    }
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Change current user password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json(formatErrorResponse('Current password and new password are required'));
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json(formatErrorResponse('New password must be at least 6 characters long'));
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json(formatErrorResponse('User not found'));
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json(formatErrorResponse('Current password is incorrect'));
    }

    // Update password - this should trigger the pre-save middleware to hash it
    user.password = newPassword;
    user.markModified('password'); // Ensure Mongoose knows the password field was modified
    await user.save();

    logger.info(`Password changed for user: ${user.employeeId}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Change password error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json(formatErrorResponse('Validation error: ' + error.message));
    }
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

module.exports = {
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  changePassword
}; 