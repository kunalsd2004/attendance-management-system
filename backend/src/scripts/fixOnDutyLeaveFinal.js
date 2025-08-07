const LeaveType = require('../models/LeaveType');
const connectDB = require('../config/database');

async function fixOnDutyLeaveFinal() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find On-Duty Leave by name or code
    let onDutyLeave = await LeaveType.findOne({ name: 'On-Duty Leave' });
    
    if (!onDutyLeave) {
      onDutyLeave = await LeaveType.findOne({ code: 'OD' });
    }
    
    if (!onDutyLeave) {
      console.log('❌ On-Duty Leave not found. Creating new one...');
      
      // Create new On-Duty Leave type
      onDutyLeave = new LeaveType({
        name: 'On-Duty Leave',
        code: 'OD',
        type: 'on_duty',
        color: '#d9534f',
        description: 'On-Duty Leave for faculty and staff',
        maxDays: 5,
        carryForward: false,
        carryForwardLimit: 0,
        requiresApproval: true,
        requiresDocuments: false,
        allowHalfDay: true,
        minAdvanceNoticeDays: 1,
        maxAdvanceApplicationDays: 365,
        maxContinuousDays: 5,
        applicableToRoles: ['faculty', 'hod', 'admin', 'principal'],
        isActive: true,
        settings: {
          allowWeekends: false,
          allowHolidays: false,
          autoApprove: false,
          sendEmailNotification: true,
          allowCancellation: true,
          cancellationDeadlineDays: 1
        },
        validityPeriod: {
          startMonth: 1,
          endMonth: 12
        },
        statistics: {
          totalApplications: 0,
          totalApproved: 0,
          totalRejected: 0,
          averageDaysPerApplication: 0
        }
      });
    } else {
      console.log('📋 Current On-Duty Leave configuration:');
      console.log(`  Name: ${onDutyLeave.name}`);
      console.log(`  Code: ${onDutyLeave.code}`);
      console.log(`  Current Type: ${onDutyLeave.type}`);
      console.log(`  isActive: ${onDutyLeave.isActive}`);
      console.log(`  maxDays: ${onDutyLeave.maxDays}`);
      
      // Update the configuration
      onDutyLeave.type = 'on_duty';
      onDutyLeave.isActive = true;
      onDutyLeave.maxDays = 5;
      onDutyLeave.maxContinuousDays = 5;
      onDutyLeave.requiresApproval = true;
    }

    await onDutyLeave.save();
    console.log('\n✅ Updated On-Duty Leave configuration:');
    console.log(`  Name: ${onDutyLeave.name}`);
    console.log(`  Code: ${onDutyLeave.code}`);
    console.log(`  Type: ${onDutyLeave.type}`);
    console.log(`  isActive: ${onDutyLeave.isActive}`);
    console.log(`  maxDays: ${onDutyLeave.maxDays}`);
    console.log(`  maxContinuousDays: ${onDutyLeave.maxContinuousDays}`);
    console.log(`  requiresApproval: ${onDutyLeave.requiresApproval}`);

    console.log('\n🎉 On-Duty Leave is now properly configured!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixOnDutyLeaveFinal();
