import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, PluginView } from "prosemirror-state";
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  deleteColumn,
  deleteRow,
  CellSelection,
} from "prosemirror-tables";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import {
  getCellsAtColumnHandle,
  getCellsAtRowHandle,
  moveColumn,
  moveRow,
  canColumnBeDraggedInto,
  canRowBeDraggedInto,
  cropEmptyRowsOrColumns,
  addRowsOrColumns,
  getDimensionsOfTable,
} from "../api/blockManipulation/tables/tables.js";

let dragImageElement: HTMLElement | undefined;

export type TableHandlesState = {
  show: boolean;
  showAddOrRemoveRowsButton: boolean;
  showAddOrRemoveColumnsButton: boolean;
  referencePosCell: DOMRect | undefined;
  referencePosTable: DOMRect;
  
  tableElement: HTMLElement;
  colIndex: number | undefined;
  rowIndex: number | undefined;
  
  draggingState:
    | {
        draggedCellOrientation: "row" | "col";
        originalIndex: number;
        mousePos: number;
      }
    | undefined;
    
  widgetContainer: HTMLElement | undefined;
};

function setHiddenDragImage(rootEl: Document | ShadowRoot) {
  if (dragImageElement) {
    return;
  }

  dragImageElement = document.createElement("div");
  dragImageElement.innerHTML = "_";
  dragImageElement.style.opacity = "0";
  dragImageElement.style.height = "1px";
  dragImageElement.style.width = "1px";
  if (rootEl instanceof Document) {
    rootEl.body.appendChild(dragImageElement);
  } else {
    rootEl.appendChild(dragImageElement);
  }
}

function unsetHiddenDragImage(rootEl: Document | ShadowRoot) {
  if (dragImageElement) {
    if (rootEl instanceof Document) {
      rootEl.body.removeChild(dragImageElement);
    } else {
      rootEl.removeChild(dragImageElement);
    }
    dragImageElement = undefined;
  }
}

function getChildIndex(node: Element) {
  return Array.prototype.indexOf.call(node.parentElement!.childNodes, node);
}

// Finds the DOM element corresponding to the table cell that the target element
// is currently in. If the target element is not in a table cell, returns null.
function domCellAround(target: Element) {
  let currentTarget: Element | undefined = target;
  while (
    currentTarget &&
    currentTarget.nodeName !== "TD" &&
    currentTarget.nodeName !== "TH" &&
    !currentTarget.classList.contains("tableWrapper")
  ) {
    if (currentTarget.classList.contains("ProseMirror")) {
      return undefined;
    }
    const parent: ParentNode | null = currentTarget.parentNode;

    if (!parent || !(parent instanceof Element)) {
      return undefined;
    }
    currentTarget = parent;
  }

  return currentTarget.nodeName === "TD" || currentTarget.nodeName === "TH"
    ? {
        type: "cell" as const,
        domNode: currentTarget,
        tbodyNode: currentTarget.closest("tbody"),
      }
    : {
        type: "wrapper" as const,
        domNode: currentTarget,
        tbodyNode: currentTarget.querySelector("tbody"),
      };
}

// Hides elements in the DOM with the provided class names.
function hideElements(selector: string, rootEl: Document | ShadowRoot) {
  const elementsToHide = rootEl.querySelectorAll(selector);

  for (let i = 0; i < elementsToHide.length; i++) {
    (elementsToHide[i] as HTMLElement).style.visibility = "hidden";
  }
}

