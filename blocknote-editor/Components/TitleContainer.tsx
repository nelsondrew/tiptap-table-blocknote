import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Heading } from "@tiptap/extension-heading";
import { Placeholder } from "@tiptap/extension-placeholder";
import styled, { keyframes } from "styled-components";
import { EmojiSuggestion } from "../components-tip-tap/extensions//EmojiSuggestion";
import debounce from "lodash/debounce";
import {
  dashboardEditorJsonChanged,
  dashboardTitleChanged,
  dashboardHeaderChanged,
  dashboardPageNumberChanged,
} from "../../../src/dashboard/actions/dashboardLayout";
import { Table, Type, X } from "lucide-react";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import isNull from "lodash/isNull";
import { TextBubbleMenuForColumns } from "../components-tip-tap/TextBubbleCols";
import { setUnsavedChanges } from "src/dashboard/actions/dashboardState";
import { DASHBOARD_HEADER_ID } from "../../../src/dashboard/util/constants";
import Plus from 'src/assets/images/icons/add-page-plus.svg';

import { TwoColBubbleMenuProvider } from "../components-tip-tap/TwoColBubbleMenuContext";
import { isEqual } from "lodash";

const WrapperContainer = styled.div`
  // margin-bottom: 1rem;
`;

const TitleEditorContainer = styled.div<{ $editMode: boolean }>`
  padding: 0 2.5rem;
  width: 100%;
  max-width: 100%;
  .editor-foreground-wrapper {
    position: relative;
    z-index: 2;
  }

  .ProseMirror {
    font-size: 2.5rem;
    font-weight: 700;
    outline: none;
    text-align: left;
    padding-left: 6rem;
    width: 100%;
    max-width: calc(100%-8rem);
    position: relative;
    z-index: 2;

    h1 {
      font-size: 40px;
      margin: 0px;
      padding: 3px 2px;
      width: 100%;
      max-width: 100%;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.3;
      min-height: 1em;
      font-weight: 700;
    }

    h1.is-empty::before {
      // @ts-ignore
      color: ${({ $editMode }) => ($editMode ? "#cfcfcf" : "#000000")};
      content: attr(data-placeholder);
      float: left;
      height: 0;
      pointer-events: none;
      position: absolute;
    }

    // Prevent line breaks
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

// Add fade animation
const fadeOut = keyframes`
  0% {
    opacity: 0.5;
    transform: translateY(0);
    max-height: 200px;
    margin-top: 2rem;
  }
  50% {
    opacity: 0;
    transform: translateY(-5px);
    max-height: 200px;
    margin-top: 2rem;
  }
  100% {
    opacity: 0;
    transform: translateY(-5px);
    max-height: 0;
    margin-top: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
`;

const GetStartedContainer = styled.div<{ $isVisible: boolean }>`
  padding-left: 56px;
  text-align: left;
  animation: ${(props) => (!props.$isVisible ? fadeOut : "none")} 0.8s
    ease-in-out;
  transition: all 0.5s ease-in-out;
  transform: translateY(${(props) => (props.$isVisible ? 0 : "-5px")});
  pointer-events: ${(props) => (props.$isVisible ? "auto" : "none")};
  max-height: ${(props) => (props.$isVisible ? "200px" : "0")};
  overflow: hidden;
`;

const GetStartedHeading = styled.div<{ $isDarkMode?: boolean }>`
  font-size: 12px;
  line-height: 20px;
  font-weight: 400;
  color: #666666;
  margin-left: 0;
  display: flex;
  font-weight: 400;
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ActionButton = styled.button`
  padding: 4px 8px;
  border-radius: 6px;
  border: none;
  background: white;
  color: #666666;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  font-weight: 400;
  line-height: 24px;

  svg {
    color: #666666;
  }
`;

const ChartIcon = () => (
  <svg
    width="13.333496"
    height="13.330688"
    viewBox="0 0 13.3335 13.3307"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.19 0.19C6.32 0.07 6.48 0 6.66 0C7.54 0 8.4 0.17 9.21 0.5C10.02 0.84 10.76 1.33 11.38 1.95C12 2.57 12.49 3.3 12.82 4.11C13.16 4.92 13.33 5.79 13.33 6.66C13.33 7.03 13.03 7.33 12.66 7.33L6.66 7.33C6.29 7.33 6 7.03 6 6.66L6 0.66C6 0.48 6.07 0.32 6.19 0.19ZM4.87 0.89C5.02 1.23 4.87 1.62 4.53 1.77C3.73 2.12 3.03 2.66 2.49 3.34C1.94 4.02 1.58 4.83 1.42 5.68C1.26 6.54 1.31 7.42 1.57 8.25C1.83 9.08 2.29 9.84 2.91 10.45C3.53 11.06 4.29 11.52 5.13 11.77C5.96 12.02 6.84 12.06 7.7 11.89C8.55 11.72 9.35 11.35 10.03 10.8C10.7 10.25 11.23 9.54 11.57 8.74C11.72 8.4 12.11 8.24 12.45 8.38C12.79 8.53 12.95 8.92 12.8 9.26C12.38 10.26 11.71 11.14 10.87 11.83C10.03 12.52 9.03 12.99 7.96 13.2C6.89 13.41 5.79 13.36 4.74 13.04C3.7 12.73 2.75 12.17 1.97 11.4C1.2 10.63 0.63 9.69 0.3 8.65C-0.03 7.61 -0.09 6.51 0.11 5.44C0.31 4.37 0.77 3.36 1.44 2.51C2.12 1.66 3 0.98 4 0.55C4.33 0.4 4.73 0.56 4.87 0.89ZM7.33 1.37L7.33 6L11.95 6C11.89 5.52 11.77 5.06 11.59 4.62C11.32 3.97 10.93 3.39 10.43 2.89C9.94 2.4 9.35 2 8.7 1.73C8.26 1.55 7.8 1.43 7.33 1.37Z"
      fill="#666666"
      fillOpacity="1.000000"
      fillRule="evenodd"
    />
  </svg>
);

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  opacity: 1;
  margin-right: 1rem;
  transform: translateY(-2px);

  svg {
    width: 12px;
    height: 12px;
    color: rgb(102, 102, 102);
  }

  &:hover {
    opacity: 0.7;
  }
`;

const BackgroundLayer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

const HeaderSection = styled.div`
  background-color: white;
  padding: 19px 56px 1px 56px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 38px;
  position: relative;
  box-sizing: border-box;
  justify-content: space-between;
`;

const HeaderSeparator = styled.div<{ $show: boolean }>`
  visibility: ${({ $show }) => $show ? 'visible' : 'hidden'};
  height: 1px;
  background-color: #9C9C9C;
  margin: 0 auto 11px auto;
  width: calc(100% - 112px);
`;

const HeaderInputContainer = styled.div<{$isPageNumEnabled : boolean}>`
  flex: 1;
  position: relative;
  text-align: left;
  max-width: ${({$isPageNumEnabled}) => $isPageNumEnabled ? 'calc(100% - 40px)' : 'calc(100% - 1px)'};
`;

const HeaderInputContainerWithPageNumber = styled.div`
  flex: 1;
  position: relative;
  text-align: left;
  font-family: Aptos, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto Flex', sans-serif;
`;

const HeaderInput = styled.input<{ $show: boolean }>`
  border: none;
  padding: 5px 0px;
  border-radius: 4px;
  height: 24px;
  width: 100%;
  margin-bottom: 0;
  outline: none;
  background-color: transparent;
  font-size: 11px;
  color: #666;
  opacity: ${({ $show }) => $show ? 1 : 0};
  pointer-events: ${({ $show }) => $show ? 'auto' : 'none'};
  transition: opacity 0.2s ease;

  &::placeholder {
    color: #999;
    opacity: ${({ $show }) => $show ? 1 : 0};
    &:hover {
      background-color: #f5f5f5;
  }
`;

const HeaderDisplay = styled.div`
  color: #666666;
  font-size: 11px;
  line-height: 14px;
  padding-top: 5px;
  padding-bottom: 5px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;

const PageNumberButton = styled.button`
  color: #9C9C9C;
  border: none;
  background: #FFFFFF;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  gap: 4px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #666666;
    background: #FBFBFB;
  }

  svg,
  svg * {
    transition: all 0.2s;
    fill: #9c9c9c !important;
  }

  &:hover svg,
  &:hover svg * {
    fill: #666666 !important;
  }
`;

const AddHeaderButton = styled.button`
    color: #9C9C9C;
    border: none;
    background: #FFFFFF;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    line-height: 20px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
    text-align: left;
    gap: 4px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

     &:hover {
      background: #fbfbfb;
      color: #666666;
    }

    svg,
    svg * {
      transition: all 0.2s;
      fill: #9c9c9c !important;
    }

    &:hover svg, 
    &:hover svg * {
      fill: #666666 !important;
    }
`;

const ClearButton = styled.button`
  background: white;
  color: #666;
  border: 1px solid #d9d9d9;
  padding: 0px 0px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    border-color: #b7b7b7;
  }
`;

const PageNumberContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const PageNumberDisplay = styled.div`
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  color: rgb(102, 102, 102);
  line-height: 14px;
  padding-top: 5px;
  padding-bottom: 5px;

  // &:hover {
  //   background-color: #f5f5f5;
  // }
`;

const Popover = styled.div<{ $show: boolean }>`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid #F2F2F2;
  border-radius: 4px;
  box-shadow: 0px 0px 60px 0px #00000014;
  padding: 9px;
  z-index: 1000;
  opacity: ${({ $show }) => $show ? 1 : 0};
  visibility: ${({ $show }) => $show ? 'visible' : 'hidden'};
  transition: opacity 0.2s, visibility 0.2s;
  margin-bottom: 4px;
`;

const PopoverButton = styled.button`
  background: white;
  color: #000000;
  border: none;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  // &:hover {
  //   background: #f5f5f5;
  // }
`;

interface TitleEditorProps {
  headerText: string;
  editMode: boolean;
  editorInstance?: any;
  headerJson: null | object;
}

const TitleEditor: React.FC<TitleEditorProps> = ({
  headerText,
  editMode,
  editorInstance,
  headerJson,
}) => {
  const [titleValue, setTitleValue] = useState(headerText);
  const [editorJson, setEditorJson] = useState<JSONContent | null>(headerJson);
  const dispatch = useDispatch();
  const [showGetStarted, setShowGetStarted] = useState(true);
  const animationTriggered = useRef(false);
  const emptyTitleValues = ["", "Untitled", "New Page"];

  const headerJsonRef = useRef(headerJson);

  const pageTitleFromRedux = useSelector((state: any) => 
    state?.dashboardLayout?.present?.[DASHBOARD_HEADER_ID]?.meta?.text || ''
  );

  // Get header value from Redux state
  const headerTextFromRedux = useSelector((state: any) => 
    state?.dashboardLayout?.present?.[DASHBOARD_HEADER_ID]?.meta?.headerText || ''
  );

  // Get page number state from Redux
  const showPageNumberFromRedux = useSelector((state: any) => 
    state?.dashboardLayout?.present?.[DASHBOARD_HEADER_ID]?.meta?.page_number || 0
  );

  // Local state for header input - initialize from Redux
  const [localHeaderValue, setLocalHeaderValue] = useState(headerTextFromRedux);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [isHeaderFocused, setIsHeaderFocused] = useState(false);
  const [isPageNumberHovered, setIsPageNumberHovered] = useState(false);
  const pageNumberTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  // Initialize local state from Redux on first load
  useEffect(() => {
    setLocalHeaderValue(headerTextFromRedux);
  }, [headerTextFromRedux]);

  // Reset focus when hover ends
  useEffect(() => {
    if (!isHeaderHovered && isHeaderFocused && headerInputRef.current) {
      headerInputRef.current.blur();
    }
  }, [isHeaderHovered, isHeaderFocused]);

  useEffect(() => {
    if (!isEqual(headerJsonRef.current, headerJson)) {
      headerJsonRef.current = headerJson;
    }
  }, [headerJson]);

  const handleEditJson = (e: any) => {
    const str = e?.detail?.title;
    const headerJsCurr = headerJsonRef?.current;
    if (headerJsCurr && editor) {
      const heading = (headerJsCurr as any).content?.[0];
      const textNode = heading?.content?.[0];
      const currentTitle = textNode?.text;

      if (currentTitle !== str) {
        setTitleValue(str)
        const updatedHeaderJson = {
          ...headerJsCurr,
          content: [
            {
              ...heading,
              content: [
                {
                  ...textNode,
                  type: "text",
                  text: str,
                },
              ],
            },
          ],
        };
        editor.commands.setContent(updatedHeaderJson);
        return;
      }

      editor.commands.setContent(headerJsCurr);
      return;
    }
  };

  useEffect(() => {
    window.addEventListener("updatePageTitle", handleEditJson);
    return () => {
      window.removeEventListener("updatePageTitle", handleEditJson);
    };
  }, []);

  const handleTitleChange = () => {
    if (!titleValue) {
      dispatch(dashboardTitleChanged("New Page"));
      return;
    }
    if (titleValue === "Untitled") {
      setTitleValue("");
      dispatch(dashboardTitleChanged("New Page"));
      return;
    }
    dispatch(dashboardTitleChanged(titleValue));
  };

  const debouncedTitleChange = debounce(handleTitleChange, 0);

  useEffect(() => {
    debouncedTitleChange();
  }, [titleValue]);

  const handleJsonChange = () => {
    if (!isNull(editorJson)) {
      dispatch(dashboardEditorJsonChanged(editorJson));
    }
  };

  const debouncedJsonChange = debounce(handleJsonChange, 300);

  useEffect(() => {
    debouncedJsonChange();
  }, [editorJson]);

  // Simple header change handler - only update Redux
  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalHeaderValue(newValue);
    // Immediately dispatch to Redux - page breaks will automatically update
    dispatch(dashboardHeaderChanged(newValue));
    dispatch(setUnsavedChanges(true));
  };

  // State to track total pages and force re-render
  const [totalPages, setTotalPages] = useState(1);

  // Function to count total pages
  const getTotalPages = () => {
    if (!editorInstance?.state?.doc) return 1;

    let pageCount = 1; // Start with 1 for the first page

    // Count all page breaks in the document
    editorInstance.state.doc.descendants((node: any) => {
      if (node.type.name === 'pageBreak') {
        pageCount++;
      }
    });

    return pageCount;
  };

  // Update total pages when editor content changes
  useEffect(() => {
    if (editorInstance) {
      const updateTotalPages = () => {
        const newTotal = getTotalPages();
        setTotalPages(newTotal);
      };

      // Update immediately
      updateTotalPages();

      // Listen for document changes
      const handleUpdate = () => {
        updateTotalPages();
      };

      editorInstance.on('update', handleUpdate);

      return () => {
        editorInstance.off('update', handleUpdate);
      };
    }
  }, [editorInstance]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pageNumberTimeoutRef.current) {
        clearTimeout(pageNumberTimeoutRef.current);
      }
    };
  }, []);

  // Page number handlers
  const handlePageNumberToggle = () => {
    const newValue = !showPageNumberFromRedux ? 1 : 0;
    dispatch(dashboardPageNumberChanged(newValue));
    dispatch(setUnsavedChanges(true));
  };

  const handlePageNumberClear = () => {
    dispatch(dashboardPageNumberChanged(0));
    dispatch(setUnsavedChanges(true));
  };

  const handlePageNumberMouseEnter = () => {
    if (pageNumberTimeoutRef.current) {
      clearTimeout(pageNumberTimeoutRef.current);
      pageNumberTimeoutRef.current = null;
    }
    setIsPageNumberHovered(true);
  };

  const handlePageNumberMouseLeave = () => {
    pageNumberTimeoutRef.current = setTimeout(() => {
      setIsPageNumberHovered(false);
    }, 100); // 100ms delay
  };

  useEffect(() => {
    if (editor) {
      // When title is blank
      if (emptyTitleValues.includes(titleValue)) {
        if (editMode) {
          editor.commands.setContent("<h1></h1>");
        } else {
          editor.commands.setContent("<h1>New Page</h1>");
        }
        return;
      }

      if (titleValue) {
        if (headerJson) {
          const heading = (headerJson as any).content?.[0];
          const textNode = heading?.content?.[0];
          const currentTitle = textNode?.text;

          // If headerJson text is different from titleValue, update it
          if (currentTitle !== titleValue) {
            const updatedHeaderJson = {
              ...headerJson,
              content: [
                {
                  ...heading,
                  content: [
                    {
                      ...textNode,
                      type: "text",
                      text: titleValue,
                    },
                  ],
                },
              ],
            };
            editor.commands.setContent(updatedHeaderJson);
            return;
          }

          editor.commands.setContent(headerJson);
          return;
        }

        // If no headerJson, set directly from title
        editor.commands.setContent(`<h1>${titleValue}</h1>`);
      }
    }
  }, [editMode]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
        // @ts-ignore
        heading: true,
        history: false,
        horizontalRule: false,
        dropcursor: false,
        gapcursor: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        hardBreak: false,
      }),
      Heading.configure({
        levels: [1],
      }).extend({
        addKeyboardShortcuts() {
          return {
            Enter: () => true,
            "Shift-Enter": () => true,
            Backspace: ({ editor }) => {
              if (editor.isEmpty) {
                return true;
              }
              return false;
            },
          };
        },
        addCommands() {
          return {
            ...(this.parent?.() ?? {}),
            setParagraph: () => () => false,
            setHeading:
              ({ level }: { level: number }) =>
              ({ commands }) => {
                return commands.setNode("heading", { level: 1 });
              },
          };
        },
      }),
       Placeholder.configure({
        placeholder: "New page",
        emptyNodeClass: "is-empty",
      }),
      EmojiSuggestion,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
        defaultAlignment: "left",
      }),
      Underline.configure(),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    editable: editMode,
    content: headerJson || "<h1></h1>",
    onUpdate: ({ editor }) => {
      if (!editor.isActive("heading")) {
        editor.commands.setHeading({ level: 1 });
      }
      const content = editor.getText();
      if (content === "New page") {
        setTitleValue("");
        return;
      }
      setTitleValue(pageTitleFromRedux);

      const json = editor.getJSON();
      setEditorJson(json);
      if (!emptyTitleValues.includes(content) && editMode) {
        dispatch(setUnsavedChanges(true));
      } else {
        dispatch(setUnsavedChanges(false));
      }
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(editMode);
    }
  }, [editMode, editor]);

  const handleDisappear = (e: any) => {
    e.preventDefault();
    setShowGetStarted(false);
    setTimeout(() => {
      animationTriggered.current = true;
    }, 500);
  };

  // Helper function to push content to next line
  const pushContentToNextLine = () => {
    if (editorInstance) {
      const firstNode = editorInstance.state.doc.firstChild;
      if (firstNode) {
        // Insert a new paragraph before existing content
        editorInstance
          .chain()
          .focus()
          .insertContentAt(0, { type: "paragraph", content: [] })
          .run();
      }
    }
  };

  const handleChartClick = (e: any) => {
    if (editorInstance) {
      pushContentToNextLine();
      editorInstance.chain().focus().insertContent({ type: "chart" }).run();
    }
    handleDisappear(e);
  };

  const handleTableClick = (e: any) => {
    if (editorInstance) {
      pushContentToNextLine();
      editorInstance
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    }
    handleDisappear(e);
  };

  const handleParagraphClick = (e: any) => {
    if (editorInstance) {
      pushContentToNextLine();
      // const text = 'You can start writing here...';

      const firstNode = editorInstance.state.doc.firstChild;
      if (firstNode && firstNode.textContent) {
        editorInstance
          .chain()
          .focus()
          .insertContentAt(0, [
            { type: "paragraph", content: [] },
            { type: "paragraph", content: [] },
          ])
          .run();
      } else {
        editorInstance
          .chain()
          .focus()
          .insertContent({ type: "paragraph", content: [] })
          .run();
      }

      // let i = 0;
      // const typeInterval = setInterval(() => {
      //   if (i < text.length) {
      //     editorInstance
      //       .chain()
      //       .focus()
      //       .insertContent(text[i])
      //       .run();
      //     i++;
      //   } else {
      //     clearInterval(typeInterval);
      //   }
      // }, 50);
    }
    handleDisappear(e);
  };

  if (!editor) return null;

  return (
    <TwoColBubbleMenuProvider>
      <WrapperContainer>
        {/* Header Section */}
        {/* <HeaderInputContainerWithPageNumber>
          <HeaderSection
            onMouseEnter={() => setIsHeaderHovered(true)}
            onMouseLeave={() => {
              setIsHeaderHovered(false);
              // Reset editing state if there's no content
              if (!localHeaderValue) {
                setIsHeaderEditing(false);
              }
            }}
          >
            <HeaderInputContainer $isPageNumEnabled={!!showPageNumberFromRedux}>
              {editMode ? (
                <>
                  {!localHeaderValue && isHeaderHovered && !isHeaderEditing ? (
                    <AddHeaderButton onClick={() => {
                        setIsHeaderEditing(true);
                        // Focus the input field after state update
                        setTimeout(() => {
                          if (headerInputRef.current) {
                            headerInputRef.current.focus();
                          }
                        }, 0);
                      }}
                    >
                      <Plus />
                        Add Header
                    </AddHeaderButton>
                  ) : (
                    <HeaderInput
                      ref={headerInputRef}
                      $show={localHeaderValue || isHeaderEditing}
                      value={localHeaderValue}
                      onChange={handleHeaderChange}
                      onFocus={() => setIsHeaderFocused(true)}
                      onBlur={() => {
                        setIsHeaderFocused(false);
                        if (!localHeaderValue) {
                          setIsHeaderEditing(false);
                        }
                      }}
                      placeholder="Header"
                      readOnly={false}
                      maxLength={128}
                      title={localHeaderValue}
                    />
                  )}
                </>
              ) : (
                localHeaderValue && (
                  <HeaderDisplay title={localHeaderValue}>
                    {localHeaderValue}
                  </HeaderDisplay>
                )
              )}
            </HeaderInputContainer>

            {!editMode && !!showPageNumberFromRedux && (
              <div
                style={{
                  color: '#666',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                }}
              >
                1 / {totalPages}
              </div>
            )}

            {editMode && (
              <>
                {!showPageNumberFromRedux ? (
                  isHeaderHovered && (
                    <PageNumberButton onClick={handlePageNumberToggle}>
                      <Plus /> 
                      Add Page Numbers
                    </PageNumberButton>
                  )
                ) : (
                  <PageNumberContainer
                    onMouseEnter={handlePageNumberMouseEnter}
                    onMouseLeave={handlePageNumberMouseLeave}
                  >
                    <Popover
                      $show={isPageNumberHovered}
                      onMouseEnter={handlePageNumberMouseEnter}
                      onMouseLeave={handlePageNumberMouseLeave}
                    >
                      <PopoverButton onClick={handlePageNumberClear}>
                        Remove
                      </PopoverButton>
                    </Popover>
                    <PageNumberDisplay>1 / {totalPages}</PageNumberDisplay>
                  </PageNumberContainer>
                )}
              </>
            )}
          </HeaderSection>
          <HeaderSeparator $show={!!localHeaderValue || !!showPageNumberFromRedux || isHeaderFocused} />
        </HeaderInputContainerWithPageNumber> */}

        <TitleEditorContainer $editMode={editMode}>
          {editor && editMode && (
            <div className="bubble-menu-wrapper">
              <TextBubbleMenuForColumns isTitle={true} editor={editor} />
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <BackgroundLayer />
            {/* <EditorContent editor={editor} /> */}
          </div>
          {/* <EditorContent editor={editor} /> */}
        </TitleEditorContainer>

        {/* {editMode && !animationTriggered.current && (
          <GetStartedContainer $isVisible={showGetStarted}>
            <HeaderContainer>
              <GetStartedHeading>
                <div className="heading">Get Started With</div>
              </GetStartedHeading>
            </HeaderContainer>
            <ButtonsContainer>
              <ActionButton onClick={handleChartClick}>
                <ChartIcon />
                Charts
              </ActionButton>
              <ActionButton onClick={handleTableClick}>
                <Table size={16} />
                Table
              </ActionButton>
              <ActionButton onClick={handleParagraphClick}>
                <Type size={16} />
                Paragraph
              </ActionButton>
            </ButtonsContainer>
          </GetStartedContainer>
        )} */}
      </WrapperContainer>
    </TwoColBubbleMenuProvider>
  );
};

export default TitleEditor;
