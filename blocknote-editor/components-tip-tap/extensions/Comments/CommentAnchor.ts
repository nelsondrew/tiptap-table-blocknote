import { Editor } from '@tiptap/react'
import { ResolvedPos } from 'prosemirror-model'

interface CommentAnchor {
  snapshot_text: string
  node_path: number[]
  from: number
  to: number
}

export function getCommentAnchorFromSelection(editor: Editor): CommentAnchor | null {
  const { state } = editor
  const { from, to } = state.selection

  if (from === to) return null // no text selected

  const snapshot_text = state.doc.textBetween(from, to)

  const resolved = state.doc.resolve(from)

  const node_path: number[] = []

  // Traverse up from the resolved position to build the path
  for (let depth = 0; depth <= resolved.depth; depth++) {
    const index = resolved.index(depth)
    node_path.push(index)
  }

  return {
    snapshot_text,
    node_path,
    from,
    to,
  }
}