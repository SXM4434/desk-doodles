import React, { createContext, useContext, useState } from 'react';

// Width of the inner text container when dual-container is active.
// Fixed tokens: narrow-fixed = 520px, narrow-text = 480px.
// Proportional tokens: percentage of the outer zone — NOT narrow-text at desktop widths.
// At ~1096px outer: golden → ~677px, van-de-graaf → ~685px, iso → ~775px, half → ~548px.
// For Bill Guo narrow-left effect, use narrow-fixed or narrow-text.
export type GateAIonDualContainerRatioToken =
  | 'native'        // falls back to narrow-fixed (Bill Guo estimate)
  | 'narrow-fixed'  // 520px fixed
  | 'narrow-text'   // 480px fixed
  | 'two-thirds'    // 66.6% of outer
  | 'golden'        // 61.8% of outer
  | 'van-de-graaf'  // 62.5% of outer
  | 'iso'           // 70.7% of outer (1/√2)
  | 'half';         // 50% of outer

type Ctx = {
  state: GateAIonDualContainerRatioToken;
  setState: (s: GateAIonDualContainerRatioToken) => void;
};

const Cx = createContext<Ctx | null>(null);

export function GateAIonDualContainerRatioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonDualContainerRatioToken>('native');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonDualContainerRatio(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonDualContainerRatio must be used inside GateAIonDualContainerRatioProvider');
  return v;
}
