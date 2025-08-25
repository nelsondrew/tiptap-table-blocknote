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
  // Helper to select a cell and execute table command
  const selectCellAndExecute = (selector: string, command: () => void) => {
    if (!editor || !tableElement) {
      console.warn('Editor or table element not available');
      return;
    }

    const cell = tableElement.querySelector(selector);
    if (!cell) {
      console.warn(`Cell not found with selector: ${selector}`);
      return;
    }

    try {
      const cellDesc = (cell as any).pmViewDesc;
      if (!cellDesc || !['tableCell', 'tableHeader'].includes(cellDesc.node.type.name)) {
        console.warn('Invalid cell selection - no pmViewDesc or wrong node type');
        return;
      }

      const cellSelection = CellSelection.create(
        editor.state.doc,
        editor.state.doc.resolve(cellDesc.posBefore).pos,
      );
      
      editor.view.dispatch(editor.state.tr.setSelection(cellSelection));
      command();
      onClose?.();
    } catch (error) {
      console.error('Error executing table command:', error);
    }
  };

  const handleDelete = () => {
    if (orientation === "row") {
      selectCellAndExecute(
        `tr:nth-child(${index + 1}) td:first-child, tr:nth-child(${index + 1}) th:first-child`,
        () => editor.commands.deleteRow()
      );
    } else {
      selectCellAndExecute(
        `tr:first-child td:nth-child(${index + 1}), tr:first-child th:nth-child(${index + 1})`,
        () => editor.commands.deleteColumn()
      );
    }
  };

  const handleAddAbove = () => {
    selectCellAndExecute(
      `tr:nth-child(${index + 1}) td:first-child, tr:nth-child(${index + 1}) th:first-child`,
      () => editor.commands.addRowBefore()
    );
  };

  const handleAddBelow = () => {
    selectCellAndExecute(
      `tr:nth-child(${index + 1}) td:first-child, tr:nth-child(${index + 1}) th:first-child`,
      () => editor.commands.addRowAfter()
    );
  };

  const handleAddLeft = () => {
    selectCellAndExecute(
      `tr:first-child td:nth-child(${index + 1}), tr:first-child th:nth-child(${index + 1})`,
      () => editor.commands.addColumnBefore()
    );
  };

  const handleAddRight = () => {
    selectCellAndExecute(
      `tr:first-child td:nth-child(${index + 1}), tr:first-child th:nth-child(${index + 1})`,
      () => editor.commands.addColumnAfter()
    );
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
      
      <MenuSeparator />
      
      <MenuItem onClick={() => console.log(`Convert ${orientation} to header`)}>
        📋 Convert to header
      </MenuItem>
      
      <MenuItem onClick={() => console.log(`Change ${orientation} color`)}>
        🎨 Change color
      </MenuItem>
    </MenuDropdown>
  );
};

export default TableHandleMenu;