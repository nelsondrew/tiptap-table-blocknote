# BlockNote Editor Package - Comprehensive Documentation

## Overview

The BlockNote Editor is a sophisticated rich text editor built on TipTap 2.x that provides advanced block-based editing capabilities, data visualization, collaborative features, and professional document layout management. It's designed for complex document editing applications requiring rich content and data integration.

## Package Structure

```
blocknote-editor/
├── index.tsx                       # Main editor component export (1,224 lines)
├── components-tip-tap/            # Core TipTap components (33 files)
│   ├── TipTapEditor.jsx          # Central editor implementation (93,894 lines)
│   ├── extensions/               # Custom TipTap extensions (30 files)
│   │   ├── SlashCommand.jsx      # Slash menu system
│   │   ├── BlockNoteTableExtension.ts # Custom table implementation
│   │   ├── Comments/             # Collaborative commenting system
│   │   └── ChartExtension.js     # Chart component integration
│   ├── hooks/                    # Custom React hooks
│   └── styles/                   # Editor styling files
├── Components/                   # High-level UI components
│   ├── TitleContainer.tsx        # Title management (27,849 lines)
│   ├── Table.tsx                 # Table component
│   ├── Dropdown/                 # Dropdown components
│   ├── Popover/                  # Popover components
│   └── TableHandlesController/   # Table interaction controls
└── utils/                        # Utility functions (16 files)
    ├── contentProcessor.js       # Content processing utilities
    ├── commentUtils.js           # Comment handling
    └── pasteEnhancements.js      # Paste functionality
```

## Key Dependencies

### Core Framework Stack
```json
{
  "@tiptap/react": "^2.11.5",
  "@tiptap/starter-kit": "^2.11.5", 
  "@tiptap/extension-table": "^2.11.5",
  "@tiptap/extension-color": "^2.11.5",
  "@tiptap/extension-highlight": "^2.11.5",
  "@floating-ui/react": "^0.27.16",
  "react-icons": "^5.5.0",
  "tippy.js": "^6.3.7",
  "groq-sdk": "^0.15.0",
  "tiptap-pagination-plus": "^1.1.2"
}
```

### Extension Ecosystem
- 17+ TipTap extensions for tables, text formatting, lists, and typography
- Custom extensions for charts, metrics, comments, and advanced layouts
- Floating UI for positioning and interaction management

## Architecture & Core Components

### Main Editor Components

#### BlockNoteEditor (`index.tsx`)
- **Role**: Main wrapper component providing editor UI and state management
- **Responsibilities**: 
  - Editor state and Redux integration
  - Hover controls and drag/drop functionality  
  - Plus button menu and block manipulation UI
  - Comment functionality and two-column bubble menus

#### TipTapEditor (`components-tip-tap/TipTapEditor.jsx`)
- **Role**: Core editor implementation using TipTap's useEditor hook
- **Responsibilities**:
  - Configuration of 25+ extensions
  - Content management and JSON serialization
  - Pagination and dynamic height calculation
  - Header/footer management and page numbering
  - Comment system and collaborative editing

### Extension System

#### Core Content Extensions
- **Text Blocks**: Custom paragraphs, headings (H1-H3), page titles
- **Rich Text**: Bold, italic, underline, strikethrough, highlighting, color
- **Lists**: Bullet lists, ordered lists, task lists with nesting support
- **Code**: Inline code and code blocks with syntax highlighting

#### Media & Interactive Extensions  
- **Charts**: `ChartExtension` - Resizable chart components with data visualization
- **Images**: `ImageExtension` - Upload, resizing, captioning functionality
- **Videos**: `VideoExtension` - Video embedding and playback controls
- **Tables**: `BlockNoteTableExtension` - Advanced table editing with custom cells
- **Metrics**: `MetricExtension` - Interactive data metric components

#### Layout Extensions
- **Columns**: `FlexDivExtension`, `ThreeColumnExtension` - Multi-column layouts
- **Page Management**: `PageBreak`, `FooterOnly` - Print layout controls
- **Comments**: Collaborative commenting with anchors and threading
- **Slash Commands**: Quick block insertion via "/" trigger

