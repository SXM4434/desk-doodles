import React, { createContext, useContext, useState } from 'react';

// §05 Ruby Guardrails layout A/B (Cycle 7 Q1 Phase B variant test 2026-05-11).
// Tests Option A (stacked editorial list — current locked) vs Option B (2×2 grid
// with sub-section register kept — earns compressed structurally but uses
// editorial register for substantive feel).
//
//   stacked:  4 items vertical, ISe 22 + Body 15, Block 24 between items
//             (Cat 3 sub-section register, original Phase B B1 starting point)
//   grid-2x2: 4 items in 1fr 1fr grid, same ISe 22 + Body 15 register
//             (sub-section register held even though 1fr 1fr earns compressed —
//             editorial substantive feel preserved per Option B reasoning)
//
// Default: 'grid-2x2' — LOCKED 2026-05-12 after visual A/B. 2×2 won because:
// (a) 4-rule symmetry maps to 2×2 naturally — matrix reinforces "these are the
//     four operating principles, equally weighted, no sequence implied"
// (b) Descriptions are short single-line phrases — fit half-column comfortably
// (c) Page rhythm tightens — Interaction Contract lands faster, §05→§06
//     transition reads better
// (d) ISe 22 + Body 15 register held — substantive feel preserved
// Stacked retained as off-state for future revisit if rule descriptions grow.
export type GateAIonS05GuardrailsLayout = 'stacked' | 'grid-2x2';

type Ctx = { state: GateAIonS05GuardrailsLayout; setState: (s: GateAIonS05GuardrailsLayout) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonS05GuardrailsLayoutProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonS05GuardrailsLayout>('grid-2x2');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonS05GuardrailsLayout(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonS05GuardrailsLayout must be inside GateAIonS05GuardrailsLayoutProvider');
  return v;
}
