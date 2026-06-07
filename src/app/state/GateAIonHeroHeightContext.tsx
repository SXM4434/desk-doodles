import React, { createContext, useContext, useState } from 'react';

// `'natural'` = image renders at its intrinsic aspect ratio (width 100%, height auto).
// When 'natural', the hero wrapper ignores any aspect-ratio crop from
// GateAIonHeroAspectContext and fits the source image without cropping.
export type GateAIonHeroHeight = 280 | 340 | 420 | 520 | 'natural';

type ContextValue = {
  state: GateAIonHeroHeight;
  setState: (v: GateAIonHeroHeight) => void;
};

const GateAIonHeroHeightContext = createContext<ContextValue>({
  state: 'natural',
  setState: () => {},
});

export function GateAIonHeroHeightProvider({ children }: { children: React.ReactNode }) {
  // Lock default 2026-05-24: 'natural' (no crop) is the production-pick — image renders at intrinsic aspect.
  const [state, setState] = useState<GateAIonHeroHeight>('natural');
  return (
    <GateAIonHeroHeightContext.Provider value={{ state, setState }}>
      {children}
    </GateAIonHeroHeightContext.Provider>
  );
}

export function useGateAIonHeroHeight() {
  return useContext(GateAIonHeroHeightContext);
}
