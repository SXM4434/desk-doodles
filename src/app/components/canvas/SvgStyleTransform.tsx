import { useEffect, useMemo, useRef, type ReactNode, type CSSProperties } from 'react';
// Smart Hachure System (v1) — opt-in via `?smartHachure=1` URL param.
// See `docs/labs/hero/cells/F3-smart-hachure-system/06-architecture-technical-core.md`.
import { renderSmartHachure, type SmartHachureStyle } from '../../lib/smartHachure';
import rough from 'roughjs';
import type { Options as RoughOptions } from 'roughjs/bin/core';
import { useF3SvgStyle, isRoughFamilyStyle, type F3SvgStyle } from '../../state/F3SvgStyleContext';
import {
  useF3RoughModifiers,
  type F3ModifiersState,
  type MultiStrokeStep,
  type FillStyleStep,
  type TextureStep,
  type PaletteModeStep,
  type EndpointBehaviorStep,
  type SketchingStyleStep,
  type PenTipStep,
} from '../../state/F3RoughModifiersContext';
import {
  roughRectPoints,
  roughOvalPoints,
  roughPolygonPoints,
  roughLinePoints,
  // Playground-native cubic-Bezier path builders — used directly for layer 0
  // (and layers without per-vertex transforms) so wobble produces the exact
  // playground wandering character, not the over-jittered Q-bezier-on-short-segments
  // mess that the rebuild was producing.
  roughRectPathExtended,
  roughOvalPathExtended,
  roughLinePathExtended,
  rotatePointsAround,
  scalePointsAround,
  crossHatchRotationFor,
  parallelPassScaleFor,
  parallelPassTranslateFor,
  offsetLinePerpendicular,
  HAND_FEEL_BASE,
  penTipPath,
  pointsToPolylinePath,
  seededRandom,
  type ShapeModifiers,
} from '../../lib/f3HandFeel';

// ─── PER-STYLE PRESETS — applied at preset-reset; state values override ──

// When user clicks "Reset to preset" while a style is active, these values
// snap the state. Live render uses raw state values, not these.
export const STYLE_PRESETS: Record<F3SvgStyle, Partial<F3ModifiersState>> = {
  // Non-rough styles set wobble: 0 (clean baseline; jitter inactive).
  // Rough-family styles set wobble: 1.0 (playground calibration baseline per I-11).
  'clean':           { wobble: 0, roughness: 0, bowing: 0, strokeWidth: 1.0, inkIntensity: 1.0, fillOpacity: 1.0, texture: 'none', fillStyle: 'hachure' },
  'outline-only':    { wobble: 0, roughness: 0, bowing: 0, strokeWidth: 1.0, inkIntensity: 1.0, fillOpacity: 0,   texture: 'none' },
  'wireframe':       { wobble: 0, roughness: 0, bowing: 0, strokeWidth: 0.8, inkIntensity: 1.0, fillOpacity: 0, texture: 'none' },
  // 2026-06-08 default calibration bump per Sebs: each style should READ as
  // itself at the default thumbnail scale (~140px), not as near-clean. Prior
  // values made wet-ink / charcoal / newsprint / risograph almost
  // indistinguishable from clean in the /audit grid.
  'wet-ink':         { wobble: 0.6, strokeWidth: 1.2, inkIntensity: 1.0, fillOpacity: 0.9, texture: 'wet-ink',  blurAmount: 1.5, bleed: 0.3 },
  'charcoal':        { wobble: 1.0, strokeWidth: 1.4, inkIntensity: 1.0, fillOpacity: 1.0, texture: 'chalky',   grainIntensity: 3.0, smudgeAmount: 0, pressureVariance: 0.3 },
  'newsprint':       { wobble: 0, strokeWidth: 0.9, inkIntensity: 1.0, fillOpacity: 1.0, texture: 'stipple', textureIntensity: 2.0, dotSize: 1.2, dotSpacing: 4, dotPattern: 'staggered' },
  'risograph':       { wobble: 0.4, strokeWidth: 1.0, inkIntensity: 1.0, fillOpacity: 0.7, texture: 'none',     offsetDistance: 4, offsetAngle: 45, colorShift: 0.7, risoSecondaryColor: 'accent', registrationError: 0 },
  // curveTightness 0 → 0.4 (2026-06-08): per §I-13 pair-wise interactions,
  // curveTightness dampens wobble jitter scale + bowing offset. At default 0
  // the rough.js double-stroke + wobble jitter produced visibly splintered
  // edges on small rects (band patch, gig ticket). 0.4 smooths the rough
  // character without flattening the hand-drawn feel.
  // Jaggedness defaults set to 0 (2026-06-09 per Sebs): splinter is opt-in
  // via slider, NOT default. Prior 0.6/0.4/0.5/0.3 stamped perpendicular
  // zigzag intermediates on every shape at default state.
  'rough-handdrawn': { wobble: 1.0, jaggedness: 0, roughness: 1.6, bowing: 1.0, strokeWidth: 1.2, curveTightness: 0.4, multiStroke: 'double', fillStyle: 'hachure', hachureGap: 4, hachureAngle: -41, fillDensity: 0.7, texture: 'paper-tooth' },
  'sketchy':         { wobble: 0.6, jaggedness: 0, roughness: 0.8, bowing: 0.4, strokeWidth: 0.9, curveTightness: 0, multiStroke: 'single', fillStyle: 'none', hachureGap: 4, hachureAngle: -41, fillDensity: 0.5, texture: 'light', inkIntensity: 0.85 },
  'bold-ink':        { wobble: 0.4, jaggedness: 0, roughness: 0.6, bowing: 0.2, strokeWidth: 2.8, curveTightness: 0, multiStroke: 'off', fillStyle: 'solid', fillDensity: 1.0, texture: 'none' },
  'stipple':         { wobble: 0.8, jaggedness: 0, roughness: 1.2, bowing: 0.7, strokeWidth: 0.7, curveTightness: 0, multiStroke: 'single', fillStyle: 'dots', hachureGap: 2.5, hachureAngle: 0, fillDensity: 1.0, texture: 'stipple', dotSize: 1.0, dotSpacing: 3, dotScatter: 0.3 },
};

// Helper: apply preset to current state (used by chrome's "Reset to preset" button)
export function applyStylePreset(
  currentState: F3ModifiersState,
  style: F3SvgStyle,
): F3ModifiersState {
  return { ...currentState, ...STYLE_PRESETS[style] };
}

// ─── MULTI-STROKE LAYER COUNTS ──────────────────────────────────────────────

function multiStrokeMeta(step: MultiStrokeStep): { layerCount: number } {
  switch (step) {
    case 'off':    return { layerCount: 0 };
    case 'single': return { layerCount: 1 };
    case 'double': return { layerCount: 2 };
    case 'triple': return { layerCount: 3 };
    case 'quad':   return { layerCount: 4 };
    case 'quint':  return { layerCount: 5 };
    case 'six':    return { layerCount: 6 };
    case 'heavy':  return { layerCount: 8 };
  }
}

function fillStyleToRough(step: FillStyleStep): string | undefined {
  if (step === 'none') return undefined;
  return step;
}

// ─── PALETTE COLOR MAPPING — preserves color-mix transparency ──────────────
//
// The source SVG often uses `color-mix(in oklab, var(--dir-text-primary) 8%, transparent)`
// for translucent fills. When we apply a palette mode we want to swap ONLY the
// token (var(...)) while preserving the percentage + transparent endpoint, so a
// faint wash stays faint when the user picks `body`, `secondary`, etc.
//
// Plain tokens (`var(--dir-text-primary)`) swap directly. Anything else passes
// through unchanged.

function paletteToToken(mode: PaletteModeStep): string | null {
  switch (mode) {
    case 'source':     return null;
    case 'primary':    return 'var(--dir-text-primary)';
    case 'body':       return 'var(--dir-text-body)';
    case 'body-soft':  return 'var(--dir-text-body-soft)';
    case 'secondary':  return 'var(--dir-text-secondary)';
    case 'detail':     return 'var(--dir-detail)';
    case 'accent':     return 'var(--dir-accent, #D4574A)';
    case 'bg':         return 'var(--dir-bg)';
    case 'neutral':    return 'var(--dir-text-body)';
    case 'inverted':   return 'var(--dir-bg)';
  }
}

const COLOR_MIX_TOKEN_RE = /var\(--[a-zA-Z0-9-]+(?:,\s*[^)]+)?\)/;

function mapPaletteColor(originalColor: string | undefined, paletteMode: PaletteModeStep): string | undefined {
  if (paletteMode === 'source') return originalColor;
  const replacement = paletteToToken(paletteMode);
  if (!replacement) return originalColor;
  if (!originalColor) return originalColor;  // null/undefined fills must NOT become opaque
  // NEVER remap "paper" fills. Palette overrides remap INK, not the substrate.
  // --dir-bg = page background (paper); transparent/none = no fill. Sebs 2026-06-04:
  // "look at clean from source to anything else it just fills the entire object"
  // — that was BG fills being incorrectly mapped to opaque ink colors.
  if (originalColor === 'none' || originalColor === 'transparent') return originalColor;
  if (originalColor.includes('--dir-bg')) return originalColor;
  // color-mix(...) — swap the first var() token inside, preserve everything else
  // (percentage + transparent endpoint) so an 8% wash stays 8% under any palette.
  if (originalColor.includes('color-mix')) {
    return originalColor.replace(COLOR_MIX_TOKEN_RE, replacement);
  }
  // Plain var(--token) — swap to replacement token.
  if (originalColor.startsWith('var(')) {
    return replacement;
  }
  // Plain hex / named color — swap.
  return replacement;
}

// ─── PEN-TIP / SKETCHING — per-layer point transforms ──────────────────────

/** Apply the per-layer geometric transform (cross-hatch rotate, parallel-pass
 *  scale, loose-overlap already baked into the points via ShapeModifiers). */
function applyLayerTransform(
  points: Array<[number, number]>,
  sketchingStyle: SketchingStyleStep,
  layerIndex: number,
  cx: number,
  cy: number,
  isClosed: boolean,
): Array<[number, number]> {
  if (layerIndex === 0) return points;
  if (sketchingStyle === 'cross-hatch') {
    return rotatePointsAround(points, cx, cy, crossHatchRotationFor(layerIndex));
  }
  if (sketchingStyle === 'parallel-pass') {
    if (isClosed) {
      return scalePointsAround(points, cx, cy, parallelPassScaleFor(layerIndex));
    }
    return offsetLinePerpendicular(points, layerIndex);
  }
  // 'single-pass' and 'loose-overlap' are handled by the seed offset / mods.
  return points;
}

/** Geometric center of a point set (used as the cross-hatch / parallel-pass pivot). */
function centroidOf(points: Array<[number, number]>): { cx: number; cy: number } {
  if (points.length === 0) return { cx: 0, cy: 0 };
  let cx = 0;
  let cy = 0;
  for (const [x, y] of points) {
    cx += x;
    cy += y;
  }
  return { cx: cx / points.length, cy: cy / points.length };
}

// ─── SEED OFFSETS — coprime increments per playground convention ─────────────

const SEED_INCREMENTS = [0, 47, 113, 181, 257, 331, 401, 479];

function seedOffsets(base: number, count: number): number[] {
  return SEED_INCREMENTS.slice(0, count).map((inc) => base + inc);
}

// ─── STABLE PER-LAYER NUDGE — multi-stroke visible at any roughness ─────────
//
// Generalizes rough.js's `_curveWithOffset` technique (which applies base
// offsets of 1 and 1.5 units INDEPENDENT of roughness — see
// https://github.com/rough-stuff/rough/blob/master/src/renderer.ts#L60-L67)
// to ALL shapes. Each layer ≥ 1 gets a tiny fixed XY translate so layers stay
// visibly distinct even when roughness × jitter is sub-pixel (the failure
// mode the user surfaced 2026-06-02: at rough ~0.24 + strokeWidth ~0.45,
// per-vertex jitter is ~0.58 px which is barely above stroke width — layers
// overlap into a single perceived stroke).
//
// rough.js itself has this bug for `_doubleLine` (see Agent 2 research).
// Adding the curve-style stable offset here closes the gap.
//
// Magnitude scales with strokeWidth so multi-stroke stays proportionally
// visible across the stroke-width range (per user direction 2026-06-03 — at
// rough=0 + strokeWidth=0.30 the original fixed 0.6px nudge was sub-pixel and
// rasterized as a single blurry line). Floor at 0.6 px so thin strokes still
// get the baseline nudge. Capped at 4 px so heavy multi-stroke + thick stroke
// doesn't bleed into loose-overlap's 5 px register.
//
// Examples at default angle steps:
// strokeWidth 0.30 → layer1 0.6, layer3 0.9 (same as before for thin strokes)
// strokeWidth 1.0  → layer1 1.0, layer3 1.4
// strokeWidth 2.5  → layer1 2.5, layer3 3.5
// strokeWidth 3.0  → layer1 3.0, layer3 4.0 (cap engaged for layer ≥ 4)
// ─── LOOSE-OVERLAP TRANSLATE — Hero-8-Lab calibration ──────────────────────
//
// Playground's parallelPassTranslateFor uses magnitude=5 (calibrated for
// playground's 300-500px artifacts). On Hero-8-Lab's 60-80px hero pins that
// reads as 8-12% of shape size — far too aggressive (user flagged 2026-06-03).
// Local override at magnitude=2 matches the same half-playground calibration
// already applied to LOCAL_LOOSE_OVERLAP in f3HandFeel.ts:70.
function looseOverlapTranslate(layerIndex: number): { dx: number; dy: number } {
  if (layerIndex === 0) return { dx: 0, dy: 0 };
  const magnitude = 2;
  const patterns = [
    { dx: 0, dy: 0 },
    { dx: magnitude, dy: magnitude },
    { dx: -magnitude, dy: -magnitude },
    { dx: magnitude * 1.5, dy: -magnitude },
    { dx: -magnitude, dy: magnitude * 1.5 },
  ];
  return patterns[Math.min(layerIndex, patterns.length - 1)];
}

