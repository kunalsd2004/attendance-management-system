const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');

async function checkAdminUser() {
  try {
    await connectDB();
    console.log('Connected to database');
    
    // Find admin user with all details
    const adminUser = await User.findOne({ email: 'admin@dypatil.edu' }).select('+password');
    
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log('✅ Admin user details:');
    console.log('  _id:', adminUser._id);
    console.log('  sdrn:', adminUser.sdrn);
    console.log('  email:', adminUser.email);
    console.log('  role:', adminUser.role);
    console.log('  isActive:', adminUser.isActive);
    console.log('  password hash:', adminUser.password);
    console.log('  profile.firstName:', adminUser.profile.firstName);
    console.log('  profile.lastName:', adminUser.profile.lastName);
    console.log('  profile.designation:', adminUser.profile.designation);
    console.log('  profile.department:', adminUser.profile.department);
    console.log('  profile.joiningDate:', adminUser.profile.joiningDate);
    console.log('  createdAt:', adminUser.createdAt);
    console.log('  updatedAt:', adminUser.updatedAt);
    
    // Try different common passwords
    const commonPasswords = [
      'password123',
      'admin123',
      'admin',
      'password',
      '123456',
      'admin@123',
      'Admin123',
      'Password123'
    ];
    
    console.log('\n🔐 Testing common passwords:');
    for (const password of commonPasswords) {
      const isMatch = await adminUser.comparePassword(password);
      console.log(`  ${password}: ${isMatch ? '✅' : '❌'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAdminUser(); 