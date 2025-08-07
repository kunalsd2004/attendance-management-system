const LeaveType = require('../models/LeaveType');
const connectDB = require('../config/database');

async function fixOnDutyLeave() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find On-Duty Leave type
    const onDutyLeave = await LeaveType.findOne({ type: 'on_duty' });
    
    if (!onDutyLeave) {
      console.log('❌ On-Duty Leave type not found');
      return;
    }

    console.log('📋 Current On-Duty Leave configuration:');
    console.log(`  Name: ${onDutyLeave.name}`);
    console.log(`  Code: ${onDutyLeave.code}`);
    console.log(`  isActive: ${onDutyLeave.isActive}`);
    console.log(`  maxDays: ${onDutyLeave.maxDays}`);
    console.log(`  maxContinuousDays: ${onDutyLeave.maxContinuousDays}`);

    // Update the configuration
    onDutyLeave.maxDays = 5;
    onDutyLeave.maxContinuousDays = 5; // Allow up to 5 continuous days
    onDutyLeave.isActive = true;

    await onDutyLeave.save();
    console.log('\n✅ Updated On-Duty Leave configuration:');
    console.log(`  maxDays: ${onDutyLeave.maxDays}`);
    console.log(`  maxContinuousDays: ${onDutyLeave.maxContinuousDays}`);
    console.log(`  isActive: ${onDutyLeave.isActive}`);

    console.log('\n🎉 On-Duty Leave is now properly configured!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixOnDutyLeave();
