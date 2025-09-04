import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState, useRef, useEffect } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import styled from 'styled-components';
import { Resizable } from 're-resizable';
import { v4 as uuidv4 } from 'uuid';
import { EditorCell } from './EditorCell';
import { useSelector } from 'react-redux';
import { Plugin } from 'prosemirror-state';
import { newEvent } from 'src/components/ListView/utils';
import useContentEditableManager from '../utils/useContentEditableManager';

const FlexContainer = styled(Resizable)`
  display: flex;
  margin: 8px 0;
  width: 100%;
  gap: 2%;
  min-height: 100px;
  position: relative;
  z-index: 1;

  .react-resizable-handle {
    position: absolute !important;
    z-index: 10;
    background-color: rgba(0, 0, 0, 0.1);
    width: 10px;
    height: 100% !important;
    cursor: col-resize;
    pointer-events: auto;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.2);
    }

    &.react-resizable-handle-s {
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      height: 10px !important;
      cursor: row-resize;
    }
  }

  &:hover .react-resizable-handle {
    z-index: 1000;
  }
`;

const ResizableItem = styled(Resizable)`
  background: #f8f9fa;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  height: 100% !important;
  position: relative;
  overflow: visible !important;

  .react-resizable-handle {
    position: absolute !important;
    z-index: 10;
    width: 10px;
    height: 100% !important;
    background-color: rgba(0, 0, 0, 0.1);
    cursor: col-resize;
    pointer-events: auto;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.2);
    }

    &.react-resizable-handle-e {
      right: -5px;
    }

    &.react-resizable-handle-w {
      left: -5px;
    }
  }

  &:hover .react-resizable-handle {
    z-index: 1000;
  }
`;


const NonDraggableNodeViewWrapper = styled(NodeViewWrapper)`
  user-select: text;
  -webkit-user-drag: none;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
`;

// First define the props interface
interface FlexDivComponentProps {
  component: any; // You can define a more specific type
  node: any;
  updateAttributes: (attrs: any) => void;
}

// Add this utility function at the top

// Update the component to use and update node attributes
const FlexDivComponent = ({ component, node, updateAttributes }: FlexDivComponentProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const [widths, setWidths] = useState({
    left: node.attrs.leftWidth || 49,
    right: node.attrs.rightWidth || 49
  });
  const [containerHeight, setContainerHeight] = useState(node.attrs.containerHeight || 200);
  const [isResizing, setIsResizing] = useState(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false);

  const [leftImageHeight, setLeftImageHeight] = useState<number>(0);
  const [rightImageHeight, setRightImageHeight] = useState<number>(0);
  const leftObserverRef = useRef<ResizeObserver | null>(null);
  const rightObserverRef = useRef<ResizeObserver | null>(null);

  const editMode = useSelector((state: any) => state?.dashboardState?.editMode);

  useContentEditableManager(editMode, wrapperRef, 'flexDiv');

  const batchedUpdate = (updates: any) => {
    if (isUpdatingRef.current) return;
    
    try {
      isUpdatingRef.current = true;
      unstable_batchedUpdates(() => {
        updateAttributes(updates);
      });
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const handleResize = (side: 'left' | 'right', e: any, dir: any, ref: HTMLElement, d: any) => {
    if (!editMode) return;

    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    const parentWidth = ref.parentElement?.offsetWidth || 0;
    const gapWidth = 16;
    const availableWidth = parentWidth - gapWidth;
    
    let newLeftWidth = widths.left;
    let newRightWidth = widths.right;
    
    if (side === 'left') {
      newLeftWidth = Math.min(Math.max((ref.offsetWidth + d.width) / availableWidth * 100, 5), 93);
      newRightWidth = 98 - newLeftWidth;
    } else {
      newRightWidth = Math.min(Math.max((ref.offsetWidth + d.width) / availableWidth * 100, 5), 93);
      newLeftWidth = 98 - newRightWidth;
    }

    // Batch state updates
    unstable_batchedUpdates(() => {
      setIsResizing(true);
      setWidths({
        left: newLeftWidth,
        right: newRightWidth
      });
    });

    // Debounce the attribute update
    resizeTimeoutRef.current = setTimeout(() => {
      batchedUpdate({
        leftWidth: newLeftWidth,
        rightWidth: newRightWidth,
      });
      
      unstable_batchedUpdates(() => {
        setIsResizing(false);
      });
    }, 150);
  };

  const handleResizeStop = () => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = null;
    }

    const finalWidths = {
      leftWidth: widths.left,
      rightWidth: widths.right,
    };

    batchedUpdate(finalWidths);
    unstable_batchedUpdates(() => {
      setIsResizing(false);
    });
  };

  const handleHeightResize = (e, direction, ref, d) => {
    if (!editMode) return;

    const newHeight = containerHeight + d.height;
    if (newHeight >= 100) {
      setContainerHeight(newHeight);
      // Update node attributes
      updateAttributes({
        containerHeight: newHeight,
      });
    }
    newEvent.emit('event-reInitializePageBreak')
  };

  const updateEditorState = (side: 'left' | 'right', state: any) => {
    updateAttributes({
      [`${side}EditorState`]: state,
    });
  };

  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (isResizing) {
        batchedUpdate({
          leftWidth: widths.left,
          rightWidth: widths.right,
        });
      }
    };
  }, []);



  useEffect(() => {

    setTimeout(() => {
         // Create resize observers
    const leftImageElement = document.getElementById(`image-${node.attrs.leftEditorId}`);
    const rightImageElement = document.getElementById(`image-${node.attrs.rightEditorId}`);


    if (leftImageElement) {
      leftObserverRef.current = new ResizeObserver(entries => {
        for (const entry of entries) {
          setLeftImageHeight(entry.target.clientHeight);
        }
      });

      leftObserverRef.current.observe(leftImageElement);
    }

    if (rightImageElement) {
      rightObserverRef.current = new ResizeObserver(entries => {
        for (const entry of entries) {
          setRightImageHeight(entry.target.clientHeight);
        }
      });

      rightObserverRef.current.observe(rightImageElement);
    }
    },1000)
 

    // Cleanup function
    return () => {
      if (leftObserverRef.current) {
        leftObserverRef.current.disconnect();
      }
      if (rightObserverRef.current) {
        rightObserverRef.current.disconnect();
      }
    };
  }, [node.attrs.leftEditorId, node.attrs.rightEditorId]);


  return (
    <NonDraggableNodeViewWrapper ref={wrapperRef} className='flex-div-wrapper'>
      <FlexContainer
        size={{ width: '100%', height:  Math.max(...[containerHeight,leftImageHeight, rightImageHeight]) }}
        onResizeStop={handleHeightResize}
        enable={{ bottom: editMode }}
        minHeight={100}
      >
        <ResizableItem
          size={{ width: `${widths.left}%`, height: '100%' }}
          enable={{ right: editMode }}
          onResize={(e, dir, ref, d) => handleResize('left', e, dir, ref, d)}
          onResizeStop={handleResizeStop}
          minWidth="5%"
          maxWidth="93%"
        >
          <EditorCell 
            editorId={node.attrs.leftEditorId}
            componentId={component.id}
            side="left"
            initialState={node.attrs.leftEditorState}
            onStateChange={(state) => updateEditorState('left', state)}
          />
        </ResizableItem>
        <ResizableItem
          size={{ width: `${widths.right}%`, height: '100%' }}
          enable={{ left: editMode }}
          onResize={(e, dir, ref, d) => handleResize('right', e, dir, ref, d)}
          onResizeStop={handleResizeStop}
          minWidth="5%"
          maxWidth="93%"
        >
          <EditorCell 
            editorId={node.attrs.rightEditorId}
            componentId={component.id}
            side="right"
            initialState={node.attrs.rightEditorState}
            onStateChange={(state) => updateEditorState('right', state)}
          />
        </ResizableItem>
      </FlexContainer>
    </NonDraggableNodeViewWrapper>
  );
};

