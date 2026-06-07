import React, { createContext, useContext, useState } from 'react';

// Border radius for images and box elements in the Gate A Ion case study shell.
// Values align with the locked spacing ladder (4/8/12/16/24/32) plus common
// convention values (0 sharp, 2 near-sharp, 9999 fully-rounded pill).
// Default: 2 (near-sharp — matches current case-study register; subtle rounding).
export type GateAIonBorderRadius = 0 | 2 | 4 | 8 | 12 | 16 | 24 | 32 | 9999;

type Ctx = {
  state: GateAIonBorderRadius;
  setState: (s: GateAIonBorderRadius) => void;
};

const Cx = createContext<Ctx | null>(null);

export function GateAIonBorderRadiusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonBorderRadius>(2);
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonBorderRadius(): Ctx {
  const v = useContext(Cx);
  if (!v)
    throw new Error('useGateAIonBorderRadius must be used inside GateAIonBorderRadiusProvider');
  return v;
}
