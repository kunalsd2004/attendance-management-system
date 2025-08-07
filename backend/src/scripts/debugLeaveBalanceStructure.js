const mongoose = require('mongoose');
const User = require('../models/User');
const Leave = require('../models/Leave');
const LeaveType = require('../models/LeaveType');
const logger = require('../utils/logger');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/lms', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugLeaveBalanceStructure() {
  try {
    console.log('🔍 Debugging Leave Balance Structure...\n');

    // Find a user with leave balances
    const user = await User.findById('6885cc2f8057ec72790446f8');
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User:', user.profile.firstName, user.profile.lastName);
    console.log('📊 Leave Balances Count:', user.leaveBalances.length);
    console.log('\n📋 Leave Balances Structure:');
    
    user.leaveBalances.forEach((balance, index) => {
      console.log(`\n--- Balance ${index + 1} ---`);
      console.log('leaveType:', balance.leaveType);
      console.log('leaveType type:', typeof balance.leaveType);
      console.log('leaveType instanceof ObjectId:', balance.leaveType instanceof mongoose.Types.ObjectId);
      console.log('leaveType.toString():', balance.leaveType.toString());
      console.log('allocated:', balance.allocated);
      console.log('used:', balance.used);
      console.log('remaining:', balance.remaining);
      console.log('year:', balance.year);
    });

    // Find a leave request
    const leave = await Leave.findById('6885cc2f8057ec72790446f9');
    if (leave) {
      console.log('\n📝 Leave Request:');
      console.log('leaveType:', leave.leaveType);
      console.log('leaveType type:', typeof leave.leaveType);
      console.log('leaveType instanceof ObjectId:', leave.leaveType instanceof mongoose.Types.ObjectId);
      console.log('leaveType.toString():', leave.leaveType.toString());
      console.log('workingDays:', leave.workingDays);
    }

    // Test the comparison logic
    if (leave && user.leaveBalances.length > 0) {
      console.log('\n🔍 Testing Comparison Logic:');
      
      const userBalance = user.leaveBalances[0];
      console.log('userBalance.leaveType.toString():', userBalance.leaveType.toString());
      console.log('leave.leaveType.toString():', leave.leaveType.toString());
      console.log('Direct comparison (toString):', userBalance.leaveType.toString() === leave.leaveType.toString());
      console.log('Direct comparison (ObjectId):', userBalance.leaveType.equals(leave.leaveType));
      
      // Test with populated leave
      await leave.populate('leaveType');
      console.log('After populate - leave.leaveType._id:', leave.leaveType._id);
      console.log('After populate - leave.leaveType._id.toString():', leave.leaveType._id.toString());
      console.log('Comparison with populated _id:', userBalance.leaveType.toString() === leave.leaveType._id.toString());
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugLeaveBalanceStructure(); 