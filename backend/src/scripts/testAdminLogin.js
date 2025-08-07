const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');

async function testAdminLogin() {
  try {
    await connectDB();
    console.log('Connected to database');
    
    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@dypatil.edu' }).select('+password');
    
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log('  Email:', adminUser.email);
    console.log('  Role:', adminUser.role);
    console.log('  Is Active:', adminUser.isActive);
    console.log('  Has Password:', !!adminUser.password);
    
    // Test password comparison
    const testPassword = 'password123';
    const isPasswordMatch = await adminUser.comparePassword(testPassword);
    
    console.log('\n🔐 Password Test:');
    console.log('  Test Password:', testPassword);
    console.log('  Password Match:', isPasswordMatch);
    
    if (isPasswordMatch) {
      console.log('✅ Password is correct!');
    } else {
      console.log('❌ Password is incorrect!');
      
      // Let's check what the actual password hash looks like
      console.log('\n🔍 Password Hash Analysis:');
      console.log('  Hash Length:', adminUser.password.length);
      console.log('  Hash Starts with $2b$:', adminUser.password.startsWith('$2b$'));
      
      // Try to create a new admin user with the same password to see if it matches
      const testUser = new User({
        sdrn: 'TEST001',
        email: 'test@dypatil.edu',
        password: testPassword,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          designation: 'Test',
          joiningDate: new Date()
        },
        role: 'admin'
      });
      
      await testUser.save();
      const testUserFromDB = await User.findOne({ email: 'test@dypatil.edu' }).select('+password');
      const testMatch = await testUserFromDB.comparePassword(testPassword);
      
      console.log('  New User Password Match:', testMatch);
      console.log('  New User Hash:', testUserFromDB.password);
      
      // Clean up test user
      await User.deleteOne({ email: 'test@dypatil.edu' });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAdminLogin(); 