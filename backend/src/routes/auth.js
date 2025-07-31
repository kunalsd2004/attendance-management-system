const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { login, logout, refreshToken, getMe, updateProfile, changePassword } = require('../controllers/authController');

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   POST api/auth/logout
// @desc    Logout user
// @access  Public (simplified for development)
router.post('/logout', logout);

// @route   POST api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token', refreshToken);

// @route   GET api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, getMe);

// @route   PUT api/auth/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', authenticate, updateProfile);

// @route   PUT api/auth/change-password
// @desc    Change current user password
// @access  Private
router.put('/change-password', authenticate, changePassword);

// @route   POST api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', (req, res) => {
  res.json({ message: 'Forgot password route - to be implemented' });
});

// @route   POST api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', (req, res) => {
  res.json({ message: 'Reset password route - to be implemented' });
});

module.exports = router; 