import React, { createContext, useContext, useState } from 'react';
import type { AspectVarianceState } from './AspectVarianceContext';

// Narrow-4 standard-register aspect variance override.
//   - native        : honor SV-A's authored aspect resolution (uniform)
//   - uniform       : asset's intrinsic aspect — fills cell with cover fit
//   - authored      : per-slot authored aspect (4/3 under SV-A)
//   - cinematic     : 21:9 — film-wide
//   - widescreen    : 16:9 — TV / video standard
//   - ...           : other fixed ratios per AspectVarianceMode
//
// Scope: applies only to SV-A renders inside narrow-4 surfaces. Featured FV-A
// tiles read Narrow4FeaturedAspectVarianceContext separately.
type Ctx = {
  state: AspectVarianceState;
  setState: (s: AspectVarianceState) => void;
};

const Cx = createContext<Ctx | null>(null);

export function Narrow4StandardAspectVarianceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<AspectVarianceState>('uniform');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useNarrow4StandardAspectVariance(): Ctx {
  const v = useContext(Cx);
  if (!v)
    throw new Error(
      'useNarrow4StandardAspectVariance must be used inside Narrow4StandardAspectVarianceProvider',
    );
  return v;
}
