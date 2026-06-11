import { type CSSProperties } from 'react';
import { IS, ISe } from '../../lib/typography';
import { SvgStyleTransform } from '../canvas/SvgStyleTransform';

// ─── ObjectCard — the collectible read-view of one doodle record ─────────────
// Per docs/design/object-model-and-desk-architecture.md §"The object card":
// one component, used at three moments — the create-reveal (name your fresh
// doodle), the inspect/sandbox panel, and the drawer (mini density). It is a
// VIEW of the record (name / why / owner / render); never a settings panel.
//
// Craft bar (feedback_no_cheap_polish): TCG-tall, the doodle IS the art on a
// warm paper well, a graphite name-banner, a quiet why-line, an owner footer.
// Simple but beautiful — one render, restraint over ornament.

// Warm paper grain for the art well (same whisper as the desk surface).
const ART_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.05'/%3E%3C/svg%3E\")";

export type ObjectCardProps = {
  svgMarkup: string;
  name?: string | null;
  why?: string | null;
  /** Owner handle, or null/undefined for an anonymous maker. */
  owner?: string | null;
  /** ISO timestamp; shown as a quiet date in the footer if present. */
  createdAt?: string | null;
  /** Mini density for the drawer/binder grid (art + name only). */
  mini?: boolean;
  /** Embedded — drop the card's own shell because it already lives inside a
   *  card-like container (e.g. the ObjectSurface modal IS the card). Prevents
   *  a card-inside-a-card. The art well stays (it's the doodle's frame). */
  embedded?: boolean;
  /** Editable mode (Create/Edit) — name + why become inputs. */
  editable?: boolean;
  onNameChange?: (v: string) => void;
  onWhyChange?: (v: string) => void;
};

const CARD_W = 300;

export function ObjectCard({
  svgMarkup,
  name,
  why,
  owner,
  createdAt,
  mini = false,
  embedded = false,
  editable = false,
  onNameChange,
  onWhyChange,
}: ObjectCardProps) {
  const width = embedded ? '100%' : mini ? 168 : CARD_W;

  // Embedded drops the shell (no second card around the modal); standalone
  // keeps the full collectible-card surface (drawer/binder use).
  const shell: CSSProperties = embedded
    ? {
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        fontFamily: IS,
      }
    : {
        width,
        boxSizing: 'border-box',
        background: 'var(--dir-raised)',
        border: '1px solid var(--dir-border)',
        borderRadius: 16,
        boxShadow:
          '0 12px 36px color-mix(in srgb, var(--dir-text-primary) 9%, transparent), 0 2px 8px color-mix(in srgb, var(--dir-text-primary) 6%, transparent)',
        padding: mini ? 10 : 16,
        display: 'flex',
        flexDirection: 'column',
        gap: mini ? 8 : 12,
        fontFamily: IS,
      };

  // The art well — a warm paper square the doodle sits on, like a framed scrap.
  const artWell: CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: '1 / 1',
    backgroundColor: 'var(--dir-bg)',
    backgroundImage: `${ART_GRAIN}, radial-gradient(ellipse 72% 66% at 50% 44%, rgba(255,246,229,0.5) 0%, rgba(255,246,229,0) 64%)`,
    border: '1px solid var(--dir-border)',
    borderRadius: 10,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const marks = countMarks(svgMarkup);

  return (
    <div style={shell}>
      {/* Name banner + the one stat (marks = stroke count), set like a TCG
          card's HP: name left, stat top-right. One stat, restraint. */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        {editable ? (
          <input
            value={name ?? ''}
            onChange={(e) => onNameChange?.(e.target.value)}
            placeholder="Name your doodle"
            aria-label="Doodle name"
            maxLength={60}
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: ISe,
              fontSize: mini ? 15 : 20,
              letterSpacing: '-0.01em',
              color: 'var(--dir-text-primary)',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--dir-border)',
              outline: 'none',
              padding: '2px 0',
            }}
          />
        ) : (
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: ISe,
              fontSize: mini ? 14 : 20,
              letterSpacing: '-0.01em',
              color: name ? 'var(--dir-text-primary)' : 'var(--dir-text-body-soft)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {name || 'Untitled doodle'}
          </div>
        )}
        {!mini && marks > 0 && (
          <span
            title="Marks — how many strokes make up this doodle"
            style={{
              flexShrink: 0,
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-secondary)',
              whiteSpace: 'nowrap',
            }}
          >
            {marks} {marks === 1 ? 'mark' : 'marks'}
          </span>
        )}
      </div>

      {/* The art — the doodle itself, rendered through the live style. */}
      <div style={artWell}>
        <div style={{ width: '76%', height: '76%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SvgStyleTransform wrapperOverride={{ display: 'block', width: '100%', height: '100%' }}>
            <div
              style={{ width: '100%', height: '100%' }}
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />
          </SvgStyleTransform>
        </div>
      </div>

      {/* Mini cards stop here — art + name is enough for the binder grid. */}
      {!mini && (
        <>
          {/* Why-line — the maker's one line, the IKEA-effect attachment hook. */}
          {editable ? (
            <input
              value={why ?? ''}
              onChange={(e) => onWhyChange?.(e.target.value)}
              placeholder="Why's this on your desk?"
              aria-label="Why this doodle"
              style={{
                fontFamily: IS,
                fontSize: 13,
                fontStyle: 'italic',
                color: 'var(--dir-text-body)',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: '100%',
              }}
            />
          ) : (
            why && (
              <div
                style={{
                  fontFamily: IS,
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: 'var(--dir-text-body-soft)',
                  lineHeight: 1.45,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {why}
              </div>
            )
          )}

          {/* Footer — owner + quiet date, divided from the body. */}
          <div
            style={{
              marginTop: 2,
              paddingTop: 10,
              borderTop: '1px solid var(--dir-border)',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 8,
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-secondary)',
            }}
          >
            <span>{owner ? `@${owner}` : 'Anonymous'}</span>
            {createdAt && (
              <span style={{ fontWeight: 500, letterSpacing: '0.04em', color: 'var(--dir-text-body-soft)' }}>
                {formatCardDate(createdAt)}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Quiet, human date for the card footer (e.g. "Jun 11"; adds the year only
 *  for older cards). Returns null for unparseable input so the span is skipped. */
function formatCardDate(iso: string): string | null {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString(undefined, opts);
  } catch {
    return null;
  }
}

/** Count the drawable marks (strokes/shapes) in an SVG — the card's one stat.
 *  Regex over element tags; deterministic, cheap, tolerant of odd markup. */
function countMarks(svgMarkup: string): number {
  const m = svgMarkup.match(/<(path|line|polyline|circle|rect|ellipse|polygon)\b/gi);
  return m ? m.length : 0;
}
