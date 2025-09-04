import React from "react";
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import isEqual from 'lodash/isEqual'; 
import StarterKit from '@tiptap/starter-kit'
import { Color } from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import { SlashCommand, getSuggestionItems, renderItems } from './extensions/SlashCommand'
import styled from 'styled-components'
import 'tippy.js/dist/tippy.css'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react'
import { ChartExtension } from './extensions/ChartExtension'
import { ChartBubbleMenu } from './ChartBubbleMenu'
import { EmojiSuggestion } from './extensions/EmojiSuggestion'
import { TextBubbleMenu } from './TextBubbleMenu'
import { FontSize } from './extensions/FontSizeExtension'
import { CustomEmojiUploader } from './CustomEmojiUploader'
import { CustomEmoji } from './extensions/CustomEmojiExtension'
import { AddEmojiModal } from './AddEmojiModal'
import { customEmojiStorage } from '../utils/customEmojiStorage'
import { useDispatch, useSelector } from 'react-redux'
import { updateComponents } from 'src/dashboard/actions/dashboardLayout'
import { debounce, isUndefined } from 'lodash'
import { Moon, Sun } from 'lucide-react'
import { TabIndent } from './extensions/TabIndentExtension'
import { Extension } from '@tiptap/core'
import { Heading } from '@tiptap/extension-heading'
import { Plugin, PluginKey } from 'prosemirror-state'
import { UniqueHeadingExtension } from './extensions/UniqueHeadingExtension'
import { DecorationSet, Decoration } from 'prosemirror-view'
import shortid from 'shortid'
import { VideoExtension } from './extensions/VideoExtension'
import { ImageExtension } from './extensions/ImageExtension'
import MetricNode from "./extensions/MetricExtension/MetricNode";
import MetricExtension from "./extensions/MetricExtension/MetricExtension";
import { changeTextColorToWhite, changeTextColorToBlack, removeTextColorMarks, forceAllTextToBlack } from '../utils/textColorUtils';
import { hideBubbleMenus, showBubbleMenus, hideAllDropdowns } from '../utils/bubbleMenuHelpers';


import suggestion from './extensions/suggestions/Index.jsx'
import { CustomParagraphExtension } from "./extensions/CustomParagraphExtension"
import  BlockNoteTableGlobalStyles  from './extensions/BlockNoteTableGlobalStyles'
import { getDropProps } from "../utils/dropComponent"

// Comment
import { Comment } from './extensions/Comments/CommentExtension';

import getBootstrapData from 'src/utils/getBootstrapData'
// Custom TaskItem - for Notion like editing
import CustomTaskItem from "./extensions/TaskListExtension/TaskListExtension";


// Table resizing
import { columnResizing } from '@tiptap/pm/tables';

// Plus button extension
import PlusButtonExtension from "./extensions/PlusButton/PlusButtonExtension";

// Bullet List and List item
import BulletList from '@tiptap/extension-bullet-list'
import ListItem from '@tiptap/extension-list-item'

// Ordered List
import OrderedList from '@tiptap/extension-ordered-list'

// Task List
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'

// Code
import Code from '@tiptap/extension-code'

// Hyperlink
import {
  Hyperlink,
  previewHyperlinkModal,
  setHyperlinkModal,
} from "./extensions/HyperLink/index";


// Two Columns
import { FlexDivExtension}  from "./FlexDivExtension"
import { ThreeColumnExtension } from './extensions/ThreeColumnExtension';

import { isInitialContent } from "../utils/isInitialContent"
import { removeCommentMarksFromEditorJson, removeCommentMarksFromHtml, removeCommentMarksFromText } from "../utils/removeCommentMarksFromEditorJson"
import { useTypingPageDetection } from 'src/hooks/useTypingPageDetection';
import { useCoverPageDetection } from '../utils/useCoverPageDetection';
import { setCursorAfterCoverTitle } from 'src/components/PagesComponents/staticCoverTemplates';
import { handleEnhancedPaste } from "../utils/enhancedPasteHandler"

import { PageBreak } from "../components-tip-tap/extensions/PageBreak"
import { FooterOnly } from "../components-tip-tap/extensions/FooterOnly"
import { ReplaceStep } from 'prosemirror-transform'
import { Node as ProseMirrorNode } from 'prosemirror-model'
import { insertPageBreaks, handleFooterOnlyPositioning, createFooterAndHandleFooterPositioning, isCoverPageEditor } from './PageBreakInsertion'
import { TextSelection } from '@tiptap/pm/state'
import { PaginationPlus, TablePlus, TableRowPlus, TableCellPlus, TableHeaderPlus } from 'tiptap-pagination-plus'

// Styles
import "./styles/tiptap.less";
import { dbReducer } from 'src/features/databases/DatabaseModal'
import { newEvent } from 'src/components/ListView/utils'
import { updateBgColor } from '../Components/updateBgColor.js'
import { coverTemplateStaticMapping } from 'src/components/PagesComponents/staticCoverTemplates'
import { TEMPLATE_PLACEHOLDERS } from 'src/components/PagesComponents/templateConstants'
import { injectCoverTemplate } from 'src/components/PagesComponents/coverTemplateHelpers';
import { 
  handleTransparentBackgroundContent, 
  handleRestoreTemplateContent,
  preserveTemplateContentAndChangeTextColor,
  updateTemplatePositions,
  extractUserContent,
  applyTemplatePositionsWithUserContent,
  handleBackgroundTransition,
  handleTransparentBackgroundTransition
} from 'src/dashboard/components/gridComponents/pagesGridHelpers';
import { checkContentForTemplatePlaceholders } from 'src/components/PagesComponents/coverTemplateHelpers';
import { dashboardFooterChanged, dashboardHeaderChanged, dashboardPageNumberChanged } from 'src/dashboard/actions/dashboardLayout'
import BlockNoteTableExtension from './extensions/BlockNoteTableExtension'
import { TableTrackerExtension } from './extensions/TableTrackerExtension/TableTrackerExtension'

const EditorContainer = styled.div`
  background: ${props => props.$isDarkMode ? '#1A1B1E' : 'transparent'};
  border-radius: 8px;
  position: relative;
  transition: all 0.3s ease;
  padding-right: ${props => props.$isCoverPage ? '0' : '2rem'};
  min-height: ${props => {
    if (props.$isCoverPage) return '840px'; // Fixed height for cover pages
    if (props.$dynamicHeight) return `${props.$dynamicHeight}px`; // Dynamic height for multi-page content
    return 'auto'; // Auto height for regular single pages
  }};
  height: ${props => props.$isCoverPage ? '840px' : 'auto'};
  font-size: 16px !important;
  font-family: Aptos, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto Flex', sans-serif;
  
  .top-level-editor {
    padding: ${props => props.$isCoverPage ? '0' : '16px'};
    padding-right: ${props => props.$isCoverPage ? '0' : '2rem !important'};
       padding-left: ${props => {
        if (props.$isCoverPage) {
          if (props.$selectedTemplateCover === 'blankImageThemeTemplate') {
            return '0px !important';
          }
          return '50px !important';
        }
        return '2rem';
      }};
    position: relative;
    background: ${props => props.$isDarkMode ? '#1A1B1E' : 'transparent'};
    color: ${props => props.$isDarkMode ? '#fff' : '#1f2937'};
    font-family: inherit;
    border-radius: ${props => props.$isCoverPage ? '0' : '0.5rem'};
    min-height: ${props => props.$isCoverPage ? '840px' : 'auto'};
    height: ${props => props.$isCoverPage ? '840px' : 'auto'};
    
    &:focus, &:hover {
      outline: none;
      border-color: unset !important; //${props => props.$isDarkMode ? '#3b82f6' : '#2563eb'};
    }
    
    > * + * {
       margin-top: ${props => props.$isCoverPage ? '0' : '0.75em'};
    }
    
    p {
      margin: 0;
      position: relative;
      padding-left: ${props => {
        if (props.$isCoverPage) {
          if (props.$selectedTemplateCover === 'blankImageThemeTemplate') {
            return '0px !important';
          }
          return '50px !important';
        }
        return '2rem';
      }};
        /* Text Colors */
        &[data-text-color="Default"] {
        color: ${props => props.$isDarkMode ? '#FFFFFF' : '#1f2937'};
      }
      &[data-text-color="Gray"] {
        color: #9CA3AF;
      }
      &[data-text-color="Brown"] {
        color: #A47148;
      }
      &[data-text-color="Red"] {
        color: #EF4444;
      }
      &[data-text-color="Orange"] {
        color: #F97316;
      }
      &[data-text-color="Yellow"] {
        color: #EAB308;
      }
      &[data-text-color="Green"] {
        color: #22C55E;
      }
      &[data-text-color="Blue"] {
        color: #3B82F6;
      }
      &[data-text-color="Purple"] {
        color: #A855F7;
      }
      &[data-text-color="Pink"] {
        color: #EC4899;
      }

      /* Background Colors */
      &[data-bg-color="Default"] {
        background-color: transparent;
      }
      &[data-bg-color="Gray"] {
        background-color: rgba(107, 114, 128, 0.6);
      }
      &[data-bg-color="Brown"] {
        background-color: rgba(146, 64, 14, 0.6);
      }
      &[data-bg-color="Red"] {
        background-color: rgba(153, 27, 27, 0.6);
      }
      &[data-bg-color="Orange"] {
        background-color: rgba(154, 52, 18, 0.6);
      }
      &[data-bg-color="Yellow"] {
        background-color: rgba(133, 77, 14, 0.6);
      }
      &[data-bg-color="Green"] {
        background-color: rgba(22, 101, 52, 0.6);
      }
      &[data-bg-color="Blue"] {
        background-color: rgba(30, 64, 175, 0.6);
      }
      &[data-bg-color="Purple"] {
        background-color: rgba(107, 33, 168, 0.6);
      }
      &[data-bg-color="Pink"] {
        background-color: rgba(157, 23, 77, 0.6);
      }

      & > span {
        color: ${props => props.$isDarkMode ? '#fff !important' : '#000000 !important'};

      }
    }

    
    p.is-empty::before,
    h1.is-empty::before,
    h2.is-empty::before,
    h3.is-empty::before {
      /* color: ${props => props.$isDarkMode ? '#6B7280' : '#cfcfcf'}; */
      color: #9C9C9C;
      content: attr(data-placeholder);
      float: left;
      height: 0;
      pointer-events: none;
      position: absolute;
      /* font-style: italic; */
    }

    p.is-empty::before {
      margin-left: 2rem;
      left: -32px;
    }

    table {
      p.is-empty::before,
      h1.is-empty::before,
      h2.is-empty::before,
      h3.is-empty::before {
        content: ""
      }
    }
    
    
    code {
      background-color: ${props => props.$isDarkMode ? '#2D2D2D' : '#f3f4f6'};
      color: ${props => props.$isDarkMode ? '#fff' : '#111827'};
    }
    
    pre {
      background: ${props => props.$isDarkMode ? '#2D2D2D' : '#1f2937'};
      color: ${props => props.$isDarkMode ? '#fff' : '#f3f4f6'};
      padding: 5px !important;
      margin: 0px !important;
    }

    // table {
    //   overflow: visible !important;

    //   &[data-table-type="chart"]{
    //     table-layout:  ${props => props.$editMode ? 'fixed' : 'auto'};
    //     border: ${props => props.$editMode ? '2px dashed blue' : 'none !important'};
        
    //     td, th {
    //       border: ${props => props.$editMode ? '2px dashed blue' : 'none !important'};
    //       overflow: hidden;
    //     }
    //   }
    //   td, th {
    //     border-color: ${props => props.$isDarkMode ? '#2D2D2D' : '#ced4da'};
    //     color: ${props => props.$isDarkMode ? '#fff' : 'inherit'};
    //     }

    //   th {
    //     background-color: ${props => props.$isDarkMode ? '#2D2D2D' : '#f8f9fa'};
    //   }
    // }

    // .tableWrapper > table:first-child[data-table-type="normal"] {
    //   min-width: 40vw;
    //   padding-bottom: 16px;
    //   overflow-y: hidden;
    //   table {
    //     border-collapse: collapse;
    //     margin: 0;
    //     overflow: hidden;
    //     table-layout: auto;

    //     width: 100%;

    //     td,
    //     th {
    //       border: 1px solid grey;
    //       box-sizing: border-box;
    //       min-width: 1em;
    //       padding: 0; // 6px 8px
    //       position: relative;
    //       vertical-align: top;

    //       > * {
    //           margin-bottom: 0;
    //       }
    //     }

    //     th {
    //       background-color: lightgray;
    //       font-weight: bold;
    //       text-align: left;
    //     }

    //     .selectedCell:after {
    //       content: "";
    //       left: 0; right: 0; top: 0; bottom: 0;
    //       pointer-events: none;
    //       position: absolute;
    //       z-index: 2;
    //     }

    //     .column-resize-handle {
    //       background-color: purple;
    //       bottom: -2px;
    //       pointer-events: none;
    //       position: absolute;
    //       right: -2px;
    //       top: 0;
    //       width: 4px;
    //     }
    //   }
    // }
    // Font sizes for headings 
    h1 {
      font-size: 30px;
    }
    h2 {
      font-size: 22px;
    }
    h3 {
      font-size: 18px;
    }
  }
`

