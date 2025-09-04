/**
* Paste Content Analyzer
* Analyzes clipboard content to determine appropriate handling strategy
*/
 
/**
* Analyzes clipboard content from paste event
* @param {ClipboardEvent} event - The paste event
* @returns {Object} Analysis result with content type and handling recommendations
*/
export function analyzeClipboardContent(event) {
  const clipboardData = event.clipboardData;
  if (!clipboardData) {
    return { type: 'unknown', needsFooterHandling: false };
  }
 
  const tiptapJson = clipboardData.getData('application/x-tiptap-document');
  const htmlContent = clipboardData.getData('text/html');
  const plainText = clipboardData.getData('text/plain');
  const items = Array.from(clipboardData.items || []);
  
 
  // Check for TipTap JSON first (highest priority)
  if (tiptapJson) {
    try {
      const parsedContent = JSON.parse(tiptapJson);
      if (parsedContent.type === 'doc') {
        const analysis = analyzeTipTapContent(parsedContent);
        return {
          type: 'tiptap-json',
          needsFooterHandling: analysis.hasLongText && !analysis.hasCharts && !analysis.hasTables,
          hasCharts: analysis.hasCharts,
          hasTables: analysis.hasTables,
          hasLongText: analysis.hasLongText,
          data: { parsedContent }
        };
      }
    } catch (e) {
      console.warn('Failed to parse TipTap JSON:', e);
    }
  }
 
  // Check for JSON in plain text
  if (plainText && plainText.trim().startsWith('{')) {
    try {
      const parsedContent = JSON.parse(plainText);
      if (parsedContent.type === 'doc') {
        const analysis = analyzeTipTapContent(parsedContent);
        return {
          type: 'tiptap-json',
          needsFooterHandling: analysis.hasLongText && !analysis.hasCharts && !analysis.hasTables,
          hasCharts: analysis.hasCharts,
          hasTables: analysis.hasTables,
          hasLongText: analysis.hasLongText,
          data: { parsedContent }
        };
      }
    } catch (e) {
      // Not JSON, continue with other checks
    }
  }
 
    // Check for images FIRST (before HTML) - higher priority
  const imageItem = items.find(item => item.type.startsWith('image/'));
  if (imageItem) {
    // If there's an image plus simple HTML that's just an img tag, treat as image
    if (htmlContent && htmlContent.trim().match(/^<img[^>]*>$/i)) {
      return {
        type: 'image',
        needsFooterHandling: false,
        data: { imageItem }
      };
    }
    // If there's an image but no substantial text content, treat as image
    if (!plainText || plainText.trim().length < 200) {
      return {
        type: 'image',
        needsFooterHandling: false,
        data: { imageItem }
      };
    }
  }

  // Check for Word HTML content
  if (htmlContent && (htmlContent.includes('mso-') || htmlContent.includes('<o:p>') || htmlContent.includes('class="MsoNormal"'))) {
    const analysis = analyzeHtmlContent(htmlContent);
    return {
      type: 'word-html',
      needsFooterHandling: shouldUseFooterHandling(analysis),
      ...analysis,
      data: { htmlContent }
    };
  }

  // Check for regular HTML content
  if (htmlContent) {
    const analysis = analyzeHtmlContent(htmlContent);
    return {
      type: 'html',
      needsFooterHandling: shouldUseFooterHandling(analysis),
      ...analysis,
      data: { htmlContent }
    };
  }
 
  // Check for plain text
  if (plainText) {
    const analysis = analyzePlainText(plainText);
    return {
      type: 'plain-text',
      needsFooterHandling: shouldUseFooterHandling(analysis),
      ...analysis,
      data: { plainText }
    };
  }
 

 
  return { type: 'unknown', needsFooterHandling: false };
}
 
/**
* Analyzes TipTap JSON content structure
* @param {Object} content - Parsed TipTap JSON content
* @returns {Object} Analysis result
*/
function analyzeTipTapContent(content) {
  let hasCharts = false;
  let hasTables = false;
  let totalTextLength = 0;
  let longestParagraphLength = 0;
  let paragraphCount = 0;
 
  const traverseNodes = (node) => {
    if (node.type === 'chart') {
      hasCharts = true;
    }
    if (node.type === 'table') {
      hasTables = true;
    }
    if (node.type === 'paragraph' && node.content) {
      paragraphCount++;
      let paragraphText = '';
      node.content.forEach(child => {
        if (child.type === 'text') {
          paragraphText += child.text || '';
        }
      });
      const paragraphLength = paragraphText.length;
      totalTextLength += paragraphLength;
      longestParagraphLength = Math.max(longestParagraphLength, paragraphLength);
    }
 
    if (node.content) {
      node.content.forEach(child => traverseNodes(child));
    }
  };
 
  traverseNodes(content);
 
  return {
    hasCharts,
    hasTables,
    totalTextLength,
    longestParagraphLength,
    paragraphCount,
    hasMultipleParagraphs: paragraphCount > 1,
    hasLongText: longestParagraphLength > 300 || totalTextLength > 800
  };
}
 
