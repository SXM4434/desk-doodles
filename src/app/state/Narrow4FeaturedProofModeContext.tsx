import React, { createContext, useContext, useState } from 'react';

// Narrow 4 Card Register · Featured proof rendering test toggle.
// Separate from existing ProofPlacementContext (which is system-wide native/inline/bottom-strip).
// This toggle lives only on the narrow-4 featured card to A/B two compressed-proof options:
//   - native      : current behavior (stacked compressed @ IS 15/500, locked exception)
//   - inline-10   : single line @ IS 10/500, sub combined "(Slack + Canvas)"
//   - stacked-13  : stacked @ IS 13/500 (path A surgical — adds 13 to compressed proof exception)
export type Narrow4FeaturedProofMode = 'native' | 'inline-10' | 'stacked-13';

type ContextValue = {
  state: Narrow4FeaturedProofMode;
  setState: (v: Narrow4FeaturedProofMode) => void;
};

const Narrow4FeaturedProofModeContext = createContext<ContextValue>({
  state: 'inline-10',
  setState: () => {},
});

export function Narrow4FeaturedProofModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Soft-lock pick 2026-05-24 (flag #38): 'inline-10' is the soft-lock default for Narrow4 featured card proof rendering.
  // Single line @ IS 10/500/UC with sub combined inline (e.g. "Slack + Canvas"). No Type-system surgery needed
  // (vs 'stacked-13' which would add 13 to the compressed-proof exception list). Final pick stays soft until
  // Hero / Cards integration sweep can A/B in real card density contexts.
  const [state, setState] = useState<Narrow4FeaturedProofMode>('inline-10');
  return (
    <Narrow4FeaturedProofModeContext.Provider value={{ state, setState }}>
      {children}
    </Narrow4FeaturedProofModeContext.Provider>
  );
}

export function useNarrow4FeaturedProofMode() {
  return useContext(Narrow4FeaturedProofModeContext);
}