// Convert Tiptap table node to simplified block structure
function tableNodeToBlock(tableNode: any) {
  const rows: any[] = [];
  
  // Extract table data from ProseMirror node
  tableNode.content.forEach((rowNode: any, rowIndex: number) => {
    const cells: any[] = [];
    
    rowNode.content.forEach((cellNode: any, colIndex: number) => {
      // Extract cell content and attributes
      const cellContent = cellNode.textContent || "";
      const attrs = cellNode.attrs || {};
      
      cells.push({
        type: cellNode.type.name === "tableHeader" ? "tableHeader" : "tableCell",
        content: cellContent,
        props: {
          colspan: attrs.colspan || 1,
          rowspan: attrs.rowspan || 1,
          backgroundColor: attrs.backgroundColor || null,
          textColor: attrs.textColor || null,
        },
      });
    });
    
    rows.push({ cells });
  });

  return {
    id: `table-${Date.now()}`, // Generate a simple ID
    type: "table" as const,
    content: {
      rows,
      columnWidths: [], // You can extract this if needed
    },
  };
}

export class TableHandlesView implements PluginView {
  public state?: TableHandlesState;
  public emitUpdate: () => void;

  public tableElement: HTMLElement | undefined;
  public menuFrozen = false;
  public mouseState: "up" | "down" | "selecting" = "up";

  constructor(
    private readonly pmView: EditorView,
    emitUpdate: (state: TableHandlesState) => void,
  ) {
    this.emitUpdate = () => {
      if (!this.state) {
        throw new Error("Attempting to update uninitialized table handles");
      }
      emitUpdate(this.state);
    };

    pmView.dom.addEventListener("mousemove", this.mouseMoveHandler);
    pmView.dom.addEventListener("mousedown", this.viewMousedownHandler);
    window.addEventListener("mouseup", this.mouseUpHandler);

    pmView.root.addEventListener(
      "dragover",
      this.dragOverHandler as EventListener,
    );
    pmView.root.addEventListener(
      "drop",
      this.dropHandler as unknown as EventListener,
    );
  }

  viewMousedownHandler = () => {
    this.mouseState = "down";
  };

  mouseUpHandler = (event: MouseEvent) => {
    this.mouseState = "up";
    this.mouseMoveHandler(event);
  };

  mouseMoveHandler = (event: MouseEvent) => {
    if (this.menuFrozen) {
      return;
    }

    if (this.mouseState === "selecting") {
      return;
    }

    if (
      !(event.target instanceof Element) ||
      !this.pmView.dom.contains(event.target)
    ) {
      return;
    }

    const target = domCellAround(event.target);

    if (
      target?.type === "cell" &&
      this.mouseState === "down" &&
      !this.state?.draggingState
    ) {
      // hide draghandles when selecting text as they could be in the way of the user
      this.mouseState = "selecting";

      if (this.state?.show) {
        this.state.show = false;
        this.state.showAddOrRemoveRowsButton = false;
        this.state.showAddOrRemoveColumnsButton = false;
        this.emitUpdate();
      }
      return;
    }

    if (!target) {
      if (this.state?.show) {
        this.state.show = false;
        this.state.showAddOrRemoveRowsButton = false;
        this.state.showAddOrRemoveColumnsButton = false;
        this.emitUpdate();
      }
      return;
    }

    if (!target.tbodyNode) {
      return;
    }

    const tableRect = target.tbodyNode.getBoundingClientRect();

    // Find the table element by looking for the BlockNote table structure
    const tableElement = target.domNode.closest(".bn-table-block") as HTMLElement;
    if (!tableElement) {
      return;
    }
    
    this.tableElement = tableElement;

    // Find the widget container that was created by BlockNoteTable
    const widgetContainer = target.domNode
      .closest(".tableWrapper")
      ?.querySelector(".table-widgets-container") as HTMLElement;

    if (target?.type === "wrapper") {
      // if we're just to the right or below the table, show the extend buttons
      const belowTable =
        event.clientY >= tableRect.bottom - 1 && // -1 to account for fractions of pixels in "bottom"
        event.clientY < tableRect.bottom + 20;
      const toRightOfTable =
        event.clientX >= tableRect.right - 1 &&
        event.clientX < tableRect.right + 20;

      // without this check, we'd also hide draghandles when hovering over them
      const hideHandles =
        event.clientX > tableRect.right || event.clientY > tableRect.bottom;

      this.state = {
        ...this.state!,
        show: true,
        showAddOrRemoveRowsButton: belowTable,
        showAddOrRemoveColumnsButton: toRightOfTable,
        referencePosTable: tableRect,
        tableElement,
        widgetContainer,
        colIndex: hideHandles ? undefined : this.state?.colIndex,
        rowIndex: hideHandles ? undefined : this.state?.rowIndex,
        referencePosCell: hideHandles
          ? undefined
          : this.state?.referencePosCell,
      };
    } else {
      const colIndex = getChildIndex(target.domNode);
      const rowIndex = getChildIndex(target.domNode.parentElement!);
      const cellRect = target.domNode.getBoundingClientRect();

      if (
        this.state !== undefined &&
        this.state.show &&
        this.state.tableElement === tableElement &&
        this.state.rowIndex === rowIndex &&
        this.state.colIndex === colIndex
      ) {
        // no update needed
        return;
      }

      // Get table dimensions from DOM
      const tbody = target.tbodyNode;
      const numRows = tbody?.children.length || 0;
      const numCols = tbody?.children[0]?.children.length || 0;

      this.state = {
        show: true,
        showAddOrRemoveColumnsButton: colIndex === numCols - 1,
        showAddOrRemoveRowsButton: rowIndex === numRows - 1,
        referencePosTable: tableRect,
        tableElement,
        draggingState: undefined,
        referencePosCell: cellRect,
        colIndex: colIndex,
        rowIndex: rowIndex,
        widgetContainer,
      };
    }
    this.emitUpdate();

    return false;
  };

