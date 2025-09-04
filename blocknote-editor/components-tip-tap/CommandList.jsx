import React from 'react';
import { useState, useEffect, useCallback, forwardRef } from 'react';
import styled from 'styled-components';

import { getSVG } from '../utils/svgMapper';

const toPascalCase = (str) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const CommandListContainer = styled.div`
  background: #ffffff;
  border-radius: 8px;
  /* box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05); */
  box-shadow: 0px 0px 60px 0px #00000014;
  color: #ffffff; //#374151;
  overflow: hidden;
  padding-left: 16px;
  padding-right: 0px;
  width: 320px;
  max-height: 480px; //660px;
  display: flex;
  flex-direction: column;
  /* padding-bottom: 6rem; */
`;

const CommandListContent = styled.div`
  overflow-y: auto;
  flex: 1;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #e2e2e2;
    border-radius: 40px;

    &:hover {
      background-color: #9C9C9C;
    }
  }
`;

const Group = styled.div`
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const GroupTitle = styled.div`
  color: #666;
  font-weight: 500;
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 1%;
  vertical-align: middle;
  padding: 16px;
`;

const Items = styled.div`
  display: flex;
  flex-direction: column;
`;

const Item = styled.button`
  align-items: center;
  background: ${props => (props.selected ? 'rgb(251, 251, 251)' : 'transparent')};
  border: none;
  border-radius: 4px;
  color: #111827;
  cursor: pointer;
  display: flex;
  font-size: 14px;
  gap: 4px;
  padding: 6px 12px;
  text-align: left;
  width: 100%;
  transition: all 0.15s ease;
  margin-left: 3px;

  &:hover {
    background: #fbfbfb;
  }

  .lucide {
    color: rgb(80, 78, 78);
  }
`;

const IconHolder = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  background: transparent; //${props => props.selected ? 'rgb(251, 251, 251)' : '#F9FAFB'};
  width: 24px;
  height: 24px;
  padding: 4px;

  svg {
    width: 16px;
    height: 16px;
    color: #374151;
    margin-top: -20px;
  }
`;

const ItemContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  .subtitle {
    color: #666666;
    font-weight: 400;
    font-size: 12px;
    line-height: 20px;
    letter-spacing: 1%;
  }
`;

const ItemTitle = styled.div`
  font-weight: 400;
  font-size: 14px;
  line-height: 24px;
  letter-spacing: 1%;
  color: #000;
`;

const ItemSubtitle = styled.div`
  color: #6B7280;
  font-size: 12px;
  line-height: 1.4;
`;

const Shortcut = styled.div`
  color: #6B7280;
  font-size: 12px;
  font-weight: 500;
  padding-left: 8px;
`;

export default forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const flatItems = props.items.reduce(
    (acc, group) => [...acc, ...group.children],
    [],
  );

  const selectItem = useCallback(
    index => {
      const item = flatItems[index];
      if (item) {
        props.command(item);
      }
    },
    [flatItems, props],
  );

  const upHandler = useCallback(() => {
    setSelectedIndex(prevIndex => {
      const newIndex = prevIndex - 1;
      const updatedIdx = newIndex < 0 ? flatItems.length - 1 : newIndex;

      const items = document.querySelectorAll('.slash-menu-items');
      const activeItem = items[updatedIdx];
      activeItem.scrollIntoView({ block: 'nearest' });

      return updatedIdx;
    });
  }, [flatItems.length]);

  const downHandler = useCallback(() => {
    setSelectedIndex(prevIndex => {
      const newIndex = prevIndex + 1;
      const updatedIdx = newIndex >= flatItems.length ? 0 : newIndex;

      const items = document.querySelectorAll('.slash-menu-items');
      const activeItem = items[updatedIdx];
      activeItem.scrollIntoView({ block: 'nearest' });

      return updatedIdx;
    });
  }, [flatItems.length]);

  const enterHandler = useCallback(() => {
    selectItem(selectedIndex);
  }, [selectItem, selectedIndex]);

  const onKeyDown = useCallback(
    event => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        enterHandler();
        return true;
      }

      return false;
    },
    [upHandler, downHandler, enterHandler],
  );

  // Expose methods to parent through props callback
  useEffect(() => {
    if (props.onRef) {
      props.onRef({
        onKeyDown,
      });
    }
  }, [props.onRef, onKeyDown]);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  return (
    <CommandListContainer>
      <CommandListContent>
        {props.items.map((group, groupIndex) => (
          <Group key={groupIndex}>
            {console.log(group.title)}
            {group.title && <GroupTitle>{toPascalCase(group.title)}</GroupTitle>}
            <Items>
              {group.children.map((item, childIndex) => {
                const index =
                  props.items
                    .slice(0, groupIndex)
                    .reduce((acc, g) => acc + g.children.length, 0) +
                  childIndex;

                const isSelected = index === selectedIndex;

                return (
                  <Item
                    key={index}
                    selected={isSelected}
                    onClick={() => {
                      setSelectedIndex(index);
                      selectItem(index);
                    }}
                    className="slash-menu-items"
                  >
                    <IconHolder className="feat-icon">
                      {/* <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heading-1"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/></svg> */}
                      {getSVG[item.title]}
                    </IconHolder>

                    <ItemContent>
                      <ItemTitle>{item.title}</ItemTitle>
                      {item.subtitle && (
                        <ItemSubtitle className="subtitle">
                          {item.subtitle}
                        </ItemSubtitle>
                      )}
                    </ItemContent>
                    {item.shortcut && <Shortcut>{item.shortcut}</Shortcut>}
                  </Item>
                );
              })}
            </Items>
          </Group>
        ))}
      </CommandListContent>
    </CommandListContainer>
  );
});
