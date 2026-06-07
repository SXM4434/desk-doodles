import React, { createContext, useContext, useState } from 'react';

export type GateAIonEyebrowStyle = 'pills-outlined' | 'slash' | 'dot' | 'plain' | 'hidden';

type ContextValue = {
  state: GateAIonEyebrowStyle;
  setState: (v: GateAIonEyebrowStyle) => void;
};

const GateAIonEyebrowStyleContext = createContext<ContextValue>({
  state: 'dot',
  setState: () => {},
});

export function GateAIonEyebrowStyleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonEyebrowStyle>('dot');
  return (
    <GateAIonEyebrowStyleContext.Provider value={{ state, setState }}>
      {children}
    </GateAIonEyebrowStyleContext.Provider>
  );
}

export function useGateAIonEyebrowStyle() {
  return useContext(GateAIonEyebrowStyleContext);
}
