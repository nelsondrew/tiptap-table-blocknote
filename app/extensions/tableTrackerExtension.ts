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
};

export type TableTrackerAPI = {
  getState: () => TableTrackerState | undefined;
  onUpdate: (callback: (state: TableTrackerState) => void) => () => void;
  freezeHandles: () => void;
  unfreezeHandles: () => void;
};

// Helper function to get child index
function getChildIndex(node: Element): number {
  return Array.prototype.indexOf.call(node.parentElement!.childNodes, node);
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
        tbodyNode: currentTarget.closest("tbody"),
      }
    : {
        type: "wrapper" as const,
        domNode: currentTarget,
        tbodyNode: currentTarget.querySelector("tbody"),
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

    // Get table and cell bounding rects
    const tableRect = target.tbodyNode.getBoundingClientRect();
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
      colIndex = getChildIndex(target.domNode);
      rowIndex = getChildIndex(target.domNode.parentElement!);
      
      // Determine if this is the last row/column (for add/remove buttons)
      const tbody = target.tbodyNode;
      const numRows = tbody?.children.length || 0;
      const numCols = tbody?.children[0]?.children.length || 0;
      
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

      this.emitUpdate();
    }
  };

  private mouseLeaveHandler = () => {
    this.hideTable();
  };

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
      const tableBody = this.state.tableElement.querySelector("tbody");
      if (tableBody) {
        this.state.referencePosTable = tableBody.getBoundingClientRect();
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
    };

    // Make API available on editor instance
    (this.editor as any).tableTracker = api;
  },

  onDestroy() {
    this.storage.view?.destroy();
  },
});

export default TableTrackerExtension;
