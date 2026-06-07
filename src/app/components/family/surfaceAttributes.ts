import type { SurfaceAttrs } from './types';

// Per-surface attribute signatures for Cards family (10) + Tiles family (3).
//
// Each axis is either:
//   - { fixed: true, value }   — part of the surface's identity; dedup-relevant
//   - { fixed: false, baseline } — free to toggle; baseline is the native value
//
// Identity-fixed axes define what makes the surface distinct. If another
// surface in the same family matches identity on every fixed axis except one,
// that one axis is dedup-suppressed on both surfaces.
//
// `density` (the 9th axis) resolves two prior identity collisions:
//   - t1-s4 vs t2-s4 — t1-s4 carries 'content-forward' (narrower media column);
//     t2-s4 keeps default + differentiates via pair-native CTA (quiet).
//   - t1-s1 vs t6-s2 — t6-s2 carries 'compact' (reduced outer footprint);
//     t1-s1 holds default baseline.

export const SURFACE_ATTRS: SurfaceAttrs[] = [
  // ─── Group A — Cards family ─────────────────────────────────────────────
  {
    id: 't1-s1',
    family: 'cards',
    label: 'T1-S1',
    workingName: 'Explicit Container Baseline',
    scanStrategy: 'Tag-led browse (Featured proof-anchored)',
    identitySummary:
      'Classical baseline — card frame + section divider + stack-grid proof. All other toggles at default.',
    featuredShell: 'FH-B',
    standardShell: 'SV-A',
    attributes: {
      cardFrame: { fixed: false, baseline: 'on' },
      divider: { fixed: false, baseline: 'section' },
      titleRegister: { fixed: false, baseline: 'default' },
      imageTreatment: { fixed: false, baseline: 'plain' },
      captionRegister: { fixed: false, baseline: 'default' },
      shippedProof: { fixed: false, baseline: 'on' },
      proofPlacement: { fixed: false, baseline: 'stack-grid' },
      aspectVariance: { fixed: false, baseline: 'uniform' },
      density: { fixed: false, baseline: 'default' },
    },
  },
  {
    id: 't1-s3',
    family: 'cards',
    label: 'T1-S3',
    workingName: 'Media-Weighted Baseline',
    scanStrategy: 'Media-led browse',
    identitySummary:
      'Media-forward baseline — larger media ratio; proof suppressed by identity.',
    featuredShell: 'FH-A',
    standardShell: 'SV-A',
    attributes: {
      cardFrame: { fixed: false, baseline: 'on' },
      divider: { fixed: false, baseline: 'none' },
      titleRegister: { fixed: false, baseline: 'default' },
      imageTreatment: { fixed: false, baseline: 'plain' },
      captionRegister: { fixed: false, baseline: 'default' },
      shippedProof: { fixed: true, value: 'off' },
      proofPlacement: { fixed: false, baseline: 'stack-grid' },
      aspectVariance: { fixed: false, baseline: 'uniform' },
      density: { fixed: false, baseline: 'default' },
    },
  },
  {
    id: 't1-s4',
    family: 'cards',
    label: 'T1-S4',
    workingName: 'Content-Stack Baseline',
    scanStrategy: 'Content-led — title + framing carry weight',
    identitySummary:
      'Content-stack baseline — narrower media column (content-forward) and wider content column; typography does the heavy lifting.',
    featuredShell: 'FH-A',
    standardShell: 'SV-A',
    attributes: {
      cardFrame: { fixed: false, baseline: 'on' },
      divider: { fixed: false, baseline: 'none' },
      titleRegister: { fixed: false, baseline: 'default' },
      imageTreatment: { fixed: false, baseline: 'plain' },
      captionRegister: { fixed: false, baseline: 'default' },
      shippedProof: { fixed: false, baseline: 'on' },
      proofPlacement: { fixed: false, baseline: 'stack-grid' },
      aspectVariance: { fixed: false, baseline: 'uniform' },
      density: { fixed: true, value: 'content-forward' },
    },
  },
  {
    id: 't2-s4',
    family: 'cards',
    label: 'T2-S4',
    workingName: 'Quiet-Action Composition',
    scanStrategy: 'Tag-led browse with quieted CTA',
    identitySummary:
      'Action zone at minimum structurally-legal footprint; text-CTA inline after framing.',
    featuredShell: 'FH-A',
    standardShell: 'SV-A',
    attributes: {
      cardFrame: { fixed: false, baseline: 'on' },
      divider: { fixed: false, baseline: 'none' },
      titleRegister: { fixed: false, baseline: 'default' },
      imageTreatment: { fixed: false, baseline: 'plain' },
      captionRegister: { fixed: false, baseline: 'default' },
      shippedProof: { fixed: false, baseline: 'on' },
      proofPlacement: { fixed: false, baseline: 'stack-grid' },
      aspectVariance: { fixed: false, baseline: 'uniform' },
      density: { fixed: false, baseline: 'default' },
    },
  },
  {
    id: 't3-s4',
    family: 'cards',
    label: 'T3-S4',
    workingName: 'Modular Surface',
    scanStrategy: 'Module-seam reading — content organized as separate strips',
    identitySummary:
      'Inline divider rules between every module are the surface\u2019s identity.',
    featuredShell: 'FH-A',
    standardShell: 'SV-A',
    attributes: {
      cardFrame: { fixed: false, baseline: 'on' },
      divider: { fixed: true, value: 'inline' },
      titleRegister: { fixed: false, baseline: 'default' },
      imageTreatment: { fixed: false, baseline: 'plain' },
      captionRegister: { fixed: false, baseline: 'default' },
      shippedProof: { fixed: false, baseline: 'on' },
      proofPlacement: { fixed: false, baseline: 'stack-grid' },
      aspectVariance: { fixed: false, baseline: 'uniform' },
      density: { fixed: false, baseline: 'default' },
    },
  },
  {
    id: 't5-s1',
    family: 'cards',
    label: 'T5-S1',
    workingName: 'Italic-Title Card',
    scanStrategy: 'Editorial posture via title register',
    identitySummary:
      'ISe italic 36px title + hairline under title — editorial register via type alone.',
    featuredShell: 'FH-A',
    standardShell: 'SV-A',
    attributes: {
      cardFrame: { fixed: false, baseline: 'on' },
      divider: { fixed: false, baseline: 'section' },
      titleRegister: { fixed: true, value: 'ise-italic' },
      imageTreatment: { fixed: false, baseline: 'plain' },
      captionRegister: { fixed: false, baseline: 'default' },
      shippedProof: { fixed: false, baseline: 'off' },
      proofPlacement: { fixed: false, baseline: 'stack-grid' },
      aspectVariance: { fixed: false, baseline: 'uniform' },
      density: { fixed: false, baseline: 'default' },
    },
  },
  {
    id: 't5-s3',
    family: 'cards',
    label: 'T5-S3',
    workingName: 'Framed-Image Card',
    scanStrategy: 'Media-as-artifact (authored frame)',
    identitySummary:
      'Double-border + mat around media — frame reads as authored artifact.',
    featuredShell: 'FH-A',
    standardShell: 'SV-A',
    attributes: {
      cardFrame: { fixed: false, baseline: 'on' },
      divider: { fixed: false, baseline: 'none' },
      titleRegister: { fixed: false, baseline: 'default' },
      imageTreatment: { fixed: true, value: 'double-frame' },
      captionRegister: { fixed: false, baseline: 'default' },
      shippedProof: { fixed: false, baseline: 'off' },
      proofPlacement: { fixed: false, baseline: 'stack-grid' },
      aspectVariance: { fixed: false, baseline: 'uniform' },
      density: { fixed: false, baseline: 'default' },
    },
  },
  {
    id: 't5-s8',
    family: 'cards',
    label: 'T5-S8',
    workingName: 'Caption-Register Card',
    scanStrategy: 'Exhibit-caption register — 11px caps dominates',
    identitySummary:
      'Caption-scale body across all copy except title; title ISe 32px is the only break in scale.',
    featuredShell: 'FH-A',
    standardShell: 'SV-A',
    attributes: {
      cardFrame: { fixed: false, baseline: 'on' },
      divider: { fixed: false, baseline: 'section' },
      titleRegister: { fixed: false, baseline: 'default' },
      imageTreatment: { fixed: false, baseline: 'plain' },
      captionRegister: { fixed: true, value: 'small-caps' },
      shippedProof: { fixed: false, baseline: 'off' },
      proofPlacement: { fixed: false, baseline: 'stack-grid' },
      aspectVariance: { fixed: false, baseline: 'uniform' },
      density: { fixed: false, baseline: 'default' },
    },
  },
  {
    id: 't6-s2',
    family: 'cards',
    label: 'T6-S2',
    workingName: 'Case Brief Compact',
    scanStrategy: 'Case-brief register — proof-anchored, compact',
    identitySummary:
      'Case-brief register at reduced footprint — same structure as T6-S1 at compact density.',
    featuredShell: 'FH-B',
    standardShell: 'SV-A',
    attributes: {
      cardFrame: { fixed: false, baseline: 'on' },
      divider: { fixed: false, baseline: 'section' },
      titleRegister: { fixed: false, baseline: 'default' },
      imageTreatment: { fixed: false, baseline: 'plain' },
      captionRegister: { fixed: false, baseline: 'default' },
      shippedProof: { fixed: false, baseline: 'on' },
      proofPlacement: { fixed: false, baseline: 'stack-grid' },
      aspectVariance: { fixed: false, baseline: 'uniform' },
      density: { fixed: true, value: 'compact' },
    },
  },
  {
    id: 't6-s5',
    family: 'cards',
    label: 'T6-S5',
    workingName: 'Case Brief Unbounded',
    scanStrategy: 'Case-brief register without the card frame',
    identitySummary:
      'Same case-brief register as T6-S1 lifted out of the card frame — unbounded register is identity.',
    featuredShell: 'FH-B',
    standardShell: 'SV-A',
    attributes: {
      cardFrame: { fixed: true, value: 'off' },
      divider: { fixed: false, baseline: 'section' },
      titleRegister: { fixed: false, baseline: 'default' },
      imageTreatment: { fixed: false, baseline: 'plain' },
      captionRegister: { fixed: false, baseline: 'default' },
      shippedProof: { fixed: false, baseline: 'on' },
      proofPlacement: { fixed: false, baseline: 'stack-grid' },
      aspectVariance: { fixed: false, baseline: 'uniform' },
      density: { fixed: false, baseline: 'default' },
    },
  },

  // ─── Group B — Tiles family ─────────────────────────────────────────────
  {
    id: 't5-s4',
    family: 'tiles',
    label: 'T5-S4',
    workingName: 'Authored Aspect',
    scanStrategy: 'Per-slot authored aspect rhythm',
    identitySummary:
      'Per-slot authored aspects (4:3 / 1:1 / 3:4) — aspect variance is the surface\u2019s primary driver.',
    featuredShell: 'FV-A',
    standardShell: 'SV-A',
    attributes: {
      cardFrame: { fixed: false, baseline: 'on' },
      divider: { fixed: false, baseline: 'none' },
      titleRegister: { fixed: false, baseline: 'default' },
      imageTreatment: { fixed: false, baseline: 'plain' },
      captionRegister: { fixed: false, baseline: 'default' },
      shippedProof: { fixed: false, baseline: 'off' },
      proofPlacement: { fixed: false, baseline: 'stack-grid' },
      aspectVariance: { fixed: true, value: 'authored' },
      density: { fixed: false, baseline: 'default' },
    },
  },
  {
    id: 't8-s1',
    family: 'tiles',
    label: 'T8-S1',
    workingName: 'Plain Tile',
    scanStrategy: 'Object-like media with minimum chrome',
    identitySummary:
      'No card frame; 21:9 featured; image reads as the object, chrome is minimal.',
    featuredShell: 'FV-A',
    standardShell: 'SV-A',
    attributes: {
      cardFrame: { fixed: true, value: 'off' },
      divider: { fixed: false, baseline: 'none' },
      titleRegister: { fixed: false, baseline: 'default' },
      imageTreatment: { fixed: false, baseline: 'plain' },
      captionRegister: { fixed: false, baseline: 'default' },
      shippedProof: { fixed: false, baseline: 'off' },
      proofPlacement: { fixed: false, baseline: 'stack-grid' },
      aspectVariance: { fixed: false, baseline: 'uniform' },
      density: { fixed: false, baseline: 'default' },
    },
  },
  {
    id: 't8-s4',
    family: 'tiles',
    label: 'T8-S4',
    workingName: 'Proof-Forward Tile',
    scanStrategy: 'Tile + inline proof metadata row',
    identitySummary:
      'No card frame; proof rendered inline in a meta row at the foot — proof placement is identity.',
    featuredShell: 'FV-A',
    standardShell: 'SV-A',
    attributes: {
      cardFrame: { fixed: true, value: 'off' },
      divider: { fixed: false, baseline: 'none' },
      titleRegister: { fixed: false, baseline: 'default' },
      imageTreatment: { fixed: false, baseline: 'plain' },
      captionRegister: { fixed: false, baseline: 'default' },
      shippedProof: { fixed: true, value: 'on' },
      proofPlacement: { fixed: true, value: 'inline' },
      aspectVariance: { fixed: false, baseline: 'uniform' },
      density: { fixed: false, baseline: 'default' },
    },
  },
];

export const SURFACE_BY_ID = Object.fromEntries(
  SURFACE_ATTRS.map((s) => [s.id, s]),
) as Record<string, SurfaceAttrs>;

export const CARDS_FAMILY = SURFACE_ATTRS.filter((s) => s.family === 'cards');
export const TILES_FAMILY = SURFACE_ATTRS.filter((s) => s.family === 'tiles');
