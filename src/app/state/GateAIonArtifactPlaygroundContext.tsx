import React, { createContext, useContext, useState } from 'react';
import type { DropdownSection } from '../components/Dropdown';

// Holds the Artifact Playground selection state (which artifact is rendered
// in /artifacts). Lives in chrome state per the lab-wide rule that ALL toggles
// belong in LabShell chrome (NarrowPass4 context pattern). Variant + Customize
// state slots are reserved for Step 4; for now they're not part of this context
// because they're per-artifact and only become real after Step 4 builds the 18
// artifact components.
//
// Catalog constants (sections + labels) are exported here so both the chrome
// (renders the Artifact dropdown) and the page (renders the selection echo)
// share one source of truth.

// Catalog: 16 artifacts (was 18). A3 dropped (precedent-thin, served by A1 + §03 pull-quotes).
// D3 dropped (breadth-risk, layout-direction variants planned to absorb into D2). E1 reframed
// from "Persona Profile Shape" to "Persona-trait visualization" — narrowed scope to the
// precedent-grounded subset (spectrum-position + trait-cluster).
export type ArtifactId =
  | 'none'
  | 'A1' | 'A2' | 'A4'
  | 'B1' | 'B2' | 'B3' | 'B4'
  | 'C1' | 'C2' | 'C3' | 'C4' | 'C5'
  | 'D1' | 'D2'
  | 'E1' | 'E2';

export const ARTIFACT_SECTIONS: DropdownSection[] = [
  {
    heading: 'Default',
    options: [
      { value: 'none', label: 'None · selector', detail: 'Choose an artifact to render.' },
    ],
  },
  {
    heading: 'A · Research synthesis',
    options: [
      { value: 'A1', label: 'A1 · Affinity Map', detail: '✓ direct Ion fit · persona-candidate' },
      { value: 'A2', label: 'A2 · Empathy Map', detail: 'partial Ion fit (synthesized) · persona-candidate' },
      { value: 'A4', label: 'A4 · Mental Model', detail: 'partial Ion fit (synthesized) · persona-candidate' },
    ],
  },
  {
    heading: 'B · Spatial positioning',
    options: [
      { value: 'B1', label: 'B1 · Venn (positioning)', detail: '✓ direct Ion fit' },
      { value: 'B2', label: 'B2 · 2x2 Matrix', detail: 'partial Ion fit (synthesized) · persona-candidate' },
      { value: 'B3', label: 'B3 · Competitive Landscape', detail: 'partial Ion fit (synthesized)' },
      { value: 'B4', label: 'B4 · Concept Map', detail: 'partial Ion fit (synthesized)' },
    ],
  },
  {
    heading: 'C · Flow / sequence',
    options: [
      { value: 'C1', label: 'C1 · Funnel', detail: '✓ direct Ion fit (CoCreate 5-step)' },
      { value: 'C2', label: 'C2 · Phase-Friction', detail: '✓ direct Ion fit (Demo Day 4-phase) · persona-candidate' },
      { value: 'C3', label: 'C3 · User Flow', detail: 'partial Ion fit (simplified)' },
      { value: 'C4', label: 'C4 · Service Blueprint', detail: 'partial Ion fit (synthesized)' },
      { value: 'C5', label: 'C5 · Storyboard', detail: 'partial Ion fit (synthesized) · persona-candidate' },
    ],
  },
  {
    heading: 'D · Conceptual illustration',
    options: [
      { value: 'D1', label: 'D1 · Wavy-Spectrum', detail: '✓ direct Ion fit (CoCreate "ambiguity to certainty")' },
      { value: 'D2', label: 'D2 · Workflow Disconnect', detail: '✓ direct Ion fit (pitch deck) · D3 absorbed (layout-direction toggle pending)' },
    ],
  },
  {
    heading: 'E · Persona-specific',
    options: [
      { value: 'E1', label: 'E1 · Persona-trait visualization', detail: 'reframed · narrowed to spectrum-position + trait-cluster · persona-candidate' },
      { value: 'E2', label: 'E2 · Persona-Journey Overlay', detail: 'partial Ion fit (synthesized) · persona-candidate' },
    ],
  },
];

