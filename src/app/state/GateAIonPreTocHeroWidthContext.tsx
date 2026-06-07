import React, { createContext, useContext, useState } from 'react';

// Controls the width of the hero block in pre-toc mode.
// 'full-viewport' — hero spans 100% of the page (outside any gutter padding).
// 'contained'     — hero stays within the 24px gutter padding on each side.
export type GateAIonPreTocHeroWidth = 'full-viewport' | 'contained';

type Ctx = { state: GateAIonPreTocHeroWidth; setState: (s: GateAIonPreTocHeroWidth) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonPreTocHeroWidthProvider({ children }: { children: React.ReactNode }) {
  // Lock default 2026-05-24: 'contained' is the production-pick pre-toc hero width (hero stays within 24px gutter, no full-viewport bleed).
  const [state, setState] = useState<GateAIonPreTocHeroWidth>('contained');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonPreTocHeroWidth(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonPreTocHeroWidth must be inside GateAIonPreTocHeroWidthProvider');
  return v;
}
