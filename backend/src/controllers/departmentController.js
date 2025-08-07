const Department = require('../models/Department');

// @desc    Get all active departments
// @route   GET /api/departments
// @access  Private
const getAllDepartments = async (req, res) => {
  try {
    // Remove isActive filter to get all departments
    const departments = await Department.find({}).select('name code _id');
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { getAllDepartments };