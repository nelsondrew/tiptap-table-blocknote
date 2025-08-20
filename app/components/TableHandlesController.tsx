"use client";
import { FC, useState, useEffect, useRef } from "react";
import { FloatingPortal } from "@floating-ui/react";
import { Editor } from "@tiptap/core";
import styled from "@emotion/styled";
import { TableTrackerState } from "../extensions/tableTrackerExtension";
import { useExtendButtonsPositioning } from "./useExtendButtonsPositioning";
import _, { debounce } from "lodash";
import { NodeSelection } from "@tiptap/pm/state";
import ExtendButton from "./ExtendButton";


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

  const updateLocalState = (editor) => {
    const currentState = (editor.extensionStorage as any)?.tableTracker?.view
      ?.state;

    if (currentState) {
      setState({ ...currentState });
      tableStateRef.current = { ...currentState };
    }
  };

  useEffect(() => {
    if (!editor) return;

    const timeoutId = setTimeout(() => {
      if (!editor.view || !editor.view.dom) {
        console.warn("Editor view not yet available");
        return;
      }

      const el = editor.view.dom;

      const handleMouseUp = debounce(() => {
        updateLocalState(editorRef.current);
      }, 0);

      const handleMouseMove = debounce(() => {
        updateLocalState(editorRef.current);
      }, 0);

      el.addEventListener("mouseup", handleMouseUp);
      el.addEventListener("mousemove", handleMouseMove);

      // Store cleanup function
      return () => {
        el.removeEventListener("mouseup", handleMouseUp);
        el.removeEventListener("mousemove", handleMouseMove);
      };
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [editor]);

  const { addOrRemoveRowsButton, addOrRemoveColumnsButton } =
    useExtendButtonsPositioning(
      state?.show || false, 
      state?.show || false, 
      state?.referencePosTable || null,
    );

  const handleAddRemoveRows = () => {
    if(!editor) return;
    const pos = editor.view.posAtDOM(state?.tableElement, 0);
    const tr = editor.state.tr.setSelection(
        NodeSelection.create(editor.state.doc, pos)
    )
    editor.view.dispatch(tr);
    editor.commands.addRowAfter();
  };

  const handleAddRemoveColumns = () => {
    if(!editor) return;
    const pos = editor.view.posAtDOM(state?.tableElement, 0);
    const tr = editor.state.tr.setSelection(
        NodeSelection.create(editor.state.doc, pos)
    )
    editor.view.dispatch(tr);
    editor.commands.addColumnAfter();
  };

  if (!state?.show || !state.widgetContainer) {
    return null;
  }

  return (
    <>
      {/* Render extend buttons in the table's widget container */}
      <FloatingPortal root={state.widgetContainer}>
        {/* Add/Remove Rows Button */}
        {addOrRemoveRowsButton.isMounted && (
          <div
            className="table-handle-rows-container"
            ref={addOrRemoveRowsButton.ref}
            style={addOrRemoveRowsButton.style}
          >
            <ExtendButton
              orientation="addOrRemoveRows"
              onClick={handleAddRemoveRows}
              editor={editor}
              tableElement={state.tableElement}
            />
          </div>
        )}

        {/* Add/Remove Columns Button */}
        {addOrRemoveColumnsButton.isMounted && (
          <div
            className="table-handle-columns-container"
            ref={addOrRemoveColumnsButton.ref}
            style={addOrRemoveColumnsButton.style}
          >
            <ExtendButton
              orientation="addOrRemoveColumns"
              onClick={handleAddRemoveColumns}
              editor={editor}
              tableElement={state.tableElement}
            />
          </div>
        )}
      </FloatingPortal>
    </>
  );
};

export default TableHandlesController;
