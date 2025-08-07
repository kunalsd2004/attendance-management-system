const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');

async function checkDepartmentsDirect() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get database connection
    const db = mongoose.connection.db;
    
    // Check departments collection directly
    console.log(`\n=== CHECKING DEPARTMENTS COLLECTION ===`);
    const deptCount = await db.collection('departments').countDocuments();
    console.log(`Total departments: ${deptCount}`);

    if (deptCount > 0) {
      const departments = await db.collection('departments').find({}).toArray();
      console.log(`\n=== DEPARTMENT DOCUMENTS ===`);
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

    // Check users collection
    console.log(`\n=== CHECKING USERS COLLECTION ===`);
    const userCount = await db.collection('users').countDocuments();
    console.log(`Total users: ${userCount}`);

    if (userCount > 0) {
      const users = await db.collection('users').find({}).toArray();
      console.log(`\n=== USER DOCUMENTS ===`);
      users.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log(`  _id: ${user._id}`);
        console.log(`  sdrn: ${user.sdrn}`);
        console.log(`  role: ${user.role}`);
        console.log(`  profile.firstName: ${user.profile?.firstName}`);
        console.log(`  profile.lastName: ${user.profile?.lastName}`);
        console.log(`  profile.department: ${user.profile?.department || 'null'}`);
        console.log(`  leaveBalances: ${user.leaveBalances ? user.leaveBalances.length : 0} entries`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Check departments direct failed:', error);
    process.exit(1);
  }
}

checkDepartmentsDirect(); 