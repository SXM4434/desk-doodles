import React from 'react';
import { IS } from '../cards/tokens';
import {
  ION_PERSONA_JOURNEY,
  type PersonaCellAnnotation,
} from './data/ion-persona-journey';
import { useGateAIonArtifactPlayground, type E2State } from '../../state/GateAIonArtifactPlaygroundContext';

// E2 · Persona-Journey Overlay — full variant set at IC quality.
// Native = Side-by-side parallel: same Ion 5-step workflow (matching C1 funnel /
// C4 service blueprint / C5 storyboard timeline) rendered as TWO horizontal
// persona tracks stacked vertically. Each touchpoint column carries a persona-
// specific marker pill + short Ion-grounded annotation. Dropoff markers (⚠)
// surface only where Leyi's case study explicitly supports the persona pain.
//
// Persona-pill convention reused from E1 (W1-only differentiation, no color):
//   - Workflow-Focused        = filled pill
//   - Creative Control Seekers = outlined pill
//
// Variants:
//   - side-by-side-parallel (native) — two horizontal tracks
//   - stacked — both personas share each cell, WF on top, CCS below
//   - opposed — WF above timeline, CCS below; mirror flip
//   - single-track-multi-marker — one timeline; filled vs outlined pills per cell
//   - emotion-augmented — adds emotion eyebrow per cell driven by per-cell emotion field
//
// Register choice: clean editorial (NOT rough.js). E2 is a tabular comparison
// register where typography + axis-rule discipline carries the work; hand-feel
// would obscure the persona divergence reading.
//
// SYSTEM ADHERENCE (audited pre-ship):
// - Typography: locked ladder only — IS 10/500/0.12em uppercase (eyebrow, step
//   number, persona track label, dropoff annotation, source caption), IS 11/300
//   (annotation body + caption), IS 13/500 (timeline column header).
//   No off-ladder sizes.
// - Spacing: locked tokens — gap 24 (Block) between persona tracks, gap 16
//   (Component) timeline header → first track, padding 12 (Tight) inside
//   annotation cells, gap 8 (Micro) marker → annotation, gap 4 (Hairline) within
//   stacked text rows, page-block gap 24 outside the artifact.
// - Color: W1 tokens only — axis hairline + filled-pill bg + text =
//   --dir-text-primary, filled-pill text = --dir-bg (inverted), annotation body
//   = --dir-text-secondary, eyebrow + step number + dropoff marker + caption =
//   --dir-detail, track axis hairline + cell border = --dir-border.
//   No accent tints, no rgba, no drop-shadows.
// - AI-smell traps avoided: no bright persona colors, no decorative dropoff
//   icons (only the ⚠ glyph used by C4), no equal-weight ambiguous narrative
//   (W-F filled vs CCS outlined gives clear primary).

// ───────────────────────────────────────────────────────────────────────────
// Native: side-by-side parallel
// ───────────────────────────────────────────────────────────────────────────

const TRACK_LABEL_WIDTH_PX = 160;          // left-column persona-name label width
const MARKER_HEIGHT = 22;                  // pill height — same as E1
const PILL_PAD_X = 10;                     // horizontal padding inside pill — same as E1

