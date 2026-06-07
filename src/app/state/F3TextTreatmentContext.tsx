import { createContext, useContext, useState, type ReactNode } from 'react';

// F3 family hero text treatment — controls how the identity text stack is
// rendered alongside the scene. Per user direction 2026-05-31 — different
// established hero patterns from references like Bill Guo (multi-body) vs
// our current standard hero (eyebrow + title + body).
//
// State is PER-CELL (A and B independent) so Family A can use Standard while
// Family B uses Multi-body, or vice versa.

export type F3TextTreatment = 'standard' | 'title-only' | 'multi-body' | 'title-lead' | 'caption';

export type F3TextTreatmentMeta = {
  id: F3TextTreatment;
  label: string;
  detail: string;
};

export const F3_TEXT_TREATMENTS: F3TextTreatmentMeta[] = [
  {
    id: 'standard',
    label: 'Standard',
    detail: 'Eyebrow + title + body. Default — single body paragraph beneath title.',
  },
  {
    id: 'title-only',
    label: 'Title only',
    detail: 'Just the big title. No eyebrow, no body. Scene carries the rest.',
  },
  {
    id: 'multi-body',
    label: 'Multi-body · Bill Guo',
    detail: 'Eyebrow + title + TWO body paragraphs (Profile + Approach). Bill Guo–style stacked-block read.',
  },
  {
    id: 'title-lead',
    label: 'Title + lead',
    detail: 'Big title + a single longer lead paragraph. No eyebrow.',
  },
  {
    id: 'caption',
    label: 'Caption',
    detail: 'Small eyebrow + small title only. For when the scene IS the hero.',
  },
];

type Ctx = {
  stateA: F3TextTreatment;
  stateB: F3TextTreatment;
  setStateA: (v: F3TextTreatment) => void;
  setStateB: (v: F3TextTreatment) => void;
};

const F3TextTreatmentCtx = createContext<Ctx | null>(null);

export function F3TextTreatmentProvider({ children }: { children: ReactNode }) {
  const [stateA, setStateA] = useState<F3TextTreatment>('standard');
  const [stateB, setStateB] = useState<F3TextTreatment>('standard');
  return (
    <F3TextTreatmentCtx.Provider value={{ stateA, stateB, setStateA, setStateB }}>
      {children}
    </F3TextTreatmentCtx.Provider>
  );
}

export function useF3TextTreatment(): Ctx {
  const v = useContext(F3TextTreatmentCtx);
  if (!v) throw new Error('useF3TextTreatment must be used inside F3TextTreatmentProvider');
  return v;
}

// Profile block — block 1 of the multi-body treatment (per research §3 +
// Bill Guo's "blocks-as-sections" pattern). Per-cell content because F3-A's
// hero band carries manifesto register and F3-B's identity column carries
// caption register.
export const F3_A_PROFILE_TEXT =
  'I design at the seam where tools meet teams. From research synthesis to interaction architecture, I help teams ship clearer workflows.';

export const F3_B_PROFILE_TEXT =
  'Product designer working at the seam between tools and teams. Research-led, systems-minded, prototype-driven.';

// Approach block — block 2 of the multi-body treatment.
export const F3_A_APPROACH_TEXT =
  'Systems first, then craft. I document why decisions land, build prototypes that survive real use, and ship outcomes — not just artifacts.';

export const F3_B_APPROACH_TEXT =
  'I care about the small decisions that scale — systematic details, micro-interactions, and experiences that bring delight.';

// Lead body texts for the title-lead treatment — longer single paragraphs.
export const F3_A_LEAD_TEXT =
  'I design at the seam where tools meet teams. From research synthesis to interaction architecture, I help teams ship clearer workflows. Systems first, craft second, outcomes always.';

export const F3_B_LEAD_TEXT =
  'I create cohesive systems and experiences across interface, brand, and interactions — focusing on the small decisions that scale.';
