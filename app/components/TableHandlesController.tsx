"use client";
import { FC, useState, useEffect, useRef } from "react";
import { FloatingPortal } from "@floating-ui/react";
import { Editor } from "@tiptap/core";
import styled from "@emotion/styled";
import { TableTrackerState } from "../extensions/tableTrackerExtension";
import { useExtendButtonsPositioning } from "./useExtendButtonsPositioning";
import { RiAddFill } from "react-icons/ri";
import _, { debounce } from "lodash";
import { NodeSelection } from "@tiptap/pm/state";

// Styled components
const ExtendButtonContainer = styled.button<{ $isRow: boolean }>`
  background-color: #efefef;
  margin-top: ${(props) => (props.$isRow ? "4px" : "0px")};
  margin-left: ${(props) => (!props.$isRow ? "4px" : "0px")};
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
  width: 100%;
  height: 100%;
  border-radius: ${(props) => (props.$isRow ? "4px 4px 0 0" : "4px 0 0 4px")};
  cursor: ${(props) => (props.$isRow ? "row-resize" : "col-resize")};
`;

// Simple extend button component
interface ExtendButtonProps {
  orientation: "addOrRemoveRows" | "addOrRemoveColumns";
  onClick: () => void;
}

const ExtendButton: FC<ExtendButtonProps> = ({ orientation, onClick }) => {
  const isRow = orientation === "addOrRemoveRows";

  return (
    <ExtendButtonContainer
      $isRow={isRow}
      onClick={onClick}
      title={isRow ? "Add/Remove Rows" : "Add/Remove Columns"}
    >
      <RiAddFill
        color="#cfcfcf"
        stroke="#cfcfcf"
        fill="#cfcfcf"
        size={18}
        data-test={"extendButton"}
      />
    </ExtendButtonContainer>
  );
};

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

    // Force a new object reference
    if (currentState) {
      setState({ ...currentState });
      tableStateRef.current = { ...currentState };
    }
  };

  useEffect(() => {
    if (!editor) return;

    // Small delay to ensure editor is fully mounted
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
      state?.show || false, // showAddOrRemoveColumnsButton
      state?.show || false, // showAddOrRemoveRowsButton
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
    // You can implement table row operations here
    // For now, just logging
  };

  const handleAddRemoveColumns = () => {
    if(!editor) return;
    const pos = editor.view.posAtDOM(state?.tableElement, 0);
    const tr = editor.state.tr.setSelection(
        NodeSelection.create(editor.state.doc, pos)
    )
    editor.view.dispatch(tr);
    editor.commands.addColumnAfter();

   
    // You can implement table column operations here
    // For now, just logging
  };

  // Don't render if no table is being tracked
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
            />
          </div>
        )}
      </FloatingPortal>
    </>
  );
};

export default TableHandlesController;
