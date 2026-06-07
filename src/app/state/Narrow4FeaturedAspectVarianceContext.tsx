import React, { createContext, useContext, useState } from 'react';
import type { AspectVarianceState } from './AspectVarianceContext';

// Narrow-4 featured-register aspect variance override.
//   - native        : honor FV-A's authored aspect resolution (uniform under
//                     foot=2-col after the 2026-04-25 ship)
//   - fill-cell     : media flex-fills the card cell (default) — replicates
//                     narrow-3 FH-A's image read where the image fills its
//                     available area cleanly without intrinsic-aspect drift
//   - uniform       : asset's intrinsic aspect drives the box height
//   - authored      : per-slot authored aspect (21/9 banner under foot=2-col)
//   - cinematic     : 21:9 — film-wide
//   - widescreen    : 16:9 — TV / video standard
//   - ...           : other fixed ratios per AspectVarianceMode
//
// Scope: applies only to FV-A renders inside narrow-4 surfaces. Standard SV-A
// tiles read Narrow4StandardAspectVarianceContext separately.
type Ctx = {
  state: AspectVarianceState;
  setState: (s: AspectVarianceState) => void;
};

const Cx = createContext<Ctx | null>(null);

export function Narrow4FeaturedAspectVarianceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<AspectVarianceState>('fill-cell');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useNarrow4FeaturedAspectVariance(): Ctx {
  const v = useContext(Cx);
  if (!v)
    throw new Error(
      'useNarrow4FeaturedAspectVariance must be used inside Narrow4FeaturedAspectVarianceProvider',
    );
  return v;
}