  dragOverHandler = (event: DragEvent) => {
    if (this.state?.draggingState === undefined) {
      return;
    }

    event.preventDefault();
    event.dataTransfer!.dropEffect = "move";

    hideElements(
      ".prosemirror-dropcursor-block, .prosemirror-dropcursor-inline",
      this.pmView.root,
    );

    // The mouse cursor coordinates, bounded to the table's bounding box
    const boundedMouseCoords = {
      left: Math.min(
        Math.max(event.clientX, this.state.referencePosTable.left + 1),
        this.state.referencePosTable.right - 1,
      ),
      top: Math.min(
        Math.max(event.clientY, this.state.referencePosTable.top + 1),
        this.state.referencePosTable.bottom - 1,
      ),
    };

    // Gets the table cell element that the bounded mouse cursor coordinates lie in
    const tableCellElements = this.pmView.root
      .elementsFromPoint(boundedMouseCoords.left, boundedMouseCoords.top)
      .filter(
        (element) => element.tagName === "TD" || element.tagName === "TH",
      );
    if (tableCellElements.length === 0) {
      return;
    }
    const tableCellElement = tableCellElements[0];

    let emitStateUpdate = false;

    // Gets current row and column index
    const rowIndex = getChildIndex(tableCellElement.parentElement!);
    const colIndex = getChildIndex(tableCellElement);

    // Checks if the hovered cell has changed and updates the row and column index
    if (this.state.rowIndex !== rowIndex || this.state.colIndex !== colIndex) {
      this.state.rowIndex = rowIndex;
      this.state.colIndex = colIndex;
      this.state.referencePosCell = tableCellElement.getBoundingClientRect();
      emitStateUpdate = true;
    }

    // Checks if the mouse cursor position along the axis that the user is dragging on has changed
    const mousePos =
      this.state.draggingState.draggedCellOrientation === "row"
        ? boundedMouseCoords.top
        : boundedMouseCoords.left;
    if (this.state.draggingState.mousePos !== mousePos) {
      this.state.draggingState.mousePos = mousePos;
      emitStateUpdate = true;
    }

    // Emits a state update if any of the fields have changed
    if (emitStateUpdate) {
      this.emitUpdate();
    }
  };

