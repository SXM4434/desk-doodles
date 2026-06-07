import React, { createContext, useContext, useState } from 'react';

// Whether the card outer frame (border + radius + card bg) is drawn.
//   - on      : CardFrame rendered (tile sits inside a framed container)
//   - off     : CardFrame omitted (plain tile register, no border/radius/bg)
//   - native  : surface's own authored baseline (default per-surface)
export type CardFrameMode = 'on' | 'off';
export type CardFrameState = CardFrameMode | 'native';

type Ctx = { state: CardFrameState; setState: (s: CardFrameState) => void };

const Cx = createContext<Ctx | null>(null);

export function CardFrameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CardFrameState>('native');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useCardFrame(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useCardFrame must be used inside CardFrameProvider');
  return v;
}
