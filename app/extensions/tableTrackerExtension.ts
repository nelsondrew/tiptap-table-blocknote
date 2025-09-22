import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

export type TableTrackerState = {
  show: boolean;
  showAddOrRemoveRowsButton: boolean;
  showAddOrRemoveColumnsButton: boolean;
  referencePosTable: DOMRect | null;
  referencePosCell: DOMRect | null;
  tableElement: HTMLElement | null;
  widgetContainer: HTMLElement | null;
  colIndex: number | undefined;
  rowIndex: number | undefined;
  mouseState: "up" | "down" | "selecting";
  menuFrozen: boolean;
  draggingState?: {
    draggedCellOrientation: "row" | "column";
    originalIndex: number;
    mousePos: number;
  };
};

export type TableTrackerAPI = {
  getState: () => TableTrackerState | undefined;
  onUpdate: (callback: (state: TableTrackerState) => void) => () => void;
  freezeHandles: () => void;
  unfreezeHandles: () => void;
  rowDragStart: (event: { clientY: number }) => void;
  colDragStart: (event: { clientX: number }) => void;
  dragEnd: () => void;
};

// Helper function to get child index - handles table structure with wrappers
function getChildIndex(node: Element): number {
  console.log(`🔍 getChildIndex - Starting with node:`, node.tagName, node);

  if (node.tagName === 'TD' || node.tagName === 'TH') {
    // For table cells, get index within the row
    const siblings = Array.from(node.parentElement!.children);
    const index = siblings.indexOf(node);
    console.log(`🔍 getChildIndex - Cell index in row:`, index, `Siblings:`, siblings.map(s => s.tagName));
    return index;
  } else if (node.tagName === 'TR') {
    // For table rows, we need to find the row wrapper's position in tbody
    const rowWrapper = node.closest('.table-row-wrapper') || node.parentElement;
    if (rowWrapper && rowWrapper.tagName !== 'TBODY') {
      // Row is wrapped, find wrapper's index in tbody
      const tbody = rowWrapper.parentElement;
      if (tbody) {
        const rowWrappers = Array.from(tbody.children);
        const index = rowWrappers.indexOf(rowWrapper);
        console.log(`🔍 getChildIndex - Row wrapper index in tbody:`, index, `Row wrappers:`, rowWrappers.map(w => w.className || w.tagName));
        return index;
      }
    } else {
      // Row is direct child of tbody
      const tbody = node.parentElement!;
      const rows = Array.from(tbody.children);
      const index = rows.indexOf(node);
      console.log(`🔍 getChildIndex - Direct row index in tbody:`, index, `Rows:`, rows.map(r => r.tagName));
      return index;
    }
  }

  // Fallback to original logic
  const siblings = Array.from(node.parentElement!.children);
  const index = siblings.indexOf(node);
  console.log(`🔍 getChildIndex - Fallback index:`, index, `Siblings:`, siblings.map(s => s.tagName));
  return index;
}

// Finds the DOM element corresponding to the table cell that the target element is in
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
        tbodyNode: currentTarget.closest("tbody") || currentTarget.closest("table"), // Fallback to table if no tbody
      }
    : {
        type: "wrapper" as const,
        domNode: currentTarget,
        tbodyNode: currentTarget.querySelector("tbody") || currentTarget.querySelector("table"), // Fallback to table if no tbody
      };
}

class TableTrackerView {
  public state: TableTrackerState;
  private updateCallbacks = new Set<(state: TableTrackerState) => void>();

  constructor(private view: EditorView) {
    this.state = {
      show: false,
      showAddOrRemoveRowsButton: false,
      showAddOrRemoveColumnsButton: false,
      referencePosTable: null,
      referencePosCell: null,
      tableElement: null,
      widgetContainer: null,
      colIndex: undefined,
      rowIndex: undefined,
      mouseState: "up",
      menuFrozen: false,
    };

    // Bind event handlers - following BlockNote's pattern
    this.view.dom.addEventListener("mousemove", this.mouseMoveHandler);
    this.view.dom.addEventListener("mousedown", this.mouseDownHandler);
    this.view.dom.addEventListener("mouseleave", this.mouseLeaveHandler);
    window.addEventListener("mouseup", this.mouseUpHandler);
    
    // Add drag and drop handlers at the root level (BlockNote style)
    this.view.root.addEventListener("dragover", this.dragOverHandler as EventListener);
    this.view.root.addEventListener("drop", this.dropHandler as EventListener);
  }

  private mouseDownHandler = () => {
    this.state.mouseState = "down";
  };

  private mouseUpHandler = (event: MouseEvent) => {
    this.state.mouseState = "up";
    this.mouseMoveHandler(event);
  };

