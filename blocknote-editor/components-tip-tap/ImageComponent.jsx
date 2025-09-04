import React, { useRef, useState, useEffect } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import { Resizable } from 're-resizable'
import styled from 'styled-components'
import { Image as ImageIcon, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { getAssetPrefixUrl } from 'src/utils/HRXUtils';

const ImageContainer = styled.div`
  width: 100%;
  position: relative;
  margin: 1em 0;
  display: flex;
  justify-content: ${({ alignment }) => {
    if (alignment === 'center') return 'center';
    if (alignment === 'right') return 'flex-end';
    return 'flex-start';
  }};
`

const ImageWrapper = styled.div`
  width: ${({ widthPercentage }) => widthPercentage}%;
  img {
    width: 100%;
    height: auto;
    object-fit: contain;
    display: block;
  }
`

const AlignmentControls = styled.div`
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  padding: 4px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;

  ${ImageContainer}:hover & {
    opacity: 1;
  }
`

const AlignmentButton = styled.button`
  padding: 6px;
  background: ${({ active }) => (active ? '#e2e8f0' : 'transparent')};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f1f5f9;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`

const AddImageContainer = styled.div`
  width: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`

const AddImageInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid transparent;
  outline: none;
  font-size: 14px;
  transition: all 0.2s;
  &:focus {
    border-color: #2563eb;
  }
  &::placeholder {
    color: #94a3b8;
  }
`

const AddImageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  svg {
    width: 24px;
    height: 24px;
    color: #64748b;
  }
  span {
    font-size: 16px;
    color: #64748b;
  }
`

const ImageComponent = ({ node, updateAttributes, editor }) => {
  const containerRef = useRef(null)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const isEditable = editor?.isEditable ?? false;
  const [computedWidth, setComputedWidth] = useState(0);

  const { src, alignment = 'left', widthPercentage = 100, aspectRatio = 1.5, hideButtons = false, id } = node.attrs

  const handleResize = (_, __, ref) => {
    const containerWidth = ref.parentElement?.offsetWidth || 1
    const newWidth = ref.offsetWidth
    const percentage = (newWidth / containerWidth) * 100

    const img = ref.querySelector('img')
    const ratio = img?.naturalWidth / img?.naturalHeight || aspectRatio

    updateAttributes({
      widthPercentage: Math.min(Math.max(Math.round(percentage), 5), 100),
      aspectRatio: ratio,
    })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!url) return

    try {
      const img = new Image()
      img.src = url
      await img.decode()
      const ratio = img.width / img.height

      updateAttributes({
        src: url,
        widthPercentage: 100,
        aspectRatio: ratio,
        alignment: 'left',
      })
      setUrl('')
      setError('')
    } catch {
      setError('Invalid image URL')
    }
  }

  useEffect(() => {
    const parent = containerRef.current?.parentElement
    if (parent) {
      const resizeObserver = new ResizeObserver(() => {
        const width = parent.offsetWidth
        setComputedWidth(width)
      })
      resizeObserver.observe(parent)
      setComputedWidth(parent.offsetWidth)
  
      return () => resizeObserver.disconnect()
    }
  }, [])
  

  return (
    <NodeViewWrapper>
      <ImageContainer ref={containerRef} alignment={alignment} data-id={id}>
        {src ? (
          <>
            {isEditable && !hideButtons && (
              <AlignmentControls>
                <AlignmentButton
                  onClick={() => updateAttributes({ alignment: 'left' })}
                  active={alignment === 'left'}
                >
                  <AlignLeft />
                </AlignmentButton>
                <AlignmentButton
                  onClick={() => updateAttributes({ alignment: 'center' })}
                  active={alignment === 'center'}
                >
                  <AlignCenter />
                </AlignmentButton>
                <AlignmentButton
                  onClick={() => updateAttributes({ alignment: 'right' })}
                  active={alignment === 'right'}
                >
                  <AlignRight />
                </AlignmentButton>
              </AlignmentControls>
            )}

            {isEditable ? (
              <Resizable
                onResizeStop={handleResize}
                lockAspectRatio
                size={{ width: `${(computedWidth * widthPercentage) / 100}px` }}
                defaultSize={{ width: `${(computedWidth * widthPercentage) / 100}px` }}
                minConstraints={[50, 30]}
                maxConstraints={[computedWidth, Infinity]}
                enable={{ right: true, bottomRight: true }}
              >
                <ImageWrapper widthPercentage={100}>
                  <img src={src} alt="" />
                </ImageWrapper>
              </Resizable>
            ) : (
              <ImageWrapper widthPercentage={widthPercentage}>
                  <img src={src} alt=""  />
              </ImageWrapper>
            )}
          </>
        ) : (
          <AddImageContainer>
            <AddImageHeader>
              <ImageIcon size={24} />
              <span>Add Image</span>
            </AddImageHeader>
            <form onSubmit={handleSubmit}>
              <AddImageInput
                type="url"
                placeholder="Paste image URL"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
              {error && (
                <div style={{ color: '#ef4444', fontSize: '12px', padding: '4px 16px' }}>
                  {error}
                </div>
              )}
            </form>
          </AddImageContainer>
        )}
      </ImageContainer>
    </NodeViewWrapper>
  )
}

export default ImageComponent
