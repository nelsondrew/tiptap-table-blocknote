import React, { useEffect, useRef, useState } from 'react';
import { createPopper, Instance } from '@popperjs/core';
import { Editor, isNodeSelection, posToDOMRect } from '@tiptap/core';
import styled from 'styled-components';
import { createPortal } from 'react-dom';

// Create a portal container for bubble menus
const BubbleMenuPortal = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 0;
  pointer-events: none;
  z-index: 99999;
`;

const MenuContainer = styled.div<{ isPositioned: boolean }>`
  display: flex;
  padding: 0.5rem;
  border-radius: 0.5rem;
  gap: 0.5rem;
  align-items: center;
  position: absolute;
  z-index: 999999;
  pointer-events: auto;
  transform: translateZ(0);
  will-change: transform;
  opacity: ${props => props.isPositioned ? 1 : 0};
  transition: opacity 0.15s ease-in-out;
`;

interface BubbleMenuProps {
  editor: Editor;
  open: boolean;
  children: React.ReactNode;
}

export const CustomBubbleMenu: React.FC<BubbleMenuProps> = ({
  editor,
  open,
  children,
}) => {
  const popperRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const popperInstanceRef = useRef<Instance | null>(null);
  const [mounted, setMounted] = useState(false);
  // Add state to track if popper has been positioned
  const [isPositioned, setIsPositioned] = useState(false);

  // Create portal container
  useEffect(() => {
    const portal = document.createElement('div');
    portal.setAttribute('data-bubble-menu-portal', '');
    document.body.appendChild(portal);
    portalRef.current = portal;

    return () => {
      portal.remove();
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted || !open || !editor || !popperRef.current) return;

    const updatePopper = () => {
      const { ranges } = editor.state.selection;
      const from = Math.min(...ranges.map((range) => range.$from.pos));
      const to = Math.max(...ranges.map((range) => range.$to.pos));

      const virtualElement = {
        getBoundingClientRect: () => {
          if (isNodeSelection(editor.state.selection)) {
            const node = editor.view.nodeDOM(from) as HTMLElement;
            if (node) {
              return node.getBoundingClientRect();
            }
          }
          return posToDOMRect(editor.view, from, to);
        },
      };

      if (!popperInstanceRef.current) {
        popperInstanceRef.current = createPopper(virtualElement, popperRef.current!, {
          placement: 'top',
          strategy: 'fixed',
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 8],
              },
            },
            {
              name: 'flip',
              options: {
                fallbackPlacements: ['bottom', 'top-start', 'bottom-start'],
                boundary: editor.options.element,
                padding: 8,
              },
            },
            {
              name: 'preventOverflow',
              options: {
                boundary: editor.options.element,
                padding: 8,
              },
            },
            // Add a modifier to handle positioning state
            {
              name: 'updatePosition',
              enabled: true,
              phase: 'afterWrite',
              fn: ({ state }) => {
                // Only set positioned to true after first successful positioning
                if (!isPositioned) {
                  setIsPositioned(true);
                }
              },
            },
          ],
        });
      } else {
        popperInstanceRef.current.update();
      }
    };

    updatePopper();
    
    window.addEventListener('scroll', updatePopper, true);
    window.addEventListener('resize', updatePopper);

    return () => {
      if (popperInstanceRef.current) {
        popperInstanceRef.current.destroy();
        popperInstanceRef.current = null;
      }
      window.removeEventListener('scroll', updatePopper, true);
      window.removeEventListener('resize', updatePopper);
      // Reset positioned state when cleaning up
      setIsPositioned(false);
    };
  }, [editor, open, mounted]);

  if (!mounted || !open || !portalRef.current) return null;

  return createPortal(
    <BubbleMenuPortal className='bubble-menu-portal'>
      <MenuContainer ref={popperRef} isPositioned={isPositioned}>
        {children}
      </MenuContainer>
    </BubbleMenuPortal>,
    portalRef.current
  );
}; 