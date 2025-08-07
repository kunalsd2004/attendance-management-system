import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/toast.css';

import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardHOD from './pages/DashboardHod';
import ApplyLeave from './pages/ApplyLeave';
import CalendarPage from './pages/CalendarPage';
import MyRequests from './pages/MyRequests';
import ApproveLeaves from './pages/ApproveLeaves';
import Notifications from './pages/Notifications';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardPrincipal from './pages/DashboardPrincipal';
import Support from './pages/Support';
import LeaveRequests from './pages/LeaveRequests';
import LeaveBalances from './pages/LeaveBalances';
import Inbox from './pages/Inbox';
import Summary from './pages/Summary';
import Account from './pages/Account';
import Users from './pages/Users';

const Placeholder = ({ title }) => (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{title}</h1>
    </div>
);

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
        <Routes>
          {/* Public route */}
          <Route path="/" element={<Login />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            {/* Faculty Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* HOD Dashboard */}
            <Route path="/dashboard-hod" element={<DashboardHOD />} />

            {/* Admin Dashboard */}
            <Route path="/dashboard-admin" element={<DashboardAdmin />} />
            
            {/* Principal Dashboard */}
            <Route path="/dashboard-principal" element={<DashboardPrincipal />} />
            
            {/* Common routes for all roles */}
            <Route path="/calendar" element={<CalendarPage />} /> 
            <Route path="/apply-leave" element={<ApplyLeave />} />
            <Route path="/requests" element={<MyRequests />} />
            <Route path="/approve-leaves" element={<ApproveLeaves />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/support" element={<Support />} />
            <Route path="/leave-requests" element={<LeaveRequests />} />
            <Route path="/leave-balances" element={<LeaveBalances />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/account" element={<Account />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Routes>
        
        {/* Toast Container */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          closeButton={false}
        />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
