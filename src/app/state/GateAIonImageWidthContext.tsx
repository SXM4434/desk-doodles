import React, { createContext, useContext, useState } from 'react';

// Controls whether images are constrained to the text column width.
// 'full'          — all images full width (hero + section images)
// 'sections-only' — section images match text width, hero stays full
// 'match-text'    — all images (hero + sections) match text width
export type GateAIonImageWidth = 'full' | 'sections-only' | 'match-text';

type Ctx = {
  state: GateAIonImageWidth;
  setState: (s: GateAIonImageWidth) => void;
};

const Cx = createContext<Ctx | null>(null);

export function GateAIonImageWidthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonImageWidth>('full');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonImageWidth(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonImageWidth must be used inside GateAIonImageWidthProvider');
  return v;
}
