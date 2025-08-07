const mongoose = require('mongoose');
require('dotenv').config();

const LeaveType = require('../models/LeaveType');
const connectDB = require('../config/database');

async function initLeaveTypes() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Define leave types
    const leaveTypes = [
      {
        name: 'Casual Leave',
        code: 'CL',
        type: 'casual',
        color: '#ff8c42',
        maxDays: 12,
        carryForward: false,
        requiresApproval: true,
        allowHalfDay: true,
        applicableToRoles: ['faculty', 'hod', 'admin', 'principal'],
        isActive: true
      },
      {
        name: 'Medical Leave',
        code: 'ML',
        type: 'medical',
        color: '#ff4757',
        maxDays: 10,
        carryForward: false,
        requiresApproval: true,
        allowHalfDay: true,
        applicableToRoles: ['faculty', 'hod', 'admin', 'principal'],
        isActive: true
      },
      {
        name: 'Vacation Leave',
        code: 'VL',
        type: 'vacation',
        color: '#2ed573',
        maxDays: 30,
        carryForward: true,
        requiresApproval: true,
        allowHalfDay: false,
        applicableToRoles: ['faculty', 'hod', 'admin', 'principal'],
        isActive: true
      },
      {
        name: 'Compensatory Off',
        code: 'CO',
        type: 'compensatory_off',
        color: '#5352ed',
        maxDays: 15,
        carryForward: true,
        requiresApproval: true,
        allowHalfDay: true,
        applicableToRoles: ['faculty', 'hod', 'admin', 'principal'],
        isActive: true
      },
      {
        name: 'On Duty Leave',
        code: 'OD',
        type: 'on_duty',
        color: '#ff3838',
        maxDays: 5,
        carryForward: false,
        requiresApproval: true,
        allowHalfDay: true,
        applicableToRoles: ['faculty', 'hod', 'admin', 'principal'],
        isActive: true
      },
      {
        name: 'Special Leave',
        code: 'SL',
        type: 'special',
        color: '#ff9ff3',
        maxDays: 10,
        carryForward: false,
        requiresApproval: true,
        allowHalfDay: true,
        applicableToRoles: ['faculty', 'hod', 'admin', 'principal'],
        isActive: true
      }
    ];

    // Clear existing leave types
    await LeaveType.deleteMany({});
    console.log('Cleared existing leave types');

    // Insert leave types
    const createdLeaveTypes = await LeaveType.insertMany(leaveTypes);
    console.log('Created leave types:', createdLeaveTypes.length);
    
    createdLeaveTypes.forEach(lt => {
      console.log(`- ${lt.name} (${lt.type}): ${lt._id}`);
    });

    console.log('Leave types initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Leave types initialization failed:', error);
    process.exit(1);
  }
}

initLeaveTypes(); 