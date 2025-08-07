const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Department = require('../models/Department');
const connectDB = require('../config/database');

async function cleanAdminPrincipalDepartments() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Find Admin and Principal users that have departments assigned
    const usersWithDepartments = await User.find({
      role: { $in: ['admin', 'principal'] },
      'profile.department': { $ne: null },
      isActive: true
    }).populate('profile.department', 'name code');

    console.log(`\n=== ADMIN/PRINCIPAL USERS WITH DEPARTMENTS ===`);
    console.log(`Found ${usersWithDepartments.length} users with incorrect department assignments`);

    if (usersWithDepartments.length > 0) {
      usersWithDepartments.forEach(user => {
        console.log(`  - ${user.profile.firstName} ${user.profile.lastName} (${user.sdrn}) - Role: ${user.role} - Department: ${user.profile.department.name}`);
      });

      // Remove department assignments from Admin and Principal users
      const updateResult = await User.updateMany(
        {
          role: { $in: ['admin', 'principal'] },
          'profile.department': { $ne: null },
          isActive: true
        },
        {
          $set: { 'profile.department': null }
        }
      );

      console.log(`\n=== CLEANUP RESULTS ===`);
      console.log(`Updated ${updateResult.modifiedCount} users`);
      console.log(`Removed department assignments from Admin and Principal users`);
    } else {
      console.log(`No Admin or Principal users found with department assignments`);
    }

    // Verify the cleanup
    console.log(`\n=== VERIFICATION ===`);
    const verifyUsers = await User.find({
      role: { $in: ['admin', 'principal'] },
      isActive: true
    }).populate('profile.department', 'name code');

    verifyUsers.forEach(user => {
      const deptName = user.profile.department ? user.profile.department.name : 'No Department';
              console.log(`  - ${user.profile.firstName} ${user.profile.lastName} (${user.sdrn}) - Role: ${user.role} - Department: ${deptName}`);
    });

    console.log('\nAdmin/Principal department cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Clean admin/principal departments failed:', error);
    process.exit(1);
  }
}

cleanAdminPrincipalDepartments();