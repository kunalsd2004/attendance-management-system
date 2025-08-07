import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import actionIcon from "../assets/action.svg";
import viewIcon from "../assets/view.svg";
import editRedIcon from "../assets/edit-red.svg";
import statusActiveIcon from "../assets/status-active.svg";
import statusInactiveIcon from "../assets/status-inactive.svg";
import deleteIcon from "../assets/delete.svg";

const ActionDropdown = ({ onView, onEdit, onDisable, onEnable, onDelete, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        !buttonRef.current?.contains(e.target) &&
        !dropdownRef.current?.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 160; // Approximate height for 4 options
      const dropdownWidth = 120; // Fixed width for action dropdown
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const showBelow = spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove;
      
      // Center the dropdown horizontally on the action icon
      const centerX = rect.left + (rect.width / 2) - (dropdownWidth / 2);
      
      setDropdownPos({
        top: showBelow ? rect.bottom + window.scrollY + 4 : rect.top + window.scrollY - dropdownHeight - 4,
        left: centerX + window.scrollX,
        width: dropdownWidth,
      });
    }
  }, [isOpen]);

  const handleView = () => {
    setIsOpen(false);
    onView?.();
  };

  const handleEdit = () => {
    setIsOpen(false);
    onEdit?.();
  };

  const handleDisable = () => {
    setIsOpen(false);
    onDisable?.();
  };

  const handleEnable = () => {
    setIsOpen(false);
    onEnable?.();
  };

  const handleDelete = () => {
    setIsOpen(false);
    onDelete?.();
  };

  return (
    <div className="action-dropdown-wrapper">
             <button
         ref={buttonRef}
         className="p-2 rounded-lg transition-colors duration-200"
         onClick={(e) => {
           e.stopPropagation();
           setIsOpen(!isOpen);
         }}
       >
         <img src={actionIcon} alt="Actions" className="w-6 h-6" />
       </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="action-dropdown-menu"
            style={{
              position: "absolute",
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              width: `${dropdownPos.width}px`,
              zIndex: 1002,
              backgroundColor: "white",
              border: "1px solid #d0d0d0",
              borderRadius: "4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <button
              onClick={handleView}
              className="action-dropdown-option"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "14px",
                color: "#333",
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
              }}
            >
              <img src={viewIcon} alt="View" className="w-3 h-3" />
              View
            </button>
            <button
              onClick={handleEdit}
              className="action-dropdown-option"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "14px",
                color: "#333",
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
              }}
            >
              <img src={editRedIcon} alt="Edit" className="w-3 h-3" />
              Edit
            </button>
            <button
              onClick={user?.isActive ? handleDisable : handleEnable}
              className="action-dropdown-option"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "14px",
                color: "#333",
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
              }}
                         >
               <img src={user?.isActive ? statusInactiveIcon : statusActiveIcon} alt={user?.isActive ? "Disable" : "Enable"} className="w-3 h-3" />
               {user?.isActive ? "Disable" : "Enable"}
             </button>
            <button
              onClick={handleDelete}
              className="action-dropdown-option"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "14px",
                color: "#333",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
              }}
            >
              <img src={deleteIcon} alt="Delete" className="w-3 h-3" />
              Delete
            </button>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ActionDropdown; 