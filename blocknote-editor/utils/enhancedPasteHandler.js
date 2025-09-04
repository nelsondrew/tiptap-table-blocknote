/**
 * Enhanced Paste Handler
 * Main handler that orchestrates intelligent paste processing with footer-aware content breaking
 */

import { analyzeClipboardContent, getContentHandlingStrategy } from './pasteContentAnalyzer.js';
import { calculateFooterSpace, getCurrentPagePosition } from './calculateFooterSpace.js';
import { splitContentForPages, recombineTipTapChunks } from './contentSplitter.js';
import { insertPageBreaks } from '../components-tip-tap/PageBreakInsertion.jsx';
import { v4 as uuidv4 } from 'uuid';

/**
 * Main enhanced paste handler function
 * @param {Object} editor - TipTap editor instance
 * @param {ClipboardEvent} event - Paste event
 * @param {Object} handlers - Object containing various handler functions
 * @returns {boolean} Whether the paste was handled
 */
export function handleEnhancedPaste(editor, event, handlers = {}) {
  const {
    handleComponentDrop,
    compressImageToBase64,
    cleanWordHtml,
    removeFontSizeFromHtml,
    removeCommentMarksFromEditorJson,
    removeCommentMarksFromHtml,
    removeCommentMarksFromText,
    parentId
  } = handlers;

  console.log('🚀 Enhanced paste handler initiated');

  try {
    // Analyze clipboard content
    const analysis = analyzeClipboardContent(event);
    console.log('📋 Paste Analysis:', analysis);

    // Determine handling strategy
    const strategy = getContentHandlingStrategy(analysis);
    console.log('🎯 Handling Strategy:', strategy);

    // Route to appropriate handler
    switch (strategy) {
      case 'handle-image':
        return handleImagePaste(analysis, editor, compressImageToBase64);

      // case 'handle-tiptap-json':
      //   return handleTipTapJsonPaste(analysis, editor, handleComponentDrop, removeCommentMarksFromEditorJson, parentId);

      // case 'handle-table-content':
      //   return handleTableContentPaste(analysis, editor, cleanWordHtml, removeCommentMarksFromHtml);

      // case 'handle-with-footer-breaking':
      //   return handleFooterAwarePaste(analysis, editor, cleanWordHtml, removeFontSizeFromHtml, removeCommentMarksFromHtml, removeCommentMarksFromText);

      // case 'handle-normal':
      // default:
      //   return handleNormalPaste(analysis, editor, cleanWordHtml, removeFontSizeFromHtml, removeCommentMarksFromHtml, removeCommentMarksFromText);
    }

  } catch (error) {
    console.error('❌ Enhanced paste handler error:', error);
    // Fallback to normal paste handling
    return false;
  }
}

/**
 * Handles image paste
 */
function handleImagePaste(analysis, editor, compressImageToBase64) {
  
  const imageItem = analysis.data.imageItem;
  const file = imageItem.getAsFile();
  
  if (!file) return false;

  try {
    compressImageToBase64(file).then((base64) => {
      const { schema, tr } = editor.view.state;
      const customImageNode = schema.nodes.customImage;
    
      if (!customImageNode) {
        console.warn('customImage node not found in schema.');
        return false;
      }
    
      // Get current cursor position for smarter positioning
      const { from } = editor.state.selection;
      
      // Create image node with unique ID
      const imageId = `img-${Date.now()}_id_${uuidv4()}`;
      const imageNode = customImageNode.create({
        src: base64,
        alt: 'Compressed Pasted Image',
        id: imageId
      });
      
     
      
      editor.view.dispatch(
        tr.replaceSelectionWith(imageNode)
      );
      
      // Mark the newly inserted image and trigger smarter page break recalculation
      setTimeout(() => {
        // Find the newly inserted image and mark it
        
        const latestImgElement = document.querySelector(`[data-id="${imageId}"]`);
        
        if (latestImgElement) {
          latestImgElement.setAttribute('data-newly-inserted', 'true');
        } 
        
        // Execute page break processing
        insertPageBreaks(editor, { 
          editMode: true, 
          limit: 840,
          hasImages: true,
          newImagePosition: from
        });
        
        // Use multiple animation frames to ensure DOM updates are complete
        // This gives time for insertPageBreaks to finish its processing
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Double requestAnimationFrame ensures DOM changes are fully applied
            const markedImages = document.querySelectorAll('[data-newly-inserted="true"]');
            if (markedImages.length > 0) {
              markedImages.forEach(img => img.removeAttribute('data-newly-inserted'));
            }
          });
        });
      }, 200);
    });
    
    return true;
  } catch (error) {
    console.error('Image compression failed:', error);
    return false;
  }
}

