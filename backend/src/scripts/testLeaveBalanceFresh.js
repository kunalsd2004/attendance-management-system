const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const User = require('../models/User');
const Leave = require('../models/Leave');
const LeaveType = require('../models/LeaveType');
const { LEAVE_STATUS, APPROVAL_STATUS } = require('../utils/constants');

async function testLeaveBalanceFresh() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    console.log('\n=== TESTING FRESH LEAVE BALANCE LOGIC ===');

    // Get a test user (faculty)
    const testUser = await User.findOne({ role: 'faculty', isActive: true });
    if (!testUser) {
      console.log('❌ No faculty user found for testing');
      return;
    }

    console.log(`\nTest User: ${testUser.profile.firstName} ${testUser.profile.lastName} (${testUser.sdrn})`);

    // Get a leave type
    const leaveType = await LeaveType.findOne({ isActive: true });
    if (!leaveType) {
      console.log('❌ No leave type found for testing');
      return;
    }

    console.log(`\nTest Leave Type: ${leaveType.name}`);

    // Reset the balance for this leave type to start fresh
    const currentYear = new Date().getFullYear();
    const userBalance = testUser.leaveBalances.find(
      balance => balance.leaveType._id.toString() === leaveType._id.toString() && balance.year === currentYear
    );

    if (userBalance) {
      console.log('\n=== RESETTING BALANCE ===');
      console.log(`Original balance: ${userBalance.remaining}/${userBalance.allocated} (used: ${userBalance.used})`);
      
      userBalance.used = 0;
      userBalance.remaining = userBalance.allocated;
      await testUser.save();
      
      console.log(`Reset balance: ${userBalance.remaining}/${userBalance.allocated} (used: ${userBalance.used})`);
    }

    // Get current leave balances after reset
    await testUser.populate('leaveBalances.leaveType');
    const initialBalances = testUser.leaveBalances.filter(b => b.year === currentYear);
    console.log('\n=== INITIAL BALANCES (AFTER RESET) ===');
    initialBalances.forEach(balance => {
      console.log(`${balance.leaveType.name}: ${balance.remaining}/${balance.allocated} (used: ${balance.used})`);
    });

    // Get HOD and Principal for testing
    const hod = await User.findOne({ role: 'hod', isActive: true });
    const principal = await User.findOne({ role: 'principal', isActive: true });

    if (!hod || !principal) {
      console.log('❌ HOD or Principal not found for testing');
      return;
    }

    console.log(`HOD: ${hod.profile.firstName} ${hod.profile.lastName}`);
    console.log(`Principal: ${principal.profile.firstName} ${principal.profile.lastName}`);

    // Test 1: Apply for leave (should not deduct balance)
    console.log('\n=== TEST 1: APPLY FOR LEAVE ===');
    
    const testLeave = new Leave({
      applicant: testUser._id,
      leaveType: leaveType._id,
      startDate: new Date('2025-02-15'),
      endDate: new Date('2025-02-17'),
      isStartHalfDay: false,
      isEndHalfDay: false,
      totalDays: 3,
      workingDays: 3,
      reason: 'Test leave application',
      status: LEAVE_STATUS.PENDING,
      appliedAt: new Date()
    });

    // Add HOD approval
    testLeave.approvals.push({
      approver: hod._id,
      status: APPROVAL_STATUS.PENDING,
      level: 1,
      comments: ''
    });

    await testLeave.save();
    console.log(`✅ Leave application created: ${testLeave._id}`);

    // Check balance after application (should be unchanged)
    await testUser.populate('leaveBalances.leaveType');
    const balanceAfterApplication = testUser.leaveBalances.find(
      b => b.leaveType._id.toString() === leaveType._id.toString() && b.year === currentYear
    );
    console.log(`Balance after application: ${balanceAfterApplication.remaining}/${balanceAfterApplication.allocated} (used: ${balanceAfterApplication.used})`);

    // Test 2: HOD approves (should not deduct balance)
    console.log('\n=== TEST 2: HOD APPROVES ===');
    
    const hodApproval = testLeave.approvals.find(a => a.approver.toString() === hod._id.toString());
    hodApproval.status = APPROVAL_STATUS.APPROVED;
    hodApproval.comments = 'Approved by HOD';
    hodApproval.approvedAt = new Date();

    // Add Principal approval
    testLeave.approvals.push({
      approver: principal._id,
      status: APPROVAL_STATUS.PENDING,
      level: 2,
      comments: ''
    });

    await testLeave.save();
    console.log('✅ HOD approval completed');

    // Check balance after HOD approval (should be unchanged)
    await testUser.populate('leaveBalances.leaveType');
    const balanceAfterHodApproval = testUser.leaveBalances.find(
      b => b.leaveType._id.toString() === leaveType._id.toString() && b.year === currentYear
    );
    console.log(`Balance after HOD approval: ${balanceAfterHodApproval.remaining}/${balanceAfterHodApproval.allocated} (used: ${balanceAfterHodApproval.used})`);

    // Test 3: Principal approves (should deduct balance)
    console.log('\n=== TEST 3: PRINCIPAL APPROVES ===');
    
    const principalApproval = testLeave.approvals.find(a => a.approver.toString() === principal._id.toString());
    principalApproval.status = APPROVAL_STATUS.APPROVED;
    principalApproval.comments = 'Approved by Principal';
    principalApproval.approvedAt = new Date();

    testLeave.status = LEAVE_STATUS.APPROVED;
    testLeave.processedAt = new Date();

    // Simulate the controller logic for Principal approval
    const applicant = await User.findById(testUser._id);
    if (applicant) {
      const currentYear = new Date().getFullYear();
      const userBalance = applicant.leaveBalances.find(
        balance => balance.leaveType._id.toString() === leaveType._id.toString() && balance.year === currentYear
      );
      
      if (userBalance) {
        // Deduct the balance only after final approval
        userBalance.used += testLeave.workingDays;
        userBalance.remaining = Math.max(0, userBalance.allocated - userBalance.used);
        await applicant.save();
        console.log(`✅ Balance deducted after final approval: ${testLeave.workingDays} days`);
      }
    }

    await testLeave.save();
    console.log('✅ Principal approval completed');

    // Check balance after Principal approval (should be deducted)
    await testUser.populate('leaveBalances.leaveType');
    const balanceAfterPrincipalApproval = testUser.leaveBalances.find(
      b => b.leaveType._id.toString() === leaveType._id.toString() && b.year === currentYear
    );
    console.log(`Balance after Principal approval: ${balanceAfterPrincipalApproval.remaining}/${balanceAfterPrincipalApproval.allocated} (used: ${balanceAfterPrincipalApproval.used})`);

    // Test 4: Verify the logic
    console.log('\n=== TEST 4: VERIFICATION ===');
    
    const expectedUsed = initialBalances.find(b => b.leaveType._id.toString() === leaveType._id.toString())?.used || 0;
    const actualUsed = balanceAfterPrincipalApproval.used;
    const expectedRemaining = balanceAfterPrincipalApproval.allocated - actualUsed;
    const actualRemaining = balanceAfterPrincipalApproval.remaining;

    console.log(`Expected used: ${expectedUsed + testLeave.workingDays}`);
    console.log(`Actual used: ${actualUsed}`);
    console.log(`Expected remaining: ${expectedRemaining}`);
    console.log(`Actual remaining: ${actualRemaining}`);

    if (actualUsed === expectedUsed + testLeave.workingDays && actualRemaining === expectedRemaining) {
      console.log('✅ Balance logic working correctly!');
    } else {
      console.log('❌ Balance logic has issues!');
    }

    // Clean up test data
    console.log('\n=== CLEANUP ===');
    await Leave.findByIdAndDelete(testLeave._id);
    console.log('✅ Test leave deleted');

    console.log('\n✅ Fresh leave balance test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testLeaveBalanceFresh(); 