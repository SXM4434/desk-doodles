import React, { createContext, useContext, useState } from 'react';

// Controls WHERE the metadata strip renders relative to the hero.
// 'native'     = inside §01, below contribution grid (current default)
// 'post-hero'  = dedicated strip between hero and §01 — Rachel Chen pattern
// 'pre-title'  = hook zone right column alongside H1 — Bill Guo pattern
export type GateAIonMetaStripPosition = 'native' | 'post-hero' | 'pre-title';

type Ctx = { state: GateAIonMetaStripPosition; setState: (s: GateAIonMetaStripPosition) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonMetaStripPositionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonMetaStripPosition>('native');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonMetaStripPosition(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonMetaStripPosition must be inside GateAIonMetaStripPositionProvider');
  return v;
}
