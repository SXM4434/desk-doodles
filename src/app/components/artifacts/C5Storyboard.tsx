import React from 'react';
import { IS } from '../cards/tokens';
import { ION_STORYBOARD, ION_STORYBOARD_ANNOTATIONS, type C5Panel } from './data/ion-storyboard';
import { useGateAIonArtifactPlayground, type C5State } from '../../state/GateAIonArtifactPlaygroundContext';

// C5 · Storyboard — native (6-panel grid) + 4 variants.
// Native = 6-panel grid (3 cols × 2 rows) per NN/g + UX-portfolio canon. Each
// panel carries a step-number eyebrow, a bordered frame holding an
// editorial-typographic OR iconic-glyph scene marker (NEVER cartoon characters
// per the research doc's AI-smell trap list), and a caption row underneath.
//
// Variants:
//  - 'three-panel-cinematic'  → 3 narrative-pivotal panels, larger frames
//  - 'annotated-frames'       → director's-note marginalia per panel
//  - 'single-row-strip'       → all 6 panels compressed into one horizontal row
//  - 'newspaper-multirow'     → editorial-magazine grid, feature + secondary mix
//
// Register choice per panel: 'editorial' renders strong primary text inside
// the frame (Bauhaus / editorial-info-design lineage); 'glyph' renders a
// single restrained mark (Holmes / Wired-info lineage). Both stay on locked
// typography + W1 only — no illustration, no character art, no AI-smell traps.
//
// SYSTEM ADHERENCE (audited pre-ship):
// - Typography: locked ladder only — IS 10/500/0.12em uppercase (eyebrow,
//   step number, caption labels, meta-text inside frame), IS 11/300 (panel
//   secondary text + scenario caption + glyph label), IS 13/500 (panel title
//   + caption row), IS 22/500 (editorial-typographic primary inside frame).
//   Cinematic raises the editorial primary to IS 28/500 — still on-ladder
//   per the locked typography ladder (10, 11, 13, 16, 18, 22, 28, 36, 48).
// - Spacing: locked tokens only (4, 8, 12, 16, 24, 32, 48). Native uses
//   gap 24 (Block) between panels, padding 16 (Component) inside frames,
//   gap 8 (Micro) eyebrow → frame, gap 12 (Tight) between caption rows.
//   Strip compresses to gap 12; cinematic widens to gap 32; newspaper uses
//   gap 24 row + 24 col.
// - Color: W1 only — text + frame border = --dir-text-primary, secondary
//   text = --dir-text-secondary, eyebrow + step number + meta + glyph label
//   = --dir-detail. No accent tints, no rgba, no drop-shadows, no gradients.
// - AI-smell traps avoided: no character illustrations, no clip-art persona
//   silhouettes, no emoji panel-art, no stock-photo register, no speech
//   bubbles. Annotated variant uses marginalia (Holmes/Wired) — NOT comic
//   dialogue.

// ───────────────────────────────────────────────────────────────────────────
// Atoms
// ───────────────────────────────────────────────────────────────────────────

function StepEyebrow({ step }: { step: string }) {
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
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {step}
    </p>
  );
}

