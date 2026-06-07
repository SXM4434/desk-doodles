import React from 'react';
import { IS } from '../cards/tokens';
import { ION_FUNNEL_COCREATE, type FunnelStage, type FunnelAnnotation } from './data/ion-funnel';
import { useGateAIonArtifactPlayground, type C1State } from '../../state/GateAIonArtifactPlaygroundContext';

// C1 · Funnel Diagram — native only at IC quality.
// Native = Ion CoCreate "What if Ion starts here?" register: 5-step horizontal flow,
// sticker callout above step 01, framed stage cards.
//
// Other variants (vertical, stage-cards, annotated) render "pending native approval"
// stubs per feedback_native_first_then_variants.
//
// SYSTEM ADHERENCE (audited pre-ship):
// - Typography: locked ladder only — IS 18/600 (stage index, Sub-heading), IS 11/300
//   (stage label + sticker text, Caption/Note), IS 10/500/0.12em uppercase (eyebrow).
//   No off-ladder sizes. ISe not used.
// - Spacing: locked tokens — gap 24 (Block) between cards, padding 16 (Component) inside,
//   internal stack gap 12 (Tight), sticker padding 8/12 (Micro/Tight), arrow span 24
//   (space-5), eyebrow margin 24, marker 8/8 (Micro).
// - Color: W1 tokens only — --dir-raised (card + sticker bg), --dir-border (card frame),
//   --dir-text-primary (sticker border + index + arrow), --dir-detail (eyebrow + arrow
//   markers), --dir-text-secondary (subtitle/quiet captions). No accent tints.

function StageCard({
  stage,
  style,
  showPct,
}: {
  stage: FunnelStage;
  style: C1State['stageCardStyle'];
  showPct: boolean;
}) {
  const framed = style === 'framed';
  const minimal = style === 'minimal';
  return (
    <div
      style={{
        padding: 16,
        border: framed ? '1px solid var(--dir-border)' : minimal ? 'none' : '1px solid var(--dir-border)',
        backgroundColor: framed ? 'var(--dir-raised)' : 'transparent',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 8,
        }}
      >
        <p
          style={{
            fontFamily: IS,
            fontSize: 18,
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--dir-text-primary)',
            margin: 0,
          }}
        >
          {stage.id}
        </p>
        {showPct && (
          <p
            style={{
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.06em',
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--dir-detail)',
              margin: 0,
            }}
          >
            {stage.synthesizedRetentionPct}%
          </p>
        )}
      </div>
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
  );
}

type StickerTone = 'primary' | 'detail';

