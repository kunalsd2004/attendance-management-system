const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');

async function addDepartmentsToDB() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get database connection
    const db = mongoose.connection.db;
    
    // Define departments
    const departments = [
      {
        name: 'Computer Engineering',
        code: 'CE',
        description: 'Computer Engineering Department',
        hod: null,
        faculty: [],
        isActive: true,
        settings: {},
        statistics: {},
        leaveApprovalWorkflow: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Information Technology',
        code: 'IT',
        description: 'Information Technology Department',
        hod: null,
        faculty: [],
        isActive: true,
        settings: {},
        statistics: {},
        leaveApprovalWorkflow: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Computer Science Engineering',
        code: 'CSE',
        description: 'Computer Science Engineering Department',
        hod: null,
        faculty: [],
        isActive: true,
        settings: {},
        statistics: {},
        leaveApprovalWorkflow: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Electronics and Telecommunications',
        code: 'EXTC',
        description: 'Electronics and Telecommunications Department',
        hod: null,
        faculty: [],
        isActive: true,
        settings: {},
        statistics: {},
        leaveApprovalWorkflow: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Electronics and Instrumentation',
        code: 'EI',
        description: 'Electronics and Instrumentation Department',
        hod: null,
        faculty: [],
        isActive: true,
        settings: {},
        statistics: {},
        leaveApprovalWorkflow: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Engineering Sciences',
        code: 'ES',
        description: 'Engineering Sciences Department',
        hod: null,
        faculty: [],
        isActive: true,
        settings: {},
        statistics: {},
        leaveApprovalWorkflow: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Clear existing departments
    await db.collection('departments').deleteMany({});
    console.log('Cleared existing departments');

    // Insert departments
    const result = await db.collection('departments').insertMany(departments);
    console.log(`Created ${result.insertedCount} departments`);

    // Verify departments were created
    const deptCount = await db.collection('departments').countDocuments();
    console.log(`\n=== VERIFICATION ===`);
    console.log(`Total departments in database: ${deptCount}`);

    if (deptCount > 0) {
      const createdDepts = await db.collection('departments').find({}).toArray();
      console.log(`\n=== CREATED DEPARTMENTS ===`);
      createdDepts.forEach(dept => {
        console.log(`  - ${dept.name} (${dept.code}): ${dept._id}`);
      });
    }

    console.log('\nDepartments added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Add departments to DB failed:', error);
    process.exit(1);
  }
}

addDepartmentsToDB(); 