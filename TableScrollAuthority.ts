import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

export type TableScrollAuthorityState = {
  tables: Map<string, {
    scrollLeft: number;
    activeAuthorityRowId: string | null;
    candidateRows: Set<string>;
    lastActiveTimestamp: number;
    subscribers: Set<(scrollLeft: number, fromRowId?: string) => void>;
  }>;
};

export type TableScrollAuthorityAPI = {
  registerTable: (tableId: string) => void;
  registerCandidate: (tableId: string, rowId: string) => void;
  removeCandidate: (tableId: string, rowId: string) => void;
  claimAuthority: (tableId: string, rowId: string) => void;
  updateScroll: (tableId: string, scrollLeft: number, fromRowId: string) => void;
  getScrollPosition: (tableId: string) => number;
  onUpdate: (tableId: string, callback: (scrollLeft: number, fromRowId?: string) => void) => () => void;
  getAuthorityInfo: (tableId: string) => { activeAuthority: string | null; candidates: string[] } | null;
};

class TableScrollAuthorityView {
  private state: TableScrollAuthorityState;

  constructor(private view: EditorView) {
    this.state = {
      tables: new Map()
    };
  }

  public registerTable(tableId: string) {
    if (!this.state.tables.has(tableId)) {
      this.state.tables.set(tableId, {
        scrollLeft: 0,
        activeAuthorityRowId: null,
        candidateRows: new Set(),
        lastActiveTimestamp: 0,
        subscribers: new Set()
      });
    }
  }

  public registerCandidate(tableId: string, rowId: string) {
    let tableState = this.state.tables.get(tableId);
    if (!tableState) {
      this.registerTable(tableId);
      tableState = this.state.tables.get(tableId)!;
    }

    tableState.candidateRows.add(rowId);
  }

  public removeCandidate(tableId: string, rowId: string) {
    const tableState = this.state.tables.get(tableId);
    if (!tableState) return;

    tableState.candidateRows.delete(rowId);

    // If this was the active authority, clear it
    if (tableState.activeAuthorityRowId === rowId) {
      tableState.activeAuthorityRowId = null;
    }
  }

  public claimAuthority(tableId: string, rowId: string) {
    const tableState = this.state.tables.get(tableId);
    if (!tableState) return;

    // Only allow candidates to claim authority
    if (!tableState.candidateRows.has(rowId)) {
      return;
    }

    tableState.activeAuthorityRowId = rowId;
    tableState.lastActiveTimestamp = Date.now();
  }

  public updateScroll(tableId: string, scrollLeft: number, fromRowId: string) {
    const tableState = this.state.tables.get(tableId);
    if (!tableState) return;

    // Fast authority check - only candidates can update
    if (!tableState.candidateRows.has(fromRowId)) {
      return;
    }

    // Immediate authority claim for active scrolling
    tableState.activeAuthorityRowId = fromRowId;
    tableState.lastActiveTimestamp = Date.now();

    // Update state immediately - no threshold check for maximum responsiveness
    tableState.scrollLeft = scrollLeft;

    // Immediate synchronous notification for fastest possible updates
    tableState.subscribers.forEach(callback => {
      try {
        callback(scrollLeft, fromRowId);
      } catch (e) {
        console.warn('Table scroll authority listener error:', e);
      }
    });
  }

  public getScrollPosition(tableId: string): number {
    return this.state.tables.get(tableId)?.scrollLeft ?? 0;
  }

  public onUpdate(tableId: string, callback: (scrollLeft: number, fromRowId?: string) => void): () => void {
    let tableState = this.state.tables.get(tableId);
    if (!tableState) {
      this.registerTable(tableId);
      tableState = this.state.tables.get(tableId)!;
    }

    tableState.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      const currentTableState = this.state.tables.get(tableId);
      if (currentTableState) {
        currentTableState.subscribers.delete(callback);
      }
    };
  }

  public getAuthorityInfo(tableId: string): { activeAuthority: string | null; candidates: string[] } | null {
    const tableState = this.state.tables.get(tableId);
    if (!tableState) return null;

    return {
      activeAuthority: tableState.activeAuthorityRowId,
      candidates: Array.from(tableState.candidateRows)
    };
  }

  public getState(): TableScrollAuthorityState {
    return this.state;
  }

  public destroy() {
    // Clean up all subscribers
    this.state.tables.forEach(tableState => {
      tableState.subscribers.clear();
      tableState.candidateRows.clear();
    });
    this.state.tables.clear();
  }
}

export const tableScrollAuthorityPluginKey = new PluginKey("TableScrollAuthority");

type TableScrollAuthorityStorage = {
  view: TableScrollAuthorityView | undefined;
};

export const TableScrollAuthorityExtension = Extension.create<{}>({
  name: "tableScrollAuthority",

  addStorage(): TableScrollAuthorityStorage {
    return {
      view: undefined,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: tableScrollAuthorityPluginKey,
        view: (editorView) => {
          this.storage.view = new TableScrollAuthorityView(editorView);
          return this.storage.view;
        },
      }),
    ];
  },

  onCreate() {
    // Attach API methods to editor
    const api: TableScrollAuthorityAPI = {
      registerTable: (tableId: string) => {
        this.storage.view?.registerTable(tableId);
      },

      registerCandidate: (tableId: string, rowId: string) => {
        this.storage.view?.registerCandidate(tableId, rowId);
      },

      removeCandidate: (tableId: string, rowId: string) => {
        this.storage.view?.removeCandidate(tableId, rowId);
      },

      claimAuthority: (tableId: string, rowId: string) => {
        this.storage.view?.claimAuthority(tableId, rowId);
      },

      updateScroll: (tableId: string, scrollLeft: number, fromRowId: string) => {
        this.storage.view?.updateScroll(tableId, scrollLeft, fromRowId);
      },

      getScrollPosition: (tableId: string) => {
        return this.storage.view?.getScrollPosition(tableId) ?? 0;
      },

      onUpdate: (tableId: string, callback: (scrollLeft: number, fromRowId?: string) => void) => {
        if (!this.storage.view) {
          return () => {}; // Return no-op cleanup
        }
        return this.storage.view.onUpdate(tableId, callback);
      },

      getAuthorityInfo: (tableId: string) => {
        return this.storage.view?.getAuthorityInfo(tableId) ?? null;
      },
    };

    // Make API available on editor instance
    (this.editor as any).tableScrollAuthority = api;
  },

  onDestroy() {
    this.storage.view?.destroy();
  },
});

export default TableScrollAuthorityExtension;