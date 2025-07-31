const express = require('express');
const router = express.Router();
const { 
  getAllUsers, 
  createUser, 
  getUserById, 
  updateUser, 
  deleteUser,
  resetUserPassword,
  fixAllUserPasswords
} = require('../controllers/userController');
const { authenticate, authorizeUserAccess } = require('../middleware/auth');

// Add departments route
const departmentController = require('../controllers/departmentController');

// @route   GET api/users
// @desc    Get all users
// @access  Private (Admin/Principal)
router.get('/', authenticate, authorizeUserAccess, getAllUsers);

// @route   GET api/users/test
// @desc    Test endpoint for debugging
// @access  Public
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Users API is working',
    timestamp: new Date().toISOString()
  });
});



// @route   GET api/users/db-test
// @desc    Test database connection
// @access  Public
router.get('/db-test', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.status(200).json({
      success: true,
      message: 'Database connection test',
      connectionState: states[connectionState],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error.message
    });
  }
});

// @route   POST api/users
// @desc    Create new user
// @access  Private (Admin/Principal)
router.post('/', authenticate, authorizeUserAccess, createUser);

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private (Admin/Principal)
router.get('/:id', authenticate, authorizeUserAccess, getUserById);

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private (Admin/Principal)
router.put('/:id', authenticate, authorizeUserAccess, updateUser);

// @route   DELETE api/users/:id
// @desc    Delete user (soft delete)
// @access  Private (Admin/Principal)
router.delete('/:id', authenticate, authorizeUserAccess, deleteUser);

// @route   POST api/users/fix-passwords
// @desc    Fix all user passwords (Admin only)
// @access  Private (Admin only)
router.post('/fix-passwords', authenticate, authorizeUserAccess, fixAllUserPasswords);

// @route   PUT api/users/:id/reset-password
// @desc    Reset user password (Admin only)
// @access  Private (Admin only)
router.put('/:id/reset-password', authenticate, authorizeUserAccess, resetUserPassword);

module.exports = router; 