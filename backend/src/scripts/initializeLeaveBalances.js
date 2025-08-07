const mongoose = require('mongoose');
const User = require('../models/User');
const LeaveType = require('../models/LeaveType');
const { LEAVE_TYPES, LEAVE_TYPE_CONFIG, DEFAULT_LEAVE_BALANCES } = require('../utils/constants');

// Initialize database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected for leave balance initialization');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize leave types in database
const initializeLeaveTypes = async () => {
  try {
    console.log('🏃‍♂️ Initializing leave types...');
    
    for (const [leaveTypeKey, config] of Object.entries(LEAVE_TYPE_CONFIG)) {
      const existingType = await LeaveType.findOne({ type: leaveTypeKey });
      
      if (!existingType) {
        const leaveType = new LeaveType({
          name: config.name,
          code: config.code,
          type: leaveTypeKey,
          color: config.color,
          description: `${config.name} for faculty and staff`,
          maxDays: config.maxDays,
          carryForward: config.carryForward,
          carryForwardLimit: 0,
          requiresApproval: config.requiresApproval,
          requiresDocuments: leaveTypeKey === LEAVE_TYPES.MEDICAL,
          allowHalfDay: true,
          minAdvanceNoticeDays: leaveTypeKey === LEAVE_TYPES.ON_DUTY ? 0 : 1,
          maxAdvanceApplicationDays: 365,
          maxContinuousDays: config.maxDays,
          applicableToRoles: ['faculty', 'hod', 'admin', 'principal'],
          isActive: config.maxDays > 0, // Only active if maxDays > 0
          settings: {
            allowWeekends: false,
            allowHolidays: false,
            autoApprove: !config.requiresApproval,
            sendEmailNotification: true,
            allowCancellation: true,
            cancellationDeadlineDays: 1
          },
          validityPeriod: {
            startMonth: 1,  // January
            endMonth: 12    // December
          }
        });
        
        await leaveType.save();
        console.log(`✅ Created leave type: ${config.name} (${config.code})`);
      } else {
        // Update existing leave type with new balance
        existingType.maxDays = config.maxDays;
        existingType.isActive = config.maxDays > 0;
        await existingType.save();
        console.log(`🔄 Updated leave type: ${config.name} (${config.code})`);
      }
    }
    
    console.log('✅ Leave types initialization completed');
  } catch (error) {
    console.error('❌ Error initializing leave types:', error);
    throw error;
  }
};

// Allocate leave balances to all users
const allocateLeaveBalances = async () => {
  try {
    console.log('🏃‍♂️ Allocating leave balances to users...');
    
    const currentYear = new Date().getFullYear();
    const users = await User.find({ isActive: true });
    const leaveTypes = await LeaveType.find({ isActive: true });
    
    console.log(`📊 Found ${users.length} active users and ${leaveTypes.length} active leave types`);
    
    for (const user of users) {
      let updated = false;
      
      for (const leaveType of leaveTypes) {
        const allocation = DEFAULT_LEAVE_BALANCES[leaveType.type] || 0;
        
        // Check if user already has balance for this leave type and year
        const existingBalance = user.leaveBalances.find(
          balance => balance.leaveType.toString() === leaveType._id.toString() 
                    && balance.year === currentYear
        );
        
        if (!existingBalance && allocation > 0) {
          // Add new balance entry
          user.leaveBalances.push({
            leaveType: leaveType._id,
            allocated: allocation,
            used: 0,
            remaining: allocation,
            year: currentYear
          });
          updated = true;
          console.log(`➕ Added ${allocation} ${leaveType.code} balance to ${user.profile.firstName} ${user.profile.lastName}`);
        } else if (existingBalance) {
          // Update existing balance if allocation changed
          if (existingBalance.allocated !== allocation) {
            const usedDays = existingBalance.used;
            existingBalance.allocated = allocation;
            existingBalance.remaining = Math.max(0, allocation - usedDays);
            updated = true;
            console.log(`🔄 Updated ${leaveType.code} balance for ${user.profile.firstName} ${user.profile.lastName}: ${allocation} allocated`);
          }
        }
      }
      
      if (updated) {
        await user.save();
      }
    }
    
    console.log('✅ Leave balance allocation completed');
  } catch (error) {
    console.error('❌ Error allocating leave balances:', error);
    throw error;
  }
};

// Display current allocations summary
const displayAllocationSummary = async () => {
  try {
    console.log('\n📋 LEAVE BALANCE ALLOCATION SUMMARY');
    console.log('=====================================');
    
    const leaveTypes = await LeaveType.find().sort({ code: 1 });
    
    for (const leaveType of leaveTypes) {
      const allocation = DEFAULT_LEAVE_BALANCES[leaveType.type] || 0;
      const status = leaveType.isActive ? '✅ Active' : '❌ Inactive';
      console.log(`${leaveType.code} - ${leaveType.name}: ${allocation} days/year ${status}`);
    }
    
    const totalActiveUsers = await User.countDocuments({ isActive: true });
    console.log(`\n👥 Total Active Users: ${totalActiveUsers}`);
    console.log(`📅 Allocation Year: ${new Date().getFullYear()}`);
    console.log('=====================================\n');
  } catch (error) {
    console.error('❌ Error displaying summary:', error);
  }
};

// Main initialization function
const initializeLeaveSystem = async () => {
  try {
    console.log('🚀 Starting Leave Balance Initialization...\n');
    
    await connectDB();
    await initializeLeaveTypes();
    await allocateLeaveBalances();
    await displayAllocationSummary();
    
    console.log('🎉 Leave balance initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Initialization failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  initializeLeaveSystem();
}

module.exports = {
  initializeLeaveTypes,
  allocateLeaveBalances,
  displayAllocationSummary
}; 