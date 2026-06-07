import React from 'react';
import { IS } from '../cards/tokens';
import {
  ION_SERVICE_BLUEPRINT,
  ION_C4_EMOTION_TRACK,
  ION_C4_PHYSICAL_EVIDENCE,
  type C4Cell,
  type C4Tier,
  type C4Touchpoint,
  type C4TierId,
  type C4TouchpointId,
} from './data/ion-service-blueprint';
import { useGateAIonArtifactPlayground, type C4State } from '../../state/GateAIonArtifactPlaygroundContext';

// C4 · Service Blueprint — native only at IC quality.
// Native = Classic 4-tier Shostack: Customer (designer) / Frontstage (Ion UI) /
// Backstage (Ruby AI) / Support (Infra), across 5 timeline touchpoints aligned
// to the C1 funnel. Tier separators carry Shostack's canonical names (line of
// interaction / visibility / internal interaction). Fail-point markers grounded
// in Ion's clarify-before-execute language.
//
// Other variants (compact 3-tier, vertical orientation, emotion-augmented,
// physical-evidence) render "pending native approval" stubs.
//
// Register choice: clean editorial (NOT rough.js). C4 is a tabular structure
// where typography + tier-separator discipline carries the work; hand-feel
// would obscure the structural reading.
//
// SYSTEM ADHERENCE (audited pre-ship):
// - Typography: locked ladder only — IS 10/500/0.12em uppercase (eyebrow,
//   step numbers, separator labels, fail-point caption), IS 11/300 (cell body
//   text + tier sub-label), IS 13/500 (timeline column header).
// - Spacing: locked tokens — gap 0 between cells (separators carry the rhythm),
//   padding 12 (Tight) inside cells, gap 24 (Block) between artifact blocks.
// - Color: W1 tokens only — text = --dir-text-primary, sub-text +
//   fail-point + step numbers + separator labels = --dir-detail, cell borders
//   = --dir-border, raised cells = --dir-raised. No accent tints, no rgba.
// - AI-smell traps avoided: no swim-lane bg colors, no per-tier icon decoration,
//   no gradient backgrounds, no enterprise-software register.

// ───────────────────────────────────────────────────────────────────────────
// Native: classic 4-tier
// ───────────────────────────────────────────────────────────────────────────

function NativeFourTier({ state }: { state: C4State }) {
  const { tiers, touchpoints, cells, separators } = ION_SERVICE_BLUEPRINT;
  const showFailPoints = state.failPoints === 'on';
  const showSeparatorLabels = state.separatorLabels === 'on';

  // Layout: CSS grid with 6 columns (tier-label + 5 touchpoints).
  // Rows interleave: header, tier 1, separator 1, tier 2, separator 2, ...
  const columns = `160px repeat(${touchpoints.length}, minmax(0, 1fr))`;

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
      {/* Top-left empty corner cell */}
      <div style={{ borderRight: '1px solid var(--dir-border)', borderBottom: '1px solid var(--dir-border)' }} />

      {/* Header row: timeline columns with step number + label */}
      {touchpoints.map((tp, i) => (
        <HeaderCell key={tp.id} touchpoint={tp} isLast={i === touchpoints.length - 1} />
      ))}

      {tiers.map((tier, tierIdx) => (
        <React.Fragment key={tier.id}>
          {/* Tier label cell (col 1) + cell row (cols 2..6) */}
          <TierLabel tier={tier} isLast={tierIdx === tiers.length - 1} />
          {touchpoints.map((tp, ci) => {
            const cell = cells.find((c) => c.tier === tier.id && c.touchpoint === tp.id);
            return (
              <BlueprintCell
                key={tp.id}
                cell={cell}
                isLast={ci === touchpoints.length - 1}
                isBottomRow={tierIdx === tiers.length - 1}
                showFailPoint={showFailPoints}
              />
            );
          })}

          {/* Separator row between this tier and the next */}
          {tierIdx < tiers.length - 1 && (() => {
            const sep = separators[tierIdx];
            return (
              <SeparatorRow
                key={`sep-${sep.label}`}
                label={sep.label}
                showLabel={showSeparatorLabels}
                colSpan={touchpoints.length + 1}
              />
            );
          })()}
        </React.Fragment>
      ))}
    </div>
  );
}

