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

      // Calculate number of columns based on first row cells
      let columnCount = 0;
      if (node.content && node.content.childCount > 0) {
        node.content.forEach((cell) => {
          const colspan = cell.attrs.colspan || 1;
          columnCount += colspan;
        });
      } else {
        // Default to 5 columns if no content yet
        columnCount = 5;
      }

      // Set grid-template-columns with 200px per column
      const gridColumns = Array(columnCount).fill('200px').join(' ');
      dom.style.gridTemplateColumns = gridColumns;

      // Apply any additional HTML attributes
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (key !== "style") {
          dom.setAttribute(key, value as string);
        }
      });

      return { dom, contentDOM: dom };
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
      const dom = document.createElement('table');
      let maxCellCount = 0;

      // Calculate max cell count from table rows
      node.forEach((child: any) => {
        if (child.type.name === 'tableRow') {
          if (child.childCount > maxCellCount) {
            maxCellCount = child.childCount;
          }
        }
      });

      // Apply table classes and styling
      dom.className = "bn-table prosemirror-table";
      dom.style.display = "contents"; // Make table invisible to layout for pagination
      dom.style.border = "2px solid #e5e7eb";
      dom.style.borderCollapse = "separate";
      dom.style.borderSpacing = "0";
      dom.style.width = "100%";
      dom.style.backgroundColor = "white";

      // Set CSS custom properties for grid layout
      dom.style.setProperty('--cell-count', maxCellCount.toString());

      // Apply HTML attributes
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (key !== "style" && key !== "class") {
          dom.setAttribute(key, value as string);
        }
      });

      return {
        dom,
        contentDOM: dom, // tr elements will be direct children of table
        update(updatedNode: any) {
          if (updatedNode.type.name !== 'table') return false;

          // Recalculate max cell count
          let newMaxCellCount = 0;
          updatedNode.forEach((child: any) => {
            if (child.type.name === 'tableRow') {
              if (child.childCount > newMaxCellCount) {
                newMaxCellCount = child.childCount;
              }
            }
          });

          if (newMaxCellCount !== maxCellCount) {
            maxCellCount = newMaxCellCount;
            dom.style.setProperty('--cell-count', maxCellCount.toString());
          }

          return true;
        }
      };
    };
  },

  renderHTML({ HTMLAttributes }) {
    return ["table", {
      class: "bn-table prosemirror-table",
      style: "display: contents; border: 2px solid #e5e7eb; border-collapse: separate; border-spacing: 0; width: 100%; background-color: white;",
      ...HTMLAttributes
    }, 0]; // Direct table element with tr children, no tbody
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