import React, { createContext, useContext, useState } from 'react';

export type GateAIonHeroBleedToken =
  | 'native'
  | 'inset'
  | 'text-column'
  | 'inner-container'
  | 'content-area'
  | 'half-split'
  | 'bleed-right'
  | 'full-viewport'
  | 'monograph';

interface GateAIonHeroBleedContextType {
  heroBleed: GateAIonHeroBleedToken;
  setHeroBleed: (v: GateAIonHeroBleedToken) => void;
}

const GateAIonHeroBleedContext = createContext<GateAIonHeroBleedContextType>({
  heroBleed: 'text-column',
  setHeroBleed: () => {},
});

export const GateAIonHeroBleedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lock default 2026-05-24: 'text-column' is the production-pick hero bleed (hero stays at text-col width, no bleed).
  const [heroBleed, setHeroBleed] = useState<GateAIonHeroBleedToken>('text-column');
  return (
    <GateAIonHeroBleedContext.Provider value={{ heroBleed, setHeroBleed }}>
      {children}
    </GateAIonHeroBleedContext.Provider>
  );
};

export const useGateAIonHeroBleed = () => useContext(GateAIonHeroBleedContext);
