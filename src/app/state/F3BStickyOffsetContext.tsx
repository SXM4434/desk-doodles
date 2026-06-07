import { createContext, useContext, useState, type ReactNode } from 'react';

// F3-B sticky offset — `top: Npx` value for the F3_B_HeroZone <aside>. Per
// §8.1-B.2 composition proposal toggle inventory. F3-B only because F3-A is
// a natural-flow horizontal band (no sticky behavior).

export type F3BStickyOffset = 0 | 16 | 32 | 64 | 96;

export const F3B_STICKY_OFFSETS: F3BStickyOffset[] = [0, 16, 32, 64, 96];

type Ctx = {
  state: F3BStickyOffset;
  setState: (v: F3BStickyOffset) => void;
};

const F3BStickyOffsetCtx = createContext<Ctx | null>(null);

export function F3BStickyOffsetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<F3BStickyOffset>(32);
  return <F3BStickyOffsetCtx.Provider value={{ state, setState }}>{children}</F3BStickyOffsetCtx.Provider>;
}

export function useF3BStickyOffset(): Ctx {
  const v = useContext(F3BStickyOffsetCtx);
  if (!v) throw new Error('useF3BStickyOffset must be used inside F3BStickyOffsetProvider');
  return v;
}
