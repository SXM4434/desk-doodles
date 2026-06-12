import { useEffect, useRef, useState } from 'react';
import { IS } from '../../lib/typography';
import { PILL, CTA, SECTION_LABEL, RAISED_SHADOW } from '../../lib/chromeStyles';
import { DrawSurface, strokeToPolylinePath, type Stroke } from './DrawSurface';
import { prepareSvgUpload } from '../../lib/svgUpload';
import { normalizeSvgSize } from '../../lib/normalizeInput';
import { Dropdown } from '../chrome/Dropdown';
import { Slider } from '../chrome/Slider';
import { SLIDER_SPECS, MODIFIER_SETS_BY_STYLE, UNIVERSAL_MODIFIERS } from '../chrome/modifierSpecs';
import { useF3SvgStyle, F3_SVG_STYLES } from '../../state/F3SvgStyleContext';
import { useF3RoughModifiers, DEFAULT_MODIFIERS } from '../../state/F3RoughModifiersContext';
import { applyStylePreset } from '../canvas/SvgStyleTransform';
import { SurfaceControls } from './ObjectSurface';

type PanelInput = 'draw' | 'upload-svg' | 'upload-image';

// ─── DrawPanel — modal popup hosting DrawSurface for the real desk flow ──────
// Per docs/memory/project_desk_doodles_draw_panel_vs_desk_canvas.md: the draw
// panel is a popup that produces ONE object per Done. DeskPage owns the
// objects array; this panel only captures strokes and hands back markup.
// The panel unmounts on close, so its stroke state clears automatically —
// every open is a fresh draw session.
//
// CREATE-AS-MINI-DESK (Sebs 2026-06-11, ratified): the popup uses the same
// side-by-side grammar as the Sandbox surface — drawing canvas on the LEFT,
// pen controls column on the RIGHT. The column reads/writes the SAME
// F3SvgStyleContext + F3RoughModifiersContext the desk panel uses (D-7: two
// surfaces, ONE pen — values set here are the values the desk panel shows,
// and the next doodle renders with them at Done).

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

/** Tabbable elements inside the dialog, in DOM order. Computed fresh per
 *  keypress so input-mode switches (draw ↔ upload) and disabled-state flips
 *  (Done) never leave the trap holding a stale list. display:none elements
 *  (the hidden file input) return zero client rects and drop out. */
