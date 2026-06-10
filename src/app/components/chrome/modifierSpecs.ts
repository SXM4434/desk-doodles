// Modifier specs + per-style modifier sets — VERBATIM port from Hero8Shell.tsx
// lines 114-158 (commit 48a6d8c^). Source of truth for the chrome layout.
//
// Don't drift from these. If a slider's max needs to change, change it in
// Hero8Shell first (it's the locked spec), then mirror here.
import type { F3SvgStyle } from '../../state/F3SvgStyleContext';

// SLIDER_SPECS — per-modifier (min, max, step). Recalibrated 2026-06-02 per
// F3-shading-calibration-spec.md §3 for each slider's USEFUL working zone.
export const SLIDER_SPECS = {
  // I-11: master proportion-preserving multiplier on HAND_FEEL_BASE.
  // > 1.4 enters Excalidraw signature zone (slider styling shows warn).
  wobble:            { min: 0,    max: 2.0, step: 0.05 },
  jaggedness:        { min: 0,    max: 2.0, step: 0.05 },
  roughness:         { min: 0,    max: 1.6, step: 0.02 },
  bowing:            { min: 0,    max: 2.5, step: 0.05 },
  strokeWidth:       { min: 0.3,  max: 3.0, step: 0.05 },
  curveTightness:    { min: 0,    max: 1.5, step: 0.02 },
  hachureGap:        { min: 1,    max: 12,  step: 0.25 },
  hachureAngle:      { min: -90,  max: 90,  step: 1    },
  fillDensity:       { min: 0,    max: 1.2, step: 0.02 },
  inkIntensity:      { min: 0,    max: 1,   step: 0.01 },
  fillOpacity:       { min: 0,    max: 1,   step: 0.01 },
  blurAmount:        { min: 0,    max: 1.5, step: 0.05 },
  bleed:             { min: 0,    max: 1,   step: 0.02 },
  dotSize:           { min: 0.3,  max: 6,   step: 0.1  },
  dotSpacing:        { min: 1,    max: 20,  step: 0.25 },
  dotScatter:        { min: 0,    max: 1,   step: 0.02 },
  grainIntensity:    { min: 0,    max: 2.5, step: 0.05 },
  smudgeAmount:      { min: 0,    max: 2,   step: 0.05 },
  pressureVariance:  { min: 0,    max: 1,   step: 0.02 },
  offsetDistance:    { min: 0,    max: 6,   step: 0.25 },
  offsetAngle:       { min: -180, max: 180, step: 1    },
  colorShift:        { min: 0,    max: 1,   step: 0.02 },
  registrationError: { min: 0,    max: 1.5, step: 0.05 },
  textureIntensity:  { min: 0,    max: 2.5, step: 0.05 },
} as const;

export const UNIVERSAL_MODIFIERS = ['inkIntensity', 'fillOpacity', 'paletteMode', 'texture', 'textureIntensity'] as const;

// Per-style declared modifier set — chrome only renders the modifiers the
// active style uses.
export const MODIFIER_SETS_BY_STYLE: Record<F3SvgStyle, readonly string[]> = {
  'clean':           ['inkIntensity', 'fillOpacity', 'paletteMode', 'texture', 'textureIntensity'],
  'outline-only':    ['strokeWidth', 'inkIntensity', 'paletteMode', 'texture', 'textureIntensity'],
  'wireframe':       ['strokeWidth', 'inkIntensity', 'paletteMode', 'texture', 'textureIntensity'],
  'wet-ink':         ['blurAmount', 'bleed', 'inkIntensity', 'fillOpacity', 'paletteMode', 'textureIntensity'],
  'charcoal':        ['grainIntensity', 'smudgeAmount', 'pressureVariance', 'inkIntensity', 'fillOpacity', 'paletteMode', 'textureIntensity'],
  // 2026-06-09: dotSize + dotSpacing now wired in TextureFilterDefs stipple
  // path (dotSize multiplies displacement scale, dotSpacing inverse-scales
  // baseFrequency). Newsprint exposes both so user can dial dot prominence.
  'newsprint':       ['dotSize', 'dotSpacing', 'inkIntensity', 'fillOpacity', 'paletteMode', 'texture', 'textureIntensity'],
  'risograph':       ['offsetDistance', 'offsetAngle', 'colorShift', 'risoSecondaryColor', 'registrationError', 'inkIntensity', 'fillOpacity', 'paletteMode', 'texture', 'textureIntensity'],
  'rough-handdrawn': ['wobble', 'jaggedness', 'roughness', 'bowing', 'strokeWidth', 'curveTightness', 'multiStroke', 'endpointBehavior', 'sketchingStyle', 'penTip', 'fillStyle', 'hachureGap', 'hachureAngle', 'fillDensity', 'inkIntensity', 'fillOpacity', 'paletteMode', 'texture', 'textureIntensity'],
  'sketchy':         ['wobble', 'jaggedness', 'roughness', 'bowing', 'strokeWidth', 'curveTightness', 'multiStroke', 'endpointBehavior', 'sketchingStyle', 'penTip', 'inkIntensity', 'fillOpacity', 'paletteMode', 'texture', 'textureIntensity'],
  // bold-ink intentionally omits multiStroke — the style's identity IS
  // "no layered jitter" (preset locks multiStroke='off'). Showing the
  // dropdown would lie to the user (Bug D from audit 2026-06-08).
  'bold-ink':        ['wobble', 'strokeWidth', 'bowing', 'curveTightness', 'fillStyle', 'fillDensity', 'endpointBehavior', 'penTip', 'inkIntensity', 'fillOpacity', 'paletteMode', 'texture', 'textureIntensity'],
  'stipple':         ['wobble', 'jaggedness', 'roughness', 'bowing', 'strokeWidth', 'curveTightness', 'multiStroke', 'endpointBehavior', 'sketchingStyle', 'penTip', 'fillStyle', 'hachureGap', 'fillDensity', 'inkIntensity', 'fillOpacity', 'paletteMode', 'texture', 'textureIntensity'],
};
