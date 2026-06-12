import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
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
type ObjectRenderConfig = {
  svgStyle: F3SvgStyle;
  modifiers: F3ModifiersState;
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
 *  defaults, so configs stay forward-compatible as the modifier set grows. */
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
  return { svgStyle: style as F3SvgStyle, modifiers };
}

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
  /** The pen snapshot this object was made under (D-6). null = pre-config
   *  row → renders under the live global state (legacy fallback). */
  renderConfig?: ObjectRenderConfig | null;
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
 *  - PEN scope + config: nested providers pin the object to ITS OWN record
 *    (the global context never reaches this subtree — panel tweaks skip it).
 *  - DESK scope (the lens) or no config: renders straight off the global
 *    context; context updates pierce React.memo by design, so the sweep and
 *    the legacy fallback both restyle live. */
const DeskObjectArt = memo(function DeskObjectArt({
  svgMarkup,
  renderConfig,
  deskLens,
}: {
  svgMarkup: string;
  renderConfig: ObjectRenderConfig | null;
  deskLens: boolean;
}) {
  const art = (
    <SvgStyleTransform>
      <div dangerouslySetInnerHTML={{ __html: svgMarkup }} />
    </SvgStyleTransform>
  );
  if (deskLens || !renderConfig) return art;
  return (
    <F3SvgStyleProvider>
      <F3RoughModifiersProvider>
        <ObjectConfigScope config={renderConfig}>{art}</ObjectConfigScope>
      </F3RoughModifiersProvider>
    </F3SvgStyleProvider>
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
  deskLens,
  onPointerDown,
  onNudgeEnd,
}: {
  obj: DeskObject;
  dragging: boolean;
  /** Foreign-drag feedback — plays the nudge-and-settle keyframe. */
  nudged: boolean;
  deskLens: boolean;
  onPointerDown: (e: React.PointerEvent, obj: DeskObject) => void;
  onNudgeEnd: () => void;
}) {
  return (
    <div
      onPointerDown={(e) => onPointerDown(e, obj)}
      onAnimationEnd={nudged ? onNudgeEnd : undefined}
      style={{
        position: 'absolute',
        left: obj.x,
        top: obj.y,
        transform: `rotate(${obj.rotation}deg)`,
        // Sit on the surface, not float over it (warm layered shadow).
        filter: OBJECT_SIT_SHADOW,
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        // The nudge animates the CSS `translate` property, which composes
        // with (never clobbers) the rotation on `transform`.
        animation: nudged ? 'dd-foreign-nudge 280ms ease-out' : undefined,
      }}
    >
      {/* Markup already normalized to ~180px at the add boundary. */}
      <DeskObjectArt
        svgMarkup={obj.svgMarkup}
        renderConfig={obj.renderConfig ?? null}
        deskLens={deskLens}
      />
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
    // referentially stable for the memoized render path. null on pre-config
    // rows → live-global fallback.
    renderConfig: parseRenderConfig(r.render_config),
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
  const [rightOpen, toggleRight, setRightOpen] = usePanelOpen('desk.right');
  useMinimizeUi([{ open: rightOpen, setOpen: setRightOpen }]);

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
  }, [loadDeskView, deskParam]);

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
  const pressRef = useRef<{ id: string; mine: boolean; nudged: boolean } | null>(null);
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
      const next = updater(prev);
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
  const addObject = useCallback(
    (rawMarkup: string) => {
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
      let x = candidates[0][0];
      let y = candidates[0][1];
      let bestScore = overlapScore(x, y);
      for (let i = 1; i < candidates.length && bestScore > 0; i++) {
        const s = overlapScore(candidates[i][0], candidates[i][1]);
        if (s < bestScore - 1) {
          bestScore = s;
          x = candidates[i][0];
          y = candidates[i][1];
        }
      }
      setDrawOpen(false);

      // D-6 — snapshot the PEN at the Done boundary: the current global style
      // + the full modifier state become this object's permanent record.
      // penModifiers is the context's state object (immutably replaced on
      // every change), so holding the reference is a true snapshot.
      const renderConfig: ObjectRenderConfig = {
        svgStyle: penStyle,
        modifiers: penModifiers,
      };

      // Drawing always routes to the OPEN desk. If we're viewing a closed past
      // desk, optimistically showing the object here would be wrong (it lands
      // on a different desk), so only add it locally when we're already on the
      // open desk — otherwise the view-switch below repaints from the open
      // desk's feed and the new object arrives with it.
      if (isViewingOpenDesk) {
        // ownerSession on the optimistic add so clicking your just-drawn
        // object opens Edit (yours), not Sandbox, before the insert resolves.
        // renderConfig rides along so the optimistic object is pinned to the
        // pen it was drawn with from its very first paint.
        setObjects((prev) => [
          ...prev,
          { id, svgMarkup, x, y, rotation, ownerSession: getSessionId(), renderConfig },
        ]);
      }

      // M9 — auto-publish to the shared feed. The data layer's RPC handles the
      // per-desk cap + atomic spawn server-side; it returns the inserted row
      // AND the desk it actually landed on (a freshly-spawned one if this Done
      // filled the desk). renderConfig persists the pen snapshot into
      // doodles.render_config (D-6) so every viewer renders this object under
      // the look it was MADE with.
      publishDoodle({ svg: svgMarkup, x, y, rotation, deskId: openDeskId ?? undefined, renderConfig })
        .then(({ row, desk: landedDesk }) => {
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
          // + the server timestamp so the card shows a real date.
          setObjects((prev) =>
            prev.map((o) =>
              o.id === id ? { ...o, dbId: row.id, createdAt: row.created_at ?? o.createdAt } : o,
            ),
          );
        })
        .catch((err) => {
          console.warn('[desk] publish failed — object stays local:', err.message);
        });
    },
    [isViewingOpenDesk, openDeskId, desk, loadDeskView, announceFreshDesk, penStyle, penModifiers],
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
      pressRef.current = { id: obj.id, mine, nudged: false };
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
    setDraggingId(null);
    pressRef.current = null;
    downPosRef.current = null;
    panDragRef.current = null;
    setPanning(false);
  }, []);

  // Delete one of your own objects (Edit-mode action) — removes from the DB
  // (session-scoped) and the desk, then closes the surface.
  const handleDeleteObject = useCallback((obj: DeskObject) => {
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
        .catch(restore);
    }
  }, []);

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
          with (never clobbers) the wrapper's rotate on `transform`. */}
      <style>{`@keyframes dd-foreign-nudge {
        0% { translate: 0 0; }
        35% { translate: 5px 2px; rotate: 0.6deg; }
        70% { translate: -2px -1px; rotate: -0.3deg; }
        100% { translate: 0 0; rotate: 0deg; }
      }`}</style>
      {/* Top chrome — brand + desk readout left, Add doodle center, controls toggle + Live right */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
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

          {/* Current desk name + object count / cap. The name comes from the
              desk row (data layer generated it via deskName); the readout is
              objects-on-this-desk / cap. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span
              title={isViewingOpenDesk ? deskTitle : `${deskTitle} (past desk — viewing)`}
              style={{
                fontFamily: ISe,
                fontSize: 13,
                color: 'var(--dir-text-body)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {deskTitle}
              {!isViewingOpenDesk && (
                <span style={{ color: 'var(--dir-text-body-soft)' }}> · past desk</span>
              )}
            </span>
            <span style={{ ...SECTION_LABEL, fontSize: 9 }}>{countReadout}</span>
          </div>
        </div>

        <button onClick={() => setDrawOpen(true)} style={CTA}>
          Add doodle
        </button>

        <div style={{ justifySelf: 'end', display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* THE PEN|DESK GATE (D-7 ratified) — scope is always visible, never
              implicit. Pen: the panel styles the draw popup + your NEXT doodle;
              placed records hold their own looks. Desk: the viewer-local sweep
              — the panel restyles everything you see (nobody else's view, no
              record writes; flipping back lifts the lens). The caption keeps
              the active scope readable without opening the doc. */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              marginRight: 8,
            }}
          >
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
          {/* Desk camera controls — toggles live in chrome, never on the desk.
              − / % / + zoom about the viewport center; Fit = full desk (⌘0). */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              onClick={() => zoomBy(1 / ZOOM_STEP)}
              title="Zoom out"
              aria-label="Zoom out"
              style={{ ...PILL, padding: '6px 10px' }}
            >
              −
            </button>
            <span
              title="Desk zoom"
              style={{ ...CHIP, minWidth: 52, justifyContent: 'center', letterSpacing: '0.02em' }}
            >
              {Math.round(camera.zoom * 100)}%
            </span>
            <button
              onClick={() => zoomBy(ZOOM_STEP)}
              title="Zoom in"
              aria-label="Zoom in"
              style={{ ...PILL, padding: '6px 10px' }}
            >
              +
            </button>
            <button
              onClick={resetCamera}
              title="Fit the full desk (⌘0)"
              aria-label="Fit the full desk"
              style={PILL}
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
              Publish button to press (M9 wired 2026-06-11). */}
          <span
            title={
              feedStatus === 'live'
                ? 'Connected — doodles save to the shared desk automatically'
                : feedStatus === 'loading'
                  ? 'Connecting to the shared desk…'
                  : 'Offline — doodles stay on this desk until reconnect'
            }
            style={{
              ...CHIP,
              // Offline reads quieter; live/connecting use the default body ink.
              color:
                feedStatus === 'offline'
                  ? 'var(--dir-text-body-soft)'
                  : 'var(--dir-text-body)',
            }}
          >
            {feedStatus === 'live' ? '● Live' : feedStatus === 'loading' ? '○ Connecting' : '○ Offline'}
          </span>
        </div>
      </header>

      {/* Body — desk surface + right Smart Hachure chrome (restyles every object) */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* THE DESK — full leftover viewport, objects scattered + draggable */}
        <main
          ref={deskRef}
          onPointerDown={handleDeskPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
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
          {/* THE DESK SURFACE — the camera-transformed plane. Warm paper craft
              (fine grain, lamp pool, edge vignette — restraint over ornament,
              no scraps/wood) + every object ride ONE transform, so zooming
              magnifies the grain with the doodles and reads as leaning into a
              real desk, not scaling a flat div. transformOrigin 0 0 keeps the
              screen = desk·zoom + pan math exact. */}
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
            {/* ENDLESS PAPER (Sebs 2026-06-11 "the background doesn't extend"):
                the grain rides a hugely-oversized layer inside the camera so
                zooming out never reveals a void — the desk reads as one endless
                sheet. 700% at min zoom 0.25 still over-covers the viewport.
                pointerEvents none keeps pan/click targets unchanged. */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '-300%',
                top: '-300%',
                width: '700%',
                height: '700%',
                backgroundColor: 'var(--dir-bg)',
                backgroundImage: PAPER_GRAIN,
                pointerEvents: 'none',
              }}
            />
            {/* The LAMP POOL + vignette stay sized to the working area — on an
                endless sheet, the light marks WHERE the desk is. */}
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
                deskLens={deskLens}
                onPointerDown={handlePointerDown}
                onNudgeEnd={clearNudge}
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

          {objects.length === 0 && (
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
          rightInset centers it over the desk area when the controls panel is open. */}
      {drawOpen && (
        <DrawPanel
          onDone={addObject}
          onCancel={() => setDrawOpen(false)}
          rightInset={rightOpen ? 360 : 0}
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
              }}
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
              // Center over the desk area, not behind the open controls panel.
              rightInset={rightOpen ? 360 : 0}
            />
          );
        })()}
    </div>
  );
}
