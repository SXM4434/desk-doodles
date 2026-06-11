import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { IS, ISe } from '../../lib/typography';
import { SECTION_LABEL } from '../../lib/chromeStyles';
import { listDesks, type DeskRow } from '../../lib/publish';
import { sanitizeSvgMarkup } from '../../lib/svgUpload';

// ─── DeskGallery — the public "wall of walls" (/desks) ──────────────────────
// Grounds in docs/design/object-model-and-desk-architecture.md, Multi-desk
// section: "Gallery to browse past desks — a newest-first grid of desk cards.
// Keep it simple." Each card is a VIEW of a desk RECORD (the doc's unifying
// frame): name + object-count + a cached preview_svg thumbnail. Clicking a
// card opens that desk at /desk?desk=<desk_index> (DeskPage reads the param).
//
// Two load states are not crashes: a pre-v2 DB makes listDesks return [] and a
// thrown listDesks (any other failure) is caught here — both show a friendly
// empty state per the prompt's GRACEFUL FALLBACK requirement.

type LoadState =
  | { phase: 'loading' }
  | { phase: 'ready'; desks: DeskRow[] }
  | { phase: 'error' };

export function DeskGallery() {
  const [state, setState] = useState<LoadState>({ phase: 'loading' });
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    listDesks()
      .then((desks) => {
        if (!cancelled) setState({ phase: 'ready', desks });
      })
      .catch(() => {
        // Table absent / network / RLS — never crash the gallery.
        if (!cancelled) setState({ phase: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const desks = state.phase === 'ready' ? state.desks : [];
  // "Empty" covers both the genuine no-desks-yet case and the caught error —
  // both render the same friendly placeholder rather than a crash.
  const isEmpty = state.phase === 'error' || (state.phase === 'ready' && desks.length === 0);

  return (
    <div
      style={{
        // Definite height (not min-height) — same viewport-fit chain as /desk
        // and /canvas: header is auto, the grid body takes the leftover and
        // scrolls internally so the page chrome never scrolls.
        height: '100vh',
        background: 'var(--dir-bg)',
        color: 'var(--dir-text-primary)',
        fontFamily: IS,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top chrome — brand left, title center, back-to-open-desk right */}
      <header
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--dir-border)',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 24,
          background: 'var(--dir-bg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NavLink
            to="/"
            style={{
              fontFamily: ISe,
              fontSize: 18,
              letterSpacing: '-0.01em',
              color: 'var(--dir-text-primary)',
              textDecoration: 'none',
            }}
          >
            Desk Doodles
          </NavLink>
        </div>

        <div style={{ ...SECTION_LABEL, justifySelf: 'center' }}>The wall of walls</div>

        <div style={{ justifySelf: 'end', display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Back to the open desk — bare /desk opens whichever desk is current. */}
          <NavLink
            to="/desk"
            style={{
              fontFamily: IS,
              fontSize: 13,
              color: 'var(--dir-text-body)',
              textDecoration: 'none',
            }}
          >
            Back to the desk →
          </NavLink>
        </div>
      </header>

      {/* Body — scrollable grid of desk cards */}
      <main style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '32px 24px' }}>
        {state.phase === 'loading' && (
          <div style={centeredNoteStyle}>Loading the wall…</div>
        )}

        {state.phase !== 'loading' && isEmpty && (
          <div style={centeredNoteStyle}>
            No desks on the wall yet.<br />
            Be the first — start doodling and your desk shows up here.
            <div style={{ marginTop: 16 }}>
              <NavLink
                to="/desk"
                style={{
                  fontFamily: IS,
                  fontSize: 13,
                  color: 'var(--dir-link-color)',
                  textDecoration: 'none',
                }}
              >
                Start doodling →
              </NavLink>
            </div>
          </div>
        )}

        {state.phase === 'ready' && !isEmpty && (
          <div
            style={{
              display: 'grid',
              // Responsive: as many ~240px columns as fit, then stretch.
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 20,
              maxWidth: 1280,
              marginInline: 'auto',
            }}
          >
            {desks.map((desk) => (
              <DeskCard
                key={desk.id}
                desk={desk}
                onOpen={() => navigate(`/desk?desk=${desk.desk_index}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const centeredNoteStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  textAlign: 'center',
  color: 'var(--dir-text-body-soft)',
  fontFamily: IS,
  fontSize: 13,
  lineHeight: 1.7,
} as const;

function DeskCard({ desk, onOpen }: { desk: DeskRow; onOpen: () => void }) {
  const [hover, setHover] = useState(false);
  const full = desk.object_count >= desk.object_cap;

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        // Card frame — non-interactive radius band (6–16); raised surface with
        // a border per the F1 bordered-card pattern. The whole card is the
        // click target so it reads as one collectible tile, not a form.
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        padding: 0,
        textAlign: 'left',
        background: 'var(--dir-raised)',
        border: '1px solid var(--dir-border)',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: hover ? '0 6px 20px color-mix(in srgb, var(--dir-text-primary) 10%, transparent)' : 'none',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'box-shadow 0.18s ease-out, transform 0.18s ease-out, border-color 0.15s',
        borderColor: hover ? 'var(--dir-text-body-soft)' : 'var(--dir-border)',
        font: 'inherit',
        color: 'inherit',
      }}
    >
      {/* Thumbnail — cached preview_svg (sanitized on read) or empty placeholder */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '4 / 3',
          width: '100%',
          background: 'var(--dir-recessed)',
          borderBottom: '1px solid var(--dir-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {desk.preview_svg ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            // preview_svg is server-cached but still untrusted markup → sanitize
            // on read before dangerouslySetInnerHTML, exactly like the feed rows.
            dangerouslySetInnerHTML={{ __html: sanitizeSvgMarkup(desk.preview_svg) }}
          />
        ) : (
          <EmptyDeskThumb />
        )}

        {/* Live indicator — the single currently-open desk (is_open, partial
            unique index guarantees exactly one). Sits over the thumbnail. */}
        {desk.is_open && (
          <span
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 999,
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              background: 'var(--dir-bg)',
              border: '1px solid var(--dir-border)',
              color: 'var(--dir-text-body)',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: 'var(--dir-accent)',
                display: 'inline-block',
              }}
            />
            Live
          </span>
        )}
      </div>

      {/* Caption row — desk name (prominent, ISe) + object-count badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 16px',
        }}
      >
        <span
          style={{
            fontFamily: ISe,
            fontSize: 17,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: 'var(--dir-text-primary)',
            // Long fun names (e.g. "Golden Hour Cafecito") stay on the card.
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
          title={desk.name}
        >
          {desk.name}
        </span>

        <span
          style={{
            flexShrink: 0,
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: 999,
            // Full desks read as "closed/complete"; filling desks stay neutral.
            background: full ? 'var(--dir-chip-bg)' : 'transparent',
            border: '1px solid var(--dir-border)',
            color: full ? 'var(--dir-text-body)' : 'var(--dir-text-secondary)',
          }}
          title={full ? 'This desk is full' : `${desk.object_count} of ${desk.object_cap} objects`}
        >
          {desk.object_count} / {desk.object_cap}
          {full ? ' · Full' : ''}
        </span>
      </div>
    </button>
  );
}

/** Tasteful empty-desk placeholder — a faint inline mark, no external asset. */
function EmptyDeskThumb() {
  return (
    <svg
      width="64"
      height="48"
      viewBox="0 0 64 48"
      fill="none"
      aria-hidden
      style={{ opacity: 0.5 }}
    >
      {/* A simple desk-surface horizon line with a stray dot — reads as an
          empty desk waiting for its first doodle. Deterministic, no randomness. */}
      <line x1="8" y1="34" x2="56" y2="34" stroke="var(--dir-text-body-soft)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="32" cy="22" r="6" stroke="var(--dir-text-body-soft)" strokeWidth="1.5" />
    </svg>
  );
}
