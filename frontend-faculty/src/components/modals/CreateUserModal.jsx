import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import apiService from '../../services/api';
import { FaTimes } from 'react-icons/fa';
import dropdownIcon from '../../assets/dropdown.svg';
import calendarIcon from '../../assets/calendar.svg';
import viewIcon from '../../assets/view.svg';
import passHideIcon from '../../assets/pass-hide.svg';

const CreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
  const [loading, setLoading] = useState(false);
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [designationDropdownOpen, setDesignationDropdownOpen] = useState(false);
  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const joiningDateRef = useRef(null);

  const [createForm, setCreateForm] = useState({
    sdrn: '',
    email: '',
    password: '',
    confirmPassword: '',
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
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const departmentDropdown = event.target.closest('[data-dropdown="department"]');
      const roleDropdown = event.target.closest('[data-dropdown="role"]');
      const designationDropdown = event.target.closest('[data-dropdown="designation"]');
      const genderDropdown = event.target.closest('[data-dropdown="gender"]');
      
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
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCreateForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setCreateForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      sdrn: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      gender: '',
      phoneNumber: '',
      joiningDate: '',
      role: 'faculty',
      designation: '',
      departmentId: '',
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validate password confirmation
    if (createForm.password !== createForm.confirmPassword) {
      toast.error('Password and Confirm Password do not match');
      return;
    }
    
    try {
      setLoading(true);
      
      // Ensure email has @dypatil.edu suffix
      const formData = {
        ...createForm,
        email: createForm.email.includes('@dypatil.edu') 
          ? createForm.email 
          : `${createForm.email}@dypatil.edu`
      };
      
      // Remove confirmPassword from the data sent to API
      delete formData.confirmPassword;
      
      const response = await apiService.createUser(formData);
      if (response && response.success) {
        toast.success('User created successfully!');
        onClose();
        resetCreateForm();
        onUserCreated(); // Refresh the user list
      } else {
        toast.error(response?.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Error creating user: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex min-h-screen items-center justify-center z-50 p-0 m-0 -top-6">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SDRN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SDRN *
              </label>
              <input
                type="text"
                required
                value={createForm.sdrn}
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
                  value={createForm.email}
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
                value={createForm.firstName}
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
                value={createForm.lastName}
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
              <div className="relative" data-dropdown="gender">
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
                  onClick={() => setGenderDropdownOpen(!genderDropdownOpen)}
                  tabIndex={0}
                >
                  <span style={{
                    flex: 1,
                    color: '#333',
                    fontWeight: '500',
                  }}>
                    {(() => {
                      const selectedGender = genderOptions.find(gender => gender.value === createForm.gender);
                      return selectedGender ? selectedGender.label : 'Select Gender';
                    })()}
                  </span>
                  <img src={dropdownIcon} alt="Dropdown" style={{ marginLeft: 'auto', height: '1.2vh', flexShrink: 0 }} />
                </div>
                {genderDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '0.5vw',
                      zIndex: 50,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      marginTop: 2,
                    }}
                  >
                    {genderOptions.map(gender => (
                      <div
                        key={gender.value}
                        style={{
                          padding: '1.2vh 1.2vw',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: createForm.gender === gender.value ? '#f5f5f5' : '#fff',
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
                          fontWeight: createForm.gender === gender.value ? '600' : '400',
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
                value={createForm.phoneNumber}
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
                  value={createForm.joiningDate}
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
              <div className="relative" data-dropdown="department">
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
                  onClick={() => setDepartmentDropdownOpen(!departmentDropdownOpen)}
                  tabIndex={0}
                >
                  <span style={{
                    flex: 1,
                    color: '#333',
                    fontWeight: '500',
                  }}>
                    {(() => {
                      const selectedDept = departments.find(dept => dept._id === createForm.departmentId);
                      return selectedDept ? `${selectedDept.name} (${selectedDept.code})` : 'Select Department';
                    })()}
                  </span>
                  <img src={dropdownIcon} alt="Dropdown" style={{ marginLeft: 'auto', height: '1.2vh', flexShrink: 0 }} />
                </div>
                {departmentDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '0.5vw',
                      zIndex: 50,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      marginTop: 2,
                    }}
                  >
                    {departments.map(dept => (
                      <div
                        key={dept._id}
                        style={{
                          padding: '1.2vh 1.2vw',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: createForm.departmentId === dept._id ? '#f5f5f5' : '#fff',
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
                          fontWeight: createForm.departmentId === dept._id ? '600' : '400',
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
              <div className="relative" data-dropdown="designation">
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
                  onClick={() => setDesignationDropdownOpen(!designationDropdownOpen)}
                  tabIndex={0}
                >
                  <span style={{
                    flex: 1,
                    color: '#333',
                    fontWeight: '500',
                  }}>
                    {(() => {
                      const selectedDesignation = designations.find(designation => designation.value === createForm.designation);
                      return selectedDesignation ? selectedDesignation.label : 'Select Designation';
                    })()}
                  </span>
                  <img src={dropdownIcon} alt="Dropdown" style={{ marginLeft: 'auto', height: '1.2vh', flexShrink: 0 }} />
                </div>
                {designationDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '0.5vw',
                      zIndex: 50,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      marginTop: 2,
                    }}
                  >
                    {designations.map(designation => (
                      <div
                        key={designation.value}
                        style={{
                          padding: '1.2vh 1.2vw',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: createForm.designation === designation.value ? '#f5f5f5' : '#fff',
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
                          fontWeight: createForm.designation === designation.value ? '600' : '400',
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
              <div className="relative" data-dropdown="role">
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
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  tabIndex={0}
                >
                  <span style={{
                    flex: 1,
                    color: '#333',
                    fontWeight: '500',
                  }}>
                    {(() => {
                      const selectedRole = roles.find(role => role.value === createForm.role);
                      return selectedRole ? selectedRole.label : 'Select Role';
                    })()}
                  </span>
                  <img src={dropdownIcon} alt="Dropdown" style={{ marginLeft: 'auto', height: '1.2vh', flexShrink: 0 }} />
                </div>
                {roleDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '0.5vw',
                      zIndex: 50,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      marginTop: 2,
                    }}
                  >
                    {roles.map(role => (
                      <div
                        key={role.value}
                        style={{
                          padding: '1.2vh 1.2vw',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: createForm.role === role.value ? '#f5f5f5' : '#fff',
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
                          fontWeight: createForm.role === role.value ? '600' : '400',
                        }}>
                          {role.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={createForm.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                  style={{ fontSize: '1vw' }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <img 
                    src={showPassword ? viewIcon : passHideIcon} 
                    alt={showPassword ? "Hide password" : "Show password"}
                    className="w-4 h-4"
                    style={{
                      filter: 'brightness(0) saturate(100%) invert(40%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0.7) contrast(1)',
                      transition: 'filter 0.3s ease'
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={createForm.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C001A] focus:border-transparent"
                  style={{ fontSize: '1vw' }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <img 
                    src={showConfirmPassword ? viewIcon : passHideIcon} 
                    alt={showConfirmPassword ? "Hide password" : "Show password"}
                    className="w-4 h-4"
                    style={{
                      filter: 'brightness(0) saturate(100%) invert(40%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0.7) contrast(1)',
                      transition: 'filter 0.3s ease'
                    }}
                  />
                </button>
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
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
