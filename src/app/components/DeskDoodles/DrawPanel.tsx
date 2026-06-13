import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { IS, ISe } from '../../lib/typography';
import { PAPER_GRAIN, WARM_POOL } from '../../lib/deskCraft';
import { PILL, CTA, SECTION_LABEL, RAISED_SHADOW } from '../../lib/chromeStyles';
import {
  DrawSurface,
  strokesToObjectMarkup,
  capStrokes,
  capToneFills,
  prepareBackdrop,
  composeBackdropAndStrokes,
  ToneShadeCluster,
  SHADE_TOOL_DEFAULT,
  type ShadeToolState,
  type ToneFill,
  type BackdropFrame,
  type Stroke,
  type StrokePoint,
} from './DrawSurface';
import { COVERAGE_BANDS } from '../../lib/smart/coverage';
import { prepareSvgUpload } from '../../lib/svgUpload';
import { normalizeSvgSize } from '../../lib/normalizeInput';
import { Dropdown } from '../chrome/Dropdown';
import { Slider } from '../chrome/Slider';
import { SLIDER_SPECS, MODIFIER_SETS_BY_STYLE, UNIVERSAL_MODIFIERS } from '../chrome/modifierSpecs';
import {
  F3SvgStyleProvider,
  useF3SvgStyle,
  F3_SVG_STYLES,
  type F3SvgStyle,
} from '../../state/F3SvgStyleContext';
import {
  F3RoughModifiersProvider,
  useF3RoughModifiers,
  DEFAULT_MODIFIERS,
  type F3ModifiersState,
} from '../../state/F3RoughModifiersContext';
import { applyStylePreset, SvgStyleTransform } from '../canvas/SvgStyleTransform';
import { SurfaceControls } from './ObjectSurface';
import {
  smartPickFromMarkup,
  logSmartPickUndo,
  logSmartPickOverridden,
  type SmartPick,
  type SmartPickResult,
} from '../../lib/smart/smartPick';

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

// ─── SmartPickChip — the visible receipt (SD-2 option b) ─────────────────────
// "smart picked sketchy + hachure — all linework, no fills" + a quiet undo.
// Pill grammar per chromeStyles (CHIP-adjacent badge, sentence-case because
// the receipt is a sentence, not a label); accent DOT (not an accent tint —
// no accent-ink backgrounds per system rules) marks it as a system act.
// `fading` = the pick was overridden (manual pen move / input removed) — the
// chip quietly fades out and stops accepting clicks; the undo it carried is
// gone WITH the claim (undo only exists while the pick is the active truth).
function SmartPickChip({
  pick,
  onUndo,
  fading = false,
}: {
  pick: SmartPick;
  onUndo: () => void;
  fading?: boolean;
}) {
  return (
    <div
      role="status"
      data-smart-pick-chip
      data-fading={fading ? '1' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 999,
        border: '1px solid var(--dir-border)',
        background: 'var(--dir-bg)',
        padding: '6px 12px',
        minWidth: 0,
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.22s ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <span
        aria-hidden="true"
        style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--dir-accent)', flexShrink: 0 }}
      />
      <span
        style={{
          fontFamily: IS,
          fontSize: 11,
          color: 'var(--dir-text-body)',
          lineHeight: 1.45,
          minWidth: 0,
        }}
      >
        smart picked{' '}
        <strong style={{ fontWeight: 600, color: 'var(--dir-text-primary)' }}>{pick.headline}</strong>
        {' — '}
        {pick.reason}
      </span>
      <button
        onClick={onUndo}
        title="Put the pen back the way it was"
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--dir-text-secondary)',
          background: 'transparent',
          border: 'none',
          textDecoration: 'underline',
          textUnderlineOffset: 2,
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
        }}
      >
        undo
      </button>
    </div>
  );
}

// ─── Size-cap honesty ─────────────────────────────────────────────────────────
// The server INSERT path enforces char_length(svg) ≤ 65536 (publish_to_open_desk
// + harden-v1: 64KB). Place checks the staged markup against the same number so
// an over-cap doodle is never silently dropped by the database — the user gets
// the honest note + a real Shrink-to-fit lever and STAYS in the popup.
const SVG_CHAR_CAP = 65536;

/** Sync bridge between the panel's live pen values and the NESTED providers
 *  wrapping the staged minting preview — the SurfaceRenderScope pattern from
 *  ObjectSurface.tsx (~line 149). Mirrored, not imported: it isn't exported
 *  there and that file belongs to another work rock. Runs INSIDE the nested
 *  scope, so setState/replace touch only the preview's shadowed context —
 *  never the global pen. useLayoutEffect lands the sync before paint (no
 *  flash of provider-default style); the !== guards settle in one pass
 *  (replace stores the same object reference). */
function StagedRenderScope({
  svgStyle,
  mods,
  children,
}: {
  svgStyle: F3SvgStyle;
  mods: F3ModifiersState;
  children: ReactNode;
}) {
  const styleCtx = useF3SvgStyle();
  const modsCtx = useF3RoughModifiers();
  useLayoutEffect(() => {
    if (styleCtx.state !== svgStyle) styleCtx.setState(svgStyle);
  }, [styleCtx, svgStyle]);
  useLayoutEffect(() => {
    if (modsCtx.state !== mods) modsCtx.replace(mods);
  }, [modsCtx, mods]);
  return <>{children}</>;
}

