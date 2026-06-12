import { useEffect, useMemo, useRef, useState } from 'react';
import { IS, ISe } from '../../lib/typography';
import { CHIP, PILL, SECTION_LABEL } from '../../lib/chromeStyles';
import { PAPER_GRAIN, WARM_POOL } from '../../lib/deskCraft';
import { normalizeSvgSize } from '../../lib/normalizeInput';
import { listDesks, listMyDoodles, type DoodleRow } from '../../lib/publish';
import { sanitizeSvgMarkup } from '../../lib/svgUpload';

// ─── DrawerPanel — "My doodles", the passive cross-desk index ───────────────
// Sebs-ratified drawer decisions (2026-06-11 board, #26-32):
//   #26 the drawer is a PASSIVE INDEX, not a stash — records live on desks;
//       the drawer is the VIEW that groups records by owner (object-model
//       doc's unifying frame: every feature is a VIEW of the same record).
//   #27 CROSS-DESK: lists this session's doodles across ALL desks
//       (publish.ts listMyDoodles — additive helper, 2026-06-12).
//   #28 "Place here" = COPY: a NEW row publishes onto the current open desk
//       through DeskPage's addObject path (same normalize, same P-1 smart
//       placement); the original row is untouched and the copy carries the
//       source's render_config verbatim — strokes included.
//   #29 ONE-RECORD delete semantics: deleting a doodle from a desk removes
//       it here too — same record, two views. The footer says so honestly.
//   #30 LEFT CollapsiblePanel, mirroring the right Controls panel (shell +
//       PanelToggle live in DeskPage chrome — toggles-always-in-chrome).
//
// Mini art follows the DeskGallery MiniDesk precedent: stored markup is
// normalized small + sanitized on read + injected as PLAIN inline SVG —
// deliberately NOT the full SvgStyleTransform pipeline (cheap, deterministic,
// and the drawer never re-renders on pen tweaks).

type DrawerState =
  | { phase: 'loading' }
  | { phase: 'ready'; rows: DoodleRow[]; deskNames: Map<string, string> }
  | { phase: 'error' };

export function DrawerPanel({
  open,
  refreshKey,
  viewedDeskId,
  onPlace,
}: {
  /** Panel visibility — a closed drawer doesn't fetch. */
  open: boolean;
  /** Bumped by DeskPage when a publish or delete settles → refetch, so the
   *  index tracks the records (one-record semantics, #29). */
  refreshKey: number;
  /** The desk currently in view — its rows get a quiet "here" mark. */
  viewedDeskId: string | null;
  /** Place-here: DeskPage publishes a COPY via its addObject path (#28). */
  onPlace: (row: DoodleRow) => void;
}) {
  const [state, setState] = useState<DrawerState>({ phase: 'loading' });
  // Manual retry for the error state — a passive index doesn't poll.
  const [retryNonce, setRetryNonce] = useState(0);
  // Transient per-row "Placed ✓" feedback after a place-here click.
  const [placedId, setPlacedId] = useState<string | null>(null);
  const placedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return; // don't pay the reads while closed
    let cancelled = false;
    // Keep the current rows on screen during a refetch (no flicker on the
    // publish/delete bumps); only the first load / error-retry shows loading.
    setState((s) => (s.phase === 'ready' ? s : { phase: 'loading' }));
    Promise.all([listMyDoodles(), listDesks()])
      .then(([rows, desks]) => {
        if (cancelled) return;
        setState({
          phase: 'ready',
          rows,
          deskNames: new Map(desks.map((d) => [d.id, d.name])),
        });
      })
      .catch(() => {
        if (!cancelled) setState({ phase: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [open, refreshKey, retryNonce]);

  // Clear the transient placed-feedback timer on unmount.
  useEffect(
    () => () => {
      if (placedTimerRef.current) clearTimeout(placedTimerRef.current);
    },
    [],
  );

  const handlePlace = (row: DoodleRow) => {
    onPlace(row);
    setPlacedId(row.id);
    if (placedTimerRef.current) clearTimeout(placedTimerRef.current);
    placedTimerRef.current = setTimeout(() => setPlacedId(null), 1800);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        fontFamily: IS,
      }}
    >
      {/* Sticky header band — mirrors the right panel's PenPreview header. */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          background: 'var(--dir-raised)',
          padding: '14px 16px 12px',
          borderBottom: '1px solid var(--dir-border)',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span style={SECTION_LABEL}>My doodles</span>
        {state.phase === 'ready' && state.rows.length > 0 && (
          <span
            style={{
              fontFamily: IS,
              fontSize: 10,
              fontStyle: 'italic',
              color: 'var(--dir-text-body-soft)',
            }}
          >
            {state.rows.length} across every desk
          </span>
        )}
      </div>

      <div
        style={{
          flex: 1,
          padding: '12px 12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {state.phase === 'loading' && <DrawerNote>Opening your drawer…</DrawerNote>}

        {state.phase === 'error' && (
          <DrawerNote>
            Couldn’t reach your drawer.
            <button
              onClick={() => setRetryNonce((n) => n + 1)}
              style={{ ...PILL, marginTop: 10, padding: '4px 12px', fontSize: 10 }}
            >
              Retry
            </button>
          </DrawerNote>
        )}

        {state.phase === 'ready' && state.rows.length === 0 && (
          <DrawerNote>
            Your drawer is empty — every doodle you make lands here, whichever
            desk it’s on.
          </DrawerNote>
        )}

        {state.phase === 'ready' &&
          state.rows.map((row) => (
            <DrawerRow
              key={row.id}
              row={row}
              deskLabel={
                row.desk_id
                  ? (state.deskNames.get(row.desk_id) ?? 'A desk')
                  : 'Shared desk'
              }
              here={row.desk_id === viewedDeskId}
              placed={placedId === row.id}
              onPlace={() => handlePlace(row)}
            />
          ))}
      </div>

      {/* Honest one-record footer (#29) — only when there's something to lose. */}
      {state.phase === 'ready' && state.rows.length > 0 && (
        <div
          style={{
            padding: '10px 16px 14px',
            borderTop: '1px solid var(--dir-border)',
            fontFamily: IS,
            fontSize: 10,
            fontStyle: 'italic',
            lineHeight: 1.6,
            color: 'var(--dir-text-body-soft)',
          }}
        >
          Removing a doodle removes it from your drawer too.
        </div>
      )}
    </div>
  );
}

/** Quiet centered copy for the loading / error / empty states. */
function DrawerNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '28px 12px',
        fontFamily: IS,
        fontSize: 11,
        lineHeight: 1.7,
        color: 'var(--dir-text-body-soft)',
      }}
    >
      {children}
    </div>
  );
}