export const FlexDivExtension = Node.create({
  name: 'flexDiv',
  group: 'block',
  atom: true,

  addOptions() {
    return {
      componentId: null,
    };
  },

  addAttributes() {
    return {
      componentId: {
        default: null,
      },
      leftWidth: {
        default: 49,
      },
      rightWidth: {
        default: 49,
      },
      containerHeight: {
        default: 200,
      },
      leftEditorState: {
        default: null,
      },
      rightEditorState: {
        default: null,
      },
      leftEditorId: {
        default: null,
      },
      rightEditorId: {
        default: null,
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, oldState, newState) => {
          // Only proceed if doc changed
          const hasNewNodes = transactions.some(tr => tr.docChanged);
          if (!hasNewNodes) return null;

          const tr = newState.tr;
          let modified = false;

          try {
            newState.doc.descendants((node, pos) => {
              if (!node) return; // safeguard

              if (node.type?.name === 'flexDiv') {
                const oldNode = oldState.doc.nodeAt(pos);

                const needsUpdate =
                  !oldNode ||
                  !node.attrs ||
                  !node.attrs.leftEditorId ||
                  !node.attrs.rightEditorId;

                if (needsUpdate) {
                  // Defensive: make sure attrs exist and are an object
                  const safeAttrs = node.attrs ? { ...node.attrs } : {};

                  tr.setNodeMarkup(pos, undefined, {
                    ...safeAttrs,
                    leftEditorId: safeAttrs.leftEditorId || `editor-${uuidv4()}`,
                    rightEditorId: safeAttrs.rightEditorId || `editor-${uuidv4()}`,
                  });

                  modified = true;
                }
              }
            });
          } catch (err) {
            console.error('Error in flexDiv appendTransaction:', err);
            return null;
          }

          return modified ? tr : null;
        },
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(props => (
      <FlexDivComponent
        {...props}
        component={{ id: this.options.componentId }}
      />
    ));
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="flex-div"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        'data-type': 'flex-div',
        ...HTMLAttributes,
      },
      0,
    ];
  },
}); 