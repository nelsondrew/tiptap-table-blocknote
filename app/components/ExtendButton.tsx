import { RiAddFill } from "react-icons/ri";
import styled from "@emotion/styled";
import { FC, useRef } from "react";
import { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

const EMPTY_CELL_HEIGHT = 49;
const EMPTY_CELL_WIDTH = 120;

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

const ExtendButtonContainer = styled.button<{
  $isRow: boolean;
  $isDragging: boolean;
  $isRemoveDisabled?: boolean;
}>`
  background-color: ${(props) => 
    props.$isRemoveDisabled ? "#f5f5f5" :
    props.$isDragging ? "#c0c0c0" : "#efefef"
  };
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
    background-color: ${(props) => 
      props.$isRemoveDisabled ? "#f5f5f5" :
      props.$isDragging ? "#c0c0c0" : "#d1d5db"
    };
  }
`;

interface ExtendButtonProps {
  orientation: "addOrRemoveRows" | "addOrRemoveColumns";
  onClick: (remove : boolean) => void;
  editor: Editor;
  tableElement: HTMLElement | null;
  isRemoveDisabled?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const ExtendButton: FC<ExtendButtonProps> = ({
  orientation,
  onClick,
  editor,
  tableElement,
  isRemoveDisabled = false,
  onDragStart,
  onDragEnd,
}) => {
  const isRow = orientation === "addOrRemoveRows";
  const startPosRef = useRef<number | null>(null);
  const appliedChangesRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  // Ensure proper table selection
  const ensureTableSelection = () => {
    if (!tableElement) return false;

    try {
      const firstCell = tableElement.querySelector("td, th");
      if (!firstCell) return false;

      const pos = editor.view.posAtDOM(firstCell, 0);
      if (pos === -1) return false;

      const tr = editor.state.tr.setSelection(
        TextSelection.near(editor.state.doc.resolve(pos)),
      );
      editor.view.dispatch(tr);

      return true;
    } catch (error) {
      return false;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startPosRef.current = isRow ? e.clientY : e.clientX;
    appliedChangesRef.current = 0;
    isDraggingRef.current = true;
    onDragStart?.();

    const handleMouseMove = (e: MouseEvent) => {
      if (startPosRef.current === null) return;

      const diff = isRow
        ? e.clientY - startPosRef.current
        : e.clientX - startPosRef.current;

      const cellSize = isRow ? EMPTY_CELL_HEIGHT : EMPTY_CELL_WIDTH;
      const targetCellChange = marginRound(diff / cellSize, 0.3);

      const operationsNeeded = targetCellChange - appliedChangesRef.current;

      if (operationsNeeded !== 0) {
        if (!ensureTableSelection()) {
          console.warn("Could not establish table selection");
          return;
        }

        try {
          if (operationsNeeded > 0) {
            for (let i = 0; i < operationsNeeded; i++) {
              if (isRow) {
                onClick(false);
              } else {
                onClick(false);
              }
            }
            appliedChangesRef.current += operationsNeeded;
          } else {
            const toRemove = Math.abs(operationsNeeded);
            for (let i = 0; i < toRemove; i++) {
              if (isRow) {
                onClick(true)
              } else {
                onClick(true)
              }
            }
            appliedChangesRef.current += operationsNeeded;
          }
        } catch (error) {
          console.warn("Error updating table:", error);
        }
      }
    };

    const handleMouseUp = () => {
      startPosRef.current = null;
      appliedChangesRef.current = 0;
      isDraggingRef.current = false;
      onDragEnd?.();

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDraggingRef.current && startPosRef.current === null) {
      // For remove operations, check if disabled
      if (e.shiftKey || e.altKey) {
        if (isRemoveDisabled) {
          console.log('Remove operation disabled: content detected');
          return;
        }
        onClick(true); // Remove
      } else {
        onClick(false); // Add
      }
    }
  };

  return (
    <ExtendButtonContainer
      $isRow={isRow}
      $isDragging={isDraggingRef.current}
      $isRemoveDisabled={isRemoveDisabled}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      title={isRow ? 
        (isRemoveDisabled ? "Add Rows (Remove disabled - content detected)" : "Add/Remove Rows (Shift+Click to remove)") : 
        (isRemoveDisabled ? "Add Columns (Remove disabled - content detected)" : "Add/Remove Columns (Shift+Click to remove)")
      }
    >
      <RiAddFill
        color={isRemoveDisabled ? "#999" : "#cfcfcf"}
        stroke={isRemoveDisabled ? "#999" : "#cfcfcf"}
        fill={isRemoveDisabled ? "#999" : "#cfcfcf"}
        size={18}
        data-test={"extendButton"}
      />
    </ExtendButtonContainer>
  );
};

export default ExtendButton;
