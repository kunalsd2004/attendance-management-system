import React, { useState } from 'react';
import { FaTimes, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiService from '../../services/api';

const EnableUserModal = ({ user, isOpen, onClose, onUserEnabled }) => {
  const [loading, setLoading] = useState(false);

  const handleEnableUser = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const response = await apiService.updateUser(user._id, {
        isActive: true
      });

      if (response && response.success) {
        toast.success('User enabled successfully!');
        onUserEnabled(); // Refresh the user list
        onClose();
      } else {
        toast.error(response?.message || 'Failed to enable user');
      }
    } catch (error) {
      console.error('Error enabling user:', error);
      toast.error('Error enabling user: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaCheckCircle className="text-green-500 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900">
              Enable User
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to enable this user? This action will:
          </p>
          <ul className="text-sm text-gray-600 space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              Allow the user to log into the system
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              Show the user in active user lists
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              Restore all user permissions and access
            </li>
          </ul>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-900 mb-2">User Details:</p>
            <div className="text-sm text-gray-600">
              <p><span className="font-medium">Name:</span> {user.profile?.firstName} {user.profile?.lastName}</p>
              <p><span className="font-medium">SDRN:</span> {user.sdrn}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Role:</span> {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleEnableUser}
            disabled={loading}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              loading 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enabling...
              </>
            ) : (
              <>
                <FaCheckCircle className="text-sm" />
                Enable User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnableUserModal;
