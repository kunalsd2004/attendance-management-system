import React, { useState, useEffect } from 'react';
import { FaUsers, FaBuilding, FaChartBar, FaCalendarAlt, FaFileAlt, FaDownload, FaBell, FaCalendarCheck } from 'react-icons/fa';
import apiService from '../services/api';

const Summary = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Real data state
  const [summaryData, setSummaryData] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    totalLeaveRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    leaveUtilization: 0
  });
  
  const [departmentStats, setDepartmentStats] = useState([]);
  const [leaveTypeStats, setLeaveTypeStats] = useState([]);

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [departmentsRes, leavesRes, balanceRes] = await Promise.all([
        apiService.getDepartments(),
        apiService.getLeaves({}),
        apiService.getLeaveBalanceSummary()
      ]);

      // Process departments data
      const departments = departmentsRes.success ? departmentsRes.data : [];
      
      // Process leaves data
      const allLeaves = leavesRes.success ? leavesRes.data.leaves : [];
      const filteredLeaves = allLeaves.filter(leave => leave.status !== 'cancelled');
      
      // Process leave balances data
      const balances = balanceRes.success ? balanceRes.data.users : [];

      // Calculate summary statistics
      const totalEmployees = balances.length;
      const totalDepartments = departments.length;
      const totalLeaveRequests = filteredLeaves.length;
      const pendingRequests = filteredLeaves.filter(leave => leave.status === 'pending').length;
      const approvedRequests = filteredLeaves.filter(leave => leave.status === 'approved').length;
      const rejectedRequests = filteredLeaves.filter(leave => leave.status === 'rejected').length;

      // Calculate leave utilization
      let totalAllocated = 0;
      let totalUsed = 0;
      balances.forEach(user => {
        user.balances.forEach(balance => {
          totalAllocated += balance.allocated;
          totalUsed += balance.used;
        });
      });
      const leaveUtilization = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0;

      setSummaryData({
        totalEmployees,
        totalDepartments,
        totalLeaveRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        leaveUtilization
      });

      // Calculate department statistics
      const deptStats = departments.map(dept => {
        const deptUsers = balances.filter(user => user.department === dept.name);
        const deptLeaves = filteredLeaves.filter(leave => 
          leave.applicant?.profile?.department?.name === dept.name
        );
        
        return {
          name: dept.name,
          employees: deptUsers.length,
          attendance: 95, // Mock attendance for now
          leaveRequests: deptLeaves.length
        };
      });

      setDepartmentStats(deptStats);

      // Calculate leave type statistics
      const leaveTypeMap = {};
      balances.forEach(user => {
        user.balances.forEach(balance => {
          if (!leaveTypeMap[balance.leaveType]) {
            leaveTypeMap[balance.leaveType] = {
              used: 0,
              remaining: 0,
              allocated: 0
            };
          }
          leaveTypeMap[balance.leaveType].used += balance.used;
          leaveTypeMap[balance.leaveType].remaining += balance.remaining;
          leaveTypeMap[balance.leaveType].allocated += balance.allocated;
        });
      });

      const leaveTypeColors = {
        'Casual': '#f29222',
        'Medical': '#a1c65d',
        'Vacation': '#fac723',
        'CompensatoryOff': '#0cb2af',
        'OnDuty': '#e95e50',
        'Special': '#936fac'
      };

      const leaveTypeStats = Object.entries(leaveTypeMap).map(([type, data]) => {
        const utilization = data.allocated > 0 ? Math.round((data.used / data.allocated) * 100) : 0;
        return {
          type: `${type} Leave`,
          used: data.used,
          remaining: data.remaining,
          utilization,
          color: leaveTypeColors[type] || '#6b7280'
        };
      });

      setLeaveTypeStats(leaveTypeStats);

    } catch (err) {
      console.error('Error fetching summary data:', err);
      setError(err.message || 'Failed to load summary data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8C001A]"></div>
            <span className="ml-3 text-gray-600">Loading summary data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-center text-red-600">
            <h2 className="text-xl font-semibold mb-2">Error Loading Summary</h2>
            <p>{error}</p>
            <button 
              onClick={fetchSummaryData}
              className="mt-4 px-4 py-2 bg-[#8C001A] text-white rounded-lg hover:bg-[#6a0015] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                <p className="text-sm font-medium text-gray-600">Total Leave Requests</p>
                <p className="text-3xl font-bold text-[#1e1e1e]">{summaryData.totalLeaveRequests}</p>
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
                      <span className="text-sm text-gray-900">{dept.leaveRequests}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        dept.employees > 0 ? 'bg-green-100 text-green-800 border border-green-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {dept.employees > 0 ? 'Active' : 'No Employees'}
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
              View Reports
            </button>
            <button className="flex items-center justify-center gap-2 bg-[#8C001A] text-white px-6 py-3 rounded-lg hover:bg-[#6a0015] transition-colors font-medium">
              <FaDownload />
              Export Data
            </button>
            <button className="flex items-center justify-center gap-2 bg-[#8C001A] text-white px-6 py-3 rounded-lg hover:bg-[#6a0015] transition-colors font-medium">
              <FaBell />
              Notifications
            </button>
            <button className="flex items-center justify-center gap-2 bg-[#8C001A] text-white px-6 py-3 rounded-lg hover:bg-[#6a0015] transition-colors font-medium">
              <FaCalendarCheck />
              Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary; 