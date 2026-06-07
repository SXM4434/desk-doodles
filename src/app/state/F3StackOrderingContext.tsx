import { createContext, useContext, useState, type ReactNode } from 'react';

// F3 family stack ordering — cell-aware state per A and B (independent).
// Same id type (A/B/C/D) but per-cell interpretations:
//
// F3-A (horizontal band):
//   A · text-then-scene     — eyebrow + title above the band; canvas below
//   B · scene-then-text     — canvas above; eyebrow + title below the band
//   C · text-overlay        — eyebrow + title overlaid on top of the canvas
//   D · side-by-side        — eyebrow + title on left; canvas on right (band geometry)
//
// F3-B (vertical column · per F3-B.md §E5):
//   A · text-then-scene     — eyebrow → title → body → scene (text on top)
//   B · scene-mid           — eyebrow → title → scene → body (scene in middle)
//   C · scene-first DEFAULT — scene → eyebrow → title → body (aninguyenle pattern)
//   D · co-anchored         — scene + eyebrow side-by-side at top; title + body below

export type F3StackOrdering = 'a' | 'b' | 'c' | 'd';

export type F3StackOrderingMeta = {
  id: F3StackOrdering;
  label: string;
  detailA: string;
  detailB: string;
};

export const F3_STACK_ORDERINGS: F3StackOrderingMeta[] = [
  {
    id: 'a',
    label: 'A · text-then-scene',
    detailA: 'F3-A: eyebrow + title above the desk canvas. Editorial top-stack.',
    detailB: 'F3-B: eyebrow + title + body at top; scene at bottom. Editorial register.',
  },
  {
    id: 'b',
    label: 'B · scene-then-text',
    detailA: 'F3-A: desk canvas above; eyebrow + title below the band. Scene-first read.',
    detailB: 'F3-B: eyebrow + title above; scene in middle; body below. Scene interrupts.',
  },
  {
    id: 'c',
    label: 'C · scene-first',
    detailA: 'F3-A: text overlaid on the canvas (cinematic single-frame composition).',
    detailB: 'F3-B default: scene at top; eyebrow + title + body below. Matches aninguyenle + F-pattern.',
  },
  {
    id: 'd',
    label: 'D · co-anchored',
    detailA: 'F3-A: text on left, canvas on right (banded side-by-side composition).',
    detailB: 'F3-B: scene + eyebrow side-by-side at top; title + body below. Tightest cluster.',
  },
];

type Ctx = {
  stateA: F3StackOrdering;
  stateB: F3StackOrdering;
  setStateA: (v: F3StackOrdering) => void;
  setStateB: (v: F3StackOrdering) => void;
};

const F3StackOrderingCtx = createContext<Ctx | null>(null);

export function F3StackOrderingProvider({ children }: { children: ReactNode }) {
  // F3-A default = 'a' (text-then-scene) per the current scaffold (eyebrow + title above canvas).
  // F3-B default = 'c' (scene-first) per §E5 lock.
  const [stateA, setStateA] = useState<F3StackOrdering>('a');
  const [stateB, setStateB] = useState<F3StackOrdering>('c');
  return (
    <F3StackOrderingCtx.Provider value={{ stateA, stateB, setStateA, setStateB }}>
      {children}
    </F3StackOrderingCtx.Provider>
  );
}

export function useF3StackOrdering(): Ctx {
  const v = useContext(F3StackOrderingCtx);
  if (!v) throw new Error('useF3StackOrdering must be used inside F3StackOrderingProvider');
  return v;
}
