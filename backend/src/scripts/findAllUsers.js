const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/database');

async function findAllUsers() {
  try {
    await connectDB();
    console.log('Connected to database');
    
    const db = mongoose.connection.db;
    
    // Get ALL users (including inactive)
    const allUsers = await db.collection('users').find({}).toArray();
    console.log('Total users in database:', allUsers.length);
    
    console.log('\n=== ALL USERS ===');
    allUsers.forEach((user, index) => {
      console.log('User', index + 1, ':');
      console.log('  sdrn:', user.sdrn);
      console.log('  name:', user.profile.firstName, user.profile.lastName);
      console.log('  email:', user.email);
      console.log('  role:', user.role);
      console.log('  isActive:', user.isActive);
      console.log('  department:', user.profile.department || 'null');
      console.log('  leaveBalances:', user.leaveBalances ? user.leaveBalances.length : 0, 'entries');
      console.log('');
    });
    
    // Check specifically for FAC0002
    const fac0002 = await db.collection('users').findOne({ sdrn: 'FAC0002' });
    console.log('=== FAC0002 SPECIFIC CHECK ===');
    if (fac0002) {
      console.log('FAC0002 found!');
      console.log('  _id:', fac0002._id);
              console.log('  sdrn:', fac0002.sdrn);
      console.log('  name:', fac0002.profile.firstName, fac0002.profile.lastName);
      console.log('  isActive:', fac0002.isActive);
      console.log('  role:', fac0002.role);
    } else {
      console.log('FAC0002 NOT found in database');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findAllUsers();
