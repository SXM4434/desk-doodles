import React from 'react';
import { IS } from '../cards/tokens';
import { ION_WAVY_COCREATE } from './data/ion-wavy-spectrum';
import { useGateAIonArtifactPlayground, type D1State } from '../../state/GateAIonArtifactPlaygroundContext';
import { seededRandom } from '../../lib/handFeel';

// D1 · Wavy-Line Spectrum — native only at IC quality.
// Native = Ion CoCreate "From ambiguity to certainty" register: tangled-line drawing on
// the left progressively smoothing out to a straight line on the right.
//
// Other variants (mechanical-stepped, smooth-bezier, two-line-contrast) render "pending
// native approval" stubs.
//
// SYSTEM ADHERENCE (audited pre-ship):
// - Typography: locked ladder — IS 10/500/0.12em uppercase (anchor labels), IS 11/300
//   (stage labels). No off-ladder.
// - Spacing: locked tokens — gap 24 (Block), gap 16 (Component), gap 8 (Micro), padding
//   8 (Micro), endpoint dot 8 (Micro). SVG dimensions 720×96 (Reading-width × space-10).
// - Color: W1 only — line stroke --dir-text-primary, dot fills --dir-text-primary, anchor
//   labels --dir-detail, stage labels --dir-text-primary.
// - Hand-drawn-feel: rough.js technique (multi-stroke jittered Bezier) inherited from B1.
//   Reference: shihn.ca/posts/2020/roughjs-algorithms/

const SVG_W = 720;
const SVG_H = 128; // bumped from 96 → 128 (space-11) for vertical breathing room on chaos
const PAD_X = 24;
const CENTER_Y = SVG_H / 2;

// seededRandom moved to ../../lib/handFeel.ts (shared with B1 + C3).

