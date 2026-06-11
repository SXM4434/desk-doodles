import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router';
import { getStroke } from 'perfect-freehand';
import { IS, ISe } from '../../lib/typography';
import { PILL, CTA } from '../../lib/chromeStyles';
import { SvgStyleTransform } from '../canvas/SvgStyleTransform';
import { SmartHachureChrome } from '../chrome/SmartHachureChrome';
import {
  CollapsiblePanel,
  PanelToggle,
  useMinimizeUi,
  usePanelOpen,
} from '../chrome/CollapsiblePanel';

type StrokePoint = [number, number, number]; // x, y, pressure
type Stroke = { id: string; points: StrokePoint[] };

const STROKE_OPTS = {
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
function strokeToPolygonPath(points: StrokePoint[]): string {
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
function strokeToPolylinePath(points: StrokePoint[]): string {
  if (points.length === 0) return '';
  return points.reduce(
    (acc, [x, y], i) => acc + (i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`),
    '',
  );
}

type CanvasMode = 'svg' | '3d';
type InputMode = 'draw' | 'upload-svg' | 'upload-image';

export function DeskDoodlesCanvas() {
  const [mode, setMode] = useState<CanvasMode>('svg');
  const [input, setInput] = useState<InputMode>('draw');
  const [leftOpen, toggleLeft, setLeftOpen] = usePanelOpen('canvas.left');
  const [rightOpen, toggleRight, setRightOpen] = usePanelOpen('canvas.right');
  useMinimizeUi([
    { open: leftOpen, setOpen: setLeftOpen },
    { open: rightOpen, setOpen: setRightOpen },
  ]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--dir-bg)',
        color: 'var(--dir-text-primary)',
        fontFamily: IS,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top chrome — brand left, mode toggle center, publish right */}
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
          <PanelToggle
            side="left"
            open={leftOpen}
            label="Input"
            onToggle={toggleLeft}
            controlsId="canvas-left-panel"
          />
        </div>

        <div
          role="tablist"
          aria-label="Canvas mode"
          style={{
            display: 'inline-flex',
            border: '1px solid var(--dir-border)',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          {(['svg', '3d'] as CanvasMode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              style={{
                fontFamily: IS,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '8px 16px',
                background: mode === m ? 'var(--dir-accent)' : 'transparent',
                color: mode === m ? 'var(--dir-bg)' : 'var(--dir-text-body)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {m === 'svg' ? '2D' : '3D'}
            </button>
          ))}
        </div>

        <div style={{ justifySelf: 'end', display: 'flex', gap: 8, alignItems: 'center' }}>
          <PanelToggle
            side="right"
            open={rightOpen}
            label="Controls"
            onToggle={toggleRight}
            controlsId="canvas-right-panel"
          />
          <button
            disabled
            title="Publish wiring lands Day 9"
            style={{
              ...CTA,
              cursor: 'not-allowed',
              opacity: 0.5,
            }}
          >
            Publish
          </button>
        </div>
      </header>

      {/* Body — left dock + main canvas + right Smart Hachure chrome */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left dock */}
        <CollapsiblePanel
          side="left"
          open={leftOpen}
          width={280}
          id="canvas-left-panel"
          style={{
            borderRight: '1px solid var(--dir-border)',
            background: 'var(--dir-raised)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Input section */}
          <section style={{ padding: 24, borderBottom: '1px solid var(--dir-border)' }}>
            <h2
              style={{
                fontFamily: IS,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--dir-text-secondary)',
                margin: '0 0 16px 0',
              }}
            >
              Input
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(
                [
                  ['draw', 'Draw'],
                  ['upload-svg', 'Upload SVG'],
                  ['upload-image', 'Upload image'],
                ] as [InputMode, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setInput(key)}
                  style={{
                    ...PILL,
                    width: '100%',
                    textAlign: 'center',
                    textTransform: 'none',
                    letterSpacing: 'normal',
                    fontSize: 13,
                    fontWeight: 400,
                    padding: '10px 14px',
                    background: input === key ? 'var(--dir-bg)' : 'transparent',
                    color: 'var(--dir-text-primary)',
                    borderColor: input === key ? 'var(--dir-accent)' : 'var(--dir-border)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Settings section */}
          <section style={{ padding: 24, flex: 1 }}>
            <h2
              style={{
                fontFamily: IS,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--dir-text-secondary)',
                margin: '0 0 16px 0',
              }}
            >
              Settings
            </h2>
            <p
              style={{
                fontFamily: IS,
                fontSize: 13,
                color: 'var(--dir-text-body-soft)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Style picker + Smart Hachure controls wire in Day 7. Engine is already in repo
              (lib/smartHachure/, lib/f3HandFeel.ts).
            </p>
          </section>
        </CollapsiblePanel>

        {/* Main canvas area */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: 48,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'var(--dir-bg)',
          }}
        >
          <DrawSurface mode={mode} input={input} />
        </main>
        {/* Right chrome — Smart Hachure modifier panel from the audit/playground */}
        <CollapsiblePanel
          side="right"
          open={rightOpen}
          width={360}
          id="canvas-right-panel"
          style={{
            borderLeft: '1px solid var(--dir-border)',
            background: 'var(--dir-raised)',
            overflowY: 'auto',
          }}
        >
          <SmartHachureChrome />
        </CollapsiblePanel>
      </div>
    </div>
  );
}

// ─── DrawSurface — pointer-event freehand capture + SvgStyleTransform render ──

function DrawSurface({ mode, input }: { mode: CanvasMode; input: InputMode }) {
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

  function handleFilePick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so same file can be re-uploaded
    if (!file) return;
    if (!/\.svg$/i.test(file.name) && !file.type.includes('svg')) {
      setUploadError(`Not an SVG file: ${file.name}`);
      return;
    }
    try {
      const text = await file.text();
      // Light sanitization — strip <script> + on* event handlers so an uploaded
      // file can't execute. The markup will be passed to dangerouslySetInnerHTML
      // inside the source layer so SvgStyleTransform can clone + transform it.
      const sanitized = text
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '');
      const match = sanitized.match(/<svg[\s\S]*?<\/svg>/i);
      if (!match) {
        setUploadError('Could not find <svg> in file.');
        return;
      }
      setUploadedSvg({ name: file.name, markup: match[0] });
      setUploadError(null);
    } catch (err) {
      setUploadError(`Read failed: ${(err as Error).message}`);
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
          <SvgStyleTransform>
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
                  padding: '10px 22px',
                  fontFamily: IS,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  border: '1px solid var(--dir-text-primary)',
                  borderRadius: 999,
                  background: 'var(--dir-bg)',
                  color: 'var(--dir-text-primary)',
                  cursor: 'pointer',
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
          Reopen lets user keep drawing after a Done. */}
      {!isUpload && strokes.length > 0 && (
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
                padding: '6px 16px',
                fontFamily: IS,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                border: '1px solid var(--dir-text-primary)',
                borderRadius: 999,
                background: 'var(--dir-text-primary)',
                color: 'var(--dir-bg)',
                cursor: 'pointer',
              }}
            >
              Done ({strokes.length})
            </button>
          ) : (
            <button
              onClick={reopenForEdit}
              style={{
                padding: '6px 12px',
                fontFamily: IS,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                border: '1px solid var(--dir-border)',
                borderRadius: 999,
                background: 'var(--dir-bg)',
                color: 'var(--dir-text-body)',
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
          )}
          <button
            onClick={clearAll}
            style={{
              padding: '6px 12px',
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              border: '1px solid var(--dir-border)',
              borderRadius: 999,
              background: 'var(--dir-bg)',
              color: 'var(--dir-text-body)',
              cursor: 'pointer',
            }}
          >
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
          <button
            onClick={handleFilePick}
            style={{
              padding: '6px 12px',
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              border: '1px solid var(--dir-border)',
              borderRadius: 999,
              background: 'var(--dir-bg)',
              color: 'var(--dir-text-body)',
              cursor: 'pointer',
            }}
          >
            Replace
          </button>
          <button
            onClick={clearUpload}
            style={{
              padding: '6px 12px',
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              border: '1px solid var(--dir-border)',
              borderRadius: 999,
              background: 'var(--dir-bg)',
              color: 'var(--dir-text-body)',
              cursor: 'pointer',
            }}
          >
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
