const mongoose = require('mongoose');
require('dotenv').config();

const Department = require('../models/Department');
const User = require('../models/User');
const connectDB = require('../config/database');

async function assignUserDepartments() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get all departments
    const departments = await Department.find({ isActive: true });
    console.log(`\n=== DEPARTMENTS ===`);
    console.log(`Total departments: ${departments.length}`);
    departments.forEach(dept => {
      console.log(`  - ${dept.name} (${dept.code}): ${dept._id}`);
    });

    // Get IT department for HOD users
    const itDepartment = departments.find(dept => dept.code === 'IT');
    if (!itDepartment) {
      console.error('IT department not found!');
      process.exit(1);
    }

    // Get all users
    const users = await User.find({ isActive: true });
    console.log(`\n=== ASSIGNING DEPARTMENTS TO USERS ===`);
    console.log(`Total users: ${users.length}`);

    let updatedCount = 0;

    for (const user of users) {
      console.log(`\nProcessing user: ${user.profile.firstName} ${user.profile.lastName} (${user.sdrn}) - Role: ${user.role}`);

      let departmentId = null;

      if (user.role === 'admin' || user.role === 'principal') {
        // Admin and Principal users: No department
        departmentId = null;
        console.log(`  → No department assigned (Admin/Principal role)`);
      } else if (user.role === 'hod') {
        // HOD users: IT department
        departmentId = itDepartment._id;
        console.log(`  → Assigned to IT department: ${itDepartment.name}`);
      } else if (user.role === 'faculty') {
        // Faculty users: Random department (excluding IT for HOD)
        const availableDepartments = departments.filter(dept => dept.code !== 'IT');
        const randomDept = availableDepartments[Math.floor(Math.random() * availableDepartments.length)];
        departmentId = randomDept._id;
        console.log(`  → Assigned to random department: ${randomDept.name}`);
      } else {
        // Other roles: No department
        departmentId = null;
        console.log(`  → No department assigned (unknown role: ${user.role})`);
      }

      // Update user's department
      user.profile.department = departmentId;
      await user.save();
      updatedCount++;

      console.log(`  ✓ Updated user department`);
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total users processed: ${users.length}`);
    console.log(`Users updated: ${updatedCount}`);

    // Verify the assignments
    console.log(`\n=== VERIFICATION ===`);
    const verifyUsers = await User.find({ isActive: true }).populate('profile.department', 'name code');
    
    verifyUsers.forEach(user => {
      const deptName = user.profile.department ? user.profile.department.name : 'No Department';
      const deptCode = user.profile.department ? user.profile.department.code : 'N/A';
              console.log(`  - ${user.profile.firstName} ${user.profile.lastName} (${user.sdrn}): ${deptName} (${deptCode})`);
    });

    console.log('\nDepartment assignments completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Assign user departments failed:', error);
    process.exit(1);
  }
}

assignUserDepartments(); 