function Sticker({ text, tone = 'primary' }: { text: string; tone?: StickerTone }) {
  const inkVar = tone === 'detail' ? 'var(--dir-detail)' : 'var(--dir-text-primary)';
  return (
    <span
      style={{
        fontFamily: IS,
        fontSize: 11,
        fontWeight: 300,
        lineHeight: 1.4,
        color: inkVar,
        padding: '8px 12px',
        border: `1px solid ${inkVar}`,
        backgroundColor: 'var(--dir-raised)',
        borderRadius: 4,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}

function DownArrow({ tone = 'primary' }: { tone?: StickerTone }) {
  // 16×24 SVG: 16 (Component, but used as width — keeps the arrow visually proportionate
  // to the stage card width); 24 (space-5) total height, with line span 16 (Component) +
  // arrowhead 8 (Micro).
  const inkVar = tone === 'detail' ? 'var(--dir-detail)' : 'var(--dir-text-primary)';
  return (
    <svg width="16" height="24" viewBox="0 0 16 24" aria-hidden style={{ display: 'block' }}>
      <line x1="8" y1="0" x2="8" y2="16" stroke={inkVar} strokeWidth="1" />
      <path d="M 4 16 L 8 24 L 12 16 Z" fill={inkVar} />
    </svg>
  );
}

function NativeHorizontal({
  state,
  stickerTone = 'primary',
  eyebrow,
}: {
  state: C1State;
  stickerTone?: StickerTone;
  eyebrow?: string | null;
}) {
  const dataset = ION_FUNNEL_COCREATE;
  const stages = dataset.stages.slice(0, state.stageCount);
  const annotation: FunnelAnnotation | undefined =
    state.annotationVariant === 'what-if'
      ? dataset.annotations.find((a) => a.text === 'What if Ion starts here?')
      : dataset.annotations.find((a) => a.text === 'Ion starts here');

  // Determine which stage column the sticker targets. Default to the toggle's
  // annotationStep but clamp to the available stage count.
  const targetIndex = Math.min(stages.findIndex((s) => s.id === state.annotationStep), stages.length - 1);
  const stickerVisible = state.annotationPointer !== 'off' && targetIndex >= 0 && annotation;

  // Grid template: equal columns matching stage count.
  const cols = `repeat(${stages.length}, minmax(0, 1fr))`;

  // Eyebrow: null = render no eyebrow at all (used by §05 2-moment compression where
  // the §05 section header carries the title role); undefined = default playground text.
  const eyebrowText = eyebrow === undefined ? 'The current user workflow' : eyebrow;
  const inkVar = stickerTone === 'detail' ? 'var(--dir-detail)' : 'var(--dir-text-primary)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {eyebrowText !== null && (
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
          {eyebrowText}
        </p>
      )}

      {/* Sticker row — grid-aligned to stage cards so the sticker sits exactly above its target column */}
      {stickerVisible && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: cols,
            gap: 24,
            minHeight: 64,
          }}
        >
          {stages.map((_, i) =>
            i === targetIndex ? (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {state.annotationPointer === 'sticker' ? (
                  <Sticker text={annotation!.text} tone={stickerTone} />
                ) : (
                  <span
                    style={{
                      fontFamily: IS,
                      fontSize: 11,
                      fontWeight: 300,
                      color: inkVar,
                    }}
                  >
                    {annotation!.text}
                  </span>
                )}
                <DownArrow tone={stickerTone} />
              </div>
            ) : (
              <div key={i} aria-hidden />
            ),
          )}
        </div>
      )}

      {/* Stage cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 24 }}>
        {stages.map((stage) => (
          <StageCard
            key={stage.id}
            stage={stage}
            style={state.stageCardStyle}
            showPct={state.conversionPct === 'shown'}
          />
        ))}
      </div>

      {/* Synthesized-marker — surfaces ONLY when conversion % toggle is on, since Ion's
          narrative funnel does NOT carry real analytics. Per playground plan §4 marking. */}
      {state.conversionPct === 'shown' && (
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
          synthesized · illustrative only — Ion narrative funnel carries no real analytics
        </p>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: vertical (classic narrowing funnel)
// ───────────────────────────────────────────────────────────────────────────
// Stages stack top-down with each card progressively narrower based on synthesized
// retention %. Visual shape: top-wide → bottom-narrow (the canonical funnel).

function VariantVertical({ state }: { state: C1State }) {
  const stages = ION_FUNNEL_COCREATE.stages.slice(0, state.stageCount);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      <p
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-detail)',
          margin: 0,
          alignSelf: 'flex-start',
        }}
      >
        The current user workflow · vertical
      </p>
      {stages.map((stage) => {
        const widthPct = stage.synthesizedRetentionPct;
        return (
          <div
            key={stage.id}
            style={{
              width: `${widthPct}%`,
              maxWidth: 680,
              padding: 16,
              border: '1px solid var(--dir-border)',
              backgroundColor: 'var(--dir-raised)',
              display: 'flex',
              alignItems: 'baseline',
              gap: 16,
              minWidth: 0,
            }}
          >
            <p
              style={{
                fontFamily: IS,
                fontSize: 18,
                fontWeight: 600,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--dir-text-primary)',
                margin: 0,
                flexShrink: 0,
              }}
            >
              {stage.id}
            </p>
            <p
              style={{
                fontFamily: IS,
                fontSize: 11,
                fontWeight: 300,
                lineHeight: 1.45,
                color: 'var(--dir-text-primary)',
                margin: 0,
                flex: 1,
                minWidth: 0,
              }}
            >
              {stage.label}
            </p>
            {state.conversionPct === 'shown' && (
              <p
                style={{
                  fontFamily: IS,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--dir-detail)',
                  margin: 0,
                  flexShrink: 0,
                }}
              >
                {stage.synthesizedRetentionPct}%
              </p>
            )}
          </div>
        );
      })}
      {state.conversionPct === 'shown' && (
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--dir-detail)',
            margin: 0,
            alignSelf: 'flex-start',
          }}
        >
          synthesized · illustrative only — width tracks retention %
        </p>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: stage-cards (richer descriptive cards, larger numerals)
