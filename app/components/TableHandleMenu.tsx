"use client";
import React, { FC } from "react";
import styled from "@emotion/styled";
import { Editor } from "@tiptap/core";
import { CellSelection } from "@tiptap/pm/tables";

const MenuDropdown = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 4px 0;
  min-width: 200px;
  z-index: 99999;
`;

const MenuItem = styled.button`
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #f3f4f6;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MenuSeparator = styled.div`
  height: 1px;
  background-color: #e5e7eb;
  margin: 4px 0;
`;

export interface TableHandleMenuProps {
  editor: Editor;
  orientation: "row" | "column";
  index: number;
  tableElement: HTMLElement | null;
  onClose?: () => void;
}

export const TableHandleMenu: FC<TableHandleMenuProps> = ({
  editor,
  orientation,
  index,
  tableElement,
  onClose,
}) => {
  // Helper to execute table command with proper cell selection
  const executeTableCommand = (rowIndex: number, colIndex: number, command: () => void) => {
    if (!editor) {
      console.warn('Editor not available');
      return;
    }

    try {
      // Simple approach: try to execute the command directly first
      // TipTap commands should work if we're in a table context
      const success = command();

      if (success !== false) {
        onClose?.();
        return;
      }

      // Fallback: Find and select the appropriate cell manually
      let tableNode: any = null;
      let tablePos = 0;

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'table') {
          tableNode = node;
          tablePos = pos;
          return false; // Stop searching
        }
      });

      if (!tableNode) {
        console.warn('Table node not found in document');
        return;
      }

      // Find the target cell position
      let cellPos = -1;
      let currentPos = tablePos + 1;
      let currentRowIndex = 0;

      tableNode.forEach((rowNode: any) => {
        if (rowNode.type.name === 'tableRow' && currentRowIndex === rowIndex) {
          let currentColIndex = 0;
          let rowPos = currentPos + 1;

          rowNode.forEach((cellNode: any) => {
            if (currentColIndex === colIndex) {
              cellPos = rowPos + 1; // Position inside the cell
              return false;
            }
            currentColIndex++;
            rowPos += cellNode.nodeSize;
          });
          return false;
        }
        currentPos += rowNode.nodeSize;
        currentRowIndex++;
      });

      if (cellPos > 0) {
        // Set cursor in the target cell and try command again
        editor.commands.setTextSelection(cellPos);
        command();
        onClose?.();
      }
    } catch (error) {
      console.error('Error executing table command:', error);
      // Still try to close the menu
      onClose?.();
    }
  };

  const handleDelete = () => {
    if (orientation === "row") {
      executeTableCommand(index, 0, () => editor.commands.deleteRow());
    } else {
      executeTableCommand(0, index, () => editor.commands.deleteColumn());
    }
  };

  const handleAddAbove = () => {
    executeTableCommand(index, 0, () => editor.commands.addRowBefore());
  };

  const handleAddBelow = () => {
    executeTableCommand(index, 0, () => editor.commands.addRowAfter());
  };

  const handleAddLeft = () => {
    executeTableCommand(0, index, () => editor.commands.addColumnBefore());
  };

  const handleAddRight = () => {
    executeTableCommand(0, index, () => editor.commands.addColumnAfter());
  };

  return (
    <MenuDropdown>
      <MenuItem onClick={handleDelete}>
        🗑️ Delete {orientation}
      </MenuItem>
      
      <MenuSeparator />
      
      {orientation === "row" ? (
        <>
          <MenuItem onClick={handleAddAbove}>
            ⬆️ Add row above
          </MenuItem>
          <MenuItem onClick={handleAddBelow}>
            ⬇️ Add row below
          </MenuItem>
        </>
      ) : (
        <>
          <MenuItem onClick={handleAddLeft}>
            ⬅️ Add column left
          </MenuItem>
          <MenuItem onClick={handleAddRight}>
            ➡️ Add column right
          </MenuItem>
        </>
      )}
    </MenuDropdown>
  );
};

export default TableHandleMenu;