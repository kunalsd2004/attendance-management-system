const mongoose = require('mongoose');
require('dotenv').config();

const Department = require('../models/Department');
const User = require('../models/User');
const connectDB = require('../config/database');

async function checkDepartments() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get all departments
    const departments = await Department.find({});
    console.log(`\n=== DEPARTMENTS ===`);
    console.log(`Total departments: ${departments.length}`);
    
    if (departments.length === 0) {
      console.log('No departments found in database');
    } else {
      departments.forEach(dept => {
        console.log(`  - ${dept.name} (${dept.code}): ${dept._id}`);
      });
    }

    // Get all users and their departments
    const users = await User.find({ isActive: true }).select('profile employeeId');
    console.log(`\n=== USERS AND THEIR DEPARTMENTS ===`);
    console.log(`Total users: ${users.length}`);
    
    users.forEach(user => {
      console.log(`  - ${user.profile.firstName} ${user.profile.lastName} (${user.employeeId}):`);
      console.log(`    Department: ${user.profile.department || 'Not assigned'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Check departments failed:', error);
    process.exit(1);
  }
}

checkDepartments(); 