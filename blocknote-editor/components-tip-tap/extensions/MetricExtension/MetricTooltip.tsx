import React, { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { Tooltip } from 'antd';
import { sendHRXMessage, getAssetPrefixUrl } from 'src/utils/HRXUtils';
import getBootstrapData from 'src/utils/getBootstrapData';
import { useSelector } from 'react-redux';
import { generateTestId } from './utils/experienceUtils';

/**
 * Main tooltip container
 * Features: 
 * - Responsive width and proper padding
 * - Clean layout for metric information display
 * - Proper overflow handling for content
 * - Auto-adjusting height with max-height constraint
 */
const TooltipContainer = styled.div`
  display: flex;
  width: 320px;
  min-width: 240px;
  max-width: 320px;
  max-height: 300px;
  padding: 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  position: relative;
  overflow: hidden;
`;

const TooltipTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  align-self: stretch;
`;

const MetricIcon = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F4F9FF;
  border-radius: 4px;
  padding: 2px;
  
  img {
    width: 16px;
    height: 16px;
  }
`;

const MetricName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #000;
  line-height: 20px;
`;

const TooltipContent = styled.div`
  display: flex;
  padding: 4px 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  align-self: stretch;
`;

const CategoryLabel = styled.div`
  font-size: 12px;
  color: #666;
  font-weight: 500;
  line-height: 16px;
`;

const CategoryValue = styled.div`
  font-size: 14px;
  color: #000;
  font-weight: 400;
  line-height: 20px;
`;

const Divider = styled.div`
  height: 1px;
  width: 100%;
  background: var(--Grayscale-gray-500, #E5E5E5);
  margin: 8px 0;
  flex-shrink: 0;
`;

const HyperlinkContainer = styled.div`
  display: flex;
  padding: 2px 0;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
`;

const NoValueMessage = styled.div`
  background: #fff;
  color: var(--Grayscale-gray-800, #666);
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.12px;
  padding: 8px 0;
  width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  min-width: 280px;
`;

const HyperlinkText = styled.span`
  color: var(--Brand-brand-500, #00B0B3);
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px; /* 166.667% */
  letter-spacing: 0.12px;
`;

const ExternalLinkIcon = styled.img`
  width: 12px;
  height: 12px;
  aspect-ratio: 1/1;
`;

const FilterPillsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: flex-start;
  align-self: stretch;
`;

interface FilterPillProps {
  shouldTruncate?: boolean;
}

const FilterPill = styled.div<FilterPillProps>`
  display: flex;
  padding: 2px 8px;
  align-items: center;
  gap: 4px;
  border-radius: 4px;
  border: 1px solid var(--Grayscale-gray-500, #E5E5E5);
  background: var(--Grayscale-gray-200, #FBFBFB);
  height: 24px;
  max-width: ${props => props.shouldTruncate ? '180px' : 'none'};
  overflow: ${props => props.shouldTruncate ? 'hidden' : 'visible'};
  
  .filter-label {
    color: var(--Grayscale-gray-1000, #000);
    font-family: "Roboto Flex";
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px; /* 166.667% */
    letter-spacing: 0.12px;
    text-overflow: ${props => props.shouldTruncate ? 'ellipsis' : 'clip'};
    overflow: ${props => props.shouldTruncate ? 'hidden' : 'visible'};
    white-space: nowrap;
    max-width: ${props => props.shouldTruncate ? '60px' : 'none'};
    flex-shrink: 0;
  }
  
  .filter-value {
    color: var(--Grayscale-gray-1000, #000);
    font-family: "Roboto Flex";
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px; /* 166.667% */
    letter-spacing: 0.12px;
    text-overflow: ${props => props.shouldTruncate ? 'ellipsis' : 'clip'};
    overflow: ${props => props.shouldTruncate ? 'hidden' : 'visible'};
    white-space: nowrap;
    flex: 1;
    min-width: ${props => props.shouldTruncate ? '0' : 'auto'};
  }
`;

const TooltipContentArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
  min-height: 0; /* Important: allows flex item to shrink */
  overflow-y: auto; /* Enable vertical scrolling */
  overflow-x: hidden;
  width: 100%;
  padding-right: 4px; /* Space for scrollbar */
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #E5E5E5;
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #D0D0D0;
  }
`;

const TooltipFooter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  flex-shrink: 0; /* Prevent footer from shrinking */
  margin-top: auto; /* Push to bottom */
  background: #fff; /* Ensure footer has background */
  position: sticky;
  bottom: 0;
  z-index: 1;
`;

const FooterContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
`;

/**
 * Error message container for metric tooltip
 * Features: Light red background, proper spacing, and text wrapping
 */
const ErrorMessageContainer = styled.div`
  display: flex;
  padding: 8px 16px;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 8px;
  align-self: stretch;
  flex-wrap: wrap;
  border-radius: 4px;
  background: var(--Guidance-guidance-alert-light, #FDF0F0);
  margin-bottom: 8px;
  max-width: 100%;
`;

/**
 * Error icon for metric tooltip
 * Features: Proper sizing and positioning
 */
const ErrorIcon = styled.img`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 4px;
`;

/**
 * Error message text for metric tooltip
 * Features: Proper typography, text wrapping, and spacing
 */
const ErrorMessageText = styled.div`
  color: #000;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.12px;
  flex: 1;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
`;

/**
 * Tooltip overlay style configuration
 * Features: Proper positioning, sizing, and auto-adjusting height
 */
const TOOLTIP_OVERLAY_STYLE: React.CSSProperties = {
  width: '320px',
  maxWidth: '320px',
  maxHeight: '300px',
  padding: '0',
  zIndex: 10000,
  position: 'absolute',
  left: '-8px', // Move tooltip left
  top: '2px', // Move tooltip down
};

/**
 * Tooltip overlay inner style configuration
 * Features: Proper overflow handling and auto-adjusting height
 */
const TOOLTIP_OVERLAY_INNER_STYLE: React.CSSProperties = {
  overflow: 'hidden',
  maxHeight: '300px',
};

/**
 * Global styles to override Ant Design tooltip
 * Features: Custom tooltip styling with proper positioning, shadow effects, and auto-adjusting height
 */
const CustomTooltipStyle = createGlobalStyle`
  .custom-metric-tooltip .ant-tooltip-inner {
    background: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
    position: relative !important;
    overflow: hidden !important;
    max-height: 300px !important;
  }
  
  /* Hide the default Ant Design arrow since we're using custom implementation */
  .custom-metric-tooltip .ant-tooltip-arrow {
    display: none !important;
  }
  
  .custom-metric-tooltip .ant-tooltip-content {
    background: var(--Grayscale-gray-100, #FFF) !important;
    border-radius: 6px !important;
    box-shadow: 0 0 60px 0 rgba(0, 0, 0, 0.08) !important;
    overflow: hidden !important;
    position: relative !important;
    max-height: 300px !important;
  }
  
  /* Ensure the tooltip container has proper positioning and auto-adjusting height */
  .custom-metric-tooltip .ant-tooltip-inner > div {
    position: relative !important;
    overflow: hidden !important;
    max-height: 300px !important;
  }
  
  /* Force the tooltip to respect max-height */
  .custom-metric-tooltip {
    overflow: hidden !important;
    max-height: 300px !important;
  }
  
  .custom-metric-tooltip .ant-tooltip-inner,
  .custom-metric-tooltip .ant-tooltip-content,
  .custom-metric-tooltip .ant-tooltip-inner > div {
    overflow: hidden !important;
    max-height: 300px !important;
  }
  
  /* Additional specificity to ensure styles are applied */
  .custom-metric-tooltip .ant-tooltip-content {
    background: var(--Grayscale-gray-100, #FFF) !important;
    border-radius: 6px !important;
    box-shadow: 0 0 60px 0 rgba(0, 0, 0, 0.08) !important;
  }
  
  /* Ensure the tooltip wrapper also has the styling */
  .custom-metric-tooltip {
    background: var(--Grayscale-gray-100, #FFF) !important;
    border-radius: 6px !important;
    box-shadow: 0 0 60px 0 rgba(0, 0, 0, 0.08) !important;
  }
`;

interface MetricTooltipProps {
  metric: {
    id: number;
    metric_id?: number;
    name: string;
    iconSrc?: string;
    category?: string;
    description?: string;
    uuid?: string;
    metric_catalog_id?: number; // Add metric_catalog_id for URL construction
    slice_id?: number; // Add slice_id for URL construction
    instanceId?: string; // Add instanceId for accessing data
  };
  children: React.ReactNode;
  error?: boolean;
  hasNoValue?: boolean;
}

const MetricTooltip: React.FC<MetricTooltipProps> = ({ metric, children, error = false, hasNoValue = false }) => {
  const [tooltipPlacement, setTooltipPlacement] = useState<'top' | 'bottom'>('bottom');
  
  // Get bootstrap data for user permissions
  const bootstrapData = getBootstrapData();
  
  // For verbose name transformation - use the same pattern as ExistingFiltersUI
  const datasources = useSelector((state: any) => 
    state.datasources || {}
  );
  
  // Get inlineMetricsData from Redux state
  const inlineMetricsData = useSelector((state: any) => 
    state?.dashboardInfo?.metadata?.inlineMetricsData || {}
  );
  


  const isFilterTextTruncated = (label: string, value: string) => {
    const combinedText = `${label}: ${value}`;
    return combinedText.length > 40; // Adjust threshold as needed
  };

  // Enhanced function to convert SQL expressions with verbose names
  const convertSqlExpressionToVerbose = (sqlExpression: string) => {
    if (!sqlExpression || typeof sqlExpression !== 'string') {
      return sqlExpression;
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

  // Get verbose map from the dataset if available
  const getVerboseName = (columnName: string) => {
    // Check if datasources are available
    if (!datasources || Object.keys(datasources).length === 0) {

      // Fallback: convert snake_case to Title Case
      if (columnName && typeof columnName === 'string' && columnName.includes('_')) {
        const fallbackName = columnName.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');

        return fallbackName;
      }
      return columnName;
    }
    
    // Find the dataset that matches our datasource ID
    if (metric.instanceId && inlineMetricsData[metric.instanceId]) {
      const metricData = inlineMetricsData[metric.instanceId];
      if (metricData?.datasetId) {
        // Look for the datasource in the datasources state
        // The datasource UID format is typically "datasetId__table"
        const datasourceUid = `${metricData.datasetId}__table`;
        const datasource = datasources[datasourceUid];
        

        
        // Use the same pattern as ExistingFiltersUI: build verbose map from columns
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

  /**
   * Extracts and formats filters from the metric data for display in the tooltip
   * 
   * IMPORTANT: This function preserves the complete original filter structure
   * in the `originalFilter` property while adding display properties for the UI.
   * This ensures that all original filter data is retained for consistency with ExistingFiltersUI.
   */
  const getMetricFilters = () => {
    if (!metric.instanceId || !inlineMetricsData[metric.instanceId]) {
      return [];
    }

    const metricData = inlineMetricsData[metric.instanceId];
    const payload = metricData.payload;

    if (!payload) {
      return [];
    }

    // Array to store filters with display properties and preserved original structure
    // Each filter has: label (display name), value (display value), type (filter type), 
    // clause (SQL clause for SQL filters), and originalFilter (complete original filter object)
    const filters: Array<{label: string, value: string, type: string, clause?: string, originalFilter: any}> = [];

    // Check for adhoc_filters in form_data - this is the single source of truth
    if (payload.form_data && payload.form_data.adhoc_filters && Array.isArray(payload.form_data.adhoc_filters)) {
      payload.form_data.adhoc_filters.forEach((filter: any) => {
        // Create a deep copy of the original filter to preserve all properties
        const originalFilter = structuredClone(filter);
        
        if (filter.expressionType === 'SIMPLE') {
          // Handle array values in comparator properly
          let comparatorValue = filter.comparator || filter.value;
          if (Array.isArray(comparatorValue)) {
            comparatorValue = comparatorValue.join(', ');
          }
          
          const filterObj = {
            label: filter.subject || filter.column || 'Filter',
            value: filter.operator ? `${filter.operator} ${comparatorValue}` : comparatorValue,
            type: 'adhoc',
            // Preserve the original filter with all its properties
            originalFilter: originalFilter
          };
          
          filters.push(filterObj);
        } else if (filter.expressionType === 'SQL') {
          // SQL filter format - try to extract column name for better labeling
          let sqlLabel = filter.clause === 'WHERE' ? 'WHERE Clause' : 'HAVING Clause';
          let sqlValue = filter.sqlExpression || filter.expression || 'SQL Expression';
          
          // Try to extract column name and condition from SQL expression for better labeling
          if (sqlValue && typeof sqlValue === 'string') {
            // Look for patterns like "ColumnName > Value" or "ColumnName IN (Value1, Value2)"
            const columnMatch = sqlValue.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*([<>=!]+|IN|NOT\s+IN)\s*(.+)$/i);
            if (columnMatch) {
              const [, columnName, operator, value] = columnMatch;
              sqlLabel = columnName; // Use the extracted column name as label
              sqlValue = sqlValue; // Keep the original SQL expression as value
            } else {
              // Fallback: try to extract just the column name at the beginning
              const simpleColumnMatch = sqlValue.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s/);
              if (simpleColumnMatch) {
                sqlLabel = simpleColumnMatch[1]; // Use the extracted column name as label
              }
            }
          }
          
          filters.push({
            label: sqlLabel,
            value: sqlValue,
            type: 'sql',
            clause: filter.clause,
            // Preserve the original filter with all its properties
            originalFilter: originalFilter
          });
        }
      });
    }

    // Check for filters in queries array
    if (payload.queries && Array.isArray(payload.queries)) {
      payload.queries.forEach((query: any) => {
        if (query.filters && Array.isArray(query.filters)) {
          query.filters.forEach((filter: any) => {
            // Create a deep copy of the original filter to preserve all properties
            const originalFilter = structuredClone(filter);
            
            // Handle array values in val field properly
            let filterValue = filter.val || filter.value || '';
            if (Array.isArray(filterValue)) {
              filterValue = filterValue.join(', ');
            }
            
            const filterObj = {
              label: filter.col || filter.column || 'Filter',
              value: filter.op ? `${filter.op} ${filterValue}` : filterValue,
              type: 'query',
              // Preserve the original filter with all its properties
              originalFilter: originalFilter
            };
            
            filters.push(filterObj);
          });
        }
      });
    }

    // Instead of parsing from queries.extras, use the adhoc_filters which contains the most up-to-date data
    // The adhoc_filters already has the correct clause information (WHERE/HAVING) for SQL expressions
    // Note: The adhoc_filters processing above already handles SQL expressions with their clause information
    // So we don't need to duplicate the WHERE/HAVING processing from queries.extras

    // Check for time_range in form_data
    if (payload.form_data && payload.form_data.time_range) {
      const timeRangeFilter = {
        label: 'Time Range',
        value: payload.form_data.time_range,
        type: 'time_range',
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
      if (!filter || typeof filter !== 'object') return true;
      
      // Create a unique key for each filter based on its content
      // For better deduplication, normalize the filter data
      const normalizedLabel = filter.label?.toLowerCase().trim();
      const normalizedValue = filter.value?.toLowerCase().trim();
      
      // Create a more robust unique key that focuses on the actual filter condition
      const filterKey = JSON.stringify({
        label: normalizedLabel,
        value: normalizedValue,
        type: filter.type
      });
      
      // Keep only the first occurrence of each filter
      return index === self.findIndex(f => {
        if (!f || typeof f !== 'object') return false;
        
        const fNormalizedLabel = f.label?.toLowerCase().trim();
        const fNormalizedValue = f.value?.toLowerCase().trim();
        
        const fKey = JSON.stringify({
          label: fNormalizedLabel,
          value: fNormalizedValue,
          type: f.type
        });
        
        return fKey === filterKey;
      });
    });

    // Additional deduplication: Keep only the first occurrence of each unique filter condition
    const finalFilters = uniqueFilters.filter((filter, index, self) => {
      if (!filter || typeof filter !== 'object') return true;
      

      
      // Find the first occurrence of this filter condition
      const firstOccurrenceIndex = self.findIndex((f, fIndex) => {
        if (!f || typeof f !== 'object') return false;
        
        // Compare filter conditions (label + value) regardless of type
        const filterLabel = filter.label?.toLowerCase().trim();
        let filterValue = filter.value?.toLowerCase().trim();
        const fLabel = f.label?.toLowerCase().trim();
        let fValue = f.value?.toLowerCase().trim();
        
        // Normalize SQL expressions and WHERE/HAVING clauses for better comparison
        // Remove common SQL formatting differences like parentheses, extra spaces
        if (filterValue) {
          filterValue = filterValue
            .replace(/[()]/g, '') // Remove parentheses
            .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
            .trim();
        }
        
        if (fValue) {
          fValue = fValue
            .replace(/[()]/g, '') // Remove parentheses
            .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
            .trim();
        }
        
        // Special handling for SQL filters with different clauses (WHERE vs HAVING)
        // If we have SQL filters with the same condition but different clauses, they are not duplicates
        const isFilterSql = filter.type === 'sql';
        const isFSql = f.type === 'sql';
        
        if (isFilterSql && isFSql) {
          // For SQL filters, also check if they have the same clause
          if (filter.clause === f.clause && filterLabel === fLabel && filterValue === fValue) {

            return true; // This is a duplicate
          }
        }
        
        return filterLabel === fLabel && filterValue === fValue;
      });
      
      // Keep only the first occurrence
      if (index === firstOccurrenceIndex) {
        return true;
      } else {
        return false;
      }
    });

    // Apply verbose names to filters
    const processedFilters = finalFilters.map(filter => {
      // Create a deep copy to avoid mutating the original filter object
      let processedFilter = structuredClone(filter);
      
      // Convert the label to verbose name
      processedFilter.label = getVerboseName(filter.label);
      
      // For SQL filters, also convert the value/expression to verbose names
      if (filter.type === 'sql' && filter.value) {
        processedFilter.value = convertSqlExpressionToVerbose(filter.value);
      }
      
      return processedFilter;
    });



    return processedFilters;
  };
  
  const metricFilters = getMetricFilters();

  const checkUserPermissions = (category: string) => {
    const metric_data = (bootstrapData?.user as any)?.metric_categories || [];
    for (const item of metric_data) {
      if (item[category]) {
        return true;
      }
    }
    return false;
  };

  const getMetricUrl = (url: string, id: string) => {
    const fullUrl = `${url}&from=metric_catalog_list&id=${id}&edit=false`;
    
    let previousUrl = sessionStorage.getItem('metricUrlOverview');
    if (previousUrl !== undefined) {
      sessionStorage.removeItem('metricUrlOverview');
    }
    sessionStorage.setItem('metricUrlOverview', fullUrl);
    return fullUrl;
  };

  // Handle click function
  const handleMetricCatalogClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const category = metric.category || '';
    const hasPermission = checkUserPermissions(category);
    
    if (hasPermission) {
      // Use the correct parameters from the new API response structure
      // metric_catalog_id for the 'id' parameter and slice_id for the form_data
      let metricCatalogId = metric.metric_catalog_id;
      let sliceId = metric.slice_id;
      
      // If we don't have the required data, try to get it from a direct mapping
      // This is a fallback for existing metrics that don't have the data in Redux
      if (!metricCatalogId || !sliceId) {
        // Direct mapping based on the API response you provided
        // This is a temporary solution until the Redux state is properly updated
        const directMapping: { [key: number]: { metric_catalog_id: number; slice_id: number } } = {
          90: { metric_catalog_id: 12, slice_id: 1230 }, // Average Turnover Tenure
          // Add more mappings as needed
        };
        
        const mappedData = directMapping[metric.id];
        if (mappedData) {
          metricCatalogId = mappedData.metric_catalog_id;
          sliceId = mappedData.slice_id;
        }
      }
      
      // Check if we have the required data after fallback attempts
      if (!sliceId) {
        // Fallback: try to construct URL with just metric_catalog_id
        let fallbackUrl = `/explore/?form_data=%7B%22metric_id%22%3A%20${metric.id}%7D&from=metric_catalog_list&id=${metricCatalogId || metric.id}&edit=false`;
        window.open(fallbackUrl, '_blank');
        return;
      }
      
      // Check if we have metric_catalog_id
      if (!metricCatalogId) {
        // Fallback: use metric.id as metric_catalog_id
        let fallbackUrl = `/explore/?form_data=%7B%22slice_id%22%3A%20${sliceId}%7D&from=metric_catalog_list&id=${metric.id}&edit=false`;
        window.open(fallbackUrl, '_blank');
        return;
      }
      
      // Construct URL according to the ideal response format
      let url = `/explore/?form_data=%7B%22slice_id%22%3A%20${sliceId}%7D&from=metric_catalog_list&id=${metricCatalogId}&edit=false`;
      
      // Open in new tab
      window.open(url, '_blank');
    } else {
      sendHRXMessage('show-activation-plan');
    }
  };

  const tooltipContent = (
    <TooltipContainer>
      <TooltipContentArea>
        {error && (
          <ErrorMessageContainer>
            <ErrorIcon src={getAssetPrefixUrl() + "/static/assets/images/icons/inline-metrics-danger-alert.svg"} alt="Error" />
            <ErrorMessageText>
              There was an error retrieving this metric. The metric may be misconfigured or the query failed to run.
            </ErrorMessageText>
          </ErrorMessageContainer>
        )}
        
        {hasNoValue && !error && (
          <NoValueMessage>
            This metric has no value. Check your filters or time range to ensure data is available.
          </NoValueMessage>
        )}
        
        <TooltipTitle>
          <MetricIcon>
            <img 
              src={metric.iconSrc || getAssetPrefixUrl() + '/static/assets/images/icons/number_metric.svg'} 
              alt={metric.name} 
            />
          </MetricIcon>
          <MetricName>{metric.name}</MetricName>
        </TooltipTitle>
        
        <TooltipContent>
          <CategoryLabel>Category</CategoryLabel>
          <CategoryValue>{metric.category || 'Uncategorized'}</CategoryValue>
        </TooltipContent>
        
        {/* Debug info for filters */}
        {/* <TooltipContent>
          <CategoryLabel>Debug Info</CategoryLabel>
          <div style={{ fontSize: '10px', color: '#666' }}>
            <div>metricFilters.length: {metricFilters.length}</div>
            <div>metric.instanceId: {metric.instanceId}</div>
            <div>inlineMetricsData keys: {Object.keys(inlineMetricsData).join(', ')}</div>
            {metric.instanceId && inlineMetricsData[metric.instanceId] && (
              <div>Payload exists: {JSON.stringify(!!inlineMetricsData[metric.instanceId].payload)}</div>
            )}
          </div>
        </TooltipContent> */}
        
        {metricFilters.length > 0 && (
          <TooltipContent>
            <CategoryLabel>Filters applied</CategoryLabel>
            <FilterPillsContainer>
              {metricFilters.map((filter, index) => {
                const shouldTruncate = isFilterTextTruncated(filter.label, filter.value);
                return (
                  <FilterPill key={index} shouldTruncate={shouldTruncate}>
                    {shouldTruncate ? (
                      <Tooltip
                        title={`${filter.label}: ${filter.value}`}
                        placement="top"
                        mouseEnterDelay={0.5}
                        mouseLeaveDelay={0.1}
                        overlayStyle={{
                          maxWidth: '250px',
                          wordBreak: 'break-word'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
                          <span className="filter-label">{filter.label}:</span>
                          <span className="filter-value">{filter.value}</span>
                        </div>
                      </Tooltip>
                    ) : (
                      <>
                        <span className="filter-label">{filter.label}:</span>
                        <span className="filter-value">{filter.value}</span>
                      </>
                    )}
                  </FilterPill>
                );
              })}
            </FilterPillsContainer>
          </TooltipContent>
        )}
      </TooltipContentArea>
      
      <TooltipFooter>
        <Divider />
        <FooterContent>
          <HyperlinkContainer 
            onClick={handleMetricCatalogClick}
            data-testid={generateTestId('ap.<experience>.pages.inline-metric.button.metric-catalog-overview.click')}
          >
            <HyperlinkText>View in Metric Catalog</HyperlinkText>
            <ExternalLinkIcon src={getAssetPrefixUrl() + "/static/assets/images/icons/inline-metrics-external-link.svg"} alt="External link" />
          </HyperlinkContainer>
        </FooterContent>
      </TooltipFooter>
    </TooltipContainer>
  );

  return (
    <>
      <CustomTooltipStyle />
      <Tooltip
        title={tooltipContent}
        placement="bottom"
        mouseEnterDelay={0.3}
        mouseLeaveDelay={0.1}
        destroyTooltipOnHide={true}
        overlayStyle={TOOLTIP_OVERLAY_STYLE}
        overlayInnerStyle={TOOLTIP_OVERLAY_INNER_STYLE}
        overlayClassName="custom-metric-tooltip"
        getPopupContainer={() => document.body}
        onVisibleChange={(visible) => {
          if (visible) {
            // Use MutationObserver to detect when tooltip is positioned
            const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                  const tooltipElement = mutation.target as HTMLElement;
                  const style = tooltipElement.style.transform;
                  
                  // Check if tooltip is positioned above (negative translateY)
                  if (style && style.includes('translateY(-')) {
                    setTooltipPlacement('top');
                  } else {
                    setTooltipPlacement('bottom');
                  }
                  
                  observer.disconnect();
                }
              });
            });
            
            const tooltipElement = document.querySelector('.custom-metric-tooltip');
            if (tooltipElement) {
              observer.observe(tooltipElement, { attributes: true, attributeFilter: ['style'] });
            }
          }
        }}
      >
        {children}
      </Tooltip>
    </>
  );
};

export default MetricTooltip; 