const MenuBar = styled.div`
  padding: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid ${props => props.$isDarkMode ? '#2D2D2D' : '#e5e7eb'};
  background: ${props => props.$isDarkMode ? '#242526' : '#f9fafb'};
  border-radius: 6px 6px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  transition: all 0.3s ease;
  
  .table-buttons {
    border-left: 1px solid ${props => props.$isDarkMode ? '#2D2D2D' : '#e5e7eb'};
  }
`

const Button = styled.button`
  padding: 6px 12px;
  border: 1px solid ${props => props.$isDarkMode ? '#2D2D2D' : '#d1d5db'};
  border-radius: 6px;
  background: ${props => props.$isDarkMode
    ? props.$active ? '#3A3B3C' : '#242526'
    : props.$active ? '#e5e7eb' : '#ffffff'};
  color: ${props => props.$isDarkMode ? '#fff' : '#374151'};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$isDarkMode ? '#3A3B3C' : '#f3f4f6'};
    border-color: ${props => props.$isDarkMode ? '#4D4D4D' : '#9ca3af'};
  }
  
  &:active {
    background: ${props => props.$isDarkMode ? '#4D4D4D' : '#e5e7eb'};
  }
  
  ${props => props.$active && `
    background: ${props.$isDarkMode ? '#4D4D4D' : '#e5e7eb'};
    border-color: ${props.$isDarkMode ? '#4D4D4D' : '#9ca3af'};
    color: ${props.$isDarkMode ? '#fff' : '#111827'};
  `}
`

// Add file input for image upload
const HiddenInput = styled.input`
  display: none;
`

const ThemeToggleContainer = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
`

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 70px;
  height: 32px;
  background: #E4E6EB;
  border-radius: 50px;
  cursor: pointer;
  margin-top: 3rem;
  padding: 4px;
  border: ${props => props.$isDarkMode ? '1px solid white' : ''};

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50px;
    background: #E4E6EB;
    transition: all 0.4s ease;
    display: flex;
    align-items: center;
    padding: 4px;

    &:before {
      content: "";
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: white;
      transition: transform 0.4s ease;
      transform: ${props => props.$isDarkMode ? 'translateX(38px)' : 'translateX(0)'};
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .icon {
      position: absolute;
      width: 16px;
      height: 16px;
      color: '#000';
      z-index: 1;
      transition: all 0.4s ease;

      &.sun {
        left: 8px;
        opacity: ${props => props.$isDarkMode ? '0' : '1'};
      }

      &.moon {
        right: 8px;
        opacity: ${props => props.$isDarkMode ? '1' : '0'};
      }
    }
  }

  input:checked + span {
    background: #1A1B1E;
  }
`

const ControlsContainer = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  display: flex;
  gap: 8px;
`

const FullscreenButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50px;
  background: ${props => props.$isDarkMode ? '#1A1B1E' : '#fff'};
  border: ${props => props.$isDarkMode ? '1px solid white' : '1px solid #E4E6EB'};
  cursor: pointer;
  color: ${props => props.$isDarkMode ? '#fff' : '#000'};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode ? '#2D2D2D' : '#f8fafc'};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`

const FullscreenContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.$isDarkMode ? '#1A1B1E' : 'transparent'};
  z-index: 9999;
  padding: 20px;
  overflow-y: auto;

  .editor-container {
    max-width: 1200px;
    margin: 0 auto;
    height: 100%;
  }

  /* Force chart re-render in fullscreen */
  .portable-chart-component {
    transform: translateZ(0);
    backface-visibility: hidden;
  }

  /* Maintain chart visibility */
  [data-type="chart"] {
    transform: translateZ(0);
    will-change: transform;
  }
