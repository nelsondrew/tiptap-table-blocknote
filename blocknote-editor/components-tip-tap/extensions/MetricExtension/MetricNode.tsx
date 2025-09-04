import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import React, { useEffect, useState, useMemo, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'
import { getChartDataRequest } from "../../../../../src/components/Chart/chartAction"

import { format as d3Format } from 'd3-format';
import { customFormat } from 'src/explore/components/controls/DateFilterControl';
import { dashboardInfoChanged } from 'src/dashboard/actions/dashboardInfo'
import { getAssetPrefixUrl } from 'src/utils/HRXUtils'

// Custom Imports

import DndSelectLabel from 'src/explore/components/controls/DndColumnSelectControl'
import AdhocFilter from 'src/explore/components/controls/FilterControl/AdhocFilter'
import AdhocFilterEditPopover from 'src/explore/components/controls/FilterControl/AdhocFilterEditPopover'
import { ListFilterIcon } from 'lucide-react';

// Inline Metric API
import { fetchDatasetMetadata, fetchInlineMetricValue, fetchInlineMetricValueWithFilter } from 'src/utils/pages/inlineMetricAPI';

// Import MetricTooltip component
import MetricTooltip from './MetricTooltip';

// Import refactored ExistingFiltersUI component
import ExistingFiltersUI from './ExistingFiltersUI';

// Global state management for inline metrics
// const MetricFocusContext = createContext<{
//     activeMetricId: string | null;
//     setActiveMetric: (metricId: string | null) => void;
// }>({
//     activeMetricId: null,
//     setActiveMetric: () => {},
// });

// export const useMetricFocus = () => useContext(MetricFocusContext);

// // Provider component to wrap the editor
// export const MetricFocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//     const [activeMetricId, setActiveMetricId] = useState<string | null>(null);
    
//     const setActiveMetric = (metricId: string | null) => {
//         setActiveMetricId(metricId);
//     };
    
//     return (
//         <MetricFocusContext.Provider value={{ activeMetricId, setActiveMetric }}>
//             {children}
//         </MetricFocusContext.Provider>
//     );
// };


const MetricContent = styled.span`
  background: transparent;
  border-radius: 4px;
  padding: 2px 4px;
  color: #2d3748;
  white-space: nowrap;
  display: inline; /* Changed from inline-flex to inline for proper text alignment */
  vertical-align: baseline; /* Ensure proper baseline alignment with text */
  cursor: pointer; /* Always show pointer cursor for all inline metrics */
  font-size: inherit; /* Inherit font size to prevent cursor size changes */
        line-height: inherit; /* Inherit line height to prevent cursor size changes */
  
  .metric-wrapper {
    display: inline-flex; /* Use inline-flex for the wrapper */
    padding: 0 4px;
    justify-content: center;
    align-items: center;
    gap: 4px;
    border-radius: 4px;
    background: transparent; /* No background by default */
    cursor: pointer; /* Always show pointer cursor */
    font-size: inherit; /* Inherit font size */
    line-height: inherit; /* Inherit line height */
    vertical-align: baseline; /* Ensure proper baseline alignment */
    /* max-width: 53px; Maximum width for the content area */
    /* overflow: hidden; Hide overflow content */
    white-space: nowrap; /* Prevent text wrapping */
    
    &:hover {
      cursor: pointer;
      background: var(--Brand-brand-50, #F2FBFB); /* Show background only on hover */
    }
    
    &.adhoc-filter-open {
      display: inline-flex;
      padding: 0 4px;
      justify-content: center;
      align-items: center;
      gap: 4px;

      border-radius: 4px;
      border: 1px solid var(--Brand-brand-500, #00B0B3);
      background: var(--Brand-brand-50, #F2FBFB);
      cursor: pointer; /* Always show pointer cursor */
    }
    
    &.filter-ui-open { // Style when existing filter UI or adhoc filter popover is open
      border-radius: 4px;
      // border: 1px solid var(--Brand-brand-500, #00B0B3);
      background: var(--Brand-brand-50, #F2FBFB);
      cursor: pointer; /* Always show pointer cursor */
    }
    
    &:hover .edit-icon {
      opacity: 1;
    }
    
    &.error { // Style when metric has error
      background: transparent;
      cursor: pointer; /* Always show pointer cursor even for error state */
    }
    
    &.view-mode { // Style for view mode - no background
      background: transparent !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      cursor: pointer; /* Keep pointer for tooltip functionality */
      transition: none !important; /* Disable all transitions */
      
      &:hover {
        cursor: pointer; /* Keep pointer for tooltip functionality */
        background: transparent !important; /* No background on hover in view mode */
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        transform: none !important;
        transition: none !important;
      }
      
      /* Remove edit icon hover in view mode */
      &:hover .edit-icon {
        opacity: 0 !important;
        display: none !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* Ensure no focus effects in view mode */
      &:focus,
      &.focused {
        background: transparent !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        transform: none !important;
        transition: none !important;
      }
    }
    
    /* Remove overflow hidden specifically for (no value) text */
    &:has(.NoValueText),
    &:has(span:contains("(no value)")) {
      overflow: visible !important;
    }
    
    /* Alternative approach for browsers that don't support :has() */
    &.no-value {
      overflow: visible !important;
    }
  }
  
  .pages-inline-metric-value {
    color: var(--Brand-brand-500, #00B0B3);
    font-size: 16px;
    font-style: normal;
    font-weight: 700;
    line-height: 24px; /* 150% */
    position: relative; /* Needed for absolute positioning of popover */
    display: inline-block; /* Ensure proper positioning context */
  }

  .edit-icon {
    width: 12px;
    height: 12px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease;
    display: inline-block;
    
    &:hover {
      opacity: 1;
    }
    
    &.hidden {
      display: none;
    }
    
    &.visible {
      opacity: 1;
    }
  }

  &.loading {
    opacity: 0.7;
  }

  &.error {
    color: var(--Guidance-guidance-alert, #E42121) !important;
    /* font-family: Aptos; */
    font-size: 16px;
    font-style: normal;
    font-weight: 700;
    line-height: 24px; /* 150% */
  }

  /* Only apply focus styles in edit mode (ProseMirror-focused) */
  .ProseMirror-focused &.focused {
    border-radius: 4px;
    background: var(--Brand-brand-50, #F2FBFB);
    max-width: 34px;
    
    .edit-icon {
      display: none !important;
    }
  }
  
  /* Error focused state - only in edit mode */
  .ProseMirror-focused &.error.focused {
    border-radius: 4px;
    border: 1px solid var(--Guidance-guidance-alert, #E42121);
    background: var(--Guidance-guidance-alert-light, #FDF0F0);
    max-width: 77px; /* Keep original width for error metrics */
  }
  
  .pages-inline-metric-value {
    color: var(--Brand-brand-500, #00B0B3);
    font-size: 16px;
    font-style: normal;
    font-weight: 700;
    line-height: 24px; /* 150% */
    
    &.error {
      color: var(--Guidance-guidance-alert, #E42121) !important;
    }
    
  }
`;

const FilterPopoverContainer = styled.div`
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 8px;
    z-index: 10000;
    background: white;
    box-shadow: 0px 1px 4px 1px #00000014;
    border-radius: 6px;
    padding: 16px !important;
    min-width: 320px;
    gap: 8px;
    border-radius: 4px;
    border: 1px solid #F2F2F2;
    padding: 8px;
    
    /* Ensure popover doesn't go outside viewport */
    @media (max-width: 480px) {
        left: 0;
        right: 0;
        transform: none;
        margin-left: auto;
        margin-right: auto;
        max-width: calc(100vw - 32px);
    }
`;

const PortalFilterPopoverContainer = styled.div`
    position: fixed;
    z-index: 10000;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-width: 90vw;
    max-height: 90vh;
    overflow: visible; /* Allow dropdowns to extend outside */
    transform: translateX(-50%);
    padding: 16px;
    
    /* Create a new stacking context but allow children to escape */
    isolation: isolate;
    
    /* Ensure internal content can scroll if needed */
    > div {
        max-height: 85vh;
        overflow-y: auto;
        overflow-x: visible;
    }
    
    /* Ensure dropdowns appear above portal content */
    .ant-select-dropdown,
    .Select-menu-outer,
    .Select-menu,
    .react-select__menu {
        z-index: 10001 !important;
        position: fixed !important;
    }
    
    /* Ensure Select components use document body for dropdown container */
    .ant-select,
    .Select {
        /* Force dropdowns to render in document body */
        position: relative;
    }
    
    /* Fix for react-select specifically */
    .react-select__menu-portal {
        z-index: 10001 !important;
    }
    
    /* Ensure date pickers work properly */
    .ant-picker-dropdown,
    .date-filter-popover {
        z-index: 10001 !important;
    }
    
    /* Tooltip handling within portal */
    .ant-tooltip,
    .tooltip,
    .rc-tooltip {
        z-index: 10003 !important;
    }
    
    /* Ensure tooltips render in document body */
    .ant-tooltip-content {
        z-index: 10003 !important;
    }
`;

const PortalBackdrop = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    background: transparent;
`;

// Global styles for portal dropdowns
const GlobalPortalStyles = `
    /* Ensure all portal-based dropdowns have proper z-index */
    .adhoc-filter-edit-popover-portal {
        /* Set stacking context for the portal */
        isolation: isolate;
    }
    
    /* Ant Design dropdowns */
    .ant-select-dropdown {
        z-index: 10001 !important;
    }
    
    /* React Select dropdowns */
    .react-select__menu {
        z-index: 10001 !important;
    }
    
    /* Legacy Select dropdowns */
    .Select-menu-outer {
        z-index: 10001 !important;
    }
    
    /* Date picker dropdowns */
    .ant-picker-dropdown {
        z-index: 10001 !important;
    }
    
    /* Tooltip and popover adjustments - ensure they appear above everything */
    .ant-tooltip,
    .ant-popover,
    .tooltip,
    .tooltip-inner,
    .rc-tooltip,
    .rc-tooltip-inner {
        z-index: 10003 !important;
    }
    
    /* Specific tooltip adjustments for portal content */
    .adhoc-filter-edit-popover-portal .ant-tooltip,
    .adhoc-filter-edit-popover-portal .tooltip,
    .adhoc-filter-edit-popover-portal .rc-tooltip {
        z-index: 10003 !important;
    }
    
    /* Column option tooltip specific fixes */
    #metric-name-tooltip,
    #metric-type-tooltip {
        z-index: 10003 !important;
    }
    
    /* Ensure tooltip content appears above dropdowns */
    .ant-tooltip-content,
    .tooltip-content,
    .rc-tooltip-content {
        z-index: 10003 !important;
    }
