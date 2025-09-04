import { useMemo, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import { useSelector } from 'react-redux';

/**
 * Comprehensive cover page detection logic
 * @param {Object} params - Detection parameters
 * @returns {Object} Detection results
 */
function detectCoverPageLogic(params) {
  const { componentId, metadata, dashboardGridChildren, isCoverPage } = params;
    
  // Find the current component's index in the grid
  const currentComponentIndex = dashboardGridChildren.findIndex(
    (item) => item === componentId
  );
  
  // Check if this is the first page (index 0)
  const isFirstPage = currentComponentIndex === 0;
  
  // 1. Check metadata indicators
  const hasCoverImage = metadata?.coverImage;
  const hasCoverBackground = metadata?.slide_color && metadata?.slide_color !== 'transparent';
  const hasPosition = metadata?.position === 'cover';
  
  // 2. Check if this is an actual cover template
  const isActualCoverTemplate = hasCoverImage || hasCoverBackground || hasPosition;
  
  // 3. Check DOM classname for cover page (only if this is the first page)
  const editorElement = isFirstPage ? document.querySelector('.blocknote-editor.cover-page') : null;
  const hasCoverPageClass = !!editorElement;
  
  // 4. Check if this component has cover page data (simplified for performance)
  const hasCoverPageData = false; // We'll rely on the passed isCoverPage prop for this
  
  // 5. More precise check: Must be first page AND have cover indicators, or explicitly marked as cover page
  // Prioritize the explicit isCoverPage flag, then check other indicators
  const isSecureCoverPage = isCoverPage || (isFirstPage && (isActualCoverTemplate || hasCoverPageClass || hasCoverPageData));
  
  const result = {
    isCoverPage: isSecureCoverPage,
    isFirstPage,
    currentComponentIndex,
    hasCoverImage,
    hasCoverBackground,
    hasPosition,
    isActualCoverTemplate,
    hasCoverPageClass,
    hasCoverPageData,
    isSecureCoverPage
  };
  return result;
}

/**
 * Optimized hook for cover page detection with memoization
 * @param {Object} params - Detection parameters
 * @returns {Object} Detection results and onCoverPage flag
 */
export function useCoverPageDetection(params) {
  const { componentId, isCoverPage, editMode } = params;
  
  // Get Redux state inside the hook
  const metadata = useSelector((state) => state?.dashboardInfo?.metadata);
  const dashboardLayout = useSelector((state) => state?.dashboardLayout?.present);
  const dashboardGridChildren = dashboardLayout["GRID_ID"]?.children || [];
  
  // Use ref to cache previous result and prevent alternating values
  const prevResultRef = useRef(null);
  const stableResultRef = useRef(null);
  
  // Memoized cover page detection with stable dependencies
  const coverPageInfo = useMemo(() => {
    try {
      const result = detectCoverPageLogic({
        componentId,
        metadata,
        dashboardGridChildren,
        isCoverPage
      });
      
      
      // Cache the result
      prevResultRef.current = result;
      
      // Reset stable result when component changes
      if (stableResultRef.current && stableResultRef.current.componentId !== componentId) {
        stableResultRef.current = null;
      }
      
      // Store stable result to prevent alternating
      if (stableResultRef.current === null) {
        stableResultRef.current = { ...result, componentId };
      }
      
      // Ensure we always return a valid object
      return result || {
        isCoverPage: false,
        isFirstPage: false,
        currentComponentIndex: -1,
        hasCoverImage: false,
        hasCoverBackground: false,
        hasPosition: false,
        isActualCoverTemplate: false,
        hasCoverPageClass: false,
        hasCoverPageData: false,
        isSecureCoverPage: false
      };
    } catch (error) {
      return {
        isCoverPage: false,
        isFirstPage: false,
        currentComponentIndex: -1,
        hasCoverImage: false,
        hasCoverBackground: false,
        hasPosition: false,
        isActualCoverTemplate: false,
        hasCoverPageClass: false,
        hasCoverPageData: false,
        isSecureCoverPage: false
      };
    }
  }, [componentId, metadata?.coverImage, metadata?.slide_color, metadata?.position, dashboardGridChildren, isCoverPage]);
  
  // Memoized onCoverPage flag with stable caching
  const onCoverPage = useMemo(() => {
    const isSecureCoverPage = coverPageInfo?.isSecureCoverPage || false;
    // For cover page detection, we want to know if we're on a cover page regardless of edit mode
    // The edit mode check should be done at the usage level, not here
    const result = isSecureCoverPage;
    
    // Use stable result to prevent alternating values
    if (stableResultRef.current && stableResultRef.current.isSecureCoverPage !== isSecureCoverPage) {
      return stableResultRef.current.isSecureCoverPage;
    }
    
    // Update stable result if it's null or if we have a definitive result
    if (stableResultRef.current === null || isSecureCoverPage !== stableResultRef.current.isSecureCoverPage) {
      stableResultRef.current = { ...coverPageInfo, isSecureCoverPage };
    }
    
    return result;
  }, [coverPageInfo?.isSecureCoverPage, editMode, componentId, isCoverPage]);
  
  return {
    coverPageInfo,
    onCoverPage
  };
} 