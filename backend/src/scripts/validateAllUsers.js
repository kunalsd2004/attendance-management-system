const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');

async function validateAllUsers() {
  try {
    await connectDB();
    console.log('Connected to database');
    
    // Get all users
    const allUsers = await User.find({}).select('+password');
    console.log(`\n📊 Total users found: ${allUsers.length}`);
    
    const issues = [];
    const workingUsers = [];
    
    console.log('\n🔍 Validating all users...');
    
    for (const user of allUsers) {
      console.log(`\n👤 Checking user: ${user.email} (${user.role})`);
      
      // Test with expected password
      const isPasswordValid = await user.comparePassword('password123');
      
      if (isPasswordValid) {
        console.log('  ✅ Password works with: password123');
        workingUsers.push({
          email: user.email,
          role: user.role,
          name: `${user.profile.firstName} ${user.profile.lastName}`
        });
      } else {
        console.log('  ❌ Password does NOT work with: password123');
        issues.push({
          email: user.email,
          role: user.role,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          issue: 'Password mismatch'
        });
      }
      
      // Check if user has department when they shouldn't
      if ((user.role === 'admin' || user.role === 'principal') && user.profile.department) {
        console.log('  ⚠️  Admin/Principal has department (should be null)');
        issues.push({
          email: user.email,
          role: user.role,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          issue: 'Admin/Principal has department assigned'
        });
      }
      
      // Check if faculty/hod doesn't have department
      if ((user.role === 'faculty' || user.role === 'hod') && !user.profile.department) {
        console.log('  ⚠️  Faculty/HOD missing department');
        issues.push({
          email: user.email,
          role: user.role,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          issue: 'Faculty/HOD missing department'
        });
      }
    }
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Working users: ${workingUsers.length}`);
    console.log(`❌ Users with issues: ${issues.length}`);
    
    if (workingUsers.length > 0) {
      console.log('\n✅ WORKING USERS:');
      workingUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - ${user.name}`);
      });
    }
    
    if (issues.length > 0) {
      console.log('\n❌ USERS WITH ISSUES:');
      issues.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - ${user.name} - Issue: ${user.issue}`);
      });
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    if (issues.length > 0) {
      console.log('1. Run fixUserPasswords.js to reset passwords for users with issues');
      console.log('2. Run fixUserDepartments.js to fix department assignments');
    } else {
      console.log('✅ All users are properly configured!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

validateAllUsers(); 