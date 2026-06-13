// Smart Hachure System — region renderer.
//
// Takes a region (SVGElement) + Treatment + RenderContext, produces SVG
// elements that replace the original in the output.
//
// Two render paths:
//   - HACHURE path: treatment.fillStyle is a mark style → rough.js generates
//     the hachure / cross-hatch / dots / etc., clipped to the region's geometry
//   - OUTLINE-ONLY path: treatment.fillStyle === 'none' → return the region
//     as-is so the existing outline render handles it (frame / accent / line)
//
// Architecture: signals → classify → select treatment → RENDER
// See `docs/labs/hero/cells/F3-smart-hachure-system/06-architecture-technical-core.md`

import rough from 'roughjs';
import type { Options as RoughOptions } from 'roughjs/bin/core';
import type { Treatment } from './types';
import {
  COVERAGE_BANDS,
  bandIndexForDarkness,
  coverageToParams,
  darknessToCoverage,
  paramsToCoverage,
  isCoverageFillStyle,
} from '../smart/coverage';

// ─── PUBLIC ENTRY POINT ───────────────────────────────────────────────────

/** Per-call rendering context — owner doc, rough.js instance, seed source. */
export type RenderContext = {
  /** Owning SVG document — used for `createElementNS` calls. */
  ownerDoc: Document;
  /** A rough.js SVG generator bound to the target SVG. */
  rc: ReturnType<typeof rough.svg>;
  /** Base seed for deterministic mark generation. Same input → same marks. */
  baseSeed: number;
  /** Ink color for marks (resolved CSS color string). */
  inkColor: string;
  /** Region's source darkness (the classifier's `darknessL` signal, 0 = paper
   *  · 1 = ink). When present, density is RECALIBRATED from it: darkness →
   *  Murray-Davies coverage → 8-band quantization → per-fillStyle inverse
   *  (smart-system-build-plan Phase A row — THE visible change). Absent →
   *  behavior-preserving round-trip of the treatment's own calibration. */
  sourceDarkness?: number;
  /** User hachureGap-slider bias ratio (slider ÷ its default 4). Multiplies
   *  the darkness-solved gap so the slider stays live as bias-within-band
   *  (I-3: all sliders stay; smart owns the center, the user owns the lean).
   *  1 = neutral (default slider position). Only read by the darkness branch. */
  gapBias?: number;
};

/**
 * Render marks for one classified region.
 *
 * Returns an array of SVG elements to INSERT in place of the original.
 *   - Empty array → caller should skip this region (paper / structural / line)
 *   - One or more elements → marks to render
 */
export function renderRegion(
  region: SVGElement,
  treatment: Treatment,
  ctx: RenderContext,
): SVGElement[] {
  // OUTLINE-ONLY path — no marks generated, caller preserves source as-is
  if (treatment.fillStyle === 'none') return [];

  // HACHURE path — call rough.js with the treatment's params, clip to region
  return renderHachureFamily(region, treatment, ctx);
}

// ─── HACHURE FAMILY RENDERER (chunk 6a) ───────────────────────────────────
//
// For tonal-role regions (sparse-tonal · mid-tonal · dense-tonal · solid-content),
// generate hachure / cross-hatch / dots / zigzag marks via rough.js, clipped to
// the region's geometry.

