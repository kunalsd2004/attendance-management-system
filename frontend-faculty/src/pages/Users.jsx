import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  FaUsers,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaFilter,
  FaUserPlus,
  FaTimes
} from 'react-icons/fa';

const Users = () => {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    employeeId: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    designation: '',
    departmentId: '',
    joiningDate: '',
    role: 'faculty',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    }
  });

  const [departments, setDepartments] = useState([
    { _id: '6889176972077bb94d89e71d', name: 'Computer Science', code: 'CS' },
    { _id: '6889176972077bb94d89e71e', name: 'Information Technology', code: 'IT' },
    { _id: '6889176972077bb94d89e71f', name: 'Electronics & Communication', code: 'EC' },
    { _id: '6889176972077bb94d89e720', name: 'Mechanical Engineering', code: 'ME' },
    { _id: '6889176972077bb94d89e721', name: 'Civil Engineering', code: 'CE' }
  ]);

  const roles = [
    { value: 'faculty', label: 'Faculty' },
    { value: 'hod', label: 'Head of Department' },
    { value: 'admin', label: 'Admin' },
    { value: 'principal', label: 'Principal' }
  ];

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUsers();
      if (response && response.success && response.data) {
        setUsers(response.data);
      } else {
        console.error('Invalid response format:', response);
        toast.error('Failed to fetch users: Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error fetching users: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      // For now, we'll use the static departments with correct MongoDB ObjectIds
      // In the future, this can be replaced with an API call
      const staticDepartments = [
        { _id: '6889176972077bb94d89e71d', name: 'Computer Science', code: 'CS' },
        { _id: '6889176972077bb94d89e71e', name: 'Information Technology', code: 'IT' },
        { _id: '6889176972077bb94d89e71f', name: 'Electronics & Communication', code: 'EC' },
        { _id: '6889176972077bb94d89e720', name: 'Mechanical Engineering', code: 'ME' },
        { _id: '6889176972077bb94d89e721', name: 'Civil Engineering', code: 'CE' }
      ];
      setDepartments(staticDepartments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.profile.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.profile.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.profile.designation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Sort by role hierarchy: principal, hod, faculty, admin
    filtered.sort((a, b) => {
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
      return `${a.profile.firstName} ${a.profile.lastName}`.localeCompare(`${b.profile.firstName} ${b.profile.lastName}`);
    });

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    try {
      const response = await apiService.createUser(createForm);
      if (response && response.success) {
        toast.success('User created successfully!');
        setShowCreateModal(false);
        resetCreateForm();
        fetchUsers(); // Refresh the list
      } else {
        toast.error(response?.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Error creating user: ' + (error.message || 'Unknown error'));
    }
  };

  const handleFixAllPasswords = async () => {
    if (!window.confirm('This will reset all user passwords to "password123". Are you sure?')) {
      return;
    }
    
    try {
      const response = await apiService.fixAllUserPasswords();
      if (response && response.success) {
        toast.success(`Password fix completed! Fixed: ${response.data.fixedCount}, Already working: ${response.data.alreadyWorkingCount}`);
      } else {
        toast.error(response?.message || 'Failed to fix passwords');
      }
    } catch (error) {
      console.error('Error fixing passwords:', error);
      toast.error('Error fixing passwords: ' + (error.message || 'Unknown error'));
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      employeeId: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      designation: '',
      departmentId: '',
      joiningDate: '',
      role: 'faculty',
      phoneNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: ''
      }
    });
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCreateForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setCreateForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'principal': return 'bg-purple-100 text-purple-800';
      case 'hod': return 'bg-blue-100 text-blue-800';
      case 'faculty': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  // Check if user is authenticated and has admin/principal role
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in with admin or principal credentials to access user management.</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin' && user.role !== 'principal') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admin and principal users can access user management.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8C001A]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all users in the system</p>
        </div>
        <div className="flex gap-3">
          {user.role === 'admin' && (
            <button
              onClick={handleFixAllPasswords}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              title="Fix all user passwords to 'password123'"
            >
              <FaEdit />
              Fix Passwords
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#8C001A] text-white px-4 py-2 rounded-lg hover:bg-[#6d0c0c] transition-colors flex items-center gap-2"
          >
            <FaUserPlus />
            Create New User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="faculty">Faculty</option>
              <option value="hod">HOD</option>
              <option value="admin">Admin</option>
              <option value="principal">Principal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-[#8C001A] flex items-center justify-center text-white font-semibold">
                          {user.profile.firstName.charAt(0)}{user.profile.lastName.charAt(0)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.profile.firstName} {user.profile.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.employeeId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.profile.department?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.isActive)}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <FaEye />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <FaEdit />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || roleFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Get started by creating a new user.'}
            </p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.employeeId}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                  />
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                  />
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.designation}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={createForm.departmentId}
                    onChange={(e) => handleInputChange('departmentId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    required
                    value={createForm.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Joining Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joining Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.joiningDate}
                    onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={createForm.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Address Fields */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Address (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street
                    </label>
                    <input
                      type="text"
                      value={createForm.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={createForm.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={createForm.address.state}
                      onChange={(e) => handleInputChange('address.state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={createForm.address.pincode}
                      onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8C001A] text-white rounded-lg hover:bg-[#6d0c0c] transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users; 