import React from "react";
import { useOutletContext } from "react-router-dom";
import { useNotifications } from "../contexts/NotificationContext";
import { 
  FaCheck, 
  FaClock, 
  FaTimes, 
  FaBell,
  FaCheckDouble,
  FaArrowLeft
} from "react-icons/fa";
import deleteIcon from "../assets/delete.svg";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const { user } = useOutletContext();
  const { notifications, unreadCount, markAllAsRead, markAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <FaCheck className="text-sm" />;
      case 'pending':
        return <FaClock className="text-sm" />;
      case 'error':
        return <FaTimes className="text-sm" />;
      default:
        return <FaBell className="text-sm" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-600';
      case 'pending':
        return 'bg-yellow-100 text-yellow-600';
      case 'error':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-[#8C001A] hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-[#8C001A] text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FaCheckDouble className="text-sm" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {notifications.length === 0 ? (
          <div className="px-8 py-12 text-center text-gray-500">
            <FaBell className="text-6xl mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">No notifications</h3>
            <p>You're all caught up! Check back later for new updates.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 transition-colors ${
                  notification.read ? 'hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`font-semibold text-lg ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </p>
                        <p className="text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          {notification.time}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                            title="Mark as read"
                          >
                            <FaCheck className="text-sm" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete notification"
                        >
                          <img src={deleteIcon} alt="Delete" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-blue-600 font-medium">Unread</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications; 