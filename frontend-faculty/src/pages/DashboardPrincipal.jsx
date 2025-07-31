import React from "react";
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
          <div className="text-3xl font-bold text-gray-700">85</div>
          <div className="text-sm text-gray-500 mt-2">Active faculty members</div>
        </DashboardCard>
        
        <DashboardCard title="Pending Approvals" icon={<FaClipboardList />}>
          <div className="text-3xl font-bold text-yellow-600">12</div>
          <div className="text-sm text-gray-500 mt-2">Leave requests awaiting approval</div>
        </DashboardCard>

        <DashboardCard title="Institution Status" icon={<FaGraduationCap />}>
          <div className="text-3xl font-bold text-green-600">Active</div>
          <div className="text-sm text-gray-500 mt-2">Academic year in progress</div>
        </DashboardCard>
      </div>

      {/* --- PRINCIPAL SECTION: APPROVALS & OVERVIEW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
        {/* Pending Approvals Queue */}
        <DashboardCard title="Pending Approvals" icon={<FaHourglassHalf />} className="lg:col-span-2">
          <div className="space-y-4">
            {[
              { name: 'Dr. Sameer Joshi', type: 'Casual Leave', dates: '25 Jul - 26 Jul', dept: 'Computer Science', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
              { name: 'Prof. Priya Mehta', type: 'Medical Leave', dates: '28 Jul - 01 Aug', dept: 'Information Technology', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
              { name: 'Dr. Anil Kumar', type: 'Vacation Leave', dates: '04 Aug - 10 Aug', dept: 'Electronics', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
            ].map(req => (
              <div key={req.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <img className="w-10 h-10 rounded-full object-cover" src={req.img} alt={req.name} />
                  <div>
                    <p className="font-semibold text-gray-800">{req.name}</p>
                    <p className="text-xs text-gray-500">{req.type} ({req.dates}) - {req.dept}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full hover:bg-red-200">Reject</button>
                  <button className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full hover:bg-green-200">Approve</button>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Institutional Overview */}
        <DashboardCard title="Institutional Overview" icon={<FaCog />}>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Faculty Attendance</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div className="bg-blue-400 h-2.5 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Leave Approval Rate</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div className="bg-green-400 h-2.5 rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Department Performance</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div className="bg-purple-400 h-2.5 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* --- BOTTOM ROW: QUICK ACTIONS & STATS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quick Actions */}
        <DashboardCard title="Quick Actions" icon={<FaRegCheckCircle />}>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="text-center">
                <FaClipboardList className="mx-auto text-xl mb-2" />
                <span className="text-sm font-medium">Review Requests</span>
              </div>
            </button>
            <button className="p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
              <div className="text-center">
                <FaChartBar className="mx-auto text-xl mb-2" />
                <span className="text-sm font-medium">View Summary</span>
              </div>
            </button>
            <button className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="text-center">
                <FaUsers className="mx-auto text-xl mb-2" />
                <span className="text-sm font-medium">Faculty List</span>
              </div>
            </button>
            <button className="p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
              <div className="text-center">
                <FaRegCalendarAlt className="mx-auto text-xl mb-2" />
                <span className="text-sm font-medium">Calendar</span>
              </div>
            </button>
          </div>
        </DashboardCard>

        {/* Recent Activity */}
        <DashboardCard title="Recent Activity" icon={<FaRegClock />}>
          <div className="space-y-3">
            {[
              { action: 'Approved leave request', user: 'Dr. Joshi', time: '2 hours ago', status: 'approved' },
              { action: 'New leave application', user: 'Prof. Mehta', time: '4 hours ago', status: 'pending' },
              { action: 'Department report submitted', user: 'IT Department', time: '6 hours ago', status: 'completed' },
              { action: 'Faculty meeting scheduled', user: 'All HODs', time: '1 day ago', status: 'scheduled' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'approved' ? 'bg-green-500' :
                  activity.status === 'pending' ? 'bg-yellow-500' :
                  activity.status === 'completed' ? 'bg-blue-500' :
                  'bg-purple-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
};

export default DashboardPrincipal; 