import { Extension } from "@tiptap/core";
import { EditorState, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, EditorView } from "@tiptap/pm/view";

export interface PaginationPlusOptions {
  pageHeight: number;
  pageGap: number;
  pageBreakBackground: string;
  pageHeaderHeight: number;
  pageFooterHeight: number;
  pageGapBorderSize: number;
  footerRight: string;
  footerLeft: string;
  headerRight: string;
  headerLeft: string;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  contentMarginTop: number;
  contentMarginBottom: number;
}
const page_count_meta_key = "PAGE_COUNT_META_KEY";
// Function to update table row scrollbars for a specific table
const updateTableRowScrollbarsForTable = (tableId?: string) => {
  const breakers = document.querySelectorAll('.breaker');
  let tableRowWrappers: NodeListOf<Element>;

  if (tableId) {
    // Only get wrappers for the specific table (dataset.tableId creates data-table-id attribute)
    const targetTable = document.querySelector(`table[data-table-id="${tableId}"]`);
    if (!targetTable) {
      console.warn(`Table with ID ${tableId} not found`);
      return;
    }
    tableRowWrappers = targetTable.querySelectorAll('.table-row-wrapper');
  } else {
    // Fallback to all wrappers if no tableId specified
    tableRowWrappers = document.querySelectorAll('.table-row-wrapper');
  }

  if (tableRowWrappers.length === 0) return;

  // Group table row wrappers by their parent table
  const tableGroups: { [key: string]: HTMLElement[] } = {};

  tableRowWrappers.forEach((wrapper) => {
    const wrapperElement = wrapper as HTMLElement;
    const parentTable = wrapperElement.closest('table');

    if (parentTable) {
      const currentTableId = parentTable.dataset.tableId || 'default';
      if (!tableGroups[currentTableId]) {
        tableGroups[currentTableId] = [];
      }
      tableGroups[currentTableId].push(wrapperElement);
    }
  });

  // Process each table group
  Object.values(tableGroups).forEach((tableWrappers) => {
    tableWrappers.forEach((wrapperElement, index) => {
      const isLastRow = index === tableWrappers.length - 1;
      const currentRowRect = wrapperElement.getBoundingClientRect();
      
      let isBottomRowBeforePageBreak = false;
      
      if (isLastRow) {
        // Last row of table always gets scrollbar
        isBottomRowBeforePageBreak = true;
      } else if (breakers.length > 0) {
        // Get the next table row
        const nextRow = tableWrappers[index + 1];
        if (nextRow) {
          const nextRowRect = nextRow.getBoundingClientRect();
          
          // Find the closest page break below current row
          let closestPageBreakDistance = Infinity;
          breakers.forEach((breaker) => {
            const breakerRect = breaker.getBoundingClientRect();
            // Only consider page breaks that are below current row
            if (breakerRect.top > currentRowRect.bottom) {
              const distance = breakerRect.top - currentRowRect.bottom;
              if (distance < closestPageBreakDistance) {
                closestPageBreakDistance = distance;
              }
            }
          });
          
          // Calculate distance to next row
          const distanceToNextRow = nextRowRect.top - currentRowRect.bottom;
          
          // If page break is closer than next row, this is bottom row before page break
          if (closestPageBreakDistance < distanceToNextRow) {
            isBottomRowBeforePageBreak = true;
          }
        }
      }
      
      // Apply scrollbar based on logic
      if (isBottomRowBeforePageBreak) {
        wrapperElement.classList.add('show-scrollbar');
        wrapperElement.classList.remove('hide-scrollbar');
        
        if (isLastRow) {
          wrapperElement.setAttribute('data-last-table-row', 'true');
        } else {
          wrapperElement.setAttribute('data-before-page-break', 'true');
        }
      } else {
        wrapperElement.classList.add('hide-scrollbar');
        wrapperElement.classList.remove('show-scrollbar');
        wrapperElement.removeAttribute('data-last-table-row');
        wrapperElement.removeAttribute('data-before-page-break');
      }
    });
  });
};

