/**
 * Check if a date is a weekend (Saturday or Sunday)
 * @param {Date} date - Date to check
 * @returns {boolean} - True if weekend
 */
const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

/**
 * Check if a date is a holiday
 * @param {Date} date - Date to check
 * @param {Array} holidays - Array of holiday dates
 * @returns {boolean} - True if holiday
 */
const isHoliday = (date, holidays = []) => {
  const dateString = date.toDateString();
  return holidays.some(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate.toDateString() === dateString;
  });
};

/**
 * Calculate working days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Array} holidays - Array of holiday objects
 * @returns {number} - Number of working days
 */
const calculateWorkingDays = (startDate, endDate, holidays = []) => {
  if (startDate > endDate) return 0;

  let workingDays = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (!isWeekend(currentDate) && !isHoliday(currentDate, holidays)) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
};

/**
 * Calculate leave days including half-day adjustments
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {boolean} isStartHalfDay - Is start date half day
 * @param {boolean} isEndHalfDay - Is end date half day
 * @param {Array} holidays - Array of holiday objects
 * @returns {Object} - Leave calculation result
 */
const calculateLeaveDays = (startDate, endDate, isStartHalfDay = false, isEndHalfDay = false, holidays = []) => {
  let workingDays = calculateWorkingDays(startDate, endDate, holidays);
  
  if (workingDays === 0) {
    return {
      totalDays: 0,
      workingDays: 0,
      weekends: 0,
      holidays: 0
    };
  }

  // Calculate adjustments for half days
  let halfDayAdjustment = 0;
  
  if (startDate.toDateString() === endDate.toDateString()) {
    // Same day leave
    if (isStartHalfDay || isEndHalfDay) {
      halfDayAdjustment = -0.5;
    }
  } else {
    // Multi-day leave
    if (isStartHalfDay && !isWeekend(startDate) && !isHoliday(startDate, holidays)) {
      halfDayAdjustment -= 0.5;
    }
    if (isEndHalfDay && !isWeekend(endDate) && !isHoliday(endDate, holidays)) {
      halfDayAdjustment -= 0.5;
    }
  }

  const finalWorkingDays = Math.max(0, workingDays + halfDayAdjustment);
  
  // Calculate total calendar days
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  // Calculate weekends and holidays in the range
  const weekends = countWeekends(startDate, endDate);
  const holidayCount = countHolidays(startDate, endDate, holidays);

  return {
    totalDays,
    workingDays: finalWorkingDays,
    weekends,
    holidays: holidayCount
  };
};

/**
 * Count weekends between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} - Number of weekend days
 */
const countWeekends = (startDate, endDate) => {
  let weekendCount = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (isWeekend(currentDate)) {
      weekendCount++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return weekendCount;
};

/**
 * Count holidays between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Array} holidays - Array of holiday objects
 * @returns {number} - Number of holidays
 */
const countHolidays = (startDate, endDate, holidays = []) => {
  let holidayCount = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (isHoliday(currentDate, holidays)) {
      holidayCount++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return holidayCount;
};

/**
 * Get next working day
 * @param {Date} date - Current date
 * @param {Array} holidays - Array of holiday objects
 * @returns {Date} - Next working day
 */
const getNextWorkingDay = (date, holidays = []) => {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  while (isWeekend(nextDay) || isHoliday(nextDay, holidays)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
};

/**
 * Get previous working day
 * @param {Date} date - Current date
 * @param {Array} holidays - Array of holiday objects
 * @returns {Date} - Previous working day
 */
const getPreviousWorkingDay = (date, holidays = []) => {
  const prevDay = new Date(date);
  prevDay.setDate(prevDay.getDate() - 1);

  while (isWeekend(prevDay) || isHoliday(prevDay, holidays)) {
    prevDay.setDate(prevDay.getDate() - 1);
  }

  return prevDay;
};

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * Parse date from string
 * @param {string} dateString - Date string
 * @returns {Date} - Parsed date
 */
const parseDate = (dateString) => {
  return new Date(dateString);
};

/**
 * Check if date is in the past
 * @param {Date} date - Date to check
 * @returns {boolean} - True if date is in the past
 */
const isPastDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Check if date is in the future
 * @param {Date} date - Date to check
 * @returns {boolean} - True if date is in the future
 */
const isFutureDate = (date) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date > today;
};

/**
 * Get start and end of month
 * @param {Date} date - Date in the month
 * @returns {Object} - Start and end dates of the month
 */
const getMonthBounds = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
};

/**
 * Get start and end of year
 * @param {Date} date - Date in the year
 * @returns {Object} - Start and end dates of the year
 */
const getYearBounds = (date) => {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date.getFullYear(), 11, 31);
  return { start, end };
};

module.exports = {
  isWeekend,
  isHoliday,
  calculateWorkingDays,
  calculateLeaveDays,
  countWeekends,
  countHolidays,
  getNextWorkingDay,
  getPreviousWorkingDay,
  formatDate,
  parseDate,
  isPastDate,
  isFutureDate,
  getMonthBounds,
  getYearBounds
}; 