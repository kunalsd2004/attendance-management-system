const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const User = require('../models/User');
const LeaveType = require('../models/LeaveType');

async function testBalanceSave() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    console.log('\n=== TESTING BALANCE SAVE OPERATION ===');

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

    // Get current balance
    const currentYear = new Date().getFullYear();
    const userBalance = testUser.leaveBalances.find(
      balance => balance.leaveType._id.toString() === leaveType._id.toString() && balance.year === currentYear
    );

    if (userBalance) {
      console.log('\n=== CURRENT BALANCE ===');
      console.log(`Balance: ${userBalance.remaining}/${userBalance.allocated} (used: ${userBalance.used})`);

      // Test balance update
      console.log('\n=== TESTING BALANCE UPDATE ===');
      const originalUsed = userBalance.used;
      const originalRemaining = userBalance.remaining;
      
      userBalance.used += 3;
      userBalance.remaining = Math.max(0, userBalance.allocated - userBalance.used);
      
      console.log(`Original used: ${originalUsed} -> New used: ${userBalance.used}`);
      console.log(`Original remaining: ${originalRemaining} -> New remaining: ${userBalance.remaining}`);
      
      // Save the user
      await testUser.save();
      console.log('✅ Balance updated and saved');

      // Verify the update by fetching the user again
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

      // Reset the balance back to original
      console.log('\n=== RESETTING BALANCE ===');
      updatedBalance.used = originalUsed;
      updatedBalance.remaining = originalRemaining;
      await updatedUser.save();
      console.log('✅ Balance reset to original values');

    } else {
      console.log('❌ No balance found for this leave type and year');
    }

    console.log('\n✅ Balance save test completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testBalanceSave(); 