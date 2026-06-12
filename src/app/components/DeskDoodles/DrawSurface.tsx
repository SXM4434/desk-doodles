import { useEffect, useRef, useState } from 'react';
import { getStroke } from 'perfect-freehand';
import { IS } from '../../lib/typography';
import { PILL, CTA } from '../../lib/chromeStyles';
import { SvgStyleTransform } from '../canvas/SvgStyleTransform';
import { prepareSvgUpload } from '../../lib/svgUpload';

// ─── DrawSurface — pointer-event freehand capture + SvgStyleTransform render ──
// Extracted 2026-06-11 from DeskDoodlesCanvas.tsx (mechanical move, zero
// behavior change on /canvas). Hosted by BOTH the /canvas page and the
// DrawPanel popup in the real desk flow (/desk).

export type StrokePoint = [number, number, number]; // x, y, pressure
export type Stroke = { id: string; points: StrokePoint[] };

export type CanvasMode = 'svg' | '3d';
export type InputMode = 'draw' | 'upload-svg' | 'upload-image';

export const STROKE_OPTS = {
  size: 4,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t: number) => t,
  simulatePressure: true,
};

/** Convert raw stroke points to a perfect-freehand polygon d-string.
 *  Used for the FOREGROUND live-stroke and CLEAN-style background render —
 *  produces the variable-width inked-stroke look. */
export function strokeToPolygonPath(points: StrokePoint[]): string {
  if (points.length === 0) return '';
  const outline = getStroke(points, STROKE_OPTS);
  if (outline.length === 0) return '';
  return outline.reduce(
    (acc, [x, y], i) => acc + (i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`),
    '',
  ) + ' Z';
}

/** Convert raw stroke points to a stroke-only polyline d-string (no fill).
 *  Used for the BACKGROUND Smart-Hachure-styled render — Smart Hachure's
 *  outline pipeline filters out filled paths, so we feed it a stroke-only
 *  version of the user's gesture instead. Loses variable-width character
 *  but gains style-pipeline transformability (wobble / jaggedness / etc). */
/** Build the stroke-only SVG markup for ONE desk object — the polyline
 *  commit-layer form (fill="none" + stroke) that survives Smart Hachure,
 *  same shape as /canvas's committed layer (its outline pipeline drops
 *  filled paths). The viewBox is the tight bbox of the gesture (+pad) so
 *  normalizeSvgSize at the desk's add boundary scales the DOODLE to
 *  ~180px, not the whole 800×600 draw frame. */
export function strokesToObjectMarkup(strokes: Stroke[]): string {
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

/** Size-guard a stroke record (strokes-in-the-record contract): round coords,
 *  then halve point density until the JSON fits the row budget (~45KB). */
export function capStrokes(raw: Stroke[]): StrokePoint[][] {
  let pts: StrokePoint[][] = raw.map((st) =>
    st.points.map(([x, y, pr]) => [
      Math.round(x * 10) / 10,
      Math.round(y * 10) / 10,
      Math.round(pr * 100) / 100,
    ] as StrokePoint),
  );
  while (JSON.stringify(pts).length > 45000) {
    const before = JSON.stringify(pts).length;
    pts = pts.map((st) =>
      st.length > 8 ? st.filter((_, i) => i % 2 === 0 || i === st.length - 1) : st,
    );
    if (JSON.stringify(pts).length >= before) break;
  }
  return pts;
}

export function strokeToPolylinePath(points: StrokePoint[]): string {
  if (points.length === 0) return '';
  return points.reduce(
    (acc, [x, y], i) => acc + (i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`),
    '',
  );
}

// In-frame action pill — PILL at the smaller in-canvas scale, on paper so the
// buttons read over strokes. Shared by Edit / Clear / Replace.
const FRAME_PILL = {
  ...PILL,
  padding: '6px 12px',
  fontSize: 10,
  background: 'var(--dir-bg)',
};

// CTA mixes PILL's `border` shorthand with a `borderColor` longhand — React
// dev warns when such conflicting styles diff across renders (the Done↔Edit
// button swap reuses the same DOM node, so the diff is live here). Collapse
// to a single shorthand at this call site (chromeStyles is shared, owned
// elsewhere).
const { borderColor: _ctaBorderColor, ...CTA_REST } = CTA;
const CTA_PILL = { ...CTA_REST, border: `1px solid ${String(_ctaBorderColor)}` };

