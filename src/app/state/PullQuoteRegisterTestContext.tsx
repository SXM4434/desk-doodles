import React, { createContext, useContext, useState } from 'react';

// Cycle 4 Pull quote register A/B test toggle. Scoped to Gate A Ion Shell §02 blockquote + §04 deeper-issue line.
// Six options:
//   - is-15-italic      : IS 15/400 italic / text-primary (no surgical revision; modern restraint)
//   - ise-15-italic     : ISe 15/400 italic / text-primary (surgical revisions: add ISe 15 + open italic for Pull quote scoped; serif italic at body tier — no heading competition)
//   - ise-22-upright    : ISe 22/400 upright / text-primary (post-cascade default; tier-conflicts with sub-section)
//   - ise-18-upright    : ISe 18/400 upright / text-primary (surgical revision: add ISe 18 to ladder; mid-tier serif)
//   - ise-18-italic     : ISe 18/400 italic / text-primary (Cycle 4 close lock default — surgical revisions: add ISe 18 + open italic for Pull quote scoped)
//   - ise-22-italic     : ISe 22/400 italic / text-primary (post-Tiempos-comparison candidate added 2026-05-13 — Instrument Serif is a display face below its intended size envelope at 18; 22 pushes it closer to design intent; italic differentiates from ISe 22 upright sub-section register so the original Cycle 4 tier-conflict concern doesn't actually fire)
// All variants render with 2px var(--dir-border) left rule + 16px indent (locked CSML pattern).
export type PullQuoteRegisterTest = 'is-15-italic' | 'ise-15-italic' | 'ise-22-upright' | 'ise-18-upright' | 'ise-18-italic' | 'ise-22-italic';

type ContextValue = {
  state: PullQuoteRegisterTest;
  setState: (v: PullQuoteRegisterTest) => void;
};

const PullQuoteRegisterTestContext = createContext<ContextValue>({
  state: 'ise-18-italic',
  setState: () => {},
});

export function PullQuoteRegisterTestProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<PullQuoteRegisterTest>('ise-18-italic');
  return (
    <PullQuoteRegisterTestContext.Provider value={{ state, setState }}>
      {children}
    </PullQuoteRegisterTestContext.Provider>
  );
}

export function usePullQuoteRegisterTest() {
  return useContext(PullQuoteRegisterTestContext);
}
