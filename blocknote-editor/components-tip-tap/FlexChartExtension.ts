import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { FlexChart } from './FlexChart';

export const FlexChartExtension = Node.create({
  name: 'flexChart',

  group: 'block',

  atom: true,

  selectable: true,

  draggable: true,

  addOptions() {
    return {
      editorId: null,
    };
  },

  addAttributes() {
    return {
      alignment: {
        default: 'center',
        parseHTML: element =>
          element.getAttribute('data-alignment') || 'center',
        renderHTML: attributes => ({
          'data-alignment': attributes.alignment,
        }),
      },
      nodeId: {
        default: null,
        parseHTML: element => element.getAttribute('data-node-id'),
        renderHTML: attributes => ({
          'data-node-id': attributes.nodeId,
        }),
      },
      editorId: {
        default: null,
        parseHTML: element => element.getAttribute('data-editor-id'),
        renderHTML: attributes => ({
          'data-editor-id': attributes.editorId,
        }),
      },
      parentId: {
        default: null,
      },
      chartData: {
        default: null,
      },
      chartLayoutId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="flex-chart"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'flex-chart', ...HTMLAttributes }, 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FlexChart);
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        if (editor.isActive(this.name)) {
          return true;
        }
        return false;
      },
      Delete: ({ editor }) => {
        if (editor.isActive(this.name)) {
          return true;
        }
        return false;
      },
    };
  },
}); 