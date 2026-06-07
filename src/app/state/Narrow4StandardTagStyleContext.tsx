import React, { createContext, useContext, useState } from 'react';
import type { TagStyleMode } from './TagStyleContext';

// Narrow-4 standard-card tag-style override.
//   - native        : honor SV-A's authored TagList nativeMode (pill-outline)
//   - pill-outline  : Ion-style rounded border chip (matches native; explicit lock)
//   - pill-filled   : muted-bg filled chip (softer weight)
//   - slash         : inline caps separated by " / " (no chrome)
//   - dot           : inline caps separated by " · " (no chrome)
//   - bracket       : [Tag] [Tag] inline (dossier register)
//   - underline     : inline words with underline
//   - typeTag       : single medium chip — project.typeTag only (sparse)
//   - hidden        : suppress TagList on standards entirely
//
// Scope: applies only to SV-A renders inside narrow-4 surfaces (candidate
// page + family gallery). Featured FV-A foot=2-col tags are unaffected.
export type Narrow4StandardTagStyle = 'native' | TagStyleMode;

type Ctx = {
  state: Narrow4StandardTagStyle;
  setState: (s: Narrow4StandardTagStyle) => void;
};

const Cx = createContext<Ctx | null>(null);

export function Narrow4StandardTagStyleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<Narrow4StandardTagStyle>('native');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useNarrow4StandardTagStyle(): Ctx {
  const v = useContext(Cx);
  if (!v)
    throw new Error(
      'useNarrow4StandardTagStyle must be used inside Narrow4StandardTagStyleProvider',
    );
  return v;
}