// ───────────────────────────────────────────────────────────────────────────
// Same horizontal grid, but cards use the IS 28 (proof numerals exception, locked) for
// the index — bigger editorial register. More breathing room around the label.

function VariantStageCards({ state }: { state: C1State }) {
  const stages = ION_FUNNEL_COCREATE.stages.slice(0, state.stageCount);
  const cols = `repeat(${stages.length}, minmax(0, 1fr))`;
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
        The current user workflow · stage cards
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 24 }}>
        {stages.map((stage) => (
          <div
            key={stage.id}
            style={{
              padding: 24,
              border: '1px solid var(--dir-border)',
              backgroundColor: 'var(--dir-raised)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              minWidth: 0,
            }}
          >
            <p
              style={{
                // IS 28 = proof / stat numerals (locked exception per typography-system §B)
                fontFamily: IS,
                fontSize: 28,
                fontWeight: 300,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--dir-text-primary)',
                margin: 0,
              }}
            >
              {stage.id}
            </p>
            <p
              style={{
                fontFamily: IS,
                fontSize: 13,
                fontWeight: 300,
                lineHeight: 1.6,
                color: 'var(--dir-text-primary)',
                margin: 0,
              }}
            >
              {stage.label}
            </p>
            {state.conversionPct === 'shown' && (
              <p
                style={{
                  fontFamily: IS,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--dir-detail)',
                  margin: 0,
                  paddingTop: 8,
                  borderTop: '1px solid var(--dir-border)',
                }}
              >
                {stage.synthesizedRetentionPct}% retained
              </p>
            )}
          </div>
        ))}
      </div>
      {state.conversionPct === 'shown' && (
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
          synthesized · illustrative only — Ion narrative funnel carries no real analytics
        </p>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: annotated (both Ion slides simultaneously)
// ───────────────────────────────────────────────────────────────────────────
// Renders BOTH "Ion starts here" (current-state, step 03) and "What if Ion starts here?"
// (strategic-move, step 01) so the diagnostic + the proposal sit side-by-side.

function VariantAnnotated({ state }: { state: C1State }) {
  const dataset = ION_FUNNEL_COCREATE;
  const stages = dataset.stages.slice(0, state.stageCount);
  const cols = `repeat(${stages.length}, minmax(0, 1fr))`;
  // Annotated = side-by-side comparison: ONE sticker is "primary" (user-selected step
  // + variant, primary ink), the OTHER is "secondary" (canonical deck anchor, detail
  // ink). annotationPointer === 'off' hides both. If both end up in the same column,
  // the secondary is suppressed so they don't overlap.
  const stickersOn = state.annotationPointer !== 'off';
  const primaryText = state.annotationVariant === 'what-if' ? 'What if Ion starts here?' : 'Ion starts here';
  const secondaryText = state.annotationVariant === 'what-if' ? 'Ion starts here' : 'What if Ion starts here?';
  // Canonical anchor for the SECONDARY sticker = whichever stage the deck shows it on.
  const secondaryCanonicalStep = state.annotationVariant === 'what-if' ? '03' : '01';
  const primaryTarget = Math.min(stages.findIndex((s) => s.id === state.annotationStep), stages.length - 1);
  const secondaryRaw = stages.findIndex((s) => s.id === secondaryCanonicalStep);
  const secondaryTarget = secondaryRaw === primaryTarget ? -1 : secondaryRaw; // suppress if collides
  const renderStickerCell = (text: string, idx: number, tone: 'primary' | 'detail') => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span
        style={{
          fontFamily: IS,
          fontSize: 11,
          fontWeight: 300,
          lineHeight: 1.4,
          color: tone === 'primary' ? 'var(--dir-text-primary)' : 'var(--dir-detail)',
          padding: '8px 12px',
          border: `1px solid ${tone === 'primary' ? 'var(--dir-text-primary)' : 'var(--dir-detail)'}`,
          backgroundColor: 'var(--dir-raised)',
          borderRadius: 4,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
      <svg width="16" height="24" viewBox="0 0 16 24" aria-hidden style={{ display: 'block' }}>
        <line x1="8" y1="0" x2="8" y2="16" stroke={tone === 'primary' ? 'var(--dir-text-primary)' : 'var(--dir-detail)'} strokeWidth="1" />
        <path d="M 4 16 L 8 24 L 12 16 Z" fill={tone === 'primary' ? 'var(--dir-text-primary)' : 'var(--dir-detail)'} />
      </svg>
      <span aria-hidden style={{ display: 'none' }}>{idx}</span>
    </div>
  );
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
        Strategic move · current state vs proposal
      </p>
      {stickersOn && (
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 24, minHeight: 64 }}>
          {stages.map((_, i) => {
            if (i === primaryTarget && primaryTarget >= 0) {
              return <React.Fragment key={i}>{renderStickerCell(primaryText, i, 'primary')}</React.Fragment>;
            }
            if (i === secondaryTarget && secondaryTarget >= 0) {
              return <React.Fragment key={i}>{renderStickerCell(secondaryText, i, 'detail')}</React.Fragment>;
            }
            return <div key={i} aria-hidden />;
          })}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 24 }}>
        {stages.map((stage) => (
          <StageCard
            key={stage.id}
            stage={stage}
            style={state.stageCardStyle}
            showPct={state.conversionPct === 'shown'}
          />
        ))}
      </div>
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
        Ion currently enters mid-funnel at step 03. The strategic move repositions Ion to step 01 — start-of-funnel — so it shapes the work from the founder message onward.
      </p>
      {state.conversionPct === 'shown' && (
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
          synthesized · illustrative only — Ion narrative funnel carries no real analytics
        </p>
      )}
    </div>
  );
}