function stableLayerNudge(layerIndex: number, strokeWidth: number): { dx: number; dy: number } {
  if (layerIndex === 0) return { dx: 0, dy: 0 };
  const angle = layerIndex * 0.7;
  // Increased again (2026-06-09 take 2): at heart-scale drawings (300+px) the
  // earlier 2-4px offsets were still barely distinguishable. Bumping to
  // 3-9px so triple multi-stroke reads as three distinct outlines at zoom.
  const base = Math.max(3.5, strokeWidth * 2.5);
  const step = Math.max(2.0, strokeWidth * 1.0);
  const magnitude = Math.min(14, base + (layerIndex - 1) * step);
  return {
    dx: magnitude * Math.cos(angle),
    dy: magnitude * Math.sin(angle),
  };
}

// ─── HAND-FEEL POINT EXTRACTION + RENDER ───────────────────────────────────
//
// For each SVG primitive (rect/circle/ellipse/line/polygon/polyline) we
// compute the closed/open jittered point loop via f3HandFeel, then either:
//   • penTip === 'plain' → render as stroked polyline path (one path per layer)
//   • penTip != 'plain'  → feed each layer's points through penTipPath
//                          (perfect-freehand) → render as filled polygon
//
// <path> stays on rough.js since arbitrary path commands aren't sampleable
// without a full SVG path parser.

type ShapeContext = {
  ROUGH: number;             // roughness base × wobble
  baseSeed: number;
  isClosed: boolean;
  /** Smaller bbox dimension (px) — used to scale pen-tip presets so they
   *  read correctly on small shapes. */
  bboxMin: number;
  /** rough.js SVG renderer — used for HYBRID hachure layer (real hachure /
   *  cross-hatch / dots / zigzag fill rendered underneath the hand-feel outline
   *  when fillStyle requires a patterned fill). */
  rc: ReturnType<typeof rough.svg>;
  // Function that builds the jittered point loop for a given seed + mods.
  // Caller closure should bake protrudeScale (derived from bbox) into the call.
  buildPoints: (seed: number, mods: ShapeModifiers) => Array<[number, number]>;
  /** OPTIONAL: when provided, layer 0 + layers WITHOUT cross-hatch/parallel-pass
   *  transforms use this playground-native path-builder DIRECTLY (matches
   *  playground rendering exactly — fewer long cubic-Bezier segments per side,
   *  jittered control points at 1/3 and 2/3 with j()*1.4 amplitude). For
   *  cross-hatch / parallel-pass / pen-tip layers, falls back to buildPoints
   *  + pointsToPolylinePath since those need per-vertex transforms. */
  buildPath?: (seed: number, mods: ShapeModifiers) => string;
  /** OPTIONAL pivot override (see groupPivot in transformElement). */
  pivotOverride?: { cx: number; cy: number };
  /** OPTIONAL: when true, ctx.buildPath handles per-layer transforms internally
   *  (cross-hatch / parallel-pass) so the normal needsPerVertexTransform fallback
   *  is bypassed. Used by case 'path' Catmull-Rom buildPath which can apply
   *  perpendicular offset to anchors before smoothing → clean parallel curves
   *  on dense drawn input instead of the chaos-fallback. */
  handlesPerVertexLayer?: boolean;
  /** OPTIONAL size override for the effectiveLayerCount / effectiveWobble
   *  / effectiveRoughness clamps. When a child is part of a group, the GROUP's
   *  bbox-min is passed here so multi-stroke (etc.) gets the layer count the
   *  user actually picked even though the individual child is tiny.
   *  Added 2026-06-07 — diagnostic confirmed multi-stroke was silently
   *  downgrading to 1 layer on stackedSketchbooks because each book's bbox
   *  was 14-18px and the clamp rule is "30px per layer." With this override,
   *  the whole 84×70 group's bboxMin=70 lets multi-stroke fire as intended. */
  bboxMinOverride?: number;
};

/** Compute protrude scale from a shape's smaller dimension. Playground baseline
 *  is ~140px; below that we scale down so endpoints don't blow out. */
function protrudeScaleForBbox(bboxMin: number): number {
  return Math.max(0.25, Math.min(1.0, bboxMin / 140));
}

/** Inject jaggedness — adds perpendicular zig-zag intermediates between each
 *  pair of consecutive sampled points. Does NOT change wobble amplitude (the
 *  outer points stay where they were); just adds sharp angle character ALONG
 *  each segment so the line reads as splintered / zigzag at high jaggedness,
 *  smooth at low. Added 2026-06-08 per Sebs's "splinter toggle" intent. */
function injectJaggedness(
  points: Array<[number, number]>,
  jaggedness: number,
  seed: number,
): Array<[number, number]> {
  if (points.length < 2 || jaggedness <= 0.05) return points;
  // jagged 0.5 → 1 zig per segment; jagged 1 → 2 zigs; jagged 2 → 4 zigs
  const zigsPerSeg = Math.min(4, Math.max(1, Math.round(jaggedness * 2)));
  // Perpendicular displacement scales with jaggedness so high jaggedness = wider zig
  const ampScale = jaggedness * 0.9;
  const r = seededRandom(seed + 9973);
  const out: Array<[number, number]> = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    if (len < 0.5) { out.push([bx, by]); continue; }
    // unit perpendicular
    const px = -dy / len;
    const py = dx / len;
    // segment-length-relative zig amplitude — keeps small segments from
    // disappearing into noise, but lets long segments get visible zig
    const ampPx = Math.min(len * 0.18, 1.2 + ampScale * 2.0);
    for (let z = 1; z <= zigsPerSeg; z++) {
      const t = z / (zigsPerSeg + 1);
      const mx = ax + dx * t;
      const my = ay + dy * t;
      // alternate sign + small random jitter so zigs aren't perfectly regular
      const sign = z % 2 === 0 ? -1 : 1;
      const noise = (r() - 0.5) * 0.5;
      const amp = ampPx * (sign + noise);
      out.push([mx + px * amp, my + py * amp]);
    }
    out.push([bx, by]);
  }
  return out;
}

/**
 * SOURCE-FILL DARKNESS PARSING.
 *
 * Drawing convention: shading TECHNIQUE (hachure/cross-hatch/dots/etc) REPLACES
 * each tonal area's solid fill with a pattern at density matching the area's
 * darkness. Dark fills → dense hachure. Light wash → sparse hachure. White →
 * blank. The fillStyle toggle CHANGES THE TECHNIQUE; the source fill COLOR
 * dictates which areas are dark / mid / light.
 *
 * Maps a source SVG fill color to a 0-1 "darkness" score the shading layer
 * uses to scale hachure density (gap, fillWeight, line count).
 *
 *   1.0 = fully opaque dark ink (--dir-text-primary)
 *   0.65 = mid (--dir-text-body, --dir-text-body-soft)
 *   0.45 = secondary / detail
 *   0.08 = 8% wash (the WASH constant — faint translucent overlay)
 *   0 = background, transparent, or none
 */
function fillDarknessFactor(fillColor: string | undefined): number {
  if (!fillColor || fillColor === 'none' || fillColor === 'transparent') return 0;
  // color-mix(... TOKEN N%, transparent) — read the percentage, treat as opacity
  const colorMixMatch = fillColor.match(/(\d+(?:\.\d+)?)%\s*,\s*transparent/);
  if (colorMixMatch) {
    return Math.max(0, Math.min(1, parseFloat(colorMixMatch[1]) / 100));
  }
  // Plain CSS-var token. Map common W1 ink tiers to a darkness score.
  if (fillColor.includes('--dir-bg')) return 0;
  if (fillColor.includes('--dir-text-primary')) return 1.0;
  if (fillColor.includes('--dir-text-body-soft')) return 0.6;
  if (fillColor.includes('--dir-text-body')) return 0.8;
  if (fillColor.includes('--dir-text-secondary')) return 0.55;
  if (fillColor.includes('--dir-detail')) return 0.4;
  if (fillColor.includes('--dir-accent')) return 0.85;
  // Unknown opaque color — assume mid-dark.
  return 0.75;
}

// ─── SMART ADAPTIVE CLAMPS — toggle interactions per shape size ───────────
//
// User direction 2026-06-02: treat the modifier set as a "living ecosystem"
// — when a shape is small, certain modifiers (hachure, multi-stroke, roughness)
// should auto-scale down so the rendering stays legible. Each clamp accepts
// the user's slider value + the shape's bboxMin and returns the effective
// value used at render time.

/** Hachure gap auto-widens on small shapes so the pattern doesn't blob.
 *  At bboxMin >= 80px, no adjustment. Below 80, gap grows inversely. */
function effectiveHachureGap(userGap: number, bboxMin: number): number {
  const scale = Math.max(1, 80 / Math.max(1, bboxMin));
  return userGap * scale;
}

/** Multi-stroke layer count caps based on shape size so layered strokes
 *  don't fully overlap on tiny items.
 *
 *  RAISED 2026-06-08: ~30px per layer ceilinged at 3 layers for typical
 *  60-100px shapes — user couldn't reach quad/quint/six/heavy regardless of
 *  slider. Loosened to ~12px per layer (80px shape → 7 layers reachable,
 *  100px → 8). Aligns with `feedback_more_toggle_options_better`: the user
 *  picks the visual budget; the clamp is only a tiny-shape sanity bound. */
function effectiveLayerCount(userLayers: number, bboxMin: number): number {
  const sizeCappedLayers = Math.max(1, Math.ceil(bboxMin / 12));
  return Math.min(Math.max(1, userLayers), sizeCappedLayers);
}

/** Roughness clamps so jitter amplitude doesn't exceed a fraction of shape size.
 *  Below 60px, roughness max scales down so shapes stay recognizable. */
function effectiveRoughness(userRoughness: number, bboxMin: number): number {
  const maxUseful = Math.max(0.3, bboxMin / 60);
  return Math.min(userRoughness, maxUseful);
}

/** Wobble clamp — same size-aware logic as effectiveRoughness, applied to the
 *  master wobble multiplier. Playground (C3UserFlow) content is 100-300px so
 *  the unclamped wobble * HAND_FEEL_BASE works there. Trophy Wall pins are
 *  60-80px so the same amplitude reads as shredded. Clamp so wobble's effect
 *  scales with shape size — small pins get muted wobble, big content gets full. */
function effectiveWobble(userWobble: number, bboxMin: number): number {
  // Floor 0.3 → 0.5 (2026-06-08 quick fix per Sebs): simple shapes (stick
  // figure, simple pen) were getting too clamped at default rough-handdrawn
  // (geomean of tiny bbox ⇒ wobble ≤ 0.3). 0.5 floor lifts the baseline so
  // every shape reads as visibly hand-drawn at default without re-shredding
  // small geometry (the geomean clamp + min-with-userWobble still bound it).
  // Real fix = smart-layer per-element role classifier; this is the interim.
  const maxUseful = Math.max(0.5, bboxMin / 60);
  return Math.min(userWobble, maxUseful);
}

/** Fill density / hachure weight clamp — prevents hachure from filling shape
 *  to a solid block at high density on small shapes. */
function effectiveFillWeight(userDensity: number, bboxMin: number): number {
  // density slider is 0-1.5; multiply by 2 to get rough.js fillWeight.
  // For small shapes, halve the effective density to keep hachure airy.
  const sizeDamp = Math.max(0.5, Math.min(1.0, bboxMin / 100));
  return userDensity * 2 * sizeDamp;
}

/** Ramer-Douglas-Peucker polyline simplification.
 *  Reduces dense input (drawn freehand / auto-traced) to audit-compatible
 *  vertex density without losing curve shape. A point is dropped if its
 *  perpendicular distance from the chord through its neighbors is < epsilon.
 *  Audit shapes already sit at sparse density — RDP is a no-op for them. */
