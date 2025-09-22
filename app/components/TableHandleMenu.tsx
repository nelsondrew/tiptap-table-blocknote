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
  // Helper to find the correct table node using DOM reference - SIMPLIFIED
  const findCorrectTableNode = () => {
    if (!tableElement || !editor) {
      console.error('TableHandleMenu: No tableElement or editor provided');
      return null;
    }

    try {
      // Use TipTap/ProseMirror's built-in posAtDOM to directly convert DOM to ProseMirror position
      const view = editor.view;
      const pos = view.posAtDOM(tableElement, 0);

      // Get the ProseMirror node at that position
      const resolvedPos = view.state.doc.resolve(pos);

      // Find the table node by walking up the node tree from this position
      for (let depth = resolvedPos.depth; depth >= 0; depth--) {
        const node = resolvedPos.node(depth);
        if (node.type.name === 'table') {
          const tablePos = resolvedPos.start(depth) - 1; // Get the position before the table
          console.log(`[TableHandleMenu] Found table node at pos ${tablePos} using posAtDOM`);
          return { node, pos: tablePos };
        }
      }

      console.error('[TableHandleMenu] No table node found in parent hierarchy');
      return null;
    } catch (error) {
      console.error('[TableHandleMenu] Error finding table node:', error);
      return null;
    }
  };
  // Helper to execute table command with proper cell selection
  const executeTableCommand = (rowIndex: number, colIndex: number, command: () => void) => {
    if (!editor) {
      return;
    }

    try {
      // Try to execute the command directly first
      const success = command();

      if (success !== false) {
        onClose?.();
        return;
      }

      // Fallback: Find and select the appropriate cell manually using correct table
      const tableInfo = findCorrectTableNode();
      if (!tableInfo) {
        console.error('[executeTableCommand] Could not find table node');
        return;
      }

      const { node: tableNode, pos: tablePos } = tableInfo;

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
              return false as any;
            }
            currentColIndex++;
            rowPos += cellNode.nodeSize;
          });

          // IMPORTANT: Stop processing rows after finding the first matching row
          if (cellPos > 0) {
            return false as any;
          }
        }
        currentPos += rowNode.nodeSize;
        currentRowIndex++;
      });

      if (cellPos > 0) {
        // Set cursor in the target cell and try command again
        editor.commands.setTextSelection(cellPos);
        const retryResult = command();
        onClose?.();
      }
    } catch (error) {
      // Still try to close the menu
      onClose?.();
    }
  };

  const handleDelete = () => {
    if (orientation === "row") {
      handleDeleteRow();
    } else {
      handleDeleteColumn();
    }
  };

  const handleDeleteRow = () => {
    // Direct table manipulation using ProseMirror transactions
    const result = editor.chain().focus().command(({ tr, state }) => {
      try {
        // Find the correct table node using DOM reference
        const tableInfo = findCorrectTableNode();
        if (!tableInfo) {
          console.error('[handleDeleteRow] Could not find table node');
          return false;
        }

        const { node: tableNode, pos: tablePos } = tableInfo;

        // Don't delete if it's the only row
        const rowCount = tableNode.childCount;
        if (rowCount <= 1) {
          return false;
        }

        // Create new table structure by removing row at specific index
        const newRows: any[] = [];
        let rowIndex = 0;

        tableNode.forEach((rowNode: any) => {
          if (rowNode.type.name === 'tableRow') {
            // Skip the row at the target index (delete it)
            if (rowIndex !== index) {
              newRows.push(rowNode);
            }
            rowIndex++;
          }
        });

        const newTable = tableNode.type.create(tableNode.attrs, newRows);
        tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);

        return true;
      } catch (error) {
        return false;
      }
    }).run();

    onClose?.();
  };

  const handleDeleteColumn = () => {
    // Direct table manipulation using ProseMirror transactions
    const result = editor.chain().focus().command(({ tr, state }) => {
      try {
        // Find the correct table node using DOM reference
        const tableInfo = findCorrectTableNode();
        if (!tableInfo) {
          console.error('[handleDeleteColumn] Could not find table node');
          return false;
        }

        const { node: tableNode, pos: tablePos } = tableInfo;

        // Check if we have more than one column before deleting
        const firstRow = tableNode.firstChild;
        if (!firstRow || firstRow.childCount <= 1) {
          return false; // Don't delete if it's the only column
        }

        // Create new table structure by removing column at specific index
        const newRows: any[] = [];

        tableNode.forEach((rowNode: any) => {
          if (rowNode.type.name === 'tableRow') {
            const newCells: any[] = [];
            let cellIndex = 0;

            // Copy existing cells, skipping the cell at target index
            rowNode.forEach((cellNode: any) => {
              // Skip the cell at the target index (delete it)
              if (cellIndex !== index) {
                newCells.push(cellNode);
              }
              cellIndex++;
            });

            const newRow = rowNode.type.create(rowNode.attrs, newCells);
            newRows.push(newRow);
          }
        });

        const newTable = tableNode.type.create(tableNode.attrs, newRows);
        tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);

        return true;
      } catch (error) {
        return false;
      }
    }).run();

    onClose?.();
  };

  const handleAddAbove = () => {
    // Direct table manipulation using ProseMirror transactions
    const result = editor.chain().focus().command(({ tr, state }) => {
      try {
        // Find the correct table node using DOM reference
        const tableInfo = findCorrectTableNode();
        if (!tableInfo) {
          console.error('[handleAddAbove] Could not find table node');
          return false;
        }

        const { node: tableNode, pos: tablePos } = tableInfo;

        // Create new table structure by adding row at specific index
        const newRows: any[] = [];
        let rowIndex = 0;

        tableNode.forEach((rowNode: any) => {
          if (rowNode.type.name === 'tableRow') {
            // If we've reached the target index, insert new row first
            if (rowIndex === index) {
              // Create new row with same structure as current row
              const newCells: any[] = [];

              rowNode.forEach((cellNode: any) => {
                const newCell = cellNode.type.create(
                  cellNode.attrs,
                  state.schema.nodes.tableParagraph.create()
                );
                newCells.push(newCell);
              });

              const newRow = rowNode.type.create(rowNode.attrs, newCells);
              newRows.push(newRow);
            }

            // Add the original row
            newRows.push(rowNode);
            rowIndex++;
          }
        });

        // If target index is at the end, add new row at the end
        if (index >= tableNode.childCount) {
          const lastRow = tableNode.lastChild;
          if (lastRow && lastRow.type.name === 'tableRow') {
            const newCells: any[] = [];

            lastRow.forEach((cellNode: any) => {
              const newCell = cellNode.type.create(
                cellNode.attrs,
                state.schema.nodes.tableParagraph.create()
              );
              newCells.push(newCell);
            });

            const newRow = lastRow.type.create(lastRow.attrs, newCells);
            newRows.push(newRow);
          }
        }

        const newTable = tableNode.type.create(tableNode.attrs, newRows);
        tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);

        return true;
      } catch (error) {
        return false;
      }
    }).run();

    onClose?.();
  };

  const handleAddBelow = () => {
    // Direct table manipulation using ProseMirror transactions
    const result = editor.chain().focus().command(({ tr, state }) => {
      try {
        // Find the correct table node using DOM reference
        const tableInfo = findCorrectTableNode();
        if (!tableInfo) {
          console.error('[handleAddBelow] Could not find table node');
          return false;
        }

        const { node: tableNode, pos: tablePos } = tableInfo;

        // Create new table structure by adding row at specific index
        const newRows: any[] = [];
        let rowIndex = 0;
        let newRowAdded = false;

        tableNode.forEach((rowNode: any) => {
          if (rowNode.type.name === 'tableRow') {
            // Add the original row first
            newRows.push(rowNode);

            // If we've just added the row at the target index, insert new row after it
            if (rowIndex === index) {
              // Create new row with same structure as current row
              const newCells: any[] = [];

              rowNode.forEach((cellNode: any) => {
                const newCell = cellNode.type.create(
                  cellNode.attrs,
                  state.schema.nodes.tableParagraph.create()
                );
                newCells.push(newCell);
              });

              const newRow = rowNode.type.create(rowNode.attrs, newCells);
              newRows.push(newRow);
              newRowAdded = true;
            }

            rowIndex++;
          }
        });

        // Only add at the end if we haven't already added a row
        if (!newRowAdded && index >= tableNode.childCount - 1) {
          const lastRow = tableNode.lastChild;
          if (lastRow && lastRow.type.name === 'tableRow') {
            const newCells: any[] = [];

            lastRow.forEach((cellNode: any) => {
              const newCell = cellNode.type.create(
                cellNode.attrs,
                state.schema.nodes.tableParagraph.create()
              );
              newCells.push(newCell);
            });

            const newRow = lastRow.type.create(lastRow.attrs, newCells);
            newRows.push(newRow);
          }
        }

        const newTable = tableNode.type.create(tableNode.attrs, newRows);
        tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);

        return true;
      } catch (error) {
        return false;
      }
    }).run();

    onClose?.();
  };

  const handleAddLeft = () => {
    // Direct table manipulation using ProseMirror transactions
    const result = editor.chain().focus().command(({ tr, state }) => {
      try {
        // Find the correct table node using DOM reference
        const tableInfo = findCorrectTableNode();
        if (!tableInfo) {
          console.error('[handleAddLeft] Could not find table node');
          return false;
        }

        const { node: tableNode, pos: tablePos } = tableInfo;

        // Create new table structure by adding column at specific index
        const newRows: any[] = [];

        tableNode.forEach((rowNode: any) => {
          if (rowNode.type.name === 'tableRow') {
            const newCells: any[] = [];
            let cellIndex = 0;

            // Copy existing cells, inserting new cell at target index
            rowNode.forEach((cellNode: any) => {
              // If we've reached the target index, insert new cell first
              if (cellIndex === index) {
                const newCell = cellNode.type.create(
                  cellNode.attrs,
                  state.schema.nodes.tableParagraph.create()
                );
                newCells.push(newCell);
              }

              // Add the original cell
              newCells.push(cellNode);
              cellIndex++;
            });

            // If target index is at the end, add new cell at the end
            if (index >= rowNode.childCount) {
              const firstCell = rowNode.firstChild;
              if (firstCell) {
                const newCell = firstCell.type.create(
                  firstCell.attrs,
                  state.schema.nodes.tableParagraph.create()
                );
                newCells.push(newCell);
              }
            }

            const newRow = rowNode.type.create(rowNode.attrs, newCells);
            newRows.push(newRow);
          }
        });

        const newTable = tableNode.type.create(tableNode.attrs, newRows);
        tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);

        return true;
      } catch (error) {
        return false;
      }
    }).run();

    onClose?.();
  };

  const handleAddRight = () => {
    // Direct table manipulation using ProseMirror transactions
    const result = editor.chain().focus().command(({ tr, state }) => {
      try {
        // Find the correct table node using DOM reference
        const tableInfo = findCorrectTableNode();
        if (!tableInfo) {
          console.error('[handleAddRight] Could not find table node');
          return false;
        }

        const { node: tableNode, pos: tablePos } = tableInfo;

        // Create new table structure by adding column at specific index
        const newRows: any[] = [];

        tableNode.forEach((rowNode: any) => {
          if (rowNode.type.name === 'tableRow') {
            const newCells: any[] = [];
            let cellIndex = 0;
            let newCellAdded = false;

            // Copy existing cells, inserting new cell at target index
            rowNode.forEach((cellNode: any) => {
              // Add the original cell first
              newCells.push(cellNode);

              // If we've just added the cell at the target index, insert new cell after it
              if (cellIndex === index) {
                const newCell = cellNode.type.create(
                  cellNode.attrs,
                  state.schema.nodes.tableParagraph.create()
                );
                newCells.push(newCell);
                newCellAdded = true;
              }

              cellIndex++;
            });

            // Only add at the end if we haven't already added a cell
            if (!newCellAdded && index >= rowNode.childCount - 1) {
              const lastCell = rowNode.lastChild;
              if (lastCell) {
                const newCell = lastCell.type.create(
                  lastCell.attrs,
                  state.schema.nodes.tableParagraph.create()
                );
                newCells.push(newCell);
              }
            }

            const newRow = rowNode.type.create(rowNode.attrs, newCells);
            newRows.push(newRow);
          }
        });

        const newTable = tableNode.type.create(tableNode.attrs, newRows);
        tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);

        return true;
      } catch (error) {
        return false;
      }
    }).run();

    onClose?.();
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