function renderHachureFamily(
  region: SVGElement,
  treatment: Treatment,
  ctx: RenderContext,
): SVGElement[] {
  // Convert region's geometry into a path string rough.js can clip to.
  const pathD = extractRegionPath(region);
  if (pathD === null) return []; // Region has no fillable geometry

  // Density math routes through the shared coverage module (smart Phase A —
  // one math, two renderers). See resolveDensity below.
  const density = resolveDensity(treatment, ctx);

  // Build rough.js options from the treatment.
  // Map our biasMode → rough.js hachure angle variation:
  //   gap-dominant  = single direction (use treatment angle as-is)
  //   layers-dominant = cross-hatch handles 2nd direction internally
  //   weight-dominant = single direction; weight does the tonal work
  //   hybrid        = single direction; modifiers do tonal work
  const fillOpts: RoughOptions = {
    seed: ctx.baseSeed,
    stroke: 'none',
    fill: ctx.inkColor,
    fillStyle: treatment.fillStyle as RoughOptions['fillStyle'],
    hachureGap: density.gap,
    fillWeight: density.weight,
    // Hachure angle from the user's hachureAngle modifier, routed via the
    // treatment (default -41° per spec when unset), plus a tiny constant
    // epsilon (18-scope-audit §H-6 edge-case policy: jitter the scan
    // alignment so scan lines can't pass exactly through polygon corners —
    // the Inkscape-documented stray-hachure bug). Deterministic constant,
    // imperceptible at 0.07°, preserves I-7 determinism.
    hachureAngle: treatment.angle + 0.07,
    // Disable rough.js's per-mark roughness on the hachure layer itself —
    // we want clean parallel lines clipped to a possibly-jittered outline,
    // not jittered hachure lines (artistically distracting).
    roughness: 0,
  };

  const hachureGroup = ctx.rc.path(pathD, fillOpts);
  if (!hachureGroup) return [];

  hachureGroup.setAttribute('data-smart-hachure', 'tonal');
  // Apply treatment opacity at the group level — preserves per-stroke
  // alpha for downstream filters (texture grain, etc.)
  hachureGroup.setAttribute('opacity', String(treatment.opacity));
  // Density receipts — the RENDERED numbers (post-recalibration), stamped
  // here because resolveDensity is where truth lives now; index.ts stamps
  // role/confidence provenance, never density.
  stampDensity(hachureGroup, density);

  // If layerCount > 1, generate additional layers offset slightly so they
  // accumulate tonal density without overlapping perfectly.
  // (rough.js's cross-hatch handles 2 directions internally — additional
  // layers go beyond that.)
  const extraLayers = Math.max(0, density.layers - 1);
  if (extraLayers === 0 || treatment.fillStyle === 'cross-hatch') {
    return [hachureGroup];
  }

  const out: SVGElement[] = [hachureGroup];
  for (let i = 1; i <= extraLayers; i++) {
    const layerOpts: RoughOptions = {
      ...fillOpts,
      seed: ctx.baseSeed + i * 100,
      // Offset subsequent layers' angle slightly (Agent 1 — cross-hatch at
      // 60-75° not 90°). Layer i offsets by 22° per layer, relative to the
      // user's chosen treatment angle so the whole hatch family rotates with
      // the hachureAngle slider.
      hachureAngle: treatment.angle + 22 * i,
    };
    const layerGroup = ctx.rc.path(pathD, layerOpts);
    if (layerGroup) {
      layerGroup.setAttribute('data-smart-hachure', `tonal-layer-${i}`);
      layerGroup.setAttribute('opacity', String(treatment.opacity));
      stampDensity(layerGroup, density);
      out.push(layerGroup);
    }
  }
  return out;
}

/** Stamp the rendered density numbers for DevTools / harness receipts. */
function stampDensity(
  el: SVGElement,
  density: { gap: number; weight: number; layers: number; band: number | null; coverage: number | null },
): void {
  el.setAttribute('data-smart-gap', density.gap.toFixed(2));
  el.setAttribute('data-smart-weight', density.weight.toFixed(2));
  el.setAttribute('data-smart-layers', String(density.layers));
  if (density.band !== null) el.setAttribute('data-smart-band', String(density.band));
  if (density.coverage !== null) el.setAttribute('data-smart-coverage', density.coverage.toFixed(3));
}

