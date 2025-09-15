import TableRow from "@tiptap/extension-table-row";

export const TableRowPlus = TableRow.extend({
  
    addNodeView() {
        return ({ node, editor }) => {
          // Create wrapper for horizontal scroll at row level
          const wrapper = document.createElement('div');
          wrapper.className = 'table-row-wrapper';
          wrapper.style.cssText = `
            overflow-x: auto;
            width: 100%;
            display: block;
            position: relative;
            margin: 0;
            padding: 0;
            scrollbar-width: none;
            -ms-overflow-style: none;
          `;

          // Generate unique row ID for scroll authority tracking
          const rowId = `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${performance.now()}`;
          wrapper.dataset.rowId = rowId;

          // Create the actual tr element inside wrapper
          const dom = document.createElement('tr');
          dom.style.display = 'grid';

          // Append tr to wrapper
          wrapper.appendChild(dom);
          
          // Find parent table ID for scroll authority registration
          let tableId: string | null = null;
          let parentTable: HTMLElement | null = wrapper.parentElement;

          // Function to find table ID (will be called after DOM is attached)
          const findTableId = () => {
            let current = wrapper.parentElement;
            while (current) {
              if (current.classList.contains('table-plus') && current.dataset.tableId) {
                return current.dataset.tableId;
              }
              current = current.parentElement;
            }
            return null;
          };

          // Monitor show-scrollbar class changes for authority registration
          const scrollAuthorityObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.attributeName === 'class') {
                const hasShowScrollbar = wrapper.classList.contains('show-scrollbar');
                const currentTableId = findTableId();

                if (currentTableId && (editor as any).tableScrollAuthority) {
                  if (hasShowScrollbar) {
                    // Register as candidate for scroll authority
                    (editor as any).tableScrollAuthority.registerCandidate(currentTableId, rowId);
                  } else {
                    // Remove from candidates
                    (editor as any).tableScrollAuthority.removeCandidate(currentTableId, rowId);
                  }
                }
              }
            });
          });

          // Start observing class changes
          scrollAuthorityObserver.observe(wrapper, {
            attributes: true,
            attributeFilter: ['class']
          });
          
          // Default minimum column width
          const defaultColumnWidth = 200;
          
          // Calculate column widths from colwidth attributes
          const calculateColumnWidths = (currentNode: any) => {
            const columnWidths: string[] = [];
            
            currentNode.forEach((cell: any) => {
              const colspan = cell.attrs.colspan || 1;
              const colwidth = cell.attrs.colwidth || [];
              
              for (let i = 0; i < colspan; i++) {
                // Use stored pixel width or default
                const width = colwidth[i] || defaultColumnWidth;
                columnWidths.push(`${width}px`);
              }
            });
            
            // If no widths found, fall back to equal fractions
            if (columnWidths.length === 0) {
              const childCount = currentNode.childCount || 1;
              return `repeat(${childCount}, ${defaultColumnWidth}px)`;
            }
            
            return columnWidths.join(' ');
          };
          
          let currentGridTemplate = calculateColumnWidths(node);
          
          const updateGrid = (gridTemplate: string) => {
            dom.style.gridTemplateColumns = gridTemplate;
          };
      
          updateGrid(currentGridTemplate);
          
          // Function to find nearest breaker and calculate Y distance
          const findNearestBreakerDistance = () => {
            const breakers = document.querySelectorAll('.breaker');
            if (breakers.length === 0) return;
            
            const wrapperRect = wrapper.getBoundingClientRect();
            
            let nearestBreaker = null;
            let minDistance = Infinity;
            
            breakers.forEach((breaker) => {
              const breakerRect = breaker.getBoundingClientRect();
              // Direct viewport distance calculation - no scroll compensation needed
              const distance = Math.abs(wrapperRect.bottom - breakerRect.top);
              
              if (distance < minDistance) {
                minDistance = distance;
                nearestBreaker = breaker;
              }
            });
            
            if (nearestBreaker) {
              console.log(wrapper, nearestBreaker, minDistance);
            }
          };
          
          // Run the analysis after a short delay to ensure DOM is ready
          setTimeout(() => {
            findNearestBreakerDistance();
          }, 500);
          
          // Also run analysis when window scrolls or resizes
          const throttledAnalysis = (() => {
            let timeout: NodeJS.Timeout | null = null;
            return () => {
              if (timeout) clearTimeout(timeout);
              timeout = setTimeout(findNearestBreakerDistance, 100);
            };
          })();
          
          // window.addEventListener('scroll', throttledAnalysis);
          // window.addEventListener('resize', throttledAnalysis);
      
          return {
            dom: wrapper,  // Return wrapper as the main DOM element
            contentDOM: dom,  // But content goes into the tr
            ignoreMutation(mutation) {
              // Ignore column resize handle mutations
              if (document.querySelector('.column-resize-handle') !== null) {
                return true;
              }
              
              // Ignore style and data attribute changes to prevent re-render when adding scrollbars
              if (mutation.type === 'attributes') {
                const attributeName = mutation.attributeName;
                if (attributeName === 'style' || 
                    attributeName === 'class' ||
                    attributeName?.startsWith('data-')) {
                  return true;
                }
              }
              
              // Let other mutations through
              return false;
            },
      
            update(updatedNode) {
              if (updatedNode.type.name !== 'tableRow') {
                return false;
              }
              
              // Recalculate grid template from updated node
              const newGridTemplate = calculateColumnWidths(updatedNode);
              
              if (newGridTemplate !== currentGridTemplate) {
                currentGridTemplate = newGridTemplate;
                updateGrid(newGridTemplate);
              }
              
              return true;
            },
            
            destroy() {
              // Clean up mutation observer
              scrollAuthorityObserver.disconnect();

              // Remove from scroll authority candidates
              const currentTableId = findTableId();
              if (currentTableId && (editor as any).tableScrollAuthority) {
                (editor as any).tableScrollAuthority.removeCandidate(currentTableId, rowId);
              }

              // Clean up scrollbar classes
              wrapper.classList.remove('show-scrollbar', 'hide-scrollbar');
              wrapper.removeAttribute('data-near-page-break');
            }
          };
        };
      },
})

export default TableRowPlus
