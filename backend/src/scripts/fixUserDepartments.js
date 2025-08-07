const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');
const Department = require('../models/Department');

async function fixUserDepartments() {
  try {
    await connectDB();
    console.log('Connected to database');
    
    // Get all users
    const allUsers = await User.find({});
    console.log(`\n📊 Total users found: ${allUsers.length}`);
    
    // Get departments
    const departments = await Department.find({ isActive: true });
    console.log(`📊 Available departments: ${departments.length}`);
    
    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    
    console.log('\n🔧 Fixing user departments...');
    
    for (const user of allUsers) {
      console.log(`\n👤 Processing: ${user.email} (${user.role})`);
      
      let needsFix = false;
      let fixAction = '';
      
      // Check admin/principal users - should NOT have department
      if ((user.role === 'admin' || user.role === 'principal') && user.profile.department) {
        needsFix = true;
        fixAction = 'Remove department (admin/principal should not have department)';
        user.profile.department = null;
      }
      
      // Check faculty/hod users - should have department
      if ((user.role === 'faculty' || user.role === 'hod') && !user.profile.department) {
        needsFix = true;
        
        if (user.role === 'hod') {
          // HOD gets IT department
          const itDept = departments.find(d => d.code === 'IT');
          if (itDept) {
            user.profile.department = itDept._id;
            fixAction = `Assign IT department (${itDept.name})`;
          } else {
            fixAction = 'No IT department found - cannot assign';
            needsFix = false;
          }
        } else {
          // Faculty gets random department (excluding IT)
          const availableDepts = departments.filter(d => d.code !== 'IT');
          if (availableDepts.length > 0) {
            const randomDept = availableDepts[Math.floor(Math.random() * availableDepts.length)];
            user.profile.department = randomDept._id;
            fixAction = `Assign random department (${randomDept.name})`;
          } else {
            fixAction = 'No available departments found - cannot assign';
            needsFix = false;
          }
        }
      }
      
      if (needsFix) {
        console.log(`  🔧 ${fixAction}`);
        await user.save();
        fixedCount++;
      } else {
        console.log('  ✅ Department assignment is correct');
        alreadyCorrectCount++;
      }
    }
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Already correct: ${alreadyCorrectCount}`);
    console.log(`🔧 Fixed: ${fixedCount}`);
    console.log(`📊 Total processed: ${allUsers.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUserDepartments(); 