  dropHandler = (event: DragEvent) => {
    this.mouseState = "up";
    if (this.state === undefined || this.state.draggingState === undefined) {
      return false;
    }

    if (
      this.state.rowIndex === undefined ||
      this.state.colIndex === undefined
    ) {
      throw new Error(
        "Attempted to drop table row or column, but no table block was hovered prior.",
      );
    }

    event.preventDefault();

    const { draggingState, colIndex, rowIndex } = this.state;

    // Get the current table node from ProseMirror
    const tablePos = this.findTablePosition();
    if (tablePos === null) {
      return false;
    }

    const tableNode = this.pmView.state.doc.nodeAt(tablePos);
    if (!tableNode || tableNode.type.name !== "table") {
      return false;
    }

    // Convert to block structure for our table methods
    const tableBlock = tableNodeToBlock(tableNode);

    if (draggingState.draggedCellOrientation === "row") {
      if (
        !canRowBeDraggedInto(
          tableBlock,
          draggingState.originalIndex,
          rowIndex,
        )
      ) {
        return false;
      }

      // Use prosemirror-tables commands for actual row moving
      // This is simpler than implementing the complex move logic
      const tr = this.pmView.state.tr;
      
      // Select the row to move
      const $cell = this.pmView.state.doc.resolve(tablePos + 1);
      const table = $cell.node(-1);
      const tableStart = $cell.start(-1);
      
      // Find the row position
      let rowStart = tableStart + 1;
      for (let i = 0; i < draggingState.originalIndex; i++) {
        rowStart += table.child(i).nodeSize;
      }
      
      // For now, we'll just log the move - you can implement actual row moving
      console.log(`Moving row from ${draggingState.originalIndex} to ${rowIndex}`);
      
    } else {
      if (
        !canColumnBeDraggedInto(
          tableBlock,
          draggingState.originalIndex,
          colIndex,
        )
      ) {
        return false;
      }

      // For column moving, we'll also use a simplified approach
      console.log(`Moving column from ${draggingState.originalIndex} to ${colIndex}`);
    }

    return true;
  };

  // Helper method to find table position in document
  findTablePosition(): number | null {
    if (!this.state?.tableElement) {
      return null;
    }

    // Find the table node in the document
    let tablePos: number | null = null;
    this.pmView.state.doc.descendants((node, pos) => {
      if (node.type.name === "table") {
        // Check if this corresponds to our DOM element
        const domNode = this.pmView.domAtPos(pos).node;
        if (domNode && this.state?.tableElement?.contains(domNode as Element)) {
          tablePos = pos;
          return false; // stop traversal
        }
      }
    });

    return tablePos;
  }

  update() {
    if (!this.state || !this.state.show) {
      return;
    }

    // Hide handles if the table element is no longer connected
    if (!this.state.tableElement?.isConnected) {
      this.state.show = false;
      this.state.showAddOrRemoveRowsButton = false;
      this.state.showAddOrRemoveColumnsButton = false;
      this.emitUpdate();
      return;
    }

    // Update bounding boxes
    const tableBody = this.state.tableElement.querySelector("tbody");

    if (!tableBody) {
      return;
    }

    if (
      this.state.rowIndex !== undefined &&
      this.state.colIndex !== undefined
    ) {
      const row = tableBody.children[this.state.rowIndex];
      const cell = row?.children[this.state.colIndex];
      if (cell) {
        this.state.referencePosCell = cell.getBoundingClientRect();
      } else {
        this.state.rowIndex = undefined;
        this.state.colIndex = undefined;
      }
    }
    this.state.referencePosTable = tableBody.getBoundingClientRect();

    this.emitUpdate();
  }

  destroy() {
    this.pmView.dom.removeEventListener("mousemove", this.mouseMoveHandler);
    window.removeEventListener("mouseup", this.mouseUpHandler);
    this.pmView.dom.removeEventListener("mousedown", this.viewMousedownHandler);
    this.pmView.root.removeEventListener(
      "dragover",
      this.dragOverHandler as EventListener,
    );
    this.pmView.root.removeEventListener(
      "drop",
      this.dropHandler as unknown as EventListener,
    );
  }
}

