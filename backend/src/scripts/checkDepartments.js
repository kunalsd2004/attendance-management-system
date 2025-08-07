const mongoose = require('mongoose');
require('dotenv').config();

const Department = require('../models/Department');
const connectDB = require('../config/database');

async function checkDepartments() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get all departments without any filters
    const departments = await Department.find({});
    console.log(`\n=== ALL DEPARTMENTS ===`);
    console.log(`Total departments: ${departments.length}`);
    
    if (departments.length === 0) {
      console.log('No departments found. Creating default departments...');
      
      // Create default departments
      const defaultDepartments = [
        { name: 'Computer Engineering', code: 'CE' },
        { name: 'Information Technology', code: 'IT' },
        { name: 'Computer Science Engineering', code: 'CSE' },
        { name: 'Electronics and Telecommunications', code: 'EXTC' },
        { name: 'Electronics and Instrumentation', code: 'EI' },
        { name: 'Engineering Sciences', code: 'ES' }
      ];
      
      const createdDepartments = await Department.insertMany(defaultDepartments);
      console.log('Created departments:', createdDepartments.length);
      
      createdDepartments.forEach(dept => {
        console.log(`- ${dept.name} (${dept.code}): ${dept._id}`);
      });
    } else {
      departments.forEach((dept, index) => {
        console.log(`\nDepartment ${index + 1}:`);
        console.log(`  _id: ${dept._id}`);
        console.log(`  name: ${dept.name}`);
        console.log(`  code: ${dept.code}`);
        console.log(`  isActive: ${dept.isActive}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking departments:', error);
    process.exit(1);
  }
}

checkDepartments(); 