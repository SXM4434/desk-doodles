import { createContext, useContext, useState, type ReactNode } from 'react';

// F3 family entrance stagger — controls per-object animation-delay cascade
// on first reveal. Off = all arrive together; Subtle/Medium/Pronounced =
// staggered cascade with increasing delay. Used by F3-A desk scene AND
// F3-B trophy wall / floating canvas. Extended from F3-B-only to whole F3
// family per user direction 2026-05-29.

export type F3EntranceStagger = 'off' | 'subtle' | 'medium' | 'pronounced';

// Milliseconds delay between consecutive objects.
export const STAGGER_MS: Record<F3EntranceStagger, number> = {
  off: 0,
  subtle: 60,
  medium: 110,
  pronounced: 200,
};

type Ctx = {
  state: F3EntranceStagger;
  setState: (v: F3EntranceStagger) => void;
};

const F3EntranceStaggerCtx = createContext<Ctx | null>(null);

export function F3EntranceStaggerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<F3EntranceStagger>('medium');
  return (
    <F3EntranceStaggerCtx.Provider value={{ state, setState }}>
      {children}
    </F3EntranceStaggerCtx.Provider>
  );
}

export function useF3EntranceStagger(): Ctx {
  const v = useContext(F3EntranceStaggerCtx);
  if (!v) throw new Error('useF3EntranceStagger must be used inside F3EntranceStaggerProvider');
  return v;
}
