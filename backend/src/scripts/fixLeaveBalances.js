const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const LeaveType = require('../models/LeaveType');
const connectDB = require('../config/database');

async function fixLeaveBalances() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get all leave types
    const leaveTypes = await LeaveType.find({ isActive: true });
    console.log(`Found ${leaveTypes.length} leave types`);

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let fixedCount = 0;
    let totalBalances = 0;

    for (const user of users) {
      console.log(`\nProcessing user: ${user.profile.firstName} ${user.profile.lastName}`);
      
      let userFixedCount = 0;
      for (const balance of user.leaveBalances) {
        totalBalances++;
        
        // Check if leaveType is null or invalid
        if (!balance.leaveType || !mongoose.Types.ObjectId.isValid(balance.leaveType)) {
          console.log(`  Fixing balance with allocated: ${balance.allocated}, used: ${balance.used}, remaining: ${balance.remaining}, year: ${balance.year}`);
          
          // Try to determine the leave type based on the allocated amount
          // This is a heuristic - we'll assign based on typical allocations
          let leaveTypeId = null;
          
          if (balance.allocated === 12) {
            // Casual leave typically has 12 days
            const casualType = leaveTypes.find(lt => lt.type === 'casual');
            if (casualType) leaveTypeId = casualType._id;
          } else if (balance.allocated === 10) {
            // Medical leave typically has 10 days
            const medicalType = leaveTypes.find(lt => lt.type === 'medical');
            if (medicalType) leaveTypeId = medicalType._id;
          } else if (balance.allocated === 30) {
            // Vacation leave typically has 30 days
            const vacationType = leaveTypes.find(lt => lt.type === 'vacation');
            if (vacationType) leaveTypeId = vacationType._id;
          } else if (balance.allocated === 15) {
            // Compensatory off typically has 15 days
            const compType = leaveTypes.find(lt => lt.type === 'compensatory_off');
            if (compType) leaveTypeId = compType._id;
          } else if (balance.allocated === 5) {
            // On duty leave
            const onDutyType = leaveTypes.find(lt => lt.type === 'on_duty');
            if (onDutyType) leaveTypeId = onDutyType._id;
          } else if (balance.allocated === 0) {
            // Special leave typically has 10 days, but if allocated is 0, assign to special
            const specialType = leaveTypes.find(lt => lt.type === 'special');
            if (specialType) leaveTypeId = specialType._id;
          }
          
          if (leaveTypeId) {
            balance.leaveType = leaveTypeId;
            userFixedCount++;
            fixedCount++;
            console.log(`    Fixed: Assigned to leave type ID: ${leaveTypeId}`);
          } else {
            console.log(`    Could not determine leave type for allocated: ${balance.allocated}`);
          }
        }
      }
      
      if (userFixedCount > 0) {
        await user.save();
        console.log(`  Saved user with ${userFixedCount} fixed balances`);
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total balances processed: ${totalBalances}`);
    console.log(`Fixed balances: ${fixedCount}`);
    console.log(`Users processed: ${users.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Fix leave balances failed:', error);
    process.exit(1);
  }
}

fixLeaveBalances(); 