export const ARTIFACT_LABELS: Record<ArtifactId, string> = {
  none: 'None',
  A1: 'A1 · Affinity Map',
  A2: 'A2 · Empathy Map',
  A4: 'A4 · Mental Model',
  B1: 'B1 · Venn (positioning)',
  B2: 'B2 · 2x2 Matrix',
  B3: 'B3 · Competitive Landscape',
  B4: 'B4 · Concept Map',
  C1: 'C1 · Funnel',
  C2: 'C2 · Phase-Friction',
  C3: 'C3 · User Flow',
  C4: 'C4 · Service Blueprint',
  C5: 'C5 · Storyboard',
  D1: 'D1 · Wavy-Spectrum',
  D2: 'D2 · Workflow Disconnect',
  E1: 'E1 · Persona-trait visualization',
  E2: 'E2 · Persona-Journey Overlay',
};

// Per-artifact state lives here too. Each artifact gets its own slice (a1, b1, ...).
// Slices are added incrementally as Step 4 builds each artifact. Default values match
// each artifact's "native" register per gate-a-ion-artifact-playground-research.md
// "Recommended toggles for native" lines.

export type A1Variant = 'grid' | 'linear' | 'compact' | 'heatmap';
export type A1State = {
  variant: A1Variant;
  personaCount: 1 | 2 | 3;
  clusterCount: 2 | 3 | 4;
  notesPerCluster: 2 | 3 | 4 | 5;
  attribution: 'show' | 'hide';
  density: 'dense' | 'standard' | 'airy'; // matches locked Density Modes (spacing-layout-rhythm.md §C)
  background: 'none' | 'raised' | 'dashed';
  noteLength: 'short' | 'medium' | 'long';
  connectors: 'off' | 'lines' | 'arrows';
};

export const A1_NATIVE: A1State = {
  variant: 'grid',
  personaCount: 2,
  clusterCount: 3,
  notesPerCluster: 5,
  attribution: 'show',
  density: 'standard',
  background: 'none',
  noteLength: 'long',
  connectors: 'off',
};

export type B1Variant = 'classic' | 'overlap-focused' | 'four-circle' | 'inverse';
export type B1State = {
  variant: B1Variant;
  ionSource: 'leyi' | 'cocreate'; // active Ion dataset for 2/3-circle + inverse variants; four-circle auto-uses synthesized
  labelPosition: 'inside' | 'outside' | 'leader-line';
  annotationPointer: 'off' | 'arrow' | 'callout';
  centerMarker: 'none' | 'icon' | 'box';
  tintedOverlap: 'off' | 'on';
  circleStroke: 'solid' | 'dashed' | 'hand-drawn';
  labelStyle: 'caps' | 'sentence';
};

export const B1_NATIVE: B1State = {
  variant: 'classic',
  ionSource: 'leyi',
  labelPosition: 'outside',
  annotationPointer: 'arrow',
  centerMarker: 'icon',
  tintedOverlap: 'off',
  circleStroke: 'solid',
  labelStyle: 'sentence',
};

export type C1Variant = 'horizontal' | 'vertical' | 'stage-cards' | 'annotated';
export type C1State = {
  variant: C1Variant;
  stageCount: 3 | 4 | 5;
  annotationPointer: 'off' | 'arrow' | 'sticker';
  annotationStep: '01' | '02' | '03' | '04' | '05';
  annotationVariant: 'what-if' | 'ion-here';
  stageCardStyle: 'minimal' | 'framed' | 'illustrated';
  conversionPct: 'shown' | 'hidden';
};

export const C1_NATIVE: C1State = {
  variant: 'horizontal',
  stageCount: 5,
  annotationPointer: 'sticker',
  annotationStep: '01',
  annotationVariant: 'what-if',
  stageCardStyle: 'framed',
  conversionPct: 'hidden',
};

