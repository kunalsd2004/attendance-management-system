const mongoose = require('mongoose');
const User = require('../models/User');
const LeaveType = require('../models/LeaveType');
const Department = require('../models/Department');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/lms', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function createTestUser() {
  try {
    console.log('🔍 Creating Test User...\n');

    // First, create a department
    let department = await Department.findOne({ code: 'IT' });
    if (!department) {
      department = await Department.create({
        name: 'Information Technology',
        code: 'IT',
        description: 'Information Technology Department'
      });
      console.log('✅ Created department:', department.name);
    }

    // Create a leave type
    let leaveType = await LeaveType.findOne({ type: 'vacation' });
    if (!leaveType) {
      leaveType = await LeaveType.create({
        name: 'Vacation Leave',
        code: 'VL',
        type: 'vacation',
        color: '#ff8c42',
        maxDays: 30,
        carryForward: false,
        requiresApproval: true,
        allowHalfDay: true,
        applicableToRoles: ['faculty', 'hod', 'admin', 'principal'],
        isActive: true
      });
      console.log('✅ Created leave type:', leaveType.name);
    }

    // Create a test user
    const testUser = await User.create({
      sdrn: 'TEST001',
      email: 'test@example.com',
      password: 'password123',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        designation: 'Assistant Professor',
        department: department._id,
        joiningDate: new Date('2023-01-01'),
        phoneNumber: '1234567890'
      },
      role: 'faculty',
      leaveBalances: [{
        leaveType: leaveType._id,
        allocated: 12,
        used: 0,
        remaining: 12,
        year: new Date().getFullYear()
      }]
    });

    console.log('✅ Created test user:', testUser.profile.firstName, testUser.profile.lastName);
    console.log('📊 User ID:', testUser._id);
    console.log('📊 Leave Balances:', testUser.leaveBalances.length);

    // Create a test leave request
    const Leave = require('../models/Leave');
    const testLeave = await Leave.create({
      applicant: testUser._id,
      leaveType: leaveType._id,
      startDate: new Date('2024-12-20'),
      endDate: new Date('2024-12-22'),
      workingDays: 3,
      reason: 'Test leave request',
      status: 'pending',
      approvals: [{
        approver: testUser._id, // Self-approval for testing
        status: 'pending',
        level: 1
      }]
    });

    console.log('✅ Created test leave request:', testLeave._id);

    console.log('\n🎯 Test Data Created Successfully!');
    console.log('User ID:', testUser._id);
    console.log('Leave Request ID:', testLeave._id);
    console.log('Leave Type ID:', leaveType._id);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUser(); 