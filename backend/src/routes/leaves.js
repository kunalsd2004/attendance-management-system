const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getUserLeaves,
  getLeaveTypes,
  getLeaveDetails,
  updateLeave,
  cancelLeave,
  getLeaveBalance,
  getPendingLeaves,
  processLeaveApproval,
  deleteLeaveRequest,
  allocateLeaveBalance,
  bulkAllocateLeaveBalances,
  updateUserLeaveBalances,
  getLeaveBalanceSummary,
  resetLeaveBalances
} = require('../controllers/leaveController');

// @route   GET api/leaves/types
// @desc    Get all leave types
// @access  Private
router.get('/types', getLeaveTypes);

// @route   GET api/leaves/balance
// @desc    Get user's leave balance
// @access  Private
router.get('/balance', getLeaveBalance);

// @route   GET api/leaves
// @desc    Get user's leave requests
// @access  Private
router.get('/', getUserLeaves);

// @route   POST api/leaves
// @desc    Apply for leave
// @access  Private
router.post('/', applyLeave);

// @route   GET api/leaves/test-debug
// @desc    Debug endpoint to verify server is running
// @access  Public
router.get('/test-debug', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Debug endpoint working!',
    timestamp: new Date().toISOString(),
    query: req.query,
    params: req.params
  });
});

// @route   GET api/leaves/pending
// @desc    Get pending approvals
// @access  Private (HOD/Admin)
router.get('/pending', (req, res) => {
  console.log('=== PENDING ENDPOINT HIT ===');
  console.log('Query params:', req.query);
  console.log('Body:', req.body);
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Call the actual function
  getPendingLeaves(req, res);
});

// ============ LEAVE BALANCE MANAGEMENT ROUTES ============

// @route   POST api/leaves/allocate-balance
// @desc    Allocate leave balance to a specific user
// @access  Private (Admin/Principal)
router.post('/allocate-balance', allocateLeaveBalance);

// @route   POST api/leaves/update-user-balances
// @desc    Update multiple leave balances for a single user
// @access  Private (Admin/Principal)
router.post('/update-user-balances', updateUserLeaveBalances);

// @route   POST api/leaves/allocate-bulk
// @desc    Bulk allocate leave balances to all active users
// @access  Private (Admin/Principal)
router.post('/allocate-bulk', bulkAllocateLeaveBalances);

// @route   POST api/leaves/reset-balances
// @desc    Reset user's leave balances
// @access  Private (Admin/Principal)
router.post('/reset-balances', resetLeaveBalances);

// @route   GET api/leaves/balance-summary
// @desc    Get leave balance summary for all users
// @access  Private (Admin/Principal/HOD)
router.get('/balance-summary', getLeaveBalanceSummary);

// @route   GET api/leaves/:id
// @desc    Get specific leave details
// @access  Private
router.get('/:id', getLeaveDetails);

// @route   PUT api/leaves/:id
// @desc    Update leave request
// @access  Private
router.put('/:id', updateLeave);

// @route   DELETE api/leaves/:id
// @desc    Cancel leave request
// @access  Private
router.delete('/:id', cancelLeave);

// @route   PUT api/leaves/:id/process
// @desc    Process leave approval/rejection
// @access  Private (HOD/Principal only)
router.put('/:id/process', processLeaveApproval);

// @route   DELETE api/leaves/:id/admin-delete
// @desc    Delete leave request (Admin only - for mistakes)
// @access  Private (Admin only)
router.delete('/:id/admin-delete', deleteLeaveRequest);

// ============ DEPARTMENT & REPORTING ROUTES ============

// @route   GET api/leaves/department
// @desc    Get department leaves
// @access  Private (HOD/Admin)
router.get('/department/all', (req, res) => {
  res.json({ message: 'Get department leaves - to be implemented' });
});

// @route   GET api/leaves/reports
// @desc    Get leave reports
// @access  Private (HOD/Admin)
router.get('/reports/summary', (req, res) => {
  res.json({ message: 'Get leave reports - to be implemented' });
});

module.exports = router; 