/**
* Analyzes HTML content structure
* @param {string} htmlContent - HTML content string
* @returns {Object} Analysis result
*/
function analyzeHtmlContent(htmlContent) {
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
 
  // Check for tables
  const hasTables = tempDiv.querySelectorAll('table').length > 0;
 
  // Check for images and charts
  const hasImages = tempDiv.querySelectorAll('img').length > 0;
  const hasCharts = tempDiv.querySelectorAll('canvas, svg').length > 0;
 
  // Find paragraph-like elements
  const paragraphElements = tempDiv.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li');
  const paragraphCount = paragraphElements.length;
 
  let totalTextLength = 0;
  let longestParagraphLength = 0;
  const paragraphLengths = [];
 
  paragraphElements.forEach(el => {
    const text = el.textContent || '';
    const length = text.trim().length;
    if (length > 0) {
      totalTextLength += length;
      longestParagraphLength = Math.max(longestParagraphLength, length);
      paragraphLengths.push(length);
    }
  });
 
  // If no structured elements found, treat entire content as one paragraph
  if (paragraphElements.length === 0) {
    const text = tempDiv.textContent || '';
    totalTextLength = text.trim().length;
    longestParagraphLength = totalTextLength;
    paragraphLengths.push(totalTextLength);
  }
 
  // Calculate structure quality
  const shortParagraphs = paragraphLengths.filter(len => len < 300).length;
  const hasGoodStructure = paragraphLengths.length > 0 && (shortParagraphs / paragraphLengths.length) > 0.5;
 
  return {
    hasTables,
    hasCharts: hasCharts || hasImages, // Treat images as charts for processing purposes
    hasImages,
    totalTextLength,
    longestParagraphLength,
    paragraphCount: Math.max(paragraphCount, 1),
    hasMultipleParagraphs: paragraphCount > 1,
    hasLongText: longestParagraphLength > 300,
    hasGoodStructure,
    paragraphLengths
  };
}
 
/**
* Analyzes plain text content structure
* @param {string} plainText - Plain text content
* @returns {Object} Analysis result
*/
function analyzePlainText(plainText) {
  const text = plainText.trim();
  const totalTextLength = text.length;
 
  // Split by double newlines to detect paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;
 
  let longestParagraphLength = 0;
  const paragraphLengths = paragraphs.map(p => {
    const length = p.trim().length;
    longestParagraphLength = Math.max(longestParagraphLength, length);
    return length;
  });
 
  // If no paragraph breaks found, treat as single paragraph
  if (paragraphCount === 1 && paragraphs[0] === text) {
    // Check for single line breaks that might indicate structure
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 1) {
      // Treat each line as a potential paragraph
      const lineLengths = lines.map(line => line.trim().length);
      const shortLines = lineLengths.filter(len => len < 200).length;
      const hasGoodStructure = (shortLines / lineLengths.length) > 0.5;
      
      return {
        hasTables: false,
        hasCharts: false,
        totalTextLength,
        longestParagraphLength: Math.max(...lineLengths),
        paragraphCount: lines.length,
        hasMultipleParagraphs: lines.length > 1,
        hasLongText: Math.max(...lineLengths) > 300,
        hasGoodStructure,
        paragraphLengths: lineLengths
      };
    }
  }
 
  // Calculate structure quality
  const shortParagraphs = paragraphLengths.filter(len => len < 300).length;
  const hasGoodStructure = paragraphLengths.length > 0 && (shortParagraphs / paragraphLengths.length) > 0.5;
 
  return {
    hasTables: false,
    hasCharts: false,
    totalTextLength,
    longestParagraphLength,
    paragraphCount,
    hasMultipleParagraphs: paragraphCount > 1,
    hasLongText: longestParagraphLength > 300,
    hasGoodStructure,
    paragraphLengths
  };
}
 
/**
* Determines if content should use footer-aware handling
* @param {Object} analysis - Content analysis result
* @returns {boolean} Whether to use footer-aware handling
*/
function shouldUseFooterHandling(analysis) {
  // Don't use footer handling for tables or charts
  if (analysis.hasTables || analysis.hasCharts) {
    return false;
  }
 
  // Use footer handling for very long single paragraphs
  if (analysis.longestParagraphLength > 800) {
    return true;
  }
 
  // Use footer handling for large content without good structure
  if (analysis.totalTextLength > 1500 && !analysis.hasGoodStructure) {
    return true;
  }
 
  // Don't use footer handling for well-structured content with short paragraphs
  if (analysis.hasMultipleParagraphs && analysis.hasGoodStructure) {
    return false;
  }
 
  // Use footer handling for moderately long content without clear structure
  if (analysis.totalTextLength > 500 && !analysis.hasMultipleParagraphs) {
    return true;
  }
 
  return false;
}
 
/**
* Determines the appropriate content handling strategy
* @param {Object} analysis - Content analysis result
* @returns {string} Handling strategy name
*/
export function getContentHandlingStrategy(analysis) {
  switch (analysis.type) {
    case 'image':
      return 'handle-image';
    
    case 'tiptap-json':
      if (analysis.hasCharts || analysis.hasTables) {
        return 'handle-tiptap-json';
      }
      return analysis.needsFooterHandling ? 'handle-with-footer-breaking' : 'handle-normal';
    
    case 'word-html':
    case 'html':
      // For HTML content with images/charts, use table content handling
      if (analysis.hasTables || analysis.hasCharts || analysis.hasImages) {
        return 'handle-table-content';
      }
      return analysis.needsFooterHandling ? 'handle-with-footer-breaking' : 'handle-normal';
    
    case 'plain-text':
      return analysis.needsFooterHandling ? 'handle-with-footer-breaking' : 'handle-normal';
    
    default:
      return 'handle-normal';
  }
}