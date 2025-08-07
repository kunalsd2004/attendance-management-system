import React, { useState, useEffect } from 'react';
import addLeaveIcon from '../assets/add-leave.svg';
import viewIcon from '../assets/view.svg';
import disclaimerIcon from '../assets/disclaimer.svg';
import tickIcon from '../assets/tick.svg';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ApplyLeaveModal from '../components/modals/ApplyLeaveModal';

// --- PDF Viewer Modal ---
// This component displays the academic calendar PDF when the eye icon is clicked.
const PDFModal = ({ onClose }) => {
    const [currentCalendar, setCurrentCalendar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCurrentCalendar = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await apiService.getCurrentCalendar();
                if (response.success && response.data.calendar) {
                    setCurrentCalendar(response.data.calendar);
                } else {
                    setError('No calendar available');
                }
            } catch (err) {
                setError('Failed to load calendar');
                console.error('Error fetching calendar:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentCalendar();
    }, []);

    const getPdfUrl = () => {
        if (!currentCalendar?.pdfUrl) return '';
        
        // If it's already a full URL (Google Drive link), return as is
        if (currentCalendar.pdfUrl.startsWith('http')) {
            return currentCalendar.pdfUrl;
        }
        
        // If it's a local path, prepend the backend base URL
        const backendBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        if (currentCalendar.pdfUrl.startsWith('/uploads/')) {
            return `${backendBase}${currentCalendar.pdfUrl}#view=fitH`;
        }
        
        return currentCalendar.pdfUrl;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="pdf-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="pdf-modal-header">
                    <div className="flex items-center gap-3">
                        <img 
                            src={viewIcon} 
                            alt="View Calendar" 
                            style={{ 
                                height: '2.2vh',
                            }} 
                        />
                        <h3 className="text-black font-semibold">
                            View Calendar
                        </h3>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="separator"></div>
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8C001A] mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading calendar...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="text-4xl text-gray-300 mb-4">📄</div>
                            <p className="text-lg font-medium text-gray-600">{error}</p>
                            <p className="text-sm text-gray-400 mt-2">No calendar has been uploaded yet.</p>
                        </div>
                    </div>
                ) : currentCalendar?.pdfUrl ? (
                    <iframe
                        src={getPdfUrl()}
                        title="Academic Calendar"
                        className="pdf-viewer"
                        frameBorder="0"
                        allow="fullscreen"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="text-4xl text-gray-300 mb-4">📄</div>
                            <p className="text-lg font-medium text-gray-600">No calendar available</p>
                            <p className="text-sm text-gray-400 mt-2">Please contact your administrator to upload a calendar.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};