// Make the table-specific function globally available for table updates (only in browser)
if (typeof window !== 'undefined') {
  (window as any).updateTableRowScrollbarsForTable = updateTableRowScrollbarsForTable;
}

export const PaginationPlus = Extension.create<PaginationPlusOptions>({
  name: "PaginationPlus",
  addOptions() {
    return {
      pageHeight: 800,
      pageGap: 50,
      pageGapBorderSize: 1,
      pageBreakBackground: "#ffffff",
      pageHeaderHeight: 30,
      pageFooterHeight: 30,
      footerRight: "{page}",
      footerLeft: "",
      headerRight: "",
      headerLeft: "",
      marginTop: 20,
      marginBottom: 20,
      marginLeft: 50,
      marginRight: 50,
      contentMarginTop: 10,
      contentMarginBottom: 10,
    };
  },

  onUpdate({ editor, transaction }) {
    // Only update on actual content changes, not selection or other state changes
    if (transaction.docChanged) {
      // Use the debounced function to refresh pagination
      if ((this as any).debouncedRefreshPage) {
        (this as any).debouncedRefreshPage();
      }
    }
  },
  onCreate() {
    const targetNode = this.editor.view.dom;
    targetNode.classList.add("rm-with-pagination");
    targetNode.style.marginLeft = this.options.marginLeft + "px";
    targetNode.style.marginRight = this.options.marginRight + "px";
    const headerFooterHeight = this.options.pageHeaderHeight + this.options.pageFooterHeight;
    const _pageContentHeight = this.options.pageHeight - headerFooterHeight - this.options.contentMarginTop - this.options.contentMarginBottom - this.options.marginTop - this.options.marginBottom;

    const style = document.createElement("style");
    style.dataset.rmPaginationStyle = "";

    style.textContent = `
      .rm-with-pagination {
        counter-reset: page-number;
      }
      .rm-with-pagination .image-plus-wrapper,
      .rm-with-pagination .table-plus td,
      .rm-with-pagination .table-plus th {
        max-height: ${_pageContentHeight - 10}px;
        overflow-y: auto;
      }
      .rm-with-pagination .image-plus-wrapper {
        overflow-y: visible;
      }
      .rm-with-pagination .rm-page-footer {
        counter-increment: page-number;
        margin-bottom: ${this.options.marginBottom}px;
      }
      .rm-with-pagination .rm-page-break:last-child .rm-pagination-gap {
        display: none;
      }
      .rm-with-pagination .rm-page-break:last-child .rm-page-header {
        display: none;
      }
      
      .rm-with-pagination table tr td,
      .rm-with-pagination table tr th {
        word-break: break-all;
      }
      .rm-with-pagination table > tr {
        display: grid;
        min-width: 100%;
      }
      .rm-with-pagination .table-row-wrapper {
        display: block;
        overflow-x: auto;
        width: 100%;
        margin: 0;
        padding: 0;
      }
      .rm-with-pagination table {
        border-collapse: collapse;
        width: 100%;
        display: contents;
      }
      .rm-with-pagination table tbody{
        display: table;
        max-height: 300px;
        overflow-y: auto;
      }
      .rm-with-pagination table tbody > tr{
        display: table-row !important;
      }
      .rm-with-pagination p:has(br.ProseMirror-trailingBreak:only-child) {
        display: table;
        width: 100%;
      }
      .rm-with-pagination .table-row-group {
        max-height: ${_pageContentHeight}px;
        overflow-y: auto;
        width: 100%;
      }
      .rm-with-pagination .rm-page-footer-left,
      .rm-with-pagination .rm-page-footer-right,
      .rm-with-pagination .rm-page-header-left,
      .rm-with-pagination .rm-page-header-right {
        display: inline-block;
      }
      
      .rm-with-pagination .rm-page-header-left,
      .rm-with-pagination .rm-page-footer-left{
        float: left;
        margin-left: ${this.options.marginLeft}px;
      }
      .rm-with-pagination .rm-page-header-right,
      .rm-with-pagination .rm-page-footer-right{
        float: right;
        margin-right: ${this.options.marginRight}px;
      }
      .rm-with-pagination .rm-page-number::before {
        content: counter(page-number);
      }
      .rm-with-pagination .rm-first-page-header{
        display: inline-flex;
        justify-content: space-between;
        width: 100%;
      }
      .rm-with-pagination .rm-page-header,
      .rm-with-pagination .rm-first-page-header{
        margin-bottom: ${this.options.contentMarginTop}px !important;
        margin-top: ${this.options.marginTop}px !important;
      }
      .rm-with-pagination .rm-page-footer{
        margin-top: ${this.options.contentMarginBottom}px !important;
        margin-bottom: ${this.options.marginBottom}px !important;
      }
    `;
    document.head.appendChild(style);

    const refreshPage = (targetNode: HTMLElement) => {
      console.log("Recalculating page breaks")
      const paginationElement = targetNode.querySelector(
        "[data-rm-pagination]"
      );
      if (paginationElement) {
        const lastPageBreak = paginationElement.lastElementChild?.querySelector(
          ".breaker"
        ) as HTMLElement;
        if (lastPageBreak) {
          const minHeight =
            lastPageBreak.offsetTop + lastPageBreak.offsetHeight;
          targetNode.style.minHeight = `${minHeight}px`;
        }
        
        // Update table row scrollbar states based on page break proximity
        updateTableRowScrollbarsForTable(); // No tableId = update all tables
      }
    };

    (window as any).refreshPage = refreshPage;

    // Debounced function to refresh page when content changes
    let refreshPageTimer: NodeJS.Timeout | null = null;
    const debouncedRefreshPage = () => {
      console.log("Triggered calculate refresh page")
      if (refreshPageTimer) {
        clearTimeout(refreshPageTimer);
      }
      refreshPageTimer = setTimeout(() => {
        // Check if page count changed and update if needed
        const currentPageCount = getExistingPageCount(this.editor.view);
        const pageCount = calculatePageCount(this.editor.view, this.options);
        if (currentPageCount !== pageCount) {
          const tr = this.editor.view.state.tr.setMeta(
            page_count_meta_key,
            Date.now()
          );
          this.editor.view.dispatch(tr);
        }

        refreshPage(targetNode);
      }, 300); // 300ms debounce
    };

    // Store the debounced function for cleanup
    (this as any).debouncedRefreshPage = debouncedRefreshPage;
    (this as any).refreshPageTimer = refreshPageTimer;

    // Initial call to set up pagination
    refreshPage(targetNode);
  },

  onDestroy() {
    // Clean up the refresh page timer
    if ((this as any).refreshPageTimer) {
      clearTimeout((this as any).refreshPageTimer);
    }
  },
  addProseMirrorPlugins() {

    const pageOptions = this.options;
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey("pagination"),

        state: {
          init(_, state) {
            const widgetList = createDecoration(state, pageOptions);
            return DecorationSet.create(state.doc, widgetList);
          },
          apply(tr, oldDeco, oldState, newState) {
            const pageCount = calculatePageCount(editor.view, pageOptions);
            const currentPageCount = getExistingPageCount(editor.view);
            if ((pageCount > 1 ? pageCount : 1) !== currentPageCount) {
              const widgetList = createDecoration(newState, pageOptions);
              
              // Update table row scrollbars after page breaks change
              setTimeout(() => {
                updateTableRowScrollbarsForTable(); // No tableId = update all tables
              }, 100);
              
              return DecorationSet.create(newState.doc, [...widgetList]);
            }
            return oldDeco;
          },
        },

        props: {
          decorations(state: EditorState) {
            return this.getState(state) as DecorationSet;
          },
        },
      }),
    ];
  },
});

