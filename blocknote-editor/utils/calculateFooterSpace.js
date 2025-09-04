/**
 * Footer Space Calculator
 * Calculates available space for content considering footer positioning
 */

/**
 * Calculates available space for new content in the current page
 * @param {HTMLElement} editorElement - The editor container element
 * @param {number} pageHeightLimit - Height limit per page (default: 840px)
 * @returns {Object} Space calculation result
 */
export function calculateFooterSpace(editorElement, pageHeightLimit = 840, cursorInfo = null) {
  try {
    // Find the editor container
    const editorContainer = editorElement?.closest('.editor-container') || 
                           document.querySelector('.editor-container');
    
    if (!editorContainer) {
      console.warn('Editor container not found, using default values');
      return {
        availableSpace: pageHeightLimit,
        currentContentHeight: 0,
        footerTop: pageHeightLimit,
        pageHeightLimit,
        hasFooter: false
      };
    }

    // Find the footer container
    const footerContainer = editorContainer.querySelector('.footer-only-container') || 
                           document.querySelector('.footer-only-container');

    // Get the top-level editor (content area)
    const topLevelEditor = editorContainer.querySelector('.ProseMirror.top-level-editor');
    
    if (!topLevelEditor) {
      console.warn('Top-level editor not found');
      return {
        availableSpace: pageHeightLimit,
        currentContentHeight: 0,
        footerTop: pageHeightLimit,
        pageHeightLimit,
        hasFooter: !!footerContainer
      };
    }

    // Calculate current content height
    let currentContentHeight = 0;
    let lastPageBreakHeight = 0;

    // Get all child elements of the editor
    const editorChildren = Array.from(topLevelEditor.children);
    
    for (let i = 0; i < editorChildren.length; i++) {
      const child = editorChildren[i];
      
      // Skip footer-only elements in calculation
      if (child.classList.contains('footer-only-container') || 
          child.closest('.node-footerOnly')) {
        continue;
      }
     
      const style = getComputedStyle(child);
      const marginTop = parseFloat(style.marginTop) || 0;
       console.log("marginTop $$$$",marginTop);
      const marginBottom = parseFloat(style.marginBottom) || 0;
      
      // Calculate effective margin (considering margin collapse)
      let effectiveMarginTop = marginTop;
      if (i > 0) {
        const prevChild = editorChildren[i - 1];
        if (prevChild) {
          const prevStyle = getComputedStyle(prevChild);
          const prevMarginBottom = parseFloat(prevStyle.marginBottom) || 0;
          effectiveMarginTop = Math.max(marginTop, prevMarginBottom) - prevMarginBottom;
        }
      }

      const elementHeight = child.offsetHeight + effectiveMarginTop + marginBottom;

      // Check if this is a page break
      if (child.classList.contains('page-break-container')) {
        // Reset content height after page break
        lastPageBreakHeight = currentContentHeight + elementHeight;
        currentContentHeight = 0;
      } else {
        currentContentHeight += elementHeight;
      }
    }

    // Calculate available space more accurately
    let availableSpace;
    
    // If there are no page breaks, we need to calculate differently
    const pageBreaks = topLevelEditor.querySelectorAll('.page-break-container');
    
    if (pageBreaks.length === 0) {
      // Single page - calculate space based on cursor position
      const allElements = Array.from(topLevelEditor.children).filter(el => 
        !el.classList.contains('footer-only-container') && 
        !el.closest('.node-footerOnly')
      );
      
      if (allElements.length === 0) {
        // Empty page
        availableSpace = pageHeightLimit;
        console.log('📐 Empty page - using full space:', availableSpace);
      } else {
        let referencePosition;
        
        if (cursorInfo && cursorInfo.cursorElement) {
          // Use cursor position to calculate space from that point
          const cursorElementRect = cursorInfo.cursorElement.getBoundingClientRect();
          const editorRect = topLevelEditor.getBoundingClientRect();
          referencePosition = cursorElementRect.top - editorRect.top;
          
          console.log('📐 Cursor-based calculation:', {
            cursorPosition: referencePosition,
            elementTag: cursorInfo.cursorElement.tagName,
            elementText: cursorInfo.cursorElement.textContent?.substring(0, 20) + '...'
          });
        } else {
          // Fallback: use bottom of last element (old behavior)
          const lastElement = allElements[allElements.length - 1];
          const lastElementRect = lastElement.getBoundingClientRect();
          const editorRect = topLevelEditor.getBoundingClientRect();
          referencePosition = lastElementRect.bottom - editorRect.top;
          
          console.log('📐 Fallback to last element calculation');
        }
        
        availableSpace = Math.max(0, pageHeightLimit - referencePosition);
        
        console.log('📐 Single page space calculation:', {
          referencePosition,
          pageHeightLimit,
          availableSpace,
          elementsCount: allElements.length
        });
      }
    } else {
      // Multiple pages - use the traditional calculation
      availableSpace = Math.max(0, pageHeightLimit - currentContentHeight);
      console.log('📐 Multi-page calculation:', { currentContentHeight, availableSpace });
    }

    // Get footer position if it exists
    let footerTop = pageHeightLimit; // Default position
    if (footerContainer) {
      const footerStyle = getComputedStyle(footerContainer);
      const footerTopValue = parseInt(footerStyle.top) || footerTop;
      footerTop = footerTopValue;
    }

    const result = {
      availableSpace,
      currentContentHeight,
      lastPageBreakHeight,
      footerTop,
      pageHeightLimit,
      hasFooter: !!footerContainer,
      totalContentHeight: lastPageBreakHeight + currentContentHeight
    };

    console.log('📐 Footer Space Calculation:', result);
    return result;

  } catch (error) {
    console.error('Error calculating footer space:', error);
    return {
      availableSpace: pageHeightLimit,
      currentContentHeight: 0,
      footerTop: pageHeightLimit,
      pageHeightLimit,
      hasFooter: false,
      error: error.message
    };
  }
}

