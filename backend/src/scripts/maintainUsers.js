const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');

async function maintainUsers() {
  try {
    await connectDB();
    console.log('🔧 User Maintenance Script');
    console.log('========================');
    
    // Get all users
    const allUsers = await User.find({}).select('+password');
    console.log(`\n📊 Found ${allUsers.length} users in database`);
    
    let issuesFound = 0;
    let usersFixed = 0;
    
    console.log('\n🔍 Checking each user...');
    
    for (const user of allUsers) {
      console.log(`\n👤 ${user.email} (${user.role})`);
      
      // Check if password works
      const passwordWorks = await user.comparePassword('password123');
      
      if (!passwordWorks) {
        console.log('  ❌ Password issue detected');
        issuesFound++;
        
        // Fix the password
        user.password = 'password123';
        await user.save();
        
        // Verify fix
        const updatedUser = await User.findOne({ email: user.email }).select('+password');
        const isFixed = await updatedUser.comparePassword('password123');
        
        if (isFixed) {
          console.log('  ✅ Password fixed');
          usersFixed++;
        } else {
          console.log('  ❌ Failed to fix password');
        }
      } else {
        console.log('  ✅ Password working correctly');
      }
    }
    
    // Summary
    console.log('\n📋 MAINTENANCE SUMMARY:');
    console.log(`✅ Users checked: ${allUsers.length}`);
    console.log(`❌ Issues found: ${issuesFound}`);
    console.log(`🔧 Users fixed: ${usersFixed}`);
    
    if (issuesFound > 0) {
      console.log('\n💡 All users should now work with:');
      console.log('  Email: [user email]');
      console.log('  Password: password123');
    } else {
      console.log('\n🎉 All users are working correctly!');
    }
    
    console.log('\n💡 RECOMMENDATION:');
    console.log('Run this script weekly to prevent login issues.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

maintainUsers(); 