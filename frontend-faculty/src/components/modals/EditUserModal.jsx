import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import apiService from '../../services/api';
import { FaTimes } from 'react-icons/fa';
import dropdownIcon from '../../assets/dropdown.svg';
import calendarIcon from '../../assets/calendar.svg';

const EditUserModal = ({ user, isOpen, onClose, onUserUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [designationDropdownOpen, setDesignationDropdownOpen] = useState(false);
  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);
  const joiningDateRef = useRef(null);
  const departmentDropdownRef = useRef(null);
  const roleDropdownRef = useRef(null);
  const designationDropdownRef = useRef(null);
  const genderDropdownRef = useRef(null);
  
  const [editForm, setEditForm] = useState({
    sdrn: '',
    email: '',
    firstName: '',
    lastName: '',
    gender: '',
    phoneNumber: '',
    joiningDate: '',
    role: 'faculty',
    designation: '',
    departmentId: '',
  });

  const [departments, setDepartments] = useState([
    { _id: '68936177039e7c73ef542d7b', name: 'Computer Engineering', code: 'CE' },
    { _id: '68936177039e7c73ef542d7c', name: 'Information Technology', code: 'IT' },
    { _id: '68936177039e7c73ef542d7d', name: 'Computer Science Engineering', code: 'CSE' },
    { _id: '68936177039e7c73ef542d7e', name: 'Electronics and Telecommunications', code: 'EXTC' },
    { _id: '68936177039e7c73ef542d7f', name: 'Electronics and Instrumentation', code: 'EI' },
    { _id: '68936177039e7c73ef542d80', name: 'Engineering Sciences', code: 'ES' }
  ]);

  const roles = [
    { value: 'faculty', label: 'Faculty' },
    { value: 'hod', label: 'Head of Department' },
    { value: 'admin', label: 'Admin' },
    { value: 'principal', label: 'Principal' }
  ];

  const designations = [
    { value: 'Assistant Professor', label: 'Assistant Professor' },
    { value: 'Associate Professor', label: 'Associate Professor' },
    { value: 'Professor', label: 'Professor' },
    { value: 'Establishment Section', label: 'Establishment Section' }
  ];

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const departmentDropdown = event.target.closest('[data-dropdown="edit-department"]');
      const roleDropdown = event.target.closest('[data-dropdown="edit-role"]');
      const designationDropdown = event.target.closest('[data-dropdown="edit-designation"]');
      const genderDropdown = event.target.closest('[data-dropdown="edit-gender"]');
      
      if (!departmentDropdown && !roleDropdown && !designationDropdown && !genderDropdown) {
        setDepartmentDropdownOpen(false);
        setRoleDropdownOpen(false);
        setDesignationDropdownOpen(false);
        setGenderDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize form when user data changes
  useEffect(() => {
    if (user) {
      setEditForm({
        sdrn: user.sdrn || '',
        email: user.email ? user.email.replace('@dypatil.edu', '') : '',
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        gender: user.profile?.gender || '',
        phoneNumber: user.profile?.phoneNumber || '',
        joiningDate: user.profile?.joiningDate ? user.profile.joiningDate.split('T')[0] : '',
        role: user.role || 'faculty',
        designation: user.profile?.designation || '',
        departmentId: user.profile?.department?._id || '',
      });
    }
  }, [user]);

  const fetchDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      
      if (response.success) {
        setDepartments(response.data || []);
      } else {
        console.error('Failed to fetch departments:', response.message);
        // Fallback to static departments if API fails
        const staticDepartments = [
          { _id: '68936177039e7c73ef542d7b', name: 'Computer Engineering', code: 'CE' },
          { _id: '68936177039e7c73ef542d7c', name: 'Information Technology', code: 'IT' },
          { _id: '68936177039e7c73ef542d7d', name: 'Computer Science Engineering', code: 'CSE' },
          { _id: '68936177039e7c73ef542d7e', name: 'Electronics and Telecommunications', code: 'EXTC' },
          { _id: '68936177039e7c73ef542d7f', name: 'Electronics and Instrumentation', code: 'EI' },
          { _id: '68936177039e7c73ef542d80', name: 'Engineering Sciences', code: 'ES' }
        ];
        setDepartments(staticDepartments);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Fallback to static departments if API fails
      const staticDepartments = [
        { _id: '68936177039e7c73ef542d7b', name: 'Computer Engineering', code: 'CE' },
        { _id: '68936177039e7c73ef542d7c', name: 'Information Technology', code: 'IT' },
        { _id: '68936177039e7c73ef542d7d', name: 'Computer Science Engineering', code: 'CSE' },
        { _id: '68936177039e7c73ef542d7e', name: 'Electronics and Telecommunications', code: 'EXTC' },
        { _id: '68936177039e7c73ef542d7f', name: 'Electronics and Instrumentation', code: 'EI' },
        { _id: '68936177039e7c73ef542d80', name: 'Engineering Sciences', code: 'ES' }
      ];
      setDepartments(staticDepartments);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const positionDropdown = (dropdownRef, triggerElement) => {
    if (dropdownRef.current && triggerElement) {
      const rect = triggerElement.getBoundingClientRect();
      dropdownRef.current.style.top = `${rect.bottom + 2}px`;
      dropdownRef.current.style.left = `${rect.left}px`;
      dropdownRef.current.style.width = `${rect.width}px`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Ensure email has @dypatil.edu suffix
      const formData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        designation: editForm.designation,
        departmentId: editForm.departmentId,
        role: editForm.role,
        phoneNumber: editForm.phoneNumber,
        gender: editForm.gender,
        joiningDate: editForm.joiningDate,
        email: editForm.email.includes('@dypatil.edu') 
          ? editForm.email 
          : `${editForm.email}@dypatil.edu`,
        sdrn: editForm.sdrn
      };
      
      const response = await apiService.updateUser(user._id, formData);
      if (response && response.success) {
        toast.success('User updated successfully!');
        onUserUpdated(); // Refresh the user list
        onClose();
      } else {
        toast.error(response?.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error updating user: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex min-h-screen items-center justify-center z-50 p-0 m-0 -top-6">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SDRN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SDRN *
              </label>
              <input
                type="text"
                required
                value={editForm.sdrn}
                onChange={(e) => handleInputChange('sdrn', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                style={{ fontSize: '1vw' }}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={editForm.email}
                  onChange={(e) => {
                    let emailValue = e.target.value;
                    // Remove @dypatil.edu if user tries to type it
                    if (emailValue.includes('@dypatil.edu')) {
                      emailValue = emailValue.replace('@dypatil.edu', '');
                    }
                    // Remove any other @domain if user tries to type it
                    if (emailValue.includes('@')) {
                      emailValue = emailValue.split('@')[0];
                    }
                    handleInputChange('email', emailValue);
                  }}
                  placeholder="Enter Email ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent pr-32"
                  style={{ fontSize: '1vw' }}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-md">@dypatil.edu</span>
                </div>
              </div>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={editForm.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                style={{ fontSize: '1vw' }}
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={editForm.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                style={{ fontSize: '1vw' }}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <div className="relative" data-dropdown="edit-gender">
                <div
                  className="custom-dropdown w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#8C001A] focus:border-transparent"
                  style={{
                    fontSize: '1vw',
                    background: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    userSelect: 'none',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  onClick={(e) => {
                    const newState = !genderDropdownOpen;
                    setGenderDropdownOpen(newState);
                    if (newState) {
                      setTimeout(() => positionDropdown(genderDropdownRef, e.currentTarget), 0);
                    }
                  }}
                  tabIndex={0}
                >
                  <span style={{
                    flex: 1,
                    color: '#333',
                    fontWeight: '500',
                  }}>
                    {(() => {
                      const selectedGender = genderOptions.find(gender => gender.value === editForm.gender);
                      return selectedGender ? selectedGender.label : 'Select Gender';
                    })()}
                  </span>
                  <img src={dropdownIcon} alt="Dropdown" style={{ marginLeft: 'auto', height: '1.2vh', flexShrink: 0 }} />
                </div>
                {genderDropdownOpen && (
                  <div
                    ref={genderDropdownRef}
                    style={{
                      position: 'fixed',
                      background: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '0.5vw',
                      zIndex: 9999,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      marginTop: 2,
                    }}
                    className="gender-dropdown"
                  >
                    {genderOptions.map(gender => (
                      <div
                        key={gender.value}
                        style={{
                          padding: '1.2vh 1.2vw',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: editForm.gender === gender.value ? '#f5f5f5' : '#fff',
                          fontSize: '0.9vw',
                          borderBottom: gender.value !== genderOptions[genderOptions.length - 1].value ? '1px solid #f0f0f0' : 'none',
                        }}
                        onClick={() => {
                          handleInputChange('gender', gender.value);
                          setGenderDropdownOpen(false);
                        }}
                      >
                        <span style={{
                          flex: 1,
                          color: '#333',
                          fontWeight: editForm.gender === gender.value ? '600' : '400',
                        }}>
                          {gender.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={editForm.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                style={{ fontSize: '1vw' }}
              />
            </div>

            {/* Joining Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Joining Date *
              </label>
              <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                <input
                  ref={joiningDateRef}
                  type="date"
                  required
                  value={editForm.joiningDate}
                  onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                  style={{ 
                    fontSize: '1vw',
                    paddingRight: '3rem',
                    height: 'auto',
                    lineHeight: 'normal'
                  }}
                />
                <img 
                  src={calendarIcon} 
                  alt="Calendar" 
                  onClick={() => joiningDateRef.current?.showPicker?.() || joiningDateRef.current?.focus()}
                  style={{ 
                    position: 'absolute', 
                    right: '1vw', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    height: '2vh', 
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    zIndex: 10
                  }} 
                />
                <style jsx>{`
                  input[type="date"]::-webkit-calendar-picker-indicator {
                    display: none;
                  }
                  input[type="date"]::-webkit-inner-spin-button,
                  input[type="date"]::-webkit-outer-spin-button {
                    display: none;
                  }
                  input[type="date"]::-webkit-clear-button {
                    display: none;
                  }
                `}</style>
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <div className="relative" data-dropdown="edit-department">
                <div
                  className="custom-dropdown w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#8C001A] focus:border-transparent"
                  style={{
                    fontSize: '1vw',
                    background: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    userSelect: 'none',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                                     onClick={(e) => {
                     const newState = !departmentDropdownOpen;
                     setDepartmentDropdownOpen(newState);
                     if (newState) {
                       setTimeout(() => positionDropdown(departmentDropdownRef, e.currentTarget), 0);
                     }
                   }}
                  tabIndex={0}
                >
                  <span style={{
                    flex: 1,
                    color: '#333',
                    fontWeight: '500',
                  }}>
                    {(() => {
                      const selectedDept = departments.find(dept => dept._id === editForm.departmentId);
                      return selectedDept ? `${selectedDept.name} (${selectedDept.code})` : 'Select Department';
                    })()}
                  </span>
                  <img src={dropdownIcon} alt="Dropdown" style={{ marginLeft: 'auto', height: '1.2vh', flexShrink: 0 }} />
                </div>
                                 {departmentDropdownOpen && (
                   <div
                     ref={departmentDropdownRef}
                     style={{
                       position: 'fixed',
                       background: '#fff',
                       border: '1px solid #ccc',
                       borderRadius: '0.5vw',
                       zIndex: 9999,
                       boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                       marginTop: 2,
                     }}
                     className="department-dropdown"
                   >
                    {departments.map(dept => (
                      <div
                        key={dept._id}
                        style={{
                          padding: '1.2vh 1.2vw',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: editForm.departmentId === dept._id ? '#f5f5f5' : '#fff',
                          fontSize: '0.9vw',
                          borderBottom: dept._id !== departments[departments.length - 1]._id ? '1px solid #f0f0f0' : 'none',
                        }}
                        onClick={() => {
                          handleInputChange('departmentId', dept._id);
                          setDepartmentDropdownOpen(false);
                        }}
                      >
                        <span style={{
                          flex: 1,
                          color: '#333',
                          fontWeight: editForm.departmentId === dept._id ? '600' : '400',
                        }}>
                          {dept.name} ({dept.code})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Designation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation *
              </label>
              <div className="relative" data-dropdown="edit-designation">
                <div
                  className="custom-dropdown w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#8C001A] focus:border-transparent"
                  style={{
                    fontSize: '1vw',
                    background: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    userSelect: 'none',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  onClick={(e) => {
                    const newState = !designationDropdownOpen;
                    setDesignationDropdownOpen(newState);
                    if (newState) {
                      setTimeout(() => positionDropdown(designationDropdownRef, e.currentTarget), 0);
                    }
                  }}
                  tabIndex={0}
                >
                  <span style={{
                    flex: 1,
                    color: '#333',
                    fontWeight: '500',
                  }}>
                    {(() => {
                      const selectedDesignation = designations.find(designation => designation.value === editForm.designation);
                      return selectedDesignation ? selectedDesignation.label : 'Select Designation';
                    })()}
                  </span>
                  <img src={dropdownIcon} alt="Dropdown" style={{ marginLeft: 'auto', height: '1.2vh', flexShrink: 0 }} />
                </div>
                {designationDropdownOpen && (
                  <div
                    ref={designationDropdownRef}
                    style={{
                      position: 'fixed',
                      background: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '0.5vw',
                      zIndex: 9999,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      marginTop: 2,
                    }}
                    className="designation-dropdown"
                  >
                    {designations.map(designation => (
                      <div
                        key={designation.value}
                        style={{
                          padding: '1.2vh 1.2vw',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: editForm.designation === designation.value ? '#f5f5f5' : '#fff',
                          fontSize: '0.9vw',
                          borderBottom: designation.value !== designations[designations.length - 1].value ? '1px solid #f0f0f0' : 'none',
                        }}
                        onClick={() => {
                          handleInputChange('designation', designation.value);
                          setDesignationDropdownOpen(false);
                        }}
                      >
                        <span style={{
                          flex: 1,
                          color: '#333',
                          fontWeight: editForm.designation === designation.value ? '600' : '400',
                        }}>
                          {designation.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <div className="relative" data-dropdown="edit-role">
                <div
                  className="custom-dropdown w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#8C001A] focus:border-transparent"
                  style={{
                    fontSize: '1vw',
                    background: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    userSelect: 'none',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                                     onClick={(e) => {
                     const newState = !roleDropdownOpen;
                     setRoleDropdownOpen(newState);
                     if (newState) {
                       setTimeout(() => positionDropdown(roleDropdownRef, e.currentTarget), 0);
                     }
                   }}
                  tabIndex={0}
                >
                  <span style={{
                    flex: 1,
                    color: '#333',
                    fontWeight: '500',
                  }}>
                    {(() => {
                      const selectedRole = roles.find(role => role.value === editForm.role);
                      return selectedRole ? selectedRole.label : 'Select Role';
                    })()}
                  </span>
                  <img src={dropdownIcon} alt="Dropdown" style={{ marginLeft: 'auto', height: '1.2vh', flexShrink: 0 }} />
                </div>
                                 {roleDropdownOpen && (
                   <div
                     ref={roleDropdownRef}
                     style={{
                       position: 'fixed',
                       background: '#fff',
                       border: '1px solid #ccc',
                       borderRadius: '0.5vw',
                       zIndex: 9999,
                       boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                       marginTop: 2,
                     }}
                     className="role-dropdown"
                   >
                    {roles.map(role => (
                      <div
                        key={role.value}
                        style={{
                          padding: '1.2vh 1.2vw',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: editForm.role === role.value ? '#f5f5f5' : '#fff',
                          fontSize: '0.9vw',
                          borderBottom: role.value !== roles[roles.length - 1].value ? '1px solid #f0f0f0' : 'none',
                        }}
                        onClick={() => {
                          handleInputChange('role', role.value);
                          setRoleDropdownOpen(false);
                        }}
                      >
                        <span style={{
                          flex: 1,
                          color: '#333',
                          fontWeight: editForm.role === role.value ? '600' : '400',
                        }}>
                          {role.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#8C001A] text-white rounded-lg hover:bg-[#6d0c0c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
