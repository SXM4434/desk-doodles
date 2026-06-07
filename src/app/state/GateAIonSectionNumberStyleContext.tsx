import React, { createContext, useContext, useState } from 'react';

// Visual treatment for section numbers (01, 02, …) in the Gate A Ion shell.
// Default 'hidden' per Step D research recommendation (D2): Bill Guo + Rachel Chen
// — both senior IC portfolios — ship without section ordinals. Wayfinding is
// carried by the LocalRail TOC + scrollspy active-state.
//   - native        : IS 10 500 UC above heading, --dir-detail (locked case-study default)
//   - inline-dash   : "01 — Heading" on same line, dash separator
//   - inline-dot    : "01 · Heading" on same line, interpunct (Linear Look register)
//   - pill          : numbered chip badge (9999 radius) before heading, --dir-chip register
//   - large         : IS 28 300 above heading, --dir-muted — decorative editorial anchor
//   - hidden        : number suppressed entirely (D2 default)
//   - marginal      : ordinal lives in left margin opposite heading (D1, no portfolio precedent)
//   - rail-internal : ordinal moves into TOC chrome ("01 Overview"), heading stays clean (D3)
export type GateAIonSectionNumberStyle =
  | 'native'
  | 'inline-dash'
  | 'inline-dot'
  | 'pill'
  | 'large'
  | 'hidden'
  | 'marginal'
  | 'rail-internal';

type Ctx = {
  state: GateAIonSectionNumberStyle;
  setState: (s: GateAIonSectionNumberStyle) => void;
};

const Cx = createContext<Ctx | null>(null);

export function GateAIonSectionNumberStyleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonSectionNumberStyle>('hidden');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonSectionNumberStyle(): Ctx {
  const v = useContext(Cx);
  if (!v)
    throw new Error('useGateAIonSectionNumberStyle must be used inside GateAIonSectionNumberStyleProvider');
  return v;
}