// ─── DENSITY RESOLUTION — ONE MATH, TWO RENDERERS (smart Phase A) ─────────
//
// RECALIBRATED (Phase A row, smart-system-build-plan — THE visible change):
// when the render context carries the region's source darkness, density is
// driven by it — NOT by the role table's legacy gap heuristics:
//
//   darknessL ──bandIndexForDarkness──► band (0..7, Praun TAM cell)
//   band midpoint darkness ──darknessToCoverage──► target ink coverage
//        (Murray-Davies inverse — 21-research §4; quantized so every region
//         inside one band renders IDENTICAL density: I-2's 8-level identity)
//   target ──coverageToParams (per-fillStyle inverse, weight-anchored)──► gap
//   layers = band's tamLayers column (cross-hatch keeps layerCount 1 —
//        rough.js stacks its 2nd direction internally and renderHachureFamily
//        never adds extra passes for it; the forward model already accounts)
//
// The user's sliders all stay live (I-3 bias-within-band):
//   strokeWidth · fillDensity → the anchored weight (via techniqueMap)
//   hachureGap → ctx.gapBias multiplies the solved gap (1 = neutral default)
//   hachureAngle / fillOpacity / inkIntensity → angle + opacity, untouched
//
// Render policy (Agent 5 — same locked bounds techniqueMap enforces on its
// own gap): solved gap clamps to [1.5, 12] px, weight caps at 0.7 × gap so
// lines never merge to solid. Where the bounds bind, delivered coverage
// honestly saturates — the bound is the locked perceptual contract.
//
// FALLBACK (no sourceDarkness in ctx — e.g. a direct renderRegion caller):
// behavior-preserving round-trip of the treatment's own calibration through
// the same module (forward → inverse, exact by construction; snapToAnchor
// strips ≤1-ulp float residue and UNMASKS any larger disagreement).

const POLICY_GAP_FLOOR = 1.5; // px — lines never optically blend (Agent 5)
const POLICY_GAP_CAP = 12; // px — beyond this, lines read as strokes not tone
const POLICY_WEIGHT_RATIO = 0.7; // weight ≤ 0.7 × gap — never merge to solid

// UPPER-DARKNESS GUARD (dark-blob re-fix, 2026-06-13). THE missing render half.
//
// Murray-Davies pins coverage → 1.0 once source darkness ≳ 0.63, and the
// gap-floor re-solve then delivers ~0.91 effective cross-hatch coverage at the
// 1.5 px floor — a structure-losing SOLID-BLACK BLOB (knockout text/panels
// overwhelmed, no readable gaps). The GOAL is LEGIBLE DENSE HAND-DRAWN
// HATCHING: clearly pen lines with gaps, internal structure still readable,
// dark but NOT solid. So we CAP the target coverage for the darkness-driven
// solve below the reads-as-solid threshold. At this cap the cross-hatch solves
// to gap ≈ 2.3 px at a 1.05 px line weight (w/g ≈ 0.45) — visibly gapped dense
// hatching that still reads DARK. Empirically (the blob probe): footprint dark
// fraction drops from ~0.6–0.8 (blob) to a legible dense register while paper
// gaps inside the body rise enough to keep knockout structure readable.
//
// This is a RENDER-POLICY ceiling on tone (like the gap floor / weight ratio),
// not a change to the documented coverage math (coverage.ts is untouched). It
// applies ONLY to the source-darkness recalibration branch — the branch that
// produces the dark-region tone. Slider bias still rides on top.
const COVERAGE_LEGIBLE_DENSE_CAP = 0.72;