  private mouseMoveHandler = (event: MouseEvent) => {
    // Skip if menu is frozen (during operations)
    if (this.state.menuFrozen) {
      return;
    }

    // Skip if user is selecting text
    if (this.state.mouseState === "selecting") {
      return;
    }

    if (!(event.target instanceof Element) || !this.view.dom.contains(event.target)) {
      return;
    }

    const target = domCellAround(event.target);

    // Handle mouse down in cell - indicates text selection
    if (target?.type === "cell" && this.state.mouseState === "down") {
      this.state.mouseState = "selecting";
      if (this.state.show) {
        this.hideTable();
      }
      return;
    }

    if (!target?.tbodyNode) {
      this.hideTable();
      return;
    }

    // Calculate table bounds from all tr elements (since table has display: contents)
    const tableRect = this.calculateTableBounds(target.tbodyNode);
    const cellRect = target.type === "cell" ? target.domNode.getBoundingClientRect() : null;

    // Find the table element - try multiple selectors for compatibility
    const tableElement = this.findTableElement(target.domNode);
    if (!tableElement) {
      this.hideTable();
      return;
    }

    // Find widget container
    const widgetContainer = target.domNode
      .closest(".tableWrapper")
      ?.querySelector(".table-widgets-container") as HTMLElement;

    let colIndex: number | undefined;
    let rowIndex: number | undefined;
    let showAddOrRemoveRowsButton = false;
    let showAddOrRemoveColumnsButton = false;

    if (target.type === "cell") {
      console.log(`📍 CELL TRACKING - Target cell:`, target.domNode);
      console.log(`📍 CELL TRACKING - Cell parent (TR):`, target.domNode.parentElement);
      console.log(`📍 CELL TRACKING - TBody:`, target.tbodyNode);

      colIndex = getChildIndex(target.domNode);
      rowIndex = getChildIndex(target.domNode.parentElement!);

      console.log(`📍 CELL TRACKING - Calculated colIndex: ${colIndex}, rowIndex: ${rowIndex}`);

      // Determine if this is the last row/column (for add/remove buttons)
      const tbody = target.tbodyNode;
      const numRows = tbody?.children.length || 0;
      const numCols = tbody?.children[0]?.children.length || 0;

      console.log(`📍 CELL TRACKING - Total rows: ${numRows}, Total cols: ${numCols}`);

      // Show buttons for any cell in the last row or last column
      showAddOrRemoveRowsButton = rowIndex === numRows - 1;
      showAddOrRemoveColumnsButton = colIndex === numCols - 1;
      
      // Also check if we're near the table edges (with buffer zone)
      const BUFFER_ZONE = 30; // 30px buffer zone
      const nearBottomEdge = event.clientY >= tableRect.bottom - BUFFER_ZONE && event.clientY <= tableRect.bottom + BUFFER_ZONE;
      const nearRightEdge = event.clientX >= tableRect.right - BUFFER_ZONE && event.clientX <= tableRect.right + BUFFER_ZONE;
      
      // Show buttons if in last row/col OR near edges
      if (nearBottomEdge) showAddOrRemoveRowsButton = true;
      if (nearRightEdge) showAddOrRemoveColumnsButton = true;
      
    } else if (target.type === "wrapper") {
      // Handle hovering near table edges for extend buttons with larger buffer
      const BUFFER_ZONE = 40; // Larger buffer for wrapper area
      const belowTable = event.clientY >= tableRect.bottom - 5 && event.clientY <= tableRect.bottom + BUFFER_ZONE;
      const toRightOfTable = event.clientX >= tableRect.right - 5 && event.clientX <= tableRect.right + BUFFER_ZONE;
      
      showAddOrRemoveRowsButton = belowTable;
      showAddOrRemoveColumnsButton = toRightOfTable;
      
      // Only hide handles when significantly outside table area
      const HIDE_BUFFER = 50;
      const hideHandles = event.clientX > tableRect.right + HIDE_BUFFER || event.clientY > tableRect.bottom + HIDE_BUFFER;
      if (hideHandles) {
        colIndex = undefined;
        rowIndex = undefined;
      } else {
        // When hovering near edges, simulate last cell position for handles
        const tbody = target.tbodyNode;
        const numRows = tbody?.children.length || 0;
        const numCols = tbody?.children[0]?.children.length || 0;
        
        if (belowTable) {
          rowIndex = numRows - 1;
          // Find which column we're closest to
          const tableLeft = tableRect.left;
          const tableWidth = tableRect.width;
          const relativeX = (event.clientX - tableLeft) / tableWidth;
          colIndex = Math.min(Math.floor(relativeX * numCols), numCols - 1);
        }
        
        if (toRightOfTable) {
          colIndex = numCols - 1;
          // Find which row we're closest to  
          const tableTop = tableRect.top;
          const tableHeight = tableRect.height;
          const relativeY = (event.clientY - tableTop) / tableHeight;
          rowIndex = Math.min(Math.floor(relativeY * numRows), numRows - 1);
        }
      }
    }

    // Check if state has changed
    const hasChanged =
      !this.state.show ||
      this.state.tableElement !== tableElement ||
      this.state.colIndex !== colIndex ||
      this.state.rowIndex !== rowIndex ||
      this.state.showAddOrRemoveRowsButton !== showAddOrRemoveRowsButton ||
      this.state.showAddOrRemoveColumnsButton !== showAddOrRemoveColumnsButton;

    if (hasChanged) {
      console.log(`🔄 STATE UPDATE - Setting state.rowIndex to ${rowIndex}, state.colIndex to ${colIndex}`);

      this.state = {
        ...this.state,
        show: true,
        showAddOrRemoveRowsButton,
        showAddOrRemoveColumnsButton,
        referencePosTable: tableRect,
        referencePosCell: cellRect,
        tableElement,
        widgetContainer: widgetContainer || null,
        colIndex,
        rowIndex,
      };

      console.log(`🔄 STATE UPDATE - Final state.rowIndex: ${this.state.rowIndex}, state.colIndex: ${this.state.colIndex}`);
      this.emitUpdate();
    }
  };

