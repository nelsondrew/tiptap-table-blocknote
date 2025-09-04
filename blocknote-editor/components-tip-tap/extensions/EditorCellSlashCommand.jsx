import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import CommandList from '../CommandList';

let isTippyVisible = false;
let onTippyVisibilityChange = null;

export const setTippyVisibilityCallback = (callback) => {
  onTippyVisibilityChange = callback;
};

export const EditorCellSlashCommand = Extension.create({
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
  const items = [
    {
      title: 'Headings',
      children: [
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
          title: 'Table',
          subtitle: 'Table with editable cells',
          command: ({ editor, range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run();
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
        //   },
        // }
      ],
    },
    // {
    //   title: 'Basic Formatting',
    //   subtitle: null,
    //   children: [
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

      // Handle scroll on document.body
      document.body.addEventListener('scroll', () => {
        // const headerWrap = document.querySelector('.header-wrap');
        // Only hide and delete if header-wrap exists and is being scrolled
        if (true) {
          popup[0].hide();
          
          const { from } = props.range;
          props.editor
            .chain()
            .focus()
            .deleteRange({ from: from - 1, to: from })
            .run();
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
      popup?.[0].destroy();
      component?.destroy();
    },
  };
};
