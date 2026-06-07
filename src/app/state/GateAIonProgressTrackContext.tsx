import React, { createContext, useContext, useState } from 'react';

// Visibility + composition register of the LocalRail ProgressTrack in the Gate A Ion shell.
// Default 'hidden' per Step C composition-vs-subtraction research recommendation (C2):
// Bill Guo + Rachel Chen — both senior IC portfolios — ship without any progress signal;
// scrollspy active-state in the grouped TOC carries the "where am I" signal.
//
// Composition variants (additive cliché-mitigation research, Gate A Ion):
//   - 'hidden'        — no progress signal; scrollspy carries the read (Bill Guo / Rachel Chen)
//   - 'bar'           — Navigation System Lab default (1px track + filled progress, 80ms linear)
//   - 'dot'           — Navigation System Lab dot variant (2px track + 8x8 sliding dot, 100ms linear)
//   - 'top-bar'       — Medium-register fixed bar at viewport top
//   - 'thick-rail'    — 3px heavier presence above TOC
//   - 'section-dots'  — N dots per section, filled as scrolled past
//   - 'numbered'      — "01 / 10" scrollspy text register
//   - 'hakim-path'    — Hakim El Hattab Progress Nav: SVG path drawing through stacked anchors
export type GateAIonProgressTrack =
  | 'hidden'
  | 'bar'
  | 'dot'
  | 'top-bar'
  | 'thick-rail'
  | 'section-dots'
  | 'numbered'
  | 'hakim-path';

type Ctx = {
  state: GateAIonProgressTrack;
  setState: (s: GateAIonProgressTrack) => void;
};

const Cx = createContext<Ctx | null>(null);

export function GateAIonProgressTrackProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonProgressTrack>('hidden');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonProgressTrack(): Ctx {
  const v = useContext(Cx);
  if (!v)
    throw new Error('useGateAIonProgressTrack must be used inside GateAIonProgressTrackProvider');
  return v;
}
