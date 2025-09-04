import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import styled from 'styled-components';
import { ImageOff } from 'lucide-react';

interface EditorImageProps {
  node: {
    attrs: {
      src: string | null;
      editorId: string;
    };
  };
}

const ImageContainer = styled.div`
  width: 100%;
  margin: 1em 0;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ImageWrapper = styled.div`
  width: 100%;
  background: #f8fafc;
  
  img {
    width: 100%;
    height: auto;
    object-fit: contain;
    display: block;
  }
`;

const NoImageContainer = styled.div`
  width: 100%;
  height: 200px;
  background: #f1f5f9;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #64748b;

  svg {
    width: 32px;
    height: 32px;
    opacity: 0.7;
  }

  span {
    font-size: 14px;
  }
`;

const EditorImageComponent: React.FC<EditorImageProps> = ({ node }) => {
  const [imageError, setImageError] = React.useState(false);
  const imageId = `image-${node.attrs.editorId}`;

  if (!node.attrs.src || imageError) {
    return (
      <NodeViewWrapper>
        <ImageContainer>
          <NoImageContainer>
            <ImageOff />
            <span>No image available</span>
          </NoImageContainer>
        </ImageContainer>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      <ImageContainer>
        <ImageWrapper>
          <img 
            id={imageId}
            src={node.attrs.src} 
            alt="" 
            loading="lazy"
            onError={() => setImageError(true)}
          />
        </ImageWrapper>
      </ImageContainer>
    </NodeViewWrapper>
  );
};

export const EditorImageExtension = Node.create({
  name: 'editorImage',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      editorId: {
        default: null
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="editor-image"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'editor-image', ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EditorImageComponent);
  },

  addCommands() {
    return {
      setEditorImage: (attributes: { src: string }) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        });
      },
    };
  },
}); 