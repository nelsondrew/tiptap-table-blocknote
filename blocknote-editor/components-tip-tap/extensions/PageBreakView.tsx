import React, { useState, useEffect, useRef } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { useDispatch, useSelector } from 'react-redux'
import { dashboardHeaderChanged, dashboardFooterChanged, dashboardPageNumberChanged } from 'src/dashboard/actions/dashboardLayout'
import { setUnsavedChanges } from 'src/dashboard/actions/dashboardState'
import { styled } from '@superset-ui/core'
import Plus from 'src/assets/images/icons/add-page-plus.svg'

const HeaderPageBreakViewContainer = styled.div<{ $isPageNumEnabled: boolean }>`
  flex: 1;
  position: relative;
  text-align: left;
 max-width: ${({ $isPageNumEnabled }) => $isPageNumEnabled ? 'calc(100% - 40px)' : 'calc(100% - 1px)'};
 `

const PageBreakView: React.FC<NodeViewProps> = ({ node, editor, getPos }) => {
  const { marginTop, editMode = false } = node.attrs
  const [isHovered, setIsHovered] = useState(false)
  const [pageNumber, setPageNumber] = useState(1)
  const [isHeaderEditing, setIsHeaderEditing] = useState(false)
  const [isFooterEditing, setIsFooterEditing] = useState(false)
  const [isHeaderFocused, setIsHeaderFocused] = useState(false)
  const [isFooterFocused, setIsFooterFocused] = useState(false)
  const [isPageNumberHovered, setIsPageNumberHovered] = useState(false)
  const pageNumberTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const headerInputRef = useRef<HTMLInputElement>(null)
  const footerInputRef = useRef<HTMLInputElement>(null)
  const dispatch = useDispatch()

  // Get header, footer, and page number state from Redux
  const headerTextFromRedux = useSelector((state: any) => {
    return state?.dashboardLayout?.present?.["HEADER_ID"]?.meta?.headerText || '';
  })

  const footerTextFromRedux = useSelector((state: any) => {
    return state?.dashboardLayout?.present?.["HEADER_ID"]?.meta?.footerText || '';
  })

  const showPageNumberFromRedux = useSelector((state: any) => {
    return state?.dashboardLayout?.present?.["HEADER_ID"]?.meta?.page_number || 0;
  })

  // State to track total pages and force re-render

  const [localHeaderValue, setLocalHeaderValue] = useState(headerTextFromRedux);

  useEffect(() => {
    setLocalHeaderValue(headerTextFromRedux);
  }, [headerTextFromRedux]);

  const [totalPages, setTotalPages] = useState(1);

  // Function to count total pages
  const getTotalPages = () => {
    if (!editor?.state?.doc) return 1;

    let pageCount = 1; // Start with 1 for the first page

    // Count all page breaks in the document
    editor.state.doc.descendants((node: any) => {
      if (node.type.name === 'pageBreak') {
        pageCount++;
      }
    });

    return pageCount;
  };

  // Update total pages when editor content changes
  useEffect(() => {
    if (editor) {
      const updateTotalPages = () => {
        const newTotal = getTotalPages();
        setTotalPages(newTotal);
      };

      // Update immediately
      updateTotalPages();

      // Listen for document changes
      const handleUpdate = () => {
        updateTotalPages();
      };

      editor.on('update', handleUpdate);

      return () => {
        editor.off('update', handleUpdate);
      };
    }
  }, [editor]);

  // Reset focus when hover ends
  useEffect(() => {
    if (!isHovered) {
      if (isHeaderFocused && headerInputRef.current) {
        headerInputRef.current.blur();
      }
      if (isFooterFocused && footerInputRef.current) {
        footerInputRef.current.blur();
      }
    }
  }, [isHovered, isHeaderFocused, isFooterFocused]);

  // Calculate page number based on position
  useEffect(() => {
    if (getPos && editor) {
      const pos = getPos()
      let pageCount = 2
      editor.state.doc.descendants((node: any, nodePos: number) => {
        if (node.type.name === 'pageBreak' && nodePos < pos) {
          pageCount++
        }
      })
      setPageNumber(pageCount)
    }
  }, [getPos, editor])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pageNumberTimeoutRef.current) {
        clearTimeout(pageNumberTimeoutRef.current)
      }
    }
  }, [])


  const handleHeaderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalHeaderValue(newValue);
    dispatch(dashboardHeaderChanged(newValue))
    // @ts-ignore - Custom command defined in PageBreak extension
    editor?.commands.updateAllHeaderFooterTexts(footerTextFromRedux, newValue)
    dispatch(setUnsavedChanges(true))
  };

  const handleFooterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFooterValue = e.target.value
    dispatch(dashboardFooterChanged(newFooterValue))
    // @ts-ignore - Custom command defined in PageBreak extension
    editor?.commands.updateAllHeaderFooterTexts(newFooterValue, headerTextFromRedux)
  }

  // Page number handlers
  const handlePageNumberToggle = () => {
    const newValue = !showPageNumberFromRedux ? 1 : 0
    dispatch(dashboardPageNumberChanged(newValue))
    dispatch(setUnsavedChanges(true))
  }

  const handlePageNumberClear = () => {
    dispatch(dashboardPageNumberChanged(0))
    dispatch(setUnsavedChanges(true))
  }

  const handlePageNumberMouseEnter = () => {
    if (pageNumberTimeoutRef.current) {
      clearTimeout(pageNumberTimeoutRef.current)
      pageNumberTimeoutRef.current = null
    }
    setIsPageNumberHovered(true)
  }

  const handlePageNumberMouseLeave = () => {
    pageNumberTimeoutRef.current = setTimeout(() => {
      setIsPageNumberHovered(false)
    }, 100) // 100ms delay
  }

  const footerStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '1px 56px 19px 56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: '38px',
    position: 'relative',
    boxSizing: 'border-box',
  }

  const headerStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '19px 56px 1px 56px',
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
  };


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
  });

  const PageNumberButton = styled.button`
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

    gap: 4px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #FBFBFB;
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
  const AddHeaderButton = styled.button`
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
  
    svg,
    svg * {
      transition: all 0.2s;
      fill: #9c9c9c !important;
    }

    &:hover svg, 
    &:hover svg * {
      fill: #666666 !important;
    }

    &:hover {
      background: #FBFBFB;
      color: #666666;
    }
  `;

  const PageNumberContainer = styled.div`
    position: relative;
    display: inline-block;
  `;

  const PageNumberDisplay = styled.div`
    color: #666;
    font-size: 11px;
    white-space: nowrap;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s;

    // &:hover {
    //   background-color: #f5f5f5;
    // }
  `;

  const Popover = styled.div<{ $show: boolean }>`
    position: absolute;
    bottom: 100%;
    transform: translateX(-50%);
    background: white;
    border: 1px solid #F2F2F2;
    border-radius: 4px;
    box-shadow: 0px 0px 60px 0px #00000014;
    padding: 9px;
    z-index: 1000;
    opacity: ${({ $show }) => $show ? 1 : 0};
    visibility: ${({ $show }) => $show ? 'visible' : 'hidden'};
    transition: opacity 0.2s, visibility 0.2s;
    margin-bottom: 4px;
  `;

  const PopoverButton = styled.button`
    background: white;
    color: #000000;
    border: none;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    line-height: 20px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;

    // &:hover {
    //   background: #f5f5f5;
    // }
  `;

  const hasHeaderText = typeof localHeaderValue === 'string' && !!localHeaderValue.trim();
  const isPageNumberShown = !!showPageNumberFromRedux;
  const showHeaderSeparator = hasHeaderText || isPageNumberShown || isHeaderFocused;
  
  
  return (
    <NodeViewWrapper
      className="page-break-container"
      data-page-break="true"
      style={{
        marginTop: `${marginTop}`,
        position: 'relative',
        minHeight: editMode ? '60px' : 'auto',
        fontFamily: '"Roboto Flex", Aptos, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        pointerEvents: editMode ? 'auto' : 'none',
        userSelect: editMode ? 'auto' : 'none',
      }}
      onMouseEnter={editMode ? () => setIsHovered(true) : undefined}
      onMouseLeave={editMode ? () => {
        setIsHovered(false);
        if (!footerTextFromRedux) {
          setIsFooterEditing(false);
        }
      } : undefined}
    >
      {/* Footer Separator */}
 <div style={{ ...separatorStyle, opacity: footerTextFromRedux || isFooterFocused ? 1 : 0, margin: '11px 56px 0px 56px' }} />

      {/* Footer Section */}
      <div className="footer" style={footerStyle}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', maxWidth: 'calc(100% - 1px)' }}>
          {editMode ? (
            <>
              {!footerTextFromRedux && isHovered && !isFooterEditing ? (
                <AddFooterButton
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    setIsFooterEditing(true);
                    setTimeout(() => {
                      footerInputRef.current?.focus();
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
                  fontSize: '12px',
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

      <div
        className="custom-page-break-style"
        style={{ height: '2px', padding: '10px 0', background: '#ECECEC' }}
      />

      {/* Header Section */}
      <div className="header" style={headerStyle}>
        <HeaderPageBreakViewContainer $isPageNumEnabled={!!showPageNumberFromRedux}>
           {editMode ? (
            (!isHeaderEditing && !localHeaderValue && !isHeaderFocused && isHovered) 
            ? (
              <AddHeaderButton onClick={() => {
                  setIsHeaderEditing(true);
                  setTimeout(() => {
                    headerInputRef.current?.focus();
                  }, 0);
                }}>
                <Plus />Add Header
              </AddHeaderButton>
            ) 
            : (
              <input
                ref={headerInputRef}
                value={localHeaderValue}
                onChange={handleHeaderInputChange}
                onFocus={() => setIsHeaderFocused(true)}
                onBlur={() => {
                  setIsHeaderFocused(false);
                  if (!localHeaderValue) setIsHeaderEditing(false);
                }}
                placeholder={isHovered || isHeaderEditing || isHeaderFocused ? "Header" : ""}
                style={{
                  ...inputStyle(localHeaderValue || isHeaderEditing || isHeaderFocused),
                  width: '100%',
                }}
                readOnly={false}
                maxLength={128}
                title={localHeaderValue}
              />
            )
          ) : (
            localHeaderValue && (
              <div
                style={{
                  color: '#666666',
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
                title={localHeaderValue}
              >
                {localHeaderValue}
              </div>
            )
          )}
        </HeaderPageBreakViewContainer>

        {/* Page Number Controls */}
        {editMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!showPageNumberFromRedux ? (
              isHovered && (
                <PageNumberButton
                  onClick={handlePageNumberToggle}
                >
                  <Plus />Add Page Numbers
                </PageNumberButton>
              )
            ) : (
              <PageNumberContainer
                onMouseEnter={handlePageNumberMouseEnter}
                onMouseLeave={handlePageNumberMouseLeave}
              >
                <Popover
                  $show={isPageNumberHovered}
                  onMouseEnter={handlePageNumberMouseEnter}
                  onMouseLeave={handlePageNumberMouseLeave}
                >
                  <PopoverButton onClick={handlePageNumberClear}>
                    Remove
                  </PopoverButton>
                </Popover>
                <PageNumberDisplay>
                  {pageNumber} / {totalPages}
                </PageNumberDisplay>
              </PageNumberContainer>
            )}
          </div>
        )}

        {/* Page Number Display in View Mode */}
        {!editMode && !!showPageNumberFromRedux && (
          <div
            style={{
              color: '#666666',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              lineHeight: '14px',
              padding: '5px 0px',
              fontWeight: 400,
              pointerEvents: 'none',
              userSelect: 'none',
              cursor: 'default',
            }}
          >
            {pageNumber} / {totalPages}
          </div>
        )}
      </div>
      {/* HEADER SEPARATOR */}
      {showHeaderSeparator && (
        <div
          style={{
            ...separatorStyle,
            margin: '0px 56px 11px 56px'
          }}
        />
      )}
    </NodeViewWrapper>
  )
}

export default PageBreakView;