  private mouseLeaveHandler = () => {
    this.hideTable();
  };

  private dragOverHandler = (event: DragEvent) => {
    if (this.state.draggingState === undefined) {
      return;
    }

    event.preventDefault();
    event.dataTransfer!.dropEffect = "move";

    console.log("🎯 DRAG OVER - Global handler");

    // Get the bounded mouse coordinates within the table
    const tableRect = this.state.referencePosTable;
    if (!tableRect) return;

    const boundedMouseCoords = {
      left: Math.min(
        Math.max(event.clientX, tableRect.left + 1),
        tableRect.right - 1,
      ),
      top: Math.min(
        Math.max(event.clientY, tableRect.top + 1),
        tableRect.bottom - 1,
      ),
    };

    // Find the table cell under the mouse
    const elements = this.view.root.elementsFromPoint 
      ? this.view.root.elementsFromPoint(boundedMouseCoords.left, boundedMouseCoords.top)
      : document.elementsFromPoint(boundedMouseCoords.left, boundedMouseCoords.top);
    
    const tableCellElements = elements.filter(
      (element) => element.tagName === "TD" || element.tagName === "TH",
    );
    
    if (tableCellElements.length === 0) {
      return;
    }
    const tableCellElement = tableCellElements[0];

    const rowIndex = getChildIndex(tableCellElement.parentElement!);
    const colIndex = getChildIndex(tableCellElement);

    // Update state if hovering over different cell
    if (this.state.rowIndex !== rowIndex || this.state.colIndex !== colIndex) {
      this.state.rowIndex = rowIndex;
      this.state.colIndex = colIndex;
      this.state.referencePosCell = tableCellElement.getBoundingClientRect();

      console.log(`🎯 Dragging over ${this.state.draggingState.draggedCellOrientation} ${colIndex}, ${rowIndex}`);
      this.emitUpdate();
    }

    // Update mouse position
    const mousePos =
      this.state.draggingState.draggedCellOrientation === "row"
        ? boundedMouseCoords.top
        : boundedMouseCoords.left;
        
    if (this.state.draggingState.mousePos !== mousePos) {
      this.state.draggingState.mousePos = mousePos;
      this.emitUpdate();
    }
  };

  private dropHandler = (event: Event) => {
    const dragEvent = event as DragEvent;
    if (this.state.draggingState === undefined) {
      return false;
    }

    dragEvent.preventDefault();
    
    const { draggingState, colIndex, rowIndex } = this.state;
    const fromIndex = draggingState.originalIndex;
    const toIndex = draggingState.draggedCellOrientation === "row" ? rowIndex : colIndex;
    

    // Don't move if dropping on same position
    if (fromIndex === toIndex || toIndex === undefined) {
      return true;
    }

    // Perform the actual table manipulation
    this.moveTableElement(draggingState.draggedCellOrientation, fromIndex, toIndex);

    return true;
  };

