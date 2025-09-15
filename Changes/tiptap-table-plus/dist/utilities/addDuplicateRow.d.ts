import { Transaction } from "@tiptap/pm/state";
/**
 * Adds a duplicate row to the table in the ProseMirror transaction.
 *
 * @param {Transaction} tr - The ProseMirror transaction.
 * @param {Object} tableInfo - Information about the table (map, tableStart, table).
 * @param {number} row - The index of the row to duplicate.
 * @param {boolean} withContent - Whether to duplicate the content of the row.
 * @returns {Transaction} - The updated transaction.
 */
export default function addDuplicateRow(tr: Transaction, { map, tableStart, table }: {
    map: any;
    tableStart: number;
    table: any;
}, row: number, withContent?: boolean): Transaction;
