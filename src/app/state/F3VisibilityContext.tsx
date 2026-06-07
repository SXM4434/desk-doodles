import { createContext, useContext, useState, type ReactNode } from 'react';

// F3 family per-object visibility — per §8.1-B.2 composition proposal.
// Allows hiding individual objects to study composition reads. Default: all
// objects visible (empty Set = none hidden).
//
// One shared context holds two sets: F3-A desk-object ids and F3-B pin ids.
// Each cell reads only its own set. Object ids are stringly-typed to avoid
// coupling this context to the F3-A and F3-B object id unions.

type Ctx = {
  hiddenA: Set<string>;
  hiddenB: Set<string>;
  toggleA: (id: string) => void;
  toggleB: (id: string) => void;
  setHiddenA: (ids: Set<string>) => void;
  setHiddenB: (ids: Set<string>) => void;
};

const F3VisibilityCtx = createContext<Ctx | null>(null);

export function F3VisibilityProvider({ children }: { children: ReactNode }) {
  const [hiddenA, setHiddenA] = useState<Set<string>>(new Set());
  const [hiddenB, setHiddenB] = useState<Set<string>>(new Set());

  const toggleA = (id: string) =>
    setHiddenA((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleB = (id: string) =>
    setHiddenB((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <F3VisibilityCtx.Provider value={{ hiddenA, hiddenB, toggleA, toggleB, setHiddenA, setHiddenB }}>
      {children}
    </F3VisibilityCtx.Provider>
  );
}

export function useF3Visibility(): Ctx {
  const v = useContext(F3VisibilityCtx);
  if (!v) throw new Error('useF3Visibility must be used inside F3VisibilityProvider');
  return v;
}
