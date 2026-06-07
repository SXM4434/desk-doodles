import React, { createContext, useContext, useState } from 'react';

// Controls the gap between LocalRail (TOC) and main content area.
// native=48 (current default); values grounded in editorial/typographic tradition.
export type GateAIonInternalGapToken =
  | 'native'    // 48 — current default
  | 'none'      // 0  — flush
  | 'xs'        // 16 — IEEE minimum functional gutter
  | 'sm'        // 24 — Bringhurst 1× leading minimum
  | 'md'        // 32 — Bringhurst 2× leading / standard column gutter
  | 'md-lg'     // 64 — 8pt grid mid-step; major section gap per Figma/Material guidance
  | 'lg'        // 48 — Tufte sidenote gap; comfortable editorial separation
  | 'xl'        // 80 — Van de Graaf inner margin (1/9 page width)
  | 'xxl'       // 128 — magazine pictorial rail; Cahiers du Cinéma
  | 'generous'; // 192 — long-form web (The Atlantic / Atavist)

export const INTERNAL_GAP_VALUES: Record<GateAIonInternalGapToken, number> = {
  native:    48,
  none:      0,
  xs:        16,
  sm:        24,
  md:        32,
  'md-lg':   64,
  lg:        48,
  xl:        80,
  xxl:       128,
  generous:  192,
};

type Ctx = {
  state: GateAIonInternalGapToken;
  setState: (s: GateAIonInternalGapToken) => void;
};

const Cx = createContext<Ctx | null>(null);

export function GateAIonInternalGapProvider({ children }: { children: React.ReactNode }) {
  // Lock default 2026-05-24: 'sm' is the production-pick internal gap for Gate A Ion shell.
  const [state, setState] = useState<GateAIonInternalGapToken>('sm');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonInternalGap(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonInternalGap must be used inside GateAIonInternalGapProvider');
  return v;
}
