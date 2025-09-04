import React, { createContext, useState, useContext } from 'react';

interface TwoColBubbleMenuContextType {
  activeEditorId: string | null;
  setActiveEditorId: (id: string | null) => void;
}

const TwoColBubbleMenuContext = createContext<TwoColBubbleMenuContextType>({
  activeEditorId: null,
  setActiveEditorId: () => {},
});

export const TwoColBubbleMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeEditorId, setActiveEditorId] = useState<string | null>(null);
  return (
    <TwoColBubbleMenuContext.Provider value={{ activeEditorId, setActiveEditorId }}>
      {children}
    </TwoColBubbleMenuContext.Provider>
  );
};

export const useTwoColBubbleMenuContext = () => useContext(TwoColBubbleMenuContext);