/**
 * C1 · Funnel
 *
 * Playground default: pulls C1State from `useGateAIonArtifactPlayground`.
 *
 * Case-study mode: pass `stateOverride` (partial C1State, merged over playground state)
 * to lock the render independent of toggles — matches the B1VennPositioning pattern
 * added 2026-05-21 for §04 Venn. Used by §05 2-moment compression (two stacked
 * NativeHorizontal renders with different overrides + tones).
 *
 * `stickerTone` ('primary' default / 'detail' muted) drives sticker + arrow ink for the
 * current-state vs reframe moments. `eyebrow` (null = no eyebrow) lets §05 suppress the
 * playground's "The current user workflow" eyebrow when the §05 section header carries
 * that role.
 */
export function C1Funnel({
  stateOverride,
  stickerTone,
  eyebrow,
}: {
  stateOverride?: Partial<C1State>;
  stickerTone?: StickerTone;
  eyebrow?: string | null;
} = {}) {
  const { c1: playgroundState } = useGateAIonArtifactPlayground();
  const c1: C1State = stateOverride ? { ...playgroundState, ...stateOverride } : playgroundState;
  if (c1.variant === 'horizontal') return <NativeHorizontal state={c1} stickerTone={stickerTone} eyebrow={eyebrow} />;
  if (c1.variant === 'vertical') return <VariantVertical state={c1} />;
  if (c1.variant === 'stage-cards') return <VariantStageCards state={c1} />;
  return <VariantAnnotated state={c1} />;
}
