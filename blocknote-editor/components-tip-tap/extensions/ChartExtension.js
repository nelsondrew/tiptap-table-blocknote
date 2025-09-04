import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ResizableChart } from '../ResizableChart'

export const ChartExtension = Node.create({
  name: 'chart',

  group: 'block',

  atom: true,

  selectable: true,

  draggable: true,

  addAttributes() {
    return {
      alignment: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-alignment') || 'center',
        renderHTML: attributes => ({
          'data-alignment': attributes.alignment,
        }),
      },
      nodeId: {
        default: null,
        parseHTML: element => element.getAttribute('data-node-id'),
        renderHTML: attributes => ({
          'data-node-id': attributes.nodeId,
        }),
      },
      width: {
        default: '100%',
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => ({
          width: attributes.width,
        }),
      },
      height: {
        default: '400px',
        parseHTML: element => element.getAttribute('height'),
        renderHTML: attributes => ({
          height: attributes.height,
        }),
      },
      chartData: {
        default: null,
      },
      caption: {
        default: '',
        parseHTML: element => element.getAttribute('data-caption'),
        renderHTML: attributes => ({
          'data-caption': attributes.caption,
        }),
      },
      captionAlignment: {
        default: 'bottom',
        parseHTML: element => element.getAttribute('data-caption-alignment'),
        renderHTML: attributes => ({
          'data-caption-alignment': attributes.captionAlignment,
        }),
      },
      captionWidth: {
        default: '20%',
        parseHTML: element => element.getAttribute('data-caption-width'),
        renderHTML: attributes => ({
          'data-caption-width': attributes.captionWidth,
        }),
      },
       chartLayoutId: {
        default: null,
        parseHTML: element => element.getAttribute('data-chart-layout-id'),
        renderHTML: attributes => ({
          'data-chart-layout-id': attributes.chartLayoutId,
        }),
      },
      widthRatio: {
        default: null,
        parseHTML: element => element.getAttribute('data-width-ratio'),
        renderHTML: attributes => ({
          'data-width-ratio': attributes.widthRatio,
        }),
      },
      source: {
        default: 'chart',
        parseHTML: element => element.getAttribute('data-source'),
        renderHTML: attributes => ({
          'data-source': attributes.source,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="chart"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'chart', ...HTMLAttributes }]
  },

  addOptions() {
    return {
      parentId: null,
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableChart)
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        if (editor.isActive(this.name)) {
          // Dispatch a custom event that the ResizableChart component will listen for
          const chartNode = editor?.state?.doc?.nodeAt(editor?.state?.selection?.$from?.pos)
          const chartLayoutId = chartNode?.attrs?.chartLayoutId;
          
          // Create unique event name using chartLayoutId
          const eventName = `chart-delete-request-${chartLayoutId}`;
          console.log("Event name" , eventName)

          const event = new CustomEvent(eventName, {
            detail: { position: editor.state.selection.$from.pos }
          })
          window.dispatchEvent(event)
          return true // Prevent default backspace behavior
        }
        return false
      },
      Delete: ({ editor }) => {
        if (editor.isActive(this.name)) {
          const event = new CustomEvent('chart-delete-request', {
            detail: { position: editor.state.selection.$from.pos }
          })
          window.dispatchEvent(event)
          return true
        }
        return false
      }
    }
  },

  addCommands() {
    return {
      deleteChart: () => ({ commands }) => {
        return commands.deleteNode('chart')
      },
      setChartCaption: caption => ({ commands }) => {
        return commands.updateAttributes('chart', { caption })
      },
    }
  },
}) 