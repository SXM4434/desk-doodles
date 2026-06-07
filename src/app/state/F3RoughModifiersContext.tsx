import { createContext, useContext, useState, type ReactNode } from 'react';

// F3 SVG style modifier state — refactored 2026-06-01 per user direction.
//
// Continuous modifiers store NUMBERS (consumed by sliders in chrome).
// Discrete modifiers store ENUM STRINGS (consumed by dropdowns).
//
// Each style defines its own modifier set via STYLE_MODIFIER_SETS in
// SvgStyleTransform — chrome renders dynamically based on active style.

// ─── DISCRETE TYPES (dropdowns) ────────────────────────────────────────────

export type MultiStrokeStep =
  | 'off' | 'single' | 'double' | 'triple' | 'quad' | 'quint' | 'six' | 'heavy';
export const MULTI_STROKE_STEPS: MultiStrokeStep[] =
  ['off', 'single', 'double', 'triple', 'quad', 'quint', 'six', 'heavy'];

export type FillStyleStep =
  | 'none' | 'solid' | 'hachure' | 'cross-hatch' | 'dots' | 'zigzag' | 'dashed' | 'zigzag-line';
export const FILL_STYLE_STEPS: FillStyleStep[] =
  ['none', 'solid', 'hachure', 'cross-hatch', 'dots', 'zigzag', 'dashed', 'zigzag-line'];

export type PaletteModeStep =
  | 'source' | 'primary' | 'body' | 'body-soft' | 'secondary' | 'detail' | 'accent' | 'bg' | 'neutral' | 'inverted';
export const PALETTE_MODE_STEPS: PaletteModeStep[] =
  ['source', 'primary', 'body', 'body-soft', 'secondary', 'detail', 'accent', 'bg', 'neutral', 'inverted'];

// 10 SVG filter recipes ported from playground gate-a-ion-texture-and-pen-tip-research §3.
export type TextureStep =
  | 'none' | 'light' | 'heavy' | 'chalky' | 'paper-tooth' | 'ribbed' | 'stipple' | 'wet-ink' | 'smudge' | 'canvas';
export const TEXTURE_STEPS: TextureStep[] =
  ['none', 'light', 'heavy', 'chalky', 'paper-tooth', 'ribbed', 'stipple', 'wet-ink', 'smudge', 'canvas'];

// Dot pattern — for stipple / newsprint styles.
export type DotPatternStep = 'grid' | 'staggered' | 'random' | 'concentric';
export const DOT_PATTERN_STEPS: DotPatternStep[] = ['grid', 'staggered', 'random', 'concentric'];

// Endpoint corner treatment (ported from playground C3HandFeel.endpointBehavior).
export type EndpointBehaviorStep = 'clean' | 'protrude' | 'long-overshoot' | 'kink';
export const ENDPOINT_BEHAVIOR_STEPS: EndpointBehaviorStep[] = ['clean', 'protrude', 'long-overshoot', 'kink'];

// Multi-stroke layer pacing (ported from playground C3HandFeel.sketchingStyle).
export type SketchingStyleStep = 'single-pass' | 'loose-overlap' | 'parallel-pass' | 'cross-hatch';
export const SKETCHING_STYLE_STEPS: SketchingStyleStep[] = ['single-pass', 'loose-overlap', 'parallel-pass', 'cross-hatch'];

// Pen-tip preset (ported from playground PEN_TIP_PRESETS).
// 'plain' = no pen-tip variation (default rough.js stroke).
// Others use perfect-freehand for variable-width / textured strokes.
// Implementation note: penTip != 'plain' replaces rough.js's stroke render with
// perfect-freehand polygon paths. Substantial render path change — for now
// non-plain values may be approximated until full perfect-freehand integration.
export type PenTipStep =
  | 'plain' | 'ballpoint' | 'fineliner' | 'pencil-hb' | 'pencil-2b' | 'felt-tip' | 'chisel' | 'charcoal';
export const PEN_TIP_STEPS: PenTipStep[] = ['plain', 'ballpoint', 'fineliner', 'pencil-hb', 'pencil-2b', 'felt-tip', 'chisel', 'charcoal'];

// PARKED 2026-06-03: ShadingScopeStep removed (over-shading 3-band approach reverted).
// Smart Hachure System redesign in progress — see Task #22.

// ─── NUMERIC MODIFIER STATE (sliders) ──────────────────────────────────────

