import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { NavLink, useSearchParams } from 'react-router';
import { IS, ISe } from '../../lib/typography';
import { CTA, PILL, SECTION_LABEL, CHIP } from '../../lib/chromeStyles';
import { PAPER_GRAIN, WARM_POOL, OBJECT_SIT_SHADOW } from '../../lib/deskCraft';
import { normalizeSvgSize } from '../../lib/normalizeInput';
import { SvgStyleTransform } from '../canvas/SvgStyleTransform';
import { SmartHachureChrome } from '../chrome/SmartHachureChrome';
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
  MULTI_STROKE_STEPS,
  FILL_STYLE_STEPS,
  PALETTE_MODE_STEPS,
  TEXTURE_STEPS,
  DOT_PATTERN_STEPS,
  ENDPOINT_BEHAVIOR_STEPS,
  SKETCHING_STYLE_STEPS,
  PEN_TIP_STEPS,
  type F3ModifiersState,
} from '../../state/F3RoughModifiersContext';
import {
  CollapsiblePanel,
  PanelToggle,
  useMinimizeUi,
  usePanelOpen,
} from '../chrome/CollapsiblePanel';
import { DrawPanel } from './DrawPanel';
import { DrawerPanel } from './DrawerPanel';
import {
  getOpenDesk,
  listDesks,
  deleteDoodle,
  listDoodles,
  listDoodlesForDesk,
  publishDoodle,
  subscribeDoodles,
  subscribeDoodlesForDesk,
  updateDoodleMeta,
  updateDoodlePosition,
  type DeskRow,
  type DoodleRow,
} from '../../lib/publish';
import { getSessionId } from '../../lib/session';
import { supabase } from '../../lib/supabase';
import { sanitizeSvgMarkup } from '../../lib/svgUpload';
import { ObjectSurface, type ObjectSurfaceMode } from './ObjectSurface';

// ─── DeskPage — the REAL desk flow (/desk) ──────────────────────────────────
// Per docs/memory/project_desk_doodles_draw_panel_vs_desk_canvas.md: the desk
// canvas is the parent surface holding an array of OBJECTS; the DrawPanel
// popup produces ONE object per Done. /canvas stays as the drawing
// primitive's test surface — this page is the product flow.
// M9 WIRED 2026-06-11: every Done auto-publishes to Supabase, the desk loads
// the shared feed on mount, other sessions' doodles arrive live via
// realtime, and drag-end persists position (session-scoped, v1 trust model).
//
// MULTI-DESK (2026-06-11): grounded in docs/design/object-model-and-desk-
// architecture.md §"Multi-desk". Each public desk is capped (~50 objects);
// the data layer's publish_to_open_desk() RPC caps + auto-spawns the next desk
// server-side. This page is now DESK-AWARE: it views ONE desk at a time
// (the open one by default, or a specific past desk via ?desk=N), loads +
// subscribes scoped to THAT desk's id, and shows the desk's fun name + a
// count/cap readout. Drawing always routes to the OPEN desk; viewing a closed
// past desk still lets you add — the new object lands on the open desk and the
// view switches there. GRACEFUL FALLBACK: if getOpenDesk() returns null (the
// desks table isn't pasted yet), the whole page falls back to the flat
// single-desk listDoodles/subscribeDoodles/publishDoodle behavior so the app
// still works pre-SQL-paste.

// ─── THE PEN MODEL (D-6 + D-7, docs/design/global-toggles-and-mixed-3d.md) ──
// An object's treatment is a TREATMENT-STAGE RECORD: the global style + the
// full modifier state are snapshotted into `render_config` at the Done
// boundary, and each placed object renders from ITS OWN config — the right
// panel is your PEN (styles the draw popup + the NEXT doodle only). The
// Pen|Desk gate below flips the panel into the D-1/D-2 viewer-local lens
// (every object re-renders under the live panel state; records untouched;
// nobody else sees it). Objects with NO config (pre-existing rows) fall back
// to the live global state — exactly the pre-D-7 behavior, nothing breaks.
// The index signature is the STROKES-IN-THE-RECORD contract (2026-06-12):
// render_config may carry extra fields beyond the pen snapshot — today
// `strokes` (Array<Array<[x, y, pressure]>>, draw-canvas 800×600 viewBox
// space, written at the Done boundary below) — and every parse/persist hop
// must pass unknown fields through UNTOUCHED so the record's source strokes
// survive round-trips (Edit-restyle re-persists the whole config; a parser
// that rebuilt only {svgStyle, modifiers} would silently destroy them).
type ObjectRenderConfig = {
  svgStyle: F3SvgStyle;
  modifiers: F3ModifiersState;
  [extra: string]: unknown;
};

/** Discrete modifier keys → their legal enum values. parseRenderConfig checks
 *  string fields against these (a bare typeof check would let any string —
 *  e.g. fillStyle:"banana" from a hand-crafted row — into the render path). */
const MODIFIER_ENUMS: Partial<Record<keyof F3ModifiersState, readonly string[]>> = {
  multiStroke: MULTI_STROKE_STEPS,
  fillStyle: FILL_STYLE_STEPS,
  strokePalette: PALETTE_MODE_STEPS,
  fillPalette: PALETTE_MODE_STEPS,
  risoSecondaryColor: PALETTE_MODE_STEPS,
  texture: TEXTURE_STEPS,
  dotPattern: DOT_PATTERN_STEPS,
  endpointBehavior: ENDPOINT_BEHAVIOR_STEPS,
  sketchingStyle: SKETCHING_STYLE_STEPS,
  penTip: PEN_TIP_STEPS,
};

/** Parse a doodles.render_config jsonb payload → a render config, or null.
 *  Defensive on purpose (the column is anon-writable): the style must be a
 *  real F3SvgStyle, and modifier values are taken key-by-key ONLY where the
 *  type matches DEFAULT_MODIFIERS' (finite numbers; enum strings checked
 *  against their step lists) — unknown/missing keys fall back to the
 *  defaults, so configs stay forward-compatible as the modifier set grows.
 *  UNKNOWN TOP-LEVEL FIELDS (e.g. `strokes`) pass through untouched — the
 *  render path only reads svgStyle/modifiers, and consumers of the extras
 *  (3D conversion, re-draw) do their own validation. */
function parseRenderConfig(raw: unknown): ObjectRenderConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const style = rec.svgStyle;
  if (typeof style !== 'string' || !F3_SVG_STYLES.some((s) => s.id === style)) {
    return null;
  }
  const modifiers: F3ModifiersState = { ...DEFAULT_MODIFIERS };
  const rawMods = rec.modifiers;
  if (rawMods && typeof rawMods === 'object') {
    for (const key of Object.keys(DEFAULT_MODIFIERS) as (keyof F3ModifiersState)[]) {
      const v = (rawMods as Record<string, unknown>)[key];
      if (v == null || typeof v !== typeof DEFAULT_MODIFIERS[key]) continue;
      if (typeof v === 'number' && !Number.isFinite(v)) continue;
      const allowed = MODIFIER_ENUMS[key];
      if (typeof v === 'string' && allowed && !allowed.includes(v)) continue;
      (modifiers as Record<string, unknown>)[key] = v;
    }
  }
  // Spread-then-override: extras (strokes etc.) ride through as-is; the
  // validated svgStyle + modifiers replace their raw counterparts.
  return { ...rec, svgStyle: style as F3SvgStyle, modifiers };
}

// ─── LEGACY-ROW FREEZE (UX-audit fix 1, D-7) ────────────────────────────────
// Rows with NO render_config (pre-D-7 legacy rows — most of the live desk)
// used to fall back to the LIVE global context, so every Pen-scope slider
// move restyled the placed desk — flatly contradicting the Pen|Desk pill's
// promise that Pen touches NOTHING placed (audit finding). They now pin to
// this frozen DEFAULT snapshot at load: rough-handdrawn + DEFAULT_MODIFIERS
// is exactly what an untouched pen renders, so a fresh /desk visit looks
// byte-identical to before — the freeze only shows when the pen MOVES (and
// the desk now correctly doesn't). One module-level object so the reference
// is stable for the memoized render path (DeskObjectArt keys on it). The
// Desk lens still sweeps frozen rows — the lens slot renders straight off
// the live context regardless of config.
const LEGACY_FREEZE_CONFIG: ObjectRenderConfig = {
  svgStyle: 'rough-handdrawn',
  modifiers: DEFAULT_MODIFIERS,
};

/** Drag-to-place (DRAWER v2 item 2) — the drag payload MIME type. The drawer
 *  (drag source) sets JSON {svg, name, why, renderConfig} under this type;
 *  the desk below is the drop target and places a COPY at the drop point
 *  through the exact addObject sourceConfig path Place-here uses. */
const DD_DOODLE_MIME = 'application/x-dd-doodle';

/** Publish retry backoff (UX-audit fix 3): attempt 1 fails → wait 2s →
 *  attempt 2 → 6s → attempt 3. Three strikes = permanent failure (honest
 *  note on the object; it stays desk-local for this session). */
const PUBLISH_RETRY_DELAYS_MS = [2000, 6000];

type DeskObject = {
  id: string;
  /** Supabase row id once published/loaded — undefined only for the brief
   *  window between local add and the insert resolving (or on publish fail,
   *  where the object stays desk-local for this session). */
  dbId?: string;
  svgMarkup: string;
  x: number;
  y: number;
  rotation: number;
  // Rich-record fields (the object is a record, not a blob — design doc §1).
  // Populated from the DB row; undefined for a just-added local object until
  // its insert resolves. ownerSession drives own-vs-others (edit vs sandbox).
  name?: string | null;
  why?: string | null;
  ownerSession?: string | null;
  createdAt?: string | null;
  /** The pen snapshot this object was made under (D-6). Legacy pre-config
   *  rows arrive pinned to LEGACY_FREEZE_CONFIG at the row→object boundary,
   *  so by the time an object is on the desk this is never null in practice
   *  (the null branch survives as a render-path safety only). */
  renderConfig?: ObjectRenderConfig | null;
  /** PUBLISH HONESTY (UX-audit fix 3): undefined = saved (or first attempt
   *  in flight — quiet, the common case resolves in well under a second);
   *  'retrying' = a publish attempt failed and a backoff retry is scheduled;
   *  'failed' = all attempts failed — the object stays desk-local, and the
   *  badge says so instead of silently pretending it published. */
  saveState?: 'retrying' | 'failed';
};

/** Sync bridge between an object's stored render config and the NESTED
 *  providers wrapping its art — the same scoping pattern as ObjectSurface's
 *  SandboxRenderScope (nested providers shadow the app-root ones for this
 *  subtree only; the desk around it keeps reading the global context).
 *  One sharpening: children stay unmounted until the nested context HOLDS the
 *  config (useLayoutEffect lands before paint), so SvgStyleTransform's
 *  pipeline never runs at provider-default values — each object pays exactly
 *  ONE pipeline run, with its own config, on mount. */
