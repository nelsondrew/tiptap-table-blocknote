import { updateBgColor } from '../Components/updateBgColor';
import { FALSE_STRING } from "src/utils/common";
import { Fragment } from 'prosemirror-model'
import { newEvent } from 'src/components/ListView/utils';

/**
 * Handles content overflow when Enter key creates layout issues
 */
function handleEnterKeyOverflow(editor, limit) {
  console.log('⏎ Checking for Enter key overflow issues...');
  
  try {
    const allTopLevelEditors = document.querySelectorAll('.ProseMirror.top-level-editor');
    const otherPageEditor = allTopLevelEditors.length > 1 ? allTopLevelEditors[1] : allTopLevelEditors[0];
    
    if (!otherPageEditor) return;
    
    const allElements = Array.from(otherPageEditor.children).filter(el => 
      !el.classList.contains('footer-only-container') && 
      !el.closest('.node-footerOnly') &&
      !el.classList.contains('page-break-container')
    );
    
    let currentPageHeight = 0;
    let hasOverflow = false;
    
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      const elementHeight = element.offsetHeight;
      
      // Check if adding this element would exceed page limit
      if (currentPageHeight + elementHeight > limit) {
        hasOverflow = true;
        break;
      }
      
      currentPageHeight += elementHeight;
    }
    
    if (hasOverflow) {
      setTimeout(() => {
        insertPageBreaks(editor, { 
          editMode: true, 
          limit: limit,
          triggeredByEnter: false // Prevent infinite recursion
        });
      }, 100);
    } else {
    }
  } catch (error) {
    console.error('⏎ Error in handleEnterKeyOverflow:', error);
  }
}

// Function to check if editor is in a cover page context
export function isCoverPageEditor(editor) {
  if (!editor || !editor.view || !editor.view.dom) {
    return false;
  }
  
  const editorElement = editor.view.dom;
  
  if(editor.view.dom.closest('.blocknote-editor').classList.contains('cover-page')) {
    return true;
  }
  let editors = document.querySelectorAll('.top-level-editor')
  if(editors.length > 1) {
    let topLevelPageId = document.querySelectorAll('.top-level-editor')[0].closest('.editor-container').id
    let currentEditorId = editor.view.dom.closest('.editor-container').id
    return topLevelPageId === currentEditorId
  }
  
  return false;
}

export function handleFooterOnlyPositioning(containerHeight) {
  const container = document.querySelector('.editor-container');
  const footer = document.querySelector('.node-footerOnly .footer-only-container');  
  if(container && footer) {
    const containerRect = container.getBoundingClientRect();
    footer.style.position = 'absolute';
    footer.style.top = `${containerHeight - footer.offsetHeight}px`;
    footer.style.marginTop = '0px';
  }
}

export function createFooterAndHandleFooterPositioning(editor, editMode, containerHeight) {
  return ;
  let selector = '.ProseMirror.top-level-editor > *';
  const currentState = editor.view.state;
    const currentDoc = currentState.doc;
    const footerOnlyNode = currentState.schema.nodes.footerOnly;
    let isFooterOnlyAvailable = document.querySelector('.node-footerOnly .footer-only-container')
    if (footerOnlyNode && !isFooterOnlyAvailable) {
      // Calculate current content height and determine spacing needed
        let allTopLevelEditors = document.querySelectorAll('.ProseMirror.top-level-editor')
       let otherPageEditor = allTopLevelEditors[0]
       if(allTopLevelEditors.length > 1) {
         otherPageEditor = allTopLevelEditors[1]
       }
       
       // Get all first-level child elements of the selected editor
       const updatedElements = Array.from(otherPageEditor.children);
      const updatedNodes = [...currentDoc.content.content];
      
      let lastPageBreakIndex = -1;
      let footerPosition = 0;
      let nodePos = 0;
      
      // Find the last page break
      for (let i = 0; i < updatedNodes.length; i++) {
        if (updatedNodes[i].type.name === 'pageBreak') {
          lastPageBreakIndex = i;
        }
        if (i === updatedNodes.length - 1) {
          footerPosition = nodePos + updatedNodes[i].nodeSize;
        }
        nodePos += updatedNodes[i].nodeSize;
      }
      const footerTr = editor.view.state.tr.insert(
        footerPosition,
        footerOnlyNode.create({ 
          editMode: editMode,
          marginTop: '0px'
        })
      );
      
      if (footerTr.docChanged) {
        editor.view.dispatch(footerTr);
      }
      handleFooterOnlyPositioning(containerHeight)
    } else if(isFooterOnlyAvailable){
      handleFooterOnlyPositioning(containerHeight)
    }
}

