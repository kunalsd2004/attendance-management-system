const mongoose = require('mongoose');
require('dotenv').config();

const Department = require('../models/Department');
const connectDB = require('../config/database');

async function debugDepartments() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get all departments without any filters
    const departments = await Department.find({});
    console.log(`\n=== ALL DEPARTMENTS (no filters) ===`);
    console.log(`Total departments: ${departments.length}`);
    
    if (departments.length === 0) {
      console.log('No departments found at all');
    } else {
      departments.forEach((dept, index) => {
        console.log(`\nDepartment ${index + 1}:`);
        console.log(`  _id: ${dept._id}`);
        console.log(`  name: ${dept.name}`);
        console.log(`  code: ${dept.code}`);
        console.log(`  isActive: ${dept.isActive}`);
        console.log(`  description: ${dept.description}`);
        console.log(`  hod: ${dept.hod}`);
        console.log(`  faculty: ${dept.faculty ? dept.faculty.length : 0} members`);
        console.log(`  createdAt: ${dept.createdAt}`);
        console.log(`  updatedAt: ${dept.updatedAt}`);
      });
    }

    // Try to find departments with isActive: true
    const activeDepartments = await Department.find({ isActive: true });
    console.log(`\n=== ACTIVE DEPARTMENTS ===`);
    console.log(`Total active departments: ${activeDepartments.length}`);

    // Try to find departments with isActive: false
    const inactiveDepartments = await Department.find({ isActive: false });
    console.log(`\n=== INACTIVE DEPARTMENTS ===`);
    console.log(`Total inactive departments: ${inactiveDepartments.length}`);

    // Try to find departments without isActive filter
    const allDepartments = await Department.find({});
    console.log(`\n=== ALL DEPARTMENTS (raw) ===`);
    console.log(`Total all departments: ${allDepartments.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Debug departments failed:', error);
    process.exit(1);
  }
}

debugDepartments(); 