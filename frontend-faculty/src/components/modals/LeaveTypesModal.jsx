import React from 'react';

const LeaveTypesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const leaveTypes = [
    { 
      code: "CL", 
      name: "Casual Leave", 
      color: "bg-[#f29222]",
      description: "Short-term leave for personal matters or minor emergencies. Typically used for 1-3 days and requires minimal advance notice."
    },
    { 
      code: "ML", 
      name: "Medical Leave", 
      color: "bg-[#a1c65d]",
      description: "Leave for health-related issues requiring medical attention. May require medical certificates for extended periods."
    },
    { 
      code: "CO", 
      name: "Compensatory Off", 
      color: "bg-[#0cb2af]",
      description: "Time off granted in lieu of extra hours worked or duties performed beyond regular schedule."
    },
    { 
      code: "VL", 
      name: "Vacation Leave", 
      color: "bg-[#fac723]",
      description: "Extended leave for planned vacations or personal time. Usually requires advance planning and approval."
    },
    { 
      code: "OD", 
      name: "On Duty Leave", 
      color: "bg-[#e95e50]",
      description: "Leave for on-duty work or official duties. May be approved retroactively."
    },
    { 
      code: "SL", 
      name: "Special Leave", 
      color: "bg-[#936fac]",
      description: "Leave for special circumstances like family events, religious observances, or other approved special situations."
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-lg rounded-tr-lg rounded-br-lg max-w-3xl w-full max-h-[74vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-[#8C001A]">Leave Types Information</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto flex-1">
          <div className="p-5">
            <div className="grid gap-5">
              {leaveTypes.map(({ code, name, color, description }) => (
                <div key={code} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 text-white flex items-center justify-center font-bold rounded-full text-base flex-shrink-0 ${color}`}>
                    {code}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base text-gray-800 mb-1">{name}</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveTypesModal; 