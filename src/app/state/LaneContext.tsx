import React, { createContext, useContext, useState } from 'react';

export type Lane = 'all' | 't1' | 't2' | 't3' | 't4' | 't5a' | 't5b' | 't5c';

type Ctx = { lane: Lane; setLane: (l: Lane) => void };

const LaneCtx = createContext<Ctx | null>(null);

export function LaneProvider({ children }: { children: React.ReactNode }) {
  const [lane, setLane] = useState<Lane>('all');
  return <LaneCtx.Provider value={{ lane, setLane }}>{children}</LaneCtx.Provider>;
}

export function useLane(): Ctx {
  const v = useContext(LaneCtx);
  if (!v) throw new Error('useLane must be used inside LaneProvider');
  return v;
}
