import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TableCell from '@tiptap/extension-table-cell';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Typography } from '@tiptap/extension-typography';
import { CustomEmoji } from './extensions/CustomEmojiExtension';
import { EmojiSuggestion } from './extensions/EmojiSuggestion';
import { TabIndent } from './extensions/TabIndentExtension';
import { FontSize } from './extensions/FontSizeExtension';
import FontFamily from '@tiptap/extension-font-family';
import { FlexChartExtension } from './FlexChartExtension';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { TextBubbleMenuForColumns } from './TextBubbleCols';
// import { Trash2 } from 'lucide-react';
import Trash2 from 'src/assets/images/icons/delete-icon.svg';
import { deleteComponent } from 'src/dashboard/actions/dashboardLayout';
import Placeholder from '@tiptap/extension-placeholder';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import { EditorCellSlashCommand, getSuggestionItems, renderItems } from "./extensions/EditorCellSlashCommand"
import Table from '@tiptap/extension-table';
import { debounce } from 'lodash';
import { VideoExtension } from './extensions/VideoExtension'
import { ImageExtension } from './extensions/ImageExtension'
import Underline from '@tiptap/extension-underline'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import {
  Hyperlink,
  previewHyperlinkModal,
  setHyperlinkModal,
} from "./extensions/HyperLink/index";
import { EditorImageExtension } from './extensions/EditorImageExtension';



const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2%;
  background: #E5E5E5;
  opacity: 1;
  pointer-events: auto;
  z-index: 10;
  user-select: none;

`;

const TableCellContainer = styled.div<{ 
  editMode?: boolean; 
  hasFlexChart?: boolean;
  isOverlayVisible?: boolean; // Add new prop
}>`
  border: ${props =>
    (props.editMode) ? '1px solid #dee2e6' : 'none'
  };
  background: white;
  width: 100%;
  border-radius: 5px;
  height: 100%;
  overflow: auto;
  flex: 1;
  position: relative;
  isolation: isolate;
  z-index: 1;
  overflow-x: hidden;

  .two-cols-editor-cell {
    p.is-empty {
      margin-left: 4px !important;
    }
  }

  .editor-cell {
    min-height: unset !important;
    max-height: -webkit-fill-available;
    height: 100%;
    outline: none;
    margin: 0;
    padding: 0px !important;
    padding-right: 0 !important;
    pointer-events: ${props => props.isOverlayVisible ? 'none' : 'auto'};

    p.is-empty::before {
      content: attr(data-placeholder);
      float: left;
      color: #adb5bd;
      pointer-events: none;
      height: 0;
    }

    h1 {
      margin-left: 0px !important;
    }

 


    h1.is-empty::before,
    h2.is-empty::before,
    h3.is-empty::before {
      content: attr(data-placeholder);
      float: left;
      color: #adb5bd;
      pointer-events: none;
      height: 0;
      left: 1rem !important;
    }


    ::selection {
      background: rgba(0, 0, 255, 0.2);
      color: inherit;
    }

    &[contenteditable='false'] {
      cursor: text;

      &::selection,
      & *::selection {
        background: rgba(0,0,255,0.2);
      }
    }
  }

  &:has(.ProseMirror-focused) {
    z-index: 2;
  }

  .react-resizable-handle {
    pointer-events: all !important;
  }
`;

const OverlayButton = styled.button`
  padding: 8px 16px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    background: #f8f9fa;
    transform: scale(1.05);
  }
`;

const LoaderContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 20;
`;

const Loader = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const BubbleMenuContainer = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9998;
  isolation: isolate;

  & > * {
    pointer-events: auto;
  }
`;

const ResetButton = styled.button`
  position: ${props => props.chartNodesExistButNotInitialized ? 'absolute' : 'sticky'};
  top: 8px;
  right: 8px;
  margin-left: auto; 
  align-self: flex-start; 
  float: right;
  padding: 4px 8px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 11;
  transition: all 0.2s;
  opacity: 0.7;
  user-select: none;

  &:hover {
    opacity: 1;
    background: #f8f9fa;
    transform: scale(1.05);
  }
