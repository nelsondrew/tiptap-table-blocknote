import React, { forwardRef, useState, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { getSuggestionItems } from './extensions/SlashCommand'
import { getSVG } from '../utils/svgMapper'

const MenuContainer = styled.div`
  background: #fff; //#1a1a1a;
  border-radius: 12px;
  /* box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3); */
  box-shadow: 0px 0px 60px 0px #00000014;
  color: #fff;
  overflow: hidden;
  padding: 6px;
  width: 320px;
  max-height: 480px;
  display: flex;
  flex-direction: column;
`

const MenuContent = styled.div`
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
    background-color: #f4f4f4;
    border-radius: 4px;
    
    &:hover {
      background-color: #666;
    }
  }
`

const MenuItem = styled.button`
  align-items: center;
  background: ${props => props.selected ? '#fbfbfb' : 'transparent'}; // #2d2d2d
  border: none;
  border-radius: 6px;
  color:rgb(80, 78, 78); //${props => props.selected ? '#000' : '' }; // '#e1e1e1' #666
  cursor: pointer;
  display: flex;
  font-size: 0.875rem;
  gap: 4px;
  padding: 6px 12px;
  text-align: left;
  width: 100%;
  transition: all 0.15s ease;
  margin-left: 3px;

  .lucide {
    color: rgb(80, 78, 78); //#7c7c7c;
  }

  .subtitle {
    color: #666666;
    font-weight: 400;
    font-size: 12px;
    line-height: 20px;
    letter-spacing: 1%;
  }

  &:hover {
    background: #fbfbfb; // rgb(80, 78, 78); //#2d2d2d;
    /* color: #fff; */
    /* .lucide {
      color: #fff;
    } */
    .feat-icon {
      /* background: rgb(131, 128, 128); */
    }

    .subtitle {
      /* color: #fff; */
    }
  }
`

const Group = styled.div`
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }
`

const GroupTitle = styled.div`
  /* font-size: 0.875rem; //0.7rem;
  font-weight: 600;
  padding: 8px 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em; */

  color: #666;
  font-weight: 500;
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 1%;
  vertical-align: middle;
  padding: 16px;
`

const ItemContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0px;
`

const ItemTitle = styled.div`
  font-weight: 400;
  font-size: 14px;
  line-height: 24px;
  letter-spacing: 1%;
  color: #000;
`

const ItemSubtitle = styled.div`
  color: #666;
  font-size: 0.788rem; //0.688rem;
  line-height: 1.5; //1.2;
  /* &:hover {
    color: #fff;
  } */
`

const Shortcut = styled.div`
  color: #666;
  font-size: 0.75rem;
  font-weight: 500;
`

const IconHolder = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  background: transparent; //#f4f4f4;
  width: 30px;
  height: 30px;
  padding: 4px;
  svg {
    margin-top: -20px;
    margin-left: 2px;
  }
`;

export default forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  // Get all items from SlashCommand
  const items = getSuggestionItems({ query: ''  , editor : props?.editor, isOnEditModeCoverPage: props?.isOnEditModeCoverPage })
  const flatItems = items.reduce((acc, group) => [...acc, ...group.children], [])

  const selectItem = useCallback((index) => {
    const item = flatItems[index]
    if (item) {
      // Execute command
      item.command({ 
        editor: props.editor, 
        range: { 
          from: props.position,
          to: props.position 
        }
      })
      // Close popup after command execution
      props.onClose?.()
    }
  }, [props.editor, props.position, flatItems, props.onClose])

  const upHandler = () => {
    setSelectedIndex(i => (i - 1 + flatItems.length) % flatItems.length)
  }

  const downHandler = () => {
    setSelectedIndex(i => (i + 1) % flatItems.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  const onKeyDown = useCallback((event) => {
    if (event.key === 'ArrowUp') {
      upHandler()
      return true
    }
    if (event.key === 'ArrowDown') {
      downHandler()
      return true
    }
    if (event.key === 'Enter') {
      enterHandler()
      return true
    }
    return false
  }, [])

  useEffect(() => {
    if (props.onRef) {
      props.onRef({ onKeyDown })
    }
  }, [props.onRef, onKeyDown])

  return (
    <MenuContainer>
      <MenuContent>
        {items.map((group, groupIndex) => (
          <Group key={groupIndex}>
            {group.title && <GroupTitle>{group.title}</GroupTitle>}
            {group.children.map((item, childIndex) => {
              const index = items
                .slice(0, groupIndex)
                .reduce((acc, g) => acc + g.children.length, 0) + childIndex
              
              const isSelected = index === selectedIndex

              return (
                <MenuItem
                  key={index}
                  selected={isSelected}
                  onClick={() => {
                    setSelectedIndex(index)
                    selectItem(index)
                  }}
                >
                  <IconHolder className="feat-icon">
                    {getSVG[item.title]}
                  </IconHolder>
                  <ItemContent>
                    <ItemTitle>{item.title}</ItemTitle>
                    {item.subtitle && (
                      <ItemSubtitle className="subtitle">{item.subtitle}</ItemSubtitle>
                    )}
                  </ItemContent>
                </MenuItem>
              )
            })}
          </Group>
        ))}
      </MenuContent>
    </MenuContainer>
  )
}) 