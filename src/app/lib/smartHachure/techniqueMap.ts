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

  // Effective gap (px) = base hachureGap slider × role's gap multiplier
  const effectiveGap = Math.max(1.5, m.hachureGap * styled.gap);

  // Effective weight (px) = strokeWidth × role's weight multiplier × fillDensity scale
  let effectiveWeight = m.strokeWidth * styled.weight * Math.max(0.5, m.fillDensity);

  // Cap weight at 70% of gap so hachure lines never merge to solid (Agent 5)
  effectiveWeight = Math.min(effectiveWeight, effectiveGap * 0.7);

  // Effective opacity scales by both ink intensity and fill opacity
  const effectiveOpacity = styled.opacity * m.fillOpacity * m.inkIntensity;

  return {
    ...styled,
    gap: effectiveGap,
    weight: effectiveWeight,
    opacity: effectiveOpacity,
  };
}

// ─── HELPER — query the role table directly (for debugging/inspection) ────

/** Returns the base treatment for a role without any modulation.
 *  Useful for chrome debugging + tests. */
export function getBaseTreatmentForRole(role: TonalRole): Treatment {
  return BASE_BY_ROLE[role];
}
