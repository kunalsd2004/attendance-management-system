import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import { showLoginSuccess, showLoginError, showLogoutSuccess } from '../services/toastService';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const ActionTypes = {
  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.LOGIN_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case ActionTypes.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };

    case ActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: !!action.payload.user,
        isLoading: false,
        error: null,
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.isLoading,
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Simplified auth check for our test setup
  const checkAuthStatus = useCallback(async () => {
    const token = apiService.getToken();
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      // Don't redirect, just set loading to false
      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
      return;
    }

    try {
      // For our simplified setup, just use stored user data
      const user = JSON.parse(storedUser);
      
      // Basic token validation - check if it's a valid format
      if (token && token.startsWith('test-token-')) {
        // This is our test token format, consider it valid
        dispatch({
          type: ActionTypes.SET_USER,
          payload: { user }
        });
      } else {
        // Invalid token format, clear it but don't redirect
        console.log('Invalid token format detected, clearing authentication');
        localStorage.removeItem('user');
        apiService.setToken(null);
        dispatch({ type: ActionTypes.LOGOUT });
        // Don't redirect - let user stay on current page
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Clear invalid data but don't redirect
      localStorage.removeItem('user');
      apiService.setToken(null);
      dispatch({ type: ActionTypes.LOGOUT });
      // Don't redirect - let user stay on current page
    }
  }, []);

  // Check if user is already authenticated on app start
  useEffect(() => {
    // Clear any invalid tokens first
    const token = localStorage.getItem('accessToken');
    if (token && !token.startsWith('test-token-')) {
      console.log('Clearing invalid token on app start');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
    
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = useCallback(async (credentials) => {
    dispatch({ type: ActionTypes.LOGIN_REQUEST });

    try {
      const loginData = await apiService.login(credentials);
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(loginData.user));
      
      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: { user: loginData.user }
      });

      showLoginSuccess();
      return { success: true, user: loginData.user };
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      
      dispatch({
        type: ActionTypes.LOGIN_FAILURE,
        payload: { error: errorMessage }
      });

      showLoginError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

    const logout = useCallback(async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear all stored data
    localStorage.removeItem('user');

    dispatch({ type: ActionTypes.LOGOUT });
    showLogoutSuccess();
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);

  const updateUser = useCallback((updatedUser) => {
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Update context state
    dispatch({
      type: ActionTypes.SET_USER,
      payload: { user: updatedUser }
    });
  }, []);

  // Get user role for routing decisions
  const getUserRole = useCallback(() => {
    return state.user?.role || null;
  }, [state.user?.role]);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    return state.user?.role === role;
  }, [state.user?.role]);

  // Check if user is HOD
  const isHOD = useCallback(() => {
    return state.user?.role === 'hod';
  }, [state.user?.role]);

  // Check if user is Faculty
  const isFaculty = useCallback(() => {
    return state.user?.role === 'faculty';
  }, [state.user?.role]);

  // Check if user is Admin
  const isAdmin = useCallback(() => {
    return state.user?.role === 'admin';
  }, [state.user?.role]);

  // Check if user is Principal
  const isPrincipal = useCallback(() => {
    return state.user?.role === 'principal';
  }, [state.user?.role]);

  // Get dashboard path based on user role
  const getDashboardPath = useCallback(() => {
    if (!state.user) return '/';
    
    switch (state.user.role) {
      case 'hod':
        return '/dashboard-hod';
      case 'faculty':
        return '/dashboard';
      case 'admin':
        return '/dashboard-admin';
      case 'principal':
        return '/dashboard-principal'; // Principal has its own dashboard
      default:
        return '/dashboard';
    }
  }, [state.user?.role]);

  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    login,
    logout,
    clearError,
    checkAuthStatus,
    updateUser,

    // Utility functions
    getUserRole,
    hasRole,
    isHOD,
    isFaculty,
    isAdmin,
    isPrincipal,
    getDashboardPath,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 