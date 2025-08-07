const mongoose = require('mongoose');
const User = require('../models/User');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-ms');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Reset leave balances for a specific user
const resetLeaveBalances = async (userId, year = 2025) => {
  try {
    console.log(`Resetting leave balances for user ${userId} for year ${year}...`);
    
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found');
      return;
    }

    console.log(`Found user: ${user.profile?.firstName || 'Unknown'} ${user.profile?.lastName || 'User'}`);
    console.log('Current leave balances:');
    user.leaveBalances.forEach((balance, index) => {
      console.log(`  ${index + 1}. Leave Type: ${balance.leaveType}, Allocated: ${balance.allocated}, Used: ${balance.used}, Remaining: ${balance.remaining}, Year: ${balance.year}`);
    });

    // Reset all leave balances for the specified year
    let resetCount = 0;
    user.leaveBalances.forEach(balance => {
      if (balance.year === year) {
        const originalAllocated = balance.allocated;
        balance.used = 0;
        balance.remaining = originalAllocated;
        resetCount++;
        console.log(`  Reset: Leave Type ${balance.leaveType}, Allocated: ${originalAllocated}, Used: 0, Remaining: ${originalAllocated}`);
      }
    });

    if (resetCount === 0) {
      console.log(`No leave balances found for year ${year}`);
      return;
    }

    await user.save();
    console.log(`Successfully reset ${resetCount} leave balance(s) for user ${userId}`);
    
    // Show updated balances
    console.log('Updated leave balances:');
    user.leaveBalances.forEach((balance, index) => {
      console.log(`  ${index + 1}. Leave Type: ${balance.leaveType}, Allocated: ${balance.allocated}, Used: ${balance.used}, Remaining: ${balance.remaining}, Year: ${balance.year}`);
    });

  } catch (error) {
    console.error('Error resetting leave balances:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  // Replace with the actual user ID from your database
  const userId = '6885cc2f8057ec72790446f8'; // Faculty user ID
  const year = 2025;
  
  await resetLeaveBalances(userId, year);
  
  console.log('Script completed');
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { resetLeaveBalances }; 