function resolveDensity(
  treatment: Treatment,
  ctx: RenderContext,
): { gap: number; weight: number; layers: number; band: number | null; coverage: number | null } {
  const { fillStyle } = treatment;
  // 'solid' has no density axes (coverage ≡ 1); degenerate gap/weight (≤ 0
  // or non-finite) can't carry coverage — pass both through untouched.
  if (
    !isCoverageFillStyle(fillStyle) ||
    !Number.isFinite(treatment.gap) ||
    !Number.isFinite(treatment.weight) ||
    treatment.gap <= 0 ||
    treatment.weight <= 0
  ) {
    return {
      gap: treatment.gap,
      weight: treatment.weight,
      layers: treatment.layerCount,
      band: null,
      coverage: null,
    };
  }

  // ── RECALIBRATION BRANCH — source darkness drives density ──
  const d = ctx.sourceDarkness;
  if (d !== undefined && Number.isFinite(d)) {
    const band = bandIndexForDarkness(d);
    const bandDef = COVERAGE_BANDS[band];
    // Band midpoint = the quantized tone for every region in this band.
    const dQuant = (bandDef.darknessMin + bandDef.darknessMax) / 2;
    // UPPER-DARKNESS GUARD: cap the dark-region tone target below the
    // reads-as-solid threshold so a high-darkness region renders as LEGIBLE
    // DENSE HATCHING (visible gaps, knockout structure readable) instead of a
    // solid-black blob. Light/mid bands are untouched — their targets sit far
    // below the cap, so only the Dark/Near-black/black bands (the blob bands)
    // are reined in. See COVERAGE_LEGIBLE_DENSE_CAP note above.
    const rawTarget = darknessToCoverage(dQuant);
    const targetCoverage = Math.min(rawTarget, COVERAGE_LEGIBLE_DENSE_CAP);
    // When the upper-darkness guard BINDS (dark/near-black/black bands), the
    // dot/zigzag/dashed grammars would otherwise stack the band's full TAM
    // nesting depth (3–4 layers) — and overlapping passes at the gap floor fill
    // the inter-dot gaps into a near-solid MASS even though each layer is sparse
    // (the stipple half of the blob: a dot field that reads solid). Cross-hatch
    // is exempt (rough.js handles its 2 internal directions; layerCount stays).
    // Capping the nesting depth at 2 where the guard binds keeps the dark dot
    // screen LEGIBLY STIPPLED (visible dots + gaps) instead of massing.
    const guardBinds = rawTarget > COVERAGE_LEGIBLE_DENSE_CAP;
    const bandLayers = guardBinds
      ? Math.min(2, bandDef.tamLayers || 1)
      : bandDef.tamLayers || 1;
    const layers =
      fillStyle === 'cross-hatch'
        ? Math.max(1, treatment.layerCount)
        : Math.max(1, bandLayers);

    // 1. Weight-anchored solve (user's strokeWidth/fillDensity own weight).
    const solved = coverageToParams(targetCoverage, fillStyle, {
      weight: treatment.weight,
      layers,
    });
    let gap = solved.gap;
    let weight = solved.weight;

    // 2. If the POLICY bounds bind the solved gap, the tone target re-solves
    //    along the OTHER axis at the bound (coverage.ts gap-anchored mode) —
    //    21-research §4's function shape returns weight as an output, and
    //    saturating tone silently would break I-2 harder than nudging weight.
    //    Matters most for dots: coverage ∝ (w/g)², so the 1.5 px floor alone
    //    would crush dark stipple bands to ~0.2 coverage at thin pen weights.
    if (gap < POLICY_GAP_FLOOR || gap > POLICY_GAP_CAP) {
      gap = Math.max(POLICY_GAP_FLOOR, Math.min(POLICY_GAP_CAP, gap));
      weight = coverageToParams(targetCoverage, fillStyle, { gap, layers }).weight;
    }

    // 3. User hachureGap bias rides ON TOP of the policy-fitted solve (never
    //    weight-compensated — compensating would cancel the slider). Clamped
    //    to the same bounds.
    const gapBias =
      ctx.gapBias !== undefined && Number.isFinite(ctx.gapBias) && ctx.gapBias > 0
        ? ctx.gapBias
        : 1;
    gap = Math.max(POLICY_GAP_FLOOR, Math.min(POLICY_GAP_CAP, gap * gapBias));

    // 4. Lines never merge to solid (Agent 5) — final ratio cap.
    weight = Math.min(weight, gap * POLICY_WEIGHT_RATIO);

    return { gap, weight, layers, band, coverage: targetCoverage };
  }

  // ── FALLBACK — behavior-preserving round-trip of the treatment ──
  const layers = Math.max(1, treatment.layerCount);
  const targetCoverage = paramsToCoverage(
    { gap: treatment.gap, weight: treatment.weight, layers },
    fillStyle,
  );
  const params = coverageToParams(targetCoverage, fillStyle, {
    weight: treatment.weight,
    layers,
  });
  return {
    gap: snapToAnchor(params.gap, treatment.gap),
    weight: snapToAnchor(params.weight, treatment.weight),
    layers: params.layers,
    band: null,
    coverage: targetCoverage,
  };
}

