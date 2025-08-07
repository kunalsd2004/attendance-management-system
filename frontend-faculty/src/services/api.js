// API base configuration
const API_BASE_URL = '/api'; // Vite proxy will redirect to http://localhost:5000

// API service class
import { showNetworkError, showUnauthorized, showServerError } from './toastService';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('accessToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  // Get authentication token
  getToken() {
    return this.token || localStorage.getItem('accessToken');
  }

  // Make HTTP request with common configuration
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for refresh token
      ...options,
    };

    // Add authorization header if token exists and is valid
    const token = this.getToken();
    if (token && token.startsWith('test-token-')) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Convert body to JSON string if it's an object
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Handle 401 errors (token expired)
        if (response.status === 401 && token) {
          // Try to refresh token
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry original request with new token
            config.headers.Authorization = `Bearer ${this.getToken()}`;
            const retryResponse = await fetch(url, config);
            if (retryResponse.ok) {
              return retryResponse.json();
            }
          }
          // If refresh failed, clear token and don't redirect to prevent loops
          console.log('Authentication failed, clearing token');
          this.setToken(null);
          localStorage.removeItem('user');
          return Promise.reject(new Error('Authentication failed'));
        }

        // Handle 404 errors (endpoint not found)
        if (response.status === 404) {
          console.log('Endpoint not found:', url);
          return Promise.reject(new Error('Endpoint not found'));
        }

        // Show appropriate error toast based on status
        if (response.status >= 500) {
          showServerError();
        } else if (response.status === 401) {
          // Don't show unauthorized toast for every 401, it's too noisy
          // Only log it for debugging
          console.log('Unauthorized request:', url);
        } else {
          showNetworkError();
        }

        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      showNetworkError();
      throw error;
    }
  }

  // Authentication methods
  async login(credentials) {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: credentials,
      });

      if (response.success && response.data.accessToken) {
        this.setToken(response.data.accessToken);
        return response.data;
      }

      throw new Error(response.message || 'Login failed');
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear token regardless of API call success
      this.setToken(null);
      localStorage.removeItem('user');
    }
  }

  async refreshToken() {
    try {
      const response = await this.request('/auth/refresh-token', {
        method: 'POST',
      });

      if (response.success && response.data.accessToken) {
        this.setToken(response.data.accessToken);
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  async getCurrentUser() {
    try {
      const response = await this.request('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user failed:', error);
      throw error;
    }
  }

  // User methods
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(profileData) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: profileData,
    });
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: profileData,
    });
  }

  async changePassword(passwordData) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: passwordData,
    });
  }

  async fixAllUserPasswords(defaultPassword = 'password123') {
    return this.request('/users/fix-passwords', {
      method: 'POST',
      body: { defaultPassword },
    });
  }

  async getUserLeaveBalances() {
    return this.request('/users/leave-balances');
  }

  // Leave methods
  async getLeaveTypes() {
    return this.request('/leaves/types');
  }

  async updateLeaveType(id, leaveTypeData) {
    return this.request(`/leaves/types/${id}`, {
      method: 'PUT',
      body: leaveTypeData,
    });
  }

  async getLeaveBalance(year, userId) {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (userId) params.append('userId', userId);
    const queryString = params.toString();
    return this.request(`/leaves/balance${queryString ? `?${queryString}` : ''}`);
  }

  async resetLeaveBalances(userId, year) {
    return this.request('/leaves/reset-balances', {
      method: 'POST',
      body: { userId, year },
    });
  }

  async getLeaves(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/leaves${queryString ? `?${queryString}` : ''}`);
  }

  async createLeave(leaveData) {
    return this.request('/leaves', {
      method: 'POST',
      body: leaveData,
    });
  }

  async createLeaveWithDocument(formData) {
    try {
      const url = `${this.baseURL}/leaves`;
      const token = this.getToken();
      
      // Check if token is valid
      if (!token || !token.startsWith('test-token-')) {
        throw new Error('Invalid token');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 errors (token expired)
        if (response.status === 401) {
          throw new Error('Invalid token');
        }

        // Handle other errors
        throw new Error(data.message || 'Leave application failed');
      }

      return data;
    } catch (error) {
      console.error('Leave application with document failed:', error);
      throw error;
    }
  }

  async getLeaveById(id) {
    return this.request(`/leaves/${id}`);
  }

  async updateLeave(id, leaveData) {
    return this.request(`/leaves/${id}`, {
      method: 'PUT',
      body: leaveData,
    });
  }

  async getPendingLeaves(approverId = null) {
    const params = approverId ? `?approverId=${approverId}` : '';
    return this.request(`/leaves/pending${params}`);
  }

  async processLeaveApproval(leaveId, approvalData) {
    return this.request(`/leaves/${leaveId}/process`, {
      method: 'PUT',
      body: approvalData,
    });
  }

  async deleteLeave(id, adminId = null) {
    const endpoint = adminId ? `/leaves/${id}/admin-delete` : `/leaves/${id}`;
    const body = adminId ? { adminId } : {};
    
    return this.request(endpoint, {
      method: 'DELETE',
      body: Object.keys(body).length > 0 ? body : undefined,
    });
  }

  async approveLeave(id, approvalData) {
    return this.request(`/leaves/${id}/approve`, {
      method: 'PUT',
      body: approvalData,
    });
  }

  async rejectLeave(id, rejectionData) {
    return this.request(`/leaves/${id}/reject`, {
      method: 'PUT',
      body: rejectionData,
    });
  }

  async getPendingApprovals() {
    return this.request('/leaves/pending/approvals');
  }

  async getDepartmentLeaves() {
    return this.request('/leaves/department/all');
  }

  async getLeaveReports(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/leaves/reports/summary${queryString ? `?${queryString}` : ''}`);
  }

  // Dashboard methods
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getRecentActivity() {
    return this.request('/dashboard/recent-activity');
  }

  async getTeamLeaves() {
    return this.request('/dashboard/team-leaves');
  }

  async getUpcomingHolidays() {
    return this.request('/dashboard/upcoming-holidays');
  }

  // Calendar methods
  async getHolidays(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/calendar/holidays${queryString ? `?${queryString}` : ''}`);
  }

  async getCalendarLeaves(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/calendar/leaves${queryString ? `?${queryString}` : ''}`);
  }

  async getAcademicCalendar() {
    return this.request('/calendar/academic-calendar');
  }

  // New calendar upload and fetch methods
  async uploadCalendar(calendarData) {
    try {
      const url = `${this.baseURL}/calendar/upload`;
      const token = this.getToken();
      
      // Check if token is valid
      if (!token || !token.startsWith('test-token-')) {
        throw new Error('Invalid token');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calendarData),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 errors (token expired)
        if (response.status === 401) {
          throw new Error('Invalid token');
        }

        // Handle other errors
        throw new Error(data.message || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('Calendar upload failed:', error);
      throw error;
    }
  }

  async getCalendar(year, semester) {
    return this.request(`/calendar/${year}/${semester}`);
  }

  async getCurrentCalendar() {
    return this.request('/calendar/current');
  }

  async getCalendarSettings() {
    return this.request('/calendar/settings');
  }

  async saveCalendarSettings(settings) {
    return this.request('/calendar/settings', {
      method: 'POST',
      body: settings
    });
  }

  // User Management APIs
  async getUsers() {
    return this.request('/users');
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: userData
    });
  }

  async getUserById(id) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: userData
    });
  }

  async updateUserByAdmin(id, userData) {
    return this.request(`/users/${id}/admin`, {
      method: 'PUT',
      body: userData
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  // Fetch all departments
  async getDepartments() {
    return this.request('/departments');
  }

  // Fetch leave balance summary for all users (optionally filtered)
  async getLeaveBalanceSummary(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/leaves/balance-summary${query ? `?${query}` : ''}`);
  }

  // Allocate leave balance to a specific user
  async allocateLeaveBalance(data) {
    return this.request('/leaves/allocate-balance', {
      method: 'POST',
      body: data
    });
  }

  // Update multiple leave balances for a single user
  async updateUserLeaveBalances(data) {
    return this.request('/leaves/update-user-balances', {
      method: 'POST',
      body: data
    });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService; 