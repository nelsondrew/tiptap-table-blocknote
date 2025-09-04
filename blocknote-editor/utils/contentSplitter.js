/**
 * Content Splitter
 * Intelligently splits content into chunks that fit within page constraints
 */

import { estimateTextHeight, contentFitsInSpace } from './calculateFooterSpace.js';

/**
 * Splits text content into chunks that fit within available space
 * @param {string} text - Text content to split
 * @param {number} firstPageSpace - Available space on first/current page
 * @param {number} subsequentPageSpace - Available space on subsequent pages (default: 840px)
 * @param {HTMLElement} referenceElement - Reference element for styling
 * @returns {string[]} Array of text chunks
 */
export function splitTextForPages(text, firstPageSpace, subsequentPageSpace = 840, referenceElement = null) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks = [];
  let remainingText = text.trim();
  let isFirstChunk = true;

  while (remainingText.length > 0) {
    const availableSpace = isFirstChunk ? firstPageSpace : subsequentPageSpace;
    
    // If available space is too small, skip to next page
    if (availableSpace < 50) {
      isFirstChunk = false;
      continue;
    }

    const chunk = findOptimalTextChunk(remainingText, availableSpace, referenceElement);
    
    if (chunk.length === 0) {
      // If we can't fit anything, force at least one word to prevent infinite loop
      const firstWord = remainingText.split(/\s+/)[0] || remainingText;
      chunks.push(firstWord);
      remainingText = remainingText.substring(firstWord.length).trim();
    } else {
      chunks.push(chunk);
      remainingText = remainingText.substring(chunk.length).trim();
    }
    
    isFirstChunk = false;
    
    // Safety check to prevent infinite loops
    if (chunks.length > 50) {
      break;
    }
  }
  return chunks;
}

/**
 * Finds the optimal text chunk that fits in available space
 * @param {string} text - Text to analyze
 * @param {number} availableSpace - Available space in pixels
 * @param {HTMLElement} referenceElement - Reference element for styling
 * @returns {string} Optimal text chunk
 */
