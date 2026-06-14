// ─── DrawToolbar — the ONE shared draw-tool row (Phase 0 extraction) ─────────
// Behavior-preserving extraction of the tool-row UI that was DUPLICATED inline
// in DrawPanel.tsx (the /desk add-doodle popup) and DeskDoodlesCanvas.tsx (the
// /canvas page), and ABSENT a third time in ObjectSurface.tsx's RE-DRAW modal.
//
// It is a CONTROLLED, PRESENTATIONAL component: it owns no canvas state. Every
// host owns its own register / shadeTool / snap-chip state and computes the
// caption + disabled flags itself, then passes them down so the rendered row is
// byte-identical to what each host drew before. The toolbar does NOT own the
// render axis (Sketch | Style) — that stays in the host and is passed through
// the `leading` slot when a host wants it inline.
//
// ToneShadeCluster is imported (unchanged) from DrawSurface — this file never
// edits DrawSurface.
import type { ReactNode } from 'react';
import { IS } from '../../lib/typography';
import { PILL, SECTION_LABEL } from '../../lib/chromeStyles';
import { ToneShadeCluster, type ShadeToolState } from './DrawSurface';
import type { SnapAction } from '../../lib/draw/shapeFit';

// ─── SnapChip — the shape-assist receipt (Rock F3) ───────────────────────────
// "Circle ▸" — tap to cycle the ranked candidates (incl. Original). Accent dot
// = a system act; fully rounded pill; no accent-ink bg per system rules. Lives
// by the SNAP/STRAIGHTEN pills. (Was duplicated byte-identically in DrawPanel +
// DeskDoodlesCanvas; now lives here, once.)
function SnapChip({
  label,
  hasAlternatives,
  onCycle,
}: {
  label: string;
  hasAlternatives: boolean;
  onCycle: () => void;
}) {
  return (
    <button
      type="button"
      data-snap-chip
      onClick={onCycle}
      disabled={!hasAlternatives}
      title={hasAlternatives ? 'Tap to try another shape' : 'Only one reading — nothing to cycle'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 999,
        border: '1px solid var(--dir-border)',
        background: 'var(--dir-bg)',
        padding: '6px 12px',
        minWidth: 0,
        flexShrink: 0,
        cursor: hasAlternatives ? 'pointer' : 'default',
        fontFamily: IS,
      }}
    >
      <span
        aria-hidden="true"
        style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--dir-accent)', flexShrink: 0 }}
      />
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--dir-text-primary)' }}>{label}</span>
      {hasAlternatives && (
        <span aria-hidden="true" style={{ fontSize: 11, color: 'var(--dir-text-secondary)' }}>
          ▸
        </span>
      )}
    </button>
  );
}

export interface DrawToolbarSnapChip {
  /** The receipt label — the currently-applied candidate's name. */
  label: string;
  /** True when there's more than one reading to cycle through. */
  hasAlternatives: boolean;
  /** Tap the chip = cycle to the next ranked candidate (host applies it live). */
  onCycle: () => void;
}

export interface DrawToolbarProps {
  // — register (Ink | Shade) —
  register: 'ink' | 'shade';
  onRegisterChange: (r: 'ink' | 'shade') => void;
  /** Disables both register pills (DrawPanel: true while in Style mode). The
   *  pills stay VISIBLE (dimmed) — only the canvas's render axis paused them. */
  registerDisabled?: boolean;
  /** Title for the register pills while disabled (DrawPanel's Style-mode hint).
   *  When unset, the enabled per-register hints are used. */
  registerDisabledTitle?: string;

  // — shade tool cluster (ToneShadeCluster) —
  shadeTool: ShadeToolState;
  onShadeToolChange: (s: ShadeToolState) => void;
  /** Whether the Shade register / tone cluster is in scope on this host. When
   *  false the Shade pill is hidden and the cluster never mounts. */
  shadeEnabled?: boolean;

  // — shape assist (Snap | Straighten + the candidate chip) —
  /** Whether the Snap/Straighten cluster + chip render at all (DrawPanel hides
   *  the whole cluster in Style mode; /canvas + RE-DRAW always show it). */
  showSnap?: boolean;
  /** Shared enabled state for both snap pills (ink register + ≥1 stroke). */
  snapEnabled: boolean;
  onSnapAction: (action: SnapAction) => void;
  /** Per-action tooltip — the host owns the honest wording (shade/no-stroke/…). */
  snapTitle: (action: SnapAction) => string;
  /** The live shape-snap receipt chip, or null when nothing is snapped. */
  snapChip: DrawToolbarSnapChip | null;

  // — caption (the honest-miss / register-hint one-liner) —
  captionText: string;
  /** True when the caption is an alert (removeNote / fillNote) → accent color +
   *  role="status". */
  captionAlert?: boolean;

  // — slots —
  /** Inline content BEFORE the register pills, in the same row (DrawPanel uses
   *  it for the Sketch | Style render-axis pills + separator). */
  leading?: ReactNode;
  /** Inline content at the row's tail (DrawPanel uses it for the upload
   *  Replace / Remove cluster). */
  trailing?: ReactNode;

  // — layout —
  /** Minor spacing only; behavior identical across variants. */
  variant: 'panel' | 'canvas' | 'redraw';
}

