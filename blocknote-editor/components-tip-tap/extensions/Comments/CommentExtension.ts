import { Mark } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { DecorationSet, Decoration } from '@tiptap/pm/view';

export interface CommentOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      setComment: (commentId: string) => ReturnType;
      unsetComment: () => ReturnType;
      unsetCommentById: (commentId: string) => ReturnType;
    };
  }
}

export const Comment = Mark.create<CommentOptions & { activeCommentId?: string }>({
  name: 'comment',
  inclusive: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes.commentId) return {};
          return { 'data-comment-id': attributes.commentId };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: `span[data-comment-id]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },

  addCommands() {
    return {
      setComment:
        (commentId: string) => ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          const markType = state.schema.marks.comment;
          tr.removeMark(from, to, markType);
          const mark = markType.create({ commentId });
          tr.addMark(from, to, mark);
          dispatch(tr);
          return true;
        },

      unsetComment:
        () => ({ commands }) => {
          return commands.unsetMark('comment');
        },

    unsetCommentById:
      (commentId: string) => ({ tr, state, dispatch }) => {
        const markType = state.schema.marks.comment;
        let changed = false;

        console.log('[unsetCommentById] Called with:', commentId);

        state.doc.descendants((node, pos) => {
          node.marks?.forEach(mark => {
            if (mark.type === markType) {
              console.log('[unsetCommentById] Found mark at', pos, 'with ID:', mark.attrs.commentId);
            }

            if (mark.type === markType && mark.attrs.commentId === commentId) {
              tr.removeMark(pos, pos + node.nodeSize, markType);
              changed = true;
            }
          });
        });

        if (changed) {
          console.log('[unsetCommentById] Dispatching transaction');
          dispatch(tr);
        } else {
          console.log('[unsetCommentById] No matching marks found');
        }

        return changed;
      },
    };
  },

  addProseMirrorPlugins() {
    const key = new PluginKey('comment');
    const getActiveId = () => this.options.activeCommentId;

    return [
      new Plugin({
        key,
        props: {
          decorations: state => {
            const decorations: Decoration[] = [];
            const activeId = getActiveId();

            state.doc.descendants((node, pos) => {
              node.marks.forEach(mark => {
                if (mark.type.name === 'comment') {
                  const isActive = mark.attrs.commentId === activeId;
                  decorations.push(
                    Decoration.inline(pos, pos + node.nodeSize, {
                      class: isActive ? 'comment-marked active' : 'comment-marked',
                    }, {
                      inclusiveStart: false,
                      inclusiveEnd: false,
                    })
                  );
                }
              });
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
