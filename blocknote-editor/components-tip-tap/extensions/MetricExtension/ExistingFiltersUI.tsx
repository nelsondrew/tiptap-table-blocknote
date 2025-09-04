import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { getAssetPrefixUrl } from 'src/utils/HRXUtils';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import { Tooltip, Spin } from 'antd';
import { NO_TIME_RANGE } from '@superset-ui/core';
import { useGetTimeRangeLabel } from 'src/explore/components/controls/FilterControl/utils';
import { Operators } from 'src/explore/constants';
import { generateTestId } from './utils/experienceUtils';

// ============================================================================
// STYLED COMPONENTS FOR EXISTING FILTERS UI
// ============================================================================

/**
 * Main container for the existing filters popover
 * Features: Floating popover with shadow, centered positioning, responsive width
 */
const ExistingFiltersContainer = styled.div`
  display: flex;
  width: fit-content;
  min-width: 320px;
  max-width: 600px;
  padding: 8px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 4px;
  border: 1px solid var(--Grayscale-gray-400, #F2F2F2);
  background: #FFF;
  box-shadow: 0 4px 18px 0 rgba(0, 0, 0, 0.15);
  position: absolute;
  z-index: 1000;
  margin-top: 6px;
`;

/**
 * Triangle arrow pointing to the metric above the popover
 * Creates a visual connection between the popover and the metric
 */
const TriangleArrow = styled.div<{ isShadow?: boolean }>`
  position: absolute;
  top: ${props => props.isShadow ? '-9px' : '-8px'};
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid ${props => props.isShadow ? '#F2F2F2' : '#FFF'};
  z-index: ${props => props.isShadow ? '1000' : '1001'};
`;

/**
 * Header section containing the filter icon and title
 */
const FiltersHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 4px;
`;

/**
 * Header content with filter icon and "Filters" text
 */
const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.12px;
  color: var(--Grayscale-gray-1000, #000);
`;

/**
 * Filter icon in the header
 */
const FilterIcon = styled.img`
  width: 16px;
  height: 16px;
`;

/**
 * Container for the list of existing filters
 * Wraps all filter items in a bordered container
 */
const FiltersListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  border-radius: 4px;
  border: 1px solid var(--Grayscale-Outline, #F2F2F2);
  background: #FFF;
  padding: 5px;
`;

/**
 * Individual filter item container
 * Features: Responsive width, fixed height, hover effects
 */
const FilterItemContainer = styled.div`
  display: flex;
  height: 32px;
  padding: 6px;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  border-radius: 4px;
  border: 1px solid var(--Grayscale-Outline, #F2F2F2);
  background: var(--Grayscale-Background, #FBFBFB);
  width: fit-content;
  min-width: 100%;
  max-width: none;
`;

/**
 * Clickable wrapper for filter content
 * Makes the entire filter content area clickable for editing
 */
const FilterContentWrapper = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 2px;
  border-radius: 2px;
  /* transition: background-color 0.2s ease; */

  /* &:hover {
    background-color: #f2fbfb;
  } */
`;

/**
 * Icon container for close and edit buttons
 * Provides consistent sizing and centering for action icons
 */
const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
`;

/**
 * Action button for close and edit operations
 * Styled as a clean, borderless button with hover effects
 */
const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

/**
 * Action icon (close, edit, plus)
 * Consistent sizing for all action icons
 */
const ActionIcon = styled.img`
  width: 12px;
  height: 12px;
`;

/**
 * Type indicator container (shows "abc" text)
 * Aligns with the filter content for visual consistency
 */
const TypeIndicatorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
`;

/**
 * Type indicator text ("abc")
 * Small, subtle text indicating filter type
 */
const TypeIndicatorText = styled.span`
  color: var(--black-grey-super-dark-grey-700, #666);
  font-size: 8px;
  font-style: normal;
  font-weight: 400;
  line-height: 22px;
  letter-spacing: 0.08px;
`;

/**
 * Filter content container
 * Handles text overflow and responsive layout
 */
const FilterContentContainer = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
  max-width: 200px; /* Limit maximum width to prevent overflow */
  overflow: hidden;
`;

/**
 * Filter content text
 * Displays the filter label and value with overflow handling
 */
const FilterContentText = styled.span`
  font-size: 14px;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  display: block;
`;

/**
 * "Click to Add" button container
 * Dashed border to indicate it's an action button
 */
const AddFilterButton = styled.div`
  display: flex;
  align-items: center;
  height: 32px;
  padding: 6px;
  width: 100%;
  border: 1px dashed #E5E5E5;
  border-radius: 4px;
  background-color: #FFF;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--Brand-brand-500, #00B0B3);
  }
`;

/**
 * Plus icon container with proper spacing
 * Maintains consistent spacing with other filter items
 */
const PlusIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: 14px;
`;

/**
 * "Click to Add" text container
 * Aligns with the filter content for visual consistency
 */
const AddFilterTextContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 24px;
`;

/**
 * "Click to Add" text styling
 * Uses secondary text color to indicate it's an action
 */
const AddFilterText = styled.span`
  color: var(--text-secondary-inactive-500, #9C9C9C);
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0.14px;
`;

/**
 * Loader container for temporal range filters
 * Centers the spinner within the filter content area
 */
const LoaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 20px;
`;

/**
 * Loading text shown next to spinner
 */
const LoadingText = styled.span`
  font-size: 14px;
  color: #666;
  font-style: italic;
`;

// ============================================================================
// FILTER CONTENT DISPLAY COMPONENT
// ============================================================================

/**
 * Component to handle temporal range filter display with proper formatting
 * Uses useGetTimeRangeLabel hook for temporal range filters
 */
const TemporalRangeFilterDisplay = ({ filter }: { filter: any }) => {
    // Create AdhocFilter-like object for useGetTimeRangeLabel
    let adhocFilterForTimeRange = filter.originalFilter;
    
    // Track loading timeout to prevent infinite spinner
    const [loadingTimeout, setLoadingTimeout] = useState(false);

    // Use the hook for temporal range formatting
    const timeRangeResult = useGetTimeRangeLabel(adhocFilterForTimeRange);
    
    // Determine if we're still loading the time range
    // Loading when: no result yet AND not a "No filter" case that resolves immediately
    const comparatorValue = adhocFilterForTimeRange?.comparator || 
                           adhocFilterForTimeRange?.val || 
                           adhocFilterForTimeRange?.value;
    
    const isLoading = !timeRangeResult.actualTimeRange && 
                     comparatorValue && 
                     comparatorValue !== NO_TIME_RANGE &&
                     !loadingTimeout;
    
    // Set timeout to stop showing loader after 10 seconds
    useEffect(() => {
        if (isLoading) {
            const timeout = setTimeout(() => {
                setLoadingTimeout(true);
            }, 3000); // 3 seconds timeout
            
            return () => clearTimeout(timeout);
        } else {
            setLoadingTimeout(false);
        }
    }, [isLoading]);
    
    // Show loader while API call is in progress
    if (isLoading) {
        return (
            <FilterContentContainer>
                <LoaderContainer>
                    <Spin size="small" />
                    <LoadingText>Loading time range...</LoadingText>
                </LoaderContainer>
            </FilterContentContainer>
        );
    }
    
    const displayText = timeRangeResult.actualTimeRange || `${filter.label}: ${filter.value}`;

    return (
        <FilterContentContainer>
            {displayText.length > 25 ? (
                <Tooltip
                    title={displayText}
                    placement="top"
                    mouseEnterDelay={0.5}
                    mouseLeaveDelay={0.1}
                    overlayStyle={{
                        maxWidth: '300px',
                        wordBreak: 'break-word'
                    }}
                >
                    <FilterContentText>
                        {displayText}
                    </FilterContentText>
                </Tooltip>
            ) : (
                <FilterContentText>
                    {displayText}
                </FilterContentText>
            )}
        </FilterContentContainer>
    );
};

/**
 * Component to handle regular (non-temporal) filter display
 */
const RegularFilterDisplay = ({ filter }: { filter: any }) => {
    const displayText = `${filter.label}: ${filter.value}`;

    return (
        <FilterContentContainer>
            {displayText.length > 25 ? (
                <Tooltip
                    title={displayText}
                    placement="top"
                    mouseEnterDelay={0.5}
                    mouseLeaveDelay={0.1}
                    overlayStyle={{
                        maxWidth: '300px',
                        wordBreak: 'break-word'
                    }}
                >
                    <FilterContentText>
                        {displayText}
                    </FilterContentText>
                </Tooltip>
            ) : (
                <FilterContentText>
                    {displayText}
                </FilterContentText>
            )}
        </FilterContentContainer>
    );
};

/**
 * Main component to display filter content with appropriate formatting
 */
const FilterContentDisplay = ({ filter }: { filter: any }) => {
    // Check if this is a temporal range filter
    const isTemporalRange = filter.originalFilter?.op === 'TEMPORAL_RANGE' || 
                           filter.originalFilter?.operator === Operators.TemporalRange ||
                           filter.originalFilter?.operator === 'TEMPORAL_RANGE';

    return isTemporalRange ? (
        <TemporalRangeFilterDisplay filter={filter} />
    ) : (
        <RegularFilterDisplay filter={filter} />
    );
};

// ============================================================================
// EXISTING FILTERS UI COMPONENT
// ============================================================================

/**
 * ExistingFiltersUI Component
 * 
 * Displays a popover with existing filters for an inline metric.
 * Features:
 * - List of existing filters with remove/edit actions
 * - "Click to Add" button for adding new filters
 * - Responsive width that adapts to content
 * - Clean, professional styling with hover effects
 * 
 * Expected filter structure:
 * - Each filter should have an `originalFilter` property containing the complete
 *   original filter object with all properties (clause, col, expressionType, op, subject, val, etc.)
 * - Display properties (label, value, type) are added for UI purposes
 * - The `originalFilter` preserves the exact structure from the Redux state
 * 
 * @param metricInstanceId - Unique identifier for the metric
 * @param inlineMetricsData - Redux state containing filter data
 * @param onClose - Callback when popover should close
 * @param onAddFilter - Callback when "Click to Add" is clicked
 * @param onRemoveFilter - Callback when a filter is removed
 * @param onEditFilter - Callback when a filter is edited
 * @param metricElementRef - Reference to the metric element for positioning
 */
const ExistingFiltersUI = ({ 
    metricInstanceId, 
    inlineMetricsData, 
    onClose, 
    onAddFilter,
    onRemoveFilter,
    onEditFilter,
    metricElementRef
}: { 
    metricInstanceId: string; 
    inlineMetricsData: any; 
    onClose: () => void; 
    onAddFilter: () => void; 
    onRemoveFilter: (filter: any, index: number) => void; 
    onEditFilter: (filter: any, index: number) => void; 
    metricElementRef?: React.RefObject<HTMLElement>;
}) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const portalRef = useRef<HTMLDivElement | null>(null);
    
    // Add state to store current filters and force re-renders when they change
    const [currentFilters, setCurrentFilters] = useState<any[]>([]);

    // For verbose name transformation
    const datasources = useSelector((state: any) => 
        state.datasources || {}
    );
    
    // Track changes in inlineMetricsData and update filters accordingly
    useEffect(() => {
        if (metricInstanceId && inlineMetricsData[metricInstanceId]) {
            const newFilters = getMetricFilters();
            setCurrentFilters(newFilters);
        } else {
            setCurrentFilters([]);
        }
    }, [metricInstanceId, inlineMetricsData, inlineMetricsData[metricInstanceId]]);

    // Create portal container
    useEffect(() => {
        if (!portalRef.current) {
            portalRef.current = document.createElement('div');
            portalRef.current.style.position = 'absolute';
            portalRef.current.style.top = '0';
            portalRef.current.style.left = '0';
            portalRef.current.style.pointerEvents = 'none';
            portalRef.current.style.zIndex = '1000';
            document.body.appendChild(portalRef.current);
        }

        return () => {
            if (portalRef.current && document.body.contains(portalRef.current)) {
                document.body.removeChild(portalRef.current);
                portalRef.current = null;
            }
        };
    }, []);

    // Calculate position based on metric element
    const updatePosition = () => {
        if (metricElementRef?.current && document.contains(metricElementRef.current)) {
            try {
                const rect = metricElementRef.current.getBoundingClientRect();
                setPosition({
                    top: rect.bottom + 6, // 6px margin
                    left: rect.left + (rect.width / 2) - 160 // Center the popover (320px width / 2)
                });
            } catch (error) {
                console.warn('Error updating ExistingFiltersUI position:', error);
                // If there's an error, close the popover
                onClose();
            }
        } else {
            // If the element is no longer in the DOM, close the popover
            onClose();
        }
    };

    // Update position on mount and when metric element changes
    useEffect(() => {
        updatePosition();
    }, [metricElementRef]);

    // Update position on scroll and resize
    useEffect(() => {
        const handleScroll = () => updatePosition();
        const handleResize = () => updatePosition();

        window.addEventListener('scroll', handleScroll, true); // true for capture phase
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [metricElementRef]);

    /**
     * Extracts and formats filters from the metric data
     * Extracts real filters from the Redux state payload
     * 
     * IMPORTANT: This function preserves the complete original filter structure
     * in the `originalFilter` property while adding display properties for the UI.
     * This ensures that all original filter data is retained for editing operations.
     */
    const getMetricFilters = () => {
        if (!metricInstanceId || !inlineMetricsData[metricInstanceId]) {
            return [];
        }
        
        const metricData = inlineMetricsData[metricInstanceId];
        const payload = metricData.payload;
        
        if (!payload) {
            return [];
        }
        
        // Extract filters from different possible locations in the payload
        let filters: any[] = [];
        
        // Process adhoc_filters from form_data - this is the single source of truth
        if (payload.form_data && payload.form_data.adhoc_filters && Array.isArray(payload.form_data.adhoc_filters)) {
            payload.form_data.adhoc_filters.forEach((filter: any, index: number) => {
                // Add null check for filter
                if (!filter || typeof filter !== 'object') {
                    console.warn('Invalid filter object found:', filter);
                    return; // Skip invalid filters
                }
                
                // Create a deep copy of the original filter to preserve all properties
                const originalFilter = structuredClone(filter);
                
                if (filter.expressionType === 'SIMPLE') {
                    // Simple filter format - handle array values in comparator
                    let comparatorValue = filter.comparator || filter.value;
                    if (Array.isArray(comparatorValue)) {
                        comparatorValue = comparatorValue.join(', ');
                    }
                    
                    const simpleFilter = {
                        col: filter.subject || filter.column || 'Filter',
                        op: filter.operator || filter.op || '=',
                        val: comparatorValue,
                        expressionType: 'SIMPLE',
                        subject: filter.subject,
                        clause: filter.clause,
                        // Preserve the original filter with all its properties
                        originalFilter: originalFilter
                    };
                    filters.push(simpleFilter);
                } else if (filter.expressionType === 'SQL' && filter.sqlExpression && filter.clause) {
                    // SQL filter format - extract column name for better labeling
                    let columnName = filter.clause === 'WHERE' ? 'WHERE Clause' : 'HAVING Clause';
                    
                    // Try to extract column name from SQL expression for better labeling
                    if (filter.sqlExpression) {
                        const columnMatch = filter.sqlExpression.match(/^[()]*([a-zA-Z][a-zA-Z0-9_\s]+?)\s*([<>=!]+|IN|NOT\s+IN)\s*(.+)[()]*$/i);
                        if (columnMatch) {
                            const [, extractedColumnName, operator, value] = columnMatch;
                            columnName = extractedColumnName.trim(); // Use the extracted column name as label
                        }
                    }
                    
                    const sqlFilter = {
                        col: columnName,
                        op: 'SQL',
                        val: filter.sqlExpression,
                        expressionType: 'SQL',
                        sqlExpression: filter.sqlExpression,
                        clause: filter.clause,
                        // Preserve the original filter with all its properties
                        originalFilter: originalFilter
                    };
                    filters.push(sqlFilter);
                }
            });
        }
        
        // Check for direct filters in payload (if any)
        if (payload.filters && Array.isArray(payload.filters)) {
            payload.filters.forEach((filter: any) => {
                // Add null check for filter
                if (!filter || typeof filter !== 'object') {
                    console.warn('Invalid direct filter object found:', filter);
                    return; // Skip invalid filters
                }
                
                // Create a deep copy of the original filter to preserve all properties
                const originalFilter = structuredClone(filter);
                const enhancedFilter = {
                    ...filter,
                    originalFilter: originalFilter
                };
                filters.push(enhancedFilter);
            });
        }
        
        // Check for time_range in form_data
        if (payload.form_data && payload.form_data.time_range) {
            const timeRangeFilter = {
                col: 'Time Range',
                op: 'TEMPORAL_RANGE',
                val: payload.form_data.time_range,
                expressionType: 'SIMPLE',
                subject: 'Time Range',
                originalFilter: {
                    col: 'Time Range',
                    op: 'TEMPORAL_RANGE',
                    val: payload.form_data.time_range,
                    expressionType: 'SIMPLE',
                    subject: 'Time Range'
                }
            };
            filters.push(timeRangeFilter);
        }
        
        // Deduplicate filters based on their content
        const uniqueFilters = filters.filter((filter, index, self) => {
            if (!filter || typeof filter !== 'object') {
                console.warn('Invalid filter in deduplication:', filter);
                return false; // Remove invalid filters
            }
            
            // Create a unique key for each filter based on its content
            // For better deduplication, normalize the filter data
            const filterKey = JSON.stringify({
                col: filter.col || filter.column,
                op: filter.op || filter.operator,
                val: filter.val || filter.value || filter.comparator,
                expressionType: filter.expressionType,
                subject: filter.subject,
                sqlExpression: filter.sqlExpression
            });
            
            // Keep only the first occurrence of each filter
            return index === self.findIndex(f => {
                if (!f || typeof f !== 'object') return false;
                const fKey = JSON.stringify({
                    col: f.col || f.column,
                    op: f.op || f.operator,
                    val: f.val || f.value || f.comparator,
                    expressionType: f.expressionType,
                    subject: f.subject,
                    sqlExpression: f.sqlExpression
                });
                return fKey === filterKey;
            });
        });
        
        // Additional deduplication: Keep only the first occurrence of each unique filter condition
        const finalFilters = uniqueFilters.filter((filter, index, self) => {
            if (!filter || typeof filter !== 'object') {
                console.warn('Invalid filter in final deduplication:', filter);
                return false; // Remove invalid filters
            }
            
            // Find the first occurrence of this filter condition
            const firstOccurrenceIndex = self.findIndex((f, fIndex) => {
                if (!f || typeof f !== 'object') return false;
                
                // Compare filter conditions using the new filter structure (col + val)
                const filterCol = filter.col?.toLowerCase()?.trim() || '';
                let filterVal = filter.val;
                if (Array.isArray(filterVal)) {
                    filterVal = filterVal.join(', ');
                }
                // Add proper null check before calling toLowerCase
                filterVal = (filterVal && typeof filterVal === 'string') ? filterVal.toLowerCase().trim() : '';
                
                const fCol = f.col?.toLowerCase()?.trim() || '';
                let fVal = f.val;
                if (Array.isArray(fVal)) {
                    fVal = fVal.join(', ');
                }
                // Add proper null check before calling toLowerCase
                fVal = (fVal && typeof fVal === 'string') ? fVal.toLowerCase().trim() : '';
                
                return filterCol === fCol && filterVal === fVal;
            });
            
            // Keep only the first occurrence
            if (index === firstOccurrenceIndex) {
                return true;
            } else {
                return false;
            }
        });
        
        // Transform the filters into a displayable format
        const displayFilters = finalFilters
            .filter((filter) => filter !== null && filter !== undefined) // Filter out null/undefined values
            .map((filter, index) => {
                // Add null check before accessing filter properties
                if (!filter || typeof filter !== 'object') {
                    console.warn('Invalid filter in display mapping:', filter);
                    return {
                        label: `Filter ${index + 1}`,
                        value: 'Invalid filter data',
                        type: 'unknown',
                        originalFilter: filter
                    };
                }
                
                // Handle different filter formats
                if (filter.expressionType === 'SIMPLE') {
                    // Simple filter format - handle array values in val
                    let filterValue = filter.val || filter.value || filter.comparator;
                    if (Array.isArray(filterValue)) {
                        filterValue = filterValue.join(', ');
                    }
                    
                    return {
                        label: filter.col || filter.subject || filter.column || 'Filter',
                        value: filter.op ? `${filter.op} ${filterValue}` : filterValue,
                        type: 'simple',
                        // Preserve the original filter with all its properties
                        originalFilter: filter.originalFilter || filter
                    };
                } else if (filter.expressionType === 'SQL') {
                    // SQL filter format - try to extract column name for better labeling
                    let sqlLabel = 'SQL Filter';
                    let sqlValue = filter.sqlExpression || filter.expression || 'SQL Expression';
                    
                    // Try to extract column name from SQL expression for better labeling
                    if (sqlValue && typeof sqlValue === 'string') {
                        // Look for column name at the beginning of the SQL expression
                        const columnMatch = sqlValue.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s/);
                        if (columnMatch) {
                            sqlLabel = columnMatch[1]; // Use the extracted column name as label
                        }
                    }
                    
                    return {
                        label: sqlLabel,
                        value: sqlValue,
                        type: 'sql',
                        // Preserve the original filter with all its properties
                        originalFilter: filter.originalFilter || filter
                    };
                } else if (filter.column || filter.col) {
                    // Generic column-based filter (handles both 'column' and 'col' properties)
                    const columnName = filter.column || filter.col;
                    const operator = filter.operator || filter.op;
                    let value = filter.value || filter.val || filter.comparator;
                    
                    // Handle array values properly
                    if (Array.isArray(value)) {
                        value = value.join(', ');
                    }
                    
                    return {
                        label: columnName,
                        value: operator ? `${operator} ${value}` : value,
                        type: 'generic',
                        // Preserve the original filter with all its properties
                        originalFilter: filter.originalFilter || filter
                    };
                } else {
                    // Fallback for unknown filter format
                    return {
                        label: `Filter ${index + 1}`,
                        value: JSON.stringify(filter),
                        type: 'unknown',
                        // Preserve the original filter with all its properties
                        originalFilter: filter.originalFilter || filter
                    };
                }
            });
        

        
        return displayFilters;
    };

    // Use currentFilters state instead of calling getMetricFilters() directly
    const filters = currentFilters;

    // Get verbose map from the dataset if available
    const getVerboseName = (columnName: string | null | undefined) => {
        // Add null check at the beginning
        if (!columnName || typeof columnName !== 'string') {
            return columnName || 'Unknown Column';
        }
        // Find the dataset that matches our datasource ID
        if (metricInstanceId && inlineMetricsData[metricInstanceId]) {
            const metricData = inlineMetricsData[metricInstanceId];
            if (metricData?.datasetId) {
                // Look for the datasource in the datasources state
                // The datasource UID format is typically "datasetId__table"
                const datasourceUid = `${metricData.datasetId}__table`;
                const datasource = datasources[datasourceUid];
                
                // Use the same pattern as MetricsCatalog: build verbose map from columns
                if (datasource && datasource.columns && Array.isArray(datasource.columns)) {
                    const verboseMap: Record<string, string> = {};
                    datasource.columns.forEach((col: any) => {
                        if ('verbose_name' in col) {
                            verboseMap[col.column_name] = col.verbose_name || col.column_name;
                        } else {
                            verboseMap[col.column_name] = col.column_name;
                        }
                    });
                    
                    if (verboseMap[columnName]) {
                        return verboseMap[columnName];
                    }
                }
                
                // Fallback: try the old verbose_map approach if columns don't exist
                if (datasource?.verbose_map && datasource.verbose_map[columnName]) {
                    return datasource.verbose_map[columnName];
                }
            }
        }
        
        // Fallback: convert snake_case to Title Case
        if (columnName && typeof columnName === 'string' && columnName.includes('_')) {
            const fallbackName = columnName.split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            return fallbackName;
        }
        
        return columnName;
    };

    // Enhanced function to convert SQL expressions with verbose names
    const convertSqlExpressionToVerbose = (sqlExpression: string | null | undefined) => {
        if (!sqlExpression || typeof sqlExpression !== 'string') {
            return sqlExpression || '';
        }



        // Common SQL patterns where column names might appear
        // Pattern 1: Column name followed by operator (e.g., "Depart_Type IN", "Tenure_In_Months >")
        // Pattern 2: Column name in parentheses or as part of function calls
        // Pattern 3: Column name as part of comparison expressions
        
        let convertedExpression = sqlExpression;
        
        // Extract potential column names from the SQL expression
        // Look for patterns like: word_with_underscores followed by spaces and operators
        const columnNamePattern = /([a-zA-Z][a-zA-Z0-9_]*)\s*(IN|NOT IN|LIKE|NOT LIKE|>|<|>=|<=|=|!=|<>|IS|IS NOT|BETWEEN|NOT BETWEEN)/gi;
        
        convertedExpression = convertedExpression.replace(columnNamePattern, (match, columnName, operator) => {
            const verboseName = getVerboseName(columnName);
            return `${verboseName} ${operator}`;
        });
        
        // Also handle cases where column names might be at the beginning of the expression
        // without a following operator (e.g., "Depart_Type IN 'Voluntary'")
        const leadingColumnPattern = /^([a-zA-Z][a-zA-Z0-9_]*)\s+/;
        const leadingMatch = convertedExpression.match(leadingColumnPattern);
        if (leadingMatch) {
            const columnName = leadingMatch[1];
            const verboseName = getVerboseName(columnName);
            convertedExpression = convertedExpression.replace(leadingColumnPattern, `${verboseName} `);
        }
        
        // Handle additional SQL patterns that might contain column names
        // Pattern: Column names in function calls like COUNT(column_name)
        const functionColumnPattern = /\(([a-zA-Z][a-zA-Z0-9_]*)\)/g;
        convertedExpression = convertedExpression.replace(functionColumnPattern, (match, columnName) => {
            const verboseName = getVerboseName(columnName);
            return `(${verboseName})`;
        });
        
        // Pattern: Column names in comparison expressions like "column_name = value"
        const comparisonPattern = /([a-zA-Z][a-zA-Z0-9_]*)\s*([=<>!]+)\s*([^,\s]+)/g;
        convertedExpression = convertedExpression.replace(comparisonPattern, (match, columnName, operator, value) => {
            const verboseName = getVerboseName(columnName);
            return `${verboseName} ${operator} ${value}`;
        });
        
        return convertedExpression;
    };

    // Apply verbose names to filters - use useMemo to optimize performance
    const processedFilters = React.useMemo(() => {
        return filters.map(filter => {
            // Add null check for filter
            if (!filter || typeof filter !== 'object') {
                console.warn('Invalid filter in processedFilters:', filter);
                return filter; // Return as-is if invalid
            }
            
            // Create a deep copy to avoid mutating the original filter object
            let processedFilter = structuredClone(filter);
            
            // Convert the label to verbose name - add null check
            if (filter && filter.label) {
                processedFilter.label = getVerboseName(filter.label);
            }
            
            // For SQL filters, also convert the value/expression to verbose names
            if (filter && filter.type === 'sql' && filter.value) {
                processedFilter.value = convertSqlExpressionToVerbose(filter.value);
            }
            
            return processedFilter;
        });
    }, [filters, datasources]); // Re-compute when filters or datasources change

    

    const popoverContent = (
        <ExistingFiltersContainer 
            className="existing-filters-ui"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                pointerEvents: 'auto'
            }}
        >
            {/* Triangle arrows for visual connection to metric */}
            <TriangleArrow isShadow={true} />
            <TriangleArrow isShadow={false} />
            
            {/* Header with filter icon and title */}
            <FiltersHeader>
                <HeaderContent>
                    <FilterIcon 
                        src={getAssetPrefixUrl() + "/static/assets/images/icons/inline-metrics-filter.svg"} 
                        alt="Filter" 
                    />
                    <span>Filters</span>
                </HeaderContent>
            </FiltersHeader>
            
            {/* Container for existing filters list */}
            <FiltersListContainer>
                {/* Render each existing filter */}
                {processedFilters.length > 0 ? (
                    processedFilters.map((filter, index) => (
                        <FilterItemContainer key={index}>
                            {/* Close/Remove button */}
                            <IconContainer>
                                <ActionButton
                                onClick={() => {
                                    onRemoveFilter(filter, index);
                                }}
                                data-testid={generateTestId('ap.<experience>.pages.inline-metric.button.filter-remove.click')}
                                >
                                    <ActionIcon 
                                        src={getAssetPrefixUrl() + "/static/assets/images/icons/inline-metrics-close.svg"} 
                                        alt="Close" 
                                    />
                                </ActionButton>
                            </IconContainer>
                            
                            {/* Clickable wrapper for filter content */}
                            <FilterContentWrapper
                                onClick={() => {
                                    onEditFilter(filter, index);
                                }}
                            >
                                {/* Type indicator ("abc") */}
                                <TypeIndicatorContainer>
                                    <TypeIndicatorText>abc</TypeIndicatorText>
                                </TypeIndicatorContainer>
                                
                                {/* Filter content with temporal range handling */}
                                <FilterContentDisplay filter={filter} />
                                
                                {/* Edit button */}
                                <IconContainer>
                                    <ActionIcon 
                                        src={getAssetPrefixUrl() + "/static/assets/images/icons/inline-metrics-right-arrow.svg"} 
                                        alt="Edit" 
                                    />
                                </IconContainer>
                            </FilterContentWrapper>
                        </FilterItemContainer>
                    ))
                ) : (
                    // Show message when no filters exist
                    <div style={{
                        padding: '12px',
                        textAlign: 'center',
                        color: '#666',
                        fontSize: '14px',
                        fontStyle: 'italic'
                    }}>
                        No filters applied to this metric
                    </div>
                )}
                
                {/* "Click to Add" button */}
                <AddFilterButton onClick={onAddFilter} data-testid={generateTestId('ap.<experience>.pages.inline-metric.button.filter-add.click')}>
                    <PlusIconContainer>
                        <ActionIcon 
                            src={getAssetPrefixUrl() + "/static/assets/images/icons/inline-metrics-plus.svg"} 
                            alt="Add" 
                        />
                    </PlusIconContainer>
                    
                    <AddFilterTextContainer>
                        <AddFilterText>Click to Add</AddFilterText>
                    </AddFilterTextContainer>
                </AddFilterButton>
            </FiltersListContainer>
        </ExistingFiltersContainer>
    );

    // Render using portal
    return portalRef.current ? ReactDOM.createPortal(popoverContent, portalRef.current) : null;
};

export default ExistingFiltersUI; 