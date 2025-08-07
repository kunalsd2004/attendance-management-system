import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  FaUsers,
  FaPlus,
  FaFilter,
  FaUserPlus,
  FaTimes
} from 'react-icons/fa';
import dropdownIcon from '../assets/dropdown.svg';
import statusActiveIcon from '../assets/status-active.svg';
import statusInactiveIcon from '../assets/status-inactive.svg';
import searchIcon from '../assets/search-icon.svg';
import ActionDropdown from '../components/ActionDropdown';
import ViewUserModal from '../components/modals/ViewUserModal';
import EditUserModal from '../components/modals/EditUserModal';
import DisableUserModal from '../components/modals/DisableUserModal';
import EnableUserModal from '../components/modals/EnableUserModal';
import DeleteUserModal from '../components/modals/DeleteUserModal';
import CreateUserModal from '../components/modals/CreateUserModal';
// import editWhiteIcon from '../assets/edit-white.svg';

const Users = () => {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterRoleDropdownOpen, setFilterRoleDropdownOpen] = useState(false);

  const roles = [
    { value: 'faculty', label: 'Faculty' },
    { value: 'hod', label: 'Head of Department' },
    { value: 'admin', label: 'Admin' },
    { value: 'principal', label: 'Principal' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside filter dropdown container
      const filterRoleDropdown = event.target.closest('[data-dropdown="filter-role"]');
      
      if (!filterRoleDropdown) {
        setFilterRoleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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



  const filterUsers = () => {
    let filtered = [...users]; // Create a copy to avoid mutating the original array

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.sdrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
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



  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'principal': return 'bg-purple-100 text-purple-800';
      case 'hod': return 'bg-blue-100 text-blue-800';
      case 'faculty': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // const getStatusBadgeColor = (isActive) => {
  //   return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  // };

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
          {/* {user.role === 'admin' && (
            <button
              onClick={handleFixAllPasswords}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              title="Fix all user passwords to 'password123'"
            >
              <img src={editWhiteIcon} alt="Edit" className="w-4 h-4" />
              Fix Passwords
            </button>
          )} */}
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
                <img src={searchIcon} alt="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
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
              <div className="relative" data-dropdown="filter-role">
                <div
                  className="custom-dropdown border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#8C001A] focus:border-transparent"
                  style={{
                    background: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    userSelect: 'none',
                    boxSizing: 'border-box',
                    outline: 'none',
                    minWidth: '200px',
                  }}
                  onClick={() => setFilterRoleDropdownOpen(!filterRoleDropdownOpen)}
                  tabIndex={0}
                >
                <span style={{
                  flex: 1,
                  color: '#333',
                  fontWeight: '500',
                }}>
                  {(() => {
                    if (roleFilter === 'all') return 'All Roles';
                    const selectedRole = roles.find(role => role.value === roleFilter);
                    return selectedRole ? selectedRole.label : 'All Roles';
                  })()}
                </span>
                <img src={dropdownIcon} alt="Dropdown" style={{ marginLeft: 'auto', height: '8px', flexShrink: 0 }} />
              </div>
              {filterRoleDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    zIndex: 50,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    marginTop: 2,
                  }}
                >
                  <div
                    style={{
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: roleFilter === 'all' ? '#f5f5f5' : '#fff',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                    onClick={() => {
                      setRoleFilter('all');
                      setFilterRoleDropdownOpen(false);
                    }}
                  >
                    <span style={{
                      flex: 1,
                      color: '#333',
                      fontWeight: roleFilter === 'all' ? '600' : '400',
                    }}>
                      All Roles
                    </span>
                  </div>
                  {roles.map(role => (
                    <div
                      key={role.value}
                      style={{
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        background: roleFilter === role.value ? '#f5f5f5' : '#fff',
                        borderBottom: role.value !== roles[roles.length - 1].value ? '1px solid #f0f0f0' : 'none',
                      }}
                      onClick={() => {
                        setRoleFilter(role.value);
                        setFilterRoleDropdownOpen(false);
                      }}
                    >
                      <span style={{
                        flex: 1,
                        color: '#333',
                        fontWeight: roleFilter === role.value ? '600' : '400',
                      }}>
                        {role.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                  SDRN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    {user.sdrn}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.profile.department?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center items-center">
                      <img 
                        src={user.isActive ? statusActiveIcon : statusInactiveIcon} 
                        alt={user.isActive ? "Active" : "Inactive"} 
                        className="w-5 h-5" 
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                    <div className="flex justify-center">
                      <ActionDropdown
                        user={user}
                        onView={() => {
                          setSelectedUser(user);
                          setShowViewModal(true);
                        }}
                        onEdit={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                        onDisable={() => {
                          setSelectedUser(user);
                          setShowDisableModal(true);
                        }}
                        onEnable={() => {
                          setSelectedUser(user);
                          setShowEnableModal(true);
                        }}
                        onDelete={() => {
                          setSelectedUser(user);
                          setShowDeleteModal(true);
                        }}
                      />
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
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={fetchUsers}
      />

      {/* View User Modal */}
      <ViewUserModal
        user={selectedUser}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedUser(null);
        }}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={selectedUser}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onUserUpdated={fetchUsers}
      />

      {/* Disable User Modal */}
      <DisableUserModal
        user={selectedUser}
        isOpen={showDisableModal}
        onClose={() => {
          setShowDisableModal(false);
          setSelectedUser(null);
        }}
        onUserDisabled={fetchUsers}
      />

      {/* Enable User Modal */}
      <EnableUserModal
        user={selectedUser}
        isOpen={showEnableModal}
        onClose={() => {
          setShowEnableModal(false);
          setSelectedUser(null);
        }}
        onUserEnabled={fetchUsers}
      />

      {/* Delete User Modal */}
      <DeleteUserModal
        user={selectedUser}
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onUserDeleted={fetchUsers}
      />
    </div>
  );
};

export default Users; 