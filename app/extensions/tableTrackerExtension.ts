import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

export type TableTrackerState = {
  show: boolean;
  referencePosTable: DOMRect | null;
  tableElement: HTMLElement | null;
  widgetContainer: HTMLElement | null;
  colIndex: number | undefined;
  rowIndex: number | undefined;
};

export type TableTrackerAPI = {
  getState: () => TableTrackerState | undefined;
  onUpdate: (callback: (state: TableTrackerState) => void) => () => void;
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
      referencePosTable: null,
      tableElement: null,
      widgetContainer: null,
      colIndex: undefined,
      rowIndex: undefined,
    };

    // Bind event handlers
    this.view.dom.addEventListener("mousemove", this.mouseMoveHandler);
    this.view.dom.addEventListener("mouseleave", this.mouseLeaveHandler);
  }

  private mouseMoveHandler = (event: MouseEvent) => {
    if (!(event.target instanceof Element) || !this.view.dom.contains(event.target)) {
      return;
    }

    const target = domCellAround(event.target);

    if (!target) {
      this.hideTable();
      return;
    }

    if (!target.tbodyNode) {
      this.hideTable();
      return;
    }

    // Get table bounding rect
    const tableRect = target.tbodyNode.getBoundingClientRect();

    // Find the table element
    const tableElement = target.domNode.closest(".bn-table-block") as HTMLElement;
    if (!tableElement) {
      // Try alternative selectors for different table implementations
      const altTableElement = target.domNode.closest("table")?.closest("div") as HTMLElement;
      if (!altTableElement) {
        this.hideTable();
        return;
      }
    }

    const finalTableElement = tableElement || target.domNode.closest("table")?.closest("div") as HTMLElement;

    // Find widget container
    const widgetContainer = target.domNode
      .closest(".tableWrapper")
      ?.querySelector(".table-widgets-container") as HTMLElement;

    let colIndex: number | undefined;
    let rowIndex: number | undefined;

    if (target.type === "cell") {
      colIndex = getChildIndex(target.domNode);
      rowIndex = getChildIndex(target.domNode.parentElement!);
    }

    // Check if state has changed
    const hasChanged = 
      !this.state.show ||
      this.state.tableElement !== finalTableElement ||
      this.state.colIndex !== colIndex ||
      this.state.rowIndex !== rowIndex;

    if (hasChanged) {
      this.state = {
        show: true,
        referencePosTable: tableRect,
        tableElement: finalTableElement,
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

  private hideTable() {
    if (this.state.show) {
      this.state = {
        show: false,
        referencePosTable: null,
        tableElement: null,
        widgetContainer: null,
        colIndex: undefined,
        rowIndex: undefined,
      };
      this.emitUpdate();
    }
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
    this.view.dom.removeEventListener("mouseleave", this.mouseLeaveHandler);
    this.updateCallbacks.clear();
  }
}

export const tableTrackerPluginKey = new PluginKey("TableTracker");

type TableTrackerStorage = {
  view: TableTrackerView | undefined;
};

export const TableTrackerExtension = Extension.create<{}, TableTrackerAPI, TableTrackerStorage>({
  name: "tableTracker",

  addStorage() {
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
    };

    // Make API available on editor instance
    (this.editor as any).tableTracker = api;
  },

  onDestroy() {
    this.storage.view?.destroy();
  },
});

export default TableTrackerExtension;
