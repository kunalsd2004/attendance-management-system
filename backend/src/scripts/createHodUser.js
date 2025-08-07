const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// HOD user data
const hodUser = {
  sdrn: 'HOD001',
  email: 'hod@dypatil.edu',
  password: 'password123',
  profile: {
    firstName: 'HOD',
    lastName: 'User',
    designation: 'Head of Department',
    joiningDate: new Date('2024-01-01')
  },
  role: 'hod',
  isActive: true
};

async function createHodUser() {
  try {
    console.log(' Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms-db');
    console.log(' Connected to MongoDB successfully');
    
    // Check if HOD user already exists
    const existingHod = await User.findOne({ email: hodUser.email });
    if (existingHod) {
      console.log('  HOD user already exists!');
      console.log('Email: hod@dypatil.edu');
      console.log('Password: password123');
      process.exit(0);
    }

    // Create new HOD user
    const user = new User(hodUser);
    await user.save();
    
    console.log(' HOD user created successfully!');
    console.log('');
    console.log(' HOD Credentials:');
    console.log('');
    console.log(' Email                Password     ');
    console.log('');
    console.log(' hod@dypatil.edu      password123  ');
    console.log('');
    console.log('');
    console.log(' Role: hod');
    console.log(' Password will be automatically hashed');
    console.log('');
    console.log(' You can now login with these credentials!');
    
    process.exit(0);
  } catch (error) {
    console.error(' Error creating HOD user:', error);
    process.exit(1);
  }
}

// Run the script
createHodUser(); 