function rdp(points: Array<[number, number]>, epsilon: number): Array<[number, number]> {
  if (points.length < 3) return points;
  const [x1, y1] = points[0];
  const [x2, y2] = points[points.length - 1];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lineLen = Math.hypot(dx, dy);
  let maxDist = 0;
  let maxIdx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const dist = lineLen === 0
      ? Math.hypot(px - x1, py - y1)
      : Math.abs(dy * px - dx * py + x2 * y1 - y2 * x1) / lineLen;
    if (dist > maxDist) { maxDist = dist; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const left = rdp(points.slice(0, maxIdx + 1), epsilon);
    const right = rdp(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[points.length - 1]];
}

/** Catmull-Rom smooth-curve path generator.
 *  Converts a polyline (list of anchors) into a cubic-Bezier `d` string that
 *  passes smoothly THROUGH every anchor — control points derived from the
 *  tangent at each anchor (neighbor-difference). Hand-feel jitter is added to
 *  the control points so the curve still reads as drawn-by-hand.
 *
 *  Why: after RDP simplifies a dense drawn input (heart → ~15-20 anchors),
 *  pointsToPolylinePath produces straight-ish bezier segments between adjacent
 *  anchors — visible polygon corners. Catmull-Rom produces a curve that
 *  follows the polyline shape with no corner artifacts. Audit shapes (no RDP)
 *  never use this; they keep their polygon-between-corners character which is
 *  correct for rect/trapezoid sides. */
/** Corner-preserving smoothing. Applies 3-point moving average ONLY at points
 *  where the local angle change is small (smooth curve). Skips smoothing at
 *  sharp corners (>30° turn) so rectangles stay rectangles, hearts keep their
 *  V-bottom sharp, etc. Endpoints always preserved exactly.
 *  intensity (0-1) blends original ↔ smoothed at smooth interior points. */
function smoothPolyline(
  points: Array<[number, number]>,
  intensity = 0.5,
  cornerThresholdRad = Math.PI / 6, // 30 degrees
): Array<[number, number]> {
  if (points.length < 3 || intensity <= 0) return points;
  const out: Array<[number, number]> = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const [cx, cy] = points[i + 1];
    // Angle change at point i (signed turn from incoming → outgoing segment)
    const v1x = bx - ax, v1y = by - ay;
    const v2x = cx - bx, v2y = cy - by;
    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);
    if (len1 < 0.01 || len2 < 0.01) { out.push([bx, by]); continue; }
    const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
    const cosClamped = Math.max(-1, Math.min(1, dot));
    const angle = Math.acos(cosClamped);
    if (angle > cornerThresholdRad) {
      // Corner — preserve as-is.
      out.push([bx, by]);
    } else {
      // Smooth segment — blend toward 3-point average.
      const sx = (ax + bx + cx) / 3;
      const sy = (ay + by + cy) / 3;
      out.push([bx * (1 - intensity) + sx * intensity, by * (1 - intensity) + sy * intensity]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/** Generate a smooth low-frequency 1D wobble field along arc length.
 *  Returns a function (t: 0..1) → [dx, dy] that produces ~1 oscillation per
 *  `wavelengthPx` of path length. Used to add flowing wobble to a Catmull-Rom
 *  curve without per-anchor micro-jitter. */
function arcLengthWobbleField(
  totalArcLen: number,
  amplitude: number,
  wavelengthPx: number,
  seed: number,
): (t: number) => [number, number] {
  if (amplitude <= 0.001 || totalArcLen <= 1) return () => [0, 0];
  const r = seededRandom(seed);
  // Anchor count = arc length / wavelength, minimum 3 so we get a curve.
  const numAnchors = Math.max(3, Math.ceil(totalArcLen / wavelengthPx));
  // Random anchor displacements
  const dxs: number[] = [];
  const dys: number[] = [];
  for (let k = 0; k <= numAnchors; k++) {
    dxs.push((r() - 0.5) * 2 * amplitude);
    dys.push((r() - 0.5) * 2 * amplitude);
  }
  return (t: number): [number, number] => {
    const clampedT = Math.max(0, Math.min(1, t));
    const u = clampedT * numAnchors;
    const i = Math.floor(u);
    const f = u - i;
    // Cosine interpolation for smooth transitions
    const fs = (1 - Math.cos(f * Math.PI)) / 2;
    const dx = dxs[i] * (1 - fs) + dxs[Math.min(i + 1, numAnchors)] * fs;
    const dy = dys[i] * (1 - fs) + dys[Math.min(i + 1, numAnchors)] * fs;
    return [dx, dy];
  };
}

/** Apply endpointBehavior to a polyline: extend / push points based on the
 *  user-selected endpoint mode. */
function applyEndpointBehavior(
  points: Array<[number, number]>,
  mode: ShapeModifiers['endpointBehavior'],
  isClosed: boolean,
  seed: number,
): Array<[number, number]> {
  if (mode === 'clean' || points.length < 2) return points;
  const amount = mode === 'protrude' ? 4 : mode === 'long-overshoot' ? 9 : 2.5;
  const r = seededRandom(seed + 5555);
  if (mode === 'kink') {
    // Random-angle push at every anchor — produces the twitchy/spasm kink
    return points.map(([x, y]) => {
      const a = r() * Math.PI * 2;
      return [x + Math.cos(a) * amount, y + Math.sin(a) * amount] as [number, number];
    });
  }
  if (isClosed) {
    // Radial outward from centroid for all anchors (matches old case 'path')
    let cx = 0, cy = 0;
    for (const p of points) { cx += p[0]; cy += p[1]; }
    cx /= points.length; cy /= points.length;
    return points.map(([x, y]) => {
      const dx = x - cx, dy = y - cy;
      const len = Math.max(0.01, Math.hypot(dx, dy));
      return [x + (dx / len) * amount, y + (dy / len) * amount] as [number, number];
    });
  }
  // Open path: extend first point backward along outgoing segment, last point
  // forward along incoming segment.
  const out = points.slice();
  const [p0, p1n] = [points[0], points[1]];
  const d1x = p1n[0] - p0[0], d1y = p1n[1] - p0[1];
  const l1 = Math.max(0.01, Math.hypot(d1x, d1y));
  out[0] = [p0[0] - (d1x / l1) * amount, p0[1] - (d1y / l1) * amount];
  const [pn1, pn] = [points[points.length - 2], points[points.length - 1]];
  const d2x = pn[0] - pn1[0], d2y = pn[1] - pn1[1];
  const l2 = Math.max(0.01, Math.hypot(d2x, d2y));
  out[points.length - 1] = [pn[0] + (d2x / l2) * amount, pn[1] + (d2y / l2) * amount];
  return out;
}

/** Straight-bezier-per-side path — control points sit ON each side's chord
 *  with perpendicular jitter for hand-feel wobble. Corners stay sharp because
 *  consecutive bezier segments END/START at the same vertex with control
 *  points along the segments' own chord directions, not curved through.
 *  Used for polygonal inputs (rectangles, triangles, diamonds) where the
 *  intended shape has clear corners.
 *  Honors bowing (perpendicular bow per segment), curveTightness (damps bow),
 *  endpointBehavior (applied before path generation). */
function straightBezierPath(
  points: Array<[number, number]>,
  isClosed: boolean,
  wobbleAmplitude: number,
  bowing: number,
  curveTightness: number,
  endpointBehavior: ShapeModifiers['endpointBehavior'],
  seed: number,
): string {
  const working = applyEndpointBehavior(points, endpointBehavior, isClosed, seed);
  if (working.length < 2) return '';
  const r = seededRandom(seed);
  const j = () => (r() - 0.5) * 2 * wobbleAmplitude;
  const tightnessDamp = Math.max(0.1, 1 - curveTightness * 0.45);
  const effectiveBow = bowing * tightnessDamp;
  let d = `M ${working[0][0].toFixed(2)} ${working[0][1].toFixed(2)}`;
  const N = working.length;
  const segEnd = isClosed ? N : N - 1;
  for (let i = 0; i < segEnd; i++) {
    const p1 = working[i];
    const p2 = working[(i + 1) % N];
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const len = Math.hypot(dx, dy);
    const perpX = len > 0.01 ? -dy / len : 0;
    const perpY = len > 0.01 ? dx / len : 0;
    const sign = r() > 0.5 ? 1 : -1;
    // Bowing perpendicular offset on control points (matches pointsToPolylinePath formula)
    const bow = effectiveBow * len * 0.06 * sign;
    const c1x = p1[0] + dx / 3 + perpX * bow + j();
    const c1y = p1[1] + dy / 3 + perpY * bow + j();
    const c2x = p1[0] + (2 * dx) / 3 + perpX * bow + j();
    const c2y = p1[1] + (2 * dy) / 3 + perpY * bow + j();
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  if (isClosed) d += ' Z';
  return d;
}

function catmullRomPath(
  points: Array<[number, number]>,
  isClosed: boolean,
  wobbleAmplitude: number,
  bowing: number,
  curveTightness: number,
  endpointBehavior: ShapeModifiers['endpointBehavior'],
  seed: number,
): string {
  const n0 = points.length;
  if (n0 < 2) return '';

  // 0) Apply endpoint behavior BEFORE smoothing so the extended/kinked points
  //    feed into the curve.
  const adjusted = applyEndpointBehavior(points, endpointBehavior, isClosed, seed);

  // 1) Corner-preserving smoothing: remove input micro-jitter at gentle-curve
  //    segments so wobble=0 reads clean. Sharp corners (rectangles, V-bottoms)
  //    bypass smoothing entirely so they stay sharp.
  const smoothed = smoothPolyline(adjusted, 0.5);
  const N = smoothed.length;

  // 2) Build arc-length-parameterized wobble field. Wavelength scales with
  //    overall path length so short paths get full character but long paths
  //    don't read as braid (one cycle per ~60px).
  let arcLen = 0;
  const cum: number[] = [0];
  for (let i = 1; i < N; i++) {
    arcLen += Math.hypot(smoothed[i][0] - smoothed[i - 1][0], smoothed[i][1] - smoothed[i - 1][1]);
    cum.push(arcLen);
  }
  // Wavelength scales with path length so short paths still get a few cycles
  // and long paths don't read as braid. 1 cycle per ~12% of total length
  // floored at 35px and capped at 90px.
  const wavelength = Math.max(35, Math.min(90, arcLen * 0.12));
  const wobbleAt = arcLengthWobbleField(arcLen, wobbleAmplitude, wavelength, seed);

  // Apply wobble field to each anchor before generating Catmull-Rom curve.
  // (Displacing the anchors themselves produces a curve that wobbles WITH the
  // path direction. Jittering only control points doesn't move the curve.)
  const displaced: Array<[number, number]> = [];
  for (let i = 0; i < N; i++) {
    const t = N > 1 ? cum[i] / arcLen : 0;
    const [wdx, wdy] = wobbleAt(t);
    displaced.push([smoothed[i][0] + wdx, smoothed[i][1] + wdy]);
  }

  // CORNER PRESERVATION: at sharp corners (angle change > 45°), use the
  // OUTGOING/INCOMING segment direction as the tangent at that vertex rather
  // than the average of neighbors. Catmull-Rom's neighbor-averaged tangent
  // produces rounded corners (since it pulls control points sideways into
  // the curve). Tangent-along-segment keeps corners sharp.
  const CORNER_THRESHOLD = Math.PI / 4; // 45°
  const isSharpCornerAt = (p0: [number, number], p1: [number, number], p2: [number, number]): boolean => {
    const v1x = p1[0] - p0[0], v1y = p1[1] - p0[1];
    const v2x = p2[0] - p1[0], v2y = p2[1] - p1[1];
    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);
    if (len1 < 0.01 || len2 < 0.01) return false;
    const cosAng = (v1x * v2x + v1y * v2y) / (len1 * len2);
    return cosAng < Math.cos(CORNER_THRESHOLD);
  };

  // curveTightness damps the tangent strength (higher → tighter / straighter
  // curves). bowing adds perpendicular displacement to control points.
  const tightnessDamp = Math.max(0.1, 1 - curveTightness * 0.45);
  const tangentScale = tightnessDamp;
  const effectiveBow = bowing * tightnessDamp;
  const rBow = seededRandom(seed + 4242);

  let d = `M ${displaced[0][0].toFixed(2)} ${displaced[0][1].toFixed(2)}`;
  const segEnd = isClosed ? N : N - 1;
  for (let i = 0; i < segEnd; i++) {
    const p0 = isClosed
      ? displaced[((i - 1 + N) % N)]
      : (i - 1 < 0 ? [2 * displaced[0][0] - displaced[1][0], 2 * displaced[0][1] - displaced[1][1]] as [number, number] : displaced[i - 1]);
    const p1 = displaced[i];
    const p2 = isClosed ? displaced[(i + 1) % N] : displaced[Math.min(i + 1, N - 1)];
    const p3 = isClosed
      ? displaced[(i + 2) % N]
      : (i + 2 >= N ? [2 * displaced[N - 1][0] - displaced[N - 2][0], 2 * displaced[N - 1][1] - displaced[N - 2][1]] as [number, number] : displaced[i + 2]);

    const p1IsCorner = isSharpCornerAt(p0, p1, p2);
    const p2IsCorner = isSharpCornerAt(p1, p2, p3);

    // Per-segment chord and perpendicular for bowing
    const segDx = p2[0] - p1[0];
    const segDy = p2[1] - p1[1];
    const segLen = Math.hypot(segDx, segDy);
    const perpX = segLen > 0.01 ? -segDy / segLen : 0;
    const perpY = segLen > 0.01 ? segDx / segLen : 0;
    const bowSign = rBow() > 0.5 ? 1 : -1;
    const bowOffset = effectiveBow * segLen * 0.06 * bowSign;

    // Control point 1: tangent at p1. If p1 is a sharp corner, use direction
    // toward p2 (straight outward); else neighbor-averaged Catmull-Rom.
    let c1x: number, c1y: number;
    if (p1IsCorner) {
      c1x = p1[0] + ((p2[0] - p1[0]) / 3) * tangentScale;
      c1y = p1[1] + ((p2[1] - p1[1]) / 3) * tangentScale;
    } else {
      c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tangentScale;
      c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tangentScale;
    }
    // Control point 2: tangent at p2.
    let c2x: number, c2y: number;
    if (p2IsCorner) {
      c2x = p2[0] - ((p2[0] - p1[0]) / 3) * tangentScale;
      c2y = p2[1] - ((p2[1] - p1[1]) / 3) * tangentScale;
    } else {
      c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tangentScale;
      c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tangentScale;
    }
    // Bowing adds perpendicular displacement to both control points (segment
    // bends symmetrically toward the perp side).
    c1x += perpX * bowOffset;
    c1y += perpY * bowOffset;
    c2x += perpX * bowOffset;
    c2y += perpY * bowOffset;

    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  if (isClosed) d += ' Z';
  return d;
}

function renderHandFeelShape(
  ctx: ShapeContext,
  m: F3ModifiersState,
  /** Source SVG element — used to pull original stroke / fill colors. */
  sourceEl: SVGElement,
  /** SVG namespace document. */
  ownerDoc: Document,
): SVGElement[] {
  const { ROUGH, baseSeed, isClosed, buildPoints } = ctx;
  void ROUGH; // ctx.ROUGH is informational; actual roughness baked into buildPoints closure
  const ms = multiStrokeMeta(m.multiStroke);
  // SMART layer count clamp: small shapes can't fit many distinct layers
  // before they overlap into a solid blob. ~30px per supported layer.
  // Use GROUP bbox-min when provided — a child of a coherent group should
  // get the layer count the user picked even if the child itself is tiny
  // (the user reads the layers at GROUP scale, not child scale).
  // SOFT per-detail scaling: geomean of per-child and group-level bboxMin.
  // Matches the per-shape-case sizeClampBbox formula so wobble/multi-stroke
  // both honor the same "small parts of big SVG get partial scaling" rule.
  const effectiveBboxMin = ctx.bboxMinOverride && ctx.bboxMinOverride > ctx.bboxMin
    ? Math.sqrt(ctx.bboxMin * ctx.bboxMinOverride)
    : ctx.bboxMin;
  const layerCount = effectiveLayerCount(ms.layerCount, effectiveBboxMin);

  // DIAG 2026-06-07 — show why multi-stroke + sketching style aren't visibly
  // working on multi-child shapes. Remove once shading calibration ships.
  // EXTENDED 2026-06-09 — wobble character investigation. Capture per-element
  // route signals so we can compare curated audit shapes (rect/circle/line →
  // built-path route) vs uploaded rose SVG (<path> → fallback route) vs drawn
  // heart polyline (<polyline> → fallback route). Hypothesis: route divergence
  // explains wobble character difference, not wobble magnitude.
  if ((window as { __dd_diag?: boolean }).__dd_diag) {
    const diagEffW = effectiveWobble(m.wobble, effectiveBboxMin);
    const diagHasBuildPath = !!ctx.buildPath;
    const diagCanUseBuiltPath = diagHasBuildPath && m.jaggedness <= 0.05;
    const diagIsHachureFamily =
      m.fillStyle === 'hachure' || m.fillStyle === 'cross-hatch' ||
      m.fillStyle === 'zigzag' || m.fillStyle === 'dashed' ||
      m.fillStyle === 'dots' || m.fillStyle === 'zigzag-line';
    // eslint-disable-next-line no-console
    console.log('[dd-diag] renderHandFeelShape', {
      tag: sourceEl.tagName.toLowerCase(),
      isClosed: ctx.isClosed,
      bboxMin: Number(ctx.bboxMin.toFixed(1)),
      effectiveBboxMin: Number(effectiveBboxMin.toFixed(1)),
      userWobble: m.wobble,
      effW: Number(diagEffW.toFixed(3)),
      ROUGH: Number(ctx.ROUGH.toFixed(3)),
      jaggedness: m.jaggedness,
      hasBuildPath: diagHasBuildPath,
      canUseBuiltPath: diagCanUseBuiltPath,
      route: diagCanUseBuiltPath ? 'built-path' : 'points-fallback',
      sketchingStyle: m.sketchingStyle,
      fillStyle: m.fillStyle,
      isHachureFamily: diagIsHachureFamily,
      multiStrokeUserPicked: m.multiStroke,
      multiStrokeMetaLayers: ms.layerCount,
      effectiveLayerCount: layerCount,
      hasPivotOverride: !!ctx.pivotOverride,
    });
  }
  const seeds = seedOffsets(baseSeed, layerCount);
  const usePenTip = m.penTip !== 'plain';
  const endpointBehavior = m.endpointBehavior;
  const sketchingStyle = m.sketchingStyle;

  // Resolve source colors → palette-mapped colors. Preserves color-mix
  // transparency wrappers.
  const sourceStroke = sourceEl.getAttribute('stroke');
  const sourceFill = sourceEl.getAttribute('fill');
  const strokeColor = mapPaletteColor(sourceStroke ?? undefined, m.strokePalette)
    ?? 'var(--dir-text-primary)';
  const fillColor = (() => {
    if (!sourceFill || sourceFill === 'none' || sourceFill === 'transparent') return undefined;
    return mapPaletteColor(sourceFill, m.fillPalette);
  })();

  // For pen-tip mode the polygon fill color = strokeColor (perfect-freehand
  // outputs a filled polygon outline; the "stroke" IS the fill).
  const penTipColor = strokeColor;

  // Build a base layer to determine the centroid (used as the cross-hatch /
  // parallel-pass pivot). If a group-level pivot was passed in (ctx.pivotOverride),
  // use that instead — keeps multi-child group shapes (stackedSketchbooks etc.)
  // scaling/rotating around the GROUP's center, not each child's center.
  const layer0Points = buildPoints(seeds[0], { endpointBehavior, sketchingStyle, layerIndex: 0 });
  const childCentroid = centroidOf(layer0Points);
  const cxCentroid = ctx.pivotOverride?.cx ?? childCentroid.cx;
  const cyCentroid = ctx.pivotOverride?.cy ?? childCentroid.cy;

  const out: SVGElement[] = [];

  const isHachureFamily =
    m.fillStyle === 'hachure' || m.fillStyle === 'cross-hatch' ||
    m.fillStyle === 'dots' || m.fillStyle === 'zigzag' ||
    m.fillStyle === 'dashed' || m.fillStyle === 'zigzag-line';

  // For closed shapes: paper-color background fill BUT only when fill style
  // is 'solid' or 'none' (source has fill). When fillStyle is hachure-family,
  // skip the basePath — the user picked hachure because they want a PATTERN,
  // not a solid wash UNDER the pattern. The hachure layer renders alone.
  if (isClosed && fillColor && !isHachureFamily) {
    const basePath = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
    // Jaggedness applies to the fill boundary too — solid-filled shapes
    // (lacroixRack, decorative pegboard items rendered with fill={STROKE})
    // otherwise stay perfectly smooth at any jaggedness value. Use layer 0's
    // seed so the fill boundary matches the outline character.
    const basePts = m.jaggedness > 0.05
      ? injectJaggedness(layer0Points, m.jaggedness, baseSeed)
      : layer0Points;
    basePath.setAttribute('d', pointsToPolylinePath(basePts, true));
    basePath.setAttribute('fill', fillColor);
    basePath.setAttribute('stroke', 'none');
    basePath.setAttribute('fill-opacity', String(m.fillOpacity));
    out.push(basePath);
  }

  // SHADING — fillStyle = the SHADING TECHNIQUE (hachure/cross-hatch/dots/etc).
  // The technique REPLACES each filled area's solid tone with a pattern at
  // density matching the source's darkness:
  //   - Dark fills (opaque primary ink) → DENSE hachure (the area was "darkly shaded")
  //   - Light fills (8% wash) → SPARSE hachure (the area was "lightly shaded")
  //   - White / bg / transparent → no hachure (the area was unshaded white)
  // This is how an artist replaces tonal regions with pen-shading techniques.
  //
  // Density scales by source darkness × user's Fill density slider × per-shape
  // size damping. Hachure gap also scales — denser source = tighter gap.
  if (isClosed && isHachureFamily && fillColor) {
    const darkness = fillDarknessFactor(sourceFill ?? undefined);
    // PARKED 2026-06-03: the 3-band skip/sparse/full approach + the "fix the fix"
    // raised gap floor + lowered fillWeight cap both broke things differently.
    // Reverted to Phase 1A baseline pending the Smart Hachure System redesign
    // (Task #22 — classification-based system per user direction). Phase 1A
    // baseline = visible everywhere darkness ≥ 0.05, 1.5 px gap floor,
    // fillWeight ≤ gap × 0.7 cap.
    if (darkness < 0.05) {
      // Near-zero / transparent / BG → no hachure
    } else {
      const hachureColor = mapPaletteColor(sourceStroke ?? undefined, m.fillPalette) ?? strokeColor;
      // SHADING math — F3-shading-calibration-spec §4 (Phase 1A baseline).
      // PRIMARY axis = gap (1/darkness). SECONDARY = weight (0.5-floored).
      // sizeMul bounded [1, 2] so tiny shapes don't blow gap to invisible.
      const sizeMul = Math.max(1.0, Math.min(2.0, 80 / Math.max(40, ctx.bboxMin)));
      // Per-fillStyle darkness clamp floor per §4.4: zigzag 0.2, dots 0.15,
      // hachure / cross-hatch / dashed / zigzag-line 0.1.
      const darknessFloor =
        m.fillStyle === 'zigzag' ? 0.2 :
        m.fillStyle === 'dots'   ? 0.15 :
                                   0.1;
      const clampedDarkness = Math.max(darknessFloor, Math.min(1.0, darkness));
      let adaptedGap = m.hachureGap * sizeMul * (1 / clampedDarkness);
      // Floor at 1.5 px — below this, lines optically merge into solid block
      // (Craftsy "fine crosshatching" optical-blend threshold, §1.2).
      adaptedGap = Math.max(1.5, adaptedGap);

      // FILL WEIGHT: secondary axis. Floor 0.5 so light-source fills don't
      // vanish into hairlines (§4.4.1). dots uses ×1.5 multiplier instead
      // of ×2 (filled circles render visually heavier per same weight, §4.4.3).
      const sizeDamp = Math.max(0.4, Math.min(1.0, ctx.bboxMin / 100));
      const weightMul = m.fillStyle === 'dots' ? 1.5 : 2;
      let adaptedFillWeight = m.fillDensity * weightMul * sizeDamp * Math.max(0.5, 0.5 + darkness * 0.5);
      // Cap weight at 70 % of gap so lines never overlap into solid.
      adaptedFillWeight = Math.min(adaptedFillWeight, adaptedGap * 0.7);

      const dPath = pointsToPolylinePath(layer0Points, true);
      const fillOpts: RoughOptions = {
        seed: baseSeed,
        stroke: 'none',
        fill: hachureColor,
        fillStyle: m.fillStyle as RoughOptions['fillStyle'],
        hachureGap: adaptedGap,
        hachureAngle: m.hachureAngle,
        fillWeight: adaptedFillWeight,
        roughness: 0,
      };
      const hachureG = ctx.rc.path(dPath, fillOpts);
      if (hachureG) {
        hachureG.setAttribute('data-f3-hachure', 'shading');
        // Hachure opacity scales with fillOpacity slider AND with darkness
        // so light areas don't accidentally render denser than intended.
        hachureG.setAttribute('opacity', String(m.fillOpacity));
        out.push(hachureG);
      }
    }
  }

  for (let i = 0; i < layerCount; i++) {
    const seed = seeds[i];
    const mods: ShapeModifiers = { endpointBehavior, sketchingStyle, layerIndex: i };

    // CHANGED 2026-06-08: for cross-hatch + parallel-pass on closed shapes,
    // apply the rotation/scale as an SVG transform attribute on the rendered
    // path (NOT by mutating points before pointsToPolylinePath). Why: mutating
    // points then re-wrapping in pointsToPolylinePath added wobble ON TOP of
    // already-jittered points → secondary layers looked visibly noisier than
    // the base layer. With SVG transforms, all layers use the SAME clean
    // built path (just rotated/scaled at the SVG level) → uniform line
    // character across all layers, only the position differs.
    const useSvgTransformForLayer =
      i > 0 &&
      (sketchingStyle === 'cross-hatch' ||
        (sketchingStyle === 'parallel-pass' && isClosed));

    let pts = buildPoints(seed, mods);
    if (!useSvgTransformForLayer) {
      // Only mutate points for non-SVG-transform paths (loose-overlap,
      // single-pass, open-path parallel-pass via offsetLinePerpendicular).
      pts = applyLayerTransform(pts, sketchingStyle, i, cxCentroid, cyCentroid, isClosed);
    }

    // Compute per-layer transform. Includes:
    //   - cross-hatch: rotate around centroid (was point-mutation)
    //   - parallel-pass closed: scale around centroid (was point-mutation)
    //   - loose-overlap: visible drift translate
    //   - single-pass: stable micro-nudge
    let layerTransform = '';
    if (i > 0) {
      if (sketchingStyle === 'cross-hatch') {
        const angle = crossHatchRotationFor(i);
        if (angle !== 0) {
          layerTransform = `rotate(${angle} ${cxCentroid.toFixed(2)} ${cyCentroid.toFixed(2)})`;
        }
      } else if (sketchingStyle === 'parallel-pass' && isClosed) {
        const s = parallelPassScaleFor(i);
        if (s !== 1) {
          // SVG scale(s) around (cx, cy): translate(cx, cy) scale(s) translate(-cx, -cy)
          const tx = (cxCentroid * (1 - s)).toFixed(2);
          const ty = (cyCentroid * (1 - s)).toFixed(2);
          layerTransform = `translate(${tx} ${ty}) scale(${s.toFixed(3)})`;
        }
      } else if (sketchingStyle === 'loose-overlap') {
        const t = looseOverlapTranslate(i);
        if (t.dx || t.dy) layerTransform = `translate(${t.dx} ${t.dy})`;
      } else if (sketchingStyle === 'single-pass') {
        const n = stableLayerNudge(i, m.strokeWidth);
        layerTransform = `translate(${n.dx.toFixed(2)} ${n.dy.toFixed(2)})`;
      }
    }

    if (usePenTip) {
      // Pen-tip mode bypasses bowing/curveTightness because perfect-freehand
      // generates its own polygon stroke from the raw points. Bowing/curve
      // apply only to plain (polyline) mode.
      const d = penTipPath(pts, m.penTip, m.strokeWidth, seed, ctx.bboxMin);
      if (!d) continue;
      const path = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', penTipColor);
      path.setAttribute('stroke', 'none');
      if (layerTransform) path.setAttribute('transform', layerTransform);
      out.push(path);
    } else {
      // Plain mode. If ctx.buildPath is provided AND we don't need per-vertex
      // transforms (cross-hatch / parallel-pass), use the playground-native
      // path-builder directly. That matches the playground rendering EXACTLY:
      // 4 long cubic-Bezier segments per rect (vs our 32 short Q-bezier
      // segments), control points jittered at j()*1.4 amplitude. Result: wobble
      // produces the same visual wandering as playground at matched values.
      // BUG FIX 2026-06-08 (refinement): now that cross-hatch / parallel-pass
      // (closed) apply via SVG transform attribute instead of per-vertex
      // mutation, ALL layers can use the playground-native built path.
      // Only open-path parallel-pass (offsetLinePerpendicular) still needs
      // the per-vertex transform fallback for now.
      const needsPerVertexTransform =
        i > 0 && sketchingStyle === 'parallel-pass' && !isClosed
        && !ctx.handlesPerVertexLayer;
      // When jaggedness > 0, force the points-pipeline route so rect/circle/
      // ellipse/line shapes get zig-zag injection too (the buildPath fast-path
      // bypasses injectJaggedness). Trade: gives up the playground-matched
      // cubic-bezier accuracy on those shape types, but only when user has
      // explicitly dialed jaggedness above default.
      const canUseBuiltPath =
        ctx.buildPath !== undefined
        && !needsPerVertexTransform
        && m.jaggedness <= 0.05;
      let d: string;
      if (canUseBuiltPath) {
        d = ctx.buildPath!(seed, mods);
      } else {
        // Fallback for cross-hatch / parallel-pass (need per-vertex transforms)
        // or shapes without a playground-native builder (polygon/polyline).
        // Use the GROUP-scaled bbox (see effectiveBboxMin block above) so
        // multi-child SVGs don't silently floor wobble per tiny child.
        // WOBBLE: how far points wander. Untouched by jaggedness (Sebs:
        // "jaggedness shouldn't reduce wobble amplitude").
        const wobbleForCurves = effectiveWobble(m.wobble, effectiveBboxMin);
        // JAGGEDNESS: sharpness of connections between wandering points.
        //   - jagged 0 → smooth flowing bezier curves between points
        //   - jagged 2 → sharp zig-zag character (extra alternating-perp
        //     intermediate points injected between consecutive samples)
        // Independent of wobble; same point-cloud, different connection style.
        const jaggedPts = m.jaggedness > 0.05
          ? injectJaggedness(pts, m.jaggedness, seed)
          : pts;
        d = pointsToPolylinePath(jaggedPts, isClosed, m.bowing, m.curveTightness, seed, wobbleForCurves);
      }
      const path = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', strokeColor);
      path.setAttribute('data-f3-hand-feel', 'outline');
      // Match playground convention: layer 0 = 1.25× (primary stroke),
      // all other layers = 1.0× (ghost outlines). Verified against
      // `Homepage Surfaces v2 Lab/.../C3UserFlow.tsx:333` and `handFeel.ts`.
      const widthMul = i === 0 ? 1.25 : 1.0;
      path.setAttribute('stroke-width', String(m.strokeWidth * widthMul));
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      // Preserve stroke-dasharray from source element (2026-06-09): dashed
      // <line>/<path>/<polyline> sources (ticket dividers, lanyard dashes,
      // flyer rules) need their dash pattern carried through the jitter
      // pipeline. The underlying path stays continuous; SVG's native
      // stroke-dasharray renders the dashes on the jittered stroke.
      const sourceDash = sourceEl.getAttribute('stroke-dasharray');
      if (sourceDash && sourceDash !== 'none') {
        path.setAttribute('stroke-dasharray', sourceDash);
      }
      if (layerTransform) path.setAttribute('transform', layerTransform);
      out.push(path);
    }
  }

  return out;
}

// ─── ROUGH.JS for <path> (arbitrary path data) ──────────────────────────────

function buildRoughOptionsForPath(
  m: F3ModifiersState,
  el: SVGElement,
  seed: number,
): RoughOptions {
  const ms = multiStrokeMeta(m.multiStroke);
  const fillStyle = fillStyleToRough(m.fillStyle);
  let endpointBowingNudge = 0;
  let preserveVerts: boolean | undefined;
  switch (m.endpointBehavior) {
    case 'clean':         preserveVerts = true;  break;
    case 'protrude':      preserveVerts = false; endpointBowingNudge = 0.2; break;
    case 'long-overshoot':preserveVerts = false; endpointBowingNudge = 0.5; break;
    case 'kink':          preserveVerts = false; endpointBowingNudge = 0.8; break;
  }
  const opts: RoughOptions = {
    seed,
    // Jaggedness = how jagged-vs-smooth the rendered path reads (sharp angle
    // changes vs flowing curves). Decoupled from wobble's amplitude
    // 2026-06-08 per Sebs: previously rough.js's `roughness` was driven by
    // wobble, which conflated "how far the line wanders" with "how jagged the
    // wandering reads." Now wobble drives amplitude (HAND_FEEL_BASE *
    // wobble) and jaggedness drives rough.js's roughness param. m.roughness
    // still reserved for Cluster 4 Surface Texture per §I-11.
    roughness: m.jaggedness,
    bowing: m.bowing + endpointBowingNudge,
    strokeWidth: m.strokeWidth,
    curveTightness: m.curveTightness,
    disableMultiStroke: ms.layerCount <= 1,
    preserveVertices: preserveVerts,
    fillStyle: fillStyle as RoughOptions['fillStyle'],
    hachureGap: m.hachureGap,
    hachureAngle: m.hachureAngle,
    fillWeight: m.fillDensity * 2,
  };
  const stroke = el.getAttribute('stroke');
  const fill = el.getAttribute('fill');
  if (stroke) opts.stroke = mapPaletteColor(stroke, m.strokePalette);
  if (fill && fill !== 'none' && fill !== 'transparent' && fillStyle) {
    opts.fill = mapPaletteColor(fill, m.fillPalette);
  } else {
    opts.fill = undefined;
  }
  return opts;
}

// ─── ELEMENT DISPATCH ──────────────────────────────────────────────────────

/** Compute the bounding box of a <g> element by unioning its primitive
 *  children's bboxes. Used to derive a group-shared pivot for cross-hatch /
 *  parallel-pass layer transforms (so a group's children rotate/scale around
 *  the group's center, not each child's own centroid).
 *
 *  Handles rect / circle / ellipse / line / polygon / polyline / nested <g>.
 *  For <path> and unsupported elements, falls back to SVG getBBox() if
 *  available (DOM-connected); otherwise skipped. Returns null if no
 *  computable children. */
function computeGroupBBox(
  g: SVGElement,
): { x: number; y: number; w: number; h: number } | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const walk = (parent: SVGElement) => {
    for (const child of Array.from(parent.children)) {
      if (!(child instanceof SVGElement)) continue;
      const tag = child.tagName.toLowerCase();
      let bx = 0, by = 0, bw = 0, bh = 0, ok = false;
      switch (tag) {
        case 'rect': {
          bx = parseFloat(child.getAttribute('x') ?? '0');
          by = parseFloat(child.getAttribute('y') ?? '0');
          bw = parseFloat(child.getAttribute('width') ?? '0');
          bh = parseFloat(child.getAttribute('height') ?? '0');
          ok = bw > 0 && bh > 0;
          break;
        }
        case 'circle': {
          const cx = parseFloat(child.getAttribute('cx') ?? '0');
          const cy = parseFloat(child.getAttribute('cy') ?? '0');
          const r = parseFloat(child.getAttribute('r') ?? '0');
          bx = cx - r; by = cy - r; bw = 2 * r; bh = 2 * r;
          ok = r > 0;
          break;
        }
        case 'ellipse': {
          const cx = parseFloat(child.getAttribute('cx') ?? '0');
          const cy = parseFloat(child.getAttribute('cy') ?? '0');
          const rx = parseFloat(child.getAttribute('rx') ?? '0');
          const ry = parseFloat(child.getAttribute('ry') ?? '0');
          bx = cx - rx; by = cy - ry; bw = 2 * rx; bh = 2 * ry;
          ok = rx > 0 && ry > 0;
          break;
        }
        case 'line': {
          const x1 = parseFloat(child.getAttribute('x1') ?? '0');
          const y1 = parseFloat(child.getAttribute('y1') ?? '0');
          const x2 = parseFloat(child.getAttribute('x2') ?? '0');
          const y2 = parseFloat(child.getAttribute('y2') ?? '0');
          bx = Math.min(x1, x2); by = Math.min(y1, y2);
          bw = Math.abs(x2 - x1); bh = Math.abs(y2 - y1);
          ok = true;
          break;
        }
        case 'polygon':
        case 'polyline': {
          const ptsAttr = child.getAttribute('points') ?? '';
          const nums = ptsAttr.split(/[\s,]+/).map(parseFloat).filter((n) => !Number.isNaN(n));
          if (nums.length >= 4) {
            let px1 = Infinity, py1 = Infinity, px2 = -Infinity, py2 = -Infinity;
            for (let i = 0; i + 1 < nums.length; i += 2) {
              px1 = Math.min(px1, nums[i]); py1 = Math.min(py1, nums[i + 1]);
              px2 = Math.max(px2, nums[i]); py2 = Math.max(py2, nums[i + 1]);
            }
            bx = px1; by = py1; bw = px2 - px1; bh = py2 - py1;
            ok = true;
          }
          break;
        }
        case 'g':
          walk(child);
          continue;
        default:
          // path / text / etc — try DOM getBBox if connected, else skip
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const b = (child as any).getBBox?.();
            if (b && b.width > 0 && b.height > 0) {
              bx = b.x; by = b.y; bw = b.width; bh = b.height;
              ok = true;
            }
          } catch { /* not connected to DOM yet — skip */ }
          break;
      }
      if (ok) {
        minX = Math.min(minX, bx);
        minY = Math.min(minY, by);
        maxX = Math.max(maxX, bx + bw);
        maxY = Math.max(maxY, by + bh);
      }
    }
  };
  walk(g);
  if (minX === Infinity) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function transformElement(
  el: SVGElement,
  rc: ReturnType<typeof rough.svg>,
  m: F3ModifiersState,
  seed: number,
  ownerDoc: Document,
  /** Optional group-level pivot for cross-hatch / parallel-pass. */
  groupPivot?: { cx: number; cy: number },
  /** Optional group-level bbox-min for the size-aware clamps
   *  (effectiveLayerCount etc.) so children of a coherent group don't get
   *  multi-stroke silently downgraded just because the individual child is tiny. */
  groupBBoxMin?: number,
): SVGElement[] {
  const tag = el.tagName.toLowerCase();
  switch (tag) {
    case 'rect': {
      const x = parseFloat(el.getAttribute('x') ?? '0');
      const y = parseFloat(el.getAttribute('y') ?? '0');
      const w = parseFloat(el.getAttribute('width') ?? '0');
      const h = parseFloat(el.getAttribute('height') ?? '0');
      const bboxMin = Math.min(w, h);
      const pScale = protrudeScaleForBbox(bboxMin);
      const adaptedRoughness = effectiveRoughness(m.roughness, bboxMin);
      // GROUP-AWARE bbox-min for size clamps — same fix pattern as
      // effectiveLayerCount (commit 5b54e61) but never applied to wobble.
      // Without this, multi-child SVGs (stackedSketchbooks etc.) silently
      // ceiling user wobble at ~0.3 because per-book bbox is 14-18px while
      // the user picks against the whole 80px SVG.
      // SOFT per-detail scaling (placeholder for the smart-layer build) —
      // geometric mean of per-child bbox and group bbox so decorative tiny
      // children (pencil-tip polygons, sombrero band ellipses) don't get
      // FULL group-scale wobble and shred, but multi-child coherent groups
      // (stackedSketchbooks, jar walls) still lift past per-child clamp.
      // Real fix = smart-layer classifier per element role; this is the
      // intermediate compromise that handles 95% without per-role labels.
      const sizeClampBbox = groupBBoxMin && groupBBoxMin > bboxMin
        ? Math.sqrt(bboxMin * groupBBoxMin)
        : bboxMin;
      // I-11: wobble is THE master jitter multiplier on HAND_FEEL_BASE (mirrors
      // playground). Size-aware clamp via effectiveWobble at GROUP scale.
      const ROUGH = HAND_FEEL_BASE.rect * effectiveWobble(m.wobble, sizeClampBbox);
      return renderHandFeelShape({
        ROUGH,
        baseSeed: seed,
        isClosed: true,
        bboxMin,
        rc,
        buildPoints: (s, mods) => roughRectPoints(x, y, w, h, ROUGH, s, mods, pScale),
        // Playground-native cubic-Bezier path + bowing/curve extension so all
        // three axes (wobble, bowing, curveTightness) compose at render time.
        buildPath: (s, mods) => roughRectPathExtended(x, y, w, h, ROUGH, m.bowing, m.curveTightness, s, mods),
        pivotOverride: groupPivot,
        bboxMinOverride: groupBBoxMin,
      }, m, el, ownerDoc);
    }
    case 'circle': {
      const cx = parseFloat(el.getAttribute('cx') ?? '0');
      const cy = parseFloat(el.getAttribute('cy') ?? '0');
      const r = parseFloat(el.getAttribute('r') ?? '0');
      const x = cx - r;
      const y = cy - r;
      const w = r * 2;
      const h = r * 2;
      const bboxMin = Math.min(w, h);
      const pScale = protrudeScaleForBbox(bboxMin);
      const adaptedRoughness = effectiveRoughness(m.roughness, bboxMin);
      // SOFT per-detail scaling (placeholder for the smart-layer build) —
      // geometric mean of per-child bbox and group bbox so decorative tiny
      // children (pencil-tip polygons, sombrero band ellipses) don't get
      // FULL group-scale wobble and shred, but multi-child coherent groups
      // (stackedSketchbooks, jar walls) still lift past per-child clamp.
      // Real fix = smart-layer classifier per element role; this is the
      // intermediate compromise that handles 95% without per-role labels.
      const sizeClampBbox = groupBBoxMin && groupBBoxMin > bboxMin
        ? Math.sqrt(bboxMin * groupBBoxMin)
        : bboxMin;
      // I-11: wobble master, size-clamped at GROUP scale (see rect case)
      const ROUGH = HAND_FEEL_BASE.oval * effectiveWobble(m.wobble, sizeClampBbox);
      return renderHandFeelShape({
        ROUGH,
        baseSeed: seed,
        isClosed: true,
        bboxMin,
        rc,
        buildPoints: (s, mods) => roughOvalPoints(x, y, w, h, ROUGH, s, mods, pScale),
        // Playground-native cubic-Bezier oval + bowing/curve extension
        buildPath: (s, mods) => roughOvalPathExtended(x, y, w, h, ROUGH, m.bowing, m.curveTightness, s, mods),
        pivotOverride: groupPivot,
        bboxMinOverride: groupBBoxMin,
      }, m, el, ownerDoc);
    }
    case 'ellipse': {
      const cx = parseFloat(el.getAttribute('cx') ?? '0');
      const cy = parseFloat(el.getAttribute('cy') ?? '0');
      const rx = parseFloat(el.getAttribute('rx') ?? '0');
      const ry = parseFloat(el.getAttribute('ry') ?? '0');
      const x = cx - rx;
      const y = cy - ry;
      const w = rx * 2;
      const h = ry * 2;
      const bboxMin = Math.min(w, h);
      const pScale = protrudeScaleForBbox(bboxMin);
      const adaptedRoughness = effectiveRoughness(m.roughness, bboxMin);
      // SOFT per-detail scaling (placeholder for the smart-layer build) —
      // geometric mean of per-child bbox and group bbox so decorative tiny
      // children (pencil-tip polygons, sombrero band ellipses) don't get
      // FULL group-scale wobble and shred, but multi-child coherent groups
      // (stackedSketchbooks, jar walls) still lift past per-child clamp.
      // Real fix = smart-layer classifier per element role; this is the
      // intermediate compromise that handles 95% without per-role labels.
      const sizeClampBbox = groupBBoxMin && groupBBoxMin > bboxMin
        ? Math.sqrt(bboxMin * groupBBoxMin)
        : bboxMin;
      // I-11: wobble master, size-clamped at GROUP scale (see rect case)
      const ROUGH = HAND_FEEL_BASE.oval * effectiveWobble(m.wobble, sizeClampBbox);
      return renderHandFeelShape({
        ROUGH,
        baseSeed: seed,
        isClosed: true,
        bboxMin,
        rc,
        buildPoints: (s, mods) => roughOvalPoints(x, y, w, h, ROUGH, s, mods, pScale),
        // Playground-native cubic-Bezier oval + bowing/curve extension
        buildPath: (s, mods) => roughOvalPathExtended(x, y, w, h, ROUGH, m.bowing, m.curveTightness, s, mods),
        pivotOverride: groupPivot,
        bboxMinOverride: groupBBoxMin,
      }, m, el, ownerDoc);
    }
    case 'line': {
      const x1 = parseFloat(el.getAttribute('x1') ?? '0');
      const y1 = parseFloat(el.getAttribute('y1') ?? '0');
      const x2 = parseFloat(el.getAttribute('x2') ?? '0');
      const y2 = parseFloat(el.getAttribute('y2') ?? '0');
      const lineLen = Math.hypot(x2 - x1, y2 - y1);
      const pScale = protrudeScaleForBbox(lineLen);
      const adaptedRoughness = effectiveRoughness(m.roughness, lineLen);
      // SOFT per-detail scaling (see rect case for rationale).
      const sizeClampBbox = groupBBoxMin && groupBBoxMin > lineLen
        ? Math.sqrt(lineLen * groupBBoxMin)
        : lineLen;
      // I-11: wobble master, size-clamped at GROUP scale (see rect case)
      const ROUGH = HAND_FEEL_BASE.line * effectiveWobble(m.wobble, sizeClampBbox);
      return renderHandFeelShape({
        ROUGH,
        baseSeed: seed,
        isClosed: false,
        bboxMin: lineLen,
        rc,
        buildPoints: (s, mods) => roughLinePoints(x1, y1, x2, y2, ROUGH, s, mods, pScale),
        // Playground-native cubic-Bezier line + bowing/curve extension
        buildPath: (s, mods) => roughLinePathExtended(x1, y1, x2, y2, ROUGH, m.bowing, m.curveTightness, s, mods),
        pivotOverride: groupPivot,
        bboxMinOverride: groupBBoxMin,
      }, m, el, ownerDoc);
    }
    case 'polygon':
    case 'polyline': {
      const pointsStr = (el.getAttribute('points') ?? '').trim();
      if (!pointsStr) return [];
      const nums = pointsStr.split(/[\s,]+/).map(parseFloat);
      const pairs: Array<[number, number]> = [];
      for (let i = 0; i < nums.length - 1; i += 2) pairs.push([nums[i], nums[i + 1]]);
      if (pairs.length < 2) return [];
      const closed = tag === 'polygon';
      // Compute bbox from polygon vertices
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const [px, py] of pairs) {
        if (px < minX) minX = px;
        if (py < minY) minY = py;
        if (px > maxX) maxX = px;
        if (py > maxY) maxY = py;
      }
      const bboxMin = Math.min(maxX - minX, maxY - minY) || 80;
      const pScale = protrudeScaleForBbox(bboxMin);
      const adaptedRoughness = effectiveRoughness(m.roughness, bboxMin);
      // SOFT per-detail scaling (placeholder for the smart-layer build) —
      // geometric mean of per-child bbox and group bbox so decorative tiny
      // children (pencil-tip polygons, sombrero band ellipses) don't get
      // FULL group-scale wobble and shred, but multi-child coherent groups
      // (stackedSketchbooks, jar walls) still lift past per-child clamp.
      // Real fix = smart-layer classifier per element role; this is the
      // intermediate compromise that handles 95% without per-role labels.
      const sizeClampBbox = groupBBoxMin && groupBBoxMin > bboxMin
        ? Math.sqrt(bboxMin * groupBBoxMin)
        : bboxMin;
      // I-11: wobble master, size-clamped at GROUP scale (see rect case)
      const effW = effectiveWobble(m.wobble, sizeClampBbox);
      const ROUGH = HAND_FEEL_BASE.rect * effW;
      const ROUGH_LINE = HAND_FEEL_BASE.line * effW;
      if ((window as { __dd_diag?: boolean }).__dd_diag) {
        // eslint-disable-next-line no-console
        console.log('[dd-diag] case polyline', {
          tag,
          vertexCount: pairs.length,
          isClosed: closed,
          bboxMin: Number(bboxMin.toFixed(1)),
          sizeClampBbox: Number(sizeClampBbox.toFixed(1)),
          effW: Number(effW.toFixed(3)),
          ROUGH: Number(ROUGH.toFixed(3)),
        });
      }
      return renderHandFeelShape({
        ROUGH,
        baseSeed: seed,
        isClosed: closed,
        bboxMin,
        rc,
        buildPoints: (s, mods) => {
          if (closed) return roughPolygonPoints(pairs, ROUGH, s, mods, pScale);
          const segPoints: Array<[number, number]> = [];
          for (let i = 0; i < pairs.length - 1; i++) {
            const [ax, ay] = pairs[i];
            const [bx, by] = pairs[i + 1];
            const segSeed = s + i * 17;
            const segPts = roughLinePoints(ax, ay, bx, by, ROUGH_LINE, segSeed, mods, pScale);
            if (i > 0) segPts.shift();
            segPoints.push(...segPts);
          }
          return segPoints;
        },
        pivotOverride: groupPivot,
        bboxMinOverride: groupBBoxMin,
      }, m, el, ownerDoc);
    }
    case 'path': {
      const d = el.getAttribute('d');
      if (!d) return [];

      // I-12: route <path> content through the same points-based pipeline as
      // shape primitives so endpointBehavior + sketchingStyle + wobble + bowing
      // + curveTightness all apply uniformly. Previously paths went directly to
      // rough.js with `endpointBowingNudge`, which silently broke endpoint kink
      // + sketchingStyle compounds on Trophy Wall pin content (regressions B.2
      // + B.4 from 19-research-cross-axis-interconnection.md).
      //
      // Sampling strategy: use browser SVG path API (getTotalLength +
      // getPointAtLength) to convert arbitrary path data to a polyline. Then
      // route through renderHandFeelShape's buildPoints, where jitter applies
      // per-point (same as roughLinePoints does for line primitives).

      // Build hidden helper path for length sampling
      const tmpPath = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
      tmpPath.setAttribute('d', d);
      // tmpPath needs to be in a doc subtree for getTotalLength to work — append
      // to the parent SVG so it inherits coord system, then remove after sample
      const parentSvg = el.ownerSVGElement;
      if (!parentSvg) {
        // Can't sample — fall back to clean clone
        return [el.cloneNode(true) as SVGElement];
      }
      parentSvg.appendChild(tmpPath);
      let totalLen = 0;
      try { totalLen = tmpPath.getTotalLength(); } catch { /* invalid path */ }
      if (totalLen === 0) {
        parentSvg.removeChild(tmpPath);
        return [el.cloneNode(true) as SVGElement];
      }

      // Detect closed path (whole-string ends with Z/z)
      const pathEndsWithZ = /[zZ]\s*$/.test(d.trim());

      // STRAIGHT-LINE FAST PATH: pure-line paths (M/L/H/V/Z only) walk the
      // d-string and extract corners exactly. Curve paths use length-based
      // sampler.
      //
      // SUB-PATH SPLIT (2026-06-09): the corner walker previously concatenated
      // every M-sub-path into ONE cleanPoints array. For auto-traced rose
      // (112 sub-paths via 112 M commands), bezier-smoothing then drew long
      // curves from end-of-sub-path-N to start-of-sub-path-N+1 — the visible
      // diagonal lines crossing the rose. Audit shapes never trigger this
      // (≤1 sub-path each). Fix: break on every M, render each sub-path as
      // its own renderHandFeelShape call.
      //
      // RDP INPUT NORMALIZATION (2026-06-09): drawn freehand and uploaded
      // auto-traced SVGs come in DENSE (heart ≈80 verts / 502px, rose sub-path
      // ≈25 verts / 200px). The wobble pipeline was calibrated against audit
      // shapes which are SPARSE (2-6 verts per path). Dense input through the
      // same wobble produces braid character (wavelength ≈ vertex spacing).
      // RDP at ε=1.5px drops dense input to audit-compatible density WITHOUT
      // losing curve shape, then the same wobble produces the same flowing
      // character. Sparse input (audit) is a no-op for RDP — every vertex
      // exceeds the threshold by default, gated by RDP_VERTEX_THRESHOLD below.
      //
      // EPSILON 1.5 → 3.0 (2026-06-09 follow-up): heart curves at ε=1.5 still
      // produced ~30-40 anchors → braid. Bumped to 3.0 → ~15-20 anchors →
      // flowing. Audit untouched (gated by vertex-count threshold, not ε).
      const RDP_EPSILON = 3.0;
      type SubPath = { points: Array<[number, number]>; isClosed: boolean };
      const hasCurves = /[CcQqSsTtAa]/.test(d);
      const subPaths: SubPath[] = [];

      if (!hasCurves) {
        const tokens = d.match(/[MLHVZmlhvz]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) ?? [];
        let cx = 0, cy = 0, cmd = '';
        let current: Array<[number, number]> = [];
        let currentClosed = false;
        const flush = () => {
          if (current.length >= 2) subPaths.push({ points: current, isClosed: currentClosed });
          current = [];
          currentClosed = false;
        };
        for (let i = 0; i < tokens.length; i++) {
          const tok = tokens[i];
          if (/[A-Za-z]/.test(tok)) {
            if (tok === 'Z' || tok === 'z') {
              currentClosed = true;
              flush();
              cmd = '';
            } else {
              cmd = tok;
            }
            continue;
          }
          const num = parseFloat(tok);
          switch (cmd) {
            case 'M': flush(); cx = num; cy = parseFloat(tokens[++i]); current.push([cx, cy]); cmd = 'L'; break;
            case 'm': flush(); cx += num; cy += parseFloat(tokens[++i]); current.push([cx, cy]); cmd = 'l'; break;
            case 'L': cx = num; cy = parseFloat(tokens[++i]); current.push([cx, cy]); break;
            case 'l': cx += num; cy += parseFloat(tokens[++i]); current.push([cx, cy]); break;
            case 'H': cx = num; current.push([cx, cy]); break;
            case 'h': cx += num; current.push([cx, cy]); break;
            case 'V': cy = num; current.push([cx, cy]); break;
            case 'v': cy += num; current.push([cx, cy]); break;
            default: break;
          }
        }
        // Final flush — open sub-path with no trailing Z
        if (current.length >= 2) subPaths.push({ points: current, isClosed: false });
      }

      if (subPaths.length === 0) {
        // Curve path OR parse failed — use length sampler producing a single
        // sub-path. sampleSpacing /6 keeps long curved paths at audit-style
        // sparse density (sombrero brim arc, rose petal Q-bezier, etc).
        const sampleSpacing = Math.max(12, totalLen / 6);
        const numSamples = Math.max(4, Math.ceil(totalLen / sampleSpacing));
        const pts: Array<[number, number]> = [];
        for (let i = 0; i <= numSamples; i++) {
          const t = (i / numSamples) * totalLen;
          const p = tmpPath.getPointAtLength(t);
          pts.push([p.x, p.y]);
        }
        subPaths.push({ points: pts, isClosed: pathEndsWithZ });
      }

      parentSvg.removeChild(tmpPath);

      // Render each sub-path independently — bezier-smoothing in
      // renderHandFeelShape can't reach across sub-path boundaries this way.
      const outElements: SVGElement[] = [];
      let subIdx = 0;
      for (const sub of subPaths) {
        // RDP normalize ONLY when input vertex count is well above the audit
        // sparse range. Audit case-path shapes top out at ~6 verts per
        // sub-path (verified via /audit sweep 2026-06-09). Threshold = 15
        // means audit shapes ALWAYS fall through with raw vertices (no RDP)
        // and only dense drawn/uploaded input gets simplified. Earlier ε=1.5
        // applied unconditionally was dropping middle points off audit's
        // 5-6-point Q-bezier samples → broke audit ticket/statue/etc.
        const RDP_VERTEX_THRESHOLD = 15;
        const rdpTriggered = sub.points.length > RDP_VERTEX_THRESHOLD;
        const simplifiedPts = rdpTriggered
          ? rdp(sub.points, RDP_EPSILON)
          : sub.points;
        const cleanPoints = simplifiedPts.slice();
        const subClosed = sub.isClosed;

        // Closed sub-path: APPEND first point to end for clean bezier loop
        // (matches original case 'path' line 1234 behavior). NOT overwrite —
        // overwriting drops the final corner (broke audit shapes 2026-06-09).
        if (subClosed && cleanPoints.length > 1) {
          cleanPoints.push([cleanPoints[0][0], cleanPoints[0][1]]);
        }

        if (cleanPoints.length < 2) { subIdx++; continue; }

        // Per-sub-path bbox + centroid + ROUGH (matches existing per-shape logic)
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let sumX = 0, sumY = 0;
        for (const [px, py] of cleanPoints) {
          if (px < minX) minX = px;
          if (py < minY) minY = py;
          if (px > maxX) maxX = px;
          if (py > maxY) maxY = py;
          sumX += px;
          sumY += py;
        }
        const bboxMin = Math.min(maxX - minX, maxY - minY) || 80;
        const sizeClampBbox = groupBBoxMin && groupBBoxMin > bboxMin
          ? Math.sqrt(bboxMin * groupBBoxMin)
          : bboxMin;
        const effW = effectiveWobble(m.wobble, sizeClampBbox);
        const ROUGH = HAND_FEEL_BASE.line * effW;
        const subCentroidX = cleanPoints.length > 0 ? sumX / cleanPoints.length : 0;
        const subCentroidY = cleanPoints.length > 0 ? sumY / cleanPoints.length : 0;

        if ((window as { __dd_diag?: boolean }).__dd_diag) {
          // eslint-disable-next-line no-console
          console.log('[dd-diag] case path sub', {
            subIdx,
            inputPointCount: sub.points.length,
            simplifiedPointCount: cleanPoints.length,
            isClosed: subClosed,
            bboxMin: Number(bboxMin.toFixed(1)),
            sizeClampBbox: Number(sizeClampBbox.toFixed(1)),
            effW: Number(effW.toFixed(3)),
            ROUGH: Number(ROUGH.toFixed(3)),
          });
        }

        const subOut = renderHandFeelShape({
          ROUGH,
          baseSeed: seed + subIdx * 31,
          isClosed: subClosed,
          bboxMin,
          rc,
          // SMOOTH-CURVE BUILDPATH for RDP-triggered sub-paths (drawn freehand
          // / auto-traced). Catmull-Rom passes a smooth cubic-Bezier curve
          // through every anchor — no visible polygon corners. Audit shapes
          // never trigger this (rdpTriggered=false for vertex count ≤ 15) so
          // they keep their existing pointsToPolylinePath rendering with the
          // wobbly-straight character that's correct for rect/trapezoid sides.
          //
          // PARALLEL-PASS HANDLING: when sketchingStyle is parallel-pass and
          // path is open (no Z), shift anchors perpendicular to the primary
          // direction by layerIndex * stride BEFORE smoothing. Produces a
          // clean parallel sister curve per layer instead of the per-vertex
          // chaos fallback. handlesPerVertexLayer=true bypasses the gate.
          buildPath: rdpTriggered
            ? (s, mods) => {
                let pts = cleanPoints;
                if (
                  !subClosed &&
                  mods.sketchingStyle === 'parallel-pass' &&
                  mods.layerIndex !== undefined &&
                  mods.layerIndex > 0
                ) {
                  pts = offsetLinePerpendicular(cleanPoints, mods.layerIndex);
                }
                const wobbleAmp = Math.max(0, ROUGH * 2);
                // POLYGONAL INTENT DETECTION: when RDP simplified down to ≤8
                // anchors, treat input as a polygon (rectangle / triangle /
                // diamond / kite / etc) — straight-bezier-per-side keeps
                // corners crisp. Smooth-curve inputs (heart, blob, spiral)
                // have 9+ anchors → Catmull-Rom smooth interpolation.
                const POLY_ANCHOR_CAP = 8;
                if (pts.length <= POLY_ANCHOR_CAP) {
                  return straightBezierPath(
                    pts, subClosed,
                    wobbleAmp * 0.4,
                    m.bowing, m.curveTightness,
                    mods.endpointBehavior,
                    s,
                  );
                }
                return catmullRomPath(
                  pts, subClosed,
                  wobbleAmp,
                  m.bowing, m.curveTightness,
                  mods.endpointBehavior,
                  s,
                );
              }
            : undefined,
          handlesPerVertexLayer: rdpTriggered,
          buildPoints: (s, mods) => {
            const r = seededRandom(s);
            const j = () => (r() - 0.5) * 2 * ROUGH;
            const protrudeFor = (mode: ShapeModifiers['endpointBehavior']): number => {
              if (mode === 'protrude') return 4;
              if (mode === 'long-overshoot') return 9;
              if (mode === 'kink') return 2.5;
              return 0;
            };
            const protrude = protrudeFor(mods.endpointBehavior);
            const isKinkMode = mods.endpointBehavior === 'kink';
            const looseOffset =
              mods.sketchingStyle === 'loose-overlap' && mods.layerIndex
                ? mods.layerIndex * 3
                : 0;
            const totalShift = isKinkMode ? looseOffset : (protrude + looseOffset);
            const out: Array<[number, number]> = [];
            for (let i = 0; i < cleanPoints.length; i++) {
              const [px, py] = cleanPoints[i];
              let extendX = 0, extendY = 0;
              if (isKinkMode) {
                const angle = r() * Math.PI * 2;
                extendX += Math.cos(angle) * protrude;
                extendY += Math.sin(angle) * protrude;
              }
              if (totalShift > 0) {
                if (subClosed) {
                  const dx = px - subCentroidX;
                  const dy = py - subCentroidY;
                  const len = Math.max(0.01, Math.hypot(dx, dy));
                  extendX += (dx / len) * totalShift;
                  extendY += (dy / len) * totalShift;
                } else if (i === 0 && cleanPoints.length > 1) {
                  const [nx, ny] = cleanPoints[1];
                  const dx = nx - px;
                  const dy = ny - py;
                  const len = Math.max(0.01, Math.hypot(dx, dy));
                  extendX += -(dx / len) * totalShift;
                  extendY += -(dy / len) * totalShift;
                } else if (i === cleanPoints.length - 1 && cleanPoints.length > 1) {
                  const [pvx, pvy] = cleanPoints[i - 1];
                  const dx = px - pvx;
                  const dy = py - pvy;
                  const len = Math.max(0.01, Math.hypot(dx, dy));
                  extendX += (dx / len) * totalShift;
                  extendY += (dy / len) * totalShift;
                }
              }
              out.push([px + extendX + j(), py + extendY + j()]);
            }
            return out;
          },
          pivotOverride: groupPivot,
          bboxMinOverride: groupBBoxMin,
        }, m, el, ownerDoc);

        outElements.push(...subOut);
        subIdx++;
      }

      return outElements;
    }
    case 'text':
      return [el.cloneNode(true) as SVGElement];
    case 'g': {
      // CRITICAL: always compute THIS group's own pivot from its own bbox.
      // Do NOT inherit from a parent's pivot. Why: if 4 book-groups all
      // inherit the SVG's center as pivot, then cross-hatch (rotation)
      // makes the top book swing left while the bottom book swings right
      // (both around the same far-away pivot) → chaos. Each book group
      // should rotate around ITS OWN center for a clean crisscross.
      //
      // BBox-min, on the other hand, IS inherited — multi-stroke layer
      // count caps benefit from the WIDER container's size (the user reads
      // strokes at group scale, not tiny-child scale).
      const groupBBox = computeGroupBBox(el);
      let nextPivot = groupBBox
        ? { cx: groupBBox.x + groupBBox.w / 2, cy: groupBBox.y + groupBBox.h / 2 }
        : groupPivot;  // fall back to inherited only if we can't compute our own
      const nextBBoxMin =
        groupBBoxMin !== undefined
          ? groupBBoxMin
          : groupBBox
            ? Math.min(groupBBox.w, groupBBox.h)
            : undefined;
      // DIAG 2026-06-07
      if ((window as { __dd_diag?: boolean }).__dd_diag) {
        // eslint-disable-next-line no-console
        console.log('[dd-diag] case g', {
          childCount: el.children.length,
          inheritedPivot: !!groupPivot,
          computedBBox: groupBBox,
          pivot: nextPivot,
          groupBBoxMin: nextBBoxMin,
        });
      }
      const flat: SVGElement[] = [];
      Array.from(el.children).forEach((child, idx) => {
        if (child instanceof SVGElement) {
          flat.push(...transformElement(child, rc, m, seed + idx * 17, ownerDoc, nextPivot, nextBBoxMin));
        }
      });
      return flat;
    }
    default:
      return [el.cloneNode(true) as SVGElement];
  }
}

function applyRoughTransform(svgEl: SVGSVGElement, m: F3ModifiersState) {
  const rc = rough.svg(svgEl);
  const sourceChildren = Array.from(svgEl.children) as SVGElement[];
  const renderable = sourceChildren.filter((c) => {
    const t = c.tagName.toLowerCase();
    return t !== 'defs' && t !== 'style' && t !== 'title' && t !== 'desc';
  });
  const preserved = sourceChildren.filter((c) => !renderable.includes(c));

  while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
  preserved.forEach((p) => svgEl.appendChild(p));

  renderable.forEach((el, idx) => {
    const baseSeed = 100 + idx * 13;
    const replacements = transformElement(el, rc, m, baseSeed, svgEl.ownerDocument!);
    replacements.forEach((r) => svgEl.appendChild(r));
  });

  // Post-process: rough.js's hachure fills (for <path> elements only — the
  // <path> branch in transformElement falls back to rough.js) render as STROKE
  // paths. Apply stroke-opacity so Fill opacity affects them. Skip our own
  // hand-feel polyline outputs — those are tagged data-f3-hand-feel="outline"
  // so we don't kill them when the user lowers Fill opacity.
  if (m.fillOpacity < 1.0) {
    const paths = svgEl.querySelectorAll('path');
    paths.forEach((p) => {
      if (p.getAttribute('data-f3-hand-feel') === 'outline') return;
      const fillAttr = p.getAttribute('fill');
      const strokeAttr = p.getAttribute('stroke');
      const isHachureStroke = (!fillAttr || fillAttr === 'none') && strokeAttr && strokeAttr !== 'none';
      if (isHachureStroke) {
        p.setAttribute('stroke-opacity', String(m.fillOpacity));
      }
    });
  }
}

// ─── RISOGRAPH — clone twice with color + offset (style-specific modifiers) ──

function applyRisographTransform(svgEl: SVGSVGElement, m: F3ModifiersState) {
  const originals = Array.from(svgEl.children) as SVGElement[];
  const renderable = originals.filter((c) => {
    const t = c.tagName.toLowerCase();
    return t !== 'defs' && t !== 'style' && t !== 'title' && t !== 'desc';
  });

  const primary = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  primary.setAttribute('data-riso-layer', 'primary');
  renderable.forEach((c) => primary.appendChild(c.cloneNode(true)));

  const angleRad = (m.offsetAngle * Math.PI) / 180;
  const dx = m.offsetDistance * Math.cos(angleRad);
  const dy = m.offsetDistance * Math.sin(angleRad);
  const reg = m.registrationError;
  // §7.B-12: seed registration jitter from the modifier state so renders are
  // stable across re-runs (was Math.random — every HMR / route nav produced
  // a different jitter, which read as a broken slider).
  const regSeed = Math.round(m.offsetDistance * 100 + m.offsetAngle * 10 + m.registrationError * 31);
  const regRand = seededRandom(regSeed || 1);
  const rdx = dx + (regRand() - 0.5) * 2 * reg;
  const rdy = dy + (regRand() - 0.5) * 2 * reg;

  const secondary = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  secondary.setAttribute('data-riso-layer', 'secondary');
  secondary.setAttribute('transform', `translate(${rdx},${rdy})`);
  secondary.setAttribute('style', `mix-blend-mode: multiply; opacity: ${m.colorShift};`);

  // §7.B-3: secondary color is user-picked via risoSecondaryColor (was hardcoded
  // #D4574A). 'source' falls back to accent — risograph by definition needs a
  // contrasting secondary, so passthrough doesn't make sense here.
  const shiftedColor = paletteToToken(m.risoSecondaryColor) ?? 'var(--dir-accent)';
  renderable.forEach((c) => {
    const clone = c.cloneNode(true) as SVGElement;
    if (clone.getAttribute('stroke')) clone.setAttribute('stroke', shiftedColor);
    const fillVal = clone.getAttribute('fill');
    if (fillVal && fillVal !== 'transparent' && fillVal !== 'none') {
      clone.setAttribute('fill', shiftedColor);
    }
    secondary.appendChild(clone);
  });

  while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
  svgEl.appendChild(secondary);
  svgEl.appendChild(primary);
}

// ─── TEXTURE — dynamic filter (charcoal / wet-ink / texture × intensity) ──

function buildDynamicFilterId(style: F3SvgStyle, m: F3ModifiersState): string {
  if (style === 'charcoal') {
    return `hero8-dyn-charcoal-${m.grainIntensity.toFixed(2)}-${m.smudgeAmount.toFixed(2)}-${m.pressureVariance.toFixed(2)}`;
  }
  if (style === 'wet-ink') {
    return `hero8-dyn-wet-ink-${m.blurAmount.toFixed(2)}-${m.bleed.toFixed(2)}`;
  }
  if (m.texture !== 'none') {
    return `hero8-tex-${m.texture}-${m.textureIntensity.toFixed(2)}`;
  }
  return '';
}

function applyTexture(svgEl: SVGSVGElement, _texture: TextureStep, style: F3SvgStyle, m: F3ModifiersState) {
  const dynId = buildDynamicFilterId(style, m);
  if (dynId) {
    svgEl.setAttribute('filter', `url(#${dynId})`);
    if (!svgEl.getAttribute('overflow')) svgEl.setAttribute('overflow', 'visible');
    return;
  }
  svgEl.removeAttribute('filter');
}

// ─── DOM-clone helper ─────────────────────────────────────────────────────

function cloneSvg(srcContainer: HTMLDivElement | null, dstContainer: HTMLDivElement | null): SVGSVGElement | null {
  if (!srcContainer || !dstContainer) return null;
  const src = srcContainer.querySelector('svg');
  if (!src) return null;
  dstContainer.innerHTML = '';
  const clone = src.cloneNode(true) as SVGSVGElement;
  // Force overflow:visible so wobble/endpoint overshoots that push geometry
  // outside the source viewBox aren't clipped. The pin SVGs use tight viewBoxes
  // (e.g. rects at x=3 in a 80×100 viewBox); rough.js + protrude routinely push
  // 5-10px beyond. SVG defaults overflow:hidden — we need visible.
  clone.setAttribute('overflow', 'visible');
  clone.style.overflow = 'visible';
  dstContainer.appendChild(clone);
  return clone;
}

// ─── WIREFRAME — bounding-box per renderable child ─────────────────────────
//
// Per F3-toggle-architecture.md line 401 cross-path table: wireframe SVG render
// = "Bounding-box / simplified outline only, no fills." 3D counterpart = Three.js
// WireframeGeometry (renders all mesh triangle edges). The SVG analog adopted
// here: replace each top-level child with its axis-aligned bounding rect, so a
// compound shape (rect + circle + path) reads as a stack of boxes — the
// engineering-drawing register the doc calls for.
//
// Distinct from outline-only (which preserves shape geometry, just strips fills).
function applyWireframeTransform(svgEl: SVGSVGElement, m: F3ModifiersState) {
  const children = Array.from(svgEl.children) as SVGElement[];
  children.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    // Preserve structural / non-renderable nodes + text (text stays legible).
    if (tag === 'defs' || tag === 'style' || tag === 'title' || tag === 'desc' || tag === 'text') return;
    let bbox: DOMRect | null = null;
    try {
      bbox = (el as unknown as SVGGraphicsElement).getBBox();
    } catch {
      return;
    }
    if (!bbox || bbox.width === 0 || bbox.height === 0) return;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(bbox.x));
    rect.setAttribute('y', String(bbox.y));
    rect.setAttribute('width', String(bbox.width));
    rect.setAttribute('height', String(bbox.height));
    rect.setAttribute('fill', 'none');
    const sourceStroke = el.getAttribute('stroke');
    rect.setAttribute('stroke', sourceStroke && sourceStroke !== 'none' ? sourceStroke : 'var(--dir-text-primary)');
    rect.setAttribute('stroke-width', String(m.strokeWidth));
    rect.setAttribute('data-f3-wireframe', 'bbox');
    el.replaceWith(rect);
  });
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────

