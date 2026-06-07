import React, { createContext, useContext, useState } from 'react';

// Where proof stats appear in the content column (when shippedProof is on).
//   - stack-grid    : horizontal row of value/label/sub stats (Featured register)
//   - inline        : single caps line " 32% · 2 shipped · 5 guardrails "
//   - bottom-strip  : border-top hairline + caps meta row at the card foot
//   - native        : surface's own authored baseline
export type ProofPlacementMode = 'stack-grid' | 'inline' | 'bottom-strip';
export type ProofPlacementState = ProofPlacementMode | 'native';

type Ctx = { state: ProofPlacementState; setState: (s: ProofPlacementState) => void };

const Cx = createContext<Ctx | null>(null);

export function ProofPlacementProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProofPlacementState>('native');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useProofPlacement(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useProofPlacement must be used inside ProofPlacementProvider');
  return v;
}
