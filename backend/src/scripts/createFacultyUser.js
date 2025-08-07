const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Faculty user data
const facultyUser = {
  sdrn: 'FAC001',
  email: 'faculty@dypatil.edu',
  password: 'password123',
  profile: {
    firstName: 'Faculty',
    lastName: 'User',
    designation: 'Assistant Professor',
    joiningDate: new Date('2024-01-01')
  },
  role: 'faculty',
  isActive: true
};

async function createFacultyUser() {
  try {
    console.log(' Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms-db');
    console.log(' Connected to MongoDB successfully');
    
    // Check if faculty user already exists
    const existingFaculty = await User.findOne({ email: facultyUser.email });
    if (existingFaculty) {
      console.log('  Faculty user already exists!');
      console.log('Email: faculty@dypatil.edu');
      console.log('Password: password123');
      process.exit(0);
    }

    // Create new faculty user
    const user = new User(facultyUser);
    await user.save();
    
    console.log(' Faculty user created successfully!');
    console.log('');
    console.log(' Faculty Credentials:');
    console.log('');
    console.log(' Email                Password     ');
    console.log('');
    console.log(' faculty@dypatil.edu  password123  ');
    console.log('');
    console.log('');
    console.log(' Role: faculty');
    console.log(' Password will be automatically hashed');
    console.log('');
    console.log(' You can now login with these credentials!');
    
    process.exit(0);
  } catch (error) {
    console.error(' Error creating faculty user:', error);
    process.exit(1);
  }
}

// Run the script
createFacultyUser(); 