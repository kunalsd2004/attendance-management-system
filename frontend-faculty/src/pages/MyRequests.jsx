import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

const MyRequests = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchUserLeaves();
  }, []);

  const fetchUserLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch leaves for the current user
      const response = await apiService.getLeaves({ userId: user?._id });
      
      if (response.success) {
        // Filter out cancelled leaves on frontend as well
        const allLeaves = response.data.leaves || [];
        const filteredLeaves = allLeaves.filter(leave => leave.status !== 'cancelled');
        setLeaves(filteredLeaves);
      } else {
        throw new Error(response.message || 'Failed to fetch leaves');
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setError(err.message || 'Failed to load your leave requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',      // amber
      'approved': '#10b981',     // green  
      'rejected': '#ef4444',     // red
      // Removed 'cancelled' since we're filtering it out
    };
    return colors[status?.toLowerCase()] || '#6b7280';
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
        Loading your leave requests...
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
          onClick={fetchUserLeaves}
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

  const styles = {
    requestsPage: {
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
    statusBadge: {
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: 'white',
      textTransform: 'capitalize',
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
      maxWidth: '300px',
      color: '#4b5563',
      lineHeight: 1.4,
    },
    appliedDate: {
      fontSize: '0.875rem',
      color: '#6b7280',
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
      color: '#1f2937',
    },
    statLabel: {
      fontSize: '0.875rem',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginTop: '0.5rem',
    },
  };

  return (
             
       <div style={styles.requestsPage}>
         <div style={styles.pageHeader}>
           <h1 style={styles.pageTitle}>My Leave Requests</h1>
           <p style={styles.pageSubtitle}>
             View and track all your leave applications
             <button 
               style={styles.refreshBtn}
               onMouseOver={(e) => e.target.style.backgroundColor = '#7a0016'}
               onMouseOut={(e) => e.target.style.backgroundColor = '#93001a'}
               onClick={fetchUserLeaves}
             >
               Refresh
             </button>
           </p>
         </div>

         {/* Stats Summary */}
         <div style={styles.statsSummary}>
           <div style={styles.statCard}>
             <div style={styles.statNumber}>{leaves.length}</div>
             <div style={styles.statLabel}>Total Requests</div>
           </div>
           <div style={styles.statCard}>
             <div style={styles.statNumber}>{leaves.filter(l => l.status === 'pending').length}</div>
             <div style={styles.statLabel}>Pending</div>
           </div>
           <div style={styles.statCard}>
             <div style={styles.statNumber}>{leaves.filter(l => l.status === 'approved').length}</div>
             <div style={styles.statLabel}>Approved</div>
           </div>
           <div style={styles.statCard}>
             <div style={styles.statNumber}>{leaves.filter(l => l.status === 'rejected').length}</div>
             <div style={styles.statLabel}>Rejected</div>
           </div>
         </div>

         <div style={styles.requestsContainer}>
           {leaves.length === 0 ? (
             <div style={styles.noRequests}>
               <div style={styles.noRequestsIcon}>📋</div>
               <h3>No Leave Requests Found</h3>
               <p>You haven't submitted any leave requests yet.</p>
             </div>
           ) : (
             <table style={styles.requestsTable}>
               <thead style={styles.tableHeader}>
                 <tr>
                   <th style={styles.tableHeaderTh}>Leave Type</th>
                   <th style={styles.tableHeaderTh}>Date Range</th>
                   <th style={styles.tableHeaderTh}>Duration</th>
                   <th style={styles.tableHeaderTh}>Reason</th>
                   <th style={styles.tableHeaderTh}>Status</th>
                   <th style={styles.tableHeaderTh}>Applied On</th>
                 </tr>
               </thead>
               <tbody>
                 {leaves.map((leave) => (
                   <tr 
                     key={leave._id} 
                     style={styles.tableRow}
                     onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                     onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                   >
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
                       <span 
                         style={{ 
                           ...styles.statusBadge,
                           backgroundColor: getStatusColor(leave.status)
                         }}
                       >
                         {leave.status}
                       </span>
                     </td>
                     <td style={styles.tableCell}>
                       <div style={styles.appliedDate}>{formatDate(leave.appliedAt)}</div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
         </div>
       </div>
   );
};

export default MyRequests; 