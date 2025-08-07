const mongoose = require('mongoose');
require('dotenv').config();

// Import the calculateWorkingDays function
const calculateWorkingDays = (startDate, endDate, isStartHalfDay = false, isEndHalfDay = false) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  console.log('DEBUG: calculateWorkingDays input:', {
    startDate,
    endDate,
    start: start.toISOString(),
    end: end.toISOString(),
    isStartHalfDay,
    isEndHalfDay
  });
  
  if (start > end) return 0;
  
  let count = 0;
  const currentDate = new Date(start.getTime());
  
  // Compare dates properly by converting to date strings (YYYY-MM-DD)
  const startDateStr = new Date(startDate).toISOString().split('T')[0];
  const endDateStr = new Date(endDate).toISOString().split('T')[0];
  const isSameDay = startDateStr === endDateStr;
  
  // Count all days from start to end (inclusive)
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    console.log('DEBUG: Processing date:', {
      date: currentDate.toISOString().split('T')[0],
      dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6
    });
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Special case: if start and end are the same day and it's a weekend, count it as 1 day
  if (startDateStr === endDateStr && count === 0) {
    console.log('DEBUG: Same day weekend leave, counting as 1 day');
    count = 1;
  }
  
  // Handle half days
  let deduction = 0;
  
  console.log('DEBUG: Half day calculation:', {
    startDateStr,
    endDateStr,
    isSameDay,
    isStartHalfDay,
    isEndHalfDay,
    countBeforeHalfDay: count
  });
  
  if (isStartHalfDay && isEndHalfDay && isSameDay) {
    // Single day with both start and end half day = 0.5 days
    count = 0.5;
  } else {
    if (isStartHalfDay) deduction += 0.5;
    if (isEndHalfDay && !isSameDay) {
      deduction += 0.5;
    }
  }
  
  const finalResult = Math.max(0, count - deduction);
  console.log('DEBUG: calculateWorkingDays result:', {
    count,
    deduction,
    finalResult
  });
  
  return finalResult;
};

// Test cases for medical leave validation
const testCases = [
  {
    name: 'Medical Leave - 1 day (should fail)',
    startDate: '2024-08-07',
    endDate: '2024-08-07',
    startHalfDay: false,
    endHalfDay: false,
    leaveType: 'Medical',
    shouldPass: false
  },
  {
    name: 'Medical Leave - 2 days (should pass)',
    startDate: '2024-08-07',
    endDate: '2024-08-08',
    startHalfDay: false,
    endHalfDay: false,
    leaveType: 'Medical',
    shouldPass: true
  },
  {
    name: 'Medical Leave - 3 days (should pass)',
    startDate: '2024-08-07',
    endDate: '2024-08-09',
    startHalfDay: false,
    endHalfDay: false,
    leaveType: 'Medical',
    shouldPass: true
  },
  {
    name: 'Casual Leave - 1 day (should pass)',
    startDate: '2024-08-07',
    endDate: '2024-08-07',
    startHalfDay: false,
    endHalfDay: false,
    leaveType: 'Casual',
    shouldPass: true
  },
  {
    name: 'Medical Leave - Weekend 1 day (should fail)',
    startDate: '2024-08-10', // Saturday
    endDate: '2024-08-10',
    startHalfDay: false,
    endHalfDay: false,
    leaveType: 'Medical',
    shouldPass: false
  }
];

console.log('🧪 Testing Medical Leave Validation\n');

testCases.forEach((testCase, index) => {
  console.log(`\n--- Test ${index + 1}: ${testCase.name} ---`);
  
  const workingDays = calculateWorkingDays(
    testCase.startDate,
    testCase.endDate,
    testCase.startHalfDay,
    testCase.endHalfDay
  );
  
  console.log(`Working days calculated: ${workingDays}`);
  
  // Simulate the validation logic
  let validationPassed = true;
  let errorMessage = '';
  
  if (testCase.leaveType === 'Medical' && workingDays < 2) {
    validationPassed = false;
    errorMessage = 'Medical Leave requires a minimum of 2 working days. Please select a longer duration.';
  }
  
  console.log(`Validation result: ${validationPassed ? 'PASS' : 'FAIL'}`);
  if (!validationPassed) {
    console.log(`Error: ${errorMessage}`);
  }
  
  const expectedResult = testCase.shouldPass ? 'PASS' : 'FAIL';
  const actualResult = validationPassed ? 'PASS' : 'FAIL';
  
  if (expectedResult === actualResult) {
    console.log(`✅ Test ${index + 1} PASSED - Expected: ${expectedResult}, Got: ${actualResult}`);
  } else {
    console.log(`❌ Test ${index + 1} FAILED - Expected: ${expectedResult}, Got: ${actualResult}`);
  }
});

console.log('\n🎯 Medical Leave Validation Test Complete!'); 