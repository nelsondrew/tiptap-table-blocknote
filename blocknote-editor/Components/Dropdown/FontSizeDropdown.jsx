import React, {useEffect} from "react";
import "./FontSizeDropdown.less";
import DownArrow from 'src/assets/images/icons/pages-down-arrow.svg';

const fontSizeOptions = [
  { label: "Normal", value: "16px" },
  { label: "Small", value: "14px" },
  { label: "Caption", value: "11px" },
  // { label: "Large", value: "18px" },
  // { label: "Extra Large", value: "24px" },
];

const FontSizeDropdown = ({ cb, isOpen, onToggle, selectedLabel = "Normal", setSelectedLabel }) => {
  const selected = fontSizeOptions.find(opt => {
  return opt.label.toLowerCase() === selectedLabel.toLowerCase();
  }) || fontSizeOptions[0]; // fallback to Normal
  const handleSelect = (option) => {
    setSelectedLabel?.(option.label);
    onToggle?.();
    cb(option.value);
  };

  return (
    <div className="fontsize-dropdown">
      <div className="dropdown-container">
        <button className="dropdown-trigger" onClick={onToggle}>
          <span className="dropdown-label">{selected.label}</span>
          <span className="dropdown-chevron"><DownArrow /></span>
        </button>
  
        <div className={`dropdown-menu ${isOpen ? 'show' : ''}`}>
          {fontSizeOptions.map((option) => (
            <div
              key={option.label}
              className={`dropdown-item ${selected.label === option.label ? "selected" : ""}`}
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default FontSizeDropdown;
/*import React, { useState, useEffect, useRef } from "react";
import "./FontSizeDropdown.less";
import DownArrow from 'src/assets/images/icons/pages-down-arrow.svg';

const fontSizeOptions = [
  { label: "5", value: "5px" },
  { label: "5.5", value: "5.5px" },
  { label: "6.5", value: "6.5px" },
  { label: "7.5", value: "7.5px" },
  { label: "8", value: "8px" },
  { label: "9", value: "9px" },
  { label: "10", value: "10px" },
  { label: "10.5", value: "10.5px" },
  { label: "11", value: "11px" },
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "22", value: "22px" },
  { label: "24", value: "24px" },
  { label: "26", value: "26px" },
  { label: "28", value: "28px" },
  { label: "36", value: "36px" },
  { label: "48", value: "48px" },
  { label: "72", value: "72px" },
];

const FontSizeDropdown = ({ cb, isOpen, onToggle, selectedLabel = 16, setSelectedLabel }) => {
  const [inputValue, setInputValue] = useState(String(selectedLabel));
  const containerRef = useRef();

  useEffect(() => {
    setInputValue(String(selectedLabel));
  }, [selectedLabel]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onToggle?.(false); // close dropdown
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onToggle]);

  const applyFontSize = (label) => {
  const parsed = parseFloat(label);
  if (!isNaN(parsed)) {
    const clamped = Math.max(5, Math.min(parsed, 72));
    setSelectedLabel?.(clamped);
    cb(`${clamped}px`);
    onToggle?.(false);
    setInputValue(String(clamped));
  }
};

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      applyFontSize(inputValue);
    }
  };

  const handleOptionClick = (label) => {
    setInputValue(String(label));
    applyFontSize(label);
  };

  const toggleDropdown = () => {
    onToggle?.(!isOpen);
  };

  return (
    <div className="fontsize-dropdown" ref={containerRef}>
      <div className="dropdown-container">
        <div className="dropdown-trigger" onClick={toggleDropdown}>
          <input
            type="text"
            className="dropdown-label-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          />
          <span className="dropdown-chevron">
            <DownArrow />
          </span>
        </div>

        <div className={`dropdown-menu ${isOpen ? "show" : ""}`}>
          {fontSizeOptions.map((option) => (
            <div
              key={option.label}
              className={`dropdown-item ${String(selectedLabel) === String(option.label) ? "selected" : ""}`}
              onClick={() => handleOptionClick(option.label)}
            >
              {option.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FontSizeDropdown;
*/