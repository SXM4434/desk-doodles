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
    hachureGap: treatment.gap,
    fillWeight: treatment.weight,
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

  // If layerCount > 1, generate additional layers offset slightly so they
  // accumulate tonal density without overlapping perfectly.
  // (rough.js's cross-hatch handles 2 directions internally — additional
  // layers go beyond that.)
  const extraLayers = Math.max(0, treatment.layerCount - 1);
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
      out.push(layerGroup);
    }
  }
  return out;
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