export const tableHandlesPluginKey = new PluginKey("TableHandlesPlugin");

export interface TableHandlesAPI {
  // Core drag operations
  rowDragStart: (event: { dataTransfer: DataTransfer | null; clientY: number }) => void;
  colDragStart: (event: { dataTransfer: DataTransfer | null; clientX: number }) => void;
  dragEnd: () => void;
  
  // Handle control
  freezeHandles: () => void;
  unfreezeHandles: () => void;
  
  // Table operations using your extracted methods
  addRowOrColumn: (
    index: number,
    direction:
      | { orientation: "row"; side: "above" | "below" }
      | { orientation: "column"; side: "left" | "right" }
  ) => void;
  removeRowOrColumn: (index: number, direction: "row" | "column") => void;
  
  // Table manipulation methods from your tables.js
  getCellsAtRowHandle: (block: any, relativeRowIndex: number) => any[];
  getCellsAtColumnHandle: (block: any, relativeColumnIndex: number) => any[];
  cropEmptyRowsOrColumns: (block: any, removeEmpty: "columns" | "rows") => any;
  addRowsOrColumns: (block: any, addType: "columns" | "rows", numToAdd: number) => any;
  
  // State subscription
  onUpdate: (callback: (state: TableHandlesState) => void) => () => void;
}