const NEEDS_DOM_CLONE: F3SvgStyle[] = [
  'rough-handdrawn', 'sketchy', 'bold-ink', 'stipple', 'risograph', 'wet-ink', 'charcoal', 'newsprint', 'wireframe',
];

export function SvgStyleTransform({ children }: { children: ReactNode }) {
  const { state: style } = useF3SvgStyle();
  const { state: m } = useF3RoughModifiers();
  const cleanRef = useRef<HTMLDivElement | null>(null);
  const fxRef = useRef<HTMLDivElement | null>(null);

  const needsClone = NEEDS_DOM_CLONE.includes(style);

  // Smart Hachure opt-in detection (decision #3 lock 2026-06-03: URL param).
  // Read on mount only — toggling requires a reload, by design.
  const smartHachureEnabled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('smartHachure') === '1';
  }, []);
  // Only the 4 rough-family styles run through Smart Hachure. Other styles
  // (clean / outline-only / wireframe / wet-ink / charcoal / risograph /
  // newsprint) keep their existing render path.
  const useSmartHachure =
    smartHachureEnabled &&
    (style === 'rough-handdrawn' || style === 'sketchy' || style === 'bold-ink' || style === 'stipple');

  useEffect(() => {
    if (!needsClone) {
      if (fxRef.current) fxRef.current.innerHTML = '';
      const cleanSvg = cleanRef.current?.querySelector('svg');
      if (cleanSvg instanceof SVGSVGElement) applyTexture(cleanSvg, m.texture, style, m);
      return;
    }
    const clone = cloneSvg(cleanRef.current, fxRef.current);
    if (!clone) return;
    if (useSmartHachure) {
      // NEW PATH — Smart Hachure System (full F3ModifiersState wired through
      // so roughness · bowing · curveTightness · strokeWidth · multiStroke ·
      // sketchingStyle · endpointBehavior · penTip all feed the outline jitter)
      renderSmartHachure(clone, m, {
        styleChoice: style as SmartHachureStyle,
        inkColor: 'var(--dir-text-primary)',
      });
    } else if (isRoughFamilyStyle(style)) {
      applyRoughTransform(clone, m);
    } else if (style === 'risograph') {
      applyRisographTransform(clone, m);
    } else if (style === 'wireframe') {
      applyWireframeTransform(clone, m);
    }
    applyTexture(clone, m.texture, style, m);
  }, [style, m, children, needsClone, useSmartHachure]);

  const wrapperStyle: CSSProperties = {
    display: 'inline-block',
    position: 'relative',
    opacity: m.inkIntensity < 1.0 ? m.inkIntensity : undefined,
    ['--f3-fill-opacity' as keyof CSSProperties]: String(m.fillOpacity),
    // Consumed by outline-only + wireframe CSS rules (§7.B-1, §7.B-6). For
    // rough-family styles the stroke-width is written inline by the rough.js
    // render so this var is harmless.
    ['--f3-stroke-width' as keyof CSSProperties]: String(m.strokeWidth),
  };

  const strokeAttrVal = needsClone ? 'opts-applied' : m.strokePalette;
  const fillAttrVal = needsClone ? 'opts-applied' : m.fillPalette;

  return (
    <div
      data-svg-style={style}
      data-f3-stroke={strokeAttrVal}
      data-f3-fill={fillAttrVal}
      style={wrapperStyle}
    >
      <style>{`
        [data-svg-style="outline-only"] svg [fill]:not(text) {
          fill: transparent !important;
        }
        [data-svg-style="outline-only"] svg [stroke-width] {
          stroke-width: var(--f3-stroke-width, 1) !important;
        }
        [data-svg-style="wireframe"] svg [fill]:not(text) {
          fill: transparent !important;
        }
        [data-svg-style="wireframe"] svg [stroke-width] {
          stroke-width: var(--f3-stroke-width, 0.8) !important;
        }
        [data-f3-stroke] svg [fill]:not(text):not([fill="transparent"]):not([fill="none"]) {
          fill-opacity: var(--f3-fill-opacity, 1) !important;
        }
        [data-f3-stroke="primary"] svg [stroke]:not([stroke="none"]) { stroke: var(--dir-text-primary) !important; }
        [data-f3-stroke="body"] svg [stroke]:not([stroke="none"]) { stroke: var(--dir-text-body) !important; }
        [data-f3-stroke="body-soft"] svg [stroke]:not([stroke="none"]) { stroke: var(--dir-text-body-soft) !important; }
        [data-f3-stroke="secondary"] svg [stroke]:not([stroke="none"]) { stroke: var(--dir-text-secondary) !important; }
        [data-f3-stroke="detail"] svg [stroke]:not([stroke="none"]) { stroke: var(--dir-detail) !important; }
        [data-f3-stroke="accent"] svg [stroke]:not([stroke="none"]) { stroke: var(--dir-accent, #D4574A) !important; }
        [data-f3-stroke="bg"] svg [stroke]:not([stroke="none"]) { stroke: var(--dir-bg) !important; }
        [data-f3-stroke="neutral"] svg [stroke]:not([stroke="none"]) { stroke: var(--dir-text-body) !important; }
        [data-f3-stroke="inverted"] svg [stroke]:not([stroke="none"]) { stroke: var(--dir-bg) !important; }
        /* Palette overrides remap INK fills only. Exclusions:
           - :not([fill*="--dir-bg"]) — paper stays paper (Polaroid outer rect etc.)
           - :not([fill*="color-mix"]) — wash fills stay as their source color-mix
             wrapper. CSS can't dynamically swap the var() token inside a color-mix
             attribute, so overriding here would FLATTEN the wash to opaque palette
             color (losing the 8% transparency wrapper). Stacked sketchbooks render
             all 4 bars same color instead of alternating wash/ink without this.
             For wash-color migration on palette swap, rough-handdrawn style routes
             through JS mapPaletteColor which properly handles color-mix wrappers.
           Sebs 2026-06-04: "stacked sketchbooks get full all filled the same color." */
        [data-f3-fill="primary"] svg [fill]:not(text):not([fill="transparent"]):not([fill="none"]):not([fill*="--dir-bg"]):not([fill*="color-mix"]) { fill: var(--dir-text-primary) !important; }
        [data-f3-fill="body"] svg [fill]:not(text):not([fill="transparent"]):not([fill="none"]):not([fill*="--dir-bg"]):not([fill*="color-mix"]) { fill: var(--dir-text-body) !important; }
        [data-f3-fill="body-soft"] svg [fill]:not(text):not([fill="transparent"]):not([fill="none"]):not([fill*="--dir-bg"]):not([fill*="color-mix"]) { fill: var(--dir-text-body-soft) !important; }
        [data-f3-fill="secondary"] svg [fill]:not(text):not([fill="transparent"]):not([fill="none"]):not([fill*="--dir-bg"]):not([fill*="color-mix"]) { fill: var(--dir-text-secondary) !important; }
        [data-f3-fill="detail"] svg [fill]:not(text):not([fill="transparent"]):not([fill="none"]):not([fill*="--dir-bg"]):not([fill*="color-mix"]) { fill: var(--dir-detail) !important; }
        [data-f3-fill="accent"] svg [fill]:not(text):not([fill="transparent"]):not([fill="none"]):not([fill*="--dir-bg"]):not([fill*="color-mix"]) { fill: var(--dir-accent, #D4574A) !important; }
        [data-f3-fill="bg"] svg [fill]:not(text):not([fill="transparent"]):not([fill="none"]):not([fill*="color-mix"]) { fill: var(--dir-bg) !important; }
        [data-f3-fill="neutral"] svg [fill]:not(text):not([fill="transparent"]):not([fill="none"]):not([fill*="--dir-bg"]):not([fill*="color-mix"]) { fill: var(--dir-text-body-soft) !important; }
        [data-f3-fill="inverted"] svg [fill]:not(text):not([fill="transparent"]):not([fill="none"]):not([fill*="--dir-bg"]):not([fill*="color-mix"]) { fill: var(--dir-bg) !important; }
      `}</style>
      <div ref={cleanRef} style={{ display: needsClone ? 'none' : 'block' }}>
        {children}
      </div>
      <div ref={fxRef} style={{ display: needsClone ? 'block' : 'none' }} />
    </div>
  );
}

