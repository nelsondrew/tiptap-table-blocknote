import { ReactRenderer } from '@tiptap/react'
import { Tooltip } from 'antd';
import tippy from 'tippy.js'
import Mention from '@tiptap/extension-mention'
import React, { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react'
import styled from 'styled-components'
import { Tabs } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { dashboardInfoChanged } from 'src/dashboard/actions/dashboardInfo'
import { getAssetPrefixUrl } from 'src/utils/HRXUtils';

import { v4 as uuidv4 } from 'uuid';
import { generateTestId } from './utils/experienceUtils';

const MentionList = styled.div`
  /* background: white;
  border-radius: 8px;
  box-shadow: rgb(15 15 15 / 5%) 0px 0px 0px 1px, rgb(15 15 15 / 10%) 0px 3px 6px, rgb(15 15 15 / 20%) 0px 9px 24px;
  min-width: 300px;
  overflow: hidden;
  height: 25vh;
overflow-y: auto; */
  width: 320px;
  border-radius: 8px;
  box-shadow: 0px 0px 60px 0px #00000014;
  background: white;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 300px;

  .ant-tabs {
    .ant-tabs-nav {
      margin: 0;
      background: #fff;
      padding: 0;
      border-bottom: none !important;
      &::before {
        display: none !important;
      }
    }

    .ant-tabs-nav-list {
      width: 100%;
      display: flex;
    }

    .ant-tabs-nav-operations {
      display: none !important;
    }

    .ant-tabs-tab {
      padding: 6px 12px;
      margin: 0 !important;
      flex: 1;
      font-weight: 500;
      justify-content: flex-start;
      background: transparent !important;
      border: none !important;
      
      &.ant-tabs-tab-active .ant-tabs-tab-btn {
        background: white !important;
        border-radius: 0;
        font-weight: 500;
        font-size: 12px;
        line-height: 20px;
        letter-spacing: 1%;
        vertical-align: middle;
        color: #666 !important;
      }
    }
  }

  .ant-tabs-content-holder {
    background: white;
  }

  .section-title {
    color: #666;
    font-size: 13px;
    padding: 8px 12px;
    margin-top: 8px;
    font-weight: 500;
  }

  .mention-item {
    border-radius: 0;
    padding: 8px 16px;
    cursor: pointer;
    display: flex;
    align-items: flex-start;
    gap: 4px;
    margin: 0px 12px;

    &.is-selected,
    &:hover {
      background: #fbfbfb;
      border-radius: 4px;
    }
  }

  .avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgb(0, 101, 255);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 500;
  }

  .item-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #F4F9FF;
    font-size: 16px;
    border-radius: 4px;
    padding: 2px;
  }

  .item-meta {
    flex: 1;
    min-width: 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-direction: column;
  }

  .item-title {
    font-size: 14px;
    line-height: 24px;
    font-weight: 400;
    color: #000;
  }

  .item-tag {
    font-weight: 400;
    font-style: Regular;
    font-size: 12px;
    leading-trim: NONE;
    line-height: 20px;
    letter-spacing: 1%;
  }

  .ant-tabs-ink-bar {
    display: none !important;
  }

  .custom-scrollbar {
    /* Completely hide scrollbar on all browsers */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
    
    &::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }
  }

  .ant-tooltip-placement-right {
    padding: 0 !important;

    .ant-tooltip-inner {
        padding: 0 !important;
        height: 100% !important;
        width: 240px !important;
        boxSizing: 'border-box' !important;
        overflow-y: auto !important;
    }
  }

`



const MentionListComponent = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [activeTab, setActiveTab] = useState('metrics')
    const { TabPane } = Tabs
    const inlineMetricsData = useSelector((state) => state?.dashboardInfo?.metadata?.inlineMetricsData);
    const [currentMetrics, setCurrentMetrics] = useState([]);
    const dispatch = useDispatch();
    const metadata = useSelector(state => state?.dashboardInfo?.metadata);

    // Extracting the current user search query after '@'
    const { query = '' } = props;


    const tabOrder = ['metrics', 'members', 'cards', 'pages', 'spaces'];

    const transformMetricsCatalog = (apiResponse) => {
        const result = apiResponse?.result || [];

        const iconMap: Record<string, string> = {
            percentage: "📊",
            number: "🔢",
            decimal: "📈",
            equity: "💎",
            cash: "💰",
            currency: "💲",
        };

        const transformedMetrics = result.map(item => {
            const type = item.metric_res_type?.toLowerCase() || 'number';
            const iconSrc = getAssetPrefixUrl() + `/static/assets/images/icons/${type}_metric.svg`;

            const metric = item.metric_name || `metric-${item.metric_id}`;

            return {
                id: item.metric_id, // ✅ numeric ID
                name: (item.verbose_name || metric).trim(),
                iconSrc,
                isMetric: true,
                datasetId: item.datasource_id,
                datasource_id: item.datasource_id,
                metric, // original string name 
                uuid: item.metric_uuid,
                description: item.definition || '',
                category: item.category || 'Uncategorized', // Add category field
                logic: item.logic, // Add logic field from API
                datasourceName: item.datasource_name, // Add datasource_name field from API
                metric_catalog_id: item.metric_catalog_id, // Add metric_catalog_id for URL construction
                slice_id: item.slice_id, // Add slice_id for URL construction
                granularity: item.granularity, // Add granularity field from API
                adhoc_temporal_column: item.adhoc_temporal_column, // Add adhoc_temporal_column field from API
            };
        });

        // Sort metrics in ascending order by metric name
        return transformedMetrics.sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    };




    const metricsList = useSelector(state => state?.metricList?.totalMetricsList);
    // console.log("MetricExtension: metricsList from Redux:", metricsList);
    // console.log("MetricExtension: Full metricList state:", useSelector(state => state?.metricList));

    const hardCodedMetrics = transformMetricsCatalog(metricsList);
    // console.log("MetricExtension: hardCoded metricsList:", hardCodedMetrics);
    // console.log("MetricExtension: currentMetrics state:", currentMetrics);

    // This needs to be updated conditionally. Iff a metric is added to a Page, then only
    // it can be a part of inlineMetricsData
    useEffect(() => {
        // console.log("MetricExtension: Setting currentMetrics to:", hardCodedMetrics);
        setCurrentMetrics(hardCodedMetrics);
    }, [metricsList]);

    // Fallback: if no metrics are loaded, try to fetch them directly
    useEffect(() => {
        if (!metricsList || (Array.isArray(metricsList) && metricsList.length === 0)) {
            // console.log("MetricExtension: No metrics found in Redux state, attempting to fetch directly...");
            // This is a fallback - in a real implementation, you'd want to dispatch an action
            // to fetch the metrics through the proper Redux flow
        }
    }, [metricsList]);


    const filteredMetrics = currentMetrics.filter(
        metric =>
            typeof metric?.name === 'string' &&
            metric.name.toLowerCase().includes(query.toLowerCase()),
    );



    const sections = {
        members: [
            { id: 'ajdin', name: 'Ajdin', initials: 'A' },
            { id: 'ajdin-proho', name: 'Ajdin Proho', initials: 'AP', rightText: 'Ajdin Proho' },
        ],
        metrics: filteredMetrics, //currentMetrics,
    }

    // When query changes, reset the current index to first index
    useEffect(() => {
        setSelectedIndex(0);
    }, [query, activeTab]);



    // Get current tab's items
    const getCurrentTabItems = () => {
        return sections[activeTab as keyof typeof sections] || []
    }

    const leftHandler = () => {
        const currentIndex = tabOrder.indexOf(activeTab)
        const newIndex = (currentIndex - 1 + tabOrder.length) % tabOrder.length
        setActiveTab(tabOrder[newIndex])
        setSelectedIndex(0)
    }

    const rightHandler = () => {
        const currentIndex = tabOrder.indexOf(activeTab)
        const newIndex = (currentIndex + 1) % tabOrder.length
        setActiveTab(tabOrder[newIndex])
        setSelectedIndex(0)
    }

    const selectItem = (item: any) => {
        if (item.isMetric) {
            // Generate a unique instance ID for this metric instance
            const instanceId = `${item.uuid}_seq_${uuidv4()}`;
            
            // Debug logging to see what data we have
            // console.log('MetricExtension - selectItem - item data:', {
            //     id: item.id,
            //     metric_catalog_id: item.metric_catalog_id,
            //     slice_id: item.slice_id,
            //     uuid: item.uuid,
            //     instanceId: instanceId
            // });
            
            props.editor
                .chain()
                .focus()
                .deleteRange(props.range)
                .insertContent({
                    type: 'metric',
                    attrs: {
                        id: item.id,
                        label: item.name,
                        icon: item.iconSrc,
                        datasetId: item.datasetId,
                        metric: item.metric,
                        uuid: item.uuid,
                        instanceId: instanceId, // Add the unique instance ID
                    }
                })
                .run()

            // Update inlineMetricsData in metadata using the unique instance ID
            const updatedInlineMetrics = {
                ...inlineMetricsData,
                [instanceId]: { // Use instanceId instead of item.uuid
                    id: item.id,
                    datasetId: item.datasetId,
                    datasource_id: item.datasource_id,
                    uuid: item.uuid, // Keep the original uuid for reference
                    instanceId: instanceId, // Store the instance ID
                    metric_catalog_id: item.metric_catalog_id,
                    slice_id: item.slice_id,
                    granularity: item.granularity, // Add granularity field from API
                    adhoc_temporal_column: item.adhoc_temporal_column,
                    payload: {
                        "datasource": {
                            "id": item.datasetId,
                            "type": "table"
                        },
                        form_data: {
                            "inline_metric": true,
                            "datasource": `${item.datasetId}__table`,
                            "adhoc_filters": []
                        },
                        queries:[{
                            "metrics": [item.metric],
                            "filters": [],
                            "extras": {
                                "having": '',
                                "where": ''
                            }
                        }]
                    },
                },
            };

            // Debug logging to see what's being stored
            // console.log('MetricExtension - selectItem - storing in Redux:', {
            //     instanceId: instanceId,
            //     uuid: item.uuid,
            //     metric_catalog_id: item.metric_catalog_id,
            //     slice_id: item.slice_id,
            //     fullData: updatedInlineMetrics[instanceId]
            // });

            dispatch(
                dashboardInfoChanged({
                    metadata: {
                        ...metadata,
                        inlineMetricsData: updatedInlineMetrics,
                    },
                }),
            );
        } else {
            props.command({ id: item.id, label: item.name })
        }
    }

    const upHandler = () => {
        const currentItems = getCurrentTabItems()
        setSelectedIndex((selectedIndex + currentItems.length - 1) % currentItems.length)
    }

    const downHandler = () => {
        const currentItems = getCurrentTabItems()
        setSelectedIndex((selectedIndex + 1) % currentItems.length)
    }

    const enterHandler = () => {
        const currentItems = getCurrentTabItems()
        const item = currentItems[selectedIndex]
        if (item) {
            selectItem(item)
        }
    }



    // Reset selection when changing tabs or when items change
    useEffect(() => setSelectedIndex(0), [props.items, activeTab])

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler()
                return true
            }
            if (event.key === 'ArrowDown') {
                downHandler()
                return true
            }
            if (event.key === 'ArrowLeft') {
                leftHandler()
                return true
            }
            if (event.key === 'ArrowRight') {
                rightHandler()
                return true
            }
            if (event.key === 'Enter') {
                enterHandler()
                return true
            }
            return false
        },
    }))

        const renderItem = (item: any, index: number) => (
        <Tooltip
            title={
                <div style={{ 
                    height: '100%',
                    width: '240px',
                    padding: '24px',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ 
                        height: '100%',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                    className="custom-scrollbar">
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '8px',
                        }}>
                            <div className="logics-title" style={{
                                color: '#666',
                                fontWeight: 500,
                                fontStyle: 'Medium',
                                fontSize: '12px',
                                leadingTrim: 'NONE',
                                lineHeight: '20px',
                                letterSpacing: '1%',
                                verticalAlign: 'middle',
                                // marginBottom: '4px'                           
                            }}>
                                Logics
                            </div>
                            <div className="logics-description" style={{
                                color: '#000',
                                fontWeight: 400,
                                fontStyle: 'Regular',
                                fontSize: '12px',
                                lineHeight: '20px',
                                letterSpacing: '1%',
                                verticalAlign: 'middle',
                                margin: '0',
                                padding: '0',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                whiteSpace: 'normal',
                                maxWidth: '100%',
                                // marginBottom: '4px'
                            }}
                            dangerouslySetInnerHTML={{ 
                                __html: item.logic || 'No Data' 
                            }}
                            />
                            <div>
                                <div className="logics-title" style={{
                                    color: '#666',
                                    fontWeight: 500,
                                    fontStyle: 'Medium',
                                    fontSize: '12px',
                                    leadingTrim: 'NONE',
                                    lineHeight: '20px',
                                    letterSpacing: '1%',
                                    verticalAlign: 'middle',
                                    // marginBottom: '4px'                            
                                }}>
                                    Data Source
                                </div>
                                <div className="logics-description" style={{
                                    color: '#000',
                                    fontWeight: 400,
                                    fontStyle: 'Regular',
                                    fontSize: '12px',
                                    leadingTrim: 'NONE',
                                    lineHeight: '20px',
                                    letterSpacing: '1%',
                                    verticalAlign: 'middle',
                                }}>
                                    {item.datasourceName || 'No Data'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
            placement="right"
            overlayStyle={{ 
                width: '240px',
                maxHeight: '176px',
                padding: '24px !important'
            }}
            mouseEnterDelay={0.3}
            mouseLeaveDelay={0.1}
            destroyTooltipOnHide={false}
            autoAdjustOverflow={true}
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
            overlayInnerStyle={{ overflow: 'hidden' }}
        >
            <div
                className={`mention-item ${index === selectedIndex ? 'is-selected' : ''}`}
                key={item.id}
                onClick={() => selectItem(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                data-testid={generateTestId('ap.<experience>.pages.inline-metric.item.metric.click')}
            >
                {item.initials ? (
                    <div className="avatar">{item.initials}</div>
                ) : (
                    <div className="item-icon">
                        <img src={item.iconSrc} alt={item.name} style={{ width: '16px', height: '16px' }} />
                    </div>
                )}
                <div className="item-meta">
                    <div className="item-title">{item.name}</div>
                    {(item.rightText || item.tag || item.category) && (
                        <div className="item-tag">
                            {item.rightText || item.tag || `Category: ${item.category}`}
                        </div>
                    )}
                </div>
            </div>
        </Tooltip>
    )



    return (
        <>

            <MentionList>
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    <TabPane tab="Metrics" key="metrics">
                        <div style={{ overflowY: 'auto', maxHeight: 300 }}>
                            {sections.metrics.length > 0 ? (
                                <>
                                    {sections.metrics.map((item, index) => renderItem(item, index))}
                                    {/* Empty div for spacing at the bottom */}
                                    <div style={{ 
                                        height: '40px', 
                                        background: '#fff', 
                                        width: '100%' 
                                    }} />
                                </>
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: '20px',
                                    color: '#666',
                                    fontSize: '14px',
                                    fontStyle: 'italic'
                                }}>
                                    No data found
                                </div>
                            )}
                        </div>
                    </TabPane>
                </Tabs>
            </MentionList>
        </>

    )
})

