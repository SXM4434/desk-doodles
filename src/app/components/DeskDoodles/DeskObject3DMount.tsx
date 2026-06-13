import { Suspense, lazy, memo, useMemo, type CSSProperties } from 'react';
import type { StrokeInputPoint } from '../../lib/geometry3d/strokeTo3d';
import {
  resolveScene3DInputs,
  type Geometry3DConfig,
} from '../../lib/geometry3d/deskRenderMode';

// ─── DeskObject3DMount — the desk's per-object 3D render slot ─────────────────
// Gap-hunt H3 SCAFFOLD (docs/design/desk-flip-2d3d-seam.md §3 "the desk mount").
// The /canvas flip lives in DeskDoodlesCanvas.tsx, which lazy-loads Stroke3DScene
// and feeds it the LIVE in-memory strokes. A PLACED desk object has no such
// mount — DeskObjectArt only ever renders the 2D SvgStyleTransform subtree. This
// component is the missing 3D slot: given a placed object's stored strokes + its
// Geometry3DConfig (from render_config), it renders the SAME Stroke3DScene the
// /canvas flip uses, sourced from the RECORD instead of the live context.
//
// ── WHY A SEPARATE COMPONENT (not inline in DeskObjectArt) ──────────────────
// DeskObjectArt is in a HOT file (DeskPage.tsx, under active edit per the round
// ledger). Keeping the 3D mount here means the wiring at the seam is ONE branch
// in DeskObjectArt's render: `renderMode === '3d' ? <DeskObject3DMount …/> :
// <the existing 2D subtree>`. That one line is FLAGGED for the queue
// (desk-flip-2d3d-seam.md §"Wiring to flag"); this file is fully additive.
//
// ── LAZY CHUNK DISCIPLINE (matches DeskDoodlesCanvas) ───────────────────────
// Importing Stroke3DScene's VALUES pulls three + drei (~600KB gz) into the
// importer's chunk. DeskDoodlesCanvas keeps three out of the main chunk via
// React.lazy(() => import('../canvas3d')); this mount does the SAME so /desk's
// initial paint never ships three until an object actually renders in 3D. Only
// type-only imports above touch geometry3d (erased at compile).
//
// ── INTERACTION SCOPE (scaffold honesty) ────────────────────────────────────
// v1 of this mount is a STILL 3D render in the object's desk footprint: it
// shows the form, lit, in the object's own Geometry3DConfig. Whether desk
// objects get live per-object orbit (each a mini OrbitControls canvas) or a
// single shared desk camera is a DESIGN decision flagged for Sebs in the design
// doc — Stroke3DScene supports orbit, but N live R3F canvases on one desk is a
// perf question (3d-roundtrip-build-plan §5 risk 6 budgets ONE composer pass).
// This scaffold mounts the scene with orbit OFF by default via the `interactive`
// prop, so it's cheap and deterministic until that decision lands.

const Stroke3DSceneLazy = lazy(() => import('../canvas3d'));

/** Mirror of canvas3d MAX_STROKES_3D — kept by hand (importing the real
 *  constant would defeat the lazy chunk, same note as DeskDoodlesCanvas). */
const MAX_STROKES_3D = 60;

export interface DeskObject3DMountProps {
  /** The object's stored source strokes (render_config.strokes), viewBox coords.
   *  Pre-validated by the caller via flipEligibility — a 3d-mode object always
   *  has flippable strokes (the convert action gates on it). */
  strokes: StrokeInputPoint[][];
  /** The object's persisted 3D inputs (render_config.geometry3d). Undefined ⇒
   *  tuned defaults (resolveScene3DInputs fills them in). */
  config?: Geometry3DConfig | null;
  /** Source viewBox for the strokes. Default 800×600 (draw surface space). */
  viewBox?: { w: number; h: number };
  /** Whether the mount allows orbit. Default false (still render) — see the
   *  interaction-scope note above; the desk-wide decision is flagged for Sebs. */
  interactive?: boolean;
  /** Footprint — the desk object's ~180px box. The Canvas fills this. */
  style?: CSSProperties;
}

/** A quiet still placeholder shown while the lazy three chunk + scene load — no
 *  layout jump (fills the same footprint). Paper-toned so it reads as "the
 *  object is becoming 3D", not an error. */
function Mount3DFallback() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--dir-raised)',
        borderRadius: 8,
        fontSize: 10,
        fontStyle: 'italic',
        color: 'var(--dir-text-body-soft)',
      }}
    >
      lifting into 3D…
    </div>
  );
}

export const DeskObject3DMount = memo(function DeskObject3DMount({
  strokes,
  config,
  viewBox = { w: 800, h: 600 },
  interactive = false,
  style,
}: DeskObject3DMountProps) {
  // Resolve the record's (possibly partial) 3D config to the full prop bundle
  // Stroke3DScene needs — same fallbacks the /canvas Canvas3DContext applies.
  const resolved = useMemo(() => resolveScene3DInputs(config), [config]);
  // Cap the pool the same way /canvas does (perf budget, plan §5 risk 6).
  const pool = useMemo(
    () => strokes.filter((s) => s.length > 0).slice(0, MAX_STROKES_3D),
    [strokes],
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <Suspense fallback={<Mount3DFallback />}>
        <Stroke3DSceneLazy
          strokes={pool}
          viewBox={viewBox}
          geometryMode={resolved.geometryMode}
          style3d={resolved.style3d}
          materialPreset={resolved.materialPreset}
          nativeProps={resolved.nativeProps}
          modeParams={resolved.modeParams}
          initialTreatAsClosed={resolved.initialTreatAsClosed}
          // orbit is a Stroke3DScene concern; this scaffold leaves the scene's
          // own default controls in place. The `interactive` flag is surfaced
          // for the wiring layer once the desk-camera decision lands — see the
          // interaction-scope note. (Passed through style so the scene fills the
          // object footprint.)
          style={{ width: '100%', height: '100%', pointerEvents: interactive ? 'auto' : 'none' }}
        />
      </Suspense>
    </div>
  );
});