export type C2Variant = 'annotated' | 'horizontal-columns' | 'vertical-timeline' | 'heatmap' | 'emotion-curve';
export type C2State = {
  variant: C2Variant;
  phaseCount: 3 | 4 | 5;
  frictionOverlay: 'on' | 'off';
  frictionMarkerStyle: 'dashed-rule' | 'colored-rule' | 'numbered' | 'iconified';
  phaseLabelStyle: 'caps' | 'sentence';
  emotionCurve: 'shown' | 'hidden';
  personaOverlay: 'single' | 'multi';
};

export const C2_NATIVE: C2State = {
  variant: 'annotated',
  phaseCount: 4,
  frictionOverlay: 'on',
  frictionMarkerStyle: 'colored-rule',
  phaseLabelStyle: 'caps',
  emotionCurve: 'hidden',
  personaOverlay: 'single',
};

export type D1Variant = 'hand-drawn' | 'mechanical-stepped' | 'smooth-bezier' | 'two-line-contrast';
export type D1State = {
  variant: D1Variant;
  stageLabels: 'on' | 'off';
  lineTexture: 'sketchy' | 'smooth' | 'dashed';
  endpointEmphasis: 'none' | 'dots' | 'labels';
  lineWeight: 'thin' | 'medium' | 'heavy';
  colorTreatment: 'ink-only' | 'muted-and-emphasized' | 'single-accent';
  stageMarkerStyle: 'dots' | 'labeled-boxes' | 'inline';
};

export const D1_NATIVE: D1State = {
  variant: 'hand-drawn',
  stageLabels: 'on',
  lineTexture: 'sketchy',
  endpointEmphasis: 'labels',
  lineWeight: 'medium',
  colorTreatment: 'ink-only',
  stageMarkerStyle: 'dots',
};

export type D2Variant = 'single-icon-arrow' | 'multi-icon' | 'annotated-icons' | 'before-after' | 'disconnect-as-gap';
export type D2State = {
  variant: D2Variant;
  iconStyle: 'outline' | 'filled' | 'hand-drawn';
  arrowStyle: 'straight' | 'curved' | 'dashed' | 'wavy';
  annotationDensity: 'minimal' | 'standard' | 'verbose';
  iconCount: 1 | 2 | 3 | 4;
  captionPlacement: 'under' | 'side' | 'inline';
  arrowEndpoints: 'solid' | 'open' | 'hand-drawn';
};

export const D2_NATIVE: D2State = {
  variant: 'single-icon-arrow',
  iconStyle: 'filled',
  arrowStyle: 'curved',
  annotationDensity: 'standard',
  iconCount: 1,
  captionPlacement: 'under',
  arrowEndpoints: 'solid',
};

export type A2Variant = 'classic-4-quadrant' | 'cross-shape' | 'linear-stacked' | 'extended-6-quadrant';
export type A2State = {
  variant: A2Variant;
  personaTarget: 'workflow-focused' | 'creative-control' | 'both';
  quadrantSet: 4 | 6;
  itemsPerQuadrant: 3 | 5 | 7;
  centerFigure: 'none' | 'silhouette' | 'glyph';
  sourceAttribution: 'show' | 'hide';
  quadrantLabelsPosition: 'edge' | 'inside';
};

export const A2_NATIVE: A2State = {
  variant: 'classic-4-quadrant',
  personaTarget: 'workflow-focused',
  quadrantSet: 4,
  itemsPerQuadrant: 5,
  centerFigure: 'silhouette',
  sourceAttribution: 'show',
  quadrantLabelsPosition: 'edge',
};

export type A4Variant = 'indi-young-towers' | 'concept-lattice' | 'behavior-feature-grid';
export type A4State = {
  variant: A4Variant;
  towerCount: 3 | 4 | 5;
  alignmentMarkers: 'on' | 'off';
  taskDensity: 3 | 5 | 7;
  colorBanding: 'off' | 'by-class';
  sourceAttribution: 'show' | 'hide';
};

