import { Suspense, lazy, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from '../../lib/typography';
import { PILL, CTA, SECTION_LABEL } from '../../lib/chromeStyles';
import { Canvas3DProvider, useCanvas3D } from '../../state/Canvas3DContext';
import { useF3RoughModifiers } from '../../state/F3RoughModifiersContext';
// Type-only import — erased at compile, keeps three out of the main chunk.
import type { HatchInputs } from '../canvas3d/hatchMaterial';

// CTA mixes PILL's `border` shorthand with a `borderColor` longhand — React
// dev warns when such conflicting styles diff across renders. Collapse to a
// single shorthand at this call site (chromeStyles is shared, owned elsewhere).
const { borderColor: _ctaBorderColor, ...CTA_REST } = CTA;
const CTA_PILL: CSSProperties = { ...CTA_REST, border: `1px solid ${String(_ctaBorderColor)}` };
import { SmartHachureChrome } from '../chrome/SmartHachureChrome';
import { Canvas3DChrome } from '../chrome/Canvas3DChrome';
import {
  CollapsiblePanel,
  PanelToggle,
  useMinimizeUi,
  usePanelOpen,
} from '../chrome/CollapsiblePanel';
// DrawSurface + stroke helpers extracted to DrawSurface.tsx 2026-06-11
// (mechanical move — also hosted by the /desk DrawPanel popup).
import { DrawSurface, type CanvasMode, type InputMode, type Stroke } from './DrawSurface';

// ─── 3D wiring (plan §2.3) ───────────────────────────────────────────────────
// React.lazy keeps three + drei (~600KB gz) out of the main chunk — /desk and
// 2D-only sessions never pay it. NOTHING ELSE in this file may import from
// canvas3d/ or geometry3d/ at module level (a static value import would pull
// three back into the main chunk). Make watch item: lazy chunks are standard
// Vite output but unverified in Make preview — fallback = static import.
const Stroke3DSceneLazy = lazy(() => import('../canvas3d'));

/** Mirror of canvas3d/Stroke3DScene MAX_STROKES_3D — keep in sync by hand
 *  (importing the real constant would defeat the lazy chunk, see above). */
const MAX_STROKES_3D = 60;

/** Honest in-frame note (same register as DrawSurface's GATE_STYLE copy). */
function FrameNote({ title, body }: { title: string; body: ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: IS,
        fontSize: 11,
        color: 'var(--dir-text-secondary)',
        letterSpacing: '0.04em',
        textAlign: 'center',
      }}
    >
      <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{title}</span>
      <span>{body}</span>
    </div>
  );
}

/** Provider shell — the 3D control state lives page-wide so the header pills
 *  (chrome) and the canvas overlay read the same values, and so DrawSurface
 *  can read useCanvas3D() directly once the main thread swaps its honesty
 *  gate (plan §2.4 — provider here instead of App.tsx keeps /desk untouched;
 *  useCanvas3D falls back to defaults when unprovided). */
export function DeskDoodlesCanvas() {
  return (
    <Canvas3DProvider>
      <DeskDoodlesCanvasPage />
    </Canvas3DProvider>
  );
}

