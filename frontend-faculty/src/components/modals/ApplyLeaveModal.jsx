import React, { useState, useEffect, useRef } from 'react';
import dropdownIcon from '../../assets/dropdown.svg';
import calendarIcon from '../../assets/calendar.svg';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { showLeaveApplied, showFormError, showError } from '../../services/toastService';

// --- Leave Request Modal (for creating a new leave) ---
const ApplyLeaveModal = ({ onClose, initialDate, onLeaveCreated }) => {
    const [startDate, setStartDate] = useState(initialDate || '');
    const [endDate, setEndDate] = useState(initialDate || '');
    const [startHalfDay, setStartHalfDay] = useState(false);
    const [endHalfDay, setEndHalfDay] = useState(false);
    const [leaveType, setLeaveType] = useState('Casual');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attachedFile, setAttachedFile] = useState(null);
    const [fileName, setFileName] = useState('');
    
    // Refs for date inputs
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const fileInputRef = useRef(null);
    
    // Get user from auth context
    const { user } = useAuth();

    const leaveTypes = [
      { value: 'Casual', label: 'Casual Leave', color: '#f29222' },
      { value: 'Medical', label: 'Medical Leave', color: '#a1c65d' },
      { value: 'CompensatoryOff', label: 'Compensatory Off', color: '#0cb2af' },
      { value: 'Vacation', label: 'Vacation Leave', color: '#fac723' },
      { value: 'OnDuty', label: 'On Duty Leave', color: '#e95e50' },
      { value: 'Special', label: 'Special Leave', color: '#936fac' },
    ];

    const selectedLeave = leaveTypes.find(l => l.value === leaveType);
    const [comments, setComments] = useState('');
    const [loadAdjustments, setLoadAdjustments] = useState([
      {
        partner: '',
        timeFrom: '',
        timeTo: '',
        subject: ''
      }
    ]);
    const [workingDays, setWorkingDays] = useState(0);

    useEffect(() => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (start > end) {
                setWorkingDays(0);
                return;
            }

            let count = 0;
            const curDate = new Date(start.getTime());
            while (curDate <= end) {
                const dayOfWeek = curDate.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    count++;
                }
                curDate.setDate(curDate.getDate() + 1);
            }

            let deduction = 0;
            if (startHalfDay) deduction += 0.5;
            if (endHalfDay && startDate !== endDate) {
                 deduction += 0.5;
            } else if(endHalfDay && startDate === endDate) {
                if(startHalfDay) {
                    deduction = 0.5;
                    count = 0.5;
                }
            }
            setWorkingDays(Math.max(0, count - deduction));
        } else {
            setWorkingDays(0);
        }
    }, [startDate, endDate, startHalfDay, endHalfDay]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Check file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                alert('Please select a valid file type: JPG, PNG, or PDF');
                return;
            }
            
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }
            
            setAttachedFile(file);
            setFileName(file.name);
        }
    };

    const removeFile = () => {
        setAttachedFile(null);
        setFileName('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (!startDate || !endDate || !leaveType) {
            showFormError('Please fill in all required fields.');
            return;
        }

        if (!comments.trim()) {
            showFormError('Please provide a reason for your leave request.');
            return;
        }

        if (!loadAdjustments.length) {
            showFormError('Please provide at least one load sharing partner.');
            return;
        }

        // Check if medical leave requires document attachment
        if (leaveType === 'Medical' && !attachedFile) {
            showFormError('Medical leave requires a document attachment (medical certificate).');
            return;
        }

        setIsSubmitting(true);

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('leaveType', leaveType);
            formData.append('startDate', startDate);
            formData.append('endDate', endDate);
            formData.append('startHalfDay', startHalfDay);
            formData.append('endHalfDay', endHalfDay);
            formData.append('reason', comments.trim());
            formData.append('loadAdjustments', JSON.stringify(loadAdjustments));
            formData.append('userId', user?._id);

            // Add file if it exists
            if (attachedFile) {
                formData.append('document', attachedFile);
                // Add destination folder for medical leave
                if (leaveType === 'Medical') {
                    formData.append('destinationFolder', 'https://drive.google.com/drive/folders/1mDbBmwsymCiLuYoq0Xir8WsUDFwyVuJM?usp=drive_link');
                }
            }

            const response = await apiService.createLeaveWithDocument(formData);
            
            if (response.success) {
                showLeaveApplied();
                onClose();
                // Call the callback to refresh leaves
                if (onLeaveCreated) {
                    onLeaveCreated();
                }
            } else {
                showError('Failed to submit leave application. Please try again.');
            }
        } catch (error) {
            console.error('Leave submission error:', error);
            showError('An error occurred while submitting your leave application. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="leave-request-modal" onClick={(e) => e.stopPropagation()}>
                <style>{`
                    /* Modal Scrollable Styles */
                    .leave-request-modal {
                        max-height: 90vh;
                        overflow-y: auto;
                        display: flex;
                        flex-direction: column;
                        padding: 1.5vw;
                    }
                    
                    .leave-request-content {
                        flex: 1;
                        overflow-y: auto;
                        padding: 0 1vw;
                    }
                    
                    .leave-request-footer {
                        flex-shrink: 0;
                        padding: 2vh 1vw 0 0;
                        border-top: 1px solid #e0e0e0;
                        background: white;
                    }
                    
                    /* Load Adjustment Styles */
                    .load-adjustment-list {
                        display: flex;
                        flex-direction: column;
                        gap: 2vh;
                    }
                    
                    .load-adjustment-item {
                        display: flex;
                        flex-direction: row;
                        gap: 1.5vw;
                        padding: 2vh 1.5vw;
                        border: 1px solid #e0e0e0;
                        border-radius: 0.5vw;
                        background-color: #f8f9fa;
                        position: relative;
                        align-items: flex-end;
                    }
                    
                    .remove-load-btn {
                        position: absolute;
                        top: 1vh;
                        right: 1vw;
                        background: transparent;
                        color: #333;
                        border: none;
                        width: 3vh;
                        height: 3vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 1.6vh;
                        font-weight: bold;
                        transition: color 0.3s ease;
                    }
                    
                    .remove-load-btn:hover {
                        color: #000;
                    }
                    
                    .add-load-btn {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 1vw;
                        padding: 1.5vh 2vw;
                        background: #a1c65d;
                        color: white;
                        border: none;
                        border-radius: 0.5vw;
                        font-size: 0.9vw;
                        font-weight: 600;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                        margin-top: 1vh;
                    }
                    
                    .add-load-btn:hover {
                        background: #7a9f38;
                    }
                `}</style>
                <div className="leave-request-header">
                    <h3>Create new leave request</h3>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="leave-request-content">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Start Date</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    ref={startDateRef}
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)} 
                                />
                                <img 
                                    src={calendarIcon} 
                                    alt="Calendar" 
                                    onClick={() => startDateRef.current?.showPicker?.() || startDateRef.current?.focus()}
                                    style={{ 
                                        position: 'absolute', 
                                        right: '1vw', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)', 
                                        height: '2vh', 
                                        cursor: 'pointer',
                                        pointerEvents: 'auto'
                                    }} 
                                />
                            </div>
                        </div>
                        <div className="form-group-checkbox">
                            <input type="checkbox" id="startHalfDay" checked={startHalfDay} onChange={(e) => setStartHalfDay(e.target.checked)} />
                            <label htmlFor="startHalfDay">Half-Day</label>
                        </div>
                        <div className="form-group">
                            <label>End Date</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    ref={endDateRef}
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)} 
                                />
                                <img 
                                    src={calendarIcon} 
                                    alt="Calendar" 
                                    onClick={() => endDateRef.current?.showPicker?.() || endDateRef.current?.focus()}
                                    style={{ 
                                        position: 'absolute', 
                                        right: '1vw', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)', 
                                        height: '2vh', 
                                        cursor: 'pointer',
                                        pointerEvents: 'auto'
                                    }} 
                                />
                            </div>
                        </div>
                         <div className="form-group-checkbox">
                            <input type="checkbox" id="endHalfDay" checked={endHalfDay} onChange={(e) => setEndHalfDay(e.target.checked)} />
                            <label htmlFor="endHalfDay">Half-Day</label>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Number of working days</label>
                            <input type="text" value={workingDays} readOnly />
                        </div>
                        <div className="form-group" style={{ position: 'relative' }}>
                          <label>Leave Type</label>
                          <div
                            className="custom-dropdown"
                            style={{
                              border: '1px solid #ccc',
                              borderRadius: '0.3vw',
                              padding: '1.5vh 1.2vw',
                              fontSize: '1.7vh',
                              background: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              userSelect: 'none',
                              height: '5vh',
                              boxSizing: 'border-box',
                            }}
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                          >
                            <span style={{
                              display: 'inline-block',
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: selectedLeave?.color,
                              marginRight: '1vw',
                              border: '1px solid #eee',
                              flexShrink: 0,
                            }} />
                            <span style={{
                              flex: 1,
                              color: '#333',
                              fontWeight: '500',
                            }}>
                              {selectedLeave?.label}
                            </span>
                            <img src={dropdownIcon} alt="Dropdown" style={{ marginLeft: 'auto', height: '1.2vh', flexShrink: 0 }} />
                          </div>
                          {dropdownOpen && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: '#fff',
                                border: '1px solid #ccc',
                                borderRadius: '0.5vw',
                                zIndex: 10,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                marginTop: 2,
                              }}
                            >
                              {leaveTypes.map(type => (
                                <div
                                  key={type.value}
                                  style={{
                                    padding: '1.2vh 1.2vw',
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    background: leaveType === type.value ? '#f5f5f5' : '#fff',
                                    fontSize: '1.5vh',
                                    borderBottom: type.value !== leaveTypes[leaveTypes.length - 1].value ? '1px solid #f0f0f0' : 'none',
                                  }}
                                  onClick={() => {
                                    setLeaveType(type.value);
                                    setDropdownOpen(false);
                                  }}
                                >
                                  <span style={{
                                    display: 'inline-block',
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    background: type.color,
                                    marginRight: '1vw',
                                    border: '1px solid #eee',
                                    flexShrink: 0,
                                  }} />
                                  <span style={{
                                    flex: 1,
                                    color: '#333',
                                    fontWeight: leaveType === type.value ? '600' : '400',
                                  }}>
                                    {type.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group full-width">
                            <label>Comments</label>
                            <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows="3"></textarea>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group full-width">
                            <label>Load Sharing Faculty</label>
                            <div className="load-adjustment-list">
                                {loadAdjustments.map((load, index) => (
                                    <div key={index} className="load-adjustment-item">
                                        <div className="form-group">
                                            <label>Faculty {index + 1}</label>
                                            <input 
                                                type="text" 
                                                placeholder="Enter faculty name"
                                                value={load.partner} 
                                                onChange={(e) => {
                                                    const newLoadAdjustments = [...loadAdjustments];
                                                    newLoadAdjustments[index] = { ...newLoadAdjustments[index], partner: e.target.value };
                                                    setLoadAdjustments(newLoadAdjustments);
                                                }}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Lecture/Lab Time</label>
                                            <div style={{ display: 'flex', gap: '0.5vw', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3vw' }}>
                                                    <input 
                                                        type="time" 
                                                        step="900"
                                                        pattern="[0-9]{2}:[0-9]{2}"
                                                        value={load.timeFrom} 
                                                        onChange={(e) => {
                                                            const newLoadAdjustments = [...loadAdjustments];
                                                            newLoadAdjustments[index] = { ...newLoadAdjustments[index], timeFrom: e.target.value };
                                                            setLoadAdjustments(newLoadAdjustments);
                                                        }}
                                                    />
                                                    {load.timeFrom && (
                                                        <div style={{
                                                            padding: '0.3vh 0.6vw',
                                                            backgroundColor: '#ffffff',
                                                            borderRadius: '0.2vw',
                                                            border: '1px solid #ccc',
                                                            fontSize: '1.5vh',
                                                            color: '#666',
                                                            fontWeight: '500',
                                                            minWidth: '2.5vw',
                                                            textAlign: 'center'
                                                        }}>
                                                            {new Date(`2000-01-01T${load.timeFrom}`).getHours() >= 12 ? 'PM' : 'AM'}
                                                        </div>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '1.4vh', color: '#666' }}>to</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3vw' }}>
                                                    <input 
                                                        type="time" 
                                                        step="900"
                                                        pattern="[0-9]{2}:[0-9]{2}"
                                                        value={load.timeTo} 
                                                        onChange={(e) => {
                                                            const newLoadAdjustments = [...loadAdjustments];
                                                            newLoadAdjustments[index] = { ...newLoadAdjustments[index], timeTo: e.target.value };
                                                            setLoadAdjustments(newLoadAdjustments);
                                                        }}
                                                    />
                                                    {load.timeTo && (
                                                        <div style={{
                                                            padding: '0.3vh 0.6vw',
                                                            backgroundColor: '#ffffff',
                                                            border: '1px solid #ccc',
                                                            borderRadius: '0.2vw',
                                                            fontSize: '1.5vh',
                                                            color: '#666',  
                                                            fontWeight: '500',
                                                            minWidth: '2.5vw',
                                                            textAlign: 'center'
                                                        }}>
                                                            {new Date(`2000-01-01T${load.timeTo}`).getHours() >= 12 ? 'PM' : 'AM'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Subject/Course</label>
                                            <input 
                                                type="text" 
                                                placeholder="Enter subject or course name"
                                                value={load.subject} 
                                                onChange={(e) => {
                                                    const newLoadAdjustments = [...loadAdjustments];
                                                    newLoadAdjustments[index] = { ...newLoadAdjustments[index], subject: e.target.value };
                                                    setLoadAdjustments(newLoadAdjustments);
                                                }}
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const newLoadAdjustments = loadAdjustments.filter((_, i) => i !== index);
                                                setLoadAdjustments(newLoadAdjustments);
                                            }}
                                            className="remove-load-btn"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={() => setLoadAdjustments([...loadAdjustments, { partner: '', timeFrom: '', timeTo: '', subject: '' }])}
                                    className="add-load-btn"
                                >
                                     Add Load Sharing Faculty
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group full-width">
                            <label>
                                Attach Document (Medical Certificate)
                                {leaveType === 'Medical' && <span style={{ color: '#dc3545', marginLeft: '0.5vw' }}>*</span>}
                            </label>
                            <div className="file-upload-container">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                {!attachedFile ? (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="file-upload-btn"
                                    >
                                        <span>📎</span>
                                        <span>
                                            Choose File (JPG, PNG, PDF - Max 5MB)
                                            {leaveType === 'Medical' && <span style={{ color: '#dc3545', marginLeft: '0.5vw' }}>* Required</span>}
                                        </span>
                                    </button>
                                ) : (
                                    <div className="file-preview">
                                        <div className="file-info">
                                            <span className="file-icon">📄</span>
                                            <span className="file-name">{fileName}</span>
                                            <span className="file-size">
                                                ({(attachedFile.size / 1024 / 1024).toFixed(2)} MB)
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeFile}
                                            className="remove-file-btn"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="leave-request-footer">
                    <button className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button className="btn-save" onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Apply'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApplyLeaveModal;
