import React, { createContext, useContext, useState } from 'react';

// Cycle 4 inline-emphasis A/B test toggle. Scoped to body inline emphasis spots in Gate A Ion Shell.
// Four options:
//   - italic       : IS 15/400 italic (1 surgical revision: open italic IS scoped; 1 cue from body — style)
//   - bold         : IS 15/600 (1 surgical revision: sanction IS 600 inline use; 1 cue from body — weight)
//   - italic-bold  : IS 15/600 italic (2 surgical revisions: italic + 600 inline; 2 cues from body — max emphasis, editorial gold standard for highest-emphasis phrases)
//   - native       : current state
export type InlineEmphasisTest = 'italic' | 'bold' | 'italic-bold' | 'native';

type ContextValue = {
  state: InlineEmphasisTest;
  setState: (v: InlineEmphasisTest) => void;
};

const InlineEmphasisTestContext = createContext<ContextValue>({
  state: 'italic-bold',
  setState: () => {},
});

export function InlineEmphasisTestProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<InlineEmphasisTest>('italic-bold');
  return (
    <InlineEmphasisTestContext.Provider value={{ state, setState }}>
      {children}
    </InlineEmphasisTestContext.Provider>
  );
}

export function useInlineEmphasisTest() {
  return useContext(InlineEmphasisTestContext);
}
