import React, { useEffect, useState, useRef } from 'react';
import tippy, { sticky } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import styled from 'styled-components';
import DynamicPopupPagesInlineComments from 'src/dashboard/components/SliceHeaderControls/DynamicPopup/DynamicPopupInlinePages';
import { useCoverPageDetection } from 'packages/blocknote-editor/utils/useCoverPageDetection';

import { CommentPopoverRegistry } from 'src/utils/HRXUtils';

const CommentButton = styled.button`
  background: white;
  border: 1px solid #f2f2f2;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  color: #000;
  /* box-shadow: 0 4px 12px rgba(0,0,0,0.1); */
  box-shadow: 0px 0px 60px 0px #00000014;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 116px;
  /* &:hover {
    background: #f3f4f6;
  } */

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ViewModeTextBubbleMenu = ({
  editor,
  onAddComment,
  commentsObject,
  pagesMasterId,
  component,
}) => {
  const buttonRef = useRef(null);
  const tippyInstanceRef = useRef(null);
  const lastSelectionRect = useRef(null);

  // Use the cover page detection hook
  const { onCoverPage } = useCoverPageDetection({
    componentId: component?.id, 
    isCoverPage: component?.meta?.isCoverPage || component?.type === 'cover',
    editMode: false
  });

  // const [isPopupOpen, setIsPopupOpen] = useState(false);

  // const popupRef = useRef();

  // const handleClick = (e) => {
    // if (popupRef.current) {
    //   popupRef.current.openPopup(e);
    // }
    //  setIsPopupOpen(true);
  // };

  const id = `inline-text`;

  // working sample below
  // useEffect(() => {
  //   if (!editor) return;
  
  //   let range = null;
  
  //   const updateTippy = () => {
  //     const { state, view } = editor;
  //     const { from, to } = state.selection;
  
  //     if (from === to) {
  //       tippyInstanceRef.current?.hide();
  //       return;
  //     }
  
  //     CommentPopoverRegistry.setActivePopover(id);

  //     // store range so we can access it later
  //     const selection = window.getSelection();
  //     if (!selection || selection.rangeCount === 0) return;
  //     range = selection.getRangeAt(0);
  
  //     if (range && buttonRef.current) {
  //       const rect = range.getBoundingClientRect();
  
  //       if (!tippyInstanceRef.current) {
  //         tippyInstanceRef.current = tippy(document.createElement('div'), {
  //           content: buttonRef.current,
  //           getReferenceClientRect: () => rect,
  //           trigger: 'manual',
  //           placement: 'top',
  //           interactive: true,
  //           appendTo: document.body,
  //           theme: '',
  //           plugins: [sticky],
  //         });
  //         tippyInstanceRef.current.show();
  //       } else {
  //         tippyInstanceRef.current.setProps({
  //           getReferenceClientRect: () => rect,
  //         });
  //         tippyInstanceRef.current.show();
  //       }
  //     }
  //   };
  
  //   const handleScroll = () => {
  //     if (tippyInstanceRef.current && range) {
  //       const rect = range.getBoundingClientRect();
  //       tippyInstanceRef.current.setProps({
  //         getReferenceClientRect: () => rect,
  //       });
  //     }
  //   };

  //   const handleExternalClose = (e) => {
  //     if (e.detail.id !== id) return;
  //     tippyInstanceRef.current?.hide();
  //   };
  
  //   window.addEventListener('closeCommentPopover', handleExternalClose);
  //   editor.on('selectionUpdate', updateTippy);
  //   window.addEventListener('scroll', handleScroll, true); // true = capture scroll bubbling in nested areas
  //   window.addEventListener('resize', handleScroll);
  
  //   return () => {
  //     editor.off('selectionUpdate', updateTippy);
  //     window.removeEventListener('closeCommentPopover', handleExternalClose);
  //     window.removeEventListener('scroll', handleScroll, true);
  //     window.removeEventListener('resize', handleScroll);
  //     tippyInstanceRef.current?.destroy();
  //     tippyInstanceRef.current = null;
  //   };
  // }, [editor]);


  // New sample:
  useEffect(() => {
    if (!editor) return;
  
    const id = 'inline-text';
    let range = null;
  
      const updateTippy = () => {
    const { state } = editor;
    const { from, to } = state.selection;

    if (from === to) {
      tippyInstanceRef.current?.hide();
      return;
    }

    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    const isOnlyWhitespace = selectedText.trim() === '';
    if (isOnlyWhitespace) {
      tippyInstanceRef.current?.hide();
      return;
    }

    // Check if selection is within a code block or has inline code formatting
    const isInCodeBlock = editor.isActive('codeBlock');
    const hasInlineCode = editor.isActive('code');
    
    // Hide comment button if selection is in code block or has inline code
    if (isInCodeBlock || hasInlineCode) {
      tippyInstanceRef.current?.hide();
      return;
    }

    // Hide comment button if this is a cover page
    if (onCoverPage) {
      tippyInstanceRef.current?.hide();
      return;
    }

    CommentPopoverRegistry.setActivePopover(id);

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    range = selection.getRangeAt(0);

    const rect = range.getBoundingClientRect();
    lastSelectionRect.current = rect;
    if (range && buttonRef.current) {
      if (!tippyInstanceRef.current) {
        tippyInstanceRef.current = tippy(document.createElement('div'), {
          content: buttonRef.current,
          getReferenceClientRect: () => rect,
          trigger: 'manual',
          placement: 'top',
          interactive: true,
          appendTo: document.getElementById('app'),
          theme: '',
          plugins: [sticky],
          zIndex: 99,
        });
        tippyInstanceRef.current.show();
      } else {
        tippyInstanceRef.current.setProps({
          getReferenceClientRect: () => rect,
        });
        tippyInstanceRef.current.show();
      }
    }
  };
  
    const handleScroll = () => {
      if (tippyInstanceRef.current && range) {
        const rect = range.getBoundingClientRect();
        tippyInstanceRef.current.setProps({
          getReferenceClientRect: () => rect,
        });
      }
    };
  
    const handleExternalClose = (e) => {
      if (e.detail.id !== id) return;
      tippyInstanceRef.current?.hide();
    };
  
    const handleClickOnMarkedText = (e) => {
      const target = e.target;
      const span = target.closest('span[data-comment-id]');
      if (!span) return;
  
      // A comment-marked span was clicked
      const { commentId } = span.dataset;
  
      // Select the clicked word (optional)
      const pos = editor.view.posAtDOM(span, 0);
      if (pos) {
        const $pos = editor.state.doc.resolve(pos);
        const nodeSize = $pos.nodeAfter?.nodeSize || 1;
        editor.commands.setTextSelection({ from: pos, to: pos + nodeSize });
      }
  
      // Open popup
      // popupRef.current?.openPopup();
    };
  
    // window.addEventListener('click', handleClickOnMarkedText);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    window.addEventListener('closeCommentPopover', handleExternalClose);
    editor.on('selectionUpdate', updateTippy);
  
    return () => {
      // window.removeEventListener('click', handleClickOnMarkedText);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('closeCommentPopover', handleExternalClose);
      editor.off('selectionUpdate', updateTippy);
      tippyInstanceRef.current?.destroy();
      tippyInstanceRef.current = null;
    };
  }, [editor, onCoverPage]);

  // Don't render anything if this is a cover page
  if (onCoverPage) {
    return null;
  }

  return (
    <>
      <div style={{ position: 'absolute', visibility: 'hidden' }}>
        <CommentButton ref={buttonRef} title="Comment" className="inline-comment"> 
          <DynamicPopupPagesInlineComments
            // ref={popupRef}
            dashboardId={pagesMasterId}
            sliceId={pagesMasterId}
            componentShortUUID={commentsObject?.id}
            source="inline-text"
            onAddComment={onAddComment}
            editorInstance={editor}
            selectionRect={lastSelectionRect.current}
            component={component}
          />
          {/* Comment */}
        </CommentButton>
      </div>
    </>
  );
};

export default ViewModeTextBubbleMenu;
