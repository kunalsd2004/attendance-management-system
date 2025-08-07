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
  
  console.log('DEBUG: calculateWorkingDays input:', {
    startDate,
    endDate,
    start: start.toISOString(),
    end: end.toISOString(),
    isStartHalfDay,
    isEndHalfDay
  });
  
  if (start > end) return 0;
  
  let count = 0;
  const currentDate = new Date(start.getTime());
  
  // Compare dates properly by converting to date strings (YYYY-MM-DD)
  const startDateStr = new Date(startDate).toISOString().split('T')[0];
  const endDateStr = new Date(endDate).toISOString().split('T')[0];
  const isSameDay = startDateStr === endDateStr;
  
  // Count all days from start to end (inclusive)
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    console.log('DEBUG: Processing date:', {
      date: currentDate.toISOString().split('T')[0],
      dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6
    });
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Special case: if start and end are the same day and it's a weekend, count it as 1 day
  if (startDateStr === endDateStr && count === 0) {
    console.log('DEBUG: Same day weekend leave, counting as 1 day');
    count = 1;
  }
  
  // Handle half days
  let deduction = 0;
  
  console.log('DEBUG: Half day calculation:', {
    startDateStr,
    endDateStr,
    isSameDay,
    isStartHalfDay,
    isEndHalfDay,
    countBeforeHalfDay: count
  });
  
  if (isStartHalfDay && isEndHalfDay && isSameDay) {
    // Single day with both start and end half day = 0.5 days
    count = 0.5;
  } else {
    if (isStartHalfDay) deduction += 0.5;
    if (isEndHalfDay && !isSameDay) {
      deduction += 0.5;
    }
  }
  
  const finalResult = Math.max(0, count - deduction);
  console.log('DEBUG: calculateWorkingDays result:', {
    count,
    deduction,
    finalResult
  });
  
  return finalResult;
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
      loadAdjustment,
      emergencyContact
    } = req.body;

    // For simplified auth, we'll get user ID from request body for now
    // In production, this would come from JWT token
    const userId = req.body.userId || '6885cc2f8057ec72790446f8'; // Default to faculty user for testing

    // Validate required fields
    if (!leaveType || !startDate || !endDate || !reason || !loadAdjustment) {
      return res.status(400).json(formatErrorResponse('All required fields must be provided'));
    }

    // Validate loadAdjustment is a valid JSON string
    let loadAdjustmentData;
    try {
      loadAdjustmentData = JSON.parse(loadAdjustment);
      if (!Array.isArray(loadAdjustmentData) || loadAdjustmentData.length === 0) {
        return res.status(400).json(formatErrorResponse('Load adjustment data must be a non-empty array'));
      }
      
      // Validate each load adjustment entry has required fields
      for (let i = 0; i < loadAdjustmentData.length; i++) {
        const entry = loadAdjustmentData[i];
        if (!entry.partner || !entry.timeFrom || !entry.timeTo || !entry.subject) {
          return res.status(400).json(formatErrorResponse(`Load adjustment entry ${i + 1} is missing required fields (partner, timeFrom, timeTo, subject)`));
        }
      }
    } catch (error) {
      return res.status(400).json(formatErrorResponse('Invalid load adjustment data format'));
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
      'On Duty': 'on_duty',
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
    
    console.log('DEBUG: Working days calculation:', {
      startDate,
      endDate,
      startHalfDay,
      endHalfDay,
      workingDays,
      totalDays,
      startDateStr: new Date(startDate).toISOString().split('T')[0],
      endDateStr: new Date(endDate).toISOString().split('T')[0],
      isSameDay: new Date(startDate).toISOString().split('T')[0] === new Date(endDate).toISOString().split('T')[0]
    });

    // ✅ MEDICAL LEAVE VALIDATION - Medical leave must be minimum 2 days
    if (leaveType === 'Medical' && workingDays < 2) {
      return res.status(400).json(formatErrorResponse(
        'Medical Leave requires a minimum of 2 working days. Please select a longer duration.'
      ));
    }

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

    // ✅ FIND APPROVERS - Get HOD for initial approval, Principal for final approval
    let hodApprover = null;
    let principalApprover = null;

    // Find HOD of the same department as the faculty
    if (user.profile.department) {
      hodApprover = await User.findOne({
        role: 'hod',
        'profile.department': user.profile.department,
        isActive: true
      });
    }

    // Find Principal (any active principal user)
    principalApprover = await User.findOne({
      role: 'principal',
      isActive: true
    });

    // Special case: If the applicant is a HOD, they don't need HOD approval
    // They go directly to Principal approval
    if (user.role === 'hod') {
      hodApprover = null; // No HOD approval needed for HOD applicants
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
      loadAdjustment,
      status: LEAVE_STATUS.PENDING,
      emergencyContact: emergencyContact || {},
      appliedAt: new Date()
    });

    // ✅ ADD HIERARCHICAL APPROVALS - Only HOD initially, Principal added after HOD approval
    if (hodApprover) {
      leaveApplication.approvals.push({
        approver: hodApprover._id,
        status: APPROVAL_STATUS.PENDING,
        level: 1,
        comments: ''
      });
    } else if (user.role === 'hod' && principalApprover) {
      // If applicant is HOD and no HOD approver found, add Principal approval directly
      leaveApplication.approvals.push({
        approver: principalApprover._id,
        status: APPROVAL_STATUS.PENDING,
        level: 1, // Level 1 for direct Principal approval
        comments: ''
      });
    } else if (user.role === 'principal' && principalApprover) {
      // If applicant is Principal, add self-approval (Principal can approve their own leaves)
      leaveApplication.approvals.push({
        approver: principalApprover._id,
        status: APPROVAL_STATUS.PENDING,
        level: 1, // Level 1 for Principal self-approval
        comments: ''
      });
    }

    // Note: Principal approval will be added dynamically when HOD approves

    await leaveApplication.save();

    // ✅ BALANCE RESERVATION - Don't deduct balance yet, just validate it's available
    // Balance will be deducted only after final approval by Principal

    // Populate the response
    await leaveApplication.populate([
      { path: 'applicant', select: 'profile sdrn' },
      { path: 'leaveType', select: 'name code color' },
      { path: 'approvals.approver', select: 'profile sdrn role' }
    ]);

    logger.info(`Leave application created: ${leaveApplication._id}`, {
      userId,
      leaveType: leaveType,
      workingDays,
      remainingBalance: userBalance.remaining,
      hodApprover: hodApprover?._id,
      principalApprover: principalApprover?._id
    });

    res.status(201).json(formatSuccessResponse(
      'Leave application submitted successfully',
      { 
        leave: leaveApplication,
        remainingBalance: {
          leaveType: leaveTypeDoc.name,
          used: userBalance.used,
          remaining: userBalance.remaining,
          allocated: userBalance.allocated,
          note: 'Balance will be deducted after final approval by Principal'
        },
        approvers: {
          hod: hodApprover ? {
            id: hodApprover._id,
            name: `${hodApprover.profile.firstName} ${hodApprover.profile.lastName}`,
            department: hodApprover.profile.department?.name
          } : null,
          principal: principalApprover ? {
            id: principalApprover._id,
            name: `${principalApprover.profile.firstName} ${principalApprover.profile.lastName}`
          } : null
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
        select: 'profile sdrn role',
        populate: {
          path: 'profile.department',
          select: 'name code'
        }
      })
      .populate({
        path: 'approvals.approver',
        select: 'profile sdrn role',
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
        select: 'profile sdrn',
        populate: {
          path: 'profile.department',
          select: 'name code'
        }
      })
      .populate('leaveType', 'name code color')
      .populate({
        path: 'approvals.approver',
        select: 'profile sdrn',
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
        select: 'profile sdrn',
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
    
    const leave = await Leave.findById(id).populate('leaveType', 'name code color');
    if (!leave) {
      return res.status(404).json(formatErrorResponse('Leave request not found'));
    }

    // Only allow cancellation of pending or approved leaves
    if (![LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED].includes(leave.status)) {
      return res.status(400).json(formatErrorResponse('Cannot cancel this leave request'));
    }

    // ✅ BALANCE RESTORATION - Restore the user's leave balance when cancelling (only if leave was approved)
    const applicant = await User.findById(leave.applicant);
    if (applicant && leave.status === LEAVE_STATUS.APPROVED) {
      const currentYear = new Date().getFullYear();
      
      const userBalance = applicant.leaveBalances.find(
        balance => balance.leaveType.toString() === leave.leaveType._id.toString() && balance.year === currentYear
      );
      
      if (userBalance) {
        // Restore the balance by reducing used days and increasing remaining days
        userBalance.used = Math.max(0, userBalance.used - leave.workingDays);
        userBalance.remaining = userBalance.allocated - userBalance.used;
        await applicant.save();
        
        logger.info(`Leave balance restored on cancellation: ${leave.workingDays} days returned to user ${applicant.profile.firstName} ${applicant.profile.lastName}`);
      }
    } else if (leave.status === LEAVE_STATUS.PENDING) {
      logger.info(`Leave cancelled while pending: No balance restoration needed since balance wasn't deducted yet`);
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

// @desc    Get pending leave requests for approvers
// @route   GET /api/leaves/pending
// @access  Private (HOD/Principal)
const getPendingLeaves = async (req, res) => {
  try {
    const approverId = req.query.approverId || '6889176b72077bb94d89e728'; // Default to HOD001 (CS HOD)
    console.log('Approver ID:', approverId);
    
    const approver = await User.findById(approverId).populate('profile.department');
    if (!approver) {
      return res.status(404).json(formatErrorResponse('Approver not found'));
    }
    
    console.log('Approver role:', approver.role);
    console.log('Approver department:', approver.profile.department?.name || 'No Department');

    // ✅ HIERARCHICAL APPROVAL QUERY
    let query = { 
      status: LEAVE_STATUS.PENDING,
      'approvals.approver': approverId,
      'approvals.status': APPROVAL_STATUS.PENDING
    };

    // If the approver is HOD, only show leaves from their department that need HOD approval
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
      // Only show leaves where HOD approval is pending (level 1)
      query['approvals.level'] = 1;
    }
    
    // If the approver is Principal, show leaves that need Principal approval (including their own)
    if (approver.role === 'principal') {
      console.log('Principal detected - showing leaves approved by HOD and Principal own leaves');
      // Find all faculty, hod, and principal users (all need Principal approval)
      const allUsers = await User.find({ 
        role: { $in: ['faculty', 'hod', 'principal'] },
        isActive: true 
      }).select('_id');
      
      const allUserIds = allUsers.map(user => user._id);
      query.applicant = { $in: allUserIds };
      
      // Show leaves where Principal approval is pending (level 1 for HOD/Principal direct approval, level 2 for faculty after HOD)
      query['approvals.level'] = { $in: [1, 2] };
      query['approvals.status'] = APPROVAL_STATUS.PENDING;
    }
    
    // If the approver is Admin, show all requests (for deletion only)
    if (approver.role === 'admin') {
      console.log('Admin detected - showing all requests');
      // Admin can see all pending leaves but cannot approve/reject
      query = { status: LEAVE_STATUS.PENDING };
    }

    console.log('Query:', JSON.stringify(query));

    let pendingLeaves = await Leave.find(query)
      .populate({
        path: 'applicant',
        select: 'profile sdrn role',
        populate: {
          path: 'profile.department',
          select: 'name code'
        }
      })
      .populate({
        path: 'leaveType',
        select: 'name code color'
      })
      .populate({
        path: 'approvals.approver',
        select: 'profile sdrn role',
        populate: {
          path: 'profile.department',
          select: 'name code'
        }
      })
      .sort({ appliedAt: -1 });

    // ✅ HIERARCHICAL FILTERING - For Principal, show leaves that need Principal approval
    if (approver.role === 'principal') {
      pendingLeaves = pendingLeaves.filter(leave => {
        // For faculty users: check if HOD (level 1) has approved
        if (leave.applicant.role === 'faculty') {
          const hodApproval = leave.approvals.find(approval => approval.level === 1);
          return hodApproval && hodApproval.status === APPROVAL_STATUS.APPROVED;
        }
        // For HOD users: they go directly to Principal (level 1)
        else if (leave.applicant.role === 'hod') {
          const principalApproval = leave.approvals.find(approval => approval.level === 1);
          return principalApproval && principalApproval.status === APPROVAL_STATUS.PENDING;
        }
        // For Principal users: they can approve their own leaves (level 1)
        else if (leave.applicant.role === 'principal') {
          const principalApproval = leave.approvals.find(approval => approval.level === 1);
          return principalApproval && principalApproval.status === APPROVAL_STATUS.PENDING;
        }
        return false;
      });
    }

    // ✅ ENHANCE RESPONSE WITH APPROVAL STATUS
    const enhancedLeaves = pendingLeaves.map(leave => {
      const currentApproval = leave.approvals.find(
        approval => approval.approver._id.toString() === approverId.toString()
      );
      
      const otherApprovals = leave.approvals.filter(
        approval => approval.approver._id.toString() !== approverId.toString()
      );

      return {
        ...leave.toObject(),
        currentApproval: currentApproval ? {
          status: currentApproval.status,
          level: currentApproval.level,
          comments: currentApproval.comments,
          approvedAt: currentApproval.approvedAt
        } : null,
        otherApprovals: otherApprovals.map(approval => ({
          approver: approval.approver,
          status: approval.status,
          level: approval.level,
          comments: approval.comments,
          approvedAt: approval.approvedAt
        })),
        approvalProgress: {
          total: leave.approvals.length,
          approved: leave.approvals.filter(a => a.status === APPROVAL_STATUS.APPROVED).length,
          rejected: leave.approvals.filter(a => a.status === APPROVAL_STATUS.REJECTED).length,
          pending: leave.approvals.filter(a => a.status === APPROVAL_STATUS.PENDING).length
        }
      };
    });

    res.status(200).json(formatSuccessResponse(
      approver.role === 'principal' 
        ? 'Leave requests approved by HOD and pending Principal approval retrieved successfully'
        : 'Pending leave requests retrieved successfully',
      {
        leaves: enhancedLeaves,
        approverInfo: {
          id: approver._id,
          name: `${approver.profile.firstName} ${approver.profile.lastName}`,
          role: approver.role,
          department: approver.profile.department?.name || 'N/A'
        },
        totalCount: enhancedLeaves.length,
        approvalFlow: approver.role === 'hod' ? 'HOD Approval (First Level)' : 'Principal Approval (Final Level)'
      }
    ));

  } catch (error) {
    logger.error('Get pending leaves error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
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

    const leave = await Leave.findById(id).populate([
      {
        path: 'applicant',
        select: 'profile role',
        populate: {
          path: 'profile.department',
          select: 'name code'
        }
      },
      {
        path: 'leaveType',
        select: 'name code color'
      }
    ]);
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

    // ✅ FIND PENDING APPROVAL FOR THIS APPROVER
    const pendingApproval = leave.approvals.find(
      approval => approval.approver.toString() === approverId.toString() && 
                 approval.status === APPROVAL_STATUS.PENDING
    );

    if (!pendingApproval) {
      return res.status(403).json(formatErrorResponse('No pending approval found for this approver'));
    }

    // ✅ DEPARTMENT-BASED PERMISSION CHECK FOR HOD
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
      // Principal can approve/reject any faculty, hod, or principal leave request
      if (!['faculty', 'hod', 'principal'].includes(leave.applicant.role)) {
        return res.status(403).json(formatErrorResponse('Principal can only approve/reject faculty, HOD, and Principal requests'));
      }
    }
    
    // ✅ BALANCE RESTORATION - If rejecting, no balance restoration needed since balance wasn't deducted at application time
    if (action === 'reject') {
      logger.info(`Leave rejected: ${leave.workingDays} days were not deducted from balance since deduction happens only after final approval`);
    }
    
    // ✅ UPDATE APPROVAL STATUS
    pendingApproval.status = action === 'approve' ? APPROVAL_STATUS.APPROVED : APPROVAL_STATUS.REJECTED;
    pendingApproval.comments = comments || '';
    pendingApproval.approvedAt = new Date();

    // ✅ HIERARCHICAL APPROVAL FLOW
    if (action === 'approve') {
      console.log('DEBUG: Approval flow - action is approve');
      console.log('DEBUG: Current approver:', {
        role: approver.role,
        id: approver._id,
        name: `${approver.profile.firstName} ${approver.profile.lastName}`
      });
      console.log('DEBUG: Pending approval:', {
        level: pendingApproval.level,
        status: pendingApproval.status,
        approverId: pendingApproval.approver
      });
      
      // If HOD approves, add Principal approval
      if (approver.role === 'hod' && pendingApproval.level === 1) {
        console.log('DEBUG: HOD approval - adding Principal approval');
        // Find Principal for final approval
        const principalApprover = await User.findOne({
          role: 'principal',
          isActive: true
        });

        if (principalApprover) {
          // Add Principal approval
          leave.approvals.push({
            approver: principalApprover._id,
            status: APPROVAL_STATUS.PENDING,
            level: 2,
            comments: ''
          });
          
          logger.info(`Principal approval added for leave ${leave._id} after HOD approval`);
        }
      }
      
      // If Principal approves (level 1 or 2), finalize the leave and deduct balance
      console.log('DEBUG: Principal approval check:', {
        approverRole: approver.role,
        pendingApprovalLevel: pendingApproval.level,
        condition: approver.role === 'principal' && (pendingApproval.level === 1 || pendingApproval.level === 2)
      });
      
      if (approver.role === 'principal' && (pendingApproval.level === 1 || pendingApproval.level === 2)) {
        console.log('DEBUG: Principal approval condition met - finalizing leave and deducting balance');
        leave.status = LEAVE_STATUS.APPROVED;
        leave.processedAt = new Date();
        
        // ✅ DEDUCT LEAVE BALANCE - Only deduct balance after final approval by Principal
        console.log('DEBUG: Principal approval - deducting balance. Leave details:', {
          leaveId: leave._id,
          workingDays: leave.workingDays,
          startDate: leave.startDate,
          endDate: leave.endDate,
          isStartHalfDay: leave.isStartHalfDay,
          isEndHalfDay: leave.isEndHalfDay,
          leaveTypeId: leave.leaveType._id,
          leaveTypeName: leave.leaveType.name,
          applicantId: leave.applicant._id || leave.applicant
        });
        
        // Get the applicant user - handle both populated and unpopulated cases
        const applicantId = leave.applicant._id || leave.applicant;
        const applicant = await User.findById(applicantId);
        
        if (applicant) {
          const currentYear = new Date().getFullYear();
          
          const userBalance = applicant.leaveBalances.find(
            balance => balance.leaveType.toString() === leave.leaveType._id.toString() && balance.year === currentYear
          );
          
          console.log('DEBUG: User balance found:', !!userBalance);
          if (userBalance) {
            console.log('DEBUG: Balance before deduction:', {
              allocated: userBalance.allocated,
              used: userBalance.used,
              remaining: userBalance.remaining
            });
          }
          
          if (userBalance) {
            // Deduct the balance only after final approval
            userBalance.used += leave.workingDays;
            userBalance.remaining = Math.max(0, userBalance.allocated - userBalance.used);
            await applicant.save();
            
            console.log('DEBUG: Balance after deduction:', {
              allocated: userBalance.allocated,
              used: userBalance.used,
              remaining: userBalance.remaining
            });
            
            logger.info(`Leave balance deducted after final approval: ${leave.workingDays} days deducted from user ${applicant.profile.firstName} ${applicant.profile.lastName}`);
          } else {
            logger.warn(`No balance found for leave type ${leave.leaveType.name} (${leave.leaveType._id}) for user ${applicant.profile.firstName} ${applicant.profile.lastName}`);
          }
        } else {
          logger.error(`Applicant not found for leave ${leave._id}`);
        }
      } else {
        console.log('DEBUG: Principal approval condition NOT met:', {
          approverRole: approver.role,
          pendingApprovalLevel: pendingApproval.level,
          isPrincipal: approver.role === 'principal',
          isLevel1Or2: pendingApproval.level === 1 || pendingApproval.level === 2
        });
      }
    } else if (action === 'reject') {
      // If any approval is rejected, the leave is rejected
      leave.status = LEAVE_STATUS.REJECTED;
      leave.processedAt = new Date();
    }
    
    // If HOD approved but Principal hasn't approved yet, leave remains PENDING

    await leave.save();

    // Populate the response
    await leave.populate([
      { path: 'applicant', select: 'profile sdrn' },
      { path: 'leaveType', select: 'name code color' },
      { path: 'approvals.approver', select: 'profile sdrn role' }
    ]);

    logger.info(`Leave ${action}d: ${leave._id}`, {
      approverId: approverId,
      applicantId: leave.applicant._id,
      action,
      finalStatus: leave.status
    });

    res.status(200).json(formatSuccessResponse(
      `Leave request ${action}d successfully`,
      { 
        leave,
        approvalStatus: {
          currentApprover: {
            id: approver._id,
            name: `${approver.profile.firstName} ${approver.profile.lastName}`,
            role: approver.role,
            action: action
          },
          overallStatus: leave.status,
          pendingApprovals: leave.approvals.filter(a => a.status === APPROVAL_STATUS.PENDING).length
        }
      }
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
        sdrn: user.sdrn
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
      } else if (leaveType.toLowerCase().includes('on duty') || leaveType.toLowerCase().includes('on-duty')) {
      leaveTypeKey = LEAVE_TYPES.ON_DUTY;
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

    logger.info(`User leave balances updated: ${user.profile.firstName} ${user.profile.lastName} (${user.sdrn})`);

    res.status(200).json(formatSuccessResponse(
      'Leave balances updated successfully',
      { 
        user: {
          id: user._id,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          sdrn: user.sdrn
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
      .select('profile leaveBalances sdrn role');

    const summary = users.map(user => {
      const currentYearBalances = user.leaveBalances.filter(balance => balance.year === parseInt(year));
      
      return {
        userId: user._id,
        sdrn: user.sdrn,
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

    const leave = await Leave.findById(id).populate([
      {
        path: 'applicant',
        select: 'profile sdrn',
        populate: {
          path: 'profile.department',
          select: 'name code'
        }
      },
      {
        path: 'leaveType',
        select: 'name code color'
      }
    ]);
    if (!leave) {
      return res.status(404).json(formatErrorResponse('Leave request not found'));
    }

    // Restore leave balance if the request was approved (had deducted balance)
    if (leave.status === LEAVE_STATUS.APPROVED) {
      const applicant = await User.findById(leave.applicant._id);
      if (applicant) {
        const currentYear = new Date().getFullYear();
        
        const userBalance = applicant.leaveBalances.find(
          balance => balance.leaveType.toString() === leave.leaveType._id.toString() && balance.year === currentYear
        );
        
        if (userBalance) {
          // Restore the balance
          userBalance.used = Math.max(0, userBalance.used - leave.workingDays);
          userBalance.remaining = userBalance.allocated - userBalance.used;
          await applicant.save();
        }
      }
    } else if (leave.status === LEAVE_STATUS.PENDING) {
      logger.info(`Leave deleted while pending: No balance restoration needed since balance wasn't deducted yet`);
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
          sdrn: leave.applicant.sdrn,
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

// @desc    Update leave type
// @route   PUT /api/leaves/types/:id
// @access  Private (Admin only)
const updateLeaveType = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { adminId } = req.body;

    // Find admin user
    const admin = await User.findById(adminId || '6885c32c80bb72b2790444d5');
    if (!admin) {
      return res.status(404).json(formatErrorResponse('Admin user not found'));
    }

    // Only admin can update leave types
    if (admin.role !== 'admin') {
      return res.status(403).json(formatErrorResponse('Only Admin users can update leave types'));
    }

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    const leaveType = await LeaveType.findById(id);
    if (!leaveType) {
      return res.status(404).json(formatErrorResponse('Leave type not found'));
    }

    const updatedLeaveType = await LeaveType.findByIdAndUpdate(id, updates, { new: true });

    logger.info(`Leave type updated by admin: ${leaveType._id}`, {
      adminId: admin._id,
      leaveTypeId: leaveType._id,
      updates: Object.keys(updates)
    });

    res.status(200).json(formatSuccessResponse(
      'Leave type updated successfully',
      { leaveType: updatedLeaveType }
    ));

  } catch (error) {
    logger.error('Update leave type error:', error);
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
  resetLeaveBalances,
  updateLeaveType
}; 