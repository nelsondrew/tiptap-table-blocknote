import React, { useState, useRef } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { useDispatch, useSelector } from 'react-redux'
import { dashboardFooterChanged } from 'src/dashboard/actions/dashboardLayout'
import { setUnsavedChanges } from 'src/dashboard/actions/dashboardState'
import { styled } from '@superset-ui/core'
import { useEffect } from 'react'
import Plus from 'src/assets/images/icons/add-page-plus.svg'


const FooterOnlyView: React.FC<NodeViewProps> = ({ node, editor }) => {
  const { marginTop, editMode = false } = node.attrs
  const [isFooterHovered, setIsFooterHovered] = useState(false)
  const [isFooterEditing, setIsFooterEditing] = useState(false)
  const footerInputRef = useRef<HTMLInputElement>(null)
  const dispatch = useDispatch()
  const [isFooterFocused, setIsFooterFocused] = useState(false)

  // Get footer text from Redux
  const footerTextFromRedux = useSelector((state: any) => {
    return state?.dashboardLayout?.present?.["HEADER_ID"]?.meta?.footerText || '';
  })
  // const [localFooterValue, setLocalFooterValue] = useState(footerTextFromRedux);

  // useEffect(() => {
  //     setLocalFooterValue(footerTextFromRedux);
  // }, [footerTextFromRedux]);

    useEffect(() => {
      if (!isFooterHovered && isFooterFocused && footerInputRef.current) {
        footerInputRef.current.blur();
      }
    }, [isFooterHovered, isFooterFocused]);
    
  // Get header text from Redux (needed for the update command)
  const headerTextFromRedux = useSelector((state: any) => {
    return state?.dashboardLayout?.present?.["HEADER_ID"]?.meta?.headerText || '';
  })

  const handleFooterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFooterValue = e.target.value
    // setLocalFooterValue(newFooterValue);
    dispatch(dashboardFooterChanged(newFooterValue))
    dispatch(setUnsavedChanges(true))
    // @ts-ignore - Custom command defined in PageBreak extension
    editor.commands.updateAllHeaderFooterTexts(newFooterValue, headerTextFromRedux)
  }

  const footerStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '1px 0px 19px 0px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: '38px',
    position: 'relative',
    boxSizing: 'border-box',
  }

  const separatorStyle: React.CSSProperties = {
    height: '1px',
    backgroundColor: '#9C9C9C',
    margin: '0 56px',
    width: '100%',
    position: 'relative',
    left: '-56px',
  }

  const inputStyle = (show: boolean): React.CSSProperties => ({
    border: 'none',
    padding: '0px 0px',
    borderRadius: '4px',
    height: '24px',
    width: '100%',
    marginBottom: '0',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '11px',
    color: '#666',
    opacity: show ? 1 : 0,
    pointerEvents: show ? 'auto' : 'none',
    transition: 'opacity 0.2s ease',
  })

  const AddFooterButton = styled.button`
    color: #9C9C9C;
    border: none;
    background: #FFFFFF;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    line-height: 20px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
    text-align: left;
    gap: 4px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #fbfbfb;
      color: #666666;
    }

    svg,
    svg * {
      transition: all 0.2s;
      fill: #9c9c9c !important;
    }

    &:hover svg, 
    &:hover svg * {
      fill: #666666 !important;
    }

  `;

  return (
    <NodeViewWrapper
      className="footer-only-container"
      data-footer-only="true"
      style={{
        marginTop: `${marginTop}`,
        position: 'relative',
        minHeight: editMode ? '56px' : 'auto',
        fontFamily: '"Roboto Flex", Aptos, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        pointerEvents: editMode ? 'auto' : 'none',
        userSelect: editMode ? 'auto' : 'none',
      }}
      onMouseEnter={editMode ? () => setIsFooterHovered(true) : undefined}
      onMouseLeave={editMode ? () => {
        setIsFooterHovered(false);
        // Reset editing state if there's no content
        if (!footerTextFromRedux) {
          setIsFooterEditing(false);
        }
      }: undefined}
    >
      {/* Top Separator */}
      <div style={{...separatorStyle, opacity: footerTextFromRedux || isFooterFocused ? 1 : 0, margin: '11px 56px 0px 56px'}} />

      {/* Footer Section */}
      <div className="footer" style={footerStyle}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', maxWidth: 'calc(100% - 1px)' }}>
          {editMode ? (
            <>
              {!footerTextFromRedux  && isFooterHovered && !isFooterEditing ? (
                <AddFooterButton onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    setIsFooterEditing(true);
                    // Focus the input field after state update
                    setTimeout(() => {
                      if (footerInputRef.current) {
                        footerInputRef.current.focus();
                      }
                    }, 0);
                  }}
                >
                  <Plus />Add Footer
                </AddFooterButton>
              ) : (
                <input
                  ref={footerInputRef}
                  value={footerTextFromRedux}
                  onChange={handleFooterChange}
                  onFocus={() => setIsFooterFocused(true)}
                  onBlur={() => {
                    setIsFooterFocused(false);
                    if (!footerTextFromRedux) {
                      setIsFooterEditing(false);
                    }
                  }}
                  placeholder="Footer"
                  style={inputStyle(footerTextFromRedux || isFooterEditing)}
                  readOnly={false}
                  maxLength={128}
                />
              )}
            </>
          ) : (
            (footerTextFromRedux) && (
              <div
                style={{
                  color: '#666',
                  fontSize: '11px',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  lineHeight: '14px',
                  padding: '5px 0px',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  cursor: 'default',
                }}
                title={footerTextFromRedux}
              >
                {footerTextFromRedux}
              </div>
            )
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export default FooterOnlyView