import { Node, Extension, mergeAttributes } from "@tiptap/core";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Table } from "@tiptap/extension-table";
import { Fragment, Node as PMNode, Schema } from "prosemirror-model";
import {
  TableView,
  columnResizing,
  goToNextCell,
  tableEditing,
} from "prosemirror-tables";
import { NodeView } from "prosemirror-view";

export const RESIZE_MIN_WIDTH = 35;
export const EMPTY_CELL_WIDTH = 120;
export const EMPTY_CELL_HEIGHT = 31;

// BlockNote-style Table Paragraph for cells
const TableParagraph = Node.create({
  name: "tableParagraph",
  group: "tableContent",
  content: "block+",

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
  content: "tableParagraph+", // Use tableParagraph instead of generic content
  parseHTML() {
    return [
      {
        tag: "td",
        getContent: (node: HTMLElement, schema: Schema) => {
          // Simple content parsing - just get text content
          const text = node.textContent || "";
          if (text) {
            return Fragment.from(
              schema.nodes.tableParagraph.create(null, schema.text(text)),
            );
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
            return Fragment.from(
              schema.nodes.tableParagraph.create(null, schema.text(text)),
            );
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
        // View: null, // We'll handle the view in the table node
      }),
      // tableEditing(),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        if (
          this.editor.state.selection.empty &&
          this.editor.state.selection.$head.parent.type.name ===
            "tableParagraph"
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
          goToNextCell(1)(state, dispatch, view),
        );
      },

      "Shift-Tab": () => {
        return this.editor.commands.command(({ state, dispatch, view }) =>
          goToNextCell(-1)(state, dispatch, view),
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
