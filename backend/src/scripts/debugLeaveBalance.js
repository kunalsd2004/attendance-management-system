const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const User = require('../models/User');
const Leave = require('../models/Leave');
const LeaveType = require('../models/LeaveType');

async function debugLeaveBalance() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    console.log('\n=== DEBUGGING LEAVE BALANCE STRUCTURE ===');

    // Get a test user (faculty)
    const testUser = await User.findOne({ role: 'faculty', isActive: true });
    if (!testUser) {
      console.log('❌ No faculty user found for testing');
      return;
    }

    console.log(`\nTest User: ${testUser.profile.firstName} ${testUser.profile.lastName} (${testUser.sdrn})`);

    // Get current leave balances
    const currentYear = new Date().getFullYear();
    console.log('\n=== USER LEAVE BALANCES ===');
    console.log('Raw balances:', JSON.stringify(testUser.leaveBalances, null, 2));

    // Populate leave types
    await testUser.populate('leaveBalances.leaveType');
    console.log('\n=== POPULATED BALANCES ===');
    testUser.leaveBalances.forEach((balance, index) => {
      console.log(`Balance ${index + 1}:`);
      console.log(`  LeaveType ID: ${balance.leaveType._id}`);
      console.log(`  LeaveType Name: ${balance.leaveType.name}`);
      console.log(`  Allocated: ${balance.allocated}`);
      console.log(`  Used: ${balance.used}`);
      console.log(`  Remaining: ${balance.remaining}`);
      console.log(`  Year: ${balance.year}`);
    });

    // Get a leave type
    const leaveType = await LeaveType.findOne({ isActive: true });
    if (!leaveType) {
      console.log('❌ No leave type found for testing');
      return;
    }

    console.log(`\nTest Leave Type: ${leaveType.name} (${leaveType._id})`);

    // Find the specific balance for this leave type
    console.log('\n=== COMPARISON DEBUG ===');
    console.log(`Looking for leaveType: ${leaveType._id} (${leaveType.name})`);
    testUser.leaveBalances.forEach((balance, index) => {
      console.log(`Balance ${index + 1} leaveType: ${balance.leaveType} (${balance.leaveType.name})`);
      console.log(`  Comparison: ${balance.leaveType.toString()} === ${leaveType._id.toString()} = ${balance.leaveType.toString() === leaveType._id.toString()}`);
    });
    
    const userBalance = testUser.leaveBalances.find(
      balance => balance.leaveType._id.toString() === leaveType._id.toString() && balance.year === currentYear
    );

    if (userBalance) {
      console.log('\n=== FOUND USER BALANCE ===');
      console.log(`LeaveType ID: ${userBalance.leaveType._id}`);
      console.log(`LeaveType Name: ${userBalance.leaveType.name}`);
      console.log(`Allocated: ${userBalance.allocated}`);
      console.log(`Used: ${userBalance.used}`);
      console.log(`Remaining: ${userBalance.remaining}`);
      console.log(`Year: ${userBalance.year}`);

      // Test balance update
      console.log('\n=== TESTING BALANCE UPDATE ===');
      const originalUsed = userBalance.used;
      const originalRemaining = userBalance.remaining;
      
      userBalance.used += 3;
      userBalance.remaining = Math.max(0, userBalance.allocated - userBalance.used);
      
      console.log(`Original used: ${originalUsed} -> New used: ${userBalance.used}`);
      console.log(`Original remaining: ${originalRemaining} -> New remaining: ${userBalance.remaining}`);
      
      await testUser.save();
      console.log('✅ Balance updated and saved');

      // Verify the update
      const updatedUser = await User.findById(testUser._id).populate('leaveBalances.leaveType');
      const updatedBalance = updatedUser.leaveBalances.find(
        balance => balance.leaveType._id.toString() === leaveType._id.toString() && balance.year === currentYear
      );
      
      console.log('\n=== VERIFICATION ===');
      console.log(`Updated used: ${updatedBalance.used}`);
      console.log(`Updated remaining: ${updatedBalance.remaining}`);
      
      if (updatedBalance.used === originalUsed + 3) {
        console.log('✅ Balance update successful!');
      } else {
        console.log('❌ Balance update failed!');
      }

    } else {
      console.log('❌ No balance found for this leave type and year');
    }

    console.log('\n✅ Leave balance debug completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
}

debugLeaveBalance(); 