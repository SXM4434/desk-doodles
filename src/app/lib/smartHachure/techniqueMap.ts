// Smart Hachure System — technique selector.
//
// Pure function: (Classification + user style choice + modifier state) → Treatment.
// Maps the 9 tonal roles to specific 5-axis treatments (gap · weight · layers ·
// pressure · opacity), then modulates by user's style choice + slider state.
//
// Architecture: signals → classify → SELECT TREATMENT → render
// Sources:
//   - Agent 1: tonal-to-multi-axis-mark canonical mapping table
//   - Doc 06: Option E hybrid bias picking (fillStyle + darkness + size)

import type { Classification, Treatment, TonalRole } from './types';

// ─── PUBLIC ENTRY POINT ───────────────────────────────────────────────────

/** User's style choice (from F3SvgStyle context). Smart Hachure only runs for
 *  rough-family styles; other styles bypass entirely. */
export type SmartHachureStyle = 'rough-handdrawn' | 'sketchy' | 'bold-ink' | 'stipple';

/** Minimal subset of F3 modifier state that the technique selector needs.
 *  Decoupled from the full F3ModifiersState type so this module stays portable. */
export type ModifierSubset = {
  /** User's base hachure gap slider (px). */
  hachureGap: number;
  /** User's base fillDensity slider (0-1.2 after recalibration). */
  fillDensity: number;
  /** User's base strokeWidth (px). */
  strokeWidth: number;
  /** User's hachureAngle (degrees). */
  hachureAngle: number;
  /** User's inkIntensity (0-1) — scales overall ink opacity. */
  inkIntensity: number;
  /** User's fillOpacity (0-1) — scales hachure opacity specifically. */
  fillOpacity: number;
};

/**
 * Pick the right treatment for one classified region.
 *
 * 3-stage pipeline:
 *   1. Look up the BASE treatment for the role (Agent 1 canon)
 *   2. Modulate by the user's style choice (rough vs sketchy vs bold vs stipple)
 *   3. Modulate by user's modifier sliders (existing slider state still applies)
 */
export function selectTreatment(
  classification: Classification,
  styleChoice: SmartHachureStyle,
  modifiers: ModifierSubset,
): Treatment {
  // Stage 1: role → base treatment
  const base = BASE_BY_ROLE[classification.role];

  // Stage 2: style choice modulates the base
  const styled = applyStyleModulation(base, styleChoice);

  // Stage 3: user sliders fine-tune within the role's range
  const final = applyModifierOverrides(styled, modifiers, classification);

  return final;
}

// ─── STAGE 1 — BASE TREATMENT PER ROLE ────────────────────────────────────
//
// Per Agent 1 canon table. Each role declares:
//   - fillStyle  (what kind of mark)
//   - gap multiplier   (× the user's hachureGap slider)
//   - weight multiplier (× the user's strokeWidth)
//   - layerCount
//   - opacity multiplier (× the user's fillOpacity)
//   - biasMode  (Option E — primary axis for tonal variation)
//
// These are STARTING POINTS. Style choice + slider state modulate from here.

