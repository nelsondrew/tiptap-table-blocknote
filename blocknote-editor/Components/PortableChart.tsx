import React, { useRef, useEffect, useLayoutEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Chart from 'src/dashboard/containers/Chart';
import { isEmpty, isObject, noop, isNull } from "lodash";
import styled from "styled-components";
import { updateComponents } from "src/dashboard/actions/dashboardLayout";

interface PortableChartProps {
  sliceId: number;
  width?: number;
  height?: number;
  chartLayoutId: string;
  editorChartId : string;
  className?: string;
}

const ChartWrapper = styled.div`
  height: 100%;
  width: 100%;
  padding: 10px ;
  .chart-slice {
    width: 100%;
    height: 100%;
  }
  .slice_container {
    pointer-events: ${props => props.$editMode ? 'none' : 'auto'};
  }

  .chart-slice[data-test-viz-type='handlebars'] {
    p {
      padding-left: revert !important;
      margin-left: revert !important;
      color: black !important;
    }
  }
`;

const PortableChart: React.FC<PortableChartProps> = ({
  sliceId,
  width = 600,
  height = 400,
  chartLayoutId = '',
  editorChartId = '',
  className = '',
}) => {
  const sliceEntityData = useSelector(
    state => state?.sliceEntities?.slices[sliceId],
  );

  const metricEntityData = useSelector((state) => state?.sliceEntities?.metricSlices[sliceId])

  const dynamicDashboardId = useSelector(state => state?.dashboardInfo?.id);

  const directPathToChild = useSelector(
    state => state?.dashboardState?.directPathToChild
  );
  const chart = useSelector(state => state.charts?.[sliceId]);

  const editMode = useSelector(state=> state.dashboardState.editMode)


  const componentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLElement | null>(null);

  // Check if a chart is empty
  const [emptyChartWidth, setEmptyChartWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    setTimeout(() => {
      scrollRef.current = document.querySelector('.header-wrap');
    }, 300);
  }, []);


  const componentLayoutState = useSelector((state) => {
    if (
      state?.dashboardLayout?.present &&
      isObject(state?.dashboardLayout?.present) &&
      state?.dashboardLayout?.present?.hasOwnProperty(chartLayoutId)
    ) {
      return state?.dashboardLayout?.present[chartLayoutId];
    }
    return {};
  });

useEffect(() => {
  if (
    chart &&
    !chart.isLoading &&
    !chart.error &&
    Array.isArray(chart.queriesResponse) &&
    chart.queriesResponse.length > 0 &&
    Array.isArray(chart.queriesResponse[0]?.data) &&
    chart.queriesResponse[0].data.length === 0
  ) {
    // Find closest .portable-chart-component ancestor
    const chartSliceElement = componentRef.current?.querySelector('.chart-slice');
    if (chartSliceElement) {
      let ancestor = chartSliceElement.parentElement;
      let level = 0;

      // Iterating till level 4
      while (ancestor && level < 5) {
        if (ancestor.classList.contains('portable-chart-component')) {
          const width = ancestor.getBoundingClientRect().width;
          setEmptyChartWidth(width);
          break;
        }
        ancestor = ancestor.parentElement;
        level++;
      }
    }
  } else {
    setEmptyChartWidth(null);
  }
}, [chart]);

useEffect(() => {
  if (
    directPathToChild?.includes(chartLayoutId) &&
    componentRef.current &&
    scrollRef.current
  ) {
    const chartContainerElement = document.getElementById(editorChartId);

    let attempts = 0;
    const maxAttempts = 10;

    const tryScroll = () => {
      const element = componentRef.current;
      const elementRect = element?.getBoundingClientRect();

      // Ensure the element is rendered and has height
      if (element && elementRect.height > 0 && scrollRef.current) {
        scrollRef.current.scrollTo({
          top: elementRect.top + scrollRef.current.scrollTop - 90,
          behavior: 'smooth',
        });

        // Highlight border
        if (chartContainerElement) {
          chartContainerElement.style.outline = '2px solid #3b82f6';
          chartContainerElement.style.boxShadow =
            '0 0 10px rgba(59, 130, 246, 0.5)';

          setTimeout(() => {
            chartContainerElement.style.outline = '';
            chartContainerElement.style.boxShadow = '';
          }, 1000);
        }
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(tryScroll, 100); // Retry after 100ms
      }
    };

    tryScroll();
  }
}, [directPathToChild, chartLayoutId]);
 
  // useEffect(() => {
  //   if (directPathToChild?.includes(chartLayoutId) && componentRef.current && scrollRef.current) {
  //     const element = componentRef.current;
  //     const elementRect = element.getBoundingClientRect();

  //     scrollRef.current.scrollTo({
  //       top: elementRect.top - 90,
  //       behavior: 'smooth'
  //     });
    
  //     // For style use chart container
  //     const chartContainerElement = document.getElementById(editorChartId);

  //     if (!isNull(chartContainerElement)) {
  //       chartContainerElement.style.outline = '2px solid #3b82f6';
  //       chartContainerElement.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)';

  //     }

  //     setTimeout(() => {
  //       if (chartContainerElement) {
  //         chartContainerElement.style.outline = '';
  //         chartContainerElement.style.boxShadow = '';
  //       }
  //     }, 1000);
  //   }
  // }, [directPathToChild, chartLayoutId]);

  const dispatch = useDispatch();

  const handleUpdateSliceName = useCallback(
    (nextName: string) => {
      if (chartLayoutId && !isEmpty(componentLayoutState)) {
        dispatch(
          updateComponents({
            [chartLayoutId]: {
              ...componentLayoutState,
              meta: {
                ...componentLayoutState?.meta,
                sliceNameOverride: nextName,
              },
            },
          }),
        );
      }
    },
    [componentLayoutState],
  );

  const getSliceName = () => {
         const sliceName = componentLayoutState?.meta?.sliceNameOverride
            ? componentLayoutState?.meta?.sliceNameOverride
            : sliceEntityData?.slice_name || "";
      return  sliceName || metricEntityData?.slice_name || ''
}

  return (
    <ChartWrapper
      className={`chart-wrapper ${className}`}
      ref={componentRef}
      style={emptyChartWidth ? { width: emptyChartWidth } : {}} // , overflow: 'hidden'
      $editMode={editMode}
    >
      <Chart
        componentId={chartLayoutId}
        id={sliceId}
        dashboardId={dynamicDashboardId}
        width={width}
        height={height}
        sliceName={
          componentLayoutState?.meta?.sliceNameOverride
            ? componentLayoutState?.meta?.sliceNameOverride
            : getSliceName()
        }
        updateSliceName={handleUpdateSliceName}
        isComponentVisible={true}
        handleToggleFullSize={noop}
        isFullSize={false}
        setControlValue={noop}
        extraControls={[]}
        isInView={true}
      />
    </ChartWrapper>
  );
};

export default PortableChart;