export const A4_NATIVE: A4State = {
  variant: 'indi-young-towers',
  towerCount: 5,
  alignmentMarkers: 'on',
  taskDensity: 5,
  colorBanding: 'off',
  sourceAttribution: 'show',
};

export type B2Variant = 'classic-2x2' | 'labeled-quadrant' | 'heat-density' | 'trajectory';
export type B2State = {
  variant: B2Variant;
  itemCount: 3 | 5 | 7;
  quadrantLabels: 'off' | 'on';
  itemSize: 'uniform' | 'weighted';
  trajectoryArrows: 'off' | 'show';
  gridLines: 'off' | 'faint' | 'mid';
};

export const B2_NATIVE: B2State = {
  variant: 'classic-2x2',
  itemCount: 5,
  quadrantLabels: 'off',
  itemSize: 'uniform',
  trajectoryArrows: 'off',
  gridLines: 'faint',
};

export type B3Variant = 'cluster-constellation' | 'quadrant-style' | 'bullseye' | 'logo-grid' | 'positioned-on-axes';
export type B3State = {
  variant: B3Variant;
  competitorCount: 5 | 7 | 9;
  annotationStyle: 'dot' | 'labeled-card' | 'icon';
  focalHighlight: 'on' | 'off';
  clusterGrouping: 'on' | 'off';
  legendDensity: 'minimal' | 'full';
};

export const B3_NATIVE: B3State = {
  variant: 'cluster-constellation',
  competitorCount: 9,
  annotationStyle: 'labeled-card',
  focalHighlight: 'on',
  clusterGrouping: 'on',
  legendDensity: 'minimal',
};

export type B4Variant = 'hierarchical-top-down' | 'node-link-classic' | 'mind-map-radial';
export type B4State = {
  variant: B4Variant;
  nodeCount: 7 | 10 | 13;
  connectionLabels: 'on' | 'off';
  highlightFocal: 'on' | 'off';
  nodeShape: 'oval' | 'box' | 'circle';
  showCrossLinks: 'on' | 'off';
};

export const B4_NATIVE: B4State = {
  variant: 'hierarchical-top-down',
  nodeCount: 13,
  connectionLabels: 'on',
  highlightFocal: 'on',
  nodeShape: 'oval',
  showCrossLinks: 'on',
};

export type E1Variant = 'spectrum-position' | 'trait-cluster';
export type E1State = {
  variant: E1Variant;
  spectrumCount: 1 | 2 | 3;
  personaCount: 1 | 2;
  annotations: 'on' | 'off';
  derivedMarkers: 'on' | 'off';        // visible flag on derived (vs direct-source) spectrums
  endpointLabels: 'caps-micro' | 'sentence';
  markerStyle: 'dot' | 'pill' | 'tick';
};

export const E1_NATIVE: E1State = {
  variant: 'spectrum-position',
  spectrumCount: 3,
  personaCount: 2,
  annotations: 'on',
  derivedMarkers: 'on',
  endpointLabels: 'caps-micro',
  markerStyle: 'pill',
};

export type C4Variant = 'classic-4-tier' | 'compact-3-tier' | 'vertical' | 'emotion-augmented' | 'physical-evidence';
export type C4State = {
  variant: C4Variant;
  failPoints: 'on' | 'off';
  separatorLabels: 'on' | 'off';
};

export const C4_NATIVE: C4State = {
  variant: 'classic-4-tier',
  failPoints: 'on',
  separatorLabels: 'on',
};

// C3 variant axis = competing register candidates from the C3 reframe research
// (`gate-a-ion-c3-userflow-register-research.md`). User picks a winner via this
// dropdown; the chosen candidate becomes the locked native and the others get
// archived as register-alternatives. Candidate-A is the research's recommended
// starting point. Other axes (branch depth, layout, symbol set, etc.) deferred
// until post-pick depth pass.
export type C3Variant = 'candidate-a' | 'candidate-b' | 'candidate-c' | 'candidate-d';

