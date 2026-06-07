import React, { createContext, useContext, useState } from 'react';

// Narrow-4 standard-card proof override.
//   - native : honor each project's payload guard. Real proof shows
//              (Ion); em-dash placeholders suppress (Elara/Canopi/IYNA/
//              GARDENS).
//   - on     : force the inline proof line on every standard, even when
//              data is placeholder.
//   - off    : suppress the proof on every standard regardless.
export type StandardProofMode = 'native' | 'on' | 'off';

type Ctx = {
  state: StandardProofMode;
  setState: (s: StandardProofMode) => void;
};

const Cx = createContext<Ctx | null>(null);

export function StandardProofModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<StandardProofMode>('native');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useStandardProofMode(): Ctx {
  const v = useContext(Cx);
  if (!v)
    throw new Error(
      'useStandardProofMode must be used inside StandardProofModeProvider',
    );
  return v;
}
