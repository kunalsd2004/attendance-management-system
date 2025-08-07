import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaEye, FaFilter } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { showSuccess, showError } from '../services/toastService';
import dropdownIcon from '../assets/dropdown.svg';
import deleteIcon from '../assets/delete.svg';
import exportExcelIcon from '../assets/export-excel.svg';
import * as XLSX from 'xlsx';

const LeaveRequests = () => {
  const { user, isAdmin, isPrincipal } = useAuth();
  const [filter, setFilter] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);
  
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const departmentDropdown = event.target.closest('[data-dropdown="department"]');
      const yearDropdown = event.target.closest('[data-dropdown="year"]');
      
      if (!departmentDropdown && !yearDropdown) {
        setDepartmentDropdownOpen(false);
        setYearDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Refetch data when year changes
  useEffect(() => {
    if (leaveRequests.length > 0) {
      // Data is already loaded, just update the filter
      // The filteredRequests will automatically update due to the filter logic
    }
  }, [selectedYear]);

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
      // Pass admin ID for permanent deletion - only admin can delete leave requests
      const response = await apiService.deleteLeave(selectedLeaveId, user?._id);
      
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

  const handleExportData = async () => {
    try {
      setExporting(true);
      
      // Get filtered data for the selected year and department
      const yearFilteredRequests = leaveRequests.filter(request => {
        const requestYear = new Date(request.appliedAt).getFullYear();
        const yearMatch = requestYear === selectedYear;
        
        // For department filtering, we need to check the applicant's department
        let departmentMatch = true;
        if (selectedDepartment !== 'all') {
          const selectedDeptName = departments.find(d => d._id === selectedDepartment)?.name;
          const applicantDeptName = request.applicant?.profile?.department?.name;
          
          // Debug logging to help identify the issue
          console.log('Department filtering:', {
            selectedDeptName,
            applicantDeptName,
            selectedDepartment,
            match: applicantDeptName === selectedDeptName
          });
          
          // Try exact match first, then case-insensitive match
          departmentMatch = applicantDeptName === selectedDeptName || 
                          (applicantDeptName && selectedDeptName && 
                           applicantDeptName.toLowerCase() === selectedDeptName.toLowerCase());
        }
        
        return yearMatch && departmentMatch;
      });

      console.log('Filtered requests for export:', {
        totalRequests: leaveRequests.length,
        filteredRequests: yearFilteredRequests.length,
        selectedYear,
        selectedDepartment,
        departments: departments.map(d => ({ id: d._id, name: d.name }))
      });

      // Check if we have data to export
      if (yearFilteredRequests.length === 0) {
        showError('No data found for the selected department and year');
        return;
      }

      // Process data for export
      const exportData = processDataForExport(yearFilteredRequests);
      
      console.log('Export data processed:', exportData.length, 'faculty records');
      
      // Check if we have processed data
      if (exportData.length === 0) {
        showError('No data available for export');
        return;
      }
      
      // Generate filename with department info
      const selectedDeptName = selectedDepartment !== 'all' 
        ? departments.find(d => d._id === selectedDepartment)?.name 
        : 'All_Departments';
      
      // Generate and download Excel file
      generateExcelFile(exportData, selectedYear, selectedDeptName);
      
      showSuccess('Data exported successfully!');
    } catch (err) {
      console.error('Error exporting data:', err);
      showError('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const processDataForExport = (requests) => {
    // Group by faculty
    const facultyData = {};
    
    requests.forEach(request => {
      const facultyId = request.applicant?._id;
      const facultyName = `${request.applicant?.profile?.firstName || ''} ${request.applicant?.profile?.lastName || ''}`.trim();
      const department = request.applicant?.profile?.department?.name || 'Unknown';
      const sdrn = request.applicant?.sdrn || 'Unknown';
      
      if (!facultyData[facultyId]) {
        facultyData[facultyId] = {
          facultyId,
          facultyName,
          sdrn,
          department,
          totalLeaves: 0,
          approvedByHOD: 0,
          approvedByPrincipal: 0,
          rejected: 0,
          pending: 0,
          leaveTypes: {}
        };
      }
      
      // Count total leaves
      facultyData[facultyId].totalLeaves++;
      
      // Count by status
      if (request.status === 'approved') {
        facultyData[facultyId].approvedByPrincipal++;
      } else if (request.status === 'rejected') {
        facultyData[facultyId].rejected++;
      } else if (request.status === 'pending') {
        facultyData[facultyId].pending++;
      }
      
      // Count HOD approvals
      const hodApproval = request.approvals?.find(approval => 
        approval.approver?.role === 'hod' && approval.status === 'approved'
      );
      if (hodApproval) {
        facultyData[facultyId].approvedByHOD++;
      }
      
      // Count by leave type
      const leaveType = request.leaveType?.name || 'Unknown';
      if (!facultyData[facultyId].leaveTypes[leaveType]) {
        facultyData[facultyId].leaveTypes[leaveType] = 0;
      }
      facultyData[facultyId].leaveTypes[leaveType]++;
    });
    
    return Object.values(facultyData);
  };

  const generateExcelFile = (data, year, departmentName) => {
    try {
      console.log('Generating Excel file with:', {
        dataLength: data.length,
        year,
        departmentName
      });
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Prepare data for Excel
      const excelData = data.map(faculty => ({
        'SDRN': faculty.sdrn,
        'Faculty Name': faculty.facultyName,
        'Department': faculty.department,
        'Total Leaves Applied': faculty.totalLeaves,
        'Approved by HOD': faculty.approvedByHOD,
        'Approved by Principal': faculty.approvedByPrincipal,
        'Rejected': faculty.rejected,
        'Pending': faculty.pending,
        'Casual Leaves': faculty.leaveTypes['Casual'] || 0,
        'Medical Leaves': faculty.leaveTypes['Medical'] || 0,
        'Vacation Leaves': faculty.leaveTypes['Vacation'] || 0,
        'Compensatory Off': faculty.leaveTypes['CompensatoryOff'] || 0,
        'Special Leaves': faculty.leaveTypes['Special'] || 0,
        'Other Leaves': Object.values(faculty.leaveTypes).reduce((sum, count) => {
          const leaveTypeNames = ['Casual', 'Medical', 'Vacation', 'CompensatoryOff', 'Special'];
          return sum + (leaveTypeNames.includes(Object.keys(faculty.leaveTypes).find(key => faculty.leaveTypes[key] === count)) ? 0 : count);
        }, 0)
      }));
      
      console.log('Excel data prepared:', excelData.length, 'rows');
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const columnWidths = [
        { wch: 15 }, // SDRN
        { wch: 20 }, // Faculty Name
        { wch: 15 }, // Department
        { wch: 18 }, // Total Leaves Applied
        { wch: 15 }, // Approved by HOD
        { wch: 18 }, // Approved by Principal
        { wch: 10 }, // Rejected
        { wch: 10 }, // Pending
        { wch: 12 }, // Casual Leaves
        { wch: 12 }, // Medical Leaves
        { wch: 12 }, // Vacation Leaves
        { wch: 15 }, // Compensatory Off
        { wch: 12 }, // Special Leaves
        { wch: 12 }  // Other Leaves
      ];
      worksheet['!cols'] = columnWidths;
      
      // Create sheet name with department info - limit to 31 chars for Excel
      let sheetName;
      if (departmentName === 'All_Departments') {
        sheetName = `Leave Data ${year}`;
      } else {
        // Shorten department name if needed to fit within 31 chars
        const maxDeptLength = 31 - ` Leave Data ${year}`.length;
        const shortDeptName = departmentName.length > maxDeptLength 
          ? departmentName.substring(0, maxDeptLength - 3) + '...'
          : departmentName;
        sheetName = `${shortDeptName} Leave Data ${year}`;
      }
      
      console.log('Sheet name:', sheetName);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Generate filename with department info
      const sanitizedDeptName = departmentName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Leave_Data_${sanitizedDeptName}_${year}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      console.log('Filename:', filename);
      
      // Download file
      XLSX.writeFile(workbook, filename);
      
      console.log('Excel file generated successfully');
    } catch (error) {
      console.error('Error generating Excel file:', error);
      throw error;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border border-red-200';
      // Removed 'cancelled' case since we're filtering it out
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
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

  // Filter requests based on status, department, and year - updated for real data structure
  const filteredRequests = leaveRequests.filter(request => {
    const statusMatch = filter === 'all' || request.status === filter;
    
    // For department filtering, we need to check the applicant's department
    let departmentMatch = true;
    if (selectedDepartment !== 'all') {
      const selectedDeptName = departments.find(d => d._id === selectedDepartment)?.name;
      const applicantDeptName = request.applicant?.profile?.department?.name;
      departmentMatch = applicantDeptName === selectedDeptName;
    }
    
    // For year filtering
    const requestYear = new Date(request.appliedAt).getFullYear();
    const yearMatch = requestYear === selectedYear;
    
    return statusMatch && departmentMatch && yearMatch;
  });

  // Calculate statistics - used in the summary stats section below

  return (
    <div>
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
          <div className="flex flex-wrap items-center justify-between mb-6">
            {/* Left side - Department Dropdown */}
                          <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Department:</label>
                <div className="relative" data-dropdown="department">
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

            {/* Right side - Year Dropdown and Export Button */}
            <div className="flex items-center gap-4">
              {/* Year Dropdown */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Year:</label>
                <div className="relative" data-dropdown="year">
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
                      minWidth: '120px'
                    }}
                    onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                  >
                    <span style={{
                      flex: 1,
                      color: '#333',
                      fontWeight: '500',
                    }}>
                      {selectedYear}
                    </span>
                    <img src={dropdownIcon} alt="Dropdown" style={{ marginLeft: 'auto', height: '1.2vh', flexShrink: 0 }} />
                  </div>
                  {yearDropdownOpen && (
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
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <div
                          key={year}
                          style={{
                            padding: '1.2vh 1.2vw',
                            cursor: 'pointer',
                            background: selectedYear === year ? '#f5f5f5' : '#fff',
                            fontSize: '0.9vw',
                            borderBottom: year !== new Date().getFullYear() - 4 ? '1px solid #f0f0f0' : 'none',
                          }}
                          onClick={() => {
                            setSelectedYear(year);
                            setYearDropdownOpen(false);
                          }}
                        >
                          <span style={{
                            flex: 1,
                            color: '#333',
                            fontWeight: selectedYear === year ? '600' : '400',
                          }}>
                            {year}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Export Button */}
              {isAdmin && (
                <button
                  onClick={handleExportData}
                  disabled={exporting}
                  className="flex items-center justify-center p-2"
                  title={`Export ${selectedDepartment !== 'all' ? getSelectedDepartmentName() : 'All'} Data`}
                >
                  {exporting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                  ) : (
                    <img src={exportExcelIcon} alt="Export Excel" className="w-8 h-8" />
                  )}
                </button>
              )}
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
            <div className="text-sm text-gray-600">Total Requests ({selectedYear})</div>
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
                  {(isAdmin || isPrincipal) && (
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={(isAdmin || isPrincipal) ? "7" : "6"} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8C001A]"></div>
                        <span className="ml-2 text-gray-600">Loading leave requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={(isAdmin || isPrincipal) ? "7" : "6"} className="px-6 py-8 text-center">
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
                    <td colSpan={(isAdmin || isPrincipal) ? "7" : "6"} className="px-6 py-8 text-center text-gray-500">
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
                            {request.applicant?.sdrn}
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
                      {(isAdmin || isPrincipal) && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleDeleteClick(request._id)}
                              className="text-red-800 flex items-center gap-1 transition-colors duration-200"
                            >
                              <img src={deleteIcon} alt="Delete" className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      )}
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
              Confirm Permanent Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete this leave request? This action cannot be undone and will permanently remove the request from the system.
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