import { toast } from 'react-toastify';

// Toast configuration
const toastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
};

// Custom toast styles to match DY Patil brand
const customStyles = {
  success: {
    style: {
      background: '#f0f9ff',
      color: '#065f46',
      border: '1px solid #10b981',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: '#10b981',
      secondary: '#ffffff',
    },
  },
  error: {
    style: {
      background: '#fef2f2',
      color: '#991b1b',
      border: '1px solid #ef4444',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: '#ef4444',
      secondary: '#ffffff',
    },
  },
  warning: {
    style: {
      background: '#fffbeb',
      color: '#92400e',
      border: '1px solid #f59e0b',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: '#f59e0b',
      secondary: '#ffffff',
    },
  },
  info: {
    style: {
      background: '#eff6ff',
      color: '#1e40af',
      border: '1px solid #3b82f6',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: '#3b82f6',
      secondary: '#ffffff',
    },
  },
};

// Toast functions
export const showSuccess = (message) => {
  toast.success(message, {
    ...toastConfig,
    ...customStyles.success,
  });
};

export const showError = (message) => {
  toast.error(message, {
    ...toastConfig,
    ...customStyles.error,
  });
};

export const showWarning = (message) => {
  toast.warning(message, {
    ...toastConfig,
    ...customStyles.warning,
  });
};

export const showInfo = (message) => {
  toast.info(message, {
    ...toastConfig,
    ...customStyles.info,
  });
};

// Specific toast functions for common actions
export const showLoginSuccess = () => {
  showSuccess('Login successful! Welcome back.');
};

export const showLoginError = (error = 'Invalid credentials. Please try again.') => {
  showError(error);
};

export const showLogoutSuccess = () => {
  showInfo('You have been logged out successfully.');
};

export const showLeaveApplied = () => {
  showSuccess('Leave application submitted successfully!');
};

export const showLeaveApproved = (message = 'Leave request approved successfully!') => {
  showSuccess(message);
};

export const showLeaveRejected = () => {
  showWarning('Leave request has been rejected.');
};

export const showFormError = (message = 'Please check your input and try again.') => {
  showError(message);
};

export const showNetworkError = () => {
  showError('Network error. Please check your connection and try again.');
};

export const showUnauthorized = () => {
  showError('You are not authorized to perform this action.');
};

export const showServerError = () => {
  showError('Server error. Please try again later.');
};

export default {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showLoginSuccess,
  showLoginError,
  showLogoutSuccess,
  showLeaveApplied,
  showLeaveApproved,
  showLeaveRejected,
  showFormError,
  showNetworkError,
  showUnauthorized,
  showServerError,
}; 