// ─── SHARED TEXTURE FILTER DEFS — static base set + dynamic (charcoal / wet-ink) ──

const TEXTURE_RECIPES: Record<Exclude<TextureStep, 'none'>, {
  type: 'fractalNoise' | 'turbulence';
  baseFrequency: string;
  numOctaves: string;
  seed: string;
  baseScale: number;
  margin: number;
  blur?: number;
}> = {
  light:        { type: 'fractalNoise', baseFrequency: '0.04',       numOctaves: '2', seed: '7',   baseScale: 1.2, margin: 5  },
  heavy:        { type: 'fractalNoise', baseFrequency: '0.06',       numOctaves: '3', seed: '13',  baseScale: 2.5, margin: 8  },
  chalky:       { type: 'fractalNoise', baseFrequency: '0.08',       numOctaves: '4', seed: '29',  baseScale: 3.5, margin: 12 },
  'paper-tooth':{ type: 'fractalNoise', baseFrequency: '0.18',       numOctaves: '2', seed: '41',  baseScale: 1.4, margin: 6  },
  ribbed:       { type: 'fractalNoise', baseFrequency: '0.02 0.6',   numOctaves: '2', seed: '53',  baseScale: 2.2, margin: 8  },
  stipple:      { type: 'fractalNoise', baseFrequency: '0.45',       numOctaves: '3', seed: '67',  baseScale: 1.6, margin: 6  },
  'wet-ink':    { type: 'fractalNoise', baseFrequency: '0.05',       numOctaves: '2', seed: '79',  baseScale: 1.3, margin: 8, blur: 0.4 },
  smudge:       { type: 'fractalNoise', baseFrequency: '0.025 0.12', numOctaves: '3', seed: '89',  baseScale: 4.2, margin: 12 },
  canvas:       { type: 'turbulence',   baseFrequency: '0.22',       numOctaves: '2', seed: '103', baseScale: 1.8, margin: 8  },
};