// Hand-feel parameters — only apply to candidates that use rough.js (A and D).
// - wobble: 0 = perfectly clean, 1.0 = current calibration, 2 = doubly wobbly.
//   Excalidraw signature zone begins around 1.4 (chrome shows a soft warning).
// - strokeCount: how many layered "drawn-twice" passes per shape. 1 = single
//   stroke (cleanest), 2 = current calibration (the layered hand-feel),
//   3 = triple-layered, 4 = quad, 5 = heavy "drawn many times" feel.
// - strokeWidth: multiplier on each path's strokeWidth. 1.0 = current
//   calibration, range 0.5–2.0. Lets designers go thinner (fineliner) or
//   thicker (felt-tip) without picking a pen-tip preset yet.
// - endpointBehavior: how stroke segments meet at corners.
//   - 'clean' = endpoints sit exactly on each (jittered) corner point.
//   - 'protrude' = corners pushed outward by PROTRUDE_AMOUNT — pencil-sketch overshoot.
//   - 'long-overshoot' = same axis as protrude, ~2× the amount — heavy sketchbook look.
//   - 'kink' = corners pushed outward at a randomized angle (not radial), creating
//     a slight angular deviation at each corner.
// - sketchingStyle: pacing of layered strokes.
//   - 'single-pass' = layers stack on the same path geometry (current).
//   - 'loose-overlap' = each layer's start/end is offset along the segment direction.
//   - 'parallel-pass' = each layer offset PERPENDICULAR to the segment direction
//     (parallel "ghost" strokes feel).
//   - 'cross-hatch' = adds extra short diagonal jitter strokes alongside the main
//     path, mimicking pencil cross-hatching.
// Seed control intentionally NOT exposed to chrome (per user decision Q3): the
// screenshot pipeline depends on stable seeds, designers don't need access.
// Pen-tip preset — mirrored from `lib/handFeel.ts` PEN_TIP_PRESETS keys. Keep
// this union in sync with that map.
export type C3PenTip =
  | 'plain'
  | 'ballpoint'
  | 'fineliner'
  | 'pencil-hb'
  | 'pencil-2b'
  | 'felt-tip'
  | 'chisel'
  | 'charcoal';

export type C3HandFeel = {
  wobble: number;
  strokeCount: 1 | 2 | 3 | 4 | 5;
  strokeWidth: number;
  endpointBehavior: 'clean' | 'protrude' | 'long-overshoot' | 'kink';
  sketchingStyle: 'single-pass' | 'loose-overlap' | 'parallel-pass' | 'cross-hatch';
  penTip: C3PenTip;
  // Stroke-edge grain via SVG `feTurbulence` + `feDisplacementMap`. Defensible
  // additive layer over already-jittered geometry per the texture research doc.
  // Seeded for screenshot determinism. Each preset uses a distinct filter
  // recipe (different baseFrequency / octaves / scale / blur / morphology) so
  // they read as genuinely different textures, not just intensity dials.
  // - 'none' = clean ink edge
  // - 'light' = subtle pencil-edge grain
  // - 'heavy' = pronounced pencil-edge grain
  // - 'chalky' = chalk/charcoal grit
  // - 'paper-tooth' = high-freq small-detail break (rough paper)
  // - 'ribbed' = horizontal-bias noise (laid-paper register)
  // - 'stipple' = high-freq fractal (dot-like edge break)
  // - 'wet-ink' = slight blur + displace (fountain pen on absorbent paper)
  // - 'smudge' = asymmetric vertical-bias displacement (smudged charcoal)
  // - 'canvas' = uniform high-freq displacement (canvas weave)
  texture: 'none' | 'light' | 'heavy' | 'chalky' | 'paper-tooth' | 'ribbed' | 'stipple' | 'wet-ink' | 'smudge' | 'canvas';
};

