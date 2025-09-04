import { Editor } from "@tiptap/core";
import Tooltip, { TippyInitOptions } from "../helpers/tippyHelper";
import { find } from "linkifyjs";

export type TSetHyperlinkModalOptions = {
  editor: Editor;
  validate?: (url: string) => boolean;
  extentionName: string;
  attributes?: { href: string; target?: string | null; source?: string | null };
  Tooltip: new (options: TippyInitOptions) => Tooltip;
  roundArrow: string;
};

let tooltip: Tooltip | undefined = undefined;

export function setHyperlinkModal(options: TSetHyperlinkModalOptions): void {
  // Create the tooltip instance
  if (!tooltip) {
    tooltip = new options.Tooltip({
      ...options,
      appendTo: () => document.body,
      interactive: true,
      trigger: 'manual',
      hideOnClick: false,
      allowHTML: true,
      maxWidth: 'none',
      zIndex: 999999,
      offset: [0, 15], // Add offset [x, y] - this will move it 15px down
      onMount(instance: any) {
        const input = instance.popper.querySelector('input');
        if (input) {
          input.focus();
        }
      }
    });
  }

  let { tippyModal } = tooltip.init();

  // Add Tippy box class to maintain styling context
  tippyModal.classList.add('tippy-box');

  // Add style to hide arrow
  const style = document.createElement('style');
  style.textContent = `
    .tippy-svg-arrow {
      display: none !important;
    }
  `;
  tippyModal.appendChild(style);

  const hyperlinkModal = document.createElement("div");
  const buttonsWrapper = document.createElement("div");
  const inputsWrapper = document.createElement("div");

  // Get source from attributes
  const source = options.attributes?.source;

  // Add styles with conditional transform
  hyperlinkModal.style.cssText = `
    background-color: #fff;
    border-radius: 4px;
    border: 1px solid #f2f2f2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 6px;
    box-shadow: 0px 1px 4px 1px #00000014;
    margin-top: -50px;
    color: #000;
    width: 300px;
    transform: ${source === 'textBubble' ? 'translate(35rem,4rem)' : 'translate(23.5rem,4rem)'};
  `;

  hyperlinkModal.classList.add("hyperlink-set-modal");
  buttonsWrapper.classList.add("hyperlink-set-modal__buttons-wrapper");
  inputsWrapper.classList.add("hyperlink-set-modal__inputs-wrapper");

  const form = document.createElement("form");
  form.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-around;
    width: 100%;
  `;

  const input = document.createElement("input");
  input.setAttribute("type", "text");
  input.setAttribute("placeholder", "eg: https://acme.com");
  input.className = "url-inputbox";
  input.style.cssText = `
    width: 209px;
    border-radius: 4px;
    border: 1px solid #e5e5e5;
    padding: 0.4rem 0.8rem;
    margin-bottom: 0.2rem;
  `;

  const button = document.createElement("button");
  button.setAttribute("type", "submit");
  button.innerText = "Set Link";
  button.style.cssText = `
    width: 70px;
    border-radius: 4px;
    font-weight: 400;
    font-size: 14px;
    line-height: 24px;
    letter-spacing: 1%;
    vertical-align: middle;
    margin-left: 8px;
    height: 36px;
    color: #9c9c9c;
    background: #fbfbfb;
    border: none;
    cursor: pointer;
  `;

  // Add hover effect
  button.addEventListener('mouseenter', () => {
    button.style.background = 'transparent';
    button.style.color = '#00b0b3';
  });

  button.addEventListener('mouseleave', () => {
    button.style.background = '#fbfbfb';
    button.style.color = '#9c9c9c';
  });

  inputsWrapper.append(input);
  buttonsWrapper.append(button);
  form.append(inputsWrapper, buttonsWrapper);
  hyperlinkModal.append(form);

  tippyModal.innerHTML = "";
  tippyModal.append(hyperlinkModal);

  // Update tooltip with proper configuration
  tooltip.update(options.editor.view, {
    arrow: false, // Set this to false to remove arrow
    interactive: true,
    trigger: 'manual',
    placement: 'top',
    hideOnClick: false,
    appendTo: () => document.body,
    popperOptions: {
      strategy: 'fixed',
      modifiers: [
        {
          name: 'eventListeners',
          enabled: true,
        },
        {
          name: 'flip',
          options: {
            fallbackPlacements: ['bottom', 'right', 'left'],
          },
        },
        {
          name: 'preventOverflow',
          options: {
            boundary: 'viewport',
            padding: 8,
          },
        },
      ],
    },
  });

  // Show the tooltip immediately
  tooltip.show();

  // Handle input focus and events
  requestAnimationFrame(() => {
    input.focus();
    input.style.outlineColor = "#dadce0";
  });

  input.addEventListener("keydown", (e) => {
    e.stopPropagation(); // Prevent editor from capturing keystrokes
    input.style.outlineColor = "#dadce0";
  });

  // Handle form submission
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const url = input.value;

    if (!url) {
      input.style.outlineColor = "red";
      return;
    }

    const sanitizeURL = find(url)
      .filter((link) => link.isLink)
      .filter((link) => {
        if (options.validate) {
          return options.validate(link.value);
        }
        return true;
      })
      .at(0);

    if (!sanitizeURL?.href) {
      input.style.outlineColor = "red";
      return;
    }

    tooltip?.hide();

    return options.editor
      .chain()
      .setMark(options.extentionName, { href: sanitizeURL.href })
      .setMeta("preventautohyperlink", true)
      .run();
  });

  // Add click outside handler
  const handleClickOutside = (e: MouseEvent) => {
    if (!tippyModal.contains(e.target as Node)) {
      tooltip?.hide();
      document.removeEventListener('mousedown', handleClickOutside);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
}