/** ~52px mini-doodle inside the 64px art well (MiniDesk sizing spirit). */
const ART_PX = 52;

function DrawerRow({
  row,
  deskLabel,
  here,
  placed,
  onPlace,
}: {
  row: DoodleRow;
  deskLabel: string;
  here: boolean;
  placed: boolean;
  onPlace: () => void;
}) {
  // Normalize small, then sanitize on read before injection — the exact
  // MiniDesk order + the same XSS rule the desk feed rows use.
  const markup = useMemo(
    () => sanitizeSvgMarkup(normalizeSvgSize(row.svg, ART_PX)),
    [row.svg],
  );

  const chipText = here ? `${deskLabel} · here` : deskLabel;

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: 10,
        border: '1px solid var(--dir-border)',
        borderRadius: 12,
        background: 'var(--dir-bg)',
      }}
    >
      {/* The art well — the shared warm-paper stock, mini. */}
      <div
        aria-hidden
        style={{
          flexShrink: 0,
          width: 64,
          height: 64,
          borderRadius: 8,
          border: '1px solid var(--dir-border)',
          backgroundColor: 'var(--dir-bg)',
          backgroundImage: `${PAPER_GRAIN}, ${WARM_POOL}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
        dangerouslySetInnerHTML={{ __html: markup }}
      />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          justifyContent: 'center',
        }}
      >
        {/* Name — the ObjectCard register (Fraunces soft/wonk), mini scale. */}
        <div
          title={row.name ?? undefined}
          style={{
            fontFamily: ISe,
            fontVariationSettings: '"SOFT" 60, "WONK" 1',
            fontSize: 14,
            letterSpacing: '-0.01em',
            color: row.name ? 'var(--dir-text-primary)' : 'var(--dir-text-body-soft)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.name || 'Untitled doodle'}
        </div>

        {/* Which desk this record lives on (+ a quiet mark when in view). */}
        <span
          title={chipText}
          style={{
            ...CHIP,
            display: 'inline-block',
            boxSizing: 'border-box',
            alignSelf: 'flex-start',
            maxWidth: '100%',
            padding: '2px 8px',
            fontSize: 9,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'var(--dir-text-secondary)',
          }}
        >
          {chipText}
        </span>

        {/* Place here = COPY (#28) — original stays put, a new row lands on
            the open desk via DeskPage's addObject (P-1 placement). */}
        <button
          onClick={onPlace}
          disabled={placed}
          title="Place a copy of this doodle on the current desk — the original stays put"
          style={{
            ...PILL,
            alignSelf: 'flex-start',
            padding: '3px 10px',
            fontSize: 9,
            ...(placed
              ? {
                  background: 'var(--dir-raised)',
                  borderColor: 'var(--dir-accent)',
                  color: 'var(--dir-text-primary)',
                  cursor: 'default',
                }
              : {}),
          }}
        >
          {placed ? 'Placed ✓' : 'Place here'}
        </button>
      </div>
    </div>
  );
}