/** Strip float-division residue: if the computed value matches its anchor to
 *  1e-9 relative, return the anchor bit-exactly (rough.js scan-line layout is
 *  a function of gap — bit-identical input → bit-identical marks). Larger
 *  deviations pass through UNMASKED: if the coverage math ever disagrees
 *  with the calibration, the render (and the screenshot gate) must show it,
 *  never hide it. */
function snapToAnchor(computed: number, anchor: number): number {
  if (computed === anchor) return anchor;
  const scale = Math.max(Math.abs(anchor), 1e-12);
  return Math.abs(computed - anchor) / scale < 1e-9 ? anchor : computed;
}

// ─── GEOMETRY EXTRACTION ──────────────────────────────────────────────────
//
// Convert each SVG primitive into a path string rough.js can clip hachure to.
// rough.js's `polygonHachureLines` accepts arbitrary closed polygon paths and
// handles concave shapes correctly (per Agent 2 verification).

function extractRegionPath(el: SVGElement): string | null {
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case 'rect': {
      const x = parseFloat(el.getAttribute('x') ?? '0');
      const y = parseFloat(el.getAttribute('y') ?? '0');
      const w = parseFloat(el.getAttribute('width') ?? '0');
      const h = parseFloat(el.getAttribute('height') ?? '0');
      if (w === 0 || h === 0) return null;
      return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
    }

    case 'circle': {
      const cx = parseFloat(el.getAttribute('cx') ?? '0');
      const cy = parseFloat(el.getAttribute('cy') ?? '0');
      const r = parseFloat(el.getAttribute('r') ?? '0');
      if (r === 0) return null;
      // Approximate circle as 4 cubic Bezier arcs (kappa = 0.5523)
      const k = 0.5523 * r;
      return [
        `M ${cx - r} ${cy}`,
        `C ${cx - r} ${cy - k}, ${cx - k} ${cy - r}, ${cx} ${cy - r}`,
        `C ${cx + k} ${cy - r}, ${cx + r} ${cy - k}, ${cx + r} ${cy}`,
        `C ${cx + r} ${cy + k}, ${cx + k} ${cy + r}, ${cx} ${cy + r}`,
        `C ${cx - k} ${cy + r}, ${cx - r} ${cy + k}, ${cx - r} ${cy}`,
        'Z',
      ].join(' ');
    }

    case 'ellipse': {
      const cx = parseFloat(el.getAttribute('cx') ?? '0');
      const cy = parseFloat(el.getAttribute('cy') ?? '0');
      const rx = parseFloat(el.getAttribute('rx') ?? '0');
      const ry = parseFloat(el.getAttribute('ry') ?? '0');
      if (rx === 0 || ry === 0) return null;
      const kx = 0.5523 * rx;
      const ky = 0.5523 * ry;
      return [
        `M ${cx - rx} ${cy}`,
        `C ${cx - rx} ${cy - ky}, ${cx - kx} ${cy - ry}, ${cx} ${cy - ry}`,
        `C ${cx + kx} ${cy - ry}, ${cx + rx} ${cy - ky}, ${cx + rx} ${cy}`,
        `C ${cx + rx} ${cy + ky}, ${cx + kx} ${cy + ry}, ${cx} ${cy + ry}`,
        `C ${cx - kx} ${cy + ry}, ${cx - rx} ${cy + ky}, ${cx - rx} ${cy}`,
        'Z',
      ].join(' ');
    }

    case 'polygon': {
      const points = (el.getAttribute('points') ?? '').trim();
      if (points === '') return null;
      const pairs = parsePointsString(points);
      if (pairs.length < 3) return null;
      const segs = pairs.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`);
      segs.push('Z');
      return segs.join(' ');
    }

    case 'path': {
      const d = el.getAttribute('d');
      if (d === null || d.trim() === '') return null;
      // Trust the source path — rough.js handles the clipping
      return d;
    }

    case 'polyline':
    case 'line':
      // Open paths can't be hachured (no closed area) — caller treats as outline
      return null;

    default:
      return null;
  }
}

function parsePointsString(s: string): [number, number][] {
  const nums = s.split(/[\s,]+/).map(parseFloat).filter((n) => !isNaN(n));
  const pairs: [number, number][] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    pairs.push([nums[i], nums[i + 1]]);
  }
  return pairs;
}
