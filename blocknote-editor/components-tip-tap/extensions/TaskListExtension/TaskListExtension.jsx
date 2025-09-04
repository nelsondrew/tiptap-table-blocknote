// Tiptap Notion-style Task List Setup
import TaskItem from '@tiptap/extension-task-item';

// Custom TaskItem extension with Notion-style keyboard support
const CustomTaskItem = TaskItem.extend({
  name: 'taskItem',
  addKeyboardShortcuts() {
    return {
      // Nest item
      Tab: () => this.editor.commands.sinkListItem('taskItem'),

      // Unnest item
      'Shift-Tab': () => this.editor.commands.liftListItem('taskItem'),

      // Enter on empty item -> lift (like Notion)
      Enter: () => {
        const { state, commands } = this.editor;
        const { selection } = state;
        const { $from } = selection;
        const node = $from.node();

        if (node.type.name === 'taskItem' && node.content.size === 0) {
          return commands.liftListItem('taskItem');
        }

        return false; // use default
      },

      // Backspace on empty nested task -> unnest
      Backspace: () => {
        const { state, commands } = this.editor;
        const { selection } = state;
        const { $from } = selection;
        const node = $from.node();

        if (node.type.name === 'taskItem' && node.content.size === 0 && $from.depth > 2) {
          return commands.liftListItem('taskItem');
        }

        return false; // use default
      },
    };
  },

});

export default CustomTaskItem;