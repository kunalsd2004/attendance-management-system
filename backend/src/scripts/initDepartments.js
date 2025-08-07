const mongoose = require('mongoose');
require('dotenv').config();

const Department = require('../models/Department');
const connectDB = require('../config/database');

async function initDepartments() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Define departments
    const departments = [
      {
        name: 'Computer Engineering',
        code: 'CE',
        description: 'Computer Engineering Department',
        hod: null,
        isActive: true
      },
      {
        name: 'Information Technology',
        code: 'IT',
        description: 'Information Technology Department',
        hod: null,
        isActive: true
      },
      {
        name: 'Computer Science Engineering',
        code: 'CSE',
        description: 'Computer Science Engineering Department',
        hod: null,
        isActive: true
      },
      {
        name: 'Electronics and Telecommunications',
        code: 'EXTC',
        description: 'Electronics and Telecommunications Department',
        hod: null,
        isActive: true
      },
      {
        name: 'Electronics and Instrumentation',
        code: 'EI',
        description: 'Electronics and Instrumentation Department',
        hod: null,
        isActive: true
      },
      {
        name: 'Engineering Sciences',
        code: 'ES',
        description: 'Engineering Sciences Department',
        hod: null,
        isActive: true
      }
    ];

    // Clear existing departments
    await Department.deleteMany({});
    console.log('Cleared existing departments');

    // Insert departments
    const createdDepartments = await Department.insertMany(departments);
    console.log('Created departments:', createdDepartments.length);

    createdDepartments.forEach(dept => {
      console.log(`- ${dept.name} (${dept.code}): ${dept._id}`);
    });

    console.log('Departments initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Departments initialization failed:', error);
    process.exit(1);
  }
}

initDepartments(); 