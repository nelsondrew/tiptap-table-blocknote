import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import CommandList from '../CommandList';
import { newEvent } from 'src/components/ListView/utils';
import { isOnCoverPage } from 'src/components/PagesComponents/coverpageCommonHelpers';

// Add a global state to track tippy visibility
let isTippyVisible = false;
let onTippyVisibilityChange = null;

export const setTippyVisibilityCallback = (callback) => {
  onTippyVisibilityChange = callback;
};

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export const getSuggestionItems = ({ query, editor }) => {
  // Check if we're on a cover page using the same function as TextBubbleMenu
  const isCoverPage = isOnCoverPage(editor);

  const items = [
    {
      title: 'Headings',
      children: [
        // Add Page Title at the top if on cover page
        ...(isCoverPage ? [{
          title: 'Page Title',
          subtitle: 'Main cover page title heading',
          command: ({ editor, range }) => {
            const { from } = range;
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setNode('heading', { level: 0 })
              .setFontSize('40px')
              .setTextSelection(from)
              .run();
          },
        }] : []),
        {
          title: 'Heading 1',
          subtitle: 'Top-level heading',
          command: ({ editor, range }) => {
            const { from } = range;
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .toggleHeading({ level: 1 })
              .setTextSelection(from)
              .run();
          },
        },
        {
          title: 'Heading 2',
          subtitle: 'Key section heading',
          command: ({ editor, range }) => {
            const { from } = range;
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .toggleHeading({ level: 2 })
              .setTextSelection(from)
              .run();
          },
        },
        {
          title: 'Heading 3',
          subtitle: 'Subsection and group heading',
          command: ({ editor, range }) => {
            const { from } = range;
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .toggleHeading({ level: 3 })
              .setTextSelection(from)
              .run();
          },
        },
      ],
  },
    {
      title: 'Blocks',
      children: [
        {
          title: 'Chart',
          subtitle: 'Visual representations of data',
          command: ({ editor, range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent({ type: 'chart' })
              .run();
            newEvent.emit('event-reInitializePageBreak', editor)
          },
        },
        {
          title: 'Metrics',
          subtitle: 'Pre-defined data in chart visualization',
          command: ({ editor, range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent({ 
                type: 'chart',
                attrs: { source: 'metrics' }
              })
              .run();
            newEvent.emit('event-reInitializePageBreak', editor)
          },
        },
        {
          title: 'Table',
          subtitle: 'Table with editable cells',
          command: ({ editor, range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run();
            newEvent.emit('event-reInitializePageBreak', editor)
          },
        },
        {
          title: 'Paragraph',
          subtitle: 'The body of your document',
          command: ({ editor, range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setParagraph()
              .run();
          },
        },
        {
          title: 'Quote',
          subtitle: 'Quote or excerpt',
          command: ({ editor, range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .toggleBlockquote()
              .run();
            newEvent.emit('event-reInitializePageBreak', editor)
          },
        },
        {
          title: 'Numbered List',
          subtitle: 'List with ordered items',
          command: ({ editor, range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .toggleOrderedList()
              .run();
            newEvent.emit('event-reInitializePageBreak', editor)
          },
        },
        {
          title: 'Bullet List',
          subtitle: 'List with unordered items',
          command: ({ editor, range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .toggleBulletList()
              .run();
            newEvent.emit('event-reInitializePageBreak', editor)
          },
        },
        {
          title: 'Check List',
          subtitle: 'List with Checkboxes',
          command: ({ editor, range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .toggleTaskList()
              .run();
            newEvent.emit('event-reInitializePageBreak', editor)
          },
        },
        // {
        //   title: 'Code Block',
        //   subtitle: 'Code block with syntax highlighting',
        //   command: ({ editor, range }) => {
        //     editor
        //       .chain()
        //       .focus()
        //       .deleteRange(range)
        //       .toggleCodeBlock()
        //       .run();
        //     newEvent.emit('event-reInitializePageBreak', editor)
        //   },
        // },
       
        ...(editor?.isActive?.('table') ? [] : [
          {
            title: 'Two Columns',
            subtitle: 'Two columns side by side',
            command: ({ editor, range }) => {
              editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent({ type: 'flexDiv' })
              .run();
              newEvent.emit('event-reInitializePageBreak', editor)
            },
          },
          {
            title: 'Three Columns',
            subtitle: 'Add three column layout',
            command: ({ editor, range }) => {
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .insertContent({ type: 'threeColumn' })
                .run();
                newEvent.emit('event-reInitializePageBreak', editor)
            },
          },
        ]),
      ],
    },
    // {
    //   title: 'Basic Formatting',
    //   subtitle: null,
    //   children: [
    //     {
    //       title: 'Bold',
    //       subtitle: 'Make text bold',
    //       command: ({ editor, range }) => {
    //         editor.chain().focus().deleteRange(range).toggleBold().run();
    //       },
    //     },
    //     {
    //       title: 'Italic',
    //       subtitle: 'Make text italic',
    //       command: ({ editor, range }) => {
    //         editor.chain().focus().deleteRange(range).toggleItalic().run();
    //       },
    //     },
    //     {
    //       title: 'Strike',
    //       subtitle: 'Strikethrough text',
    //       command: ({ editor, range }) => {
    //         editor.chain().focus().deleteRange(range).toggleStrike().run();
    //       },
    //     },
    //     {
    //       title: 'Code',
    //       subtitle: 'Inline code',
    //       command: ({ editor, range }) => {
    //         editor.chain().focus().deleteRange(range).toggleCode().run();
    //       },
    //     },
    //   ],
    // },
    // {
    //   title: 'Media',
    //   subtitle: null,
    //   children: [
    //     {
    //       title: 'Image',
    //       subtitle: 'Resizable image with caption',
    //       command: ({ editor, range }) => {
    //         editor
    //           .chain()
    //           .focus()
    //           .deleteRange(range)
    //           .setImage({
    //             width: '400px',
    //             height: 'auto',
    //           })
    //           .run();
    //       },
    //     },
    //     {
    //       title: 'Video',
    //       subtitle: 'Resizable video with caption',
    //       command: ({ editor, range }) => {
    //         editor
    //           .chain()
    //           .focus()
    //           .deleteRange(range)
    //           .setVideo({
    //             width: '400px',
    //             height: 'auto',
    //           })
    //           .run();
    //       },
    //     },
    //   ],
    // },
    // Only include Tables section if we're inside a table
    ...(editor?.isActive?.('table') ? [
      {
        title: 'Tables',
        children: [
          {
            title: 'Add Column Before',
            subtitle: 'Insert column before selection',
            command: ({ editor, range }) => {
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .addColumnBefore()
                .run();
              newEvent.emit('event-reInitializePageBreak', editor)
            },
          },
          {
            title: 'Add Column After',
            subtitle: 'Insert column after selection',
            command: ({ editor, range }) => {
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .addColumnAfter()
                .run();
              newEvent.emit('event-reInitializePageBreak', editor)
            },
          },
          {
            title: 'Add Row Before',
            subtitle: 'Insert row before selection',
            command: ({ editor, range }) => {
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .addRowBefore()
                .run();
              newEvent.emit('event-reInitializePageBreak', editor)
            },
          },
          {
            title: 'Add Row After',
            subtitle: 'Insert row after selection',
            command: ({ editor, range }) => {
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .addRowAfter()
                .run();
              newEvent.emit('event-reInitializePageBreak', editor)
            },
          },
          {
            title: 'Delete Table',
            subtitle: 'Remove the entire table',
            command: ({ editor, range }) => {
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .deleteTable()
                .run();
              newEvent.emit('event-reInitializePageBreak', editor)
            },
          },
          {
            title: 'Delete Row',
            subtitle: 'Remove the selected row',
            command: ({ editor, range }) => {
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .deleteRow()
                .run();
              newEvent.emit('event-reInitializePageBreak', editor)
            },
          },
          {
            title: 'Delete Column',
            subtitle: 'Remove the selected column',
            command: ({ editor, range }) => {
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .deleteColumn()
                .run();
              newEvent.emit('event-reInitializePageBreak', editor)
            },
          },
        ],
      },
    ] : []),
  ];

  // Close the menu when there are 2+ trailing spaces after the query
  if (typeof query === 'string' && /\s{2,}$/.test(query)) {
    return [];
  }

  // Search functionality
  if (typeof query === 'string' && query.trim().length > 0) {
    const search = query.trim().toLowerCase();
    return items
      .map(group => ({
        ...group,
        children: group.children.filter(
          item =>
            item.title.toLowerCase().includes(search) ||
            item.subtitle?.toLowerCase().includes(search),
        ),
      }))
      .filter(group => group.children.length > 0);
  }

  return items;
};

export const renderItems = () => {
  let component = null;
  let popup = null;

  return {
    onStart: props => {
      const commandListRef = {
        onKeyDown: event => {
          console.log('Default handler', event);
        },
      };

      const headerWrap = document.querySelector('.header-wrap');
      if (headerWrap) {
        document.body.style.overflow = 'hidden';
        headerWrap.style.overflow = 'hidden';
      }

      component = new ReactRenderer(CommandList, {
        props: {
          ...props,
          onRef: methods => {
            if (methods) {
              commandListRef.onKeyDown = methods.onKeyDown;
            }
          },
        },
        editor: props.editor,
      });

      component.ref = commandListRef;

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        zIndex: 1,
        placement: 'bottom-start',
        onShow: () => {
          isTippyVisible = true;
          onTippyVisibilityChange?.(true);
        },
        onHide: () => {
          isTippyVisible = false;
          onTippyVisibilityChange?.(false);
        }
      });
    },

    onKeyDown(props) {
      if (!component?.ref?.onKeyDown) return false;

      if (props.event.key === 'Escape') {
        popup?.[0].hide();
        return true;
      }

      if (['ArrowUp', 'ArrowDown', 'Enter'].includes(props.event.key)) {
        props.event.preventDefault();
        const result = component.ref.onKeyDown(props.event);

        if (props.event.key === 'Enter') {
          popup?.[0].hide();
        }

        return result;
      }

      return false;
    },

    onUpdate(props) {
      component?.updateProps(props);

      popup?.[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onExit() {
      const headerWrap = document.querySelector('.header-wrap');

      if (headerWrap) {
        document.body.style.overflow = 'auto'
        headerWrap.style.overflow = 'auto'
      }
      popup?.[0].destroy();
      component?.destroy();
    },
  };
};
