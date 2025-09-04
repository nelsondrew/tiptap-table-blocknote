/**
 * Applies inline comment marks to a TipTap editor JSON document
 * based on metadata from server-side comment threads.
 *
 * @param {Object} editorJson - The TipTap document JSON to apply marks to.
 * @param {Object} chartThreads - A map of commentId => thread metadata. Each thread must contain `meta` info like `node_path`, `snapshot_text`, and optionally `occurrence`.
 * @returns {Object} A deep-cloned TipTap JSON with comment marks applied.
 *
 * @example
 * chartThreads = {
 *   "comment-123": {
 *     meta: {
 *       snapshot_text: "comment",
 *       node_path: [0, 0],
 *       occurrence: 2
 *     }
 *   }
 * }
 *
 * Given the text node:
 * {
 *   type: "text",
 *   text: "This comment is a test comment to check comment placement"
 * }
 *
 * The second "comment" would be wrapped with a mark like:
 * {
 *   type: "text",
 *   text: "comment",
 *   marks: [{ type: "comment", attrs: { commentId: "comment-123" } }]
 * }
 */
export function applyCommentMarksToEditorJson(editorJson, chartThreads = {}, currentPageId = null) {
  if (!editorJson?.content) return editorJson;

  // Clone the input JSON to avoid mutating original
  const newJson = structuredClone(editorJson);

  /**
   * Locates the target text node using the node path, and injects a comment mark
   * on the Nth occurrence of snapshotText.
   *
   * @param {number[]} nodePath - The hierarchical path to the target node in the content tree.
   * @param {string} snapshotText - The exact text to wrap with a comment mark.
   * @param {string} commentId - The ID of the comment to assign.
   * @param {number} [occurrence=1] - The Nth occurrence of the snapshot text to target.
   */
  const replaceTextWithCommentMark = (nodePath, snapshotText, commentId, occurrence = 1) => {
    try {
      let parent = newJson.content; // start at root content array
      let pathStack = [];

      // Traverse the node tree along the node path
      for (let i = 0; i < nodePath.length; i++) {
        const pathIndex = nodePath[i];
        
        if (!parent || !Array.isArray(parent) || pathIndex >= parent.length) {
          console.warn(`Invalid node path at index ${i}: pathIndex=${pathIndex}, parent.length=${parent?.length}, parent type=${Array.isArray(parent) ? 'array' : typeof parent}`);
          return;
        }

        pathStack.push({ parent, index: pathIndex }); // Save each parent/index pair
        parent = parent[pathIndex].content; // descend to next level
      }

      // Final target node: the text node to modify
      const { parent: finalParent, index: targetIndex } = pathStack[pathStack.length - 1];
      const targetNode = finalParent[targetIndex];

      // Ensure the target is a valid text node
      if (!targetNode || !targetNode.text || typeof targetNode.text !== 'string') {
        console.warn(`Invalid target node for comment ${commentId}:`, targetNode);
        return;
      }

      const text = targetNode.text;
      console.log(`Found target text node for comment ${commentId}: text length=${text.length}`);

      // Find the Nth occurrence of snapshotText
      let textIndex = -1;
      let count = 0;
      while (true) {
        textIndex = text.indexOf(snapshotText, textIndex + 1);
        if (textIndex === -1) {
          console.warn(`Text "${snapshotText}" not found in node for comment ${commentId}`);
          return; // not found
        }
        count++;
        if (count === occurrence) break;
      }

      const start = textIndex;
      const end = start + snapshotText.length;

      console.log(`Applying comment mark for "${snapshotText}" at position ${start}-${end} (occurrence ${occurrence})`);

      // Split the original text into before/marked/after segments
      const segments = [];

      if (start > 0) {
        segments.push({ type: 'text', text: text.slice(0, start) });
      }

      segments.push({
        type: 'text',
        text: text.slice(start, end),
        marks: [
          {
            type: 'comment',
            attrs: { commentId },
          },
        ],
      });

      if (end < text.length) {
        segments.push({ type: 'text', text: text.slice(end) });
      }

      // Replace the original node with the newly segmented parts
      finalParent.splice(targetIndex, 1, ...segments);
      console.log(`Successfully applied comment mark for ${commentId}`);
    } catch (err) {
      console.warn(`Failed to apply comment for ID ${commentId}`, err);
    }
  };

  /**
   * Iterate over all comment threads and apply marks based on their metadata.
   * Threads must contain: node_path, snapshot_text, and optionally occurrence.
   */
  for (const [commentId, thread] of Object.entries(chartThreads)) {
    const meta = thread?.meta;
    if (!meta || !Array.isArray(meta.node_path) || !meta.snapshot_text || (currentPageId && meta.page_id && meta.page_id !== currentPageId)) continue;

    replaceTextWithCommentMark(meta.node_path, meta.snapshot_text, commentId, meta.occurrence || 1);
  }

  return newJson;
}
