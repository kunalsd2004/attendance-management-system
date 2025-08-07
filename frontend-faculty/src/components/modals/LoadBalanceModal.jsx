import React from 'react';
import disclaimerIcon from '../../assets/disclaimer.svg';

const LoadBalanceModal = ({ onClose, leaveData }) => {
  if (!leaveData) return null;

  // Parse the loadAdjustment JSON string to get the actual data
  let loadAdjustmentData = [];
  try {
    if (leaveData.loadAdjustment) {
      loadAdjustmentData = JSON.parse(leaveData.loadAdjustment);
    }
  } catch (error) {
    console.error('Error parsing loadAdjustment data:', error);
  }

  // Debug: Log the parsed data
  console.log('LoadBalanceModal - parsed loadAdjustmentData:', loadAdjustmentData);

  // Format the load sharing partners data for display
  const formatLoadSharingPartners = () => {
    if (!Array.isArray(loadAdjustmentData) || loadAdjustmentData.length === 0) {
      return 'Not specified';
    }
    
    return loadAdjustmentData.map((load, index) => {
      return load.partner || 'Unknown';
    }).join(', ');
  };

  // Get department from the applicant's profile
  const getDepartment = () => {
    return leaveData.applicant?.profile?.department?.name || 'Not specified';
  };

  // Get lecture time from all load adjustment entries
  const getLectureTime = () => {
    if (Array.isArray(loadAdjustmentData) && loadAdjustmentData.length > 0) {
      return loadAdjustmentData.map((load, index) => {
        if (load.timeFrom && load.timeTo) {
          return `${load.partner || 'Unknown'}: ${load.timeFrom} - ${load.timeTo}`;
        }
        return `${load.partner || 'Unknown'}: Time not specified`;
      }).join('; ');
    }
    return 'Not specified';
  };

  // Get subject from all load adjustment entries
  const getSubject = () => {
    if (Array.isArray(loadAdjustmentData) && loadAdjustmentData.length > 0) {
      return loadAdjustmentData.map((load, index) => {
        return `${load.partner || 'Unknown'}: ${load.subject || 'Subject not specified'}`;
      }).join('; ');
    }
    return 'Not specified';
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#fff',
          padding: '4vh 3vw',
          borderRadius: '0.5vw',
          width: '50vw',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
          fontFamily: '"Noto Serif", serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2vh',
          paddingBottom: '1vh',
          borderBottom: '1px solid #eee'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1vw' }}>
            <img 
              src={disclaimerIcon} 
              alt="Load Balance" 
              style={{ height: '2.2vh' }} 
            />
            <h3 style={{ 
              margin: 0, 
              fontSize: '2.7vh', 
              fontWeight: 600,
              color: '#333'
            }}>
              Load Balance Details
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '3.5vh',
              cursor: 'pointer',
              color: '#2b2b2b',
              padding: '0.5vh'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2vh' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5vh' }}>
            <label style={{ 
              fontSize: '1.8vh', 
              color: '#555', 
              fontWeight: '500',
              marginBottom: '0.5vh'
            }}>
              Load Sharing Partner
            </label>
            <div style={{
              padding: '1.5vh 1.2vw',
              border: '1px solid #ccc',
              borderRadius: '0.3vw',
              fontSize: '1.7vh',
              backgroundColor: '#f8f9fa',
              color: '#333',
              minHeight: '4vh',
              lineHeight: '1.4'
            }}>
              {formatLoadSharingPartners()}
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5vh' }}>
            <label style={{ 
              fontSize: '1.8vh', 
              color: '#555', 
              fontWeight: '500',
              marginBottom: '0.5vh'
            }}>
              Department
            </label>
            <div style={{
              padding: '1.5vh 1.2vw',
              border: '1px solid #ccc',
              borderRadius: '0.3vw',
              fontSize: '1.7vh',
              backgroundColor: '#f8f9fa',
              color: '#333'
            }}>
              {getDepartment()}
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5vh' }}>
            <label style={{ 
              fontSize: '1.8vh', 
              color: '#555', 
              fontWeight: '500',
              marginBottom: '0.5vh'
            }}>
              Lecture Time
            </label>
            <div style={{
              padding: '1.5vh 1.2vw',
              border: '1px solid #ccc',
              borderRadius: '0.3vw',
              fontSize: '1.7vh',
              backgroundColor: '#f8f9fa',
              color: '#333'
            }}>
              {getLectureTime()}
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5vh' }}>
            <label style={{ 
              fontSize: '1.8vh', 
              color: '#555', 
              fontWeight: '500',
              marginBottom: '0.5vh'
            }}>
              Subject/Course
            </label>
            <div style={{
              padding: '1.5vh 1.2vw',
              border: '1px solid #ccc',
              borderRadius: '0.3vw',
              fontSize: '1.7vh',
              backgroundColor: '#f8f9fa',
              color: '#333'
            }}>
              {getSubject()}
            </div>
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '1vw', 
          marginTop: '3vh',
          paddingTop: '2vh',
          borderTop: '1px solid #eee'
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '1.5vh 2vw',
              border: 'none',
              borderRadius: '0.5vw',
              fontSize: '1.8vh',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: '#f0f0f0',
              color: '#333'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadBalanceModal;
