/** @jsxImportSource @emotion/react */
import { Global, css } from "@emotion/react";

export default function GlobalStyles() {
  return (
    <Global
      styles={css`
        .ProseMirror {
          outline: none;
          min-height: 400px;
        }

        /* BlockNote-inspired table styles */
        .bn-block-content {
          width: 100%;
          padding: 3px 0;
          transition: font-size 0.2s;
          display: flex;
        }

        .tableWrapper {
          --bn-table-widget-size: 22px;
          --bn-table-handle-size: 24px;
          padding: var(--bn-table-handle-size) var(--bn-table-widget-size)
            var(--bn-table-widget-size) var(--bn-table-handle-size);
          width: 100%;
          position: relative;
          overflow-y: hidden;
          overflow-x: scroll;
        }

        .tableWrapper::-webkit-scrollbar {
          height: 0px;
          transform: translateY(-5px);
          transition: height 0.2s ease;
        }

        .tableWrapper:hover::-webkit-scrollbar {
          height: 12px;
        }

        .tableWrapper::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .tableWrapper::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .tableWrapper::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.4);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: scale(1.02);
        }

        .tableWrapper::-webkit-scrollbar-thumb:active {
          background: rgba(0, 0, 0, 0.5);
          transform: scale(0.98);
        }

        .bn-table,
        .prosemirror-table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          overflow: hidden;
          word-break: break-word;
          width: auto !important;
          --default-cell-min-width: 120px;
          min-width: 360px;
        }

        .bn-table td,
        .bn-table th,
        .prosemirror-table td,
        .prosemirror-table th {
          min-width: 120px !important;
          border: 2px solid rgb(229, 231, 235) !important;
          padding: 12px 16px !important;
          vertical-align: top !important;
          box-sizing: border-box !important;
          position: relative !important;
          background-color: white !important;
          border-left: none !important;
          border-top: none !important;
        }

        .bn-table td:first-of-type,
        .bn-table th:first-of-type,
        .prosemirror-table td:first-of-type,
        .prosemirror-table th:first-of-type {
          border-left: 1px solid #e5e7eb !important;
        }

        .bn-table tr:first-of-type td,
        .bn-table tr:first-of-type th,
        .prosemirror-table tr:first-of-type td,
        .prosemirror-table tr:first-of-type th {
          border-top: 1px solid #e5e7eb !important;
        }

        .bn-table th,
        .prosemirror-table th {
          font-weight: 600 !important;
          text-align: left !important;
          background-color: #f8fafc !important;
          color: #374151 !important;
          border-bottom: 2px solid #d1d5db !important;
        }

        .bn-table tr:hover td,
        .prosemirror-table tr:hover td {
          background-color: #f9fafb !important;
        }

        /* Table paragraph styling */
        .bn-table p,
        .prosemirror-table p {
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1.5 !important;
        }

        .table-widgets-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        /* Column resize handles */
        .column-resize-handle {
          z-index: 20;
          background-color: #adf;
          width: 4px;
          position: absolute;
          top: 0;
          bottom: 0;
          right: -2px;
          cursor: col-resize;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .bn-table:hover .column-resize-handle,
        .prosemirror-table:hover .column-resize-handle {
          opacity: 1;
        }

        /* Ensure table is visible in all cases */
        table {
          border-collapse: separate !important;
          border-spacing: 0 !important;
        }

        table td,
        table th {
          border: 1px solid #e5e7eb !important;
          padding: 8px 12px !important;
          background-color: white !important;
        }

        table th {
          background-color: #f8fafc !important;
          font-weight: 600 !important;
        }
      `}
    />
  );
}
