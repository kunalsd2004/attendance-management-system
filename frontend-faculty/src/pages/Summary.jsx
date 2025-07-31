import React from 'react';
import { FaUsers, FaBuilding, FaChartBar, FaCalendarAlt, FaFileAlt, FaDownload, FaBell, FaCalendarCheck } from 'react-icons/fa';

const Summary = () => {
  // Mock data for summary
  const summaryData = {
    totalEmployees: 150,
    totalDepartments: 8,
    totalLeaveRequests: 45,
    pendingRequests: 12,
    approvedRequests: 28,
    rejectedRequests: 5,
    averageAttendance: 92.5,
    leaveUtilization: 78.3
  };

  const departmentStats = [
    { name: 'Computer Science', employees: 25, attendance: 94.2, leaveRequests: 8 },
    { name: 'Information Technology', employees: 30, attendance: 91.8, leaveRequests: 12 },
    { name: 'Mechanical Engineering', employees: 20, attendance: 89.5, leaveRequests: 6 },
    { name: 'Electrical Engineering', employees: 18, attendance: 93.1, leaveRequests: 5 },
    { name: 'Civil Engineering', employees: 15, attendance: 90.2, leaveRequests: 4 },
    { name: 'Chemical Engineering', employees: 12, attendance: 88.9, leaveRequests: 3 },
    { name: 'Electronics', employees: 22, attendance: 92.7, leaveRequests: 7 },
    { name: 'Biotechnology', employees: 8, attendance: 95.1, leaveRequests: 2 }
  ];

  const leaveTypeStats = [
    { type: 'Casual Leave', used: 156, remaining: 44, utilization: 78.0, color: '#f29222' },
    { type: 'Medical Leave', used: 89, remaining: 61, utilization: 59.3, color: '#a1c65d' },
    { type: 'Vacation Leave', used: 0, remaining: 0, utilization: 0, color: '#fac723' },
    { type: 'Compensatory Off', used: 0, remaining: 0, utilization: 0, color: '#0cb2af' },
    { type: 'Urgent Leave', used: 0, remaining: 0, utilization: 0, color: '#e95e50' },
    { type: 'Special Leave', used: 0, remaining: 0, utilization: 0, color: '#936fac' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold text-[#1e1e1e] mb-6">Summary Dashboard</h1>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold text-[#1e1e1e]">{summaryData.totalEmployees}</p>
              </div>
              <div className="text-[#f29222] text-3xl">
                <FaUsers />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-3xl font-bold text-[#1e1e1e]">{summaryData.totalDepartments}</p>
              </div>
              <div className="text-[#a1c65d] text-3xl">
                <FaBuilding />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Attendance</p>
                <p className="text-3xl font-bold text-[#1e1e1e]">{summaryData.averageAttendance}%</p>
              </div>
              <div className="text-[#0cb2af] text-3xl">
                <FaChartBar />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Leave Utilization</p>
                <p className="text-3xl font-bold text-[#1e1e1e]">{summaryData.leaveUtilization}%</p>
              </div>
              <div className="text-[#936fac] text-3xl">
                <FaCalendarAlt />
              </div>
            </div>
          </div>
        </div>

        {/* Leave Requests Summary */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-[#8C001A] text-xl">
              <FaFileAlt />
            </div>
            <h2 className="font-bold text-lg text-[#1e1e1e]">Leave Requests Summary</h2>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-[#0cb2af] rounded-lg">
              <div className="text-3xl font-bold text-white">{summaryData.totalLeaveRequests}</div>
              <div className="text-sm text-gray-200">Total Requests</div>
            </div>
            <div className="text-center p-4 bg-[#fac723] rounded-lg">
              <div className="text-3xl font-bold text-white">{summaryData.pendingRequests}</div>
              <div className="text-sm text-gray-100">Pending</div>
            </div>
            <div className="text-center p-4 bg-[#a1c65d] rounded-lg">
              <div className="text-3xl font-bold text-white">{summaryData.approvedRequests}</div>
              <div className="text-sm text-gray-100">Approved</div>
            </div>
            <div className="text-center p-4 bg-[#e95e50] rounded-lg">
              <div className="text-3xl font-bold text-white">{summaryData.rejectedRequests}</div>
              <div className="text-sm text-gray-100">Rejected</div>
            </div>
          </div>
        </div>

        {/* Department Statistics */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-[#8C001A] text-xl">
              <FaBuilding />
            </div>
            <h2 className="font-bold text-lg text-[#1e1e1e]">Department Statistics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave Requests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departmentStats.map((dept, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{dept.employees}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-2">{dept.attendance}%</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full" 
                            style={{ 
                              width: `${dept.attendance}%`,
                              backgroundColor: dept.attendance >= 90 ? '#a1c65d' : 
                                             dept.attendance >= 80 ? '#fac723' : '#e95e50'
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{dept.leaveRequests}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        dept.attendance >= 90 ? 'bg-gray-100 text-gray-900 border border-gray-300' :
                        dept.attendance >= 80 ? 'bg-gray-100 text-gray-900 border border-gray-300' :
                        'bg-gray-100 text-gray-900 border border-gray-300'
                      }`}>
                        {dept.attendance >= 90 ? 'Excellent' :
                         dept.attendance >= 80 ? 'Good' : 'Needs Attention'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leave Type Utilization */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-[#8C001A] text-xl">
              <FaCalendarCheck />
            </div>
            <h2 className="font-bold text-lg text-[#1e1e1e]">Leave Type Utilization</h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {leaveTypeStats.map((leaveType, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-900">{leaveType.type}</h3>
                  <span className="text-sm text-gray-600">{leaveType.utilization}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{ 
                      width: `${leaveType.utilization}%`,
                      backgroundColor: leaveType.color
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Used: {leaveType.used}</span>
                  <span>Remaining: {leaveType.remaining}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-[#8C001A] text-xl">
              <FaFileAlt />
            </div>
            <h2 className="font-bold text-lg text-[#1e1e1e]">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <button className="flex items-center justify-center gap-2 bg-[#8C001A] text-white px-6 py-3 rounded-lg hover:bg-[#6a0015] transition-colors font-medium">
              <FaFileAlt />
              Generate Report
            </button>
            <button className="flex items-center justify-center gap-2 bg-[#8C001A] text-white px-6 py-3 rounded-lg hover:bg-[#6a0015] transition-colors font-medium">
              <FaDownload />
              Export Data
            </button>
            <button className="flex items-center justify-center gap-2 bg-[#8C001A] text-white px-6 py-3 rounded-lg hover:bg-[#6a0015] transition-colors font-medium">
              <FaBell />
              Send Notifications
            </button>
            <button className="flex items-center justify-center gap-2 bg-[#8C001A] text-white px-6 py-3 rounded-lg hover:bg-[#6a0015] transition-colors font-medium">
              <FaCalendarCheck />
              Schedule Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary; 