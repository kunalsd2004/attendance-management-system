const User = require('../models/User');
const LeaveType = require('../models/LeaveType');
const connectDB = require('../config/database');

async function allocateOnDutyBalances() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find On-Duty Leave type
    const onDutyLeaveType = await LeaveType.findOne({ type: 'on_duty' });
    
    if (!onDutyLeaveType) {
      console.log('❌ On-Duty Leave type not found. Please run fixOnDutyLeaveFinal.js first.');
      return;
    }

    console.log(`✅ Found On-Duty Leave type: ${onDutyLeaveType.name} (${onDutyLeaveType.code})`);

    // Get all active users (excluding admin users)
    const users = await User.find({ 
      isActive: true,
      role: { $ne: 'admin' }
    });

    console.log(`\n📊 Found ${users.length} active users to allocate balances to`);

    const currentYear = new Date().getFullYear();
    let allocatedCount = 0;
    let updatedCount = 0;

    for (const user of users) {
      // Check if user already has On-Duty Leave balance for current year
      const existingBalance = user.leaveBalances.find(
        balance => balance.leaveType.toString() === onDutyLeaveType._id.toString() 
                  && balance.year === currentYear
      );

      if (!existingBalance) {
        // Add new On-Duty Leave balance
        user.leaveBalances.push({
          leaveType: onDutyLeaveType._id,
          allocated: 5, // 5 days as per configuration
          used: 0,
          remaining: 5,
          year: currentYear
        });
        allocatedCount++;
        console.log(`➕ Allocated 5 On-Duty Leave days to ${user.profile.firstName} ${user.profile.lastName}`);
      } else {
        // Update existing balance if needed
        if (existingBalance.allocated !== 5) {
          const usedDays = existingBalance.used;
          existingBalance.allocated = 5;
          existingBalance.remaining = Math.max(0, 5 - usedDays);
          updatedCount++;
          console.log(`🔄 Updated On-Duty Leave balance for ${user.profile.firstName} ${user.profile.lastName}`);
        }
      }

      await user.save();
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total users processed: ${users.length}`);
    console.log(`New allocations: ${allocatedCount}`);
    console.log(`Updated balances: ${updatedCount}`);

    console.log('\n🎉 On-Duty Leave balances have been allocated successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

allocateOnDutyBalances();
