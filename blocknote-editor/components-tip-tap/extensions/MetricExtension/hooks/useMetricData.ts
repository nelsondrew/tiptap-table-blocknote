import { useEffect, useState, useRef, useCallback } from 'react';
import { fetchInlineMetricValue } from '../../../../../../src/utils/pages/inlineMetricAPI';

interface UseMetricDataProps {
  nodeDatasetId: number;
  nodeMetric: string;
  nodeUuid: string;
  nodeId: number;
  relevantFilters: any;
}

interface MetricDataState {
  value: string | number;
  isLoading: boolean;
  error: Error | null;
}

const LOADING_STRING = '...';
const ERROR_STRING = 'Error';

export const useMetricData = ({
  nodeDatasetId,
  nodeMetric,
  nodeUuid,
  nodeId,
  relevantFilters,
}: UseMetricDataProps) => {
  const [state, setState] = useState<MetricDataState>({
    value: LOADING_STRING,
    isLoading: true,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const fetchMetric = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await fetchInlineMetricValue({
        datasetId: nodeDatasetId,
        metric: nodeMetric,
        filters: [relevantFilters],
      });

      if (isMountedRef.current) {
        setState({
          value: result !== null ? result : ERROR_STRING,
          isLoading: false,
          error: null,
        });
      }
    } catch (err) {
      if (isMountedRef.current && err.name !== 'AbortError') {
        console.error('Metric fetch failed:', err);
        setState({
          value: ERROR_STRING,
          isLoading: false,
          error: err as Error,
        });
      }
    }
  }, [nodeDatasetId, nodeMetric, nodeUuid, nodeId, relevantFilters]);

  useEffect(() => {
    fetchMetric();
  }, [fetchMetric]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const retry = useCallback(() => {
    fetchMetric();
  }, [fetchMetric]);

  return {
    ...state,
    retry,
  };
}; 