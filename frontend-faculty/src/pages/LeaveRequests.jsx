import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaEye, FaTrash, FaFilter } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { showSuccess, showError } from '../services/toastService';
import dropdownIcon from '../assets/dropdown.svg';

const LeaveRequests = () => {
  const { user, isHOD, isAdmin, isPrincipal } = useAuth();
  const [filter, setFilter] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  
  // Real data state
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchLeaveRequests();
    fetchDepartments();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For Leave Requests page, get all leaves (no userId parameter)
      const response = await apiService.getLeaves({});
      
      if (response && response.success) {
        const allLeaves = response.data.leaves || [];
        // Filter out cancelled leaves on frontend as well
        const filteredLeaves = allLeaves.filter(leave => leave.status !== 'cancelled');
        setLeaveRequests(filteredLeaves);
      } else {
        throw new Error(response?.message || 'Failed to fetch leave requests');
      }
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setError(err.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      
      if (response.success) {
        const allDepartments = [
          { _id: 'all', name: 'All Departments', code: 'ALL' },
          // Backend returns data directly, not data.departments
          ...(response.data || [])
        ];
        setDepartments(allDepartments);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      // Use fallback departments if API fails
      setDepartments([{ _id: 'all', name: 'All Departments', code: 'ALL' }]);
    }
  };

  const handleDeleteClick = (leaveId) => {
    setSelectedLeaveId(leaveId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLeaveId) return;
    
    try {
      setDeleting(true);
      const response = await apiService.deleteLeave(selectedLeaveId);
      
      if (response.success) {
        // Remove the deleted leave from the list
        setLeaveRequests(prev => prev.filter(leave => leave._id !== selectedLeaveId));
        showSuccess('Leave request deleted successfully');
      } else {
        throw new Error(response.message || 'Failed to delete leave request');
      }
    } catch (err) {
      console.error('Error deleting leave:', err);
      showError(err.message || 'Failed to delete leave request');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setSelectedLeaveId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setSelectedLeaveId(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gray-200 text-gray-800';
      case 'approved': return 'bg-gray-300 text-gray-900';
      case 'rejected': return 'bg-gray-400 text-white';
      // Removed 'cancelled' case since we're filtering it out
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get selected department display name
  const getSelectedDepartmentName = () => {
    const dept = departments.find(d => d._id === selectedDepartment);
    return dept ? dept.name : 'All Departments';
  };

  // Helper function to format dates
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter requests based on status and department - updated for real data structure
  const filteredRequests = leaveRequests.filter(request => {
    const statusMatch = filter === 'all' || request.status === filter;
    
    // For department filtering, we need to check the applicant's department
    let departmentMatch = true;
    if (selectedDepartment !== 'all') {
      const selectedDeptName = departments.find(d => d._id === selectedDepartment)?.name;
      const applicantDeptName = request.applicant?.profile?.department?.name;
      departmentMatch = applicantDeptName === selectedDeptName;
    }
    
    return statusMatch && departmentMatch;
  });

  // Calculate statistics
  const totalRequests = filteredRequests.length;
  const pendingRequests = filteredRequests.filter(req => req.status === 'pending').length;
  const approvedRequests = filteredRequests.filter(req => req.status === 'approved').length;
  const rejectedRequests = filteredRequests.filter(req => req.status === 'rejected').length;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-[#8C001A] text-xl">
              <FaFileAlt />
            </div>
            <h1 className="text-3xl font-bold text-[#1e1e1e]">Leave Requests</h1>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-6 mb-6">
            {/* Department Dropdown */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Department:</label>
              <div className="relative">
                <div
                  className="custom-dropdown"
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '0.3vw',
                    padding: '1.5vh 1.2vw',
                    fontSize: '1vw',
                    background: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    userSelect: 'none',
                    height: '5vh',
                    boxSizing: 'border-box',
                    minWidth: '300px'
                  }}
                  onClick={() => setDepartmentDropdownOpen(!departmentDropdownOpen)}
                >
                  <span style={{
                    flex: 1,
                    color: '#333',
                    fontWeight: '500',
                  }}>
                    {getSelectedDepartmentName()}
                  </span>
                  <img src={dropdownIcon} alt="Dropdown" style={{ marginLeft: 'auto', height: '1.2vh', flexShrink: 0 }} />
                </div>
                {departmentDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '0.5vw',
                      zIndex: 10,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      marginTop: 2,
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}
                  >
                    {departments.map(dept => (
                      <div
                        key={dept._id}
                        style={{
                          padding: '1.2vh 1.2vw',
                          cursor: 'pointer',
                          background: selectedDepartment === dept._id ? '#f5f5f5' : '#fff',
                          fontSize: '0.9vw',
                          borderBottom: dept._id !== departments[departments.length - 1]._id ? '1px solid #f0f0f0' : 'none',
                        }}
                        onClick={() => {
                          setSelectedDepartment(dept._id);
                          setDepartmentDropdownOpen(false);
                        }}
                      >
                        <span style={{
                          flex: 1,
                          color: '#333',
                          fontWeight: selectedDepartment === dept._id ? '600' : '400',
                        }}>
                          {dept.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-[#8C001A] text-white shadow-md' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FaFilter className="text-sm" />
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending' 
                  ? 'bg-[#8C001A] text-white shadow-md' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'approved' 
                  ? 'bg-[#8C001A] text-white shadow-md' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'rejected' 
                  ? 'bg-[#8C001A] text-white shadow-md' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="text-3xl font-bold text-[#1e1e1e]">
              {filteredRequests.length}
            </div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="text-3xl font-bold text-[#1e1e1e]">
              {filteredRequests.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="text-3xl font-bold text-[#1e1e1e]">
              {filteredRequests.filter(r => r.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="text-3xl font-bold text-[#1e1e1e]">
              {filteredRequests.filter(r => r.status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Leave Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Dates
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Days
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8C001A]"></div>
                        <span className="ml-2 text-gray-600">Loading leave requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center">
                      <div className="text-red-600 font-medium">{error}</div>
                      <button 
                        onClick={fetchLeaveRequests} 
                        className="mt-2 text-[#8C001A] hover:text-[#6a0015] underline"
                      >
                        Try again
                      </button>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No leave requests found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.applicant?.profile?.firstName} {request.applicant?.profile?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.applicant?.employeeId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-medium">
                          {request.leaveType?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(request.startDate)} to {formatDate(request.endDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-medium">
                          {request.workingDays || request.totalDays} days
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {request.applicant?.profile?.department?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleDeleteClick(request._id)}
                            className="text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors duration-200"
                          >
                            <FaTrash className="text-sm" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this leave request? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 ${
                  deleting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={deleting}
              >
                {deleting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequests; 