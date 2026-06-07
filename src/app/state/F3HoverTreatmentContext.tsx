import { createContext, useContext, useState, type ReactNode } from 'react';

// F3 family hover treatment — per §8.1-B.2 composition proposal.
// Applies to both F3-A (desk objects) and F3-B (trophy wall pins).
// Default 'all' = scale + loosen + glow combined.

export type F3HoverTreatment = 'scale' | 'loosen' | 'glow' | 'all';

type Ctx = {
  state: F3HoverTreatment;
  setState: (v: F3HoverTreatment) => void;
};

const F3HoverTreatmentCtx = createContext<Ctx | null>(null);

export function F3HoverTreatmentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<F3HoverTreatment>('all');
  return <F3HoverTreatmentCtx.Provider value={{ state, setState }}>{children}</F3HoverTreatmentCtx.Provider>;
}

export function useF3HoverTreatment(): Ctx {
  const v = useContext(F3HoverTreatmentCtx);
  if (!v) throw new Error('useF3HoverTreatment must be used inside F3HoverTreatmentProvider');
  return v;
}

// Helpers to determine which effects apply at the active treatment.
export function hoverHasScale(t: F3HoverTreatment): boolean {
  return t === 'scale' || t === 'all';
}
export function hoverHasLoosen(t: F3HoverTreatment): boolean {
  return t === 'loosen' || t === 'all';
}
export function hoverHasGlow(t: F3HoverTreatment): boolean {
  return t === 'glow' || t === 'all';
}
