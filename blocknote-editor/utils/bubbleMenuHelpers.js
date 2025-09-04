/**
 * Common helper function to hide bubble menus
 * This function hides all bubble menus and their containers
 */
export const hideBubbleMenus = () => {
  // Hide ProseMirror bubble menus
  const bubbleMenus = document.querySelectorAll('.ProseMirror-bubble-menu');
  bubbleMenus.forEach(menu => {
    if (menu instanceof HTMLElement) {
      menu.style.display = 'none';
      menu.style.visibility = 'hidden';
      menu.style.opacity = '0';
      menu.style.pointerEvents = 'none';
    }
  });
  
  // Hide text bubble menu containers
  const textBubbleWrappers = document.querySelectorAll('.text-bubble-wrapper');
  textBubbleWrappers.forEach(wrapper => {
    if (wrapper instanceof HTMLElement) {
      wrapper.style.display = 'none';
      wrapper.style.visibility = 'hidden';
      wrapper.style.opacity = '0';
      wrapper.style.pointerEvents = 'none';
    }
  });
  
  // Hide chart bubble menus
  const chartBubbleMenus = document.querySelectorAll('.chart-bubble-menu');
  chartBubbleMenus.forEach(menu => {
    if (menu instanceof HTMLElement) {
      menu.style.display = 'none';
      menu.style.visibility = 'hidden';
      menu.style.opacity = '0';
      menu.style.pointerEvents = 'none';
    }
  });
};

/**
 * Show bubble menus (for edit mode)
 * This function restores bubble menu visibility
 */
export const showBubbleMenus = () => {
  // Show ProseMirror bubble menus
  const bubbleMenus = document.querySelectorAll('.ProseMirror-bubble-menu');
  bubbleMenus.forEach(menu => {
    if (menu instanceof HTMLElement) {
      menu.style.display = '';
      menu.style.visibility = '';
      menu.style.opacity = '';
      menu.style.pointerEvents = '';
    }
  });
  
  // Show text bubble menu containers
  const textBubbleWrappers = document.querySelectorAll('.text-bubble-wrapper');
  textBubbleWrappers.forEach(wrapper => {
    if (wrapper instanceof HTMLElement) {
      wrapper.style.display = '';
      wrapper.style.visibility = '';
      wrapper.style.opacity = '';
      wrapper.style.pointerEvents = '';
    }
  });
  
  // Show chart bubble menus
  const chartBubbleMenus = document.querySelectorAll('.chart-bubble-menu');
  chartBubbleMenus.forEach(menu => {
    if (menu instanceof HTMLElement) {
      menu.style.display = '';
      menu.style.visibility = '';
      menu.style.opacity = '';
      menu.style.pointerEvents = '';
    }
  });
};
/**
 * Close all dropdown menus and popovers
 * This function closes all open dropdowns, color pickers, and tippy dropdowns
 */
export const closeAllDropdowns = () => {
  // Close any open dropdown menus in the DOM
  const openDropdowns = document.querySelectorAll('.dropdown-menu.show, .dropdown-menu-pages.show');
  openDropdowns.forEach(dropdown => {
    if (dropdown instanceof HTMLElement) {
      dropdown.classList.remove('show');
    }
  });

  // Close any open color picker popovers
  const colorPopovers = document.querySelectorAll('.AnimatedPopover');
  colorPopovers.forEach(popover => {
    if (popover instanceof HTMLElement) {
      popover.style.display = 'none';
      popover.style.visibility = 'hidden';
      popover.style.opacity = '0';
    }
  });
  
  // Close any open tippy dropdowns
  const tippyDropdowns = document.querySelectorAll('[data-tippy-root]');
  tippyDropdowns.forEach(dropdown => {
    if (dropdown instanceof HTMLElement) {
      dropdown.style.display = 'none';
      dropdown.style.visibility = 'hidden';
    }
  });
};
/**
 * Dispatch bubble menu show event
 * This function notifies other bubble menu instances to close their dropdowns
 */
export const dispatchBubbleMenuShowEvent = () => {
  const bubbleMenuShowEvent = new CustomEvent('bubble-menu-show', {
    bubbles: true,
    cancelable: true
  });
  document.dispatchEvent(bubbleMenuShowEvent);
};
/**
 * Close all dropdowns and dispatch show event
 * This is a convenience function that combines closeAllDropdowns and dispatchBubbleMenuShowEvent
 */
export const closeAllDropdownsAndNotify = () => {
  closeAllDropdowns();
  dispatchBubbleMenuShowEvent();
};

/**
 * Remove all tippy root elements from the DOM.
 * Use when switching modes to avoid stale dropdowns preventing re-open later.
 */
export const destroyAllTippyDropdowns = () => {
  const tippyRoots = document.querySelectorAll('[data-tippy-root]');
  tippyRoots.forEach(root => {
    if (root instanceof HTMLElement) {
      if (typeof root.remove === 'function') {
        root.remove();
      } else if (root.parentNode && root.parentNode.contains(root)) {
        root.parentNode.removeChild(root);
      }
    }
  });
}; 

// Handle bubble menus and edit mode Ensures no stale menus persist in view mode and bubble menu opens fresh in edit mode.
export const handleBubbleMenusOnEditModeChange = (editMode, editorInstance) => {
  if (editMode) {
    showBubbleMenus();
    closeAllDropdownsAndNotify();
    destroyAllTippyDropdowns();
    const ed = editorInstance;
    if (ed && ed.view && ed.state) {
      ed.view.dispatch(ed.view.state.tr);
    }
  } else {
    destroyAllTippyDropdowns();
    hideBubbleMenus();
    // Dispatch custom event to notify other listeners; guard DOM availability
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const ev = new CustomEvent('hide-bubble-menus', { bubbles: true, cancelable: true });
      document.dispatchEvent(ev);
    }
  }
}; 