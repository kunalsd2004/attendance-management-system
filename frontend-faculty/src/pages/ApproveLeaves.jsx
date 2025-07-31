import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { showLeaveApproved, showLeaveRejected, showError } from '../services/toastService';
import RejectLeaveModal from '../components/modals/RejectLeaveModal';

const ApproveLeaves = () => {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchPendingLeaves();
  }, []);

    const fetchPendingLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Current user:', user?.employeeId, '-', user?.profile?.firstName);
      console.log('Fetching leaves for user ID:', user?._id);
      
      // Pass current user's ID to filter leaves by department
      const response = await apiService.getPendingLeaves(user?._id);
      
      if (response.success) {
        setPendingLeaves(response.data.leaves || []);
        console.log('Approver role:', response.data.approverRole);
        console.log('Approver department:', response.data.approverDepartment);
        console.log('Total leaves found:', response.data.total);
      } else {
        throw new Error(response.message || 'Failed to fetch pending leaves');
      }
    } catch (err) {
      console.error('Error fetching pending leaves:', err);
      setError(err.message || 'Failed to load pending leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (leaveId, action, comments = '') => {
    try {
      setProcessingId(leaveId);
      
      const response = await apiService.processLeaveApproval(leaveId, {
        action, // 'approve' or 'reject'
        comments,
        approverId: user?._id
      });

      if (response.success) {
        // Remove the processed leave from the list
        setPendingLeaves(prev => prev.filter(leave => leave._id !== leaveId));
        
        // Show success message based on action
        if (action === 'approve') {
          showLeaveApproved();
        } else if (action === 'reject') {
          showLeaveRejected();
        }
      } else {
        throw new Error(response.message || `Failed to ${action} leave request`);
      }
    } catch (err) {
      console.error(`Error ${action}ing leave:`, err);
      showError(`Failed to ${action} leave request. Please try again.`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (leave) => {
    setSelectedLeave(leave);
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (reason) => {
    if (selectedLeave) {
      await handleApproval(selectedLeave._id, 'reject', reason);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLeaveTypeColor = (leaveType) => {
    const colors = {
      'Casual': '#f29222',
      'Medical': '#a1c65d',
      'Vacation': '#fac723',
      'CompensatoryOff': '#0cb2af',
      'Urgent': '#e95e50',
      'Special': '#936fac'
    };
    return colors[leaveType] || '#6c757d';
  };

  const styles = {
    approveLeavesPage: {
      padding: '2rem',
      fontFamily: '"Inter", sans-serif',
    },
    pageHeader: {
      marginBottom: '2rem',
    },
    pageTitle: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#1f2937',
      marginBottom: '0.5rem',
    },
    pageSubtitle: {
      color: '#6b7280',
      fontSize: '1rem',
    },
    statsSummary: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '2rem',
    },
    statCard: {
      background: 'white',
      padding: '1.5rem',
      borderRadius: '10px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      flex: 1,
      textAlign: 'center',
    },
    statNumber: {
      fontSize: '2rem',
      fontWeight: 700,
      color: '#93001a',
    },
    statLabel: {
      fontSize: '0.875rem',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginTop: '0.5rem',
    },
    requestsContainer: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
    },
    requestsTable: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    tableHeader: {
      backgroundColor: '#f9fafb',
      borderBottom: '1px solid #e5e7eb',
    },
    tableHeaderTh: {
      padding: '1rem',
      textAlign: 'left',
      fontWeight: 600,
      color: '#374151',
      fontSize: '0.875rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    tableRow: {
      borderBottom: '1px solid #e5e7eb',
      transition: 'background-color 0.2s',
    },
    tableCell: {
      padding: '1rem',
      verticalAlign: 'top',
    },
    employeeInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    },
    employeeAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: '#93001a',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 600,
      fontSize: '0.875rem',
    },
    employeeDetails: {
      display: 'flex',
      flexDirection: 'column',
    },
    employeeDetailsH4: {
      margin: 0,
      fontWeight: 600,
      color: '#1f2937',
    },
    employeeDetailsP: {
      margin: 0,
      fontSize: '0.875rem',
      color: '#6b7280',
    },
    leaveTypeBadge: {
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: 'white',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    dateRange: {
      fontWeight: 500,
      color: '#374151',
    },
    daysInfo: {
      fontSize: '0.875rem',
      color: '#6b7280',
      marginTop: '0.25rem',
    },
    reasonText: {
      maxWidth: '250px',
      color: '#4b5563',
      lineHeight: 1.4,
    },
    actionButtons: {
      display: 'flex',
      gap: '0.5rem',
    },
    btn: {
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '6px',
      fontSize: '0.875rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
    },
    btnApprove: {
      backgroundColor: '#059669',
      color: 'white',
    },
    btnReject: {
      backgroundColor: '#dc2626',
      color: 'white',
    },
    noRequests: {
      textAlign: 'center',
      padding: '3rem',
      color: '#6b7280',
    },
    noRequestsIcon: {
      fontSize: '3rem',
      marginBottom: '1rem',
      opacity: 0.3,
    },
    refreshBtn: {
      marginLeft: '1rem',
      padding: '0.5rem 1rem',
      backgroundColor: '#93001a',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.875rem',
      transition: 'background-color 0.2s',
    },
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading pending leave requests...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '2rem',
        textAlign: 'center',
        color: '#ef4444'
      }}>
        <h2>Error Loading Requests</h2>
        <p>{error}</p>
        <button 
          onClick={fetchPendingLeaves}
          style={{
            marginTop: '1rem',
            padding: '10px 20px',
            backgroundColor: '#93001a',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={styles.approveLeavesPage}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Approve Leave Requests</h1>
        <p style={styles.pageSubtitle}>
          Review and approve/reject leave requests from faculty members
          <button 
            style={styles.refreshBtn}
            onMouseOver={(e) => e.target.style.backgroundColor = '#7a0016'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#93001a'}
            onClick={fetchPendingLeaves}
          >
            Refresh
          </button>
        </p>
      </div>

      {/* Stats Summary */}
      <div style={styles.statsSummary}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{pendingLeaves.length}</div>
          <div style={styles.statLabel}>Pending Requests</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{pendingLeaves.filter(l => l.leaveType?.name?.includes('Medical')).length}</div>
          <div style={styles.statLabel}>Medical Leaves</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{pendingLeaves.filter(l => l.leaveType?.name?.includes('Casual')).length}</div>
          <div style={styles.statLabel}>Casual Leaves</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{pendingLeaves.filter(l => l.workingDays > 3).length}</div>
          <div style={styles.statLabel}>Long Leaves ({'>'}3 days)</div>
        </div>
      </div>

      <div style={styles.requestsContainer}>
        {pendingLeaves.length === 0 ? (
          <div style={styles.noRequests}>
            <div style={styles.noRequestsIcon}>✅</div>
            <h3>No Pending Requests</h3>
            <p>All leave requests have been processed.</p>
          </div>
        ) : (
          <table style={styles.requestsTable}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.tableHeaderTh}>Employee</th>
                <th style={styles.tableHeaderTh}>Leave Type</th>
                <th style={styles.tableHeaderTh}>Date Range</th>
                <th style={styles.tableHeaderTh}>Duration</th>
                <th style={styles.tableHeaderTh}>Reason</th>
                <th style={styles.tableHeaderTh}>Applied On</th>
                <th style={styles.tableHeaderTh}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingLeaves.map((leave) => (
                <tr 
                  key={leave._id} 
                  style={styles.tableRow}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={styles.tableCell}>
                    <div style={styles.employeeInfo}>
                      <div style={styles.employeeAvatar}>
                        {leave.applicant?.profile?.firstName?.charAt(0) || 'U'}
                        {leave.applicant?.profile?.lastName?.charAt(0) || ''}
                      </div>
                      <div style={styles.employeeDetails}>
                        <h4 style={styles.employeeDetailsH4}>
                          {leave.applicant?.profile?.firstName} {leave.applicant?.profile?.lastName}
                        </h4>
                        <p style={styles.employeeDetailsP}>{leave.applicant?.employeeId || 'Faculty'}</p>
                      </div>
                    </div>
                  </td>
                  <td style={styles.tableCell}>
                    <span 
                      style={{ 
                        ...styles.leaveTypeBadge,
                        backgroundColor: getLeaveTypeColor(leave.leaveType?.name || leave.leaveType)
                      }}
                    >
                      {leave.leaveType?.name || leave.leaveType}
                    </span>
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.dateRange}>
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </div>
                    <div style={styles.daysInfo}>
                      {leave.isStartHalfDay && 'Half day start'} 
                      {leave.isEndHalfDay && (leave.isStartHalfDay ? ', Half day end' : 'Half day end')}
                    </div>
                  </td>
                  <td style={styles.tableCell}>
                    <strong>{leave.workingDays} days</strong>
                    {leave.totalDays !== leave.workingDays && (
                      <div style={styles.daysInfo}>({leave.totalDays} total)</div>
                    )}
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.reasonText}>{leave.reason}</div>
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.daysInfo}>{formatDate(leave.appliedAt)}</div>
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.actionButtons}>
                      <button 
                        style={{ 
                          ...styles.btn, 
                          ...styles.btnApprove,
                          opacity: processingId === leave._id ? 0.6 : 1,
                          cursor: processingId === leave._id ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => handleApproval(leave._id, 'approve')}
                        disabled={processingId === leave._id}
                        onMouseOver={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#047857')}
                        onMouseOut={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#059669')}
                      >
                        {processingId === leave._id ? '...' : '✓'} Approve
                      </button>
                      <button 
                        style={{ 
                          ...styles.btn, 
                          ...styles.btnReject,
                          opacity: processingId === leave._id ? 0.6 : 1,
                          cursor: processingId === leave._id ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => handleRejectClick(leave)}
                        disabled={processingId === leave._id}
                        onMouseOver={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#b91c1c')}
                        onMouseOut={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#dc2626')}
                      >
                        {processingId === leave._id ? '...' : '✗'} Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reject Leave Modal */}
      <RejectLeaveModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedLeave(null);
        }}
        onReject={handleRejectSubmit}
        leaveDetails={selectedLeave}
      />
    </div>
  );
};

export default ApproveLeaves; 