const getExistingPageCount = (view: EditorView) => {

  const editorDom = view.dom;
  const paginationElement = editorDom.querySelector("[data-rm-pagination]");
  if (paginationElement) {
    return paginationElement.children.length;
  }
  return 0;
};
const calculatePageCount = (
  view: EditorView,
  pageOptions: PaginationPlusOptions
) => {
  const editorDom = view.dom;
  const _pageHeaderHeight = pageOptions.pageHeaderHeight + pageOptions.contentMarginTop + pageOptions.marginTop;
  const _pageFooterHeight = pageOptions.pageFooterHeight + pageOptions.contentMarginBottom + pageOptions.marginBottom;
  const pageContentAreaHeight =
    pageOptions.pageHeight - _pageHeaderHeight - _pageFooterHeight;
  const paginationElement = editorDom.querySelector("[data-rm-pagination]");
  const currentPageCount = getExistingPageCount(view);
  if (paginationElement) {
    const lastElementOfEditor = editorDom.lastElementChild;
    const lastPageBreak =
      paginationElement.lastElementChild?.querySelector(".breaker");
    if (lastElementOfEditor && lastPageBreak) {
      const lastPageGap =
        lastElementOfEditor.getBoundingClientRect().bottom -
        lastPageBreak.getBoundingClientRect().bottom;
      if (lastPageGap > 0) {
        const addPage = Math.ceil(lastPageGap / pageContentAreaHeight);
        return currentPageCount + addPage;
      } else {
        const lpFrom = -10;
        const lpTo = -(pageOptions.pageHeight - 10);
        if (lastPageGap > lpTo && lastPageGap < lpFrom) {
          return currentPageCount;
        } else if (lastPageGap < lpTo) {
          const pageHeightOnRemove =
            pageOptions.pageHeight + pageOptions.pageGap;
          const removePage = Math.floor(lastPageGap / pageHeightOnRemove);
          return currentPageCount + removePage;
        } else {
          return currentPageCount;
        }
      }
    }
    return 1;
  } else {
    const editorHeight = editorDom.scrollHeight;
    const pageCount = Math.ceil(editorHeight / pageContentAreaHeight);
    return pageCount <= 0 ? 1 : pageCount;
  }
};

