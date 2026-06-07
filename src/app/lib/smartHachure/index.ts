// Smart Hachure System — public API.
//
// One function: `renderSmartHachure(svgRoot, fullModifiers, opts)`.
// Orchestrates: classify → generate outline via legacy transformElement (with
// fillStyle suppressed) → add fill marks per classification → replace original.
//
// Architecture: signals → classify → select treatment → render
// See `docs/labs/hero/cells/F3-smart-hachure-system/06-architecture-technical-core.md`

import rough from 'roughjs';
import { extractAllSignals, extractSignals, getRenderableChildren } from './signals';
import { classify, ruleEngineProvider } from './classifier';
import { selectTreatment, type SmartHachureStyle } from './techniqueMap';
import { renderRegion } from './renderRegion';
import { createOverrideStore, hashSvg } from './overrideStore';
import { transformElement } from '../../components/canvas/SvgStyleTransform';
import type { F3ModifiersState } from '../../state/F3RoughModifiersContext';
import type {
  Classification,
  ClassifierProvider,
  OverrideStoreApi,
  Treatment,
} from './types';

// ─── PUBLIC API ───────────────────────────────────────────────────────────

export type SmartHachureOpts = {
  /** User's SVG style choice (must be a rough-family style). */
  styleChoice: SmartHachureStyle;
  /** Ink color for marks (resolved CSS color string). */
  inkColor: string;
  /** Optional override store — pass in for visitor-canvas multi-instance. */
  overrideStore?: OverrideStoreApi;
  /** Optional provider chain — v1 default: [ruleEngineProvider]. */
  providers?: ClassifierProvider[];
  /** Confidence threshold below which classifier falls through. Default 0.7. */
  confidenceThreshold?: number;
  /** Optional callback fired per region after classification. */
  onClassification?: (
    regionPath: string,
    classification: Classification,
    treatment: Treatment,
  ) => void;
};

/**
 * Render Smart Hachure onto an SVG.
 *
 * For each renderable top-level child:
 *   1. Extract signals on the clean element
 *   2. Classify into a TonalRole
 *   3. Select a Treatment (which fillStyle + axes)
 *   4. Run legacy `transformElement` with fillStyle suppressed → jittered outlines
 *      (honors all sliders: roughness · bowing · curveTightness · strokeWidth ·
 *       multiStroke · sketchingStyle · endpointBehavior · penTip)
 *   5. Generate Smart Hachure fill marks per classification
 *   6. Replace the original child with [fill marks] + [jittered outlines]
 *
 * MUTATION CONTRACT: in-place. Calling twice doubles. Caller clones first.
 */
