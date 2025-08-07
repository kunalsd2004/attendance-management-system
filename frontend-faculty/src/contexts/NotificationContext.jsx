import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  // Sample notifications data - in a real app, this would come from an API
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'Leave Approved',
      message: 'Your Casual Leave request for 2 days has been approved by HOD.',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      type: 'pending',
      title: 'Leave Pending',
      message: 'Your Medical Leave request is pending approval.',
      time: '1 day ago',
      read: false
    },
    {
      id: 3,
      type: 'info',
      title: 'Department Meeting',
      message: 'Reminder: Department meeting scheduled for tomorrow at 10 AM.',
      time: '3 hours ago',
      read: true
    },
    {
      id: 4,
      type: 'success',
      title: 'Profile Updated',
      message: 'Your profile information has been successfully updated.',
      time: '1 week ago',
      read: true
    },
    {
      id: 5,
      type: 'error',
      title: 'Leave Rejected',
      message: 'Your Vacation Leave request has been rejected due to insufficient notice.',
      time: '2 days ago',
      read: true
    },
    {
      id: 6,
      type: 'info',
      title: 'System Maintenance',
      message: 'The attendance system will be under maintenance from 2 AM to 4 AM tonight.',
      time: '3 days ago',
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  }, []);

  const deleteNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
  }, []);

  const value = {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 