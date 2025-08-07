const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const LeaveType = require('../models/LeaveType');
const connectDB = require('../config/database');

async function setLeaveTypeReferences() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get all leave types
    const leaveTypes = await LeaveType.find({ isActive: true });
    console.log(`Found ${leaveTypes.length} leave types:`);
    leaveTypes.forEach(lt => {
      console.log(`  - ${lt.name} (${lt.type}): ${lt._id}`);
    });

    // Get all users
    const users = await User.find({});
    console.log(`\nFound ${users.length} users`);

    let updatedCount = 0;

    for (const user of users) {
      console.log(`\nProcessing user: ${user.profile.firstName} ${user.profile.lastName}`);
      
      let userUpdatedCount = 0;
      for (const balance of user.leaveBalances) {
        // Check if leaveType is null
        if (!balance.leaveType) {
          console.log(`  Setting leave type for balance: allocated=${balance.allocated}, used=${balance.used}, remaining=${balance.remaining}, year=${balance.year}`);
          
          // Determine leave type based on allocated amount
          let leaveTypeId = null;
          
          if (balance.allocated === 12) {
            // Casual leave typically has 12 days
            const casualType = leaveTypes.find(lt => lt.type === 'casual');
            if (casualType) leaveTypeId = casualType._id;
            console.log(`    Assigning to Casual Leave (${leaveTypeId})`);
          } else if (balance.allocated === 10) {
            // Medical leave typically has 10 days
            const medicalType = leaveTypes.find(lt => lt.type === 'medical');
            if (medicalType) leaveTypeId = medicalType._id;
            console.log(`    Assigning to Medical Leave (${leaveTypeId})`);
          } else if (balance.allocated === 16) {
            // This might be a custom allocation, assign to casual
            const casualType = leaveTypes.find(lt => lt.type === 'casual');
            if (casualType) leaveTypeId = casualType._id;
            console.log(`    Assigning to Casual Leave (${leaveTypeId}) - custom allocation`);
          } else if (balance.allocated === 0) {
            // Special leave typically has 10 days, but if allocated is 0, assign to special
            const specialType = leaveTypes.find(lt => lt.type === 'special');
            if (specialType) leaveTypeId = specialType._id;
            console.log(`    Assigning to Special Leave (${leaveTypeId})`);
          } else {
            console.log(`    Could not determine leave type for allocated: ${balance.allocated}`);
            continue;
          }
          
          if (leaveTypeId) {
            balance.leaveType = leaveTypeId;
            userUpdatedCount++;
            updatedCount++;
          }
        }
      }
      
      if (userUpdatedCount > 0) {
        await user.save();
        console.log(`  Saved user with ${userUpdatedCount} updated balances`);
      } else {
        console.log(`  No updates needed for this user`);
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total balances updated: ${updatedCount}`);
    console.log(`Users processed: ${users.length}`);

    // Verify the fix
    console.log(`\n=== VERIFICATION ===`);
    const verifyUsers = await User.find({})
      .populate('leaveBalances.leaveType', 'name code color type')
      .select('profile leaveBalances sdrn');

    verifyUsers.forEach(user => {
      console.log(`\nUser: ${user.profile.firstName} ${user.profile.lastName}`);
      user.leaveBalances.forEach(balance => {
        console.log(`  - ${balance.leaveType?.name || 'Unknown'} (${balance.leaveType?.type || 'Unknown'}):`);
        console.log(`    Allocated: ${balance.allocated}, Used: ${balance.used}, Remaining: ${balance.remaining}, Year: ${balance.year}`);
      });
    });

    process.exit(0);
  } catch (error) {
    console.error('Set leave type references failed:', error);
    process.exit(1);
  }
}

setLeaveTypeReferences(); 