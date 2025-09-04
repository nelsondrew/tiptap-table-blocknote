import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState, useRef, useEffect } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import styled from 'styled-components';
import { Resizable } from 're-resizable';
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import { EditorCell } from '../ThreeColsEditorCell';
import { useSelector } from 'react-redux';
import { Plugin } from 'prosemirror-state';
import { newEvent } from 'src/components/ListView/utils';
import useContentEditableManager from 'packages/blocknote-editor/utils/useContentEditableManager';

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
  }
`;

interface ThreeColumnComponentProps {
  component: any;
  node: any;
  updateAttributes: (attrs: any) => void;
}

const ThreeColumnComponent = ({
  component,
  node,
  updateAttributes,
}: ThreeColumnComponentProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [widths, setWidths] = useState({
    left: node.attrs.leftWidth || 32,
    middle: node.attrs.middleWidth || 32,
    right: node.attrs.rightWidth || 32,
  });
  const [containerHeight, setContainerHeight] = useState(
    node.attrs.containerHeight || 200,
  );
  const [isResizing, setIsResizing] = useState(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false);
  const [leftImageHeight, setLeftImageHeight] = useState<number>(0);
  const [middleImageHeight, setMiddleImageHeight] = useState<number>(0);
  const [rightImageHeight, setRightImageHeight] = useState<number>(0);
  const leftObserverRef = useRef<ResizeObserver | null>(null);
  const middleObserverRef = useRef<ResizeObserver | null>(null);
  const rightObserverRef = useRef<ResizeObserver | null>(null);
  const [isResizingAny, setIsResizingAny] = useState(false);
  const preventSelectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editMode = useSelector((state: any) => state?.dashboardState?.editMode);



  useContentEditableManager(editMode, wrapperRef, 'threeColumn');


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

  const preventTextSelection = (prevent: boolean) => {
    document.body.style.userSelect = prevent ? 'none' : '';
    document.body.style.WebkitUserSelect = prevent ? 'none' : '';
    document.body.style.MozUserSelect = prevent ? 'none' : '';
    document.body.style.msUserSelect = prevent ? 'none' : '';
  };

  const handleResize = (
    section: 'left' | 'middle' | 'right',
    e: any,
    dir: any,
    ref: HTMLElement,
    d: any,
  ) => {
    if (!editMode) return;

    if (!isResizingAny) {
      setIsResizingAny(true);
      preventTextSelection(true);
    }

    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    const parentWidth = ref.parentElement?.offsetWidth || 0;
    const gapWidth = 32; // 16px * 2 for three gaps
    const availableWidth = parentWidth - gapWidth;

    let newWidths = { ...widths };
    const totalWidth = 96; // 100 - 4 for gaps

    if (section === 'left') {
      newWidths.left = Math.min(
        Math.max(((ref.offsetWidth + d.width) / availableWidth) * 100, 5),
        86,
      );
      const remainingWidth = totalWidth - newWidths.left;
      newWidths.middle = remainingWidth / 2;
      newWidths.right = remainingWidth / 2;
    } else if (section === 'middle') {
      newWidths.middle = Math.min(
        Math.max(((ref.offsetWidth + d.width) / availableWidth) * 100, 5),
        86,
      );
      const remainingWidth = totalWidth - newWidths.middle;
      newWidths.left = remainingWidth / 2;
      newWidths.right = remainingWidth / 2;
    } else {
      newWidths.right = Math.min(
        Math.max(((ref.offsetWidth + d.width) / availableWidth) * 100, 5),
        86,
      );
      const remainingWidth = totalWidth - newWidths.right;
      newWidths.left = remainingWidth / 2;
      newWidths.middle = remainingWidth / 2;
    }

    unstable_batchedUpdates(() => {
      setIsResizing(true);
      setWidths(newWidths);
    });

    resizeTimeoutRef.current = setTimeout(() => {
      batchedUpdate({
        leftWidth: newWidths.left,
        middleWidth: newWidths.middle,
        rightWidth: newWidths.right,
      });
      setIsResizing(false);
    }, 150);
  };

  const handleResizeStop = () => {
    setIsResizingAny(false);

    if (preventSelectionTimeoutRef.current) {
      clearTimeout(preventSelectionTimeoutRef.current);
    }

    preventSelectionTimeoutRef.current = setTimeout(() => {
      preventTextSelection(false);
      preventSelectionTimeoutRef.current = null;
    }, 300);

    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = null;
    }

    batchedUpdate({
      leftWidth: widths.left,
      middleWidth: widths.middle,
      rightWidth: widths.right,
    });

    setIsResizing(false);
  };

  useEffect(() => {
    setTimeout(() => {
      const leftImageElement = document.getElementById(
        `image-${node.attrs.leftEditorId}`,
      );
      const middleImageElement = document.getElementById(
        `image-${node.attrs.middleEditorId}`,
      );
      const rightImageElement = document.getElementById(
        `image-${node.attrs.rightEditorId}`,
      );

      if (leftImageElement) {
        leftObserverRef.current = new ResizeObserver(entries => {
          for (const entry of entries) {
            setLeftImageHeight(entry.target.clientHeight);
          }
        });
        leftObserverRef.current.observe(leftImageElement);
      }

      if (middleImageElement) {
        middleObserverRef.current = new ResizeObserver(entries => {
          for (const entry of entries) {
            setMiddleImageHeight(entry.target.clientHeight);
          }
        });
        middleObserverRef.current.observe(middleImageElement);
      }

      if (rightImageElement) {
        rightObserverRef.current = new ResizeObserver(entries => {
          for (const entry of entries) {
            setRightImageHeight(entry.target.clientHeight);
          }
        });
        rightObserverRef.current.observe(rightImageElement);
      }
    }, 1000);

    return () => {
      leftObserverRef.current?.disconnect();
      middleObserverRef.current?.disconnect();
      rightObserverRef.current?.disconnect();
    };
  }, [
    node.attrs.leftEditorId,
    node.attrs.middleEditorId,
    node.attrs.rightEditorId,
  ]);

  useEffect(() => {
    return () => {
      if (preventSelectionTimeoutRef.current) {
        clearTimeout(preventSelectionTimeoutRef.current);
      }
      preventTextSelection(false);
    };
  }, []);

  const updateEditorState = (side: 'left' | 'middle' | 'right', state: any) => {
    batchedUpdate({
      [`${side}EditorState`]: state,
    });
  };

  console.log("Rendered")


  const handleHeightResize = (e: any, direction: any, ref: HTMLElement, d: any) => {
    if (!editMode) return;

    const newHeight = ref.clientHeight;
    setContainerHeight(newHeight);

    // Update height in attributes
    batchedUpdate({
      containerHeight: newHeight,
    });
    newEvent.emit('event-reInitializePageBreak')
  };

  return (
    <NodeViewWrapper ref={wrapperRef} className='three-column-wrapper'>
      <FlexContainer
        data-resize-status={isResizing ? 'active' : 'inactive'}
        size={{
          width: '100%',
          height: Math.max(
            containerHeight,
            leftImageHeight,
            middleImageHeight,
            rightImageHeight,
          ),
        }}
        onResize={(e, dir, ref, d) => {
            if (dir === 'bottom') {
              handleHeightResize(e, dir, ref, d);
            }
          }}
        enable={{ bottom: editMode }}
        minHeight={100}
      >
        <ResizableItem
          size={{ width: `${widths.left}%`, height: '100%' }}
          enable={{ right: editMode }}
          onResize={(e, dir, ref, d) => handleResize('left', e, dir, ref, d)}
          onResizeStop={handleResizeStop}
          minWidth="5%"
          maxWidth="86%"
        >
          <EditorCell
            editorId={node.attrs.leftEditorId}
            componentId={component.id}
            side="left"
            initialState={node.attrs.leftEditorState}
            onStateChange={state => updateEditorState('left', state)}
          />
        </ResizableItem>
        <ResizableItem
          size={{ width: `${widths.middle}%`, height: '100%' }}
          enable={{ left: editMode, right: editMode }}
          onResize={(e, dir, ref, d) => handleResize('middle', e, dir, ref, d)}
          onResizeStop={handleResizeStop}
          minWidth="5%"
          maxWidth="86%"
        >
          <EditorCell
            editorId={node.attrs.middleEditorId}
            componentId={component.id}
            side="middle"
            initialState={node.attrs.middleEditorState}
            onStateChange={state => updateEditorState('middle', state)}
          />
        </ResizableItem>
        <ResizableItem
          size={{ width: `${widths.right}%`, height: '100%' }}
          enable={{ left: editMode }}
          onResize={(e, dir, ref, d) => handleResize('right', e, dir, ref, d)}
          onResizeStop={handleResizeStop}
          minWidth="5%"
          maxWidth="86%"
        >
          <EditorCell
            editorId={node.attrs.rightEditorId}
            componentId={component.id}
            side="right"
            initialState={node.attrs.rightEditorState}
            onStateChange={state => updateEditorState('right', state)}
          />
        </ResizableItem>
      </FlexContainer>
    </NodeViewWrapper>
  );
};

export const ThreeColumnExtension = Node.create({
  name: 'threeColumn',
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
        default: 32,
      },
      middleWidth: {
        default: 32,
      },
      rightWidth: {
        default: 32,
      },
      containerHeight: {
        default: 200,
      },
      leftEditorState: {
        default: null,
      },
      middleEditorState: {
        default: null,
      },
      rightEditorState: {
        default: null,
      },
      leftEditorId: {
        default: null,
      },
      middleEditorId: {
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
          const hasNewNodes = transactions.some(tr => tr.docChanged);
          if (!hasNewNodes) return null;

          const tr = newState.tr;
          let modified = false;

          try {
            newState.doc.descendants((node, pos) => {
              if (!node) return;

              if (node.type?.name === 'threeColumn') {
                const oldNode = oldState.doc.nodeAt(pos);

                const needsUpdate =
                  !oldNode ||
                  !node.attrs ||
                  !node.attrs.leftEditorId ||
                  !node.attrs.middleEditorId ||
                  !node.attrs.rightEditorId;

                if (needsUpdate) {
                  const safeAttrs = node.attrs ? { ...node.attrs } : {};

                  tr.setNodeMarkup(pos, undefined, {
                    ...safeAttrs,
                    leftEditorId:
                      safeAttrs.leftEditorId || `editor-${uuidv4()}`,
                    middleEditorId:
                      safeAttrs.middleEditorId || `editor-${uuidv4()}`,
                    rightEditorId:
                      safeAttrs.rightEditorId || `editor-${uuidv4()}`,
                  });

                  modified = true;
                }
              }
            });
          } catch (err) {
            console.error('Error in threeColumn appendTransaction:', err);
            return null;
          }

          return modified ? tr : null;
        },
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(props => (
      <ThreeColumnComponent
          {...props}
          component={{ id: this.options.componentId }}
        />
    ));
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="three-column"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        'data-type': 'three-column',
        ...HTMLAttributes,
      },
      0,
    ];
  },
});
