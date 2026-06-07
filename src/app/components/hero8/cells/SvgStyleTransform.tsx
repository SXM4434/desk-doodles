import { useEffect, useMemo, useRef, type ReactNode, type CSSProperties } from 'react';
// Smart Hachure System (v1) — opt-in via `?smartHachure=1` URL param.
// See `docs/labs/hero/cells/F3-smart-hachure-system/06-architecture-technical-core.md`.
import { renderSmartHachure, type SmartHachureStyle } from '../../../lib/smartHachure';
import rough from 'roughjs';
import type { Options as RoughOptions } from 'roughjs/bin/core';
import { useF3SvgStyle, isRoughFamilyStyle, type F3SvgStyle } from '../../../state/F3SvgStyleContext';
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
} from '../../../state/F3RoughModifiersContext';
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
} from '../../../lib/f3HandFeel';

// ─── PER-STYLE PRESETS — applied at preset-reset; state values override ──

// When user clicks "Reset to preset" while a style is active, these values
// snap the state. Live render uses raw state values, not these.
export const STYLE_PRESETS: Record<F3SvgStyle, Partial<F3ModifiersState>> = {
  // Non-rough styles set wobble: 0 (clean baseline; jitter inactive).
  // Rough-family styles set wobble: 1.0 (playground calibration baseline per I-11).
  'clean':           { wobble: 0, roughness: 0, bowing: 0, strokeWidth: 1.0, inkIntensity: 1.0, fillOpacity: 1.0, texture: 'none', fillStyle: 'hachure' },
  'outline-only':    { wobble: 0, roughness: 0, bowing: 0, strokeWidth: 1.0, inkIntensity: 1.0, fillOpacity: 0,   texture: 'none' },
  'wireframe':       { wobble: 0, roughness: 0, bowing: 0, strokeWidth: 0.8, inkIntensity: 1.0, fillOpacity: 0, texture: 'none' },
  'wet-ink':         { wobble: 0.6, strokeWidth: 1.2, inkIntensity: 1.0, fillOpacity: 0.9, texture: 'wet-ink',  blurAmount: 0.4, bleed: 0.15 },
  'charcoal':        { wobble: 1.0, strokeWidth: 1.4, inkIntensity: 1.0, fillOpacity: 1.0, texture: 'chalky',   grainIntensity: 2.5, smudgeAmount: 0, pressureVariance: 0.3 },
  'newsprint':       { wobble: 0, strokeWidth: 0.9, inkIntensity: 1.0, fillOpacity: 1.0, texture: 'stipple', dotSize: 1.2, dotSpacing: 4, dotPattern: 'staggered' },
  'risograph':       { wobble: 0.4, strokeWidth: 1.0, inkIntensity: 1.0, fillOpacity: 0.7, texture: 'none',     offsetDistance: 2, offsetAngle: 45, colorShift: 0.7, risoSecondaryColor: 'accent', registrationError: 0 },
  'rough-handdrawn': { wobble: 1.0, roughness: 1.6, bowing: 1.0, strokeWidth: 1.2, curveTightness: 0, multiStroke: 'double', fillStyle: 'hachure', hachureGap: 4, hachureAngle: -41, fillDensity: 0.7, texture: 'paper-tooth' },
  'sketchy':         { wobble: 0.6, roughness: 0.8, bowing: 0.4, strokeWidth: 0.9, curveTightness: 0, multiStroke: 'single', fillStyle: 'none', hachureGap: 4, hachureAngle: -41, fillDensity: 0.5, texture: 'light', inkIntensity: 0.85 },
  'bold-ink':        { wobble: 0.4, roughness: 0.6, bowing: 0.2, strokeWidth: 2.8, curveTightness: 0, multiStroke: 'off', fillStyle: 'solid', fillDensity: 1.0, texture: 'none' },
  'stipple':         { wobble: 0.8, roughness: 1.2, bowing: 0.7, strokeWidth: 0.7, curveTightness: 0, multiStroke: 'single', fillStyle: 'dots', hachureGap: 2.5, hachureAngle: 0, fillDensity: 1.0, texture: 'stipple', dotSize: 1.0, dotSpacing: 3, dotScatter: 0.3 },
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
  const base = Math.max(0.6, strokeWidth * 1.0);
  const step = Math.max(0.15, strokeWidth * 0.2);
  const magnitude = Math.min(4, base + (layerIndex - 1) * step);
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
};

