const mongoose = require('mongoose');

const calendarSettingsSchema = new mongoose.Schema({
  startMonth: {
    type: String,
    required: true,
    enum: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    default: 'January'
  },
  endMonth: {
    type: String,
    required: true,
    enum: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    default: 'June'
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for active settings
calendarSettingsSchema.index({ isActive: 1 });

// Method to get current active settings
calendarSettingsSchema.statics.getActiveSettings = function() {
  return this.findOne({ isActive: true }).sort({ createdAt: -1 });
};

// Method to deactivate all other settings when creating a new one
calendarSettingsSchema.statics.createNewSettings = async function(settingsData) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Deactivate all existing settings
    await this.updateMany({}, { isActive: false }, { session });
    
    // Create new active settings
    const newSettings = new this(settingsData);
    await newSettings.save({ session });
    
    await session.commitTransaction();
    return newSettings;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = mongoose.model('CalendarSettings', calendarSettingsSchema); 