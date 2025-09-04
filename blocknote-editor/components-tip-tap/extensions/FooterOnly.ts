import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import FooterOnlyView from './FooterOnlyView';

export const FooterOnly = Node.create({
  name: 'footerOnly',
  group: 'block',
  atom: true,
  selectable: false, 
  draggable: false, 

  addAttributes() {
    return {
      marginTop: {
        default: '0px',
        parseHTML: element => element.style.marginTop || '0px',
        renderHTML: attrs => ({ style: `margin-top: ${attrs.marginTop}` }),
      },
      footerText: {
        default: '',
        parseHTML: element => element.getAttribute('data-footer-text') || '',
        renderHTML: attrs => ({ 'data-footer-text': attrs.footerText }),
      },
      editMode: {
        default: false,
        parseHTML: element => element.getAttribute('data-editable') !== 'false',
        renderHTML: attrs => ({
          'data-editable': attrs.editable ? 'true' : 'false',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-footer-only="true"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-footer-only': 'true',
        class: 'footer-only-container',
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FooterOnlyView);
  },

  addKeyboardShortcuts() {
    return {
      'Mod-a': ({ editor }) => {
        const { state, view } = editor;
        const { doc } = state;

        let from = null;
        let to = null;

        doc.descendants((node, pos) => {
          if (node.type.name !== 'footerOnly') {
            if (from === null || pos < from) from = pos;
            if (to === null || pos + node.nodeSize > to)
              to = pos + node.nodeSize;
          }
        });

        if (from !== null && to !== null) {
          editor.chain().focus().setTextSelection({ from, to }).run();
        }
        return true;
      },
    };
  },
});
