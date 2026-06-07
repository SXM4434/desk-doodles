import React, { createContext, useContext, useState } from 'react';

export type GateAIonDividerStyle = 'border' | 'dotted' | 'dashed' | 'thick' | 'none';

type ContextValue = {
  state: GateAIonDividerStyle;
  setState: (v: GateAIonDividerStyle) => void;
};

const GateAIonDividerStyleContext = createContext<ContextValue>({
  state: 'border',
  setState: () => {},
});

export function GateAIonDividerStyleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonDividerStyle>('border');
  return (
    <GateAIonDividerStyleContext.Provider value={{ state, setState }}>
      {children}
    </GateAIonDividerStyleContext.Provider>
  );
}

export function useGateAIonDividerStyle() {
  return useContext(GateAIonDividerStyleContext);
}
