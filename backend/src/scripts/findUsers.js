const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB using the lms database
const connectDB = async () => {
  try {
    // Connect directly to lms database as mentioned by user
    const mongoURI = 'mongodb://localhost:27017/lms';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

async function findUsers() {
  try {
    await connectDB();
    console.log('🔍 Finding Users...\n');

    const users = await User.find({}, '_id profile.firstName profile.lastName role sdrn');
    
    console.log(`📊 Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id}`);
      console.log(`   Name: ${user.profile.firstName} ${user.profile.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   SDRN: ${user.sdrn}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findUsers(); 