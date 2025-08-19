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
    <div style={{ 
      border: '1px solid #ccc', 
      borderBottom: 'none', 
      padding: '10px', 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '5px',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Text Formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        style={{ 
          backgroundColor: editor.isActive('bold') ? '#007acc' : 'white',
          color: editor.isActive('bold') ? 'white' : 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        style={{ 
          backgroundColor: editor.isActive('italic') ? '#007acc' : 'white',
          color: editor.isActive('italic') ? 'white' : 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Italic
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        style={{ 
          backgroundColor: editor.isActive('strike') ? '#007acc' : 'white',
          color: editor.isActive('strike') ? 'white' : 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Strike
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        style={{ 
          backgroundColor: editor.isActive('code') ? '#007acc' : 'white',
          color: editor.isActive('code') ? 'white' : 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Code
      </button>

      {/* Headings */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        style={{ 
          backgroundColor: editor.isActive('heading', { level: 1 }) ? '#007acc' : 'white',
          color: editor.isActive('heading', { level: 1 }) ? 'white' : 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        style={{ 
          backgroundColor: editor.isActive('heading', { level: 2 }) ? '#007acc' : 'white',
          color: editor.isActive('heading', { level: 2 }) ? 'white' : 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        style={{ 
          backgroundColor: editor.isActive('heading', { level: 3 }) ? '#007acc' : 'white',
          color: editor.isActive('heading', { level: 3 }) ? 'white' : 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        H3
      </button>

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        style={{ 
          backgroundColor: editor.isActive('bulletList') ? '#007acc' : 'white',
          color: editor.isActive('bulletList') ? 'white' : 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Bullet List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        style={{ 
          backgroundColor: editor.isActive('orderedList') ? '#007acc' : 'white',
          color: editor.isActive('orderedList') ? 'white' : 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Ordered List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        style={{ 
          backgroundColor: editor.isActive('taskList') ? '#007acc' : 'white',
          color: editor.isActive('taskList') ? 'white' : 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Task List
      </button>

      {/* Text Alignment */}
      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        style={{ 
          backgroundColor: editor.isActive({ textAlign: 'left' }) ? '#007acc' : 'white',
          color: editor.isActive({ textAlign: 'left' }) ? 'white' : 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Left
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        style={{ 
          backgroundColor: editor.isActive({ textAlign: 'center' }) ? '#007acc' : 'white',
          color: editor.isActive({ textAlign: 'center' }) ? 'white' : 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Center
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        style={{ 
          backgroundColor: editor.isActive({ textAlign: 'right' }) ? '#007acc' : 'white',
          color: editor.isActive({ textAlign: 'right' }) ? 'white' : 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Right
      </button>

      {/* Table Operations */}
      <button
        onClick={addTable}
        style={{ 
          backgroundColor: 'white',
          color: 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Add BlockNote Table
      </button>
      <button
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        disabled={!editor.can().addColumnBefore()}
        style={{ 
          backgroundColor: 'white',
          color: 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Add Column Before
      </button>
      <button
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        disabled={!editor.can().addColumnAfter()}
        style={{ 
          backgroundColor: 'white',
          color: 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Add Column After
      </button>
      <button
        onClick={() => editor.chain().focus().deleteColumn().run()}
        disabled={!editor.can().deleteColumn()}
        style={{ 
          backgroundColor: 'white',
          color: 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Delete Column
      </button>
      <button
        onClick={() => editor.chain().focus().addRowBefore().run()}
        disabled={!editor.can().addRowBefore()}
        style={{ 
          backgroundColor: 'white',
          color: 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Add Row Before
      </button>
      <button
        onClick={() => editor.chain().focus().addRowAfter().run()}
        disabled={!editor.can().addRowAfter()}
        style={{ 
          backgroundColor: 'white',
          color: 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Add Row After
      </button>
      <button
        onClick={() => editor.chain().focus().deleteRow().run()}
        disabled={!editor.can().deleteRow()}
        style={{ 
          backgroundColor: 'white',
          color: 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Delete Row
      </button>
      <button
        onClick={deleteTable}
        disabled={!editor.isActive('table')}
        style={{ 
          backgroundColor: editor.isActive('table') ? '#ff4444' : '#cccccc',
          color: editor.isActive('table') ? 'white' : '#666666',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: editor.isActive('table') ? 'pointer' : 'not-allowed'
        }}
      >
        Delete Table
      </button>

      {/* Other Actions */}
      <button
        onClick={setLink}
        style={{ 
          backgroundColor: editor.isActive('link') ? '#007acc' : 'white',
          color: editor.isActive('link') ? 'white' : 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Link
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        style={{ 
          backgroundColor: editor.isActive('blockquote') ? '#007acc' : 'white',
          color: editor.isActive('blockquote') ? 'white' : 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Quote
      </button>
      <button
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        style={{ 
          backgroundColor: 'white',
          color: 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Horizontal Rule
      </button>
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        style={{ 
          backgroundColor: 'white',
          color: 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Undo
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        style={{ 
          backgroundColor: 'white',
          color: 'black',
          border: '1px solid #ccc',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Redo
      </button>
    </div>
  )
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const editor = useEditor({
    extensions: [
      // Use StarterKit but exclude the table extension to avoid conflicts
      StarterKit.configure({
        table: false, // Disable StarterKit's table extension
      }),
      // Add our custom BlockNote table extensions
      ...BlockNoteTableExtensions,
      // Other extensions
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
      <p>This editor now includes BlockNote's advanced table implementation.</p>
      <h3>BlockNote Table Features:</h3>
      <ul>
        <li>Block-based table architecture</li>
        <li>Enhanced keyboard navigation (Tab/Shift-Tab)</li>
        <li>Column resizing capabilities</li>
        <li>Improved cell content handling</li>
        <li>Better DOM structure for styling</li>
      </ul>
    `,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
  }, [isMounted])

  if (!isMounted) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <h1>BlockNote-Inspired Tiptap Editor</h1>
        <div style={{ 
          border: '1px solid #ccc', 
          borderRadius: '4px', 
          minHeight: '500px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f9f9f9'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #007acc',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 10px'
            }}></div>
            <p>Loading editor...</p>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>BlockNote-Inspired Tiptap Editor</h1>
      <div style={{ border: '1px solid #ccc', borderRadius: '4px' }}>
        <MenuBar editor={editor} />
        <EditorContent 
          editor={editor} 
          style={{ 
            minHeight: '400px', 
            padding: '15px',
            outline: 'none'
          }}
        />
      </div>
      <style jsx>{`
        :global(.ProseMirror) {
          outline: none;
          min-height: 400px;
        }
        
        /* BlockNote-inspired table styles */
        :global(.bn-block-content) {
          position: relative;
          margin: 16px 0;
        }
        
      
        :global(.tableWrapper) {
          position: relative;
          overflow-x: auto;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        :global(.tableWrapper-inner) {
          position: relative;
          min-width: 100%;
        }
        
        :global(.bn-table, .prosemirror-table) {
          border-collapse: separate !important;
          border-spacing: 0 !important;
          table-layout: fixed !important;
          width: 100% !important;
          margin: 0 !important;
          overflow: hidden !important;
          border: 2px solid #e5e7eb !important;
          border-radius: 8px !important;
          background-color: white !important;
          font-size: 14px;
        }
        
        :global(.bn-table td, .bn-table th, .prosemirror-table td, .prosemirror-table th) {
          min-width: 120px !important;
          border: 1px solid #e5e7eb !important;
          padding: 12px 16px !important;
          vertical-align: top !important;
          box-sizing: border-box !important;
          position: relative !important;
          background-color: white !important;
          border-left: none !important;
          border-top: none !important;
        }
        
        :global(.bn-table td:first-child, .bn-table th:first-child, .prosemirror-table td:first-child, .prosemirror-table th:first-child) {
          border-left: 1px solid #e5e7eb !important;
        }
        
        :global(.bn-table tr:first-child td, .bn-table tr:first-child th, .prosemirror-table tr:first-child td, .prosemirror-table tr:first-child th) {
          border-top: 1px solid #e5e7eb !important;
        }
        
        :global(.bn-table th, .prosemirror-table th) {
          font-weight: 600 !important;
          text-align: left !important;
          background-color: #f8fafc !important;
          color: #374151 !important;
          border-bottom: 2px solid #d1d5db !important;
        }
        
        :global(.bn-table tr:hover td, .prosemirror-table tr:hover td) {
          background-color: #f9fafb !important;
        }
        
        :global(.bn-table .selectedCell:after, .prosemirror-table .selectedCell:after) {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(59, 130, 246, 0.15) !important;
          pointer-events: none;
          border: 2px solid #3b82f6 !important;
        }
        
        /* Table paragraph styling */
        :global(.bn-table p, .prosemirror-table p) {
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1.5 !important;
        }
        
        :global(.table-widgets-container) {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }
        
        /* Column resize handles */
        :global(.column-resize-handle) {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: #3b82f6;
          pointer-events: auto;
          cursor: col-resize;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 10;
        }
        
        :global(.bn-table:hover .column-resize-handle, .prosemirror-table:hover .column-resize-handle) {
          opacity: 1;
        }
        
        /* Ensure table is visible in all cases */
        :global(table) {
          border-collapse: separate !important;
          border-spacing: 0 !important;
        }
        
        :global(table td, table th) {
          border: 1px solid #e5e7eb !important;
          padding: 8px 12px !important;
          background-color: white !important;
        }
        
        :global(table th) {
          background-color: #f8fafc !important;
          font-weight: 600 !important;
        }
        
        /* Task list styles */
        :global(.ProseMirror ul[data-type="taskList"]) {
          list-style: none;
          padding: 0;
        }
        :global(.ProseMirror ul[data-type="taskList"] p) {
          margin: 0;
        }
        :global(.ProseMirror ul[data-type="taskList"] li) {
          display: flex;
        }
        :global(.ProseMirror ul[data-type="taskList"] li > label) {
          flex: 0 0 auto;
          margin-right: 0.5rem;
          user-select: none;
        }
        :global(.ProseMirror ul[data-type="taskList"] li > div) {
          flex: 1 1 auto;
        }
      `}</style>
    </div>
  );
}