const BASE_BY_ROLE: Record<TonalRole, Treatment> = {
  paper: {
    fillStyle: 'none',
    gap: 0,
    weight: 0,
    angle: -41,
    layerCount: 0,
    pressureEnvelope: null,
    opacity: 0,
    biasMode: 'hybrid',
  },

  // Light grey register — Agent 1 Lancaster-style "sparse single-direction hatch"
  // gap 4-6× strokeWidth, weight 0.5-0.7×, opacity 0.6-0.8
  'sparse-tonal': {
    fillStyle: 'hachure',
    gap: 5.0, // × hachureGap slider
    weight: 0.6, // × strokeWidth slider
    angle: -41,
    layerCount: 1,
    pressureEnvelope: null,
    opacity: 0.7,
    biasMode: 'gap-dominant',
  },

  // Mid grey register — parallel hatch tightening
  // gap 2-3× strokeWidth, weight 0.7-1.0×, opacity 0.8-1.0
  'mid-tonal': {
    fillStyle: 'hachure',
    gap: 2.5,
    weight: 0.85,
    angle: -41,
    layerCount: 1,
    pressureEnvelope: null,
    opacity: 0.9,
    biasMode: 'hybrid',
  },

  // Dark grey register — cross-hatch (2 directions handled internally by rough.js)
  // gap 1.5-2× strokeWidth, weight 1.0×, opacity 1.0
  // NOTE: cross-hatch produces 2 directions INTERNALLY — layerCount stays at 1.
  // Setting > 1 stacks more directions and approaches solid black.
  'dense-tonal': {
    fillStyle: 'cross-hatch',
    gap: 1.75,
    weight: 1.0,
    angle: -41,
    layerCount: 1,
    pressureEnvelope: null,
    opacity: 1.0,
    biasMode: 'layers-dominant',
  },

  // Near-black register — fine cross-hatch / Dürer double-hatch accumulation
  // gap ≤1× (lines touching), weight 1.0-1.4×, opacity 1.0
  // NOTE: cross-hatch internal 2 directions + tight gap + high weight already
  // reads as "near-black with structure". layerCount stays at 1.
  'solid-content': {
    fillStyle: 'cross-hatch',
    gap: 0.9,
    weight: 1.2,
    angle: -41,
    layerCount: 1,
    pressureEnvelope: null,
    opacity: 1.0,
    biasMode: 'weight-dominant',
  },

  // Frames render as clean outlines — no fill technique regardless of darkness
  'structural-frame': {
    fillStyle: 'none',
    gap: 0,
    weight: 0,
    angle: -41,
    layerCount: 0,
    pressureEnvelope: null,
    opacity: 0,
    biasMode: 'hybrid',
  },

  // Decorative accents — preserve as-is, no hachure
  'decorative-accent': {
    fillStyle: 'none',
    gap: 0,
    weight: 0,
    angle: -41,
    layerCount: 0,
    pressureEnvelope: null,
    opacity: 1.0,
    biasMode: 'hybrid',
  },

  // Line decorations — outline only, no fill family
  'line-decoration': {
    fillStyle: 'none',
    gap: 0,
    weight: 0,
    angle: -41,
    layerCount: 0,
    pressureEnvelope: null,
    opacity: 1.0,
    biasMode: 'hybrid',
  },

  // Text — pass through, never hachure
  'label-text': {
    fillStyle: 'none',
    gap: 0,
    weight: 0,
    angle: -41,
    layerCount: 0,
    pressureEnvelope: null,
    opacity: 1.0,
    biasMode: 'hybrid',
  },
};

// ─── STAGE 2 — STYLE CHOICE MODULATION ────────────────────────────────────
//
// rough-handdrawn = default (base treatments unchanged)
// sketchy         = no fills on tonal regions (only structural marks), lower weight
// bold-ink        = solid fills replace cross-hatch for dense roles, heavier weight
// stipple         = dots instead of hachure for all tonal roles

function applyStyleModulation(base: Treatment, style: SmartHachureStyle): Treatment {
  // Only modify if the role HAS a tonal treatment to modulate
  if (base.fillStyle === 'none') return base;

  switch (style) {
    case 'rough-handdrawn':
      return base;

    case 'sketchy':
      // sketchy = no fills on tonal regions (it's a register of "draft / outline-leaning")
      return { ...base, fillStyle: 'none', gap: 0, weight: 0, layerCount: 0 };

    case 'bold-ink':
      // bold-ink = solid fills for dense roles, heavier strokes elsewhere
      if (base.fillStyle === 'cross-hatch') {
        return { ...base, fillStyle: 'solid', weight: base.weight * 1.2 };
      }
      return { ...base, weight: base.weight * 1.2 };

    case 'stipple':
      // stipple = dots instead of hachure, with biasMode adapting
      return { ...base, fillStyle: 'dots', biasMode: 'gap-dominant' };
  }
}

// ─── STAGE 3 — USER SLIDER MODULATION ─────────────────────────────────────
//
// Existing slider state still has effect — within the role's range.
//   - hachureGap slider × treatment.gap multiplier = effective gap (px)
//   - strokeWidth slider × treatment.weight multiplier = effective weight (px)
//   - fillDensity slider scales weight further (denser fills = thicker hachure)
//   - inkIntensity × fillOpacity = effective opacity
//
// Final caps preserve perceptual constraints from Agent 5:
//   - effective weight ≤ effective gap × 0.7 (lines never merge to solid)
//   - effective gap ≥ 1.5 px (lines never optically blend)

