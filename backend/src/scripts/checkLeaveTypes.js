const LeaveType = require('../models/LeaveType');
const connectDB = require('../config/database');

async function checkLeaveTypes() {
  try {
    await connectDB();
    console.log('Connected to database');

    const leaveTypes = await LeaveType.find({});
    console.log(`\n=== ALL LEAVE TYPES ===`);
    console.log(`Total leave types: ${leaveTypes.length}`);

    leaveTypes.forEach(lt => {
      console.log(`\n- ${lt.name} (${lt.type}):`);
      console.log(`  isActive: ${lt.isActive}`);
      console.log(`  maxDays: ${lt.maxDays}`);
      console.log(`  code: ${lt.code}`);
      console.log(`  color: ${lt.color}`);
    });

    console.log(`\n=== ACTIVE LEAVE TYPES ===`);
    const activeTypes = leaveTypes.filter(lt => lt.isActive);
    console.log(`Active leave types: ${activeTypes.length}`);
    activeTypes.forEach(lt => {
      console.log(`  - ${lt.name} (${lt.code})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkLeaveTypes();
