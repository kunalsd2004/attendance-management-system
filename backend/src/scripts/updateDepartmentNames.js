const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');

async function updateDepartmentNames() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get the database connection
    const db = mongoose.connection.db;

    console.log('\n=== UPDATING DEPARTMENT NAMES ===');

    // Define the new department names and codes
    const newDepartments = [
      {
        name: 'Computer Engineering',
        code: 'CE',
        description: 'Computer Engineering Department'
      },
      {
        name: 'Information Technology',
        code: 'IT',
        description: 'Information Technology Department'
      },
      {
        name: 'Computer Science Engineering',
        code: 'CSE',
        description: 'Computer Science Engineering Department'
      },
      {
        name: 'Electronics and Telecommunications',
        code: 'EXTC',
        description: 'Electronics and Telecommunications Department'
      },
      {
        name: 'Electronics and Instrumentation',
        code: 'EI',
        description: 'Electronics and Instrumentation Department'
      },
      {
        name: 'Engineering Sciences',
        code: 'ES',
        description: 'Engineering Sciences Department'
      }
    ];

    // First, let's check the current state
    const currentDepartments = await db.collection('departments').find({}).toArray();
    console.log('\n=== CURRENT DEPARTMENTS ===');
    currentDepartments.forEach((dept, index) => {
      console.log(`  ${index + 1}. ${dept.name} (${dept.code}): ${dept._id}`);
    });

    // Clear existing departments
    await db.collection('departments').deleteMany({});
    console.log('\n✅ Cleared existing departments');

    // Insert new departments
    const result = await db.collection('departments').insertMany(newDepartments);
    console.log(`✅ Created ${result.insertedCount} new departments`);

    // Verify the new departments
    const verifyDepartments = await db.collection('departments').find({}).toArray();
    console.log('\n=== NEW DEPARTMENTS ===');
    verifyDepartments.forEach((dept, index) => {
      console.log(`  ${index + 1}. ${dept.name} (${dept.code}): ${dept._id}`);
    });

    // Check if there are any users with old department references
    const usersWithOldDepartments = await db.collection('users').find({
      'profile.department': { $exists: true, $ne: null }
    }).count();
    
    console.log(`\n⚠️  Users with department references: ${usersWithOldDepartments}`);
    
    if (usersWithOldDepartments > 0) {
      console.log('⚠️  Note: Users may have references to old departments. Consider updating user department assignments.');
      
      // Show sample users with department references
      const sampleUsers = await db.collection('users').find({
        'profile.department': { $exists: true, $ne: null }
      }).limit(3).toArray();
      
      console.log('\n=== SAMPLE USERS WITH DEPARTMENTS ===');
      sampleUsers.forEach((user, index) => {
        console.log(`  User ${index + 1}: ${user.profile?.firstName} ${user.profile?.lastName} (${user.sdrn})`);
        console.log(`    Department ID: ${user.profile?.department}`);
      });
    }

    console.log('\n✅ Department names updated successfully!');
    console.log('📋 New departments:');
    newDepartments.forEach((dept, index) => {
      console.log(`  ${index + 1}. ${dept.name} (${dept.code})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Department update failed:', error);
    process.exit(1);
  }
}

updateDepartmentNames(); 