const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');

async function resetAdminPassword() {
  try {
    await connectDB();
    console.log('Connected to database');
    
    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@dypatil.edu' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log('✅ Found admin user:');
    console.log('  Email:', adminUser.email);
    console.log('  Name:', adminUser.profile.firstName, adminUser.profile.lastName);
    console.log('  Role:', adminUser.role);
    
    // Reset password to password123
    adminUser.password = 'password123';
    await adminUser.save();
    
    console.log('\n✅ Password reset successfully!');
    console.log('New password: password123');
    
    // Verify the password works
    const updatedAdmin = await User.findOne({ email: 'admin@dypatil.edu' }).select('+password');
    const isPasswordMatch = await updatedAdmin.comparePassword('password123');
    
    console.log('\n🔐 Password verification:');
    console.log('  Password match:', isPasswordMatch ? '✅' : '❌');
    
    if (isPasswordMatch) {
      console.log('\n🎉 Admin login should now work with:');
      console.log('  Email: admin@dypatil.edu');
      console.log('  Password: password123');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword(); 