`


function isInChartTable(state) {
  const { $anchor } = state.selection;
  let depth = $anchor.depth;

  // Traverse up the document until we find a table node
  while (depth > 0) {
    const node = $anchor.node(depth);
    if (node.type.name === 'table') {
      return node.attrs['data-is-chart-table'] === 'true';
    }
    depth--;
  }
  return false;
};


// Create custom heading extension
const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      level: {
        default: 1,
        rendered: true
      },
      id: {
        default: null,
        parseHTML: element => element.getAttribute('id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            const headerId = `heading-${shortid.generate()}`
            attributes.id = headerId
            return { id: headerId }
          }
          return { id: attributes.id }
        }
      }
    }
  }
})


export const TipTapEditor = forwardRef(({ editMode, initialContent, component, hoveredPos, setHoveredPos, setHeadings, parentId, setEditorInstance, handleComponentDrop, isEmojiModalOpen, setIsEmojiModalOpen, isCoverPage, selectedTemplateCover }, ref) => {
  window.insertPageBreaks = insertPageBreaks;
  const [isMounted, setIsMounted] = useState(false)
  const isDarkMode = useSelector((state) => state?.dashboardState?.darkMode);
  const json_metadata = useSelector((state) => (state?.dashboardInfo?.metadata));

  // Header/Footer from Redux for footer editing
  const headerTextFromRedux = useSelector((state) => state?.dashboardLayout?.present?.["HEADER_ID"]?.meta?.headerText || '')
  const footerTextFromRedux = useSelector((state) => state?.dashboardLayout?.present?.["HEADER_ID"]?.meta?.footerText || '')
  const showPageNumbers = useSelector((state) => state?.dashboardLayout?.present?.["HEADER_ID"]?.meta?.page_number || 0);

  // const dashboardId = useSelector(state => console.log(state)); // ?.form_data?.dashboardId
  // console.log("dashboardId: ", dashboardId)

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dynamicHeight, setDynamicHeight] = useState(null);
  const id = component?.id;

  // Use the custom typing page detection hook
  const { onCoverPage } = useCoverPageDetection({componentId: component?.id, isCoverPage, editMode});

  const dispatch = useDispatch();
  const initalContentRef = useRef(false);
  const containerRef = useRef(null);
  const prevTemplateRef = useRef(null)
  
  // Helper: Update text in .rm-page-number to "Page {current}/{total}" where total = count of .rm-page-break elements
  const updateRmPageNumbers = useCallback((localShowPageNumber) => {
    try {
      const nodes = document.querySelectorAll('.rm-page-footer-right');
      let finalValue = typeof localShowPageNumber === 'number' ? localShowPageNumber : showPageNumbers
      if (finalValue) {
        const total = document.querySelectorAll('.rm-page-break').length || 1;
        nodes.forEach((el, idx) => {
          const label = `Page ${idx + 1}/${total}`;
          if (editMode) {
            el.innerHTML = `<span class="page-number-text">${label}</span><div class="rm-page-number-popover"><button class="rm-page-number-remove">Remove</button></div>`;
          } else {
            el.textContent = label;
          }
        });
      } else {
        // Render an Add Page Number button in edit mode only; otherwise clear
        nodes.forEach(el => {
          if (editMode) {
            el.innerHTML = '<button class="add-page-number-btn" style="border:none;background:transparent;color:#9C9C9C;cursor:pointer;padding:0;margin:0">+ Add Page Number</button>';
          } else {
            el.textContent = '';
          }
        });
      }
    } catch (e) {
      // no-op
    }
  }, [showPageNumbers, editMode]);

    // Helper: Update header/footer from Redux into PaginationPlus DOM
  const updateHeaderFooterFromRedux = useCallback(() => {
    try {
      const headerVal = (headerTextFromRedux ?? '').toString();
      const footerVal = (footerTextFromRedux ?? '').toString();
      let finalHeaderVal = headerVal;
      let finalFooterVal = footerVal;
      if(editMode) {
        finalHeaderVal = headerVal || '+ Add Header';
        finalFooterVal = footerVal || '+ Add Footer';
      }
      document.querySelectorAll('.rm-first-page-header-left, .rm-page-header-left').forEach(el => {
        el.textContent = finalHeaderVal;
      });
      document.querySelectorAll('.rm-page-footer-left').forEach(el => {
        el.textContent = finalFooterVal;
      });
    } catch (e) {
      // no-op
    }
  }, [headerTextFromRedux, footerTextFromRedux, editMode, showPageNumbers]);

  
  // Add missing refs for cover page management
  const lastAppliedTemplateRef = useRef(null);
  const lastAppliedOverlayTextsRef = useRef(null);
  const prevBackgroundRef = useRef(null); //to track background transitions
  const userEditingRef = useRef(false); // to track user editing state
  const isUserTypingRef = useRef(false); //to track if user is actively typing
  
  // Comments
  const [comments, setComments] = useState([]);
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const bootstrapData = getBootstrapData();
  const MAX_PAGE_HEIGHT = 840 + 48 + 48; // Adding header and footer area also as per figma
  const USE_PAGINATION_PLUS = true; // Feature flag to switch to tiptap-pagination-plus

  // Function to calculate dynamic height based on page breaks
  const calculateDynamicHeight = (editor) => {
    if (!editor || !editor.state || isCoverPageEditor(editor)) return null;
    let pageBreakCount = 0;
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'pageBreak') {
        pageBreakCount++;
      }
    });
    
    // Calculate height: 840px per page (base page + page breaks)
    const numberOfPages = pageBreakCount + 1;
    let firstPageFullHeight = MAX_PAGE_HEIGHT + 56 // Adding Footer for first page
    let otherPageFullHeight = MAX_PAGE_HEIGHT + 112 // Adding Header and Footer for first page
    if(numberOfPages === 1) {
      return firstPageFullHeight;
    } else {
      return ((numberOfPages - 1) * (otherPageFullHeight)) + (firstPageFullHeight);
    }
  };

   const addVisibleClassToHeaderAndFooter = () => {
    // Ensure visible class CSS
    const styleId = 'rm-hdr-ftr-visible-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .blocknote-editor .rm-page-header.visible,
        .blocknote-editor .rm-first-page-header.visible,
        .blocknote-editor .rm-page-footer.visible { opacity: 1 !important; }
      `;
      document.head.appendChild(style);
    }

    const headerHas = !!(headerTextFromRedux && headerTextFromRedux.toString().trim());
    const footerHas = !!(footerTextFromRedux && footerTextFromRedux.toString().trim());
    const pageNumsOn = !!showPageNumbers;

    requestAnimationFrame(() => {
      const headers = document.querySelectorAll('.rm-page-header, .rm-first-page-header');
      headers.forEach(el => {
        if (headerHas) el.classList.add('visible'); else el.classList.remove('visible');
      });
      const footers = document.querySelectorAll('.rm-page-footer');
      footers.forEach(el => {
        if (footerHas || pageNumsOn) el.classList.add('visible'); else el.classList.remove('visible');
      });
    });
  }


  // Create a ref to store the update callback
  const updateCallbackRef = useRef(null)
  const isUpdatingRef = useRef(null);
  const isPageBreakAddedInEditMode = useRef(null)
  const isPageBreakDelInEditMode = useRef(null);

  const divRef = useRef(null);
  const handleHeightChange = (height) => {
  const MAX_HEIGHT = 840;
  const pagesCount = Math.floor(height / MAX_HEIGHT);

  if (pagesCount > 0) {
    for (let i = 1; i <= pagesCount; i++) {
      if ($(`.page-seperator-${i}`).length === 0) {
        $(".page-seperator-wrap").append(
          `<div class="page-seperator-${i}" style="top:${i*MAX_HEIGHT}px"><span>Page Break ${i}</span></div>`
        );
      }
    }
  }
};

  useEffect(() => {
   const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const newHeight = entry.contentRect.height;
        handleHeightChange(newHeight);
        
      }
    });

    if (divRef.current) {
      observer.observe(divRef.current);
    }
    return () => {
      observer.disconnect();
    };
   
  }, [handleHeightChange]);
   

  // Define the update callback
  updateCallbackRef.current = (editor) => {
    if (!editor || isUpdatingRef.current) return
    try {
      isUpdatingRef.current = true;
      if(editMode && !USE_PAGINATION_PLUS) {
        if(event?.key === 'Enter' || event?.key === 'Backspace' || event?.type === 'paste' || event?.type === 'drop') {
          const isEnterKey = event?.key === 'Enter';
          
          if (isEnterKey) {
            console.log('⏎ Enter key detected - triggering enhanced page break recalculation');
          }
          
          requestAnimationFrame(() => {
            insertPageBreaks(editor, { 
              "editMode": editMode, 
              "limit": 840,
              "triggeredByEnter": isEnterKey,
              slideBgColor: json_metadata?.slide_color, 
              coverImage: json_metadata?.coverImage 
            });
            updateBgColor(json_metadata?.slide_color, json_metadata?.coverImage);
          })
        }
      } 
      
      const { from , to } = editor.state.selection;
      const content = editor.getJSON()

      // Track seen IDs and store duplicates
      const seenIds = new Set()
      const duplicateIds = new Set()

      // First pass: identify duplicate IDs and headings without parent ID
      const findDuplicateIds = (node) => {
        if (node.type === 'heading' && node.attrs?.id) {
          const idParts = node.attrs.id.split('#')
          // Check if ID has correct parent ID format
          if (idParts.length !== 3 || idParts[0] !== parentId) {
            duplicateIds.add(node.attrs.id) // Mark for update if parent ID is missing or wrong
          } else if (seenIds.has(node.attrs.id)) {
            duplicateIds.add(node.attrs.id)
          } else {
            seenIds.add(node.attrs.id)
          }
        }
        if (node.content) {
          node.content.forEach(findDuplicateIds)
        }
      }
      findDuplicateIds(content)

      // Second pass: update IDs
      const currentHeadingIds = []
      const updateDuplicateIds = (node) => {
        if (node.type === 'heading') {
          // Always ensure heading has an ID
          if (!node.attrs) node.attrs = {}

          let shouldUpdateId = false

          // Check if ID exists and has correct format
          if (!node.attrs.id) {
            shouldUpdateId = true
          } else {
            const idParts = node.attrs.id.split('#')
            shouldUpdateId = idParts.length !== 3 ||
              idParts[0] !== parentId ||
              duplicateIds.has(node.attrs.id)
          }

          if (shouldUpdateId) {
            // Generate new ID with parent ID
            const newId = `${parentId}#heading#${shortid.generate()}`
            node.attrs.id = newId
            currentHeadingIds.push(newId)
          } else {
            currentHeadingIds.push(node.attrs.id)
          }
        }

        if (node.content) {
          node.content = node.content.map(updateDuplicateIds)
        }
        return node
      }

      // Create a deep copy and update content
      const updatedContent = JSON.parse(JSON.stringify(content))
      const newContent = updateDuplicateIds(updatedContent)
      // Only update if content has changed
      if (JSON.stringify(content) !== JSON.stringify(newContent)) {
        editor.commands.setContent(newContent, false, {
          preserveWhitespace: true,
          preserveSelection: true
        })
      }

      // Update headings state
      setHeadings(prevHeadings => {
        if (!prevHeadings) return currentHeadingIds
        return currentHeadingIds
      })

      // Debounced update
      debounceUpdateEditorComponent(newContent);
      editor.commands.setTextSelection({ from , to })
      // Always update background for cover pages after any content change
      if (isCoverPage) {
        requestAnimationFrame(() => { updateBgColor(json_metadata?.slide_color, json_metadata?.coverImage)});
      }
    } finally {
      isUpdatingRef.current = false;
    }

  }


  const updateEditorComponentMeta = (editorJsonContent) => {
    if(!initalContentRef.current && isInitialContent(editorJsonContent)) {
      initalContentRef.current = true;
      return;
    }
    if (component) {
      dispatch(
        updateComponents({
          [component?.id]: {
            ...component,
            meta: {
              ...component.meta,
              editorJson: editorJsonContent
            },
          },
        }),
      );
    }
  }

  const debounceUpdateEditorComponent = debounce(updateEditorComponentMeta, 300);
  // Add debounced background update for cover pages
  const debouncedBgUpdate = useCallback(
    debounce(() => {
      if (isCoverPage) {updateBgColor(json_metadata?.slide_color, json_metadata?.coverImage)}
    }, 100),
    [isCoverPage, json_metadata?.slide_color, json_metadata?.coverImage]
  );

  const cleanWordHtml = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
  
    // 1. Remove Word-specific <o:p> tags
    doc.querySelectorAll('o\\:p').forEach(node => node.remove());
  
    // 2. Remove font-size and font-family from style attributes, then set Aptos font
    doc.querySelectorAll('*').forEach(node => {
      const styleAttr = node.getAttribute('style');
      if (styleAttr) {
        // Remove font-size, font-family, and font shorthand with size/family
        let cleanedStyle = styleAttr
          .replace(/font-size\s*:\s*[^;]+;?/gi, '')
          .replace(/font-family\s*:\s*[^;]+;?/gi, '')
          .replace(/font\s*:\s*[^;]*\d+(?:px|pt|em|rem|%)[^;]*;?/gi, '')
          .replace(/font\s*:\s*[^;]*["'][^"']*["'][^;]*;?/gi, '') // Remove font with quoted family names
          .replace(/;\s*;/g, ';')
          .replace(/^\s*;\s*/, '')
          .replace(/\s*;\s*$/, '')
          .trim();
        
        // Add Aptos font family
        cleanedStyle = cleanedStyle ? cleanedStyle + '; font-family: Aptos, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto Flex", sans-serif' : 'font-family: Aptos, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto Flex", sans-serif';
        
        node.setAttribute('style', cleanedStyle);
      } else {
        // If no style attribute exists, add Aptos font family
        node.setAttribute('style', 'font-family: Aptos, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto Flex", sans-serif');
      }
      
      // Only remove Word-specific attributes, keep classes and IDs for layout
      [...node.attributes].forEach(attr => {
        if (attr.name.startsWith('xmlns:') || attr.name.startsWith('o:') || attr.name.startsWith('w:') || attr.name.startsWith('v:')) {
          node.removeAttribute(attr.name);
        }
      });
    });
  
    // 3. Don't flatten spans and divs - keep them for layout
    
    // 4. Smart split <br> into separate <p> paragraphs
    doc.querySelectorAll('p').forEach(p => {
      const parts = p.innerHTML.split(/<br\s*\/?>/i).map(part => part.trim()).filter(Boolean);
      if (parts.length > 1) {
        const fragment = document.createDocumentFragment();
        parts.forEach(part => {
          const newP = document.createElement('p');
          newP.innerHTML = part;
          fragment.appendChild(newP);
        });
        p.replaceWith(fragment);
      }
    });
  
    // 5. Remove empty <p> tags
    doc.querySelectorAll('p').forEach(p => {
      if (p.textContent.trim() === '') {
        p.remove();
      }
    });
  
    return doc.body.innerHTML.trim();
  };

  // Helper function to remove font-size and font-family from regular HTML content and set Aptos font
  const removeFontSizeFromHtml = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    doc.querySelectorAll('*').forEach(node => {
      const styleAttr = node.getAttribute('style');
      if (styleAttr) {
        // Remove font-size, font-family, and font shorthand with size/family
        let cleanedStyle = styleAttr
          .replace(/font-size\s*:\s*[^;]+;?/gi, '')
          .replace(/font-family\s*:\s*[^;]+;?/gi, '')
          .replace(/font\s*:\s*[^;]*\d+(?:px|pt|em|rem|%)[^;]*;?/gi, '')
          .replace(/font\s*:\s*[^;]*["'][^"']*["'][^;]*;?/gi, '') // Remove font with quoted family names
          .replace(/;\s*;/g, ';')
          .replace(/^\s*;\s*/, '')
          .replace(/\s*;\s*$/, '')
          .trim();
        
        // Add Aptos font family
        cleanedStyle = cleanedStyle ? cleanedStyle + '; font-family: Aptos, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto Flex", sans-serif' : 'font-family: Aptos, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto Flex", sans-serif';
        
        node.setAttribute('style', cleanedStyle);
      } else {
        // If no style attribute exists, add Aptos font family
        node.setAttribute('style', 'font-family: Aptos, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto Flex", sans-serif');
      }
    });
    
    return doc.body.innerHTML;
  };


  
  // Compress Image
  const compressImageToBase64 = (file, maxWidth = 800, quality = 0.6) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
  
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = Math.min(maxWidth / img.width, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
  
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
  
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };  
    
  const checkExport = () =>{
        const MAX_HEIGHT = 800;
        let json = {}
        // Loop through all keys in the object
        Object.keys(json).forEach(key => {
          if (key.startsWith("PAGES-")) {
            const content = json[key]?.meta?.editorJson?.content;
            if (!Array.isArray(content)) {
              console.warn(`No content array found in ${key}`);
              return;
            }
          console.log(`\nFound content in ${key}:`);
            // Loop through content array
            content.forEach(item => {
              if (item.type === "key") {
                console.log(item.attrs);
              }
            });
          }
        });
    }

  // Smart extension to remove font-size only from pasted content, not manual changes
  const RemoveFontSizeExtension = Extension.create({
    name: 'removeFontSize',
    
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('removeFontSizeFromPaste'),
          props: {
            transformPastedHTML(html) {
              // Only process if HTML contains font-size styles to avoid unnecessary processing
              if (html && (html.includes('font-size') || html.includes('font:'))) {
                return removeFontSizeFromHtml(html);
              }
              return html;
            },
          },
        }),
      ];
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        paragraph: false,
      }),
      ...BlockNoteTableExtension,
      TableTrackerExtension,
      CustomParagraphExtension,
      UniqueHeadingExtension.configure({
        setHeadings: setHeadings,
      }),
      CustomHeading.configure({
        levels: [1, 2, 3]
      }),

      Color,
      Code,
      Comment.configure({
        activeCommentId,
      }),
      FontFamily,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      BulletList,
      ListItem,
      OrderedList,
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
      // Link.configure({
      //   openOnClick: true,
      //   autolink: true,
      //   defaultProtocol: 'https',
      //   protocols: ['https'],
      //   isAllowedUri: (url, ctx) => {
      //     try {
      //       // construct URL
      //       const parsedUrl = url.includes(':') ? new URL(url) : new URL(`${ctx.defaultProtocol}://${url}`)

      //       // use default validation
      //       if (!ctx.defaultValidate(parsedUrl.href)) {
      //         return false
      //       }

      //       // disallowed protocols
      //       const disallowedProtocols = ['ftp', 'file', 'mailto']
      //       const protocol = parsedUrl.protocol.replace(':', '')

      //       if (disallowedProtocols.includes(protocol)) {
      //         return false
      //       }

      //       // only allow protocols specified in ctx.protocols
      //       const allowedProtocols = ctx.protocols.map(p => (typeof p === 'string' ? p : p.scheme))

      //       if (!allowedProtocols.includes(protocol)) {
      //         return false
      //       }

      //       // disallowed domains
      //       const disallowedDomains = ['example-phishing.com', 'malicious-site.net']
      //       const domain = parsedUrl.hostname

      //       if (disallowedDomains.includes(domain)) {
      //         return false
      //       }

      //       // all checks have passed
      //       return true
      //     } catch {
      //       return false
      //     }
      //   },
      //   shouldAutoLink: url => {
      //     try {
      //       // construct URL
      //       const parsedUrl = url.includes(':') ? new URL(url) : new URL(`https://${url}`)

      //       // only auto-link if the domain is not in the disallowed list
      //       const disallowedDomains = ['example-no-autolink.com', 'another-no-autolink.com']
      //       const domain = parsedUrl.hostname

      //       return !disallowedDomains.includes(domain)
      //     } catch {
      //       return false
      //     }
      //   },

      // }),
      FontSize.configure({
        types: ['textStyle'],
      }),
      Placeholder.configure({
        placeholder: `Enter text or type ‘/’ for commands and “@” for metrics`,
        emptyNodeClass: 'is-empty',
        showOnlyWhenEditable: true,
        includeChildren: true,
      }),
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle.configure({
        types: ['textStyle']
      }),
      Typography.configure({
        spaces: false,
        quotes: false,
        apostrophe: false,
        ellipsis: false,
        emDash: false,
        enDash: false,
      }),
      SlashCommand.configure({
        suggestion: {
          items: getSuggestionItems,
          render: renderItems,
          allowSpaces: true,
        },
      }),
      ChartExtension.configure({
        parentId: id
      }),
      CustomEmoji,
      EmojiSuggestion,
      TabIndent,
      VideoExtension,
      ImageExtension,
      MetricExtension,
      MetricNode,
      FlexDivExtension.configure({
        componentId: id
      }),
      ThreeColumnExtension.configure({
        componentId: id,
      }),
      PageBreak,
      FooterOnly,
      RemoveFontSizeExtension,
       // Enable PaginationPlus for automatic pagination (replaces manual page breaks)
     PaginationPlus.configure({
       pageHeight: MAX_PAGE_HEIGHT,
       pageGap: 20,
       pageBreakBackground: '#f7f7f7',
       pageHeaderHeight: 48,
       pageFooterHeight: 48,
       footerLeft: footerTextFromRedux || '+ Add Footer',
       headerLeft: headerTextFromRedux || '+ Add Header',
       footerRight: "",
       marginTop: 0,
       marginBottom: 0,
       marginLeft: 49,
       marginRight: 49,
       contentMarginTop: 0,
       contentMarginBottom: 0
     })
    ],
    editable: true,
    injectCSS: false,
    content: component?.meta?.editorJson || initialContent,
    onCreate({ editor }) {
      setIsMounted(true)
      
      if(!isCoverPageEditor(editor)) {
      // Set initial dynamic height (skip when using PaginationPlus)
        if (!USE_PAGINATION_PLUS) {
        const initialHeight = calculateDynamicHeight(editor);
        setDynamicHeight(initialHeight);
        createFooterAndHandleFooterPositioning(editor, editMode, initialHeight);
        }
      }
      
      // Apply background styling for cover pages
      if (isCoverPage) {
        requestAnimationFrame(() => {
          updateBgColor(json_metadata?.slide_color, json_metadata?.coverImage);
        });
      }
      // Initialize page numbers after first paint
      requestAnimationFrame(() => {
        updateHeaderFooterFromRedux();
        updateRmPageNumbers();
      });
    },
    onUpdate: ({ editor }) => {
      updateCallbackRef.current?.(editor)
      debouncedBgUpdate(); // Call debounced background update on every update
      
      // Track user editing state
      const currentContent = editor.getJSON()?.content || [];
      const hasUserContent = checkContentForTemplatePlaceholders(currentContent, false);
      if (hasUserContent) {
        userEditingRef.current = true;
      }
      // Keep page numbers in sync on updates
     requestAnimationFrame(() => {
        updateHeaderFooterFromRedux();
        updateRmPageNumbers();
        addVisibleClassToHeaderAndFooter();
      });
    },
   
    onFocus: () => {
      // When editor is focused, set data attribute on parent
      const editorContainer = document.querySelector('.blocknote-editor');
      if (editorContainer) {
        editorContainer.setAttribute('data-editor-focused', 'true');
      }
      // Update background for cover pages when focused
      if (isCoverPage) {
        requestAnimationFrame(() => { updateBgColor(json_metadata?.slide_color, json_metadata?.coverImage) });
      }
    },
    onBlur: () => {
      // When editor loses focus, remove data attribute from parent
      const editorContainer = document.querySelector('.blocknote-editor');
      if (editorContainer) {
        editorContainer.setAttribute('data-editor-focused', 'false');
      }
    },
    editorProps: {
      handleKeyDown: (view, event) => {       
        // Handle keys on cover page
        if (isCoverPage) {
          const { state } = view;
          const { selection } = state;
          const cursorPos = selection.$anchor.pos;
          try {
            // Get the DOM coordinates of the cursor position
            const coords = view.coordsAtPos(cursorPos);
            const coverPageElement = view.dom.closest('.blocknote-editor[data-page-id="blocknote-page-0"]');
            
            if (coverPageElement) {
              const coverRect = coverPageElement.getBoundingClientRect();
              const cursorOffsetFromTop = coords.top - coverRect.top;
              
              // If cursor is below 800px from the top, handle specific keys
              if (cursorOffsetFromTop > 800) {
                // Allow editing on the last line (typing, backspace, delete)
                if (event.key.length === 1 || event.key === 'Delete') {return false;}
                if (event.key === 'ArrowDown' || event.key === 'Down') {
                  event.preventDefault();  // Prevent arrow down movement beyond the limit
                  return true;
                }
                // Allow arrow up movement
                if (event.key === 'ArrowUp' || event.key === 'Up') {return false; }
                event.preventDefault();
                return true;
              }
              // For arrow keys when not beyond limit, check if moving down would exceed the limit
              if (event.key === 'ArrowDown' || event.key === 'Down') {
                // Calculate where the cursor would be after moving down
                const nextPos = cursorPos + 1;
                if (nextPos < state.doc.content.size) {
                  const nextCoords = view.coordsAtPos(nextPos);
                  const nextOffsetFromTop = nextCoords.top - coverRect.top;
                  if (nextOffsetFromTop > 800) {
                    event.preventDefault(); // If moving down would exceed the limit, prevent it
                    return true;
                  }
                }
              }
            }
          } catch (error) {
            // Fallback: prevent problematic keys on cover page if we can't calculate position
            console.warn('Could not calculate cursor position, preventing action on cover page');
            if (event.key === 'ArrowDown' || event.key === 'Down') {
              event.preventDefault();
              return true;
            }
          }
        }
        return false; // Allow other keys to work normally
      },
      handlePaste: (view, event) => {
        event.preventDefault(); // Important!
        
        // Try enhanced paste handler first
        try {
          const handled = handleEnhancedPaste(editor, event, {
            handleComponentDrop,
            compressImageToBase64,
            cleanWordHtml,
            removeFontSizeFromHtml,
            removeCommentMarksFromEditorJson,
            removeCommentMarksFromHtml,
            removeCommentMarksFromText,
            parentId: id
          });
          
          if (handled) {
            return true;
          }
        } catch (error) {
          console.warn('⚠️ Enhanced paste handler failed, falling back to original:', error);
        }
        
        
      
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const tiptapJson = clipboardData.getData('application/x-tiptap-document'); // Custom MIME type for Sequoia
        const htmlContent = clipboardData.getData('text/html');
        const plainText = clipboardData.getData('text/plain');

      
        if (tiptapJson) {
          try {
            const parsedContent = JSON.parse(tiptapJson);
            if (parsedContent.type === 'doc') {
              // Strip comment marks from the pasted content
              const cleanedContent = removeCommentMarksFromEditorJson(parsedContent);
              
              const chartsToUpdate = [];
              const traverseNodes = (node, depth = 0) => {
                if (node.type === 'chart') {
                  const generatedChartLayoutId = `CHART-${shortid.generate()}`
                  chartsToUpdate.push({
                    nodeId: node.attrs.nodeId,
                    generatedChartLayoutId,
                    attrs: node.attrs
                  });
  
                  const dropProps = getDropProps({
                    parentId: id,
                    chartmeta: {
                      chartId: node.attrs.chartData?.chartId,
                      sliceName: node?.attrs?.chartData?.sliceName
                    },
                    generatedId: generatedChartLayoutId,
                  });
  
                  handleComponentDrop(dropProps);
                }
  
                if (node.content) {
                  node.content.forEach(child => traverseNodes(child, depth + 1));
                }
              };
  
              traverseNodes(cleanedContent);
              editor.commands.setContent(cleanedContent);
  
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
            }
          } catch (e) {
            return false;
          }
        } else if (plainText && plainText.trim().startsWith('{')) {
           // Only try to parse as JSON if it looks like JSON
           try {
             const parsedContent = JSON.parse(plainText);
             if (parsedContent.type === 'doc') {
               // Strip comment marks from the pasted content
               const cleanedContent = removeCommentMarksFromEditorJson(parsedContent);
              
              const chartsToUpdate = [];
              const traverseNodes = (node, depth = 0) => {
                if (node.type === 'chart') {
                  const generatedChartLayoutId = `CHART-${shortid.generate()}`
                  chartsToUpdate.push({
                    nodeId: node.attrs.nodeId,
                    generatedChartLayoutId,
                    attrs: node.attrs
                  });
  
                  const dropProps = getDropProps({
                    parentId: id,
                    chartmeta: {
                      chartId: node.attrs.chartData?.chartId,
                      sliceName: node?.attrs?.chartData?.sliceName
                    },
                    generatedId: generatedChartLayoutId,
                  });
  
                  handleComponentDrop(dropProps);
                }
  
                if (node.content) {
                  node.content.forEach(child => traverseNodes(child, depth + 1));
                }
              };
  
              traverseNodes(cleanedContent);
              editor.commands.setContent(cleanedContent);
  
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
            }
          } catch (e) {
            console.log('Plain text is not valid TipTap JSON:', e);
            // Fall through to HTML or image handling if not JSON
          }
        } else if (htmlContent && (htmlContent.includes('mso-') || htmlContent.includes('<o:p>') || htmlContent.includes('class="MsoNormal"'))) {
          console.log('Processing Word HTML content:', htmlContent.substring(0, 200) + '...');
          const cleanedHtml = cleanWordHtml(htmlContent);
          const commentCleanedHtml = removeCommentMarksFromHtml(cleanedHtml);
          console.log('After cleaning Word HTML:', commentCleanedHtml.substring(0, 200) + '...');
          editor.commands.insertContent(commentCleanedHtml);
          return true;
        } else if (htmlContent) {
          // Handle regular HTML content (font-size removal handled by RemoveFontSizeExtension)
          console.log('Processing regular HTML content:', htmlContent.substring(0, 200) + '...');
          const commentCleanedHtml = removeCommentMarksFromHtml(htmlContent);
          console.log('After cleaning regular HTML:', commentCleanedHtml.substring(0, 200) + '...');
          editor.commands.insertContent(commentCleanedHtml);
          return true;
        } else if (plainText) {
          // Handle regular plain text (not JSON)
          console.log('Processing plain text content:', plainText.substring(0, 200) + '...');
          const sanitizedText = removeCommentMarksFromText(plainText);
          console.log('After sanitizing plain text:', sanitizedText.substring(0, 200) + '...');
          editor.commands.insertContent(sanitizedText);
          return true;
        }else {
          const items = clipboardData.items;

          // Handle image paste
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
              const file = item.getAsFile();
              if (file) {
                try {
                  compressImageToBase64(file).then((base64) => {
                    const { schema, tr } = view.state;
                    const customImageNode = schema.nodes.customImage;
                  
                    if (!customImageNode) {
                      console.warn('customImage node not found in schema.');
                      return false;
                    }
                  
                    // Get current cursor position for smarter positioning
                    const { from } = view.state.selection;
                    
                    view.dispatch(
                      tr.replaceSelectionWith(
                        customImageNode.create({
                          src: base64,
                          alt: 'Compressed Pasted Image',
                        })
                      )
                    );
                    
                    // Mark newly inserted image and trigger smarter page break recalculation
                    setTimeout(() => {
                      // Find the newly inserted image and mark it
                      const images = document.querySelectorAll('.custom-image');
                      if (images.length > 0) {
                        const lastImage = images[images.length - 1];
                        lastImage.setAttribute('data-newly-inserted', 'true');
                      }
                      
                      insertPageBreaks(editor, { 
                        editMode: true, 
                        limit: 840,
                        hasImages: true,
                        newImagePosition: from
                      });
                      
                      // Remove the marker after processing
                      setTimeout(() => {
                        const markedImages = document.querySelectorAll('[data-newly-inserted="true"]');
                        markedImages.forEach(img => img.removeAttribute('data-newly-inserted'));
                      }, 500);
                    }, 200);
                  });              
                  return true;
                }  catch (error) {
                  console.error('Image compression failed:', error);
                  return false;
                }
              }
            }
          }
        }
        
        

      },
      decorations: (state) => {
        if (hoveredPos === null || isUndefined(hoveredPos)) return DecorationSet.empty;
        try {
          const $pos = state.doc.resolve(hoveredPos);
          let depth = $pos.depth;

          while (depth > 0) {
            const node = $pos.node(depth);
            if (node.type.name === 'paragraph') {
              return DecorationSet.create(state.doc, [
                Decoration.node($pos.before(depth), $pos.after(depth), {
                  style: 'border-top: 2px solid #3b82f6'
                })
              ]);
            }
            depth--;
          }
        } catch (error) {
          console.error('Error creating decoration:', error);
        }

        return DecorationSet.empty;
      },
      setHeadings,
      attributes: {
        class : 'top-level-editor'
      }
    },
    onBeforeCreate: ({ editor }) => {
      // Make editor instance available globally when created
      window.editor = editor;
      setEditorInstance(editor)
    },
    onDestroy: () => {
      // Clean up global reference when editor is destroyed
      window.editor = null;
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      let foundCommentId = null;

      editor.state.doc.nodesBetween(from, to, (node, pos) => {
        node.marks.forEach(mark => {
          if (mark.type.name === 'comment') {
            foundCommentId = mark.attrs.commentId;
          }
        });
      });

      setActiveCommentId(foundCommentId);
    },
  })

    useEffect(() => {
    if (!editor || !isCoverPage || !selectedTemplateCover) return
  
    // Handle background transitions using helper function
    const backgroundHandled = handleBackgroundTransition(editor, json_metadata, prevBackgroundRef, isCoverPage);
    
    // Check if we're transitioning from cover image to transparent/slide_color
    const isTransitioningFromCoverImage = prevBackgroundRef.current === 'coverImage' && 
      !json_metadata?.coverImage && 
      (json_metadata?.slide_color === 'transparent' || json_metadata?.slide_color);
    
    // If transitioning from cover image, always preserve existing content
    if (isTransitioningFromCoverImage) {
      const currentContent = editor.getJSON()?.content || [];
      if (currentContent.length > 0) {
        setTimeout(() => {
          const updatedContent = preserveTemplateContentAndChangeTextColor(editor.getJSON(), json_metadata, isTransitioningFromCoverImage, parentId);
          editor.commands.setContent(updatedContent, false, {
            preserveWhitespace: true,
            preserveSelection: true
          });
        }, 100);
        return;
      }
    }
    // Only return early if background was handled AND there's no template change
    const isTemplateChanged = prevTemplateRef.current !== selectedTemplateCover;
    const isCoverImageChangeForEarlyReturn = json_metadata?.coverImage && isTemplateChanged;
    // Don't return early if there's a cover image change - we need to load fresh template
    if (backgroundHandled && !isTemplateChanged && !isCoverImageChangeForEarlyReturn) {
      return;
    }

    const savedContent = component?.meta?.editorJson?.content
  const currentContent = editor.getJSON()?.content || []
  const templateContent = coverTemplateStaticMapping[selectedTemplateCover]?.(parentId, json_metadata, isTransitioningFromCoverImage) || []

  const isInitialLoad = prevTemplateRef.current === null
  prevTemplateRef.current = selectedTemplateCover

  // Check if saved content has meaningful template content
  const hasTemplateContent = checkContentForTemplatePlaceholders(savedContent, true);

  // Check if current content has user modifications
  const hasCurrentUserContent = checkContentForTemplatePlaceholders(currentContent, false);

if (isInitialLoad && Array.isArray(savedContent) && savedContent.length > 0) {
  // Check if saved content has actual user content (not just template placeholders)
  const hasActualUserContent = checkContentForTemplatePlaceholders(savedContent, false);
  
 // If saved content has actual user content, restore it instead of template
 if (hasActualUserContent) {
    editor.commands.setContent(
      { type: 'doc', content: savedContent },
      false,
      { preserveWhitespace: true, preserveSelection: true }
    )
    // Ensure background styling is applied even when loading saved content
    requestAnimationFrame(() => {
      updateBgColor(json_metadata?.slide_color, json_metadata?.coverImage);
    })
    return
  }
  }
  
  // If user has modified content, preserve it but allow template position updates
  if ((hasCurrentUserContent || userEditingRef.current) && !isInitialLoad) {
    // Only allow template position updates when user is not actively editing or typing
    if (isTemplateChanged && !editor.isFocused && !isUserTypingRef.current) {
      // Check if this is a cover image template change (not just slide_color change)
      const isCoverImageChangeForUserContent = json_metadata?.coverImage && isTemplateChanged;
      if (isCoverImageChangeForUserContent) {
        // Load fresh template for cover image changes - ignore user content
        const newDoc = { type: 'doc', content: templateContent }
        editor.commands.setContent(newDoc, false, {
          preserveWhitespace: true,
          preserveSelection: false,
        })
        requestAnimationFrame(() => {
          editor.view.updateState(editor.state)
          updateBgColor(json_metadata?.slide_color, json_metadata?.coverImage);
          debounceUpdateEditorComponent(newDoc);
        })
        return
              } else {
          setTimeout(() => {
            updateTemplatePositions(editor, selectedTemplateCover, parentId, isUserTypingRef, json_metadata, isTransitioningFromCoverImage);
          }, 100);
        }
    }
    return
  }
  
  // Load template content on initial load (when no meaningful content) or template change
  if ((isInitialLoad || isTemplateChanged) && Array.isArray(templateContent)) {
    // For cover image changes, always load fresh template regardless of user content
    if (!hasCurrentUserContent || isInitialLoad) {
      const newDoc = {
        type: 'doc',
        content: templateContent,
      }
      editor.commands.setContent(newDoc, false, {
        preserveWhitespace: true,
        preserveSelection: false,
      })
      requestAnimationFrame(() => {
        editor.view.updateState(editor.state)
        // Ensure background styling is applied when loading template content
        updateBgColor(json_metadata?.slide_color, json_metadata?.coverImage);
        // Position cursor after cover title for cover pages
        if (isCoverPage) {
          setTimeout(() => {
            setCursorAfterCoverTitle(editor);
          }, 100);
        }
        // Save template content to component metadata
        debounceUpdateEditorComponent(newDoc);
      })
    }
  }

}, [editor, selectedTemplateCover, isCoverPage, component?.meta?.editorJson, parentId, json_metadata?.slide_color,])

  // Specific useEffect to handle background transitions and preserve content
  useEffect(() => {
    handleTransparentBackgroundTransition(editor, json_metadata, prevBackgroundRef, isCoverPage);
  }, [json_metadata?.coverImage, json_metadata?.slide_color, isCoverPage, editor]);

  // Specific useEffect to handle slide_color changes and preserve template content
  useEffect(() => {
    if (!isCoverPage || !editor) return;
    
    // Check if we're transitioning from cover image to slide_color
    const isTransitioningFromCoverImage = prevBackgroundRef.current === 'coverImage' && 
      !json_metadata?.coverImage && 
      json_metadata?.slide_color;
    
    if (isTransitioningFromCoverImage) {
      const currentContent = editor.getJSON()?.content || [];
      if (currentContent.length > 0) {
        // Always preserve template content with positions and styles
        setTimeout(() => {
          const updatedContent = preserveTemplateContentAndChangeTextColor(editor.getJSON(), json_metadata, isTransitioningFromCoverImage, parentId);
          editor.commands.setContent(updatedContent, false, {
            preserveWhitespace: true,
            preserveSelection: true
          });
          // Position cursor after cover title for cover pages
          if (isCoverPage) {
            setTimeout(() => {
              setCursorAfterCoverTitle(editor);
            }, 50);
          }
        }, 100);
      }
    }
  }, [json_metadata?.slide_color, isCoverPage, editor]);