## API Reference

### Primary Component Interface

```typescript
interface BlockNoteEditorProps {
  component: ComponentData;                    // Component metadata
  editMode: boolean;                          // Edit vs view mode toggle
  hoveredPos?: Position;                      // Hover position tracking
  setHoveredPos: (pos: Position) => void;    // Hover state management
  setHeadings: (headings: Heading[]) => void; // Heading extraction callback
  parentId: string;                           // Parent component identifier
  editorInstance?: Editor;                    // TipTap editor instance
  setEditorInstance: (editor: Editor) => void; // Editor instance setter
  handleComponentDrop: (data: DropData) => void; // Drag & drop handler
  isEmojiModalOpen: boolean;                  // Emoji modal state
  setIsEmojiModalOpen: (open: boolean) => void; // Emoji modal control
  isCoverPage?: boolean;                      // Cover page mode flag
  selectedTemplateCover?: string;             // Template selection
  coverOverlayTexts?: string[];              // Cover text overlays
  onOverlayTextChange?: (texts: string[]) => void; // Cover text handler
  coverTemplates?: Template[];                // Available cover templates
}
```

### Editor Configuration Example

```javascript
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: false,    // Use custom heading extension
      paragraph: false,  // Use custom paragraph extension
    }),
    Color,
    FontFamily,
    FontSize,
    Placeholder.configure({
      placeholder: `Enter text or type '/' for commands and "@" for metrics`,
      emptyNodeClass: 'is-empty',
      showOnlyWhenEditable: true,
      includeChildren: true,
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
    MetricExtension.configure({
      onMetricClick: handleMetricClick,
      parentId: id
    }),
    // ... additional extensions
  ],
  editable: editMode,
  content: component?.meta?.editorJson || initialContent,
  onCreate: ({ editor }) => {
    setIsMounted(true);
    // Dynamic height calculation and setup
  },
  onUpdate: ({ editor }) => {
    // Debounced auto-save functionality
    debounceUpdateEditorComponent(editor.getJSON());
  },
  onSelectionUpdate: ({ editor }) => {
    // Comment detection and selection-based UI updates
    const { from, to } = editor.state.selection;
    // Handle selection changes...
  }
});
```

## State Management Patterns

### Redux Integration

```javascript
// State selectors
const editMode = useSelector(state => state?.dashboardState?.editMode);
const isDarkMode = useSelector(state => state?.dashboardState?.darkMode);
const metadata = useSelector(state => state?.dashboardInfo?.metadata);

// State updates
dispatch(updateComponents({
  [component.id]: {
    ...component,
    meta: {
      ...component.meta,
      editorJson: updatedJson,
      lastModified: Date.now()
    }
  }
}));
```

### Data Flow Architecture

1. **Content Persistence**: Editor content → JSON → Redux store → Backend API
2. **State Synchronization**: Redux changes → Editor content updates via props
3. **Event Handling**: User interactions → Editor commands → State updates
4. **Collaborative Features**: Comment system ↔ Backend API synchronization

## Usage Patterns

### Basic Rich Text Editor

```jsx
import BlockNoteEditor from 'blocknote-editor';

<BlockNoteEditor
  component={documentComponent}
  editMode={true}
  hoveredPos={hoveredPosition}
  setHoveredPos={setHoveredPosition}
  setHeadings={setDocumentHeadings}
  parentId="document-container"
  editorInstance={editorRef.current}
  setEditorInstance={setEditorRef}
  handleComponentDrop={handleBlockDrop}
/>
```

### Advanced Document Mode

```jsx
// With pagination and cover page support
<BlockNoteEditor
  component={documentComponent}
  editMode={isEditing}
  isCoverPage={showCoverPage}
  selectedTemplateCover="modern-template"
  coverOverlayTexts={["Title", "Subtitle"]}
  onOverlayTextChange={handleCoverTextChange}
  coverTemplates={availableTemplates}
  // ... other props
/>
```

