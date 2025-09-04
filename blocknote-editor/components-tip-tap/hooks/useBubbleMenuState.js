import { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { closeAllDropdowns, dispatchBubbleMenuShowEvent } from '../../utils/bubbleMenuHelpers';

/**
 * Custom hook for managing bubble menu state and visibility
 * @param {Object} editor - The TipTap editor instance
 * @returns {Object} - State and handlers for bubble menu
 */
export const useBubbleMenuState = (editor) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const editMode = useSelector((state) => state?.dashboardState?.editMode);
  
  // Use ref to store current editMode for use in shouldShow callback
  const editModeRef = useRef(editMode);
  
  // Update ref when editMode changes
  useEffect(() => {
    editModeRef.current = editMode;
  }, [editMode]);

  // Restore bubble menu visibility when edit mode is active
  useEffect(() => {
    if (editMode) {
      // Force restore bubble menu visibility
      const bubbleMenus = document.querySelectorAll('.ProseMirror-bubble-menu');
      bubbleMenus.forEach(menu => {
        if (menu instanceof HTMLElement) {
          menu.style.display = '';
          menu.style.visibility = '';
          menu.style.opacity = '';
          menu.style.pointerEvents = '';
        }
      });
      
      // Also restore any bubble menu containers
      const bubbleMenuContainers = document.querySelectorAll('.text-bubble-wrapper');
      bubbleMenuContainers.forEach(container => {
        if (container instanceof HTMLElement) {
          container.style.display = '';
          container.style.visibility = '';
          container.style.opacity = '';
        }
      });
    }
  }, [editMode]);

  // Reset activeMenu when bubble menu opens to ensure all dropdowns are closed by default
  const handleBubbleMenuShow = useCallback(() => {
    setActiveMenu(null);  // Always close all dropdowns when bubble menu shows
    closeAllDropdowns();  // Use utility function to close all dropdowns
    dispatchBubbleMenuShowEvent(); // Dispatch global event to notify other bubble menu instances
  }, []);

  // Reset activeMenu when bubble menu is hidden
  const handleBubbleMenuHide = useCallback(() => {
    setActiveMenu(null);
  }, []);

  // Listen for global bubble menu hiding events (like during dashboard save)
  useEffect(() => {
    const handleGlobalBubbleMenuHide = () => {
      setActiveMenu(null);
    };

    // Listen for custom events that might hide bubble menus
    document.addEventListener('hide-bubble-menus', handleGlobalBubbleMenuHide);
    
    // Listen for bubble menu show events to close all dropdowns
    const handleBubbleMenuShowGlobal = () => {
      setActiveMenu(null);
      closeAllDropdowns(); // Use utility function to close all dropdowns
    };
    document.addEventListener('bubble-menu-show', handleBubbleMenuShowGlobal);
    
    return () => {
      document.removeEventListener('hide-bubble-menus', handleGlobalBubbleMenuHide);
      document.removeEventListener('bubble-menu-show', handleBubbleMenuShowGlobal);
    };
  }, []);

  return {
    activeMenu,
    setActiveMenu,
    editModeRef,
    handleBubbleMenuShow,
    handleBubbleMenuHide
  };
}; 