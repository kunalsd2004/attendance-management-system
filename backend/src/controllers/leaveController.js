const Leave = require('../models/Leave');
const LeaveType = require('../models/LeaveType');
const User = require('../models/User');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');
const { LEAVE_STATUS, APPROVAL_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

// Helper function to calculate working days
const calculateWorkingDays = (startDate, endDate, isStartHalfDay = false, isEndHalfDay = false) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) return 0;
  
  let count = 0;
  const currentDate = new Date(start.getTime());
  
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Handle half days
  let deduction = 0;
  if (isStartHalfDay) deduction += 0.5;
  if (isEndHalfDay && startDate !== endDate) {
    deduction += 0.5;
  } else if (isEndHalfDay && startDate === endDate) {
    if (isStartHalfDay) {
      deduction = 0.5;
      count = 0.5;
    }
  }
  
  return Math.max(0, count - deduction);
};

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private
const applyLeave = async (req, res) => {
  try {
    const {
      leaveType,
      startDate,
      endDate,
      startHalfDay = false,
      endHalfDay = false,
      reason,
      emergencyContact
    } = req.body;

    // For simplified auth, we'll get user ID from request body for now
    // In production, this would come from JWT token
    const userId = req.body.userId || '6885cc2f8057ec72790446f8'; // Default to faculty user for testing

    // Validate required fields
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json(formatErrorResponse('All required fields must be provided'));
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(formatErrorResponse('User not found'));
    }

    // Find leave type by name (for now, we'll create simple mapping)
    const leaveTypeMapping = {
      'Vacation': 'vacation',
      'Casual': 'casual',
      'Medical': 'medical',
      'CompensatoryOff': 'compensatory_off',
      'Urgent': 'urgent',
      'Special': 'special'
    };

    let leaveTypeDoc = await LeaveType.findOne({ 
      type: leaveTypeMapping[leaveType] || leaveType.toLowerCase()
    });

    // If leave type doesn't exist, create a basic one
    if (!leaveTypeDoc) {
      leaveTypeDoc = await LeaveType.create({
        name: leaveType + ' Leave',
        code: leaveType.substring(0, 2).toUpperCase(),
        type: leaveTypeMapping[leaveType] || leaveType.toLowerCase(),
        color: '#ff8c42',
        maxDays: 30,
        carryForward: false,
        requiresApproval: true,
        allowHalfDay: true,
        applicableToRoles: ['faculty', 'hod', 'admin', 'principal'],
        isActive: true
      });
    }

    // Calculate working days
    const workingDays = calculateWorkingDays(startDate, endDate, startHalfDay, endHalfDay);
    const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;

    // ✅ BALANCE VALIDATION - Check if user has sufficient leave balance
    const currentYear = new Date().getFullYear();
    
    // Find user's balance for this leave type
    const userBalance = user.leaveBalances.find(
      balance => balance.leaveType.toString() === leaveTypeDoc._id.toString() && balance.year === currentYear
    );

    if (!userBalance) {
      return res.status(400).json(formatErrorResponse(
        `No leave balance allocated for ${leaveTypeDoc.name} in ${currentYear}. Please contact Principal.`
      ));
    }

    // Check if requested days exceed remaining balance
    if (workingDays > userBalance.remaining) {
      return res.status(400).json(formatErrorResponse(
        `Insufficient leave balance. You have ${userBalance.remaining} days remaining for ${leaveTypeDoc.name}, but requested ${workingDays} days.`
      ));
    }

    // Check if leave type is active (has allocated days > 0)
    if (userBalance.allocated === 0) {
      return res.status(400).json(formatErrorResponse(
        `${leaveTypeDoc.name} is not available. No days allocated for this leave type.`
      ));
    }

    // Create leave application
    const leaveApplication = new Leave({
      applicant: userId,
      leaveType: leaveTypeDoc._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isStartHalfDay: startHalfDay,
      isEndHalfDay: endHalfDay,
      totalDays,
      workingDays,
      reason,
      status: LEAVE_STATUS.PENDING,
      emergencyContact: emergencyContact || {},
      appliedAt: new Date()
    });

    await leaveApplication.save();

    // ✅ UPDATE USER'S LEAVE BALANCE - Deduct applied days from remaining balance
    userBalance.used += workingDays;
    userBalance.remaining = Math.max(0, userBalance.allocated - userBalance.used);
    await user.save();

    // Populate the response
    await leaveApplication.populate([
      { path: 'applicant', select: 'profile employeeId' },
      { path: 'leaveType', select: 'name code color' }
    ]);

    logger.info(`Leave application created: ${leaveApplication._id}`, {
      userId,
      leaveType: leaveType,
      workingDays,
      remainingBalance: userBalance.remaining
    });

    res.status(201).json(formatSuccessResponse(
      'Leave application submitted successfully',
      { 
        leave: leaveApplication,
        remainingBalance: {
          leaveType: leaveTypeDoc.name,
          used: userBalance.used,
          remaining: userBalance.remaining,
          allocated: userBalance.allocated
        }
      }
    ));

  } catch (error) {
    logger.error('Apply leave error:', error);
    console.error('Detailed error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json(formatErrorResponse('Internal server error: ' + error.message));
  }
};

