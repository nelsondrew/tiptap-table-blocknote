import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
import { newEvent } from 'src/components/ListView/utils';
import { useFontSizeFromSelection } from 'src/hooks/useFontSizeFromSelection';
import { updateBgColor } from '../Components/updateBgColor';
import { applyCoverPageStyling, applyCoverPageStylingWithForce, positionBubbleMenu, isOnCoverPage } from 'src/components/PagesComponents/coverpageCommonHelpers';

const MenuContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 4px;
  border: 1px solid #F2F2F2;
  padding: 9px;
  gap: 12px;
  max-height: 42px;
  /* max-width: 592px; //566px; */
  z-index: 9999;
  position: relative;
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
  /* min-width: 2rem; */
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

export const TextBubbleMenu = ({ editor, isTitle = false }) => {
  const [textColor, setTextColor] = useState('#000');
  const [highlightColor, setHighlightColor] = useState('#fff');
  const [isColorMenuActive, setIsColorMenuActive] = useState(false);
  const [showThreeDotOptions, setShowThreeDotOptions] = useState(false);
  const [selectedBlockLabel, setSelectedBlockLabel] = useState("Paragraph");
  const [selectedFontSizeLabel, setSelectedFontSizeLabel] = useState("normal");
  const [selectedFontFamilyLabel, setSelectedFontFamilyLabel] = useState("Aptos");
  const metadata = useSelector((state) => state?.dashboardInfo?.metadata);
  
  // Memoized shouldHideComponents for performance optimization
  const shouldHideComponents = useMemo(() => {
    if (!editor) return false;
    const isHeading = editor.isActive('heading');
    return isHeading;
  }, [editor, editor?.state?.selection]);
  
  // Use the common bubble menu state hook
  const {
    activeMenu,
    setActiveMenu,
    editModeRef,
    handleBubbleMenuShow,
    handleBubbleMenuHide
  } = useBubbleMenuState(editor);

  if (!editor) return null;
  const { fontSizeLabel, blockTypeLabel } = useFontSizeFromSelection(editor);

  // Ensure all dropdown states are reset when labels change (which happens during selection)
  useEffect(() => {
    setSelectedFontSizeLabel(fontSizeLabel);
    setSelectedBlockLabel(blockTypeLabel);
    setActiveMenu(null);  // Reset any open dropdowns when selection changes
  }, [fontSizeLabel, blockTypeLabel, setActiveMenu]);

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
  

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ 
        duration: 100, 
        placement: 'top',
        interactive: true,
        ...(isOnCoverPage(editor) && {
          offset: [40, 10],
          appendTo: () => document.getElementById('app'),
          popperOptions: {
            modifiers: [
              {
                name: 'preventOverflow',
                options: {
                  boundary: 'viewport',
                  padding: 10
                }
              },
              {
                name: 'flip',
                options: {
                  fallbackPlacements: ['bottom', 'left', 'right']
                }
              }
            ]
          }
        })
      }}
      onShow={handleBubbleMenuShow}
      onHide={handleBubbleMenuHide}
      shouldShow={({ editor, from, to }) => {
        // Get editMode from ref (updated dynamically)
        const currentEditMode = editModeRef.current;
        if (!currentEditMode) return false;
        if (from === to) return false;

          const { state } = editor;
          const { doc } = state;
          const selectedText = doc.textBetween(from, to);

          // Hide for empty selection
          if (!selectedText.trim()) return false;

          // Hide if inside a code block
          const $from = doc.resolve(from);
          for (let i = $from.depth; i > 0; i--) {
            const node = $from.node(i);
            if (node.type.name === 'codeBlock') return false;
          }

          // ✅ NEW: Hide if inline `code` is active
          if (editor.isActive('code')) return false;

          return true;
        }
     }

      className="text-bubble-wrapper"
      style={{
        zIndex: 9999,
        position: 'relative'
      }}
    >
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
                  case "Page Title":
                    // First set the heading node with custom level 0, then apply font size and bold marks
                    commandRan = editor.chain().setNode('heading', { level: 0 }).run();
                    newEvent.emit('event-reInitializePageBreak', editor)
                    break;
                  case "Heading 1":
                    commandRan = editor.chain().setNode('heading', { level: 1 }).run();
                    newEvent.emit('event-reInitializePageBreak', editor)
                    break;
                  case "Heading 2":
                    commandRan = editor.chain().setNode('heading', { level: 2 }).run();
                    newEvent.emit('event-reInitializePageBreak', editor)
                    break;
                  case "Heading 3":
                    commandRan = editor.chain().setNode('heading', { level: 3 }).run();
                    newEvent.emit('event-reInitializePageBreak', editor)
                    break;
                  case "Paragraph":
                    commandRan = editor.chain().setParagraph().run();
                    newEvent.emit('event-reInitializePageBreak', editor)
                    break;
                  case "Quote":
                    commandRan = editor.chain().toggleBlockquote().run();
                    newEvent.emit('event-reInitializePageBreak', editor)
                    break;
                  case "Numbered List":
                    commandRan = editor.chain().toggleOrderedList().run();
                    newEvent.emit('event-reInitializePageBreak', editor)
                    break;
                  case "Bullet List":
                    commandRan = editor.chain().toggleBulletList().run();
                    newEvent.emit('event-reInitializePageBreak', editor)
                    break;
                  case "Check List":
                    commandRan = editor.chain().toggleTaskList().run();
                    newEvent.emit('event-reInitializePageBreak', editor)
                    break;
                  default:
                    break;
                }
                // Restore selection after heading set (if needed)
                // if (commandRan) {
                //   editor.commands.setTextSelection({ from, to });
                // }

                // Immediately update label manually
                  newEvent.emit('event-reInitializePageBreak', editor);
                  setSelectedBlockLabel(label);
                  applyCoverPageStyling(metadata?.slide_color, metadata?.coverImage, 0);
                  if (label?.includes('Heading') || label === 'Page Title') {
                    applyCoverPageStylingWithForce(metadata?.slide_color, metadata?.coverImage, 0);
                  }
              }}
              isOpen={activeMenu === 'block'}
              onToggle={() => setActiveMenu(activeMenu === 'block' ? null : 'block')}
              selectedLabel={selectedBlockLabel}
              setSelectedLabel={setSelectedBlockLabel}
            />

          {/* Conditionally show FontSizeDropdown */}
          {!shouldHideComponents && (
            <FontSizeDropdown
              cb={(size) => {
                editor.chain().focus().setFontSize(size).run();
                newEvent.emit('event-reInitializePageBreak', editor)
                setActiveMenu(null); // Close dropdown after selection
                applyCoverPageStyling(metadata?.slide_color, metadata?.coverImage, 0);
              }}
              isOpen={activeMenu === 'fontSize'}
              onToggle={(nextState) => {setActiveMenu(nextState ? 'fontSize' : null)}}
              selectedLabel={selectedFontSizeLabel}
              setSelectedLabel={setSelectedFontSizeLabel}
            />
          )}

            <FontFamilyDropdown
              cb={(font) => {
                if (font === "") {
                  editor.chain().focus().unsetFontFamily().run();
                } else {
                  editor.chain().focus().setFontFamily(font).run();
                }
                newEvent.emit('event-reInitializePageBreak', editor)
                setActiveMenu(null);
                applyCoverPageStyling(metadata?.slide_color, metadata?.coverImage, 0);
              }}
              isOpen={activeMenu === 'fontFamily'}
              onToggle={() => setActiveMenu(activeMenu === 'fontFamily' ? null : 'fontFamily')}
              selectedLabel={selectedFontFamilyLabel}
              setSelectedLabel={setSelectedFontFamilyLabel}
            />

          {/* Conditionally show Bold button */}
          {!shouldHideComponents && (
            <MenuButton onClick={() => {
              editor.chain().focus().toggleBold().run()
              newEvent.emit('event-reInitializePageBreak', editor)
              applyCoverPageStyling(metadata?.slide_color, metadata?.coverImage, 0);
            }} $active={editor.isActive('bold')} title="Bold">
              <Bold />
            </MenuButton>
          )}
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
          newEvent.emit('event-reInitializePageBreak', editor)
          applyCoverPageStyling(metadata?.slide_color, metadata?.coverImage, 0);
        }} $active={editor.isActive('code')} title="Code">
          <Code />
        </MenuButton>
        {!isTitle && (
          <MenuButton
            className={editor.isActive('link') ? 'is-active' : ''}
            onClick={() => {
              editor.commands.setHyperlink({ href: '<https://acme.com>', target: '_blank' });
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
    </BubbleMenu>
  );
};