/** The one shared draw-tool row. Renders (left → right, wrapping): the
 *  `leading` slot · Ink|Shade register pills · the Snap|Straighten action pills
 *  + candidate chip · the caption · the `trailing` slot — then, on a second
 *  row, the ToneShadeCluster when Shade is in hand. Spacing tracks `variant`
 *  to stay byte-identical to each host's previous inline markup. */
export function DrawToolbar({
  register,
  onRegisterChange,
  registerDisabled = false,
  registerDisabledTitle,
  shadeTool,
  onShadeToolChange,
  shadeEnabled = true,
  showSnap = true,
  snapEnabled,
  onSnapAction,
  snapTitle,
  snapChip,
  captionText,
  captionAlert = false,
  leading,
  trailing,
  variant,
}: DrawToolbarProps) {
  // The register options — Shade is dropped when the host has no tone scope.
  const registers: ('ink' | 'shade')[] = shadeEnabled ? ['ink', 'shade'] : ['ink'];
  // Spacing parity: DrawPanel's row had marginBottom 8 and its shade cluster
  // marginBottom 8; the /canvas row sat inside a maxWidth wrapper with no row
  // margin and a marginTop-8 shade cluster. RE-DRAW follows /canvas.
  const rowMarginBottom = variant === 'panel' ? 8 : 0;
  const clusterMargin =
    variant === 'panel' ? { marginBottom: 8 } : { marginTop: 8 };

  return (
    <>
      {/* TOOL ROW — pills never shrink; the caption is the row's ONE flexible
          item (single line, ellipsized, full text on hover via title). */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          rowGap: 6,
          marginBottom: rowMarginBottom,
          flexWrap: 'wrap',
        }}
      >
        {leading}

        {/* INK | SHADE register — which tool the pointer wields while sketching.
            Shade puts down tone bands; Ink draws strokes. */}
        {registers.map((r) => (
          <button
            key={r}
            onClick={() => onRegisterChange(r)}
            aria-pressed={register === r}
            disabled={registerDisabled}
            title={
              registerDisabled && registerDisabledTitle
                ? registerDisabledTitle
                : r === 'ink'
                  ? 'Draw ink strokes'
                  : 'Brush flat tone bands under your ink'
            }
            style={{
              ...PILL,
              padding: '6px 14px',
              flexShrink: 0,
              opacity: registerDisabled ? 0.45 : 1,
              cursor: registerDisabled ? 'default' : 'pointer',
              background: register === r ? 'var(--dir-text-primary)' : 'var(--dir-bg)',
              color: register === r ? 'var(--dir-bg)' : 'var(--dir-text-primary)',
            }}
          >
            {r === 'ink' ? 'Ink' : 'Shade'}
          </button>
        ))}

        {/* SHAPE ASSIST — Snap + Straighten action pills. Ink register only
            (tone patches don't snap); disabled until ≥1 stroke exists. The chip
            cycles ranked candidates in this same row. */}
        {showSnap && (
          <>
            <span
              aria-hidden
              style={{ width: 1, alignSelf: 'stretch', background: 'var(--dir-border)', flexShrink: 0 }}
            />
            {(['snap', 'straighten'] as const).map((act) => (
              <button
                key={act}
                data-snap-pill={act}
                onClick={() => onSnapAction(act)}
                disabled={!snapEnabled}
                title={snapTitle(act)}
                style={{
                  ...PILL,
                  padding: '6px 14px',
                  flexShrink: 0,
                  opacity: snapEnabled ? 1 : 0.45,
                  cursor: snapEnabled ? 'pointer' : 'default',
                  background: 'var(--dir-bg)',
                  color: 'var(--dir-text-primary)',
                }}
              >
                {act === 'snap' ? 'Snap' : 'Straighten'}
              </button>
            ))}
            {snapChip && (
              <SnapChip
                label={snapChip.label}
                hasAlternatives={snapChip.hasAlternatives}
                onCycle={snapChip.onCycle}
              />
            )}
          </>
        )}

        {/* Caption — the honest-miss one-liner takes the slot when it fires,
            else the current register's hint. Single line, ellipsized, full text
            on hover via title. */}
        <span
          role={captionAlert ? 'status' : undefined}
          title={captionText}
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontStyle: 'italic',
            color: captionAlert ? 'var(--dir-accent)' : 'var(--dir-text-body-soft)',
            flex: '1 1 0%',
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {captionText}
        </span>

        {trailing}
      </div>

      {/* SHADE TOOL CLUSTER — visible only while the shade register is in hand:
          the full 8-band ladder (7 paint swatches + Erase = band 0/paper), the
          Brush|Fill|Lasso tools, the per-tool slider, and the FULL FILL pill.
          The whole cluster comes from DrawSurface's exported ToneShadeCluster
          (the same one every host mounts). Disabled register (DrawPanel's Style
          mode) hides it — matching the host's old composeMode==='draw' gate. */}
      {shadeEnabled && register === 'shade' && !registerDisabled && (
        <div
          data-shade-cluster
          style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, ...clusterMargin }}
        >
          <span style={{ ...SECTION_LABEL, flexShrink: 0 }}>Tone</span>
          <ToneShadeCluster value={shadeTool} onChange={onShadeToolChange} />
        </div>
      )}
    </>
  );
}
