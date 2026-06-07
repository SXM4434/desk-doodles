import React, { createContext, useContext, useState } from 'react';

// EXT.E1 cluster sub-toggle: how the persona's lean direction gets visually encoded.
//   'alpha' = lines ONLY go to lean endpoints (presence/absence of line = lean)
//   'beta'  = persona pill SHIFTS off-center toward average lean direction
//   'gamma' = arrowheads at line ends pointing toward lean endpoints
//   'delta' = LARGER markers at lean endpoints vs tiny at non-lean
// Applies to EXT.E1.V1 + EXT.E1.V3 cluster variants. Other artifacts ignore.

export type GateAIonS03ExtE1LeanDirection = 'alpha' | 'beta' | 'gamma' | 'delta';

type Ctx = { state: GateAIonS03ExtE1LeanDirection; setState: (s: GateAIonS03ExtE1LeanDirection) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonS03ExtE1LeanDirectionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonS03ExtE1LeanDirection>('alpha');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonS03ExtE1LeanDirection(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonS03ExtE1LeanDirection must be inside GateAIonS03ExtE1LeanDirectionProvider');
  return v;
}