function ObjectConfigScope({
  config,
  children,
}: {
  config: ObjectRenderConfig;
  children: ReactNode;
}) {
  const styleCtx = useF3SvgStyle();
  const modsCtx = useF3RoughModifiers();
  const { svgStyle, modifiers } = config;
  useLayoutEffect(() => {
    if (styleCtx.state !== svgStyle) styleCtx.setState(svgStyle);
  }, [styleCtx, svgStyle]);
  useLayoutEffect(() => {
    if (modsCtx.state !== modifiers) modsCtx.replace(modifiers);
  }, [modsCtx, modifiers]);
  // `modifiers` is referentially stable per object (parsed once at row→object
  // mapping), so replace() settles in one pass and this stays true after it.
  const synced = styleCtx.state === svgStyle && modsCtx.state === modifiers;
  return synced ? <>{children}</> : null;
}

/** One desk object's ART — the expensive SvgStyleTransform subtree, memoized
 *  on exactly (svgMarkup, renderConfig, deskLens). Position/rotation live on
 *  the wrapper OUTSIDE this memo, so drag never re-runs the rough.js
 *  pipeline — not even for the dragged object itself.
 *
 *  TWO render slots (R6 remount-determinism redesign, 2026-06-11):
 *  - The RECORD render is the object's own look. With a config: nested
 *    providers pin it to ITS OWN record (the global context never reaches
 *    that subtree — panel tweaks skip it). Without one (legacy row): it
 *    renders straight off the global context (follows the live pen, the
 *    pre-D-7 fallback). The record element is useMemo'd on
 *    (svgMarkup, renderConfig) ONLY, so lens flips never re-render it —
 *    its DOM is RETAINED (visibility-hidden) under the lens and re-shown
 *    untouched on flip-back.
 *  - The LENS render mounts only while the Desk scope is on, straight off
 *    the global context (context updates pierce React.memo by design, so
 *    the sweep restyles live), and unmounts when the lens lifts.
 *
 *  WHY retained-DOM instead of re-rendering on flip-back: the
 *  OBJECT_SIT_SHADOW (CSS drop-shadow) does not rasterize reproducibly over
 *  REGENERATED or re-shown-after-repaint nodes — its fractional offsets snap
 *  to one of two subpixel states depending on paint timing, which left the
 *  ink's edge pixels sub-perceptually jittered across flips (isolated by
 *  A/B-removing the filter → byte-identical). The fix is to never rebuild
 *  the record's raster at all: keep its DOM, keep its filter on a promoted
 *  layer, and hide it with a compositor-only opacity flip. That implements
 *  "lift the lens" literally (D-7 amendment 2: records untouched, every
 *  object RETURNS to its own look — here, the very same pixels). Opacity
 *  hiding also keeps layout alive, so a hidden legacy record re-rendering
 *  under a pen tweak still measures real getBBox values. */
const DeskObjectArt = memo(function DeskObjectArt({
  svgMarkup,
  renderConfig,
  deskLens,
}: {
  svgMarkup: string;
  renderConfig: ObjectRenderConfig | null;
  deskLens: boolean;
}) {
  const record = useMemo(() => {
    const art = (
      <SvgStyleTransform>
        <div dangerouslySetInnerHTML={{ __html: svgMarkup }} />
      </SvgStyleTransform>
    );
    if (!renderConfig) return art;
    return (
      <F3SvgStyleProvider>
        <F3RoughModifiersProvider>
          <ObjectConfigScope config={renderConfig}>{art}</ObjectConfigScope>
        </F3RoughModifiersProvider>
      </F3SvgStyleProvider>
    );
  }, [svgMarkup, renderConfig]);

  // Slot mechanics: the record box carries the sit-shadow filter on its OWN
  // permanently-promoted layer (willChange) and is hidden under the lens via
  // `opacity: 0` — an opacity flip on a composited layer is COMPOSITOR-ONLY,
  // so the record's raster (ink + shadow) is never rebuilt and flip-back
  // re-shows the exact same pixels. visibility/display hiding re-rasterized
  // on re-show and re-rolled the drop-shadow snap (measured). The lens is a
  // separate transient overlay with its own shadow, outside that layer, so
  // its mount/unmount can't disturb the record layer's bounds. Opacity is
  // set explicitly both ways so React can't leave a stale style residue.
  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          filter: OBJECT_SIT_SHADOW,
          willChange: 'filter, opacity',
          opacity: deskLens ? 0 : 1,
        }}
      >
        {record}
      </div>
      {deskLens && (
        <div style={{ position: 'absolute', left: 0, top: 0, filter: OBJECT_SIT_SHADOW }}>
          <SvgStyleTransform>
            <div dangerouslySetInnerHTML={{ __html: svgMarkup }} />
          </SvgStyleTransform>
        </div>
      )}
    </div>
  );
});

// ─── THE LIVE PREVIEW SQUIGGLE (D-7 amendment — REQUIRED with the gate) ─────
// In Pen mode the desk deliberately doesn't react to the panel, so without
// feedback the controls would FEEL broken. This sample stroke at the top of
// the panel renders through the CURRENT pen settings and re-renders the
// instant any control changes — direct manipulation, no tween (Procreate
// Brush Studio pattern: the brush panel never repaints the canvas; the
// preview stroke gives the hand immediate feedback). The markup is the exact
// commit-layer form a Done produces (fill="none" + primary-ink stroke, same
// width), so the preview IS what the next doodle will look like. Fixed path —
// fully deterministic, no randomness.
const PREVIEW_SQUIGGLE = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="60" viewBox="0 0 264 72"><path d="M 14 46 C 30 14 52 12 66 34 C 80 56 100 58 116 38 C 132 18 150 16 162 34 C 170 46 164 60 152 58 C 140 56 142 40 156 30 C 178 14 206 18 222 36 C 232 47 242 50 252 44" fill="none" stroke="var(--dir-text-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** memo with only the `deskLens` label prop: parent re-renders (drag moves,
 *  camera pans) skip it entirely; panel changes reach SvgStyleTransform's own
 *  context subscription directly, so the squiggle still updates instantly. */
const PenPreview = memo(function PenPreview({ deskLens }: { deskLens: boolean }) {
  return (
    <div
      style={{
        // Pinned above the scrolling controls — the preview must stay visible
        // while sliders deep in the panel are being dragged (that pairing IS
        // the feedback loop).
        position: 'sticky',
        top: 0,
        zIndex: 2,
        background: 'var(--dir-raised)',
        padding: '14px 20px 12px',
        borderBottom: '1px solid var(--dir-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={SECTION_LABEL}>Preview</span>
        <span
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontStyle: 'italic',
            color: 'var(--dir-text-body-soft)',
          }}
        >
          {deskLens ? 'the whole desk follows' : 'your next doodle'}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <SvgStyleTransform>
          <div dangerouslySetInnerHTML={{ __html: PREVIEW_SQUIGGLE }} />
        </SvgStyleTransform>
      </div>
    </div>
  );
});

/** One desk object = cheap positioned wrapper (drag updates ONLY this div's
 *  style) + the memoized art. React.memo here keeps the other N−1 objects
 *  from re-rendering at all while one is dragged: setObjects preserves the
 *  references of untouched objects, and every callback prop is stable. */
const DeskObjectView = memo(function DeskObjectView({
  obj,
  dragging,
  nudged,
  landing,
  deskLens,
  onPointerDown,
  onNudgeEnd,
  onLandEnd,
}: {
  obj: DeskObject;
  dragging: boolean;
  /** Foreign-drag feedback — plays the nudge-and-settle keyframe. */
  nudged: boolean;
  /** Fresh arrival — plays the ratified doodle-lands spring (scale-in
   *  0.92→1 slight overshoot + sit-shadow fade; 25-research motion table).
   *  Done-mints and drag-to-place drops share this ONE moment — no third
   *  motion family. Interruptible: pointer events stay live throughout. */
  landing: boolean;
  deskLens: boolean;
  onPointerDown: (e: React.PointerEvent, obj: DeskObject) => void;
  onNudgeEnd: () => void;
  onLandEnd: (id: string) => void;
}) {
  return (
    <div
      onPointerDown={(e) => onPointerDown(e, obj)}
      // Route by animationName — nudge and land (and their reduced-motion
      // twins) both fire animationend, and each clears only its own state.
      onAnimationEnd={
        nudged || landing
          ? (e) => {
              if (e.animationName.startsWith('dd-land')) onLandEnd(obj.id);
              else if (nudged) onNudgeEnd();
            }
          : undefined
      }
      // Both moments ride CLASSES (not inline animations) so the page's
      // prefers-reduced-motion media query can swap the keyframes — inline
      // styles can't be overridden by a media query (R5). All keyframes fire
      // animationend, so the states always clear. (An object can't be nudged
      // and landing at once — nudge is foreign-only, landing is own-only.)
      className={
        [nudged ? 'dd-nudge' : '', landing ? 'dd-land' : ''].filter(Boolean).join(' ') ||
        undefined
      }
      style={{
        position: 'absolute',
        left: obj.x,
        top: obj.y,
        transform: `rotate(${obj.rotation}deg)`,
        // The OBJECT_SIT_SHADOW filter lives INSIDE DeskObjectArt (per render
        // slot, on a promoted layer) — see the R6 note there for why the
        // wrapper itself must stay filter-free.
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {/* Markup already normalized to ~180px at the add boundary. */}
      <DeskObjectArt
        svgMarkup={obj.svgMarkup}
        renderConfig={obj.renderConfig ?? null}
        deskLens={deskLens}
      />
      {/* PUBLISH HONESTY badge (UX-audit fix 3) — quiet, under the object,
          only while a publish is retrying or has permanently failed. Faint
          paper backing so it reads over the grain; pointer-transparent so
          drag/click behave exactly as without it. */}
      {obj.saveState && (
        <span
          role="status"
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 4,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            fontFamily: IS,
            fontSize: 9,
            fontStyle: 'italic',
            letterSpacing: '0.02em',
            color: 'var(--dir-text-body-soft)',
            background: 'color-mix(in srgb, var(--dir-bg) 82%, transparent)',
            borderRadius: 999,
            padding: '2px 8px',
          }}
        >
          {obj.saveState === 'retrying'
            ? 'not saved — retrying'
            : 'couldn’t save — kept on your desk'}
        </span>
      )}
    </div>
  );
});

