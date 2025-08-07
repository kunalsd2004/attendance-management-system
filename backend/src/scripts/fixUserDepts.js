const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');

async function fixUserDepartments() {
  try {
    await connectDB();
    console.log('Connected to database');

    const db = mongoose.connection.db;
    
    // Get departments
    const departments = await db.collection('departments').find({ isActive: true }).toArray();
    console.log('Departments found:', departments.length);
    
    const itDept = departments.find(d => d.code === 'IT');
    const otherDepts = departments.filter(d => d.code !== 'IT');
    
    // Get all users
    const users = await db.collection('users').find({ isActive: true }).toArray();
    console.log('Users found:', users.length);
    
    let updated = 0;
    
    for (const user of users) {
      let deptId = null;
      
      if (user.role === 'hod' && itDept) {
        deptId = itDept._id;
      } else if (user.role === 'faculty' && otherDepts.length > 0) {
        deptId = otherDepts[Math.floor(Math.random() * otherDepts.length)]._id;
      }
      
      if (deptId || (user.role === 'admin' || user.role === 'principal')) {
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { 'profile.department': deptId, updatedAt: new Date() } }
        );
        updated++;
        console.log('Updated:', user.sdrn, 'Role:', user.role);
      }
    }
    
    console.log('Updated users:', updated);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixUserDepartments();
