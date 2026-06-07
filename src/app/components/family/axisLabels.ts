import type { Axis, AxisValueByAxis } from './types';

// Human-readable labels for each axis value. Shared across the /cards and
// /tiles articulation pages + the family space toggles.

export const AXIS_VALUE_LABELS: {
  [A in Axis]: Record<AxisValueByAxis[A], string>;
} = {
  cardFrame: {
    on: 'on',
    off: 'off',
  },
  divider: {
    none: 'none',
    section: 'section',
    inline: 'inline',
  },
  titleRegister: {
    default: 'default',
    'ise-italic': 'ISe italic',
    'small-caps': 'small-caps',
  },
  imageTreatment: {
    plain: 'plain',
    framed: 'framed',
    'double-frame': 'double-frame',
    mat: 'mat',
  },
  captionRegister: {
    default: 'default',
    'small-caps': 'small-caps',
  },
  shippedProof: {
    on: 'on',
    off: 'off',
  },
  proofPlacement: {
    'stack-grid': 'stack-grid',
    inline: 'inline',
    'bottom-strip': 'bottom-strip',
  },
  aspectVariance: {
    uniform: 'uniform',
    'fill-cell': 'fill-cell',
    authored: 'authored',
    cinematic: 'cinematic 21:9',
    anamorphic: 'anamorphic 2.39:1',
    widescreen: 'widescreen 16:9',
    golden: 'golden 1.618:1',
    academy: 'academy 4:3',
    square: 'square 1:1',
    portrait: 'portrait 9:16',
    'vertical-half': 'vertical-half 1:2',
  },
  density: {
    default: 'default',
    compact: 'compact',
    'content-forward': 'content-forward',
  },
};

export const AXIS_CANDIDATES: { [A in Axis]: AxisValueByAxis[A][] } = {
  cardFrame: ['on', 'off'],
  divider: ['none', 'section', 'inline'],
  titleRegister: ['default', 'ise-italic', 'small-caps'],
  imageTreatment: ['plain', 'framed', 'double-frame', 'mat'],
  captionRegister: ['default', 'small-caps'],
  shippedProof: ['on', 'off'],
  proofPlacement: ['stack-grid', 'inline', 'bottom-strip'],
  aspectVariance: ['uniform', 'authored'],
  // Fixed-ratio aspect-variance values (cinematic / anamorphic / widescreen /
  // golden / academy / square / portrait / vertical-half) are toolbar-only —
  // narrow-2 hero-scale exploration. Not included as family-preset candidates.
  density: ['default', 'compact', 'content-forward'],
};
