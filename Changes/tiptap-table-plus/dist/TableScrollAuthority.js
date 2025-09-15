import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
class TableScrollAuthorityView {
    constructor(view) {
        this.view = view;
        this.state = {
            tables: new Map()
        };
    }
    registerTable(tableId) {
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
    registerCandidate(tableId, rowId) {
        let tableState = this.state.tables.get(tableId);
        if (!tableState) {
            this.registerTable(tableId);
            tableState = this.state.tables.get(tableId);
        }
        tableState.candidateRows.add(rowId);
    }
    removeCandidate(tableId, rowId) {
        const tableState = this.state.tables.get(tableId);
        if (!tableState)
            return;
        tableState.candidateRows.delete(rowId);
        // If this was the active authority, clear it
        if (tableState.activeAuthorityRowId === rowId) {
            tableState.activeAuthorityRowId = null;
        }
    }
    claimAuthority(tableId, rowId) {
        const tableState = this.state.tables.get(tableId);
        if (!tableState)
            return;
        // Only allow candidates to claim authority
        if (!tableState.candidateRows.has(rowId)) {
            return;
        }
        tableState.activeAuthorityRowId = rowId;
        tableState.lastActiveTimestamp = Date.now();
    }
    updateScroll(tableId, scrollLeft, fromRowId) {
        const tableState = this.state.tables.get(tableId);
        if (!tableState)
            return;
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
            }
            catch (e) {
                console.warn('Table scroll authority listener error:', e);
            }
        });
    }
    getScrollPosition(tableId) {
        var _a, _b;
        return (_b = (_a = this.state.tables.get(tableId)) === null || _a === void 0 ? void 0 : _a.scrollLeft) !== null && _b !== void 0 ? _b : 0;
    }
    onUpdate(tableId, callback) {
        let tableState = this.state.tables.get(tableId);
        if (!tableState) {
            this.registerTable(tableId);
            tableState = this.state.tables.get(tableId);
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
    getAuthorityInfo(tableId) {
        const tableState = this.state.tables.get(tableId);
        if (!tableState)
            return null;
        return {
            activeAuthority: tableState.activeAuthorityRowId,
            candidates: Array.from(tableState.candidateRows)
        };
    }
    getState() {
        return this.state;
    }
    destroy() {
        // Clean up all subscribers
        this.state.tables.forEach(tableState => {
            tableState.subscribers.clear();
            tableState.candidateRows.clear();
        });
        this.state.tables.clear();
    }
}
export const tableScrollAuthorityPluginKey = new PluginKey("TableScrollAuthority");
export const TableScrollAuthorityExtension = Extension.create({
    name: "tableScrollAuthority",
    addStorage() {
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
        const api = {
            registerTable: (tableId) => {
                var _a;
                (_a = this.storage.view) === null || _a === void 0 ? void 0 : _a.registerTable(tableId);
            },
            registerCandidate: (tableId, rowId) => {
                var _a;
                (_a = this.storage.view) === null || _a === void 0 ? void 0 : _a.registerCandidate(tableId, rowId);
            },
            removeCandidate: (tableId, rowId) => {
                var _a;
                (_a = this.storage.view) === null || _a === void 0 ? void 0 : _a.removeCandidate(tableId, rowId);
            },
            claimAuthority: (tableId, rowId) => {
                var _a;
                (_a = this.storage.view) === null || _a === void 0 ? void 0 : _a.claimAuthority(tableId, rowId);
            },
            updateScroll: (tableId, scrollLeft, fromRowId) => {
                var _a;
                (_a = this.storage.view) === null || _a === void 0 ? void 0 : _a.updateScroll(tableId, scrollLeft, fromRowId);
            },
            getScrollPosition: (tableId) => {
                var _a, _b;
                return (_b = (_a = this.storage.view) === null || _a === void 0 ? void 0 : _a.getScrollPosition(tableId)) !== null && _b !== void 0 ? _b : 0;
            },
            onUpdate: (tableId, callback) => {
                if (!this.storage.view) {
                    return () => { }; // Return no-op cleanup
                }
                return this.storage.view.onUpdate(tableId, callback);
            },
            getAuthorityInfo: (tableId) => {
                var _a, _b;
                return (_b = (_a = this.storage.view) === null || _a === void 0 ? void 0 : _a.getAuthorityInfo(tableId)) !== null && _b !== void 0 ? _b : null;
            },
        };
        // Make API available on editor instance
        this.editor.tableScrollAuthority = api;
    },
    onDestroy() {
        var _a;
        (_a = this.storage.view) === null || _a === void 0 ? void 0 : _a.destroy();
    },
});
export default TableScrollAuthorityExtension;