/**
 * Handles TipTap JSON paste with charts
 */
function handleTipTapJsonPaste(analysis, editor, handleComponentDrop, removeCommentMarksFromEditorJson, parentId) {
  console.log('📋 Handling TipTap JSON paste');
  
  try {
    const parsedContent = analysis.data.parsedContent;
    const cleanedContent = removeCommentMarksFromEditorJson ? 
                          removeCommentMarksFromEditorJson(parsedContent) : 
                          parsedContent;
    
    const chartsToUpdate = [];
    const traverseNodes = (node, depth = 0) => {
      if (node.type === 'chart') {
        const generatedChartLayoutId = `CHART-${generateShortId()}`;
        chartsToUpdate.push({
          nodeId: node.attrs.nodeId,
          generatedChartLayoutId,
          attrs: node.attrs
        });

        if (handleComponentDrop) {
          const dropProps = getDropProps({
            parentId: parentId,
            chartmeta: {
              chartId: node.attrs.chartData?.chartId,
              sliceName: node?.attrs?.chartData?.sliceName
            },
            generatedId: generatedChartLayoutId,
          });
          handleComponentDrop(dropProps);
        }
      }

      if (node.content) {
        node.content.forEach(child => traverseNodes(child, depth + 1));
      }
    };

    traverseNodes(cleanedContent);
    editor.commands.setContent(cleanedContent);

    // Update chart IDs after content is set
    setTimeout(() => {
      chartsToUpdate.forEach(({ nodeId, generatedChartLayoutId }) => {
        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === 'chart' && node.attrs.nodeId === nodeId) {
            editor.chain()
              .command(({ tr }) => {
                tr.setNodeMarkup(pos, null, {
                  ...node.attrs,
                  chartLayoutId: generatedChartLayoutId
                });
                return true;
              })
              .run();
          }
        });
      });
    }, 0);

    return true;
  } catch (error) {
    console.error('TipTap JSON paste error:', error);
    return false;
  }
}

/**
 * Handles table content paste
 */
function handleTableContentPaste(analysis, editor, cleanWordHtml, removeCommentMarksFromHtml) {
  console.log('📊 Handling table content paste');
  
  let content = analysis.data.htmlContent || analysis.data.plainText;
  
  if (analysis.type === 'word-html' && cleanWordHtml) {
    content = cleanWordHtml(content);
  }
  
  if (removeCommentMarksFromHtml) {
    content = removeCommentMarksFromHtml(content);
  }
  
  editor.commands.insertContent(content);
  return true;
}

/**
 * Handles footer-aware paste with intelligent content breaking
 */
