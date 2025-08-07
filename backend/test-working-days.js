// Test script for calculateWorkingDays function
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

// Test cases
const testCases = [
  {
    name: 'Single day - Thursday',
    startDate: '2024-08-07',
    endDate: '2024-08-07',
    startHalfDay: false,
    endHalfDay: false,
    expected: 1
  },
  {
    name: 'Two consecutive days',
    startDate: '2024-08-07',
    endDate: '2024-08-08',
    startHalfDay: false,
    endHalfDay: false,
    expected: 2
  },
  {
    name: 'Weekend single day',
    startDate: '2024-08-10', // Saturday
    endDate: '2024-08-10',
    startHalfDay: false,
    endHalfDay: false,
    expected: 1
  },
  {
    name: 'Half day single day',
    startDate: '2024-08-07',
    endDate: '2024-08-07',
    startHalfDay: true,
    endHalfDay: true,
    expected: 0.5
  },
  {
    name: 'User specific case - 12th to 13th',
    startDate: '2024-08-12',
    endDate: '2024-08-13',
    startHalfDay: false,
    endHalfDay: false,
    expected: 2
  }
];

console.log('Testing calculateWorkingDays function...\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Input: startDate=${testCase.startDate}, endDate=${testCase.endDate}, startHalfDay=${testCase.startHalfDay}, endHalfDay=${testCase.endHalfDay}`);
  
  try {
    const result = calculateWorkingDays(testCase.startDate, testCase.endDate, testCase.startHalfDay, testCase.endHalfDay);
    console.log(`Result: ${result}`);
    console.log(`Expected: ${testCase.expected}`);
    console.log(`Status: ${result === testCase.expected ? 'PASS' : 'FAIL'}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  console.log('---\n');
});

console.log('Test completed.'); 