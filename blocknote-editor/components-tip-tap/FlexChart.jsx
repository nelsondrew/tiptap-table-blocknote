import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import styled from 'styled-components';
import ChartPlaceholder from "./ChartPlaceHolder";
import { CHART_TYPE } from '../../../src/dashboard/util/componentTypes';
import { DragDroppable } from '../../../src/dashboard/components/dnd/DragDroppable';
import { useDispatch, useSelector } from 'react-redux';
import { createComponent, deleteComponent } from '../../../src/dashboard/actions/dashboardLayout';
import PortableChart from '../Components/PortableChart';
import shortid from 'shortid';
import { isNull } from 'lodash';


const ChartContainer = styled.div`
  width: ${props => `${props.width}px`};
  height: ${props => `${props.height}px`};
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 4px;
  transition: all 0.2s ease;
  border: 1px solid #dee2e6;

  &[data-hover="true"] {
    background:${props => `${props.hasChart ? '#e3bfbf' : '#E5F7F7'}`};
    border-style: dashed;
    border-width: 2px;
    border-color:${props => `${props.hasChart ? '#ef4444' : '#00b0b3'}`} ;
  }
`;

export const FlexChart = ({ node, editor }) => {
  const editorId = node.attrs.editorId;
  const parentId = node.attrs.parentId;
  const chartId = node.attrs.chartData?.chartId;
  const chartData = node.attrs.chartData;
  const chartLayoutId = node.attrs.chartLayoutId;
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef(null);
  const dispatch = useDispatch();
  const sliceTitlesMap = useSelector(
      (state) => state?.dashboardState?.sliceTitlesMap || {},
    );
  const [fallbackSliceId, setFallbackSliceId] = useState(null);
  


  const chartDataFromLayout = useSelector((state) => {
    if(chartLayoutId && state?.dashboardLayout?.present && state?.dashboardLayout?.present?.[chartLayoutId]) {
      const data = state?.dashboardLayout?.present?.[chartLayoutId]?.meta || {};
      return data;
    }
    return {};
  });


    useEffect(() => {
      const chartData = node?.attrs?.chartData;
      if (!isNull(chartData)) {
        const chartTitle = chartData?.sliceName;
        if (!!sliceTitlesMap[chartTitle]) {
          setFallbackSliceId(sliceTitlesMap?.[chartTitle]);
        }
      }
    }, [node?.attrs?.chartData, sliceTitlesMap]);

  const component = {
    id: `chart-${editorId}`,
    type: 'CHART',
    meta: {
      width: dimensions.width,
      height: dimensions.height,
      parentId,
    },
  };


  // Function to check if mouse is still over chart
  const checkHoverCondition = (clientOffset) => {
    const chartContainer = document.getElementById(`chart-${editorId}`);
    if (!chartContainer) {
      setIsHovering(false);
      return false;
    }

    const rect = chartContainer.getBoundingClientRect();
    const isOverChart =
      clientOffset.x >= rect.left &&
      clientOffset.x <= rect.right &&
      clientOffset.y >= rect.top &&
      clientOffset.y <= rect.bottom;

    if (!isOverChart) {
      setIsHovering(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return isOverChart;
  };

  const handleHover = (hoverProps, monitor) => {
    if (!monitor) {
      setIsHovering(false);
      return;
    }

    if (!monitor.isOver()) {
      setIsHovering(false);
      return;
    }

    const clientOffset = monitor.getClientOffset();
    if (!clientOffset) {
      setIsHovering(false);
      return;
    }

    const itemType = monitor.getItem()?.type;
    if (itemType !== CHART_TYPE) {
      setIsHovering(false);
      return;
    }

    const isOverChart = checkHoverCondition(clientOffset);
    setIsHovering(isOverChart);

    // Start interval check if hovering
    if (isOverChart && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        const currentOffset = monitor.getClientOffset();
        if (currentOffset) {
          checkHoverCondition(currentOffset);
        } else {
          setIsHovering(false);
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, 500);
    }
  };

  const handleDrop = (dropResult, monitor) => {
    setIsHovering(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if(!!chartId) {
      console.error("It already has a chart");
      return;
    }

    const chartContainer = document.getElementById(`chart-${editorId}`);
    if (!chartContainer) return;

    const clientOffset = monitor.getClientOffset();
    if (!clientOffset) return;

    const rect = chartContainer.getBoundingClientRect();
    const isOverChart =
      clientOffset.x >= rect.left &&
      clientOffset.x <= rect.right &&
      clientOffset.y >= rect.top &&
      clientOffset.y <= rect.bottom;

    if (!isOverChart) return;

    // Handle the drop in the chart
    if (dropResult.dragging?.meta?.chartId) {
      const newSliceId = dropResult.dragging.meta.chartId;
      const chartUuid = shortid.generate();
      const customLayoutId = `${CHART_TYPE}-${chartUuid}`;


      // Create component in dashboard layout
      const modifiedDropResult = {
        ...dropResult,
        position: "DROP_TOP",
        generatedId: customLayoutId,
        destination: {
          ...dropResult.destination,
          id: parentId,
          type: 'HELLO',
          index: 0,
        },
      };

      dispatch(createComponent(modifiedDropResult));
      setTimeout(() => {
        // Update chart attributes
        editor
          .chain()
          .focus()
          .updateAttributes('flexChart', {
            chartData: dropResult.dragging.meta,
            chartId: newSliceId,
            selected: true,
            chartLayoutId: customLayoutId,
            parentId: parentId,
          })
          .run();

      }, 500)
    }
  };

  useLayoutEffect(() => {
    const findTableCellContainer = () => {
      const chartElement = document.getElementById(`chart-${editorId}`);
      if (!chartElement) return null;

      let current = chartElement.parentElement;
      while (current) {
        if (current.id?.startsWith('container-')) {
          return current;
        }
        current = current.parentElement;
      }
      return null;
    };

    const initializeObserver = () => {
      const tableCellContainer = findTableCellContainer();
      if (!tableCellContainer) {
        setTimeout(initializeObserver, 100);
        return;
      }

      const { width, height } = tableCellContainer.getBoundingClientRect();
      setDimensions({
        width: Math.max(width, 0), 
        height: Math.max(height, 0)
      });

      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setDimensions({
            width: Math.max(width , 0),
            height: Math.max(height , 0)
          });
        }
      });

      resizeObserver.observe(tableCellContainer);

      // Cleanup
      return () => {
        resizeObserver.unobserve(tableCellContainer);
      };
    };

    // Start initialization
    const cleanup = initializeObserver();
    return () => cleanup?.();

  }, [editorId]);

  const chartIdForSlice =  chartDataFromLayout?.chartId ||  chartData?.chartId || fallbackSliceId;

  return (
    <NodeViewWrapper>
      <DragDroppable
        component={component}
        parentComponent={{ id: `container-${editorId}`, type: 'ROW' }}
        orientation="row"
        index={0}
        depth={0}
        onDrop={handleDrop}
        onHover={handleHover}
        editMode
      >
        {({ dropIndicatorProps, dragSourceProps }) => (
          <ChartContainer
            id={`chart-${editorId}`}
            width={dimensions.width}
            height={dimensions.height}
            data-hover={isHovering}
            hasChart={!!chartId}
            {...dragSourceProps}
          >
            {chartIdForSlice && dimensions.height > 0  ? (
              <PortableChart
                sliceId={parseInt(chartIdForSlice)}
                width={dimensions.width - 40}
                height={dimensions.height - 20}
                chartLayoutId={node.attrs.chartLayoutId || 'dummy-layout-id'} // Use the stored chartLayoutId
                editorChartId={`container-${editorId}`}
                className={`pages-chart-id-${parseInt(chartData?.chartId)}`}
              />
            ) : (
              <ChartPlaceholder
                width={dimensions.width}
                height={dimensions.height}
              />
            )}
          </ChartContainer>
        )}
      </DragDroppable>
    </NodeViewWrapper>
  );
}; 