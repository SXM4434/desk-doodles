import React, { createContext, useContext, useState } from 'react';

export type MediaTruth = 'structural-placeholder' | 'real-asset';

type Ctx = { mode: MediaTruth; setMode: (m: MediaTruth) => void };

const MediaCtx = createContext<Ctx | null>(null);

export function MediaTruthProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<MediaTruth>('real-asset');
  return <MediaCtx.Provider value={{ mode, setMode }}>{children}</MediaCtx.Provider>;
}

export function useMediaTruth(): Ctx {
  const v = useContext(MediaCtx);
  if (!v) throw new Error('useMediaTruth must be used inside MediaTruthProvider');
  return v;
}