export type C3State = {
  variant: C3Variant;
  decisionLabels: 'on' | 'off';       // Yes/No path labels — applies across all candidates
  handFeel: C3HandFeel;
};

export const C3_NATIVE: C3State = {
  variant: 'candidate-a',
  decisionLabels: 'on',
  handFeel: {
    wobble: 1.0,
    strokeCount: 2,
    strokeWidth: 1.0,
    endpointBehavior: 'clean',
    sketchingStyle: 'single-pass',
    penTip: 'plain',
    texture: 'none',
  },
};

// C5 · Storyboard — variant axis = 6-panel-grid (NN/g + UX-portfolio canon, native)
// + four reserved variants (3-panel cinematic, annotated frames, single-row strip,
// newspaper multi-row). Native-only at IC quality per
// `feedback_native_first_then_variants`. Toggles other than `variant` only affect
// the native render (the four pending variants render the stub regardless).
export type C5Variant =
  | 'six-panel-grid'
  | 'three-panel-cinematic'
  | 'annotated-frames'
  | 'single-row-strip'
  | 'newspaper-multirow';
export type C5State = {
  variant: C5Variant;
  panelCount: 3 | 4 | 6 | 8;
  annotationDensity: 'minimal' | 'standard' | 'generous';
  frameStyle: 'bordered' | 'borderless' | 'full-bleed';
  captionPosition: 'under' | 'side' | 'inset';
};

export const C5_NATIVE: C5State = {
  variant: 'six-panel-grid',
  panelCount: 6,
  annotationDensity: 'standard',
  frameStyle: 'bordered',
  captionPosition: 'under',
};

// E2 · Persona-Journey Overlay — variant axis = side-by-side parallel (UXPressia /
// Smaply / NN/g canon, native) + four reserved variants. Native-only at IC quality
// per `feedback_native_first_then_variants`. Toggles other than `variant` only
// meaningfully affect the native side-by-side-parallel render.
export type E2Variant =
  | 'side-by-side-parallel'
  | 'stacked'
  | 'opposed'
  | 'single-track-multi-marker'
  | 'emotion-augmented';
export type E2State = {
  variant: E2Variant;
  personaCount: 1 | 2;
  pathOverlapVisibility: 'full' | 'shared-only' | 'divergent-only';
  dropoffMarkers: 'on' | 'off';
  annotationDensity: 'minimal' | 'standard' | 'verbose';
  sharedPhases: 'explicit' | 'implicit';
  rowLabels: 'persona-name' | 'persona-name-plus-thesis' | 'caps-only';
};

export const E2_NATIVE: E2State = {
  variant: 'side-by-side-parallel',
  personaCount: 2,
  pathOverlapVisibility: 'full',
  dropoffMarkers: 'on',
  annotationDensity: 'standard',
  sharedPhases: 'explicit',
  rowLabels: 'persona-name',
};

type Ctx = {
  artifact: ArtifactId;
  setArtifact: (v: ArtifactId) => void;
  a1: A1State;
  setA1: (next: Partial<A1State>) => void;
  b1: B1State;
  setB1: (next: Partial<B1State>) => void;
  c1: C1State;
  setC1: (next: Partial<C1State>) => void;
  c2: C2State;
  setC2: (next: Partial<C2State>) => void;
  d1: D1State;
  setD1: (next: Partial<D1State>) => void;
  d2: D2State;
  setD2: (next: Partial<D2State>) => void;
  a2: A2State;
  setA2: (next: Partial<A2State>) => void;
  a4: A4State;
  setA4: (next: Partial<A4State>) => void;
  b2: B2State;
  setB2: (next: Partial<B2State>) => void;
  b3: B3State;
  setB3: (next: Partial<B3State>) => void;
  b4: B4State;
  setB4: (next: Partial<B4State>) => void;
  c3: C3State;
  setC3: (next: Partial<C3State>) => void;
  e1: E1State;
  setE1: (next: Partial<E1State>) => void;
  c4: C4State;
  setC4: (next: Partial<C4State>) => void;
  c5: C5State;
  setC5: (next: Partial<C5State>) => void;
  e2: E2State;
  setE2: (next: Partial<E2State>) => void;
};