// Add specific useEffect to handle background updates when component changes (during save)
useEffect(() => {
  if (!isCoverPage || !editor) return;
  // Apply background color when component changes (happens during save)
  requestAnimationFrame(() => {
    updateBgColor(json_metadata?.slide_color, json_metadata?.coverImage);
  });
}, [component, isCoverPage, editor, json_metadata?.slide_color, json_metadata?.coverImage])

  // Immediate background update when cover page settings change
  useEffect(() => {
    if (!isCoverPage || !editor) return;
    // Force immediate background update when cover page settings change
    updateBgColor(json_metadata?.slide_color, json_metadata?.coverImage);
  }, [json_metadata?.slide_color, json_metadata?.coverImage, isCoverPage, editor]);

  // Consolidated effect to handle background updates for cover pages
  useEffect(() => {
    if (!isCoverPage) return;
    const updateBackground = () => {
      requestAnimationFrame(() => { updateBgColor(json_metadata?.slide_color, json_metadata?.coverImage)});
    };
    let observer = null;
    if (editor) {
      // Listen for editor events
      editor.on('command', updateBackground);
      editor.on('selectionUpdate', updateBackground);
    }

    // Set up mutation observer for DOM changes
    const editorContainer = document.querySelector('.blocknote-editor');
    if (editorContainer) {
      observer = new MutationObserver((mutations) => {
        const hasContentChanges = mutations.some(mutation => 
          mutation.type === 'childList' || 
          (mutation.type === 'attributes' && mutation.attributeName === 'class')
        );
        if (hasContentChanges) {updateBackground()};
      });
      observer.observe(editorContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }
    return () => {
      if (editor) {
        editor.off('command', updateBackground);
        editor.off('selectionUpdate', updateBackground);
      }
      if (observer) { observer.disconnect()}
    };
  }, [editor, isCoverPage, json_metadata?.slide_color, json_metadata?.coverImage]);


  useImperativeHandle(ref, () => ({
    updateNodeAtPosition(pos, color, isBackground) {

      // Make sure editor exists and pos is valid
      if (!editor) {
        console.log('Editor not initialized');
        return;
      }

      if (pos < 0 || pos > editor.state.doc.content.size) {
        console.log('Invalid position:', pos, 'doc size:', editor.state.doc.content.size);
        return;
      }

      const node = editor.state.doc.nodeAt(pos);


      editor.chain()
        .focus()
        .command(({ tr }) => {
          // Update the node attributes
          tr.setNodeMarkup(pos, null, {
            ...node.attrs,
            [isBackground ? 'data-bg-color' : 'data-text-color']: color
          });
          return true;
        })
        .run();
    },

    deleteNodeAtPosition(pos) {
      if (!editor) {
        console.log('Editor not initialized');
        return;
      }

      if (pos < 0 || pos > editor.state.doc.content.size) {
        console.log('Invalid position:', pos, 'doc size:', editor.state.doc.content.size);
        return;
      }

      editor.chain()
        .focus()
        .command(({ tr }) => {
          const emptyParagraph = editor.schema.nodes.paragraph.create({
            'data-text-color': 'Default',
            'data-bg-color': 'Default'
          });

          const node = tr.doc.nodeAt(pos);
          if (!node) return false;

          tr.replaceWith(pos, pos + node.nodeSize, emptyParagraph);

          return true;
        })
        .run();
    },
  }));

  // Custom comment extension
  const handleAddComment = useCallback((text) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const id = `comment-${Date.now()}`;

    editor.chain().focus().setComment(id).run();

  //   const user = {
  //     displayName: bootstrapData?.user?.displayName,
  //     firstName: bootstrapData?.user?.firstName,
  //     imageUrl: bootstrapData?.user?.imageUrl,
  //     lastName: bootstrapData?.user?.lastName,
  //     userObjId: bootstrapData?.user?.userObjId,
  // };
  const userDisplayName = bootstrapData?.user?.displayName || 'Current User';

    setComments(prev => [...prev, {
      id,
      user: userDisplayName,
      text,
      timestamp: new Date(),
      from,
      to,
    }]);
  }, [editor]);

  const handleCommentClick = useCallback((from, to) => {
    if (!editor) return;

    editor.commands.focus();
    editor.commands.setTextSelection({ from, to });
  }, [editor]);

  const handleEditComment = useCallback((id, newText) => {
    setComments(prev => prev.map(comment => 
      comment.id === id ? { ...comment, text: newText } : comment
    ));
  }, []);

  const handleDeleteComment = useCallback((id) => {
    setCommentToDelete(id);
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!commentToDelete || !editor) return;

    // Remove the comment mark from the text
    editor.state.doc.nodesBetween(0, editor.state.doc.content.size, (node, pos) => {
      node.marks.forEach(mark => {
        if (mark.type.name === 'comment' && mark.attrs.commentId === commentToDelete) {
          editor.chain().setTextSelection({ from: pos, to: pos + node.nodeSize }).unsetComment().run();
        }
      });
    });

    // Remove the comment from the state
    setComments(prev => prev.filter(comment => comment.id !== commentToDelete));
    setDeleteModalOpen(false);
    setCommentToDelete(null);
  }, [commentToDelete, editor]);

