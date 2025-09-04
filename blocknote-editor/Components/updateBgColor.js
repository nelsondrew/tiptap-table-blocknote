export function updateBgColor(color, image) {
  $('#dynamic-bg-style').remove();

  const editors = document.querySelectorAll('.blocknote-editor');
  if (editors.length <= 1) return;

  // Check if first editor has cover-page class
  const firstEditor = editors[0];
  if (!firstEditor || !firstEditor.classList.contains('cover-page')) return;

  const hasBackground = image || (color && color !== 'transparent');

  const backgroundCSS = image
    ? `
      background-image: url('${image}');
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-position: center;
    `
    : color
    ? `
      background-color: ${color};
    `
    : '';

  const heightCSS = hasBackground
    ? `
      min-height: 840px;
      max-height: 840px;
    `
    : `
      height: 100%;
    `;

  const allStyles = `
    .cover-page {
      position: relative;
      z-index: 0;
      ${backgroundCSS}
      ${heightCSS}
      border-radius: 2px;
      padding-left: 5px;
      overflow: hidden;
    }

    .cover-page .editor-container,
    .cover-page .ProseMirror.top-level-editor {
      background: transparent !important;
      z-index: 1;
      position: relative;
      padding-bottom: 0 !important;
      margin-bottom: 0 !important;
    }

    .cover-page .ProseMirror {
      position: relative;
      z-index: 1;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .cover-page .ProseMirror > *:last-child {
      margin-bottom: 0 !important;
      padding-bottom: 0 !important;
    }
    
    /* Ensure background persists after formatting operations */
    .cover-page[data-has-background="true"] {
      ${backgroundCSS}
      ${heightCSS}
    }
    
    /* Force background to persist */
    .cover-page.force-background {
      ${backgroundCSS}
      ${heightCSS}
    }
  `;

  // Create and append the style element
  const styleElement = $('<style>', {
    id: 'dynamic-bg-style',
    type: 'text/css',
    html: allStyles,
  });
  // Ensure the style is properly added to head
  styleElement.appendTo('head');
    // Force update with timeout to ensure DOM is ready
  setTimeout(() => {
    const coverPages = document.querySelectorAll('.cover-page');
    coverPages.forEach(page => {
      page.classList.add('force-background');
      page.setAttribute('data-has-background', 'true');
      // Use a more stable approach to force reflow without causing scroll jumps
      // Instead of display manipulation, use a temporary class that triggers reflow
      page.classList.add('bg-update-temp');
      // Force reflow using offsetHeight
      page.offsetHeight;
      // Remove temporary class
      page.classList.remove('bg-update-temp');
    });
  }, 50);
}
