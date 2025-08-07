const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const LeaveType = require('../models/LeaveType');
const connectDB = require('../config/database');

async function removeAdminLeaveBalances() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Find Admin users with leave balances
    const adminUsers = await User.find({
      role: 'admin',
      isActive: true
    }).populate('leaveBalances.leaveType', 'name type');

    console.log(`\n=== ADMIN USERS WITH LEAVE BALANCES ===`);
    console.log(`Found ${adminUsers.length} admin users`);

    let updatedCount = 0;

    for (const user of adminUsers) {
      console.log(`\nProcessing admin user: ${user.profile.firstName} ${user.profile.lastName} (${user.sdrn})`);
      console.log(`  Current leave balances: ${user.leaveBalances.length}`);

      if (user.leaveBalances.length > 0) {
        // Show current balances
        user.leaveBalances.forEach(balance => {
          const leaveTypeName = balance.leaveType ? balance.leaveType.name : 'Unknown';
          console.log(`    - ${leaveTypeName}: Allocated: ${balance.allocated}, Used: ${balance.used}, Remaining: ${balance.remaining}`);
        });

        // Remove all leave balances from admin user
        user.leaveBalances = [];
        await user.save();
        updatedCount++;
        console.log(`  ✓ Removed all leave balances from admin user`);
      } else {
        console.log(`  → No leave balances to remove`);
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total admin users processed: ${adminUsers.length}`);
    console.log(`Admin users with leave balances removed: ${updatedCount}`);

    // Verify the cleanup
    console.log(`\n=== VERIFICATION ===`);
    const verifyUsers = await User.find({
      role: 'admin',
      isActive: true
    });

    verifyUsers.forEach(user => {
              console.log(`  - ${user.profile.firstName} ${user.profile.lastName} (${user.sdrn}): ${user.leaveBalances.length} leave balances`);
    });

    console.log('\nAdmin leave balances removal completed successfully!');
    console.log('Note: Admin users should only manage the application, not apply for leaves.');
    process.exit(0);
  } catch (error) {
    console.error('Remove admin leave balances failed:', error);
    process.exit(1);
  }
}

removeAdminLeaveBalances();