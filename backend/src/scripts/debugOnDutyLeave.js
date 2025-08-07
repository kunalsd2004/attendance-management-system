const LeaveType = require('../models/LeaveType');
const User = require('../models/User');
const connectDB = require('../config/database');

async function debugOnDutyLeave() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Get all leave types
    const leaveTypes = await LeaveType.find({});
    console.log('\n=== ALL LEAVE TYPES ===');
    leaveTypes.forEach(lt => {
      console.log(`\n${lt.name} (${lt.type}):`);
      console.log(`  isActive: ${lt.isActive}`);
      console.log(`  maxDays: ${lt.maxDays}`);
      console.log(`  maxContinuousDays: ${lt.maxContinuousDays}`);
      console.log(`  requiresApproval: ${lt.requiresApproval}`);
      console.log(`  allowHalfDay: ${lt.allowHalfDay}`);
      console.log(`  applicableToRoles: ${lt.applicableToRoles.join(', ')}`);
    });

    // Check if On-Duty Leave exists in user leave balances
    const users = await User.find({})
      .populate('leaveBalances.leaveType', 'name type code')
      .select('profile leaveBalances sdrn');

    console.log('\n=== USER LEAVE BALANCES ===');
    users.forEach(user => {
      console.log(`\n${user.profile.firstName} ${user.profile.lastName} (${user.sdrn}):`);
      console.log(`  Total balances: ${user.leaveBalances.length}`);
      
      user.leaveBalances.forEach(balance => {
        const leaveType = balance.leaveType;
        console.log(`  - ${leaveType?.name || 'Unknown'} (${leaveType?.type || 'Unknown'}):`);
        console.log(`    Allocated: ${balance.allocated}, Used: ${balance.used}, Remaining: ${balance.remaining}`);
      });
    });

    // Check if On-Duty Leave type exists
    const onDutyLeave = await LeaveType.findOne({ type: 'on_duty' });
    if (onDutyLeave) {
      console.log('\n=== ON-DUTY LEAVE DETAILS ===');
      console.log(`ID: ${onDutyLeave._id}`);
      console.log(`Name: ${onDutyLeave.name}`);
      console.log(`Code: ${onDutyLeave.code}`);
      console.log(`Type: ${onDutyLeave.type}`);
      console.log(`isActive: ${onDutyLeave.isActive}`);
      console.log(`maxDays: ${onDutyLeave.maxDays}`);
      console.log(`maxContinuousDays: ${onDutyLeave.maxContinuousDays}`);
      console.log(`requiresApproval: ${onDutyLeave.requiresApproval}`);
      console.log(`allowHalfDay: ${onDutyLeave.allowHalfDay}`);
      console.log(`applicableToRoles: ${onDutyLeave.applicableToRoles.join(', ')}`);
    } else {
      console.log('\n❌ On-Duty Leave type not found in database');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

debugOnDutyLeave();
