const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');

async function fixUserDepartmentReferences() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get the database connection
    const db = mongoose.connection.db;

    console.log('\n=== FIXING USER DEPARTMENT REFERENCES ===');

    // Get all departments
    const departments = await db.collection('departments').find({}).toArray();
    console.log('\n=== AVAILABLE DEPARTMENTS ===');
    departments.forEach((dept, index) => {
      console.log(`  ${index + 1}. ${dept.name} (${dept.code}): ${dept._id}`);
    });

    // Get all users with department references
    const usersWithDepartments = await db.collection('users').find({
      'profile.department': { $exists: true, $ne: null }
    }).toArray();

    console.log(`\n=== USERS WITH DEPARTMENT REFERENCES ===`);
    console.log(`Found ${usersWithDepartments.length} users with department references`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of usersWithDepartments) {
      console.log(`\nProcessing user: ${user.profile?.firstName} ${user.profile?.lastName} (${user.sdrn})`);
      console.log(`  Current department ID: ${user.profile?.department}`);
      console.log(`  Role: ${user.role}`);

      let newDepartmentId = null;

      if (user.role === 'hod') {
        // HOD users get IT department
        const itDepartment = departments.find(dept => dept.code === 'IT');
        if (itDepartment) {
          newDepartmentId = itDepartment._id;
          console.log(`  → Assigning to IT department: ${itDepartment.name}`);
        } else {
          console.log(`  ❌ IT department not found!`);
        }
      } else if (user.role === 'faculty') {
        // Faculty users get random department (excluding IT for HOD)
        const availableDepartments = departments.filter(dept => dept.code !== 'IT');
        if (availableDepartments.length > 0) {
          const randomDept = availableDepartments[Math.floor(Math.random() * availableDepartments.length)];
          newDepartmentId = randomDept._id;
          console.log(`  → Assigning to random department: ${randomDept.name}`);
        } else {
          console.log(`  ❌ No available departments found!`);
        }
      } else {
        // Admin and Principal users don't need departments
        newDepartmentId = null;
        console.log(`  → Removing department assignment (Admin/Principal role)`);
      }

      if (newDepartmentId !== user.profile?.department) {
        // Update user's department
        const result = await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { 'profile.department': newDepartmentId } }
        );

        if (result.modifiedCount > 0) {
          console.log(`  ✅ Updated department assignment`);
          updatedCount++;
        } else {
          console.log(`  ⚠️  No changes made`);
          skippedCount++;
        }
      } else {
        console.log(`  ℹ️  Department already correct`);
        skippedCount++;
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total users processed: ${usersWithDepartments.length}`);
    console.log(`Users updated: ${updatedCount}`);
    console.log(`Users skipped: ${skippedCount}`);

    // Verify the updates
    console.log(`\n=== VERIFICATION ===`);
    const verifyUsers = await db.collection('users').find({
      'profile.department': { $exists: true, $ne: null }
    }).toArray();

    console.log(`Users with department assignments after update:`);
    verifyUsers.forEach((user, index) => {
      const dept = departments.find(d => d._id.toString() === user.profile?.department?.toString());
      console.log(`  ${index + 1}. ${user.profile?.firstName} ${user.profile?.lastName} (${user.sdrn})`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Department: ${dept ? dept.name : 'Unknown'} (${user.profile?.department})`);
    });

    console.log('\n✅ User department references fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fix user department references failed:', error);
    process.exit(1);
  }
}

fixUserDepartmentReferences(); 