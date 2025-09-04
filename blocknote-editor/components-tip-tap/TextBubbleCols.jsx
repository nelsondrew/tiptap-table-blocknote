import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BubbleMenu } from '@tiptap/react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

// Custom components
import BlockTypeDropdown from '../Components/Dropdown/BlockTypeDropdown';
import { ColorPickerPopover } from '../Components/Popover/ColorPickerPopover';
import FontSizeDropdown from '../Components/Dropdown/FontSizeDropdown';
import FontFamilyDropdown from '../Components/Dropdown/FontFamilyDropdown';

// Custom hooks
import { useBubbleMenuState } from './hooks/useBubbleMenuState';

// Utility functions
import { closeAllDropdownsAndNotify } from '../utils/bubbleMenuHelpers';

// Icon SVGs
import Bold from 'src/assets/images/icons/bold.svg';
import Italics from 'src/assets/images/icons/italics.svg';
import Underline from 'src/assets/images/icons/underline.svg';
import StrikeThrough from 'src/assets/images/icons/strike.svg';
import ColorSelection from 'src/assets/images/icons/color-selection.svg';
import Code from 'src/assets/images/icons/code-bubble-menu.svg';
import VerticalThreeDot from 'src/assets/images/icons/vertical-three-dot.svg';
import AlignLeft from 'src/assets/images/icons/align-left.svg';
import AlignCenter from 'src/assets/images/icons/align-center.svg';
import AlignRight from 'src/assets/images/icons/align-right.svg';
import AlignJustify from 'src/assets/images/icons/align-justify.svg';
import AddUrl from 'src/assets/images/icons/add-url.svg';
import Indent from 'src/assets/images/icons/indent.svg';
import Unindent from 'src/assets/images/icons/unindent.svg';

import { CustomBubbleMenu } from './CustomBubbleMenu';
import { useTwoColBubbleMenuContext } from '../components-tip-tap/TwoColBubbleMenuContext';
import { useFontSizeFromSelection } from 'src/hooks/useFontSizeFromSelection';


const MenuContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 4px;
  border: 1px solid #F2F2F2;
  padding: 9px;
  gap: 12px;
  max-height: 42px;
  /* max-width: 566px; */
  &:hover {
    box-shadow: 0px 0px 60px 0px #00000014;
  }
`;

const MenuButton = styled.button`
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  transition: all 0.2s;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  svg path {
    fill: ${props => props.$active && '#00b0b3'};
  }
`;

const ThreeDotContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const ThreeDotPopover = styled.div`
  position: absolute;
  bottom: 100%;
  right: -12px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: row;
  gap: 6px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 8px 12px;
  z-index: 100;
  opacity: ${props => props.show ? 1 : 0};
  transform: translateY(${props => props.show ? '0' : '10px'});
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: ${props => props.show ? 'auto' : 'none'};

  .unindent-svg {
    margin-top: -8px;
  }
`;

const PopoverButton = styled.button`
  background: transparent;
  border: none;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  opacity: ${props => props.disabled ? 0.5 : 1};
  transition: background 0.2s ease;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  svg {
    width: 20px;
    height: 20px;
    pointer-events: none;
  }
  &:hover {
    background: ${props => props.disabled ? 'transparent' : '#f3f4f6'};
  }
`;

const ColorIconWrapper = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #F2F2F2;
  background-color: ${props => props.bgColor || 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    width: 16px;
    height: 16px;
    path {
      fill: currentColor;
    }
  }
`;

const ColorMenuWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

