const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Department = require('../models/Department');
const connectDB = require('../config/database');

async function testUserModel() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get departments
    const departments = await Department.find({ isActive: true });
    console.log(`\n=== DEPARTMENTS ===`);
    console.log(`Total departments: ${departments.length}`);
    departments.forEach(dept => {
      console.log(`  - ${dept.name} (${dept.code}): ${dept._id}`);
    });

    if (departments.length === 0) {
      console.log('No departments found. Please run initDepartments.js first.');
      process.exit(1);
    }

    // Test creating users with different roles
    console.log(`\n=== TESTING USER CREATION ===`);

    // Test 1: Create faculty user (should auto-assign department)
    console.log('\n1. Testing faculty user creation...');
    try {
      const facultyUser = new User({
        sdrn: 'TEST_FAC001',
        email: 'test.faculty@test.com',
        password: 'password123',
        profile: {
          firstName: 'Test',
          lastName: 'Faculty',
          designation: 'Assistant Professor',
          joiningDate: new Date()
        },
        role: 'faculty'
      });

      await facultyUser.save();
      console.log('  ✓ Faculty user created successfully');
      console.log(`  Department: ${facultyUser.profile.department}`);
    } catch (error) {
      console.log('  ✗ Faculty user creation failed:', error.message);
    }

    // Test 2: Create HOD user (should auto-assign IT department)
    console.log('\n2. Testing HOD user creation...');
    try {
      const hodUser = new User({
        sdrn: 'TEST_HOD001',
        email: 'test.hod@test.com',
        password: 'password123',
        profile: {
          firstName: 'Test',
          lastName: 'HOD',
          designation: 'Head of Department',
          joiningDate: new Date()
        },
        role: 'hod'
      });

      await hodUser.save();
      console.log('  ✓ HOD user created successfully');
      console.log(`  Department: ${hodUser.profile.department}`);
    } catch (error) {
      console.log('  ✗ HOD user creation failed:', error.message);
    }

    // Test 3: Create admin user (should not have department)
    console.log('\n3. Testing admin user creation...');
    try {
      const adminUser = new User({
        sdrn: 'TEST_ADMIN001',
        email: 'test.admin@test.com',
        password: 'password123',
        profile: {
          firstName: 'Test',
          lastName: 'Admin',
          designation: 'System Administrator',
          joiningDate: new Date()
        },
        role: 'admin'
      });

      await adminUser.save();
      console.log('  ✓ Admin user created successfully');
      console.log(`  Department: ${adminUser.profile.department}`);
    } catch (error) {
      console.log('  ✗ Admin user creation failed:', error.message);
    }

    // Test 4: Create principal user (should not have department)
    console.log('\n4. Testing principal user creation...');
    try {
      const principalUser = new User({
        sdrn: 'TEST_PRINCIPAL001',
        email: 'test.principal@test.com',
        password: 'password123',
        profile: {
          firstName: 'Test',
          lastName: 'Principal',
          designation: 'Principal',
          joiningDate: new Date()
        },
        role: 'principal'
      });

      await principalUser.save();
      console.log('  ✓ Principal user created successfully');
      console.log(`  Department: ${principalUser.profile.department}`);
    } catch (error) {
      console.log('  ✗ Principal user creation failed:', error.message);
    }

    // Clean up test users
    console.log('\n=== CLEANING UP TEST USERS ===');
    await User.deleteMany({ sdrn: { $regex: '^TEST_' } });
    console.log('Test users cleaned up');

    console.log('\nUser model validation tests completed!');
    process.exit(0);
  } catch (error) {
    console.error('Test user model failed:', error);
    process.exit(1);
  }
}

testUserModel(); 