### Comment System Integration

```javascript
const handleAddComment = useCallback((commentId) => {
  if (!editor) return;

  const anchor = getCommentAnchorFromSelection(editor);
  if (!anchor) return;

  const { from, to } = editor.state.selection;
  if (from === to) return;

  // Apply comment mark to selected text
  editor.commands.setTextSelection({ from, to });
  editor.chain().setComment(commentId).run();

  // Persist changes
  dispatch(updateComponents({...}));
  dispatch(dashboardInfoChanged({...}));
}, [editor, component, dispatch]);
```

## Event System

### Custom Events

```javascript
// Bubble menu coordination
export const dispatchBubbleMenuShowEvent = () => {
  const event = new CustomEvent('bubble-menu-show', {
    bubbles: true,
    cancelable: true
  });
  document.dispatchEvent(event);
};

// Page break re-initialization
newEvent.emit('event-reInitializePageBreak');
```

### Editor Event Handlers

```javascript
// Content change handling with debouncing
onUpdate({ editor }) {
  const updatedJson = editor.getJSON();
  debounceUpdateEditorComponent(updatedJson);
  
  // Extract headings for navigation
  const headings = extractHeadings(updatedJson);
  setHeadings(headings);
},

// Selection-based features
onSelectionUpdate({ editor }) {
  const { from, to } = editor.state.selection;
  
  // Comment anchor detection
  const commentAnchor = getCommentAnchorFromSelection(editor);
  if (commentAnchor) {
    // Handle comment-related UI updates
  }
}
```

## Key Features

### Advanced Table Support
- Custom table extension with BlockNote-style cell editing
- Table handles for row/column manipulation
- Advanced table tracking and management
- Cell merging and splitting capabilities

### Data Visualization
- Interactive chart components with resizing
- Metric insertion with "@" trigger
- Dynamic data binding and filtering
- Chart type support (bar, line, pie, etc.)

### Collaborative Features
- Real-time commenting system
- Comment threading and anchoring
- Text selection-based annotations
- Comment modal management

### Document Layout
- Multi-column layout support (2-3 columns)
- Page break management
- Header and footer support
- Cover page templates
- Print-ready pagination

### Rich Content Support
- Image upload and management
- Video embedding
- Emoji system with custom uploads
- Font customization (size, family, color)
- Advanced text formatting

## Development Guidelines

### File Organization
- **Extensions**: Place custom extensions in `/components-tip-tap/extensions/`
- **Components**: Reusable UI components in `/Components/`  
- **Utilities**: Helper functions in `/utils/`
- **Styling**: Editor styles in `/styles/tiptap.less`

### Best Practices
1. **State Management**: Use Redux for persistence and complex state
2. **Performance**: Implement debounced auto-save (300ms recommended)
3. **Mode Switching**: Handle edit/view transitions carefully
4. **Extension Config**: Provide comprehensive extension configuration
5. **Event Lifecycle**: Manage bubble menu and modal lifecycles properly

### Testing Recommendations
- No built-in test framework currently configured
- Recommend Jest + React Testing Library setup
- Focus on extension functionality and state management
- Test collaborative features and comment system

## Technical Considerations

### Build Configuration
- **Missing Build Setup**: No standalone build configuration found
- **Language Mix**: 53 TypeScript + 55 JavaScript files
- **Integration Pattern**: Designed for embedding in larger applications
- **Dependencies**: Relies on parent application's build system

### Performance Notes
- Large file sizes: TipTapEditor.jsx (93,894 lines), TitleContainer.tsx (27,849 lines)
- Consider code splitting for production use
- Implement lazy loading for heavy extensions
- Use React.memo for performance-critical components

### Future Enhancements
- Add TypeScript configuration for better type safety
- Implement standalone build process
- Add comprehensive test suite
- Consider modular extension loading
- Implement extension marketplace pattern

This documentation provides a comprehensive reference for working with the BlockNote Editor package, understanding its architecture, and implementing custom features and integrations.