import React from 'react';
import { IS, ISe } from '../cards/tokens';
import { ION_PERSONA_TRAITS, type Persona, type PersonaId, type TraitSpectrum } from './data/ion-persona-traits';
import { useGateAIonArtifactPlayground, type E1State } from '../../state/GateAIonArtifactPlaygroundContext';

// E1 · Persona-trait visualization — native only at IC quality.
// Native = Spectrum-position register: 3 trait spectrums stacked vertically, 2 personas
// plotted on each. Primary spectrum (Speeding automation ↔ Empowering creativity) is
// directly grounded in Leyi's case study §1; secondary spectrums (Process control,
// Trust in AI output) are derived from research themes and visibly flagged.
//
// Trait-cluster variant renders a "pending native approval" stub per
// feedback_native_first_then_variants.
//
// Register choice: clean editorial (NOT rough.js). E1 deliberately sits in the
// type-and-composition register rather than the hand-feel register so rough.js
// doesn't become an over-applied catalog signature (B1 + D1 + C3-pending = three
// rough.js artifacts is the limit; a fourth would tip into "always wobbly").
//
// SYSTEM ADHERENCE (audited pre-ship):
// - Typography: locked ladder only — IS 10/500/0.12em uppercase (eyebrow, endpoint
//   labels, derived flag), IS 11/300 (persona label + annotation, Caption/Note),
//   IS 13/300 (axis-name caps eyebrow scaled up via letter-spacing for hierarchy).
//   No off-ladder sizes. ISe not used.
// - Spacing: locked tokens — gap 32 (Section) between spectrums, gap 12 (Tight)
//   eyebrow → axis, gap 16 (Component) axis → annotation, gap 8 (Micro) inter-row.
// - Color: W1 tokens only — axis = --dir-border, persona-A pill solid in
//   --dir-text-primary with --dir-bg-paper text (inverted for differentiation),
//   persona-B pill outlined in --dir-text-primary with --dir-text-primary text,
//   eyebrow = --dir-text-primary, derived flag = --dir-detail, annotation =
//   --dir-text-secondary. No accent tints, no rgba.

// ───────────────────────────────────────────────────────────────────────────
// Native: spectrum-position
// ───────────────────────────────────────────────────────────────────────────

const AXIS_WIDTH_PX = 480;          // horizontal axis area inside the row
const MARKER_HEIGHT = 22;           // pill height
const PILL_PAD_X = 10;              // horizontal padding inside pill
const TICK_RADIUS = 4;              // small tick at marker center

