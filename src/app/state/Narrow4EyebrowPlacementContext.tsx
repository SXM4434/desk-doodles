import React, { createContext, useContext, useState } from 'react';

export type EyebrowPlacement = 'option-a' | 'option-b';

type ContextValue = {
  state: EyebrowPlacement;
  setState: (v: EyebrowPlacement) => void;
};

const Narrow4EyebrowPlacementContext = createContext<ContextValue>({
  state: 'option-b',
  setState: () => {},
});

export function Narrow4EyebrowPlacementProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<EyebrowPlacement>('option-b');
  return (
    <Narrow4EyebrowPlacementContext.Provider value={{ state, setState }}>
      {children}
    </Narrow4EyebrowPlacementContext.Provider>
  );
}

export function useNarrow4EyebrowPlacement() {
  return useContext(Narrow4EyebrowPlacementContext);
}
