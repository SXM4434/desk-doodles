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

export function DrawSurface({
  mode,
  input,
  onStrokesChange,
  hideActions,
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
}) {
  // PREVIEW strokes — gestures the user has finished pen-up on but hasn't
  // committed yet. While in this state they render as raw perfect-freehand
  // polygons so the user sees their drawing AS DRAWN, not pre-styled.
  const [strokes, setStrokes] = useState<Stroke[]>([]);
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
          const cleaned = attrs
            .replace(/\swidth="[^"]*"/i, '')
            .replace(/\sheight="[^"]*"/i, '');
          return `<svg${cleaned} width="100%" height="100%">`;
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

  // Auto-enable Smart Hachure on canvas page (same opt-in pattern as /audit).
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('smartHachure') !== '1') {
      url.searchParams.set('smartHachure', '1');
      window.history.replaceState({}, '', url.toString());
      window.location.reload();
    }
  }, []);

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
        maxWidth: 920,
        // Clamp to the height the flex layout actually gives the main column
        // — tall windows keep 4:3, short ones clamp and the inner SVG
        // letterboxes via its viewBox. Page never scrolls.
        maxHeight: '100%',
        aspectRatio: `${VIEWBOX_W} / ${VIEWBOX_H}`,
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
      {/* Layer 1a — when COMMITTED, strokes flow through SvgStyleTransform so
          they pick up the active style (rough-handdrawn / wet-ink / etc). */}
      {committed && strokes.length > 0 && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <SvgStyleTransform>
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
      {/* Layer 1b — while NOT committed, render strokes raw as perfect-freehand
          polygons so user sees what they drew, unstyled. */}
      {!committed && strokes.length > 0 && (
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
            fillOpacity={0.5}
            stroke="none"
          />
        )}
      </svg>
      {/* Empty-state hint — DRAW mode: prompt to draw. UPLOAD mode: prompt to pick file. */}
      {((!isUpload && allStrokes.length === 0) || (isUpload && !uploadedSvg)) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: IS,
            fontSize: 12,
            color: 'var(--dir-text-body-soft)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
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
                  // this is THE action in an otherwise blank frame.
                  borderColor: 'var(--dir-text-primary)',
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
            <>Draw on the canvas · mode = {mode === 'svg' ? '2D' : '3D'} · input = {input}</>
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
                ...CTA,
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
      {/* 3D HONESTY GATE — opaque placeholder covers the live 2D surface so the
          toggle doesn't lie. Strokes/upload state stay intact underneath; flipping
          back to 2D restores everything. Real 3D (Rod + Extrude) lands Day 11. */}
      {mode === '3d' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: 'var(--dir-bg)',
            fontFamily: IS,
            fontSize: 11,
            color: 'var(--dir-text-secondary)',
            letterSpacing: '0.04em',
            textAlign: 'center',
          }}
        >
          <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>3D mode lands Day 11</span>
          <span>Rod &amp; Extrude geometry built from your strokes — coming 06-12.</span>
        </div>
      )}
    </div>
  );
}