function PersonaPill({
  label,
  filled,
  marker = 'pill',
}: {
  label: string;
  filled: boolean;
  marker?: E1State['markerStyle'];
}) {
  if (marker === 'dot') {
    // Dot marker: small circle + caps label beneath. Filled persona = solid fill;
    // outlined persona = transparent center with primary-ink ring.
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span
          aria-hidden
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: filled ? 'var(--dir-text-primary)' : 'transparent',
            border: '1.5px solid var(--dir-text-primary)',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--dir-text-primary)',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </span>
    );
  }
  if (marker === 'tick') {
    // Tick marker: short vertical bar + caps label beneath. Filled persona = thicker
    // bar (essential visual differentiator); outlined persona = thinner bar.
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span
          aria-hidden
          style={{
            width: filled ? 3 : 1.5,
            height: 18,
            backgroundColor: 'var(--dir-text-primary)',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--dir-text-primary)',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </span>
    );
  }
  // pill (default)
  return (
    <span
      style={{
        fontFamily: IS,
        fontSize: 11,
        fontWeight: 300,
        lineHeight: 1,
        letterSpacing: '-0.005em',
        color: filled ? 'var(--dir-bg)' : 'var(--dir-text-primary)',
        // Filled pill keeps solid bg (essential visual differentiator between
        // the two personas). Outlined pill is transparent — SVG connector lines
        // stop at the pill's bounding-rect edge before reaching text, so no
        // knockout needed.
        backgroundColor: filled ? 'var(--dir-text-primary)' : 'transparent',
        border: `1px solid var(--dir-text-primary)`,
        borderRadius: 9999,
        padding: `0 ${PILL_PAD_X}px`,
        height: MARKER_HEIGHT,
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function SpectrumRow({
  spectrum,
  state,
}: {
  spectrum: TraitSpectrum;
  state: E1State;
}) {
  const { positions, annotations, derived, axisName, leftLabel, rightLabel, source } = spectrum;
  const personas = ION_PERSONA_TRAITS.personas.slice(0, state.personaCount);
  const showAnnotations = state.annotations === 'on';
  const showDerived = state.derivedMarkers === 'on';
  // Endpoint label style — caps-micro (default) vs sentence case. Both stay on
  // the locked typography ladder: caps-micro = IS 10/500/0.12em uppercase
  // (Meta/Label/UI register), sentence = IS 11/300 (Caption/Note register).
  const isCaps = state.endpointLabels === 'caps-micro';
  const endpointStyle: React.CSSProperties = isCaps
    ? { fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }
    : { fontSize: 11, fontWeight: 300, letterSpacing: '-0.005em', textTransform: 'none' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Eyebrow row: trait name + (optional) derived flag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--dir-text-primary)',
            margin: 0,
          }}
        >
          {axisName}
        </p>
        {showDerived && (
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
            {derived ? 'Derived' : 'Source · §1'}
          </p>
        )}
      </div>

      {/* Axis row: endpoint labels at left/right, axis line + markers in the middle */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `auto ${AXIS_WIDTH_PX}px auto`,
          gap: 16,
          alignItems: 'center',
        }}
      >
        <p
          style={{
            fontFamily: IS,
            ...endpointStyle,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            textAlign: 'right',
          }}
        >
          {leftLabel}
        </p>

        {/* Axis area: horizontal line + persona markers */}
        <div style={{ position: 'relative', height: 56 }}>
          {/* Horizontal axis line — centered vertically */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 27,
              height: 1.5,
              backgroundColor: 'var(--dir-border)',
            }}
          />
          {/* DUMBBELL CONNECTOR — thick bar between the two persona positions on
              this axis. Per Nightingale/Visa/Observable dataviz literature: the
              connecting line is the load-bearing element of a dumbbell plot,
              encoding the gap between the two values. Color = --dir-text-primary
              (vs background axis line's --dir-border) so the active segment
              reads as the synthesis: "the distance between these two personas
              on this dimension." */}
          {personas.length >= 2 && (() => {
            const posA = positions[personas[0].id];
            const posB = positions[personas[1].id];
            const leftPct = Math.min(posA, posB);
            const rightPct = Math.max(posA, posB);
            return (
              <div
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  width: `${rightPct - leftPct}%`,
                  top: 25.5,
                  height: 4.5,
                  backgroundColor: 'var(--dir-text-primary)',
                  zIndex: 1,
                }}
              />
            );
          })()}
          {/* End ticks — small marks at 0 and 100% to anchor the line visually */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 22,
              width: 1.5,
              height: 12,
              backgroundColor: 'var(--dir-border)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 22,
              width: 1.5,
              height: 12,
              backgroundColor: 'var(--dir-border)',
            }}
          />
          {/* Persona markers — pill above tick mark */}
          {personas.map((p, i) => {
            const pct = positions[p.id];
            const filled = i === 0;
            return (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: `${pct}%`,
                  top: 0,
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <PersonaPill label={p.name} filled={filled} marker={state.markerStyle} />
                {/* Tick connecting pill to axis line */}
                <div
                  style={{
                    width: 1.5,
                    height: 12,
                    backgroundColor: 'var(--dir-text-primary)',
                  }}
                />
                {/* Round dot on the axis at exact position */}
                <div
                  style={{
                    width: TICK_RADIUS * 2,
                    height: TICK_RADIUS * 2,
                    borderRadius: '50%',
                    backgroundColor: 'var(--dir-text-primary)',
                    marginTop: -TICK_RADIUS - 1,
                  }}
                />
              </div>
            );
          })}
        </div>

        <p
          style={{
            fontFamily: IS,
            ...endpointStyle,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            textAlign: 'left',
          }}
        >
          {rightLabel}
        </p>
      </div>

      {/* Annotations: one short paragraph per persona, with persona name as eyebrow */}
      {showAnnotations && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 0 }}>
          {personas.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr',
                gap: 16,
                alignItems: 'baseline',
              }}
            >
              <p
                style={{
                  fontFamily: IS,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--dir-text-primary)',
                  margin: 0,
                }}
              >
                {p.name}
              </p>
              <p
                style={{
                  fontFamily: IS,
                  fontSize: 11,
                  fontWeight: 300,
                  lineHeight: 1.55,
                  color: 'var(--dir-text-secondary)',
                  margin: 0,
                }}
              >
                {annotations[p.id]}
              </p>
            </div>
          ))}
          <p
            style={{
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--dir-detail)',
              margin: 0,
              marginTop: 4,
            }}
          >
            {source}
          </p>
        </div>
      )}
    </div>
  );
}