const handlePageBreaks = () => {
    if (USE_PAGINATION_PLUS) {
      setTimeout(() => {
        updateBgColor(json_metadata?.slide_color, json_metadata?.coverImage)
      }, 302)
      return;
    }
    insertPageBreaks(editor,  { "editMode": editMode, slideBgColor: json_metadata?.slide_color, coverImage: json_metadata?.coverImage })
    setTimeout(()=>{
      updateBgColor(json_metadata?.slide_color, json_metadata?.coverImage)
    },302)
}

  const handleUpdateFooterOnlyPosition = () => {
    if(USE_PAGINATION_PLUS) { return; }
    if(!isCoverPageEditor(editor)) {
    // Update dynamic height based on page breaks
    const newHeight = calculateDynamicHeight(editor);
      if (newHeight !== dynamicHeight) {
        setDynamicHeight(newHeight);
      }
      handleFooterOnlyPositioning(newHeight)
    }
  }

  useEffect(() => {
    return () => {
      window.editor = null;
      hideBubbleMenus(); // Clean up bubble menus on unmount
    };
  }, [editor]);

  useEffect(() => {
    newEvent.addListener('event-reInitializePageBreak', handlePageBreaks)
    newEvent.addListener('event-updateFooterOnlyPosition', handleUpdateFooterOnlyPosition)
    // Listen for template content restoration events
          const handleRestoreTemplateContentEvent = () => {handleRestoreTemplateContent(editor, isCoverPage, selectedTemplateCover, parentId, json_metadata, isTransitioningFromCoverImage)};
    document.addEventListener('restore-template-content', handleRestoreTemplateContentEvent);
    return () => {
      newEvent.removeListener('event-reInitializePageBreak', handlePageBreaks)
      newEvent.removeListener('event-updateFooterOnlyPosition', handleUpdateFooterOnlyPosition)
      document.removeEventListener('restore-template-content', handleRestoreTemplateContentEvent);
    }
  }, [])



  useEffect(() => {
    setTimeout(function(){
            updateBgColor(json_metadata?.slide_color, json_metadata?.coverImage)
    },300);
    
  }, [json_metadata?.slide_color, json_metadata?.coverImage])

   useEffect(() => {
    newEvent.addListener('event-updateColor', updateBgColor)

    return () => {
      newEvent.removeListener('event-updateColor', updateBgColor)
    }
  }, [])

  // Inline edit for PaginationPlus footer left area — placed above early returns
