import React, { createContext, useContext, useState } from 'react';

export type GateAIonFinalImageWidthToken =
  | 'native'
  | 'text-column'
  | 'inner-container'
  | 'content-area'
  | 'partial-bleed'
  | 'near-bleed'
  | 'bleed-right'
  | 'full-viewport'
  | 'panoramic';

interface GateAIonFinalImageWidthContextType {
  finalImageWidth: GateAIonFinalImageWidthToken;
  setFinalImageWidth: (v: GateAIonFinalImageWidthToken) => void;
}

const GateAIonFinalImageWidthContext = createContext<GateAIonFinalImageWidthContextType>({
  finalImageWidth: 'text-column',
  setFinalImageWidth: () => {},
});

export const GateAIonFinalImageWidthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lock default 2026-05-24: 'text-column' is the production-pick final-image width (image stays at text-col width).
  const [finalImageWidth, setFinalImageWidth] = useState<GateAIonFinalImageWidthToken>('text-column');
  return (
    <GateAIonFinalImageWidthContext.Provider value={{ finalImageWidth, setFinalImageWidth }}>
      {children}
    </GateAIonFinalImageWidthContext.Provider>
  );
};

export const useGateAIonFinalImageWidth = () => useContext(GateAIonFinalImageWidthContext);
