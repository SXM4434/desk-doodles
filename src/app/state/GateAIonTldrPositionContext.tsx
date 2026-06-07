import React, { createContext, useContext, useState } from 'react';

// Controls where the TL;DR block renders relative to the hero.
// 'after-hero'     = after the hero image, before §01 (current default — inside main)
// 'after-subtitle' = in the hook zone, after the subtitle, before the hero image
export type GateAIonTldrPosition = 'after-hero' | 'after-subtitle';

type Ctx = { state: GateAIonTldrPosition; setState: (s: GateAIonTldrPosition) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonTldrPositionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonTldrPosition>('after-hero');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonTldrPosition(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonTldrPosition must be inside GateAIonTldrPositionProvider');
  return v;
}