function createDecoration(
  state: EditorState,
  pageOptions: PaginationPlusOptions,
  isInitial: boolean = false
): Decoration[] {
  const pageWidget = Decoration.widget(
    0,
    (view) => {

      const _pageGap = pageOptions.pageGap;
      const _pageHeaderHeight = (pageOptions.pageHeaderHeight + pageOptions.contentMarginTop + pageOptions.marginTop);
      const _pageFooterHeight = (pageOptions.pageFooterHeight + pageOptions.contentMarginBottom + pageOptions.marginBottom);
      const _pageHeight = pageOptions.pageHeight - _pageHeaderHeight - _pageFooterHeight;
      const _pageBreakBackground = pageOptions.pageBreakBackground;
  
      const el = document.createElement("div");
      el.dataset.rmPagination = "true";
  
      const pageBreakDefinition = ({
        firstPage = false,
      }: {
        firstPage: boolean;
      }) => {
        const pageContainer = document.createElement("div");
        pageContainer.classList.add("rm-page-break");
  
        const page = document.createElement("div");
        page.classList.add("page");
        page.style.position = "relative";
        page.style.float = "left";
        page.style.clear = "both";
        page.style.marginTop = firstPage
          ? `calc(${_pageHeaderHeight}px + ${_pageHeight}px)`
          : _pageHeight + "px";
  
        const pageBreak = document.createElement("div");
        pageBreak.classList.add("breaker");
        pageBreak.style.width = `calc(100% + ${pageOptions.marginLeft}px + ${pageOptions.marginRight}px)`;
        pageBreak.style.marginLeft = `-${pageOptions.marginLeft}px`;
        pageBreak.style.marginRight = `-${pageOptions.marginRight}px`;
        pageBreak.style.position = "relative";
        pageBreak.style.float = "left";
        pageBreak.style.clear = "both";
        pageBreak.style.left = `0px`;
        pageBreak.style.right = `0px`;
        pageBreak.style.zIndex = "2";
  
        const pageFooter = document.createElement("div");
        pageFooter.classList.add("rm-page-footer");
        pageFooter.style.height = pageOptions.pageFooterHeight + "px";
        pageFooter.style.overflow = "hidden";
  
        const footerRight = pageOptions.footerRight.replace(
          "{page}",
          `<span class="rm-page-number"></span>`
        );
        const footerLeft = pageOptions.footerLeft.replace(
          "{page}",
          `<span class="rm-page-number"></span>`
        );
  
        const pageFooterLeft = document.createElement("div");
        pageFooterLeft.classList.add("rm-page-footer-left");
        pageFooterLeft.innerHTML = footerLeft;
  
        const pageFooterRight = document.createElement("div");
        pageFooterRight.classList.add("rm-page-footer-right");
        pageFooterRight.innerHTML = footerRight;
  
        pageFooter.append(pageFooterLeft);
        pageFooter.append(pageFooterRight);
  
  
        const pageSpace = document.createElement("div");
        pageSpace.classList.add("rm-pagination-gap");
        pageSpace.style.height = _pageGap + "px";
        pageSpace.style.borderLeft = "1px solid";
        pageSpace.style.borderRight = "1px solid";
        pageSpace.style.position = "relative";
        pageSpace.style.setProperty("width", "calc(100% + 2px)", "important");
        pageSpace.style.left = "-1px";
        pageSpace.style.backgroundColor = _pageBreakBackground;
        pageSpace.style.borderLeftColor = _pageBreakBackground;
        pageSpace.style.borderRightColor = _pageBreakBackground;
  
        const pageHeader = document.createElement("div");
        pageHeader.classList.add("rm-page-header");
        pageHeader.style.height = pageOptions.pageHeaderHeight + "px";
        pageHeader.style.overflow = "hidden";
  
        const pageHeaderLeft = document.createElement("div");
        pageHeaderLeft.classList.add("rm-page-header-left");
        pageHeaderLeft.innerHTML = pageOptions.headerLeft;
  
        const pageHeaderRight = document.createElement("div");
        pageHeaderRight.classList.add("rm-page-header-right");
        pageHeaderRight.innerHTML = pageOptions.headerRight;
  
        pageHeader.append(pageHeaderLeft, pageHeaderRight);
        pageBreak.append(pageFooter, pageSpace, pageHeader);
        pageContainer.append(page, pageBreak);
  
        return pageContainer;
      };
  
      const page = pageBreakDefinition({ firstPage: false });
      const firstPage = pageBreakDefinition({
        firstPage: true,
      });
      const fragment = document.createDocumentFragment();
  
      const pageCount = calculatePageCount(view, pageOptions);
  
      for (let i = 0; i < pageCount; i++) {
        if (i === 0) {
          fragment.appendChild(firstPage.cloneNode(true));
        } else {
          fragment.appendChild(page.cloneNode(true));
        }
      }
      el.append(fragment);
      el.id = "pages";
  
      return el;
    },
    { side: -1 }
  );
  const firstHeaderWidget = Decoration.widget(
    0,
    () => {
      const el = document.createElement("div");
      el.style.position = "relative";
      el.classList.add("rm-first-page-header");

      const pageHeaderLeft = document.createElement("div");
      pageHeaderLeft.classList.add("rm-first-page-header-left");
      pageHeaderLeft.innerHTML = pageOptions.headerLeft;
      el.append(pageHeaderLeft);

      const pageHeaderRight = document.createElement("div");
      pageHeaderRight.classList.add("rm-first-page-header-right");
      pageHeaderRight.innerHTML = pageOptions.headerRight;
      el.append(pageHeaderRight);

      el.style.height = `${pageOptions.pageHeaderHeight}px`;
      el.style.overflow = "hidden";
      return el;
    },
    { side: -1 }
  );

  return !isInitial ? [pageWidget, firstHeaderWidget] : [pageWidget];
}