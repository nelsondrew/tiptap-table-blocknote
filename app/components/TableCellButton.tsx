"use client";
import React, { FC, ReactNode } from "react";
import styled from "@emotion/styled";
import { MdArrowDropDown } from "react-icons/md";
import { Editor } from "@tiptap/core";

const TableCellButtonContainer = styled.button`
  position: fixed !important;
  z-index: 9999 !important;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 16px;
  height: 16px;
  
  &:hover {
    background-color: #f8f9fa;
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    background-color: #e5e7eb;
    transform: scale(0.95);
  }
`;

const DropdownIcon = styled(MdArrowDropDown)`
  width: 12px;
  height: 12px;
  color: #374151;
`;

export interface TableCellButtonProps {
  editor: Editor;
  rowIndex: number;
  colIndex: number;
  freezeHandles?: () => void;
  unfreezeHandles?: () => void;
  children?: ReactNode;
}

export const TableCellButton: FC<TableCellButtonProps> = ({
  editor,
  rowIndex,
  colIndex,
  freezeHandles,
  unfreezeHandles,
  children,
}) => {
  const handleClick = () => {
    console.log(`Hello world - cell button clicked at row ${rowIndex}, col ${colIndex}`);
  };

  const handleMouseDown = () => {
    freezeHandles?.();
  };

  const handleMouseUp = () => {
    unfreezeHandles?.();
  };

  return (
    <TableCellButtonContainer
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      title={`Cell ${rowIndex}, ${colIndex}`}
      data-test="tableCellHandle"
    >
      {children || <DropdownIcon />}
    </TableCellButtonContainer>
  );
};

export default TableCellButton;