/**
 * Estimates the height required for text content
 * @param {string} text - Text content to measure
 * @param {HTMLElement} referenceElement - Element to use for styling reference
 * @param {string} elementType - Type of element ('p', 'div', etc.)
 * @returns {number} Estimated height in pixels
 */
export function estimateTextHeight(text, referenceElement = null, elementType = 'p') {
  try {
    // Create a temporary element for measurement
    const tempElement = document.createElement(elementType);
    
    // Copy relevant styles from reference element or use defaults
    if (referenceElement) {
      const referenceStyle = getComputedStyle(referenceElement);
      tempElement.style.fontFamily = referenceStyle.fontFamily;
      tempElement.style.fontSize = referenceStyle.fontSize;
      tempElement.style.lineHeight = referenceStyle.lineHeight;
      tempElement.style.fontWeight = referenceStyle.fontWeight;
      tempElement.style.letterSpacing = referenceStyle.letterSpacing;
      tempElement.style.wordSpacing = referenceStyle.wordSpacing;
      tempElement.style.padding = referenceStyle.padding;
      tempElement.style.margin = referenceStyle.margin;
    } else {
      // Use default editor styles
      tempElement.style.fontFamily = 'Aptos, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto Flex", sans-serif';
      tempElement.style.fontSize = '14px';
      tempElement.style.lineHeight = '1.6';
      tempElement.style.padding = '0px';
      tempElement.style.margin = '0px 0px 16px 0px';
    }

    // Set up measurement container
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    tempElement.style.width = '100%';
    tempElement.style.maxWidth = '100%';
    tempElement.style.left = '-9999px';
    tempElement.style.top = '-9999px';
    tempElement.textContent = text;

    // Get the container width for accurate measurement
    const editorContainer = document.querySelector('.ProseMirror.top-level-editor');
    if (editorContainer) {
      const containerStyle = getComputedStyle(editorContainer);
      const containerWidth = editorContainer.clientWidth - 
                           parseFloat(containerStyle.paddingLeft) - 
                           parseFloat(containerStyle.paddingRight);
      tempElement.style.width = `${containerWidth}px`;
    }

    // Add to DOM, measure, and remove
    document.body.appendChild(tempElement);
    const height = tempElement.offsetHeight;
    document.body.removeChild(tempElement);

    return height;

  } catch (error) {
    console.error('Error estimating text height:', error);
    // Fallback: rough estimation based on character count and typical line height
    const avgCharsPerLine = 80;
    const lineHeight = 24;
    const lines = Math.ceil(text.length / avgCharsPerLine);
    return lines * lineHeight + 16; // Add margin
  }
}

/**
 * Checks if content fits in available space
 * @param {string} content - Content to check
 * @param {number} availableSpace - Available space in pixels
 * @param {HTMLElement} referenceElement - Reference element for styling
 * @param {string} contentType - Type of content ('text', 'html')
 * @returns {boolean} Whether content fits
 */
export function contentFitsInSpace(content, availableSpace, referenceElement = null, contentType = 'text') {
  if (!content || availableSpace <= 0) return false;

  try {
    let estimatedHeight;

    if (contentType === 'html') {
      // For HTML content, create temporary element and measure
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      estimatedHeight = estimateTextHeight(tempDiv.textContent || '', referenceElement, 'div');
    } else {
      // For plain text
      estimatedHeight = estimateTextHeight(content, referenceElement, 'p');
    }

    const fits = estimatedHeight <= availableSpace;
    console.log(`📏 Content fits check: ${estimatedHeight}px <= ${availableSpace}px = ${fits}`);
    
    return fits;

  } catch (error) {
    console.error('Error checking if content fits:', error);
    return false;
  }
}

/**
 * Finds the position in the current page considering page breaks
 * @param {HTMLElement} editorElement - The editor element
 * @returns {Object} Position information
 */
export function getCurrentPagePosition(editorElement) {
  try {
    const editorContainer = editorElement?.closest('.editor-container') || 
                           document.querySelector('.editor-container');
    
    if (!editorContainer) {
      return { isFirstPage: true, pageNumber: 1, lastPageBreakPosition: null };
    }

    const topLevelEditor = editorContainer.querySelector('.ProseMirror.top-level-editor');
    const pageBreaks = topLevelEditor?.querySelectorAll('.page-break-container') || [];
    
    return {
      isFirstPage: pageBreaks.length === 0,
      pageNumber: pageBreaks.length + 1,
      lastPageBreakPosition: pageBreaks.length > 0 ? pageBreaks[pageBreaks.length - 1] : null,
      totalPages: pageBreaks.length + 1
    };

  } catch (error) {
    console.error('Error getting current page position:', error);
    return { isFirstPage: true, pageNumber: 1, lastPageBreakPosition: null };
  }
} 