import { Table } from "@tiptap/extension-table";
import { mergeAttributes, Extension } from "@tiptap/core";
import { TableRowGroup } from "./TableRowGroup";
import TableCommandExtension from "../TableCommandExtension";
import TableScrollAuthorityExtension from "../TableScrollAuthority";
export const DetectTableInsert = Extension.create({
    name: 'detectTableInsert',
    onTransaction({ transaction }) {
        // Check if this transaction came from paste
        const isPaste = transaction.getMeta('paste') === true;
        if (!isPaste)
            return;
        const uiEvent = transaction.getMeta('uiEvent');
        // Determine source
        let source = 'unknown';
        if (isPaste && uiEvent === 'paste') {
            source = 'paste';
        }
        if (transaction.docChanged) {
            transaction.doc.descendants((node, pos) => {
                if (node.type.name === 'table' && source === 'paste') {
                    setTimeout(() => {
                        if (window.refreshPage) {
                            window.refreshPage();
                        }
                    }, 100);
                }
            });
        }
    },
});
export const TablePlus = Table.extend({
    content: "(tableRowGroup|tableRow)+",
    addExtensions() {
        return [
            TableRowGroup,
            TableCommandExtension,
            DetectTableInsert,
            TableScrollAuthorityExtension
        ];
    },
    renderHTML({ node, HTMLAttributes }) {
        const table = [
            "table",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                border: 1,
            }),
            0,
        ];
        return table;
    },
    addNodeView() {
        return ({ node, editor, getPos }) => {
            const dom = document.createElement('table');
            let maxCellCount = 0;
            // Calculate max cell count
            node.forEach((child) => {
                if (child.type.name === 'tableRowGroup') {
                    child.forEach((row) => {
                        if (row.type.name === 'tableRow') {
                            if (row.childCount > maxCellCount) {
                                maxCellCount = row.childCount;
                            }
                        }
                    });
                }
                else if (child.type.name === 'tableRow') {
                    if (child.childCount > maxCellCount) {
                        maxCellCount = child.childCount;
                    }
                }
            });
            dom.style.setProperty('--cell-count', maxCellCount.toString());
            dom.classList.add('table-plus');
            // Generate unique table ID with counter to prevent conflicts
            const tableId = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${performance.now()}`;
            dom.dataset.tableId = tableId;
            // Register table with scroll authority extension
            if (editor.tableScrollAuthority) {
                editor.tableScrollAuthority.registerTable(tableId);
            }
            // Add resize functionality
            let resizing = false;
            let startX = 0;
            let startWidth = 0;
            let resizingColumnIndex = -1;
            const addResizeHandles = () => {
                // Remove existing handles
                dom.querySelectorAll('.column-resize-handle').forEach(handle => handle.remove());
                // Add resize handles to header cells
                const headerRow = dom.querySelector('tr');
                if (headerRow) {
                    const cells = headerRow.querySelectorAll('th, td');
                    cells.forEach((cell, index) => {
                        if (index < cells.length - 1) { // Don't add handle to last column
                            const handle = document.createElement('div');
                            handle.className = 'column-resize-handle';
                            handle.style.cssText = `
                position: absolute;
                top: 0;
                right: -2px;
                bottom: 0;
                width: 4px;
                background: transparent;
                cursor: col-resize;
                z-index: 10;
                user-select: none;
              `;
                            handle.addEventListener('mousedown', (e) => {
                                e.preventDefault();
                                resizing = true;
                                startX = e.clientX;
                                resizingColumnIndex = index;
                                // Get current width
                                const rect = cell.getBoundingClientRect();
                                startWidth = rect.width;
                                handle.style.background = '#667eea';
                                document.body.style.cursor = 'col-resize';
                                document.body.style.userSelect = 'none';
                            });
                            cell.style.position = 'relative';
                            cell.appendChild(handle);
                        }
                    });
                }
            };
            let currentWidth = 0;
            const handleMouseMove = (e) => {
                if (!resizing || resizingColumnIndex === -1)
                    return;
                const diff = e.clientX - startX;
                const newWidth = Math.max(50, startWidth + diff); // Minimum width of 50px
                currentWidth = newWidth;
                // Visual feedback only - update grid template directly for smooth resizing
                const rows = dom.querySelectorAll('tr');
                rows.forEach((row) => {
                    const currentTemplate = row.style.gridTemplateColumns;
                    if (currentTemplate) {
                        const columns = currentTemplate.split(' ');
                        if (columns[resizingColumnIndex]) {
                            columns[resizingColumnIndex] = `${newWidth}px`;
                            row.style.gridTemplateColumns = columns.join(' ');
                        }
                    }
                });
            };
            const updateDocumentWithNewWidth = (newWidth) => {
                // Update the ProseMirror document only once when resizing is complete
                const pos = getPos();
                if (typeof pos === 'number') {
                    const { tr } = editor.state;
                    const tableNode = editor.state.doc.nodeAt(pos);
                    if (tableNode) {
                        let updatedTable = tableNode;
                        // Update colwidth for all rows
                        tableNode.forEach((child, childOffset) => {
                            if (child.type.name === 'tableRowGroup') {
                                let updatedRowGroup = child;
                                child.forEach((row, rowOffset) => {
                                    if (row.type.name === 'tableRow') {
                                        let updatedRow = row;
                                        row.forEach((cell, cellOffset) => {
                                            if (cellOffset === resizingColumnIndex) {
                                                const currentColwidths = cell.attrs.colwidth || [];
                                                const newColwidths = [...currentColwidths];
                                                newColwidths[0] = newWidth;
                                                const updatedCell = cell.type.create(Object.assign(Object.assign({}, cell.attrs), { colwidth: newColwidths }), cell.content);
                                                updatedRow = updatedRow.replaceChild(cellOffset, updatedCell);
                                            }
                                        });
                                        updatedRowGroup = updatedRowGroup.replaceChild(rowOffset, updatedRow);
                                    }
                                });
                                updatedTable = updatedTable.replaceChild(childOffset, updatedRowGroup);
                            }
                            else if (child.type.name === 'tableRow') {
                                let updatedRow = child;
                                child.forEach((cell, cellOffset) => {
                                    if (cellOffset === resizingColumnIndex) {
                                        const currentColwidths = cell.attrs.colwidth || [];
                                        const newColwidths = [...currentColwidths];
                                        newColwidths[0] = newWidth;
                                        const updatedCell = cell.type.create(Object.assign(Object.assign({}, cell.attrs), { colwidth: newColwidths }), cell.content);
                                        updatedRow = updatedRow.replaceChild(cellOffset, updatedCell);
                                    }
                                });
                                updatedTable = updatedTable.replaceChild(childOffset, updatedRow);
                            }
                        });
                        const transaction = tr.replaceWith(pos, pos + tableNode.nodeSize, updatedTable);
                        editor.view.dispatch(transaction);
                    }
                }
            };
            const handleMouseUp = () => {
                if (resizing) {
                    // Update document with final width
                    updateDocumentWithNewWidth(currentWidth);
                    resizing = false;
                    resizingColumnIndex = -1;
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                    // Reset handle color
                    dom.querySelectorAll('.column-resize-handle').forEach((handle) => {
                        handle.style.background = 'transparent';
                    });
                }
            };
            // Authority-based scroll delegation handler
            let isUpdatingFromAuthority = false;
            let cleanupScrollListener = null;
            const handleTableScroll = (e) => {
                // Fast path - check authority lock first
                if (isUpdatingFromAuthority)
                    return;
                const target = e.target;
                // Fast class check - only proceed if both classes present
                if (target.classList.contains('table-row-wrapper') &&
                    target.classList.contains('show-scrollbar')) {
                    const rowId = target.dataset.rowId;
                    if (rowId && tableId && editor.tableScrollAuthority) {
                        // Direct call for immediate response
                        editor.tableScrollAuthority.updateScroll(tableId, target.scrollLeft, rowId);
                    }
                }
            };
            const setupTableScrollAuthority = () => {
                if (tableId && editor.tableScrollAuthority) {
                    cleanupScrollListener = editor.tableScrollAuthority.onUpdate(tableId, (scrollLeft, fromRowId) => {
                        // Prevent circular updates
                        if (isUpdatingFromAuthority)
                            return;
                        isUpdatingFromAuthority = true;
                        // Immediate synchronous update for maximum speed
                        const rowWrappers = dom.querySelectorAll('.table-row-wrapper');
                        rowWrappers.forEach((wrapper) => {
                            // Skip the wrapper that initiated the scroll
                            if (wrapper.dataset.rowId === fromRowId)
                                return;
                            // Direct assignment for fastest possible update - no threshold check
                            wrapper.scrollLeft = scrollLeft;
                        });
                        // Release lock immediately - no timeout delays
                        isUpdatingFromAuthority = false;
                    });
                }
            };
            // Add event delegation for scroll events
            dom.addEventListener('scroll', handleTableScroll, true); // Use capture phase
            // Setup scroll authority after DOM is ready
            setTimeout(setupTableScrollAuthority, 0);
            // Add global event listeners
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            // Initial setup
            setTimeout(addResizeHandles, 100);
            return {
                dom,
                contentDOM: dom,
                ignoreMutation(mutation) {
                    return document.querySelector('.column-resize-handle') !== null;
                },
                update(updatedNode) {
                    if (updatedNode.type.name !== 'table')
                        return false;
                    // Recalculate max cell count
                    let newMaxCellCount = 0;
                    updatedNode.forEach((child) => {
                        if (child.type.name === 'tableRowGroup') {
                            child.forEach((row) => {
                                if (row.type.name === 'tableRow') {
                                    if (row.childCount > newMaxCellCount) {
                                        newMaxCellCount = row.childCount;
                                    }
                                }
                            });
                        }
                        else if (child.type.name === 'tableRow') {
                            if (child.childCount > newMaxCellCount) {
                                newMaxCellCount = child.childCount;
                            }
                        }
                    });
                    if (newMaxCellCount !== maxCellCount) {
                        maxCellCount = newMaxCellCount;
                        dom.style.setProperty('--cell-count', maxCellCount.toString());
                        // Only re-add handles if structure changed
                    }
                    // Update scrollbars only for this specific table when content changes
                    setTimeout(() => {
                        if (window.updateTableRowScrollbarsForTable) {
                            // Use table-specific function to avoid interference between tables
                            window.updateTableRowScrollbarsForTable(tableId);
                        }
                    }, 100);
                    return true;
                },
                destroy() {
                    dom.removeEventListener('scroll', handleTableScroll, true);
                    if (cleanupScrollListener) {
                        cleanupScrollListener();
                    }
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                }
            };
        };
    },
});
export default TablePlus;
