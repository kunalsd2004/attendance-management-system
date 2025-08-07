const express = require('express');
const router = express.Router();
const { getAllDepartments } = require('../controllers/departmentController');
const { authenticate } = require('../middleware/auth');

// @route   GET api/departments
// @desc    Get all active departments
// @access  Private
router.get('/', authenticate, getAllDepartments);

module.exports = router;