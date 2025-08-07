const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const LeaveType = require('../models/LeaveType');
const connectDB = require('../config/database');

async function debugLeaveBalances() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get all users without population
    const users = await User.find({}).select('profile leaveBalances sdrn');
    console.log(`\nFound ${users.length} users`);

    users.forEach(user => {
      console.log(`\nUser: ${user.profile.firstName} ${user.profile.lastName} (${user.sdrn})`);
      console.log(`Leave balances count: ${user.leaveBalances.length}`);
      
      user.leaveBalances.forEach((balance, index) => {
        console.log(`  Balance ${index + 1}:`);
        console.log(`    Allocated: ${balance.allocated}`);
        console.log(`    Used: ${balance.used}`);
        console.log(`    Remaining: ${balance.remaining}`);
        console.log(`    Year: ${balance.year}`);
        console.log(`    LeaveType (raw): ${balance.leaveType}`);
        console.log(`    LeaveType type: ${typeof balance.leaveType}`);
        console.log(`    LeaveType is ObjectId: ${mongoose.Types.ObjectId.isValid(balance.leaveType)}`);
        
        if (balance.leaveType && mongoose.Types.ObjectId.isValid(balance.leaveType)) {
          console.log(`    LeaveType toString: ${balance.leaveType.toString()}`);
        }
      });
    });

    // Get all leave types
    const leaveTypes = await LeaveType.find({ isActive: true });
    console.log(`\n=== LEAVE TYPES ===`);
    console.log(`Total leave types: ${leaveTypes.length}`);
    leaveTypes.forEach(lt => {
      console.log(`  - ${lt.name} (${lt.type}): ${lt._id}`);
    });

    // Try to find a specific leave balance and populate it
    if (users.length > 0 && users[0].leaveBalances.length > 0) {
      const firstUser = users[0];
      const firstBalance = firstUser.leaveBalances[0];
      
      console.log(`\n=== TESTING POPULATION ===`);
      console.log(`Testing balance: ${JSON.stringify(firstBalance)}`);
      
      if (firstBalance.leaveType && mongoose.Types.ObjectId.isValid(firstBalance.leaveType)) {
        // Try to populate this specific balance
        const populatedUser = await User.findById(firstUser._id)
          .populate('leaveBalances.leaveType', 'name code color type');
        
        const populatedBalance = populatedUser.leaveBalances.find(
          b => b._id.toString() === firstBalance._id.toString()
        );
        
        console.log(`Populated balance: ${JSON.stringify(populatedBalance)}`);
        console.log(`LeaveType after population: ${populatedBalance?.leaveType?.name || 'Still unknown'}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Debug leave balances failed:', error);
    process.exit(1);
  }
}

debugLeaveBalances(); 