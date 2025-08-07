
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FaUpload, FaCalendarAlt, FaPlus, FaEye, FaCog } from 'react-icons/fa';
import apiService from '../services/api';
import { toast } from 'react-toastify';
import dropdownIcon from '../assets/dropdown.svg';

const backendBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const SEMESTER_KEY = 'adminSelectedSemester';

const CalendarPage = () => {
  const { user } = useOutletContext();
  const [selectedSemester, setSelectedSemester] = useState(() => {
    return localStorage.getItem(SEMESTER_KEY) || 'even';
  });
  const [currentCalendar, setCurrentCalendar] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [driveLink, setDriveLink] = useState('');

  const [calendarSettings, setCalendarSettings] = useState({
    startMonth: 'January',
    endMonth: 'June',
    year: new Date().getFullYear()
  });
  const [showCalendarSettings, setShowCalendarSettings] = useState(false);
  const [startMonthDropdownOpen, setStartMonthDropdownOpen] = useState(false);
  const [endMonthDropdownOpen, setEndMonthDropdownOpen] = useState(false);

  useEffect(() => {
    fetchCalendar();
    fetchCalendarSettings();
    // eslint-disable-next-line
  }, [selectedSemester]);

  // For non-admin users, always fetch the current semester (even)
  useEffect(() => {
    if (!(user?.role === 'admin' || user?.role === 'principal')) {
      setSelectedSemester('even');
    }
  }, [user?.role]);

  useEffect(() => {
    localStorage.setItem(SEMESTER_KEY, selectedSemester);
  }, [selectedSemester]);

  const fetchCalendar = async () => {
    try {
      const response = await apiService.getCurrentCalendar(selectedSemester);
      if (response.success && response.data.calendar) {
        setCurrentCalendar(response.data.calendar);
      } else {
        setCurrentCalendar(null);
      }
    } catch {
      setCurrentCalendar(null);
    }
  };



  const fetchCalendarSettings = async () => {
    try {
      const response = await apiService.getCalendarSettings();
      if (response.success && response.data) {
        setCalendarSettings(response.data);
      } else {
        console.error('Failed to fetch calendar settings:', response.message);
      }
    } catch (error) {
      console.error('Error fetching calendar settings:', error);
    }
  };

  const handleDriveLinkUpload = async () => {
    if (!driveLink.trim()) {
      toast.error('Please enter a Google Drive link');
      return;
    }

    // Basic validation for Google Drive link
    const driveLinkPattern = /^https:\/\/drive\.google\.com\/(file\/d\/|open\?id=)/;
    if (!driveLinkPattern.test(driveLink.trim())) {
      toast.error('Please provide a valid Google Drive link');
      return;
    }

    setUploading(true);
    try {
      const response = await apiService.uploadCalendar({
        academicYear: '2024-25',
        semester: selectedSemester,
        driveLink: driveLink.trim()
      });
      if (response.success) {
        toast.success('Calendar uploaded successfully!');
        setCurrentCalendar(response.data.calendar);
        setDriveLink('');
        setShowUploadForm(false);
      } else {
        toast.error('Upload failed');
      }
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };



  const handleSaveCalendarSettings = async () => {
    try {
      const response = await apiService.saveCalendarSettings(calendarSettings);
      if (response.success) {
        toast.success('Calendar settings saved successfully!');
        setShowCalendarSettings(false);
        // Refresh the settings
        fetchCalendarSettings();
      } else {
        toast.error('Failed to save calendar settings: ' + response.message);
      }
    } catch (error) {
      console.error('Error saving calendar settings:', error);
      toast.error('Failed to save calendar settings');
    }
  };

  const getPdfUrl = () => {
    if (currentCalendar && currentCalendar.pdfUrl) {
      // If it's already a full URL (Google Drive link), return as is
      if (currentCalendar.pdfUrl.startsWith('http')) {
        return currentCalendar.pdfUrl;
      }
      // If it's a local path, prepend the backend base URL
      if (currentCalendar.pdfUrl.startsWith('/uploads/')) {
        return backendBase + currentCalendar.pdfUrl;
      }
      return currentCalendar.pdfUrl;
    }
    return '';
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Admin Controls */}
      {(user?.role === 'admin' || user?.role === 'establishment') && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-[#8C001A] text-xl">
              <FaCalendarAlt />
            </div>
            <h2 className="font-bold text-lg text-[#1e1e1e]">Calendar Management</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="flex items-center justify-center gap-2 bg-[#8C001A] text-white px-6 py-3 rounded-lg hover:bg-[#6a0015] transition-colors font-medium"
                disabled={uploading}
              >
                <FaUpload />
                {uploading ? 'Uploading...' : 'Upload Calendar'}
              </button>
              {currentCalendar && (
                <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                  <span>✓</span> Calendar uploaded successfully
                </span>
              )}
            </div>
            
            {currentCalendar && currentCalendar.pdfUrl && (
              <button
                className="flex items-center justify-center gap-2 bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                onClick={() => window.open(getPdfUrl(), '_blank')}
              >
                View PDF
              </button>
            )}
          </div>

          {/* Drive Link Upload Form */}
          {showUploadForm && (
            <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Upload Calendar from Google Drive</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please upload your calendar PDF to Google Drive and provide the sharing link below.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Drive Link
                  </label>
                  <input
                    type="url"
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    placeholder="https://drive.google.com/file/d/your-file-id/view"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C001A]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Make sure the Google Drive file is set to "Anyone with the link can view"
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleDriveLinkUpload}
                    disabled={uploading || !driveLink.trim()}
                    className="flex items-center justify-center gap-2 bg-[#8C001A] text-white px-6 py-2 rounded-lg hover:bg-[#6a0015] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaUpload />
                    {uploading ? 'Uploading...' : 'Upload Calendar'}
                  </button>
                  <button
                    onClick={() => {
                      setShowUploadForm(false);
                      setDriveLink('');
                    }}
                    className="flex items-center justify-center gap-2 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PDF Viewer */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        {(user?.role === 'admin' || user?.role === 'establishment') && (
          <div className="flex items-center gap-3 mb-4">
            <div className="text-[#8C001A] text-xl">
              <FaCalendarAlt />
            </div>
            <h2 className="font-bold text-lg text-[#1e1e1e]">Calendar Viewer</h2>
          </div>
        )}
        
        <div className={`w-full border border-gray-200 rounded-lg overflow-hidden ${
          (user?.role === 'admin' || user?.role === 'establishment') ? 'h-[70vh]' : 'h-[69vh]'
        }`}>
          {currentCalendar && currentCalendar.pdfUrl ? (
            <iframe
              src={getPdfUrl()}
              title="Academic Calendar"
              className="w-full h-full"
              frameBorder="0"
              allow="fullscreen"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <FaCalendarAlt className="text-4xl text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium">No calendar uploaded for this semester.</p>
                <p className="text-sm text-gray-400 mt-2">Please upload a Google Drive link to the calendar PDF.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Settings Section - Admin Only */}
      {(user?.role === 'admin' || user?.role === 'establishment') && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="text-[#8C001A] text-xl">
                <FaCog />
              </div>
              <h2 className="font-bold text-lg text-[#1e1e1e]">Calendar Settings</h2>
            </div>
            <button
              onClick={() => setShowCalendarSettings(!showCalendarSettings)}
              className="flex items-center justify-center gap-2 bg-[#8C001A] text-white px-4 py-2 rounded-lg hover:bg-[#6a0015] transition-colors font-medium"
            >
              <FaCog />
              {showCalendarSettings ? 'Hide Settings' : 'Configure Settings'}
            </button>
          </div>

          {/* Calendar Settings Form */}
          {showCalendarSettings && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Configure Calendar Display Period</h3>
              <p className="text-sm text-gray-600 mb-6">
                Set the start and end months for the calendar display. This will control which months are shown 
                to users in the Apply Leave section.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Start Month:</label>
                  <div className="relative">
                    <div
                      className="custom-dropdown"
                      style={{
                        border: '1px solid #ccc',
                        borderRadius: '0.3vw',
                        padding: '1.5vh 1.2vw',
                        fontSize: '1vw',
                        background: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        userSelect: 'none',
                        height: '5vh',
                        boxSizing: 'border-box',
                        minWidth: '200px'
                      }}
                      onClick={() => setStartMonthDropdownOpen(!startMonthDropdownOpen)}
                    >
                      <span style={{
                        flex: 1,
                        color: '#333',
                        fontWeight: '500',
                      }}>
                        {calendarSettings.startMonth}
                      </span>
                      <img src={dropdownIcon} alt="Dropdown" style={{ marginLeft: 'auto', height: '1.2vh', flexShrink: 0 }} />
                    </div>
                    {startMonthDropdownOpen && (
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
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}
                      >
                        {months.map(month => (
                          <div
                            key={month}
                            style={{
                              padding: '1.2vh 1.2vw',
                              cursor: 'pointer',
                              background: calendarSettings.startMonth === month ? '#f5f5f5' : '#fff',
                              fontSize: '0.9vw',
                              borderBottom: month !== months[months.length - 1] ? '1px solid #f0f0f0' : 'none',
                            }}
                            onClick={() => {
                              setCalendarSettings({...calendarSettings, startMonth: month});
                              setStartMonthDropdownOpen(false);
                            }}
                          >
                            <span style={{
                              flex: 1,
                              color: '#333',
                              fontWeight: calendarSettings.startMonth === month ? '600' : '400',
                            }}>
                              {month}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">End Month:</label>
                  <div className="relative">
                    <div
                      className="custom-dropdown"
                      style={{
                        border: '1px solid #ccc',
                        borderRadius: '0.3vw',
                        padding: '1.5vh 1.2vw',
                        fontSize: '1vw',
                        background: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        userSelect: 'none',
                        height: '5vh',
                        boxSizing: 'border-box',
                        minWidth: '200px'
                      }}
                      onClick={() => setEndMonthDropdownOpen(!endMonthDropdownOpen)}
                    >
                      <span style={{
                        flex: 1,
                        color: '#333',
                        fontWeight: '500',
                      }}>
                        {calendarSettings.endMonth}
                      </span>
                      <img src={dropdownIcon} alt="Dropdown" style={{ marginLeft: 'auto', height: '1.2vh', flexShrink: 0 }} />
                    </div>
                    {endMonthDropdownOpen && (
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
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}
                      >
                        {months.map(month => (
                          <div
                            key={month}
                            style={{
                              padding: '1.2vh 1.2vw',
                              cursor: 'pointer',
                              background: calendarSettings.endMonth === month ? '#f5f5f5' : '#fff',
                              fontSize: '0.9vw',
                              borderBottom: month !== months[months.length - 1] ? '1px solid #f0f0f0' : 'none',
                            }}
                            onClick={() => {
                              setCalendarSettings({...calendarSettings, endMonth: month});
                              setEndMonthDropdownOpen(false);
                            }}
                          >
                            <span style={{
                              flex: 1,
                              color: '#333',
                              fontWeight: calendarSettings.endMonth === month ? '600' : '400',
                            }}>
                              {month}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Year:</label>
                  <div
                    style={{
                      border: '1px solid #ccc',
                      borderRadius: '0.3vw',
                      padding: '1.5vh 1.2vw',
                      fontSize: '1vw',
                      background: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      userSelect: 'none',
                      height: '5vh',
                      boxSizing: 'border-box',
                      minWidth: '200px',
                      color: '#666',
                      fontWeight: '500',
                      cursor: 'not-allowed'
                    }}
                  >
                    <span>{calendarSettings.year}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Current Settings Preview</h4>
                <p className="text-sm text-gray-700">
                  Calendar will display from <strong className="text-[#8C001A]">{calendarSettings.startMonth}</strong> to <strong className="text-[#8C001A]">{calendarSettings.endMonth}</strong> 
                  for the year <strong className="text-[#8C001A]">{calendarSettings.year}</strong>.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  This affects what users see in the Apply Leave calendar section.
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSaveCalendarSettings}
                  className="flex items-center justify-center gap-2 bg-[#8C001A] text-white px-6 py-2 rounded-lg hover:bg-[#6a0015] transition-colors font-medium"
                >
                  <FaCog />
                  Save Settings
                </button>
                <button
                  onClick={() => {
                    setShowCalendarSettings(false);
                    fetchCalendarSettings(); // Reset to original values
                  }}
                  className="flex items-center justify-center gap-2 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Current Settings Display */}
          {!showCalendarSettings && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Current Calendar Period</h4>
                  <p className="text-sm text-gray-600">
                    {calendarSettings.startMonth} to {calendarSettings.endMonth} ({calendarSettings.year})
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Click "Configure Settings" to modify
                </div>
              </div>
            </div>
          )}
        </div>
      )}


    </div>
  );
};

export default CalendarPage;
