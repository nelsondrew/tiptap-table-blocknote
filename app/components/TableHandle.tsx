"use client";
import React, { FC, ReactNode, useState } from "react";
import styled from "@emotion/styled";
import { MdDragIndicator } from "react-icons/md";
import { Editor } from "@tiptap/core";
import { createPortal } from "react-dom";

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
  showOtherSide?: () => void;
  hideOtherSide?: () => void;
  freezeHandles?: () => void;
  unfreezeHandles?: () => void;
  dragStart?: (e: React.DragEvent) => void;
  dragEnd?: () => void;
  menuContainer?: HTMLElement | null;
  children?: ReactNode;
}

export const TableHandle: FC<TableHandleProps> = ({
  editor,
  orientation,
  index,
  showOtherSide,
  hideOtherSide,
  freezeHandles,
  unfreezeHandles,
  dragStart,
  dragEnd,
  menuContainer,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    console.log(`Hello world - ${orientation} handle ${index} clicked`);
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
    setIsDragging(true);
    dragStart?.(e);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragEnd?.();
  };

  return (
    <>
      <TableHandleButton
        className={isDragging ? "dragging" : ""}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        draggable={true}
        title={`${orientation} handle ${index}`}
        data-test={`tableHandle-${orientation}`}
        style={
          orientation === "column"
            ? { transform: "rotate(0.25turn)" }
            : undefined
        }
      >
        {children || <DragIcon />}
      </TableHandleButton>
      
      {/* Use createPortal for menu to prevent clipping - following BlockNote pattern */}
      {menuContainer && createPortal(
        <div>
          {/* This would be where the table handle menu goes */}
          {/* For now, just a placeholder that doesn't render anything visible */}
        </div>,
        menuContainer,
      )}
    </>
  );
};

export default TableHandle;