const Context = createContext<Ctx | null>(null);

export function GateAIonArtifactPlaygroundProvider({ children }: { children: React.ReactNode }) {
  const [artifact, setArtifact] = useState<ArtifactId>('none');
  const [a1, setA1State] = useState<A1State>(A1_NATIVE);
  const [b1, setB1State] = useState<B1State>(B1_NATIVE);
  const [c1, setC1State] = useState<C1State>(C1_NATIVE);
  const [c2, setC2State] = useState<C2State>(C2_NATIVE);
  const [d1, setD1State] = useState<D1State>(D1_NATIVE);
  const [d2, setD2State] = useState<D2State>(D2_NATIVE);
  const [a2, setA2State] = useState<A2State>(A2_NATIVE);
  const [a4, setA4State] = useState<A4State>(A4_NATIVE);
  const [b2, setB2State] = useState<B2State>(B2_NATIVE);
  const [b3, setB3State] = useState<B3State>(B3_NATIVE);
  const [b4, setB4State] = useState<B4State>(B4_NATIVE);
  const [c3, setC3State] = useState<C3State>(C3_NATIVE);
  const [e1, setE1State] = useState<E1State>(E1_NATIVE);
  const [c4, setC4State] = useState<C4State>(C4_NATIVE);
  const [c5, setC5State] = useState<C5State>(C5_NATIVE);
  const [e2, setE2State] = useState<E2State>(E2_NATIVE);
  const setA1 = (next: Partial<A1State>) => setA1State((s) => ({ ...s, ...next }));
  const setB1 = (next: Partial<B1State>) => setB1State((s) => ({ ...s, ...next }));
  const setC1 = (next: Partial<C1State>) => setC1State((s) => ({ ...s, ...next }));
  const setC2 = (next: Partial<C2State>) => setC2State((s) => ({ ...s, ...next }));
  const setD1 = (next: Partial<D1State>) => setD1State((s) => ({ ...s, ...next }));
  const setD2 = (next: Partial<D2State>) => setD2State((s) => ({ ...s, ...next }));
  const setA2 = (next: Partial<A2State>) => setA2State((s) => ({ ...s, ...next }));
  const setA4 = (next: Partial<A4State>) => setA4State((s) => ({ ...s, ...next }));
  const setB2 = (next: Partial<B2State>) => setB2State((s) => ({ ...s, ...next }));
  const setB3 = (next: Partial<B3State>) => setB3State((s) => ({ ...s, ...next }));
  const setB4 = (next: Partial<B4State>) => setB4State((s) => ({ ...s, ...next }));
  const setC3 = (next: Partial<C3State>) => setC3State((s) => ({ ...s, ...next }));
  const setE1 = (next: Partial<E1State>) => setE1State((s) => ({ ...s, ...next }));
  const setC4 = (next: Partial<C4State>) => setC4State((s) => ({ ...s, ...next }));
  const setC5 = (next: Partial<C5State>) => setC5State((s) => ({ ...s, ...next }));
  const setE2 = (next: Partial<E2State>) => setE2State((s) => ({ ...s, ...next }));
  return <Context.Provider value={{ artifact, setArtifact, a1, setA1, b1, setB1, c1, setC1, c2, setC2, d1, setD1, d2, setD2, a2, setA2, a4, setA4, b2, setB2, b3, setB3, b4, setB4, c3, setC3, e1, setE1, c4, setC4, c5, setC5, e2, setE2 }}>{children}</Context.Provider>;
}

export function useGateAIonArtifactPlayground(): Ctx {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useGateAIonArtifactPlayground must be used within GateAIonArtifactPlaygroundProvider');
  return ctx;
}
