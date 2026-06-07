import React, { createContext, useContext, useState } from 'react';

// Controls whether §01 (contribution grid + metadata strip) renders
// above the hero (pre-hero) or in its normal section position (post-hero).
// Only active when hookMode = 'pre-toc'.
export type GateAIonSection01Position = 'post-hero' | 'pre-hero';

type Ctx = { state: GateAIonSection01Position; setState: (s: GateAIonSection01Position) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonSection01PositionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonSection01Position>('post-hero');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonSection01Position(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonSection01Position must be inside GateAIonSection01PositionProvider');
  return v;
}