`;

interface EditorCellProps {
  editorId: string;
  componentId: string;
  side: 'left' | 'right';
  initialState: any;
  onStateChange: (state: any) => void;
}

const compressImage = (base64: string, maxWidth = 1920): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64); // Fallback to original if canvas not supported
        return;
      }

      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (maxWidth * height) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', 0.85)); // 0.85 quality gives good balance
    };
  });
};

export const EditorCell: React.FC<EditorCellProps> = ({
  editorId,
  componentId,
  side,
  initialState,
  onStateChange
}) => {
  // Check if editor content is empty
  const isEditorEmpty = !initialState?.content?.length ||
    (initialState.content.length === 1 &&
      initialState.content[0].type === 'paragraph' &&
      !initialState.content[0].content?.length);

  const editMode = useSelector((state: any) => state?.dashboardState?.editMode);

  const [addedInitialContent , setAddedInitialContent] = useState(false)


  const [showOverlay, setShowOverlay] = useState(isEditorEmpty && editMode);
  const [isLoading, setIsLoading] = useState(!!initialState);
  const [editorContent, setEditorContent] = useState(initialState);
  const [hasFlexChart, setHasFlexChart] = useState(false);
  const [chartSelected, setChartSelected] = useState(false);
  const [chartInitializing, setChartInitializing] = useState(false);
  useEffect(() => {
    setShowOverlay(isEditorEmpty && editMode && !addedInitialContent)
  }, [editMode])

  useEffect(() => {
    setHasFlexChart(editorContent?.content?.some(
      (node: any) => node.type === 'flexChart'
    ))
  }, [editorContent])



  const editorRef = useRef(null);
  const updateScheduled = useRef(false);
  const dispatch = useDispatch();

  // Add ref to track chart nodes
  const chartNodesRef = useRef<any[]>([]);

  // Create debounced update function
  const debouncedUpdate = debounce((json: any) => {
    setEditorContent(json);
    if (onStateChange) {
      onStateChange(json);
    }
  }, 300);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'editor-table-cell',
        },
      }),
      Table.configure({
        resizable: true,
        allowTableNodeSelection: false,
        lastColumnResizable: false,
        cellMinWidth: 100,
        handleWidth: 5,
        HTMLAttributes: {
          class: 'my-custom-table',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'editor-table-header',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'editor-table-row',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Enter Text or Type "/" for commands...';
          }
          return 'Enter Text or Type "/" for commands...';
        },
        emptyNodeClass: 'is-empty',
        showOnlyWhenEditable: true,
        includeChildren: true,
      }),
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Typography,
      EditorCellSlashCommand.configure({
        suggestion: {
          items: getSuggestionItems,
          render: renderItems,
          allowSpaces: true,
        },
      }),
      Underline,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Hyperlink.configure({
        hyperlinkOnPaste: false,
        openOnClick: true,
        modals: {
          previewHyperlink: previewHyperlinkModal,
          setHyperlink: setHyperlinkModal,
        },
      }),
      CustomEmoji,
      EmojiSuggestion,
      TabIndent,
      VideoExtension,
      ImageExtension,
      FontSize,
      FlexChartExtension.configure({
        editorId: editorId,
      }),
      EditorImageExtension,
    ],
    content: initialState || '<p></p>',
    editable: editMode && !hasFlexChart && !showOverlay, // Add !showOverlay condition
    editorProps: {
      attributes: {
        id: editorId,
        class: 'two-cols-editor-cell'
      },
      handleDOMEvents: {
        mousedown: (view, event) => {
          if (!editMode || showOverlay) { // Add showOverlay check
            event.stopPropagation();
            return false;
          }
          return false;
        },
        select: (view, event) => {
          if (!editMode || showOverlay) { // Add showOverlay check
            return false;
          }
          return false;
        }
      },
      handlePaste: (view, event) => {
        if (!editMode || hasFlexChart || !editor) return false;

        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image/'));

        if (imageItem) {
          event.preventDefault();
          
          const blob = imageItem.getAsFile();
          if (!blob) return false;

          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64Image = e.target?.result as string;
            
            if (base64Image) {
              try {
                // Compress image before inserting
                const compressedImage = await compressImage(base64Image);
                
                // Clear editor and insert compressed image
                editor
                  .chain()
                  .focus()
                  .clearContent()
                  .insertContent({
                    type: 'editorImage',
                    attrs: {
                      src: compressedImage,
                      editorId: editorId,
                    }
                  })
                  .run();

                // Make editor uneditable
                editor.setEditable(false);

                // Update state if needed
                if (onStateChange) {
                  onStateChange(editor.getJSON());
                }
              } catch (err) {
                console.error('Error compressing image:', err);
                // Fallback to original image if compression fails
                editor
                  .chain()
                  .focus()
                  .clearContent()
                  .insertContent({
                    type: 'editorImage',
                    attrs: {
                      src: base64Image,
                      editorId: editorId,
                    }
                  })
                  .run();
              }
            }
          };

          reader.readAsDataURL(blob);
          return true;
        }

        return false;
      },
    },
    onCreate: ({ editor }) => {
      // Store initial chart nodes
      const charts: any[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'flexChart') {
          charts.push({ node, attrs: node.attrs, position: pos });
        }
      });
      chartNodesRef.current = charts;
    },
    onUpdate: ({ editor, transaction }) => {
      // Update stored chart nodes on each change
      const charts: any[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'flexChart') {
          charts.push({ node, attrs: node.attrs, position: pos });
        }
      });
      chartNodesRef.current = charts;

      if (transaction.docChanged) {
        const { from, to } = editor.state.selection;

        if (!updateScheduled.current) {
          updateScheduled.current = true;

          requestAnimationFrame(() => {
            const json = editor.getJSON();

            requestAnimationFrame(() => {
              if (onStateChange) {
                onStateChange(json);
              }

              // Schedule selection restore for next frame
              requestAnimationFrame(() => {
                editor.commands.setTextSelection({ from, to });
                updateScheduled.current = false;
              });
            });
          });
        }
      }
    },
    onDestroy: () => {
      const chartsArray = chartNodesRef.current;
      if (Array.isArray(chartsArray) && chartsArray.length > 0) {
        const flexChartNode = chartsArray[0];
        const flexChartLayoutId = flexChartNode?.attrs?.chartLayoutId;
        if (flexChartLayoutId) {
          dispatch(deleteComponent(flexChartLayoutId, componentId));
        }
      }
    },
  });

  // Update editable state when editMode, hasFlexChart, or showOverlay changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(editMode && !hasFlexChart && !showOverlay);
    }
  }, [editor, editMode, hasFlexChart, showOverlay]); // Add showOverlay to dependencies

  useEffect(() => {
    if (editor && initialState) {
      // Schedule content updates
      requestAnimationFrame(() => {
        editor.commands.setContent(initialState);
      });
    }
  }, [initialState, editor]);

  useEffect(() => {
    if (initialState) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialState]);

  const handleAddChart = () => {
    if (!editor) return;
    // setChartInitializing(true);
    const chartContent = {
      type: 'flexChart',
      attrs: {
        editorId: editorId,
        parentId: componentId,
      },
    };

    editor
      .chain()
      .focus()
      .clearContent()
      .insertContent(chartContent)
      .run();

    editor.setEditable(false);
    
    setTimeout(() => {
      const json = editor.getJSON();
      if (onStateChange) {
        onStateChange(json);
      }

    }, 500)

    setShowOverlay(false);
  };

  const handleAddText = () => {
    if (!editor) return;
    const firstParagraph = {
      type: 'doc',
      content: [{
        type: 'paragraph',
        attrs: {
          textAlign: null,
          indent: 0,
        },
        content: [{
          type: 'text',
          text: 'Start editing here...'
        }]
      }]
    };

    // Insert first paragraph
    editor
      .chain()
      .focus()
      .clearContent()
      .insertContent(firstParagraph)
      .run();

    editor.setEditable(true);
    setAddedInitialContent(true)

    setTimeout(() => {
      const json = editor.getJSON();
         if (onStateChange) {
      onStateChange(json);
       }
      
    },500)


    setShowOverlay(false);
  };

  // const handleReset = () => {
  //   if (!editor) return;

  //     const chartsArray = chartNodesRef.current;
  //   if (Array.isArray(chartsArray) && chartsArray.length > 0) {
  //     const flexChartNode = chartsArray[0];
  //     const flexChartLayoutId = flexChartNode?.attrs?.chartLayoutId;
  //     if (flexChartLayoutId) {
  //       dispatch(deleteComponent(flexChartLayoutId, componentId));
  //     }
  //   }

  //   editor.commands.clearContent();

  //   setEditorContent(null);
  //   if (onStateChange) {
  //     onStateChange(null);
  //   }

  //   setShowOverlay(true);

  //   editor.setEditable(true);
  // };

  const handleDelete = () => {
    if (!editor) return;
    const chartsArray = chartNodesRef.current;
    if (Array.isArray(chartsArray) && chartsArray.length > 0) {
      const flexChartNode = chartsArray[0];
      const flexChartLayoutId = flexChartNode?.attrs?.chartLayoutId;
      if (flexChartLayoutId) {
        dispatch(deleteComponent(flexChartLayoutId, componentId));
      }
    }

    editor.commands.clearContent();

    setEditorContent(null);
    if (onStateChange) {
      onStateChange(null);
    }

    setShowOverlay(true);
    setAddedInitialContent(false)

    editor.setEditable(true);
  };
      useEffect(() => {
      if (chartInitializing && hasFlexChart) {
        setChartInitializing(false);
      }
    }, [chartInitializing, hasFlexChart]);
    const chartNodesExistButNotInitialized = chartNodesRef.current.length > 0 &&
      chartNodesRef.current.some(node => {
        if (node.node?.type?.name === 'flexChart') {
          return node.attrs?.initialized === false || node.attrs?.initialized === undefined;
        }
        return false;
      });
  // Cleanup
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
      debouncedUpdate.cancel();
    };
  }, [editor, editorId]);

  if (!editor) return null;

  return (
    <TableCellContainer
      id={`container-${editorId}`}
      editMode={editMode}
      hasFlexChart={hasFlexChart}
      isOverlayVisible={showOverlay} // Add this prop
    >
      {editor && (
        <>
          {!showOverlay && editMode && (

            <ResetButton
              chartNodesExistButNotInitialized= {chartNodesExistButNotInitialized}
              onClick={handleDelete}
              // title={hasFlexChart ? "Delete Chart" : "Reset"}
            >
              <Trash2 size={14} />
              {/* {hasFlexChart ? (
                <Trash2 size={14} />
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              )} */}
              {/* {hasFlexChart ? 'Delete' : 'Reset'} */}
              {'Delete'}
            </ResetButton>
          )}
          <BubbleMenuContainer>
            <div id={`bubble-menu-container-${editorId}`} />
            <TextBubbleMenuForColumns
              editor={editor}
            />
          </BubbleMenuContainer>
          <EditorContent editor={editor} ref={editorRef} />
        </>
      )}
      {showOverlay && (
        <OverlayContainer>
          <OverlayButton onClick={handleAddText}>
            + Text
          </OverlayButton>
          <OverlayButton onClick={handleAddChart}>
            + Chart
          </OverlayButton>
        </OverlayContainer>
      )}
      {/* {isLoading && (
        <LoaderContainer>
          <Loader />
        </LoaderContainer>
      )} */}
    </TableCellContainer>
  );
}; 