import React from "react";
import "./FontFamilyDropdown.less";
import DownArrow from 'src/assets/images/icons/pages-down-arrow.svg';

const fontFamilyOptions = [
  { label: "Aptos", value: "Aptos" },
  { label: "Aptos Display", value: "'Aptos Display'" },
  { label: "Aptos Light", value: "'Aptos Light'" },
  { label: "Roboto Flex", value: "'Roboto Flex', sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
];

const FontFamilyDropdown = ({ cb, isOpen, onToggle, selectedLabel = "Aptos", setSelectedLabel }) => {
  const selected = fontFamilyOptions.find(opt => opt.label === selectedLabel) || fontFamilyOptions[0]; // fallback to --

  const handleSelect = (option) => {
    setSelectedLabel?.(option.label);
    onToggle?.();
    cb(option.value);
  };

  return (
    <div className="fontfamily-dropdown">
      <div className="dropdown-container">
        <button className="dropdown-trigger" onClick={onToggle}>
          <span className="dropdown-label" style={{ fontFamily: selected.value }}>{selected.label}</span>
          <span className="dropdown-chevron"><DownArrow /></span>
        </button>

        <div className={`dropdown-menu ${isOpen ? 'show' : ''}`}>
          {fontFamilyOptions.map((option) => (
            <div
              key={option.label}
              className={`dropdown-item ${selected.label === option.label ? "selected" : ""}`}
              onMouseDown={() => handleSelect(option)}
              style={{ fontFamily: option.value }}
            >
              {option.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FontFamilyDropdown;
