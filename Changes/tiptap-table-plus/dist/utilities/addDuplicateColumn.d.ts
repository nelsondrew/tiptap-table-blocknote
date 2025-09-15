import { Transaction } from '@tiptap/pm/state';
export default function addDuplicateColumn(tr: Transaction, { map, tableStart, table }: {
    map: any;
    tableStart: number;
    table: any;
}, col: number, withContent?: boolean): Transaction;
