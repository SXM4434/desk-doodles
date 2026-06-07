import React, { createContext, useContext, useState } from 'react';

export type GateAIonHookMode = 'default' | 'pre-toc';

type Ctx = { state: GateAIonHookMode; setState: (s: GateAIonHookMode) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonHookModeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonHookMode>('default');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonHookMode(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonHookMode must be inside GateAIonHookModeProvider');
  return v;
}