// --- Main ApplyLeave Component ---
const ApplyLeave = () => {
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [initialLeaveDate, setInitialLeaveDate] = useState('');
    const [leaves, setLeaves] = useState([]);
    const [leaveBalances, setLeaveBalances] = useState([]);

    const [displayMonths, setDisplayMonths] = useState([]);
    const { user } = useAuth();

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayInitials = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    
    const calendarData = {
        'Jan 2025': { holidays: [26], events: {} },
        'Feb 2025': { holidays: [19, 25], events: {} },
        'Mar 2025': { holidays: [14], events: {} },
        'Apr 2025': { holidays: [6, 10, 14, 18], events: {} },
        'May 2025': { holidays: [1, 12], events: {} },
        'Jun 2025': { holidays: [7], events: {} },
        'Jul 2025': { holidays: [], events: {} },
        'Aug 2025': { holidays: [15], events: {} },
        'Sep 2025': { holidays: [5], events: {} },
        'Oct 2025': { holidays: [2, 31], events: {} },
        'Nov 2025': { holidays: [1, 14], events: {} },
        'Dec 2025': { holidays: [25], events: {} },
    };

    // Fetch calendar settings and calculate display months
    const fetchCalendarSettings = async () => {
        try {
            const response = await apiService.getCalendarSettings();
            if (response.success && response.data) {
                const settings = response.data;
                
                // Calculate which months to display based on admin settings
                const startIndex = fullMonthNames.indexOf(settings.startMonth);
                const endIndex = fullMonthNames.indexOf(settings.endMonth);
                
                if (startIndex !== -1 && endIndex !== -1) {
                    const monthsToDisplay = [];
                    for (let i = startIndex; i <= endIndex; i++) {
                        monthsToDisplay.push({
                            name: months[i],
                            fullName: fullMonthNames[i],
                            index: i
                        });
                    }
                    setDisplayMonths(monthsToDisplay);
                } else {
                    // Fallback to default Jan-Jun if settings are invalid
                    setDisplayMonths([
                        { name: 'Jan', fullName: 'January', index: 0 },
                        { name: 'Feb', fullName: 'February', index: 1 },
                        { name: 'Mar', fullName: 'March', index: 2 },
                        { name: 'Apr', fullName: 'April', index: 3 },
                        { name: 'May', fullName: 'May', index: 4 },
                        { name: 'Jun', fullName: 'June', index: 5 }
                    ]);
                }
            } else {
                // Fallback to default Jan-Jun if API call fails
                setDisplayMonths([
                    { name: 'Jan', fullName: 'January', index: 0 },
                    { name: 'Feb', fullName: 'February', index: 1 },
                    { name: 'Mar', fullName: 'March', index: 2 },
                    { name: 'Apr', fullName: 'April', index: 3 },
                    { name: 'May', fullName: 'May', index: 4 },
                    { name: 'Jun', fullName: 'June', index: 5 }
                ]);
            }
        } catch (error) {
            console.error('Error fetching calendar settings:', error);
            // Fallback to default Jan-Jun
            setDisplayMonths([
                { name: 'Jan', fullName: 'January', index: 0 },
                { name: 'Feb', fullName: 'February', index: 1 },
                { name: 'Mar', fullName: 'March', index: 2 },
                { name: 'Apr', fullName: 'April', index: 3 },
                { name: 'May', fullName: 'May', index: 4 },
                { name: 'Jun', fullName: 'June', index: 5 }
            ]);
        }
    };
    
    const handleDateClick = (year, month, day) => {
        const monthStr = (month + 1).toString().padStart(2, '0');
        const dayStr = day.toString().padStart(2, '0');
        const formattedDate = `${year}-${monthStr}-${dayStr}`;
        setInitialLeaveDate(formattedDate);
        setIsLeaveModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsPdfModalOpen(false);
        setIsLeaveModalOpen(false);
        setInitialLeaveDate('');
    };

    // Helper function to get leave background color based on status and type
    const getLeaveBackgroundColor = (leave) => {
        // If leave is pending, show grey
        if (leave.status === 'pending') {
            return '#6c757d'; // Grey for pending
        }
        
        // For approved leaves, show the leave type color
        const leaveTypeColors = {
            'Vacation': '#fac723',
            'Casual': '#f29222',
            'Medical': '#a1c65d',
            'CompensatoryOff': '#0cb2af',
            'On Duty': '#e95e50',
            'Special': '#936fac'
        };
        
        // Handle both populated and unpopulated leaveType
        let leaveTypeName = '';
        if (leave.leaveType && typeof leave.leaveType === 'object') {
            leaveTypeName = leave.leaveType.name || leave.leaveType.type || '';
        } else {
            leaveTypeName = leave.leaveType || '';
        }
        
        // Map common leave type names to colors
        const typeMapping = {
            'Vacation Leave': 'Vacation',
            'Casual Leave': 'Casual',
            'Medical Leave': 'Medical',
            'Compensatory Off': 'CompensatoryOff',
            'On Duty Leave': 'OnDuty',
            'Special Leave': 'Special'
        };
        
        const mappedType = typeMapping[leaveTypeName] || leaveTypeName;
        return leaveTypeColors[mappedType] || '#6c757d';
    };

    const fetchLeaves = async () => {
        try {
            const response = await apiService.getLeaves({ userId: user?._id });
            if (response.success) {
                setLeaves(response.data.leaves || []);
            } else {
                console.error('Failed to fetch leaves:', response.message);
            }
        } catch (error) {
            console.error('Error fetching leaves:', error);
        }
    };

    const fetchLeaveBalances = async () => {
        try {
            const response = await apiService.getLeaveBalance(new Date().getFullYear(), user?._id);
            if (response.success) {
                setLeaveBalances(response.data.balances || []);
            } else {
                console.error('Failed to fetch leave balances:', response.message);
            }
        } catch (error) {
            console.error('Error fetching leave balances:', error);
        }
    };

    useEffect(() => {
        if (user?._id) {
            fetchLeaves();
            fetchLeaveBalances();
            fetchCalendarSettings();
        }
    }, [user?._id]);

    const renderMonthCard = (month, year) => {
        const key = `${months[month]} ${year}`;
        const holidays = calendarData[key]?.holidays || [];
        let startDay = new Date(year, month, 1).getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;
        const totalDays = new Date(year, month + 1, 0).getDate();

        // Calculate leave spans for this month
        const leaveSpans = [];
        leaves.forEach(leave => {
            const leaveStartDate = new Date(leave.startDate);
            const leaveEndDate = new Date(leave.endDate);
            
            // Check if this leave spans into this month
            if (leaveStartDate.getFullYear() === year && leaveStartDate.getMonth() === month ||
                leaveEndDate.getFullYear() === year && leaveEndDate.getMonth() === month) {
                
                const startDayInMonth = Math.max(1, leaveStartDate.getDate());
                const endDayInMonth = Math.min(totalDays, leaveEndDate.getDate());
                
                // Adjust for month boundaries
                const actualStartDay = leaveStartDate.getFullYear() === year && leaveStartDate.getMonth() === month 
                    ? startDayInMonth : 1;
                const actualEndDay = leaveEndDate.getFullYear() === year && leaveEndDate.getMonth() === month 
                    ? endDayInMonth : totalDays;
                
                leaveSpans.push({
                    leave,
                    startDay: actualStartDay,
                    endDay: actualEndDay,
                    startCellIndex: startDay + actualStartDay - 1,
                    endCellIndex: startDay + actualEndDay - 1
                });
            }
        });

        return (
            <div className="calendar-card" key={key}>
                <div className="calendar-card-header">
                    <h3>{months[month]} {year}</h3>
                    <span className="eye-icon" onClick={() => setIsPdfModalOpen(true)}>
                      <img src={viewIcon} alt="View Calendar" style={{ height: '1.8vh' }} />
                    </span>
                </div>
                <div className="calendar-card-grid">
                    {dayInitials.map((day, index) => (
                        <div 
                            key={`header-${index}`} 
                            className={`card-day-cell header ${index === 6 ? 'sunday-header' : ''}`}
                        >
                            {day}
                        </div>
                    ))}
                    {[...Array(42)].map((_, i) => {
                        const cellIndex = i;
                        const dayNumber = cellIndex - startDay + 1;
                        
                        // Check if this cell should be empty
                        if (dayNumber <= 0 || dayNumber > totalDays) {
                            return <div key={`empty-${i}`} className="card-day-cell empty"></div>;
                        }
                        
                        const currentDate = new Date(year, month, dayNumber);
                        const isSunday = currentDate.getDay() === 0;
                        const isSaturday = currentDate.getDay() === 6;
                        const isHoliday = holidays.includes(dayNumber);
                        
                        // Check if this is today's date
                        const today = new Date();
                        const isToday = currentDate.getDate() === today.getDate() && 
                                      currentDate.getMonth() === today.getMonth() && 
                                      currentDate.getFullYear() === today.getFullYear();
                        
                        // Find if this cell is part of a leave span
                        const leaveSpan = leaveSpans.find(span => 
                            dayNumber >= span.startDay && dayNumber <= span.endDay
                        );

                        const isLeaveRequest = !!leaveSpan;
                        const isFirstDayOfSpan = leaveSpan && dayNumber === leaveSpan.startDay;
                        const isLastDayOfSpan = leaveSpan && dayNumber === leaveSpan.endDay;
                        const isSingleDaySpan = leaveSpan && leaveSpan.startDay === leaveSpan.endDay;
                        const isMultiDaySpan = leaveSpan && leaveSpan.startDay !== leaveSpan.endDay;
                        const isTwoDaySpan = leaveSpan && (leaveSpan.endDay - leaveSpan.startDay + 1) === 2;
                        const isMoreThanTwoDaySpan = leaveSpan && (leaveSpan.endDay - leaveSpan.startDay + 1) > 2;

                        // Build CSS classes
                        const cssClasses = ['card-day-cell'];
                        if (isHoliday) cssClasses.push('holiday');
                        if (isSaturday) cssClasses.push('saturday');
                        if (isSunday) cssClasses.push('sunday');
                        if (isLeaveRequest) cssClasses.push('leave-day');
                        if (isToday) cssClasses.push('today');

                        return (
                            <div 
                                key={dayNumber} 
                                className={cssClasses.join(' ')}
                                onClick={() => handleDateClick(year, month, dayNumber)}
                                style={{
                                    position: 'relative'
                                }}
                            >
                                {dayNumber}
                                {isSingleDaySpan && (
                                    <div 
                                        className="leave-span single-day"
                                        style={{
                                            backgroundColor: getLeaveBackgroundColor(leaveSpan.leave),
                                            width: '100%',
                                            left: '0'
                                        }}
                                    >
                                        <span className="leave-type-text">
                                            {(() => {
                                                let leaveTypeName = '';
                                                if (leaveSpan.leave.leaveType && typeof leaveSpan.leave.leaveType === 'object') {
                                                    leaveTypeName = leaveSpan.leave.leaveType.name || leaveSpan.leave.leaveType.type || '';
                                                } else {
                                                    leaveTypeName = leaveSpan.leave.leaveType || '';
                                                }
                                                
                                                // Shorten the name for display
                                                const shortNames = {
                                                    'Vacation Leave': 'Vacation',
                                                    'Casual Leave': 'Casual',
                                                    'Medical Leave': 'Medical',
                                                    'Compensatory Off': 'Comp Off',
                                                    'On Duty Leave': 'On Duty',
                                                    'Special Leave': 'Special'
                                                };
                                                
                                                return shortNames[leaveTypeName] || leaveTypeName || 'Leave';
                                            })()}
                                        </span>
                                    </div>
                                )}
                                {isMoreThanTwoDaySpan && isFirstDayOfSpan && (
                                    <div 
                                        className="leave-span span-start"
                                        style={{
                                            backgroundColor: getLeaveBackgroundColor(leaveSpan.leave),
                                            width: 'calc(100% + 1px)',
                                            left: '0'
                                        }}
                                    >
                                        <img src={tickIcon} alt="Tick" className="tick-icon" />
                                    </div>
                                )}
                                {isTwoDaySpan && isFirstDayOfSpan && (
                                    <div 
                                        className="leave-span span-start"
                                        style={{
                                            backgroundColor: getLeaveBackgroundColor(leaveSpan.leave),
                                            width: 'calc(100% + 1px)',
                                            left: '0'
                                        }}
                                    />
                                )}
                                {isMultiDaySpan && !isFirstDayOfSpan && isLastDayOfSpan && (
                                    <div 
                                        className="leave-span span-end"
                                        style={{
                                            backgroundColor: getLeaveBackgroundColor(leaveSpan.leave),
                                            width: 'calc(100% + 1px)',
                                            left: '-1px'
                                        }}
                                    >
                                        <span className="leave-type-text">
                                            {(() => {
                                                let leaveTypeName = '';
                                                if (leaveSpan.leave.leaveType && typeof leaveSpan.leave.leaveType === 'object') {
                                                    leaveTypeName = leaveSpan.leave.leaveType.name || leaveSpan.leave.leaveType.type || '';
                                                } else {
                                                    leaveTypeName = leaveSpan.leave.leaveType || '';
                                                }
                                                
                                                // Shorten the name for display
                                                const shortNames = {
                                                    'Vacation Leave': 'Vacation',
                                                    'Casual Leave': 'Casual',
                                                    'Medical Leave': 'Medical',
                                                    'Compensatory Off': 'Comp Off',
                                                    'On Duty Leave': 'On Duty',
                                                    'Special Leave': 'Special'
                                                };

                                                return shortNames[leaveTypeName] || leaveTypeName || 'Leave';
                                            })()}
                                        </span>
                                    </div>
                                )}
                                {isMultiDaySpan && !isFirstDayOfSpan && !isLastDayOfSpan && (
                                    <div 
                                        className="leave-span span-middle"
                                        style={{
                                            backgroundColor: getLeaveBackgroundColor(leaveSpan.leave),
                                            width: 'calc(100% + 2px)',
                                            left: '-1px'
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <>
            <style>{`
                .apply-leave-page {
                    padding: 4vh 4vw;
                    background-color: #f9fafb;
                    font-family: 'Noto Serif', serif;
                    min-height: 100vh;
                    border-radius: 1vw;
                }
                .leave-controls-card {
                    display: flex;
                    align-items: center;
                    gap: 1.5vw;
                    padding: 2vh 1.5vw;
                    background-color: #ffffff;
                    border-radius: 1vw;
                    box-shadow: 0 0.4vh 1vh rgba(0, 0, 0, 0.1);
                    border: 0.1vh solid #e5e7eb;
                    max-width: 80vw;
                    margin: 0 auto 4vh auto;
                }
                .add-leave-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(180deg, #ff8c42, #ff701a);
                    color: white;
                    border: none;
                    border-radius: 0.8vw;
                    padding: 1.5vh 1.5vw;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1.8vh;
                    text-align: center;
                    transition: transform 0.2s, box-shadow 0.2s;
                    height: 14vh;
                    width: 9vw;
                    flex-shrink: 0;
                }
                .add-leave-btn:hover {
                    transform: translateY(-0.3vh);
                    box-shadow: 0 0.6vh 1.2vh rgba(255, 112, 26, 0.3);
                }
                .add-leave-btn .icon {
                    font-size: 4vh;
                    margin-bottom: 0.5vh;
                }
                .summary-grid-new {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5vw;
                    flex-grow: 1;
                }
                .summary-box-new {
                    background-color: #ffffff;
                    padding: 1.5vh 1vw;
                    border-radius: 0.8vw;
                    border: 0.1vh solid #e0e0e0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                }
                .summary-box-new .value {
                    font-size: 3.5vh;
                    font-weight: 700;
                    color: #8c1d40;
                }
                .summary-box-new .value small {
                    font-size: 1.8vh;
                    font-weight: 500;
                    color: #6c757d;
                }
                .summary-box-new .label {
                    font-size: 1.6vh;
                    color: #343a40;
                    margin-top: 0.5vh;
                }
                .instruction {
                    text-align: center;
                    color: #4b5563;
                    margin-bottom: 4vh;
                }
                .calendar-cards-container {
                    display: flex;
                    gap: 1.5vw;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                .calendar-card {
                    background: #fff;
                    border: 1px solid #e0e0e0;
                    border-radius: 0.8vw;
                    padding: 2vh 1.5vw;
                    width: 22vw;
                    max-width: 350px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                }
                .calendar-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2vh;
                    padding: 0 0.5vw;
                }
                .calendar-card-header h3 {
                    margin: 0;
                    font-size: 2.6vh;
                    font-weight: 600;
                    color: #333;
                }
                .eye-icon {
                    cursor: pointer;
                    font-size: 2.2vh;
                    color: #8c1d40;
                }
                .calendar-card-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    grid-template-rows: repeat(7, 1fr);
                    gap: 0;
                    border: 1px solid #e0e0e0;
                    border-radius: 0.2vw;
                    overflow: hidden;
                    min-height: 35vh;
                }
                .card-day-cell {
                    text-align: right;
                    font-size: 1vw;
                    padding: 0.5vh 0.5vw 3.5vh;
                    min-height: 4vh;
                    display: flex;
                    align-items: flex-start;
                    justify-content: flex-end;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    border-right: 1px solid #e0e0e0;
                    border-bottom: 1px solid #e0e0e0;
                    position: relative;
                    background-color: #ffffff;
                }
                .card-day-cell:nth-child(7n) {
                    border-right: none;
                }
                /* Remove bottom border for the last row (cells 36-42) */
                .card-day-cell:nth-child(n+36) {
                }
                .card-day-cell:not(.empty):not(.header):not(.holiday):hover {
                    background-color: #f8f9fa;
                }
                .card-day-cell.header {
                    font-weight: bold;
                    color: #666;
                    cursor: default;
                    background-color: #f8f9fa;
                    font-size: 1vw;
                    padding: 0.5vh 0.5vw;
                    text-align: center;
                    align-items: center;
                    justify-content: center;
                }
                .card-day-cell.header.sunday-header {
                    color: #d9534f;
                    font-weight: bold;
                }
                .card-day-cell.header:hover {
                    background-color: #f8f9fa;
                }
                .card-day-cell.empty {
                    background-color: #ffffff;
                    cursor: default;
                }
                .card-day-cell.holiday {
                    background-color: rgba(217, 83, 79, 0.1);
                    color: inherit;
                }

                .card-day-cell.sunday {
                    color: #d9534f;
                    font-weight: bold;
                }
                .card-day-cell.today {
                    background-color: #027e93;
                    color: white;
                    font-weight: bold;
                }
                .card-day-cell.today:hover {
                    background-color: #03b0cd !important;
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-close-btn {
                    background: none;
                    border: none;
                    font-size: 3.5vh;
                    cursor: pointer;
                    color: #2b2b2b;
                }
                
                /* --- PDF Modal Styles --- */
                .pdf-modal-content {
                    background: #fff;
                    padding: 2vh;
                    border-radius: 1vw;
                    width: 60vw;
                    height: 80vh;
                    max-width: 900px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    display: flex;
                    flex-direction: column;
                }
                .pdf-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 1vh;
                    padding-left: 1vw;
                    padding-right: 1vw;
                }
                .pdf-modal-header h3 {
                    margin: 0;
                    font-size: 2.2vh;
                }
                .pdf-viewer {
                    flex-grow: 1;
                    border: none;
                    border-radius: 0.5vw;
                }

                /* --- Leave Request Modal Styles --- */
                .leave-request-modal {
                    background: #fff;
                    padding: 4vh 3vw;
                    border-radius: 0.5vw;
                    width: 60vw;
                    max-width: 900px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    font-size: 1.7vh;
                }
                .leave-request-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5vh;
                    padding-bottom: 1vh;
                    border-bottom: 1px solid #eee;
                }
                .leave-request-header h3 {
                    margin: 0;
                    font-size: 2.7vh;
                    font-weight: 600;
                }
                .leave-request-body {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5vh;
                }
                .form-row {
                    display: flex;
                    gap: 2vw;
                    align-items: flex-end;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                }
                .form-group.full-width {
                    flex-basis: 100%;
                }
                .form-group label {
                    margin-bottom: 0.5vh;
                    font-size: 1.8vh;
                    color: #555;
                }
                .form-group input[type="date"],
                .form-group input[type="text"],
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    height: 5vh;
                    padding: 1.5vh 1.2vw;
                    border: 1px solid #ccc;
                    border-radius: 0.3vw;
                    font-size: 1.7vh;
                    box-sizing: border-box;
                }
                .form-group textarea {
                    height: 6vh;
                    resize: vertical;
                }
                .form-group input[type="text"][readOnly] {
                    background-color: #f0f0f0;
                    cursor: not-allowed;
                }
                
                /* Remove focus/active state styling */
                .form-group input[type="date"]:focus,
                .form-group input[type="text"]:focus,
                .form-group select:focus,
                .form-group textarea:focus,
                .form-group input[type="date"]:focus-visible,
                .form-group input[type="text"]:focus-visible,
                .form-group select:focus-visible,
                .form-group textarea:focus-visible {
                    outline: none !important;
                    border: 1px solid #ccc !important;
                    box-shadow: none !important;
                    background-color: #fff !important;
                }
                
                .form-group input[type="date"]:active,
                .form-group input[type="text"]:active,
                .form-group select:active,
                .form-group textarea:active {
                    outline: none !important;
                    border: 1px solid #ccc !important;
                    box-shadow: none !important;
                    background-color: #fff !important;
                }
                .form-group-checkbox {
                    display: flex;
                    align-items: center;
                    gap: 0.5vw;
                    padding-bottom: 1.2vh;
                }
                .leave-request-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1vw;
                    margin-top: 2vh;
                    padding-top: 1.5vh;
                    border-top: 1px solid #eee;
                }
                .btn-cancel, .btn-save {
                    padding: 1.5vh 2vw;
                    border: none;
                    border-radius: 0.5vw;
                    font-size: 1.8vh;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-cancel {
                    background-color: #f0f0f0;
                    color: #333;
                }
                .btn-save {
                    background-color: #93001a;
                    color: white;
                }
                .btn-cancel:disabled, .btn-save:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* File Upload Styles */
                .file-upload-container {
                    margin-top: 0.5vh;
                }
                
                .file-upload-btn {
                    display: flex;
                    align-items: center;
                    gap: 1vw;
                    padding: 1.5vh 1.5vw;
                    border: 2px dashed #ccc;
                    border-radius: 0.5vw;
                    background: #fafafa;
                    color: #666;
                    font-size: 1.6vh;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    width: 100%;
                    justify-content: center;
                }
                
                .file-upload-btn:hover {
                    border-color: #93001a;
                    background: #fff5f5;
                    color: #93001a;
                }
                
                .file-preview {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.5vh 1.5vw;
                    border: 1px solid #e0e0e0;
                    border-radius: 0.5vw;
                    background: #f8f9fa;
                }
                
                .file-info {
                    display: flex;
                    align-items: center;
                    gap: 1vw;
                    flex: 1;
                }
                
                .file-icon {
                    font-size: 2vh;
                }
                
                .file-name {
                    font-weight: 500;
                    color: #333;
                    font-size: 1.6vh;
                }
                
                .file-size {
                    color: #666;
                    font-size: 1.4vh;
                }
                
                .remove-file-btn {
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 3vh;
                    height: 3vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 1.4vh;
                    transition: background-color 0.3s ease;
                }
                
                .remove-file-btn:hover {
                    background: #c82333;
                }
                .btn-save:disabled {
                    background-color: #93001a;
                }
                .form-group input[type="date"]::-webkit-calendar-picker-indicator {
                    display: none;
                }
                .form-group input[type="date"]::-webkit-inner-spin-button,
                .form-group input[type="date"]::-webkit-outer-spin-button {
                    display: none;
                }
                .form-group input[type="date"]::-webkit-clear-button {
                    display: none;
                }
                .card-day-cell.leave-day {
                    position: relative;
                    font-weight: bold;
                }
                
                .leave-span {
                    position: absolute;
                    bottom: 0;
                    height: 3vh;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    white-space: nowrap;
                    z-index: 2;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .leave-span.single-day {
                    width: 100%;
                    left: 0;
                    border-top-left-radius: 40%;
                }
                
                .leave-span.span-start {
                    width: calc(100% + 1px);
                    left: 0;
                    border-top-left-radius: 90%;
                    position: absolute;
                    bottom: 0;
                    height: 3vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2;
                    overflow: visible;
                }
                
                .tick-icon {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 0.8vw;
                    height: 0.8vw;
                    filter: brightness(0) invert(1);
                    z-index: 3;
                    pointer-events: none;
                    margin-left: 0.8vw;
                }
                
                .leave-span.span-middle {
                    width: calc(100% + 2px);
                    left: -1px;
                    position: absolute;
                    bottom: 0;
                    height: 3vh;
                    z-index: 2;
                }
                
                .leave-span.span-end {
                    width: calc(100% + 1px);
                    left: -1px;
                    position: absolute;
                    bottom: 0;
                    height: 3vh;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    z-index: 2;
                    padding-right: 0.4vw;
                    overflow: visible;
                }
                
                .leave-type-text {
                    font-size: 1.8vh;
                    line-height: 1;
                    display: flex;
                    align-items: center;
                    gap: 0.3vw;
                    white-space: nowrap;
                    overflow: visible;
                }
                
                .leave-span.single-day .leave-type-text {
                    font-size: 1.1vh;
                }
                .separator {
                    border-bottom: 2px solid #8C001A;
                    margin-bottom: 2vh;
                    margin-left: -1vw;
                    margin-right: -1vw;
                }
                
                /* --- Leave Request Modal Styles --- */
                .leave-request-modal {
                    background: #fff;
                    padding: 4vh 3vw;
                    border-radius: 0.5vw;
                    width: 60vw;
                    max-width: 900px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    font-size: 1.7vh;
                }
                .leave-request-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5vh;
                    padding-bottom: 1vh;
                    border-bottom: 1px solid #eee;
                }
                .leave-request-header h3 {
                    margin: 0;
                    font-size: 2.7vh;
                    font-weight: 600;
                }
                .leave-request-body {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5vh;
                }
                .form-row {
                    display: flex;
                    gap: 2vw;
                    align-items: flex-end;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                }
                .form-group.full-width {
                    flex-basis: 100%;
                }
                .form-group label {
                    margin-bottom: 0.5vh;
                    font-size: 1.8vh;
                    color: #555;
                }
                .form-group input[type="date"],
                .form-group input[type="text"],
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    height: 5vh;
                    padding: 1.5vh 1.2vw;
                    border: 1px solid #ccc;
                    border-radius: 0.3vw;
                    font-size: 1.7vh;
                    box-sizing: border-box;
                }
                .form-group textarea {
                    height: 6vh;
                    resize: vertical;
                }
                .form-group input[type="text"][readOnly] {
                    background-color: #f0f0f0;
                    cursor: not-allowed;
                }
                
                /* Remove focus/active state styling */
                .form-group input[type="date"]:focus,
                .form-group input[type="text"]:focus,
                .form-group select:focus,
                .form-group textarea:focus,
                .form-group input[type="date"]:focus-visible,
                .form-group input[type="text"]:focus-visible,
                .form-group select:focus-visible,
                .form-group textarea:focus-visible {
                    outline: none !important;
                    border: 1px solid #ccc !important;
                    box-shadow: none !important;
                    background-color: #fff !important;
                }
                
                .form-group input[type="date"]:active,
                .form-group input[type="text"]:active,
                .form-group select:active,
                .form-group textarea:active {
                    outline: none !important;
                    border: 1px solid #ccc !important;
                    box-shadow: none !important;
                    background-color: #fff !important;
                }
                .form-group-checkbox {
                    display: flex;
                    align-items: center;
                    gap: 0.5vw;
                    padding-bottom: 1.2vh;
                }
                .leave-request-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1vw;
                    margin-top: 2vh;
                    padding-top: 1.5vh;
                    border-top: 1px solid #eee;
                }
                .btn-cancel, .btn-save {
                    padding: 1.5vh 2vw;
                    border: none;
                    border-radius: 0.5vw;
                    font-size: 1.8vh;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-cancel {
                    background-color: #f0f0f0;
                    color: #333;
                }
                .btn-save {
                    background-color: #93001a;
                    color: white;
                }
                .btn-cancel:disabled, .btn-save:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* File Upload Styles */
                .file-upload-container {
                    margin-top: 0.5vh;
                }
                
                .file-upload-btn {
                    display: flex;
                    align-items: center;
                    gap: 1vw;
                    padding: 1.5vh 1.5vw;
                    border: 2px dashed #ccc;
                    border-radius: 0.5vw;
                    background: #fafafa;
                    color: #666;
                    font-size: 1.6vh;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    width: 100%;
                    justify-content: center;
                }
                
                .file-upload-btn:hover {
                    border-color: #93001a;
                    background: #fff5f5;
                    color: #93001a;
                }
                
                .file-preview {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.5vh 1.5vw;
                    border: 1px solid #e0e0e0;
                    border-radius: 0.5vw;
                    background: #f8f9fa;
                }
                
                .file-info {
                    display: flex;
                    align-items: center;
                    gap: 1vw;
                    flex: 1;
                }
                
                .file-icon {
                    font-size: 2vh;
                }
                
                .file-name {
                    font-weight: 500;
                    color: #333;
                    font-size: 1.6vh;
                }
                
                .file-size {
                    color: #666;
                    font-size: 1.4vh;
                }
                
                .remove-file-btn {
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 3vh;
                    height: 3vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 1.4vh;
                    transition: background-color 0.3s ease;
                }
                
                .remove-file-btn:hover {
                    background: #c82333;
                }
                .btn-save:disabled {
                    background-color: #93001a;
                }
                .form-group input[type="date"]::-webkit-calendar-picker-indicator {
                    display: none;
                }
                .form-group input[type="date"]::-webkit-inner-spin-button,
                .form-group input[type="date"]::-webkit-outer-spin-button {
                    display: none;
                }
                .form-group input[type="date"]::-webkit-clear-button {
                    display: none;
                }
                
                /* Time input styling */
                .form-group input[type="time"] {
                    width: 100%;
                    height: 5vh;
                    padding: 1.5vh 1.2vw;
                    border: 1px solid #ccc;
                    border-radius: 0.3vw;
                    font-size: 1.7vh;
                    box-sizing: border-box;
                }
                .form-group input[type="time"]::-webkit-calendar-picker-indicator {
                    display: none;
                }
                .form-group input[type="time"]::-webkit-inner-spin-button,
                .form-group input[type="time"]::-webkit-outer-spin-button {
                    display: none;
                }
                .form-group input[type="time"]::-webkit-clear-button {
                    display: none;
                }
                .form-group input[type="time"]:focus,
                .form-group input[type="time"]:focus-visible {
                    outline: none !important;
                    border: 1px solid #ccc !important;
                    box-shadow: none !important;
                    background-color: #fff !important;
                }
                .form-group input[type="time"]:active {
                    outline: none !important;
                    border: 1px solid #ccc !important;
                    box-shadow: none !important;
                    background-color: #fff !important;
                }

            `}</style>
            <div className="apply-leave-page">
                <div className="leave-controls-card">
                     <button className="add-leave-btn" onClick={() => setIsLeaveModalOpen(true)}>
                        <div className="icon">
                          <img src={addLeaveIcon} alt="Add Leave" style={{ height: '4vh' }} />
                        </div>
                        <div style={{ marginTop: '1vh' }}>Add New</div>
                        <div>Leave</div>
                    </button>
                    
                    <div className="summary-grid-new">
                        <div className="summary-box-new">
                            <div className="value">
                                {(() => {
                                    const casualBalance = leaveBalances.find(balance => 
                                        balance.leaveType?.name === 'Casual Leave' || 
                                        balance.leaveType?.type === 'casual'
                                    );
                                    return casualBalance ? casualBalance.remaining : 12;
                                })()} 
                                <small>/ {(() => {
                                    const casualBalance = leaveBalances.find(balance => 
                                        balance.leaveType?.name === 'Casual Leave' || 
                                        balance.leaveType?.type === 'casual'
                                    );
                                    return casualBalance ? casualBalance.allocated : 12;
                                })()}</small>
                            </div>
                            <div className="label">Casual Leave</div>
                        </div>
                        <div className="summary-box-new">
                            <div className="value">
                                {(() => {
                                    const medicalBalance = leaveBalances.find(balance => 
                                        balance.leaveType?.name === 'Medical Leave' || 
                                        balance.leaveType?.type === 'medical'
                                    );
                                    return medicalBalance ? medicalBalance.remaining : 15;
                                })()} 
                                <small>/ {(() => {
                                    const medicalBalance = leaveBalances.find(balance => 
                                        balance.leaveType?.name === 'Medical Leave' || 
                                        balance.leaveType?.type === 'medical'
                                    );
                                    return medicalBalance ? medicalBalance.allocated : 15;
                                })()}</small>
                            </div>
                            <div className="label">Medical Leave</div>
                        </div>
                        <div className="summary-box-new">
                            <div className="value">{leaves.filter(l => l.status === 'pending').length}</div>
                            <div className="label">Pending Requests</div>
                        </div>
                        <div className="summary-box-new">
                            <div className="value" style={{fontSize: '2.5vh'}}>Jan 26</div>
                            <div className="label">Upcoming Holiday</div>
                        </div>
                    </div>

                </div>

                <div className="instruction" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: '4vh' }}>
                  <img src={disclaimerIcon} alt="Disclaimer" style={{ height: '1.6em', marginRight: '0.5em' }} />
                  <span>Double-click on a date cell to add a request for a leave starting from that date</span>
                </div>

                <div className="calendar-cards-container">
                    {displayMonths.map((month) => renderMonthCard(month.index, 2025))}
                </div>

                {isPdfModalOpen && <PDFModal onClose={handleCloseModals} />}
                {isLeaveModalOpen && <ApplyLeaveModal onClose={handleCloseModals} initialDate={initialLeaveDate} onLeaveCreated={() => {
                    fetchLeaves();
                    fetchLeaveBalances();
                }} />}
            </div>
        </>
    );
}

export default ApplyLeave;
