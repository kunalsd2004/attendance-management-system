const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Principal user data
const principalUser = {
  sdrn: 'PRINCIPAL001',
  email: 'principal@dypatil.edu',
  password: 'password123',
  profile: {
    firstName: 'Principal',
    lastName: 'User',
    designation: 'Principal',
    joiningDate: new Date('2024-01-01')
  },
  role: 'principal',
  isActive: true
};

async function createPrincipalUser() {
  try {
    console.log(' Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms-db');
    console.log(' Connected to MongoDB successfully');
    
    // Check if Principal user already exists
    const existingPrincipal = await User.findOne({ email: principalUser.email });
    if (existingPrincipal) {
      console.log('  Principal user already exists!');
      console.log('Email: principal@dypatil.edu');
      console.log('Password: password123');
      process.exit(0);
    }

    // Create new Principal user
    const user = new User(principalUser);
    await user.save();
    
    console.log(' Principal user created successfully!');
    console.log('');
    console.log(' Principal Credentials:');
    console.log('');
    console.log(' Email                Password     ');
    console.log('');
    console.log(' principal@dypatil.edu password123  ');
    console.log('');
    console.log('');
    console.log(' Role: principal');
    console.log(' Password will be automatically hashed');
    console.log('');
    console.log(' You can now login with these credentials!');
    
    process.exit(0);
  } catch (error) {
    console.error(' Error creating Principal user:', error);
    process.exit(1);
  }
}

// Run the script
createPrincipalUser(); 