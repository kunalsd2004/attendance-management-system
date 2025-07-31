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
  const role = "HOD"; // Hardcoded for demonstration. Should be dynamic.

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.profile?.firstName || 'User'}!</h1>
      </div>

      {/* --- NEW SECTION: APPROVALS & ANALYTICS (FOR HOD/PRINCIPAL) --- */}
      {/* ✨ Conditionally render this entire grid based on user role */}
      { (role === "HOD" || role === "Principal") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Pending Approvals Queue */}
            <DashboardCard title="Pending Approvals" icon={<FaHourglassHalf />} className="lg:col-span-2">
                <div className="space-y-4">
                    {[
                        { name: 'Sameer Joshi', type: 'Casual Leave', dates: '25 Jul - 26 Jul', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
                        { name: 'Priya Mehta', type: 'Medical Leave', dates: '28 Jul - 01 Aug', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
                        { name: 'Anil Kumar', type: 'Vacation Leave', dates: '04 Aug - 10 Aug', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
                    ].map(req => (
                        <div key={req.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                                <img className="w-10 h-10 rounded-full object-cover" src={req.img} alt={req.name} />
                                <div>
                                    <p className="font-semibold text-gray-800">{req.name}</p>
                                    <p className="text-xs text-gray-500">{req.type} ({req.dates})</p>
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

            {/* Leave Type Distribution */}
            <DashboardCard title="Department Leave Distribution" icon={<FaChartBar />}>
  <div className="space-y-3">
    <div>
      <p className="text-sm font-medium text-gray-600">Casual Leave</p>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
        <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: '60%' }}></div>
      </div>
    </div>

    <div>
      <p className="text-sm font-medium text-gray-600">Medical Leave</p>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
        <div className="bg-green-400 h-2.5 rounded-full" style={{ width: '25%' }}></div>
      </div>
    </div>

    <div>
      <p className="text-sm font-medium text-gray-600">Other</p>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
        <div className="bg-cyan-400 h-2.5 rounded-full" style={{ width: '15%' }}></div>
      </div>
    </div>

    <div>
      <p className="text-sm font-medium text-gray-600">Vacation Leave</p>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
        <div className="bg-purple-400 h-2.5 rounded-full" style={{ width: '30%' }}></div>
      </div>
    </div>

    {/* Compensatory Off */}
    <div>
      <p className="text-sm font-medium text-gray-600">Compensatory Off</p>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
        <div className="bg-pink-400 h-2.5 rounded-full" style={{ width: '10%' }}></div>
      </div>
    </div>
  </div>
</DashboardCard>

        </div>
      )}

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