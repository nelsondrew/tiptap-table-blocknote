import { useEffect } from "react";

const useContentEditableManager = (
  editMode: boolean,
  wrapperRef: React.RefObject<HTMLDivElement>,
  nodeType: string,
) => {
  useEffect(() => {
    if (wrapperRef.current) {
      const reactRenderer = wrapperRef.current.closest(
        `.react-renderer.node-${nodeType}`,
      );
      if (reactRenderer) {
        if (!editMode) {
          reactRenderer.setAttribute("contenteditable", "true");
        } else {
          reactRenderer.setAttribute("contenteditable", "false");
        }
      }
    }
  }, [editMode, wrapperRef]);
};

export default useContentEditableManager;
