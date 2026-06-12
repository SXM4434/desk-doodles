import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { GeometryModeSetting } from '../lib/geometry3d/strokeTo3d';
import {
  DEFAULT_MODE3D_PARAMS,
  type ExtrudeParams3D,
  type InflateParams3D,
  type Mode3DParams,
  type RodParams3D,
  type SolidParams3D,
} from '../components/canvas3d/modeParams';
import {
  MODE_MATERIAL_DEFAULTS_3D,
  type MaterialPresetId,
} from '../components/canvas3d/materials3d';

// Canvas 3D controls — geometry mode + 3D style + per-mode param sets.
//
// Pattern-copy of F3SvgStyleContext (the house context template), extended for
// the round-7 chrome split (docs/design/3d-mode-controls-spec.md — THE
// contract; every range/default in modeParams.ts). Per the D-7 locked control
// model (docs/design/global-toggles-and-mixed-3d.md): the geometry control is
// Auto / Rod / Extrude / Inflate / Solid — "Auto" is just the default VALUE
// (the shape decides: open → rod, closed → extrude); set Rod and ALL strokes
// are rods. FULL control set, never trimmed (feedback_more_toggle_options_better).
//
// The 3D STYLE dropdown ships three REAL options (spec §3, no stubs per
// project_f3_styles_must_all_be_real): Native (lit material presets) · Hatch
// (procedural band-quantized hachure reading the LIVE 2D Shading sliders) ·
// SVG-port (M8 v1 — the 2D-treatment-on-3D bridge; the full 2D chrome mounts
// under it). AI mode = round-8 reserved slot, nothing visible (spec §2.5).
//
// MATERIAL OVERRIDE RULE (FS materialUserOverride, ported verbatim): switching
// geometry modes applies MODE_MATERIAL_DEFAULTS_3D ONLY while the user hasn't
// explicitly picked a material; an explicit pick survives every mode switch
// (I-1 spirit in FS's own code, spec §3).
//
// NOTE: type-only import from lib/geometry3d (erased at compile) + value
// imports ONLY from the pure canvas3d data modules — nothing here may pull
// `three` into the main chunk (the React.lazy split in DeskDoodlesCanvas).

export type Style3D = 'native' | 'hatch' | 'svg-port';

export type Style3DMeta = {
  id: Style3D;
  label: string;
  detail: string;
};

/** Chrome dropdown inventory — three real styles, locked order (spec §3). */
export const STYLE3D_OPTIONS: Style3DMeta[] = [
  {
    id: 'native',
    label: 'Native',
    detail: 'Lit physical material — the clay/ink object read. Material presets below.',
  },
  {
    id: 'hatch',
    label: 'Hatch',
    detail: 'Band-quantized procedural hachure driven by the LIVE 2D Shading sliders — one math, two renderers.',
  },
  {
    id: 'svg-port',
    label: 'SVG-port',
    detail: 'The 2D treatment on the 3D form (M8 v1) — the full 2D chrome drives it.',
  },
];

export type GeometryModeMeta = {
  id: GeometryModeSetting;
  label: string;
  detail: string;
};

/** Chrome inventory — the FULL set, in locked order (D-7). */
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
  /** Active Native material (resolved: user pick if overridden, else the
   *  FS per-mode default for the current geometry mode). */
  materialPreset: MaterialPresetId;
  /** Explicit user pick — sets materialUserOverride (survives mode switches). */
  setMaterialPreset: (m: MaterialPresetId) => void;
  /** True once the user explicitly picked a material. */
  materialUserOverride: boolean;
  /** Per-geometry-mode param sets (spec §2 — full, never trimmed). */
  modeParams: Mode3DParams;
  setRodParams: (p: Partial<RodParams3D>) => void;
  setExtrudeParams: (p: Partial<ExtrudeParams3D>) => void;
  setInflateParams: (p: Partial<InflateParams3D>) => void;
  setSolidParams: (p: Partial<SolidParams3D>) => void;
};

const Canvas3DCtx = createContext<Ctx | null>(null);

/** Safe defaults for hosts that mount DrawSurface OUTSIDE the provider
 *  (the /desk DrawPanel popup). When the main thread swaps DrawSurface's 3D
 *  honesty gate to read useCanvas3D(), /desk keeps working on these instead
 *  of throwing — the locked defaults either way. */
const UNPROVIDED_DEFAULTS: Ctx = {
  geometryMode: 'auto',
  setGeometryMode: () => {},
  style3d: 'native',
  setStyle3d: () => {},
  materialPreset: MODE_MATERIAL_DEFAULTS_3D.auto,
  setMaterialPreset: () => {},
  materialUserOverride: false,
  modeParams: DEFAULT_MODE3D_PARAMS,
  setRodParams: () => {},
  setExtrudeParams: () => {},
  setInflateParams: () => {},
  setSolidParams: () => {},
};

export function Canvas3DProvider({ children }: { children: ReactNode }) {
  const [geometryMode, setGeometryModeRaw] = useState<GeometryModeSetting>('auto');
  const [style3d, setStyle3d] = useState<Style3D>('native');
  const [materialPick, setMaterialPick] = useState<MaterialPresetId | null>(null); // null = no override
  const [modeParams, setModeParams] = useState<Mode3DParams>(DEFAULT_MODE3D_PARAMS);

  // FS materialUserOverride semantics: mode switches re-default the material
  // ONLY while no explicit pick exists. The pick is stored, not the default —
  // so un-overridden state keeps following the mode.
  const setGeometryMode = useCallback((m: GeometryModeSetting) => {
    setGeometryModeRaw(m);
  }, []);

  const setMaterialPreset = useCallback((m: MaterialPresetId) => {
    setMaterialPick(m);
  }, []);

  const materialPreset = materialPick ?? MODE_MATERIAL_DEFAULTS_3D[geometryMode];

  const setRodParams = useCallback((p: Partial<RodParams3D>) => {
    setModeParams((prev) => ({ ...prev, rod: { ...prev.rod, ...p } }));
  }, []);
  const setExtrudeParams = useCallback((p: Partial<ExtrudeParams3D>) => {
    setModeParams((prev) => ({ ...prev, extrude: { ...prev.extrude, ...p } }));
  }, []);
  const setInflateParams = useCallback((p: Partial<InflateParams3D>) => {
    setModeParams((prev) => ({ ...prev, inflate: { ...prev.inflate, ...p } }));
  }, []);
  const setSolidParams = useCallback((p: Partial<SolidParams3D>) => {
    setModeParams((prev) => ({ ...prev, solid: { ...prev.solid, ...p } }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      geometryMode,
      setGeometryMode,
      style3d,
      setStyle3d,
      materialPreset,
      setMaterialPreset,
      materialUserOverride: materialPick !== null,
      modeParams,
      setRodParams,
      setExtrudeParams,
      setInflateParams,
      setSolidParams,
    }),
    [
      geometryMode,
      setGeometryMode,
      style3d,
      materialPreset,
      setMaterialPreset,
      materialPick,
      modeParams,
      setRodParams,
      setExtrudeParams,
      setInflateParams,
      setSolidParams,
    ],
  );

  return <Canvas3DCtx.Provider value={value}>{children}</Canvas3DCtx.Provider>;
}

/** Unlike the house template this does NOT throw when unprovided — see
 *  UNPROVIDED_DEFAULTS (deliberate: the same DrawSurface mounts under both
 *  /canvas, which has the provider, and the /desk DrawPanel, which doesn't). */
export function useCanvas3D(): Ctx {
  return useContext(Canvas3DCtx) ?? UNPROVIDED_DEFAULTS;
}
