import { Node, Extension, mergeAttributes } from "@tiptap/core";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Table } from "@tiptap/extension-table";
import { Fragment, Node as PMNode, Schema } from "prosemirror-model";
import {
  TableView,
  columnResizing,
  goToNextCell,
} from "prosemirror-tables";
import { NodeView } from "prosemirror-view";

export const RESIZE_MIN_WIDTH = 35;
export const EMPTY_CELL_WIDTH = 120;
export const EMPTY_CELL_HEIGHT = 31;

// BlockNote-style Table Paragraph for cells
const TableParagraph = Node.create({
  name: "tableParagraph",
  group: "block tableContent",
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
    return ["tr", mergeAttributes(HTMLAttributes), 0];
  },
});

// Enhanced Table Cell with BlockNote features
const BlockNoteTableCell = TableCell.extend({
  name: "tableCell",
  content: "block+", // Allow any block content including paragraphs, lists, etc.
  parseHTML() {
    return [
      {
        tag: "td",
        getContent: (node: HTMLElement, schema: Schema) => {
          // Create a paragraph node with the text content
          const text = node.textContent || "";
          if (text) {
            return Fragment.from(
              schema.nodes.paragraph.create(null, schema.text(text)),
            );
          }
          return Fragment.from(schema.nodes.paragraph.create());
        },
      },
    ];
  },
});

// Enhanced Table Header with BlockNote features
const BlockNoteTableHeader = TableHeader.extend({
  name: "tableHeader",
  content: "block+", // Allow any block content including paragraphs, lists, etc.
  parseHTML() {
    return [
      {
        tag: "th",
        getContent: (node: HTMLElement, schema: Schema) => {
          // Create a paragraph node with the text content
          const text = node.textContent || "";
          if (text) {
            return Fragment.from(
              schema.nodes.paragraph.create(null, schema.text(text)),
            );
          }
          return Fragment.from(schema.nodes.paragraph.create());
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
        // View: null, // We'll handle the view in the table node
      }),
      // tableEditing() removed to avoid conflict with PaginationPlus table handling
    ];
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from } = selection;
        
        // Check if we're inside a table cell
        let isInTableCell = false;
        for (let depth = $from.depth; depth >= 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
            isInTableCell = true;
            break;
          }
        }
        
        if (isInTableCell && selection.empty) {
          // Allow normal paragraph creation within table cells
          return this.editor.commands.createParagraphNear();
        }
        return false;
      },

      Backspace: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from } = selection;
        
        // Check if we're inside a table cell and at the start of a block
        let isInTableCell = false;
        for (let depth = $from.depth; depth >= 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
            isInTableCell = true;
            break;
          }
        }
        
        // Prevent backspace from deleting table structure when at start of cell content
        return (
          isInTableCell &&
          selection.empty &&
          selection.$head.parentOffset === 0 &&
          ($from.parent.type.name === "paragraph" || $from.parent.type.name === "tableParagraph")
        );
      },

      Tab: () => {
        console.log('🔍 Tab pressed in BlockNoteTableExtension');
        
        const { state } = this.editor;
        const { selection } = state;
        const { $from } = selection;
        
        console.log('Current selection:', selection);
        console.log('$from depth:', $from.depth);
        
        // Check if we're in a table by looking at parent nodes
        let isInTable = false;
        for (let depth = $from.depth; depth >= 0; depth--) {
          const node = $from.node(depth);
          console.log(`Depth ${depth}: ${node.type.name}`);
          
          if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
            console.log('✅ Found table cell at depth:', depth);
            isInTable = true;
            break;
          }
          
          if (node.type.name === 'table') {
            console.log('✅ Found table at depth:', depth);
            isInTable = true;
            break;
          }
        }
        
        if (isInTable) {
          console.log('🚀 Executing goToNextCell(1)');
          const result = this.editor.commands.command(({ state, dispatch, view }) => {
            try {
              return goToNextCell(1)(state, dispatch, view);
            } catch (error) {
              console.error('Error in goToNextCell:', error);
              return false;
            }
          });
          console.log('goToNextCell result:', result);
          return result;
        }
        
        console.log('❌ Not in table, returning false');
        return false;
      },

      "Shift-Tab": () => {
        console.log('🔍 Shift-Tab pressed in BlockNoteTableExtension');
        
        const { state } = this.editor;
        const { selection } = state;
        const { $from } = selection;
        
        // Check if we're in a table by looking at parent nodes
        let isInTable = false;
        for (let depth = $from.depth; depth >= 0; depth--) {
          const node = $from.node(depth);
          
          if (node.type.name === 'tableCell' || node.type.name === 'tableHeader' || node.type.name === 'table') {
            console.log('✅ Found table structure at depth:', depth);
            isInTable = true;
            break;
          }
        }
        
        if (isInTable) {
          console.log('🚀 Executing goToNextCell(-1)');
          const result = this.editor.commands.command(({ state, dispatch, view }) => {
            try {
              return goToNextCell(-1)(state, dispatch, view);
            } catch (error) {
              console.error('Error in goToNextCell:', error);
              return false;
            }
          });
          console.log('goToNextCell(-1) result:', result);
          return result;
        }
        
        console.log('❌ Not in table, returning false');
        return false;
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
      class BlockNoteTableView extends TableView {
        constructor(
          public node: PMNode,
          public cellMinWidth: number,
          public blockContentHTMLAttributes: Record<string, string>,
        ) {
          super(node, cellMinWidth);

          // Create BlockNote-style wrapper structure
          const blockContent = document.createElement("div");
          blockContent.className = "bn-block-content bn-table-block";
          blockContent.setAttribute("data-content-type", "table");
          // Apply HTML attributes
          for (const [attribute, value] of Object.entries(
            blockContentHTMLAttributes,
          )) {
            if (attribute !== "class") {
              blockContent.setAttribute(attribute, value);
            }
          }

          const tableWrapper = this.dom;
          // Create inner wrapper for better styling control
          const tableWrapperInner = document.createElement("div");
          tableWrapperInner.className = "tableWrapper-inner";
          // Get the actual table element and add proper classes
          const table = tableWrapper.querySelector("table");
          if (table) {
            table.className = "bn-table prosemirror-table";
            // Add border styling directly
            table.style.borderCollapse = "separate";
            table.style.borderSpacing = "0";
            table.style.width = "100%";
            table.style.backgroundColor = "white";
          }
          tableWrapperInner.appendChild(tableWrapper.firstChild!);
          tableWrapper.appendChild(tableWrapperInner);
          blockContent.appendChild(tableWrapper);

          // Add floating container for widgets (like resize handles)
          const floatingContainer = document.createElement("div");
          floatingContainer.className = "table-widgets-container";
          floatingContainer.style.position = "relative";
          tableWrapper.appendChild(floatingContainer);

          this.dom = blockContent;
        }

        ignoreMutation(record: MutationRecord): boolean {
          return (
            !(record.target as HTMLElement).closest(".tableWrapper-inner") ||
            super.ignoreMutation(record)
          );
        }
      }

      return new BlockNoteTableView(node, EMPTY_CELL_WIDTH, {
        ...HTMLAttributes,
      }) as NodeView;
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        class: "bn-block-content bn-table-block",
        "data-content-type": "table",
        ...HTMLAttributes,
      },
      [
        "div",
        { class: "tableWrapper" },
        [
          "div",
          { class: "tableWrapper-inner" },
          [
            "table",
            {
              class: "bn-table prosemirror-table",
              style:
                "border-collapse: separate; border-spacing: 0; width: 100%; background-color: white;",
            },
            0,
          ],
        ],
      ],
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
