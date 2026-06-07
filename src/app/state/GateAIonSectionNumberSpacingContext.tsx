import React, { createContext, useContext, useState } from 'react';

// Controls the margin-bottom below the section number (e.g., "01") before the section heading.
// Values map to the locked spacing ladder: 4 / 8 / 12 / 16
export type GateAIonSectionNumberSpacing = 'tight' | 'compact' | 'default' | 'loose';

export const SECTION_NUMBER_SPACING_VALUES: Record<GateAIonSectionNumberSpacing, number> = {
  tight:   4,
  compact: 8,
  default: 12,
  loose:   16,
};

type Ctx = { state: GateAIonSectionNumberSpacing; setState: (s: GateAIonSectionNumberSpacing) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonSectionNumberSpacingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonSectionNumberSpacing>('tight');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonSectionNumberSpacing(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonSectionNumberSpacing must be inside GateAIonSectionNumberSpacingProvider');
  return v;
}