function DeskDoodlesCanvasPage() {
  const [mode, setMode] = useState<CanvasMode>('svg');
  const [input, setInput] = useState<InputMode>('draw');
  // CURRENT stroke pool, lifted out of DrawSurface via its onStrokesChange
  // mirror (DrawSurface keeps ownership of capture; this is a read-only copy
  // — the 3D scene is fed the SAME strokes the 2D surface holds, so flipping
  // the mode tab converts exactly what's drawn).
  const [strokes3d, setStrokes3d] = useState<Stroke[]>([]);
  const { geometryMode, style3d, materialPreset, nativeProps, hatchGrammar, hatchDirection, modeParams } =
    useCanvas3D();
  const { state: mods } = useF3RoughModifiers();
  const strokePoints = useMemo(() => strokes3d.map((s) => s.points), [strokes3d]);
  // Live 2D Shading values → hatch/svg-port uniforms (one math, four
  // renderers): the SAME F3RoughModifiers state the 2D pen reads + the Hatch
  // STYLE toggles (grammar/direction, symmetry-law gap cell §1). Memo keyed on
  // the consumed fields only, so unrelated 2D toggles don't churn the prop.
  const hatchInputs = useMemo<HatchInputs>(
    () => ({
      hachureGap: mods.hachureGap,
      hachureAngle: mods.hachureAngle,
      strokeWidth: mods.strokeWidth,
      inkIntensity: mods.inkIntensity,
      fillStyle: mods.fillStyle,
      wobble: mods.wobble,
      fillOpacity: mods.fillOpacity,
      grammar: hatchGrammar,
      direction: hatchDirection,
    }),
    [
      mods.hachureGap,
      mods.hachureAngle,
      mods.strokeWidth,
      mods.inkIntensity,
      mods.fillStyle,
      mods.wobble,
      mods.fillOpacity,
      hatchGrammar,
      hatchDirection,
    ],
  );
  const [leftOpen, toggleLeft, setLeftOpen] = usePanelOpen('canvas.left');
  const [rightOpen, toggleRight, setRightOpen] = usePanelOpen('canvas.right');
  useMinimizeUi([
    { open: leftOpen, setOpen: setLeftOpen },
    { open: rightOpen, setOpen: setRightOpen },
  ]);

  return (
    <div
      style={{
        // Definite height (not min-height) so the canvas frame's maxHeight
        // chain resolves — the page never scrolls; the frame fits the
        // leftover space the flex layout measures, no estimated pixels.
        height: '100vh',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                  ...PILL,
                  border: 'none',
                  borderRadius: 0,
                  background: mode === m ? 'var(--dir-accent)' : 'transparent',
                  color: mode === m ? 'var(--dir-bg)' : 'var(--dir-text-body)',
                }}
              >
                {m === 'svg' ? '2D' : '3D'}
              </button>
            ))}
          </div>
          {/* Round-7 chrome split (3d-mode-controls-spec §5): the geometry
              control moved from header pills into the right panel's GEOMETRY
              cluster (Canvas3DChrome) — still shell chrome per
              feedback_toggles_always_in_chrome, now beside its full per-mode
              param set. Only the 2D|3D MODE pair stays in the header. */}
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
            title="Publishing lives on /desk — this page is the test surface"
            style={{
              ...CTA_PILL,
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
            <h2 style={{ ...SECTION_LABEL, margin: '0 0 16px 0' }}>
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
                  // Intentional PILL override — sentence-case 13/400 type for the dock (locked 2026-06-10).
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
                    // Full shorthand (not borderColor) so the selected-state
                    // swap never mixes shorthand + longhand (React dev warning).
                    border: input === key ? '1px solid var(--dir-accent)' : '1px solid var(--dir-border)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Settings section */}
          <section style={{ padding: 24, flex: 1 }}>
            <h2 style={{ ...SECTION_LABEL, margin: '0 0 16px 0' }}>
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
              Style + Smart Hachure controls live in the Controls panel on the right.
            </p>
          </section>
        </CollapsiblePanel>

        {/* Main canvas area */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            padding: 48,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'var(--dir-bg)',
          }}
        >
          {/* Sizing wrapper duplicates DrawSurface's own frame constraints
              (920 max / 4:3) so the 3D overlay can sit EXACTLY over the frame
              without editing DrawSurface — its internal honesty gate stays
              underneath until the main thread swaps it (plan §2.3). */}
          <div
            style={{
              width: '100%',
              maxWidth: 920,
              maxHeight: '100%',
              aspectRatio: '800 / 600',
              position: 'relative',
            }}
          >
            <DrawSurface mode={mode} input={input} onStrokesChange={setStrokes3d} />
            {mode === '3d' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 6,
                  overflow: 'hidden',
                  border: '1px solid var(--dir-border)',
                  background: 'var(--dir-bg)',
                }}
              >
                {strokePoints.length > 0 ? (
                  <Suspense fallback={<FrameNote title="Loading 3D" body="Fetching the geometry engine…" />}>
                    <Stroke3DSceneLazy
                      strokes={strokePoints}
                      geometryMode={geometryMode}
                      style3d={style3d}
                      materialPreset={materialPreset}
                      nativeProps={nativeProps}
                      modeParams={modeParams}
                      hatchInputs={hatchInputs}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </Suspense>
                ) : (
                  <FrameNote
                    title="Nothing to convert yet"
                    body={
                      <>
                        Draw strokes in 2D first — then flip back to 3D.
                        <br />
                        Upload→3D is the hard path (vision router) — drawn strokes only for now.
                      </>
                    }
                  />
                )}
                {strokePoints.length > MAX_STROKES_3D && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      left: 10,
                      fontFamily: IS,
                      fontSize: 10,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: 'var(--dir-text-body-soft)',
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: 'var(--dir-raised)',
                      border: '1px solid var(--dir-border)',
                    }}
                  >
                    First {MAX_STROKES_3D} of {strokePoints.length} strokes shown
                  </span>
                )}
              </div>
            )}
          </div>
        </main>
        {/* Right chrome — THE ROUND-7 SPLIT (3d-mode-controls-spec §0.1, locked):
            2D mode → the 2D SVG chrome; 3D mode → 3D controls ONLY. The 2D
            chrome reappears in 3D solely under Canvas3DChrome's SVG-port
            style, where it drives the ported treatment. */}
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
          {mode === '3d' ? <Canvas3DChrome /> : <SmartHachureChrome />}
        </CollapsiblePanel>
      </div>
    </div>
  );
}