function PanelTitle({ children, size = 13 }: { children: React.ReactNode; size?: 11 | 13 }) {
  return (
    <p
      style={{
        fontFamily: IS,
        fontSize: size,
        fontWeight: 500,
        lineHeight: 1.35,
        letterSpacing: '-0.005em',
        color: 'var(--dir-text-primary)',
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

function PanelCaption({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: IS,
        fontSize: 11,
        fontWeight: 300,
        lineHeight: 1.5,
        color: 'var(--dir-text-secondary)',
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

function MetaCaps({ children }: { children: React.ReactNode }) {
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
      {children}
    </p>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Frame body — register-driven
// ───────────────────────────────────────────────────────────────────────────

type FrameSize = 'compact' | 'standard' | 'cinematic';

const FRAME_MIN_HEIGHT: Record<FrameSize, number> = {
  compact: 96,
  standard: 132,
  cinematic: 200,
};

const PRIMARY_TYPE_SIZE: Record<FrameSize, 18 | 22 | 28> = {
  compact: 18,
  standard: 22,
  cinematic: 28,
};

const GLYPH_SIZE: Record<FrameSize, number> = {
  compact: 24,
  standard: 32,
  cinematic: 48,
};

function FrameBody({ panel, size = 'standard' }: { panel: C5Panel; size?: FrameSize }) {
  const minHeight = FRAME_MIN_HEIGHT[size];
  if (panel.register === 'editorial') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 8,
          height: '100%',
          minHeight,
        }}
      >
        {panel.metaText && <MetaCaps>{panel.metaText}</MetaCaps>}
        {panel.primaryText && (
          <p
            style={{
              fontFamily: IS,
              fontSize: PRIMARY_TYPE_SIZE[size],
              fontWeight: 500,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              color: 'var(--dir-text-primary)',
              margin: 0,
            }}
          >
            {panel.primaryText}
          </p>
        )}
        {panel.secondaryText && (
          <p
            style={{
              fontFamily: IS,
              fontSize: 11,
              fontWeight: 300,
              lineHeight: 1.5,
              color: 'var(--dir-text-secondary)',
              margin: 0,
            }}
          >
            {panel.secondaryText}
          </p>
        )}
      </div>
    );
  }
  // Glyph register
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        height: '100%',
        minHeight,
      }}
    >
      {panel.glyph && (
        <span
          aria-hidden
          style={{
            fontFamily: IS,
            fontSize: GLYPH_SIZE[size],
            fontWeight: 300,
            lineHeight: 1,
            color: 'var(--dir-text-primary)',
          }}
        >
          {panel.glyph}
        </span>
      )}
      {panel.glyphLabel && <MetaCaps>{panel.glyphLabel}</MetaCaps>}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Panel — used by native (six-panel-grid) + size-driven variants
// ───────────────────────────────────────────────────────────────────────────

function Panel({
  panel,
  state,
  size = 'standard',
}: {
  panel: C5Panel;
  state: C5State;
  size?: FrameSize;
}) {
  const padding = size === 'compact' ? 12 : 16;
  const frameStyle: React.CSSProperties = {
    padding: state.frameStyle === 'full-bleed' ? 0 : padding,
    border: state.frameStyle === 'bordered' ? '1px solid var(--dir-text-primary)' : 'none',
    backgroundColor: state.frameStyle === 'full-bleed' ? 'var(--dir-raised)' : 'transparent',
    minHeight: size === 'compact' ? 124 : size === 'cinematic' ? 240 : 164,
    display: 'flex',
    flexDirection: 'column',
  };

  const captionBlock = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <PanelTitle size={size === 'compact' ? 11 : 13}>{panel.title}</PanelTitle>
      {state.annotationDensity !== 'minimal' && size !== 'compact' && (
        <PanelCaption>{panel.caption}</PanelCaption>
      )}
    </div>
  );

  const eyebrowBlock = (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <StepEyebrow step={panel.step} />
    </div>
  );

  if (state.captionPosition === 'side') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {eyebrowBlock}
          <div style={frameStyle}>
            <FrameBody panel={panel} size={size} />
          </div>
        </div>
        <div style={{ paddingTop: 18 }}>{captionBlock}</div>
      </div>
    );
  }

  if (state.captionPosition === 'inset') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {eyebrowBlock}
        <div style={frameStyle}>
          <FrameBody panel={panel} size={size} />
          <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid var(--dir-border)' }}>
            {captionBlock}
          </div>
        </div>
      </div>
    );
  }

  // Default 'under'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: size === 'compact' ? 8 : 12 }}>
      {eyebrowBlock}
      <div style={frameStyle}>
        <FrameBody panel={panel} size={size} />
      </div>
      {captionBlock}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Native: 6-panel grid (3 × 2)
// ───────────────────────────────────────────────────────────────────────────