  private moveTableElement(orientation: "row" | "column", fromIndex: number, toIndex: number) {
    if (!this.state.tableElement) {
      return;
    }

    // Find the table node in the ProseMirror document
    const tableNode = this.findTableNode();
    if (!tableNode) {
      return;
    }

    if (orientation === "row") {
      this.moveRowInTable(tableNode.pos, fromIndex, toIndex);
    } else {
      this.moveColumnInTable(tableNode.pos, fromIndex, toIndex);
    }
  }

  private findTableNode(): { node: any; pos: number } | null {
    const { state } = this.view;
    let tableNode: { node: any; pos: number } | null = null;

    state.doc.descendants((node, pos) => {
      if (node.type.name === 'table') {
        tableNode = { node, pos };
        return false; // Stop iteration
      }
    });

    return tableNode;
  }

  private moveRowInTable(tablePos: number, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;

    const { state } = this.view;
    const { tr } = state;
    const tableNode = state.doc.nodeAt(tablePos);
    
    if (!tableNode || tableNode.type.name !== 'table') {
      return;
    }

    // Get the rows from the table content 
    const rows: any[] = [];
    tableNode.content.forEach((child: any) => {
      if (child.type.name === 'tableRow') {
        rows.push(child);
      }
    });

    if (fromIndex >= rows.length || toIndex >= rows.length) {
      return;
    }

    // Use BlockNote's array manipulation: splice out, then splice in
    const [sourceRow] = rows.splice(fromIndex, 1);
    rows.splice(toIndex, 0, sourceRow);

    // Create new table node with reordered rows
    const newTableNode = tableNode.type.create(
      tableNode.attrs,
      rows
    );

    // Replace the table in the document
    tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTableNode);
    this.view.dispatch(tr);
  }

  private moveColumnInTable(tablePos: number, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;

    const { state } = this.view;
    const { tr } = state;
    const tableNode = state.doc.nodeAt(tablePos);
    
    if (!tableNode || tableNode.type.name !== 'table') {
      return;
    }

    // Get all rows and move cells in each row
    const newRows: any[] = [];
    tableNode.content.forEach((rowNode: any) => {
      if (rowNode.type.name === 'tableRow') {
        const cells: any[] = [];
        rowNode.content.forEach((cellNode: any) => {
          if (cellNode.type.name === 'tableCell' || cellNode.type.name === 'tableHeader') {
            cells.push(cellNode);
          }
        });

        if (fromIndex < cells.length && toIndex < cells.length) {
          // Use BlockNote's array manipulation: splice out, then splice in
          const [sourceCell] = cells.splice(fromIndex, 1);
          cells.splice(toIndex, 0, sourceCell);
        }

        // Create new row with reordered cells
        const newRow = rowNode.type.create(rowNode.attrs, cells);
        newRows.push(newRow);
      }
    });

    // Create new table node with reordered content
    const newTableNode = tableNode.type.create(
      tableNode.attrs,
      newRows
    );

    // Replace the table in the document
    tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTableNode);
    this.view.dispatch(tr);
  }

  public rowDragStart = (event: { clientY: number }) => {
    if (this.state.rowIndex === undefined) {
      throw new Error("Attempted to drag table row, but no table block was hovered prior.");
    }

    console.log("🚀 ROW DRAG START - Global handler");
    
    this.state.draggingState = {
      draggedCellOrientation: "row",
      originalIndex: this.state.rowIndex,
      mousePos: event.clientY,
    };
    this.emitUpdate();
  };

  public colDragStart = (event: { clientX: number }) => {
    if (this.state.colIndex === undefined) {
      throw new Error("Attempted to drag table column, but no table block was hovered prior.");
    }

    console.log("🚀 COLUMN DRAG START - Global handler");
    
    this.state.draggingState = {
      draggedCellOrientation: "column",
      originalIndex: this.state.colIndex,
      mousePos: event.clientX,
    };
    this.emitUpdate();
  };

  public dragEnd = () => {
    console.log("🏁 DRAG END - Global handler");
    
    this.state.draggingState = undefined;
    this.emitUpdate();
  };

  private calculateTableBounds(tableContainer: Element): DOMRect {
    // Get all tr elements within the table container
    const rows = Array.from(tableContainer.querySelectorAll('tr'));

    if (rows.length === 0) {
      // Fallback to container bounds if no rows found
      return tableContainer.getBoundingClientRect();
    }

    // Calculate combined bounds from all rows
    let minTop = Infinity;
    let maxBottom = -Infinity;
    let minLeft = Infinity;
    let maxRight = -Infinity;

    rows.forEach(row => {
      const rect = row.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) { // Only consider visible rows
        minTop = Math.min(minTop, rect.top);
        maxBottom = Math.max(maxBottom, rect.bottom);
        minLeft = Math.min(minLeft, rect.left);
        maxRight = Math.max(maxRight, rect.right);
      }
    });

    // If no visible rows found, fallback to container
    if (minTop === Infinity) {
      return tableContainer.getBoundingClientRect();
    }

    // Create a DOMRect-like object with calculated bounds
    const width = maxRight - minLeft;
    const height = maxBottom - minTop;

    return {
      top: minTop,
      bottom: maxBottom,
      left: minLeft,
      right: maxRight,
      width: width,
      height: height,
      x: minLeft,
      y: minTop,
      toJSON: () => ({
        top: minTop,
        bottom: maxBottom,
        left: minLeft,
        right: maxRight,
        width: width,
        height: height,
        x: minLeft,
        y: minTop
      })
    } as DOMRect;
  }

  private findTableElement(domNode: Element): HTMLElement | null {
    // Try multiple selectors for different table implementations
    const selectors = [
      ".bn-table-block",
      ".tableWrapper",
      "[data-type='table']",
    ];

    for (const selector of selectors) {
      const element = domNode.closest(selector) as HTMLElement;
      if (element) return element;
    }

    // Fallback: find table and get its wrapper
    const table = domNode.closest("table");
    return table?.closest("div") as HTMLElement || null;
  }

  private hideTable() {
    if (this.state.show) {
      this.state = {
        ...this.state,
        show: false,
        showAddOrRemoveRowsButton: false,
        showAddOrRemoveColumnsButton: false,
        referencePosTable: null,
        referencePosCell: null,
        tableElement: null,
        widgetContainer: null,
        colIndex: undefined,
        rowIndex: undefined,
      };
      this.emitUpdate();
    }
  }

  public freezeHandles() {
    this.state.menuFrozen = true;
  }

  public unfreezeHandles() {
    this.state.menuFrozen = false;
  }

  private emitUpdate() {
    this.updateCallbacks.forEach((callback) => callback(this.state));
  }

  public onUpdate(callback: (state: TableTrackerState) => void) {
    this.updateCallbacks.add(callback);
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  public getState(): TableTrackerState {
    return this.state;
  }

  public update() {
    // Update bounding boxes if table is still visible and connected
    if (this.state.show && this.state.tableElement?.isConnected) {
      const tableBody = this.state.tableElement.querySelector("tbody") || this.state.tableElement.querySelector("table");
      if (tableBody) {
        // Use calculated bounds from tr elements instead of display: contents table
        const calculatedRect = this.calculateTableBounds(tableBody);
        this.state.referencePosTable = calculatedRect;
        this.emitUpdate();
      } else {
        this.hideTable();
      }
    }
  }

  public destroy() {
    this.view.dom.removeEventListener("mousemove", this.mouseMoveHandler);
    this.view.dom.removeEventListener("mousedown", this.mouseDownHandler);
    this.view.dom.removeEventListener("mouseleave", this.mouseLeaveHandler);
    window.removeEventListener("mouseup", this.mouseUpHandler);
    this.view.root.removeEventListener("dragover", this.dragOverHandler as EventListener);
    this.view.root.removeEventListener("drop", this.dropHandler as EventListener);
    this.updateCallbacks.clear();
  }
}

