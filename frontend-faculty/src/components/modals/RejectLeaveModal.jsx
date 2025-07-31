import React, { useState } from 'react';

const RejectLeaveModal = ({ isOpen, onClose, onReject }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onReject(rejectionReason);
      setRejectionReason('');
      onClose();
    } catch (error) {
      console.error('Error rejecting leave:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setRejectionReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-[#8C001A]">Reject Leave Request</h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Rejection Reason Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="rejectionReason" className="block text-md font-medium text-gray-700 mb-2">
                Reason for Rejection <span className="text-gray-500">(Optional)</span>
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this leave request..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C001A] focus:border-transparent resize-none"
                style={{ fontSize: '0.9vw' }}
                rows="4"
                maxLength="500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white border border-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Rejecting...' : 'Reject Leave'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RejectLeaveModal; 