MentionListComponent.displayName = 'MentionListComponent'

const suggestion = {
    char: '@',
    startOfLine: false,
    allowSpaces: true,
    allow: ({ editor, range }: { editor: any; range: any }) => {
        // Get the text before the @ symbol
        const textBefore = editor.state.doc.textBetween(0, range.from);
        
        // Only block very clear email cases
        // Check if we have a complete email pattern before the @
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (emailPattern.test(textBefore)) {
            return false; // Don't allow mention for complete email addresses
        }
        
        // Allow all other cases
        return true;
    },
    
    items: ({ query }: { query: string }) => {
        // This will be handled by the MentionListComponent
        return [];
    },

    render: () => {
        let component: ReactRenderer | null = null
        let popup: any = null

        return {
            onStart: (props: any) => {
                component = new ReactRenderer(MentionListComponent, {
                    props,
                    editor: props.editor,
                })

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                })
                popup[0].popper.classList.add('mentions-popup')
            },

            onUpdate: (props: any) => {
                component?.updateProps(props)
                if (popup && popup[0] && props.clientRect) {
                    try {
                        popup[0].setProps({
                            getReferenceClientRect: props.clientRect,
                        })
                    } catch (error) {
                        console.warn('Error updating tippy popup position:', error);
                        // If there's an error updating position, hide the popup
                        popup[0].hide();
                    }
                }
            },

            onKeyDown: (props: any) => {
                if (props.event.key === 'Escape') {
                    popup[0].hide()
                    return true
                }

                return component?.ref?.onKeyDown(props)
            },

            onExit: () => {
                if (popup && popup[0]) {
                    try {
                        popup[0].destroy();
                    } catch (error) {
                        console.warn('Error destroying tippy popup:', error);
                    }
                }
                component?.destroy()
            },
        }
    },
}

const MentionExtension = Mention.configure({
    HTMLAttributes: {
        class: 'mention',
    },
    suggestion,
})


export default MentionExtension;