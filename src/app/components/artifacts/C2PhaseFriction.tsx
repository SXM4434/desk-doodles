import React from 'react';
import { IS } from '../cards/tokens';
import { ION_PHASE_FRICTION_DEMO_DAY, type C2Item } from './data/ion-phase-friction';
import { useGateAIonArtifactPlayground, type C2State } from '../../state/GateAIonArtifactPlaygroundContext';

// C2 · Phase-Friction Breakdown — native only at IC quality.
// Native = Ion Demo Day "high friction from start to end" register: 4 phases (Kickoff /
// Ideation / Review / Delivery), friction labels overlaid on phases 2-4 (Kickoff stays
// untouched per deck), per-phase items with colored-rule marker on friction items, primary
// friction (Unclear direction / Scattered feedback / Back-and-forth communication) gets
// heavier left rule.
//
// Other variants (horizontal-columns, vertical-timeline, heatmap, emotion-curve) render
// "pending native approval" stubs.
//
// SYSTEM ADHERENCE (audited pre-ship):
// - Typography: locked ladder — IS 10/500/0.12em uppercase (caps phase labels), IS 11/300
//   (Caption/Note for sub-labels), IS 13/300 (Dense Body item text). No off-ladder.
// - Spacing: locked tokens — gap 24 (Block) between phases, gap 12 (Tight) between items
//   inside a phase, padding-left 12 (Tight) for item-rule offset, padding-bottom 8 (Micro)
//   for phase header rule.
// - Color: W1 only — phase header --dir-text-primary, item text --dir-text-primary,
//   sub-label --dir-text-secondary. Friction marker = --dir-text-primary (primary) or
//   --dir-detail (secondary) left border. No accent tints, no rgba.

function PhaseItemRow({
  item,
  markerStyle,
  isFriction,
  index,
}: {
  item: C2Item;
  markerStyle: C2State['frictionMarkerStyle'];
  isFriction: boolean;
  index: number;
}) {
  // Marker style → rendering treatment for friction items.
  // - colored-rule (native): solid left border in --dir-text-primary (primary) or
  //   --dir-detail (secondary). Replaces the deck's red highlight without violating W1.
  // - dashed-rule: dashed border (1px) in --dir-detail.
  // - numbered: prepend "01" "02" caps eyebrow inline.
  // - iconified: prepend a directional ▸ glyph in --dir-detail.
  const isPrimary = item.isPrimary === true;
  let borderLeft: string | undefined;
  let prefixGlyph: string | null = null;
  let prefixNumber: string | null = null;

  if (isFriction) {
    if (markerStyle === 'colored-rule') {
      borderLeft = isPrimary
        ? '2px solid var(--dir-text-primary)'
        : '1px solid var(--dir-detail)';
    } else if (markerStyle === 'dashed-rule') {
      borderLeft = '1px dashed var(--dir-detail)';
    } else if (markerStyle === 'numbered') {
      prefixNumber = String(index + 1).padStart(2, '0');
    } else if (markerStyle === 'iconified') {
      prefixGlyph = '▸';
    }
  } else {
    // Non-friction (workflow) item — subtle border for visual rhythm.
    borderLeft = '1px solid var(--dir-border)';
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        paddingLeft: borderLeft ? 12 : 0,
        borderLeft,
      }}
    >
      {prefixNumber && (
        <span
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.12em',
            color: 'var(--dir-detail)',
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          {prefixNumber}
        </span>
      )}
      {prefixGlyph && (
        <span
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--dir-detail)',
            flexShrink: 0,
          }}
        >
          {prefixGlyph}
        </span>
      )}
      <p
        style={{
          fontFamily: IS,
          fontSize: 13,
          fontWeight: 300,
          lineHeight: 1.45,
          color: 'var(--dir-text-primary)',
          margin: 0,
        }}
      >
        {item.text}
      </p>
    </div>
  );
}

