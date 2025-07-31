const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    // Use a default MongoDB URI if not provided
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance_system';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Connection event listeners
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Database connection failed:', error.message);
    logger.error('Please make sure MongoDB is running or provide a valid MONGO_URI');
    // Don't exit the process, let the app continue without database
    logger.warn('Continuing without database connection...');
  }
};

module.exports = connectDB; 