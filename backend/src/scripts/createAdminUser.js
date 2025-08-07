const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Admin user data
const adminUser = {
  sdrn: 'ADMIN001',
  email: 'admin@dypatil.edu',
  password: 'password123',
  profile: {
    firstName: 'Admin',
    lastName: 'User',
    designation: 'System Administrator',
    joiningDate: new Date('2024-01-01')
  },
  role: 'admin',
  isActive: true
};

async function createAdminUser() {
  try {
    console.log(' Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms-db');
    console.log(' Connected to MongoDB successfully');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });
    if (existingAdmin) {
      console.log('  Admin user already exists!');
      console.log('Email: admin@dypatil.edu');
      console.log('Password: password123');
      process.exit(0);
    }

    // Create new admin user
    const user = new User(adminUser);
    await user.save();
    
    console.log(' Admin user created successfully!');
    console.log('');
    console.log(' Admin Credentials:');
    console.log('');
    console.log(' Email                Password     ');
    console.log('');
    console.log(' admin@dypatil.edu    password123  ');
    console.log('');
    console.log('');
    console.log(' Role: admin');
    console.log(' Password will be automatically hashed');
    console.log('');
    console.log(' You can now login with these credentials!');
    
    process.exit(0);
  } catch (error) {
    console.error(' Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUser();