function applyModifierOverrides(
  styled: Treatment,
  m: ModifierSubset,
  _classification: Classification,
): Treatment {
  if (styled.fillStyle === 'none') {
    // Tonal-less treatments still get opacity scaled (for paper roles this stays 0,
    // for structural/accent/line/label it scales their stroke-only render).
    return {
      ...styled,
      opacity: styled.opacity * m.fillOpacity * m.inkIntensity,
    };
  }

  // Tiny shapes (area < 40 px²): coverage statistics too noisy for discrete
  // marks — render solid at the role's tonal opacity instead (18-scope-audit
  // edge-case table "Tiny shapes" row, Agent 2 §7).
  const area = _classification.signalsSnapshot.area;
  if (area > 0 && area < 40) {
    return {
      ...styled,
      fillStyle: 'solid',
      opacity: styled.opacity * m.fillOpacity * m.inkIntensity,
    };
  }

  // Effective gap (px) = base hachureGap slider × role's gap multiplier,
  // capped at 12 px (edge-case table "Huge shapes" row: beyond that, lines
  // read as discrete strokes, not a darker hatched area — Agent 2 §7).
  //
  // 2026-06-11 slider-sweep fix-now #1 (audit-runs/2026-06-11-slider-sweep/
  // REPORT.md §7): the role gap multipliers (0.9-5×) pushed the raw product
  // past the 12 px cap by slider ~5-6, pinning every fillable role for the
  // top HALF of the slider (two measured consecutive steps with literally
  // zero pixel change). Fix per I-3 "bias within band": keep the sub-default
  // mapping byte-identical (slider ≤ 4 — preserves the default render AND
  // every preset that sets hachureGap ≤ 4, e.g. stipple's 2.5), and remap
  // the above-default half so each role travels from its default-anchored
  // gap to the 12 px cap as the slider reaches its max — slider max now
  // lands AT the cap for every role instead of hitting it early and dying.
  // sparse-tonal (5×) is already AT the cap at the default; it stays pinned
  // above 4 by design (the cap is the locked perceptual bound) — the
  // aggregate response stays alive via mid/dense/solid roles.
  const GAP_FLOOR = 1.5;
  const GAP_CAP = 12;
  const GAP_SLIDER_DEFAULT = 4; // DEFAULT_MODIFIERS.hachureGap — anchor value
  const GAP_SLIDER_MAX = 12; // SLIDER_SPECS.hachureGap.max
  let effectiveGap: number;
  if (m.hachureGap <= GAP_SLIDER_DEFAULT) {
    // Bottom half: today's exact formula — byte-identical output.
    effectiveGap = Math.max(GAP_FLOOR, Math.min(GAP_CAP, m.hachureGap * styled.gap));
  } else {
    // Top half: lerp from the role's default-anchored gap to the cap.
    const gapAtDefault = Math.max(GAP_FLOOR, Math.min(GAP_CAP, GAP_SLIDER_DEFAULT * styled.gap));
    const t = Math.min(1, (m.hachureGap - GAP_SLIDER_DEFAULT) / (GAP_SLIDER_MAX - GAP_SLIDER_DEFAULT));
    effectiveGap = gapAtDefault + (GAP_CAP - gapAtDefault) * t;
  }

  // Effective weight (px) = strokeWidth × role's weight multiplier × fillDensity scale
  //
  // 2026-06-11 slider-sweep fix-now #2 (REPORT.md §9): the flat
  // Math.max(0.5, m.fillDensity) floor swallowed slider values 0-0.5 —
  // the bottom 40% of the slider was byte-identical output. Default-
  // preserving piecewise remap: keep the 0.5 floor's INTENT (light fills
  // never vanish) by mapping 0 → 0.5 and ramping to the 0.7 default
  // (0.7 → 0.7 exactly — default render byte-identical; ≥ 0.7 passes
  // through untouched, so bold-ink/stipple presets at 1.0 are unchanged).
  // Monotonic, continuous at 0.7, no dead zone.
  const densityScale =
    m.fillDensity < 0.7 ? 0.5 + (m.fillDensity / 0.7) * 0.2 : m.fillDensity;
  let effectiveWeight = m.strokeWidth * styled.weight * densityScale;

  // Cap weight at 70% of gap so hachure lines never merge to solid (Agent 5)
  effectiveWeight = Math.min(effectiveWeight, effectiveGap * 0.7);

  // Effective opacity scales by both ink intensity and fill opacity
  const effectiveOpacity = styled.opacity * m.fillOpacity * m.inkIntensity;

  // User's hachureAngle modifier routes through to the fill scan-line angle.
  // Falls back to the role-default (-41) when the modifier is unset. This is
  // I-1-safe: we route the EXISTING angle modifier into the treatment, we do
  // not change classification or fillStyle.
  const effectiveAngle = Number.isFinite(m.hachureAngle) ? m.hachureAngle : styled.angle;

  return {
    ...styled,
    gap: effectiveGap,
    weight: effectiveWeight,
    angle: effectiveAngle,
    opacity: effectiveOpacity,
  };
}

// ─── HELPER — query the role table directly (for debugging/inspection) ────

/** Returns the base treatment for a role without any modulation.
 *  Useful for chrome debugging + tests. */
export function getBaseTreatmentForRole(role: TonalRole): Treatment {
  return BASE_BY_ROLE[role];
}
