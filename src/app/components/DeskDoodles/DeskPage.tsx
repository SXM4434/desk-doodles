import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from '../../lib/typography';
import { CTA, PILL, SECTION_LABEL } from '../../lib/chromeStyles';
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
// The desk should feel like a warm paper surface objects SIT on, not a flat
// div they float over (design doc §"The desk as a crafted surface"). Warmth,
// not realism: a whisper of fractalNoise grain (NEVER wood/cork — that's the
// tacky failure) + a soft surface vignette for depth. Grain is a tiled,
// desaturated feTurbulence at ~4% opacity baked into a data-URI so it costs
// nothing to render and never reflows.
const DESK_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.05'/%3E%3C/svg%3E\")";

// Objects sit, not float — layered, hue-tinted (warm, not pure black) shadows:
// a tight contact shadow + a softer ambient one, light from above-left
// (Comeau). Subtle enough on loose ink that it reads as "lifted off the
// paper," never embossed.
const OBJECT_SIT_SHADOW =
  'drop-shadow(0.5px 1px 0.5px rgba(60,50,40,0.13)) drop-shadow(1.5px 3px 3px rgba(60,50,40,0.07))';

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
  // Auto-enable Smart Hachure on the desk (same opt-in pattern as /canvas +
  // /playground). Running it at page level means the param is already set
  // before the DrawPanel ever mounts — DrawSurface's own check then no-ops,
  // so opening the panel never triggers a mid-session reload.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('smartHachure') !== '1') {
      url.searchParams.set('smartHachure', '1');
      window.history.replaceState({}, '', url.toString());
      window.location.reload();
    }
  }, []);

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
  }, [loadDeskView]);

  // Surface a transient "a fresh desk opened" note (auto-clears).
  const announceFreshDesk = useCallback((name: string) => {
    if (freshNoteTimerRef.current) clearTimeout(freshNoteTimerRef.current);
    setFreshNote(`“${name}” just opened — your doodle starts a fresh desk.`);
    freshNoteTimerRef.current = setTimeout(() => setFreshNote(null), 6000);
  }, []);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  // Pointer-down position — lets pointer-up tell a CLICK (open the object
  // surface) from a DRAG (persist position) by movement distance.
  const downPosRef = useRef<{ x: number; y: number } | null>(null);
  const deskRef = useRef<HTMLDivElement>(null);
  // Monotonic counter for object ids — deterministic within a session.
  const counterRef = useRef(0);

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
      // Scatter near desk center with a small seeded offset + tilt. The desk
      // measurement is event-driven (add click), not a render-path read.
      const deskRect = deskRef.current?.getBoundingClientRect();
      const cx = (deskRect ? deskRect.width / 2 : 400) - 90; // ~180px object → center it
      const cy = (deskRect ? deskRect.height / 2 : 300) - 90;
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

  // Drag — same pointer-event pattern as the playground's placed items.
  const handlePointerDown = useCallback((e: React.PointerEvent, obj: DeskObject) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffsetRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    downPosRef.current = { x: e.clientX, y: e.clientY };
    setDraggingId(obj.id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingId || !deskRef.current) return;
      const deskRect = deskRef.current.getBoundingClientRect();
      const x = e.clientX - deskRect.left - dragOffsetRef.current.dx;
      const y = e.clientY - deskRect.top - dragOffsetRef.current.dy;
      setObjects((prev) => prev.map((o) => (o.id === draggingId ? { ...o, x, y } : o)));
    },
    [draggingId],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
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
  // drag stays glued to the object forever. Just end the drag, never a click.
  const handlePointerCancel = useCallback(() => {
    setDraggingId(null);
    downPosRef.current = null;
  }, []);

  // Delete one of your own objects (Edit-mode action) — removes from the DB
  // (session-scoped) and the desk, then closes the surface.
  const handleDeleteObject = useCallback((obj: DeskObject) => {
    if (obj.dbId) deleteDoodle(obj.dbId).catch(() => {});
    setObjects((prev) => prev.filter((o) => o.id !== obj.id));
    setActiveSurface(null);
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
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '4px 12px',
              borderRadius: 999,
              border: '1px solid var(--dir-border)',
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
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{
            flex: 1,
            minWidth: 0,
            position: 'relative',
            // Warm paper surface — a desk under a soft lamp. Restraint over
            // ornament (no scraps/wood): just three quiet layers — fine grain,
            // a warm pool of light pooling toward the working center, and an
            // edge vignette for depth. Together they read "lit desk," not
            // "flat div," without competing with the doodles.
            backgroundColor: 'var(--dir-bg)',
            backgroundImage: `${DESK_GRAIN}, radial-gradient(ellipse 70% 64% at 50% 40%, rgba(255,246,229,0.55) 0%, rgba(255,246,229,0) 62%), radial-gradient(ellipse at 50% 38%, transparent 48%, rgba(60,50,40,0.07) 100%)`,
            boxShadow: 'inset 0 0 160px rgba(60,50,40,0.05)',
            overflow: 'hidden',
            cursor: draggingId ? 'grabbing' : 'default',
          }}
        >
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

      {/* Draw popup — unmounts on close, so each open is a fresh session. */}
      {drawOpen && <DrawPanel onDone={addObject} onCancel={() => setDrawOpen(false)} />}

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
            />
          );
        })()}
    </div>
  );
}