function PhaseColumn({
  phase,
  state,
}: {
  phase: ReturnType<typeof getPhaseData>[0];
  state: C2State;
}) {
  const isCaps = state.phaseLabelStyle === 'caps';
  const items = state.frictionOverlay === 'on' ? phase.frictionItems : phase.workflowItems;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <h4
        style={{
          fontFamily: IS,
          fontSize: isCaps ? 10 : 13,
          fontWeight: isCaps ? 500 : 600,
          lineHeight: 1.4,
          letterSpacing: isCaps ? '0.12em' : '-0.01em',
          textTransform: isCaps ? 'uppercase' : 'none',
          color: 'var(--dir-text-primary)',
          margin: 0,
          paddingBottom: 8,
          borderBottom: '1px solid var(--dir-border)',
        }}
      >
        {phase.name}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, i) => (
          <PhaseItemRow
            key={i}
            item={item}
            markerStyle={state.frictionMarkerStyle}
            isFriction={state.frictionOverlay === 'on' && phase.hasFriction}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}

// Emotion track — reusable overlay rendered above any variant when emotionCurve === 'shown'.
// Per-phase dot positioned on a 64px-tall vertical scale: high friction → low emotion (dot
// sits lower); zero friction → high emotion (dot sits higher).
function EmotionTrack({ phases, frictionOn, cols }: {
  phases: ReturnType<typeof getPhaseData>;
  frictionOn: boolean;
  cols: string;
}) {
  const frictionCounts = phases.map((p) => (frictionOn && p.hasFriction ? p.frictionItems.length : 0));
  const maxF = Math.max(1, ...frictionCounts);
  const emotion = frictionCounts.map((c) => 1 - c / maxF);
  const TRACK_H = 64;
  const PAD_INNER = 8;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 24, alignItems: 'start' }}>
      {phases.map((_, i) => {
        const e = emotion[i] ?? 0;
        const dotY = PAD_INNER + (1 - e) * (TRACK_H - 2 * PAD_INNER);
        return (
          <div key={i} style={{ position: 'relative', height: TRACK_H }}>
            {/* Dashed midline */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: TRACK_H / 2,
                height: 1,
                backgroundImage: 'repeating-linear-gradient(to right, var(--dir-border) 0 4px, transparent 4px 8px)',
              }}
            />
            {/* Emotion dot */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: dotY,
                width: 8,
                height: 8,
                marginLeft: -4,
                marginTop: -4,
                borderRadius: 4,
                backgroundColor: 'var(--dir-text-primary)',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// Persona-context eyebrow — minimum-viable wiring for personaOverlay toggle.
// 'single' surfaces a Workflow-focused persona caps label (the Demo Day source
// dataset is single-persona). 'multi' surfaces a cross-persona aggregation
// caps label. Avoids fabricating per-persona friction data we don't have.
function PersonaContextEyebrow({ mode }: { mode: C2State['personaOverlay'] }) {
  const text = mode === 'multi'
    ? 'Cross-persona aggregate'
    : 'Workflow-focused persona perspective';
  return (
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
      {text}
    </p>
  );
}

// Helper to fold both item lists into a uniform shape per phase.
function getPhaseData(state: C2State) {
  const phases = ION_PHASE_FRICTION_DEMO_DAY.phases.slice(0, state.phaseCount);
  return phases.map((p) => ({
    name: p.name,
    frictionItems: p.frictionItems,
    workflowItems: p.workflowItems.map((text) => ({ text } as C2Item)),
    // Kickoff stays unchanged on the friction slide; mark whether THIS phase carries
    // friction-overlay treatment (so PhaseItemRow can decide to apply the marker).
    hasFriction: p.frictionItems.some((it) => it.isPrimary),
  }));
}

function NativeAnnotated({ state }: { state: C2State }) {
  const phases = getPhaseData(state);
  const cols = `repeat(${phases.length}, minmax(0, 1fr))`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PersonaContextEyebrow mode={state.personaOverlay} />
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
        {state.frictionOverlay === 'on'
          ? 'High friction from start to end'
          : 'Workflow phases · Kickoff to Delivery'}
      </p>
      {state.emotionCurve === 'shown' && (
        <EmotionTrack phases={phases} frictionOn={state.frictionOverlay === 'on'} cols={cols} />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 24, alignItems: 'start' }}>
        {phases.map((phase, i) => (
          <PhaseColumn key={i} phase={phase} state={state} />
        ))}
      </div>
      {state.frictionOverlay === 'on' && (
        <p
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 300,
            lineHeight: 1.6,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            maxWidth: 680,
          }}
        >
          Product teams, including designers, often encounter friction at every stage, resulting in frustrations and misalignments.
        </p>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: horizontal-columns — same shape as native but uniform marker weight
// ───────────────────────────────────────────────────────────────────────────
// All friction items render at the same 1px detail rule (no primary-emphasis treatment).
// Distinguishes from native by visual flatness — every friction item reads as equally
// weighted, vs native's hierarchy where primary friction labels visually anchor.

function VariantHorizontalColumns({ state }: { state: C2State }) {
  const phases = getPhaseData(state);
  const cols = `repeat(${phases.length}, minmax(0, 1fr))`;
  const isCaps = state.phaseLabelStyle === 'caps';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PersonaContextEyebrow mode={state.personaOverlay} />
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
        Phase friction · uniform-weight columns
      </p>
      {state.emotionCurve === 'shown' && (
        <EmotionTrack phases={phases} frictionOn={state.frictionOverlay === 'on'} cols={cols} />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 24, alignItems: 'start' }}>
        {phases.map((phase, i) => {
          const items = state.frictionOverlay === 'on' ? phase.frictionItems : phase.workflowItems;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <h4
                style={{
                  fontFamily: IS,
                  fontSize: isCaps ? 10 : 13,
                  fontWeight: isCaps ? 500 : 600,
                  letterSpacing: isCaps ? '0.12em' : '-0.01em',
                  textTransform: isCaps ? 'uppercase' : 'none',
                  lineHeight: 1.4,
                  color: 'var(--dir-text-primary)',
                  margin: 0,
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--dir-border)',
                }}
              >
                {phase.name}
              </h4>
              {items.map((item, j) => (
                <div
                  key={j}
                  style={{
                    paddingLeft: 12,
                    borderLeft: state.frictionOverlay === 'on' && phase.hasFriction ? '1px solid var(--dir-detail)' : '1px solid var(--dir-border)',
                  }}
                >
                  <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, lineHeight: 1.45, color: 'var(--dir-text-primary)', margin: 0 }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: vertical-timeline — phases as rows, items as horizontal lists
// ───────────────────────────────────────────────────────────────────────────
// Service-design canon: phases stack top-to-bottom on a vertical rail, with each phase's
// items spread horizontally to the right of the phase label.

function VariantVerticalTimeline({ state }: { state: C2State }) {
  const phases = getPhaseData(state);
  const cols = `repeat(${phases.length}, minmax(0, 1fr))`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PersonaContextEyebrow mode={state.personaOverlay} />
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
        Phase friction · vertical timeline
      </p>
      {state.emotionCurve === 'shown' && (
        <EmotionTrack phases={phases} frictionOn={state.frictionOverlay === 'on'} cols={cols} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {phases.map((phase, i) => {
          const items = state.frictionOverlay === 'on' ? phase.frictionItems : phase.workflowItems;
          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '128px 1fr',
                gap: 24,
                alignItems: 'start',
                paddingTop: i === 0 ? 0 : 12,
                borderTop: i === 0 ? 'none' : '1px solid var(--dir-border)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p
                  style={{
                    fontFamily: IS,
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--dir-detail)',
                    fontVariantNumeric: 'tabular-nums',
                    margin: 0,
                  }}
                >
                  {`Phase ${String(i + 1).padStart(2, '0')}`}
                </p>
                <h4
                  style={{
                    fontFamily: IS,
                    fontSize: 18,
                    fontWeight: 600,
                    lineHeight: 1.4,
                    letterSpacing: '-0.01em',
                    color: 'var(--dir-text-primary)',
                    margin: 0,
                  }}
                >
                  {phase.name}
                </h4>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {items.map((item, j) => (
                  <div
                    key={j}
                    style={{
                      flex: '0 1 auto',
                      paddingLeft: 12,
                      paddingRight: 12,
                      paddingTop: 4,
                      paddingBottom: 4,
                      borderLeft:
                        state.frictionOverlay === 'on' && phase.hasFriction && item.isPrimary
                          ? '2px solid var(--dir-text-primary)'
                          : state.frictionOverlay === 'on' && phase.hasFriction
                            ? '1px solid var(--dir-detail)'
                            : '1px solid var(--dir-border)',
                    }}
                  >
                    <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, lineHeight: 1.45, color: 'var(--dir-text-primary)', margin: 0 }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: heatmap — phase column bg tinted by friction intensity (W1 steps)
// ───────────────────────────────────────────────────────────────────────────
// Friction count per phase drives W1 step-token bg: 0 friction → --dir-bg (no tint),
// some friction → --dir-raised, heavy friction → --dir-muted. NN/g heatmap variant
// without continuous color-mix on accent ink (per W1 §D + audit memory).

function VariantHeatmap({ state }: { state: C2State }) {
  const phases = getPhaseData(state);
  const cols = `repeat(${phases.length}, minmax(0, 1fr))`;
  const isCaps = state.phaseLabelStyle === 'caps';
  // Compute max friction count to normalize.
  const frictionCounts = phases.map((p) => (p.hasFriction ? p.frictionItems.length : 0));
  const maxFriction = Math.max(1, ...frictionCounts);
  const bgFor = (count: number): string => {
    const ratio = count / maxFriction;
    if (ratio === 0) return 'var(--dir-bg)';
    if (ratio <= 0.5) return 'var(--dir-raised)';
    if (ratio <= 0.85) return 'var(--dir-recessed)';
    return 'var(--dir-muted)';
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PersonaContextEyebrow mode={state.personaOverlay} />
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
        Phase friction · heatmap intensity
      </p>
      {state.emotionCurve === 'shown' && (
        <EmotionTrack phases={phases} frictionOn={state.frictionOverlay === 'on'} cols={cols} />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 24, alignItems: 'start' }}>
        {phases.map((phase, i) => {
          const items = state.frictionOverlay === 'on' ? phase.frictionItems : phase.workflowItems;
          const count = state.frictionOverlay === 'on' && phase.hasFriction ? phase.frictionItems.length : 0;
          return (
            <div
              key={i}
              style={{
                padding: 16,
                backgroundColor: bgFor(count),
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                minWidth: 0,
              }}
            >
              <h4
                style={{
                  fontFamily: IS,
                  fontSize: isCaps ? 10 : 13,
                  fontWeight: isCaps ? 500 : 600,
                  letterSpacing: isCaps ? '0.12em' : '-0.01em',
                  textTransform: isCaps ? 'uppercase' : 'none',
                  lineHeight: 1.4,
                  color: 'var(--dir-text-primary)',
                  margin: 0,
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--dir-border)',
                }}
              >
                {phase.name}
              </h4>
              {items.map((item, j) => (
                <p key={j} style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, lineHeight: 1.45, color: 'var(--dir-text-primary)', margin: 0 }}>
                  {item.text}
                </p>
              ))}
            </div>
          );
        })}
      </div>
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
        bg intensity = friction count · W1 steps (--dir-bg → raised → recessed → muted)
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: emotion-curve overlay — NN/g register
// ───────────────────────────────────────────────────────────────────────────
// SVG line above the phase columns dips at high-friction phases. Curve sampled at one
// point per phase column center. High-friction = low emotion (line dips); low-friction =
// high emotion (line peaks).

function VariantEmotionCurve({ state }: { state: C2State }) {
  const phases = getPhaseData(state);
  const cols = `repeat(${phases.length}, minmax(0, 1fr))`;
  const isCaps = state.phaseLabelStyle === 'caps';
  // Emotion per phase: 1 (high) → 0 (low) based on friction count.
  const frictionCounts = phases.map((p) => (state.frictionOverlay === 'on' && p.hasFriction ? p.frictionItems.length : 0));
  const maxF = Math.max(1, ...frictionCounts);
  const emotion = frictionCounts.map((c) => 1 - c / maxF);
  // Per-phase emotion track: dot positioned on a 64px-tall vertical scale.
  // Y math: e=1 at y=8 (top), e=0 at y=56 (bottom-ish). Locked tokens.
  const TRACK_H = 64;
  const PAD = 8;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PersonaContextEyebrow mode={state.personaOverlay} />
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
        Per-phase emotion trace · NN/g register
      </p>
      {/* Per-phase emotion indicator row — grid-aligned to phase columns below */}
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 24, alignItems: 'start' }}>
        {phases.map((_, i) => {
          const e = emotion[i] ?? 0;
          const dotY = PAD + (1 - e) * (TRACK_H - 2 * PAD);
          const isHigh = e >= 0.5;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              {/* Vertical track with midline + dot */}
              <div style={{ width: '100%', height: TRACK_H, position: 'relative' }}>
                {/* Top "HIGH" marker (axis label, only on first column to avoid clutter) */}
                {i === 0 && (
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      fontFamily: IS,
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--dir-detail)',
                    }}
                  >
                    High
                  </span>
                )}
                {/* Bottom "LOW" marker on first column */}
                {i === 0 && (
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      fontFamily: IS,
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--dir-detail)',
                    }}
                  >
                    Low
                  </span>
                )}
                {/* Dashed midline (neutral emotion reference) */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: TRACK_H / 2,
                    height: 1,
                    backgroundImage: 'repeating-linear-gradient(to right, var(--dir-border) 0 4px, transparent 4px 8px)',
                  }}
                />
                {/* Emotion dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: dotY,
                    width: 8,
                    height: 8,
                    marginLeft: -4,
                    marginTop: -4,
                    borderRadius: 4,
                    backgroundColor: 'var(--dir-text-primary)',
                  }}
                />
              </div>
              {/* Per-column emotion label */}
              <p
                style={{
                  fontFamily: IS,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--dir-detail)',
                  margin: 0,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {isHigh ? 'Emotion · high' : 'Emotion · low'}
              </p>
            </div>
          );
        })}
      </div>
      {/* Phase columns row — same grid template so columns align to emotion track above */}
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 24, alignItems: 'start' }}>
        {phases.map((phase, i) => {
          const items = state.frictionOverlay === 'on' ? phase.frictionItems : phase.workflowItems;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <h4
                style={{
                  fontFamily: IS,
                  fontSize: isCaps ? 10 : 13,
                  fontWeight: isCaps ? 500 : 600,
                  letterSpacing: isCaps ? '0.12em' : '-0.01em',
                  textTransform: isCaps ? 'uppercase' : 'none',
                  lineHeight: 1.4,
                  color: 'var(--dir-text-primary)',
                  margin: 0,
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--dir-border)',
                }}
              >
                {phase.name}
              </h4>
              {items.map((item, j) => (
                <p key={j} style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, lineHeight: 1.45, color: 'var(--dir-text-primary)', margin: 0 }}>
                  {item.text}
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function C2PhaseFriction() {
  const { c2 } = useGateAIonArtifactPlayground();
  if (c2.variant === 'annotated') return <NativeAnnotated state={c2} />;
  if (c2.variant === 'horizontal-columns') return <VariantHorizontalColumns state={c2} />;
  if (c2.variant === 'vertical-timeline') return <VariantVerticalTimeline state={c2} />;
  if (c2.variant === 'heatmap') return <VariantHeatmap state={c2} />;
  return <VariantEmotionCurve state={c2} />;
}
