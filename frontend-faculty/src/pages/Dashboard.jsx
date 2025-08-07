import React from "react";
import { useOutletContext } from "react-router-dom";
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
  FaRegClock
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
const Dashboard = () => {
  // Get user data passed from Outlet's context
  // In a real app, you'd also get the user's role here, e.g., const { user, role } = useOutletContext();
  const { user } = useOutletContext();

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.profile?.firstName || 'User'}!</h1>
      </div>

      {/* --- TOP ROW WIDGETS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardCard title="My Leave Balance" icon={<FaChartBar />}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <span className="text-gray-600">Casual Leave (CL)</span>
                  <span className="font-bold text-lg">8 <span className="text-sm font-normal text-gray-500">/ 12</span></span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-yellow-400 h-2.5 rounded-full" style={{width: `${(8/12)*100}%`}}></div>
              </div>
            </div>
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                  <span className="text-gray-600">Medical Leave (ML)</span>
                  <span className="font-bold text-lg">10 <span className="text-sm font-normal text-gray-500">/ 15</span></span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-400 h-2.5 rounded-full" style={{width: `${(10/15)*100}%`}}></div>
              </div>
            </div>
        </DashboardCard>
        
        <DashboardCard title="Leave Request Status" icon={<FaClipboardList />}>
          <div className="space-y-3">
              <div className="flex justify-between items-center text-green-600 p-2 rounded-lg bg-green-50">
                  <span className="flex items-center gap-2"><FaCheckCircle /> Approved</span>
                  <span className="font-bold">5</span>
              </div>
              <div className="flex justify-between items-center text-yellow-600 p-2 rounded-lg bg-yellow-50">
                  <span className="flex items-center gap-2"><FaHourglassHalf /> Pending</span>
                  <span className="font-bold">2</span>
              </div>
              <div className="flex justify-between items-center text-red-600 p-2 rounded-lg bg-red-50">
                  <span className="flex items-center gap-2"><FaTimesCircle /> Rejected</span>
                  <span className="font-bold">3</span>
              </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Who's On Leave Today" icon={<FaRegCalendarAlt />}>
            <div className="flex items-center -space-x-4">
                <img className="w-14 h-14 border-2 border-white rounded-full object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" alt="Dr. Sharma" title="Dr. R. Sharma"/>
                <img className="w-14 h-14 border-2 border-white rounded-full object-cover" src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face" alt="Prof. Patel" title="Prof. V. Patel"/>
                <img className="w-14 h-14 border-2 border-white rounded-full object-cover" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" alt="Dr. Singh" title="Dr. A. Singh"/>
                <a className="flex items-center justify-center w-14 h-14 text-xs font-medium text-white bg-gray-700 border-2 border-white rounded-full hover:bg-gray-600" href="#">+5</a>
            </div>
            <p className="text-sm text-gray-500 mt-3">R. Sharma, V. Patel, A. Singh and 5 more from your department are on leave this week.</p>
        </DashboardCard>
      </div>

      {/* --- NEW SECTION: RECENT ACTIVITY (FOR ALL USERS) --- */}
      <div className="grid grid-cols-1">
        <DashboardCard title="Your Recent Activity" icon={<FaClipboardList />}>
          <div className="relative pl-6">
            {/* The timeline bar */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6 ml-0.5">
              {[
                { status: 'Approved', text: 'Your Casual Leave for 2 days has been approved.', time: '2 hours ago', icon: <FaRegCheckCircle className="text-green-500"/> },
                { status: 'Pending', text: 'You applied for Medical Leave for 5 days.', time: '1 day ago', icon: <FaRegClock className="text-yellow-500"/> },
                { status: 'Rejected', text: 'Your request for Compensatory Off was rejected.', time: '3 days ago', icon: <FaTimesCircle className="text-red-500"/> },
              ].map(activity => (
                <div key={activity.text} className="relative flex items-start">
                  <div className="absolute -left-[37px] top-1 flex items-center justify-center w-6 h-6 bg-white rounded-full border-2 border-gray-200">
                      {activity.icon}
                  </div>
                  <div>
                      <p className="font-semibold text-gray-800">{activity.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DashboardCard>
      </div>

    </div>
  );
};

export default Dashboard;