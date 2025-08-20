'use client'

import Image from "next/image";
import styles from "./page.module.css";
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle }  from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useCallback, useState, useEffect } from 'react'
import BlockNoteTableExtensions from '../extensions/BlockNoteTable'
import TableHandlesExtension from "../app/extensions/TableHandlesPlugin"
import styled from '@emotion/styled'
import { css, Global } from '@emotion/react'
import GlobalStyles from "./GlobalStyles";
import TableTrackerExtension from "./extensions/tableTrackerExtension";
import TableHandlesController from "./components/TableHandlesController";

// Styled components
const EditorContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`

const EditorTitle = styled.h1`
  color: #333;
  font-family: system-ui, -apple-system, sans-serif;
  margin-bottom: 20px;
`

const EditorWrapper = styled.div`
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
`

const MenuBarContainer = styled.div`
  border: 1px solid #ccc;
  border-bottom: none;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  background-color: #f5f5f5;
`

const MenuButton = styled.button<{ isActive?: boolean; isDisabled?: boolean; isDanger?: boolean }>`
  background-color: ${props => 
    props.isDanger && props.isActive ? '#ff4444' : 
    props.isActive ? '#007acc' : 'white'
  };
  color: ${props => 
    props.isDanger && props.isActive ? 'white' :
    props.isActive ? 'white' : 
    props.isDisabled ? '#666666' : 'black'
  };
  border: 1px solid #ccc;
  padding: 5px 10px;
  cursor: ${props => props.isDisabled ? 'not-allowed' : 'pointer'};
  border-radius: 3px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: ${props => 
      props.isDanger && props.isActive ? '#dd3333' :
      props.isActive ? '#0066aa' : '#f0f0f0'
    };
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const EditorContentWrapper = styled.div`
  min-height: 400px;
  padding: 15px;
  outline: none;
  
  .ProseMirror {
    outline: none;
    min-height: 400px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.6;
    color: #333;
    
    p {
      margin: 0.75em 0;
    }
    
    h1, h2, h3, h4, h5, h6 {
      margin: 1.5em 0 0.5em 0;
      font-weight: 600;
      line-height: 1.3;
    }
    
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    
    ul, ol {
      margin: 0.75em 0;
      padding-left: 1.5em;
    }
    
    li {
      margin: 0.25em 0;
    }
    
    blockquote {
      border-left: 4px solid #e5e7eb;
      margin: 1.5em 0;
      padding-left: 1em;
      color: #6b7280;
      font-style: italic;
    }
    
    code {
      background-color: #f3f4f6;
      padding: 0.25em 0.5em;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.9em;
    }
    
    hr {
      border: none;
      border-top: 2px solid #e5e7eb;
      margin: 2em 0;
    }
    
    /* Task List Styles */
    ul[data-type="taskList"] {
      list-style: none;
      padding: 0;
      margin: 0.75em 0;
      
      p {
        margin: 0;
      }
      
      li {
        display: flex;
        align-items: flex-start;
        margin: 0.5em 0;
        
        > label {
          flex: 0 0 auto;
          margin-right: 0.5rem;
          user-select: none;
          margin-top: 2px;
          
          input[type="checkbox"] {
            margin: 0;
            cursor: pointer;
          }
        }
        
        > div {
          flex: 1 1 auto;
        }
        
        &[data-checked="true"] > div {
          text-decoration: line-through;
          color: #9ca3af;
        }
      }
    }
    
    /* Link Styles */
    a {
      color: #3b82f6;
      text-decoration: underline;
      cursor: pointer;
      
      &:hover {
        color: #1d4ed8;
      }
    }
    
    /* Selection Styles */
    ::selection {
      background-color: rgba(59, 130, 246, 0.2);
    }
  }
`

const LoadingContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`

const LoadingWrapper = styled.div`
  border: 1px solid #ccc;
  border-radius: 4px;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
`

const LoadingContent = styled.div`
  text-align: center;
`

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007acc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const LoadingText = styled.p`
  color: #666;
  font-family: system-ui, -apple-system, sans-serif;
`

// Global styles for any remaining global needs
const globalStyles = css`
  * {
    box-sizing: border-box;
  }
  
  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
  }
  
  /* Ensure smooth scrolling */
  html {
    scroll-behavior: smooth;
  }
  
  /* Focus styles for accessibility */
  button:focus-visible,
  input:focus-visible,
  textarea:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
