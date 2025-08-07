import React, { useState } from 'react';
import { FaTimes, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiService from '../../services/api';

const DeleteUserModal = ({ user, isOpen, onClose, onUserDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');

  const expectedText = `Delete user ${user?.profile?.firstName || 'User'}`;

  const handleDeleteUser = async () => {
    if (!user) return;

    if (confirmationText !== expectedText) {
      setError('Please type the confirmation text exactly as shown');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.deleteUser(user._id);

      if (response && response.success) {
        toast.success('User deleted successfully!');
        onUserDeleted(); // Refresh the user list
        onClose();
        setConfirmationText('');
      } else {
        toast.error(response?.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error deleting user: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setConfirmationText(e.target.value);
    if (error) setError('');
  };

  const handleClose = () => {
    setConfirmationText('');
    setError('');
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaTrash className="text-red-500 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900">
              Delete User
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-medium mb-2">⚠️ Warning: This action cannot be undone!</p>
            <p className="text-red-700 text-sm">
              Deleting this user will permanently remove all their data from the system.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm font-medium text-gray-900 mb-2">User Details:</p>
            <div className="text-sm text-gray-600">
              <p><span className="font-medium">Name:</span> {user.profile?.firstName} {user.profile?.lastName}</p>
              <p><span className="font-medium">SDRN:</span> {user.sdrn}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Role:</span> {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              To confirm deletion, please type: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{expectedText}</span>
            </p>
            <input
              type="text"
              value={confirmationText}
              onChange={handleInputChange}
              placeholder="Type the confirmation text..."
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteUser}
            disabled={loading || confirmationText !== expectedText}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              loading || confirmationText !== expectedText
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Deleting...
              </>
            ) : (
              <>
                <FaTrash className="text-sm" />
                Delete User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
