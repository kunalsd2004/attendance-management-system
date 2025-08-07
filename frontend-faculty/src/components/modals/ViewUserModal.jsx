import React from 'react';
import { FaTimes } from 'react-icons/fa';
// import calendarIcon from '../../assets/calendar.svg';

const ViewUserModal = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      'faculty': 'Faculty',
      'hod': 'Head of Department',
      'admin': 'Admin',
      'principal': 'Principal'
    };
    return roleLabels[role] || role;
  };

  const getStatusLabel = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 -top-6">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[85vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>

        <div className="space-y-4 h-full">
          {/* User Avatar and Basic Info */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 h-16 w-16">
              <div className="h-16 w-16 rounded-full bg-[#8C001A] flex items-center justify-center text-white font-semibold text-lg">
                {user.profile.firstName.charAt(0)}{user.profile.lastName.charAt(0)}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {user.profile.firstName} {user.profile.lastName}
              </h3>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {getStatusLabel(user.isActive)}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.role === 'admin' ? 'bg-red-100 text-red-800' :
                  user.role === 'principal' ? 'bg-purple-100 text-purple-800' :
                  user.role === 'hod' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>
          </div>

          {/* User Information Grid - 3 columns for better space utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Personal Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Personal Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SDRN
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900">
                  {user.sdrn}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900">
                  {user.profile.firstName}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900">
                  {user.profile.lastName}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900">
                  {user.email}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Contact Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900">
                  {user.profile.phoneNumber || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900">
                  {user.profile.gender || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Joining Date
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900">
                  {formatDate(user.profile.joiningDate)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900">
                  {getStatusLabel(user.isActive)}
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Professional Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900">
                  {user.profile.department?.name || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900">
                  {user.profile.designation || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900">
                  {getRoleLabel(user.role)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Created
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900">
                  {formatDate(user.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewUserModal; 