import { getAttributes } from "@tiptap/core";
import { MarkType } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Editor } from "@tiptap/core";
import { EditorView } from "@tiptap/pm/view";
import Tooltip from "./tippyHelper";

// Define type for the ClickHandlerOptions
type ClickHandlerOptions = {
  type: MarkType;
  editor: Editor;
  validate?: (url: string) => boolean;
  modal?: ((options: any) => void | HTMLElement) | null;
};

export default function clickHandler(options: ClickHandlerOptions): Plugin {
  // Create the tooltip instance
  let tooltip = new Tooltip(options);

  // Initialize the tooltip
  let { tippyModal, tippyInstance } = tooltip.init();

  return new Plugin({
    key: new PluginKey("handleClickHyperlink"),
    props: {
      handleClick: (view, pos, event) => {
        const eventClassName = typeof event?.target?.className === 'string' ?  event?.target?.className : '';
        if(eventClassName.includes('EditableTitle')) return;

          try {
            const { store } = require("src/views/store");
            if (store && store?.getState) {
              const storeState = store.getState();
              const editMode = storeState?.dashboardState?.editMode
              if (!editMode) return;
            } 
          } catch (error) {
            console.warn('Store not available or failed to load:', error);
          }

        if (event.button !== 0) return false;

        // Get the target HTML element and its position
        const nodeTarget: HTMLElement = event.target as HTMLElement;
        const clickPos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        if (clickPos === undefined) return false;
        
        const $pos = view.state.doc.resolve(clickPos);
        const mark = options.type;
        let start = clickPos;
        let end = clickPos;
        
        // Walk backward to find the start of the link mark
        for (let i = clickPos; i >= 0; i--) {
          const node = view.state.doc.nodeAt(i);
          if (!node) continue;
          const marks = node.marks || [];
          if (!marks.find(m => m.type === mark)) break;
          start = i;
        }
        
        // Walk forward to find the end of the link mark
        for (let i = clickPos; i <= view.state.doc.content.size; i++) {
          const node = view.state.doc.nodeAt(i);
          if (!node) continue;
          const marks = node.marks || [];
          if (!marks.find(m => m.type === mark)) break;
          end = i;
        }
        
        const nodePos = start;
        

        // Find the closest link element to the target element
        const link = nodeTarget?.closest("a");

        // Extract attributes from the state
        const attrs = getAttributes(view.state, options.type.name);

        // Extract href and target attributes from the link element or the state
        const href = link?.href ?? attrs.href;
        const target = link?.target ?? attrs.target;

        // If there is no previewHyperlink modal provided, then open the link in new window
        if (!options.modal) {
          if (link && href) {
            window.open(href, target);
          }
          return true;
        }

        // if the link does not contain href attribute, hide the tooltip
        if (!link?.href) return tooltip.hide();

        // Create a preview of the hyperlink
        const hyperlinkPreview = options.modal({
          link,
          nodePos,
          tippy: tooltip,
          ...options,
        });

        // If there is no hyperlink preview, hide the modal
        if (!hyperlinkPreview) return tooltip.hide();

        // Empty the modal and append the hyperlink preview box

        while (tippyModal.firstChild) {
          tippyModal.removeChild(tippyModal.firstChild);
        }

        tippyModal.append(hyperlinkPreview);

        // Update the modal position
        // tooltip.update(options.editor.view);

        tooltip.update(options.editor.view, {
            getReferenceClientRect: () => link.getBoundingClientRect(), // 👈 anchor directly to the <a> element
            placement: 'top',
            offset: [0, 4],
          });          

        return false;
      },
    },
  });
}