// Opaque cover for the canvas pane — the gate idiom (DrawSurface's honesty
// gates): upload picker / un-embeddable fallback / image stub all sit OVER the
// always-mounted DrawSurface, so switching input never unmounts (= never
// destroys) an in-progress sketch.
const PANE_OVERLAY: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  padding: 24,
  background: 'var(--dir-bg)',
  borderRadius: 6,
  textAlign: 'center',
};

export function DrawPanel({
  onDone,
  onCancel,
  rightInset = 0,
  leftInset = 0,
}: {
  /** Receives the markup for the ONE object this session made, plus the
   *  naming-stage meta: source strokes (the record keeps the hand — wedge
   *  contract), name + why. All optional — uploads carry no strokes.
   *  `sourceConfig` rides DeskPage's existing verbatim-config channel ("any
   *  future extras ride through untouched"): when present, the host stores it
   *  BYTE-FOR-BYTE as the row's render_config instead of snapshotting the
   *  pen. The tone-fill Done uses it to carry render_config.toneFills
   *  (addendum ch.2.1) — the panel builds the identical pen snapshot (same
   *  shared contexts, D-7 one pen) plus the tone record. */
  onDone: (
    svgMarkup: string,
    meta?: {
      strokes?: StrokePoint[][];
      name?: string | null;
      why?: string | null;
      sourceConfig?: Record<string, unknown> | null;
    },
  ) => void;
  onCancel: () => void;
  /** px width of an open right controls panel (the desk's). The scrim reserves
   *  this on the right so the modal centers over the desk working area, not
   *  behind the panel. Default 0 — /canvas (no such panel) is unaffected. */
  rightInset?: number;
  /** px width of an open LEFT drawer panel — rightInset's mirror (UX-audit
   *  fix 4): the scrim reserves the drawer's width on the left so the modal
   *  centers over the VISIBLE desk. Same narrow-viewport clamp. Default 0. */
  leftInset?: number;
}) {
  // Live mirror of DrawSurface's preview-stroke pool — setState is a stable
  // callback, so the mirror effect in DrawSurface doesn't re-fire on renders.
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  // Live mirror of the TONE-PATCH pool (the shade register's output) — same
  // stable-setState contract. Staged into render_config.toneFills at Done.
  const [tone, setTone] = useState<ToneFill[]>([]);
  // Inspection mirror (the __dd_decisionLog idiom): batteries + calibration
  // tooling read the live tone record without driving Done/Place — the
  // determinism check diffs JSON.stringify of this across scripted runs.
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__dd_toneFills = tone;
  }, [tone]);
  // INK | SHADE — which tool the pointer wields while sketching (round 7).
  // Ink = strokes (the existing draw). Shade = the tone-fill brush: discrete
  // band-grey soft regions under the ink. A register, not a render mode —
  // Sketch|Style stays the canvas's render axis; Style pauses both tools.
  const [penRegister, setPenRegister] = useState<'ink' | 'shade'>('ink');
  const [shadeTool, setShadeTool] = useState<ShadeToolState>(SHADE_TOOL_DEFAULT);
  // Input mode — same trio as the /canvas dock. Upload-svg hands the
  // sanitized markup straight to the desk's add boundary (normalizeSvgSize
  // sizes it there); upload-image is an honest stub until autotrace (S1).
  const [input, setInput] = useState<PanelInput>('draw');
  const [upload, setUpload] = useState<{ name: string; markup: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // UPLOAD-REMOVAL STRANDING fix (smasher round 7): Remove with strokes/tone
  // present keeps the work and auto-switches the input register to Draw (the
  // strokes ARE a draw session — Done must work on them alone). This note is
  // the honest one-liner saying so; it takes over the caption slot (zero
  // layout shift) and clears itself after a few seconds.
  const [removeNote, setRemoveNote] = useState(false);
  const removeNoteTimer = useRef<number | null>(null);
  const showRemoveNote = () => {
    setRemoveNote(true);
    if (removeNoteTimer.current) window.clearTimeout(removeNoteTimer.current);
    removeNoteTimer.current = window.setTimeout(() => {
      setRemoveNote(false);
      removeNoteTimer.current = null;
    }, 5000);
  };
  // The note clears EARLY when the user moves on themselves (switches input,
  // stages a new file) — it must never describe a state that's gone.
  const clearRemoveNote = () => {
    if (removeNoteTimer.current) {
      window.clearTimeout(removeNoteTimer.current);
      removeNoteTimer.current = null;
    }
    setRemoveNote(false);
  };
  useEffect(
    () => () => {
      if (removeNoteTimer.current) window.clearTimeout(removeNoteTimer.current);
    },
    [],
  );
  // FILL-TOOL NOTE (rock F2, region-fill-spec §5.4): the honest-miss one-liner
  // ("no closed region here — raise Gap, or use Lasso") rides the same caption
  // slot as the remove-note — quiet, zero layout shift, self-clearing.
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
  // Gap scrub → slider sync (DrawSurface fires once per ladder step; the
  // scrubbed value persists in the shared tool state — spec D-RF3).
  const handleGapChange = useCallback((gap: number) => {
    setShadeTool((prev) => (prev.gap === gap ? prev : { ...prev, gap }));
  }, []);
  const fileRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // UPLOAD PARITY (ROUND 6): the picked file prepared as a draw-over backdrop
  // — letterboxed into the same frame space the strokes live in. null with an
  // upload present = the file hides its size (no viewBox, no width/height);
  // the pane shows the honest non-draw-over fallback instead of pretending.
  const backdropFrame = useMemo(
    () => (upload ? prepareBackdrop(upload.markup) : null),
    [upload],
  );

  // ── THE PEN (shared state — D-7) ──────────────────────────────────────────
  // Same contexts the desk panel's SmartHachureChrome reads/writes. The popup
  // column is a second face of the ONE pen: change wobble here, the desk
  // panel's wobble slider holds the same value after close. The style
  // dropdown mirrors the chrome's preset-snap semantics exactly so picking a
  // style behaves identically from either surface.
  const { state: svgStyle, setState: setSvgStyle } = useF3SvgStyle();
  const { state: mods, set: setMod, replace: replaceMods } = useF3RoughModifiers();
  const declared = MODIFIER_SETS_BY_STYLE[svgStyle] ?? UNIVERSAL_MODIFIERS;
  const has = (k: string) => (declared as readonly string[]).includes(k);

  // ── SMART PICK (smart-system plan Phase C · SD-2/SD-3) ───────────────────
  // Fires ONCE at ingest: upload-SVG staging, and the drawn doodle's first
  // Done (entering the naming stage). The pick lands through the NORMAL
  // preset-snap path — identical to the user picking the style themselves —
  // then never touches a control again (I-1: dropdowns stay sacred). The
  // visible chip carries the rule receipts + a quiet undo that restores the
  // exact prior pen. Ambiguous input → no pick, no chip (smartPick logs the
  // abstention to window.__dd_inputPickLog).
  const [smartPick, setSmartPick] = useState<{
    result: SmartPickResult; // result.pick is non-null when stored here
    prior: { svgStyle: F3SvgStyle; mods: F3ModifiersState };
  } | null>(null);
  // CHIP HONESTY (smasher round 7): true while the chip fades out after the
  // pick was OVERRIDDEN — the user manually moved a style/control (their
  // choice is now the truth; a chip still claiming "smart picked X" would be
  // a lie, and its undo would discard the manual choice), or the picked
  // input was removed. Quiet fade → unmount; logged as 'overridden'.
  const [smartPickFading, setSmartPickFading] = useState(false);
  const smartPickFadeTimer = useRef<number | null>(null);
  // Once-per-session latch for the drawn path: Back-and-Done again is NOT a
  // new ingest — the pen must not re-move (SD-3 once-at-ingest).
  const drawPickEvaluatedRef = useRef(false);
  useEffect(
    () => () => {
      if (smartPickFadeTimer.current) window.clearTimeout(smartPickFadeTimer.current);
    },
    [],
  );

  /** The pick stopped being the active truth without an undo — fade the chip
   *  out and log the override. Idempotent (no chip / already fading = no-op),
   *  so every manual-change path can call it unconditionally. */
  function dismissSmartPick() {
    if (!smartPick || smartPickFading) return;
    logSmartPickOverridden(smartPick.result);
    setSmartPickFading(true);
    if (smartPickFadeTimer.current) window.clearTimeout(smartPickFadeTimer.current);
    smartPickFadeTimer.current = window.setTimeout(() => {
      setSmartPick(null);
      setSmartPickFading(false);
      smartPickFadeTimer.current = null;
    }, 260);
  }

  function applySmartPick(result: SmartPickResult) {
    // A new ingest supersedes any in-flight fade — settle it immediately so
    // the fresh chip never inherits a half-faded state.
    if (smartPickFadeTimer.current) {
      window.clearTimeout(smartPickFadeTimer.current);
      smartPickFadeTimer.current = null;
    }
    setSmartPickFading(false);
    const pick = result.pick;
    if (!pick) {
      // Abstained — clear any stale chip from a previous ingest so the
      // receipts never describe a different input than the one staged.
      setSmartPick(null);
      return;
    }
    const prior = { svgStyle, mods };
    // The style pick = the user's own style-change gesture: setSvgStyle +
    // preset snap (EXACTLY the onStyle handler below). Confident secondary
    // axes then land as ordinary dropdown moves on top of the preset.
    setSvgStyle(pick.axes.svgStyle);
    const snapped = applyStylePreset(mods, pick.axes.svgStyle);
    const next: F3ModifiersState = {
      ...snapped,
      ...(pick.axes.fillStyle !== undefined && { fillStyle: pick.axes.fillStyle }),
      ...(pick.axes.texture !== undefined && { texture: pick.axes.texture }),
      ...(pick.axes.penTip !== undefined && { penTip: pick.axes.penTip }),
      ...(pick.axes.multiStroke !== undefined && { multiStroke: pick.axes.multiStroke }),
      ...(pick.axes.sketchingStyle !== undefined && { sketchingStyle: pick.axes.sketchingStyle }),
    };
    (Object.keys(next) as (keyof typeof next)[]).forEach((k) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMod(k, (next as any)[k]);
    });
    setSmartPick({ result, prior });
  }

  function undoSmartPick() {
    // Undo only exists while the pick is UNTOUCHED — once a manual change
    // started the fade, reverting would discard that manual choice.
    if (!smartPick || smartPickFading) return;
    // Restore the EXACT prior pen (style + every modifier) — the snapshot
    // taken right before the pick applied. Logged as a rejection receipt.
    setSvgStyle(smartPick.prior.svgStyle);
    replaceMods(smartPick.prior.mods);
    logSmartPickUndo(smartPick.result);
    setSmartPick(null);
  }

  // ── ESCAPE = ONE LAYER PER PRESS (safety pass, ROUND 6/7) ─────────────────
  // Bubble phase on window, so an open Dropdown popover (capture-phase
  // document listener that stops propagation) closes itself first — that IS
  // the topmost layer. Then, per press:
  //   · naming stage → BACK to compose (strokes intact), never popup-close;
  //   · compose with strokes → first press ARMS a visible confirm (footer
  //     note), second press within 3s closes — never silent destruction;
  //   · compose with nothing drawn → plain close.
  const [escapeArmed, setEscapeArmed] = useState(false);
  const escapeArmedRef = useRef(false);
  const escapeTimerRef = useRef<number | null>(null);
  const armEscape = useCallback(() => {
    escapeArmedRef.current = true;
    setEscapeArmed(true);
    if (escapeTimerRef.current) window.clearTimeout(escapeTimerRef.current);
    escapeTimerRef.current = window.setTimeout(() => {
      escapeArmedRef.current = false;
      setEscapeArmed(false);
    }, 3000);
  }, []);
  useEffect(
    () => () => {
      if (escapeTimerRef.current) window.clearTimeout(escapeTimerRef.current);
    },
    [],
  );

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
    input === 'draw'
      ? strokes.length > 0 || tone.length > 0
      : input === 'upload-svg'
        ? upload !== null
        : false;

  // ── NAMING STAGE (the minting moment — Sebs, round 4) ────────────────────
  // Done no longer publishes: it stages the doodle and asks for its card info.
  // Back returns to drawing with strokes intact; Place publishes with meta.
  const [staged, setStaged] = useState<{
    markup: string;
    strokes?: StrokePoint[][];
    /** Size-guarded tone record (addendum ch.2.1) — publishes as
     *  render_config.toneFills via the sourceConfig channel at Place. */
    toneFills?: ToneFill[];
  } | null>(null);
  // DRAW | STYLE canvas mode (Sebs 2026-06-12): Draw = raw ink, keep
  // sketching, pen-up commits nothing. Style = sketching pauses, the drawing
  // renders styled and the pen controls restyle it live. Flip freely.
  const [composeMode, setComposeMode] = useState<'draw' | 'style'>('draw');
  const [stageName, setStageName] = useState('');
  const [stageWhy, setStageWhy] = useState('');
  // SIZE-CAP HONESTY: set when Place measured the staged svg over the 64KB
  // server cap. The popup STAYS OPEN — nothing is lost. `exhausted` = the
  // shrink lever ran out of detail to smooth and it still doesn't fit.
  const [capNote, setCapNote] = useState<{ kb: number; exhausted?: boolean } | null>(null);
  // Receipt after a successful Shrink-to-fit (the staged markup was rebuilt
  // from decimated points; the live strokes stay full-fidelity — Back keeps
  // every point the user drew).
  const [shrunk, setShrunk] = useState(false);

  // The layered Escape handler (state machine documented at armEscape above).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (staged) {
        // Naming stage → Back. One layer per press; strokes + fields intact.
        setStaged(null);
        setCapNote(null);
        setShrunk(false);
        return;
      }
      if (strokes.length > 0 || tone.length > 0) {
        // Tone patches are unsaved work exactly like strokes — same guard.
        if (escapeArmedRef.current) onCancel();
        else armEscape();
        return;
      }
      onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [staged, strokes.length, tone.length, onCancel, armEscape]);

  // The minting preview's art, sized once per staging (230px long axis inside
  // the 280px well) — memoized so name/why keystrokes don't re-run DOMParser.
  const stagedPreviewMarkup = useMemo(
    () => (staged ? normalizeSvgSize(staged.markup, 230) : ''),
    [staged],
  );

  function handleDone() {
    setCapNote(null);
    setShrunk(false);
    if (input === 'draw' && (strokes.length > 0 || tone.length > 0)) {
      // Tone patches ride the markup UNDER the ink (flat band-greys the
      // style pipeline converts to marks at band density) AND the staged
      // record as toneFills — svg stays regenerable from the record (ch.2.1).
      // A tone-only doodle is legal: the patch's own mask IS its region
      // (addendum ch.2.4 — no "close a shape first" rule).
      const markup = strokesToObjectMarkup(strokes, tone);
      // SMART PICK — drawn ingest: first Done (entering the naming stage) is
      // THE ingest moment for a drawn doodle. Latched per panel session so
      // Back-and-Done never re-fires (SD-3). Picks only when the gesture
      // rules are confident — sparse squiggles abstain silently.
      if (!drawPickEvaluatedRef.current) {
        drawPickEvaluatedRef.current = true;
        const evaluated = smartPickFromMarkup(markup, 'draw');
        if (evaluated) applySmartPick(evaluated);
      }
      setStaged({
        markup,
        strokes: strokes.length > 0 ? capStrokes(strokes) : undefined,
        toneFills: tone.length > 0 ? capToneFills(tone) : undefined,
      });
    } else if (input === 'upload-svg' && upload) {
      if (backdropFrame && (strokes.length > 0 || tone.length > 0)) {
        // DRAW-OVER MERGE (ROUND 6): backdrop + strokes (+ tone patches,
        // inverse-mapped the same way) become ONE object in one shared
        // coordinate space — the same composed markup the Style layer
        // previews live. The added strokes are NOT put in the record yet:
        // ObjectSurface's Re-draw Done rebuilds the svg from strokes ALONE
        // (strokesToObjectMarkup), which would silently DESTROY the upload
        // half of a merged object. Until Re-draw is backdrop-aware (queued,
        // ObjectSurface rock), merged objects take the honest "drawn before
        // re-editing existed" path instead of a data-loss one — toneFills
        // stay out of the merged record for the same reason (they'd survive,
        // but a strokeless record hides Re-draw anyway; consistency wins).
        setStaged({
          markup: composeBackdropAndStrokes(backdropFrame, strokes, {
            tight: true,
            toneFills: tone,
          }),
        });
      } else {
        setStaged({ markup: upload.markup });
      }
    }
  }

  function handlePlace() {
    if (!staged) return;
    // SIZE-CAP HONESTY: measure what actually gets published — DeskPage sends
    // normalizeSvgSize(markup, 180) to publish_to_open_desk, whose INSERT
    // rejects char_length(svg) > 64KB. Refuse with the honest note instead of
    // letting the row vanish server-side; the popup stays open, nothing lost.
    const finalLength = normalizeSvgSize(staged.markup, 180).length;
    if (finalLength > SVG_CHAR_CAP) {
      setCapNote({ kb: Math.ceil(finalLength / 1024) });
      return;
    }
    if (staged.toneFills && staged.toneFills.length > 0) {
      // TONE IN THE RECORD: route the full config through the host's verbatim
      // sourceConfig channel — DeskPage stores it byte-for-byte as the row's
      // render_config (its parser passes extras through untouched on every
      // hop, same contract that carries strokes). The pen half is the
      // IDENTICAL snapshot DeskPage would take itself: svgStyle + mods are
      // the same shared contexts (D-7, one pen) read at the same moment.
      onDone(staged.markup, {
        name: stageName.trim() || null,
        why: stageWhy.trim() || null,
        sourceConfig: {
          svgStyle,
          modifiers: mods,
          ...(staged.strokes && staged.strokes.length > 0 ? { strokes: staged.strokes } : {}),
          toneFills: staged.toneFills,
        },
      });
      return;
    }
    onDone(staged.markup, {
      strokes: staged.strokes,
      name: stageName.trim() || null,
      why: stageWhy.trim() || null,
    });
  }

  /** Shrink-to-fit — the REAL lever behind the size-cap note: halve point
   *  density (keeping endpoints, same decimation move capStrokes uses) until
   *  the rebuilt markup fits the cap. Works on a COPY — the live strokes keep
   *  full fidelity, so Back returns the drawing exactly as drawn. Pure-upload
   *  overflow has no stroke detail to smooth → the note says so instead. */
  function handleShrinkToFit() {
    if (strokes.length === 0) return;
    const build = (sts: Stroke[]) =>
      input === 'upload-svg' && backdropFrame
        ? composeBackdropAndStrokes(backdropFrame, sts, { tight: true, toneFills: tone })
        : strokesToObjectMarkup(sts, tone);
    let pts = strokes;
    for (let pass = 0; pass < 10; pass++) {
      const next = pts.map((st) =>
        st.points.length > 8
          ? { ...st, points: st.points.filter((_, i) => i % 2 === 0 || i === st.points.length - 1) }
          : st,
      );
      const flatBefore = pts.reduce((n, st) => n + st.points.length, 0);
      const flatAfter = next.reduce((n, st) => n + st.points.length, 0);
      pts = next;
      const markup = build(pts);
      if (normalizeSvgSize(markup, 180).length <= SVG_CHAR_CAP) {
        setStaged({
          markup,
          // The record's gesture follows the shrink (it IS the new source).
          // Merged draw-over objects record no strokes (see handleDone note).
          strokes: input === 'draw' ? capStrokes(pts) : undefined,
          // Tone patches keep full resolution — the shrink lever smooths
          // stroke detail; the tone record is small by construction.
          toneFills: input === 'draw' && tone.length > 0 ? capToneFills(tone) : undefined,
        });
        setCapNote(null);
        setShrunk(true);
        return;
      }
      if (flatAfter >= flatBefore) break; // no detail left to smooth
    }
    setCapNote((prev) => (prev ? { ...prev, exhausted: true } : prev));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const result = await prepareSvgUpload(file);
    if (result.ok) {
      setUpload({ name: result.name, markup: result.markup });
      setUploadError(null);
      clearRemoveNote();
      // SMART PICK — upload ingest: every picked file is one ingest, and
      // staging (the preview appearing) is the moment. Runs the signal
      // extractor over the sanitized markup; confident → pen set through
      // the preset-snap path + chip; ambiguous → nothing moves.
      const evaluated = smartPickFromMarkup(result.markup, 'upload-svg');
      if (evaluated) applySmartPick(evaluated);
    } else {
      setUpload(null);
      setUploadError(result.error);
    }
  }

  // The register row's one-line caption. The remove-note takes the slot over
  // briefly when it fires (honest one-liner, zero layout shift), then the
  // compose-state line returns. Computed once so the visible (possibly
  // ellipsized) text and its title tooltip always match.
  const captionText = removeNote
    ? 'upload removed — your strokes stay'
    : fillNote
      ? fillNote
      : composeMode === 'draw'
        ? penRegister === 'shade'
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
          : input === 'upload-svg' && backdropFrame
            ? 'raw ink over your upload — keep sketching'
            : 'raw ink — keep sketching'
        : input === 'upload-svg' && backdropFrame
          ? 'styled — the pen renders your upload live'
          : 'styled — play with the pen, flip back to keep drawing';

  return (
    // Overlay scrim — click outside the panel closes ONLY when nothing is
    // drawn. With strokes present (or in the naming stage) the click is
    // NON-DESTRUCTIVE: it arms the same visible Esc-confirm hint instead of
    // eating the sketch (safety pass, ROUND 6/7).
    <div
      onClick={() => {
        if (staged) return; // staging = work definitely present — no-op
        if (strokes.length > 0 || tone.length > 0) {
          armEscape();
          return;
        }
        onCancel();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'color-mix(in srgb, var(--dir-text-primary) 28%, transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        // Reserve an open right controls panel's width so the modal centers
        // over the desk area, not behind it. Default 0 (e.g. on /canvas).
        // The inner min() CLAMPS the reservation on narrow viewports (the
        // ObjectSurface scrim pattern): unclamped 32+360px right padding
        // crushed the popup to a sliver once the viewport shrank. The mini-
        // desk row needs ~640px (320 canvas + 220 controls + gaps/padding),
        // so the popup keeps ≥640px and slides under the panel instead.
        paddingRight:
          rightInset > 0
            ? `max(32px, min(${32 + rightInset}px, calc(100vw - 672px)))`
            : 32,
        // The drawer's mirror (UX-audit fix 4) — same clamp so drawer +
        // controls open together can't crush the popup on narrow viewports.
        paddingLeft:
          leftInset > 0
            ? `max(32px, min(${32 + leftInset}px, calc(100vw - 672px)))`
            : 32,
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
          position: 'relative',
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
              ? strokes.length === 0 && tone.length === 0
                ? 'Each Done adds one object'
                : [
                    strokes.length > 0
                      ? `${strokes.length} stroke${strokes.length === 1 ? '' : 's'}`
                      : null,
                    tone.length > 0
                      ? `${tone.length} tone patch${tone.length === 1 ? '' : 'es'}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
              : input === 'upload-svg'
                ? upload
                  ? `${upload.name}${
                      strokes.length > 0
                        ? ` · ${strokes.length} stroke${strokes.length === 1 ? '' : 's'} over`
                        : ''
                    }`
                  : 'Pick a file'
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
              onClick={() => {
                setInput(key);
                clearRemoveNote();
              }}
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
            {/* Hidden file input — dialog-level so both the picker overlay and
                the Replace pill reach it. display:none keeps it out of the
                focus trap (zero client rects). */}
            <input
              ref={fileRef}
              type="file"
              accept=".svg,image/svg+xml"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {/* Sketch | Style — the canvas's own mode pills (the Pen|Desk
                grammar, one level down). UPLOAD PARITY (ROUND 6): the same
                pills work on uploads — Style renders the upload through the
                pen live. Hidden only behind the image stub. ROUND 7 adds the
                INK | SHADE register pair beside it: which tool the pointer
                wields while sketching (Style pauses both). */}
            {/* ROW LAYOUT (smasher round 7 caption-crush fix): pills never
                shrink; the caption is the row's ONE flexible item — single
                line, ellipsized, full text on hover via title. flexWrap only
                ever moves the upload cluster to a second line at narrow
                widths (the caption's flex-basis 0 keeps it on line one). */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                rowGap: 6,
                marginBottom: 8,
                flexWrap: 'wrap',
              }}
            >
              {(['draw', 'style'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setComposeMode(m)}
                  aria-pressed={composeMode === m}
                  style={{
                    ...PILL,
                    padding: '6px 14px',
                    flexShrink: 0,
                    background: composeMode === m ? 'var(--dir-text-primary)' : 'var(--dir-bg)',
                    color: composeMode === m ? 'var(--dir-bg)' : 'var(--dir-text-primary)',
                  }}
                >
                  {m === 'draw' ? 'Sketch' : 'Style'}
                </button>
              ))}
              <span
                aria-hidden
                style={{ width: 1, alignSelf: 'stretch', background: 'var(--dir-border)', flexShrink: 0 }}
              />
              {(['ink', 'shade'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setPenRegister(r)}
                  aria-pressed={penRegister === r}
                  disabled={composeMode === 'style'}
                  title={
                    composeMode === 'style'
                      ? 'Flip back to Sketch to keep working'
                      : r === 'ink'
                        ? 'Draw ink strokes'
                        : 'Brush flat tone bands under your ink'
                  }
                  style={{
                    ...PILL,
                    padding: '6px 14px',
                    flexShrink: 0,
                    opacity: composeMode === 'style' ? 0.45 : 1,
                    cursor: composeMode === 'style' ? 'default' : 'pointer',
                    background: penRegister === r ? 'var(--dir-text-primary)' : 'var(--dir-bg)',
                    color: penRegister === r ? 'var(--dir-bg)' : 'var(--dir-text-primary)',
                  }}
                >
                  {r === 'ink' ? 'Ink' : 'Shade'}
                </button>
              ))}
              <span
                role={removeNote || fillNote ? 'status' : undefined}
                title={captionText}
                style={{
                  fontFamily: IS,
                  fontSize: 10,
                  fontStyle: 'italic',
                  color: removeNote || fillNote ? 'var(--dir-accent)' : 'var(--dir-text-body-soft)',
                  flex: '1 1 0%',
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {captionText}
              </span>
              {input === 'upload-svg' && upload && (
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{ ...PILL, padding: '5px 12px', background: 'var(--dir-bg)' }}
                  >
                    Replace file
                  </button>
                  <button
                    onClick={() => {
                      // UPLOAD-REMOVAL STRANDING fix: strokes/tone drawn over
                      // the file are KEPT (DrawSurface never unmounts) — the
                      // input register auto-switches to Draw so Done works on
                      // them alone, with the honest one-line note. The chip's
                      // pick described the removed file — no longer the
                      // active truth; quiet fade, logged as overridden.
                      const keepWork = strokes.length > 0 || tone.length > 0;
                      setUpload(null);
                      setUploadError(null);
                      dismissSmartPick();
                      if (keepWork) {
                        setInput('draw');
                        showRemoveNote();
                      }
                    }}
                    title="Remove the file — your strokes stay"
                    style={{
                      ...PILL,
                      padding: '5px 12px',
                      background: 'transparent',
                      color: 'var(--dir-text-body-soft)',
                    }}
                  >
                    Remove
                  </button>
                </span>
              )}
            </div>

            {/* SHADE TOOL CLUSTER — visible only while the shade register is
                in hand: the full 8-band ladder (7 paint swatches + Erase =
                band 0/paper) + brush size. Lives with the canvas (tool
                chrome), not in the pen column (mark styling). */}
            {composeMode === 'draw' && penRegister === 'shade' && (
              <div
                data-shade-cluster
                style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, minWidth: 0 }}
              >
                <span style={{ ...SECTION_LABEL, flexShrink: 0 }}>Tone</span>
                <ToneShadeCluster value={shadeTool} onChange={setShadeTool} />
              </div>
            )}

            {/* THE PANE — DrawSurface stays mounted across ALL input modes
                (switching input never destroys a sketch); upload states sit
                OVER it as opaque covers (the gate idiom). With a file picked,
                the upload letterboxes in as a draw-over backdrop and the
                preview FILLS THE PANE like draw mode (ROUND 6 spec d). */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <DrawSurface
                mode="svg"
                input="draw"
                hideActions
                fill
                styled={composeMode === 'style'}
                backdrop={input === 'upload-svg' ? backdropFrame : undefined}
                onStrokesChange={setStrokes}
                shade={{
                  active: composeMode === 'draw' && penRegister === 'shade',
                  tool: shadeTool.tool,
                  band: shadeTool.band,
                  radius: shadeTool.radius,
                  erase: shadeTool.erase,
                  gap: shadeTool.gap,
                }}
                onToneFillsChange={setTone}
                onGapChange={handleGapChange}
                onFillNote={showFillNote}
              />

              {/* Upload picker — no file yet. */}
              {input === 'upload-svg' && !upload && (
                <div style={PANE_OVERLAY}>
                  <p style={{ fontFamily: IS, fontSize: 13, color: 'var(--dir-text-body-soft)', margin: 0 }}>
                    The file becomes one desk object — style it with the pen,
                    draw over it, size handled automatically.
                  </p>
                  <button
                    onClick={() => fileRef.current?.click()}
                    // Heavier border = empty-state affordance (canvas dock precedent).
                    style={{
                      ...PILL,
                      padding: '10px 22px',
                      background: 'var(--dir-bg)',
                      border: '1px solid var(--dir-text-primary)',
                    }}
                  >
                    Pick an .svg file
                  </button>
                  {uploadError && (
                    <p style={{ fontFamily: IS, fontSize: 12, color: 'var(--dir-accent)', margin: 0 }}>
                      {uploadError}
                    </p>
                  )}
                </div>
              )}

              {/* Un-embeddable upload — the file carries no size info (no
                  viewBox, no width/height), so frame-space draw-over can't
                  letterbox it honestly. Thumbnail preview + plain placement
                  still work; no fake draw-over. */}
              {input === 'upload-svg' && upload && !backdropFrame && (
                <div style={PANE_OVERLAY}>
                  <div
                    style={{ width: 180, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    dangerouslySetInnerHTML={{
                      // normalizeSvgSize derives sizing where possible; markup is
                      // DOMPurify-sanitized upstream by prepareSvgUpload.
                      __html: normalizeSvgSize(upload.markup, 180),
                    }}
                  />
                  <p style={{ fontFamily: IS, fontSize: 12, color: 'var(--dir-text-body-soft)', margin: 0, maxWidth: 360, lineHeight: 1.5 }}>
                    This file hides its size, so drawing over it is off — it
                    still places on the desk just fine.
                  </p>
                </div>
              )}

              {/* Honest image stub — image→object needs the autotrace path
                  (stretch S1); no fake controls, no time commitments. */}
              {input === 'upload-image' && (
                <div style={PANE_OVERLAY}>
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

            {/* SMART PICK receipt — visible right where the pen lives, so the
                "why did the controls just move" question is answered before
                it's asked. Undo restores the exact prior pen. */}
            {smartPick?.result.pick && (
              <SmartPickChip
                pick={smartPick.result.pick}
                onUndo={undoSmartPick}
                fading={smartPickFading}
              />
            )}

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
                  // Manual style change = the pick (if any) is no longer the
                  // active truth — chip fades, override logged (chip honesty).
                  dismissSmartPick();
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
                onMod={(key, value) => {
                  // Same honesty rule for every slider/dropdown move. The
                  // pick's own writes go through setMod DIRECTLY (applySmartPick),
                  // so this only ever fires on real user gestures.
                  dismissSmartPick();
                  setMod(key, value);
                }}
                onReset={() => {
                  dismissSmartPick();
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

        {/* NAMING STAGE — covers the compose UI when staged (the minting
            moment): art on the warm-paper well, name in the maker's register
            (Fraunces + wonk, mirrors ObjectCard), why in Fraunces italic.
            Back keeps the strokes; Place publishes with the meta. */}
        {staged && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 5,
              background: 'var(--dir-raised)',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <span style={SECTION_LABEL}>Name your doodle</span>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div
                style={{
                  width: 280,
                  height: 280,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--dir-border)',
                  borderRadius: 10,
                  backgroundColor: 'var(--dir-bg)',
                  backgroundImage: `${PAPER_GRAIN}, ${WARM_POOL}`,
                  overflow: 'hidden',
                }}
              >
                {/* STYLED MINTING PREVIEW (ROUND 6): the staged art renders
                    through the SAME nested-provider + SvgStyleTransform scope
                    the desk uses (ObjectSurface SurfaceRenderScope pattern),
                    synced to the CURRENT pen — the ceremony shows the doodle
                    the user actually styled, never raw 3px hairlines. The
                    nested providers shadow the global pen for this subtree
                    only; pen moves (and smart-pick undo) re-render it live. */}
                <F3SvgStyleProvider>
                  <F3RoughModifiersProvider>
                    <StagedRenderScope svgStyle={svgStyle} mods={mods}>
                      <SvgStyleTransform>
                        <div aria-hidden dangerouslySetInnerHTML={{ __html: stagedPreviewMarkup }} />
                      </SvgStyleTransform>
                    </StagedRenderScope>
                  </F3RoughModifiersProvider>
                </F3SvgStyleProvider>
              </div>
            </div>

            {/* SIZE-CAP HONESTY (ROUND 6): Place measured the staged svg over
                the 64KB server cap. Say so, keep the popup open, and offer the
                real lever — Shrink to fit smooths point density; the live
                strokes keep full fidelity so Back loses nothing. */}
            {capNote && (
              <div
                role="alert"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontFamily: IS,
                    fontSize: 12,
                    color: 'var(--dir-accent)',
                    lineHeight: 1.5,
                    textAlign: 'center',
                    maxWidth: 520,
                  }}
                >
                  {capNote.exhausted
                    ? `Still too detailed after smoothing — the desk caps doodles at 64KB (this one is ~${capNote.kb}KB). Go Back and try fewer strokes${input === 'upload-svg' ? ' or a simpler file' : ''}.`
                    : strokes.length > 0
                      ? `Too detailed to save — the desk caps doodles at 64KB (this one is ~${capNote.kb}KB). Nothing is lost: shrink it to fit, or go Back and edit.`
                      : `Too detailed to save — the desk caps doodles at 64KB (this file is ~${capNote.kb}KB). Nothing is lost: go Back and try a simpler file.`}
                </span>
                {strokes.length > 0 && !capNote.exhausted && (
                  <button
                    onClick={handleShrinkToFit}
                    title="Smooth the finest point detail until the doodle fits"
                    style={{ ...PILL, padding: '6px 14px', background: 'var(--dir-bg)', flexShrink: 0 }}
                  >
                    Shrink to fit
                  </button>
                )}
              </div>
            )}
            {shrunk && !capNote && (
              <span
                role="status"
                style={{
                  fontFamily: IS,
                  fontSize: 11,
                  fontStyle: 'italic',
                  color: 'var(--dir-text-body-soft)',
                  textAlign: 'center',
                }}
              >
                smoothed the finest detail to fit the desk&rsquo;s 64KB cap
              </span>
            )}
            {/* SMART PICK receipt in the naming stage too — the drawn-path
                pick fires at Done, and this overlay covers the pen column,
                so the chip must be visible HERE for that ingest. */}
            {smartPick?.result.pick && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <SmartPickChip
                  pick={smartPick.result.pick}
                  onUndo={undoSmartPick}
                  fading={smartPickFading}
                />
              </div>
            )}
            <div style={{ maxWidth: 460, width: '100%', alignSelf: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                autoFocus
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                placeholder="Name your doodle"
                aria-label="Doodle name"
                maxLength={60}
                style={{
                  fontFamily: ISe,
                  fontVariationSettings: '"SOFT" 60, "WONK" 1',
                  fontSize: 20,
                  letterSpacing: '-0.01em',
                  color: 'var(--dir-text-primary)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--dir-border)',
                  outline: 'none',
                  padding: '2px 0',
                }}
              />
              <input
                value={stageWhy}
                onChange={(e) => setStageWhy(e.target.value)}
                placeholder={'Why\u2019s this on your desk?'}
                aria-label="Why this doodle"
                maxLength={140}
                style={{
                  fontFamily: ISe,
                  fontSize: 14,
                  fontStyle: 'italic',
                  color: 'var(--dir-text-body)',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                }}
              />
            </div>
            <footer style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <button
                onClick={() => {
                  // Back = one layer down, strokes + fields intact (Escape
                  // lands here too). Cap state clears — re-staging re-measures.
                  setStaged(null);
                  setCapNote(null);
                  setShrunk(false);
                }}
                style={PILL}
              >
                Back
              </button>
              <button onClick={handlePlace} style={CTA}>Place on desk</button>
            </footer>
          </div>
        )}

        <footer style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
          {/* The armed Esc-confirm hint — visible feedback for the guarded
              close paths (Esc with strokes, scrim-click with strokes).
              Disarms itself after 3s; a second Esc while armed closes. */}
          {escapeArmed && (
            <span
              role="status"
              style={{
                fontFamily: IS,
                fontSize: 11,
                fontStyle: 'italic',
                color: 'var(--dir-accent)',
                marginRight: 'auto',
              }}
            >
              your sketch is unsaved — press Esc again (or Cancel) to discard it
            </span>
          )}
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
                  ? 'Draw or shade something first'
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
