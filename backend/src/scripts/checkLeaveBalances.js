const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const LeaveType = require('../models/LeaveType');
const connectDB = require('../config/database');

async function checkLeaveBalances() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get all users with their leave balances
    const users = await User.find({})
      .populate('leaveBalances.leaveType', 'name code color type')
      .select('profile leaveBalances sdrn');

    console.log('\n=== LEAVE BALANCES IN DATABASE ===');
    console.log(`Total users: ${users.length}`);

    users.forEach(user => {
      console.log(`\nUser: ${user.profile.firstName} ${user.profile.lastName} (${user.sdrn})`);
      console.log(`Leave balances count: ${user.leaveBalances.length}`);
      
      if (user.leaveBalances.length === 0) {
        console.log('  No leave balances found');
      } else {
        user.leaveBalances.forEach(balance => {
          console.log(`  - ${balance.leaveType?.name || 'Unknown'} (${balance.leaveType?.type || 'Unknown'}):`);
          console.log(`    Allocated: ${balance.allocated}, Used: ${balance.used}, Remaining: ${balance.remaining}, Year: ${balance.year}`);
          console.log(`    LeaveType ID: ${balance.leaveType?._id || balance.leaveType || 'null'}`);
        });
      }
    });

    // Get all leave types
    const leaveTypes = await LeaveType.find({ isActive: true });
    console.log('\n=== LEAVE TYPES ===');
    console.log(`Total leave types: ${leaveTypes.length}`);
    leaveTypes.forEach(lt => {
      console.log(`  - ${lt.name} (${lt.type}): ${lt._id}`);
    });

    console.log('\n=== SUMMARY ===');
    const totalBalances = users.reduce((sum, user) => sum + user.leaveBalances.length, 0);
    console.log(`Total leave balance records: ${totalBalances}`);
    
    const balancesByYear = {};
    users.forEach(user => {
      user.leaveBalances.forEach(balance => {
        const year = balance.year;
        if (!balancesByYear[year]) balancesByYear[year] = 0;
        balancesByYear[year]++;
      });
    });
    
    console.log('Balances by year:');
    Object.entries(balancesByYear).forEach(([year, count]) => {
      console.log(`  Year ${year}: ${count} balances`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Check leave balances failed:', error);
    process.exit(1);
  }
}

checkLeaveBalances(); 