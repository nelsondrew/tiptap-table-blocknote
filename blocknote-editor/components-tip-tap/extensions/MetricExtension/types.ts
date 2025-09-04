export interface MetricItem {
    id: number;
    name: string;
    iconSrc: string;
    isMetric: boolean;
    datasetId: number;
    metric: string;
    uuid: string;
    description: string;
  }
  
  export interface MetricListProps {
    items: MetricItem[];
    command: (item: MetricItem) => void;
    query?: string;
    editor: any;
    range: any;
  }
  
  export interface MetricApiResponse {
    result: Array<{
      metric_id: number;
      verbose_name?: string;
      metric_name?: string;
      metric_res_type?: string;
      datasource_id: number;
      metric_uuid: string;
      definition?: string;
    }>;
  }
  
  export interface MetricNodeAttrs {
    id: number;
    label: string;
    icon: string;
    metric: string;
    datasetId: number;
    uuid: string;
  }
  
  export interface InlineMetricData {
    [uuid: string]: {
      id: number;
      datasetId: number;
      uuid: string;
      payload: Record<string, any>;
    };
  }
  
  export interface FilterState {
    filters: any[];
    time__range?: string;
  } 