import React, { useState, useRef } from 'react';
import { FaClock, FaEdit, FaCheck, FaDownload, FaUsers } from 'react-icons/fa';
import dropdownIcon from '../assets/dropdown.svg';
import calendarIcon from '../assets/calendar.svg';

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState('2024-01-15');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const dateRef = useRef(null);
  
  // Mock data for attendance
  const attendanceData = [
    {
      id: 1,
      employeeName: 'John Doe',
      employeeId: 'EMP001',
      department: 'Computer Science',
      date: '2024-01-15',
      checkIn: '09:00 AM',
      checkOut: '06:00 PM',
      status: 'present',
      totalHours: 9
    },
    {
      id: 2,
      employeeName: 'Jane Smith',
      employeeId: 'EMP002',
      department: 'Information Technology',
      date: '2024-01-15',
      checkIn: '08:45 AM',
      checkOut: '05:30 PM',
      status: 'present',
      totalHours: 8.75
    },
    {
      id: 3,
      employeeName: 'Mike Johnson',
      employeeId: 'EMP003',
      department: 'Mechanical Engineering',
      date: '2024-01-15',
      checkIn: '--',
      checkOut: '--',
      status: 'absent',
      totalHours: 0
    },
    {
      id: 4,
      employeeName: 'Sarah Wilson',
      employeeId: 'EMP004',
      department: 'Computer Science',
      date: '2024-01-15',
      checkIn: '10:30 AM',
      checkOut: '06:00 PM',
      status: 'late',
      totalHours: 7.5
    }
  ];

  // Mock departments data
  const departments = [
    { _id: 'all', name: 'All Departments', code: 'ALL' },
    { _id: 'cs', name: 'Computer Science', code: 'CS' },
    { _id: 'it', name: 'Information Technology', code: 'IT' },
    { _id: 'me', name: 'Mechanical Engineering', code: 'ME' },
    { _id: 'ce', name: 'Civil Engineering', code: 'CE' },
    { _id: 'ec', name: 'Electronics & Communication', code: 'EC' }
  ];

  const filteredAttendance = attendanceData.filter(record => {
    const departmentMatch = selectedDepartment === 'all' || record.department === selectedDepartment;
    const dateMatch = record.date === selectedDate;
    return departmentMatch && dateMatch;
  });

  // Get selected department display name
  const getSelectedDepartmentName = () => {
    const dept = departments.find(d => d._id === selectedDepartment);
    return dept ? dept.name : 'All Departments';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-gray-300 text-gray-900';
      case 'absent': return 'bg-gray-400 text-white';
      case 'late': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'late': return '⏰';
      default: return '❓';
    }
  };

  const summary = {
    total: filteredAttendance.length,
    present: filteredAttendance.filter(r => r.status === 'present').length,
    absent: filteredAttendance.filter(r => r.status === 'absent').length,
    late: filteredAttendance.filter(r => r.status === 'late').length
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <style>
        {`
          .custom-date-input::-webkit-calendar-picker-indicator {
            display: none !important;
          }
          .custom-date-input::-webkit-inner-spin-button,
          .custom-date-input::-webkit-outer-spin-button {
            display: none !important;
          }
          .custom-date-input::-webkit-clear-button {
            display: none !important;
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-[#8C001A] text-xl">
              <FaClock />
            </div>
            <h1 className="text-3xl font-bold text-[#1e1e1e]">Attendance</h1>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Date:</label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={dateRef}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C001A] focus:border-[#8C001A] pr-10 custom-date-input"
                  style={{
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none',
                    backgroundImage: 'none',
                    background: 'none'
                  }}
                />
                <img 
                  src={calendarIcon} 
                  alt="Calendar" 
                  onClick={() => dateRef.current?.showPicker?.() || dateRef.current?.focus()}
                  style={{ 
                    position: 'absolute', 
                    right: '1vw', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    height: '2vh', 
                    cursor: 'pointer',
                    pointerEvents: 'auto'
                  }} 
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Department:</label>
              <div className="relative">
                <div
                  className="custom-dropdown"
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '0.3vw',
                    padding: '1.5vh 1.2vw',
                    fontSize: '1vw',
                    background: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    userSelect: 'none',
                    height: '5vh',
                    boxSizing: 'border-box',
                    minWidth: '300px'
                  }}
                  onClick={() => setDepartmentDropdownOpen(!departmentDropdownOpen)}
                >
                  <span style={{
                    flex: 1,
                    color: '#333',
                    fontWeight: '500',
                  }}>
                    {getSelectedDepartmentName()}
                  </span>
                  <img src={dropdownIcon} alt="Dropdown" style={{ marginLeft: 'auto', height: '1.2vh', flexShrink: 0 }} />
                </div>
                {departmentDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '0.5vw',
                      zIndex: 10,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      marginTop: 2,
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}
                  >
                    {departments.map(dept => (
                      <div
                        key={dept._id}
                        style={{
                          padding: '1.2vh 1.2vw',
                          cursor: 'pointer',
                          background: selectedDepartment === dept._id ? '#f5f5f5' : '#fff',
                          fontSize: '0.9vw',
                          borderBottom: dept._id !== departments[departments.length - 1]._id ? '1px solid #f0f0f0' : 'none',
                        }}
                        onClick={() => {
                          setSelectedDepartment(dept._id);
                          setDepartmentDropdownOpen(false);
                        }}
                      >
                        <span style={{
                          flex: 1,
                          color: '#333',
                          fontWeight: selectedDepartment === dept._id ? '600' : '400',
                        }}>
                          {dept.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="text-3xl font-bold text-[#1e1e1e]">
              {summary.total}
            </div>
            <div className="text-sm text-gray-600">Total Employees</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="text-3xl font-bold text-[#1e1e1e]">
              {summary.present}
            </div>
            <div className="text-sm text-gray-600">Present</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="text-3xl font-bold text-[#1e1e1e]">
              {summary.absent}
            </div>
            <div className="text-sm text-gray-600">Absent</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="text-3xl font-bold text-[#1e1e1e]">
              {summary.late}
            </div>
            <div className="text-sm text-gray-600">Late</div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Check In
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Check Out
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Total Hours
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.employeeName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.employeeId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{record.department}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{record.checkIn}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{record.checkOut}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-medium">{record.totalHours} hrs</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getStatusIcon(record.status)}</span>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button className="text-[#8C001A] hover:text-[#6a0015] flex items-center gap-1 transition-colors duration-200">
                          <FaEdit className="text-sm" />
                          <span>Edit</span>
                        </button>
                        <button className="text-gray-700 hover:text-gray-900 flex items-center gap-1 transition-colors duration-200">
                          <FaCheck className="text-sm" />
                          <span>Mark Present</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex flex-wrap justify-end gap-3">
            <button className="flex items-center gap-2 bg-[#8C001A] text-white px-4 py-2 rounded-lg hover:bg-[#6a0015] transition-colors font-medium">
              <FaDownload className="text-sm" />
              Export Report
            </button>
            <button className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium">
              <FaUsers className="text-sm" />
              Bulk Mark Present
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance; 