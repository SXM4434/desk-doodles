import React, { createContext, useContext, useState } from 'react';

// Surface density / proportion register. The 9th identity axis — resolves
// t1-s1/t6-s2 and t1-s4/t2-s4 collisions that the prior 8 axes could not
// carry because the real distinction is proportion-based, not treatment-based.
//   - default         : shell's authored baseline (48/52 Featured, 24 pad Standard)
//   - compact         : reduced outer footprint (padding tightened, Featured split
//                       holds 52/48 but at a tighter overall card scale)
//   - content-forward : narrower media column — Featured shifts toward 40/60,
//                       Standard trims media aspect; typography carries the scan.
//   - native          : per-surface baseline (falls back to each shell's authored default)
export type DensityMode = 'default' | 'compact' | 'content-forward';
export type DensityState = DensityMode | 'native';

type Ctx = { state: DensityState; setState: (s: DensityState) => void };

const Cx = createContext<Ctx | null>(null);

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DensityState>('native');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useDensity(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useDensity must be used inside DensityProvider');
  return v;
}
