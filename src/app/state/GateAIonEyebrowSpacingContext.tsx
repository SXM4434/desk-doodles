import React, { createContext, useContext, useState } from 'react';

// Controls the margin-bottom below the eyebrow tag row (before H1).
// Values map to the locked spacing ladder: 4 / 8 / 12 / 16 / 24 / 32
// 'cards' = 4px — matches Part 1 Narrow 4 project card eyebrow gap (gapW: 4 compact)
// 'snug'  = 12px — locked Sebs preset eyebrow→H1 gap (proportional to hero H1 scale)
export type GateAIonEyebrowSpacing = 'cards' | 'tight' | 'snug' | 'compact' | 'default' | 'loose';

export const EYEBROW_SPACING_VALUES: Record<GateAIonEyebrowSpacing, number> = {
  cards:   4,
  tight:   8,
  snug:    12,
  compact: 16,
  default: 24,
  loose:   32,
};

type Ctx = { state: GateAIonEyebrowSpacing; setState: (s: GateAIonEyebrowSpacing) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonEyebrowSpacingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonEyebrowSpacing>('snug');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonEyebrowSpacing(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonEyebrowSpacing must be inside GateAIonEyebrowSpacingProvider');
  return v;
}