// ─── DESK SURFACE CRAFT ─────────────────────────────────────────────────────
// The desk should feel like a warm paper surface objects SIT on, not a flat div
// they float over (design doc §"The desk as a crafted surface"). The shared
// warm-paper material — PAPER_GRAIN (whisper of grain, NEVER wood/cork) +
// WARM_POOL (soft lamp pool) + OBJECT_SIT_SHADOW (lifted-not-floating shadow) —
// lives in lib/deskCraft so the desk and the ObjectCard read as the SAME stock.
// The desk adds one desk-only layer on top: an edge vignette + inset boxShadow
// for surface depth (a card has no edge vignette).

// ─── DESK CAMERA (pan/zoom) ─────────────────────────────────────────────────
// The camera is a pure VIEW transform: screen = desk·zoom + pan. Doodle
// positions are stored in DESK coordinates (x/y on the doodles table) and are
// NEVER rewritten because of camera state. The transform is applied to ONE
// desk-surface div that carries the warm-paper material (grain + pool +
// vignette) AND the objects, so zooming reads as leaning into a real desk —
// the grain magnifies with the doodles. Limits 25%–400% per Sebs's locked
// decision (desk metaphor, not Figma's 2%–25,600%).
type DeskCamera = { zoom: number; panX: number; panY: number };

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const CAMERA_HOME: DeskCamera = { zoom: 1, panX: 0, panY: 0 };
/** Per-click zoom step for the header − / + pills. */
const ZOOM_STEP = 1.25;

/** Zoom the camera by `factor`, keeping the desk point under the screen-space
 *  anchor (sx, sy — relative to the desk viewport) stationary:
 *  desk = (screen − pan) / zoom must be equal before and after, so
 *  pan' = screen − (screen − pan) · (zoom'/zoom). */
function zoomCameraAt(c: DeskCamera, sx: number, sy: number, factor: number): DeskCamera {
  const zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, c.zoom * factor));
  if (zoom === c.zoom) return c;
  const k = zoom / c.zoom;
  return { zoom, panX: sx - (sx - c.panX) * k, panY: sy - (sy - c.panY) * k };
}

/** The PAPER_GRAIN data-URI tile is 280×280 (deskCraft.ts svg width/height) —
 *  the viewport-fixed grain layer needs the natural tile size to scale its
 *  background-size by zoom so the tooth magnifies exactly like it did when it
 *  rode the camera transform. */
const GRAIN_TILE = 280;

/** PAN LEASH (R2): at least this many px of the lamp-pool working area must
 *  stay inside the desk viewport on each axis — the desk can wander onto the
 *  endless paper but never get LOST (recoverable by panning back, no Fit
 *  required). */
const PAN_LEASH_PX = 160;

/** Clamp pan so the working area (the camera plane: vw×vh desk units at
 *  `zoom`, screen rect [panX, panX+vw·zoom]×[panY, panY+vh·zoom]) keeps at
 *  least PAN_LEASH_PX visible on each axis. At very small zoom the leash
 *  shrinks to the working area's own on-screen size so the clamp range never
 *  inverts. Pure function — applied inside setCamera on every update. */
function leashCamera(c: DeskCamera, vw: number, vh: number): DeskCamera {
  const mx = Math.min(PAN_LEASH_PX, vw * c.zoom, vw);
  const my = Math.min(PAN_LEASH_PX, vh * c.zoom, vh);
  const panX = Math.min(vw - mx, Math.max(mx - vw * c.zoom, c.panX));
  const panY = Math.min(vh - my, Math.max(my - vh * c.zoom, c.panY));
  if (panX === c.panX && panY === c.panY) return c;
  return { ...c, panX, panY };
}

/** Deterministic 32-bit FNV-1a hash of an object id — seeds the scatter
 *  offset + rotation so a given id always lands the same way (no unseeded
 *  randomness in the add path). */
function hashId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Map a loaded/realtime DoodleRow → a desk object, sanitizing the SVG on read
 *  (RLS can't parse SVG, so this is the enforceable XSS layer for the shared
 *  feed — applies to both the initial load and the realtime insert paths). */
function rowToObject(r: DoodleRow): DeskObject {
  return {
    id: `row-${r.id}`,
    dbId: r.id,
    svgMarkup: sanitizeSvgMarkup(r.svg),
    x: r.x,
    y: r.y,
    rotation: r.rotation,
    name: r.name ?? null,
    why: r.why ?? null,
    ownerSession: r.session_id ?? null,
    createdAt: r.created_at ?? null,
    // The pen snapshot (D-6) — parsed ONCE here so the object's config is
    // referentially stable for the memoized render path. Pre-config legacy
    // rows pin to the frozen DEFAULT snapshot (UX-audit fix 1) so the Pen
    // scope touches nothing placed; the Desk lens still sweeps them.
    renderConfig: parseRenderConfig(r.render_config) ?? LEGACY_FREEZE_CONFIG,
  };
}

/** Read the optional ?desk=… target from the URL. May be a numeric desk index
 *  (e.g. ?desk=3) or a desk uuid. Returns null when absent. */
function readDeskParam(): { index: number | null; id: string | null } | null {
  try {
    const raw = new URL(window.location.href).searchParams.get('desk');
    if (!raw) return null;
    const n = Number(raw);
    if (Number.isInteger(n) && String(n) === raw.trim()) {
      return { index: n, id: null };
    }
    return { index: null, id: raw };
  } catch {
    return null;
  }
}