/** Compute protrude scale from a shape's smaller dimension. Playground baseline
 *  is ~140px; below that we scale down so endpoints don't blow out. */
function protrudeScaleForBbox(bboxMin: number): number {
  return Math.max(0.25, Math.min(1.0, bboxMin / 140));
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
 *  don't fully overlap on tiny items. ~30px per supported layer. */
function effectiveLayerCount(userLayers: number, bboxMin: number): number {
  const sizeCappedLayers = Math.max(1, Math.ceil(bboxMin / 30));
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
  const maxUseful = Math.max(0.3, bboxMin / 60);
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
  const layerCount = effectiveLayerCount(ms.layerCount, ctx.bboxMin);
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
  // parallel-pass pivot).
  const layer0Points = buildPoints(seeds[0], { endpointBehavior, sketchingStyle, layerIndex: 0 });
  const { cx: cxCentroid, cy: cyCentroid } = centroidOf(layer0Points);

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
    basePath.setAttribute('d', pointsToPolylinePath(layer0Points, true));
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
    let pts = buildPoints(seed, mods);
    pts = applyLayerTransform(pts, sketchingStyle, i, cxCentroid, cyCentroid, isClosed);

    // Compute per-layer transform. Single-pass + layer≥1 gets the stable
    // micro-nudge (visible multi-stroke at any roughness). loose-overlap
    // keeps its existing larger translate. parallel-pass + cross-hatch are
    // already applied to points via applyLayerTransform.
    let layerTransform = '';
    if (i > 0) {
      if (sketchingStyle === 'loose-overlap') {
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
      const canUseBuiltPath =
        ctx.buildPath !== undefined &&
        sketchingStyle !== 'cross-hatch' &&
        sketchingStyle !== 'parallel-pass';
      let d: string;
      if (canUseBuiltPath) {
        d = ctx.buildPath!(seed, mods);
      } else {
        // Fallback for cross-hatch / parallel-pass (need per-vertex transforms)
        // or shapes without a playground-native builder (polygon/polyline).
        const wobbleForCurves = effectiveWobble(m.wobble, ctx.bboxMin);
        d = pointsToPolylinePath(pts, isClosed, m.bowing, m.curveTightness, seed, wobbleForCurves);
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
    // I-11: wobble is THE master path-jitter axis. rough.js's `roughness` param
    // controls path waviness — exactly what wobble represents conceptually
    // (path/motion trajectory). Use wobble here so `<path>` content jitters
    // uniformly with shape primitives. m.roughness is reserved for the future
    // Surface Texture cluster repurpose (3D PBR-style stroke-surface quality).
    roughness: m.wobble,
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

export function transformElement(
  el: SVGElement,
  rc: ReturnType<typeof rough.svg>,
  m: F3ModifiersState,
  seed: number,
  ownerDoc: Document,
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
      // I-11: wobble is THE master jitter multiplier on HAND_FEEL_BASE (mirrors
      // playground). Size-aware clamp via effectiveWobble.
      const ROUGH = HAND_FEEL_BASE.rect * effectiveWobble(m.wobble, bboxMin);
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
      // I-11: wobble master, size-clamped (see rect case)
      const ROUGH = HAND_FEEL_BASE.oval * effectiveWobble(m.wobble, bboxMin);
      return renderHandFeelShape({
        ROUGH,
        baseSeed: seed,
        isClosed: true,
        bboxMin,
        rc,
        buildPoints: (s, mods) => roughOvalPoints(x, y, w, h, ROUGH, s, mods, pScale),
        // Playground-native cubic-Bezier oval + bowing/curve extension
        buildPath: (s, mods) => roughOvalPathExtended(x, y, w, h, ROUGH, m.bowing, m.curveTightness, s, mods),
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
      // I-11: wobble master, size-clamped (see rect case)
      const ROUGH = HAND_FEEL_BASE.oval * effectiveWobble(m.wobble, bboxMin);
      return renderHandFeelShape({
        ROUGH,
        baseSeed: seed,
        isClosed: true,
        bboxMin,
        rc,
        buildPoints: (s, mods) => roughOvalPoints(x, y, w, h, ROUGH, s, mods, pScale),
        // Playground-native cubic-Bezier oval + bowing/curve extension
        buildPath: (s, mods) => roughOvalPathExtended(x, y, w, h, ROUGH, m.bowing, m.curveTightness, s, mods),
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
      // I-11: wobble master, size-clamped (uses lineLen as the size proxy)
      const ROUGH = HAND_FEEL_BASE.line * effectiveWobble(m.wobble, lineLen);
      return renderHandFeelShape({
        ROUGH,
        baseSeed: seed,
        isClosed: false,
        bboxMin: lineLen,
        rc,
        buildPoints: (s, mods) => roughLinePoints(x1, y1, x2, y2, ROUGH, s, mods, pScale),
        // Playground-native cubic-Bezier line + bowing/curve extension
        buildPath: (s, mods) => roughLinePathExtended(x1, y1, x2, y2, ROUGH, m.bowing, m.curveTightness, s, mods),
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
      // I-11: wobble master, size-clamped
      const effW = effectiveWobble(m.wobble, bboxMin);
      const ROUGH = HAND_FEEL_BASE.rect * effW;
      const ROUGH_LINE = HAND_FEEL_BASE.line * effW;
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

      // Detect closed path (ends with Z or z, possibly with whitespace)
      const isClosed = /[zZ]\s*$/.test(d.trim());

      // Sample at ~12px intervals — enough resolution to follow curves while
      // keeping segment count moderate (long enough for cubic-bezier wobble to
      // bend visibly per the playground pattern).
      const sampleSpacing = 12;
      const numSamples = Math.max(4, Math.ceil(totalLen / sampleSpacing));
      const cleanPoints: Array<[number, number]> = [];
      for (let i = 0; i <= numSamples; i++) {
        const t = (i / numSamples) * totalLen;
        const p = tmpPath.getPointAtLength(t);
        cleanPoints.push([p.x, p.y]);
      }
      parentSvg.removeChild(tmpPath);

      // Closed paths: collapse last point to first for clean loop
      if (isClosed && cleanPoints.length > 1) {
        cleanPoints[cleanPoints.length - 1] = [...cleanPoints[0]] as [number, number];
      }

      // Bbox + centroid for size-aware clamps + radial endpoint protrude on closed paths
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
      const pScale = protrudeScaleForBbox(bboxMin);
      const effW = effectiveWobble(m.wobble, bboxMin);
      const ROUGH = HAND_FEEL_BASE.line * effW;
      const pathCentroidX = cleanPoints.length > 0 ? sumX / cleanPoints.length : 0;
      const pathCentroidY = cleanPoints.length > 0 ? sumY / cleanPoints.length : 0;

      return renderHandFeelShape({
        ROUGH,
        baseSeed: seed,
        isClosed,
        bboxMin,
        rc,
        buildPoints: (s, mods) => {
          // Wobble jitter on every point + endpoint behavior:
          //   - CLOSED paths: push each point RADIALLY outward from centroid
          //     by `protrude` amount (matches playground roughRectPath line
          //     180-184 corner protrusion behavior — applies to all "corners"
          //     of the closed path, not just hypothetical endpoints).
          //   - OPEN paths: extend first/last point along path direction.
          // Plus loose-overlap shift per layer (on first/last for open, all-radial for closed).
          const r = seededRandom(s);
          const j = () => (r() - 0.5) * 2 * ROUGH;
          // Endpoint amounts: playground radial values (4/9), but kink reduced
          // (random-angle push reads as more dramatic per px than radial push).
          // Sebs 2026-06-04 calibration: "kink per corner but not as much."
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
              ? mods.layerIndex * 3  // playground LOOSE_OVERLAP_AMOUNT
              : 0;
          // KINK gets ALL its shift as random-angle (not radial).
          // Other protrude modes get radial outward / path-direction extension + looseOffset.
          const totalShift = isKinkMode ? looseOffset : (protrude + looseOffset);
          const out: Array<[number, number]> = [];
          for (let i = 0; i < cleanPoints.length; i++) {
            const [px, py] = cleanPoints[i];
            let extendX = 0, extendY = 0;
            // KINK: random-angle push per point — produces twitchy/spasm
            // character, distinct from protrude's regular outward push.
            if (isKinkMode) {
              const angle = r() * Math.PI * 2;
              extendX += Math.cos(angle) * protrude;
              extendY += Math.sin(angle) * protrude;
            }
            if (totalShift > 0) {
              if (isClosed) {
                // Push each point radially OUTWARD from path centroid
                const dx = px - pathCentroidX;
                const dy = py - pathCentroidY;
                const len = Math.max(0.01, Math.hypot(dx, dy));
                extendX += (dx / len) * totalShift;
                extendY += (dy / len) * totalShift;
              } else if (i === 0 && cleanPoints.length > 1) {
                // Open path: extend first point backward along path direction
                const [nx, ny] = cleanPoints[1];
                const dx = nx - px;
                const dy = ny - py;
                const len = Math.max(0.01, Math.hypot(dx, dy));
                extendX += -(dx / len) * totalShift;
                extendY += -(dy / len) * totalShift;
              } else if (i === cleanPoints.length - 1 && cleanPoints.length > 1) {
                // Open path: extend last point forward along path direction
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
        // No playground-native path-builder for arbitrary paths — falls back to
        // pointsToPolylinePath (which now has wobble-driven control-point jitter
        // from earlier Day 1 edit). Bowing + curve apply via that fallback too.
      }, m, el, ownerDoc);
    }
    case 'text':
      return [el.cloneNode(true) as SVGElement];
    case 'g': {
      const flat: SVGElement[] = [];
      Array.from(el.children).forEach((child, idx) => {
        if (child instanceof SVGElement) {
          flat.push(...transformElement(child, rc, m, seed + idx * 17, ownerDoc));
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

export function Hero8TextureFilterDefs() {
  const { state: style } = useF3SvgStyle();
  const { state: m } = useF3RoughModifiers();

  const activeTexture = m.texture !== 'none' ? m.texture : null;
  const recipe = activeTexture ? TEXTURE_RECIPES[activeTexture] : null;
  const margin = recipe ? recipe.margin : 8;

  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        {recipe && activeTexture && (
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
            <feTurbulence type={recipe.type} baseFrequency={recipe.baseFrequency} numOctaves={recipe.numOctaves} seed={recipe.seed} result="noise" />
            <feDisplacementMap
              in={recipe.blur !== undefined ? 'blurred' : 'SourceGraphic'}
              in2="noise"
              scale={recipe.baseScale * m.textureIntensity}
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
          <filter id={buildDynamicFilterId('wet-ink', m)} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={m.blurAmount * m.textureIntensity} result="blurred" />
            <feTurbulence
              type="fractalNoise"
              baseFrequency={0.04 + m.bleed * 0.08}
              numOctaves="2"
              seed="79"
              result="noise"
            />
            <feDisplacementMap in="blurred" in2="noise" scale={(0.8 + m.bleed * 2.5) * m.textureIntensity} />
            <feColorMatrix
              type="matrix"
              values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${1 - m.bleed * 0.3} 0`}
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
