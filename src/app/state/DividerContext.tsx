import React, { createContext, useContext, useState } from 'react';

// Divider rule treatment inside the content column.
//   - none    : no hairline rules between content atoms
//   - section : thin rule between major zones (above proof, between modules)
//   - inline  : rules between every adjacent atom (modular / densely ruled)
//   - native  : surface's own authored baseline
export type DividerMode = 'none' | 'section' | 'inline';
export type DividerState = DividerMode | 'native';

type Ctx = { state: DividerState; setState: (s: DividerState) => void };

const Cx = createContext<Ctx | null>(null);

export function DividerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DividerState>('native');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useDivider(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useDivider must be used inside DividerProvider');
  return v;
}
