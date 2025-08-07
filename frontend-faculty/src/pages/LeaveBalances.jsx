import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaCalculator, FaDownload, FaUndo, FaSave, FaTimes } from 'react-icons/fa';
import editRedIcon from '../assets/edit-red.svg';
import dropdownIcon from '../assets/dropdown.svg';
import apiService from '../services/api';

const LeaveBalances = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editBalances, setEditBalances] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch departments
      const deptRes = await apiService.getDepartments();
      if (deptRes.success) {
        setDepartments([{ _id: 'all', name: 'All Departments', code: 'ALL' }, ...deptRes.data]);
      } else {
        setDepartments([{ _id: 'all', name: 'All Departments', code: 'ALL' }]);
      }
      // Fetch users
      const userRes = await apiService.getUsers();
      if (userRes.success) {
        setUsers([{ _id: 'all', sdrn: 'ALL', profile: { firstName: 'All', lastName: 'Users' }, department: 'all' }, ...userRes.data]);
      } else {
        setUsers([{ _id: 'all', sdrn: 'ALL', profile: { firstName: 'All', lastName: 'Users' }, department: 'all' }]);
      }
      // Fetch leave balances
      const lbRes = await apiService.getLeaveBalanceSummary();
      console.log('Leave balance response:', lbRes);
      if (lbRes.success) {
        console.log('Leave balances data:', lbRes.data.users);
        setLeaveBalances(lbRes.data.users);
      } else {
        console.log('Leave balances error:', lbRes.message);
        setLeaveBalances([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch leave balances data');
    }
    setLoading(false);
  };

  // Leave type colors from main layout
  const leaveTypeColors = {
    casualLeave: '#f29222',
    medicalLeave: '#a1c65d',
    vacationLeave: '#fac723',
    compensatoryOff: '#0cb2af',
    onDutyLeave: '#e95e50',
    specialLeave: '#936fac'
  };

  // Filter balances based on selected department and user
  const filteredBalances = leaveBalances.filter(balance => {
    // Find the user to get their role and department
    const user = users.find(u => u._id === balance.userId);
    
    // Exclude admin users from the table
    if (user?.role === 'admin') {
      return false;
    }
    
    // Department filtering
    let departmentMatch = false;
    if (selectedDepartment === 'all') {
      departmentMatch = true;
    } else {
      const userDepartmentId = user?.profile?.department?._id || user?.profile?.department;
      departmentMatch = userDepartmentId === selectedDepartment;
    }
    
    // User filtering
    const userMatch = selectedUser === 'all' || balance.userId === selectedUser;
    
    return departmentMatch && userMatch;
  });

  // Transform backend data to frontend format
  const transformBalances = (user) => {
    try {
      const transformed = {
        id: user.userId,
        employeeName: user.name,
        sdrn: user.sdrn,
        department: user.department,
        role: user.role,
        casualLeave: { allocated: 0, used: 0, remaining: 0 },
        medicalLeave: { allocated: 0, used: 0, remaining: 0 },
        vacationLeave: { allocated: 0, used: 0, remaining: 0 },
        compensatoryOff: { allocated: 0, used: 0, remaining: 0 },
        onDutyLeave: { allocated: 0, used: 0, remaining: 0 },
        specialLeave: { allocated: 0, used: 0, remaining: 0 }
      };

      // Map backend balances to frontend format
      if (user.balances && Array.isArray(user.balances)) {
        user.balances.forEach(balance => {
          const leaveTypeName = balance.leaveType?.toLowerCase() || '';
          let mappedKey = null;
          
          // Map different possible leave type names
          if (leaveTypeName.includes('casual')) {
            mappedKey = 'casualLeave';
          } else if (leaveTypeName.includes('medical')) {
            mappedKey = 'medicalLeave';
          } else if (leaveTypeName.includes('vacation')) {
            mappedKey = 'vacationLeave';
          } else if (leaveTypeName.includes('compensatory') || leaveTypeName.includes('comp off')) {
            mappedKey = 'compensatoryOff';
          } else if (leaveTypeName.includes('on duty') || leaveTypeName.includes('on-duty')) {
            mappedKey = 'onDutyLeave';
          } else if (leaveTypeName.includes('special')) {
            mappedKey = 'specialLeave';
          }
          
          if (mappedKey && transformed[mappedKey]) {
            transformed[mappedKey] = {
              allocated: balance.allocated || 0,
              used: balance.used || 0,
              remaining: balance.remaining || 0
            };
          }
        });
      }

      return transformed;
    } catch (error) {
      console.error('Error transforming balance data:', error, user);
      return {
        id: user.userId || 'unknown',
        employeeName: user.name || 'Unknown',
        sdrn: user.sdrn || 'Unknown',
        department: user.department || 'Unknown',
        role: user.role || 'unknown',
        casualLeave: { allocated: 0, used: 0, remaining: 0 },
        medicalLeave: { allocated: 0, used: 0, remaining: 0 },
        vacationLeave: { allocated: 0, used: 0, remaining: 0 },
        compensatoryOff: { allocated: 0, used: 0, remaining: 0 },
        onDutyLeave: { allocated: 0, used: 0, remaining: 0 },
        specialLeave: { allocated: 0, used: 0, remaining: 0 }
      };
    }
  };

  // Sort function to order by role hierarchy: principal, hod, faculty
  const sortByRoleHierarchy = (a, b) => {
    const roleOrder = {
      'principal': 1,
      'hod': 2,
      'faculty': 3,
      'admin': 4
    };
    
    const aOrder = roleOrder[a.role] || 999;
    const bOrder = roleOrder[b.role] || 999;
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    // If same role, sort by name
    return a.employeeName.localeCompare(b.employeeName);
  };

  const transformedBalances = filteredBalances.map(transformBalances).sort(sortByRoleHierarchy);

  // Handle opening edit modal
  const handleEditClick = (balance) => {
    setSelectedEmployee(balance);
    setEditBalances({
      casualLeave: { ...balance.casualLeave },
      medicalLeave: { ...balance.medicalLeave },
      vacationLeave: { ...balance.vacationLeave },
      compensatoryOff: { ...balance.compensatoryOff },
      onDutyLeave: { ...balance.onDutyLeave },
      specialLeave: { ...balance.specialLeave }
    });
    setIsEditModalOpen(true);
  };

  // Handle balance input changes
  const handleBalanceChange = (leaveType, field, value) => {
    const numValue = parseInt(value) || 0;
    setEditBalances(prev => ({
      ...prev,
      [leaveType]: {
        ...prev[leaveType],
        [field]: numValue
      }
    }));
  };

  // Handle saving changes
  const handleSaveChanges = async () => {
    if (!selectedEmployee) return;
    
    setSaving(true);
    try {
      // Prepare the data for backend
      const balanceUpdates = Object.entries(editBalances).map(([leaveType, balance]) => ({
        leaveType: leaveType.replace(/([A-Z])/g, ' $1').trim(), // Convert camelCase to space-separated
        allocated: balance.allocated,
        used: balance.used,
        remaining: balance.remaining
      }));

      // Call backend API to update leave balances
      const response = await apiService.updateUserLeaveBalances({
        userId: selectedEmployee.id,
        balances: balanceUpdates,
        year: new Date().getFullYear()
      });

      if (response.success) {
        toast.success('Leave balances updated successfully');
        setIsEditModalOpen(false);
        setSelectedEmployee(null);
        setEditBalances({});
        // Refresh the data
        fetchAllData();
      } else {
        toast.error(response.message || 'Failed to update leave balances');
      }
    } catch (error) {
      console.error('Error updating leave balances:', error);
      toast.error('Failed to update leave balances');
    }
    setSaving(false);
  };

  // Handle closing edit modal
  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedEmployee(null);
    setEditBalances({});
  };

  // Get filtered users based on selected department
  const getFilteredUsers = () => {
    if (selectedDepartment === 'all') {
      return users.filter(user => user._id !== 'all');
    }
    return users.filter(user => {
      if (user._id === 'all') return false;
      
      // Check if user has a department assigned
      const userDepartmentId = user.profile?.department?._id || user.profile?.department;
      
      // If no department assigned, only show for "all" selection
      if (!userDepartmentId) {
        return selectedDepartment === 'all';
      }
      
      // Match department ID
      return userDepartmentId === selectedDepartment;
    });
  };

  // Get selected department display name
  const getSelectedDepartmentName = () => {
    const dept = departments.find(d => d._id === selectedDepartment);
    return dept ? dept.name : 'All Departments';
  };

  // Get selected user display name
  const getSelectedUserName = () => {
    const user = users.find(u => u._id === selectedUser);
    return user ? `${user.profile.firstName} ${user.profile.lastName} (${user.sdrn})` : 'All Users';
  };

  if (loading) {
    return <div className="p-4">Loading leave balances...</div>;
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-[#8C001A] text-xl">
              <FaCalculator />
            </div>
            <h1 className="text-3xl font-bold text-[#1e1e1e]">Manage Leave Balances</h1>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-6">
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
                          setSelectedUser('all'); // Reset user selection when department changes
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

            {/* User Dropdown */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">User:</label>
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
                    minWidth: '350px'
                  }}
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <span style={{
                    flex: 1,
                    color: '#333',
                    fontWeight: '500',
                  }}>
                    {getSelectedUserName()}
                  </span>
                  <img src={dropdownIcon} alt="Dropdown" style={{ marginLeft: 'auto', height: '1.2vh', flexShrink: 0 }} />
                </div>
                {userDropdownOpen && (
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
                    {getFilteredUsers().map(user => (
                      <div
                        key={user._id}
                                                 style={{
                           padding: '1.2vh 1.2vw',
                           cursor: 'pointer',
                           background: selectedUser === user._id ? '#f5f5f5' : '#fff',
                           fontSize: '0.9vw',
                           borderBottom: user._id !== getFilteredUsers()[getFilteredUsers().length - 1]._id ? '1px solid #f0f0f0' : 'none',
                         }}
                        onClick={() => {
                          setSelectedUser(user._id);
                          setUserDropdownOpen(false);
                        }}
                      >
                        <span style={{
                          flex: 1,
                          color: '#333',
                          fontWeight: selectedUser === user._id ? '600' : '400',
                        }}>
                          {user.profile.firstName} {user.profile.lastName} ({user.sdrn})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: leaveTypeColors.casualLeave }}></div>
            <div className="text-3xl font-bold" style={{ color: leaveTypeColors.casualLeave }}>
              {transformedBalances.reduce((sum, balance) => sum + balance.casualLeave.remaining, 0)}
            </div>
            <div className="text-sm text-gray-600 mb-3">Casual Leave</div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300" 
                style={{ 
                  backgroundColor: leaveTypeColors.casualLeave,
                  width: `${(transformedBalances.reduce((sum, balance) => sum + balance.casualLeave.remaining, 0) / 
                    Math.max(1, transformedBalances.reduce((sum, balance) => sum + balance.casualLeave.allocated, 0))) * 100}%`
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {transformedBalances.reduce((sum, balance) => sum + balance.casualLeave.allocated, 0)} total allocated
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: leaveTypeColors.medicalLeave }}></div>
            <div className="text-3xl font-bold" style={{ color: leaveTypeColors.medicalLeave }}>
              {transformedBalances.reduce((sum, balance) => sum + balance.medicalLeave.remaining, 0)}
            </div>
            <div className="text-sm text-gray-600 mb-3">Medical Leave</div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300" 
                style={{ 
                  backgroundColor: leaveTypeColors.medicalLeave,
                  width: `${(transformedBalances.reduce((sum, balance) => sum + balance.medicalLeave.remaining, 0) / 
                    Math.max(1, transformedBalances.reduce((sum, balance) => sum + balance.medicalLeave.allocated, 0))) * 100}%`
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {transformedBalances.reduce((sum, balance) => sum + balance.medicalLeave.allocated, 0)} total allocated
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: leaveTypeColors.vacationLeave }}></div>
            <div className="text-3xl font-bold" style={{ color: leaveTypeColors.vacationLeave }}>
              {transformedBalances.reduce((sum, balance) => sum + balance.vacationLeave.remaining, 0)}
            </div>
            <div className="text-sm text-gray-600 mb-3">Vacation Leave</div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300" 
                style={{ 
                  backgroundColor: leaveTypeColors.vacationLeave,
                  width: `${(transformedBalances.reduce((sum, balance) => sum + balance.vacationLeave.remaining, 0) / 
                    Math.max(1, transformedBalances.reduce((sum, balance) => sum + balance.vacationLeave.allocated, 0))) * 100}%`
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {transformedBalances.reduce((sum, balance) => sum + balance.vacationLeave.allocated, 0)} total allocated
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: leaveTypeColors.compensatoryOff }}></div>
            <div className="text-3xl font-bold" style={{ color: leaveTypeColors.compensatoryOff }}>
              {transformedBalances.reduce((sum, balance) => sum + balance.compensatoryOff.remaining, 0)}
            </div>
            <div className="text-sm text-gray-600 mb-3">Compensatory Off</div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300" 
                style={{ 
                  backgroundColor: leaveTypeColors.compensatoryOff,
                  width: `${(transformedBalances.reduce((sum, balance) => sum + balance.compensatoryOff.remaining, 0) / 
                    Math.max(1, transformedBalances.reduce((sum, balance) => sum + balance.compensatoryOff.allocated, 0))) * 100}%`
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {transformedBalances.reduce((sum, balance) => sum + balance.compensatoryOff.allocated, 0)} total allocated
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: leaveTypeColors.onDutyLeave }}></div>
            <div className="text-3xl font-bold" style={{ color: leaveTypeColors.onDutyLeave }}>
                {transformedBalances.reduce((sum, balance) => sum + balance.onDutyLeave.remaining, 0)}
            </div>
            <div className="text-sm text-gray-600 mb-3">On Duty Leave</div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300" 
                style={{ 
                  backgroundColor: leaveTypeColors.onDutyLeave,
                width: `${(transformedBalances.reduce((sum, balance) => sum + balance.onDutyLeave.remaining, 0) /
                Math.max(1, transformedBalances.reduce((sum, balance) => sum + balance.onDutyLeave.allocated, 0))) * 100}%`
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {transformedBalances.reduce((sum, balance) => sum + balance.onDutyLeave.allocated, 0)} total allocated
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: leaveTypeColors.specialLeave }}></div>
            <div className="text-3xl font-bold" style={{ color: leaveTypeColors.specialLeave }}>
              {transformedBalances.reduce((sum, balance) => sum + balance.specialLeave.remaining, 0)}
            </div>
            <div className="text-sm text-gray-600 mb-3">Special Leave</div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300" 
                style={{ 
                  backgroundColor: leaveTypeColors.specialLeave,
                  width: `${(transformedBalances.reduce((sum, balance) => sum + balance.specialLeave.remaining, 0) / 
                    Math.max(1, transformedBalances.reduce((sum, balance) => sum + balance.specialLeave.allocated, 0))) * 100}%`
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {transformedBalances.reduce((sum, balance) => sum + balance.specialLeave.allocated, 0)} total allocated
            </div>
          </div>
        </div>

        {/* Balances Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Casual Leave
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Medical Leave
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Vacation Leave
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Compensatory Off
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    On Duty Leave
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Special Leave
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transformedBalances.map((balance) => (
                  <tr key={balance.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {balance.employeeName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {balance.sdrn}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{balance.department}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{balance.casualLeave.remaining}</span>
                        <span className="text-gray-500">/ {balance.casualLeave.allocated}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{balance.medicalLeave.remaining}</span>
                        <span className="text-gray-500">/ {balance.medicalLeave.allocated}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{balance.vacationLeave.remaining}</span>
                        <span className="text-gray-500">/ {balance.vacationLeave.allocated}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{balance.compensatoryOff.remaining}</span>
                        <span className="text-gray-500">/ {balance.compensatoryOff.allocated}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{balance.onDutyLeave.remaining}</span>
<span className="text-gray-500">/ {balance.onDutyLeave.allocated}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{balance.specialLeave.remaining}</span>
                        <span className="text-gray-500">/ {balance.specialLeave.allocated}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEditClick(balance)}
                        className="text-[#8C001A] hover:text-[#6a0015] flex items-center gap-1 transition-colors duration-200"
                      >
                        <img src={editRedIcon} alt="Edit" className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Edit Leave Balances - {selectedEmployee.employeeName}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                SDRN: {selectedEmployee.sdrn} | Department: {selectedEmployee.department}
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Casual Leave */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: leaveTypeColors.casualLeave }}></div>
                    Casual Leave
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allocated</label>
                      <input
                        type="number"
                        value={editBalances.casualLeave?.allocated || 0}
                        onChange={(e) => handleBalanceChange('casualLeave', 'allocated', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Used</label>
                      <input
                        type="number"
                        value={editBalances.casualLeave?.used || 0}
                        onChange={(e) => handleBalanceChange('casualLeave', 'used', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remaining</label>
                      <input
                        type="number"
                        value={editBalances.casualLeave?.remaining || 0}
                        onChange={(e) => handleBalanceChange('casualLeave', 'remaining', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Leave */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: leaveTypeColors.medicalLeave }}></div>
                    Medical Leave
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allocated</label>
                      <input
                        type="number"
                        value={editBalances.medicalLeave?.allocated || 0}
                        onChange={(e) => handleBalanceChange('medicalLeave', 'allocated', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Used</label>
                      <input
                        type="number"
                        value={editBalances.medicalLeave?.used || 0}
                        onChange={(e) => handleBalanceChange('medicalLeave', 'used', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remaining</label>
                      <input
                        type="number"
                        value={editBalances.medicalLeave?.remaining || 0}
                        onChange={(e) => handleBalanceChange('medicalLeave', 'remaining', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Vacation Leave */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: leaveTypeColors.vacationLeave }}></div>
                    Vacation Leave
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allocated</label>
                      <input
                        type="number"
                        value={editBalances.vacationLeave?.allocated || 0}
                        onChange={(e) => handleBalanceChange('vacationLeave', 'allocated', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Used</label>
                      <input
                        type="number"
                        value={editBalances.vacationLeave?.used || 0}
                        onChange={(e) => handleBalanceChange('vacationLeave', 'used', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remaining</label>
                      <input
                        type="number"
                        value={editBalances.vacationLeave?.remaining || 0}
                        onChange={(e) => handleBalanceChange('vacationLeave', 'remaining', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Compensatory Off */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: leaveTypeColors.compensatoryOff }}></div>
                    Compensatory Off
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allocated</label>
                      <input
                        type="number"
                        value={editBalances.compensatoryOff?.allocated || 0}
                        onChange={(e) => handleBalanceChange('compensatoryOff', 'allocated', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Used</label>
                      <input
                        type="number"
                        value={editBalances.compensatoryOff?.used || 0}
                        onChange={(e) => handleBalanceChange('compensatoryOff', 'used', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remaining</label>
                      <input
                        type="number"
                        value={editBalances.compensatoryOff?.remaining || 0}
                        onChange={(e) => handleBalanceChange('compensatoryOff', 'remaining', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* On Duty Leave */}  
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: leaveTypeColors.onDutyLeave }}></div>
                    On Duty Leave
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allocated</label>
                      <input
                        type="number"
                        value={editBalances.onDutyLeave?.allocated || 0}
onChange={(e) => handleBalanceChange('onDutyLeave', 'allocated', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Used</label>
                      <input
                        type="number"
                        value={editBalances.onDutyLeave?.used || 0}
onChange={(e) => handleBalanceChange('onDutyLeave', 'used', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remaining</label>
                      <input
                        type="number"
                        value={editBalances.onDutyLeave?.remaining || 0}
onChange={(e) => handleBalanceChange('onDutyLeave', 'remaining', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Special Leave */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: leaveTypeColors.specialLeave }}></div>
                    Special Leave
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allocated</label>
                      <input
                        type="number"
                        value={editBalances.specialLeave?.allocated || 0}
                        onChange={(e) => handleBalanceChange('specialLeave', 'allocated', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Used</label>
                      <input
                        type="number"
                        value={editBalances.specialLeave?.used || 0}
                        onChange={(e) => handleBalanceChange('specialLeave', 'used', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remaining</label>
                      <input
                        type="number"
                        value={editBalances.specialLeave?.remaining || 0}
                        onChange={(e) => handleBalanceChange('specialLeave', 'remaining', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="px-4 py-2 bg-[#8C001A] text-white rounded-lg hover:bg-[#6a0015] transition-colors font-medium flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="text-sm" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveBalances; 