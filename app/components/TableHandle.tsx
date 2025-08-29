"use client";
import React, { FC, ReactNode, useState, Dispatch, SetStateAction } from "react";
import styled from "@emotion/styled";
import { MdDragIndicator } from "react-icons/md";
import { Editor } from "@tiptap/core";
import { createPortal } from "react-dom";
import { useFloating, autoUpdate, offset, flip, shift, useClick, useDismiss, useInteractions } from "@floating-ui/react";
import { TableHandleMenu } from "./TableHandleMenu";

const TableHandleButton = styled.button`
  position: fixed !important;
  z-index: 9999 !important;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 24px;
  height: 24px;
  
  &:hover {
    background-color: #f8f9fa;
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:active,
  &:focus:active {
    cursor: grabbing;
    background-color: #6b7280; /* Dark grey on press/grab */
    border-color: #4b5563;
    transform: scale(0.95);
    
    svg {
      color: #ffffff; /* White icon when pressed */
    }
  }
  
  &.dragging {
    cursor: grabbing;
    background-color: #3b82f6;
    border-color: #2563eb;
    color: white;
  }
`;

const DragIcon = styled(MdDragIndicator)`
  width: 18px;
  height: 18px;
  color: #cfcfcf; /* Light grey fill for the six dots by default */
  
  .dragging & {
    color: white;
  }
`;

export interface TableHandleProps {
  editor: Editor;
  orientation: "row" | "column";
  index: number;
  tableElement?: HTMLElement | null;
  showOtherSide?: () => void;
  hideOtherSide?: () => void;
  freezeHandles?: () => void;
  unfreezeHandles?: () => void;
  dragStart?: (e: React.DragEvent) => void;
  dragEnd?: () => void;
  menuContainer?: HTMLElement | null;
  children?: ReactNode;
  setIsMenuOpen?:  Dispatch<SetStateAction<boolean>>;
}

export const TableHandle: FC<TableHandleProps> = ({
  editor,
  orientation,
  index,
  tableElement,
  showOtherSide,
  hideOtherSide,
  freezeHandles,
  unfreezeHandles,
  dragStart,
  dragEnd,
  menuContainer,
  children,
  setIsMenuOpen
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: showMenu,
    onOpenChange: (open) => {
      setShowMenu(open);
      setIsMenuOpen?.(open);
      if (open) {
        freezeHandles?.();
        hideOtherSide?.();
      } else {
        unfreezeHandles?.();
        showOtherSide?.();
      }
    },
    middleware: [
      offset(8),
      flip(),
      shift(),
    ],
    whileElementsMounted: autoUpdate,
    placement: orientation === "row" ? "right-start" : "bottom-start",
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

  const handleMenuClose = () => {
    setShowMenu(false);
    unfreezeHandles?.();
    showOtherSide?.();
    setIsMenuOpen?.(false);
  };

  const handleMouseEnter = () => {
    freezeHandles?.();
  };

  const handleMouseLeave = () => {
    setTimeout(() => {
      unfreezeHandles?.();
    }, 100);
  };

  const handleMouseDown = () => {
    freezeHandles?.();
  };

  const handleMouseUp = () => {
    setTimeout(() => {
      unfreezeHandles?.();
    }, 200);
  };

  const handleDragStart = (e: React.DragEvent) => {
    console.log('🚀 DRAG STARTED!', orientation, index);
    setIsDragging(true);
    
    // Make the drag operation visible
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${orientation}-${index}`);
    
    dragStart?.(e);
  };

  const handleDragEnd = () => {
    console.log('🏁 DRAG ENDED!', orientation, index);
    setIsDragging(false);
    dragEnd?.();
  };

  // Remove local drag over and drop handlers - these are handled globally now

  return (
    <>
      <TableHandleButton
        ref={refs.setReference}
        className={isDragging ? "dragging" : ""}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        draggable={true}
        title={`${orientation} handle ${index} - DRAG ME!`}
        data-test={`tableHandle-${orientation}`}
        style={
          orientation === "column"
            ? { transform: "rotate(0.25turn)" }
            : undefined
        }
        {...getReferenceProps()}
      >
        {children || <DragIcon />}
      </TableHandleButton>
      
      {/* Use floating UI for proper menu positioning */}
      {showMenu && (
        menuContainer ? createPortal(
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              zIndex: 999999,
            }}
            {...getFloatingProps()}
          >
            <TableHandleMenu
              editor={editor}
              orientation={orientation}
              index={index}
              tableElement={tableElement || null}
              onClose={handleMenuClose}
            />
          </div>,
          menuContainer,
        ) : (
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              zIndex: 999999,
            }}
            {...getFloatingProps()}
          >
            <TableHandleMenu
              editor={editor}
              orientation={orientation}
              index={index}
              tableElement={tableElement || null}
              onClose={handleMenuClose}
            />
          </div>
        )
      )}
    </>
  );
};

export default TableHandle;