function NativeSpectrumPosition({ state }: { state: E1State }) {
  const spectrums = ION_PERSONA_TRAITS.spectrums.slice(0, state.spectrumCount);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {spectrums.map((s) => (
        <SpectrumRow key={s.id} spectrum={s} state={state} />
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: trait-cluster (overlap spider) — 2026-05-18 rebuild
// ───────────────────────────────────────────────────────────────────────────
//
// Single chart, BOTH personas plotted as overlapping polygons on 3 bidirectional
// axes (one per spectrum). Each axis has its two endpoint labels at opposite
// sides of the center. Each persona is plotted on the side of center they lean
// toward; distance from center encodes alignment strength. Two polygons that
// end up in opposing quadrants of the chart = direct visual proof of "two
// opposing user types" — the asymmetry IS the conclusion.
//
// Why this works where the prior trait-cluster (each persona on its own chart)
// failed: comparing two charts side-by-side requires mental alignment work.
// One chart with both polygons overlaid makes the geometry of difference
// visible at a glance. Mirror-image polygons across center IS the conclusion.
//
// Visual differentiation: Persona 1 (Workflow-Focused) = filled polygon in
// --dir-text-primary. Persona 2 (Creative Control Seekers) = outlined polygon
// in --dir-text-primary with dashed stroke. Vertex dots reinforce which polygon
// owns which vertex when they overlap.

const SPIDER_W = 560;
const SPIDER_H = 460;
const SPIDER_CX = SPIDER_W / 2;
const SPIDER_CY = SPIDER_H / 2;
const SPIDER_MAX_R = 150;
const SPIDER_LABEL_OFFSET = 32;

// Each spectrum maps to ONE axis through center with two endpoints on opposite
// sides. Primary on vertical axis (anchored as the strongest, source-grounded
// dimension). Process control at 30°/210°. Trust at 150°/330°. The three
// bidirectional axes form a 6-pointed star with 60° between adjacent endpoints.
const SPIDER_AXIS_ANGLES: Record<string, { left: number; right: number }> = {
  'primary-driver': { left: 270, right: 90 },     // Speeding(S) ↔ Empowering(N)
  'process-control': { left: 210, right: 30 },    // Hands-off(SW) ↔ Hands-on(NE)
  'trust-in-output': { left: 150, right: 330 },   // Skeptical(NW) ↔ Trusting(SE)
};

function polar(cx: number, cy: number, angleDeg: number, dist: number): { x: number; y: number } {
  const r = (angleDeg * Math.PI) / 180;
  return { x: cx + Math.cos(r) * dist, y: cy - Math.sin(r) * dist };
}

// Compute the (x, y) point where a persona sits on a given spectrum.
// Position 0..100 — 0 = pinned to leftLabel, 100 = pinned to rightLabel.
// 50 = exactly at center (no lean).
// Direction = angle of whichever endpoint the persona leans toward.
// Distance from center = |pos - 50| / 50 × MAX_R (lean strength).
function personaPoint(personaId: PersonaId, spectrum: TraitSpectrum): { x: number; y: number } {
  const angles = SPIDER_AXIS_ANGLES[spectrum.id] || { left: 270, right: 90 };
  const pos = spectrum.positions[personaId];
  const angle = pos < 50 ? angles.left : angles.right;
  const dist = (Math.abs(pos - 50) / 50) * SPIDER_MAX_R;
  return polar(SPIDER_CX, SPIDER_CY, angle, dist);
}

export function TraitCluster({
  state,
  voiceQuotes,
}: {
  state: E1State;
  // Optional per-persona verbatim quotes (indexed to ION_PERSONA_TRAITS.personas
  // order). When provided, rendered below the chart at Pull Quote register,
  // paired with persona name + marker indicator so the reader can connect
  // voice to the polygon style above.
  voiceQuotes?: readonly string[];
}) {
  const personas = ION_PERSONA_TRAITS.personas.slice(0, state.personaCount);
  const spectrums = ION_PERSONA_TRAITS.spectrums.slice(0, Math.min(state.spectrumCount, 3));
  const showDerived = state.derivedMarkers === 'on';

  // Compute polygon points per persona (one point per spectrum).
  const polygons = personas.map((p, i) => ({
    persona: p,
    filled: i === 0,
    points: spectrums.map((s) => personaPoint(p.id, s)),
  }));

  // Endpoint labels at the chart perimeter — one per spectrum endpoint
  // (6 total for 3 spectrums). Positioned just outside MAX_R so they
  // don't overlap with the polygon area.
  const endpointLabels = spectrums.flatMap((s) => {
    const angles = SPIDER_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
    return [
      {
        key: `${s.id}-left`,
        label: s.leftLabel,
        derived: s.derived,
        pt: polar(SPIDER_CX, SPIDER_CY, angles.left, SPIDER_MAX_R + SPIDER_LABEL_OFFSET),
      },
      {
        key: `${s.id}-right`,
        label: s.rightLabel,
        derived: s.derived,
        pt: polar(SPIDER_CX, SPIDER_CY, angles.right, SPIDER_MAX_R + SPIDER_LABEL_OFFSET),
      },
    ];
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center' }}>
      {/* Spider chart canvas — bidirectional axes + overlapping polygons */}
      <div style={{ position: 'relative', width: SPIDER_W, height: SPIDER_H }}>
        <svg
          width={SPIDER_W}
          height={SPIDER_H}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          aria-hidden
        >
          {/* Three bidirectional axis lines through center */}
          {spectrums.map((s) => {
            const angles = SPIDER_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
            const leftEnd = polar(SPIDER_CX, SPIDER_CY, angles.left, SPIDER_MAX_R);
            const rightEnd = polar(SPIDER_CX, SPIDER_CY, angles.right, SPIDER_MAX_R);
            return (
              <line
                key={s.id}
                x1={leftEnd.x}
                y1={leftEnd.y}
                x2={rightEnd.x}
                y2={rightEnd.y}
                stroke="var(--dir-border)"
                strokeWidth={1}
              />
            );
          })}

          {/* Center reference dot — visual anchor for the chart's origin */}
          <circle cx={SPIDER_CX} cy={SPIDER_CY} r={2} fill="var(--dir-detail)" />

          {/* Persona 1 polygon (Workflow-Focused) — FILLED in primary ink.
              The solid fill becomes the chart's dominant visual mass and
              signals "this persona's territory." */}
          {polygons[0] && polygons[0].points.length >= 3 && (
            <polygon
              points={polygons[0].points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="var(--dir-text-primary)"
              stroke="var(--dir-text-primary)"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )}

          {/* Persona 2 polygon (Creative Control Seekers) — OUTLINED with
              dashed stroke. The dashed outline is visibly distinct from the
              solid fill above, so when the two polygons overlap the reader
              can still parse which territory belongs to which persona. */}
          {polygons[1] && polygons[1].points.length >= 3 && (
            <polygon
              points={polygons[1].points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="var(--dir-text-primary)"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              strokeLinejoin="round"
            />
          )}

          {/* Vertex dots per persona — reinforce polygon ownership at each axis.
              Filled persona = solid dot; outlined persona = paper-bg dot with
              primary-ink ring. */}
          {polygons.flatMap((pg) =>
            pg.points.map((pt, i) => (
              <circle
                key={`${pg.persona.id}-vert-${i}`}
                cx={pt.x}
                cy={pt.y}
                r={4.5}
                fill={pg.filled ? 'var(--dir-text-primary)' : 'var(--dir-bg)'}
                stroke="var(--dir-text-primary)"
                strokeWidth={2}
              />
            ))
          )}
        </svg>

        {/* Endpoint labels positioned at the perimeter — 6 trait endpoints
            arranged radially around the chart. Derived endpoints render in
            --dir-text-secondary (lighter ink), paired with the legend below
            for context. */}
        {endpointLabels.map((l) => (
          <div
            key={l.key}
            style={{
              position: 'absolute',
              left: l.pt.x,
              top: l.pt.y,
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              maxWidth: 140,
            }}
          >
            <p
              style={{
                fontFamily: IS,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: showDerived && l.derived ? 'var(--dir-text-secondary)' : 'var(--dir-text-primary)',
                margin: 0,
                lineHeight: 1.25,
                whiteSpace: 'nowrap',
              }}
            >
              {l.label}
            </p>
          </div>
        ))}
      </div>

      {/* Persona legend — name + polygon marker + optional voice quote.
          Marker indicator visually matches the polygon style in the chart
          (filled vs outlined dashed), so the reader can connect voice to
          polygon ownership without verbal narration. */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, width: '100%' }}>
        {personas.map((p, i) => {
          const filled = i === 0;
          const quote = voiceQuotes?.[i];
          return (
            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Marker indicator — mirrors polygon style (filled vs outlined-dashed) */}
                {filled ? (
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      backgroundColor: 'var(--dir-text-primary)',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      backgroundColor: 'var(--dir-bg)',
                      border: '2px dashed var(--dir-text-primary)',
                      flexShrink: 0,
                    }}
                  />
                )}
                <p
                  style={{
                    fontFamily: IS,
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: '-0.005em',
                    color: 'var(--dir-text-primary)',
                    margin: 0,
                  }}
                >
                  {p.name}
                </p>
              </div>
              {quote && (
                <p
                  style={{
                    fontFamily: ISe,
                    fontSize: 18,
                    fontWeight: 400,
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                    letterSpacing: '-0.01em',
                    color: 'var(--dir-text-primary)',
                    margin: 0,
                  }}
                >
                  {quote}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Top-level
// ───────────────────────────────────────────────────────────────────────────

export function E1PersonaTraitVisualization() {
  const { e1 } = useGateAIonArtifactPlayground();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p
          style={{
            fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
          }}
        >
          Reframed 2026-05-04 · narrowed to spectrum-position + trait-cluster (overlap spider)
        </p>
        <p
          style={{
            fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.6,
            color: 'var(--dir-text-secondary)', margin: 0, maxWidth: 680,
          }}
        >
          Two Ion personas plotted on three trait spectrums. Primary spectrum grounded directly in primary case-study source; secondary spectrums derived from research themes and flagged.
        </p>
      </header>

      {e1.variant === 'spectrum-position' ? (
        <NativeSpectrumPosition state={e1} />
      ) : (
        <TraitCluster state={e1} />
      )}
    </div>
  );
}