function getFocusables(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]'),
  ).filter(
    (el) =>
      !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.getClientRects().length > 0,
  );
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
  const dialogRef = useRef<HTMLDivElement>(null);

  // ── THE PEN (shared state — D-7) ──────────────────────────────────────────
  // Same contexts the desk panel's SmartHachureChrome reads/writes. The popup
  // column is a second face of the ONE pen: change wobble here, the desk
  // panel's wobble slider holds the same value after close. The style
  // dropdown mirrors the chrome's preset-snap semantics exactly so picking a
  // style behaves identically from either surface.
  const { state: svgStyle, setState: setSvgStyle } = useF3SvgStyle();
  const { state: mods, set: setMod } = useF3RoughModifiers();
  const declared = MODIFIER_SETS_BY_STYLE[svgStyle] ?? UNIVERSAL_MODIFIERS;
  const has = (k: string) => (declared as readonly string[]).includes(k);

  // Escape cancels — standard dialog convention. Bubble phase on window, so
  // an open Dropdown popover (capture-phase document listener that stops
  // propagation) closes itself first: one press, one layer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  // ── FOCUS: initial move-in + restore-to-opener ───────────────────────────
  // On open, focus the first control (the Draw pill — aria-modal demands
  // focus lands inside). On close, DeskPage unmounts us, so the cleanup
  // returns focus to whatever opened the panel (the Add-doodle pill), if it
  // still exists. theme.css's button:focus-visible rule draws the ring.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    if (dialog) (getFocusables(dialog)[0] ?? dialog).focus();
    return () => {
      if (opener && document.contains(opener)) opener.focus();
    };
  }, []);

  // ── FOCUS TRAP: Tab cycles inside the dialog, Shift+Tab reverses ─────────
  // Document-level so the trap still works if focus ever lands on the body
  // (e.g. after a pointer interaction with the non-focusable canvas svg) —
  // the next Tab pulls focus back to the first control instead of escaping
  // into the page behind the scrim.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = getFocusables(dialog);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !dialog.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

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
          like dropdown option rows inside the 16px popover). Width sized for
          the mini-desk row: canvas + pen column side by side. */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Draw a doodle"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--dir-raised)',
          border: '1px solid var(--dir-border)',
          borderRadius: 16,
          boxShadow: RAISED_SHADOW,
          padding: 20,
          width: 'min(1180px, calc(100vw - 48px))',
          height: 'min(820px, calc(100vh - 48px))',
          maxHeight: 'calc(100vh - 48px)',
          // The DIALOG never scrolls (Sebs: only the right panel scrolls; the
          // canvas just fills the popup's fixed size). overflow hidden forces
          // the flex chain to clamp; the controls column scrolls internally.
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          fontFamily: IS,
          outline: 'none',
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

        {/* MINI-DESK ROW (Sebs 2026-06-11, ratified): canvas on the left, pen
            controls on the right — the same side-by-side grammar as the
            Sandbox surface and the big desk itself (canvas + right panel).
            flexWrap lets narrow viewports fall back to stacked. */}
        <div style={{ display: 'flex', gap: 18, alignItems: 'stretch', flex: 1, minHeight: 0 }}>
          <div
            style={{
              flex: '1 1 420px',
              minWidth: 320,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {input === 'draw' && (
              /* DrawSurface in draw mode — in-frame Done/Edit/Clear pills hidden;
                 the panel's own Done/Cancel below are the commit chrome. */
              <DrawSurface
                mode="svg"
                input="draw"
                hideActions
                fill
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
                 no fake controls. No time commitments in the copy either. */
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
                  Image upload is coming — it will trace your picture into
                  desk-ready linework. For now, draw it or upload an SVG.
                </p>
              </div>
            )}
          </div>

          {/* PEN CONTROLS COLUMN — the desk panel's pen, second face. Style
              dropdown + the three core feel sliders (same specs + gating as
              SmartHachureChrome, writing to the SAME contexts — one pen).
              Border-left + paddingLeft mirrors the Sandbox column grammar. */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              flex: '1 1 240px',
              minWidth: 220,
              minHeight: 0,
              borderLeft: '1px solid var(--dir-border)',
              paddingLeft: 18,
              alignSelf: 'stretch',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span style={SECTION_LABEL}>Pen</span>
              <span
                style={{
                  fontFamily: IS,
                  fontSize: 10,
                  fontStyle: 'italic',
                  color: 'var(--dir-text-body-soft)',
                  whiteSpace: 'nowrap',
                }}
              >
                one pen — shared with the desk panel
              </span>
            </div>

            {/* FULL per-style control set (feedback_never_trim_control_sets —
                Sebs hit "missing toggles" 3x before this stuck): the SAME
                generic spec-table renderer the Edit/Sandbox popups use. The
                column scrolls internally; dropdown menus stay short so there
                is never scroll-inside-scroll. */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
              <SurfaceControls
                svgStyle={svgStyle}
                mods={mods}
                onStyle={(nextStyle) => {
                  setSvgStyle(nextStyle);
                  // Auto-snap modifiers to the new style's preset — EXACTLY the
                  // desk chrome's onChange, so the pen behaves identically no
                  // matter which surface picks the style.
                  const next = applyStylePreset(mods, nextStyle);
                  (Object.keys(next) as (keyof typeof next)[]).forEach((k) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setMod(k, (next as any)[k]);
                  });
                }}
                onMod={setMod}
                onReset={() => {
                  const next = applyStylePreset(DEFAULT_MODIFIERS, svgStyle);
                  (Object.keys(next) as (keyof typeof next)[]).forEach((k) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setMod(k, (next as any)[k]);
                  });
                }}
              />
            </div>
          </div>
        </div>

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
                    : 'Image upload is coming — draw it or upload an SVG'
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