function handleFooterAwarePaste(analysis, editor, cleanWordHtml, removeFontSizeFromHtml, removeCommentMarksFromHtml, removeCommentMarksFromText) {
  console.log('📏 Handling footer-aware paste with content breaking');
  
  try {
    // Calculate available space with cursor position awareness
    const editorElement = editor.view.dom;
    
    // Get cursor position information
    const { from } = editor.state.selection;
    let cursorInfo = null;
    
    try {
      const domPos = editor.view.domAtPos(from);
      if (domPos.node) {
        // Find the closest paragraph or block element
        let cursorElement = domPos.node.nodeType === Node.TEXT_NODE ? 
                           domPos.node.parentElement : domPos.node;
        
        // Walk up to find a content element (paragraph, div, etc.)
        while (cursorElement && !['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(cursorElement.tagName)) {
          cursorElement = cursorElement.parentElement;
        }
        
        if (cursorElement) {
          cursorInfo = {
            cursorElement,
            position: from,
            elementType: cursorElement.tagName.toLowerCase()
          };
          
          console.log('📍 Cursor detected at:', {
            position: from,
            element: cursorElement.tagName,
            text: cursorElement.textContent?.substring(0, 30) + '...'
          });
        }
      }
    } catch (error) {
      console.warn('Could not detect cursor position:', error);
    }
    
    const spaceInfo = calculateFooterSpace(editorElement, 840, cursorInfo);
    
    
    // If very little space available, use standard page size
    const firstPageSpace = spaceInfo.availableSpace < 100 ? 840 : spaceInfo.availableSpace;
    const subsequentPageSpace = 840;
    
    // Split content into chunks
    const chunks = splitContentForPages(analysis, firstPageSpace, subsequentPageSpace, editorElement);
    
    if (chunks.length === 0) {
      console.warn('⚠️ No chunks generated, falling back to normal paste');
      return handleNormalPaste(analysis, editor, cleanWordHtml, removeFontSizeFromHtml, removeCommentMarksFromHtml, removeCommentMarksFromText);
    }
    
    console.log(`📦 Generated ${chunks.length} content chunks`);
    
    // Insert chunks
    if (analysis.type === 'tiptap-json') {
      // For TipTap JSON, recombine chunks and set content
      const document = recombineTipTapChunks(chunks);
      const cleanedContent = removeCommentMarksFromEditorJson ? 
                            removeCommentMarksFromEditorJson(document) : 
                            document;
      editor.commands.setContent(cleanedContent);
    } else {
      // For HTML/text content, insert each chunk as separate content
      chunks.forEach((chunk, index) => {
        let processedChunk = chunk;
        
        // Clean content based on type
        if (analysis.type === 'word-html' && cleanWordHtml) {
          processedChunk = cleanWordHtml(processedChunk);
        } else if (analysis.type === 'html' && removeFontSizeFromHtml) {
          // Apply font cleaning to regular HTML content too
          processedChunk = removeFontSizeFromHtml(processedChunk);
        }
        
        if (removeCommentMarksFromHtml && (analysis.type === 'html' || analysis.type === 'word-html')) {
          processedChunk = removeCommentMarksFromHtml(processedChunk);
        }
        
        if (removeCommentMarksFromText && analysis.type === 'plain-text') {
          processedChunk = removeCommentMarksFromText(processedChunk);
        }
        
        // Insert content
        if (index === 0) {
          editor.commands.insertContent(processedChunk);
        } else {
          // Insert as new paragraph for subsequent chunks
          editor.commands.insertContent('<br>' + processedChunk);
        }
        
        console.log(`✅ Inserted chunk ${index + 1}/${chunks.length}`);
      });
    }
    
    // Trigger page break recalculation after a short delay
    setTimeout(() => {
      insertPageBreaks(editor, { editMode: true });
    }, 100);
    
    return true;
    
  } catch (error) {
    console.error('❌ Footer-aware paste error:', error);
    // Fallback to normal paste
    return handleNormalPaste(analysis, editor, cleanWordHtml, removeFontSizeFromHtml, removeCommentMarksFromHtml, removeCommentMarksFromText);
  }
}

/**
 * Handles normal paste without footer-aware breaking
 */
function handleNormalPaste(analysis, editor, cleanWordHtml, removeFontSizeFromHtml, removeCommentMarksFromHtml, removeCommentMarksFromText) {
  console.log('✨ Handling normal paste');
  
  try {
    let content;
    
    switch (analysis.type) {
      case 'word-html':
        content = analysis.data.htmlContent;
        if (cleanWordHtml) {
          content = cleanWordHtml(content);
        }
        if (removeCommentMarksFromHtml) {
          content = removeCommentMarksFromHtml(content);
        }
        break;
        
      case 'html':
        content = analysis.data.htmlContent;
        if (removeFontSizeFromHtml) {
          content = removeFontSizeFromHtml(content);
        }
        if (removeCommentMarksFromHtml) {
          content = removeCommentMarksFromHtml(content);
        }
        break;
        
      case 'plain-text':
        content = analysis.data.plainText;
        if (removeCommentMarksFromText) {
          content = removeCommentMarksFromText(content);
        }
        break;
        
      default:
        console.warn('Unknown content type for normal paste:', analysis.type);
        return false;
    }
    
    editor.commands.insertContent(content);
    return true;
    
  } catch (error) {
    console.error('❌ Normal paste error:', error);
    return false;
  }
}

/**
 * Helper function to generate short IDs (like shortid.generate())
 */
function generateShortId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Helper function to get drop properties for charts
 */
function getDropProps({ parentId, chartmeta, generatedId }) {
  return {
    parentId,
    chartmeta,
    generatedId,
    // Add other properties as needed
  };
} 