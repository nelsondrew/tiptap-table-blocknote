import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import styled, { createGlobalStyle } from "styled-components";
import TipTapEditor from "./components-tip-tap/TipTapEditor";
import { Plus, GripVertical, Trash2, Palette, Check } from "lucide-react";
import AddBlockMenu from "./components-tip-tap/AddBlockMenu";
import { Popover, Menu } from "antd";
import { setTippyVisibilityCallback } from "./components-tip-tap/extensions/SlashCommand";
import { TwoColBubbleMenuProvider } from "./components-tip-tap/TwoColBubbleMenuContext";


// import React, { useState, useRef, useEffect, useCallback } from 'react';
// import styled, { createGlobalStyle } from "styled-components";
// import TipTapEditor from "./components-tip-tap/TipTapEditor"
// import { useSelector } from 'react-redux';
// import { Plus, GripVertical, Trash2, Palette, Check } from 'lucide-react';
// import AddBlockMenu from './components-tip-tap/AddBlockMenu';
// import { Popover, Menu } from 'antd';
import ViewModeTextBubbleMenu from "./components-tip-tap/ViewModeTextBubbleMenu";
// import { TextBubbleMenu } from "./components-tip-tap/TextBubbleMenu";
import getBootstrapData from 'src/utils/getBootstrapData';

// Utils
import { handleBubbleMenusOnEditModeChange } from './utils/bubbleMenuHelpers';

// Comment
import { getCommentAnchorFromSelection } from './components-tip-tap/extensions/Comments/CommentAnchor';

// Comment - Redux
import { updateComponents } from "src/dashboard/actions/dashboardLayout";
import { dashboardInfoChanged } from "src/dashboard/actions/dashboardInfo";

// Thread API sync
import useChartThreads from 'src/hooks/apiResources/dashboardChartThread';

// Styles
import "./components-tip-tap/styles/tiptap.less";
import { updateBgColor } from "./Components/updateBgColor";
// import { setTippyVisibilityCallback } from './components-tip-tap/extensions/SlashCommand';
import { newEvent } from 'src/components/ListView/utils'

const GlobalPopoverStyles = createGlobalStyle`
  .ant-menu-vertical {
    box-shadow: none !important;
    &.ant-menu-sub {
      width: 200px !important;
      overflow-y: scroll;
      overflow-x: hidden;
      padding: 8px;
      border-radius: 12px;
      box-shadow: 4px 12px 12px 0px rgba(0,0,0,0.1) !important; 
    }
  }

  .ant-popover-inner {
    border-radius: 12px;
    padding: 0;
  }

  .ant-popover-inner-content {
    padding: 0;
  }

  .ant-popover-arrow {
    color: black;
    border-top-color: black !important;
    border-left-color: black !important;
  }

  .ant-popover {
    z-index: 1000;
  }
`;

const EditorContainer = styled.div`
  text-align: left;
  border: ${(props) =>
    props.$isDarkMode ? "0.5px solid gray" : "none !important"};

  box-shadow: none !important;
  border-radius: 4px;
  min-height: 200px;
  position: relative;
  padding-left: 0.5rem;

  .top-level-editor {
    padding: 12px;
    padding-top: 0px;
    position: relative;
    padding-left: 3.5rem;
    padding-bottom: 0px;

    &:focus {
      outline: none;
    }

    > * + * {
      margin-top: 0.75em;
    }

    p {
      margin: 0;
      position: relative;
      padding-left: 2rem; /* Make space for the buttons */
    }

    /* Create hover area */
    p::before {
      content: "";
      position: absolute;
      left: -2rem;
      top: 0;
      width: calc(100% + 4rem);
      height: 100%;
      pointer-events: none;
    }

    /* Button container */
    .line-buttons {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      display: none;
      gap: 0.5rem;
      align-items: center;
    }

    /* Show buttons on hover */
    p:hover .line-buttons {
      display: flex;
    }

    /* Button styles */
    .line-button {
      background: none;
      border: none;
      cursor: pointer;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      color: #666;

      &:hover {
        background: #f1f3f5;
      }
    }

    // table {
    //   border-collapse: collapse;
    //   table-layout: fixed;
    //   width: 100%;
    //   margin: 0;
    //   overflow: hidden;
    // }

    // td,
    // th {
    //   min-width: 1em;
    //   border: 2px solid #ced4da;
    //   padding: 3px 5px;
    //   vertical-align: top;
    //   box-sizing: border-box;
    //   position: relative;

    //   > * {
    //     margin-bottom: 0;
    //   }
    // }

    // th {
    //   font-weight: bold;
    //   background-color: #f8f9fa;
    // }

    // .table-container {
    //   position: relative;
    //   margin: 2rem 0;

    //   .table-edit-button {
    //     position: absolute;
    //     top: -30px;
    //     right: 0;
    //     padding: 4px 8px;
    //     background: #ffffff;
    //     border: 1px solid #e0e0e0;
    //     border-radius: 4px;
    //     cursor: pointer;
    //     font-size: 13px;
    //     color: #333;
    //     opacity: 0;
    //     transition: opacity 0.2s ease;
    //     box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    //     &:hover {
    //       background: #f8f9fa;
    //       border-color: #ccc;
    //     }
    //   }

    //   &:hover .table-edit-button {
    //     opacity: 1;
    //   }
    // }
  }

  .slash-menu {
    padding: 0.5rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.05),
      0px 10px 20px rgba(0, 0, 0, 0.1);
  }

  .slash-menu-item {
    display: block;
    width: 100%;
    padding: 0.5rem;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;

    &:hover {
      background: #f1f3f5;
      border-radius: 0.3rem;
    }
  }
`;

