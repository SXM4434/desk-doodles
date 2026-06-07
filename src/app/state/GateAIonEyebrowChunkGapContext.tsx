import React, { createContext, useContext, useState } from 'react';

// Mini-title gap (Types 2+3): controls the marginBottom between an eyebrow that
// labels its content (label → value, label → list/grid/paragraph) and the
// content beneath. Distinct from GateAIonSectionNumberSpacingContext which is
// reserved for Type 1 (the §# section identifier → section title relationship).
// Locked default: 12px (per 2026-05-09 system thinking — eyebrow as mini-title
// of its content needs more air than the §# section identifier pair).
export type GateAIonEyebrowChunkGap = 'tight' | 'compact' | 'default' | 'loose';

export const EYEBROW_CHUNK_GAP_VALUES: Record<GateAIonEyebrowChunkGap, number> = {
  tight:   8,
  compact: 12,
  default: 16,
  loose:   20,
};

type Ctx = { state: GateAIonEyebrowChunkGap; setState: (s: GateAIonEyebrowChunkGap) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonEyebrowChunkGapProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonEyebrowChunkGap>('compact');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonEyebrowChunkGap(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonEyebrowChunkGap must be inside GateAIonEyebrowChunkGapProvider');
  return v;
}
