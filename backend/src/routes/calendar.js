const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { authenticate, authorize } = require('../middleware/auth');

// GET current academic calendar
router.get('/current', authenticate, calendarController.getCurrentCalendar);
// POST upload new academic calendar (admin only)
router.post('/upload', authenticate, authorize('admin'), calendarController.uploadCalendar);

// Calendar settings routes
// GET calendar settings (for all users)
router.get('/settings', authenticate, calendarController.getCalendarSettings);
// POST save calendar settings (admin only)
router.post('/settings', authenticate, authorize('admin'), calendarController.saveCalendarSettings);

module.exports = router; 