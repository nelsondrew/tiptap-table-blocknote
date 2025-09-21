import { Node, Extension, mergeAttributes } from "@tiptap/core";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Table } from "@tiptap/extension-table";
import { DOMParser, Fragment, Node as PMNode, Schema } from "prosemirror-model";
import { TableView, columnResizing, goToNextCell, tableEditing } from "prosemirror-tables";
import { NodeView } from "prosemirror-view";

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
    return ["tr", mergeAttributes({
      style: "display: grid; grid-template-columns: 200px 200px 200px 200px 200px;"
    }, HTMLAttributes), 0];
  },

  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const dom = document.createElement("tr");

      // Apply CSS Grid with fixed 200px columns
      dom.style.display = "grid";

      // Function to calculate and update grid columns
      const updateGridColumns = (currentNode?: any) => {
        let columnCount = 0;

        // First try to get column count from the table's CSS custom property
        const table = dom.closest('table');
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
              // Alternative: use direct childCount
              columnCount = currentNode.childCount;
            }
          } catch (nodeError) {
            console.warn('Error parsing node structure, using DOM fallback:', nodeError);
            // DOM fallback: count actual cells in this row
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

      // Initial setup
      updateGridColumns(node);

      // Apply any additional HTML attributes
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (key !== "style") {
          dom.setAttribute(key, value as string);
        }
      });

      return {
        dom,
        contentDOM: dom,
        update(updatedNode: any) {
          if (!updatedNode || updatedNode.type.name !== 'tableRow') return false;

          try {
            // Recalculate grid columns when row content changes
            updateGridColumns(updatedNode);
            return true;
          } catch (error) {
            console.error('Error updating table row:', error);
            // Try to update without node parameter
            try {
              updateGridColumns();
              return true;
            } catch (fallbackError) {
              console.error('Error in fallback update:', fallbackError);
              return false;
            }
          }
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
    return ({ node, HTMLAttributes }) => {
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
  BlockNoteTableExtension,
  BlockNoteTable,
  BlockNoteTableRow,
  BlockNoteTableHeader,
  BlockNoteTableCell,
  TableParagraph,
]; 