import tippy, { Instance } from "tippy.js";
import { Editor } from "@tiptap/core";
import { EditorView } from "@tiptap/pm/view";
import { posToDOMRect } from "@tiptap/core";

export interface TippyInitOptions {
  editor: Editor;
  validate?: (url: string) => boolean;
}

class Tooltip {
  private tippyInstance?: Instance;
  private preventHide: boolean = false;
  private tippyWrapper: HTMLDivElement;
  private editor: Editor;
  private view: EditorView;

  constructor(options: TippyInitOptions) {
    this.editor = options.editor;
    this.view = this.editor.view;
    this.tippyWrapper = document.createElement("div");
    this.tippyWrapper.addEventListener("mousedown", this.mousedownHandler, {
      capture: true,
    });
    this.view.dom.addEventListener("dragstart", this.dragstartHandler);
    this.editor.on("blur", this.blurHandler);
  }

  init() {
    this.tippyWrapper.innerHTML = "";
    return { tippyModal: this.tippyWrapper, tippyInstance: this.tippyInstance };
  }

  show() {
    this.tippyInstance?.show();
    return true;
  }

  hide() {
    setTimeout(() => this.tippyInstance?.hide());
    return false;
  }

  private mousedownHandler = () => {
    this.preventHide = true;
  };

  private dragstartHandler = () => {
    this.hide();
  };

  private blurHandler = ({ event }: { event: FocusEvent }) => {
    if (this.preventHide) {
      this.preventHide = false;
      return;
    }

    const relatedTarget = event.relatedTarget as Node | null;
    if (
      relatedTarget &&
      this.tippyWrapper.parentNode &&
      this.tippyWrapper.parentNode.contains(relatedTarget)
    ) {
      return;
    }

    this.hide();
  };

  private tippyBlurHandler = (event: FocusEvent) => {
    this.blurHandler({ event });
  };

  private createTooltip() {
    if (!this.editor || !this.editor.options) return;

    const { element: editorElement } = this.editor.options;
    const editorIsAttached = !!editorElement.parentElement;
    if (this.tippyInstance || !editorIsAttached) {
      return;
    }

    this.tippyInstance = tippy(editorElement, {
      duration: 0,
      getReferenceClientRect: null, // will be overridden
      content: this.tippyWrapper,
      interactive: true,
      trigger: "manual",
      placement: "bottom-start",
      hideOnClick: true,
      onClickOutside: () => this.hide(),
      onAfterUpdate: () => this.show(),
    });

    if (this.tippyInstance.popper.firstChild) {
      (this.tippyInstance.popper.firstChild as HTMLElement).addEventListener(
        "blur",
        this.tippyBlurHandler
      );
    }
  }

  /**
   * Update the position of the tooltip.
   * @param view EditorView
   * @param option {
   *   pos?: number (optional) → use this position to align tooltip instead of selection.from
   *   ...other TippyProps
   * }
   */
  update(view: EditorView, option: any = {}) {
    this.createTooltip();

    const pos = option?.pos ?? view.state.selection.from;

    if (this.tippyInstance) {
      this.tippyInstance.setProps({
        ...option,
        getReferenceClientRect: () => {
          return { ...posToDOMRect(view, pos, pos), width: 0 };
        },
      });
    }

    return {};
  }

  destroyTooltip() {
    if (this.tippyInstance) {
      this.tippyInstance.destroy();
      this.tippyInstance = undefined;
      this.tippyWrapper.removeEventListener("mousedown", this.mousedownHandler, {
        capture: true,
      });
      this.view.dom.removeEventListener("dragstart", this.dragstartHandler);
      this.editor.off("blur", this.blurHandler);
    }
  }
}

export default Tooltip;
