"use client";
import { FC, useState, useEffect, useRef } from "react";
import { FloatingPortal } from "@floating-ui/react";
import { Editor } from "@tiptap/core";
import { TableTrackerState } from "../extensions/tableTrackerExtension";
import { useExtendButtonsPositioning } from "./useExtendButtonsPositioning";
import { useTableHandlesPositioning } from "./useTableHandlesPositioning";
import ExtendButton from "./ExtendButton";
import TableHandle from "./TableHandle";
import TableCellButton from "./TableCellButton";
import { CellSelection } from "@tiptap/pm/tables";

interface TableHandlesControllerProps {
  editor: Editor | null;
}

export const TableHandlesController: FC<TableHandlesControllerProps> = ({
  editor,
}) => {
  const [state, setState] = useState<TableTrackerState | undefined>(undefined);
  const tableStateRef = useRef<TableTrackerState | null>(null);
  const editorRef = useRef(editor);
  const [menuContainerRef, setMenuContainerRef] = useState<HTMLDivElement | null>(null);
  const [hideRow, setHideRow] = useState<boolean>(false);
  const [hideCol, setHideCol] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMenuOpenRef = useRef(false);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Keep the ref in sync with the state
  useEffect(() => {
    isMenuOpenRef.current = isMenuOpen;
  }, [isMenuOpen]);

  // Wrapper function to update both state and ref
  const updateIsMenuOpen = (value: boolean | ((prevState: boolean) => boolean)) => {
    const newValue = typeof value === 'function' ? value(isMenuOpen) : value;
    setIsMenuOpen(newValue);
    isMenuOpenRef.current = newValue;
  };

  // Subscribe to table tracker updates using the proper API
  useEffect(() => {
    if (!editor) return;

    const timeoutId = setTimeout(() => {
      const tableTracker = (editor as any).tableTracker;
      if (!tableTracker) {
        return;
      }

      // Subscribe to state updates
      const unsubscribe = tableTracker.onUpdate((newState: TableTrackerState) => {
        // Don't update state if menu is open to prevent handles from disappearing
        if (!isMenuOpenRef.current) {
          setState({ ...newState });
          tableStateRef.current = { ...newState };
        }
      });

      // Set initial state
      const initialState = tableTracker.getState();
      if (initialState) {
        setState({ ...initialState });
        tableStateRef.current = { ...initialState };
      }

      return unsubscribe;
    }, 100); // Small delay to ensure extension is initialized

    return () => {
      clearTimeout(timeoutId);
    };
  }, [editor]);

  const { rowHandle, colHandle, cellHandle } = useTableHandlesPositioning(
    state?.show || false,
    state?.referencePosCell || null,
    state?.referencePosTable || null,
  );

  const { addOrRemoveRowsButton, addOrRemoveColumnsButton } =
    useExtendButtonsPositioning(
      state?.showAddOrRemoveColumnsButton || false,  // Columns first!
      state?.showAddOrRemoveRowsButton || false,     // Rows second!
      state?.referencePosTable || null,
    );

  // Get table tracker API for handle control
  const tableTracker = (editor as any)?.tableTracker;

  // Helper to check if a cell has content (following BlockNote behavior)
  const cellHasContent = (cell: Element): boolean => {
    // Check if cell has non-empty text content (excluding whitespace)
    const textContent = cell.textContent?.trim() || '';
    if (textContent.length > 0) {
      return true;
    }
    
    // Check if cell has any child elements (images, etc.)
    const hasChildElements = cell.children.length > 0;
    if (hasChildElements) {
      // Filter out empty paragraphs and br tags
      const meaningfulChildren = Array.from(cell.children).filter(child => {
        if (child.tagName === 'P') {
          return child.textContent?.trim().length > 0;
        }
        if (child.tagName === 'BR') {
          return false;
        }
        return true;
      });
      return meaningfulChildren.length > 0;
    }
    
    return false;
  };

  // Check if last row has any content
  const lastRowHasContent = (): boolean => {
    if (!state?.tableElement) return false;
    
    const lastRow = state.tableElement.querySelector("tr:last-child");
    if (!lastRow) return false;
    
    const cells = lastRow.querySelectorAll("td, th");
    return Array.from(cells).some(cell => cellHasContent(cell));
  };

  // Check if last column has any content
  const lastColumnHasContent = (): boolean => {
    if (!state?.tableElement) return false;
    
    const rows = state.tableElement.querySelectorAll("tr");
    if (rows.length === 0) return false;
    
    // Get all cells in the last column
    const lastColumnCells: Element[] = [];
    rows.forEach(row => {
      const cells = row.querySelectorAll("td, th");
      if (cells.length > 0) {
        lastColumnCells.push(cells[cells.length - 1]);
      }
    });
    
    return lastColumnCells.some(cell => cellHasContent(cell));
  };

  // Helper to select a cell and execute table command - improved error handling
  const selectCellAndExecute = (selector: string, command: () => void) => {
    if (!editor || !state?.tableElement) {
      return;
    }

    const cell = state.tableElement.querySelector(selector);
    if (!cell) {
      return;
    }

    try {
      const cellDesc = (cell as any).pmViewDesc;
      if (!cellDesc || !['tableCell', 'tableHeader'].includes(cellDesc.node.type.name)) {
        return;
      }

      const cellSelection = CellSelection.create(
        editor.state.doc,
        editor.state.doc.resolve(cellDesc.posBefore).pos,
      );
      
      editor.view.dispatch(editor.state.tr.setSelection(cellSelection));
      command();
    } catch (error) {
      // Silent error handling
    }
  };

  const handleRemoveLastRow = () => {
    // BlockNote behavior: prevent deletion if row has content
    if (lastRowHasContent()) {
      return;
    }
    
    selectCellAndExecute(
      "tr:last-child td:first-child, tr:last-child th:first-child",
      () => editor!.commands.deleteRow(),
    );
  };

  const handleAddLastRow = () =>
    selectCellAndExecute(
      "tr:last-child td:first-child, tr:last-child th:first-child",
      () => editor!.commands.addRowAfter(),
    );

  const handleRemoveLastColumn = () => {
    // BlockNote behavior: prevent deletion if column has content
    if (lastColumnHasContent()) {
      return;
    }
    
    selectCellAndExecute(
      "tr:last-child td:last-child, tr:last-child th:last-child",
      () => editor!.commands.deleteColumn(),
    );
  };

  const handleAddLastColumn = () =>
    selectCellAndExecute(
      "tr:last-child td:last-child, tr:last-child th:last-child",
      () => editor!.commands.addColumnAfter(),
    );

  const handleAddRemoveRows = (remove: boolean) =>
    remove ? handleRemoveLastRow() : handleAddLastRow();

  const handleAddRemoveColumns = (remove: boolean) =>
    remove ? handleRemoveLastColumn() : handleAddLastColumn();

  // Don't render if basic requirements not met
  if (!state?.show || !editor) {
    return null;
  }

  // Check if we have widget container or use document.body as fallback
  const portalRoot = state.widgetContainer || document.body;

  const renderButton = (
    button: any,
    orientation: "addOrRemoveRows" | "addOrRemoveColumns",
    handler: (remove: boolean) => void,
    className: string,
    shouldShow: boolean
  ) => {
    const isRemoveDisabled = orientation === "addOrRemoveRows" 
      ? lastRowHasContent() 
      : lastColumnHasContent();

    return shouldShow && button?.isMounted ? (
      <div className={className} ref={button.ref} style={button.style}>
        <ExtendButton
          orientation={orientation}
          onClick={handler}
          editor={editor}
          tableElement={state.tableElement}
          isRemoveDisabled={isRemoveDisabled}
        />
      </div>
    ) : null;
  };


  return (
    <>
      {/* Menu container for portals - following BlockNote pattern */}
      <div ref={setMenuContainerRef}></div>

      
      <FloatingPortal root={portalRoot}>
      
        {/* Row Handle - appears on left when hovering over cells */}
        {!hideRow &&
          menuContainerRef &&
          rowHandle.isMounted &&
          state.rowIndex !== undefined && (
            <div ref={rowHandle.ref} style={rowHandle.style}>
              <TableHandle
                editor={editor}
                orientation="row"
                index={state.rowIndex}
                tableElement={state.tableElement}
                showOtherSide={() => setHideCol(false)}
                hideOtherSide={() => setHideCol(true)}
                freezeHandles={() => tableTracker?.freezeHandles()}
                unfreezeHandles={() => tableTracker?.unfreezeHandles()}
                menuContainer={menuContainerRef}
                setIsMenuOpen={updateIsMenuOpen}
              />
            </div>
          )}

        {/* Column Handle - appears on top when hovering over cells */}
        {!hideCol &&
          menuContainerRef &&
          colHandle.isMounted &&
          state.colIndex !== undefined && (
            <div ref={colHandle.ref} style={colHandle.style}>
              <TableHandle
                editor={editor}
                orientation="column"
                index={state.colIndex}
                tableElement={state.tableElement}
                showOtherSide={() => setHideRow(false)}
                hideOtherSide={() => setHideRow(true)}
                freezeHandles={() => tableTracker?.freezeHandles()}
                unfreezeHandles={() => tableTracker?.unfreezeHandles()}
                menuContainer={menuContainerRef}
                setIsMenuOpen={updateIsMenuOpen}
              />
            </div>
          )}

        {/* Extend Buttons */}
        {renderButton(
          addOrRemoveRowsButton,
          "addOrRemoveRows",
          handleAddRemoveRows,
          "table-handle-rows-container",
          state.showAddOrRemoveRowsButton
        )}
        {renderButton(
          addOrRemoveColumnsButton,
          "addOrRemoveColumns",
          handleAddRemoveColumns,
          "table-handle-columns-container",
          state.showAddOrRemoveColumnsButton
        )}
      </FloatingPortal>
    </>
  );
};

export default TableHandlesController;
