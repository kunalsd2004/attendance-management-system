require('dotenv').config();
const connectDB = require('../config/database');
const CalendarSettings = require('../models/CalendarSettings');
const User = require('../models/User');

async function initCalendarSettings() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Find an admin user to set as creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      return;
    }

    // Check if settings already exist
    const existingSettings = await CalendarSettings.findOne({ isActive: true });
    if (existingSettings) {
      console.log('Calendar settings already exist. Skipping initialization.');
      return;
    }

    // Create default calendar settings
    const defaultSettings = new CalendarSettings({
      startMonth: 'January',
      endMonth: 'June',
      year: new Date().getFullYear(),
      createdBy: adminUser._id,
      updatedBy: adminUser._id,
      isActive: true
    });

    await defaultSettings.save();
    console.log('Default calendar settings created successfully');
    console.log('Settings:', {
      startMonth: defaultSettings.startMonth,
      endMonth: defaultSettings.endMonth,
      year: defaultSettings.year
    });

  } catch (error) {
    console.error('Error initializing calendar settings:', error);
  } finally {
    process.exit(0);
  }
}

// Run the initialization
initCalendarSettings(); 