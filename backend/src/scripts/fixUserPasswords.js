const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');

async function fixUserPasswords() {
  try {
    await connectDB();
    console.log('Connected to database');
    
    // Get all users
    const allUsers = await User.find({}).select('+password');
    console.log(`\n📊 Total users found: ${allUsers.length}`);
    
    let fixedCount = 0;
    let alreadyWorkingCount = 0;
    
    console.log('\n🔧 Fixing user passwords...');
    
    for (const user of allUsers) {
      console.log(`\n👤 Processing: ${user.email} (${user.role})`);
      
      // Test current password
      const isPasswordValid = await user.comparePassword('password123');
      
      if (isPasswordValid) {
        console.log('  ✅ Password already works - skipping');
        alreadyWorkingCount++;
      } else {
        console.log('  🔧 Fixing password...');
        
        // Reset password to password123
        user.password = 'password123';
        await user.save();
        
        // Verify the fix
        const updatedUser = await User.findOne({ email: user.email }).select('+password');
        const isFixed = await updatedUser.comparePassword('password123');
        
        if (isFixed) {
          console.log('  ✅ Password fixed successfully');
          fixedCount++;
        } else {
          console.log('  ❌ Failed to fix password');
        }
      }
    }
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Already working: ${alreadyWorkingCount}`);
    console.log(`🔧 Fixed: ${fixedCount}`);
    console.log(`📊 Total processed: ${allUsers.length}`);
    
    if (fixedCount > 0) {
      console.log('\n🎉 All users should now work with:');
      console.log('  Email: [user email]');
      console.log('  Password: password123');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUserPasswords(); 