// Shared copy block for the honesty gates (3D mode + image upload) — an
// opaque cover over the live 2D surface so a not-yet-real mode never shows
// dead-looking controls. State underneath stays intact.
const GATE_STYLE = {
  position: 'absolute' as const,
  inset: 0,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  background: 'var(--dir-bg)',
  fontFamily: IS,
  fontSize: 11,
  color: 'var(--dir-text-secondary)',
  letterSpacing: '0.04em',
  textAlign: 'center' as const,
};

export function DrawSurface({
  mode,
  input,
  onStrokesChange,
  hideActions,
  fill,
  styled,
  initialStrokes,
}: {
  mode: CanvasMode;
  input: InputMode;
  /** Optional live mirror of the preview-stroke pool. Lets a host (DrawPanel)
   *  supply its own Done control and build the commit-layer markup itself.
   *  Pass a stable callback (a useState setter) — fired from an effect. */
  onStrokesChange?: (strokes: Stroke[]) => void;
  /** Hide the in-frame Done/Edit/Clear pills when the host supplies its own
   *  commit chrome (DrawPanel's Done/Cancel). /canvas leaves this unset. */
  hideActions?: boolean;
  /** Fill the parent box (popup mini-desk) instead of clamping to 4:3 —
   *  the inner SVG letterboxes via its viewBox either way. */
  fill?: boolean;
  /** DRAW | STYLE mode (Sebs 2026-06-12: "drawing shouldn't stop when pen
   *  lifts, but we can't play with toggles while it's raw — the user needs a
   *  way IN and OUT"). Controlled by the host's Draw|Style pill pair:
   *    · false/undefined (Draw): strokes stay RAW ink; pen-up changes
   *      nothing; keep sketching forever.
   *    · true (Style): drawing pauses (pointer ignored), the strokes render
   *      through the SAME SvgStyleTransform pipeline and re-style LIVE as
   *      the pen controls change. Flip back to keep drawing.
   *  /canvas leaves this unset — its Done/Edit commit flow is unchanged. */
  styled?: boolean;
  /** Preload the canvas with stored strokes (Re-draw: the object's recorded
   *  gesture comes back editable — the record keeps the hand). */
  initialStrokes?: StrokePoint[][];
}) {
  // PREVIEW strokes — gestures the user has finished pen-up on but hasn't
  // committed yet. While in this state they render as raw perfect-freehand
  // polygons so the user sees their drawing AS DRAWN, not pre-styled.
  const [strokes, setStrokes] = useState<Stroke[]>(() =>
    (initialStrokes ?? []).map((points, i) => ({ id: `loaded-${i}`, points })),
  );
  // CURRENT stroke — the one being actively dragged.
  const [current, setCurrent] = useState<Stroke | null>(null);
  // COMMITTED — flip to true when user hits "Done." Only then do the
  // strokes flow through SvgStyleTransform / Smart Hachure. Until then
  // pen-up just adds another stroke to the preview pool. Sebs: "if I stop
  // drawing and lift it shouldn't auto-add the object until I choose to be done."
  const [committed, setCommitted] = useState(false);
  const [uploadedSvg, setUploadedSvg] = useState<{ name: string; markup: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mirror the preview pool out to an optional host (DrawPanel).
  useEffect(() => {
    onStrokesChange?.(strokes);
  }, [strokes, onStrokesChange]);

  function handleFilePick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so same file can be re-uploaded
    if (!file) return;
    // Shared upload prep — type check + <svg> extraction + DOMPurify sanitize
    // (lib/svgUpload), the SAME sanitizer the desk feed uses. Replaces the old
    // inline regex strip (weaker: missed unquoted on* handlers, javascript:
    // hrefs, <foreignObject>, etc.). Returns ok+name+markup or ok:false+error.
    const result = await prepareSvgUpload(file);
    if (result.ok) {
      // SIZE NORMALIZATION at the upload boundary — an <svg> with a viewBox
      // but no width/height renders 0×0 when injected (found 2026-06-11 via
      // fixture diagnostic: rose worked only because it carried explicit
      // attrs). Force the root svg to fill its frame; the viewBox letterboxes
      // content. Desk-object normalization (~180px, normalizeSvgSize) stays
      // at the desk-canvas boundary per the locked auto-resize decision.
      const markup = result.markup.replace(
        /<svg\b([^>]*)>/i,
        (_m, attrs: string) => {
          // No viewBox? Derive one from the source width/height BEFORE
          // stripping them — otherwise forcing 100% leaves raw pixel coords
          // with no mapping and big files overflow the frame (rose bug,
          // Sebs 2026-06-12: "this still not resizing stuff").
          let viewBox = '';
          if (!/viewBox=/i.test(attrs)) {
            const w = parseFloat((attrs.match(/\swidth="([\d.]+)/i) || [])[1] ?? '');
            const h = parseFloat((attrs.match(/\sheight="([\d.]+)/i) || [])[1] ?? '');
            if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
              viewBox = ` viewBox="0 0 ${w} ${h}"`;
            }
          }
          const cleaned = attrs
            .replace(/\swidth="[^"]*"/i, '')
            .replace(/\sheight="[^"]*"/i, '');
          return `<svg${cleaned}${viewBox} width="100%" height="100%">`;
        },
      );
      setUploadedSvg({ name: result.name, markup });
      setUploadError(null);
    } else {
      setUploadError(result.error);
    }
  }

  function clearUpload() {
    setUploadedSvg(null);
    setUploadError(null);
  }

  // (Removed the smartHachure param-set + reload — engine defaults ON now;
  // the reload caused the white flash. ?smartHachure=0 opts out.)

  function eventToSvgPoint(e: React.PointerEvent): StrokePoint {
    const svg = svgRef.current;
    if (!svg) return [e.clientX, e.clientY, 0.5];
    // Map screen coords into SVG viewBox coords via the inverse screen CTM —
    // otherwise strokes drawn at e.g. (200, 100) land at tiny viewBox
    // coordinates when the canvas is rendered smaller than its 800×600 viewBox.
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) {
      const rect = svg.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top, e.pressure || 0.5];
    }
    const svgPt = pt.matrixTransform(ctm.inverse());
    return [svgPt.x, svgPt.y, e.pressure || 0.5];
  }

  function handlePointerDown(e: React.PointerEvent) {
    // Style mode pauses drawing — flip back to Draw to keep sketching.
    if (styled) return;
    if (input !== 'draw' || mode === '3d') return;
    (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
    setCurrent({ id: `s-${Date.now()}`, points: [eventToSvgPoint(e)] });
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!current) return;
    setCurrent((s) => (s ? { ...s, points: [...s.points, eventToSvgPoint(e)] } : null));
  }

  function handlePointerUp() {
    if (!current || current.points.length < 2) { setCurrent(null); return; }
    setStrokes((prev) => [...prev, current]);
    setCurrent(null);
  }

  function clearAll() {
    setStrokes([]);
    setCurrent(null);
    setCommitted(false);
  }

  function commitDrawing() {
    if (strokes.length === 0) return;
    setCommitted(true);
  }

  function reopenForEdit() {
    setCommitted(false);
  }

  const allStrokes = current ? [...strokes, current] : strokes;
  const VIEWBOX_W = 800;
  const VIEWBOX_H = 600;
  const isUpload = input === 'upload-svg';

  return (
    <div
      style={{
        width: '100%',
        ...(fill
          ? { height: '100%' }
          : { maxWidth: 920, maxHeight: '100%', aspectRatio: `${VIEWBOX_W} / ${VIEWBOX_H}` }),
        position: 'relative',
        background: 'var(--dir-bg)',
        border: '1px solid var(--dir-border)',
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      {/* Hidden file input — surfaces native file picker on click. */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {/* UPLOAD-SVG branch — when uploaded, render through SvgStyleTransform
          so the uploaded SVG picks up the active style/modifiers. */}
      {isUpload && uploadedSvg && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <SvgStyleTransform
            wrapperOverride={{ display: 'block', width: '100%', height: '100%' }}
          >
            <div
              style={{ width: '100%', height: '100%' }}
              dangerouslySetInnerHTML={{ __html: uploadedSvg.markup }}
            />
          </SvgStyleTransform>
        </div>
      )}
      {/* Layer 1a — when COMMITTED (or the host's Style mode is on), strokes
          flow through SvgStyleTransform so they pick up the active style and
          re-render live as the pen controls change. */}
      {(committed || styled) && strokes.length > 0 && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <SvgStyleTransform
            wrapperOverride={{ display: 'block', width: '100%', height: '100%' }}
          >
            <svg
              viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
              width="100%"
              height="100%"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              {strokes.map((stroke) => (
                <path
                  key={stroke.id}
                  d={strokeToPolylinePath(stroke.points)}
                  fill="none"
                  stroke="var(--dir-text-primary)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </svg>
          </SvgStyleTransform>
        </div>
      )}
      {/* Layer 1b — while NOT committed (and not live-styling), render strokes
          raw as perfect-freehand polygons so user sees what they drew, unstyled. */}
      {!committed && !styled && strokes.length > 0 && (
        <svg
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          aria-hidden
        >
          {strokes.map((stroke) => (
            <path
              key={stroke.id}
              d={strokeToPolygonPath(stroke.points)}
              fill="var(--dir-text-primary)"
              stroke="none"
            />
          ))}
        </svg>
      )}
      {/* Layer 2: live in-progress stroke + pointer capture surface */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          inset: 0,
          cursor: input === 'draw' ? 'crosshair' : 'default',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {current && (
          <path
            d={strokeToPolygonPath(current.points)}
            fill="var(--dir-text-primary)"
            fillOpacity={0.9}
            stroke="none"
          />
        )}
      </svg>
      {/* Empty-state hint — DRAW mode: warm sentence-case invitation (was
          shouty uppercase; warmth pass 2026-06-11). UPLOAD-SVG mode: prompt
          to pick a file. Upload-image is covered by its honesty gate below. */}
      {((input === 'draw' && allStrokes.length === 0) || (isUpload && !uploadedSvg)) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: IS,
            fontSize: 13,
            color: 'var(--dir-text-body-soft)',
            gap: 12,
            pointerEvents: isUpload ? 'auto' : 'none',
          }}
        >
          {isUpload ? (
            <>
              <button
                onClick={handleFilePick}
                style={{
                  ...PILL,
                  padding: '10px 22px',
                  background: 'var(--dir-bg)',
                  // Heavier primary-ink border is the empty-state affordance —
                  // this is THE action in an otherwise blank frame. Full
                  // shorthand, never borderColor over PILL's shorthand
                  // (React dev warns on shorthand/longhand style conflicts).
                  border: '1px solid var(--dir-text-primary)',
                }}
              >
                Pick an .svg file
              </button>
              {uploadError && (
                <span style={{ color: 'var(--dir-accent)', fontSize: 11, textTransform: 'none' }}>
                  {uploadError}
                </span>
              )}
            </>
          ) : (
            <>Draw your doodle</>
          )}
        </div>
      )}
      {/* Draw-mode action buttons — Done commits to Smart Hachure, Clear resets,
          Reopen lets user keep drawing after a Done. Hidden when a host panel
          (DrawPanel) supplies its own Done/Cancel chrome. */}
      {!hideActions && !isUpload && strokes.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            gap: 6,
            alignItems: 'center',
          }}
        >
          {!committed ? (
            <button
              onClick={commitDrawing}
              style={{
                ...CTA_PILL,
                padding: '6px 16px',
                fontSize: 10,
                letterSpacing: '0.06em',
              }}
            >
              Done ({strokes.length})
            </button>
          ) : (
            <button onClick={reopenForEdit} style={FRAME_PILL}>
              Edit
            </button>
          )}
          <button onClick={clearAll} style={FRAME_PILL}>
            Clear
          </button>
        </div>
      )}
      {isUpload && uploadedSvg && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontFamily: IS,
              color: 'var(--dir-text-body-soft)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: 999,
              background: 'var(--dir-raised)',
              border: '1px solid var(--dir-border)',
            }}
          >
            {uploadedSvg.name}
          </span>
          <button onClick={handleFilePick} style={FRAME_PILL}>
            Replace
          </button>
          <button onClick={clearUpload} style={FRAME_PILL}>
            Clear
          </button>
        </div>
      )}
      {/* IMAGE-UPLOAD HONESTY GATE — same treatment as the 3D gate: an opaque
          cover instead of a dead canvas (no file picker, no inert controls).
          The autotrace path (stretch S1) is what makes image→object real;
          until then SVG upload is the working route. State underneath stays
          intact; switching input restores it. */}
      {input === 'upload-image' && (
        <div style={GATE_STYLE}>
          <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>
            Image upload is coming
          </span>
          <span>SVG upload works today — switch input to Upload SVG.</span>
        </div>
      )}
      {/* 3D HONESTY GATE — opaque placeholder covers the live 2D surface so the
          toggle doesn't lie. Strokes/upload state stay intact underneath; flipping
          back to 2D restores everything. Rendered LAST so it wins over the
          image-upload gate if both apply. */}
      {mode === '3d' && (
        <div style={GATE_STYLE}>
          <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>3D mode is being wired</span>
          <span>Rod &amp; Extrude geometry built from your strokes — landing soon.</span>
        </div>
      )}
    </div>
  );
}
