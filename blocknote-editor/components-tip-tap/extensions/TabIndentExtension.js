import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'

export const TabIndent = Extension.create({
  name: 'tabIndent',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          indent: {
            default: 0,
            renderHTML: attributes => ({
              style: `padding-left: ${attributes.indent * 2}em`,
            }),
            parseHTML: element => {
              const indent = parseInt(element.style.paddingLeft) || 0
              return indent / 2
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }) => {
        const { selection } = state
        const { ranges } = selection
        let didIndent = false
        
        ranges.forEach(({ $from, $to }) => {
          state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
            if (node.type.name === 'paragraph' || node.type.name === 'heading') {
              const indent = (node.attrs.indent || 0) + 1
              if (dispatch) {
                tr.setNodeMarkup(pos, null, {
                  ...node.attrs,
                  indent,
                })
                didIndent = true
              }
            }
          })
        })
        
        return dispatch && didIndent ? dispatch(tr) : didIndent
      },
      
      unindent: () => ({ tr, state, dispatch }) => {
        const { selection } = state
        const { ranges } = selection
        let didUnindent = false
        
        ranges.forEach(({ $from, $to }) => {
          state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
            if (node.type.name === 'paragraph' || node.type.name === 'heading') {
              const indent = Math.max((node.attrs.indent || 0) - 1, 0)
              if (dispatch) {
                tr.setNodeMarkup(pos, null, {
                  ...node.attrs,
                  indent,
                })
                didUnindent = true
              }
            }
          })
        })
        
        return dispatch && didUnindent ? dispatch(tr) : didUnindent
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('tabIndent'),
        props: {
          handleKeyDown: (view, event) => {
            if (event.key === 'Tab') {
              const { selection } = view.state
              const { $from } = selection
              
              // CRITICAL FIX: Check if we're in a table first - if so, let table handle Tab
              for (let depth = $from.depth; depth >= 0; depth--) {
                const node = $from.node(depth);
                if (node.type.name === 'tableCell' || node.type.name === 'tableHeader' || node.type.name === 'table') {
                  console.log('🚫 TabIndent: In table, skipping Tab handling');
                  return false; // Let table extensions handle Tab
                }
              }
              
              const node = selection.$head.parent
              
              if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                console.log('✅ TabIndent: Handling Tab for paragraph/heading');
                event.preventDefault()
                event.stopPropagation()
                
                if (event.shiftKey) {
                  this.editor.commands.unindent()
                } else {
                  this.editor.commands.indent()
                }
                return true
              }
            }
            return false
          },
        },
      }),
    ]
  },
}) 