export function insertPageBreaks(editor, options = {}) {
  return ;
  if (!editor || !editor.view || !editor.state) return;

  const {
    limit = 840,
    selector = '.ProseMirror.top-level-editor > *',
    isPreviewMode = true,
    slideBgColor,
    coverImage,
    editMode = false,
    isCoverPage = false,
    triggeredByEnter = false, // New flag to indicate if triggered by Enter key
  } = options;

  // Check if this is a cover page editor
  const isActuallyCoverPage = isCoverPage || isCoverPageEditor(editor);

  // Skip page break insertion for cover pages
  if (isActuallyCoverPage) {
    // Only call updateBgColor for cover pages, no page breaks
    setTimeout(() => { updateBgColor(slideBgColor, coverImage)}, 100);
    return;
  }

  editor.commands.deleteAllPageBreaks();

  // If triggered by Enter key, we need to be more aggressive about splitting content
  if (triggeredByEnter) {
    console.log('⏎ Enhanced recalculation triggered by Enter key - using aggressive splitting');
  }

  const INITIAL_CUMULATIVE_HEIGHT = 0;

  const { state } = editor.view;
  const { doc, schema } = state;
  const pageBreak = schema.nodes.pageBreak;
  const topLevelNodes = [...doc.content.content];
  let allTopLevelEditors = document.querySelectorAll('.ProseMirror.top-level-editor')
  let otherPageEditor = allTopLevelEditors[0]
  if(allTopLevelEditors.length > 1) {
    otherPageEditor = allTopLevelEditors[1]
  }
  
  // Get all first-level child elements of the selected editor
  const nodeElements = Array.from(otherPageEditor.children);

  if (nodeElements.length !== topLevelNodes.length) {
    console.warn('Mismatch between DOM nodes and document nodes', {
      dom: nodeElements.length,
      doc: topLevelNodes.length,
    });
  }

  let cumulativeHeight = INITIAL_CUMULATIVE_HEIGHT;
  const insertions = [];
  const pageBreakMarginTop = [];
  let pos = 0;

  for (let i = 0; i < topLevelNodes.length; i++) {
    const el = nodeElements[i];
    if (!el) continue;

    const style = getComputedStyle(el);
    const marginTop = parseFloat(style.marginTop) || 0;
    const marginBottom = parseFloat(style.marginBottom) || 0;
    
    // Calculate margin collapse with previous element
    let effectiveMarginTop = marginTop;
    if (i > 0) {
      const prevEl = nodeElements[i - 1];
      if (prevEl) {
        const prevStyle = getComputedStyle(prevEl);
        const prevMarginBottom = parseFloat(prevStyle.marginBottom) || 0;
        
        // Margin collapse: use the larger of the two adjacent margins
        effectiveMarginTop = Math.max(marginTop, prevMarginBottom) - prevMarginBottom;
      }
    }
    
    const height = el.offsetHeight + effectiveMarginTop + marginBottom;
    const nodeSize = topLevelNodes[i].nodeSize;
    const isFirstElement = i === 0;
    const heightWithTitle = cumulativeHeight + height;
    
    // Check if this is an image that was just inserted and handle content reflow
    const isImage = el.querySelector('img') || el.classList.contains('custom-image') || topLevelNodes[i]?.type?.name === 'customImage';
    const isNewlyInsertedImage = isImage && el.getAttribute('data-newly-inserted') === 'true';

    // FIRST ELEMENT EXCEPTION: Let it overflow if it's too tall, but add break AFTER
    if (isFirstElement && heightWithTitle > limit) {
      cumulativeHeight = 0; // reset for the next page
      insertions.push(pos + nodeSize); // break after
      pageBreakMarginTop.push(0);
      pos += nodeSize;
      continue;
    }

    // If the node itself is too tall for the page
    if (height > limit) {
      insertions.push(pos); // Break before
      let beforeMTop = limit - cumulativeHeight
      pageBreakMarginTop.push(beforeMTop);

      insertions.push(pos + nodeSize); // Break after
      pageBreakMarginTop.push(0);

      cumulativeHeight = 0;
      pos += nodeSize;
      continue;
    }

    // Special handling for images and large elements
    if (isImage && cumulativeHeight > 0) {
      const availableSpace = limit - cumulativeHeight;
      
      // More intelligent image fitting logic
      if (height > availableSpace) {
        // Image doesn't fit at all - move to new page
        insertions.push(pos); // Break before image
        pageBreakMarginTop.push(limit - cumulativeHeight);
        cumulativeHeight = 0;
      } else if (height > availableSpace * 0.7 && availableSpace < 200) {
        // Image technically fits but would leave very little space and available space is small
        insertions.push(pos); // Break before image
        pageBreakMarginTop.push(limit - cumulativeHeight);
        cumulativeHeight = 0;
      } else {
        // Image fits well - now check if we need to reflow content after it
        
        if (isNewlyInsertedImage) {
          // For newly inserted images, check if subsequent content needs to move to next page
          const remainingSpaceAfterImage = availableSpace - height;
          
          // Look ahead at following elements to see what fits
          let nextElementsHeight = 0;
          for (let j = i + 1; j < nodeElements.length; j++) {
            const nextEl = nodeElements[j];
            if (!nextEl) continue;
            
            const nextElHeight = nextEl.offsetHeight;
            if (nextElementsHeight + nextElHeight > remainingSpaceAfterImage) {
              // Insert page break before the element that doesn't fit
              const nextNodeSize = topLevelNodes[j].nodeSize;
              let nextPos = pos + nodeSize;
              for (let k = i + 1; k < j; k++) {
                nextPos += topLevelNodes[k].nodeSize;
              }
              insertions.push(nextPos);
              pageBreakMarginTop.push(remainingSpaceAfterImage - nextElementsHeight);
              break;
            }
            nextElementsHeight += nextElHeight;
          }
        }
      }
    }
    
    // If the current cumulative height plus this element's height exceeds the limit
    if (cumulativeHeight + height > limit) {
      insertions.push(pos); // Break before
      pageBreakMarginTop.push(limit - cumulativeHeight);
      cumulativeHeight = 0;
    }
    
    cumulativeHeight += height;
    pos += nodeSize;
  }

  // Apply insertions in reverse to preserve positions
  let tr = editor.view.state.tr;
  for (let i = insertions.length - 1; i >= 0; i--) {
    tr = tr.insert(
      insertions[i],
      pageBreak.create({ marginTop: `${pageBreakMarginTop[i]}px`, editMode: editMode })
    );
  }

  if (tr.docChanged) {
    editor.view.dispatch(tr);
  }

  // If triggered by Enter, check for overflow content and handle it
  if (triggeredByEnter) {
    setTimeout(() => {
      handleEnterKeyOverflow(editor, limit);
    }, 150);
  }

  newEvent.emit('event-updateFooterOnlyPosition')

  // Insert a single FooterOnly component after page breaks are processed
  setTimeout(() => {
    updateBgColor(slideBgColor, coverImage);
  }, 100);
}