// @desc    Get user's leave requests  
// @route   GET /api/leaves
// @access  Private
const getUserLeaves = async (req, res) => {
  try {
    // Get userId from query parameters - if not provided, return all leaves
    const userId = req.query.userId || req.body.userId;
    
    let query = { status: { $ne: 'cancelled' } }; // Exclude cancelled leaves
    if (userId) {
      query.applicant = userId;
    }
    
    const leaves = await Leave.find(query)
      .populate('leaveType', 'name code color')
      .populate({
        path: 'applicant',
        select: 'profile employeeId role',
        populate: {
          path: 'profile.department',
          select: 'name code'
        }
      })
      .sort({ appliedAt: -1 });

    res.status(200).json(formatSuccessResponse(
      userId ? 'User leaves retrieved successfully' : 'All leaves retrieved successfully',
      { leaves, total: leaves.length }
    ));

  } catch (error) {
    logger.error('Get user leaves error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Get all leave types
// @route   GET /api/leaves/types
// @access  Private
const getLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find({ isActive: true })
      .select('name code color type maxDays allowHalfDay');

    res.status(200).json(formatSuccessResponse(
      'Leave types retrieved successfully',
      { leaveTypes }
    ));

  } catch (error) {
    logger.error('Get leave types error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Get specific leave details
// @route   GET /api/leaves/:id
// @access  Private
const getLeaveDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const leave = await Leave.findById(id)
      .populate({
        path: 'applicant',
        select: 'profile employeeId',
        populate: {
          path: 'profile.department',
          select: 'name code'
        }
      })
      .populate('leaveType', 'name code color')
      .populate({
        path: 'approvals.approver',
        select: 'profile employeeId',
        populate: {
          path: 'profile.department',
          select: 'name code'
        }
      });

    if (!leave) {
      return res.status(404).json(formatErrorResponse('Leave request not found'));
    }

    res.status(200).json(formatSuccessResponse(
      'Leave details retrieved successfully',
      { leave }
    ));

  } catch (error) {
    logger.error('Get leave details error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Update leave request
// @route   PUT /api/leaves/:id
// @access  Private
const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updates.applicant;
    delete updates.status;
    delete updates.approvals;
    
    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json(formatErrorResponse('Leave request not found'));
    }

    // Only allow updates if leave is still pending
    if (leave.status !== LEAVE_STATUS.PENDING) {
      return res.status(400).json(formatErrorResponse('Cannot update processed leave request'));
    }

    // Recalculate working days if dates are updated
    if (updates.startDate || updates.endDate) {
      const startDate = updates.startDate || leave.startDate;
      const endDate = updates.endDate || leave.endDate;
      const isStartHalfDay = updates.isStartHalfDay !== undefined ? updates.isStartHalfDay : leave.isStartHalfDay;
      const isEndHalfDay = updates.isEndHalfDay !== undefined ? updates.isEndHalfDay : leave.isEndHalfDay;
      
      updates.workingDays = calculateWorkingDays(startDate, endDate, isStartHalfDay, isEndHalfDay);
      updates.totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    }

    const updatedLeave = await Leave.findByIdAndUpdate(id, updates, { new: true })
      .populate({
        path: 'applicant',
        select: 'profile employeeId',
        populate: {
          path: 'profile.department',
          select: 'name code'
        }
      })
      .populate('leaveType', 'name code color');

    res.status(200).json(formatSuccessResponse(
      'Leave request updated successfully',
      { leave: updatedLeave }
    ));

  } catch (error) {
    logger.error('Update leave error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Cancel leave request
// @route   DELETE /api/leaves/:id
// @access  Private
const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;
    
    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json(formatErrorResponse('Leave request not found'));
    }

    // Only allow cancellation of pending or approved leaves
    if (![LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED].includes(leave.status)) {
      return res.status(400).json(formatErrorResponse('Cannot cancel this leave request'));
    }

    // ✅ BALANCE RESTORATION - Restore the user's leave balance when cancelling
    const applicant = await User.findById(leave.applicant);
    if (applicant) {
      const currentYear = new Date().getFullYear();
      const userBalance = applicant.leaveBalances.find(
        balance => balance.leaveType.toString() === leave.leaveType.toString() && balance.year === currentYear
      );
      
      if (userBalance) {
        // Restore the balance by reducing used days and increasing remaining days
        userBalance.used = Math.max(0, userBalance.used - leave.workingDays);
        userBalance.remaining = userBalance.allocated - userBalance.used;
        await applicant.save();
        
        logger.info(`Leave balance restored on cancellation: ${leave.workingDays} days returned to user ${applicant.profile.firstName} ${applicant.profile.lastName}`);
      }
    }

    leave.status = LEAVE_STATUS.CANCELLED;
    leave.cancelledAt = new Date();
    leave.cancelReason = cancelReason || 'Cancelled by user';
    
    await leave.save();

    res.status(200).json(formatSuccessResponse(
      'Leave request cancelled successfully'
    ));

  } catch (error) {
    logger.error('Cancel leave error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Get user's leave balance
// @route   GET /api/leaves/balance
// @access  Private
const getLeaveBalance = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId || '6885cc2f8057ec72790446f8'; // Default for testing
    const year = req.query.year || new Date().getFullYear();
    
    const user = await User.findById(userId)
      .populate('leaveBalances.leaveType', 'name code color');

    if (!user) {
      return res.status(404).json(formatErrorResponse('User not found'));
    }

    const currentYearBalances = user.leaveBalances.filter(balance => balance.year == year);

    res.status(200).json(formatSuccessResponse(
      'Leave balances retrieved successfully',
      { balances: currentYearBalances, year: year }
    ));

  } catch (error) {
    logger.error('Get leave balance error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Get pending leaves for approval (HOD/Admin)
// @route   GET /api/leaves/pending
// @access  Private (HOD/Admin)
const getPendingLeaves = async (req, res) => {
  try {
    console.log('getPendingLeaves called');
    
    // Get the current user (HOD/Admin) from request
    // For testing, we'll use a default user ID, but in production this should come from JWT
    const approverId = req.body.approverId || req.query.approverId || '6889176b72077bb94d89e728'; // Default to HOD001 (CS HOD)
    console.log('Approver ID:', approverId);
    
    const approver = await User.findById(approverId).populate('profile.department');
    if (!approver) {
      return res.status(404).json(formatErrorResponse('Approver not found'));
    }
    
    console.log('Approver role:', approver.role);
    console.log('Approver department:', approver.profile.department?.name || 'No Department');

    let query = { 
      status: { $in: [LEAVE_STATUS.PENDING, 'approved', 'rejected'] } // Exclude cancelled leaves
    };

    // If the approver is HOD, only show leaves from their department
    if (approver.role === 'hod' && approver.profile.department) {
      console.log('HOD detected - filtering by department:', approver.profile.department.name);
      
      // Find all users in the same department
      const departmentUsers = await User.find({ 
        'profile.department': approver.profile.department._id,
        isActive: true 
      }).select('_id');
      
      const departmentUserIds = departmentUsers.map(user => user._id);
      console.log('Department user IDs:', departmentUserIds.length);
      
      query.applicant = { $in: departmentUserIds };
    }
    
    // If the approver is Principal, show all requests (can approve HOD, view faculty)
    if (approver.role === 'principal') {
      console.log('Principal detected - showing all requests');
      // Principal can see all pending leaves
    }
    
    // If the approver is Admin, show all requests (for deletion only)
    if (approver.role === 'admin') {
      console.log('Admin detected - showing all requests');
      // Admin can see all pending leaves but cannot approve/reject
    }

    console.log('Query:', JSON.stringify(query));

    const pendingLeaves = await Leave.find(query)
      .populate({
        path: 'applicant',
        select: 'profile employeeId role',
        populate: {
          path: 'profile.department',
          select: 'name code'
        }
      })
      .populate('leaveType', 'name code color')
      .sort({ appliedAt: -1 });

    console.log('Found pending leaves:', pendingLeaves.length);

    res.status(200).json(formatSuccessResponse(
      'Pending leaves retrieved successfully',
      { 
        leaves: pendingLeaves, 
        total: pendingLeaves.length,
        approverRole: approver.role,
        approverDepartment: approver.profile.department?.name || 'N/A'
      }
    ));

  } catch (error) {
    console.error('Get pending leaves error:', error);
    logger.error('Get pending leaves error:', error);
    res.status(500).json(formatErrorResponse('Internal server error: ' + error.message));
  }
};

// @desc    Process leave approval/rejection
// @route   PUT /api/leaves/:id/process
// @access  Private (HOD/Principal only - Admin cannot approve/reject)
const processLeaveApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments, approverId } = req.body;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json(formatErrorResponse('Invalid action. Must be "approve" or "reject"'));
    }

    const leave = await Leave.findById(id).populate({
      path: 'applicant',
      select: 'profile role',
      populate: {
        path: 'profile.department',
        select: 'name code'
      }
    });
    if (!leave) {
      return res.status(404).json(formatErrorResponse('Leave request not found'));
    }

    // Only process pending leaves
    if (leave.status !== LEAVE_STATUS.PENDING) {
      return res.status(400).json(formatErrorResponse('Leave request is already processed'));
    }

    // Find approver and validate permissions
    const approver = await User.findById(approverId || '6885c32c80bb72b2790444d5').populate('profile.department');
    if (!approver) {
      return res.status(404).json(formatErrorResponse('Approver not found'));
    }

    // ✅ ROLE-BASED PERMISSION CHECK
    if (approver.role === 'admin') {
      return res.status(403).json(formatErrorResponse('Admin users cannot approve or reject leave requests. Use delete functionality instead.'));
    }

    // ✅ DEPARTMENT-BASED PERMISSION CHECK
    if (approver.role === 'hod') {
      // HOD can only approve/reject leaves from their own department
      if (!approver.profile.department) {
        return res.status(403).json(formatErrorResponse('HOD must be assigned to a department'));
      }

      // Get applicant's department
      const applicant = await User.findById(leave.applicant._id).populate('profile.department');
      if (!applicant.profile.department || 
          applicant.profile.department._id.toString() !== approver.profile.department._id.toString()) {
        return res.status(403).json(formatErrorResponse('HOD can only approve/reject leaves from their own department'));
      }
    }

    // ✅ PRINCIPAL PERMISSION CHECK
    if (approver.role === 'principal') {
      // Principal can only approve/reject HOD requests, not faculty requests
      if (leave.applicant.role === 'faculty') {
        return res.status(403).json(formatErrorResponse('Principal can only view faculty requests. Only HODs can approve/reject faculty requests.'));
      }
      
      if (leave.applicant.role !== 'hod') {
        return res.status(403).json(formatErrorResponse('Principal can only approve/reject HOD requests'));
      }
    }
    
    // ✅ BALANCE RESTORATION - If rejecting, restore the user's leave balance
    if (action === 'reject') {
      const applicant = await User.findById(leave.applicant);
      if (applicant) {
        const currentYear = new Date().getFullYear();
        const userBalance = applicant.leaveBalances.find(
          balance => balance.leaveType.toString() === leave.leaveType.toString() && balance.year === currentYear
        );
        
        if (userBalance) {
          // Restore the balance by reducing used days and increasing remaining days
          userBalance.used = Math.max(0, userBalance.used - leave.workingDays);
          userBalance.remaining = userBalance.allocated - userBalance.used;
          await applicant.save();
          
          logger.info(`Leave balance restored: ${leave.workingDays} days returned to user ${applicant.profile.firstName} ${applicant.profile.lastName}`);
        }
      }
    }
    
    // Update leave status
    if (action === 'approve') {
      leave.status = LEAVE_STATUS.APPROVED;
    } else {
      leave.status = LEAVE_STATUS.REJECTED;
    }

    // Add approval entry
    leave.approvals.push({
      approver: approverId || '6885c32c80bb72b2790444d5',
      status: action === 'approve' ? APPROVAL_STATUS.APPROVED : APPROVAL_STATUS.REJECTED,
      comments: comments || '',
      approvedAt: new Date(),
      level: 1
    });

    leave.processedAt = new Date();
    await leave.save();

    // Populate the response
    await leave.populate([
      { path: 'applicant', select: 'profile employeeId' },
      { path: 'leaveType', select: 'name code color' },
      { path: 'approvals.approver', select: 'profile employeeId' }
    ]);

    logger.info(`Leave ${action}d: ${leave._id}`, {
      approverId: approverId,
      applicantId: leave.applicant._id,
      action
    });

    res.status(200).json(formatSuccessResponse(
      `Leave request ${action}d successfully`,
      { leave }
    ));

  } catch (error) {
    logger.error('Process leave approval error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Allocate leave balances to user
// @route   POST /api/leaves/allocate-balance
// @access  Private (Admin/Principal)
const allocateLeaveBalance = async (req, res) => {
  try {
    const { userId, leaveTypeId, allocated, year = new Date().getFullYear() } = req.body;

    // Validate required fields
    if (!userId || !leaveTypeId || allocated === undefined) {
      return res.status(400).json(formatErrorResponse('userId, leaveTypeId, and allocated are required'));
    }

    // Find user and leave type
    const user = await User.findById(userId);
    const leaveType = await LeaveType.findById(leaveTypeId);

    if (!user) {
      return res.status(404).json(formatErrorResponse('User not found'));
    }

    if (!leaveType) {
      return res.status(404).json(formatErrorResponse('Leave type not found'));
    }

    // Prevent allocating leave balances to admin users
    if (user.role === 'admin') {
      return res.status(400).json(formatErrorResponse('Admin users should not have leave balances. They only manage the application.'));
    }

    // Check if balance already exists for this user, leave type, and year
    const existingBalance = user.leaveBalances.find(
      balance => balance.leaveType.toString() === leaveTypeId.toString() && balance.year === year
    );

    if (existingBalance) {
      // Update existing balance
      const usedDays = existingBalance.used;
      existingBalance.allocated = allocated;
      existingBalance.remaining = Math.max(0, allocated - usedDays);
    } else {
      // Create new balance entry
      user.leaveBalances.push({
        leaveType: leaveTypeId,
        allocated: allocated,
        used: 0,
        remaining: allocated,
        year: year
      });
    }

    await user.save();

    // Populate the response
    await user.populate('leaveBalances.leaveType', 'name code color');
    const updatedBalance = user.leaveBalances.find(
      balance => balance.leaveType._id.toString() === leaveTypeId.toString() && balance.year === year
    );

    logger.info(`Leave balance allocated: ${allocated} ${leaveType.name} to user ${user.profile.firstName} ${user.profile.lastName}`);

    res.status(200).json(formatSuccessResponse(
      'Leave balance allocated successfully',
      { balance: updatedBalance }
    ));

  } catch (error) {
    logger.error('Allocate leave balance error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Allocate leave balances to all users (bulk operation)
// @route   POST /api/leaves/allocate-bulk
// @access  Private (Admin/Principal)
const bulkAllocateLeaveBalances = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.body;
    const { DEFAULT_LEAVE_BALANCES } = require('../utils/constants');

    // Get all active users (excluding admin users) and leave types
    const users = await User.find({ 
      isActive: true,
      role: { $ne: 'admin' } // Exclude admin users from leave balance allocation
    });
    const leaveTypes = await LeaveType.find({ isActive: true });
    
    let allocatedCount = 0;
    let updatedCount = 0;
    const results = [];

    for (const user of users) {
      for (const leaveType of leaveTypes) {
        const allocation = DEFAULT_LEAVE_BALANCES[leaveType.type] || 0;
        
        if (allocation > 0) {
          // Check if balance already exists
          const existingBalance = user.leaveBalances.find(
            balance => balance.leaveType.toString() === leaveType._id.toString() && balance.year === year
          );
          
          if (!existingBalance) {
            // Add new balance
            user.leaveBalances.push({
              leaveType: leaveType._id,
              allocated: allocation,
              used: 0,
              remaining: allocation,
              year: year
            });
            allocatedCount++;
          } else if (existingBalance.allocated !== allocation) {
            // Update existing balance
            const usedDays = existingBalance.used;
            existingBalance.allocated = allocation;
            existingBalance.remaining = Math.max(0, allocation - usedDays);
            updatedCount++;
          }
        }
      }
      
      await user.save();
      results.push({
        userId: user._id,
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        employeeId: user.employeeId
      });
    }

    logger.info(`Bulk leave balance allocation completed: ${allocatedCount} new allocations, ${updatedCount} updates for ${results.length} users`);

    res.status(200).json(formatSuccessResponse(
      'Leave balances allocated successfully',
      { 
        allocatedCount, 
        updatedCount, 
        totalUsers: results.length,
        results 
      }
    ));

  } catch (error) {
    logger.error('Bulk allocate leave balances error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Update multiple leave balances for a single user
// @route   POST /api/leaves/update-user-balances
// @access  Private (Admin/Principal)
const updateUserLeaveBalances = async (req, res) => {
  try {
    const { userId, balances, year = new Date().getFullYear() } = req.body;
    const currentYear = parseInt(year);

    // Validate required fields
    if (!userId || !balances || !Array.isArray(balances)) {
      return res.status(400).json(formatErrorResponse('userId and balances array are required'));
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(formatErrorResponse('User not found'));
    }

    // Prevent updating leave balances for admin users
    if (user.role === 'admin') {
      return res.status(400).json(formatErrorResponse('Admin users should not have leave balances. They only manage the application.'));
    }

    // Get all leave types for mapping
    const leaveTypes = await LeaveType.find({ isActive: true });
    const leaveTypeMap = {};
    leaveTypes.forEach(lt => {
      leaveTypeMap[lt.type] = lt._id;
    });

    const results = [];
    const { LEAVE_TYPES } = require('../utils/constants');

    // Process each balance update
    for (const balanceUpdate of balances) {
      const { leaveType, allocated, used, remaining } = balanceUpdate;
      
      // Map frontend leave type names to backend types
      let leaveTypeKey = null;
      if (leaveType.toLowerCase().includes('casual')) {
        leaveTypeKey = LEAVE_TYPES.CASUAL;
      } else if (leaveType.toLowerCase().includes('medical')) {
        leaveTypeKey = LEAVE_TYPES.MEDICAL;
      } else if (leaveType.toLowerCase().includes('vacation')) {
        leaveTypeKey = LEAVE_TYPES.VACATION;
      } else if (leaveType.toLowerCase().includes('compensatory') || leaveType.toLowerCase().includes('comp off')) {
        leaveTypeKey = LEAVE_TYPES.COMPENSATORY_OFF;
      } else if (leaveType.toLowerCase().includes('urgent')) {
        leaveTypeKey = LEAVE_TYPES.URGENT;
      } else if (leaveType.toLowerCase().includes('special')) {
        leaveTypeKey = LEAVE_TYPES.SPECIAL;
      }

      if (!leaveTypeKey || !leaveTypeMap[leaveTypeKey]) {
        results.push({
          leaveType,
          status: 'skipped',
          reason: 'Invalid leave type'
        });
        continue;
      }

      const leaveTypeId = leaveTypeMap[leaveTypeKey];

      // Find existing balance
      const existingBalance = user.leaveBalances.find(
        balance => balance.leaveType.toString() === leaveTypeId.toString() && balance.year === currentYear
      );

      if (existingBalance) {
        // Update existing balance
        existingBalance.allocated = allocated || 0;
        existingBalance.used = used || 0;
        existingBalance.remaining = remaining || Math.max(0, (allocated || 0) - (used || 0));
      } else {
        // Create new balance entry
        user.leaveBalances.push({
          leaveType: leaveTypeId,
          allocated: allocated || 0,
          used: used || 0,
          remaining: remaining || Math.max(0, (allocated || 0) - (used || 0)),
          year: currentYear
        });
      }

      results.push({
        leaveType,
        status: 'updated',
        allocated: allocated || 0,
        used: used || 0,
        remaining: remaining || Math.max(0, (allocated || 0) - (used || 0))
      });
    }

    await user.save();

    // Populate the response
    await user.populate('leaveBalances.leaveType', 'name code color type');

    logger.info(`User leave balances updated: ${user.profile.firstName} ${user.profile.lastName} (${user.employeeId})`);

    res.status(200).json(formatSuccessResponse(
      'Leave balances updated successfully',
      { 
        user: {
          id: user._id,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          employeeId: user.employeeId
        },
        balances: user.leaveBalances.filter(b => b.year === currentYear),
        results
      }
    ));

  } catch (error) {
    logger.error('Update user leave balances error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Reset user's leave balances
// @route   POST /api/leaves/reset-balances
// @access  Private (Admin/HR)
const resetLeaveBalances = async (req, res) => {
  try {
    const { userId, year = new Date().getFullYear() } = req.body;

    if (!userId) {
      return res.status(400).json(formatErrorResponse('userId is required'));
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(formatErrorResponse('User not found'));
    }

    let resetCount = 0;
    user.leaveBalances.forEach(balance => {
      if (balance.year === year) {
        const originalAllocated = balance.allocated;
        balance.used = 0;
        balance.remaining = originalAllocated;
        resetCount++;
      }
    });

    if (resetCount === 0) {
      return res.status(404).json(formatErrorResponse(`No leave balances found for year ${year}`));
    }

    await user.save();

    logger.info(`Leave balances reset for user ${user.profile.firstName} ${user.profile.lastName}: ${resetCount} balance(s) reset`);

    res.status(200).json(formatSuccessResponse(
      `Successfully reset ${resetCount} leave balance(s)`,
      { 
        userId,
        year,
        resetCount,
        balances: user.leaveBalances.filter(balance => balance.year === year)
      }
    ));

  } catch (error) {
    logger.error('Reset leave balances error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Get leave balance summary for all users
// @route   GET /api/leaves/balance-summary
// @access  Private (Admin/HR/HOD)
const getLeaveBalanceSummary = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), department } = req.query;
    
    let query = { isActive: true };
    if (department) {
      query['profile.department'] = department;
    }

    const users = await User.find(query)
      .populate('leaveBalances.leaveType', 'name code color type')
      .populate('profile.department', 'name')
      .select('profile leaveBalances employeeId role');

    const summary = users.map(user => {
      const currentYearBalances = user.leaveBalances.filter(balance => balance.year === parseInt(year));
      
      return {
        userId: user._id,
        employeeId: user.employeeId,
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        department: user.profile.department?.name || 'Not Assigned',
        role: user.role,
        balances: currentYearBalances.map(balance => ({
          leaveType: balance.leaveType.name,
          code: balance.leaveType.code,
          color: balance.leaveType.color,
          allocated: balance.allocated,
          used: balance.used,
          remaining: balance.remaining
        }))
      };
    });

    res.status(200).json(formatSuccessResponse(
      'Leave balance summary retrieved successfully',
      { 
        year: year,
        totalUsers: summary.length,
        users: summary 
      }
    ));

  } catch (error) {
    logger.error('Get leave balance summary error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// @desc    Delete leave request (Admin only - for mistakes)
// @route   DELETE /api/leaves/:id
// @access  Private (Admin only)
const deleteLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    // Find admin user
    const admin = await User.findById(adminId || '6885c32c80bb72b2790444d5');
    if (!admin) {
      return res.status(404).json(formatErrorResponse('Admin user not found'));
    }

    // Only admin can delete leave requests
    if (admin.role !== 'admin') {
      return res.status(403).json(formatErrorResponse('Only Admin users can delete leave requests'));
    }

    const leave = await Leave.findById(id).populate({
      path: 'applicant',
      select: 'profile employeeId',
      populate: {
        path: 'profile.department',
        select: 'name code'
      }
    });
    if (!leave) {
      return res.status(404).json(formatErrorResponse('Leave request not found'));
    }

    // Restore leave balance if the request was pending (had deducted balance)
    if (leave.status === LEAVE_STATUS.PENDING) {
      const applicant = await User.findById(leave.applicant._id);
      if (applicant) {
        const currentYear = new Date().getFullYear();
        const userBalance = applicant.leaveBalances.find(
          balance => balance.leaveType.toString() === leave.leaveType.toString() && balance.year === currentYear
        );
        
        if (userBalance) {
          // Restore the balance
          userBalance.used = Math.max(0, userBalance.used - leave.workingDays);
          userBalance.remaining = userBalance.allocated - userBalance.used;
          await applicant.save();
        }
      }
    }

    // Delete the leave request
    await Leave.findByIdAndDelete(id);

    logger.info(`Leave request deleted by admin: ${leave._id}`, {
      adminId: admin._id,
      applicantId: leave.applicant._id,
      leaveStatus: leave.status,
      workingDays: leave.workingDays
    });

    res.status(200).json(formatSuccessResponse(
      'Leave request deleted successfully',
      { 
        deletedLeave: {
          id: leave._id,
          applicant: `${leave.applicant.profile.firstName} ${leave.applicant.profile.lastName}`,
          employeeId: leave.applicant.employeeId,
          status: leave.status,
          workingDays: leave.workingDays
        }
      }
    ));

  } catch (error) {
    logger.error('Delete leave request error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

module.exports = {
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
}; 