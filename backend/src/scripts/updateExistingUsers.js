const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Department = require('../models/Department');
const LeaveType = require('../models/LeaveType');
const connectDB = require('../config/database');

async function updateExistingUsers() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get departments
    const departments = await Department.find({ isActive: true });
    console.log(`\n=== DEPARTMENTS ===`);
    console.log(`Total departments: ${departments.length}`);
    departments.forEach(dept => {
      console.log(`  - ${dept.name} (${dept.code}): ${dept._id}`);
    });

    if (departments.length === 0) {
      console.log('No departments found. Please run initDepartments.js first.');
      process.exit(1);
    }

    // Get leave types
    const leaveTypes = await LeaveType.find({ isActive: true });
    console.log(`\n=== LEAVE TYPES ===`);
    console.log(`Total leave types: ${leaveTypes.length}`);
    leaveTypes.forEach(lt => {
      console.log(`  - ${lt.name} (${lt.type}): ${lt._id}`);
    });

    // Get all existing users
    const users = await User.find({ isActive: true });
    console.log(`\n=== UPDATING EXISTING USERS ===`);
    console.log(`Total users: ${users.length}`);

    let updatedCount = 0;

    for (const user of users) {
      console.log(`\nProcessing user: ${user.profile.firstName} ${user.profile.lastName} (${user.sdrn}) - Role: ${user.role}`);

      let departmentId = null;
      let needsUpdate = false;

      // Assign departments based on role
      if (user.role === 'hod') {
        // HOD users get IT department
        const itDepartment = departments.find(dept => dept.code === 'IT');
        if (itDepartment) {
          departmentId = itDepartment._id;
          if (!user.profile.department || user.profile.department.toString() !== departmentId.toString()) {
            user.profile.department = departmentId;
            needsUpdate = true;
            console.log(`  → Assigned to IT department: ${itDepartment.name}`);
          }
        }
      } else if (user.role === 'faculty') {
        // Faculty users get random department (excluding IT)
        const availableDepartments = departments.filter(dept => dept.code !== 'IT');
        if (availableDepartments.length > 0) {
          const randomDept = availableDepartments[Math.floor(Math.random() * availableDepartments.length)];
          departmentId = randomDept._id;
          if (!user.profile.department || user.profile.department.toString() !== departmentId.toString()) {
            user.profile.department = departmentId;
            needsUpdate = true;
            console.log(`  → Assigned to random department: ${randomDept.name}`);
          }
        }
      } else if (user.role === 'admin' || user.role === 'principal') {
        // Admin and Principal users should not have departments
        if (user.profile.department) {
          user.profile.department = null;
          needsUpdate = true;
          console.log(`  → Removed department (Admin/Principal role)`);
        }
      }

      // Check if user needs leave balances
      const currentYear = new Date().getFullYear();
      const existingBalances = user.leaveBalances.filter(balance => balance.year === currentYear);
      
      if (existingBalances.length === 0) {
        console.log(`  → Creating leave balances for year ${currentYear}`);
        
        // Create default leave balances based on role
        const defaultBalances = [];
        
        if (user.role === 'faculty' || user.role === 'hod') {
          // Faculty and HOD get standard leave allocations
          defaultBalances.push(
            { leaveType: leaveTypes.find(lt => lt.type === 'casual')._id, allocated: 12, used: 0, remaining: 12, year: currentYear },
            { leaveType: leaveTypes.find(lt => lt.type === 'medical')._id, allocated: 10, used: 0, remaining: 10, year: currentYear }
          );
        } else if (user.role === 'admin' || user.role === 'principal') {
          // Admin and Principal get more leave allocations
          defaultBalances.push(
            { leaveType: leaveTypes.find(lt => lt.type === 'casual')._id, allocated: 15, used: 0, remaining: 15, year: currentYear },
            { leaveType: leaveTypes.find(lt => lt.type === 'medical')._id, allocated: 15, used: 0, remaining: 15, year: currentYear },
            { leaveType: leaveTypes.find(lt => lt.type === 'vacation')._id, allocated: 30, used: 0, remaining: 30, year: currentYear }
          );
        }

        user.leaveBalances.push(...defaultBalances);
        needsUpdate = true;
        console.log(`  → Created ${defaultBalances.length} leave balance entries`);
      }

      if (needsUpdate) {
        await user.save();
        updatedCount++;
        console.log(`  ✓ Updated user`);
      } else {
        console.log(`  → No updates needed`);
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total users processed: ${users.length}`);
    console.log(`Users updated: ${updatedCount}`);

    // Verify the updates
    console.log(`\n=== VERIFICATION ===`);
    const verifyUsers = await User.find({ isActive: true })
      .populate('profile.department', 'name code')
      .populate('leaveBalances.leaveType', 'name type');

    verifyUsers.forEach(user => {
      const deptName = user.profile.department ? user.profile.department.name : 'No Department';
      const deptCode = user.profile.department ? user.profile.department.code : 'N/A';
      const leaveCount = user.leaveBalances.length;
              console.log(`  - ${user.profile.firstName} ${user.profile.lastName} (${user.sdrn}): ${deptName} (${deptCode}) - ${leaveCount} leave balances`);
    });

    console.log('\nExisting users update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Update existing users failed:', error);
    process.exit(1);
  }
}

updateExistingUsers(); 