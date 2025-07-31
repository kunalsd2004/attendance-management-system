const mongoose = require('mongoose');

const CalendarSchema = new mongoose.Schema({
  academicYear: { type: String, required: true },
  semester: { type: String, enum: ['even', 'odd'], required: true },
  pdfUrl: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Calendar', CalendarSchema); 