import { createContext, useContext, useState, type ReactNode } from 'react';

// F3-B rendering path — Path 1 (R3F 3D) vs Path 2 (SVG vector).
// Lives in Hero8Shell chrome per `feedback_toggles_always_in_chrome`.

export type F3BPath = 'path-1-3d' | 'path-2-svg';

type Ctx = {
  state: F3BPath;
  setState: (v: F3BPath) => void;
};

const F3BPathCtx = createContext<Ctx | null>(null);

export function F3BPathProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<F3BPath>('path-2-svg');
  return <F3BPathCtx.Provider value={{ state, setState }}>{children}</F3BPathCtx.Provider>;
}

export function useF3BPath(): Ctx {
  const v = useContext(F3BPathCtx);
  if (!v) throw new Error('useF3BPath must be used inside F3BPathProvider');
  return v;
}