export function DeskPage() {
  // (Removed the smartHachure param-set + window.location.reload effect — the
  // engine defaults ON now (SvgStyleTransform), so it was dead weight AND it
  // caused a white reload-flash on every /desk visit where the desk briefly
  // emptied before objects reloaded. That flash read as "all objects
  // disappeared". Smart Hachure is on by default; ?smartHachure=0 opts out.)

  // The ?desk= target (numeric index or uuid). Read via react-router so a
  // gallery click that navigates to /desk?desk=N while ALREADY on /desk
  // re-resolves the view (the resolve effect keys on this value) — without it,
  // the param was read once on mount only and never switched.
  const [searchParams] = useSearchParams();
  const deskParam = searchParams.get('desk');

  const [objects, setObjects] = useState<DeskObject[]>([]);
  // Live mirror for event-time reads (P-1 smart placement scores candidate
  // landing spots against current objects without entering addObject's deps).
  const objectsRef = useRef<DeskObject[]>([]);
  objectsRef.current = objects;
  const [drawOpen, setDrawOpen] = useState(false);
  const [feedStatus, setFeedStatus] = useState<'loading' | 'live' | 'offline'>('loading');
  // Live mirror for the channel watcher below (interval closure reads the
  // CURRENT load state without re-arming on every transition).
  const feedStatusRef = useRef(feedStatus);
  feedStatusRef.current = feedStatus;
  const [rightOpen, toggleRight, setRightOpen] = usePanelOpen('desk.right');
  // THE DRAWER (ratified #26-32) — left panel, "My doodles" passive cross-desk
  // index (DrawerPanel). Defaults CLOSED: it's an index you open, not chrome
  // every fresh session pays 300px for. ⌘\ minimize-all covers both panels.
  const [drawerOpen, toggleDrawer, setDrawerOpen] = usePanelOpen('desk.drawer', false);
  useMinimizeUi([
    { open: rightOpen, setOpen: setRightOpen },
    { open: drawerOpen, setOpen: setDrawerOpen },
  ]);
  // Drawer refresh signal (#29 one-record semantics): bumped when a publish or
  // delete SETTLES so the index refetches and tracks the records — a desk
  // delete disappears from the drawer, a Done / place-copy appears in it.
  const [drawerNonce, setDrawerNonce] = useState(0);
  const bumpDrawer = useCallback(() => setDrawerNonce((n) => n + 1), []);

  // ── DOUBLE-PUBLISH GUARD (UX-audit fix 2) ────────────────────────────────
  // Staged markups whose publish hasn't settled yet. The naming-stage Place
  // double-fire (double-click / Enter+click racing) re-enters addObject with
  // the SAME staged markup before the first publish resolves — re-entries
  // are ignored until that publish settles (success or permanent failure),
  // so one Done mints exactly one object + one row.
  const inFlightPublishRef = useRef<Set<string>>(new Set());
  // PUBLISH RETRY timers (UX-audit fix 3) — per-object so unmount cancels
  // every pending backoff instead of letting a late retry fire into a
  // torn-down page.
  const retryTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(
    () => () => {
      retryTimersRef.current.forEach(clearTimeout);
      retryTimersRef.current.clear();
    },
    [],
  );

  // ── THE DOODLE-LANDS MOMENT (ratified, 25-research motion table) ─────────
  // ids currently playing the landing spring. Done-mints, Place-here copies
  // and drag-to-place drops ALL mark their optimistic add here — one shared
  // moment, reused, never a new motion family. Cleared by animationend.
  const [landingIds, setLandingIds] = useState<ReadonlySet<string>>(() => new Set());
  const markLanding = useCallback((id: string) => {
    setLandingIds((prev) => new Set(prev).add(id));
  }, []);
  const clearLanding = useCallback((id: string) => {
    setLandingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // ── HONEST CONNECTIVITY (R3/R4) ──────────────────────────────────────────
  // The ●Live chip must never lie: `feedStatus` tracks the LOAD lifecycle
  // (loading/live/offline-as-in-failed), `linkDown` tracks the LINK (navigator
  // connectivity + supabase realtime channel health). The chip shows
  // "○ Offline" when either says down. `reloadNonce` re-runs the whole
  // mount-resolve (fresh loads + fresh subscriptions — the verified
  // resubscribe path) — bumped on restore events, the auto-retry timer, and
  // the error-state Retry pill.
  const [linkDown, setLinkDown] = useState(false);
  const linkDownRef = useRef(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const retryNow = useCallback(() => setReloadNonce((n) => n + 1), []);
  const setLink = useCallback((down: boolean, reloadOnRecover: boolean) => {
    if (linkDownRef.current === down) return; // transitions only — no churn
    linkDownRef.current = down;
    setLinkDown(down);
    if (!down && reloadOnRecover) setReloadNonce((n) => n + 1);
  }, []);

  // navigator connectivity — the chip flips to ○ Offline the moment the
  // browser knows the link dropped (well under the ~2s budget); coming back
  // online triggers a full reload + resubscribe so the desk catches up on
  // anything missed while down.
  useEffect(() => {
    const goOffline = () => setLink(true, false);
    const goOnline = () => setLink(false, true);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    if (typeof navigator !== 'undefined' && navigator.onLine === false) setLink(true, false);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, [setLink]);

  // supabase realtime channel health — a 2s poll of the client's channel
  // states (event-driven UI state, never a render-path read). Only judged in
  // steady state (feed live): during desk switches channels legitimately pass
  // through closed/joining and must not flap the chip. All-channels
  // errored/closed → the socket is gone → ○ Offline; when supabase's own
  // reconnect lands the channels rejoin → chip recovers via a reload (fresh
  // subscription + catch-up, the path the sweep verified).
  useEffect(() => {
    const id = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return; // navigator owns this case
      if (feedStatusRef.current !== 'live') return;
      let channels: Array<{ state: string }> = [];
      try {
        channels = supabase.getChannels();
      } catch {
        return;
      }
      if (channels.length === 0) return; // nothing to judge (flat pre-realtime)
      const allDown = channels.every((c) => c.state === 'errored' || c.state === 'closed');
      setLink(allDown, true);
    }, 2000);
    return () => clearInterval(id);
  }, [setLink]);

  // FAILED LOAD ≠ EMPTY (R4): while a load has failed and the browser still
  // believes it's online, retry on a quiet 5s cadence. Navigator-offline skips
  // the timer — the 'online' event owns that resume.
  useEffect(() => {
    if (feedStatus !== 'offline') return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    const t = setTimeout(retryNow, 5000);
    return () => clearTimeout(t);
  }, [feedStatus, reloadNonce, retryNow]);

  // ── The Pen|Desk gate (D-7 ratified) ─────────────────────────────────────
  // 'pen' (default): the right panel styles the draw popup + the NEXT doodle;
  // placed objects render from their own records. 'desk': the sweep — the
  // panel becomes a viewer-local lens over every object (D-1/D-2: never
  // synced, never written into records; flipping back restores per-object
  // looks). React state only — a reload always lands back on Pen.
  const [panelScope, setPanelScope] = useState<'pen' | 'desk'>('pen');
  const deskLens = panelScope === 'desk';

  // The live global panel state — read here ONLY to snapshot it into the
  // object record at the Done boundary (D-6). The desk page subscribing to
  // these contexts is cheap now: per-object memoization keeps panel tweaks
  // from touching config-pinned objects.
  const { state: penStyle } = useF3SvgStyle();
  const { state: penModifiers } = useF3RoughModifiers();

  // ── Multi-desk view state ────────────────────────────────────────────────
  // `desk` is the desk currently being VIEWED (null = flat fallback / pre-v2
  // DB). `openDeskId` is the id of the desk that ACCEPTS new doodles — drawing
  // always routes there even while viewing a closed past desk. `freshNote` is
  // a transient friendly note shown when a fresh desk opens. A ref to the
  // active per-desk subscription's unsubscribe lets us tear it down when the
  // view switches desks.
  const [desk, setDesk] = useState<DeskRow | null>(null);
  const [openDeskId, setOpenDeskId] = useState<string | null>(null);
  const [freshNote, setFreshNote] = useState<string | null>(null);
  const deskSubRef = useRef<(() => void) | null>(null);
  const freshNoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Monotonic load token — every desk-view load bumps it; a load only applies
  // its results if it's still the latest. Guards against a slow earlier load
  // resolving after a faster later switch (rapid spawn-switches / ?desk nav).
  const loadTokenRef = useRef(0);

  const isViewingOpenDesk = desk == null || desk.id === openDeskId;

  // Load one desk's doodles + (re)attach a desk-scoped realtime subscription.
  // Used on mount, when ?desk switches the view, and when a publish spawns a
  // fresh desk. Replaces the previous desk subscription so realtime stays
  // scoped to THE desk on screen, not the whole world.
  const loadDeskView = useCallback((target: DeskRow) => {
    const token = ++loadTokenRef.current;
    setFeedStatus('loading');
    // Tear down any prior per-desk subscription before swapping the view.
    deskSubRef.current?.();
    deskSubRef.current = null;
    setDesk(target);

    listDoodlesForDesk(target.id)
      .then((rows) => {
        if (token !== loadTokenRef.current) return; // a newer load superseded us
        // Replace the desk's object set wholesale — switching desks shows a
        // clean slate of just this desk's (capped) objects.
        // NEWEST ON TOP: array order IS stacking order (absolute siblings
        // paint in DOM order), so reverse the newest-first feed to
        // oldest-first — the most recent doodle paints highest, and realtime
        // arrivals / fresh publishes (appended) keep landing on top.
        setObjects(rows.map(rowToObject).reverse());
        setFeedStatus('live');
      })
      .catch(() => {
        if (token === loadTokenRef.current) setFeedStatus('offline');
      });

    const unsubscribe = subscribeDoodlesForDesk(target.id, (row) => {
      // Own inserts are already on the desk optimistically — skip them.
      if (row.session_id === getSessionId()) return;
      setObjects((prev) =>
        prev.some((o) => o.dbId === row.id) ? prev : [...prev, rowToObject(row)],
      );
    });
    deskSubRef.current = unsubscribe;
  }, []);

  // ── Mount: resolve which desk to view, else fall back to the flat feed ────
  useEffect(() => {
    let cancelled = false;
    let flatUnsub: (() => void) | null = null;

    (async () => {
      let open: DeskRow | null = null;
      try {
        open = await getOpenDesk();
      } catch {
        // getOpenDesk threw (table absent / network) — flat fallback below.
        open = null;
      }
      if (cancelled) return;

      // ── FLAT FALLBACK (pre-v2 DB) — original single-desk behavior ────────
      if (!open) {
        setDesk(null);
        setOpenDeskId(null);
        listDoodles()
          .then((rows) => {
            if (cancelled) return;
            setObjects((prev) => {
              const have = new Set(prev.map((o) => o.dbId).filter(Boolean));
              const loaded = rows.filter((r) => !have.has(r.id)).map(rowToObject);
              // NEWEST ON TOP: reverse the newest-first feed to oldest-first
              // (array order = stacking order); local optimistic objects in
              // `prev` are the newest of all, so they stay above the load.
              return [...loaded.reverse(), ...prev];
            });
            setFeedStatus('live');
          })
          .catch(() => {
            if (!cancelled) setFeedStatus('offline');
          });
        flatUnsub = subscribeDoodles((row) => {
          if (row.session_id === getSessionId()) return;
          setObjects((prev) =>
            prev.some((o) => o.dbId === row.id) ? prev : [...prev, rowToObject(row)],
          );
        });
        return;
      }

      // ── MULTI-DESK ───────────────────────────────────────────────────────
      setOpenDeskId(open.id);

      // Resolve an optional ?desk=N|uuid read-context. If it names a real
      // desk, view it (read-only past desk); otherwise view the open desk.
      const param = readDeskParam();
      let target = open;
      if (param) {
        try {
          const all = await listDesks();
          if (cancelled) return;
          const match = all.find((d) =>
            param.id != null ? d.id === param.id : d.desk_index === param.index,
          );
          if (match) target = match;
        } catch {
          // listDesks failed — just view the open desk.
        }
      }
      if (cancelled) return;
      loadDeskView(target);
    })();

    return () => {
      cancelled = true;
      // Invalidate any in-flight desk load so a late resolve can't repaint a
      // torn-down component, and drop the live subscription + note timer.
      loadTokenRef.current++;
      deskSubRef.current?.();
      deskSubRef.current = null;
      flatUnsub?.();
      if (freshNoteTimerRef.current) clearTimeout(freshNoteTimerRef.current);
    };
    // deskParam: re-resolve the viewed desk when the ?desk= target changes
    // (e.g. clicking another gallery card while already on /desk). readDeskParam
    // inside reads the now-current URL, so the resolve picks up the new target.
    // reloadNonce: connectivity restore / auto-retry / Retry pill — re-runs the
    // whole resolve (fresh loads + fresh realtime subscriptions) so recovering
    // from offline actually reconnects instead of just relabeling the chip.
  }, [loadDeskView, deskParam, reloadNonce]);

  // Surface a transient "a fresh desk opened" note (auto-clears).
  const announceFreshDesk = useCallback((name: string) => {
    if (freshNoteTimerRef.current) clearTimeout(freshNoteTimerRef.current);
    setFreshNote(`“${name}” just opened — your doodle starts a fresh desk.`);
    freshNoteTimerRef.current = setTimeout(() => setFreshNote(null), 6000);
  }, []);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  // Every object press (own OR foreign) — pointer-up needs the pressed object
  // to tell click (open surface) from drag, and `mine` decides whether the
  // press may drag at all. draggingId stays own-objects-only.
  // startX/startY = the object's DESK coords at pointer-down: a within-slop
  // press still routes its pointermoves through the live drag path, so the
  // click branch must RESTORE these (R1) — otherwise every open applies an
  // unreverted, unpersisted micro-drag (≈8 desk px per open at 25% zoom).
  const pressRef = useRef<{
    id: string;
    mine: boolean;
    nudged: boolean;
    startX: number;
    startY: number;
  } | null>(null);
  // FOREIGN-DRAG BLOCK: id of the object currently playing its tiny
  // nudge-and-settle (you tried to drag someone else's doodle — it shrugs and
  // settles back, never ghost-moves). Cleared by the animation's end event.
  const [nudgeId, setNudgeId] = useState<string | null>(null);
  const clearNudge = useCallback(() => setNudgeId(null), []);
  // Drag offset in DESK coordinates: pointer-desk-position minus object
  // origin at pointer-down. Desk-space (not screen-space) so the same offset
  // stays exact at any zoom — moves divide screen deltas by zoom implicitly
  // by recomputing the pointer's desk position each event.
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  // Pointer-down position — lets pointer-up tell a CLICK (open the object
  // surface) from a DRAG (persist position) by movement distance. Screen-space
  // on purpose: click slop is a finger/mouse steadiness budget, not a desk
  // distance, so it must NOT shrink/grow with zoom.
  const downPosRef = useRef<{ x: number; y: number } | null>(null);
  const deskRef = useRef<HTMLDivElement>(null);
  // Monotonic counter for object ids — deterministic within a session.
  const counterRef = useRef(0);

  // ── Camera state ─────────────────────────────────────────────────────────
  // State drives the render; the ref mirror is updated inside the setter so
  // native listeners (non-passive wheel) + pointer handlers always read the
  // CURRENT camera without dep-array churn or stale closures.
  const [camera, setCameraState] = useState<DeskCamera>(CAMERA_HOME);
  const cameraRef = useRef<DeskCamera>(CAMERA_HOME);
  const setCamera = useCallback((updater: (c: DeskCamera) => DeskCamera) => {
    setCameraState((prev) => {
      let next = updater(prev);
      // PAN LEASH (R2): every camera update is clamped so the lamp-pool
      // working area can never be pushed fully out of view — the desk stays
      // recoverable by panning back, no Fit required. Event-driven measure
      // (setCamera only runs on input events), never a render-path read.
      const rect = deskRef.current?.getBoundingClientRect();
      if (rect && rect.width > 0) next = leashCamera(next, rect.width, rect.height);
      cameraRef.current = next;
      return next;
    });
  }, []);

  // Empty-desk drag-to-pan (mouse drag on the paper, not on an object).
  const [panning, setPanning] = useState(false);
  const panDragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(
    null,
  );

  /** Screen (client) point → desk coordinates through the current camera. */
  const screenToDesk = useCallback((clientX: number, clientY: number) => {
    const rect = deskRef.current?.getBoundingClientRect();
    const c = cameraRef.current;
    const left = rect ? rect.left : 0;
    const top = rect ? rect.top : 0;
    return { x: (clientX - left - c.panX) / c.zoom, y: (clientY - top - c.panY) / c.zoom };
  }, []);

  /** Header − / + pills: zoom about the CENTER of the desk viewport. */
  const zoomBy = useCallback(
    (factor: number) => {
      const rect = deskRef.current?.getBoundingClientRect();
      const sx = rect ? rect.width / 2 : 0;
      const sy = rect ? rect.height / 2 : 0;
      setCamera((c) => zoomCameraAt(c, sx, sy, factor));
    },
    [setCamera],
  );

  /** Fit = the full desk: zoom 100%, pan 0 (also ⌘/Ctrl+0). */
  const resetCamera = useCallback(() => setCamera(() => CAMERA_HOME), [setCamera]);

  // Wheel/trackpad camera input — native non-passive listener (React's onWheel
  // can't reliably preventDefault browser pinch-zoom/overscroll). Pinch
  // (ctrlKey wheel) + ⌘/Ctrl-wheel = zoom toward the CURSOR; plain two-finger
  // scroll = pan. Event-driven reads only — no per-frame measurement.
  useEffect(() => {
    const el = deskRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect();
        // Clamp the per-event delta so one mouse-wheel notch (±100+) steps
        // ~1.28× while trackpad pinch (small deltas) stays butter-smooth.
        const d = Math.min(50, Math.max(-50, e.deltaY));
        const factor = Math.exp(-d * 0.005);
        setCamera((c) => zoomCameraAt(c, e.clientX - rect.left, e.clientY - rect.top, factor));
      } else {
        setCamera((c) => ({ ...c, panX: c.panX - e.deltaX, panY: c.panY - e.deltaY }));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setCamera]);

  // ⌘/Ctrl+0 — reset the camera (and keep the browser's own zoom-reset from
  // firing while the desk is the surface being looked at).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        resetCamera();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [resetCamera]);

  // The ONE object surface slot (design doc §2) — Create lives in DrawPanel;
  // this holds Edit (your object) / Sandbox (someone else's). A single slot
  // means the object surface and DrawPanel can never both be open (no nesting).
  const [activeSurface, setActiveSurface] = useState<
    { mode: ObjectSurfaceMode; objectId: string } | null
  >(null);

  // ONE object per Done — the add boundary. normalizeSvgSize here is the
  // locked auto-resize decision (21-research §2): every object lands at
  // ~180px on its longest axis before entering the render pipeline.
  // `meta` rides in from the DrawPanel naming stage (2026-06-12): the raw
  // source strokes (already size-guarded by the panel per the strokes-in-the-
  // record contract) join the render_config snapshot, and name/why publish
  // with the row (publish_to_open_desk's p_name/p_why). All optional —
  // upload-SVG objects carry no strokes, a skipped naming stage publishes
  // nameless exactly as before.
  const addObject = useCallback(
    (
      rawMarkup: string,
      meta?: {
        strokes?: [number, number, number][][];
        name?: string | null;
        why?: string | null;
        /** DRAWER place-here COPY (#28): the SOURCE row's render_config,
         *  carried VERBATIM into the copy (strokes and any future extras ride
         *  through untouched) instead of snapshotting the live pen. null =
         *  the source predates configs — the copy publishes configless too
         *  (the row stays legacy; renders freeze on read, same rule as its
         *  original). Absent (undefined) = the normal pen-snapshot path. */
        sourceConfig?: Record<string, unknown> | null;
        /** DRAG-TO-PLACE (DRAWER v2 item 2): desk coordinates of the drop
         *  point. Present = the user CHOSE the spot — the object centers on
         *  it and P-1 smart placement stays out of the way. Absent = the
         *  normal scatter + anti-cover placement. */
        at?: { x: number; y: number };
      },
    ) => {
      // DOUBLE-PUBLISH GUARD (UX-audit fix 2): ignore re-entry while a
      // publish for this same staged markup is in flight (the naming-stage
      // Place double-fire) — released when that publish settles.
      if (inFlightPublishRef.current.has(rawMarkup)) return;
      inFlightPublishRef.current.add(rawMarkup);
      const svgMarkup = normalizeSvgSize(rawMarkup, 180);
      counterRef.current += 1;
      const id = `doodle-${counterRef.current}`;
      // Scatter near the center of the CURRENT VIEW, converted to desk
      // coordinates through the camera — so a new doodle always lands where
      // the user is looking, at any zoom/pan, and its stored x/y stay pure
      // desk coords. The measurement is event-driven (add click), not a
      // render-path read.
      const deskRect = deskRef.current?.getBoundingClientRect();
      const cam = cameraRef.current;
      const vw = deskRect ? deskRect.width : 800;
      const vh = deskRect ? deskRect.height : 600;
      const cx = (vw / 2 - cam.panX) / cam.zoom - 90; // ~180px object → center it
      const cy = (vh / 2 - cam.panY) / cam.zoom - 90;
      const h = hashId(id);
      const dx = (((h & 0xff) / 255) - 0.5) * 160; // ±80px
      const dy = ((((h >> 8) & 0xff) / 255) - 0.5) * 120; // ±60px
      const rotation = ((((h >> 16) & 0xff) / 255) - 0.5) * 16; // ±8°
      let x: number;
      let y: number;
      if (meta?.at) {
        // DRAG-TO-PLACE: land exactly where dropped — the ~180px object
        // centers on the drop point. The user chose this spot with their
        // hand; P-1 smart placement only owns the choice when nobody made one.
        x = meta.at.x - 90;
        y = meta.at.y - 90;
      } else {
        // P-1 SMART PLACEMENT (anti-cover — smart-system plan Phase P): score a
        // deterministic candidate set (hash spot first, then rings widening from
        // the view center) against existing objects' footprints and land on the
        // least-covered spot. Clear desk → hash spot wins (old behavior intact);
        // crowded desk → the doodle finds open paper instead of piling on.
        const FOOT = 190; // ~180px object + breathing room
        const candidates: Array<[number, number]> = [[cx + dx, cy + dy]];
        for (let ring = 1; ring <= 4; ring++) {
          for (let k = 0; k < 8; k++) {
            const ang = (((h % 8) + k) / 8) * Math.PI * 2 + ring * 0.39;
            const r = ring * 110;
            candidates.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * 0.72]);
          }
        }
        const overlapScore = (px: number, py: number) => {
          let s = 0;
          for (const o of objectsRef.current) {
            const ix = Math.max(0, FOOT - Math.abs(px - o.x));
            const iy = Math.max(0, FOOT - Math.abs(py - o.y));
            s += ix * iy;
          }
          return s;
        };
        x = candidates[0][0];
        y = candidates[0][1];
        let bestScore = overlapScore(x, y);
        for (let i = 1; i < candidates.length && bestScore > 0; i++) {
          const s = overlapScore(candidates[i][0], candidates[i][1]);
          if (s < bestScore - 1) {
            bestScore = s;
            x = candidates[i][0];
            y = candidates[i][1];
          }
        }
      }
      setDrawOpen(false);

      // D-6 — snapshot the PEN at the Done boundary: the current global style
      // + the full modifier state become this object's permanent record.
      // penModifiers is the context's state object (immutably replaced on
      // every change), so holding the reference is a true snapshot.
      // STROKES IN THE RECORD: the raw gesture rides the same snapshot
      // (optional field — absent on uploads), so the record holds the SOURCE
      // of the doodle, not just its look (the wedge: the hand survives).
      //
      // DRAWER COPY OVERRIDE (#28): when meta.sourceConfig is present (even
      // null) this Done is a place-here COPY — the row stores the source's
      // config BYTE-FOR-BYTE (publishConfig) and the optimistic object renders
      // under the same parse the reload path applies (localConfig via
      // parseRenderConfig, exactly what rowToObject would produce), so the
      // copy's first paint == its post-reload paint.
      const isCopy = meta !== undefined && meta.sourceConfig !== undefined;
      const penSnapshot: ObjectRenderConfig = {
        svgStyle: penStyle,
        modifiers: penModifiers,
        ...(meta?.strokes && meta.strokes.length > 0 ? { strokes: meta.strokes } : {}),
      };
      const publishConfig: Record<string, unknown> | null = isCopy
        ? (meta?.sourceConfig ?? null)
        : penSnapshot;
      // Configless copy sources pin to the same frozen DEFAULT the reload
      // path applies (UX-audit fix 1) — first paint == post-reload paint.
      const localConfig: ObjectRenderConfig | null = isCopy
        ? (parseRenderConfig(meta?.sourceConfig) ?? LEGACY_FREEZE_CONFIG)
        : penSnapshot;
      const name = meta?.name ?? null;
      const why = meta?.why ?? null;

      // Drawing always routes to the OPEN desk. If we're viewing a closed past
      // desk, optimistically showing the object here would be wrong (it lands
      // on a different desk), so only add it locally when we're already on the
      // open desk — otherwise the view-switch below repaints from the open
      // desk's feed and the new object arrives with it.
      if (isViewingOpenDesk) {
        // ownerSession on the optimistic add so clicking your just-drawn
        // object opens Edit (yours), not Sandbox, before the insert resolves.
        // renderConfig rides along so the optimistic object is pinned to the
        // pen it was drawn with from its very first paint; name/why from the
        // naming stage show up immediately if the object is opened.
        setObjects((prev) => [
          ...prev,
          {
            id,
            svgMarkup,
            x,
            y,
            rotation,
            ownerSession: getSessionId(),
            renderConfig: localConfig,
            name,
            why,
          },
        ]);
        // The ratified doodle-lands moment — Done-mints, Place-here copies
        // and drag-to-place drops all arrive through here, one shared spring.
        markLanding(id);
      }

      // M9 — auto-publish to the shared feed. The data layer's RPC handles the
      // per-desk cap + atomic spawn server-side; it returns the inserted row
      // AND the desk it actually landed on (a freshly-spawned one if this Done
      // filled the desk). renderConfig persists the pen snapshot into
      // doodles.render_config (D-6) so every viewer renders this object under
      // the look it was MADE with.
      //
      // PUBLISH HONESTY (UX-audit fix 3): a rejected publish no longer fails
      // silently — the optimistic object gets a quiet "not saved — retrying"
      // badge and the publish auto-retries on backoff (PUBLISH_RETRY_DELAYS_MS).
      // Success clears the badge; exhausting the attempts marks it honestly
      // failed and the object stays desk-local for this session. The in-flight
      // guard key is held through the retries, so a Place double-fire can't
      // sneak a duplicate in between attempts either.
      const payload = {
        svg: svgMarkup,
        x,
        y,
        rotation,
        name,
        why,
        deskId: openDeskId ?? undefined,
        renderConfig: publishConfig,
      };
      const settle = () => {
        inFlightPublishRef.current.delete(rawMarkup);
        const t = retryTimersRef.current.get(id);
        if (t) clearTimeout(t);
        retryTimersRef.current.delete(id);
      };
      const setSaveState = (s: DeskObject['saveState']) =>
        setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, saveState: s } : o)));
      const attempt = (tryNo: number) => {
        publishDoodle(payload)
          .then(({ row, desk: landedDesk }) => {
            settle();
            // The record exists now — the drawer index gains a row (#29).
            bumpDrawer();
            // The desk this object actually landed on (when v2 is live).
            if (landedDesk) {
              const spawnedFresh = openDeskId != null && landedDesk.id !== openDeskId;
              // The open desk may have advanced (this Done filled it and spawned
              // the next). Track the new open desk so future draws route right.
              setOpenDeskId(landedDesk.id);

              const switchingView = desk == null || landedDesk.id !== desk.id;
              if (switchingView) {
                // Either we were viewing a closed past desk (add routes to open),
                // or the desk just filled + spawned — show the now-open desk.
                if (spawnedFresh) announceFreshDesk(landedDesk.name);
                loadDeskView(landedDesk);
                return; // loadDeskView repaints; skip the local dbId patch.
              }
            }
            // Same desk still in view — attach the row id (drag/delete target)
            // + the server timestamp so the card shows a real date; clear any
            // retry badge (a late success after a failed first attempt).
            setObjects((prev) =>
              prev.map((o) =>
                o.id === id
                  ? {
                      ...o,
                      dbId: row.id,
                      createdAt: row.created_at ?? o.createdAt,
                      saveState: undefined,
                    }
                  : o,
              ),
            );
          })
          .catch((err) => {
            const delay = PUBLISH_RETRY_DELAYS_MS[tryNo - 1];
            if (delay != null) {
              console.warn(
                `[desk] publish attempt ${tryNo} failed — retrying in ${delay}ms:`,
                err.message,
              );
              setSaveState('retrying');
              const t = setTimeout(() => {
                retryTimersRef.current.delete(id);
                attempt(tryNo + 1);
              }, delay);
              retryTimersRef.current.set(id, t);
            } else {
              console.warn('[desk] publish failed permanently — object stays local:', err.message);
              settle();
              setSaveState('failed');
            }
          });
      };
      attempt(1);
    },
    [
      isViewingOpenDesk,
      openDeskId,
      desk,
      loadDeskView,
      announceFreshDesk,
      penStyle,
      penModifiers,
      bumpDrawer,
      markLanding,
    ],
  );

  // DRAWER "Place here" (#28: place = COPY) — publish a NEW row of the source
  // doodle onto the current OPEN desk through the exact addObject path (same
  // ~180px normalize, same P-1 smart placement, same optimistic add + RPC +
  // desk-spawn handling). The original row is untouched; the copy carries the
  // source's render_config verbatim — strokes included — so Edit on the copy
  // re-draws the same hand. The svg is sanitized on read (anon-writable
  // column), the same rule rowToObject applies to the feed.
  const placeFromDrawer = useCallback(
    (row: DoodleRow) => {
      addObject(sanitizeSvgMarkup(row.svg), {
        name: row.name ?? null,
        why: row.why ?? null,
        sourceConfig: row.render_config ?? null,
      });
    },
    [addObject],
  );

  // ── DRAG-TO-PLACE drop target (DRAWER v2 item 2) ─────────────────────────
  // The desk accepts drags carrying the DD_DOODLE_MIME payload (the drawer's
  // mini cards are the drag source). Drop = a COPY published at the drop
  // point through the exact addObject sourceConfig path Place-here uses
  // (same ~180px normalize, same optimistic add + RPC + desk-spawn handling,
  // same doodle-lands moment) — the keyboard/fallback Place-here pill stays.
  const handleDeskDragOver = useCallback((e: React.DragEvent) => {
    // dataTransfer VALUES are protected until drop — only the type list is
    // readable here, which is exactly enough to accept or ignore the drag.
    if (Array.from(e.dataTransfer.types).includes(DD_DOODLE_MIME)) {
      e.preventDefault(); // accept — without this the drop event never fires
      e.dataTransfer.dropEffect = 'copy'; // place = COPY (#28); the cursor says so
    }
  }, []);

  const handleDeskDrop = useCallback(
    (e: React.DragEvent) => {
      const raw = e.dataTransfer.getData(DD_DOODLE_MIME);
      if (!raw) return; // not ours — leave the event alone
      e.preventDefault();
      // Defensive parse — the payload crosses a string boundary, so it gets
      // the same treatment as a DB read: parse, type-check, sanitize.
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return;
      }
      const svg = payload.svg;
      if (typeof svg !== 'string' || svg.trim() === '') return;
      const rc = payload.renderConfig;
      // The drop point in DESK coordinates (camera-aware, any zoom/pan).
      const p = screenToDesk(e.clientX, e.clientY);
      addObject(sanitizeSvgMarkup(svg), {
        name: typeof payload.name === 'string' && payload.name ? payload.name : null,
        why: typeof payload.why === 'string' && payload.why ? payload.why : null,
        // sourceConfig present (even null) marks this Done a COPY — the
        // source's config rides verbatim, strokes included (#28).
        sourceConfig: rc && typeof rc === 'object' ? (rc as Record<string, unknown>) : null,
        at: p,
      });
    },
    [addObject, screenToDesk],
  );

  // Drag — same pointer-event pattern as the playground's placed items, but
  // camera-aware: the grab offset is captured in DESK coordinates (pointer's
  // desk position minus the object's origin), and every move recomputes the
  // pointer's desk position. Screen deltas therefore divide by zoom exactly —
  // the desk point grabbed at pointer-down stays under the cursor at 50% and
  // 200% alike. Stored x/y never change because of camera state.
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, obj: DeskObject) => {
      e.stopPropagation();
      downPosRef.current = { x: e.clientX, y: e.clientY };
      // FOREIGN-DRAG BLOCK: only YOUR objects drag. A press on someone else's
      // doodle is tracked (click still opens its Sandbox on pointer-up) but
      // never becomes a drag — a drag attempt just plays the nudge-and-settle
      // (see handlePointerMove). Unknown owner (null) counts as foreign: we
      // can't prove it's yours, and the server-side session scope would
      // reject the move anyway — so no ghost-move.
      const mine = obj.ownerSession != null && obj.ownerSession === getSessionId();
      pressRef.current = { id: obj.id, mine, nudged: false, startX: obj.x, startY: obj.y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      if (!mine) return;
      const p = screenToDesk(e.clientX, e.clientY);
      dragOffsetRef.current = { dx: p.x - obj.x, dy: p.y - obj.y };
      setDraggingId(obj.id);
    },
    [screenToDesk],
  );

  // Pointer-down on the EMPTY desk (objects stopPropagation, so reaching the
  // desk means paper) → start a drag-to-pan. Pan deltas are screen-space —
  // the camera's pan IS screen pixels (transform = translate(pan) scale(zoom)).
  const handleDeskPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const c = cameraRef.current;
    panDragRef.current = { startX: e.clientX, startY: e.clientY, panX: c.panX, panY: c.panY };
    setPanning(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Desk pan in flight — move the camera, never the objects.
      const pan = panDragRef.current;
      if (pan) {
        const dx = e.clientX - pan.startX;
        const dy = e.clientY - pan.startY;
        setCamera((c) => ({ ...c, panX: pan.panX + dx, panY: pan.panY + dy }));
        return;
      }
      // Foreign press pulled past the click slop = a drag attempt on someone
      // else's doodle → fire the nudge-and-settle ONCE per press and ignore
      // the rest of the gesture. The object never moves (no ghost-move).
      const press = pressRef.current;
      if (press && !press.mine) {
        const dp = downPosRef.current;
        if (dp && !press.nudged && Math.hypot(e.clientX - dp.x, e.clientY - dp.y) > 5) {
          press.nudged = true;
          setNudgeId(press.id);
        }
        return;
      }
      if (!draggingId || !deskRef.current) return;
      const p = screenToDesk(e.clientX, e.clientY);
      const x = p.x - dragOffsetRef.current.dx;
      const y = p.y - dragOffsetRef.current.dy;
      setObjects((prev) => prev.map((o) => (o.id === draggingId ? { ...o, x, y } : o)));
    },
    [draggingId, screenToDesk, setCamera],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (panDragRef.current) {
        panDragRef.current = null;
        setPanning(false);
      }
      const press = pressRef.current;
      if (press) {
        const obj = objects.find((o) => o.id === press.id);
        const dp = downPosRef.current;
        const moved = dp ? Math.hypot(e.clientX - dp.x, e.clientY - dp.y) : 999;
        // Touch taps jitter more than a mouse — a higher click threshold on
        // touch so a finger-roll tap still opens the surface (not a drag).
        const clickSlop = e.pointerType === 'touch' ? 12 : 5;
        if (e.type === 'pointerup' && moved < clickSlop && obj) {
          // A click, not a drag → open the ONE object surface: Edit if it's
          // yours, Sandbox if it's someone else's.
          // R1: within-slop pointermoves on an own object were applied as a
          // live drag (screen-px ÷ zoom → up to ~8 desk px at 25%), and the
          // click branch never persists — RESTORE the pointer-down coords so
          // opening a doodle never shifts it out of sync with the DB.
          if (press.mine && (obj.x !== press.startX || obj.y !== press.startY)) {
            setObjects((prev) =>
              prev.map((o) =>
                o.id === press.id ? { ...o, x: press.startX, y: press.startY } : o,
              ),
            );
          }
          setActiveSurface({ mode: press.mine ? 'edit' : 'sandbox', objectId: obj.id });
        } else if (press.mine && obj?.dbId) {
          // A real drag of YOUR object → persist the resting position
          // (session-scoped). Foreign presses never reach here as drags —
          // they already played the nudge and the object never moved.
          updateDoodlePosition(obj.dbId, obj.x, obj.y, obj.rotation).catch(() => {});
        }
      }
      setDraggingId(null);
      pressRef.current = null;
      downPosRef.current = null;
    },
    [objects],
  );

  // A cancelled/interrupted pointer (touch scroll-steal, OS gesture, palm
  // rejection) fires neither pointerup nor a reliable leave — without this the
  // drag stays glued to the object forever. Just end the drag/pan, never a click.
  const handlePointerCancel = useCallback(() => {
    // Restore the pressed object's coords (same as the click branch) — a
    // cancel mid-press (touch scroll-steal, OS gesture) must not leave the
    // unreverted micro-drag the click-open fix eliminated.
    const press = pressRef.current;
    if (press) {
      setObjects((prev) =>
        prev.map((o) => (o.id === press.id ? { ...o, x: press.startX, y: press.startY } : o)),
      );
    }
    setDraggingId(null);
    pressRef.current = null;
    downPosRef.current = null;
    panDragRef.current = null;
    setPanning(false);
  }, []);

  // Delete one of your own objects (Edit-mode action) — removes from the DB
  // (session-scoped) and the desk, then closes the surface. ONE RECORD (#29):
  // the drawer is a view of the same rows, so the settle bumps its refetch —
  // a desk delete disappears from the drawer too (and a rollback reappears).
  const handleDeleteObject = useCallback(
    (obj: DeskObject) => {
      setActiveSurface(null);
      // Optimistic remove, but ROLL BACK if the DB delete didn't actually remove
      // the row (not yours / failed) — never claim a delete that didn't happen.
      setObjects((prev) => prev.filter((o) => o.id !== obj.id));
      if (obj.dbId) {
        const restore = () =>
          setObjects((prev) => (prev.some((o) => o.id === obj.id) ? prev : [...prev, obj]));
        deleteDoodle(obj.dbId)
          .then((ok) => {
            if (!ok) restore();
          })
          .catch(restore)
          .finally(bumpDrawer);
      }
    },
    [bumpDrawer],
  );

  // Header desk readout — name + count/cap. Falls back to a neutral label on
  // the flat (pre-v2) path where there is no desk row.
  const deskTitle = desk?.name ?? 'Shared desk';
  const countReadout = desk
    ? `${objects.length} / ${desk.object_cap}`
    : `${objects.length}`;

  return (
    <div
      style={{
        // Definite height (not min-height) — same viewport-fit chain as
        // /canvas: header is auto, desk takes the measured leftover, the
        // page never scrolls.
        height: '100vh',
        background: 'var(--dir-bg)',
        color: 'var(--dir-text-primary)',
        fontFamily: IS,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* FOREIGN-DRAG nudge keyframes — a few px shrug + quick settle. Scoped
          here with the only consumer (DeskObjectView) rather than in shared
          CSS. Animates the standalone `translate` property so it composes
          with (never clobbers) the wrapper's rotate on `transform`.
          REDUCED MOTION (R5): prefers-reduced-motion swaps the shrug for a
          motion-free opacity dip of the same duration — feedback survives,
          movement doesn't, and animationend still fires to clear the state. */}
      <style>{`@keyframes dd-foreign-nudge {
        0% { translate: 0 0; }
        35% { translate: 5px 2px; rotate: 0.6deg; }
        70% { translate: -2px -1px; rotate: -0.3deg; }
        100% { translate: 0 0; rotate: 0deg; }
      }
      @keyframes dd-foreign-nudge-dim {
        0% { opacity: 1; }
        35% { opacity: 0.55; }
        100% { opacity: 1; }
      }
      .dd-nudge { animation: dd-foreign-nudge 280ms ease-out; }
      @media (prefers-reduced-motion: reduce) {
        .dd-nudge { animation: dd-foreign-nudge-dim 280ms ease-out; }
      }
      /* THE DOODLE-LANDS MOMENT (ratified, 25-research motion table): ONE
         spring — scale-in 0.92→1 with slight overshoot; the opacity ramp
         fades the ink AND its sit-shadow in together (the filter lives on
         the same subtree). Animates the standalone scale property so it
         composes with the wrapper's rotate — and stays interruptible
         (pointer events live throughout; a mid-spring grab just works).
         Done-mints and drag-to-place drops share this one moment — no
         third motion family. Reduced motion keeps the fade, drops the
         spring; both fire animationend so the landing state always clears. */
      @keyframes dd-land {
        0% { scale: 0.92; opacity: 0; }
        62% { scale: 1.015; opacity: 1; }
        100% { scale: 1; opacity: 1; }
      }
      @keyframes dd-land-dim {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      .dd-land { animation: dd-land 360ms cubic-bezier(0.22, 1, 0.36, 1); }
      @media (prefers-reduced-motion: reduce) {
        .dd-land { animation: dd-land-dim 360ms ease-out; }
      }`}</style>
      {/* Top chrome — HEADER CRAFT PASS (ROUND 6 spec): one shared control
          row; 12px gaps INSIDE clusters, 20px BETWEEN clusters; wordmark /
          desk name / count sit on ONE baseline; the zoom cluster reads as
          one unit; the Pen|Desk caption hangs under its pills without
          pushing them off the row axis; the LIVE chip centers with the
          pill row because everything centers on the same single row. */}
      <header
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--dir-border)',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 20,
          background: 'var(--dir-bg)',
        }}
      >
        {/* IDENTITY side — [wordmark · desk name · count] on one shared
            baseline (12px intra), then the DRAWER toggle with breathing room
            (20px inter; toggles-always-in-chrome, #30 left panel). */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, minWidth: 0 }}>
            <NavLink
              to="/"
              style={{
                fontFamily: ISe,
                fontSize: 18,
                letterSpacing: '-0.01em',
                color: 'var(--dir-text-primary)',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              Desk Doodles
            </NavLink>
            {/* Desk name from the desk row (deskName generator). overflow
                'clip' (not 'hidden') keeps the span's text baseline alive for
                the row's baseline alignment — a hidden-overflow flex item
                synthesizes its baseline from the border box and drifts. */}
            <span
              title={isViewingOpenDesk ? deskTitle : `${deskTitle} (past desk — viewing)`}
              style={{
                fontFamily: ISe,
                fontSize: 13,
                color: 'var(--dir-text-body)',
                whiteSpace: 'nowrap',
                overflow: 'clip',
                textOverflow: 'ellipsis',
                minWidth: 0,
              }}
            >
              {deskTitle}
              {!isViewingOpenDesk && (
                <span style={{ color: 'var(--dir-text-body-soft)' }}> · past desk</span>
              )}
            </span>
            {/* Objects-on-this-desk / cap — same baseline as the names. */}
            <span style={{ ...SECTION_LABEL, fontSize: 9, flexShrink: 0 }}>{countReadout}</span>
          </div>
          <PanelToggle
            side="left"
            open={drawerOpen}
            label="Drawer"
            onToggle={toggleDrawer}
            controlsId="desk-drawer-panel"
          />
        </div>

        <button onClick={() => setDrawOpen(true)} style={CTA}>
          Add doodle
        </button>

        {/* CONTROL side — four clusters at the 20px inter-cluster rhythm:
            scope gate · zoom unit · panel toggle · live chip. One row, one
            vertical center — nothing two-line in flow. */}
        <div style={{ justifySelf: 'end', display: 'flex', gap: 20, alignItems: 'center' }}>
          {/* THE PEN|DESK GATE (D-7 ratified) — scope is always visible, never
              implicit. Pen: the panel styles the draw popup + your NEXT doodle;
              placed records hold their own looks. Desk: the viewer-local sweep
              — the panel restyles everything you see (nobody else's view, no
              record writes; flipping back lifts the lens). The caption keeps
              the active scope readable without opening the doc — ABSOLUTE so
              it hangs under the pills (centered on them, never floating off)
              while the pill row itself stays on the shared control axis. */}
          <div style={{ position: 'relative' }}>
            <div role="tablist" aria-label="Panel scope" style={{ display: 'flex', gap: 4 }}>
              {(
                [
                  ['pen', 'Pen'],
                  ['desk', 'Desk'],
                ] as const
              ).map(([scope, label]) => (
                <button
                  key={scope}
                  role="tab"
                  aria-selected={panelScope === scope}
                  onClick={() => setPanelScope(scope)}
                  title={
                    scope === 'pen'
                      ? 'Pen — the panel styles your next doodle; placed doodles keep their own looks'
                      : 'Desk — the panel restyles the whole desk, just for you (nothing saves)'
                  }
                  style={{
                    ...PILL,
                    padding: '5px 12px',
                    background: panelScope === scope ? 'var(--dir-raised)' : 'transparent',
                    borderColor: panelScope === scope ? 'var(--dir-accent)' : 'var(--dir-border)',
                    color:
                      panelScope === scope
                        ? 'var(--dir-text-primary)'
                        : 'var(--dir-text-body-soft)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <span
              style={{
                position: 'absolute',
                top: 'calc(100% + 3px)',
                left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: IS,
                fontSize: 9,
                letterSpacing: '0.02em',
                color: 'var(--dir-text-body-soft)',
                whiteSpace: 'nowrap',
              }}
            >
              {deskLens
                ? 'restyling the whole desk — only you see this'
                : 'styling your next doodle'}
            </span>
          </div>
          {/* DESK CAMERA — ONE visual unit: a single bordered pill wrapping
              borderless − / % / + / Fit segments (shared bounding treatment
              per the craft spec). Toggles live in chrome, never on the desk;
              zoom steps about the viewport center; Fit = full desk (⌘0). */}
          <div
            role="group"
            aria-label="Desk zoom"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              padding: 2,
              border: '1px solid var(--dir-border)',
              borderRadius: 999,
            }}
          >
            <button
              onClick={() => zoomBy(1 / ZOOM_STEP)}
              title="Zoom out"
              aria-label="Zoom out"
              style={{ ...PILL, border: 'none', padding: '4px 10px' }}
            >
              −
            </button>
            <span
              title="Desk zoom"
              style={{
                ...CHIP,
                border: 'none',
                padding: '4px 2px',
                minWidth: 44,
                justifyContent: 'center',
                letterSpacing: '0.02em',
              }}
            >
              {Math.round(camera.zoom * 100)}%
            </span>
            <button
              onClick={() => zoomBy(ZOOM_STEP)}
              title="Zoom in"
              aria-label="Zoom in"
              style={{ ...PILL, border: 'none', padding: '4px 10px' }}
            >
              +
            </button>
            <button
              onClick={resetCamera}
              title="Fit the full desk (⌘0)"
              aria-label="Fit the full desk"
              style={{ ...PILL, border: 'none', padding: '4px 12px' }}
            >
              Fit
            </button>
          </div>
          <PanelToggle
            side="right"
            open={rightOpen}
            label="Controls"
            onToggle={toggleRight}
            controlsId="desk-right-panel"
          />
          {/* Auto-publish status — every Done saves itself, so there is no
              Publish button to press (M9 wired 2026-06-11). R3: the chip is
              HONEST — it reads the load lifecycle AND the link (navigator
              connectivity + realtime channel health), so a dropped connection
              flips it to ○ Offline within ~2s and a restore reconnects +
              brings it back to ● Live. */}
          {(() => {
            const chipState = linkDown || feedStatus === 'offline'
              ? 'offline'
              : feedStatus === 'loading'
                ? 'loading'
                : 'live';
            return (
              <span
                title={
                  chipState === 'live'
                    ? 'Connected — doodles save to the shared desk automatically'
                    : chipState === 'loading'
                      ? 'Connecting to the shared desk…'
                      : 'Offline — doodles stay on this desk until reconnect'
                }
                style={{
                  ...CHIP,
                  // Offline reads quieter; live/connecting use the default body ink.
                  color:
                    chipState === 'offline'
                      ? 'var(--dir-text-body-soft)'
                      : 'var(--dir-text-body)',
                }}
              >
                {chipState === 'live' ? '● Live' : chipState === 'loading' ? '○ Connecting' : '○ Offline'}
              </span>
            );
          })()}
        </div>
      </header>

      {/* Body — drawer (left) + desk surface + right Smart Hachure chrome */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left chrome — THE DRAWER (#26-32): "My doodles", the passive
            cross-desk index. Same fixed-but-collapsible system as the right
            panel; Place-here publishes a COPY through addObject (P-1). */}
        <CollapsiblePanel
          side="left"
          open={drawerOpen}
          width={300}
          id="desk-drawer-panel"
          style={{
            borderRight: '1px solid var(--dir-border)',
            background: 'var(--dir-raised)',
            overflowY: 'auto',
          }}
        >
          <DrawerPanel
            open={drawerOpen}
            refreshKey={drawerNonce}
            viewedDeskId={desk?.id ?? null}
            onPlace={placeFromDrawer}
          />
        </CollapsiblePanel>

        {/* THE DESK — full leftover viewport, objects scattered + draggable */}
        <main
          ref={deskRef}
          onPointerDown={handleDeskPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onDragOver={handleDeskDragOver}
          onDrop={handleDeskDrop}
          style={{
            flex: 1,
            minWidth: 0,
            position: 'relative',
            // The VIEWPORT — plain warm bg; the paper material lives on the
            // camera-transformed desk surface below, so leaning back (zoom
            // out) shows the desk's grained edge against the same warm tone.
            backgroundColor: 'var(--dir-bg)',
            overflow: 'hidden',
            cursor: panning || draggingId ? 'grabbing' : 'default',
            // The desk owns its gestures — no browser scroll/pinch stealing.
            touchAction: 'none',
          }}
        >
          {/* ENDLESS PAPER v2 (R2 — replaces the oversized in-camera layer,
              which still ENDED after ~3 viewport-widths of pan and showed a
              hard grain seam): the grain is now a VIEWPORT-FIXED layer whose
              background-position is driven by the camera's pan and whose
              background-size scales the natural 280px tile by zoom — exactly
              the screen = desk·zoom + pan mapping, but as an infinitely-tiling
              background. Infinite paper, one viewport-sized paint. */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'var(--dir-bg)',
              backgroundImage: PAPER_GRAIN,
              backgroundPosition: `${camera.panX}px ${camera.panY}px`,
              backgroundSize: `${GRAIN_TILE * camera.zoom}px ${GRAIN_TILE * camera.zoom}px`,
              pointerEvents: 'none',
            }}
          />
          {/* THE DESK SURFACE — the camera-transformed plane. The lamp pool,
              edge vignette + every object ride ONE transform, so zooming
              reads as leaning into a real desk, not scaling a flat div (the
              grain layer above tracks the same camera math from outside the
              transform). transformOrigin 0 0 keeps the screen = desk·zoom +
              pan math exact. */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              transform: `translate(${camera.panX}px, ${camera.panY}px) scale(${camera.zoom})`,
              transformOrigin: '0 0',
              willChange: 'transform',
            }}
          >
            {/* The LAMP POOL + vignette stay camera-space, sized to the
                working area — on an endless sheet, the light marks WHERE the
                desk is (and the R2 pan leash keeps it reachable). */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `${WARM_POOL}, radial-gradient(ellipse at 50% 38%, transparent 48%, rgba(60,50,40,0.07) 100%)`,
                boxShadow: 'inset 0 0 160px rgba(60,50,40,0.05)',
                pointerEvents: 'none',
              }}
            />
            {/* Array order IS stacking order (absolute siblings paint in DOM
                order) — the load paths reverse the newest-first feed and all
                add paths append, so the newest doodle always sits on top. */}
            {objects.map((obj) => (
              <DeskObjectView
                key={obj.id}
                obj={obj}
                dragging={draggingId === obj.id}
                nudged={nudgeId === obj.id}
                landing={landingIds.has(obj.id)}
                deskLens={deskLens}
                onPointerDown={handlePointerDown}
                onNudgeEnd={clearNudge}
                onLandEnd={clearLanding}
              />
            ))}
          </div>

          {/* Fresh-desk note — friendly, transient, auto-clears. Floats top-
              center over the desk so it doesn't reflow the layout. */}
          {freshNote && (
            <div
              role="status"
              style={{
                position: 'absolute',
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 5,
                ...PILL,
                cursor: 'default',
                background: 'var(--dir-raised)',
                color: 'var(--dir-text-body)',
                textTransform: 'none',
                letterSpacing: 0,
                fontWeight: 500,
                padding: '8px 16px',
                maxWidth: 'min(90%, 520px)',
                textAlign: 'center',
              }}
            >
              {freshNote}
            </div>
          )}

          {/* R4 — FAILED LOAD ≠ EMPTY: the friendly empty copy only renders
              when a load actually SUCCEEDED and the desk is truly empty. A
              failed load gets honest copy + a Retry pill (the 5s auto-retry
              runs regardless); while loading, say nothing rather than briefly
              lying that the desk is empty. */}
          {objects.length === 0 && feedStatus === 'offline' && (
            <div
              role="status"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--dir-text-body-soft)',
                fontFamily: IS,
                fontSize: 12,
                textAlign: 'center',
                lineHeight: 1.7,
                pointerEvents: 'none',
              }}
            >
              <span>
                Couldn’t reach the desk — retrying.<br />
                Anything you draw stays on this desk and publishes once it reconnects.
              </span>
              <button onClick={retryNow} onPointerDown={(e) => e.stopPropagation()} style={{ ...PILL, pointerEvents: 'auto' }}>
                Retry now
              </button>
            </div>
          )}

          {objects.length === 0 && feedStatus === 'live' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--dir-text-body-soft)',
                fontFamily: IS,
                fontSize: 12,
                textAlign: 'center',
                lineHeight: 1.7,
                pointerEvents: 'none',
              }}
            >
              {isViewingOpenDesk ? (
                <>
                  This desk is empty.<br />
                  Hit “Add doodle” to draw — each Done drops one object here.<br />
                  Drag doodles to arrange; the panel is your pen — it styles your next one.
                </>
              ) : (
                <>
                  This past desk is empty.<br />
                  Hit “Add doodle” to draw — new objects start on the open desk.
                </>
              )}
            </div>
          )}

        </main>

        {/* Right chrome — the PEN panel (D-7): live preview squiggle pinned on
            top, Smart Hachure controls below. In Pen scope tweaks style the
            squiggle + the next doodle; in Desk scope they sweep the desk. */}
        <CollapsiblePanel
          side="right"
          open={rightOpen}
          width={360}
          id="desk-right-panel"
          style={{
            borderLeft: '1px solid var(--dir-border)',
            background: 'var(--dir-raised)',
            overflowY: 'auto',
          }}
        >
          <PenPreview deskLens={deskLens} />
          <SmartHachureChrome />
        </CollapsiblePanel>
      </div>

      {/* Draw popup — unmounts on close, so each open is a fresh session.
          rightInset/leftInset center it over the VISIBLE desk when the
          controls panel and/or drawer are open (UX-audit fix 4). */}
      {drawOpen && (
        <DrawPanel
          onDone={addObject}
          onCancel={() => setDrawOpen(false)}
          rightInset={rightOpen ? 360 : 0}
          leftInset={drawerOpen ? 300 : 0}
        />
      )}

      {/* The one object surface — click an object to inspect it. Edit (yours)
          or Sandbox (someone else's); a single slot means it can never stack
          with the draw popup. */}
      {activeSurface &&
        (() => {
          const obj = objects.find((o) => o.id === activeSurface.objectId);
          if (!obj) return null;
          return (
            <ObjectSurface
              mode={activeSurface.mode}
              object={{
                svgMarkup: obj.svgMarkup,
                name: obj.name,
                why: obj.why,
                // Owner handle: "you" for yours, otherwise the maker's session
                // handle (real generated handles land with the identity layer;
                // for now the session id stands in so others aren't all "anon").
                owner: obj.ownerSession === getSessionId() ? 'you' : (obj.ownerSession ?? null),
                createdAt: obj.createdAt,
                id: obj.dbId ?? null,
                renderConfig: obj.renderConfig ?? null,
              }}
              onObjectUpdate={
                activeSurface.mode === 'edit'
                  ? (svgMarkup, config) => {
                      // Re-draw saved: the desk object updates in place (svg +
                      // re-pinned config); persistence already ran in the surface.
                      setObjects((prev) =>
                        prev.map((o) =>
                          o.id === obj.id
                            ? { ...o, svgMarkup, renderConfig: parseRenderConfig(config) }
                            : o,
                        ),
                      );
                    }
                  : undefined
              }
              onConfigSave={
                activeSurface.mode === 'edit'
                  ? (config) => {
                      // Re-pin the desk object to the saved config immediately
                      // (no reload needed); persistence already ran in the surface.
                      setObjects((prev) =>
                        prev.map((o) =>
                          o.id === obj.id
                            ? { ...o, renderConfig: parseRenderConfig(config) }
                            : o,
                        ),
                      );
                    }
                  : undefined
              }
              onClose={() => setActiveSurface(null)}
              onDelete={activeSurface.mode === 'edit' ? () => handleDeleteObject(obj) : undefined}
              onSave={
                activeSurface.mode === 'edit'
                  ? (name, why) => {
                      // Optimistic local update + persist (session-scoped RPC).
                      setObjects((prev) =>
                        prev.map((o) => (o.id === obj.id ? { ...o, name, why } : o)),
                      );
                      if (obj.dbId) updateDoodleMeta(obj.dbId, name, why).catch(() => {});
                    }
                  : undefined
              }
              // Center over the VISIBLE desk area — not behind the open
              // controls panel, and not behind the open drawer either.
              rightInset={rightOpen ? 360 : 0}
              leftInset={drawerOpen ? 300 : 0}
            />
          );
        })()}
    </div>
  );
}
