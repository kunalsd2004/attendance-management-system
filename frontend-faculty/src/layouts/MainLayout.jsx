import React, { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { 
  FaUserCircle, 
  FaThLarge, 
  FaCalendarAlt, 
  FaPaperPlane, 
  FaClipboardList, 
  FaUsers,
  FaCheckCircle,
  FaBell,
  FaQuestionCircle,
  FaTimes,
  FaCheck,
  FaClock,
  FaUserShield,
  FaChartBar
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import logo from '../assets/Dypatil logo.png';
import questionIcon from '../assets/question.svg';
import homeIcon from '../assets/home.svg';
import smallStrokeIcon from '../assets/small-stroke.svg';
import previousIcon from '../assets/previous.svg';
import LeaveTypesModal from '../components/modals/LeaveTypesModal';


const MainLayout = () => {
  const { user, logout, getDashboardPath } = useAuth();
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const menuRef = useRef(null);
  const notificationRef = useRef(null);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if logout API fails
      navigate('/', { replace: true });
    }
  };

  // Handle home icon click - navigate to role-specific dashboard
  const handleHomeClick = () => {
    const dashboardPath = getDashboardPath();
    navigate(dashboardPath);
  };

  // Handle previous button click - go back to previous page
  const handlePreviousClick = () => {
    navigate(-1);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get role-based sidebar items
  const getSidebarItems = (userRole) => {
    if (userRole === 'admin') {
      return [
        { name: "Calendar", icon: <FaCalendarAlt />, path: "/calendar" },
        { name: "Users", icon: <FaUsers />, path: "/users" },
        { name: "Leave Requests", icon: <FaClipboardList />, path: "/leave-requests" },
        { name: "Leave Balances", icon: <FaChartBar />, path: "/leave-balances" },
        { name: "Inbox", icon: <FaBell />, path: "/inbox" },
        { name: "Account", icon: <FaUserCircle />, path: "/account" },
      ];
    } else if (userRole === 'principal') {
      return [
        { name: "Dashboard", icon: <FaThLarge />, path: "/dashboard-principal" },
        { name: "Calendar", icon: <FaCalendarAlt />, path: "/calendar" },
        { name: "Apply Leave", icon: <FaPaperPlane />, path: "/apply-leave" },
        { name: "Approve Requests", icon: <FaCheckCircle />, path: "/approve-leaves" },
        { name: "Summary", icon: <FaChartBar />, path: "/summary" },
        { name: "Account", icon: <FaUserCircle />, path: "/account" },
      ];
    } else if (userRole === 'hod') {
      return [
        { name: "Dashboard", icon: <FaThLarge />, path: "/dashboard-hod" },
        { name: "Calendar", icon: <FaCalendarAlt />, path: "/calendar" },
        { name: "Approve Requests", icon: <FaCheckCircle />, path: "/approve-leaves" },
        { name: "Apply Leave", icon: <FaPaperPlane />, path: "/apply-leave" },
        { name: "My Requests", icon: <FaClipboardList />, path: "/requests" },
        { name: "Account", icon: <FaUserCircle />, path: "/account" },
      ];
    } else {
      // Faculty role
      return [
        { name: "Dashboard", icon: <FaThLarge />, path: "/dashboard" },
        { name: "Calendar", icon: <FaCalendarAlt />, path: "/calendar" },
        { name: "Apply Leave", icon: <FaPaperPlane />, path: "/apply-leave" },
        { name: "My Requests", icon: <FaClipboardList />, path: "/requests" },
        { name: "Account", icon: <FaUserCircle />, path: "/account" },
        { name: "Support", icon: <FaQuestionCircle />, path: "/support" },
      ];
    }
  };

  const sidebarItems = getSidebarItems(user?.role);

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return 'Dashboard';
      case '/dashboard-hod':
        return 'HOD Dashboard';
      case '/dashboard-admin':
        return 'Admin Dashboard';
      case '/dashboard-principal':
        return 'Principal Dashboard';
      case '/calendar':
        return 'Calendar';
      case '/apply-leave':
        return 'Apply Leave';
      case '/requests':
        return 'My Requests';
      case '/approve-leaves':
        return 'Approve Requests';
      case '/notifications':
        return 'Notifications';
      case '/users':
        return 'Users';
      case '/leave-requests':
        return 'Leave Requests';
      case '/leave-balances':
        return 'Leave Balances';
      case '/inbox':
        return 'Inbox';
      case '/summary':
        return 'Summary';
      case '/support':
        return 'Support';
      case '/account':
        return 'Account';
      default:
        return 'Overview';
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50">

      {/* Header */}
      <header className="h-[10vh] w-full bg-white flex items-center justify-between px-10 shadow-md z-10 shrink-0">
        <div className="flex items-center space-x-4">
          <img
            src={logo}
            alt="DY Patil Logo"
            className="h-[7vh] object-contain"
          />
        </div>
        
        {/* User Menu */}
        <div className="relative flex items-center gap-6">
          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative flex items-center"
            >
              <FaBell className="text-[#8C001A] text-[1.5vw] cursor-pointer hover:text-red-700 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <div className="absolute right-[-10px] top-full mt-7 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">Notifications</h3>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-sm text-[#8C001A] hover:text-red-700 transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifications List - Show only latest 2 unread */}
                <div className="px-2 py-1">
                  {notifications.filter(n => !n.read).length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500">
                      <FaBell className="text-4xl mx-auto mb-2 text-gray-300" />
                      <p>No unread notifications</p>
                    </div>
                  ) : (
                    notifications.filter(n => !n.read).slice(0, 2).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className="px-3 py-3 rounded-md transition-colors cursor-pointer bg-blue-50 hover:bg-blue-100"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            notification.type === 'success' ? 'bg-green-100 text-green-600' :
                            notification.type === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                            notification.type === 'error' ? 'bg-red-100 text-red-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {notification.type === 'success' ? <FaCheck className="text-sm" /> :
                             notification.type === 'pending' ? <FaClock className="text-sm" /> :
                             notification.type === 'error' ? <FaTimes className="text-sm" /> :
                             <FaBell className="text-sm" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.time}
                            </p>
                          </div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      setIsNotificationOpen(false);
                      navigate('/notifications');
                    }}
                    className="w-full text-center text-sm text-[#8C001A] hover:text-red-700 transition-colors"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center"
            >
              <FaUserCircle className="text-[#8C001A] text-[2.5vw] cursor-pointer" />
            </button>

            {/* Floating Menu */}
            {isMenuOpen && (
              <div className="absolute right-[-10px] top-full mt-5 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* User Info Section */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-start gap-3">
                    <FaUserCircle className="text-[#8C001A] text-4xl mt-1 flex-shrink-0 mr-2" />
                    <div>
                      <p className="font-bold text-gray-800 text-md mb-1">
                        {user?.profile?.firstName} {user?.profile?.lastName}
                      </p>
                      <p className="text-[#8C001A] text-sm mb-1">
                        {user?.role === 'hod' ? 'Head of Department' : user?.role === 'principal' ? 'Principal' : user?.profile?.designation}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {user?.profile?.department?.name || 
                         (user?.role === 'admin' || user?.role === 'principal' ? 'Administration' : 'No Department')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Options */}
                <div className="px-2 py-1">
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-500 hover:bg-gray-50 rounded-md transition-colors">
                    <span className="text-md">Settings</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-500 hover:bg-gray-50 rounded-md transition-colors">
                    <span className="text-md">Support</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-500 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
                  >
                    <span className="text-md">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-[18vw] bg-[#8C001A] text-white flex flex-col justify-between pt-2 px-4 pb-4 overflow-y-auto shrink-0">
          <div className="space-y-2">
            {/* ✨ UPDATED: Using NavLink for active styling */}
            {sidebarItems.map((item) => (
              <React.Fragment key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `relative flex items-center gap-4 px-4 py-2 rounded-[50px] rounded-l-none transition cursor-pointer text-[1vw] text-white ` +
                    (isActive
                      ? "bg-gradient-to-r from-[#8C001A] to-[#5b1414] nav-active"
                      : "bg-gradient-to-r from-[#8C001A] to-[#6d0c0c] hover:bg-gradient-to-r hover:from-[#8C001A] hover:to-[#5b1414]")
                  }
                >
                  <div className="text-[1.3vw]">{item.icon}</div>
                  <div className="w-[0.1vw] h-[3vh] bg-white"></div>
                  <span>{item.name}</span>
                </NavLink>
                <div className="h-[0.15vh] bg-[#5b1414] mx-4 rounded-full"></div>
              </React.Fragment>
            ))}
          </div>

          <div className="bg-white backdrop-blur-sm rounded-md text-[#8C001A] px-4 pb-2 pt-4">
            <div className="flex items-center justify-between mb-4 border-b border-[#8C001A] pb-2">
              <h4 className="font-bold text-[1.1vw]">
                Leave Types
              </h4>
              <button
                onClick={() => setIsModalOpen(true)}
              >
                <img src={questionIcon} alt="Help" className="w-[1vw] h-[1vw]" />
              </button>
            </div>
              {[
                { code: "CL", name: "Casual Leave", color: "bg-[#f29222]" },
                { code: "ML", name: "Medical Leave", color: "bg-[#a1c65d]" },
                { code: "CO", name: "Compensatory Off", color: "bg-[#0cb2af]" },
                { code: "VL", name: "Vacation Leave", color: "bg-[#fac723]" },
                { code: "OD", name: "On Duty Leave", color: "bg-[#e95e50]" },
                { code: "SL", name: "Special Leave", color: "bg-[#936fac]" }
              ].map(({ code, name, color }) => (
                <div key={code} className="flex items-center gap-3 text-[1vw] my-2">
                  <div
                    className={`mt-1 w-6 h-6 text-white flex items-center justify-center font-bold rounded-full text-[0.7vw] ${color}`}
                  >
                    {code}
                  </div>
                  {name}
                </div>
              ))}
            </div>

        </aside>

        {/* Right side container with subheader and main content */}
        <div className="flex-1 flex flex-col">
          {/* Subheader */}
          <div className="h-[7vh] bg-[#8C001A] border-l-[0.2vw] border-white flex items-center justify-between px-6 shadow-sm z-5 shrink-0">
            {/* Left side - Icons */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleHomeClick}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              >
                <img src={homeIcon} alt="Home" className="h-[3vh]" />
              </button>
              <img src={smallStrokeIcon} alt="Separator" className="h-6" />
              <button 
                onClick={handlePreviousClick}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              >
                <img src={previousIcon} alt="Previous" className="h-[2.2vh]" />
              </button>
            </div>
            
            {/* Center - Page Title */}
            <div className="flex-1 flex justify-center">
              <span className="font-medium text-[1.3vw] text-white">{getPageTitle()}</span>
            </div>
            
            {/* Right side - Empty for balance */}
            <div className="w-20"></div>
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
            {/* Pass real user data to child routes */}
            <Outlet context={{ user }} />
          </main>
        </div>
      </div>

      {/* Leave Types Modal */}
      <LeaveTypesModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default MainLayout;