function findOptimalTextChunk(text, availableSpace, referenceElement) {
  // If the entire text fits, return it
  if (contentFitsInSpace(text, availableSpace, referenceElement, 'text')) {
    return text;
  }

  // Use binary search to find the optimal chunk size
  const words = text.split(/(\s+)/); // Split preserving whitespace
  let left = 0;
  let right = words.length;
  let bestChunk = '';

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const chunk = words.slice(0, mid + 1).join('');
    
    if (contentFitsInSpace(chunk, availableSpace, referenceElement, 'text')) {
      bestChunk = chunk;
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  // If no words fit, try character-based splitting (for very long words)
  if (bestChunk.length === 0 && words.length > 0) {
    const firstWord = words[0];
    if (firstWord.length > 50) { // Only split very long words
      bestChunk = findOptimalCharacterChunk(firstWord, availableSpace, referenceElement);
    }
  }

  // Ensure we don't split in the middle of a word
  bestChunk = bestChunk.replace(/\s+$/, ''); // Remove trailing whitespace
  
  return bestChunk;
}

/**
 * Finds optimal character-level chunk for very long words
 * @param {string} word - Long word to split
 * @param {number} availableSpace - Available space in pixels
 * @param {HTMLElement} referenceElement - Reference element for styling
 * @returns {string} Character chunk with hyphen
 */
function findOptimalCharacterChunk(word, availableSpace, referenceElement) {
  let left = 1;
  let right = word.length;
  let bestChunk = '';

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const chunk = word.substring(0, mid) + '-';
    
    if (contentFitsInSpace(chunk, availableSpace, referenceElement, 'text')) {
      bestChunk = chunk;
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return bestChunk;
}

/**
 * Splits HTML content into paragraph chunks
 * @param {string} htmlContent - HTML content to split
 * @param {number} firstPageSpace - Available space on first page
 * @param {number} subsequentPageSpace - Available space on subsequent pages
 * @param {HTMLElement} referenceElement - Reference element for styling
 * @returns {string[]} Array of HTML paragraph chunks
 */
export function splitHtmlForPages(htmlContent, firstPageSpace, subsequentPageSpace = 840, referenceElement = null) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  // Find all paragraph-like elements
  const paragraphElements = tempDiv.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li');
  const chunks = [];
  let currentPageSpace = firstPageSpace;


  for (let i = 0; i < paragraphElements.length; i++) {
    const element = paragraphElements[i];
    const elementHtml = element.outerHTML;
    const elementText = element.textContent || '';

    // Check if element fits in current page
    if (contentFitsInSpace(elementText, currentPageSpace, referenceElement, 'html')) {
      // Element fits, add it as-is
      chunks.push(elementHtml);
    } else {
      // Element doesn't fit, need to split or move to next page
      if (elementText.length > 800) {
        // Check if element has links before splitting
        const hasLinks = element.querySelectorAll('a[href]').length > 0;
        
        if (hasLinks) {
          // If element has links, don't split to preserve link structure
          chunks.push(elementHtml);
        } else {
          // Split long paragraph (no links to preserve)
          const textChunks = splitTextForPages(elementText, currentPageSpace, subsequentPageSpace, referenceElement);
          
          // Wrap each chunk in the same element type
          textChunks.forEach((chunk, chunkIndex) => {
            const newElement = element.cloneNode(false); // Clone without children
            newElement.textContent = chunk;
            chunks.push(newElement.outerHTML);
          });
        }
      } else {
        // Move entire element to next page
        chunks.push(elementHtml);
      }
    }

    // Update available space for next element
    currentPageSpace = subsequentPageSpace;
  }

  // If no structured elements found, check for links before falling back to plain text
  if (paragraphElements.length === 0) {
    // Check if the content has links - if so, preserve the HTML structure
    const hasLinks = tempDiv.querySelectorAll('a[href]').length > 0;
    
    if (hasLinks) {
      // Wrap the entire HTML content in a paragraph to preserve links
      const htmlContent = tempDiv.innerHTML.trim();
      if (htmlContent) {
        // Check if content fits in first page, if not split it
        if (contentFitsInSpace(htmlContent, firstPageSpace, referenceElement, 'html')) {
          return [`<p>${htmlContent}</p>`];
        } else {
          // For now, put it all in a paragraph - more sophisticated splitting could be added later
          return [`<p>${htmlContent}</p>`];
        }
      }
    } else {
      // No links, safe to use plain text approach
      const plainText = tempDiv.textContent || '';
      if (plainText.trim()) {
        const textChunks = splitTextForPages(plainText, firstPageSpace, subsequentPageSpace, referenceElement);
        return textChunks.map(chunk => `<p>${chunk}</p>`);
      }
    }
  }

  return chunks;
}

/**
 * Intelligently splits content based on its type and structure
 * @param {Object} analysis - Content analysis from pasteContentAnalyzer
 * @param {number} firstPageSpace - Available space on first page
 * @param {number} subsequentPageSpace - Available space on subsequent pages
 * @param {HTMLElement} referenceElement - Reference element for styling
 * @returns {string[]} Array of content chunks
 */
export function splitContentForPages(analysis, firstPageSpace, subsequentPageSpace = 840, referenceElement = null) {


  switch (analysis.type) {
    case 'html':
    case 'word-html':
      return splitHtmlForPages(analysis.data.htmlContent, firstPageSpace, subsequentPageSpace, referenceElement);
    
    case 'plain-text':
      const textChunks = splitTextForPages(analysis.data.plainText, firstPageSpace, subsequentPageSpace, referenceElement);
      return textChunks.map(chunk => `<p>${chunk}</p>`);
    
    case 'tiptap-json':
      // For TipTap JSON, we need to analyze the structure and split accordingly
      return splitTipTapJsonForPages(analysis.data.parsedContent, firstPageSpace, subsequentPageSpace, referenceElement);
    
    default:
      return [];
  }
}

/**
 * Splits TipTap JSON content into chunks
 * @param {Object} jsonContent - Parsed TipTap JSON
 * @param {number} firstPageSpace - Available space on first page
 * @param {number} subsequentPageSpace - Available space on subsequent pages
 * @param {HTMLElement} referenceElement - Reference element for styling
 * @returns {Object[]} Array of TipTap node chunks
 */
function splitTipTapJsonForPages(jsonContent, firstPageSpace, subsequentPageSpace, referenceElement) {
  const chunks = [];
  let currentPageSpace = firstPageSpace;

  if (!jsonContent.content) {
    return chunks;
  }

  console.log(`📋 Splitting TipTap JSON: ${jsonContent.content.length} nodes`);

  for (let i = 0; i < jsonContent.content.length; i++) {
    const node = jsonContent.content[i];

    if (node.type === 'paragraph' && node.content) {
      // Extract text from paragraph node
      let paragraphText = '';
      node.content.forEach(child => {
        if (child.type === 'text') {
          paragraphText += child.text || '';
        }
      });

      // Check if paragraph fits
      if (contentFitsInSpace(paragraphText, currentPageSpace, referenceElement, 'text')) {
        chunks.push(node);
        console.log(`📦 TipTap paragraph ${i + 1} fits: ${paragraphText.length} chars`);
      } else if (paragraphText.length > 800) {
        // Split long paragraph
        const textChunks = splitTextForPages(paragraphText, currentPageSpace, subsequentPageSpace, referenceElement);
        
        textChunks.forEach((chunk, chunkIndex) => {
          const newNode = {
            type: 'paragraph',
            content: [{
              type: 'text',
              text: chunk
            }]
          };
          chunks.push(newNode);
          console.log(`📦 Split TipTap paragraph ${i + 1}.${chunkIndex + 1}: ${chunk.length} chars`);
        });
      } else {
        // Move entire paragraph to next page
        chunks.push(node);
        console.log(`📦 TipTap paragraph ${i + 1} moved to next page: ${paragraphText.length} chars`);
      }
    } else {
      // Non-paragraph nodes (headings, lists, etc.) - add as-is
      chunks.push(node);
      console.log(`📦 TipTap node ${i + 1} (${node.type}) added as-is`);
    }

    // Update available space for next node
    currentPageSpace = subsequentPageSpace;
  }

  console.log(`✅ TipTap JSON split into ${chunks.length} chunks`);
  return chunks;
}

/**
 * Recombines chunks into TipTap document structure
 * @param {Object[]} chunks - Array of TipTap node chunks
 * @returns {Object} Complete TipTap document
 */
export function recombineTipTapChunks(chunks) {
  return {
    type: 'doc',
    content: chunks
  };
} 