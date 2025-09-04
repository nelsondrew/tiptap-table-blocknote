/**
 * Removes comment marks from a TipTap editor JSON document.
 * This is useful when pasting content to prevent comment marks from being carried forward.
 *
 * @param {Object} editorJson - The TipTap document JSON to remove comment marks from.
 * @returns {Object} A deep-cloned TipTap JSON with comment marks removed.
 *
 * @example
 * Given the text node:
 * {
 *   type: "text",
 *   text: "This is a comment",
 *   marks: [{ type: "comment", attrs: { commentId: "comment-123" } }]
 * }
 *
 * Returns:
 * {
 *   type: "text",
 *   text: "This is a comment"
 * }
 */
export function removeCommentMarksFromEditorJson(editorJson) {
  if (!editorJson || typeof editorJson !== 'object') {
    return editorJson;
  }

  // Clone the input JSON to avoid mutating original
  const newJson = structuredClone(editorJson);

  // Handle content array
  if (newJson.content && Array.isArray(newJson.content)) {
    newJson.content = newJson.content.map(removeCommentMarksFromNode);
  }

  return newJson;
}

/**
 * Recursively removes comment marks from a single node and its children.
 *
 * @param {Object} node - The node to process.
 * @returns {Object} The node with comment marks removed.
 */
function removeCommentMarksFromNode(node) {
  if (!node || typeof node !== 'object') {
    return node;
  }

  // If this is a text node with marks, remove comment marks
  if (node.type === 'text' && node.marks && Array.isArray(node.marks)) {
    // Filter out comment marks
    const filteredMarks = node.marks.filter((mark) => mark.type !== 'comment');
    
    if (filteredMarks.length === 0) {
      // If no marks left, remove the marks property entirely
      delete node.marks;
    } else {
      // Update with filtered marks
      node.marks = filteredMarks;
    }
  }

  // Remove comment-related attributes from node attributes
  if (node.attrs && typeof node.attrs === 'object') {
    // Remove comment-related attributes (only the ones actually used)
    if (node.attrs['data-comment-id'] !== undefined) {
      delete node.attrs['data-comment-id'];
    }
  }

  // Recursively process content
  if (node.content && Array.isArray(node.content)) {
    node.content = node.content.map(removeCommentMarksFromNode);
  }

  return node;
}

/**
 * Removes comment marks from HTML content.
 * This is used when pasting HTML content that might contain comment-related elements.
 *
 * @param {string} html - The HTML string to clean.
 * @returns {string} The cleaned HTML string.
 */
export function removeCommentMarksFromHtml(html) {
  if (!html || typeof html !== 'string') {
    return html;
  }

  console.log('removeCommentMarksFromHtml - Input HTML:', html.substring(0, 200) + '...');

  // Check if HTML contains tables - use more conservative approach
  const hasTableContent = html.includes('<table') || html.includes('<td') || html.includes('<th');
  if (hasTableContent) {
    console.log('🔧 Table content detected - using table-safe comment removal');
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    // Remove comment-related elements and attributes
    const commentSelectors = [
      '[data-comment-id]',
      '.comment-marked'
    ];
    
    commentSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      console.log(`Found ${elements.length} elements with selector: ${selector}`);
      elements.forEach(element => {
        // Remove comment-related attributes
        const commentAttributes = [
          'data-comment-id'
        ];
        
        commentAttributes.forEach(attr => {
          if (element.hasAttribute(attr)) {
            element.removeAttribute(attr);
          }
        });
        
        // Remove comment-related classes
        const commentClasses = [
          'comment-marked',
          'inline-comment-active'
        ];
        
        commentClasses.forEach(className => {
          if (element.classList.contains(className)) {
            element.classList.remove(className);
          }
        });
        
        // If the element is a span with only comment-related content, unwrap it
        // BUT AVOID unwrapping spans inside table cells to prevent structure corruption
        if (element.tagName.toLowerCase() === 'span' && 
            element.classList.length === 0 && 
            !element.hasAttribute('style') && 
            !element.hasAttribute('class') &&
            !element.hasAttribute('id')) {
          
          // CRITICAL FIX: Check if span is inside a table cell - don't unwrap to preserve structure
          let isInTableCell = false;
          let parent = element.parentNode;
          while (parent && parent !== doc.body) {
            if (parent.tagName && (parent.tagName.toLowerCase() === 'td' || parent.tagName.toLowerCase() === 'th')) {
              isInTableCell = true;
              break;
            }
            parent = parent.parentNode;
          }
          
          if (!isInTableCell) {
            // Safe to unwrap - not in a table cell
            const parent = element.parentNode;
            while (element.firstChild) {
              parent.insertBefore(element.firstChild, element);
            }
            parent.removeChild(element);
          } else {
            console.log('🚫 Skipping span unwrap inside table cell to preserve structure');
          }
        }
      });
    });
    
    const result = doc.body.innerHTML;
    
    // Additional validation for table content to prevent corruption
    if (hasTableContent) {
      // Quick validation - ensure we didn't break table structure
      const originalTableCount = (html.match(/<table/g) || []).length;
      const resultTableCount = (result.match(/<table/g) || []).length;
      
      if (originalTableCount !== resultTableCount) {
        console.warn('⚠️ Table structure may have been corrupted during comment removal, using original HTML');
        return html;
      }
      
      console.log('✅ Table structure preserved during comment removal');
    }
    
    console.log('removeCommentMarksFromHtml - Output HTML:', result.substring(0, 200) + '...');
    return result;
  } catch (error) {
    console.warn('Error cleaning HTML content:', error);
    return html; // Return original if parsing fails
  }
}

/**
 * Sanitizes plain text content to remove any comment-related markers.
 * This is used when pasting plain text that might contain comment identifiers.
 *
 * @param {string} text - The plain text to sanitize.
 * @returns {string} The sanitized plain text.
 */
export function removeCommentMarksFromText(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Remove common comment-related patterns that might appear in plain text
  const commentPatterns = [
    /\[comment-[a-f0-9-]+\]/gi,  // [comment-12345678-1234-1234-1234-123456789012]
    /\(comment-[a-f0-9-]+\)/gi,  // (comment-12345678-1234-1234-1234-123456789012)
    /comment-[a-f0-9-]+/gi,      // comment-12345678-1234-1234-1234-123456789012
  ];

  let sanitizedText = text;
  commentPatterns.forEach(pattern => {
    sanitizedText = sanitizedText.replace(pattern, '');
  });

  // Clean up any extra whitespace that might be left
  sanitizedText = sanitizedText.replace(/\s+/g, ' ').trim();

  return sanitizedText;
} 