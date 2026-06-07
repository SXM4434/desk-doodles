import { createContext, useContext, useState, type ReactNode } from 'react';

// F3 family tilt range — controls the -X°/+X° spread of object rotation.
// Used by F3-A desk scene AND F3-B trophy wall / floating canvas. Tight =
// restrained read; Wide = collage-chaos read. Per §8.1-B.2 composition
// proposal toggle inventory · extended to F3-A per user direction 2026-05-29.

export type F3TiltRange = 'tight' | 'medium' | 'wide';

// Degrees for the maximum tilt magnitude (-N° to +N°).
export const TILT_RANGE_DEGREES: Record<F3TiltRange, number> = {
  tight: 3,
  medium: 8,
  wide: 15,
};

type Ctx = {
  state: F3TiltRange;
  setState: (v: F3TiltRange) => void;
};

const F3TiltRangeCtx = createContext<Ctx | null>(null);

export function F3TiltRangeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<F3TiltRange>('medium');
  return <F3TiltRangeCtx.Provider value={{ state, setState }}>{children}</F3TiltRangeCtx.Provider>;
}

export function useF3TiltRange(): Ctx {
  const v = useContext(F3TiltRangeCtx);
  if (!v) throw new Error('useF3TiltRange must be used inside F3TiltRangeProvider');
  return v;
}

// Scale a base tilt (degrees) into the active tilt range.
// Each object's base tilt is authored against MEDIUM (±8°); this maps that
// base into the configured max-magnitude.
export function scaleTilt(baseTiltDegrees: number, range: F3TiltRange): number {
  const baseMag = 8;
  const target = TILT_RANGE_DEGREES[range];
  return (baseTiltDegrees / baseMag) * target;
}
