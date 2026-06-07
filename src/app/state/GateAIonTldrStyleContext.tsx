import React, { createContext, useContext, useState } from 'react';

// Visual treatment options for the TL;DR summary block.
// These are different visual presentations — not show/hide.
export type GateAIonTldrStyle =
  | 'left-border'  // 2px left rule + raised bg
  | 'label-split'  // "TL;DR" label left col / pipe / content right col
  | 'plain'        // typographic only — IS 15 400, text-primary, no chrome
  | 'soft-box'     // full border + light bg tint
  | 'thick-rule'   // top 2px rule + bottom 1px rule, no bg
  | 'minimal';     // IS 10 UC label above, content below, no chrome

type ContextValue = {
  state: GateAIonTldrStyle;
  setState: (v: GateAIonTldrStyle) => void;
};

const GateAIonTldrStyleContext = createContext<ContextValue>({
  state: 'left-border',
  setState: () => {},
});

export function GateAIonTldrStyleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonTldrStyle>('left-border');
  return (
    <GateAIonTldrStyleContext.Provider value={{ state, setState }}>
      {children}
    </GateAIonTldrStyleContext.Provider>
  );
}

export function useGateAIonTldrStyle() {
  return useContext(GateAIonTldrStyleContext);
}
