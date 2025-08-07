import React, { useState, useEffect } from "react";
import { 
  FaRegCalendarAlt, 
  FaCheckCircle, 
  FaHourglassHalf, 
  FaTimesCircle, 
  FaChartBar, 
  FaClipboardList,
  FaArrowUp,
  FaArrowDown,
  FaRegCheckCircle,
  FaRegClock,
  FaUsers,
  FaUserShield,
  FaCog,
  FaGraduationCap
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

// A reusable card component for our widgets
const DashboardCard = ({ title, children, icon, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 h-full ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <div className="text-[#8C001A] text-xl">{icon}</div>
      <h3 className="font-bold text-lg text-gray-700">{title}</h3>
    </div>
    <div>{children}</div>
  </div>
);

// Main Dashboard Component
const DashboardPrincipal = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalFaculty: 0,
    pendingApprovals: 0,
    totalDepartments: 0,
    totalLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
    pendingLeaves: 0,
    recentLeaves: [],
    leaveBalances: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [departmentsRes, leavesRes, balanceRes, pendingRes] = await Promise.all([
        apiService.getDepartments(),
        apiService.getLeaves({}),
        apiService.getLeaveBalanceSummary(),
        apiService.getPendingLeaves(user?._id)
      ]);

      // Process departments data
      const departments = departmentsRes.success ? departmentsRes.data : [];
      
      // Process leaves data
      const allLeaves = leavesRes.success ? leavesRes.data.leaves : [];
      const filteredLeaves = allLeaves.filter(leave => leave.status !== 'cancelled');
      
      // Process leave balances data
      const balances = balanceRes.success ? balanceRes.data.users : [];
      
      // Process pending approvals
      const pendingLeaves = pendingRes.success ? pendingRes.data.leaves : [];

      // Calculate statistics
      const totalFaculty = balances.filter(user => user.role === 'faculty').length;
      const totalDepartments = departments.length;
      const totalLeaves = filteredLeaves.length;
      const approvedLeaves = filteredLeaves.filter(leave => leave.status === 'approved').length;
      const rejectedLeaves = filteredLeaves.filter(leave => leave.status === 'rejected').length;
      const pendingLeavesCount = pendingLeaves.length;

      // Get recent leaves (last 5)
      const recentLeaves = filteredLeaves
        .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
        .slice(0, 5)
        .map(leave => ({
          name: `${leave.applicant?.profile?.firstName || ''} ${leave.applicant?.profile?.lastName || ''}`,
          type: leave.leaveType?.name || 'Unknown',
          dates: `${new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          dept: leave.applicant?.profile?.department?.name || 'Unknown',
          status: leave.status,
          appliedAt: leave.appliedAt
        }));

      setDashboardData({
        totalFaculty,
        pendingApprovals: pendingLeavesCount,
        totalDepartments,
        totalLeaves,
        approvedLeaves,
        rejectedLeaves,
        pendingLeaves: pendingLeavesCount,
        recentLeaves,
        leaveBalances: balances
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8C001A]"></div>
          <span className="ml-3 text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Welcome, Principal!</h1>
        <p className="text-gray-600 mt-2">Overview of institutional activities and approvals</p>
      </div>

      {/* --- TOP ROW WIDGETS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardCard title="Total Faculty" icon={<FaUsers />}>
          <div className="text-3xl font-bold text-gray-700">{dashboardData.totalFaculty}</div>
          <div className="text-sm text-gray-500 mt-2">Active faculty members</div>
        </DashboardCard>
        
        <DashboardCard title="Pending Approvals" icon={<FaClipboardList />}>
          <div className="text-3xl font-bold text-yellow-600">{dashboardData.pendingApprovals}</div>
          <div className="text-sm text-gray-500 mt-2">Leave requests awaiting approval</div>
        </DashboardCard>

        <DashboardCard title="Institution Status" icon={<FaGraduationCap />}>
          <div className="text-3xl font-bold text-green-600">Active</div>
          <div className="text-sm text-gray-500 mt-2">Academic year in progress</div>
        </DashboardCard>
      </div>

      {/* --- PRINCIPAL SECTION: APPROVALS & OVERVIEW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
        {/* Recent Activity Queue */}
        <DashboardCard title="Recent Activity" icon={<FaHourglassHalf />} className="lg:col-span-2">
          <div className="space-y-4">
            {dashboardData.recentLeaves.length > 0 ? (
              dashboardData.recentLeaves.map((req, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">
                        {req.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{req.name}</p>
                      <p className="text-xs text-gray-500">{req.type} ({req.dates}) - {req.dept}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      req.status === 'approved' ? 'text-green-700 bg-green-100' :
                      req.status === 'rejected' ? 'text-red-700 bg-red-100' :
                      'text-yellow-700 bg-yellow-100'
                    }`}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                No recent leave requests
              </div>
            )}
          </div>
        </DashboardCard>

        {/* Institutional Overview */}
        <DashboardCard title="Institutional Overview" icon={<FaCog />}>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Departments</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div className="bg-blue-400 h-2.5 rounded-full" style={{ width: `${Math.min((dashboardData.totalDepartments / 10) * 100, 100)}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{dashboardData.totalDepartments} departments</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Leave Approval Rate</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div className="bg-green-400 h-2.5 rounded-full" style={{ width: `${dashboardData.totalLeaves > 0 ? Math.round((dashboardData.approvedLeaves / dashboardData.totalLeaves) * 100) : 0}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{dashboardData.approvedLeaves} approved / {dashboardData.totalLeaves} total</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div className="bg-purple-400 h-2.5 rounded-full" style={{ width: `${dashboardData.totalLeaves > 0 ? Math.round((dashboardData.pendingLeaves / dashboardData.totalLeaves) * 100) : 0}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{dashboardData.pendingLeaves} pending</p>
            </div>
          </div>
        </DashboardCard>
      </div>


    </div>
  );
};

export default DashboardPrincipal; 