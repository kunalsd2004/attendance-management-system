const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');

async function migrateEmployeeIdToSdrn() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get the database connection
    const db = mongoose.connection.db;
    
    console.log('\n=== MIGRATING EMPLOYEE ID TO SDRN ===');
    
    // First, let's check the current state
    const usersBefore = await db.collection('users').find({}).limit(3).toArray();
    console.log('\n=== BEFORE MIGRATION ===');
    usersBefore.forEach((user, index) => {
      console.log(`  User ${index + 1}:`);
      console.log(`    _id: ${user._id}`);
      console.log(`    employeeId: ${user.employeeId || 'NOT FOUND'}`);
      console.log(`    sdrn: ${user.sdrn || 'NOT FOUND'}`);
      console.log(`    name: ${user.profile?.firstName} ${user.profile?.lastName}`);
    });

    // Drop the old employeeId index if it exists
    try {
      await db.collection('users').dropIndex('employeeId_1');
      console.log('✅ Dropped employeeId index');
    } catch (error) {
      console.log('ℹ️  employeeId index not found or already dropped');
    }

    // Update all users to rename employeeId to sdrn
    const result = await db.collection('users').updateMany(
      { employeeId: { $exists: true } },
      [
        {
          $set: {
            sdrn: '$employeeId'
          }
        },
        {
          $unset: 'employeeId'
        }
      ]
    );

    console.log(`✅ Migration completed successfully!`);
    console.log(`📊 Updated ${result.modifiedCount} users`);
    
    // Create the new sdrn index
    try {
      await db.collection('users').createIndex({ sdrn: 1 }, { unique: true });
      console.log('✅ Created sdrn index');
    } catch (error) {
      console.log('ℹ️  sdrn index already exists or creation failed:', error.message);
    }
    
    // Verify the migration
    const verifyUsers = await db.collection('users').find({}).limit(5).toArray();
    console.log('\n=== VERIFICATION ===');
    console.log(`Sample users after migration:`);
    verifyUsers.forEach((user, index) => {
      console.log(`  User ${index + 1}:`);
      console.log(`    _id: ${user._id}`);
      console.log(`    sdrn: ${user.sdrn || 'NOT FOUND'}`);
      console.log(`    employeeId: ${user.employeeId || 'REMOVED'}`);
      console.log(`    name: ${user.profile?.firstName} ${user.profile?.lastName}`);
      console.log(`    email: ${user.email}`);
    });

    // Check for any remaining employeeId fields
    const remainingEmployeeId = await db.collection('users').find({ employeeId: { $exists: true } }).count();
    console.log(`\n⚠️  Users still with employeeId field: ${remainingEmployeeId}`);

    if (remainingEmployeeId === 0) {
      console.log('✅ All users successfully migrated from employeeId to sdrn');
    } else {
      console.log('❌ Some users still have employeeId field - migration incomplete');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateEmployeeIdToSdrn(); 