
import { Node, mergeAttributes } from '@tiptap/core';
import { Fragment } from 'prosemirror-model'
import { ReactNodeViewRenderer } from '@tiptap/react'
import PageBreakView from './PageBreakView'

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      marginTop: {
        default: '0px',
        parseHTML: element => element.style.marginTop || '0px',
        renderHTML: attrs => ({ style: `margin-top: ${attrs.marginTop}` }),
      },
      headerText: {
        default: 'Header',
        parseHTML: element => element.getAttribute('data-header-text') || 'Header',
        renderHTML: attrs => ({ 'data-header-text': attrs.headerText }),
      },
      footerText: {
        default: 'Footer',
        parseHTML: element => element.getAttribute('data-footer-text') || 'Footer',
        renderHTML: attrs => ({ 'data-footer-text': attrs.footerText }),
      },
      editMode: {
      default: false,
      parseHTML: element =>
        element.getAttribute('data-editable') !== 'false', // parse from string
      renderHTML: attrs => ({
        'data-editable': attrs.editable ? 'true' : 'false',
      }),
    },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-page-break]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-page-break': 'true',
        class: 'page-break-container',
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(PageBreakView)
  },

  addCommands() {
    return {
      deleteAllPageBreaks: () => ({ state, dispatch }: any) => {
        const { doc, tr } = state
        const positionsToDelete: { from: number; to: number }[] = []

        doc.descendants((node: any, pos: any) => {
          if (node.type.name === 'pageBreak') {
            positionsToDelete.push({ from: pos, to: pos + node.nodeSize })
          }
        })

        positionsToDelete.reverse().forEach(({ from, to }) => {
          tr.replaceWith(from, to, Fragment.empty)
        })

        if (positionsToDelete.length && dispatch) {
          dispatch(tr)
          return true
        }

        return false
      },

      updateAllHeaderFooterTexts:
        (footerText: string, headerText: string) =>
        ({ state, dispatch, tr }: any) => {
          const { doc } = state

          doc.descendants((node: any, pos: any) => {
            if (node.type.name === 'pageBreak') {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                footerText,
                headerText,
              })
            }
          })

          if (dispatch) {
            dispatch(tr)
          }

          return true
        },
    }
  },
})