export const tableTrackerPluginKey = new PluginKey("TableTracker");

type TableTrackerStorage = {
  view: TableTrackerView | undefined;
};

export const TableTrackerExtension = Extension.create<{}>({
  name: "tableTracker",

  addStorage(): TableTrackerStorage {
    return {
      view: undefined,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: tableTrackerPluginKey,
        view: (editorView) => {
          this.storage.view = new TableTrackerView(editorView);
          return this.storage.view;
        },
      }),
    ];
  },

  onCreate() {
    // Attach API methods to editor
    const api: TableTrackerAPI = {
      getState: () => {
        return this.storage.view?.getState();
      },

      onUpdate: (callback) => {
        if (!this.storage.view) {
          throw new Error("TableTracker view not initialized");
        }
        return this.storage.view.onUpdate(callback);
      },

      freezeHandles: () => {
        this.storage.view?.freezeHandles();
      },

      unfreezeHandles: () => {
        this.storage.view?.unfreezeHandles();
      },

      rowDragStart: (event: { clientY: number }) => {
        this.storage.view?.rowDragStart(event);
      },

      colDragStart: (event: { clientX: number }) => {
        this.storage.view?.colDragStart(event);
      },

      dragEnd: () => {
        this.storage.view?.dragEnd();
      },
    };

    // Make API available on editor instance
    (this.editor as any).tableTracker = api;
  },

  onDestroy() {
    this.storage.view?.destroy();
  },
});

export default TableTrackerExtension;