export type F3ModifiersState = {
  // Universal numeric modifiers (multiple styles use these)
  /** Master proportion-preserving multiplier on HAND_FEEL_BASE per shape.
   *  0 = no jitter (clean baseline), 1.0 = playground calibration, 2.0 = doubly
   *  wobbly while preserving per-shape ratios (rect:oval:diamond:line:orthogonal).
   *  > 1.4 enters Excalidraw signature zone (chrome warn). Added 2026-06-04 per
   *  09-LOCKED-MODEL.md I-11 to restore playground's master dial. */
  wobble: number;           // 0 - 2
  roughness: number;        // 0 - 12
  bowing: number;           // 0 - 5
  strokeWidth: number;      // 0.1 - 10
  curveTightness: number;   // 0 - 2
  simplification: number;   // 0 - 1   (rough.js: only affects path-based input)
  hachureGap: number;       // 0.5 - 30
  hachureAngle: number;     // -90 - 90
  fillDensity: number;      // 0 - 3
  inkIntensity: number;     // 0 - 1   (applied as wrapper opacity)
  fillOpacity: number;      // 0 - 1   (applied via CSS var on inner fills)

  // Style-specific numeric modifiers
  blurAmount: number;       // 0 - 5   — wet-ink
  bleed: number;            // 0 - 1   — wet-ink (saturation drop)
  dotSize: number;          // 0.5 - 10 — stipple, newsprint
  dotSpacing: number;       // 1 - 30   — stipple, newsprint
  dotScatter: number;       // 0 - 1   — stipple
  grainIntensity: number;   // 0 - 5   — charcoal (feTurbulence scale)
  smudgeAmount: number;     // 0 - 5   — charcoal (asymmetric displacement)
  pressureVariance: number; // 0 - 1   — charcoal (stroke width variance)
  offsetDistance: number;   // 0 - 20  — risograph
  offsetAngle: number;      // -180 - 180 — risograph
  colorShift: number;       // 0 - 1   — risograph (saturation of secondary layer)
  /** Risograph secondary-layer color (§7.B-3). Was hardcoded #D4574A; now
   *  user-pickable from the palette token set. 'source' falls back to accent. */
  risoSecondaryColor: PaletteModeStep;
  registrationError: number;// 0 - 5   — risograph (random per-layer offset)
  /** Multiplies the active texture's displacement scale. 1 = playground baseline,
   *  0 = effectively off, 3 = very heavy. Universal modifier — affects whatever
   *  texture is selected. Lets the user dial light/medium/heavy on any texture. */
  textureIntensity: number; // 0 - 3   — multiplier on the active texture's scale

  // Discrete modifiers
  multiStroke: MultiStrokeStep;
  fillStyle: FillStyleStep;
  /** @deprecated kept for back-compat; new code uses strokePalette + fillPalette */
  paletteMode: PaletteModeStep;
  /** Stroke (outline) color override. 'source' = use SVG source color. */
  strokePalette: PaletteModeStep;
  /** Fill color override (affects fills + hachure-as-fill strokes). */
  fillPalette: PaletteModeStep;
  texture: TextureStep;
  dotPattern: DotPatternStep;
  // Playground-ported hand-feel toggles
  endpointBehavior: EndpointBehaviorStep;
  sketchingStyle: SketchingStyleStep;
  penTip: PenTipStep;
};

// Defaults match the rough-handdrawn preset baseline (other styles override
// when active — but state persists across style switches).
const DEFAULT: F3ModifiersState = {
  wobble: 1.0,              // Playground calibration baseline (I-11)
  roughness: 1.6,
  bowing: 1.0,
  strokeWidth: 1.2,
  curveTightness: 0,
  simplification: 0,
  hachureGap: 4,
  hachureAngle: -41,
  fillDensity: 0.7,
  inkIntensity: 1.0,
  fillOpacity: 1.0,

  blurAmount: 0.4,
  bleed: 0,
  dotSize: 1.0,
  dotSpacing: 4,
  dotScatter: 0.3,
  grainIntensity: 2.5,
  smudgeAmount: 0,
  pressureVariance: 0,
  offsetDistance: 2,
  offsetAngle: 45,
  colorShift: 0.7,
  risoSecondaryColor: 'accent',
  registrationError: 0,
  textureIntensity: 1.0,

  multiStroke: 'double',
  fillStyle: 'hachure',
  paletteMode: 'source',
  strokePalette: 'source',
  fillPalette: 'source',
  texture: 'none',
  dotPattern: 'staggered',
  endpointBehavior: 'clean',
  sketchingStyle: 'single-pass',
  penTip: 'plain',
};

type Ctx = {
  state: F3ModifiersState;
  set: <K extends keyof F3ModifiersState>(key: K, value: F3ModifiersState[K]) => void;
  replace: (next: F3ModifiersState) => void;
  reset: () => void;
};

const F3RoughModifiersCtx = createContext<Ctx | null>(null);

export function F3RoughModifiersProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<F3ModifiersState>(DEFAULT);
  const set = <K extends keyof F3ModifiersState>(key: K, value: F3ModifiersState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };
  const replace = (next: F3ModifiersState) => setState(next);
  const reset = () => setState(DEFAULT);
  return <F3RoughModifiersCtx.Provider value={{ state, set, replace, reset }}>{children}</F3RoughModifiersCtx.Provider>;
}

export function useF3RoughModifiers(): Ctx {
  const v = useContext(F3RoughModifiersCtx);
  if (!v) throw new Error('useF3RoughModifiers must be used inside F3RoughModifiersProvider');
  return v;
}

// Backwards-compat type alias used by render code (was F3RoughModifiersState).
export type F3RoughModifiersState = F3ModifiersState;
