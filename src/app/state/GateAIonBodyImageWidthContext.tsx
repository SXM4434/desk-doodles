import React, { createContext, useContext, useState } from 'react';

export type GateAIonBodyImageWidthToken =
  | 'native'
  | 'inset'
  | 'text-column'
  | 'art-book'
  | 'inner-container'
  | 'science-double'
  | 'content-area'
  | 'partial-bleed'
  | 'bleed-right';

interface GateAIonBodyImageWidthContextType {
  bodyImageWidth: GateAIonBodyImageWidthToken;
  setBodyImageWidth: (v: GateAIonBodyImageWidthToken) => void;
}

const GateAIonBodyImageWidthContext = createContext<GateAIonBodyImageWidthContextType>({
  bodyImageWidth: 'text-column',
  setBodyImageWidth: () => {},
});

export const GateAIonBodyImageWidthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lock default 2026-05-24: 'text-column' is the production-pick body-image width (image stays at text-col width, matches caption).
  const [bodyImageWidth, setBodyImageWidth] = useState<GateAIonBodyImageWidthToken>('text-column');
  return (
    <GateAIonBodyImageWidthContext.Provider value={{ bodyImageWidth, setBodyImageWidth }}>
      {children}
    </GateAIonBodyImageWidthContext.Provider>
  );
};

export const useGateAIonBodyImageWidth = () => useContext(GateAIonBodyImageWidthContext);
