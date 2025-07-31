const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Department = require('../models/Department');

const connectDB = require('../config/database');

async function initDatabase() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Create departments
    const departments = [
      {
        name: 'Computer Science',
        code: 'CS',
        description: 'Computer Science Department'
      },
      {
        name: 'Information Technology',
        code: 'IT',
        description: 'Information Technology Department'
      },
      {
        name: 'Electronics & Communication',
        code: 'EC',
        description: 'Electronics & Communication Department'
      },
      {
        name: 'Mechanical Engineering',
        code: 'ME',
        description: 'Mechanical Engineering Department'
      },
      {
        name: 'Civil Engineering',
        code: 'CE',
        description: 'Civil Engineering Department'
      }
    ];

    // Clear existing departments
    await Department.deleteMany({});
    console.log('Cleared existing departments');

    // Insert departments
    const createdDepartments = await Department.insertMany(departments);
    console.log('Created departments:', createdDepartments.length);

    // Create test users
    const testUsers = [
      {
        employeeId: 'ADMIN001',
        email: 'admin@dypatil.edu',
        password: 'password123',
        profile: {
          firstName: 'Admin',
          lastName: 'User',
          designation: 'System Administrator',
          department: createdDepartments[0]._id, // CS department
          joiningDate: new Date('2024-01-01')
        },
        role: 'admin',
        isActive: true
      },
      {
        employeeId: 'PRINCIPAL001',
        email: 'principal@dypatil.edu',
        password: 'password123',
        profile: {
          firstName: 'Principal',
          lastName: 'User',
          designation: 'Principal',
          department: createdDepartments[0]._id,
          joiningDate: new Date('2024-01-01')
        },
        role: 'principal',
        isActive: true
      },
      {
        employeeId: 'HOD001',
        email: 'hod@dypatil.edu',
        password: 'password123',
        profile: {
          firstName: 'HOD',
          lastName: 'User',
          designation: 'Head of Department',
          department: createdDepartments[0]._id,
          joiningDate: new Date('2024-01-01')
        },
        role: 'hod',
        isActive: true
      },
      {
        employeeId: 'FACULTY001',
        email: 'faculty@dypatil.edu',
        password: 'password123',
        profile: {
          firstName: 'Faculty',
          lastName: 'User',
          designation: 'Assistant Professor',
          department: createdDepartments[0]._id,
          joiningDate: new Date('2024-01-01')
        },
        role: 'faculty',
        isActive: true
      }
    ];

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create users (password will be hashed by User model's pre-save middleware)
    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
    }
    console.log('Created test users:', testUsers.length);

    console.log('Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase(); 