`;

// Inject global styles
if (typeof document !== 'undefined') {
    const styleId = 'portal-dropdown-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = GlobalPortalStyles;
        document.head.appendChild(style);
    }
}

const ExtendedFilterTitle = styled.span`
  font-weight: 500;
  font-size: 12px;
  line-height: 20px;
  color: #000;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ErrorPopover = styled.div`
  display: flex;
  padding: 8px 16px;
  justify-content: flex-end;
  align-items: center;
  align-content: center;
  gap: 16px;
  align-self: stretch;
  flex-wrap: wrap;
  border-radius: 4px;
  background: var(--Guidance-guidance-alert-light, #FDF0F0);
  max-width: 320px;
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  z-index: 10000;
  box-shadow: 0px 1px 4px 1px #00000014;
`;

const ErrorIcon = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--Guidance-guidance-alert, #E42121);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
`;

const ErrorMessage = styled.div`
  color: #333;
  font-size: 14px;
  line-height: 20px;
  flex: 1;
`;

const ShimmerLoader = styled.div`
  width: 50px;
  height: 16px;
  display: inline-block;
  vertical-align: text-bottom;
  border-radius: 4px;
  background: var(--animation-shimmer-gif, url(${getAssetPrefixUrl() + "/static/assets/images/icons/inline-metric-shimmer-loader.gif"}) lightgray 50% / cover no-repeat);
`;

const ErrorMetricWrapper = styled.div`
  color: #e42121;
  display: flex;
  padding: 0; /* Remove padding to match (no value) structure */
  justify-content: space-between; /* Use space-between like (no value) */
  align-items: center;
  gap: 4px; /* This ensures 4px gap between text and icon */
  background: transparent;
  cursor: pointer;
  position: relative;
  width: 69px; /* Fixed width for (Error) text + cross icon */
  height: 24px; /* Match line height */
  transition: all 0.3s ease; /* Smooth transition for all properties including background */
  border-radius: 4px;
  box-sizing: border-box;
  
  span {
    color: var(--Guidance-guidance-alert, #E42121) !important;
    font-size: 16px !important;
    font-style: normal !important;
    font-weight: 700 !important;
    line-height: 24px !important;
    flex-shrink: 0 !important;
  }
  
  &:hover {
    background: var(--Guidance-guidance-alert-light, #FDF0F0);
    
    .delete-icon {
      opacity: 1;
      display: block;
    }
  }
  
  &.focused {
    border-radius: 4px;
    border: 1px solid var(--Guidance-guidance-alert, #E42121);
    background: var(--Guidance-guidance-alert-light, #FDF0F0);
    /* Override any CSS that might change justify-content to center */
    /* justify-content: space-between !important; */
    display: block;
  }
  
  /* View mode specific styling - change to inline display to avoid flexbox spacing issues */
  .view-mode & {
    display: inline !important;
    justify-content: unset !important;
    align-items: unset !important;
    gap: 0 !important;
    width: auto !important;
    min-width: auto !important;
    
    span {
      display: inline !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    .delete-icon {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      flex: 0 0 0 !important;
      position: absolute !important;
      left: -9999px !important;
      opacity: 0 !important;
    }
  }
`;

const DeleteIcon = styled.img`
  display: none;
  width: 16px;
  height: 16px;
  opacity: 0;
  transition: opacity 0.3s ease; /* Smooth transition for icon opacity */
  cursor: pointer;
  flex-shrink: 0; /* Prevent icon from shrinking */
`;

const NoValueText = styled.span`
    color: var(--Grayscale-gray-700, #9C9C9C);
    font-size: 16px;
    font-style: normal;
    font-weight: 700;
    line-height: 24px;
    cursor: pointer; /* Show pointer cursor for no value state */
    width: 92px !important;
    padding: 0;
    display: inline-flex;
    text-align: center;
    white-space: nowrap;
    min-width: 92px !important;
    max-width: 92px !important;
    box-sizing: border-box;
    margin: 0;
    gap: 0;
`;

const ValueMetricWrapper = styled.div`
    display: flex;
    padding: 0;
    justify-content: space-between;
    align-items: center;
    gap: 4px;
    background: transparent;
    cursor: pointer;
    position: relative;
    width: auto; /* Dynamic width that adjusts to content */
    min-width: 50px; /* Minimum width for very short values */
    height: 24px; /* Match line height */
    transition: all 0.3s ease;
    border-radius: 4px;
    box-sizing: border-box;
    
    span, div {
        font-size: 16px !important;
        font-style: normal !important;
        font-weight: 700 !important;
        line-height: 24px !important;
        flex-shrink: 0 !important;
        overflow: visible !important; /* Allow content to be fully visible */
        text-overflow: unset !important; /* Remove ellipsis */
        white-space: nowrap !important;
        min-width: fit-content; /* Ensure text is fully visible */
    }
    
    .edit-icon {
        width: 16px !important;
        height: 16px !important;
        flex-shrink: 0 !important;
    }
    
    &.focused {
        /* Override any CSS that might change justify-content to center */
        /* justify-content: space-between !important; */
        display: block;
    }
    
    /* View mode specific styling - change to inline display to avoid flexbox spacing issues */
    .view-mode & {
        display: inline !important;
        justify-content: unset !important;
        align-items: unset !important;
        gap: 0 !important;
        width: auto !important;
        min-width: auto !important;
        
        span, div {
            display: inline !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        
        .edit-icon {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            flex: 0 0 0 !important;
            position: absolute !important;
            left: -9999px !important;
        }
    }
`;

const NoValueMetricWrapper = styled.div`
    display: flex;
    padding: 0;
    justify-content: space-between;
    align-items: center;
    gap: 4px;
    background: transparent;
    cursor: pointer;
    position: relative;
    width: 92px; /* Fixed width for (no value) text + pencil icon */
    height: 24px; /* Match line height */
    transition: all 0.3s ease;
    border-radius: 4px;
    box-sizing: border-box;
    
    span {
        color: var(--Grayscale-gray-700, #9C9C9C) !important;
        font-size: 16px !important;
        font-style: normal !important;
        font-weight: 700 !important;
        line-height: 24px !important;
        flex-shrink: 0 !important;
        text-align: center !important;
        white-space: nowrap !important;
    }
    
    .edit-icon {
        width: 16px !important;
        height: 16px !important;
        flex-shrink: 0 !important;
    }
    
    /* View mode specific styling - change to inline display to avoid flexbox spacing issues */
    .view-mode & {
        display: inline !important;
        justify-content: unset !important;
        align-items: unset !important;
        gap: 0 !important;
        width: auto !important;
        min-width: auto !important;
        
        span {
            display: inline !important;
            margin: 0 !important;
            padding: 0 !important;
            text-align: left !important; /* Reset text alignment in view mode */
        }
        
        .edit-icon {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            flex: 0 0 0 !important;
            position: absolute !important;
            left: -9999px !important;
        }
    }
`;


const LOADING_STRING = '...';

// Now there will be acutal Metric node , one which calls the chart api 
// and the other one will be just date metric which will get end date or start date



// ============================================================================
// EXISTING FILTERS UI COMPONENT - NOW IMPORTED FROM SEPARATE FILE
// ============================================================================
// The ExistingFiltersUI component has been refactored and moved to:
// ./ExistingFiltersUI.tsx
// 
// This refactoring provides:
// - Clean separation of concerns
// - Reusable styled-components
// - Better maintainability
// - Comprehensive documentation
// - Standard React/TypeScript patterns

const ChartMetric = ({ node, editor, getPos }: { node: any; editor: any; getPos: any }) => {
    const [value, setValue] = useState<string>(LOADING_STRING)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<any>(null)
    const dataMask = useSelector((state) => state?.dataMask)
    const charts = useSelector((state) => state?.charts)
    const nativeFilters = useSelector((state) => {
        return state?.nativeFilters?.filters || {}
    });
    const metadata = useSelector(state => state?.dashboardInfo?.metadata);
    
    // Get inlineMetricsData from Redux state - moved to top to avoid initialization error
    const inlineMetricsData = useSelector((state: any) => 
        state?.dashboardInfo?.metadata?.inlineMetricsData || {}
    );
    
    const triggerQuery = useRef(false);
    const nodeMetric = node?.attrs?.metric;
    const dispatch = useDispatch();

    // Floating Filter
    const metricSpanRef = useRef<HTMLSpanElement>(null);
    const [canRender, setCanRender] = useState(false);

    const [showFilterPopover, setShowFilterPopover] = useState(false);
    const [showAdhocEditor, setShowAdhocEditor] = useState(false);
    const [datasource, setDatasource] = useState<any>(null);
    const [isAdhocFilterOpen, setIsAdhocFilterOpen] = useState(false);
    const [editingFilter, setEditingFilter] = useState<AdhocFilter | null>(null);
    const [isErrorFocused, setIsErrorFocused] = useState(false);
    const [isMetricFocused, setIsMetricFocused] = useState(false);
    
    // Portal positioning state
    const [portalPosition, setPortalPosition] = useState({ top: 0, left: 0 });
    const portalRef = useRef<HTMLDivElement | null>(null);
    const instanceIdRef = useRef<string | null>(null);

    useEffect(() => {
        setCanRender(true);
    }, []);

    // Create portal container for the popover
    useEffect(() => {
        if (!portalRef.current) {
            portalRef.current = document.createElement('div');
            portalRef.current.style.position = 'absolute';
            portalRef.current.style.top = '0';
            portalRef.current.style.left = '0';
            portalRef.current.style.pointerEvents = 'none';
            portalRef.current.style.zIndex = '10000';
            portalRef.current.setAttribute('data-portal', 'adhoc-filter-popover');
            document.body.appendChild(portalRef.current);
        }

        return () => {
            if (portalRef.current && document.body.contains(portalRef.current)) {
                document.body.removeChild(portalRef.current);
                portalRef.current = null;
            }
        };
    }, []);

    // Calculate portal position when popover is shown
    const updatePortalPosition = () => {
        if (metricSpanRef.current) {
            const rect = metricSpanRef.current.getBoundingClientRect();
            setPortalPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX + (rect.width / 2)
            });
        }
    };

    // Update portal position when showAdhocEditor changes
    useEffect(() => {
        if (showAdhocEditor) {
            updatePortalPosition();
            // Update position on scroll and resize
            const handlePositionUpdate = () => updatePortalPosition();
            
            // Handle Escape key to close popover
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    setShowAdhocEditor(false);
                    setEditingFilter(null);
                }
            };
            
            window.addEventListener('scroll', handlePositionUpdate, true);
            window.addEventListener('resize', handlePositionUpdate);
            document.addEventListener('keydown', handleKeyDown);
            
            return () => {
                window.removeEventListener('scroll', handlePositionUpdate, true);
                window.removeEventListener('resize', handlePositionUpdate);
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [showAdhocEditor]);


    // Listen for events to close popovers when other metrics are clicked
    useEffect(() => {
        const handleCloseOtherMetricPopovers = (event: CustomEvent) => {
            const { activeMetricId, sourceMetricId } = event.detail;
            
            // If this metric is not the active one, close all its popovers
            if (activeMetricId && activeMetricId !== instanceIdRef.current && sourceMetricId !== instanceIdRef.current) {
                // Close all popovers
                setIsAdhocFilterOpen(false);
                setShowAdhocEditor(false);
                setEditingFilter(null);
                
                // Reset focus states
                setIsMetricFocused(false);
                setIsErrorFocused(false);
            }
        };

        // Listen for the custom event
        document.addEventListener('closeOtherMetricPopovers', handleCloseOtherMetricPopovers as EventListener);
        
        return () => {
            document.removeEventListener('closeOtherMetricPopovers', handleCloseOtherMetricPopovers as EventListener);
        };
    }, []); // Empty dependency array since we're using the ref

    // Debug editor state
    useEffect(() => {
        // console.log('Editor state debug:', {
        //     editor: !!editor,
        //     isEditable: editor?.isEditable,
        //     editorCommands: !!editor?.commands,
        //     editorState: editor?.state
        // });
    }, [editor]);








    // Old: static data implementation
    // const nodeDatasetId = useSelector((state) => {
    // const nodeId = node?.attrs?.id;
    // const inlineMetricsData = state?.dashboardInfo?.metadata?.inlineMetricsData?.metrics || [];
    //     const metricsIndex = inlineMetricsData.findIndex((item) => item?.id === nodeId);
    //     if(metricsIndex !== -1) {
    //         return inlineMetricsData[metricsIndex]?.datasetId
    //     }
    //     return node?.attrs?.datasetId
    // })

    // New: dynamic data implementation
    const nodeDatasetId = useSelector((state) => {
        const nodeId = node?.attrs?.id;
        const metricListObject = state?.metricList?.totalMetricsList;

        const metricsArray = Array.isArray(metricListObject)
            ? metricListObject
            : Array.isArray(metricListObject?.result)
                ? metricListObject.result
                : Object.values(metricListObject || {});

        const matchedMetric = metricsArray.find(item => item?.id === nodeId);

        return matchedMetric?.datasetId || node?.attrs?.datasetId;
    });

    const nodeUuid = node?.attrs?.uuid;
    const nodeInstanceId = node?.attrs?.instanceId;

    // Update the ref whenever nodeInstanceId changes
    useEffect(() => {
        instanceIdRef.current = nodeInstanceId;
    }, [nodeInstanceId]);

    const sliceId = useSelector((state) => {
        const chartEntries = Object.values(state?.charts || {});
        for (const entry of chartEntries) {
            if (entry?.latestQueryFormData?.metric?.includes(node?.attrs?.metric)) {
                return entry.form_data?.slice_id;
            }
        }
        return 118; // fallback
    });


    // Local Filter implementation:
    const dataset = useSelector((state: any) => {
        const datasetMap = state?.datasets; // top-level datasets reducer
        const datasetId = nodeDatasetId; // assumed to be in scope
        return datasetMap?.[datasetId] || {};
    });

    // useSelector(state => console.log("whole state is: ", state));

    // const datasource = {
    //     ...dataset,
    //     id: nodeDatasetId,
    //     type: 'table',
    // };

    // columns and metrics available under dataset
    // const datasetMetadata = useSelector((state: any) => state?.datasource?.metadata_by_id?.[nodeDatasetId]);

    const [options, setOptions] = useState([]);

    useEffect(() => {
        const fetchColumnsAndMetrics = async () => {
            if (!nodeDatasetId) return;

            try {
                const result = await fetchDatasetMetadata(nodeDatasetId);
                const cols =result.dataset.columns || [];
                setDatasource(result.dataset);
                // const mets = result.dataset.metrics || [];
                cols.sort(
                    (a: any, b: any) =>
                    (a.saved_metric_name || a.column_name || a.label)?.localeCompare(
                        b.saved_metric_name || b.column_name || b.label || '',
                    ) ?? 0,
                );
                setOptions([...cols]);
            } catch (err) {
                console.error("Failed to fetch dataset metadata", err);
            }
        };

        fetchColumnsAndMetrics();
    }, [nodeDatasetId]);




    // console.log("dataset: ", dataset);
    // console.log("options: ", options)



    const relevantFilters = useMemo(() => {
        const adhocFilters = []
        const filtersObj = {
            filters: [],
        }

        Object.entries(dataMask || {}).forEach(([filterId, dataMaskFilterData]) => {
            if (filterId.startsWith('NATIVE_FILTER') && nativeFilters.hasOwnProperty(filterId)) {
                const filterData = nativeFilters[filterId];
                const targets = filterData?.targets || [];
                const filterType = filterData?.filterType;
                const hasMatchingDataset = targets.some(
                    target => target?.datasetId === nodeDatasetId && target?.column?.name
                )
                if (filterType === "filter_time") {
                    const filterValue = dataMaskFilterData?.extraFormData?.time_range;
                    if (filterValue) {
                        filtersObj['time__range'] = filterValue;
                    }
                } else {
                    const filterValue = dataMaskFilterData?.extraFormData?.filters || []
                    if (hasMatchingDataset && Array.isArray(filterValue) && filterValue?.length > 0) {
                        adhocFilters.push(filterValue[0])
                    }
                }

            } else {
                const chartId = filterId;
                const formData = charts[chartId]?.form_data;
                if (formData?.datasource) {
                    const [datasetId] = formData.datasource.split('__')

                    if (parseInt(datasetId) === nodeDatasetId) {
                        const chartFilters = dataMask[chartId]?.extraFormData?.filters || []

                        if (Array.isArray(chartFilters) && chartFilters.length > 0) {
                            chartFilters.forEach(filter => {
                                if (filter.col && filter.op && Array.isArray(filter.val)) {
                                    adhocFilters.push(filter)
                                }
                            })
                        }
                    }
                }
            }
        })
        
        // Add inline metric filters from the current metric's payload
        // if (nodeInstanceId && inlineMetricsData[nodeInstanceId]?.payload) {
        //     const metricPayload = inlineMetricsData[nodeInstanceId].payload;
            
        //     // Add adhoc filters from the metric payload
        //     if (metricPayload.form_data && metricPayload.form_data.adhoc_filters) {
        //         adhocFilters.push(...metricPayload.form_data.adhoc_filters);
        //     }
            
        //     // Add filters from the metric payload
        //     if (metricPayload.filters && Array.isArray(metricPayload.filters)) {
        //         adhocFilters.push(...metricPayload.filters);
        //     }
        // }
        
        filtersObj.filters = adhocFilters; // update filters based on user interaction

        return filtersObj;
    }, [dataMask, charts, nodeInstanceId]);

    const formData = useMemo(() => ({
        //`${nodeDatasetId}__table`,
        // datasource: {
        //     id: nodeDatasetId,
        //     type: 'table',
        // },
        // viz_type: "big_number_total",
        // slice_id: sliceId,
        // url_params: {
        //     slice_id: sliceId
        // },
        // metric: nodeMetric ? [nodeMetric] : [], // updates the data type to be an array
        // extra_form_data: relevantFilters,
        // uuid: nodeUuid,
        // subheader: "",
        // header_font_size: 0.4,
        // subheader_font_size: 0.125,
        // y_axis_format: "SMART_NUMBER",
        // time_format: "smart_date",
        // force: false,
        // result_format: "json",
        // result_type: "full"

    }), [relevantFilters]);

    // useEffect(() => {
    //     const fetchMetricData = async () => {
    //         if (triggerQuery.current) return;
    //         triggerQuery.current = true;
    //         setIsLoading(true)
    //         setValue(LOADING_STRING);
    //         setError(null)

    //         const formData = {
    //             datasource: {
    //                 id: nodeDatasetId,
    //                 type: 'table',
    //             },
    //             force: true,
    //             queries: [
    //                 {
    //                     metrics: [nodeMetric],
    //                 },
    //             ],
    //             form_data: {
    //                 datasource: `${nodeDatasetId}__table`,
    //                 inline_metric: true,
    //             },
    //         }

    //         try {
    //             const { response, json } = await getChartDataRequest({
    //                 // formData,
    //                 // force: false,
    //                 // ownState: {},
    //                 formData,
    //             })


    //             const result = 'result' in json ? json.result[0] : json

    //             if (response.status === 200 && Array.isArray(result.data) && result.data.length > 0) {
    //                 setValue(result.data[0][nodeMetric])
    //                 setIsLoading(false)
    //                 triggerQuery.current = false;


    //             } else if (response.status === 202) {
    //                 setIsLoading(false)
    //                 triggerQuery.current = false;

    //             } else {
    //                 throw new Error(
    //                     `Received unexpected response status (${response.status}) while fetching chart data`,
    //                 )
    //             }

    //         } catch (error: any) {
    //             setError(error)
    //             setIsLoading(false)
    //             setValue('Error')
    //             triggerQuery.current = false;
    //         }
    //     }

    //     fetchMetricData()
    // }, [nodeUuid, node.attrs.id, formData])

    useEffect(() => {
        const fetchMetric = async () => {
            if (triggerQuery.current) return;
            triggerQuery.current = true;
            setIsLoading(true);
            setError(null);

            // console.log("relevantFilters: ", relevantFilters);
            // console.log("nodeMetric: ", nodeMetric);
            // console.log("nodeDatasetId: ", nodeDatasetId);
            

            try {
                let result;
                
                // Check if we have a stored payload with filters
                if (nodeInstanceId && inlineMetricsData[nodeInstanceId]?.payload) {
                    const storedPayload = inlineMetricsData[nodeInstanceId].payload;

                   const updatedPayloadData =  removeDuplicateAndAddOtherGlobalFilter(relevantFilters, storedPayload)
                    
                    // If the stored payload has filters, use fetchInlineMetricValueWithFilter
                    if (updatedPayloadData) {
                        result = await fetchInlineMetricValueWithFilter(updatedPayloadData, nodeMetric);
                    } else {
                        // No filters in stored payload, use basic fetch
                        result = await fetchInlineMetricValue({
                            datasetId: nodeDatasetId,
                            metric: nodeMetric,
                            filters: [relevantFilters],
                        });
                    }
                } else {
                    // No stored payload, use basic fetch
                    result = await fetchInlineMetricValue({
                        datasetId: nodeDatasetId,
                        metric: nodeMetric,
                        filters: [relevantFilters],
                    });
                }

                // console.log("result: ", result);

                if (result !== null) {
                    setValue(result);
                    // Clear error state since we now have a valid value
                    setError(null);
                } else {
                    setValue(null); // Set to null so formatMetricValue can display "(no value)"
                    // Clear error state since we now have a valid response (even if null)
                    setError(null);
                }
            } catch (err) {
                console.error('Metric fetch failed:', err);
                setValue('Error');
                setError(err);
            } finally {
                setIsLoading(false);
                triggerQuery.current = false;
                //setError(true);// Make setError(true) to test error state
                //setValue(null); // setting to null to test (no value) scenario
                //setValue('100'); // Setting to 100 to test the value
            }
        };

        fetchMetric();
    }, [nodeInstanceId, node.attrs.id, relevantFilters]);


    const siFormatter = d3Format(`.3~s`);
    const float2PointFormatter = d3Format(`.2~f`);
    const float4PointFormatter = d3Format(`.4~f`);

    const customSequoiaSiFormatter = (v: number) => {
        if (Math.abs(v) >= 1e12) {
            return `${(v / 1e12).toFixed(2)}T`;
        } if (Math.abs(v) >= 1e9) {
            return `${(v / 1e9).toFixed(2)}B`;
        } if (Math.abs(v) >= 1e6) {
            return `${(v / 1e6).toFixed(2)}M`;
        } if (Math.abs(v) >= 1e3) {
            return `${(v / 1e3).toFixed(2)}k`;
        }
        return v.toString();
    };

    function formatValue(value: number) {
        if (value === 0) {
            return '0';
        }
        const absoluteValue = Math.abs(value);
        if (absoluteValue >= 1000) {
            // Normal human being are more familiar
            // with billion (B) that giga (G)
            // return siFormatter(value).replace('G', 'B');
            return `$${customSequoiaSiFormatter(value)}`;
        }
        if (absoluteValue >= 1) {
            return `${float2PointFormatter(value)}`;
        }
        if (absoluteValue >= 0.001) {
            if (absoluteValue < 1) {
                return `${float2PointFormatter(value * 100)}`;
            }
            return `${float4PointFormatter(value)}`;
        }
        if (absoluteValue > 0.000001) {
            return `${siFormatter(value * 1000000)}µ`;
        }
        return `$${siFormatter(value)}`;
    }

    const convertValueToNumber = (str: string | number) => {
        if (str === null || str === undefined) return null;
        if (typeof str === 'number') return str;

        const cleanedStr = str.trim().replace(/,/g, '');
        const num = Number(cleanedStr);

        // console.log("num: ", num);
        // console.log("cleanedStr: ", cleanedStr);

        if (isNaN(num)) {
            return LOADING_STRING;
        } else {
            return num;
        }
    };

    /**
     * Formats the metric value for display, handling null values
     */
    const formatMetricValue = (value: string | number) => {
        const convertedValue = convertValueToNumber(value);
        
        // Handle null values from API
        if (convertedValue === null) {
            return {
                displayValue: '(no value)',
                isNullValue: true
            };
        }
        
        // Handle loading state - return empty string since we use shimmer loader
        if (convertedValue === LOADING_STRING) {
            return {
                displayValue: '',
                isNullValue: false
            };
        }
        
        // Handle normal values
        return {
            displayValue: formatValue(convertedValue),
            isNullValue: false
        };
    };

    // Custom SQL Filter
    const adhocFilter = useMemo(() => {
        // If we're editing a specific filter, use that
        if (editingFilter) {
            return editingFilter;
        }

        const defaultFilter = new AdhocFilter({
            expressionType: 'SIMPLE',
            clause: 'WHERE',
            subject: undefined,
            operator: undefined,
            comparator: '',
        });

        const matchedFilter = relevantFilters.filters?.find(
            f => f?.subject === nodeMetric && f?.expressionType === 'SIMPLE',
        );

        return matchedFilter
            ? new AdhocFilter({ ...matchedFilter })
            : defaultFilter;
    }, [nodeMetric, relevantFilters.filters, editingFilter]);

    const resetQueryFilters = (currentPayloadData: any) => {
        let currentQueriesData = currentPayloadData.queries[0]
        currentQueriesData.filters = []
        currentQueriesData.extras.where = ''
        currentQueriesData.extras.having = ''
    }

    const getQueryFilterFromAdhocFilter = (newFilter: any, currentPayloadData: any) => {
        let currentQueriesData = currentPayloadData.queries[0]
        let queryFilterObj: any = {}
        if(newFilter.expressionType === 'SIMPLE') {
            queryFilterObj["col"] = newFilter.subject;
            queryFilterObj["op"] = newFilter.operator;
            queryFilterObj["val"] = newFilter.comparator;
            currentQueriesData.filters.push(queryFilterObj)
        } else {
            if(newFilter.clause === 'HAVING') {
                if(currentQueriesData.extras.having) {
                    currentQueriesData.extras.having += `AND (${newFilter.sqlExpression})`
                } else {
                    currentQueriesData.extras.having += `(${newFilter.sqlExpression})`
                }
            } else if(newFilter.clause === 'WHERE') {
                if(currentQueriesData.extras.where) {
                    currentQueriesData.extras.where += `AND (${newFilter.sqlExpression})`
                } else {
                    currentQueriesData.extras.where += `(${newFilter.sqlExpression})`
                }
            }
        }
    }

    const checkAndAddGlobalTimeRange = (timeValue: any, currentPayloadDataExisting: any) => {
        let currentPayloadData = structuredClone(currentPayloadDataExisting)
        let currentMetricData = inlineMetricsData[nodeInstanceId]
        let currentPayloadDataQueries = currentPayloadData.queries[0]
        let currentFormData = currentPayloadData.form_data
        let {granularity, adhoc_temporal_column} = currentMetricData
        let existingQueriesTemporalCols = currentPayloadData.queries[0].filters.reduce((acc, ele, index) => {
            if(ele.op === "TEMPORAL_RANGE") {
                if(!acc[ele.col]) {
                     acc[ele.col] = index;
                } else {
                    acc[ele.col] = `${acc[ele.col]},${index}`
                }
            }
            return acc;
        }, {})
        if(granularity) {
            currentPayloadDataQueries.granularity = granularity;
            currentPayloadDataQueries.time_range = timeValue;
        } else if(adhoc_temporal_column) {
            let splittedTemporalCols = adhoc_temporal_column.split(',')
            splittedTemporalCols.map((ele) => {
                if(existingQueriesTemporalCols[ele] == undefined) {
                    let temporalColElement = {
                        col: ele,
                        op: "TEMPORAL_RANGE",
                        val: timeValue
                    }
                    currentPayloadDataQueries.filters.push(temporalColElement)
                    let temporalAdhocFilter = new AdhocFilter({
                        expressionType: 'SIMPLE',
                        clause: 'WHERE',
                        subject: ele,
                        operator: "TEMPORAL_RANGE",
                        comparator: timeValue,
                    });
                    currentFormData.adhoc_filters.push(temporalAdhocFilter)
                }
            })
        }
        return currentPayloadData;
    }

    const removeDuplicateAndAddOtherGlobalFilter = (globalFilters: any, currentPayloadData1: any) => {
        let currentPayloadData = structuredClone(currentPayloadData1)
        let globalFilterArray = globalFilters.filters
        let currentPayloadDataQueries = currentPayloadData.queries[0]
        let currentLocalFilterColNames = currentPayloadDataQueries.filters.map(ele => ele.col)
        if(globalFilterArray.length > 0) {
            globalFilterArray.map((globalFilter: any, index: number) => {
                if(!currentLocalFilterColNames.includes(globalFilter.col)) {
                    currentPayloadDataQueries.filters.push(globalFilter)
                }
            })
        }
        if(globalFilters.time__range) {
             currentPayloadData = checkAndAddGlobalTimeRange(globalFilters.time__range, currentPayloadData)
        }
        return currentPayloadData;
    }

    // When any of filter is edited and saved, create queryfilters newly
    const getQueryFilterFromAdhocFilterComplete = (currentPayloadData: any) => {
        let adhoc_filters = currentPayloadData.form_data?.adhoc_filters;
        resetQueryFilters(currentPayloadData)
        adhoc_filters.map((ele) => {
            getQueryFilterFromAdhocFilter(ele, currentPayloadData)
        })
    }

    const updateReduxAndReTriggerApiCall = async (newFilter: any) => {
        if (!nodeInstanceId || !inlineMetricsData[nodeInstanceId]) {
            return;
        }
        let currentPayloadData = inlineMetricsData[nodeInstanceId].payload;
        
        // Only add the filter to form_data.adhoc_filters, not to queries[0].filters
        // The API call will handle the proper conversion
        if(!editingFilter) {
            if(currentPayloadData?.form_data?.adhoc_filters) {
                currentPayloadData.form_data.adhoc_filters.push(newFilter)
            }
            // Remove the call to getQueryFilterFromAdhocFilter to prevent duplicate addition
            getQueryFilterFromAdhocFilter(newFilter, currentPayloadData)
            
        } else {
            let currentFilterIndex =  editingFilter.adhocFilterIndex;
            if(currentFilterIndex >= 0) {
                currentPayloadData.form_data.adhoc_filters[currentFilterIndex] = newFilter;
                getQueryFilterFromAdhocFilterComplete(currentPayloadData)
            }
        }

        const updatedInlineMetrics = {
            ...inlineMetricsData,
            [nodeInstanceId]: {
                ...inlineMetricsData[nodeInstanceId],
                payload: currentPayloadData
            },
        };

        dispatch(
            dashboardInfoChanged({
                metadata: {
                    ...metadata,
                    inlineMetricsData: updatedInlineMetrics,
                },
            }),
        );
        // Added current global filters before calling the API
       const updatedCurrentPayloadData = removeDuplicateAndAddOtherGlobalFilter(relevantFilters, currentPayloadData)
        
        // Show loading shimmer while fetching updated metric value
        setIsLoading(true);
        
        try {
            const result = await fetchInlineMetricValueWithFilter(updatedCurrentPayloadData, nodeMetric)
            if (result !== null) {
                setValue(result);
                // Clear error state since we now have a valid value
                setError(null);
            } else {
                setValue(null); // Set to null so formatMetricValue can display "(no value)"
                // Clear error state since we now have a valid response (even if null)
                setError(null);
            }
        } catch (err) {
            console.error('Metric fetch failed after filter addition:', err);
            setValue('Error');
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }

    const handleFilterSave = async (newFilter: any) => {
        // console.log('🔥 New filter saved:', newFilter);
        updateReduxAndReTriggerApiCall(newFilter);
        // Optionally: update Redux or trigger a fetch
        setShowAdhocEditor(false);
        setEditingFilter(null); // Clear the editing filter
    };

    // console.log("inlineMetricsData: ", inlineMetricsData);
    // console.log("MetricNode - current metric data:", {
    //     uuid: node.attrs.uuid,
    //     metricData: inlineMetricsData[node.attrs.uuid],
    //     metric_catalog_id: inlineMetricsData[node.attrs.uuid]?.metric_catalog_id,
    //     slice_id: inlineMetricsData[node.attrs.uuid]?.slice_id
    // });

    // Fallback: If slice_id or metric_catalog_id is missing, try to get it from the metrics list
    const metricsList = useSelector((state: any) => state?.metricList?.totalMetricsList || []);
    const currentMetricData = inlineMetricsData[nodeInstanceId];
    
    // Debug logging for metricsList structure
    // console.log("MetricNode - metricsList debug:", {
    //     metricsList,
    //     isArray: Array.isArray(metricsList),
    //     length: metricsList?.length,
    //     type: typeof metricsList,
    //     keys: metricsList ? Object.keys(metricsList) : 'null/undefined'
    // });
    
    // Debug logging for current metric data
    // console.log("MetricNode - current metric debug:", {
    //     uuid: node.attrs.uuid,
    //     nodeId: node.attrs.id,
    //     currentMetricData,
    //     hasSliceId: !!currentMetricData?.slice_id,
    //     hasMetricCatalogId: !!currentMetricData?.metric_catalog_id,
    //     sliceId: currentMetricData?.slice_id,
    //     metricCatalogId: currentMetricData?.metric_catalog_id
    // });
    
    // If we have metric data but missing slice_id or metric_catalog_id, try to find it in metricsList
    if (currentMetricData && (!currentMetricData.slice_id || !currentMetricData.metric_catalog_id)) {
        // Ensure metricsList is an array before calling .find()
        if (Array.isArray(metricsList) && metricsList.length > 0) {
            // console.log("MetricNode - searching for metric with id:", node.attrs.id);
            // console.log("MetricNode - available metrics:", metricsList.map((m: any) => ({ 
            //     metric_id: m.metric_id, 
            //     metric_catalog_id: m.metric_catalog_id, 
            //     slice_id: m.slice_id 
            // })));
            
            const metricFromList = metricsList.find((m: any) => m.metric_id === node.attrs.id);
            if (metricFromList) {
                // console.log("MetricNode - found missing data in metricsList:", {
                //     metric_id: node.attrs.id,
                //     slice_id: metricFromList.slice_id,
                //     metric_catalog_id: metricFromList.metric_catalog_id
                // });
                
                // Update the Redux state with the missing data
                const updatedInlineMetrics = {
                    ...inlineMetricsData,
                    [nodeInstanceId]: {
                        ...currentMetricData,
                        slice_id: currentMetricData.slice_id || metricFromList.slice_id,
                        metric_catalog_id: currentMetricData.metric_catalog_id || metricFromList.metric_catalog_id,
                    }
                };
                
                dispatch(
                    dashboardInfoChanged({
                        metadata: {
                            ...metadata,
                            inlineMetricsData: updatedInlineMetrics,
                        },
                    }),
                );
            } else {
                // console.log("MetricNode - metric not found in metricsList for id:", node.attrs.id);
            }
        } else {
            // console.log("MetricNode - metricsList is not an array or is empty:", metricsList);
        }
    }

    // Check if there are existing filters for this metric
    const hasExistingFilters = () => {
        if (!nodeInstanceId || !inlineMetricsData[nodeInstanceId]) {
            return false;
        }
        
        const metricData = inlineMetricsData[nodeInstanceId];
        const payload = metricData.payload;
        
        if (!payload) {
            return false;
        }
        
        // Check for adhoc_filters in form_data
        if (payload.form_data && payload.form_data.adhoc_filters && payload.form_data.adhoc_filters.length > 0) {
            return true;
        }
        
        // Check for filters in queries array
        if (payload.queries && Array.isArray(payload.queries)) {
            for (const query of payload.queries) {
                if (query.filters && Array.isArray(query.filters) && query.filters.length > 0) {
                    return true;
                }
            }
        }
        
        // Check for direct filters in payload
        if (payload.filters && Array.isArray(payload.filters) && payload.filters.length > 0) {
            return true;
        }
        
        return false;
    };

    const handleMetricClick = () => {
        // console.log('Metric clicked! isAdhocFilterOpen will be set to true');
        // console.log('Editor state:', { 
        //     editor: !!editor, 
        //     isEditable: editor?.isEditable, 
        //     error: error 
        // });
        if (editor?.isEditable) {
            // Get the current metric ID for focus management
            const currentMetricId = nodeInstanceId;
            
            // Close all other metrics' popovers by dispatching a custom event
            const closeOtherMetricsEvent = new CustomEvent('closeOtherMetricPopovers', {
                detail: { 
                    activeMetricId: currentMetricId,
                    sourceMetricId: nodeInstanceId
                }
            });
            document.dispatchEvent(closeOtherMetricsEvent);
            
            if (error) {
                // For error metrics, enter focused state instead of opening filter UI
                // console.log('Error metric - setting error focused state');
                setIsErrorFocused(true);
                // Focus the editor so backspace can work
                editor.commands.focus();

                // Check if there are existing filters for error metrics too
                if (hasExistingFilters()) {
                    // If there are existing filters, show the ExistingFiltersUI
                    setIsAdhocFilterOpen(true);
                } else {
                    // If there are no existing filters, directly open the AdhocFilterEditPopover
                    setShowAdhocEditor(true);
                }
            } else {
                // For regular metrics (including no value), set focused state first
                setIsMetricFocused(true);
                // Focus the editor so backspace can work
                editor.commands.focus();
                
                // Check if there are existing filters
                if (hasExistingFilters()) {
                    // If there are existing filters, show the ExistingFiltersUI
                    setIsAdhocFilterOpen(true);
                } else {
                    // If there are no existing filters, directly open the AdhocFilterEditPopover
                    setShowAdhocEditor(true);
                }
            }
        } else {
            // console.log('Editor is not editable, not opening filter UI');
        }
    };

    const handleFilterRemove = async (filter: any, index: number) => {
        // console.log('Removing filter:', filter, 'at index:', index);
        
        if (!nodeInstanceId || !inlineMetricsData[nodeInstanceId]) {
            // console.warn('No metric data found for UUID:', nodeInstanceId);
            return;
        }
        
        const metricData = inlineMetricsData[nodeInstanceId];
        const payload = metricData.payload;
        
        if (!payload) {
            // console.warn('No payload found for metric:', nodeInstanceId);
            return;
        }
        
        // Create a copy of the current payload to modify
        const updatedPayload = { ...payload };
        
        // Get the original filter object to remove
        const originalFilter = filter.originalFilter || filter;
        
        // Remove the filter from the appropriate location
        let filterRemoved = false;
        
        // Check and remove from form_data.adhoc_filters
        if (updatedPayload.form_data && updatedPayload.form_data.adhoc_filters) {
                    const adhocFilters = [...updatedPayload.form_data.adhoc_filters];
        const currentFilters = inlineMetricsData[nodeInstanceId]?.payload?.form_data?.adhoc_filters;
            
            const filterIndex = currentFilters.findIndex((filter) => {
                if (filter.expressionType === 'SIMPLE' && originalFilter.expressionType === 'SIMPLE') {
                    // More robust comparison for SIMPLE filters
                    const subjectMatches = filter.subject === originalFilter.subject || 
                                         filter.subject === originalFilter.column ||
                                         filter.col === originalFilter.subject;
                    
                    const operatorMatches = filter.operator === originalFilter.operator || 
                                          filter.op === originalFilter.operator ||
                                          filter.operatorId === originalFilter.operator;
                    
                    // Handle different comparator formats
                    let comparatorMatches = false;
                    if (Array.isArray(filter.comparator) && Array.isArray(originalFilter.comparator)) {
                        // Both are arrays, compare values
                        comparatorMatches = JSON.stringify(filter.comparator.sort()) === JSON.stringify(originalFilter.comparator.sort());
                    } else if (Array.isArray(filter.comparator) && !Array.isArray(originalFilter.comparator)) {
                        // Filter has array, original has single value
                        comparatorMatches = filter.comparator.includes(originalFilter.comparator);
                    } else if (!Array.isArray(filter.comparator) && Array.isArray(originalFilter.comparator)) {
                        // Filter has single value, original has array
                        comparatorMatches = originalFilter.comparator.includes(filter.comparator);
                    } else {
                        // Both are single values
                        comparatorMatches = filter.comparator === originalFilter.comparator || 
                                          filter.val === originalFilter.comparator ||
                                          filter.value === originalFilter.comparator;
                    }
                    
                    const matches = subjectMatches && operatorMatches && comparatorMatches;
                    
                    return matches;
                }
                
                if (filter.expressionType === 'SQL' && originalFilter.expressionType === 'SQL') {
                    const matches = filter.sqlExpression === originalFilter.sqlExpression && 
                           filter.clause === originalFilter.clause;
                    return matches;
                }
                
                return false;
            });
            
            if (filterIndex !== -1) {
                adhocFilters.splice(filterIndex, 1);
                updatedPayload.form_data = {
                    ...updatedPayload.form_data,
                    adhoc_filters: adhocFilters
                };
                filterRemoved = true;
            }
        }

        getQueryFilterFromAdhocFilterComplete(updatedPayload);

        
        // Check and remove from queries array
        // if (!filterRemoved && updatedPayload.queries && Array.isArray(updatedPayload.queries)) {
        //     for (let i = 0; i < updatedPayload.queries.length; i++) {
        //         const query = updatedPayload.queries[i];
        //         if (query.filters && Array.isArray(query.filters)) {
        //             const filterIndex = query.filters.findIndex(f => f === originalFilter);
        //             if (filterIndex !== -1) {
        //                 const updatedFilters = [...query.filters];
        //                 updatedFilters.splice(filterIndex, 1);
        //                 updatedPayload.queries[i] = {
        //                     ...query,
        //                     filters: updatedFilters
        //                 };
        //                 filterRemoved = true;
        //                 break;
        //             }
        //         }
        //     }
        // }
        
        // Check and remove from direct filters
        // if (!filterRemoved && updatedPayload.filters && Array.isArray(updatedPayload.filters)) {
        //     const filterIndex = updatedPayload.filters.findIndex(f => f === originalFilter);
        //     if (filterIndex !== -1) {
        //         const updatedFilters = [...updatedPayload.filters];
        //         updatedFilters.splice(filterIndex, 1);
        //         updatedPayload.filters = updatedFilters;
        //         filterRemoved = true;
        //     }
        // }

        
        if (filterRemoved) {
                    // Update Redux state
        const updatedInlineMetrics = {
            ...inlineMetricsData,
            [nodeInstanceId]: {
                ...metricData,
                payload: updatedPayload
            }
        };
        
        dispatch(
            dashboardInfoChanged({
                metadata: {
                    ...metadata,
                    inlineMetricsData: updatedInlineMetrics,
                },
            }),
        );

        // Added current global filters before calling the API
               const updatedPayloadData =  removeDuplicateAndAddOtherGlobalFilter(relevantFilters, updatedPayload)
        
        // Show loading shimmer while fetching updated metric value
        setIsLoading(true);
        
        try {
            // Trigger API call to fetch updated metric value after filter removal
            const result = await fetchInlineMetricValueWithFilter(updatedPayloadData, nodeMetric);
            if (result !== null) {
                setValue(result);
                // Clear error state since we now have a valid value
                setError(null);
            } else {
                setValue(null); // Set to null so formatMetricValue can display "(no value)"
                // Clear error state since we now have a valid response (even if null)
                setError(null);
            }
        } catch (err) {
            console.error('Metric fetch failed after filter removal:', err);
            setValue('Error');
            setError(err);
        } finally {
            setIsLoading(false);
        }
        } else {
            // console.warn('Could not find filter to remove:', originalFilter);
        }
    };

    const handleFilterEdit = (filter: any, index: number) => {
        // console.log('Editing filter:', filter, 'at index:', index);
        
        // Use the original filter data if available
        const originalFilter = filter.originalFilter || filter;
        
        // Create an AdhocFilter from the existing filter data
        let filterToEdit;
        
        if (originalFilter.expressionType === 'SIMPLE') {
            filterToEdit = new AdhocFilter({
                subject: originalFilter.subject || originalFilter.column || filter.label,
                operator: originalFilter.operator || '==',
                comparator: originalFilter.comparator || originalFilter.value || filter.value,
                clause: originalFilter.clause || 'WHERE',
                expressionType: 'SIMPLE',
            });
        } else if (originalFilter.expressionType === 'SQL') {
            filterToEdit = new AdhocFilter({
                sqlExpression: originalFilter.sqlExpression || originalFilter.expression || filter.value,
                clause: originalFilter.clause || 'WHERE',
                expressionType: 'SQL',
            });
        } else {
            // Fallback for unknown filter types
            filterToEdit = new AdhocFilter({
                subject: filter.label,
                operator: '==',
                comparator: filter.value,
                clause: 'WHERE',
                expressionType: 'SIMPLE'
            });
        }
        // Getting the index from existing adhoc_filters so that we can replace when edit operation is successful

        const currentFilters = inlineMetricsData[nodeInstanceId]?.payload?.form_data?.adhoc_filters;

        if (currentFilters?.length > 0) {
            const filterIndex = currentFilters.findIndex((filter) => {
                if (filter.expressionType === 'SIMPLE' && originalFilter.expressionType === 'SIMPLE') {
                    // More robust comparison for SIMPLE filters
                    const subjectMatches = filter.subject === originalFilter.subject || 
                                         filter.subject === originalFilter.column ||
                                         filter.col === originalFilter.subject;
                    
                    const operatorMatches = filter.operator === originalFilter.operator || 
                                          filter.op === originalFilter.operator ||
                                          filter.operatorId === originalFilter.operator;
                    
                    // Handle different comparator formats
                    let comparatorMatches = false;
                    if (Array.isArray(filter.comparator) && Array.isArray(originalFilter.comparator)) {
                        // Both are arrays, compare values
                        comparatorMatches = JSON.stringify(filter.comparator.sort()) === JSON.stringify(originalFilter.comparator.sort());
                    } else if (Array.isArray(filter.comparator) && !Array.isArray(originalFilter.comparator)) {
                        // Filter has array, original has single value
                        comparatorMatches = filter.comparator.includes(originalFilter.comparator);
                    } else if (!Array.isArray(filter.comparator) && Array.isArray(originalFilter.comparator)) {
                        // Filter has single value, original has array
                        comparatorMatches = originalFilter.comparator.includes(filter.comparator);
                    } else {
                        // Both are single values
                        comparatorMatches = filter.comparator === originalFilter.comparator || 
                                          filter.val === originalFilter.comparator ||
                                          filter.value === originalFilter.comparator;
                    }
                    
                    const matches = subjectMatches && operatorMatches && comparatorMatches;
                    
                    console.log('🔥 SIMPLE filter comparison:', { 
                        filter: { 
                            subject: filter.subject, 
                            operator: filter.operator, 
                            comparator: filter.comparator,
                            col: filter.col,
                            op: filter.op,
                            val: filter.val,
                            value: filter.value
                        },
                        original: { 
                            subject: originalFilter.subject, 
                            operator: originalFilter.operator, 
                            comparator: originalFilter.comparator,
                            column: originalFilter.column
                        },
                        matches,
                        subjectMatches,
                        operatorMatches,
                        comparatorMatches
                    });
                    return matches;
                }
                
                if (filter.expressionType === 'SQL' && originalFilter.expressionType === 'SQL') {
                    const matches = filter.sqlExpression === originalFilter.sqlExpression && 
                           filter.clause === originalFilter.clause;
                    return matches;
                }
                
                return false;
            });
            
            filterToEdit.adhocFilterIndex = filterIndex;
        }
        
        // Set the editing filter so it opens with that filter applied
        setEditingFilter(filterToEdit);
        
        // Close the existing filters UI and show the AdhocFilterEditPopover
        setShowAdhocEditor(true);
    };

    const handleErrorMetricDelete = () => {
        // console.log('Deleting error metric');
        // Delete the metric node from the editor
        if (editor && getPos) {
            const pos = getPos();
            editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run();
        }
    };

    const handleMetricDelete = () => {
        // console.log('Deleting metric');
        // Delete the metric node from the editor
        if (editor && getPos) {
            const pos = getPos();
            editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run();
        }
    };

    // Handle clicks outside to close filter UI
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isAdhocFilterOpen && !showAdhocEditor) {
                // Check if click is outside the filter UI
                const filterUI = document.querySelector('.existing-filters-ui');
                if (filterUI && !filterUI.contains(event.target as Node)) {
                    setIsAdhocFilterOpen(false);
                    // Reset focused states when closing filter UI
                    setIsMetricFocused(false);
                    setIsErrorFocused(false);
                }
            }
        };

        if (isAdhocFilterOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isAdhocFilterOpen, showAdhocEditor]);

    // Handle keyboard events for metric focused state
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't handle backspace if any filter editing UI is open
            if (isAdhocFilterOpen || showAdhocEditor) {
                return;
            }
            
            // Don't handle backspace if user is typing in any input field
            const activeElement = document.activeElement;
            if (activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.contentEditable === 'true' ||
                activeElement.closest('.ant-select-selector') ||
                activeElement.closest('.ant-input') ||
                activeElement.closest('.ace_editor') ||
                activeElement.closest('[data-test="filter-edit-popover"]') ||
                activeElement.closest('.inline-metrics.adhoc-filter-edit-popover')
            )) {
                return;
            }
            
            if (event.key === 'Backspace') {
                // Ensure editor is focused before handling backspace
                if (editor && !editor.isDestroyed) {
                    editor.commands.focus();
                }
                
                if (isErrorFocused) {
                    handleErrorMetricDelete();
                    setIsErrorFocused(false);
                } else if (isMetricFocused) {
                    handleMetricDelete();
                    setIsMetricFocused(false);
                }
            }
        };

        if (isErrorFocused || isMetricFocused) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isErrorFocused, isMetricFocused, isAdhocFilterOpen, showAdhocEditor, editor]);

    // Handle when cursor enters any metric node (for backspace functionality)
    useEffect(() => {
        if (editor) {
            const handleSelectionUpdate = () => {
                const { from, to } = editor.state.selection;
                const pos = getPos();
                const nodeSize = node.nodeSize || 1;
                
                // Don't set focused state if filters UI is open
                if (isAdhocFilterOpen || showAdhocEditor) {
                    return;
                }
                
                // Check if cursor is within the metric node (including the node itself)
                const isCursorWithinNode = pos !== undefined && from >= pos && from <= pos + nodeSize;
                
                // Check if cursor is exactly at the start of the node
                const isCursorAtStart = pos !== undefined && from === pos && to === pos;
                
                // Check if cursor is within the node content (not just at the start)
                const isCursorInContent = pos !== undefined && from > pos && from < pos + nodeSize;
                

                
                if (isCursorWithinNode || isCursorAtStart || isCursorInContent) {
                    // Cursor is within or at this metric node
                    if (error) {
                        setIsErrorFocused(true);
                        setIsMetricFocused(false);
                    } else {
                        setIsMetricFocused(true);
                        setIsErrorFocused(false);
                    }
                } else {
                    setIsErrorFocused(false);
                    setIsMetricFocused(false);
                }
            };

            editor.on('selectionUpdate', handleSelectionUpdate);
            return () => {
                editor.off('selectionUpdate', handleSelectionUpdate);
            };
        }
    }, [editor, error, getPos, node.nodeSize, isAdhocFilterOpen, showAdhocEditor, value]);

    return (
        <NodeViewWrapper as={"span"}>
            <MetricContent
                ref={metricSpanRef}
                className={`${isLoading ? 'loading' : ''} ${error ? 'error' : ''} ${isMetricFocused ? 'focused' : ''}`}
            >
                <span className="pages-inline-metric-value">
                    {editor?.isEditable ? (
                        // Edit mode - always show MetricTooltip when not loading
                        !isLoading ? (
                            <MetricTooltip
                                metric={{
                                    id: node.attrs.id,
                                    name: node.attrs.label,
                                    iconSrc: node.attrs.icon,
                                    category: node.attrs.category || 'Compensation', // TODO: Get from metric data
                                    description: node.attrs.description || 'Metric description', // TODO: Get from metric data
                                    uuid: node.attrs.uuid,
                                    instanceId: nodeInstanceId,
                                    metric_catalog_id: inlineMetricsData[nodeInstanceId]?.metric_catalog_id,
                                    slice_id: inlineMetricsData[nodeInstanceId]?.slice_id
                                }}
                                error={error}
                                hasNoValue={formatMetricValue(value).isNullValue}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMetricClick();
                                    }}
                                    style={{
                                        background: '#fff',
                                        border: 'none',
                                        padding: 0,
                                        margin: 0,
                                        font: 'inherit',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        zIndex: 10,
                                    }}
                                    title="Click to open filters"
                                >
                                    <div 
                                        className={`metric-wrapper ${isAdhocFilterOpen && editor?.isEditable ? 'filter-ui-open focused' : ''} ${isMetricFocused ? 'focused' : ''} ${isMetricFocused && !formatMetricValue(value).isNullValue ? 'focused-with-value' : ''} ${error ? 'error' : ''} ${formatMetricValue(value).isNullValue ? 'no-value' : ''} ${!formatMetricValue(value).isNullValue ? 'has-value' : ''}`}
                                    >
                                        {isLoading ? (
                                            <ShimmerLoader />
                                        ) : error ? (
                                            <ErrorMetricWrapper className={isErrorFocused ? 'focused' : ''}>
                                                <span>(Error)</span>
                                                <DeleteIcon 
                                                    src={getAssetPrefixUrl() + "/static/assets/images/icons/inline-metrics-red-cross.svg"} 
                                                    alt="Delete metric" 
                                                    className="delete-icon"
                                                    onClick={handleErrorMetricDelete}
                                                    title="Delete metric"
                                                />
                                            </ErrorMetricWrapper>
                                        ) : (
                                            <>
                                                {formatMetricValue(value).isNullValue ? (
                                                    <NoValueMetricWrapper className={isMetricFocused ? 'focused' : ''}>
                                                        <span>{formatMetricValue(value).displayValue}</span>
                                                        <img 
                                                            src={getAssetPrefixUrl() + "/static/assets/images/icons/inline-metrics-edit.svg"} 
                                                            alt="Edit metric" 
                                                            className={`edit-icon ${isAdhocFilterOpen ? 'hidden' : ''}`}
                                                        />
                                                    </NoValueMetricWrapper>
                                                ) : (
                                                    <ValueMetricWrapper className={isMetricFocused ? 'focused' : ''}>
                                                        <span>{formatMetricValue(value).displayValue}</span>
                                                        <img 
                                                            src={getAssetPrefixUrl() + "/static/assets/images/icons/inline-metrics-edit.svg"} 
                                                            alt="Edit metric" 
                                                            className={`edit-icon ${isAdhocFilterOpen ? 'hidden' : ''}`}
                                                        />
                                                    </ValueMetricWrapper>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </button>
                            </MetricTooltip>
                        ) : (
                            <button
                                onClick={(e) => {
                                    // console.log('Button clicked! Event:', e);
                                    e.stopPropagation();
                                    handleMetricClick();
                                }}
                                style={{
                                    background: '#fff',
                                    border: 'none',
                                    padding: 0,
                                    margin: 0,
                                    font: 'inherit',
                                    cursor: 'pointer',
                                }}
                            >
                                <div 
                                    className={`metric-wrapper ${isAdhocFilterOpen ? 'filter-ui-open focused' : ''} ${isMetricFocused ? 'focused' : ''} ${isMetricFocused && !formatMetricValue(value).isNullValue ? 'focused-with-value' : ''} ${error ? 'error' : ''} ${formatMetricValue(value).isNullValue ? 'no-value' : ''} ${!formatMetricValue(value).isNullValue ? 'has-value' : ''}`}
                                >
                                    {isLoading ? (
                                        <ShimmerLoader />
                                    ) : error ? (
                                        <ErrorMetricWrapper className={isErrorFocused ? 'focused' : ''}>
                                            <span>(Error)</span>
                                            <DeleteIcon 
                                                src={getAssetPrefixUrl() + "/static/assets/images/icons/inline-metrics-red-cross.svg"} 
                                                alt="Delete metric" 
                                                className="delete-icon"
                                                onClick={handleErrorMetricDelete}
                                                title="Delete metric"
                                            />
                                        </ErrorMetricWrapper>
                                    ) : (
                                        <ShimmerLoader />
                                    )}
                                </div>
                            </button>
                        )
                    ) : (
                        // View mode - always show MetricTooltip when not loading
                        !isLoading ? (
                            <MetricTooltip
                                metric={{
                                    id: node.attrs.id,
                                    name: node.attrs.label,
                                    iconSrc: node.attrs.icon,
                                    category: 'Compensation', // TODO: Get from metric data
                                    description: 'Metric description', // TODO: Get from metric data
                                    uuid: node.attrs.uuid,
                                    instanceId: nodeInstanceId,
                                    metric_catalog_id: inlineMetricsData[nodeInstanceId]?.metric_catalog_id,
                                    slice_id: inlineMetricsData[nodeInstanceId]?.slice_id
                                }}
                                error={error}
                                hasNoValue={formatMetricValue(value).isNullValue}
                            >
                                <div className={`metric-wrapper view-mode ${error ? 'error' : ''} ${formatMetricValue(value).isNullValue ? 'no-value' : ''}`}>
                                    {error ? (
                                        <ErrorMetricWrapper>
                                            <span>(Error)</span>
                                        </ErrorMetricWrapper>
                                    ) : (
                                        <>
                                            {formatMetricValue(value).isNullValue ? (
                                                <NoValueMetricWrapper className={isMetricFocused ? 'focused' : ''}>
                                                    <span>{formatMetricValue(value).displayValue}</span>
                                                    <img 
                                                        src={getAssetPrefixUrl() + "/static/assets/images/icons/inline-metrics-edit.svg"} 
                                                        alt="Edit metric" 
                                                        className={`edit-icon ${isAdhocFilterOpen ? 'hidden' : ''}`}
                                                    />
                                                </NoValueMetricWrapper>
                                            ) : (
                                                <ValueMetricWrapper className={isMetricFocused ? 'focused' : ''}>
                                                    <span>{formatMetricValue(value).displayValue}</span>
                                                    <img 
                                                        src={getAssetPrefixUrl() + "/static/assets/images/icons/inline-metrics-edit.svg"} 
                                                        alt="Edit metric" 
                                                        className={`edit-icon ${isAdhocFilterOpen ? 'hidden' : ''}`}
                                                    />
                                                </ValueMetricWrapper>
                                            )}
                                        </>
                                    )}
                                </div>
                            </MetricTooltip>
                        ) : (
                            <div className={`metric-wrapper view-mode ${error ? 'error' : ''} ${formatMetricValue(value).isNullValue ? 'no-value' : ''}`}>
                                <ShimmerLoader />
                            </div>
                        )
                    )}
                    
                    {/* Render ExistingFiltersUI only when there are existing filters */}
                    {/* {hasExistingFilters() && isAdhocFilterOpen && editor?.isEditable && (
                        <FilterPopoverContainer>
                            <ExtendedFilterTitle>
                                <ListFilterIcon size={16} />
                                Filters SD
                            </ExtendedFilterTitle>
                            <DndSelectLabel
                                name="Inline Metric Filters"
                                ghostButtonText="Click to Add"
                                accept="column"
                                onDrop={() => console.log('Dropped')}
                                onClickGhostButton={() => setShowAdhocEditor(true)} // now triggers AdhocFilterEditPopover
                                canDrop={() => true}
                                valuesRenderer={() => <></>
                                    // <ExtendedFilterTitle>
                                    //     <ListFilterIcon size={16} />
                                    //     Filters
                                    // </ExtendedFilterTitle>
                                }
                                source="pages-inline-metrics"
                            />
                        </FilterPopoverContainer>
                    )} */}

                    {/* Portal-based AdhocFilterEditPopover for metric nodes */}
                </span>
            </MetricContent>
            
            {/* Conditional Filter UI */}
            {/* {(() => {
                // console.log('Checking filter UI condition:', { isAdhocFilterOpen, showAdhocEditor });
                return null;
            })()} */}
            {isAdhocFilterOpen && !showAdhocEditor && (
                <ExistingFiltersUI 
                    metricInstanceId={nodeInstanceId}
                    inlineMetricsData={inlineMetricsData}
                    onClose={() => {
                        setIsAdhocFilterOpen(false);
                        // Reset focused states when closing filter UI
                        setIsMetricFocused(false);
                        setIsErrorFocused(false);
                    }}
                    onAddFilter={() => {
                        // Close the existing filters UI and show the AdhocFilterEditPopover
                        setShowAdhocEditor(true);
                    }}
                    onRemoveFilter={handleFilterRemove}
                    onEditFilter={handleFilterEdit}
                    metricElementRef={metricSpanRef}
                />
            )}
            
            {/* Portal-rendered AdhocFilterEditPopover */}
            {showAdhocEditor && portalRef.current && 
                ReactDOM.createPortal(
                    <>
                        <PortalBackdrop
                            onClick={() => {
                                setShowAdhocEditor(false);
                                setEditingFilter(null);
                            }}
                        />
                        <PortalFilterPopoverContainer
                            className="adhoc-filter-edit-popover-portal"
                            style={{
                                pointerEvents: 'auto',
                                top: `${portalPosition.top}px`,
                                left: `${portalPosition.left}px`
                            }}
                        >
                            <AdhocFilterEditPopover
                                adhocFilter={adhocFilter}
                                onChange={handleFilterSave}
                                onClose={() => {
                                    setShowAdhocEditor(false);
                                    setEditingFilter(null);
                                }}
                                onResize={() => { }}
                                options={options}
                                datasource={datasource}
                                className="inline-metrics adhoc-filter-edit-popover"
                                source="pages-inline-metrics"
                                isFromMetricNode={true}
                            />
                        </PortalFilterPopoverContainer>
                    </>,
                    portalRef.current
                )
            }
        </NodeViewWrapper>
    );

    // return (
    //     <NodeViewWrapper as={"span"}>
    //         <MetricContent
    //             ref={metricSpanRef}
    //             onMouseEnter={handleMouseEnter}
    //             onMouseLeave={handleMouseLeave}
    //             className={`${isLoading ? 'loading' : ''} ${error ? 'error' : ''}`}
    //             title={relevantFilters.filters.length > 0 ? 'Click for Filters' : ''}
    //         >
    //             <span className="pages-inline-metric-value">
    //                 $75.78M
    //                 {/* {error ? 'Error loading metric' : formatValue(convertValueToNumber(value)).includes("NaN") ? 'Loading ...' : formatValue(convertValueToNumber(value))} */}
    //                 {/* <FloatingAddFilter referenceElement={metricSpanRef.current} /> */}
    //                 {/* //editor={editor} node={node} getPos={getPos} /> */}
    //                 {editor?.isEditable &&
    //                     canRender &&
    //                     isHovered &&
    //                     metricSpanRef.current &&
    //                     relevantFilters.filters.length === 0 &&
    //                     (
    //                         <FloatingAddFilter
    //                             referenceElement={metricSpanRef.current}
    //                             metric={node.attrs.metric}
    //                             datasource={datasource}
    //                             options={options}
    //                             sliceId={sliceId}
    //                             formData={formData}
    //                             existingFilters={relevantFilters.filters}
    //                             onMouseEnter={() => setIsPopupHovered(true)}
    //                             onMouseLeave={() => {
    //                                 setIsPopupHovered(false);
    //                                 setIsHovered(false);
    //                             }}
    //                         />
    //                     )}
    //             </span>
    //         </MetricContent>
    //     </NodeViewWrapper>
    // )
}

const DateMetric = ({ node, editor, getPos }: { node: any; editor: any; getPos: any }) => {
    const dateRange = useSelector((state) => state?.dashboardState?.dateRange);
    let content = '';


    if (dateRange && dateRange !== "No filter") {
        const [startDate, endDate] = dateRange.split("-");
        if (node?.attrs?.id === 'start-date') {
            content = startDate;
        }
        if (node?.attrs?.id === 'end-date') {
            content = endDate
        }
    }

    return (
        <NodeViewWrapper as={"span"}>
            <MetricContent >
                <span className="pages-inline-metric-value">
                    {content ? customFormat(content) : 'Date not specified'}
                    {/* <FloatingAddFilter editor={editor} node={node} getPos={getPos} /> */}

                </span>
            </MetricContent>
        </NodeViewWrapper>
    )
}


const MetricComponent = (props: {
    node: any;
    editor: any;
    getPos: () => number;
}) => {
    const { node, editor, getPos } = props;
    // const isDateMetric = node?.attrs?.id === 'start-date' || node?.attrs?.id === 'end-date';
    // if (isDateMetric) {
    //     return (
    //         <DateMetric node={node} editor={editor} getPos={getPos} />
    //     )
    // }

    return (
        <ChartMetric node={node} editor={editor} getPos={getPos} />
    )
}

export const MetricNode = Node.create({
    name: 'metric',
    group: 'inline',
    inline: true,
    selectable: true, //false,
    atom: true,

    addAttributes() {
        return {
            id: {
                default: null,
            },
            label: {
                default: null,
            },
            icon: {
                default: null,
            },
            metric: {
                default: null,
            },
            datasetId: {
                default: null,
            },
            uuid: {
                default: null,
            },
            instanceId: {
                default: null,
            }
        }
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-metric]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes({ 'data-metric': '' }, HTMLAttributes)]
    },

    addNodeView() {
        return ReactNodeViewRenderer(MetricComponent, {
            as: 'span',
            // props: { editor: this.editor }, // Not supported by React Node View Renderer
        });
    },

})

export default MetricNode;