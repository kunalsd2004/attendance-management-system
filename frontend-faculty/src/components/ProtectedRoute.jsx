import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user, getDashboardPath } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Allow access to calendar page even without authentication
  if (location.pathname === '/calendar') {
    return children;
  }

  // Redirect to login if not authenticated (for other routes)
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Handle automatic redirection to appropriate dashboard
  if (user && location.pathname === '/') {
    const dashboardPath = getDashboardPath();
    return <Navigate to={dashboardPath} replace />;
  }

  // Role-based route protection
  if (user) {
    const currentPath = location.pathname;
    const userRole = user.role;

    // Redirect Admin users from other dashboards to admin dashboard
    if (userRole === 'admin' && (currentPath === '/dashboard' || currentPath === '/dashboard-hod' || currentPath === '/dashboard-principal')) {
      return <Navigate to="/dashboard-admin" replace />;
    }

    // Redirect Principal users from other dashboards to principal dashboard
    if (userRole === 'principal' && (currentPath === '/dashboard' || currentPath === '/dashboard-hod' || currentPath === '/dashboard-admin')) {
      return <Navigate to="/dashboard-principal" replace />;
    }

    // Redirect HOD users from regular dashboard to HOD dashboard
    if (userRole === 'hod' && currentPath === '/dashboard') {
      return <Navigate to="/dashboard-hod" replace />;
    }

    // Redirect Faculty users from HOD dashboard to regular dashboard
    if (userRole === 'faculty' && currentPath === '/dashboard-hod') {
      return <Navigate to="/dashboard" replace />;
    }

    // For other admin features (future implementation)
    if (userRole !== 'admin' && userRole !== 'principal' && currentPath.startsWith('/admin')) {
      const dashboardPath = getDashboardPath();
      return <Navigate to={dashboardPath} replace />;
    }
  }

  // User is authenticated and accessing allowed route
  return children;
};

export default ProtectedRoute; 