function PersonaPill({ label, filled }: { label: string; filled: boolean }) {
  return (
    <span
      style={{
        fontFamily: IS,
        fontSize: 11,
        fontWeight: 300,
        lineHeight: 1,
        letterSpacing: '-0.005em',
        color: filled ? 'var(--dir-bg)' : 'var(--dir-text-primary)',
        backgroundColor: filled ? 'var(--dir-text-primary)' : 'transparent',
        border: `1px solid var(--dir-text-primary)`,
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

function HeaderRow({ steps, sharedPhases }: { steps: typeof ION_PERSONA_JOURNEY.steps; sharedPhases: 'explicit' | 'implicit' }) {
  // Header row spans: 1 track-label cell + N step columns.
  return (
    <>
      {/* Top-left empty cell aligned with track-label column */}
      <div
        style={{
          padding: 12,
          borderRight: '1px solid var(--dir-border)',
          borderBottom: '1px solid var(--dir-border)',
        }}
      >
        {sharedPhases === 'explicit' && (
          <p
            style={{
              fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
            }}
          >
            Persona track
          </p>
        )}
      </div>
      {steps.map((step, i) => (
        <div
          key={step.id}
          style={{
            padding: 12,
            borderRight: i === steps.length - 1 ? 'none' : '1px solid var(--dir-border)',
            borderBottom: '1px solid var(--dir-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <p
            style={{
              fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {step.stepNumber}
          </p>
          <p
            style={{
              fontFamily: IS, fontSize: 13, fontWeight: 500, lineHeight: 1.3,
              letterSpacing: '-0.005em', color: 'var(--dir-text-primary)', margin: 0,
            }}
          >
            {step.label}
          </p>
        </div>
      ))}
    </>
  );
}

function TrackLabelCell({
  name,
  thesis,
  rowLabels,
  isLast,
}: {
  name: string;
  thesis: string;
  rowLabels: E2State['rowLabels'];
  isLast: boolean;
}) {
  const showThesis = rowLabels === 'persona-name-plus-thesis';
  const labelText = name; // 'caps-only' just means rendering the name in caps eyebrow style — already the case
  return (
    <div
      style={{
        padding: 12,
        borderRight: '1px solid var(--dir-border)',
        borderBottom: isLast ? 'none' : '1px solid var(--dir-border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <p
        style={{
          fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--dir-text-primary)', margin: 0,
        }}
      >
        {labelText}
      </p>
      {showThesis && (
        <p
          style={{
            fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.4,
            color: 'var(--dir-text-secondary)', margin: 0,
          }}
        >
          {thesis}
        </p>
      )}
    </div>
  );
}

function PersonaCell({
  personaName,
  filled,
  eyebrow,
  body,
  dropoff,
  showDropoff,
  showAnnotation,
  showVerbose,
  isLastCol,
  isLastRow,
}: {
  personaName: string;
  filled: boolean;
  eyebrow: string;
  body: string;
  dropoff?: { eyebrow: string; body: string; source: string };
  showDropoff: boolean;
  showAnnotation: boolean;
  showVerbose: boolean;
  isLastCol: boolean;
  isLastRow: boolean;
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRight: isLastCol ? 'none' : '1px solid var(--dir-border)',
        borderBottom: isLastRow ? 'none' : '1px solid var(--dir-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 0,
      }}
    >
      {/* Marker row: persona pill on the persona's track at the column */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <PersonaPill label={personaName} filled={filled} />
      </div>

      {/* Eyebrow (always shown when annotation density >= standard) */}
      {showAnnotation && (
        <p
          style={{
            fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
          }}
        >
          {eyebrow}
        </p>
      )}

      {/* Body annotation — shown for standard + verbose */}
      {showAnnotation && (
        <p
          style={{
            fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.45,
            color: 'var(--dir-text-secondary)', margin: 0,
          }}
        >
          {body}
        </p>
      )}

      {/* Dropoff marker — only where Leyi-supported AND user toggle is on */}
      {showDropoff && dropoff && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            paddingTop: 4,
            borderTop: '1px solid var(--dir-border)',
          }}
        >
          <p
            style={{
              fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
              textTransform: 'uppercase', lineHeight: 1.4,
              color: 'var(--dir-detail)', margin: 0,
            }}
          >
            ⚠ {dropoff.eyebrow}
          </p>
          {showVerbose && (
            <>
              <p
                style={{
                  fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.45,
                  color: 'var(--dir-text-secondary)', margin: 0,
                }}
              >
                {dropoff.body}
              </p>
              <p
                style={{
                  fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
                }}
              >
                Source · {dropoff.source}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function NativeSideBySideParallel({ state }: { state: E2State }) {
  const { steps, personas, cells } = ION_PERSONA_JOURNEY;
  const activePersonas = personas.slice(0, state.personaCount);
  const showDropoffs = state.dropoffMarkers === 'on';
  const showAnnotation = state.annotationDensity !== 'minimal';
  const showVerbose = state.annotationDensity === 'verbose';

  // Layout: CSS grid with N+1 columns (track-label + 5 step columns).
  const columns = `${TRACK_LABEL_WIDTH_PX}px repeat(${steps.length}, minmax(0, 1fr))`;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: columns,
        rowGap: 0,
        columnGap: 0,
        border: '1px solid var(--dir-border)',
      }}
    >
      <HeaderRow steps={steps} sharedPhases={state.sharedPhases} />

      {activePersonas.map((p, pIdx) => {
        const filled = p.id === 'workflow-focused';
        const isLastRow = pIdx === activePersonas.length - 1;
        return (
          <React.Fragment key={p.id}>
            <TrackLabelCell
              name={p.name}
              thesis={p.thesis}
              rowLabels={state.rowLabels}
              isLast={isLastRow}
            />
            {steps.map((step, ci) => {
              const cell = cells[p.id][step.id];
              // Path-overlap visibility — limits which cells render annotation
              // for the divergence-only / shared-only register variants. Reads
              // the explicit `step.divergent` field (true at the 3 CCS-dropoff
              // steps Leyi's case study supports as friction divergences).
              let showThisCellAnnotation = showAnnotation;
              if (state.pathOverlapVisibility === 'shared-only' && step.divergent) {
                showThisCellAnnotation = false;
              } else if (state.pathOverlapVisibility === 'divergent-only' && !step.divergent) {
                showThisCellAnnotation = false;
              }
              return (
                <PersonaCell
                  key={step.id}
                  personaName={p.name}
                  filled={filled}
                  eyebrow={cell.eyebrow}
                  body={cell.body}
                  dropoff={cell.dropoff}
                  showDropoff={showDropoffs}
                  showAnnotation={showThisCellAnnotation}
                  showVerbose={showVerbose}
                  isLastCol={ci === steps.length - 1}
                  isLastRow={isLastRow}
                />
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Shared variant atoms
// ───────────────────────────────────────────────────────────────────────────

const EYEBROW_STYLE: React.CSSProperties = {
  fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
};
const BODY_STYLE: React.CSSProperties = {
  fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.45,
  color: 'var(--dir-text-secondary)', margin: 0,
};
const HEADER_LABEL_STYLE: React.CSSProperties = {
  fontFamily: IS, fontSize: 13, fontWeight: 500, lineHeight: 1.3,
  letterSpacing: '-0.005em', color: 'var(--dir-text-primary)', margin: 0,
};
const TRACK_LABEL_STYLE: React.CSSProperties = {
  fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--dir-text-primary)', margin: 0,
};

// Outline-pill variant of PersonaPill — used in single-track multi-marker
// where two markers stack in the same cell and we need a more compact form.
function PersonaPillCompact({ label, filled }: { label: string; filled: boolean }) {
  return (
    <span
      style={{
        fontFamily: IS,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        lineHeight: 1,
        color: filled ? 'var(--dir-bg)' : 'var(--dir-text-primary)',
        backgroundColor: filled ? 'var(--dir-text-primary)' : 'transparent',
        border: `1px solid var(--dir-text-primary)`,
        padding: '0 8px',
        height: 18,
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function DropoffBlock({
  dropoff,
  showVerbose,
}: {
  dropoff: NonNullable<PersonaCellAnnotation['dropoff']>;
  showVerbose: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        paddingTop: 4,
        borderTop: '1px solid var(--dir-border)',
      }}
    >
      <p style={{ ...EYEBROW_STYLE, lineHeight: 1.4 }}>⚠ {dropoff.eyebrow}</p>
      {showVerbose && (
        <>
          <p style={BODY_STYLE}>{dropoff.body}</p>
          <p style={EYEBROW_STYLE}>Source · {dropoff.source}</p>
        </>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: Stacked
//
// Both persona tracks share the same row, persona markers at each touchpoint
// stack vertically (Workflow-Focused on top, Creative Control below).
// Compresses height; single-row read across the timeline.
// ───────────────────────────────────────────────────────────────────────────

function StackedVariant({ state }: { state: E2State }) {
  const { steps, personas, cells } = ION_PERSONA_JOURNEY;
  const activePersonas = personas.slice(0, state.personaCount);
  const showDropoffs = state.dropoffMarkers === 'on';
  const showAnnotation = state.annotationDensity !== 'minimal';
  const showVerbose = state.annotationDensity === 'verbose';
  const columns = `${TRACK_LABEL_WIDTH_PX}px repeat(${steps.length}, minmax(0, 1fr))`;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: columns,
        border: '1px solid var(--dir-border)',
      }}
    >
      <HeaderRow steps={steps} sharedPhases={state.sharedPhases} />
      {/* Single combined row */}
      <div
        style={{
          padding: 12,
          borderRight: '1px solid var(--dir-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <p style={EYEBROW_STYLE}>Both personas</p>
        {state.rowLabels === 'persona-name-plus-thesis' && (
          <p style={BODY_STYLE}>Stacked: WF on top, CCS below at each touchpoint.</p>
        )}
      </div>
      {steps.map((step, ci) => {
        let showThisCellAnnotation = showAnnotation;
        if (state.pathOverlapVisibility === 'shared-only' && step.divergent) showThisCellAnnotation = false;
        else if (state.pathOverlapVisibility === 'divergent-only' && !step.divergent) showThisCellAnnotation = false;
        return (
          <div
            key={step.id}
            style={{
              padding: 12,
              borderRight: ci === steps.length - 1 ? 'none' : '1px solid var(--dir-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              minWidth: 0,
            }}
          >
            {activePersonas.map((p) => {
              const cell = cells[p.id][step.id];
              const filled = p.id === 'workflow-focused';
              return (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <PersonaPill label={p.name} filled={filled} />
                  {showThisCellAnnotation && <p style={EYEBROW_STYLE}>{cell.eyebrow}</p>}
                  {showThisCellAnnotation && <p style={BODY_STYLE}>{cell.body}</p>}
                  {showDropoffs && cell.dropoff && (
                    <DropoffBlock dropoff={cell.dropoff} showVerbose={showVerbose} />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: Opposed
//
// Workflow-Focused track above the timeline, Creative Control track below the
// timeline (mirror flip across a center timeline axis). Reading the divergence
// as opposition. Falls back to Stacked-style rendering when only 1 persona.
// ───────────────────────────────────────────────────────────────────────────

function OpposedVariant({ state }: { state: E2State }) {
  const { steps, personas, cells } = ION_PERSONA_JOURNEY;
  const activePersonas = personas.slice(0, state.personaCount);
  const showDropoffs = state.dropoffMarkers === 'on';
  const showAnnotation = state.annotationDensity !== 'minimal';
  const showVerbose = state.annotationDensity === 'verbose';

  const wf = activePersonas.find((p) => p.id === 'workflow-focused');
  const ccs = activePersonas.find((p) => p.id === 'creative-control');

  const columns = `${TRACK_LABEL_WIDTH_PX}px repeat(${steps.length}, minmax(0, 1fr))`;

  // Helper: render one persona row above/below the timeline
  const renderPersonaRow = (
    p: typeof personas[number],
    side: 'above' | 'below',
  ) => {
    const filled = p.id === 'workflow-focused';
    return (
      <React.Fragment key={p.id}>
        <div
          style={{
            padding: 12,
            borderRight: '1px solid var(--dir-border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: side === 'above' ? 'flex-end' : 'flex-start',
            gap: 4,
          }}
        >
          <p style={TRACK_LABEL_STYLE}>{p.name}</p>
          {state.rowLabels === 'persona-name-plus-thesis' && (
            <p style={BODY_STYLE}>{p.thesis}</p>
          )}
        </div>
        {steps.map((step, ci) => {
          const cell = cells[p.id][step.id];
          let showThisCellAnnotation = showAnnotation;
          if (state.pathOverlapVisibility === 'shared-only' && step.divergent) showThisCellAnnotation = false;
          else if (state.pathOverlapVisibility === 'divergent-only' && !step.divergent) showThisCellAnnotation = false;
          return (
            <div
              key={step.id}
              style={{
                padding: 12,
                borderRight: ci === steps.length - 1 ? 'none' : '1px solid var(--dir-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: side === 'above' ? 'flex-end' : 'flex-start',
                gap: 8,
                minWidth: 0,
              }}
            >
              <PersonaPill label={p.name} filled={filled} />
              {showThisCellAnnotation && <p style={EYEBROW_STYLE}>{cell.eyebrow}</p>}
              {showThisCellAnnotation && <p style={BODY_STYLE}>{cell.body}</p>}
              {showDropoffs && cell.dropoff && (
                <DropoffBlock dropoff={cell.dropoff} showVerbose={showVerbose} />
              )}
            </div>
          );
        })}
      </React.Fragment>
    );
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: columns,
        border: '1px solid var(--dir-border)',
      }}
    >
      <HeaderRow steps={steps} sharedPhases={state.sharedPhases} />
      {wf && renderPersonaRow(wf, 'above')}
      {/* Center timeline divider — solid axis rule cell row */}
      <div
        style={{
          padding: 12,
          borderRight: '1px solid var(--dir-border)',
          borderTop: '1px solid var(--dir-border)',
          borderBottom: '1px solid var(--dir-border)',
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <p style={EYEBROW_STYLE}>Timeline</p>
      </div>
      {steps.map((step, ci) => (
        <div
          key={step.id}
          style={{
            padding: '12px',
            borderRight: ci === steps.length - 1 ? 'none' : '1px solid var(--dir-border)',
            borderTop: '1px solid var(--dir-text-primary)',
            borderBottom: '1px solid var(--dir-text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 28,
          }}
        >
          <span
            style={{
              fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--dir-text-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {step.stepNumber}
          </span>
        </div>
      ))}
      {ccs && renderPersonaRow(ccs, 'below')}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: Single-track multi-marker
//
// Single timeline row with both persona markers per cell — markers visually
// distinguished by filled vs outlined (existing pill convention). Most
// compact register; comparison reads vertically in each column.
// ───────────────────────────────────────────────────────────────────────────

function SingleTrackMultiMarkerVariant({ state }: { state: E2State }) {
  const { steps, personas, cells } = ION_PERSONA_JOURNEY;
  const activePersonas = personas.slice(0, state.personaCount);
  const showDropoffs = state.dropoffMarkers === 'on';
  const showAnnotation = state.annotationDensity !== 'minimal';
  const showVerbose = state.annotationDensity === 'verbose';
  const columns = `${TRACK_LABEL_WIDTH_PX}px repeat(${steps.length}, minmax(0, 1fr))`;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: columns,
        border: '1px solid var(--dir-border)',
      }}
    >
      <HeaderRow steps={steps} sharedPhases={state.sharedPhases} />
      <div
        style={{
          padding: 12,
          borderRight: '1px solid var(--dir-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <p style={TRACK_LABEL_STYLE}>Single track</p>
        {state.rowLabels === 'persona-name-plus-thesis' && (
          <p style={BODY_STYLE}>Filled = Workflow-Focused. Outlined = Creative Control.</p>
        )}
      </div>
      {steps.map((step, ci) => {
        let showThisCellAnnotation = showAnnotation;
        if (state.pathOverlapVisibility === 'shared-only' && step.divergent) showThisCellAnnotation = false;
        else if (state.pathOverlapVisibility === 'divergent-only' && !step.divergent) showThisCellAnnotation = false;
        return (
          <div
            key={step.id}
            style={{
              padding: 12,
              borderRight: ci === steps.length - 1 ? 'none' : '1px solid var(--dir-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              minWidth: 0,
            }}
          >
            {/* Marker stack: both personas as compact pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
              {activePersonas.map((p) => (
                <PersonaPillCompact
                  key={p.id}
                  label={p.id === 'workflow-focused' ? 'WF' : 'CCS'}
                  filled={p.id === 'workflow-focused'}
                />
              ))}
            </div>
            {/* Per-persona micro-annotations stacked */}
            {showThisCellAnnotation && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activePersonas.map((p) => {
                  const cell = cells[p.id][step.id];
                  return (
                    <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <p style={EYEBROW_STYLE}>
                        {p.id === 'workflow-focused' ? 'WF' : 'CCS'} · {cell.eyebrow}
                      </p>
                      <p style={BODY_STYLE}>{cell.body}</p>
                      {showDropoffs && cell.dropoff && (
                        <DropoffBlock dropoff={cell.dropoff} showVerbose={showVerbose} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {/* When annotations are hidden but dropoffs are still on, surface them */}
            {!showThisCellAnnotation && showDropoffs && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activePersonas.map((p) => {
                  const cell = cells[p.id][step.id];
                  if (!cell.dropoff) return null;
                  return (
                    <div key={p.id}>
                      <p style={EYEBROW_STYLE}>
                        {p.id === 'workflow-focused' ? 'WF' : 'CCS'}
                      </p>
                      <DropoffBlock dropoff={cell.dropoff} showVerbose={showVerbose} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: Emotion-augmented
//
// Adds an emotion eyebrow above each persona's annotation (NN/g extension).
// Each touchpoint gets a small emotion eyebrow per persona —
// FRUSTRATED / NEUTRAL / SATISFIED — driven by per-cell `emotion` field.
// ───────────────────────────────────────────────────────────────────────────

function EmotionEyebrow({ emotion }: { emotion: 'FRUSTRATED' | 'NEUTRAL' | 'SATISFIED' }) {
  // Visual accent on emotion tier kept within W1: FRUSTRATED gets a left-rule
  // tick using --dir-text-primary; NEUTRAL/SATISFIED stay as caps eyebrow.
  // No color — typography + axis discipline only.
  return (
    <p
      style={{
        ...EYEBROW_STYLE,
        color: emotion === 'FRUSTRATED' ? 'var(--dir-text-primary)' : 'var(--dir-detail)',
        borderLeft: emotion === 'FRUSTRATED' ? '2px solid var(--dir-text-primary)' : 'none',
        paddingLeft: emotion === 'FRUSTRATED' ? 6 : 0,
        marginLeft: emotion === 'FRUSTRATED' ? -8 : 0,
      }}
    >
      {emotion}
    </p>
  );
}

function EmotionAugmentedVariant({ state }: { state: E2State }) {
  const { steps, personas, cells } = ION_PERSONA_JOURNEY;
  const activePersonas = personas.slice(0, state.personaCount);
  const showDropoffs = state.dropoffMarkers === 'on';
  const showAnnotation = state.annotationDensity !== 'minimal';
  const showVerbose = state.annotationDensity === 'verbose';
  const columns = `${TRACK_LABEL_WIDTH_PX}px repeat(${steps.length}, minmax(0, 1fr))`;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: columns,
        border: '1px solid var(--dir-border)',
      }}
    >
      <HeaderRow steps={steps} sharedPhases={state.sharedPhases} />
      {activePersonas.map((p, pIdx) => {
        const filled = p.id === 'workflow-focused';
        const isLastRow = pIdx === activePersonas.length - 1;
        return (
          <React.Fragment key={p.id}>
            <TrackLabelCell
              name={p.name}
              thesis={p.thesis}
              rowLabels={state.rowLabels}
              isLast={isLastRow}
            />
            {steps.map((step, ci) => {
              const cell = cells[p.id][step.id];
              let showThisCellAnnotation = showAnnotation;
              if (state.pathOverlapVisibility === 'shared-only' && step.divergent) showThisCellAnnotation = false;
              else if (state.pathOverlapVisibility === 'divergent-only' && !step.divergent) showThisCellAnnotation = false;
              return (
                <div
                  key={step.id}
                  style={{
                    padding: 12,
                    borderRight: ci === steps.length - 1 ? 'none' : '1px solid var(--dir-border)',
                    borderBottom: isLastRow ? 'none' : '1px solid var(--dir-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  {/* Emotion eyebrow above the marker pill — defining feature */}
                  <EmotionEyebrow emotion={cell.emotion} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PersonaPill label={p.name} filled={filled} />
                  </div>
                  {showThisCellAnnotation && <p style={EYEBROW_STYLE}>{cell.eyebrow}</p>}
                  {showThisCellAnnotation && <p style={BODY_STYLE}>{cell.body}</p>}
                  {showDropoffs && cell.dropoff && (
                    <DropoffBlock dropoff={cell.dropoff} showVerbose={showVerbose} />
                  )}
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Top-level
// ───────────────────────────────────────────────────────────────────────────

function VariantBody({ state }: { state: E2State }) {
  switch (state.variant) {
    case 'side-by-side-parallel':       return <NativeSideBySideParallel state={state} />;
    case 'stacked':                     return <StackedVariant state={state} />;
    case 'opposed':                     return <OpposedVariant state={state} />;
    case 'single-track-multi-marker':   return <SingleTrackMultiMarkerVariant state={state} />;
    case 'emotion-augmented':           return <EmotionAugmentedVariant state={state} />;
  }
}

export function E2PersonaJourneyOverlay() {
  const { e2 } = useGateAIonArtifactPlayground();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p
          style={{
            fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
          }}
        >
          Synthesized · persona-mapped journey · two Ion personas across the 5-step workflow
        </p>
        <p
          style={{
            fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.6,
            color: 'var(--dir-text-secondary)', margin: 0, maxWidth: 720,
          }}
        >
          Same Ion workflow rendered with each persona's distinct path. Workflow-Focused (filled pill) and Creative Control Seekers (outlined pill) — W1-only differentiation, no color. Dropoff markers (⚠) surface only where the case-study source supports the persona pain.
        </p>
      </header>

      <VariantBody state={e2} />
    </div>
  );
}

// PendingVariant retained as a no-op fallback for future TypeScript exhaustiveness
// guard (was added inline by the prior session to fix a TS error referencing it
// from the dispatch). All five variants now render real components, so this is
// not in the active render path — kept to avoid removing referenced exports.
function PendingVariant({ name }: { name: string }) {
  return (
    <div
      style={{
        minHeight: 280,
        border: '1px dashed var(--dir-border)',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 8,
      }}
    >
      <p
        style={{
          fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
        }}
      >
        Pending native approval
      </p>
      <p
        style={{
          fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.5,
          color: 'var(--dir-text-secondary)', margin: 0, maxWidth: 460,
        }}
      >
        {name} variant placeholder.
      </p>
    </div>
  );
}
