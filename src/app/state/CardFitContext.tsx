import React, { createContext, useContext, useState } from 'react';

/**
 * Card Fit — Featured-card vertical-viewport-fit toggle.
 *
 * Opened 2026-05-26 as Hero #8 scaffolding. User-flagged observation that
 * the Narrow 4 featured card extends past the viewport, leaving the
 * page-entry register fighting for above-the-fold space with the work field.
 *
 * States:
 *   - `current` (default) — featured card renders at its native height. The
 *                            current behavior; preserves Narrow 4 Pass 4 lock.
 *   - `compact`           — featured card's MEDIA AREA shrinks via FV_A's
 *                            native mediaHeight prop. Height is computed
 *                            dynamically from window.innerHeight upstream
 *                            (in NarrowPass4CandidatePage) so it adapts to
 *                            any viewport size and updates on resize. The
 *                            card's text + proof rows render unchanged at
 *                            their authored sizes. Only the image area is
 *                            constrained. Lab artifact only; does NOT touch
 *                            the locked Project Card System spec.
 *
 * Compact-mode mechanics: NarrowPass4CandidatePage subtracts page chrome +
 * hero band (Family A only) + card content below media + bottom breathing
 * from window.innerHeight, clamps to [180, 720], and passes the result to
 * FV_A's mediaHeight prop. Updates via window resize listener so it follows
 * viewport changes.
 *
 * Boundary: lab-only research toggle. Does not lock anything; does not gate
 * any locked-system revision. If `compact` consistently outperforms `current`
 * during Hero #8 research, a Path C surgical revision to Project Card System
 * (adding a compact-featured shell with a smaller media tier) becomes a
 * candidate — but that decision is downstream of Hero #8 outcomes.
 */
export type CardFit = 'current' | 'compact';

type ContextValue = {
  state: CardFit;
  setState: (v: CardFit) => void;
};

const CardFitContext = createContext<ContextValue>({
  state: 'current',
  setState: () => {},
});

export function CardFitProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CardFit>('current');
  return (
    <CardFitContext.Provider value={{ state, setState }}>
      {children}
    </CardFitContext.Provider>
  );
}

export function useCardFit() {
  return useContext(CardFitContext);
}