`

const MenuBar = ({ editor }: { editor: any }) => {
  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  const deleteTable = useCallback(() => {
    if (editor.isActive('table')) {
      editor.chain().focus().deleteTable().run()
    }
  }, [editor])

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <MenuBarContainer>
      {/* Text Formatting */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
      >
        Bold
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
      >
        Italic
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
      >
        Strike
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
      >
        Code
      </MenuButton>

      {/* Headings */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
      >
        H1
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
      >
        H2
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
      >
        H3
      </MenuButton>

      {/* Lists */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
      >
        Bullet List
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
      >
        Ordered List
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive('taskList')}
      >
        Task List
      </MenuButton>

      {/* Text Alignment */}
      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
      >
        Left
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
      >
        Center
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
      >
        Right
      </MenuButton>

      {/* Table Operations */}
      <MenuButton onClick={addTable}>
        Add BlockNote Table
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        disabled={!editor.can().addColumnBefore()}
        isDisabled={!editor.can().addColumnBefore()}
      >
        Add Column Before
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        disabled={!editor.can().addColumnAfter()}
        isDisabled={!editor.can().addColumnAfter()}
      >
        Add Column After
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().deleteColumn().run()}
        disabled={!editor.can().deleteColumn()}
        isDisabled={!editor.can().deleteColumn()}
      >
        Delete Column
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().addRowBefore().run()}
        disabled={!editor.can().addRowBefore()}
        isDisabled={!editor.can().addRowBefore()}
      >
        Add Row Before
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().addRowAfter().run()}
        disabled={!editor.can().addRowAfter()}
        isDisabled={!editor.can().addRowAfter()}
      >
        Add Row After
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().deleteRow().run()}
        disabled={!editor.can().deleteRow()}
        isDisabled={!editor.can().deleteRow()}
      >
        Delete Row
      </MenuButton>
      <MenuButton
        onClick={deleteTable}
        disabled={!editor.isActive('table')}
        isDisabled={!editor.isActive('table')}
        isActive={editor.isActive('table')}
        isDanger={true}
      >
        Delete Table
      </MenuButton>

      {/* Other Actions */}
      <MenuButton
        onClick={setLink}
        isActive={editor.isActive('link')}
      >
        Link
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
      >
        Quote
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        Horizontal Rule
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        isDisabled={!editor.can().chain().focus().undo().run()}
      >
        Undo
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        isDisabled={!editor.can().chain().focus().redo().run()}
      >
        Redo
      </MenuButton>
    </MenuBarContainer>
  )
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])



  const editor = useEditor({
    extensions: [
      StarterKit,
      ...BlockNoteTableExtensions,
      TableTrackerExtension,
      // TableHandlesExtension, // Add the table handles extension
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: `
      <h2>Welcome to BlockNote-inspired Tiptap Editor! 🎉</h2>
      <p>This editor now includes BlockNote's advanced table implementation with Table Handles support.</p>
      <h3>BlockNote Table Features:</h3>
      <ul>
        <li>Block-based table architecture</li>
        <li>Enhanced keyboard navigation (Tab/Shift-Tab)</li>
        <li>Column resizing capabilities</li>
        <li>Improved cell content handling</li>
        <li>Better DOM structure for styling</li>
        <li>Minimum table width of 360px like BlockNote</li>
        <li>Table handles for drag and drop</li>
        <li>Context menus for table operations</li>
      </ul>
      <h3>Try the task list:</h3>
      <ul data-type="taskList">
        <li data-type="taskItem" data-checked="false">Create a table</li>
        <li data-type="taskItem" data-checked="false">Test table handles</li>
        <li data-type="taskItem" data-checked="false">Test drag and drop</li>
        <li data-type="taskItem" data-checked="false">Implement table handles extension</li>
      </ul>
      <blockquote>
        <p>"The best way to get started is to quit talking and begin doing." - Walt Disney</p>
      </blockquote>
    `,
    onUpdate: ({ editor }) => {
      // Log the editor instance itself
      const extensionStorage = editor?.extensionStorage?.tableTracker?.view?.state;
      console.log(extensionStorage, "table state")
    },
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
  }, [isMounted])



  useEffect(() => {
    console.log("current editor" , editor)
  },[editor])

  if (!isMounted) {
    return (
      <>
        <Global styles={globalStyles} />
        <LoadingContainer>
          <EditorTitle>BlockNote-Inspired Tiptap Editor</EditorTitle>
          <LoadingWrapper>
            <LoadingContent>
              <Spinner />
              <LoadingText>Loading editor...</LoadingText>
            </LoadingContent>
          </LoadingWrapper>
        </LoadingContainer>
      </>
    )
  }


  return (
    <>
      <Global styles={globalStyles} />
      <GlobalStyles/>
      <TableHandlesController editor={editor}/>
      <EditorContainer>
        <EditorTitle>BlockNote-Inspired Tiptap Editor</EditorTitle>
        <EditorWrapper>
          <MenuBar editor={editor} />
          <EditorContentWrapper>
            <EditorContent editor={editor} />
          </EditorContentWrapper>
        </EditorWrapper>
      </EditorContainer>
    </>
  );
}
