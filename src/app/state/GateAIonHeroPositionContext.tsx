import React, { createContext, useContext, useState } from 'react';

export type GateAIonHeroPosition = 'top' | 'center' | 'bottom';

type ContextValue = {
  state: GateAIonHeroPosition;
  setState: (v: GateAIonHeroPosition) => void;
};

const GateAIonHeroPositionContext = createContext<ContextValue>({
  state: 'top',
  setState: () => {},
});

export function GateAIonHeroPositionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonHeroPosition>('top');
  return (
    <GateAIonHeroPositionContext.Provider value={{ state, setState }}>
      {children}
    </GateAIonHeroPositionContext.Provider>
  );
}

export function useGateAIonHeroPosition() {
  return useContext(GateAIonHeroPositionContext);
}