export function TextureFilterDefs() {
  const { state: style } = useF3SvgStyle();
  const { state: m } = useF3RoughModifiers();

  const activeTexture = m.texture !== 'none' ? m.texture : null;
  const recipe = activeTexture ? TEXTURE_RECIPES[activeTexture] : null;
  const margin = recipe ? recipe.margin : 8;

  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        {/* Skip the recipe-driven filter for charcoal + wet-ink — those styles
            have dedicated <filter> blocks below with the right params, and
            buildDynamicFilterId returns the SAME id for both paths so the DOM
            would have two filters with the same id (browser honors only one,
            usually the recipe one, swallowing the dedicated filter's color-
            matrix + extra feTurbulence stages). Surfaced by /audit 2026-06-08
            when wet-ink looked identical to clean despite the dedicated filter
            apparently being defined. */}
        {recipe && activeTexture && style !== 'charcoal' && style !== 'wet-ink' && (
          <filter
            id={buildDynamicFilterId(style, m)}
            x={`${-margin}%`}
            y={`${-margin}%`}
            width={`${100 + margin * 2}%`}
            height={`${100 + margin * 2}%`}
          >
            {recipe.blur !== undefined && (
              <feGaussianBlur in="SourceGraphic" stdDeviation={recipe.blur * m.textureIntensity} result="blurred" />
            )}
            {/* baseFrequency drives the dot/grain density. For the 'stipple'
                texture (newsprint + stipple style), let dotSpacing modulate
                it — higher dotSpacing = lower frequency = larger / sparser
                dots. dotSpacing default = 4; scale inverse-linearly. */}
            <feTurbulence
              type={recipe.type}
              baseFrequency={
                activeTexture === 'stipple'
                  ? String((parseFloat(recipe.baseFrequency) * 4) / Math.max(1, m.dotSpacing))
                  : recipe.baseFrequency
              }
              numOctaves={recipe.numOctaves}
              seed={recipe.seed}
              result="noise"
            />
            {/* dotSize amplifies the displacement scale on stipple texture
                so the user can dial the dot/grain prominence. Multiplier is
                m.dotSize directly (default 1.0-1.2 → near baseline). */}
            <feDisplacementMap
              in={recipe.blur !== undefined ? 'blurred' : 'SourceGraphic'}
              in2="noise"
              scale={recipe.baseScale * m.textureIntensity * (activeTexture === 'stipple' ? m.dotSize : 1)}
            />
          </filter>
        )}
        {style === 'charcoal' && (
          <filter id={buildDynamicFilterId('charcoal', m)} x="-14%" y="-14%" width="128%" height="128%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${0.03 + m.grainIntensity * 0.02} ${0.03 + m.grainIntensity * 0.02 + m.smudgeAmount * 0.05}`}
              numOctaves="3"
              seed="29"
              result="noise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={(1.5 + m.grainIntensity * 1.0 + m.smudgeAmount * 1.5) * m.textureIntensity} result="displaced" />
            {m.pressureVariance > 0 && (
              <>
                <feTurbulence type="fractalNoise" baseFrequency={0.4 + m.pressureVariance * 0.3} numOctaves="2" seed="37" result="pressureNoise" />
                <feDisplacementMap in="displaced" in2="pressureNoise" scale={m.pressureVariance * 3 * m.textureIntensity} />
              </>
            )}
          </filter>
        )}
        {style === 'wet-ink' && (
          <filter id={buildDynamicFilterId('wet-ink', m)} x="-14%" y="-14%" width="128%" height="128%">
            {/* WET-INK FILTER — rewritten 2026-06-08 after Sebs flagged the
                prior version as "just a blur mask over everything." The fix:
                keep SourceGraphic CRISP, build a soft bleed halo by
                dilating + blurring + fading + displacing, then composite
                source ON TOP of the halo. Result: crisp stroke with
                capillary-bleed shadow behind it — actual wet-ink character,
                not uniform softness. */}
            {/* 1. Dilate strokes by `bleed × 1.5` px → halo's spread. */}
            <feMorphology
              in="SourceGraphic"
              operator="dilate"
              radius={m.bleed * 1.5 * m.textureIntensity}
              result="dilated"
            />
            {/* 2. Blur the dilated mask by `blurAmount` → halo softness. */}
            <feGaussianBlur
              in="dilated"
              stdDeviation={m.blurAmount * m.textureIntensity}
              result="haloBlurred"
            />
            {/* 3. Paper-grain displacement on the halo only (not source). */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency={0.04 + m.bleed * 0.06}
              numOctaves="2"
              seed="79"
              result="paperGrain"
            />
            <feDisplacementMap
              in="haloBlurred"
              in2="paperGrain"
              scale={(1.0 + m.bleed * 2.0) * m.textureIntensity}
              result="haloDisplaced"
            />
            {/* 4. Drop halo alpha so it reads as bleed-through, not a stroke. */}
            <feColorMatrix
              in="haloDisplaced"
              type="matrix"
              values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${0.45 + m.bleed * 0.25} 0`}
              result="haloFaded"
            />
            {/* 5. Composite crisp source OVER the bleed halo. */}
            <feComposite
              in="SourceGraphic"
              in2="haloFaded"
              operator="over"
            />
          </filter>
        )}
      </defs>
    </svg>
  );
}

// Suppress unused-import warnings for types that are exported through the
// public surface but not referenced in this file directly.
export type { F3SvgStyle, EndpointBehaviorStep, SketchingStyleStep, PenTipStep };