// Generate a wavy-to-straight path. Chaos sells ambiguity:
// - amplitude decays from maxAmplitude (left) to 0 (right) on a SLOW linear curve so
//   messiness persists across the first ~70% of the line before resolving.
// - startOffset gives each stroke a different baseline Y on the left (entanglement
//   effect — strokes don't all start on the centerline). Offset itself decays to 0 by
//   t=1 so all strokes converge to the centerline at the right.
function wavyToStraightPath(
  seed: number,
  samples: number,
  maxAmplitude: number,
  startOffset: number = 0,
): string {
  const rand = seededRandom(seed);
  const points: [number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = PAD_X + t * (SVG_W - 2 * PAD_X);
    // Slower decay so chaos persists into the middle: linear with cap.
    const decay = Math.max(0, 1 - 1.3 * t);
    const yBaseline = startOffset * decay; // baseline drift that resolves toward 0
    const jitter = (rand() - 0.5) * 2 * maxAmplitude * decay;
    const y = CENTER_Y + yBaseline + jitter;
    points.push([x, y]);
  }
  return points.reduce((d, p, i, arr) => {
    if (i === 0) return `M ${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
    const prev = arr[i - 1]!;
    const midX = (prev[0] + p[0]) / 2;
    const midY = (prev[1] + p[1]) / 2;
    return `${d} Q ${prev[0].toFixed(2)} ${prev[1].toFixed(2)}, ${midX.toFixed(2)} ${midY.toFixed(2)}`;
  }, '');
}

function strokeWidthFor(weight: D1State['lineWeight']): number {
  if (weight === 'thin') return 1;
  if (weight === 'heavy') return 2;
  return 1.5; // medium
}

function strokeDashFor(texture: D1State['lineTexture']): string | undefined {
  if (texture === 'dashed') return '8 4';
  return undefined;
}

function colorFor(treatment: D1State['colorTreatment']): { line: string; emphasis: string } {
  // ink-only: everything --dir-text-primary
  // muted-and-emphasized: line --dir-detail, endpoints/markers --dir-text-primary
  // single-accent: line --dir-detail, dots --dir-text-primary, anchor labels --dir-text-primary
  if (treatment === 'muted-and-emphasized') {
    return { line: 'var(--dir-detail)', emphasis: 'var(--dir-text-primary)' };
  }
  if (treatment === 'single-accent') {
    return { line: 'var(--dir-detail)', emphasis: 'var(--dir-text-primary)' };
  }
  return { line: 'var(--dir-text-primary)', emphasis: 'var(--dir-text-primary)' };
}

function NativeHandDrawn({ state }: { state: D1State }) {
  const data = ION_WAVY_COCREATE;
  const stages = data.stages;
  const colors = colorFor(state.colorTreatment);
  const sw = strokeWidthFor(state.lineWeight);
  const dashArr = strokeDashFor(state.lineTexture);

  // Stage marker x positions evenly distributed across the line:
  // (i + 0.5) / N spacing for visual balance under the line.
  const stageX = (i: number) => PAD_X + ((i + 0.5) / stages.length) * (SVG_W - 2 * PAD_X);

  const showStageLabels = state.stageLabels === 'on';
  const showEndpointLabels = state.endpointEmphasis === 'labels';
  const showEndpointDots = state.endpointEmphasis === 'dots';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-detail)',
          margin: 0,
        }}
      >
        From ambiguity to certainty
      </p>

      {/* Anchor labels row — IS 10/500/0.12em uppercase */}
      {showEndpointLabels && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)' }}>
              {data.leftAnchor.primary}
            </span>
            <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)' }}>
              {data.leftAnchor.secondary}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', textAlign: 'right' }}>
            <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)' }}>
              {data.rightAnchor.primary}
            </span>
            <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)' }}>
              {data.rightAnchor.secondary}
            </span>
          </div>
        </div>
      )}

      {/* Wavy-to-straight line SVG */}
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Wavy spectrum from high ambiguity to high certainty"
      >
        {/* Hand-drawn (sketchy): 3 layered jittered strokes with offset baselines on the
            left for an entanglement effect — strokes physically cross each other in the
            chaos zone, all converging to the centerline by t=1. Amplitude bumped to ~32
            so the chaos really reads. */}
        {state.lineTexture === 'sketchy' ? (
          <>
            <path d={wavyToStraightPath(7, 80, 32, 12)} stroke={colors.line} strokeWidth={sw} fill="none" strokeLinecap="round" />
            <path d={wavyToStraightPath(53, 80, 28, -10)} stroke={colors.line} strokeWidth={sw} fill="none" strokeLinecap="round" opacity={0.85} />
            <path d={wavyToStraightPath(131, 80, 22, 4)} stroke={colors.line} strokeWidth={sw} fill="none" strokeLinecap="round" opacity={0.65} />
          </>
        ) : (
          /* Smooth/dashed: SINGLE stroke but the chaos-to-straight curve is preserved.
              maxAmplitude=28 (down from 32 for the multi-stroke variant since there's only
              one line) so the resolved right end still reads as "straight" while the left
              still shows the messiness. */
          <path d={wavyToStraightPath(7, 80, 28)} stroke={colors.line} strokeWidth={sw} strokeDasharray={dashArr} fill="none" strokeLinecap="round" />
        )}
        {/* Endpoint dots (when endpointEmphasis === 'dots') */}
        {showEndpointDots && (
          <>
            <circle cx={PAD_X} cy={CENTER_Y} r={4} fill={colors.emphasis} />
            <circle cx={SVG_W - PAD_X} cy={CENTER_Y} r={4} fill={colors.emphasis} />
          </>
        )}
        {/* Stage markers — small dots on the centerline at evenly distributed positions */}
        {state.stageMarkerStyle === 'dots' &&
          stages.map((_, i) => (
            <circle key={i} cx={stageX(i)} cy={CENTER_Y} r={3} fill={colors.emphasis} />
          ))}
        {/* Labeled boxes (stage marker style alternative): small filled rect with stage number */}
        {state.stageMarkerStyle === 'labeled-boxes' &&
          stages.map((_, i) => (
            <g key={i}>
              <rect x={stageX(i) - 8} y={CENTER_Y - 8} width={16} height={16} fill={colors.emphasis} />
              <text
                x={stageX(i)}
                y={CENTER_Y + 4}
                textAnchor="middle"
                style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, fill: 'var(--dir-bg)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </text>
            </g>
          ))}
      </svg>

      {/* Stage labels row — grid-aligned to stage marker x-positions */}
      {showStageLabels && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))`, gap: 24 }}>
          {stages.map((stage, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
              <span
                style={{
                  fontFamily: IS,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--dir-detail)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <p
                style={{
                  fontFamily: IS,
                  fontSize: 11,
                  fontWeight: 300,
                  lineHeight: 1.45,
                  color: 'var(--dir-text-primary)',
                  margin: 0,
                }}
              >
                {stage.label}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: mechanical-stepped — same chaos-to-order narrative, angular zigzag
// ───────────────────────────────────────────────────────────────────────────

function steppedPath(seed: number, samples: number, maxAmplitude: number): string {
  const rand = seededRandom(seed);
  const segs: [number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = PAD_X + t * (SVG_W - 2 * PAD_X);
    const decay = Math.max(0, 1 - 1.3 * t);
    // Alternating sign so the line zigzags up/down each segment.
    const sign = i % 2 === 0 ? 1 : -1;
    const amp = maxAmplitude * decay * (0.5 + rand() * 0.5);
    const y = CENTER_Y + sign * amp;
    segs.push([x, y]);
  }
  // Use line segments (L) for sharp angular zigzag.
  return segs.reduce((d, p, i) => {
    if (i === 0) return `M ${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
    return `${d} L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  }, '');
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: smooth-bezier — continuous mathematical curve, decaying sine
// ───────────────────────────────────────────────────────────────────────────

function smoothSinePath(maxAmplitude: number, frequency: number): string {
  // Sample sine wave with decay envelope. Uses Bezier through midpoints for smoothness.
  const samples = 100;
  const points: [number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = PAD_X + t * (SVG_W - 2 * PAD_X);
    const decay = Math.max(0, 1 - 1.2 * t);
    const y = CENTER_Y + Math.sin(t * frequency * Math.PI * 2) * maxAmplitude * decay;
    points.push([x, y]);
  }
  return points.reduce((d, p, i, arr) => {
    if (i === 0) return `M ${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
    const prev = arr[i - 1]!;
    const midX = (prev[0] + p[0]) / 2;
    const midY = (prev[1] + p[1]) / 2;
    return `${d} Q ${prev[0].toFixed(2)} ${prev[1].toFixed(2)}, ${midX.toFixed(2)} ${midY.toFixed(2)}`;
  }, '');
}

function VariantMechanicalStepped({ state }: { state: D1State }) {
  const data = ION_WAVY_COCREATE;
  const stages = data.stages;
  const colors = colorFor(state.colorTreatment);
  const sw = strokeWidthFor(state.lineWeight);
  const stageX = (i: number) => PAD_X + ((i + 0.5) / stages.length) * (SVG_W - 2 * PAD_X);
  const showStageLabels = state.stageLabels === 'on';
  const showEndpointLabels = state.endpointEmphasis === 'labels';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
        From ambiguity to certainty · stepped register
      </p>
      {showEndpointLabels && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)' }}>{data.leftAnchor.primary}</span>
            <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)' }}>{data.leftAnchor.secondary}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', textAlign: 'right' }}>
            <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)' }}>{data.rightAnchor.primary}</span>
            <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)' }}>{data.rightAnchor.secondary}</span>
          </div>
        </div>
      )}
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Stepped spectrum">
        <path d={steppedPath(11, 32, 36)} stroke={colors.line} strokeWidth={sw} fill="none" strokeLinejoin="miter" strokeLinecap="square" />
        {state.stageMarkerStyle === 'dots' && stages.map((_, i) => (
          <circle key={i} cx={stageX(i)} cy={CENTER_Y} r={3} fill={colors.emphasis} />
        ))}
      </svg>
      {showStageLabels && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))`, gap: 24 }}>
          {stages.map((stage, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', fontVariantNumeric: 'tabular-nums' }}>{String(i + 1).padStart(2, '0')}</span>
              <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.45, color: 'var(--dir-text-primary)', margin: 0 }}>{stage.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VariantSmoothBezier({ state }: { state: D1State }) {
  const data = ION_WAVY_COCREATE;
  const stages = data.stages;
  const colors = colorFor(state.colorTreatment);
  const sw = strokeWidthFor(state.lineWeight);
  const stageX = (i: number) => PAD_X + ((i + 0.5) / stages.length) * (SVG_W - 2 * PAD_X);
  const showStageLabels = state.stageLabels === 'on';
  const showEndpointLabels = state.endpointEmphasis === 'labels';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
        From ambiguity to certainty · smooth bezier
      </p>
      {showEndpointLabels && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)' }}>{data.leftAnchor.primary}</span>
            <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)' }}>{data.leftAnchor.secondary}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', textAlign: 'right' }}>
            <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)' }}>{data.rightAnchor.primary}</span>
            <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)' }}>{data.rightAnchor.secondary}</span>
          </div>
        </div>
      )}
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Smooth bezier spectrum">
        <path d={smoothSinePath(40, 3)} stroke={colors.line} strokeWidth={sw} fill="none" strokeLinecap="round" />
        {state.stageMarkerStyle === 'dots' && stages.map((_, i) => (
          <circle key={i} cx={stageX(i)} cy={CENTER_Y} r={3} fill={colors.emphasis} />
        ))}
      </svg>
      {showStageLabels && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))`, gap: 24 }}>
          {stages.map((stage, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', fontVariantNumeric: 'tabular-nums' }}>{String(i + 1).padStart(2, '0')}</span>
              <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.45, color: 'var(--dir-text-primary)', margin: 0 }}>{stage.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VariantTwoLineContrast({ state }: { state: D1State }) {
  const data = ION_WAVY_COCREATE;
  const colors = colorFor(state.colorTreatment);
  const sw = strokeWidthFor(state.lineWeight);
  const SECTION_H = 80; // per-line svg height — space-9
  const sectionCenterY = SECTION_H / 2;

  function chaosLine(seed: number, amp: number, baseline: number): string {
    const rand = seededRandom(seed);
    const points: [number, number][] = [];
    const samples = 80;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = PAD_X + t * (SVG_W - 2 * PAD_X);
      const jitter = (rand() - 0.5) * 2 * amp;
      points.push([x, sectionCenterY + baseline + jitter]);
    }
    return points.reduce((d, p, i, arr) => {
      if (i === 0) return `M ${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
      const prev = arr[i - 1]!;
      const midX = (prev[0] + p[0]) / 2;
      const midY = (prev[1] + p[1]) / 2;
      return `${d} Q ${prev[0].toFixed(2)} ${prev[1].toFixed(2)}, ${midX.toFixed(2)} ${midY.toFixed(2)}`;
    }, '');
  }

  // Each line gets its own captioned section so it's unambiguous which line is which.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
        Without Ion vs With Ion · contrast register
      </p>

      {/* Section 1 — without Ion (chaotic) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            01 · Without Ion
          </span>
          <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)' }}>
            {data.leftAnchor.primary} · {data.leftAnchor.secondary}
          </span>
        </div>
        <svg viewBox={`0 0 ${SVG_W} ${SECTION_H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Without Ion: chaotic line">
          <path d={chaosLine(17, 22, 0)} stroke={colors.line} strokeWidth={sw} fill="none" strokeLinecap="round" />
          <path d={chaosLine(89, 18, 4)} stroke={colors.line} strokeWidth={sw} fill="none" strokeLinecap="round" opacity={0.85} />
          <path d={chaosLine(131, 14, -3)} stroke={colors.line} strokeWidth={sw} fill="none" strokeLinecap="round" opacity={0.65} />
        </svg>
      </div>

      {/* Section 2 — with Ion (resolved) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            02 · With Ion
          </span>
          <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)' }}>
            {data.rightAnchor.primary} · {data.rightAnchor.secondary}
          </span>
        </div>
        <svg viewBox={`0 0 ${SVG_W} ${SECTION_H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="With Ion: straight line">
          <line x1={PAD_X} y1={sectionCenterY} x2={SVG_W - PAD_X} y2={sectionCenterY} stroke={colors.line} strokeWidth={sw} strokeLinecap="round" />
          <circle cx={PAD_X} cy={sectionCenterY} r={3} fill={colors.emphasis} />
          <circle cx={SVG_W - PAD_X} cy={sectionCenterY} r={3} fill={colors.emphasis} />
        </svg>
      </div>

      <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.6, color: 'var(--dir-text-secondary)', margin: 0, maxWidth: 680 }}>
        Without Ion, ambiguity persists across the whole process — the line stays tangled. With Ion, the path is resolved end-to-end — the line is straight from start to finish.
      </p>
    </div>
  );
}

export function D1WavySpectrum() {
  const { d1 } = useGateAIonArtifactPlayground();
  if (d1.variant === 'hand-drawn') return <NativeHandDrawn state={d1} />;
  if (d1.variant === 'mechanical-stepped') return <VariantMechanicalStepped state={d1} />;
  if (d1.variant === 'smooth-bezier') return <VariantSmoothBezier state={d1} />;
  return <VariantTwoLineContrast state={d1} />;
}
