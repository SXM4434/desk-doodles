import React, { createContext, useContext, useState } from 'react';

// Aspect control for the hero image in the Gate A Ion case study shell.
//   - native      : fixed height from GateAIonHeroHeightContext (current default behavior)
//   - fill-cell   : image renders at its intrinsic aspect ratio (width 100%, height auto)
//                   — same semantic as Narrow Pass 4 fill-cell, adapted for standalone hero
//   - widescreen  : 16:9 — TV / video standard
//   - cinematic   : 21:9 — film-wide
//   - academy     : 4:3 — vintage / broadcast
//   - square      : 1:1 — editorial grid
//   - portrait    : 9:16 — vertical
//   - anamorphic  : 2.39:1 — very wide
//   - golden      : 1.618:1 — classical proportion
//
// When state is 'native', GateAIonHeroHeightContext drives the hero height.
// All other values apply an aspectRatio to the hero wrapper; the image
// cover-crops within it.
export type GateAIonHeroAspect =
  | 'native'
  | 'fill-cell'
  | 'widescreen'
  | 'cinematic'
  | 'academy'
  | 'square'
  | 'portrait'
  | 'anamorphic'
  | 'golden';

type Ctx = {
  state: GateAIonHeroAspect;
  setState: (s: GateAIonHeroAspect) => void;
};

const Cx = createContext<Ctx | null>(null);

export function GateAIonHeroAspectProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonHeroAspect>('native');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonHeroAspect(): Ctx {
  const v = useContext(Cx);
  if (!v)
    throw new Error('useGateAIonHeroAspect must be used inside GateAIonHeroAspectProvider');
  return v;
}
