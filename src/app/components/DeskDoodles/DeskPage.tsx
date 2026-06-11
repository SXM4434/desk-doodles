import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router';
import { IS, ISe } from '../../lib/typography';
import { CTA, PILL, SECTION_LABEL, CHIP } from '../../lib/chromeStyles';
import { PAPER_GRAIN, WARM_POOL, OBJECT_SIT_SHADOW } from '../../lib/deskCraft';
import { normalizeSvgSize } from '../../lib/normalizeInput';
import { SvgStyleTransform } from '../canvas/SvgStyleTransform';
import { SmartHachureChrome } from '../chrome/SmartHachureChrome';
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
};

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
  const [drawOpen, setDrawOpen] = useState(false);
  const [feedStatus, setFeedStatus] = useState<'loading' | 'live' | 'offline'>('loading');
  const [rightOpen, toggleRight, setRightOpen] = usePanelOpen('desk.right');
  useMinimizeUi([{ open: rightOpen, setOpen: setRightOpen }]);

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
        setObjects(rows.map(rowToObject));
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
              return [...loaded, ...prev];
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
      const x = cx + dx;
      const y = cy + dy;
      setDrawOpen(false);

      // Drawing always routes to the OPEN desk. If we're viewing a closed past
      // desk, optimistically showing the object here would be wrong (it lands
      // on a different desk), so only add it locally when we're already on the
      // open desk — otherwise the view-switch below repaints from the open
      // desk's feed and the new object arrives with it.
      if (isViewingOpenDesk) {
        // ownerSession on the optimistic add so clicking your just-drawn
        // object opens Edit (yours), not Sandbox, before the insert resolves.
        setObjects((prev) => [
          ...prev,
          { id, svgMarkup, x, y, rotation, ownerSession: getSessionId() },
        ]);
      }

      // M9 — auto-publish to the shared feed. The data layer's RPC handles the
      // per-desk cap + atomic spawn server-side; it returns the inserted row
      // AND the desk it actually landed on (a freshly-spawned one if this Done
      // filled the desk). renderConfig is OUT OF SCOPE for this agent — pass
      // undefined; the data layer treats it as a null snapshot.
      publishDoodle({ svg: svgMarkup, x, y, rotation, deskId: openDeskId ?? undefined })
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
    [isViewingOpenDesk, openDeskId, desk, loadDeskView, announceFreshDesk],
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
      const p = screenToDesk(e.clientX, e.clientY);
      dragOffsetRef.current = { dx: p.x - obj.x, dy: p.y - obj.y };
      downPosRef.current = { x: e.clientX, y: e.clientY };
      setDraggingId(obj.id);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
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
      if (draggingId) {
        const obj = objects.find((o) => o.id === draggingId);
        const dp = downPosRef.current;
        const moved = dp ? Math.hypot(e.clientX - dp.x, e.clientY - dp.y) : 999;
        // Touch taps jitter more than a mouse — a higher click threshold on
        // touch so a finger-roll tap still opens the surface (not a drag).
        const clickSlop = e.pointerType === 'touch' ? 12 : 5;
        if (e.type === 'pointerup' && moved < clickSlop && obj) {
          // A click, not a drag → open the ONE object surface: Edit if it's
          // yours, Sandbox if it's someone else's.
          const mine = (obj.ownerSession ?? null) === getSessionId();
          setActiveSurface({ mode: mine ? 'edit' : 'sandbox', objectId: obj.id });
        } else if (obj?.dbId) {
          // A real drag → persist the resting position (session-scoped).
          updateDoodlePosition(obj.dbId, obj.x, obj.y, obj.rotation).catch(() => {});
        }
      }
      setDraggingId(null);
      downPosRef.current = null;
    },
    [draggingId, objects],
  );

  // A cancelled/interrupted pointer (touch scroll-steal, OS gesture, palm
  // rejection) fires neither pointerup nor a reliable leave — without this the
  // drag stays glued to the object forever. Just end the drag/pan, never a click.
  const handlePointerCancel = useCallback(() => {
    setDraggingId(null);
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
              backgroundColor: 'var(--dir-bg)',
              backgroundImage: `${PAPER_GRAIN}, ${WARM_POOL}, radial-gradient(ellipse at 50% 38%, transparent 48%, rgba(60,50,40,0.07) 100%)`,
              boxShadow: 'inset 0 0 160px rgba(60,50,40,0.05)',
            }}
          >
            {objects.map((obj) => (
              <div
                key={obj.id}
                onPointerDown={(e) => handlePointerDown(e, obj)}
                style={{
                  position: 'absolute',
                  left: obj.x,
                  top: obj.y,
                  transform: `rotate(${obj.rotation}deg)`,
                  // Sit on the surface, not float over it (warm layered shadow).
                  filter: OBJECT_SIT_SHADOW,
                  cursor: draggingId === obj.id ? 'grabbing' : 'grab',
                  touchAction: 'none',
                  userSelect: 'none',
                }}
              >
                {/* Markup already normalized to ~180px at the add boundary;
                    SvgStyleTransform applies the active style/modifiers. */}
                <SvgStyleTransform>
                  <div dangerouslySetInnerHTML={{ __html: obj.svgMarkup }} />
                </SvgStyleTransform>
              </div>
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
                  Drag objects to arrange; Controls restyle the whole desk.
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

        {/* Right chrome — Smart Hachure modifier panel; tweaks re-render the desk */}
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