export function renderSmartHachure(
  svgRoot: SVGSVGElement,
  fullModifiers: F3ModifiersState,
  opts: SmartHachureOpts,
): void {
  const overrideStore = opts.overrideStore ?? createOverrideStore();
  const providers = opts.providers ?? [ruleEngineProvider];
  const threshold = opts.confidenceThreshold ?? 0.7;
  const svgHash = hashSvg(svgRoot);
  const rc = rough.svg(svgRoot);
  const ownerDoc = svgRoot.ownerDocument!;

  // Take a snapshot of original children BEFORE we mutate the tree — every
  // subsequent operation references this fixed list. The DOM walker would
  // otherwise re-iterate over the marks we just inserted.
  const originalChildren = Array.from(getRenderableChildren(svgRoot));

  // The SVG's viewBox is the "parent bbox" for top-level children — without
  // this the classifier's `areaFractionOfParent` calc returns 0 and the
  // outer-frame rule never fires (BUG fixed 2026-06-03).
  const vb = svgRoot.viewBox?.baseVal;
  const rootParentBBox =
    vb && vb.width > 0
      ? { x: vb.x, y: vb.y, w: vb.width, h: vb.height }
      : null;

  // PRE-PASS — extract signals for EVERY child BEFORE we mutate the tree.
  // getBBox() returns {0,0,0,0} on elements that have been removed from the
  // DOM, so if we extracted signals inside the mutation loop, topology
  // checks for child N (containedInZIndex, enclosesSiblingCount) would see
  // already-removed siblings 0..N-1 as zero-sized and miss real containment.
  // That misclassifies every dark-band child as `paper` (the bug behind the
  // "no hachure, just outlines" output 2026-06-03).
  const signalsByIndex = originalChildren.map((child, i) =>
    extractSignals(child, {
      parentBBox: rootParentBBox,
      siblings: originalChildren,
      zIndex: i,
    }),
  );

  // Slim subset of modifiers passed to selectTreatment (techniqueMap signature).
  const treatmentMods = {
    hachureGap: fullModifiers.hachureGap,
    fillDensity: fullModifiers.fillDensity,
    strokeWidth: fullModifiers.strokeWidth,
    hachureAngle: fullModifiers.hachureAngle,
    inkIntensity: fullModifiers.inkIntensity,
    fillOpacity: fullModifiers.fillOpacity,
  };

  // Override-suppressed modifier set for outline jitter — fillStyle='none'
  // turns off legacy hachure render so we don't double-fill.
  const outlineModifiers: F3ModifiersState = {
    ...fullModifiers,
    fillStyle: 'none',
  };

  let zIdx = 0;
  for (const child of originalChildren) {
    const regionPath = `${child.tagName.toLowerCase()}[${zIdx}]`;
    const signals = signalsByIndex[zIdx];
    zIdx++;

    // 2. classify
    const ctx = {
      svgHash,
      regionPath,
      parentClassification: null,
      confidenceThreshold: threshold,
    };
    const classification = classify(signals, ctx, providers, overrideStore);

    // 3. select treatment
    const treatment = selectTreatment(classification, opts.styleChoice, treatmentMods);

    opts.onClassification?.(regionPath, classification, treatment);

    // 4. generate jittered outline via legacy transformElement (with hachure off)
    //    DEFENSIVE: legacy renderHandFeelShape can emit a base-fill <path> that
    //    paints the source fill color (e.g. solid STROKE black). This happens
    //    when the source element OR any nested child has fill ≠ none — and we
    //    can't fix it via attribute clearing because <g> groups recursively
    //    process children whose fills we don't see at the top level.
    //    Filter the outline output to strip ANY element with a real fill;
    //    keep only stroke paths (fill=none/null/transparent).
    const seed = hashStringToSeed(regionPath);
    const rawOutlineElements = transformElement(child, rc, outlineModifiers, seed, ownerDoc);
    const outlineElements = rawOutlineElements.filter((el) => {
      const f = el.getAttribute('fill');
      // Keep stroke-only elements (no fill, fill=none, fill=transparent).
      // Drop anything with a real fill color — those are base fills we don't
      // want when Smart Hachure is providing the fill.
      if (f === null || f === 'none' || f === 'transparent') return true;
      // Special case: text passes through with its source fill (we never
      // hachure text per Agent 1; let it render).
      if (el.tagName.toLowerCase() === 'text') return true;
      return false;
    });

    // 5. generate Smart Hachure fill marks (if any)
    const fillMarks =
      treatment.fillStyle === 'none'
        ? []
        : renderRegion(child, treatment, {
            ownerDoc,
            rc,
            baseSeed: seed + 7919, // separate seed so fill seed doesn't collide with outline
            inkColor: opts.inkColor,
          });

    // DIAGNOSTIC — stamp role + confidence + treatment + darkness on the
    // produced elements so we can inspect classification from DevTools alone.
    // (Without this, a "no hachure" output is indistinguishable from "hachure
    // is rendering but invisible" — the data-attrs let us tell them apart.)
    for (const fillEl of fillMarks) {
      fillEl.setAttribute('data-smart-role', classification.role);
      fillEl.setAttribute('data-smart-confidence', classification.confidence.toFixed(2));
      fillEl.setAttribute('data-smart-fill-style', treatment.fillStyle);
      fillEl.setAttribute('data-smart-gap', String(treatment.gap.toFixed(2)));
      fillEl.setAttribute('data-smart-weight', String(treatment.weight.toFixed(2)));
    }
    for (const outlineEl of outlineElements) {
      outlineEl.setAttribute('data-smart-source-role', classification.role);
      outlineEl.setAttribute('data-smart-source-darkness', signals.darknessL.toFixed(2));
    }

    // 6. replace original with [fills] + [outline]
    //    paint order: fills first, outline on top (outline = boundary contour)
    const parent = child.parentNode;
    if (!parent) continue;
    for (const fillEl of fillMarks) {
      parent.insertBefore(fillEl, child);
    }
    for (const outlineEl of outlineElements) {
      parent.insertBefore(outlineEl, child);
    }
    parent.removeChild(child);
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────

function hashStringToSeed(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) hash = (hash * 33) ^ s.charCodeAt(i);
  return hash >>> 0;
}

// ─── RE-EXPORTS ───────────────────────────────────────────────────────────

export { createOverrideStore, hashSvg } from './overrideStore';
export { ruleEngineProvider, classify } from './classifier';
export { selectTreatment, getBaseTreatmentForRole } from './techniqueMap';
export { extractAllSignals, extractSignals, getRenderableChildren } from './signals';
export type {
  Classification,
  ClassifierProvider,
  Override,
  OverrideStoreApi,
  Signals,
  TonalRole,
  Treatment,
} from './types';
export type { SmartHachureStyle, ModifierSubset } from './techniqueMap';
