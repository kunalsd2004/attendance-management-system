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
      
      console.log('Current user:', user?.sdrn, '-', user?.profile?.firstName);
      console.log('Fetching leaves for user ID:', user?._id);
      
      // Pass current user's ID to filter leaves by department
      const response = await apiService.getPendingLeaves(user?._id);
      
      if (response.success) {
        setPendingLeaves(response.data.leaves || []);
        console.log('Approver role:', response.data.approverInfo?.role);
        console.log('Approver department:', response.data.approverInfo?.department);
        console.log('Total leaves found:', response.data.totalCount);
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
        
        // Show success message based on action and role
        if (action === 'approve') {
          if (user?.role === 'hod') {
            showLeaveApproved('Leave approved by HOD. Forwarded to Principal for final approval.');
          } else if (user?.role === 'principal') {
            showLeaveApproved('Leave approved by Principal. Request finalized.');
          } else {
            showLeaveApproved();
          }
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
      'OnDuty': '#e95e50',
      'Special': '#936fac'
    };
    return colors[leaveType] || '#6b7280';
  };

  // ✅ IMPROVED APPROVAL PROGRESS UI
  const renderApprovalProgress = (leave) => {
    if (!leave.approvalProgress) return null;

    const { total, approved } = leave.approvalProgress;
    
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px',
        padding: '12px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        {/* Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            flex: 1, 
            height: '6px', 
            backgroundColor: '#e2e8f0', 
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(approved / total) * 100}%`,
              height: '100%',
              backgroundColor: '#a1c65d',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: '600',
            color: '#374151'
          }}>
            {approved}/{total}
          </span>
        </div>
        
                 {/* Approval Steps */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
           {leave.approvals && leave.approvals.map((approval) => (
            <div key={approval.approver._id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: approval.status === 'approved' ? '#a1c65d' : 
                               approval.status === 'rejected' ? '#dc2626' : '#f29222',
                border: '2px solid white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }} />
                             <span style={{ color: '#6b7280', fontWeight: '500' }}>
                 {approval.approver.role === 'hod' ? 'HOD' : 
                  approval.approver.role === 'principal' ? 'Principal' : 
                  `${approval.approver.profile.firstName} ${approval.approver.profile.lastName}`}
               </span>
              <span style={{ 
                color: approval.status === 'approved' ? '#a1c65d' : 
                       approval.status === 'rejected' ? '#dc2626' : '#f29222',
                fontWeight: '600',
                textTransform: 'capitalize'
              }}>
                {approval.status}
              </span>
            </div>
          ))}
        </div>
        
      
      </div>
    );
  };



  // ✅ NEW: Get current user's approval status
  const getCurrentUserApprovalStatus = (leave) => {
    if (!leave.approvals || !user?._id) return null;
    
    const currentUserApproval = leave.approvals.find(
      approval => approval.approver._id === user._id
    );
    
    return currentUserApproval ? currentUserApproval.status : null;
  };

  // ✅ NEW: Render status indicator instead of action buttons
  const renderStatusIndicator = (leave) => {
    const status = getCurrentUserApprovalStatus(leave);
    
    if (!status || status === 'pending') {
      // Show action buttons for pending approvals
      return (
        <div style={styles.actionButtons}>
          <button 
            style={{ 
              ...styles.btn, 
              ...styles.btnApprove,
              opacity: processingId === leave._id ? 0.5 : 1,
              cursor: processingId === leave._id ? 'not-allowed' : 'pointer',
              filter: processingId === leave._id ? 'grayscale(50%)' : 'none'
            }}
            onClick={() => handleApproval(leave._id, 'approve')}
            disabled={processingId === leave._id}
            onMouseOver={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#8bb54a', e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 4px 8px rgba(161, 198, 93, 0.3)')}
            onMouseOut={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#a1c65d', e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)')}
          >
            {processingId === leave._id ? '...' : '✓'} Approve
          </button>
          <button 
            style={{ 
              ...styles.btn, 
              ...styles.btnReject,
              opacity: processingId === leave._id ? 0.5 : 1,
              cursor: processingId === leave._id ? 'not-allowed' : 'pointer',
              filter: processingId === leave._id ? 'grayscale(50%)' : 'none'
            }}
            onClick={() => handleRejectClick(leave)}
            disabled={processingId === leave._id}
            onMouseOver={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#b91c1c', e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.3)')}
            onMouseOut={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#dc2626', e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)')}
          >
            {processingId === leave._id ? '...' : '✗'} Reject
          </button>
        </div>
      );
    }
    
    // Show status indicator for processed leaves
    const isApproved = status === 'approved';
    
    return (
      <div style={{
        ...styles.btn,
        backgroundColor: isApproved ? '#a1c65d' : '#dc2626',
        color: 'white',
        border: `2px solid ${isApproved ? '#a1c65d' : '#dc2626'}`,
        cursor: 'default',
        minWidth: '120px',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        {isApproved ? '✓ Approved' : '✗ Rejected'}
      </div>
    );
  };

  const styles = {
    approveLeavesPage: {
      maxWidth: '1400px',
      margin: '0 auto',
    },
    pageHeader: {
      marginBottom: '2rem',
    },
    pageTitle: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: '0 0 0.5rem 0',
    },
    pageSubtitle: {
      color: '#6b7280',
      margin: '0',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    },
    statsSummary: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem',
    },
    statCard: {
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      textAlign: 'center',
    },
    statNumber: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#93001a',
      marginBottom: '0.5rem',
    },
    statLabel: {
      color: '#6b7280',
      fontSize: '0.875rem',
    },
    requestsContainer: {
      backgroundColor: 'white',
      borderRadius: '8px',
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
      fontWeight: '600',
      color: '#374151',
      fontSize: '0.875rem',
    },
    tableRow: {
      borderBottom: '1px solid #f3f4f6',
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
      backgroundColor: '#93001a',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
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
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: 'white',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      minWidth: '100px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      border: '2px solid transparent',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
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
      padding: '0.4rem 1.5rem',
      border: 'none',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      minWidth: '120px',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    btnApprove: {
      backgroundColor: '#a1c65d',
      color: 'white',
      border: '2px solid #a1c65d',
    },
    btnReject: {
      backgroundColor: '#dc2626',
      color: 'white',
      border: '2px solid #dc2626',
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
          {user?.role === 'hod' 
            ? 'Review and approve/reject leave requests from your department faculty members. Processed requests remain visible until Principal approval.'
            : user?.role === 'principal'
            ? 'Review and approve/reject leave requests that have been approved by HOD (Final Level Approval)'
            : 'Review and approve/reject leave requests from faculty members'
          }
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
          <div style={styles.statLabel}>
            {user?.role === 'hod' ? 'Department Leave Requests' : 'Pending Principal Approval'}
          </div>
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
                <th style={{...styles.tableHeaderTh, width: '120px'}}>Leave Type</th>
                <th style={styles.tableHeaderTh}>Date Range</th>
                <th style={{...styles.tableHeaderTh, textAlign: 'center'}}>Duration</th>
                <th style={{...styles.tableHeaderTh, textAlign: 'center'}}>Reason</th>
                <th style={{...styles.tableHeaderTh, textAlign: 'center'}}>Approval Level</th>
                <th style={{...styles.tableHeaderTh, textAlign: 'center'}}>Applied On</th>
                <th style={{...styles.tableHeaderTh, textAlign: 'center'}}>Actions</th>
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
                    <div style={styles.employeeDetails}>
                      <h4 style={styles.employeeDetailsH4}>
                        {leave.applicant?.profile?.firstName} {leave.applicant?.profile?.lastName}
                      </h4>
                      <p style={styles.employeeDetailsP}>{leave.applicant?.sdrn || 'Faculty'}</p>
                    </div>
                  </td>
                  <td style={styles.tableCell}>
                    <span 
                      style={{ 
                        ...styles.leaveTypeBadge,
                        backgroundColor: getLeaveTypeColor(leave.leaveType?.name || leave.leaveType),
                        borderColor: getLeaveTypeColor(leave.leaveType?.name || leave.leaveType)
                      }}
                      onMouseOver={(e) => {
                        const color = getLeaveTypeColor(leave.leaveType?.name || leave.leaveType);
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = `0 4px 8px ${color}40`;
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
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
                  <td style={{...styles.tableCell, textAlign: 'center'}}>
                    <strong>{leave.workingDays} days</strong>
                    {leave.totalDays !== leave.workingDays && (
                      <div style={styles.daysInfo}>({leave.totalDays} total)</div>
                    )}
                  </td>
                  <td style={{...styles.tableCell, textAlign: 'center'}}>
                    <div style={styles.reasonText}>{leave.reason}</div>
                  </td>
                  <td style={{...styles.tableCell, textAlign: 'center'}}>
                    {renderApprovalProgress(leave)}
                  </td>
                  <td style={{...styles.tableCell, textAlign: 'center'}}>
                    <div style={styles.daysInfo}>{formatDate(leave.appliedAt)}</div>
                  </td>
                  <td style={{...styles.tableCell, textAlign: 'center'}}>
                    {renderStatusIndicator(leave)}
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