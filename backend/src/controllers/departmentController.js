const Department = require('../models/Department');

// @desc    Get all active departments
// @route   GET /api/departments
// @access  Private
const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).select('name code');
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { getAllDepartments };