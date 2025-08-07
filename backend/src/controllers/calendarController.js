const Calendar = require('../models/Calendar');
const CalendarSettings = require('../models/CalendarSettings');

exports.getCurrentCalendar = async (req, res) => {
  try {
    const semester = req.query.semester;
    let calendar;
    if (semester) {
      calendar = await Calendar.findOne({ semester }).sort({ uploadedAt: -1 }).populate('uploadedBy', 'profile.firstName profile.lastName');
    } else {
      calendar = await Calendar.findOne().sort({ uploadedAt: -1 }).populate('uploadedBy', 'profile.firstName profile.lastName');
    }
    res.json({ success: true, data: { calendar: calendar || null } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.uploadCalendar = async (req, res) => {
  try {
    const { academicYear, semester, driveLink } = req.body;
    
    // Validate required fields
    if (!academicYear || !semester || !driveLink) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: academicYear, semester, or driveLink' 
      });
    }

    // Validate Google Drive link format
    const driveLinkPattern = /^https:\/\/drive\.google\.com\/(file\/d\/|open\?id=)/;
    if (!driveLinkPattern.test(driveLink)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid Google Drive link' 
      });
    }

    // Convert drive link to direct view link if needed
    let processedDriveLink = driveLink;
    if (driveLink.includes('/file/d/')) {
      const fileId = driveLink.match(/\/file\/d\/([^\/]+)/)?.[1];
      if (fileId) {
        processedDriveLink = `https://drive.google.com/file/d/${fileId}/preview`;
      }
    } else if (driveLink.includes('open?id=')) {
      const fileId = driveLink.match(/open\?id=([^&]+)/)?.[1];
      if (fileId) {
        processedDriveLink = `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }

    let calendar = await Calendar.findOneAndUpdate(
      { academicYear, semester },
      {
        academicYear,
        semester,
        pdfUrl: processedDriveLink,
        uploadedBy: req.user._id,
        uploadedAt: new Date()
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('uploadedBy', 'profile.firstName profile.lastName');
    
    res.json({ success: true, data: { calendar } });
  } catch (err) {
    console.error('Calendar upload error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get calendar settings (for all users)
exports.getCalendarSettings = async (req, res) => {
  try {
    const settings = await CalendarSettings.getActiveSettings();
    
    if (!settings) {
      // Return default settings if none exist
      const defaultSettings = {
        startMonth: 'January',
        endMonth: 'June',
        year: new Date().getFullYear()
      };
      return res.json({ success: true, data: defaultSettings });
    }
    
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error('Get calendar settings error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Save calendar settings (admin only)
exports.saveCalendarSettings = async (req, res) => {
  try {
    const { startMonth, endMonth, year } = req.body;
    
    // Validate required fields
    if (!startMonth || !endMonth || !year) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: startMonth, endMonth, year' 
      });
    }
    
    // Validate month names
    const validMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    if (!validMonths.includes(startMonth) || !validMonths.includes(endMonth)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid month names' 
      });
    }
    
    // Validate year
    const currentYear = new Date().getFullYear();
    if (year < currentYear - 1 || year > currentYear + 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Year must be within reasonable range' 
      });
    }
    
    // Create new settings (this will deactivate old ones)
    const settingsData = {
      startMonth,
      endMonth,
      year: parseInt(year),
      createdBy: req.user._id,
      updatedBy: req.user._id
    };
    
    const newSettings = await CalendarSettings.createNewSettings(settingsData);
    
    res.json({ 
      success: true, 
      message: 'Calendar settings saved successfully',
      data: newSettings 
    });
  } catch (err) {
    console.error('Save calendar settings error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}; 