function NativeSixPanelGrid({ state }: { state: C5State }) {
  const basePanels = ION_STORYBOARD.panels;
  let panels: C5Panel[];
  if (state.panelCount === 8) {
    panels = [
      ...basePanels,
      {
        step: '07',
        title: 'Versioned spec stored',
        caption: 'Audit log records the change',
        register: 'glyph',
        glyph: '↳',
        glyphLabel: 'Versioned doc · stored',
      },
      {
        step: '08',
        title: 'Engineer review',
        caption: 'Spec opens with full context',
        register: 'editorial',
        primaryText: 'Spec ready',
        secondaryText: 'tokens · spacing · component',
        metaText: 'engineer · review',
      },
    ];
  } else {
    panels = basePanels.slice(0, state.panelCount);
  }

  const cols = `repeat(3, minmax(0, 1fr))`;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: cols,
        gap: 24,
        alignItems: 'start',
      }}
    >
      {panels.map((panel) => (
        <Panel key={panel.step} panel={panel} state={state} />
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: three-panel-cinematic
//
// 1 row × 3 cols. Picks the most narrative-pivotal panels:
//   01 Founder messages    (setup — vague brief lands)
//   04 Ruby generates      (conflict resolved into output — variants render)
//   06 Engineer ships      (resolution — versioned spec leaves the system)
// Larger frames, IS 28 primary text, gap 32 between panels.
// ───────────────────────────────────────────────────────────────────────────

function ThreePanelCinematic({ state }: { state: C5State }) {
  const all = ION_STORYBOARD.panels;
  // Narrative-pivotal: 01, 04, 06 (Slack request → variants render → handoff)
  const pivotal = ['01', '04', '06'];
  const panels = all.filter((p) => pivotal.includes(p.step));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 32,
        alignItems: 'start',
      }}
    >
      {panels.map((panel) => (
        <Panel key={panel.step} panel={panel} state={state} size="cinematic" />
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: annotated-frames
//
// Each panel renders with a director's-note marginalia sidebar (Holmes /
// Wired info-design lineage — small caps label + ragged note line). 2 rows
// × 3 cols outer grid, but each cell is a 2-col sub-grid: panel 1fr, notes
// 160px. Captions stay under the frame; sidebar carries extra annotation.
// ───────────────────────────────────────────────────────────────────────────

function AnnotatedNote({ note }: { note: { label: string; note: string } }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <MetaCaps>{note.label}</MetaCaps>
      <p
        style={{
          fontFamily: IS,
          fontSize: 11,
          fontWeight: 300,
          lineHeight: 1.5,
          color: 'var(--dir-text-secondary)',
          margin: 0,
        }}
      >
        {note.note}
      </p>
    </div>
  );
}

function AnnotatedPanel({ panel, state }: { panel: C5Panel; state: C5State }) {
  const padding = 16;
  const frameStyle: React.CSSProperties = {
    padding: state.frameStyle === 'full-bleed' ? 0 : padding,
    border: state.frameStyle === 'bordered' ? '1px solid var(--dir-text-primary)' : 'none',
    backgroundColor: state.frameStyle === 'full-bleed' ? 'var(--dir-raised)' : 'transparent',
    minHeight: 164,
    display: 'flex',
    flexDirection: 'column',
  };

  const notes = ION_STORYBOARD_ANNOTATIONS[panel.step] ?? [];
  // Cap to 3 notes (standard) or 2 (minimal); generous shows all.
  const visibleNotes =
    state.annotationDensity === 'minimal'
      ? notes.slice(0, 1)
      : state.annotationDensity === 'standard'
        ? notes.slice(0, 2)
        : notes;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 156px', gap: 16, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <StepEyebrow step={panel.step} />
        </div>
        <div style={frameStyle}>
          <FrameBody panel={panel} size="standard" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <PanelTitle>{panel.title}</PanelTitle>
          <PanelCaption>{panel.caption}</PanelCaption>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          paddingTop: 24,
          paddingLeft: 16,
          borderLeft: '1px solid var(--dir-border)',
        }}
      >
        {visibleNotes.map((note, i) => (
          <AnnotatedNote key={`${panel.step}-${i}`} note={note} />
        ))}
      </div>
    </div>
  );
}

function AnnotatedFrames({ state }: { state: C5State }) {
  const panels = ION_STORYBOARD.panels;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 32,
        alignItems: 'start',
      }}
    >
      {panels.map((panel) => (
        <AnnotatedPanel key={panel.step} panel={panel} state={state} />
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: single-row-strip
//
// All 6 panels in a single horizontal row. Compressed: gap 12 (Tight),
// minHeight 124, padding 12, type smaller (PanelTitle 11/500). Honors
// frameStyle but ignores captionPosition (always under, compact).
// ───────────────────────────────────────────────────────────────────────────

function SingleRowStrip({ state }: { state: C5State }) {
  const panels = ION_STORYBOARD.panels;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
        gap: 12,
        alignItems: 'start',
      }}
    >
      {panels.map((panel) => (
        <Panel key={panel.step} panel={panel} state={state} size="compact" />
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: newspaper-multirow
//
// Editorial-magazine grid. 12-col CSS grid with 2 feature panels (span 7)
// and 4 secondary panels (span 5 split as 2+3 / 3+2). Result: irregular
// rhythm with feature → 2 secondaries → feature → 2 secondaries.
//
// Layout (12 cols):
//   row 1: panel 01 (feature, span 7) | panel 02 (secondary, span 5)
//   row 2: panel 03 (secondary, span 5) | panel 04 (feature, span 7)
//   row 3: panel 05 (secondary, span 6) | panel 06 (secondary, span 6)
//
// Feature panels render at cinematic size; secondaries at standard.
// Hairline rule between rows for editorial-magazine register.
// ───────────────────────────────────────────────────────────────────────────

type NewspaperSlot = {
  step: string;
  span: 5 | 6 | 7;
  size: FrameSize;
};

const NEWSPAPER_LAYOUT: NewspaperSlot[] = [
  { step: '01', span: 7, size: 'cinematic' },
  { step: '02', span: 5, size: 'standard' },
  { step: '03', span: 5, size: 'standard' },
  { step: '04', span: 7, size: 'cinematic' },
  { step: '05', span: 6, size: 'standard' },
  { step: '06', span: 6, size: 'standard' },
];

function NewspaperMultirow({ state }: { state: C5State }) {
  const byStep = new Map(ION_STORYBOARD.panels.map((p) => [p.step, p]));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
        rowGap: 32,
        columnGap: 24,
        alignItems: 'start',
      }}
    >
      {NEWSPAPER_LAYOUT.map((slot, idx) => {
        const panel = byStep.get(slot.step);
        if (!panel) return null;
        // Add a hairline top border to each row's first cell to evoke
        // editorial-magazine column rules. Indices 2 + 4 begin new rows.
        const startsNewRow = idx === 2 || idx === 4;
        return (
          <div
            key={panel.step}
            style={{
              gridColumn: `span ${slot.span}`,
              paddingTop: startsNewRow ? 32 : 0,
              borderTop: startsNewRow ? '1px solid var(--dir-border)' : 'none',
            }}
          >
            <Panel panel={panel} state={state} size={slot.size} />
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Top-level
// ───────────────────────────────────────────────────────────────────────────

export function C5Storyboard() {
  const { c5 } = useGateAIonArtifactPlayground();

  let body: React.ReactNode;
  switch (c5.variant) {
    case 'six-panel-grid':
      body = <NativeSixPanelGrid state={c5} />;
      break;
    case 'three-panel-cinematic':
      body = <ThreePanelCinematic state={c5} />;
      break;
    case 'annotated-frames':
      body = <AnnotatedFrames state={c5} />;
      break;
    case 'single-row-strip':
      body = <SingleRowStrip state={c5} />;
      break;
    case 'newspaper-multirow':
      body = <NewspaperMultirow state={c5} />;
      break;
    default:
      body = <NativeSixPanelGrid state={c5} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          Synthesized scenario · Ion Ruby's Journey · 6-panel UX storyboard
        </p>
        <p
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 300,
            lineHeight: 1.6,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            maxWidth: 720,
          }}
        >
          {ION_STORYBOARD.scenarioCaption}
        </p>
      </header>

      {body}
    </div>
  );
}
