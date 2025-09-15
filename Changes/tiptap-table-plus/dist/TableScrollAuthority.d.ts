import { Extension } from "@tiptap/core";
import { PluginKey } from "prosemirror-state";
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
    getAuthorityInfo: (tableId: string) => {
        activeAuthority: string | null;
        candidates: string[];
    } | null;
};
export declare const tableScrollAuthorityPluginKey: PluginKey<any>;
export declare const TableScrollAuthorityExtension: Extension<{}, any>;
export default TableScrollAuthorityExtension;
