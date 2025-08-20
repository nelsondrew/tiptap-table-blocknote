import { RiAddFill } from "react-icons/ri";
import styled from "@emotion/styled";
import { FC, useRef } from "react";
import { Editor } from "@tiptap/core";

const EMPTY_CELL_HEIGHT = 49;
const EMPTY_CELL_WIDTH = 120;

// Rounds a number up or down, depending on whether we're close to the next integer
const marginRound = (num: number, margin = 0.3) => {
  const lowerBound = Math.floor(num) + margin;
  const upperBound = Math.ceil(num) - margin;

  if (num >= lowerBound && num <= upperBound) {
    return Math.round(num);
  } else if (num < lowerBound) {
    return Math.floor(num);
  } else {
    return Math.ceil(num);
  }
};

// Styled components
const ExtendButtonContainer = styled.button<{
  $isRow: boolean;
  $isDragging: boolean;
}>`
  background-color: ${(props) => (props.$isDragging ? "#3b82f6" : "#efefef")};
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

  &:hover {
    background-color: ${(props) => (props.$isDragging ? "#2563eb" : "#d1d5db")};
  }
`;

interface ExtendButtonProps {
  orientation: "addOrRemoveRows" | "addOrRemoveColumns";
  onClick: () => void;
  editor: Editor;
  tableElement: HTMLElement | null;
}

const ExtendButton: FC<ExtendButtonProps> = ({
  orientation,
  onClick,
  editor,
  tableElement,
}) => {
  const isRow = orientation === "addOrRemoveRows";
  const startPosRef = useRef<number | null>(null);
  const appliedChangesRef = useRef<number>(0); // Track how many changes we've applied
  const isDraggingRef = useRef<boolean>(false);

  // Get current table dimensions
  const getCurrentTableDimensions = () => {
    if (!tableElement) return { rows: 0, cols: 0 };

    const tbody = tableElement.querySelector("tbody");
    if (!tbody) return { rows: 0, cols: 0 };

    const rows = tbody.children.length;
    const cols = rows > 0 ? tbody.children[0].children.length : 0;

    return { rows, cols };
  };

  // Ensure proper table selection
  const ensureTableSelection = () => {
    if (!tableElement) return false;

    try {
      const firstCell = tableElement.querySelector("td, th");
      if (!firstCell) return false;

      const pos = editor.view.posAtDOM(firstCell, 0);
      if (pos === -1) return false;

      const tr = editor.state.tr.setSelection(
        editor.state.selection.constructor.near(editor.state.doc.resolve(pos)),
      );
      editor.view.dispatch(tr);

      return true;
    } catch (error) {
      console.warn("Error setting table selection:", error);
      return false;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Store starting position based on orientation
    startPosRef.current = isRow ? e.clientY : e.clientX;
    appliedChangesRef.current = 0; // Reset applied changes counter
    isDraggingRef.current = true;

    const handleMouseMove = (e: MouseEvent) => {
      if (startPosRef.current === null) return;

      // Calculate diff based on orientation
      const diff = isRow
        ? e.clientY - startPosRef.current // For rows, track vertical movement
        : e.clientX - startPosRef.current; // For columns, track horizontal movement

      // Calculate number of cells to add/remove based on drag distance
      const cellSize = isRow ? EMPTY_CELL_HEIGHT : EMPTY_CELL_WIDTH;
      const targetCellChange = marginRound(diff / cellSize, 0.3);

      // Calculate how many operations we need to perform
      const operationsNeeded = targetCellChange - appliedChangesRef.current;

      console.log({
        type: isRow ? "Row" : "Column",
        dragDiff: diff + "px",
        targetCellChange,
        appliedChanges: appliedChangesRef.current,
        operationsNeeded,
      });

      if (operationsNeeded !== 0) {
        // Ensure we have proper table selection
        if (!ensureTableSelection()) {
          console.warn("Could not establish table selection");
          return;
        }

        try {
          if (operationsNeeded > 0) {
            // Need to add more rows/columns
            for (let i = 0; i < operationsNeeded; i++) {
              if (isRow) {
                // For rows, select the last cell before adding
                const { rows } = getCurrentTableDimensions();
                const lastCell = tableElement?.querySelector(
                  `tbody tr:nth-child(${rows}) td:first-child, tbody tr:nth-child(${rows}) th:first-child`,
                );
                console.log(lastCell, "last cell");
                if (lastCell) {
                  const pos = editor.view.posAtDOM(lastCell, 0);
                  if (pos !== -1) {
                    const tr = editor.state.tr.setSelection(
                      editor.state.selection.constructor.near(
                        editor.state.doc.resolve(pos),
                      ),
                    );
                    editor.view.dispatch(tr);
                  }
                }

                const result = editor.commands.addRowAfter();
                console.log("Added row, result:", result);
              } else {
                const result = editor.commands.addColumnAfter();
                console.log("Added column, result:", result);
              }
            }
            appliedChangesRef.current += operationsNeeded;
          } else {
            // Need to remove rows/columns
            const toRemove = Math.abs(operationsNeeded);
            for (let i = 0; i < toRemove; i++) {
              if (isRow) {
                const result = editor.commands.deleteRow();
                console.log("Removed row, result:", result);
              } else {
                const result = editor.commands.deleteColumn();
                console.log("Removed column, result:", result);
              }
            }
            appliedChangesRef.current += operationsNeeded; // operationsNeeded is negative
          }

          console.log(
            `Applied ${Math.abs(operationsNeeded)} ${operationsNeeded > 0 ? "additions" : "removals"}. Total applied: ${appliedChangesRef.current}`,
          );
        } catch (error) {
          console.warn("Error updating table:", error);
        }
      }
    };

    const handleMouseUp = () => {
      console.log(
        `${isRow ? "Row" : "Column"} drag ended. Total changes applied: ${appliedChangesRef.current}`,
      );
      startPosRef.current = null;
      appliedChangesRef.current = 0;
      isDraggingRef.current = false;

      // Cleanup listeners
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    // Attach global listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only trigger onClick if there was no drag
    if (!isDraggingRef.current && startPosRef.current === null) {
      onClick();
    }
  };

  return (
    <ExtendButtonContainer
      $isRow={isRow}
      $isDragging={isDraggingRef.current}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
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

export default ExtendButton;
