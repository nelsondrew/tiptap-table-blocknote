import { Node, Extension, mergeAttributes } from "@tiptap/core";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Table } from "@tiptap/extension-table";
import { DOMParser, Fragment, Node as PMNode, Schema } from "prosemirror-model";
import { TableView, columnResizing, goToNextCell, tableEditing } from "prosemirror-tables";
import { NodeView } from "prosemirror-view";
import TableScrollAuthorityExtension from "../TableScrollAuthority";

export const RESIZE_MIN_WIDTH = 35;
export const EMPTY_CELL_WIDTH = 120;
export const EMPTY_CELL_HEIGHT = 31;

// BlockNote-style Table Paragraph for cells
const TableParagraph = Node.create({
  name: "tableParagraph",
  group: "tableContent",
  content: "inline*",

  parseHTML() {
    return [
      {
        tag: "p",
        getAttrs: (element) => {
          if (typeof element === "string" || !element.textContent) {
            return false;
          }

          const parent = element.parentElement;
          if (parent === null) {
            return false;
          }

          if (parent.tagName === "TD" || parent.tagName === "TH") {
            return {};
          }

          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["p", HTMLAttributes, 0];
  },
});

// BlockNote-style Table Row
const BlockNoteTableRow = Node.create({
  name: "tableRow",
  content: "(tableCell | tableHeader)+",
  tableRole: "row",
  
  parseHTML() {
    return [{ tag: "tr" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        class: "table-row-scroll-wrapper",
        style: "overflow-x: auto; overflow-y: visible; width: 100%; max-width: 100%;"
      },
      [
        "tr",
        mergeAttributes({
          style: "display: grid; grid-template-columns: 200px 200px 200px 200px 200px;"
        }, HTMLAttributes), 0
      ]
    ];
  },

  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      // Create scroll wrapper for this row
      const scrollWrapper = document.createElement("div");
      scrollWrapper.className = "table-row-scroll-wrapper";
      scrollWrapper.style.overflowX = "auto";
      scrollWrapper.style.overflowY = "visible";
      scrollWrapper.style.width = "100%";
      scrollWrapper.style.maxWidth = "100%";

      const dom = document.createElement("tr");
      dom.style.display = "grid";

      // Generate unique row ID
      const rowId = `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      // Set data-row-id on the scroll wrapper (the element that actually scrolls)
      scrollWrapper.setAttribute('data-row-id', rowId);
      console.log(`[ROW-${rowId}] created new table row`);

      // Get table ID from closest table
      let tableId: string | null = null;
      let scrollAuthorityAPI: any = null;

      // Function to find table ID
      const findTableId = () => {
        const table = scrollWrapper.closest('table');
        if (table) {
          const existingId = table.getAttribute('data-table-id');
          if (existingId) return existingId;

          const newId = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          table.setAttribute('data-table-id', newId);
          return newId;
        }
        return null;
      };

      const setupScrollAuthority = () => {
        // Only setup if show-scrollbar class is present (for now ignore this condition as requested)
        const currentTableId = findTableId();
        console.log(`[ROW-${rowId}] setupScrollAuthority called:`, {currentTableId, hasEditor: !!editor});
        if (!currentTableId || !editor) {
          console.log(`[ROW-${rowId}] setupScrollAuthority aborted: missing tableId or editor`);
          return;
        }

        tableId = currentTableId;
        scrollAuthorityAPI = (editor as any).tableScrollAuthority;
        console.log(`[ROW-${rowId}] scrollAuthorityAPI found:`, !!scrollAuthorityAPI);

        if (scrollAuthorityAPI) {
          // Register table first
          scrollAuthorityAPI.registerTable(tableId);
          console.log(`[ROW-${rowId}] registered table:`, tableId);

          // Register this row as a candidate for scroll authority
          scrollAuthorityAPI.registerCandidate(tableId, rowId);
          console.log(`[ROW-${rowId}] registered as candidate for table:`, tableId);

              // Note: Row updates are now handled by table-level scroll authority
        }
      };

      // Monitor show-scrollbar class changes for authority registration
      const scrollAuthorityObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const hasShowScrollbar = scrollWrapper.classList.contains('show-scrollbar');
            const currentTableId = findTableId();
            console.log(`[ROW-${rowId}] class mutation detected:`, {hasShowScrollbar, currentTableId, hasAuthority: !!(editor as any).tableScrollAuthority});

            if (currentTableId && (editor as any).tableScrollAuthority) {
              if (hasShowScrollbar) {
                // Register when show-scrollbar is added
                scrollAuthorityAPI = (editor as any).tableScrollAuthority;
                console.log(`[ROW-${rowId}] show-scrollbar added, registering with authority`);
                if (scrollAuthorityAPI) {
                  scrollAuthorityAPI.registerTable(currentTableId);
                  scrollAuthorityAPI.registerCandidate(currentTableId, rowId);
                  console.log(`[ROW-${rowId}] registered as candidate after class change`);

                  // Note: Updates handled by table-level authority
                }
              } else {
                // Unregister when show-scrollbar is removed
                console.log(`[ROW-${rowId}] show-scrollbar removed, unregistering`);
                if (scrollAuthorityAPI) {
                  scrollAuthorityAPI.removeCandidate(currentTableId, rowId);
                  console.log(`[ROW-${rowId}] removed from candidates`);
                }
              }
            }
          }
        });
      });

      // Function to calculate and update grid columns
      const updateGridColumns = (currentNode?: any) => {
        let columnCount = 0;

        // First try to get column count from the table's CSS custom property
        const table = scrollWrapper.closest('table');
        if (table) {
          const cellCountFromTable = table.style.getPropertyValue('--cell-count');
          if (cellCountFromTable) {
            columnCount = parseInt(cellCountFromTable);
          }
        }

        // Fallback: calculate from current node
        if (columnCount === 0 && currentNode) {
          try {
            if (currentNode.content && currentNode.content.childCount > 0) {
              currentNode.content.forEach((cell: any) => {
                if (cell && cell.attrs) {
                  const colspan = cell.attrs.colspan || 1;
                  columnCount += colspan;
                }
              });
            } else if (currentNode.childCount > 0) {
              columnCount = currentNode.childCount;
            }
          } catch (nodeError) {
            console.warn('Error parsing node structure, using DOM fallback:', nodeError);
            const cells = dom.querySelectorAll('td, th');
            columnCount = cells.length;
          }
        }

        // Final fallback
        if (columnCount === 0) {
          columnCount = 5;
        }

        // Set grid-template-columns with 200px per column
        const gridColumns = Array(columnCount).fill('200px').join(' ');
        dom.style.gridTemplateColumns = gridColumns;
        return columnCount;
      };

      // Note: Individual row scroll handling is now delegated to table level
      // The table handles all scroll events via event delegation for better performance

      // Setup DOM structure
      scrollWrapper.appendChild(dom);

      // For testing purposes: hardcode show-scrollbar attribute for 2nd row (index 1)
      const setupTestScrollbar = () => {
        const table = scrollWrapper.closest('table');
        console.log(`[ROW-${rowId}] setupTestScrollbar called, table found:`, !!table);
        if (table) {
          const allRows = Array.from(table.querySelectorAll('.table-row-scroll-wrapper'));
          const rowIndex = allRows.indexOf(scrollWrapper);
          console.log(`[ROW-${rowId}] row index in table:`, rowIndex, 'total rows:', allRows.length);

          if (rowIndex === 1) { // 2nd row (index 1)
            scrollWrapper.classList.add('show-scrollbar');
            console.log(`[ROW-${rowId}] Row ${rowIndex + 1} marked with show-scrollbar for testing`);
          } else {
            console.log(`[ROW-${rowId}] Row ${rowIndex + 1} NOT marked with show-scrollbar (not index 1)`);
          }
        }
      };

      // Initial setup
      updateGridColumns(node);
      console.log(`[ROW-${rowId}] initial grid columns set`);

      // Setup test scrollbar and authority first (before observer)
      setTimeout(() => {
        console.log(`[ROW-${rowId}] starting delayed setup`);
        setupTestScrollbar();
        setupScrollAuthority();

        // Start observing class changes AFTER initial setup to avoid infinite loops
        scrollAuthorityObserver.observe(scrollWrapper, {
          attributes: true,
          attributeFilter: ['class']
        });
        console.log(`[ROW-${rowId}] mutation observer started`);
      }, 100);

      // Apply any additional HTML attributes to the tr element
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (key !== "style") {
          dom.setAttribute(key, value as string);
        }
      });

      return {
        dom: scrollWrapper,
        contentDOM: dom,
        ignoreMutation(mutation) {
          // Ignore column resize handle mutations
          if (document.querySelector('.column-resize-handle') !== null) {
            return true;
          }

          // Ignore style and data attribute changes to prevent re-render when adding scrollbars
          if (mutation.type === 'attributes') {
            const attributeName = mutation.attributeName;
            if (attributeName === 'style' ||
                attributeName === 'class' ||
                attributeName?.startsWith('data-')) {
              return true;
            }
          }

          // Let other mutations through
          return false;
        },
        update(updatedNode: any) {
          if (!updatedNode || updatedNode.type.name !== 'tableRow') return false;

          try {
            // Recalculate grid columns when row content changes
            updateGridColumns(updatedNode);
            return true;
          } catch (error) {
            console.error('Error updating table row:', error);
            try {
              updateGridColumns();
              return true;
            } catch (fallbackError) {
              console.error('Error in fallback update:', fallbackError);
              return false;
            }
          }
        },
        destroy() {
          console.log(`[ROW-${rowId}] destroying row`);
          // Clean up scroll authority
          if (scrollAuthorityAPI && tableId && rowId) {
            scrollAuthorityAPI.removeCandidate(tableId, rowId);
            console.log(`[ROW-${rowId}] removed from scroll authority candidates`);
          }

          // Note: No subscription to unsubscribe from - handled by table level

          // Stop observing mutations
          scrollAuthorityObserver.disconnect();
          console.log(`[ROW-${rowId}] mutation observer disconnected`);

          // Note: No individual scroll listener to remove - handled by table delegation
        }
      };
    };
  },
});

// Enhanced Table Cell with BlockNote features
const BlockNoteTableCell = TableCell.extend({
  name: "tableCell",
  content: "tableParagraph+", // Use tableParagraph instead of generic content
  
  parseHTML() {
    return [
      {
        tag: "td",
        getContent: (node: HTMLElement, schema: Schema) => {
          // Simple content parsing - just get text content
          const text = node.textContent || "";
          if (text) {
            return Fragment.from(schema.nodes.tableParagraph.create(null, schema.text(text)));
          }
          return Fragment.from(schema.nodes.tableParagraph.create());
        },
      },
    ];
  },
});

// Enhanced Table Header with BlockNote features
const BlockNoteTableHeader = TableHeader.extend({
  name: "tableHeader",
  content: "tableParagraph+", // Use tableParagraph instead of generic content
  
  parseHTML() {
    return [
      {
        tag: "th",
        getContent: (node: HTMLElement, schema: Schema) => {
          // Simple content parsing - just get text content
          const text = node.textContent || "";
          if (text) {
            return Fragment.from(schema.nodes.tableParagraph.create(null, schema.text(text)));
          }
          return Fragment.from(schema.nodes.tableParagraph.create());
        },
      },
    ];
  },
});

// BlockNote Table Extension with enhanced features
const BlockNoteTableExtension = Extension.create({
  name: "BlockNoteTableExtension",

  addProseMirrorPlugins() {
    return [
      columnResizing({
        cellMinWidth: RESIZE_MIN_WIDTH,
        View: null, // We'll handle the view in the table node
      }),
    //   tableEditing(),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        if (
          this.editor.state.selection.empty &&
          this.editor.state.selection.$head.parent.type.name === "tableParagraph"
        ) {
          this.editor.commands.insertContent({ type: "hardBreak" });
          return true;
        }
        return false;
      },

      Backspace: () => {
        const selection = this.editor.state.selection;
        const selectionIsEmpty = selection.empty;
        const selectionIsAtStartOfNode = selection.$head.parentOffset === 0;
        const selectionIsInTableParagraphNode =
          selection.$head.node().type.name === "tableParagraph";

        return (
          selectionIsEmpty &&
          selectionIsAtStartOfNode &&
          selectionIsInTableParagraphNode
        );
      },

      Tab: () => {
        return this.editor.commands.command(({ state, dispatch, view }) =>
          goToNextCell(1)(state, dispatch, view)
        );
      },

      "Shift-Tab": () => {
        return this.editor.commands.command(({ state, dispatch, view }) =>
          goToNextCell(-1)(state, dispatch, view)
        );
      },
    };
  },
});

// Main BlockNote-inspired Table
export const BlockNoteTable = Table.extend({
  name: "table",
  content: "tableRow+",
  tableRole: "table",
  isolating: true,

  addNodeView() {
    return ({ node, HTMLAttributes, editor }) => {
      let maxCellCount = 0;

      // Calculate max cell count from table rows
      node.forEach((child: any) => {
        if (child.type.name === 'tableRow') {
          if (child.childCount > maxCellCount) {
            maxCellCount = child.childCount;
          }
        }
      });

      // Create BlockNote-style wrapper structure with display: contents
      const blockContent = document.createElement("div");
      blockContent.className = "bn-block-content bn-table-block";
      blockContent.setAttribute("data-content-type", "table");
      blockContent.style.display = "contents"; // Make wrapper invisible to layout

      // Apply HTML attributes to blockContent
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (key !== "class") {
          blockContent.setAttribute(key, value as string);
        }
      });

      // Create tableWrapper with display: contents
      const tableWrapper = document.createElement("div");
      tableWrapper.className = "tableWrapper";
      tableWrapper.style.display = "contents";

      // Create tableWrapper-inner with display: contents
      const tableWrapperInner = document.createElement("div");
      tableWrapperInner.className = "tableWrapper-inner";
      tableWrapperInner.style.display = "contents";

      // Create table element (no tbody - tr will be direct children)
      const table = document.createElement('table');
      table.className = "bn-table prosemirror-table";
      table.style.display = "contents"; // Make table invisible to layout for pagination
      table.style.border = "2px solid #e5e7eb";
      table.style.borderCollapse = "separate";
      table.style.borderSpacing = "0";
      table.style.width = "100%";
      table.style.backgroundColor = "white";

      // Set CSS custom properties for grid layout
      table.style.setProperty('--cell-count', maxCellCount.toString());

      // Generate unique table ID and register with scroll authority
      const tableId = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      table.setAttribute('data-table-id', tableId);
      console.log(`[TABLE-${tableId}] created new table`);

      // Register table with scroll authority
      if (editor && (editor as any).tableScrollAuthority) {
        (editor as any).tableScrollAuthority.registerTable(tableId);
        console.log(`[TABLE-${tableId}] registered with scroll authority`);
      } else {
        console.log(`[TABLE-${tableId}] scroll authority not available:`, {hasEditor: !!editor, hasAuthority: !!(editor as any)?.tableScrollAuthority});
      }

      // Authority-based scroll delegation handler
      let isUpdatingFromAuthority = false;
      let cleanupScrollListener: (() => void) | null = null;

      const handleTableScroll = (e: Event) => {
        // Fast path - check authority lock first
        if (isUpdatingFromAuthority) {
          console.log(`[TABLE-${tableId}] scroll event ignored - authority locked`);
          return;
        }

        const target = e.target as HTMLElement;
        const hasRowWrapper = target.classList.contains('table-row-scroll-wrapper');
        const hasShowScrollbar = target.classList.contains('show-scrollbar');
        console.log(`[TABLE-${tableId}] scroll event:`, {hasRowWrapper, hasShowScrollbar, scrollLeft: target.scrollLeft});

        // Fast class check - only proceed if both classes present
        if (hasRowWrapper && hasShowScrollbar) {
          const scrollingRowId = target.getAttribute('data-row-id');
          console.log(`[TABLE-${tableId}] valid scroll event from row:`, scrollingRowId, 'position:', target.scrollLeft);

          if (scrollingRowId && tableId && (editor as any).tableScrollAuthority) {
            // Direct call for immediate response
            console.log(`[TABLE-${tableId}] calling updateScroll with:`, {tableId, scrollLeft: target.scrollLeft, fromRowId: scrollingRowId});
            (editor as any).tableScrollAuthority.updateScroll(tableId, target.scrollLeft, scrollingRowId);
          } else {
            console.log(`[TABLE-${tableId}] scroll update aborted:`, {hasRowId: !!scrollingRowId, hasTableId: !!tableId, hasAuthority: !!(editor as any).tableScrollAuthority});
          }
        } else {
          console.log(`[TABLE-${tableId}] scroll event ignored - classes not matching`);
        }
      };

      const setupTableScrollAuthority = () => {
        console.log(`[TABLE-${tableId}] setupTableScrollAuthority called:`, {hasTableId: !!tableId, hasAuthority: !!(editor as any).tableScrollAuthority});
        if (tableId && (editor as any).tableScrollAuthority) {
          console.log(`[TABLE-${tableId}] setting up scroll authority listener`);
          cleanupScrollListener = (editor as any).tableScrollAuthority.onUpdate(
            tableId,
            (scrollLeft: number, fromRowId?: string) => {
              console.log(`[TABLE-${tableId}] received scroll update:`, {scrollLeft, fromRowId, isUpdatingFromAuthority});
              // Prevent circular updates
              if (isUpdatingFromAuthority) {
                console.log(`[TABLE-${tableId}] update ignored - authority locked`);
                return;
              }

              isUpdatingFromAuthority = true;
              console.log(`[TABLE-${tableId}] applying scroll update to all rows except:`, fromRowId);

              // Immediate synchronous update for maximum speed
              const rowWrappers = table.querySelectorAll('.table-row-scroll-wrapper');
              console.log(`[TABLE-${tableId}] found ${rowWrappers.length} row wrappers to update`);

              let updatedCount = 0;
              rowWrappers.forEach((wrapper: any) => {
                const wrapperRowId = wrapper.getAttribute('data-row-id');
                // Skip the wrapper that initiated the scroll
                if (wrapperRowId === fromRowId) {
                  console.log(`[TABLE-${tableId}] skipping originating row:`, wrapperRowId);
                  return;
                }

                console.log(`[TABLE-${tableId}] updating row ${wrapperRowId} from ${wrapper.scrollLeft} to ${scrollLeft}`);
                // Direct assignment for fastest possible update - no threshold check
                wrapper.scrollLeft = scrollLeft;
                updatedCount++;
              });

              console.log(`[TABLE-${tableId}] updated ${updatedCount} rows, releasing authority lock`);
              // Release lock immediately - no timeout delays
              isUpdatingFromAuthority = false;
            }
          );
          console.log(`[TABLE-${tableId}] scroll authority listener setup complete`);
        } else {
          console.log(`[TABLE-${tableId}] scroll authority setup failed - missing requirements`);
        }
      };

      // Add event delegation for scroll events
      table.addEventListener('scroll', handleTableScroll, true); // Use capture phase
      console.log(`[TABLE-${tableId}] scroll event listener added`);

      // Setup scroll authority after DOM is ready
      setTimeout(() => {
        console.log(`[TABLE-${tableId}] setting up table scroll authority`);
        setupTableScrollAuthority();
      }, 0);

      // Create floating container for widgets (table tracker needs this)
      const floatingContainer = document.createElement("div");
      floatingContainer.className = "table-widgets-container";
      floatingContainer.style.position = "relative";

      // Assemble the structure
      tableWrapperInner.appendChild(table);
      tableWrapper.appendChild(tableWrapperInner);
      tableWrapper.appendChild(floatingContainer);
      blockContent.appendChild(tableWrapper);

      return {
        dom: blockContent,
        contentDOM: table, // tr elements will be direct children of table (no tbody)
        update(updatedNode: any) {
          if (!updatedNode || updatedNode.type.name !== 'table') return false;

          try {
            // Recalculate max cell count
            let newMaxCellCount = 0;

            // Check if updatedNode has content and forEach method
            if (updatedNode.content && typeof updatedNode.forEach === 'function') {
              updatedNode.forEach((child: any) => {
                if (child && child.type && child.type.name === 'tableRow') {
                  if (child.childCount > newMaxCellCount) {
                    newMaxCellCount = child.childCount;
                  }
                }
              });
            } else if (updatedNode.content && updatedNode.content.content) {
              // Alternative way to iterate through content
              const children = updatedNode.content.content;
              if (Array.isArray(children)) {
                children.forEach((child: any) => {
                  if (child && child.type && child.type.name === 'tableRow') {
                    if (child.childCount > newMaxCellCount) {
                      newMaxCellCount = child.childCount;
                    }
                  }
                });
              }
            }

            // Fallback: calculate from DOM if ProseMirror structure fails
            if (newMaxCellCount === 0) {
              const firstRow = table.querySelector('tr');
              if (firstRow) {
                newMaxCellCount = firstRow.children.length;
              }
            }

            if (newMaxCellCount > 0 && newMaxCellCount !== maxCellCount) {
              maxCellCount = newMaxCellCount;
              table.style.setProperty('--cell-count', maxCellCount.toString());

              // Force update all table rows to recalculate their grid columns
              // Use a more reliable DOM-based approach
              setTimeout(() => {
                const allRows = table.querySelectorAll('tr');
                allRows.forEach((row: HTMLElement) => {
                  const gridColumns = Array(newMaxCellCount).fill('200px').join(' ');
                  row.style.gridTemplateColumns = gridColumns;
                });
              }, 0);
            }

            return true;
          } catch (error) {
            console.error('Error updating table structure:', error);
            return false;
          }
        },
        ignoreMutation(record: MutationRecord): boolean {
          return (
            !(record.target as HTMLElement).closest(".tableWrapper-inner") ||
            record.type === 'attributes'
          );
        },
        destroy() {
          console.log(`[TABLE-${tableId}] destroying table`);
          table.removeEventListener('scroll', handleTableScroll, true);
          console.log(`[TABLE-${tableId}] scroll listener removed`);
          if (cleanupScrollListener) {
            cleanupScrollListener();
            console.log(`[TABLE-${tableId}] scroll authority listener cleaned up`);
          }
        }
      };
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        class: "bn-block-content bn-table-block",
        "data-content-type": "table",
        style: "display: contents;", // Make wrapper invisible to layout for pagination
        ...HTMLAttributes,
      },
      [
        "div",
        {
          class: "tableWrapper",
          style: "display: contents;" // Make wrapper invisible to layout for pagination
        },
        [
          "div",
          {
            class: "tableWrapper-inner",
            style: "display: contents;" // Make wrapper invisible to layout for pagination
          },
          ["table", {
            class: "bn-table prosemirror-table",
            style: "display: contents; border: 2px solid #e5e7eb; border-collapse: separate; border-spacing: 0; width: 100%; background-color: white;" // Make table invisible to layout for pagination
          }, 0], // Direct table with tr children, no tbody
          [
            "div",
            {
              class: "table-widgets-container",
              style: "position: relative;"
            }
          ]
        ]
      ]
    ];
  },
});

// Export the complete BlockNote Table setup
export default [
  TableScrollAuthorityExtension,
  BlockNoteTableExtension,
  BlockNoteTable,
  BlockNoteTableRow,
  BlockNoteTableHeader,
  BlockNoteTableCell,
  TableParagraph,
]; 