export const TextBubbleMenuForColumns = ({ editor, isTitle = false }) => {
  const [textColor, setTextColor] = useState('#000');
  const [highlightColor, setHighlightColor] = useState('#fff');
  const [isColorMenuActive, setIsColorMenuActive] = useState(false);
  const [showThreeDotOptions, setShowThreeDotOptions] = useState(false);
  const [selectedBlockLabel, setSelectedBlockLabel] = useState("Paragraph");
  const [shouldShow, setShouldShow] = useState(false);
  const [selectedFontSizeLabel, setSelectedFontSizeLabel] = useState("normal");
  const [selectedFontFamilyLabel, setSelectedFontFamilyLabel] = useState("Aptos");
  
  // Use the common bubble menu state hook
  const {
    activeMenu,
    setActiveMenu,
    editModeRef,
    handleBubbleMenuShow,
    handleBubbleMenuHide
  } = useBubbleMenuState(editor);

  // Duplicate bubble menu adjustment for two column
  const { activeEditorId, setActiveEditorId } = useTwoColBubbleMenuContext();
  const editorId = editor?.options?.editorProps?.attributes?.id;
  const containerRef = useRef(null);

  if (!editor) return null;
  const { fontSizeLabel, blockTypeLabel } = useFontSizeFromSelection(editor);

  const toggleTextColor = (color) => {
    editor.chain().focus().setColor(`${color} !important`).run();
    setTextColor(color);
  };

  const toggleHighlightColor = (color) => {
    if (color === 'unset-color') {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().toggleHighlight({ color }).run();
    }
    setHighlightColor(color);
  };

  const alignmentOptions = [
    { title: 'Align Left', icon: <AlignLeft />, action: () => editor.chain().focus().setTextAlign('left').run() },
    { title: 'Align Center', icon: <AlignCenter />, action: () => editor.chain().focus().setTextAlign('center').run() },
    { title: 'Align Right', icon: <AlignRight />, action: () => editor.chain().focus().setTextAlign('right').run() },
    { title: 'Align Justify', icon: <AlignJustify />, action: () => editor.chain().focus().setTextAlign('justify').run() },
  ];

  const isList = editor.isActive('bulletList') || editor.isActive('orderedList');
  const sinkEnabled = isList && editor.can().sinkListItem('listItem');
  const liftEnabled = isList && editor.can().liftListItem('listItem');

  const listOptions = [
    { title: 'Indent', icon: <Indent />, action: () => editor.chain().focus().sinkListItem('listItem').run(), enabled: sinkEnabled },
    { title: 'Unindent', icon: <Unindent />, action: () => editor.chain().focus().liftListItem('listItem').run(), enabled: liftEnabled, className: "unindent-svg" },
  ];

  const fontFamilyOptions = [
    { label: "Aptos", value: "Aptos" },
    { label: "Aptos Display", value: "'Aptos Display'" },
    { label: "Aptos Light", value: "'Aptos Light'" },
    { label: "Roboto Flex", value: "'Roboto Flex', sans-serif" },
    { label: "Arial", value: "Arial, sans-serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Times New Roman", value: "'Times New Roman', serif" },
    { label: "Courier New", value: "'Courier New', monospace" },
    { label: "Verdana", value: "Verdana, sans-serif" },
    { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  ];

  useEffect(() => {
  setSelectedFontSizeLabel(fontSizeLabel);
  setSelectedBlockLabel(blockTypeLabel);
}, [fontSizeLabel, blockTypeLabel]);


  useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target)
    ) {
      setShouldShow(false);
      setActiveEditorId(null);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);

  useEffect(() => {
    const updateShouldShow = () => {
      if (!editor) return;
      
      const { from, to } = editor.state.selection;
      if (from === to) {
        setShouldShow(false);
        return;
      }

      const isChartSelected = editor.isActive('chart');
      if (isChartSelected) {
        setShouldShow(false);
        return;
      }

      const isTextSelection = editor.state.doc.textBetween(from, to).length > 0;
      // setShouldShow(isTextSelection);
      if (isTextSelection) {
        setShouldShow(true);
        setActiveEditorId(editorId);
      } else {
        setShouldShow(false);
      }
    };

    editor.on('selectionUpdate', updateShouldShow);
    return () => {
      editor.off('selectionUpdate', updateShouldShow);
    };
  }, [editor, editorId, setActiveEditorId]);

  const shouldRender = editor.isEditable && shouldShow && activeEditorId === editorId;

  // Reset activeMenu when bubble menu becomes visible or hidden
  useEffect(() => {
    if (shouldRender) {
      setActiveMenu(null);
      closeAllDropdownsAndNotify();
    } else {
      // Also reset when bubble menu is hidden
      setActiveMenu(null);
    }
  }, [shouldRender, setActiveMenu]);

  return (
    <CustomBubbleMenu editor={editor} open={shouldRender}>
          <div ref={containerRef}>
              {/* shouldShow */}
              <MenuContainer>
                {!isTitle && (
                  <>
                    <BlockTypeDropdown
                     editor={editor}
                      cb={(label) => {
                        setActiveMenu(null);

                        const { state, view } = editor;
                        const { from, to } = state.selection;

                        // Always clear conflicting blocks first
                        editor.chain().focus().unsetAllMarks().clearNodes().run();
                        let commandRan = false;

                        switch (label) {
                          case "Heading 1":
                            commandRan = editor.chain().setNode('heading', { level: 1 }).run();                            
                            break;
                          case "Heading 2":
                            commandRan = editor.chain().setNode('heading', { level: 2 }).run();                            
                            break;
                          case "Heading 3":
                            commandRan = editor.chain().setNode('heading', { level: 3 }).run();
                            break;
                          case "Paragraph":
                            commandRan = editor.chain().setParagraph().run();
                            break;
                          case "Quote":
                            commandRan = editor.chain().toggleBlockquote().run();
                            break;
                          case "Numbered List":
                            commandRan = editor.chain().toggleOrderedList().run();
                            break;
                          case "Bullet List":
                            commandRan = editor.chain().toggleBulletList().run();
                            break;
                          case "Check List":
                            commandRan = editor.chain().toggleTaskList().run();
                            break;
                          default:
                            break;
                        }
                      
                        // Restore selection after heading set (if needed)
                        // if (commandRan) {
                        //   editor.commands.setTextSelection({ from, to });
                        // }

                        // Immediately update label manually
                        setSelectedBlockLabel(label);
                      }}
                      isOpen={activeMenu === 'block'}
                      onToggle={() => setActiveMenu(activeMenu === 'block' ? null : 'block')}
                      selectedLabel={selectedBlockLabel}
                      setSelectedLabel={setSelectedBlockLabel}
                    />

                    <FontSizeDropdown
                      cb={(size) => {
                        editor.chain().focus().setFontSize(size).run();
                        setActiveMenu(null); // Close dropdown after selection
                      }}
                      isOpen={activeMenu === 'fontSize'}
                      onToggle={(nextState) => {setActiveMenu(nextState ? 'fontSize' : null)}}
                      selectedLabel={selectedFontSizeLabel}
                      setSelectedLabel={setSelectedFontSizeLabel}
                    />

                    <FontFamilyDropdown
                      cb={(font) => {
                        if (font === "") {
                          editor.chain().focus().unsetFontFamily().run();
                        } else {
                          editor.chain().focus().setFontFamily(font).run();
                        }
                        setActiveMenu(null);
                      }}
                      isOpen={activeMenu === 'fontFamily'}
                      onToggle={() => setActiveMenu(activeMenu === 'fontFamily' ? null : 'fontFamily')}
                      selectedLabel={selectedFontFamilyLabel}
                      setSelectedLabel={setSelectedFontFamilyLabel}
                    />

                    <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} $active={editor.isActive('bold')} title="Bold">
                      <Bold />
                    </MenuButton>
                  </>


                )}

                <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} $active={editor.isActive('italic')} title="Italic">
                  <Italics />
                </MenuButton>

                <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} $active={editor.isActive('underline')} title="Underline">
                  <Underline />
                </MenuButton>

                <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} $active={editor.isActive('strike')} title="Strikethrough">
                  <StrikeThrough />
                </MenuButton>

                {/* Color Picker */}
                <ColorMenuWrapper>
                  <MenuButton onClick={() => setActiveMenu(activeMenu === 'color' ? null : 'color')} $active={isColorMenuActive} title="Text & Background Color">
                    <ColorIconWrapper 
                      style={{ color: textColor }}
                      bgColor={highlightColor === 'unset-color' ? 'transparent' : highlightColor}
                    >
                      <ColorSelection />
                    </ColorIconWrapper>
                  </MenuButton>

                  <ColorPickerPopover
                    show={activeMenu === 'color'}
                    textColor={textColor}
                    highlightColor={highlightColor}
                    onTextColorSelect={toggleTextColor}
                    onHighlightColorSelect={toggleHighlightColor}
                  />
                </ColorMenuWrapper>

                <MenuButton onClick={() => {
                  editor.chain().focus().toggleCode().run()
                  }} $active={editor.isActive('code')} title="Code">
                  <Code />
                </MenuButton>
                {!isTitle && (
                  <MenuButton
                    className={editor.isActive('link') ? 'is-active' : ''}
                    onClick={() => {
                      editor.commands.setHyperlink({ 
                        href: '<https://acme.com>', 
                        target: '_blank',
                        source: 'textBubble' // Add this identifier
                      });
                    }}
                    title="Set Link"
                  >
                    <AddUrl />
                  </MenuButton>
                )
                }


                <ThreeDotContainer>
                  <MenuButton onClick={() => setActiveMenu(activeMenu === 'more' ? null : 'more')} title="More Options">
                    <VerticalThreeDot />
                  </MenuButton>

                  <ThreeDotPopover show={activeMenu === 'more'}>
                    {[...alignmentOptions, ...listOptions].map(({ title, action, icon, className = '', enabled = true }) => (
                      <PopoverButton
                        key={title}
                        onMouseDown={(e) => {
                        e.preventDefault();
                        if (enabled) {
                          action();
                          setActiveMenu(null);
                        }
                      }}
                        disabled={!enabled}
                        title={title}
                        className={className}
                      >
                        {icon}
                      </PopoverButton>
                    ))}
                  </ThreeDotPopover>
                </ThreeDotContainer>
              </MenuContainer>
          </div>

    </CustomBubbleMenu>
  );
};