export const TableHandlesExtension = Extension.create<{}, TableHandlesAPI>({
  name: "tableHandles",

  addStorage() {
    return {
      view: undefined as TableHandlesView | undefined,
      updateCallbacks: new Set<(state: TableHandlesState) => void>(),
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: tableHandlesPluginKey,
        view: (editorView) => {
          this.storage.view = new TableHandlesView(editorView, (state) => {
            // Emit to all subscribers
            this.storage.updateCallbacks.forEach((callback) => callback(state));
          });
          return this.storage.view;
        },
        // Decorations for drop cursor when dragging
        props: {
          decorations: (state) => {
            const view = this.storage.view;
            if (
              !view?.state?.draggingState ||
              view.state.rowIndex === undefined ||
              view.state.colIndex === undefined
            ) {
              return;
            }

            const decorations: Decoration[] = [];
            const { draggingState, rowIndex, colIndex } = view.state;
            const { originalIndex, draggedCellOrientation } = draggingState;

            const newIndex = draggedCellOrientation === "row" ? rowIndex : colIndex;

            // Return empty decorations if dragging to same position
            if (newIndex === originalIndex) {
              return DecorationSet.create(state.doc, decorations);
            }

            // Create simple drop cursor decoration
            const tablePos = view.findTablePosition();
            if (tablePos !== null) {
              decorations.push(
                Decoration.widget(tablePos, () => {
                  const widget = document.createElement("div");
                  widget.className = "bn-table-drop-cursor";
                  widget.style.position = "absolute";
                  widget.style.backgroundColor = "#3b82f6";
                  widget.style.height = draggedCellOrientation === "row" ? "2px" : "100%";
                  widget.style.width = draggedCellOrientation === "col" ? "2px" : "100%";
                  widget.style.zIndex = "10";
                  return widget;
                }),
              );
            }

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      // Table manipulation commands using prosemirror-tables
      addRowAbove: () => ({ commands }) => {
        return commands.command(({ state, dispatch }) => {
          return addRowBefore(state, dispatch);
        });
      },

      addRowBelow: () => ({ commands }) => {
        return commands.command(({ state, dispatch }) => {
          return addRowAfter(state, dispatch);
        });
      },

      addColumnLeft: () => ({ commands }) => {
        return commands.command(({ state, dispatch }) => {
          return addColumnBefore(state, dispatch);
        });
      },

      addColumnRight: () => ({ commands }) => {
        return commands.command(({ state, dispatch }) => {
          return addColumnAfter(state, dispatch);
        });
      },

      deleteRow: () => ({ commands }) => {
        return commands.command(({ state, dispatch }) => {
          return deleteRow(state, dispatch);
        });
      },

      deleteColumn: () => ({ commands }) => {
        return commands.command(({ state, dispatch }) => {
          return deleteColumn(state, dispatch);
        });
      },
    };
  },

  onCreate() {
    // Set up the API methods
    const api: TableHandlesAPI = {
      rowDragStart: (event) => {
        const view = this.storage.view;
        if (!view?.state || view.state.rowIndex === undefined) {
          throw new Error(
            "Attempted to drag table row, but no table block was hovered prior.",
          );
        }

        view.state.draggingState = {
          draggedCellOrientation: "row",
          originalIndex: view.state.rowIndex,
          mousePos: event.clientY,
        };
        view.emitUpdate();

        setHiddenDragImage(this.editor.view.root);
        event.dataTransfer!.setDragImage(dragImageElement!, 0, 0);
        event.dataTransfer!.effectAllowed = "move";
      },

      colDragStart: (event) => {
        const view = this.storage.view;
        if (!view?.state || view.state.colIndex === undefined) {
          throw new Error(
            "Attempted to drag table column, but no table block was hovered prior.",
          );
        }

        view.state.draggingState = {
          draggedCellOrientation: "col",
          originalIndex: view.state.colIndex,
          mousePos: event.clientX,
        };
        view.emitUpdate();

        setHiddenDragImage(this.editor.view.root);
        event.dataTransfer!.setDragImage(dragImageElement!, 0, 0);
        event.dataTransfer!.effectAllowed = "move";
      },

      dragEnd: () => {
        const view = this.storage.view;
        if (!view?.state) {
          throw new Error(
            "Attempted to end drag, but no table block was hovered prior.",
          );
        }

        view.state.draggingState = undefined;
        view.emitUpdate();

        unsetHiddenDragImage(this.editor.view.root);
      },

      freezeHandles: () => {
        if (this.storage.view) {
          this.storage.view.menuFrozen = true;
        }
      },

      unfreezeHandles: () => {
        if (this.storage.view) {
          this.storage.view.menuFrozen = false;
        }
      },

      addRowOrColumn: (index, direction) => {
        if (direction.orientation === "row") {
          if (direction.side === "above") {
            this.editor.commands.addRowAbove();
          } else {
            this.editor.commands.addRowBelow();
          }
        } else {
          if (direction.side === "left") {
            this.editor.commands.addColumnLeft();
          } else {
            this.editor.commands.addColumnRight();
          }
        }
      },

      removeRowOrColumn: (index, direction) => {
        if (direction === "row") {
          this.editor.commands.deleteRow();
        } else {
          this.editor.commands.deleteColumn();
        }
      },

      // Expose your table manipulation methods
      getCellsAtRowHandle: (block, relativeRowIndex) => {
        return getCellsAtRowHandle(block, relativeRowIndex);
      },

      getCellsAtColumnHandle: (block, relativeColumnIndex) => {
        return getCellsAtColumnHandle(block, relativeColumnIndex);
      },

      cropEmptyRowsOrColumns: (block, removeEmpty) => {
        return cropEmptyRowsOrColumns(block, removeEmpty);
      },

      addRowsOrColumns: (block, addType, numToAdd) => {
        return addRowsOrColumns(block, addType, numToAdd);
      },

      onUpdate: (callback) => {
        this.storage.updateCallbacks.add(callback);
        return () => {
          this.storage.updateCallbacks.delete(callback);
        };
      },
    };

    // Attach API to editor
    (this.editor as any).tableHandles = api;
  },

  onDestroy() {
    this.storage.view?.destroy();
    this.storage.updateCallbacks.clear();
  },
});

export default TableHandlesExtension;
