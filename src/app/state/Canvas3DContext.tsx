import { createContext, useContext, useState, type ReactNode } from 'react';
import type { GeometryModeSetting } from '../lib/geometry3d/strokeTo3d';

// Canvas 3D controls — geometry mode + the 3D style slot.
//
// Pattern-copy of F3SvgStyleContext (the house context template), per
// docs/design/3d-roundtrip-build-plan.md §2.4. Per the D-7 locked control
// model (docs/design/global-toggles-and-mixed-3d.md): the geometry control is
// Auto / Rod / Extrude / Inflate / Solid — "Auto" is just the default VALUE
// (the shape decides: open → rod, closed → extrude); set Rod and ALL strokes
// are rods. FULL control set, never trimmed (feedback_more_toggle_options_better).
//
// The 3D STYLE slot is 'native' only for now — per-style twins land after M8
// (D-4: port from free-stroke style-system.ts). The slot exists so the wiring
// layer doesn't change shape when styles arrive; chrome renders NO style pills
// until there are ≥2 REAL options (project_f3_styles_must_all_be_real — no
// single-option pill groups, no stubs).

export type Style3D = 'native';

export type GeometryModeMeta = {
  id: GeometryModeSetting;
  label: string;
  detail: string;
};

/** Chrome pill inventory — the FULL set, in locked order (D-7). */
export const GEOMETRY_MODE_OPTIONS: GeometryModeMeta[] = [
  { id: 'auto',    label: 'Auto',    detail: 'Shape decides: open stroke → rod, closed stroke → extrude.' },
  { id: 'rod',     label: 'Rod',     detail: 'Every stroke becomes an ink tube with rounded caps + joint blobs.' },
  { id: 'extrude', label: 'Extrude', detail: 'Closed regions become bevelled slabs; degenerate loops fall back to rod.' },
  { id: 'inflate', label: 'Inflate', detail: 'Swept capsule — tapered tips, full middle, pressure-modulated.' },
  { id: 'solid',   label: 'Solid',   detail: 'Whole drawing rasterized + marched into ONE watertight mass.' },
];

type Ctx = {
  geometryMode: GeometryModeSetting;
  setGeometryMode: (m: GeometryModeSetting) => void;
  style3d: Style3D;
  setStyle3d: (s: Style3D) => void;
};

const Canvas3DCtx = createContext<Ctx | null>(null);

/** Safe defaults for hosts that mount DrawSurface OUTSIDE the provider
 *  (the /desk DrawPanel popup). When the main thread swaps DrawSurface's 3D
 *  honesty gate to read useCanvas3D(), /desk keeps working on these instead
 *  of throwing — 'auto' + 'native' are the locked defaults either way. */
const UNPROVIDED_DEFAULTS: Ctx = {
  geometryMode: 'auto',
  setGeometryMode: () => {},
  style3d: 'native',
  setStyle3d: () => {},
};

export function Canvas3DProvider({ children }: { children: ReactNode }) {
  const [geometryMode, setGeometryMode] = useState<GeometryModeSetting>('auto');
  const [style3d, setStyle3d] = useState<Style3D>('native');
  return (
    <Canvas3DCtx.Provider value={{ geometryMode, setGeometryMode, style3d, setStyle3d }}>
      {children}
    </Canvas3DCtx.Provider>
  );
}

/** Unlike the house template this does NOT throw when unprovided — see
 *  UNPROVIDED_DEFAULTS (deliberate: the same DrawSurface mounts under both
 *  /canvas, which has the provider, and the /desk DrawPanel, which doesn't). */
export function useCanvas3D(): Ctx {
  return useContext(Canvas3DCtx) ?? UNPROVIDED_DEFAULTS;
}