// Update HoverIndicator styling
const HoverIndicator = styled.div`
  position: absolute;
  left: 5px; //45px;
  display: flex;
  gap: 6px; //4px;
  /* background: #fff; */
  /* border: 1px solid #eee; */
  padding: 4px;
  border-radius: 4px;
  z-index: 50;
  /* box-shadow: 0 2px 4px rgba(0,0,0,0.1); */
`;

const IconButton = styled.button`
  width: 24px;
  height: 24px;
  padding: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #9c9c9c;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -8px;

  /* &:hover {
    background: #F3F4F6;
    color: #111827;
  } */
`;

// Add color options
const TEXT_COLORS = [
  { name: "Default", color: "#000", hasCheck: true },
  { name: "Grey", color: "#9CA3AF" },
  { name: "Brown", color: "#A47148" },
  { name: "Red", color: "#EF4444" },
  { name: "Orange", color: "#F97316" },
  { name: "Yellow", color: "#EAB308" },
  { name: "Green", color: "#22C55E" },
  { name: "Blue", color: "#3B82F6" },
  { name: "Purple", color: "#A855F7" },
  { name: "Pink", color: "#EC4899" },
];

const BACKGROUND_COLORS = [
  { name: "Default", color: "transparent", hasCheck: true },
  { name: "Gray", color: "#6B7280" },
  { name: "Brown", color: "#92400E" },
  { name: "Red", color: "#991B1B" },
  { name: "Orange", color: "#9A3412" },
  { name: "Yellow", color: "#854D0E" },
  { name: "Green", color: "#166534" },
  { name: "Blue", color: "#1E40AF" },
  { name: "Purple", color: "#6B21A8" },
  { name: "Pink", color: "#9D174D" },
];

// Update the styled menu
const StyledMenu = createGlobalStyle`
  .ant-popover-content {
    .ant-popover-arrow {
      border-color: #fff !important;
    }
    .ant-popover-inner {
      background: #fff !important;
    }
  }

  .ant-menu {
    // background: #fff !important; //#1a1a1a !important;
    // padding: 4px;
    // min-width: 220px;
    // border-radius: 8px;

  background: #fff !important; //#1a1a1a;
  border-radius: 12px;
  // box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  color: #f4f4f4; //#fff;
  overflow: hidden;
  padding: 6px;
  /* width: 320px; */
  overflow: scroll;
  /* max-height: 400px; */
  // display: flex;
  // flex-direction: column;
    &.six-dot-menu {
      width: 320px;
      max-height: 400px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    }
  }

  .ant-menu-submenu-title,
  .ant-menu-item {
    color: rgb(80, 78, 78); //#ffffff !important;
    padding: 8px 12px !important;
    height: auto !important;
    line-height: 1.2 !important;
    margin: 0 !important;
    border-radius: 4px;
    display: flex !important;
    align-items: center;
    gap: 8px;
    font-size: 14px;

    &:hover {
      // background: #2d2d2d !important;
      background: rgb(131, 128, 128);
      color: #ffffff !important;
      cursor: pointer;
    }

    svg {
      width: 16px;
      height: 16px;
    }
  }

  .ant-menu-submenu-popup {
    .ant-menu {
      // background: #1a1a1a !important;
       background: #fff;
    }
  }

  .color-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 4px;

    .color-letter {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
    }

    .check-icon {
      margin-left: auto;
    }
  }

  .color-section-title {
    color: #666;
    font-size: 0.875rem;
    font-weight: 600;
    padding: 8px 12px;
    text-transform: uppercase;
    margin-bottom: 4px;
    margin-top: 4px;
  }
`;

