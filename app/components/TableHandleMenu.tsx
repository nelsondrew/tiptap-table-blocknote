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
  console.log(`🎯 TABLE-MENU - TableHandleMenu initialized:`, {
    orientation,
    index,
    hasTableElement: !!tableElement,
    hasEditor: !!editor
  });

  // Helper to execute table command with proper cell selection
  const executeTableCommand = (rowIndex: number, colIndex: number, command: () => void) => {
    console.log(`[TABLE-COMMAND] Executing command for ${orientation} at index ${index}:`, {rowIndex, colIndex, orientation});

    if (!editor) {
      console.warn('[TABLE-COMMAND] Editor not available');
      return;
    }

    try {
      // Check current selection state
      const currentSelection = editor.state.selection;
      console.log('[TABLE-COMMAND] Current selection:', {
        type: currentSelection.constructor.name,
        from: currentSelection.from,
        to: currentSelection.to,
        anchor: currentSelection.anchor,
        head: currentSelection.head
      });

      // Simple approach: try to execute the command directly first
      // TipTap commands should work if we're in a table context
      console.log('[TABLE-COMMAND] Attempting direct command execution');
      const success = command();
      console.log('[TABLE-COMMAND] Direct command result:', success);

      if (success !== false) {
        console.log('[TABLE-COMMAND] Direct command succeeded, closing menu');
        onClose?.();
        return;
      }

      // Fallback: Find and select the appropriate cell manually
      console.log('[TABLE-COMMAND] Direct command failed, trying manual cell selection');
      let tableNode: any = null;
      let tablePos = 0;

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'table') {
          tableNode = node;
          tablePos = pos;
          console.log('[TABLE-COMMAND] Found table node at position:', pos);
          return false as any; // Stop searching
        }
      });

      if (!tableNode) {
        console.warn('[TABLE-COMMAND] Table node not found in document');
        return;
      }

      console.log('[TABLE-COMMAND] Table structure analysis:', {
        tableNodeSize: tableNode.nodeSize,
        childCount: tableNode.childCount,
        targetRowIndex: rowIndex,
        targetColIndex: colIndex
      });

      // Find the target cell position
      let cellPos = -1;
      let currentPos = tablePos + 1;
      let currentRowIndex = 0;

      console.log('[TABLE-COMMAND] Starting cell position search');
      tableNode.forEach((rowNode: any) => {
        console.log(`[TABLE-COMMAND] Processing row ${currentRowIndex}:`, {
          rowType: rowNode.type.name,
          isTargetRow: currentRowIndex === rowIndex,
          cellCount: rowNode.childCount
        });

        if (rowNode.type.name === 'tableRow' && currentRowIndex === rowIndex) {
          let currentColIndex = 0;
          let rowPos = currentPos + 1;

          console.log('[TABLE-COMMAND] Found target row, searching for target column');
          rowNode.forEach((cellNode: any) => {
            console.log(`[TABLE-COMMAND] Processing cell ${currentColIndex}:`, {
              cellType: cellNode.type.name,
              isTargetCell: currentColIndex === colIndex,
              cellNodeSize: cellNode.nodeSize,
              cellPosition: rowPos
            });

            if (currentColIndex === colIndex) {
              cellPos = rowPos + 1; // Position inside the cell
              console.log('[TABLE-COMMAND] Found target cell at position:', cellPos);
              console.log('[TABLE-COMMAND] STOPPING SEARCH - Found target cell in first matching row');
              return false as any;
            }
            currentColIndex++;
            rowPos += cellNode.nodeSize;
          });

          // IMPORTANT: Stop processing rows after finding the first matching row
          if (cellPos > 0) {
            console.log('[TABLE-COMMAND] STOPPING ROW ITERATION - Target cell found');
            return false as any;
          }
        }
        currentPos += rowNode.nodeSize;
        currentRowIndex++;
      });

      if (cellPos > 0) {
        console.log('[TABLE-COMMAND] Setting text selection to position:', cellPos);
        // Set cursor in the target cell and try command again
        editor.commands.setTextSelection(cellPos);

        // Log the new selection state
        const newSelection = editor.state.selection;
        console.log('[TABLE-COMMAND] New selection after setTextSelection:', {
          type: newSelection.constructor.name,
          from: newSelection.from,
          to: newSelection.to,
          anchor: newSelection.anchor,
          head: newSelection.head
        });

        console.log('[TABLE-COMMAND] Selection set, re-attempting command');
        const retryResult = command();
        console.log('[TABLE-COMMAND] Retry command result:', retryResult);
        onClose?.();
      } else {
        console.warn('[TABLE-COMMAND] Could not find target cell position');
      }
    } catch (error) {
      console.error('[TABLE-COMMAND] Error executing table command:', error);
      console.error('[TABLE-COMMAND] Error stack:', (error as Error).stack);
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
    console.log(`[ROW-ADD] Adding row BEFORE index ${index}`);

    // Log table structure before operation
    if (tableElement) {
      const rows = tableElement.querySelectorAll('tr');
      console.log('[ROW-ADD] Table structure before addRowBefore:', {
        totalRows: rows.length,
        firstRowCells: rows[0]?.children.length || 0,
        targetIndex: index
      });
    }

    // Direct table manipulation using ProseMirror transactions
    const result = editor.chain().focus().command(({ tr, dispatch, state }) => {
      console.log('[ROW-ADD] Direct table manipulation for addRowBefore at index:', index);

      try {
        // Find the table node in the document
        let tableNode: any = null;
        let tablePos = 0;

        state.doc.descendants((node, pos) => {
          if (node.type.name === 'table') {
            tableNode = node;
            tablePos = pos;
            return false as any;
          }
        });

        if (!tableNode) {
          console.warn('[ROW-ADD] No table found in document');
          return false;
        }

        console.log('[ROW-ADD] Found table node at position:', tablePos);

        // Create new table structure by adding row at specific index
        const newRows: any[] = [];
        let rowIndex = 0;

        console.log('[ROW-ADD] Starting row iteration for addRowBefore');
        console.log('[ROW-ADD] Table has', tableNode.childCount, 'total children');
        console.log('[ROW-ADD] Target index:', index);

        tableNode.forEach((rowNode: any) => {
          console.log(`[ROW-ADD] Processing node:`, {
            nodeType: rowNode.type.name,
            isTableRow: rowNode.type.name === 'tableRow',
            currentRowIndex: rowIndex,
            isTargetRow: rowIndex === index
          });

          if (rowNode.type.name === 'tableRow') {
            // If we've reached the target index, insert new row first
            if (rowIndex === index) {
              console.log(`[ROW-ADD] *** INSERTING NEW ROW BEFORE row ${rowIndex} ***`);

              // Create new row with same structure as current row
              const newCells: any[] = [];

              rowNode.forEach((cellNode: any) => {
                console.log('[ROW-ADD] Copying cell type:', cellNode.type.name);
                const newCell = cellNode.type.create(
                  cellNode.attrs,
                  state.schema.nodes.tableParagraph.create()
                );
                newCells.push(newCell);
              });

              const newRow = rowNode.type.create(rowNode.attrs, newCells);
              newRows.push(newRow);
              console.log('[ROW-ADD] New row added to position:', newRows.length - 1);
            }

            // Add the original row
            console.log(`[ROW-ADD] Adding original row ${rowIndex} to position:`, newRows.length);
            newRows.push(rowNode);
            rowIndex++;
          } else {
            console.log('[ROW-ADD] Skipping non-tableRow node:', rowNode.type.name);
          }
        });

        console.log('[ROW-ADD] Final newRows array length:', newRows.length);
        console.log('[ROW-ADD] Original table had rows:', tableNode.childCount);
        console.log('[ROW-ADD] New table will have rows:', newRows.length);

        // If target index is at the end, add new row at the end
        if (index >= tableNode.childCount) {
          console.log('[ROW-ADD] Target index is beyond table bounds, adding at end');
          console.log('[ROW-ADD] Index:', index, 'vs childCount:', tableNode.childCount);

          const lastRow = tableNode.lastChild;
          if (lastRow && lastRow.type.name === 'tableRow') {
            console.log('[ROW-ADD] Creating new row based on last row');
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
            console.log('[ROW-ADD] Edge case: new row added at end, final length:', newRows.length);
          }
        } else {
          console.log('[ROW-ADD] Target index is within bounds, no edge case handling needed');
        }

        const newTable = tableNode.type.create(tableNode.attrs, newRows);
        tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);

        console.log('[ROW-ADD] Transaction created for row insertion before index');
        return true;
      } catch (error) {
        console.error('[ROW-ADD] Error in direct table manipulation:', error);
        return false;
      }
    }).run();

    console.log('[ROW-ADD] Direct manipulation result:', result);

    // Log table structure after operation
    setTimeout(() => {
      if (tableElement) {
        const rows = tableElement.querySelectorAll('tr');
        console.log('[ROW-ADD] Table structure after addRowBefore:', {
          totalRows: rows.length,
          firstRowCells: rows[0]?.children.length || 0
        });
      }
    }, 100);

    onClose?.();
  };

  const handleAddBelow = () => {
    const insertIndex = index + 1; // Insert after the current index
    console.log(`[ROW-ADD] Adding row AFTER index ${index} (inserting at ${insertIndex})`);

    // Log table structure before operation
    if (tableElement) {
      const rows = tableElement.querySelectorAll('tr');
      console.log('[ROW-ADD] Table structure before addRowAfter:', {
        totalRows: rows.length,
        firstRowCells: rows[0]?.children.length || 0,
        targetIndex: index,
        insertIndex
      });
    }

    // Direct table manipulation using ProseMirror transactions
    const result = editor.chain().focus().command(({ tr, dispatch, state }) => {
      console.log('[ROW-ADD] Direct table manipulation for addRowAfter at insert index:', insertIndex);

      try {
        // Find the table node in the document
        let tableNode: any = null;
        let tablePos = 0;

        state.doc.descendants((node, pos) => {
          if (node.type.name === 'table') {
            tableNode = node;
            tablePos = pos;
            return false as any;
          }
        });

        if (!tableNode) {
          console.warn('[ROW-ADD] No table found in document');
          return false;
        }

        console.log('[ROW-ADD] Found table node at position:', tablePos);

        // Create new table structure by adding row at specific index
        const newRows: any[] = [];
        let rowIndex = 0;

        console.log('[ROW-ADD] Starting row iteration for addRowAfter');
        console.log('[ROW-ADD] Table has', tableNode.childCount, 'total children');
        console.log('[ROW-ADD] Target index:', index);
        console.log('[ROW-ADD] Insert index:', insertIndex);

        tableNode.forEach((rowNode: any) => {
          console.log(`[ROW-ADD] Processing node:`, {
            nodeType: rowNode.type.name,
            isTableRow: rowNode.type.name === 'tableRow',
            currentRowIndex: rowIndex,
            isTargetRow: rowIndex === index
          });

          if (rowNode.type.name === 'tableRow') {
            // Add the original row first
            console.log(`[ROW-ADD] Adding original row ${rowIndex} to position:`, newRows.length);
            newRows.push(rowNode);

            // If we've just added the row at the target index, insert new row after it
            if (rowIndex === index) {
              console.log(`[ROW-ADD] *** INSERTING NEW ROW AFTER row ${rowIndex} ***`);

              // Create new row with same structure as current row
              const newCells: any[] = [];

              rowNode.forEach((cellNode: any) => {
                console.log('[ROW-ADD] Copying cell type:', cellNode.type.name);
                const newCell = cellNode.type.create(
                  cellNode.attrs,
                  state.schema.nodes.tableParagraph.create()
                );
                newCells.push(newCell);
              });

              const newRow = rowNode.type.create(rowNode.attrs, newCells);
              newRows.push(newRow);
              console.log('[ROW-ADD] New row added to position:', newRows.length - 1);
            }

            rowIndex++;
          } else {
            console.log('[ROW-ADD] Skipping non-tableRow node:', rowNode.type.name);
          }
        });

        console.log('[ROW-ADD] Final newRows array length:', newRows.length);
        console.log('[ROW-ADD] Original table had rows:', tableNode.childCount);
        console.log('[ROW-ADD] New table will have rows:', newRows.length);

        // If target index is at or beyond the end, add new row at the end
        if (insertIndex >= tableNode.childCount) {
          console.log('[ROW-ADD] Insert index is beyond table bounds, adding at end');
          console.log('[ROW-ADD] InsertIndex:', insertIndex, 'vs childCount:', tableNode.childCount);

          const lastRow = tableNode.lastChild;
          if (lastRow && lastRow.type.name === 'tableRow') {
            console.log('[ROW-ADD] Creating new row based on last row');
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
            console.log('[ROW-ADD] Edge case: new row added at end, final length:', newRows.length);
          }
        } else {
          console.log('[ROW-ADD] Insert index is within bounds, no edge case handling needed');
        }

        const newTable = tableNode.type.create(tableNode.attrs, newRows);
        tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);

        console.log('[ROW-ADD] Transaction created for row insertion after index');
        return true;
      } catch (error) {
        console.error('[ROW-ADD] Error in direct table manipulation:', error);
        return false;
      }
    }).run();

    console.log('[ROW-ADD] Direct manipulation result:', result);

    // Log table structure after operation
    setTimeout(() => {
      if (tableElement) {
        const rows = tableElement.querySelectorAll('tr');
        console.log('[ROW-ADD] Table structure after addRowAfter:', {
          totalRows: rows.length,
          firstRowCells: rows[0]?.children.length || 0
        });
      }
    }, 100);

    onClose?.();
  };

  const handleAddLeft = () => {
    console.log(`[COLUMN-ADD] Adding column BEFORE index ${index}`);

    // Log table structure before operation
    if (tableElement) {
      const rows = tableElement.querySelectorAll('tr');
      console.log('[COLUMN-ADD] Table structure before addColumnBefore:', {
        totalRows: rows.length,
        firstRowCells: rows[0]?.children.length || 0,
        targetIndex: index
      });
    }

    // Direct table manipulation using ProseMirror transactions
    const result = editor.chain().focus().command(({ tr, dispatch, state }) => {
      console.log('[COLUMN-ADD] Direct table manipulation for addColumnBefore at index:', index);

      try {
        // Find the table node in the document
        let tableNode: any = null;
        let tablePos = 0;

        state.doc.descendants((node, pos) => {
          if (node.type.name === 'table') {
            tableNode = node;
            tablePos = pos;
            return false as any;
          }
        });

        if (!tableNode) {
          console.warn('[COLUMN-ADD] No table found in document');
          return false;
        }

        console.log('[COLUMN-ADD] Found table node at position:', tablePos);

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

        console.log('[COLUMN-ADD] Transaction created for column insertion');
        return true;
      } catch (error) {
        console.error('[COLUMN-ADD] Error in direct table manipulation:', error);
        return false;
      }
    }).run();

    console.log('[COLUMN-ADD] Direct manipulation result:', result);

    // Log table structure after operation
    setTimeout(() => {
      if (tableElement) {
        const rows = tableElement.querySelectorAll('tr');
        console.log('[COLUMN-ADD] Table structure after addColumnBefore:', {
          totalRows: rows.length,
          firstRowCells: rows[0]?.children.length || 0
        });
      }
    }, 100);

    onClose?.();
  };

  const handleAddRight = () => {
    const insertIndex = index + 1; // Insert after the current index
    console.log(`[COLUMN-ADD] Adding column AFTER index ${index} (inserting at ${insertIndex})`);

    // Log table structure before operation
    if (tableElement) {
      const rows = tableElement.querySelectorAll('tr');
      console.log('[COLUMN-ADD] Table structure before addColumnAfter:', {
        totalRows: rows.length,
        firstRowCells: rows[0]?.children.length || 0,
        targetIndex: index,
        insertIndex
      });
    }

    // Direct table manipulation using ProseMirror transactions
    const result = editor.chain().focus().command(({ tr, dispatch, state }) => {
      console.log('[COLUMN-ADD] Direct table manipulation for addColumnAfter at insert index:', insertIndex);

      try {
        // Find the table node in the document
        let tableNode: any = null;
        let tablePos = 0;

        state.doc.descendants((node, pos) => {
          if (node.type.name === 'table') {
            tableNode = node;
            tablePos = pos;
            return false as any;
          }
        });

        if (!tableNode) {
          console.warn('[COLUMN-ADD] No table found in document');
          return false;
        }

        console.log('[COLUMN-ADD] Found table node at position:', tablePos);

        // Create new table structure by adding column at specific index
        const newRows: any[] = [];

        tableNode.forEach((rowNode: any) => {
          if (rowNode.type.name === 'tableRow') {
            const newCells: any[] = [];
            let cellIndex = 0;

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
              }

              cellIndex++;
            });

            // If target index is at or beyond the end, add new cell at the end
            if (insertIndex >= rowNode.childCount) {
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

        console.log('[COLUMN-ADD] Transaction created for column insertion after index');
        return true;
      } catch (error) {
        console.error('[COLUMN-ADD] Error in direct table manipulation:', error);
        return false;
      }
    }).run();

    console.log('[COLUMN-ADD] Direct manipulation result:', result);

    // Log table structure after operation
    setTimeout(() => {
      if (tableElement) {
        const rows = tableElement.querySelectorAll('tr');
        console.log('[COLUMN-ADD] Table structure after addColumnAfter:', {
          totalRows: rows.length,
          firstRowCells: rows[0]?.children.length || 0
        });
      }
    }, 100);

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