import React, { createContext, useContext, useState } from 'react';

// Controls the visual format of the metadata strip in §01 Overview.
// 'native'  = flex-wrap row of label + value pairs (locked default)
// 'grid'    = 4-column definition grid — labels col, values col, labels col, values col
// 'columns' = each field as an independent column group — label above, value below (Rachel Chen pattern)
// 'hidden'  = metadata strip suppressed entirely
export type GateAIonS01MetaStrip = 'native' | 'grid' | 'columns' | '2-col' | 'hidden';

type Ctx = { state: GateAIonS01MetaStrip; setState: (s: GateAIonS01MetaStrip) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonS01MetaStripProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonS01MetaStrip>('native');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonS01MetaStrip(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonS01MetaStrip must be inside GateAIonS01MetaStripProvider');
  return v;
}