useEffect(() => {
  if (!isMounted || !editor || typeof document === 'undefined' || !editMode) return;

  // Ensure pointer cursor once
  const styleId = 'rm-footer-inline-editor-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `.blocknote-editor[data-edit-mode="true"] .rm-page-footer-left{cursor:pointer}`;
    document.head.appendChild(style);
  }

  const commitValue = (container, value, save = true, originalVal = '') => {
    const finalVal = save ? value : originalVal || '+ Add Footer'; // no Redux fallback here
    // normalize to string (allow empty string to clear footer)
    let safeVal = (finalVal ?? '').toString();
    const hadPageNums = !!showPageNumbers;
    dispatch(dashboardFooterChanged(safeVal));
    if (hadPageNums) { dispatch(dashboardPageNumberChanged(1)); }
    try { editor.commands.updateAllHeaderFooterTexts(safeVal, headerTextFromRedux); } catch {}
    if(!safeVal) { safeVal = '+ Add Footer'; }
    // Let the plugin do any re-render, then enforce DOM
    requestAnimationFrame(() => {
      document.querySelectorAll('.rm-page-footer-left').forEach(el => { el.textContent = safeVal; });
      if (container) {
      container.textContent = safeVal || '+ Add Footer';
      container.removeAttribute('data-editing');
      }
      updateRmPageNumbers();
    });
  };

  const beginEdit = (container) => {
    if (!container || container.getAttribute('data-editing') === 'true') return;
    container.setAttribute('data-editing', 'true');
    const originalVal =
    (footerTextFromRedux ?? '').toString(); // snapshot the current redux value now
    const input = document.createElement('input');
    input.type = 'text';
    input.value = footerTextFromRedux || '';
    input.placeholder = 'Footer';
    input.maxLength = 64
    Object.assign(input.style, {
      border: 'none', outline: 'none', background: 'transparent',
      width: '100%', fontSize: '12px', color: '#9C9C9C', padding: '0', margin: '0',
    });
    container.textContent = '';
    container.appendChild(input);
    input.focus(); input.select();

    const onBlur = () => { commitValue(container, input.value, true, originalVal); cleanup(); };
    const onKey = (e) => {
      // Keep typing keys working while preventing the editor from intercepting
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); commitValue(container, input.value, true, originalVal); cleanup(); }
      else if (e.key === 'Escape') { e.preventDefault(); commitValue(container, input.value, false, originalVal); cleanup(); }
      // For Backspace and other editing keys, allow default behavior so input edits occur
    };
    const cleanup = () => {
      input.removeEventListener('blur', onBlur);
      input.removeEventListener('keydown', onKey);
    };
    input.addEventListener('blur', onBlur);
    input.addEventListener('keydown', onKey);
  };

  const onDocClick = (ev) => {
    const target = ev.target;
    if (!(target && target.closest)) return;
    const footerLeft = target.closest('.rm-page-footer-left');
    if (!footerLeft) return;
    ev.preventDefault(); ev.stopPropagation();
    beginEdit(footerLeft);
  };

  document.addEventListener('click', onDocClick, true);
  return () => document.removeEventListener('click', onDocClick, true);

}, [isMounted, editor, headerTextFromRedux, footerTextFromRedux, dispatch, showPageNumbers, editMode]);

  // Inline edit for PaginationPlus first-page header left area
  useEffect(() => {
    if (!isMounted || !editor || typeof document === 'undefined' || !editMode) return;

    // Ensure pointer cursor once
    const styleId = 'rm-header-inline-editor-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `.blocknote-editor[data-edit-mode=\"true\"] .rm-first-page-header-left,
      .blocknote-editor[data-edit-mode=\"true\"] .rm-page-header-left {
        cursor:pointer
      }`;
      document.head.appendChild(style);
    }

    const commitHeader = (container, value, save = true, originalVal = '') => {
      const finalVal = save ? value : originalVal || '+ Add Header';
      let safeVal = (finalVal ?? '').toString();
      const hadPageNums = !!showPageNumbers;
      dispatch(dashboardHeaderChanged(safeVal));
      if (hadPageNums) { dispatch(dashboardPageNumberChanged(1)); }
      try { editor.commands.updateAllHeaderFooterTexts(footerTextFromRedux, safeVal); } catch {}
      if(!safeVal) { safeVal = '+ Add Header'; }
      requestAnimationFrame(() => {
        document.querySelectorAll('.rm-first-page-header-left').forEach(el => { el.textContent = safeVal; });
        document.querySelectorAll('.rm-page-header-left').forEach(el => { el.textContent = safeVal; });
        if (container) {
          container.textContent = safeVal;
          container.removeAttribute('data-editing');
        }
        updateRmPageNumbers();
      });
    };

    const beginHeaderEdit = (container) => {
      if (!container || container.getAttribute('data-editing') === 'true') return;
      container.setAttribute('data-editing', 'true');
      const originalVal = (headerTextFromRedux ?? '').toString();
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Header';
      input.value = originalVal;
      input.maxLength = 64
      Object.assign(input.style, {
        border: 'none', outline: 'none', background: 'transparent',
        width: '100%', fontSize: '12px', color: '#9C9C9C', padding: '0', margin: '0',
      });
      container.textContent = '';
      container.appendChild(input);
      input.focus(); input.select();

      const onBlur = () => { commitHeader(container, input.value, true, originalVal); cleanup(); };
      const onKey = (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); commitHeader(container, input.value, true, originalVal); cleanup(); }
        else if (e.key === 'Escape') { e.preventDefault(); commitHeader(container, input.value, false, originalVal); cleanup(); }
      };
      const cleanup = () => {
        input.removeEventListener('blur', onBlur);
        input.removeEventListener('keydown', onKey);
      };
      input.addEventListener('blur', onBlur);
      input.addEventListener('keydown', onKey);
    };

    const onDocClick = (ev) => {
      const target = ev.target;
      if (!(target && target.closest)) return;
      const headerLeft = target.closest('.rm-first-page-header-left') || target.closest('.rm-page-header-left');
      if (!headerLeft) return;
      ev.preventDefault(); ev.stopPropagation();
      beginHeaderEdit(headerLeft);
    };

    document.addEventListener('click', onDocClick, true);
    return () => document.removeEventListener('click', onDocClick, true);

  }, [isMounted, editor, headerTextFromRedux, footerTextFromRedux, dispatch, showPageNumbers, editMode]);

  // Hide header/footer by default and show on hover (scoped to edit mode only)
  useEffect(() => {
    if (!isMounted || !editor || typeof document === 'undefined') return;
    const styleId = 'rm-hdr-ftr-hover-style';
    let style = document.getElementById(styleId);
    if (!editMode) {
      if (style) style.textContent = '';
      return;
    }
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = `
      .blocknote-editor[data-edit-mode="true"] .rm-page-header,
      .blocknote-editor[data-edit-mode="true"] .rm-page-footer,
      .blocknote-editor[data-edit-mode="true"] .rm-first-page-header {
        opacity: 0;
        transition: opacity 0.15s ease-in-out;
      }
      .blocknote-editor[data-edit-mode="true"] .rm-page-header:hover,
      .blocknote-editor[data-edit-mode="true"] .rm-page-header:focus-within,
      .blocknote-editor[data-edit-mode="true"] .rm-page-footer:hover,
      .blocknote-editor[data-edit-mode="true"] .rm-page-footer:focus-within,
      .blocknote-editor[data-edit-mode="true"] .rm-first-page-header:hover,
      .blocknote-editor[data-edit-mode="true"] .rm-first-page-header:focus-within {
        opacity: 1;
      }
      /* Page number remove popover styling */
      .blocknote-editor[data-edit-mode="true"] .rm-page-footer{ overflow: visible !important; }
      .blocknote-editor[data-edit-mode="true"] .rm-page-footer-right{ position: relative; overflow: visible; }
      .blocknote-editor[data-edit-mode="true"] .rm-page-footer:hover .rm-page-number-popover,
      .blocknote-editor[data-edit-mode="true"] .rm-page-footer:focus-within .rm-page-number-popover{ opacity:1; pointer-events:auto; }
    `;
  }, [isMounted, editor, editMode]);

  // In edit mode, if Redux has header/footer text OR page numbers are enabled, show the footer by default
  useEffect(() => {
    if (!isMounted || !editor || typeof document === 'undefined' || !editMode) return;
    addVisibleClassToHeaderAndFooter()
  }, [isMounted, editor, editMode, headerTextFromRedux, footerTextFromRedux, showPageNumbers]);

  // Handle click on "+ Add Page Number" button (edit mode only)
  useEffect(() => {
    if (!isMounted || !editor || typeof document === 'undefined' || !editMode) return;
    const onClick = (ev) => {
      const target = ev.target;
      if (!(target && target.closest)) return;
      const addBtn = target.closest('.add-page-number-btn');
      if (addBtn) {
        ev.preventDefault(); ev.stopPropagation();
        dispatch(dashboardPageNumberChanged(1));
        requestAnimationFrame(() => {
          updateRmPageNumbers(1)
        });
        return;
      }
      const removeBtn = target.closest('.rm-page-number-remove');
      if (removeBtn) {
        ev.preventDefault(); ev.stopPropagation();
        dispatch(dashboardPageNumberChanged(0));
        requestAnimationFrame(() => {
          updateRmPageNumbers(0)
        });
        return;
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [isMounted, editor, editMode, dispatch, updateRmPageNumbers]);

  // Function to handle FooterOnly and PageBreak component recreation on mode change
  const recreateModeSpecificComponents = useCallback(() => {
    if (USE_PAGINATION_PLUS) return;
    if (!editor) return;

    const currentState = editor.view.state;
    const currentDoc = currentState.doc;
    const footerOnlyNode = currentState.schema.nodes.footerOnly;
    const pageBreakNode = currentState.schema.nodes.pageBreak;
    
    let tr = currentState.tr;
    const componentsToRecreate = [];

    // Find all FooterOnly and PageBreak components
    currentDoc.descendants((node, pos) => {
      if (node.type.name === 'footerOnly' || node.type.name === 'pageBreak') {
        componentsToRecreate.push({
          type: node.type.name,
          position: pos,
          nodeSize: node.nodeSize,
          attrs: { ...node.attrs }
        });
      }
    });

    if (componentsToRecreate.length === 0) return;

    // Process components in reverse order to maintain positions
    componentsToRecreate.reverse().forEach(({ type, position, nodeSize, attrs }) => {
      // Delete the old component
      tr = tr.delete(position, position + nodeSize);
      
      // Create new component with updated editMode
      const updatedAttrs = { ...attrs, editMode: editMode };
      const nodeToCreate = type === 'footerOnly' ? footerOnlyNode : pageBreakNode;
      
      if (nodeToCreate) {
        tr = tr.insert(position, nodeToCreate.create(updatedAttrs));
      }
    });

    if (tr.docChanged) {
      editor.view.dispatch(tr);
    }
  }, [editor, editMode]);

  useEffect(() => {
    if (editor) {
      // Set editable state
      editor.setEditable(editMode);
      // Recreate FooterOnly and PageBreak components when mode changes
      setTimeout(() => {
        recreateModeSpecificComponents();
      }, 50);

      if (editMode) {
        // Force update to ensure table handlers are initialized
        const tr = editor.state.tr;
        editor.view.dispatch(tr);

        const scrollPos = window.scrollY;

        setTimeout(() => {
          // For cover pages, position cursor after the cover title
          // For regular pages, position cursor at start
          if (isCoverPage) {
            // Position cursor after the cover title
            setCursorAfterCoverTitle(editor);
          } else {
            // For non-cover pages, position at start
            editor.commands.focus('start', { scrollIntoView: false });
          }
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollPos);
          });
        }, 0);
        if (!USE_PAGINATION_PLUS) {
          setTimeout(() => {
            insertPageBreaks(editor, {"editMode": editMode, slideBgColor: json_metadata?.slide_color, coverImage: json_metadata?.coverImage})
          }, 100)
        }
      } else {
        // Wait for all elements to be rendered (no elements with height 0)
        const waitForElementsToRender = () => {
          const checkElementsRendered = () => {
            const editorElement = editor.view.dom;
            const allElements = document.querySelectorAll('.ProseMirror.top-level-editor > *');
            
            // Check for unrendered elements
            const unrenderedElements = Array.from(allElements).filter(el => {

              const height = el.offsetHeight;
              const computedStyle = window.getComputedStyle(el);
              
              // Skip elements that are intentionally hidden or can have 0 height
              if (computedStyle.display === 'none' || 
                  computedStyle.visibility === 'hidden' ||
                  el.tagName === 'SCRIPT' ||
                  el.tagName === 'STYLE' ||
                  el.tagName === 'BR' ||
                  el.classList.contains('node-footerOnly')) {
                return false;
              }
              
              // Check if element has content but no height (unrendered)
              const hasContent = el.textContent.trim() !== '';
              if(hasContent && height === 0) {
                console.log("AAAAElement with zero height::", el)
              }
              return hasContent && height === 0;
            });
            
            if (unrenderedElements.length === 0) {

              // Wait for all images inside the editor to load before proceeding
              const images = Array.from(editorElement.querySelectorAll('img'));
              if (images.length > 0) {
                let loadedCount = 0;
                const checkAllLoaded = () => {
                  loadedCount++;
                  if (loadedCount === images.length) {
                    // All images loaded, proceed
                    if (!USE_PAGINATION_PLUS) {
                      insertPageBreaks(editor, {"editMode": editMode, slideBgColor: json_metadata?.slide_color, coverImage: json_metadata?.coverImage});
                    }
                    const topLevelEditor = editorElement.closest('.top-level-editor');
                    if (topLevelEditor) {
                      topLevelEditor.classList.add('all-elements-rendered');
                    }
                  }
                };
                images.forEach(img => {
                  if (img.complete && img.naturalHeight !== 0) {
                    checkAllLoaded();
                  } else {
                    img.addEventListener('load', checkAllLoaded, { once: true });
                    img.addEventListener('error', checkAllLoaded, { once: true });
                  }
                });
                return; // Don't proceed until images are loaded
              }
              
              // insertPageBreaks(editor, {"editMode": editMode, slideBgColor: json_metadata?.slide_color, coverImage: json_metadata?.coverImage});
              // const topLevelEditor = editorElement.closest('.top-level-editor');
              // if (topLevelEditor) {
              //   topLevelEditor.classList.add('all-elements-rendered');
              // }
              
            } else {
              setTimeout(checkElementsRendered, 100);
            }
          };
          
          checkElementsRendered();
        };
        
        // Start checking after a small delay to allow initial rendering
       // setTimeout(waitForElementsToRender, 100);
      if (!USE_PAGINATION_PLUS) {
        setTimeout(waitForElementsToRender, 2000);
      }
      
      }
    }
  }, [editor, editMode])


  // Don't render until client-side
  if (!isMounted) {
    return null;
  }

  if (!editor) {
    return null;
  }

  // Function for inserting normal table without attributes
  const insertNormalTable = () => {
    editor.chain()
      .focus()
      .insertContent({
        type: 'table',
        attrs: {
          'data-table-type': 'normal',
          'data-is-chart-table': 'false',

        },
        content: [{
          type: 'tableRow',
          content: Array(3).fill({
            type: 'tableHeader',
            content: [{ type: 'paragraph' }]
          })
        },
        ...Array(2).fill({
          type: 'tableRow',
          content: Array(3).fill({
            type: 'tableCell',
            content: [{ type: 'paragraph' }]
          })
        })]
      })
      .run();
  };

  // Function for inserting chart table with attributes
  const insertChartTable = () => {
    const tableId = Math.random().toString(36).substr(2, 9);

    editor.chain()
      .focus()
      .insertContent({
        type: 'table',
        attrs: {
          'data-table-type': 'chart',
          'data-created-at': new Date().toISOString(),
        },
        content: [{
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              content: [
                { type: 'paragraph', content: [] },
                { type: 'paragraph', content: [] },
                { type: 'paragraph', content: [] },
                { type: 'paragraph', content: [] }
              ]
            },
            {
              type: 'tableCell',
              content: [
                { type: 'paragraph', content: [] },
                { type: 'paragraph', content: [] },
                { type: 'paragraph', content: [] },
                { type: 'paragraph', content: [] }
              ]
            },
            {
              type: 'tableCell',
              content: [
                { type: 'paragraph', content: [] },
                { type: 'paragraph', content: [] },
                { type: 'paragraph', content: [] },
                { type: 'paragraph', content: [] }
              ]
            }
          ]
        }]
      })
      .run();
  };

  const handleCustomEmojiAdded = async (newEmoji) => {
    try {
      // Add to storage
      const updatedEmojis = customEmojiStorage.add(newEmoji)

      // Force editor to re-render emoji suggestions
      editor.commands.focus()

      return updatedEmojis
    } catch (error) {
      console.error('Error adding custom emoji:', error)
      throw error // Re-throw to be handled by the modal
    }
  }



  return (
    <>
    <BlockNoteTableGlobalStyles editor={editor}/>
          <EditorContainer
        className="editor-container blocknote-editor"
        data-editor-focused={editor?.isFocused}
        data-template-cover={selectedTemplateCover}
        data-edit-mode={editMode ? 'true' : 'false'}
        $editMode={editMode}
        $isDarkMode={isDarkMode}
        $dynamicHeight={dynamicHeight}
        id={`${parentId}-editor-container`}
        ref={divRef}
        $isCoverPage={isCoverPage}
        $selectedTemplateCover={selectedTemplateCover}
      >
      {editor && <TextBubbleMenu editor={editor} onAddComment={handleAddComment}/>}
      {editor && <ChartBubbleMenu editor={editor} />}
      <AddEmojiModal
        isOpen={isEmojiModalOpen}
        onClose={() => setIsEmojiModalOpen(false)}
        onEmojiAdded={handleCustomEmojiAdded}
      />
      <EditorContent editor={editor} />
    </EditorContainer>
    </>
    
  );
});

export default TipTapEditor;