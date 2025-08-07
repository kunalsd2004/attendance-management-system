const { LEAVE_TYPES } = require('../utils/constants');

// Test the leave type mapping logic
function testLeaveTypeMapping() {
  const testCases = [
    'casual Leave',
    'medical Leave', 
    'vacation Leave',
    'compensatory Off',
    'comp off',
    'on duty Leave',
    'special Leave'
  ];

  console.log('=== TESTING LEAVE TYPE MAPPING ===');
  
  testCases.forEach(leaveType => {
    console.log(`\nTesting: "${leaveType}"`);
    
    let leaveTypeKey = null;
    if (leaveType.toLowerCase().includes('casual')) {
      leaveTypeKey = LEAVE_TYPES.CASUAL;
    } else if (leaveType.toLowerCase().includes('medical')) {
      leaveTypeKey = LEAVE_TYPES.MEDICAL;
    } else if (leaveType.toLowerCase().includes('vacation')) {
      leaveTypeKey = LEAVE_TYPES.VACATION;
    } else if (leaveType.toLowerCase().includes('compensatory') || leaveType.toLowerCase().includes('comp off')) {
      leaveTypeKey = LEAVE_TYPES.COMPENSATORY_OFF;
    } else if (leaveType.toLowerCase().includes('on duty') || leaveType.toLowerCase().includes('on-duty')) {
      leaveTypeKey = LEAVE_TYPES.ON_DUTY;
    } else if (leaveType.toLowerCase().includes('special')) {
      leaveTypeKey = LEAVE_TYPES.SPECIAL;
    }

    console.log(`  Result: ${leaveTypeKey || 'NOT FOUND'}`);
  });
}

testLeaveTypeMapping(); 