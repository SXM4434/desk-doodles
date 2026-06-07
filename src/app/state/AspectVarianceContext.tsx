import React, { createContext, useContext, useState } from 'react';

// Per-slot media aspect ratio rhythm.
//   - uniform        : every slot honors asset's intrinsic aspect (cover fit)
//   - fill-cell      : media fills available cell area via flex — image
//                      cover-crops to the cell's actual size (matches FH-A's
//                      narrow-3 image read inside FV-A foot=2-col)
//   - authored       : per-slot authored aspects (4:3 / 1:1 / 3:4 rotation) —
//                      only visible on layouts that honor per-slot overrides
//   - native         : surface's own authored baseline
//
// Fixed-ratio values — every media slot is forced to the same ratio,
// regardless of surface authorship. Editorial / portfolio conventions:
//   - cinematic      : 21:9 — film-wide
//   - anamorphic     : 2.39:1 — very wide film
//   - widescreen     : 16:9 — TV / video standard
//   - golden         : 1.618:1 — classical proportion
//   - academy        : 4:3 — vintage / broadcast
//   - square         : 1:1 — editorial grid / social feed
//   - portrait       : 9:16 — mobile-native / vertical feed
//   - vertical-half  : 1:2 — tall sliver / editorial column
export type AspectVarianceMode =
  | 'uniform'
  | 'fill-cell'
  | 'authored'
  | 'cinematic'
  | 'anamorphic'
  | 'widescreen'
  | 'golden'
  | 'academy'
  | 'square'
  | 'portrait'
  | 'vertical-half';
export type AspectVarianceState = AspectVarianceMode | 'native';

// Ratio string (CSS aspect-ratio value) for each fixed-ratio value. Used by
// useAuthoredAspect and any consumer that needs to resolve a value to a
// concrete ratio string.
export const ASPECT_VARIANCE_RATIO: Partial<Record<AspectVarianceMode, string>> = {
  cinematic: '21 / 9',
  anamorphic: '239 / 100',
  widescreen: '16 / 9',
  golden: '1.618 / 1',
  academy: '4 / 3',
  square: '1 / 1',
  portrait: '9 / 16',
  'vertical-half': '1 / 2',
};

type Ctx = { state: AspectVarianceState; setState: (s: AspectVarianceState) => void };

const Cx = createContext<Ctx | null>(null);

export function AspectVarianceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AspectVarianceState>('native');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useAspectVariance(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useAspectVariance must be used inside AspectVarianceProvider');
  return v;
}
