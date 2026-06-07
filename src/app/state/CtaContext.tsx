import React, { createContext, useContext, useState } from 'react';

// CTA rendering style toggle — mirrors TagStyleContext.
// 'auto' = each surface renders its register-native variant (via nativeMode
// on PillCTA); every other value forces every PillCTA in the app to that
// explicit mode — including surfaces whose native is 'hidden'.
//   - auto          : native per-surface default
//   - pill-filled   : filled graphite pill button
//   - pill-outline  : outline border pill button
//   - text          : muted text link with trailing arrow
//   - underline     : text with underline, no arrow
//   - rect          : sharp-edge filled rectangle (brutalist)
//   - caps          : uppercase caps with trailing arrow
//   - hidden        : suppress all CTA atoms across every surface
export type CtaStyleMode =
  | 'pill-filled'
  | 'pill-outline'
  | 'text'
  | 'underline'
  | 'rect'
  | 'caps'
  | 'hidden';

export type CtaMode = CtaStyleMode | 'auto';

type Ctx = { mode: CtaMode; setMode: (m: CtaMode) => void };

const CtaCtx = createContext<Ctx | null>(null);

export function CtaProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<CtaMode>('auto');
  return <CtaCtx.Provider value={{ mode, setMode }}>{children}</CtaCtx.Provider>;
}

export function useCta(): Ctx {
  const v = useContext(CtaCtx);
  if (!v) throw new Error('useCta must be used inside CtaProvider');
  return v;
}
