"use client";
import { FC, useState, useEffect, useRef } from "react";
import { FloatingPortal } from "@floating-ui/react";
import { Editor } from "@tiptap/core";
import { TableTrackerState } from "../extensions/tableTrackerExtension";
import { useExtendButtonsPositioning } from "./useExtendButtonsPositioning";
import ExtendButton from "./ExtendButton";
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

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Subscribe to table tracker updates using the proper API
  useEffect(() => {
    if (!editor) return;

    const timeoutId = setTimeout(() => {
      const tableTracker = (editor as any).tableTracker;
      if (!tableTracker) {
        console.warn("TableTracker API not available on editor");
        return;
      }

      // Subscribe to state updates
      const unsubscribe = tableTracker.onUpdate((newState: TableTrackerState) => {
        setState({ ...newState });
        tableStateRef.current = { ...newState };
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

  const { addOrRemoveRowsButton, addOrRemoveColumnsButton } =
    useExtendButtonsPositioning(
      state?.showAddOrRemoveColumnsButton || false,  // Columns first!
      state?.showAddOrRemoveRowsButton || false,     // Rows second!
      state?.referencePosTable || null,
    );

  // Helper to select a cell and execute table command - improved error handling
  const selectCellAndExecute = (selector: string, command: () => void) => {
    if (!editor || !state?.tableElement) {
      console.warn('Editor or table element not available');
      return;
    }

    const cell = state.tableElement.querySelector(selector);
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
    } catch (error) {
      console.error('Error executing table command:', error);
    }
  };

  const handleRemoveLastRow = () =>
    selectCellAndExecute(
      "tr:last-child td:first-child, tr:last-child th:first-child",
      () => editor!.commands.deleteRow(),
    );

  const handleAddLastRow = () =>
    selectCellAndExecute(
      "tr:last-child td:first-child, tr:last-child th:first-child",
      () => editor!.commands.addRowAfter(),
    );

  const handleRemoveLastColumn = () =>
    selectCellAndExecute(
      "tr:last-child td:last-child, tr:last-child th:last-child",
      () => editor!.commands.deleteColumn(),
    );

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
  ) => 
    shouldShow && button?.isMounted ? (
      <div className={className} ref={button.ref} style={button.style}>
        <ExtendButton
          orientation={orientation}
          onClick={handler}
          editor={editor}
          tableElement={state.tableElement}
        />
      </div>
    ) : null;

  return (
    <FloatingPortal root={portalRoot}>
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
  );
};

export default TableHandlesController;
