import { useEffect, useRef, useState } from 'react';
import { IS } from '../../lib/typography';
import { PILL, CTA, SECTION_LABEL, RAISED_SHADOW } from '../../lib/chromeStyles';
import { DrawSurface, strokeToPolylinePath, type Stroke } from './DrawSurface';
import { prepareSvgUpload } from '../../lib/svgUpload';
import { normalizeSvgSize } from '../../lib/normalizeInput';

type PanelInput = 'draw' | 'upload-svg' | 'upload-image';

// ─── DrawPanel — modal popup hosting DrawSurface for the real desk flow ──────
// Per docs/memory/project_desk_doodles_draw_panel_vs_desk_canvas.md: the draw
// panel is a popup that produces ONE object per Done. DeskPage owns the
// objects array; this panel only captures strokes and hands back markup.
// The panel unmounts on close, so its stroke state clears automatically —
// every open is a fresh draw session.

/** Build the stroke-only SVG markup for ONE desk object — the polyline
 *  commit-layer form (fill="none" + stroke) that survives Smart Hachure,
 *  same shape as /canvas's committed layer (its outline pipeline drops
 *  filled paths). The viewBox is the tight bbox of the gesture (+pad) so
 *  normalizeSvgSize at the desk's add boundary scales the DOODLE to
 *  ~180px, not the whole 800×600 draw frame. */
