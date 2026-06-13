import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from '../../lib/typography';
import { PILL, CTA, SECTION_LABEL } from '../../lib/chromeStyles';
import { Canvas3DProvider, useCanvas3D } from '../../state/Canvas3DContext';
import { useF3RoughModifiers } from '../../state/F3RoughModifiersContext';
import { useF3SvgStyle } from '../../state/F3SvgStyleContext';
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
import {
  DrawSurface,
  strokesToObjectMarkup,
  ToneShadeCluster,
  SHADE_TOOL_DEFAULT,
  type CanvasMode,
  type InputMode,
  type Stroke,
  type StrokePoint,
  type ToneFill,
  type ShadeToolState,
  type ShapeSnapApi,
} from './DrawSurface';
import { type ShapeCandidate, type ShapeFitResult, type SnapAction } from '../../lib/draw/shapeFit';
import { pushShapeSnapEntry, type ShapeSnapOutcome } from '../../lib/shapeSnapLog';
import { COVERAGE_BANDS } from '../../lib/smart/coverage';
// svg-port 3D: the offscreen REAL 2D render whose styled <svg> the form wears.
// Already in the main chunk (DrawSurface imports it) — no extra cost.
import { SvgStyleTransform } from '../canvas/SvgStyleTransform';

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

// ─── SnapChip — the shape-assist receipt (Rock F3) ───────────────────────────
// Mirrors DrawPanel.tsx's SnapChip (not exported there — that file belongs to
// another work lane). "Circle ▸" — tap to cycle the ranked candidates (incl.
// Original). Accent dot = a system act; fully rounded pill; no accent-ink bg
// per system rules. Lives by the SNAP/STRAIGHTEN pills.
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
  // Live mirror of the TONE-PATCH pool (the shade register's output) — same
  // stable-setState contract as strokes3d. Read-only here; the commit lives in
  // DrawSurface (its in-frame Done picks up tone alongside strokes).
  const [tone, setTone] = useState<ToneFill[]>([]);
  // Inspection mirror (the __dd_toneFills idiom, mirrored from DrawPanel): lets
  // verification tooling read the live tone record without driving a commit.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as unknown as Record<string, unknown>).__dd_toneFills = tone;
  }, [tone]);

  // ── DRAW-TOOL GAMBIT (parity with the /desk DrawPanel popup) ─────────────
  // INK | SHADE register — which tool the pointer wields while sketching
  // (round 7). Ink = strokes; Shade = the tone-fill brush. Only meaningful in
  // 2D draw mode; the chrome that surfaces it is gated on mode/input below.
  const [penRegister, setPenRegister] = useState<'ink' | 'shade'>('ink');
  const [shadeTool, setShadeTool] = useState<ShadeToolState>(SHADE_TOOL_DEFAULT);

  // FILL-TOOL NOTE — the honest-miss one-liner ("no closed region here…")
  // rides a self-clearing caption slot under the canvas (DrawPanel idiom).
  const [fillNote, setFillNote] = useState<string | null>(null);
  const fillNoteTimer = useRef<number | null>(null);
  const showFillNote = useCallback((note: string) => {
    setFillNote(note);
    if (fillNoteTimer.current) window.clearTimeout(fillNoteTimer.current);
    fillNoteTimer.current = window.setTimeout(() => {
      setFillNote(null);
      fillNoteTimer.current = null;
    }, 4000);
  }, []);
  useEffect(
    () => () => {
      if (fillNoteTimer.current) window.clearTimeout(fillNoteTimer.current);
    },
    [],
  );

  // ── SHAPE ASSIST (Rock F3) — SNAP / STRAIGHTEN action pills ───────────────
  // Freehand is the DEFAULT; SNAP / STRAIGHTEN are action VERBS on the LAST
  // stroke when tapped. DrawSurface owns the strokes + the apply; this page
  // owns the pills + the chip. Mirrors DrawPanel.tsx exactly (the reference).
  const snapApiRef = useRef<ShapeSnapApi | null>(null);
  const handleSnapApi = useCallback((api: ShapeSnapApi) => {
    snapApiRef.current = api;
  }, []);
  // The live snap chip: which stroke it targets, the ranked candidate list,
  // the cycle index, and the remembered ORIGINAL points (so 'original'
  // restores the drawn stroke without DrawSurface holding undo memory).
  type SnapChipState = {
    strokeId: string;
    action: SnapAction;
    candidates: ShapeCandidate[];
    index: number;
    originalPoints: StrokePoint[];
    margin: number;
  };
  const [snapChip, setSnapChip] = useState<SnapChipState | null>(null);
  // Ref mirror of the chip so the cycle/dismiss handlers can run their side
  // effects (api.applyToStroke → DrawSurface setState, logging) OUTSIDE the
  // setSnapChip updater. Calling a child's setState inside a parent's state
  // updater = "setState during render" (React dev warning) — the ref reads the
  // live value and keeps the side effects in the event-handler phase.
  const snapChipRef = useRef<SnapChipState | null>(snapChip);
  snapChipRef.current = snapChip;

  /** Log one shape-snap act into the unified decision log (training flywheel,
   *  spec §2.5/§8) — identical to DrawPanel's logSnap. */
  const logSnap = useCallback(
    (
      action: SnapAction,
      outcome: ShapeSnapOutcome,
      strokeId: string,
      result: ShapeFitResult,
      chosen: ShapeCandidate['kind'],
      margin: number,
    ) => {
      pushShapeSnapEntry({
        entryType: 'shape-snap',
        surface: 'shape-snap',
        action,
        outcome,
        strokeId,
        accepted: result.accepted,
        refusedReason: result.refusedReason,
        candidates: result.candidates.map((c) => ({
          kind: c.kind,
          normErr: c.normErr,
          score: c.score,
        })),
        chosen,
        margin,
      });
    },
    [],
  );

  /** Tap SNAP or STRAIGHTEN: fit the last stroke, apply the best candidate (or
   *  refuse honestly), raise the chip. Mirrors DrawPanel.tsx's runSnap. */
  const runSnap = useCallback(
    (action: SnapAction) => {
      const api = snapApiRef.current;
      if (!api) return;
      const last = api.lastStroke();
      if (!last) {
        showFillNote('nothing to snap — draw a stroke first');
        return;
      }
      const fit = api.fitLast(action);
      if (!fit) {
        showFillNote('that stroke is too small to snap');
        return;
      }
      const { strokeId, result } = fit;
      const real = result.candidates.filter((c) => c.kind !== 'original');
      const margin = real.length >= 2 ? real[0].score - real[1].score : real.length === 1 ? 1 : 0;
      if (!result.accepted) {
        logSnap(action, 'evaluate', strokeId, result, 'original', 0);
        showFillNote(
          action === 'snap'
            ? "didn't read as one clean shape — try Straighten"
            : "couldn't straighten that — it reads as a scribble",
        );
        return;
      }
      const best = result.candidates[0];
      api.applyToStroke(strokeId, best, last.points);
      logSnap(action, 'evaluate', strokeId, result, best.kind, margin);
      setSnapChip({
        strokeId,
        action,
        candidates: result.candidates,
        index: 0,
        originalPoints: last.points,
        margin,
      });
    },
    [logSnap, showFillNote],
  );

  /** Chip tap: cycle to the next ranked candidate (incl. 'original'), apply it
   *  live, log the cycle/revert. Side effects run in the event-handler phase
   *  (reading snapChipRef), then ONE pure setSnapChip bumps the index — so no
   *  child setState fires inside the updater (avoids setState-in-render). */
  const cycleSnapChip = useCallback(() => {
    const chip = snapChipRef.current;
    if (!chip) return;
    const api = snapApiRef.current;
    if (!api) return;
    const nextIndex = (chip.index + 1) % chip.candidates.length;
    const cand = chip.candidates[nextIndex];
    api.applyToStroke(chip.strokeId, cand, chip.originalPoints);
    pushShapeSnapEntry({
      entryType: 'shape-snap',
      surface: 'shape-snap',
      action: chip.action,
      outcome: cand.kind === 'original' ? 'revert' : 'cycle',
      strokeId: chip.strokeId,
      accepted: true,
      refusedReason: null,
      candidates: chip.candidates.map((c) => ({ kind: c.kind, normErr: c.normErr, score: c.score })),
      chosen: cand.kind,
      margin: chip.margin,
    });
    setSnapChip((prev) => (prev ? { ...prev, index: nextIndex } : prev));
  }, []);

  /** Dismiss the chip (keep the standing choice). Logged as 'keep'. The log
   *  side effect runs in the handler phase (reading snapChipRef), then one pure
   *  setSnapChip clears it — keeping the updater side-effect-free. */
  const dismissSnapChip = useCallback(() => {
    const chip = snapChipRef.current;
    if (!chip) return;
    const cand = chip.candidates[chip.index];
    pushShapeSnapEntry({
      entryType: 'shape-snap',
      surface: 'shape-snap',
      action: chip.action,
      outcome: 'keep',
      strokeId: chip.strokeId,
      accepted: true,
      refusedReason: null,
      candidates: chip.candidates.map((c) => ({ kind: c.kind, normErr: c.normErr, score: c.score })),
      chosen: cand.kind,
      margin: chip.margin,
    });
    setSnapChip(null);
  }, []);

  // Gap scrub → slider sync (DrawSurface fires once per ladder step; the
  // scrubbed value persists in the shared tool state — spec D-RF3).
  const handleGapChange = useCallback((gap: number) => {
    setShadeTool((prev) => (prev.gap === gap ? prev : { ...prev, gap }));
  }, []);

  // The draw-tool gambit only applies on the 2D drawing surface (mode svg +
  // draw input). In 3D or upload modes there are no live ink/tone strokes to
  // shade or snap, so the chrome and the shade prop are gated off there.
  const drawToolsActive = mode === 'svg' && input === 'draw';
  // SHADE only runs in the Ink|Shade register's Shade position AND only when
  // the draw tools are live (DrawSurface's own shade gate also checks
  // !styled/input/mode, but gating here keeps the chrome honest).
  const shadeActive = drawToolsActive && penRegister === 'shade';

  // SHAPE-ASSIST chip dismissal (spec §3): the chip's claim is about the prior
  // stroke, so it dismisses when a NEW stroke arrives, the register changes, or
  // the mode/input switches — DrawPanel's exact lifecycle. A key gates the
  // effect so it fires only on genuine change.
  const snapDismissKey = `${strokes3d.length}|${penRegister}|${mode}|${input}`;
  const prevSnapDismissKey = useRef(snapDismissKey);
  useEffect(() => {
    if (prevSnapDismissKey.current !== snapDismissKey) {
      prevSnapDismissKey.current = snapDismissKey;
      dismissSnapChip();
    }
  }, [snapDismissKey, dismissSnapChip]);

  const { geometryMode, style3d, materialPreset, nativeProps, hatchGrammar, hatchDirection, modeParams,
    setStyle3d, setGeometryMode } =
    useCanvas3D();
  const { state: mods } = useF3RoughModifiers();
  const { setState: setSvgStyle } = useF3SvgStyle();

  // DEV-only test seam: drive 3D + SVG style programmatically (verification
  // harnesses set these instead of clicking dropdown popovers). Stripped in
  // prod builds (import.meta.env.DEV guard).
  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return;
    (window as unknown as Record<string, unknown>).__ddSet = {
      setMode, setStyle3d, setGeometryMode, setSvgStyle,
    };
  }, [setStyle3d, setGeometryMode, setSvgStyle]);
  const strokePoints = useMemo(() => strokes3d.map((s) => s.points), [strokes3d]);

  // ── svg-port 3D: feed the scene the REAL styled 2D render ──────────────────
  // When style3d is svg-port, mount the actual SvgStyleTransform OFFSCREEN on
  // the current strokes (same source markup the 2D commit layer uses) and let
  // its onRender seam hand us the serialized styled <svg>. The 3D form then
  // wears that EXACT render (project_f3_shading_port_to_3d — real pipeline, not
  // a parallel shader). Re-renders live as strokes/style/Shading sliders change.
  const svgPortActive = mode === '3d' && style3d === 'svg-port' && strokePoints.length > 0;
  const [svgPortMarkup, setSvgPortMarkup] = useState<string | null>(null);
  const svgPortSource = useMemo(
    () => (svgPortActive ? strokesToObjectMarkup(strokes3d) : null),
    [svgPortActive, strokes3d],
  );
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
          {/* DRAW-TOOL GAMBIT row (parity with the /desk DrawPanel popup,
              mirrored 2026-06-13): the Ink|Shade register pair, the Snap +
              Straighten action pills (+ the candidate-cycling chip), and the
              honest-miss caption. Only on the 2D drawing surface — gone in 3D
              and upload modes (no live ink/tone there). Caps the canvas width
              (920) so the toolbar lines up over the frame. */}
          {drawToolsActive && (
            <div style={{ width: '100%', maxWidth: 920, marginBottom: 12, flexShrink: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  rowGap: 6,
                  flexWrap: 'wrap',
                }}
              >
                {/* INK | SHADE register — which tool the pointer wields while
                    sketching (round 7). Shade puts down tone bands; Ink draws
                    strokes. Pill grammar mirrors DrawPanel's register pair. */}
                {(['ink', 'shade'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setPenRegister(r)}
                    aria-pressed={penRegister === r}
                    title={r === 'ink' ? 'Draw ink strokes' : 'Brush flat tone bands under your ink'}
                    style={{
                      ...PILL,
                      padding: '6px 14px',
                      flexShrink: 0,
                      background: penRegister === r ? 'var(--dir-text-primary)' : 'var(--dir-bg)',
                      color: penRegister === r ? 'var(--dir-bg)' : 'var(--dir-text-primary)',
                    }}
                  >
                    {r === 'ink' ? 'Ink' : 'Shade'}
                  </button>
                ))}
                {/* SHAPE ASSIST — Snap + Straighten action pills. Ink register
                    only (tone patches don't snap); disabled until ≥1 stroke
                    exists. The chip cycles ranked candidates in this same row. */}
                <span
                  aria-hidden
                  style={{ width: 1, alignSelf: 'stretch', background: 'var(--dir-border)', flexShrink: 0 }}
                />
                {(['snap', 'straighten'] as const).map((act) => {
                  const enabled = penRegister === 'ink' && strokes3d.length > 0;
                  return (
                    <button
                      key={act}
                      data-snap-pill={act}
                      onClick={() => runSnap(act)}
                      disabled={!enabled}
                      title={
                        penRegister === 'shade'
                          ? 'Snap works on ink — flip to Ink'
                          : strokes3d.length === 0
                            ? 'Draw a stroke first'
                            : act === 'snap'
                              ? 'Snap the last stroke to a clean shape'
                              : 'Crisp the last stroke’s edges (keeps your proportions)'
                      }
                      style={{
                        ...PILL,
                        padding: '6px 14px',
                        flexShrink: 0,
                        opacity: enabled ? 1 : 0.45,
                        cursor: enabled ? 'pointer' : 'default',
                        background: 'var(--dir-bg)',
                        color: 'var(--dir-text-primary)',
                      }}
                    >
                      {act === 'snap' ? 'Snap' : 'Straighten'}
                    </button>
                  );
                })}
                {snapChip && (
                  <SnapChip
                    label={snapChip.candidates[snapChip.index]?.label ?? 'Shape'}
                    hasAlternatives={snapChip.candidates.length > 1}
                    onCycle={cycleSnapChip}
                  />
                )}
                {/* Caption — the honest-miss one-liner takes the slot when it
                    fires, else the current register's hint. Single line,
                    ellipsized, full text on hover via title. */}
                <span
                  role={fillNote ? 'status' : undefined}
                  title={
                    fillNote ??
                    (penRegister === 'shade'
                      ? shadeTool.tool === 'fill'
                        ? shadeTool.erase
                          ? 'erase fill — tap a region to lift its tone'
                          : 'tap inside a region to fill it — hold, then drag sideways to scrub Gap'
                        : shadeTool.tool === 'lasso'
                          ? shadeTool.erase
                            ? 'lasso erase — loop an area to lift its tone'
                            : 'lasso — draw a loop, it closes on release and fills'
                          : shadeTool.erase
                            ? 'erasing tone — brush carves it back to paper'
                            : `brushing ${COVERAGE_BANDS[shadeTool.band]?.name ?? 'mid'} tone — flat grey under your ink`
                      : 'raw ink — keep sketching')
                  }
                  style={{
                    fontFamily: IS,
                    fontSize: 10,
                    fontStyle: 'italic',
                    color: fillNote ? 'var(--dir-accent)' : 'var(--dir-text-body-soft)',
                    flex: '1 1 0%',
                    minWidth: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {fillNote ??
                    (penRegister === 'shade'
                      ? shadeTool.tool === 'fill'
                        ? shadeTool.erase
                          ? 'erase fill — tap a region to lift its tone'
                          : 'tap inside a region to fill it — hold, then drag sideways to scrub Gap'
                        : shadeTool.tool === 'lasso'
                          ? shadeTool.erase
                            ? 'lasso erase — loop an area to lift its tone'
                            : 'lasso — draw a loop, it closes on release and fills'
                          : shadeTool.erase
                            ? 'erasing tone — brush carves it back to paper'
                            : `brushing ${COVERAGE_BANDS[shadeTool.band]?.name ?? 'mid'} tone — flat grey under your ink`
                      : 'raw ink — keep sketching')}
                </span>
              </div>

              {/* SHADE TOOL CLUSTER — visible only while the shade register is
                  in hand: the full 8-band ladder (7 paint swatches + Erase =
                  band 0/paper), the Brush|Fill|Lasso tools, the per-tool slider
                  (Brush radius / Fill GAP), and the FULL FILL pill. The whole
                  cluster comes from DrawSurface's exported ToneShadeCluster
                  (the same one DrawPanel mounts). */}
              {penRegister === 'shade' && (
                <div
                  data-shade-cluster
                  style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, minWidth: 0 }}
                >
                  <span style={{ ...SECTION_LABEL, flexShrink: 0 }}>Tone</span>
                  <ToneShadeCluster value={shadeTool} onChange={setShadeTool} />
                </div>
              )}
            </div>
          )}

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
            <DrawSurface
              mode={mode}
              input={input}
              onStrokesChange={setStrokes3d}
              shade={
                drawToolsActive
                  ? {
                      active: shadeActive,
                      tool: shadeTool.tool,
                      band: shadeTool.band,
                      radius: shadeTool.radius,
                      erase: shadeTool.erase,
                      gap: shadeTool.gap,
                    }
                  : null
              }
              onToneFillsChange={setTone}
              onGapChange={handleGapChange}
              onFillNote={showFillNote}
              onSnapApi={handleSnapApi}
            />
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
                      svgPortMarkup={svgPortMarkup ?? undefined}
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

      {/* svg-port 3D offscreen render — the REAL SvgStyleTransform on the
          current strokes, sized to the viewBox so getBBox resolves (NOT
          display:none, which would zero it). Its onRender hands the scene the
          serialized styled <svg> to wear. Mounted only while svg-port 3D is
          active. */}
      {svgPortActive && svgPortSource && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: -99999,
            top: 0,
            width: 800,
            height: 600,
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          <SvgStyleTransform
            wrapperOverride={{ display: 'block', width: '100%', height: '100%' }}
            onRender={setSvgPortMarkup}
          >
            <div
              style={{ width: '100%', height: '100%' }}
              dangerouslySetInnerHTML={{ __html: svgPortSource }}
            />
          </SvgStyleTransform>
        </div>
      )}
    </div>
  );
}
