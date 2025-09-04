import { Paragraph } from '@tiptap/extension-paragraph';
import { Plugin } from 'prosemirror-state';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';

// One-liner UUID v4 generator (secure, no external deps)
const uuidv4 = () =>
  ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> (+c / 4)).toString(16)
  );

export const CustomParagraphExtension = Paragraph.extend({
  name: 'paragraph',

  addAttributes() {
    return {
      decorated: {
        default: false,
        keepOnSplit: false,
        parseHTML: element => element.hasAttribute('data-decorated'),
        renderHTML: attributes =>
          attributes.decorated ? { 'data-decorated': 'true' } : {},
      },
      id: {
        // No default here — we'll assign it dynamically via plugin
        keepOnSplit: false,
        parseHTML: element => element.getAttribute('id'),
        renderHTML: attributes => ({ id: attributes.id }),
      },
      'data-text-color': {
        default: () => 'Default',
        keepOnSplit: false,
        parseHTML: element => element.getAttribute('data-text-color') || null,
        renderHTML: attributes =>
          attributes['data-text-color']
            ? { 'data-text-color': attributes['data-text-color'] }
            : {},
      },
      'data-bg-color': {
        default: () => 'Default',
        keepOnSplit: false,
        parseHTML: element => element.getAttribute('data-bg-color') || null,
        renderHTML: attributes =>
          attributes['data-bg-color']
            ? { 'data-bg-color': attributes['data-bg-color'] }
            : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'p',
        getAttrs: dom => {
          if (typeof dom === 'string') return {};
          const element = dom as HTMLElement;
          return {
            id: element.getAttribute('id'),
            decorated: element.hasAttribute('data-decorated'),
            'data-text-color': element.getAttribute('data-text-color') || null,
            'data-bg-color': element.getAttribute('data-bg-color') || null,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', HTMLAttributes, 0];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (
          transactions: readonly Transaction[],
          oldState: EditorState,
          newState: EditorState
        ) => {
          // Prevent infinite loop from our own transaction
          if (transactions.some(tr => tr.getMeta('uuidAssigned'))) {
            return null;
          }

          const tr = newState.tr;
          let modified = false;

          newState.doc.descendants((node: ProseMirrorNode, pos: number) => {
            if (node.type.name === 'paragraph' && !node.attrs.id) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                id: uuidv4(),
              });
              modified = true;
            }
          });

          if (modified) {
            tr.setMeta('uuidAssigned', true); // prevent repeat on same change
            return tr;
          }

          return null;
        },
      }),
    ];
  },
});
