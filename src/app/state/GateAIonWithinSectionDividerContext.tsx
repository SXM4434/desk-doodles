import React, { createContext, useContext, useState } from 'react';

// Divider treatment between content BLOCKS within a single section.
// (Inter-section dividers — between §01, §02, etc. — are controlled separately
// by GateAIonDividerStyleContext.)
//
// Research finding: spacing-only (none) is the dominant pattern in premium case
// studies. Thin rules appear in ~30% as subtle structural markers. Values align
// with the locked spacing ladder (4/8/12/16/24/32/48).
//
//   - none       : spacing only — no visible rule (most modern, default)
//   - thin-rule  : 1px solid var(--dir-border)
//   - muted-rule : 1px solid var(--dir-muted) — more recessed
//   - dotted     : 1px dotted var(--dir-border)
//   - thick-rule : 2px solid var(--dir-border) — structural emphasis
export type GateAIonWithinSectionDivider =
  | 'none'
  | 'thin-rule'
  | 'muted-rule'
  | 'dotted'
  | 'thick-rule';

type Ctx = {
  state: GateAIonWithinSectionDivider;
  setState: (s: GateAIonWithinSectionDivider) => void;
};

const Cx = createContext<Ctx | null>(null);

export function GateAIonWithinSectionDividerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonWithinSectionDivider>('none');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonWithinSectionDivider(): Ctx {
  const v = useContext(Cx);
  if (!v)
    throw new Error('useGateAIonWithinSectionDivider must be used inside GateAIonWithinSectionDividerProvider');
  return v;
}
