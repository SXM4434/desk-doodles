import React, { createContext, useContext, useState } from 'react';

// EXT.E1 cluster sub-toggle: how themes get incorporated into the artifact.
//   'i'   = themes REPLACE the trait labels at the persona's lean endpoints
//   'ii'  = themes render as pill chips at lean positions
//   'iii' = themes drawn INLINE on the connector lines
// Applies to EXT.E1.V1 + EXT.E1.V3 cluster variants. Other artifacts ignore.
//
// Note: a (iv) compound-label mode was attempted 2026-05-19 and reverted same day —
// the radial-perimeter geometry structurally guarantees label-role ambiguity no
// matter what text sits in the perimeter slots. Structural fixes (horizontal
// spectrum rows / radial spectrum with theme pills) live as separate EXT.E1
// variants (.HR / .RS) — not as cluster sub-modes.

export type GateAIonS03ExtE1ThemesStyle = 'i' | 'ii' | 'iii';

type Ctx = { state: GateAIonS03ExtE1ThemesStyle; setState: (s: GateAIonS03ExtE1ThemesStyle) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonS03ExtE1ThemesStyleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonS03ExtE1ThemesStyle>('i');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonS03ExtE1ThemesStyle(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonS03ExtE1ThemesStyle must be inside GateAIonS03ExtE1ThemesStyleProvider');
  return v;
}