function strokesToObjectMarkup(strokes: Stroke[]): string {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const stroke of strokes) {
    for (const [x, y] of stroke.points) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  const pad = 6; // breathing room for the 3px stroke + round caps
  const r = (v: number) => (Math.round(v * 100) / 100).toString();
  const vb = `${r(minX - pad)} ${r(minY - pad)} ${r(maxX - minX + pad * 2)} ${r(maxY - minY + pad * 2)}`;
  const paths = strokes
    .map(
      (stroke) =>
        `<path d="${strokeToPolylinePath(stroke.points)}" fill="none" stroke="var(--dir-text-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${paths}</svg>`;
}

export function DrawPanel({
  onDone,
  onCancel,
  rightInset = 0,
}: {
  /** Receives the stroke-only SVG markup for the ONE object this session made. */
  onDone: (svgMarkup: string) => void;
  onCancel: () => void;
  /** px width of an open right controls panel (the desk's). The scrim reserves
   *  this on the right so the modal centers over the desk working area, not
   *  behind the panel. Default 0 — /canvas (no such panel) is unaffected. */
  rightInset?: number;
}) {
  // Live mirror of DrawSurface's preview-stroke pool — setState is a stable
  // callback, so the mirror effect in DrawSurface doesn't re-fire on renders.
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  // Input mode — same trio as the /canvas dock. Upload-svg hands the
  // sanitized markup straight to the desk's add boundary (normalizeSvgSize
  // sizes it there); upload-image is an honest stub until autotrace (S1).
  const [input, setInput] = useState<PanelInput>('draw');
  const [upload, setUpload] = useState<{ name: string; markup: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Escape cancels — standard dialog convention.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const canDone =
    input === 'draw' ? strokes.length > 0 : input === 'upload-svg' ? upload !== null : false;

  function handleDone() {
    if (input === 'draw' && strokes.length > 0) {
      onDone(strokesToObjectMarkup(strokes));
    } else if (input === 'upload-svg' && upload) {
      onDone(upload.markup);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const result = await prepareSvgUpload(file);
    if (result.ok) {
      setUpload({ name: result.name, markup: result.markup });
      setUploadError(null);
    } else {
      setUpload(null);
      setUploadError(result.error);
    }
  }

  return (
    // Overlay scrim — click outside the panel cancels.
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'color-mix(in srgb, var(--dir-text-primary) 28%, transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        // Reserve an open right controls panel's width so the modal centers over
        // the desk area, not behind it. Default 0 (e.g. on /canvas).
        paddingRight: 32 + rightInset,
      }}
    >
      {/* Centered panel — W1 raised surface, popover radius 16 (chromeStyles
          canon); nested DrawSurface frame keeps its 6px radius (concentric
          like dropdown option rows inside the 16px popover). */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Draw a doodle"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--dir-raised)',
          border: '1px solid var(--dir-border)',
          borderRadius: 16,
          boxShadow: RAISED_SHADOW,
          padding: 20,
          width: 'min(760px, calc(100vw - 64px))',
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          fontFamily: IS,
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ ...SECTION_LABEL }}>Add a doodle</h2>
          <span style={{ ...SECTION_LABEL, color: 'var(--dir-text-body-soft)' }}>
            {input === 'draw'
              ? strokes.length === 0
                ? 'Each Done adds one object'
                : `${strokes.length} stroke${strokes.length === 1 ? '' : 's'}`
              : input === 'upload-svg'
                ? (upload?.name ?? 'Pick a file')
                : 'Coming with autotrace'}
          </span>
        </header>

        {/* Input mode row — same trio + sentence-case pill idiom as the
            /canvas dock (locked 2026-06-10). */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(
            [
              ['draw', 'Draw'],
              ['upload-svg', 'Upload SVG'],
              ['upload-image', 'Upload image'],
            ] as [PanelInput, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setInput(key)}
              // Intentional PILL override — sentence-case 13/400 (dock idiom).
              style={{
                ...PILL,
                flex: 1,
                textAlign: 'center',
                textTransform: 'none',
                letterSpacing: 'normal',
                fontSize: 13,
                fontWeight: 400,
                padding: '8px 14px',
                background: input === key ? 'var(--dir-bg)' : 'transparent',
                color: 'var(--dir-text-primary)',
                borderColor: input === key ? 'var(--dir-accent)' : 'var(--dir-border)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {input === 'draw' && (
          /* DrawSurface in draw mode — in-frame Done/Edit/Clear pills hidden;
             the panel's own Done/Cancel below are the commit chrome. */
          <DrawSurface
            mode="svg"
            input="draw"
            hideActions
            onStrokesChange={setStrokes}
          />
        )}

        {input === 'upload-svg' && (
          <div
            style={{
              minHeight: 260,
              border: '1px solid var(--dir-border)',
              borderRadius: 6,
              background: 'var(--dir-bg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: 24,
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".svg,image/svg+xml"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {upload ? (
              /* Preview the picked file at thumbnail scale — the desk's add
                 boundary does the real ~180px normalization on Done. */
              <div
                style={{ width: 180, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                dangerouslySetInnerHTML={{
                  // normalizeSvgSize derives a viewBox from width/height when one
                  // is missing and sizes the longest axis to 180px — fixes the
                  // no-viewBox preview clip the gap sweep flagged. Markup is
                  // already DOMPurify-sanitized by prepareSvgUpload upstream, so
                  // this is purely a sizing improvement.
                  __html: normalizeSvgSize(upload.markup, 180),
                }}
              />
            ) : (
              <p style={{ fontFamily: IS, fontSize: 13, color: 'var(--dir-text-body-soft)', margin: 0 }}>
                The file becomes one desk object, sized to the desk automatically.
              </p>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              // Heavier border = empty-state affordance (canvas dock precedent).
              style={{ ...PILL, padding: '10px 22px', background: 'var(--dir-bg)', borderColor: 'var(--dir-text-primary)' }}
            >
              {upload ? 'Pick a different file' : 'Pick an .svg file'}
            </button>
            {uploadError && (
              <p style={{ fontFamily: IS, fontSize: 12, color: 'var(--dir-accent)', margin: 0 }}>
                {uploadError}
              </p>
            )}
          </div>
        )}

        {input === 'upload-image' && (
          /* Honest stub — image→object needs the autotrace path (stretch S1);
             no fake controls per feedback_actual_ml_not_fake's spirit. */
          <div
            style={{
              minHeight: 260,
              border: '1px solid var(--dir-border)',
              borderRadius: 6,
              background: 'var(--dir-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <p
              style={{
                fontFamily: IS,
                fontSize: 13,
                color: 'var(--dir-text-body-soft)',
                margin: 0,
                textAlign: 'center',
                lineHeight: 1.5,
                maxWidth: 380,
              }}
            >
              Image upload becomes a desk object via autotrace — that path
              lands after the core 3D work. For now, draw it or upload an SVG.
            </p>
          </div>
        )}

        <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel} style={PILL}>
            Cancel
          </button>
          <button
            onClick={handleDone}
            disabled={!canDone}
            title={
              canDone
                ? 'Add this doodle to the desk'
                : input === 'draw'
                  ? 'Draw something first'
                  : input === 'upload-svg'
                    ? 'Pick a file first'
                    : 'Image upload lands with autotrace'
            }
            style={{
              ...CTA,
              opacity: canDone ? 1 : 0.5,
              cursor: canDone ? 'pointer' : 'not-allowed',
            }}
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
