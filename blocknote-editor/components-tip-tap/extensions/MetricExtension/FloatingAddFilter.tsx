// New Strategy to integrate the Filters:
import React, { useEffect, useRef, useState, useMemo } from 'react';
// import { triggerQuery } from 'src/components/Chart/chartAction';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { ListFilterIcon } from 'lucide-react';
import tippy, { sticky } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import ReactDOM from 'react-dom';
import AdhocFilterEditPopover from 'src/explore/components/controls/FilterControl/AdhocFilterEditPopover';
import AdhocFilter from 'src/explore/components/controls/FilterControl/AdhocFilter'; // instantiate default

import { getChartDataRequest } from 'src/components/Chart/chartAction';
import { postChartFormData } from 'src/components/Chart/chartAction';
import { fetchInlineMetricValue } from 'src/utils/pages/inlineMetricAPI';

import { generateTestId } from './utils/experienceUtils';


const FloatingMenuButton = styled.button`
  background: white;
  border: 1px solid #F2F2F2;
  border-radius: 4px;
  padding: 8px;
  font-weight: 500;
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 1%;
  color: #000;
  box-shadow: 0px 1px 4px 1px #00000014;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;

  svg {
    width: 18px;
    height: 18px;
    stroke-width: 2;
  }

  &:hover {
    /* background: #f9fafb; */
    color: #00B0B3;
  }
`;

const FloatingAddFilter = ({
  referenceElement,
  metric,
  formData,
  sliceId,
  existingFilters = [],
  datasource,
  options,
  onMouseEnter,
  onMouseLeave,
  onMetricValueUpdate,
}: {
  referenceElement: HTMLElement | null;
  metric: string;
  sliceId?: number;
  formData?: Record<string, any>;
  datasource: any;
  options: any[];
  existingFilters?: any[];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onMetricValueUpdate?: (val: number | string) => void;

}) => {
  const dispatch = useDispatch();

  const tippyRef = useRef<any>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [showPopover, setShowPopover] = useState(false);


  const dashboardId = useSelector((state) => state?.explore?.form_data?.dashboardId || null);
  const timeout = useSelector((state) => state?.common?.conf?.SUPERSET_WEBSERVER_TIMEOUT);

  const adhocFilter = useMemo(() => {
    const defaultFilter = new AdhocFilter({
      expressionType: 'SIMPLE',
      clause: 'WHERE',
      subject: metric,
      operator: '==',
      comparator: '',
    });

    const matchedFilter = existingFilters?.find(
      f => f?.subject === metric && f?.expressionType === 'SIMPLE'
    );

    return matchedFilter
      ? new AdhocFilter({ ...matchedFilter })
      : defaultFilter;
  }, [metric, existingFilters]);


  // Below is not getting triggered for some reason
const handleFilterSave = async (newFilter: any) => {
  console.log("newFilter: ", newFilter)
  try {
    const result = await fetchInlineMetricValue({
      datasetId: datasource?.id,
      metric,
      filters: [newFilter],
    });

    if (typeof result === 'number' && onMetricValueUpdate) {
      onMetricValueUpdate(result);
    }

    setShowPopover(false);
  } catch (err) {
    console.error('Failed to fetch updated metric value:', err);
    if (onMetricValueUpdate) {
      onMetricValueUpdate('Error');
    }
    setShowPopover(false);
  }
};



  if (!anchorRef.current) {
    anchorRef.current = document.createElement('div');
  }

  useEffect(() => {
    if (!referenceElement || !anchorRef.current) return;

    const rect = referenceElement.getBoundingClientRect();

    tippyRef.current = tippy(anchorRef.current, {
      content: anchorRef.current,
      getReferenceClientRect: () => rect,
      trigger: 'manual',
      placement: 'bottom',
      interactive: true,
      appendTo: document.body,
      plugins: [sticky],
      offset: [2, 2],
    });

    tippyRef.current.show();

    const updatePosition = () => {
      const newRect = referenceElement.getBoundingClientRect();
      tippyRef.current?.setProps({
        getReferenceClientRect: () => newRect,
      });
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      tippyRef.current?.destroy();
      tippyRef.current = null;
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [referenceElement]);

  return anchorRef.current
    ? ReactDOM.createPortal(
        showPopover ? (
          <AdhocFilterEditPopover
            adhocFilter={adhocFilter}
            onChange={newFilter => {
              handleFilterSave(newFilter);
            }}
            onClose={() => setShowPopover(false)}
            onResize={() => {}}
            options={options}
            datasource={datasource}
            className="inline-metrics floating-add-filter-popover"
            source="pages-inline-metrics"
            isFromMetricNode={true}
          />
        ) : (
            <FloatingMenuButton
              onClick={() => setShowPopover(true)}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              data-testid={generateTestId('ap.advisor.pages.inline-metric.button.filter-add.click')}
            >
            <ListFilterIcon strokeWidth={2} size={16} />
            Add Filter
          </FloatingMenuButton>
        ),
        anchorRef.current,
      )
    : null;
};

export default FloatingAddFilter;