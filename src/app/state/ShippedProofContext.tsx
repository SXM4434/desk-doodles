import React, { createContext, useContext, useState } from 'react';

// Whether proof stats render at all on the surface.
//   - on      : proof stats present
//   - off     : proof stats suppressed
//   - native  : surface's own authored baseline
export type ShippedProofMode = 'on' | 'off';
export type ShippedProofState = ShippedProofMode | 'native';

type Ctx = { state: ShippedProofState; setState: (s: ShippedProofState) => void };

const Cx = createContext<Ctx | null>(null);

export function ShippedProofProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ShippedProofState>('native');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useShippedProof(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useShippedProof must be used inside ShippedProofProvider');
  return v;
}
