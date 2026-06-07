import React, { createContext, useContext, useState } from 'react';

// Controls how the content column (or inner text container) is positioned within its parent.
// Bill Guo: flush-left. Emmi Wu: left. Rachel Chen: center. Swiss grid: flush-left.
export type GateAIonContentAlignmentToken =
  | 'native'      // no explicit alignment — flex default (left)
  | 'left'        // marginRight: auto — content at left edge with auto right
  | 'center'      // margin: 0 auto — centered within available width
  | 'right'       // marginLeft: auto — content at right edge
  | 'flush-left'  // marginLeft: 0, marginRight: auto — explicit left anchoring
  | 'spread';     // overrides maxWidth — content fills 100% of available width

type Ctx = {
  state: GateAIonContentAlignmentToken;
  setState: (s: GateAIonContentAlignmentToken) => void;
};

const Cx = createContext<Ctx | null>(null);

export function GateAIonContentAlignmentProvider({ children }: { children: React.ReactNode }) {
  // Lock default 2026-05-24: 'center' is the production-pick content alignment for Gate A Ion shell (Rachel Chen-style centered editorial).
  const [state, setState] = useState<GateAIonContentAlignmentToken>('center');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonContentAlignment(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonContentAlignment must be used inside GateAIonContentAlignmentProvider');
  return v;
}
