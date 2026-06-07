import React, { createContext, useContext, useState } from 'react';

export type GateAIonDualContainerEnabledToken = 'native' | 'off' | 'on';

type Ctx = {
  state: GateAIonDualContainerEnabledToken;
  setState: (s: GateAIonDualContainerEnabledToken) => void;
};

const Cx = createContext<Ctx | null>(null);

export function GateAIonDualContainerEnabledProvider({ children }: { children: React.ReactNode }) {
  // Lock default 2026-05-24: 'off' is the production-pick (single-container composition, no dual-container split).
  const [state, setState] = useState<GateAIonDualContainerEnabledToken>('off');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonDualContainerEnabled(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonDualContainerEnabled must be used inside GateAIonDualContainerEnabledProvider');
  return v;
}