function HeaderCell({ touchpoint, isLast }: { touchpoint: C4Touchpoint; isLast: boolean }) {
  return (
    <div
      style={{
        padding: 12,
        borderBottom: '1px solid var(--dir-border)',
        borderRight: isLast ? 'none' : '1px solid var(--dir-border)',
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
        {touchpoint.stepNumber}
      </p>
      <p
        style={{
          fontFamily: IS, fontSize: 13, fontWeight: 500, lineHeight: 1.3,
          letterSpacing: '-0.005em', color: 'var(--dir-text-primary)', margin: 0,
        }}
      >
        {touchpoint.label}
      </p>
    </div>
  );
}

function TierLabel({ tier, isLast }: { tier: C4Tier; isLast: boolean }) {
  // Strip the parenthetical "(customer)" / "(frontstage)" etc. for caps presentation;
  // surface the inner role as the eyebrow + the short label as the sub-line.
  const matchParens = tier.label.match(/^(.+?)\s+\((.+?)\)$/);
  const main = matchParens ? matchParens[1] : tier.label;
  const sub = matchParens ? matchParens[2] : null;
  return (
    <div
      style={{
        padding: 12,
        borderRight: '1px solid var(--dir-border)',
        borderBottom: isLast ? 'none' : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <p
        style={{
          fontFamily: IS, fontSize: 11, fontWeight: 500, lineHeight: 1.3,
          letterSpacing: '-0.005em', color: 'var(--dir-text-primary)', margin: 0,
        }}
      >
        {main}
      </p>
      {sub && (
        <p
          style={{
            fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function BlueprintCell({
  cell,
  isLast,
  isBottomRow,
  showFailPoint,
}: {
  cell?: C4Cell;
  isLast: boolean;
  isBottomRow: boolean;
  showFailPoint: boolean;
}) {
  if (!cell) return <div style={{ borderRight: isLast ? 'none' : '1px solid var(--dir-border)' }} />;
  return (
    <div
      style={{
        padding: 12,
        borderRight: isLast ? 'none' : '1px solid var(--dir-border)',
        borderBottom: isBottomRow ? 'none' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 0,
      }}
    >
      <p
        style={{
          fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.45,
          color: 'var(--dir-text-primary)', margin: 0,
        }}
      >
        {cell.text}
      </p>
      {showFailPoint && cell.failPoint && (
        <p
          style={{
            fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
            textTransform: 'uppercase', lineHeight: 1.4,
            color: 'var(--dir-detail)', margin: 0,
            paddingTop: 4,
            borderTop: '1px solid var(--dir-border)',
          }}
        >
          ⚠ {cell.failPoint}
        </p>
      )}
    </div>
  );
}

function SeparatorRow({
  label,
  showLabel,
  colSpan,
}: {
  label: string;
  showLabel: boolean;
  colSpan: number;
}) {
  return (
    <div
      style={{
        gridColumn: `1 / span ${colSpan}`,
        borderTop: '1px solid var(--dir-text-primary)',
        borderBottom: '1px solid var(--dir-border)',
        padding: showLabel ? '6px 12px' : 0,
        backgroundColor: 'var(--dir-raised)',
      }}
    >
      {showLabel && (
        <p
          style={{
            fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
          }}
        >
          {label}
        </p>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: Compact 3-tier
// Drops Support tier; renders Customer / Frontstage / Backstage with the
// Line-of-interaction + Line-of-visibility separators between them. Same
// 5-touchpoint timeline. Same atoms.
// ───────────────────────────────────────────────────────────────────────────

function Compact3Tier({ state }: { state: C4State }) {
  const { tiers, touchpoints, cells, separators } = ION_SERVICE_BLUEPRINT;
  const showFailPoints = state.failPoints === 'on';
  const showSeparatorLabels = state.separatorLabels === 'on';

  const visibleTiers = tiers.filter((t) => t.id !== 'support');
  // Keep the first two separators (interaction, visibility); drop internal-interaction.
  const visibleSeparators = separators.filter((s) => s.betweenBelow !== 'support');

  const columns = `160px repeat(${touchpoints.length}, minmax(0, 1fr))`;

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
      <div style={{ borderRight: '1px solid var(--dir-border)', borderBottom: '1px solid var(--dir-border)' }} />
      {touchpoints.map((tp, i) => (
        <HeaderCell key={tp.id} touchpoint={tp} isLast={i === touchpoints.length - 1} />
      ))}

      {visibleTiers.map((tier, tierIdx) => (
        <React.Fragment key={tier.id}>
          <TierLabel tier={tier} isLast={tierIdx === visibleTiers.length - 1} />
          {touchpoints.map((tp, ci) => {
            const cell = cells.find((c) => c.tier === tier.id && c.touchpoint === tp.id);
            return (
              <BlueprintCell
                key={tp.id}
                cell={cell}
                isLast={ci === touchpoints.length - 1}
                isBottomRow={tierIdx === visibleTiers.length - 1}
                showFailPoint={showFailPoints}
              />
            );
          })}
          {tierIdx < visibleTiers.length - 1 && (
            <SeparatorRow
              key={`sep-${visibleSeparators[tierIdx].label}`}
              label={visibleSeparators[tierIdx].label}
              showLabel={showSeparatorLabels}
              colSpan={touchpoints.length + 1}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: Vertical orientation
// Timeline runs down the Y-axis (5 touchpoint rows), tiers run across as
// 4 columns. Tier separators become vertical (between columns) and carry
// the same Shostack canonical names (rotated to read bottom-up).
// Header row holds the tier labels.
// ───────────────────────────────────────────────────────────────────────────

function VerticalLayout({ state }: { state: C4State }) {
  const { tiers, touchpoints, cells, separators } = ION_SERVICE_BLUEPRINT;
  const showFailPoints = state.failPoints === 'on';
  const showSeparatorLabels = state.separatorLabels === 'on';

  // Build a row layout: leftmost column = touchpoint label;
  // then for each pair of (cellColumn, separatorColumn) we render a cell or
  // a vertical separator. We use one DOM <div> per cell so we don't need
  // grid trickery for the separators; instead each cell carries its own
  // right border styled to match Shostack's hierarchy.
  //
  // Column track = [touchpoint-label, tier1, sep, tier2, sep, tier3, sep, tier4]
  // Total: 1 + 4 + 3 = 8 columns. Separator columns are narrow (28px) with
  // a centered vertical hairline + (optional) rotated caps label.

  const TIER_MIN = 'minmax(0, 1fr)';
  const SEP_W = '32px';
  const columns = `160px ${TIER_MIN} ${SEP_W} ${TIER_MIN} ${SEP_W} ${TIER_MIN} ${SEP_W} ${TIER_MIN}`;

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
      {/* Header row: empty corner + 4 tier labels interleaved with 3 separator labels */}
      <div style={{ borderRight: '1px solid var(--dir-border)', borderBottom: '1px solid var(--dir-border)' }} />
      {tiers.map((tier, i) => (
        <React.Fragment key={tier.id}>
          <VerticalTierHeader tier={tier} />
          {i < tiers.length - 1 && (
            <VerticalSeparatorHeader
              label={separators[i].label}
              showLabel={showSeparatorLabels}
            />
          )}
        </React.Fragment>
      ))}

      {/* Body rows: one row per touchpoint */}
      {touchpoints.map((tp, rowIdx) => {
        const isBottomRow = rowIdx === touchpoints.length - 1;
        return (
          <React.Fragment key={tp.id}>
            <VerticalTouchpointLabel touchpoint={tp} isLast={isBottomRow} />
            {tiers.map((tier, ci) => {
              const cell = cells.find((c) => c.tier === tier.id && c.touchpoint === tp.id);
              return (
                <React.Fragment key={tier.id}>
                  <VerticalCell
                    cell={cell}
                    isBottomRow={isBottomRow}
                    showFailPoint={showFailPoints}
                  />
                  {ci < tiers.length - 1 && (
                    <VerticalSeparatorBody
                      label={separators[ci].label}
                      showLabel={showSeparatorLabels && rowIdx === Math.floor(touchpoints.length / 2)}
                      isBottomRow={isBottomRow}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function VerticalTierHeader({ tier }: { tier: C4Tier }) {
  const matchParens = tier.label.match(/^(.+?)\s+\((.+?)\)$/);
  const main = matchParens ? matchParens[1] : tier.label;
  const sub = matchParens ? matchParens[2] : null;
  return (
    <div
      style={{
        padding: 12,
        borderBottom: '1px solid var(--dir-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <p
        style={{
          fontFamily: IS, fontSize: 13, fontWeight: 500, lineHeight: 1.3,
          letterSpacing: '-0.005em', color: 'var(--dir-text-primary)', margin: 0,
        }}
      >
        {main}
      </p>
      {sub && (
        <p
          style={{
            fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function VerticalSeparatorHeader({
  label: _label,
  showLabel: _showLabel,
}: {
  label: string;
  showLabel: boolean;
}) {
  // Header strip above the vertical separator column. Keeps the header row
  // visually continuous; the separator's own label sits in the body, rotated.
  return (
    <div
      style={{
        borderBottom: '1px solid var(--dir-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    />
  );
}

function VerticalTouchpointLabel({ touchpoint, isLast: _isLast }: { touchpoint: C4Touchpoint; isLast: boolean }) {
  return (
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
      <p
        style={{
          fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {touchpoint.stepNumber}
      </p>
      <p
        style={{
          fontFamily: IS, fontSize: 13, fontWeight: 500, lineHeight: 1.3,
          letterSpacing: '-0.005em', color: 'var(--dir-text-primary)', margin: 0,
        }}
      >
        {touchpoint.label}
      </p>
    </div>
  );
}

function VerticalCell({
  cell,
  isBottomRow: _isBottomRow,
  showFailPoint,
}: {
  cell?: C4Cell;
  isBottomRow: boolean;
  showFailPoint: boolean;
}) {
  if (!cell) return <div />;
  return (
    <div
      style={{
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 0,
      }}
    >
      <p
        style={{
          fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.45,
          color: 'var(--dir-text-primary)', margin: 0,
        }}
      >
        {cell.text}
      </p>
      {showFailPoint && cell.failPoint && (
        <p
          style={{
            fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
            textTransform: 'uppercase', lineHeight: 1.4,
            color: 'var(--dir-detail)', margin: 0,
            paddingTop: 4,
            borderTop: '1px solid var(--dir-border)',
          }}
        >
          ⚠ {cell.failPoint}
        </p>
      )}
    </div>
  );
}

function VerticalSeparatorBody({
  label,
  showLabel,
  isBottomRow: _isBottomRow,
}: {
  label: string;
  showLabel: boolean;
  isBottomRow: boolean;
}) {
  // Vertical hairline filling the column. When showLabel is true (only on the
  // middle row, once per separator), render the rotated caps label centered.
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: showLabel ? 'var(--dir-raised)' : 'transparent',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: 1,
          backgroundColor: 'var(--dir-text-primary)',
          transform: 'translateX(-0.5px)',
        }}
      />
      {showLabel && (
        <p
          style={{
            position: 'relative',
            fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
            transform: 'rotate(-90deg)',
            whiteSpace: 'nowrap',
            backgroundColor: 'var(--dir-raised)',
            padding: '4px 8px',
          }}
        >
          {label}
        </p>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: Emotion-augmented (NN/g extension)
// Adds a top emotion-track row above Customer. One caps eyebrow per
// touchpoint column (FRUSTRATING / NEUTRAL / SATISFYING). Derived from
// fail-points + handoff resolution, NOT emoji glyphs.
// Otherwise identical to NativeFourTier.
// ───────────────────────────────────────────────────────────────────────────

function EmotionAugmented({ state }: { state: C4State }) {
  const { tiers, touchpoints, cells, separators } = ION_SERVICE_BLUEPRINT;
  const showFailPoints = state.failPoints === 'on';
  const showSeparatorLabels = state.separatorLabels === 'on';

  const columns = `160px repeat(${touchpoints.length}, minmax(0, 1fr))`;

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
      {/* Top header: tier-label corner + 5 timeline columns */}
      <div style={{ borderRight: '1px solid var(--dir-border)', borderBottom: '1px solid var(--dir-border)' }} />
      {touchpoints.map((tp, i) => (
        <HeaderCell key={tp.id} touchpoint={tp} isLast={i === touchpoints.length - 1} />
      ))}

      {/* Emotion track — single row above Customer */}
      <EmotionTrackLabel />
      {touchpoints.map((tp, i) => (
        <EmotionCell
          key={tp.id}
          level={ION_C4_EMOTION_TRACK[tp.id]}
          isLast={i === touchpoints.length - 1}
        />
      ))}

      {/* Separator between emotion track and Customer */}
      <SeparatorRow
        label="Line of emotion"
        showLabel={showSeparatorLabels}
        colSpan={touchpoints.length + 1}
      />

      {tiers.map((tier, tierIdx) => (
        <React.Fragment key={tier.id}>
          <TierLabel tier={tier} isLast={tierIdx === tiers.length - 1} />
          {touchpoints.map((tp, ci) => {
            const cell = cells.find((c) => c.tier === tier.id && c.touchpoint === tp.id);
            return (
              <BlueprintCell
                key={tp.id}
                cell={cell}
                isLast={ci === touchpoints.length - 1}
                isBottomRow={tierIdx === tiers.length - 1}
                showFailPoint={showFailPoints}
              />
            );
          })}
          {tierIdx < tiers.length - 1 && (
            <SeparatorRow
              key={`sep-${separators[tierIdx].label}`}
              label={separators[tierIdx].label}
              showLabel={showSeparatorLabels}
              colSpan={touchpoints.length + 1}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function EmotionTrackLabel() {
  return (
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
      <p
        style={{
          fontFamily: IS, fontSize: 11, fontWeight: 500, lineHeight: 1.3,
          letterSpacing: '-0.005em', color: 'var(--dir-text-primary)', margin: 0,
        }}
      >
        Emotion
      </p>
      <p
        style={{
          fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
        }}
      >
        NN/g extension
      </p>
    </div>
  );
}

function EmotionCell({
  level,
  isLast,
}: {
  level: 'FRUSTRATING' | 'NEUTRAL' | 'SATISFYING';
  isLast: boolean;
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRight: isLast ? 'none' : '1px solid var(--dir-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: 56,
      }}
    >
      <p
        style={{
          fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
        }}
      >
        {level}
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: Physical-evidence row (Shostack 5-tier extension)
// Adds a top "physical evidence" row above Customer. One caps eyebrow per
// touchpoint column naming the tangible artifact (Slack message, Browser
// tab, Canvas surface, Reply panel, Workspace doc). No icons.
// ───────────────────────────────────────────────────────────────────────────

function PhysicalEvidence({ state }: { state: C4State }) {
  const { tiers, touchpoints, cells, separators } = ION_SERVICE_BLUEPRINT;
  const showFailPoints = state.failPoints === 'on';
  const showSeparatorLabels = state.separatorLabels === 'on';

  const columns = `160px repeat(${touchpoints.length}, minmax(0, 1fr))`;

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
      <div style={{ borderRight: '1px solid var(--dir-border)', borderBottom: '1px solid var(--dir-border)' }} />
      {touchpoints.map((tp, i) => (
        <HeaderCell key={tp.id} touchpoint={tp} isLast={i === touchpoints.length - 1} />
      ))}

      {/* Physical-evidence row */}
      <PhysicalEvidenceLabel />
      {touchpoints.map((tp, i) => (
        <PhysicalEvidenceCell
          key={tp.id}
          label={ION_C4_PHYSICAL_EVIDENCE[tp.id]}
          isLast={i === touchpoints.length - 1}
        />
      ))}

      <SeparatorRow
        label="Line of evidence"
        showLabel={showSeparatorLabels}
        colSpan={touchpoints.length + 1}
      />

      {tiers.map((tier, tierIdx) => (
        <React.Fragment key={tier.id}>
          <TierLabel tier={tier} isLast={tierIdx === tiers.length - 1} />
          {touchpoints.map((tp, ci) => {
            const cell = cells.find((c) => c.tier === tier.id && c.touchpoint === tp.id);
            return (
              <BlueprintCell
                key={tp.id}
                cell={cell}
                isLast={ci === touchpoints.length - 1}
                isBottomRow={tierIdx === tiers.length - 1}
                showFailPoint={showFailPoints}
              />
            );
          })}
          {tierIdx < tiers.length - 1 && (
            <SeparatorRow
              key={`sep-${separators[tierIdx].label}`}
              label={separators[tierIdx].label}
              showLabel={showSeparatorLabels}
              colSpan={touchpoints.length + 1}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function PhysicalEvidenceLabel() {
  return (
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
      <p
        style={{
          fontFamily: IS, fontSize: 11, fontWeight: 500, lineHeight: 1.3,
          letterSpacing: '-0.005em', color: 'var(--dir-text-primary)', margin: 0,
        }}
      >
        Physical evidence
      </p>
      <p
        style={{
          fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
        }}
      >
        Shostack 5-tier
      </p>
    </div>
  );
}

function PhysicalEvidenceCell({ label, isLast }: { label: string; isLast: boolean }) {
  return (
    <div
      style={{
        padding: 12,
        borderRight: isLast ? 'none' : '1px solid var(--dir-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: 56,
      }}
    >
      <p
        style={{
          fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
        }}
      >
        {label}
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Top-level
// ───────────────────────────────────────────────────────────────────────────

function VariantBody({ state }: { state: C4State }) {
  switch (state.variant) {
    case 'classic-4-tier':    return <NativeFourTier state={state} />;
    case 'compact-3-tier':    return <Compact3Tier state={state} />;
    case 'vertical':          return <VerticalLayout state={state} />;
    case 'emotion-augmented': return <EmotionAugmented state={state} />;
    case 'physical-evidence': return <PhysicalEvidence state={state} />;
  }
}

export function C4ServiceBlueprint() {
  const { c4 } = useGateAIonArtifactPlayground();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p
          style={{
            fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
          }}
        >
          Synthesized · illustrative only · Ion mapped to Shostack 4-tier
        </p>
        <p
          style={{
            fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.6,
            color: 'var(--dir-text-secondary)', margin: 0, maxWidth: 720,
          }}
        >
          Designer interaction with Ruby across the 5-step Ion flow, decomposed into Shostack's four service-design tiers. Fail-point markers surface clarify-before-execute moments.
        </p>
      </header>

      <VariantBody state={c4} />
    </div>
  );
}