export default function BlockNoteEditor({
  component,
  hoveredPos,
  setHoveredPos,
  setHeadings,
  parentId,
  editorInstance,
  setEditorInstance,
  handleComponentDrop,
  isEmojiModalOpen,
  setIsEmojiModalOpen,
  isCoverPage,
  selectedTemplateCover,
  coverOverlayTexts,
  onOverlayTextChange,
  coverTemplates,
}) {
  const dispatch = useDispatch();
  const editMode = useSelector((state) => state?.dashboardState?.editMode);
  const [editorContent, setEditorContent] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const editorRef = useRef(null);
  const [isOverPopup, setIsOverPopup] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [showDragMenu, setShowDragMenu] = useState(false);
  const editorInstanceRef = useRef(null);
  const isDarkMode = useSelector((state) => state?.dashboardState?.darkMode);

  // Comments
  const [comments, setComments] = useState([]);
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const bootstrapData = getBootstrapData();
  const dashboardId = useSelector(state => state?.dashboardInfo?.id);

  // Page - Redux
  const metadata = useSelector(state => state?.dashboardInfo?.metadata);
  const pagesData = useSelector(state => state?.dashboardInfo?.metadata?.pagesData || {});
  const dashboardTitle = useSelector(state => state.dashboardInfo.dashboard_title);
  const layout = useSelector(state => state.dashboardLayout.present);
  const owners = useSelector(state => state.dashboardInfo.owners);
  const roles = useSelector(state => state.dashboardInfo.roles);
  const commentState = useSelector(state => state.commentState.stateMap || {});
  const store = useStore();

  // Thread API sync
  const { chartThreads } = useChartThreads('slice', { id: dashboardId });

  // parentId = dashboardId = pagesId

  // Add color state here
  const [selectedTextColor, setSelectedTextColor] = useState("Default");
  const [selectedBgColor, setSelectedBgColor] = useState("Default");

  const [isSlashCommandVisible, setIsSlashCommandVisible] = useState(false);
  useEffect(() => {
    if (showPopover) {
      const headerWrap = document.querySelector(".header-wrap");
      if (headerWrap) {
        document.body.style.overflow = "hidden";
        headerWrap.style.overflow = "hidden";
      }
    } else {
      const headerWrap = document.querySelector(".header-wrap");
      if (headerWrap) {
        document.body.style.overflow = "auto";
        headerWrap.style.overflow = "auto";
      }
    }

    return () => {
      const headerWrap = document.querySelector(".header-wrap");
      if (headerWrap) {
        document.body.style.overflow = "auto";
        headerWrap.style.overflow = "auto";
      }
    };
  }, [showPopover]);

    useEffect(() => {
    if (isCoverPage) {
      handleBubbleMenusOnEditModeChange(editMode, editorInstance);
    }
  }, [editMode, editorInstance, isCoverPage]);

  // Move ColorMenu inside component
  const ColorMenu = () => (
    <Menu>
      <div className="color-section-title">Text</div>
      {TEXT_COLORS.map((color) => (
        <Menu.Item
          key={`text-${color.name.toLowerCase()}`}
          onClick={() => {
            setSelectedTextColor(color.name);
            editorInstanceRef?.current?.updateNodeAtPosition(
              hoverInfo?.position,
              color.name,
            );
          }}
        >
          <div className="color-item">
            <span className="color-letter" style={{ color: color.color }}>
              A
            </span>
            {color.name}
            {selectedTextColor === color.name && (
              <Check size={16} className="check-icon" />
            )}
          </div>
        </Menu.Item>
      ))}
      <div className="color-section-title">Background</div>
      {BACKGROUND_COLORS.map((color) => (
        <Menu.Item
          key={`bg-${color.name.toLowerCase()}`}
          onClick={() => {
            setSelectedBgColor(color.name);
            editorInstanceRef?.current?.updateNodeAtPosition(
              hoverInfo?.position,
              color.name,
              true,
            );
          }}
        >
          <div className="color-item">
            <span
              className="color-letter"
              style={{
                background:
                  color.color === "transparent" ? "#1a1a1a" : color.color,
                border:
                  color.color === "transparent" ? "1px solid #4A4A4A" : "none",
              }}
            >
              A
            </span>
            {color.name}
            {selectedBgColor === color.name && (
              <Check size={16} className="check-icon" />
            )}
          </div>
        </Menu.Item>
      ))}
    </Menu>
  );

  // Move DragMenu inside component too
  const DragMenu = () => (
    <Menu className="six-dot-menu">
      <Menu.Item
        onClick={() => {
          // Get the current position before deletion
          const currentPos = hoverInfo?.position;
          
          // Delete the node
          editorInstanceRef?.current?.deleteNodeAtPosition(currentPos);
          
          // Emit the event
          newEvent.emit('event-reInitializePageBreak');
          
          // Close the menu
          setShowDragMenu(false);
          
          // Set cursor position to stay in the same line after deletion
          if (editorInstance && currentPos !== undefined) {
            // Find the next valid position in the same line
            const doc = editorInstance.state.doc;
            let targetPos = currentPos;
            
            // If we're at the end of the document, move to the previous position
            if (targetPos >= doc.content.size) {
              targetPos = Math.max(0, doc.content.size - 1);
            }
            
            // Set the cursor position
            editorInstance.commands.setTextSelection(targetPos);
            editorInstance.commands.focus();
          }
        }}
        key="delete"
      >
        <Trash2 size={16} />
        Delete
      </Menu.Item>
      <Menu.SubMenu
        key="colors"
        title={
          <>
            <Palette size={16} />
            Colors
          </>
        }
        popupOffset={[0, -4]}
      >
        <ColorMenu />
      </Menu.SubMenu>
    </Menu>
  );

  useEffect(() => {
    setShowDragMenu(false);
  }, [selectedBgColor, selectedTextColor]);

  const handleMouseMove = (event) => {
    if (showPopover || showDragMenu) {
      return;
    }

    const editor = editorInstance;
    if (!editor?.view) return;

    const editorContainer = editorRef.current;
    if (!editorContainer) return;
    const containerRect = editorContainer.getBoundingClientRect();

    const pos = editor.view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    });
    if (!pos) {
      setHoverInfo(null);
      return;
    }

    try {
      const $pos = editor.state.doc.resolve(pos.pos);
      const node = editor.state.doc.nodeAt(pos.pos);

      let foundNode = node;
      let depth = $pos.depth;
      if(node?.type?.name === 'pageBreak' || node?.type?.name === 'footerOnly') {
        setHoverInfo(null);
        return;
      }
      while (depth > 0) {
        const parentNode = $pos.node(depth);
        if (
          parentNode.type.name === "chart" ||
          parentNode.type.name === "customVideo" ||
          parentNode.type.name === "customImage" ||
          parentNode.isBlock
        ) {
          foundNode = parentNode;
          break;
        }
        depth--;
      }

      if (foundNode) {
        const coords = editor.view.coordsAtPos(pos.pos);
        
        setHoverInfo((prev) => {
          if (
            !prev ||
            prev.position !== pos.pos ||
            prev.type !== foundNode.type.name ||
            prev.top !== coords.top - containerRect.top ||
            prev.left !== coords.left - containerRect.left
          ) {
            return {
              type: foundNode.type.name,
              position: pos.pos,
              top: Math.abs((coords.top - containerRect.top) - prev?.top) <= 3 ? 
                        prev?.top :(coords.top - containerRect.top),
              left: coords.left - containerRect.left,
              node: foundNode,
            };
          }
          return prev;
        });
      } else {
        setHoverInfo(null);
      }
    } catch (error) {
      console.error("Error in handleMouseMove:", error);
      setHoverInfo(null);
    }
  };

  const handleMouseLeave = (event) => {
    // Only clear hover info if not over popup
    if (!isOverPopup) {
      setHoverInfo(null);
    }
  };

  const handleAdd = () => {
    const editor = editorInstance;
    if (!editor || !hoverInfo) return;
    setShowPopover(true);
  };

  const handlePopoverClose = () => {
    // console.log("called popover close");
    setShowPopover(false);
    setIsOverPopup(false);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    // console.log("Drag started at position:", hoverInfo.position);
  };

  const handleDragMenuClose = () => {
    setShowDragMenu(false);
    setIsOverPopup(false);
  };

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      setHoverInfo(null);
      setShowPopover(false);
      setIsOverPopup(false);
    };
  }, []);

  useEffect(() => {
    if (hoverInfo?.node) {
      setSelectedTextColor(hoverInfo?.node?.attrs["data-text-color"]);
      setSelectedBgColor(hoverInfo?.node?.attrs["data-bg-color"]);
    }
  }, [hoverInfo]);

  useEffect(() => {
    setTippyVisibilityCallback((visible) => {
      setIsSlashCommandVisible(visible);
    });
  }, []);

    // Custom comment extension
    const editor = editorInstance;
    
    // const handleAddComment = useCallback((commentId) => { // (text = "Sample Text")
    //   if (!editor) return;

    //   const anchor = getCommentAnchorFromSelection(editor)

    //   if (!anchor) return;

    //   const { from, to } = editor.state.selection;
    //   const id = `comment-${Date.now()}`;

    //   // Bypasses null texts
    //   if (from === to) return;
  
    //   // editor.chain().focus().setComment(id).run();
  
    // //   const user = {
    // //     displayName: bootstrapData?.user?.displayName,
    // //     firstName: bootstrapData?.user?.firstName,
    // //     imageUrl: bootstrapData?.user?.imageUrl,
    // //     lastName: bootstrapData?.user?.lastName,
    // //     userObjId: bootstrapData?.user?.userObjId,
    // // };
    // const userDisplayName = bootstrapData?.user?.displayName || 'Current User';

    // editor.commands.setTextSelection({ from, to });
    // editor.chain().setComment(commentId).run();
    // editor.view.dispatch(editor.view.state.tr); // force re-render

    // // Save to redux
    //   // Immediately persist the updated content
    //   const content = editor.getJSON();

    //   dispatch(updateComponents({
    //     [component.id]: {
    //       ...component,
    //       meta: {
    //         ...component.meta,
    //         editorJson: content
    //       }
    //     }
    //   }));
  
    //   setComments(prev => [...prev, {
    //     // id,
    //     id: commentId,
    //     user: userDisplayName,
    //     text: "EMPTY",
    //     timestamp: new Date(),
    //     from,
    //     to,
    //     ...anchor,
    //   }]);


    //   // testing purpose
    //    editor.state.doc.nodesBetween(from, to, (node, pos) => {
    //     node.marks.forEach(mark => {
    //       // console.log('Mark at pos', pos, mark.attrs);
    //       // console.log('Mark from and to: ', from, to)
    //     });
    //   });           
    //   // Testing ends

    //   // console.log("Anchor is: ", anchor)

    //   // console.log("EDITOR JSON", editor.getJSON());

    // }, [editor]);

  const isGuides = useSelector(state => state?.dashboardInfo.dash_type === 1);
  
  const handleAddComment = useCallback((commentId) => {
    if (!editor) return;

    const anchor = getCommentAnchorFromSelection(editor);
    if (!anchor) return;

    const { from, to } = editor.state.selection;
    if (from === to) return;

    const userDisplayName = bootstrapData?.user?.displayName || 'Current User';

    editor.commands.setTextSelection({ from, to });
    editor.chain().setComment(commentId).run();

    // Debug block
    editor.state.doc.descendants((node, pos) => {
      node.marks?.forEach(mark => {
        if (mark.type.name === 'comment') {
          // console.log('deb [mark]', mark.attrs.commentId, 'at', pos);
        }
      });
    });

    // console.log("deb editorJSON: ", editor.getJSON());


    // Debug block

    // Persist editor JSON
    const updatedJson = editor.getJSON();

    // Update editorJson in component meta
    dispatch(updateComponents({
      [component.id]: {
        ...component,
        meta: {
          ...component.meta,
          editorJson: updatedJson,
        }
      }
    }));

    // Update pagesData[component.id].editorJson as well
    dispatch(dashboardInfoChanged({
      metadata: {
        ...metadata,
        pagesData: {
          ...pagesData,
          [component.id]: {
            ...(pagesData?.[component.id] || {}),
            editorJson: updatedJson,
          }
        }
      }
    }));

    // now persist to backend API
    // const rawOwners = useSelector(state => state.dashboardInfo.owners || []);
    const filteredOwners = owners.map(o => String(o.user_object_id || o.id)).filter(Boolean);

    const updatedEditorJson = editorInstance.getJSON();

    const updatedPagesData = {
      ...(metadata.pagesData || {}),
      [component.id]: {
        ...(metadata.pagesData?.[component.id] || {}),
        editorJson: updatedEditorJson,
      },
    };
    const payload = {
      dashboard_title: dashboardTitle,
      css: '',
      certified_by: '',
      certification_details: '',
      slug: null,
      owners: filteredOwners,
      roles,
      metadata: {
        ...metadata,
        pagesData: updatedPagesData,
        positions: layout, // might already be inside metadata
      },
      dash_viz_type: 2, // or 1 for decks, 0 for normal dashboards
    };
    
    // if (!isGuides) {
    //   dispatch(saveDashboardRequest(payload, dashboardId, 'overwrite', { silent: true }));
    // }



    // Optional: Track comments locally
    setComments(prev => [...prev, {
      id: commentId,
      user: userDisplayName,
      text: "EMPTY",
      timestamp: new Date(),
      from,
      to,
      ...anchor,
    }]);
  }, [editor, component, dispatch, metadata, pagesData, layout, dashboardId, dashboardTitle, owners, roles, isGuides]);
  // [editor, component, dispatch, bootstrapData, metadata]);


  // const handleAddComment = useCallback((commentId) => {
  //   if (!editor) return;

  //   const anchor = getCommentAnchorFromSelection(editor);
  //   if (!anchor) return;

  //   const { from, to } = editor.state.selection;
  //   if (from === to) return;

  //   const userDisplayName = bootstrapData?.user?.displayName || 'Current User';

  //   editor.commands.setTextSelection({ from, to });
  //   editor.chain().setComment(commentId).run();

  //    // Only dispatch saveDashboardRequest if commentId is new
  //   console.log("store: ", store.getState().commentState)
  //   const isFirstTime = commentId && !(store.getState().commentState.stateMap || {})[commentId];

  //   console.log("store: isFirstTime: ", isFirstTime)

  //   const updatedJson = editor.getJSON();

  //   if (isFirstTime) {
  //     const filteredOwners = owners.map(o => String(o.user_object_id || o.id)).filter(Boolean);

  //     const updatedPagesData = {
  //       ...(metadata.pagesData || {}),
  //       [component.id]: {
  //         ...(metadata.pagesData?.[component.id] || {}),
  //         editorJson: updatedJson,
  //       },
  //     };

  //     const payload = {
  //       dashboard_title: dashboardTitle || "New Page",
  //       css: '',
  //       certified_by: '',
  //       certification_details: '',
  //       slug: null,
  //       owners: filteredOwners,
  //       roles,
  //       metadata: {
  //         ...metadata,
  //         pagesData: updatedPagesData,
  //         positions: layout,
  //       },
  //       dash_viz_type: 2,
  //     };

  //     dispatch(saveDashboardRequest(payload, dashboardId, 'overwrite', { silent: true }));
  //   }

  //   dispatch(updateComponents({
  //     [component.id]: {
  //       ...component,
  //       meta: {
  //         ...component.meta,
  //         editorJson: updatedJson,
  //       }
  //     }
  //   }));

  //   dispatch(dashboardInfoChanged({
  //     metadata: {
  //       ...metadata,
  //       pagesData: {
  //         ...pagesData,
  //         [component.id]: {
  //           ...(pagesData?.[component.id] || {}),
  //           editorJson: updatedJson,
  //         }
  //       }
  //     }
  //   }));


  //   setComments(prev => [...prev, {
  //     id: commentId,
  //     user: userDisplayName,
  //     text: "EMPTY",
  //     timestamp: new Date(),
  //     from,
  //     to,
  //     ...anchor,
  //   }]);
  // }, [
  //   editor,
  //   component,
  //   dispatch,
  //   bootstrapData,
  //   metadata,
  //   layout,
  //   dashboardId,
  //   dashboardTitle,
  //   owners,
  //   pagesData,
  //   roles,
  //   store, // optional since it's a stable ref
  // ]);



    
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


   editorInstance && editorInstance.on("selectionUpdate", ({ editor }) => {
      const { from, to } = editor.state.selection;
      let foundCommentId = null;

      // editor.state.doc.nodesBetween(from, to, (node, pos) => {
      //   node.marks.forEach(mark => {
      //     if (mark.type.name === 'comment') {
      //       foundCommentId = mark.attrs.commentId;
      //     }
      //   });
      // });

      let matched = false;

      editor.state.doc.nodesBetween(from, to, (node, pos) => {
        if (matched) return false; // Stop traversal

        node.marks.forEach(mark => {
          if (mark.type.name === 'comment') {
            foundCommentId = mark.attrs.commentId;
            matched = true;
          }
        });
      });


      setActiveCommentId(foundCommentId);
    })

    useEffect(() => {
      if (editorInstance) {
        editorInstance.on("selectionUpdate", ({ editor }) => {
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
        });
      }
    }, []);


  useEffect(() => {
    if (!isCoverPage || !editorInstance) return;
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        updateBgColor(metadata?.slide_color, metadata?.coverImage);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [metadata?.coverImage, metadata?.slide_color, editorInstance, isCoverPage]);

  return (
    <TwoColBubbleMenuProvider>
      <GlobalPopoverStyles />
      <StyledMenu />
      <EditorContainer
        ref={editorRef}
        className={`blocknote-editor ${isCoverPage ? 'cover-page' : ''}`}
        data-page-id={isCoverPage ? 'blocknote-page-0' : undefined}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        $isDarkMode={isDarkMode}
      >
        {editMode && hoverInfo && !isSlashCommandVisible && (
          <HoverIndicator
            style={{
              position: "absolute",
              top: `${hoverInfo.top - 5}px`,
            }}
          >
            <Popover
              visible={showPopover}
              onVisibleChange={(visible) => {
                if (!visible) {
                  handlePopoverClose();
                }
                setIsOverPopup(visible);
              }}
              content={
                <AddBlockMenu
                  editor={editorInstance}
                  position={hoverInfo.position}
                  onClose={handlePopoverClose}
                  onMouseEnter={() => setIsOverPopup(true)}
                  onMouseLeave={() => setIsOverPopup(false)}
                />
              }
              trigger="click"
              placement="bottomLeft"
              destroyTooltipOnHide
            >
              <IconButton onClick={handleAdd} title="Add block">
                <Plus size={32} />
              </IconButton>
            </Popover>
            <Popover
              visible={showDragMenu}
              onVisibleChange={(visible) => {
                if (!visible) {
                  handleDragMenuClose();
                }
                setIsOverPopup(visible);
              }}
              content={<DragMenu />}
              trigger="click"
              placement="bottomLeft"
              destroyTooltipOnHide
            >
            { <IconButton
                onClick={() => setShowDragMenu(true)}
                title="More options"
              >
                <GripVertical size={32} />
              </IconButton>}
            </Popover>
          </HoverIndicator>
        )}
        <div style={{ position: 'relative', zIndex: 1 }}>
        <TipTapEditor
          ref={editorInstanceRef}
          editMode={editMode}
          initialContent={metadata.pagesData?.[component.id]?.editorJson || component.meta?.editorJson} //{component?.meta?.editorJson || editorContent}
          component={component}
          hoveredPos={hoveredPos}
          setHoveredPos={setHoveredPos}
          setHeadings={setHeadings}
          parentId={parentId}
          setEditorInstance={setEditorInstance}
          handleComponentDrop={handleComponentDrop}
          setIsEmojiModalOpen={setIsEmojiModalOpen}
          isEmojiModalOpen={isEmojiModalOpen}
          isCoverPage={isCoverPage}
          selectedTemplateCover={selectedTemplateCover}
          coverOverlayTexts={coverOverlayTexts}
          onOverlayTextChange={onOverlayTextChange}
          coverTemplates={coverTemplates}
        />
        </div>
        {!editMode && editorInstance && (
          <ViewModeTextBubbleMenu 
            editor={editorInstance} 
            onAddComment={handleAddComment} 
            commentsObject={comments}
            pagesMasterId={dashboardId} // parentId
            component={component}
          />
        )}
        {/* {!editMode && (
          <>
            <CommentSidebar 
              comments={comments}
              onCommentClick={handleCommentClick}
              activeCommentId={activeCommentId}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
            />
            <Modal
              isOpen={deleteModalOpen}
              onClose={() => setDeleteModalOpen(false)}
              title="Delete Comment"
              onConfirm={confirmDelete}
            >
              <p>Are you sure you want to delete this comment? This action cannot be undone.</p>
            </Modal>
          </>
        )} */}
      </EditorContainer>
 
    </TwoColBubbleMenuProvider>
  );
}
