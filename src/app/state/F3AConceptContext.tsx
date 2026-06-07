import { createContext, useContext, useState, type ReactNode } from 'react';

// F3-A concept selector — mirrors F3-B's concept structure but for
// horizontal-band geometry. Only Desk Scattered is built (the 8.1-A.2
// composition default); the other concepts are research candidates that
// could open in F3-A.md amendments (analogous to F3-B.md §C3).

export type F3AConcept =
  | 'desk-scattered'
  | 'pegboard-horizontal'
  | 'workbench-surface'
  | 'tool-tray'
  | 'floating-canvas-horizontal';

export type F3AConceptMeta = {
  id: F3AConcept;
  label: string;
  detail: string;
  built: boolean;
};

export const F3A_CONCEPTS: F3AConceptMeta[] = [
  {
    id: 'desk-scattered',
    label: 'Desk · Scattered',
    detail: '9 desk objects scattered across the band with -8°/+8° tilt. 8.1-A.2 default lean.',
    built: true,
  },
  {
    id: 'pegboard-horizontal',
    label: 'Pegboard · Horizontal',
    detail: 'Tools mounted on a horizontal pegboard strip. Research candidate; no 8.1-A.* amendment yet.',
    built: false,
  },
  {
    id: 'workbench-surface',
    label: 'Workbench surface',
    detail: 'Top-down view of a workbench surface with objects laid out. Research candidate.',
    built: false,
  },
  {
    id: 'tool-tray',
    label: 'Tool tray',
    detail: 'Horizontal tray with tools arranged left-to-right. Research candidate.',
    built: false,
  },
  {
    id: 'floating-canvas-horizontal',
    label: 'Floating Canvas · Horizontal',
    detail: 'NO surface — objects float across the band space. Mirror of F3-B Floating Canvas. Research candidate.',
    built: false,
  },
];

type Ctx = {
  state: F3AConcept;
  setState: (v: F3AConcept) => void;
};

const F3AConceptCtx = createContext<Ctx | null>(null);

export function F3AConceptProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<F3AConcept>('desk-scattered');
  return <F3AConceptCtx.Provider value={{ state, setState }}>{children}</F3AConceptCtx.Provider>;
}

export function useF3AConcept(): Ctx {
  const v = useContext(F3AConceptCtx);
  if (!v) throw new Error('useF3AConcept must be used inside F3AConceptProvider');
  return v;
}
