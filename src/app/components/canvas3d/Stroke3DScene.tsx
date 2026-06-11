import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  DEFAULT_VIEWBOX,
  buildPoolSolidGeometry,
  buildStrokeGeometry,
  poolCenter,
  strokesKey,
  type GeometryModeSetting,
  type StrokeGeometryResult,
  type StrokeInputPoint,
  type ViewBoxSize,
} from '../../lib/geometry3d/strokeTo3d';

// ─── Stroke3DScene — R3F scene for the stroke→3D round-trip (NATIVE-first) ──
// Implements docs/design/3d-roundtrip-build-plan.md §2 with the plain-material
// MVP only (per feedback_native_first_then_variants — the NPR hatch pass is a
// LATER rock; nothing here imports postprocessing). Self-contained: the wiring
// layer (DrawSurface honesty gate / chrome pills) mounts this and passes
// strokes — this file reads no app contexts.
//
// Determinism: no unseeded randomness, no wall-clock reads. Same strokes +
// props → same scene.

const WARM_PAPER_FALLBACK = '#FDFCF9'; // theme.css --dir-bg (light direction)
const INK_SOFT_FALLBACK = '#3B362E'; // warm graphite — soft clay read under the key light

/** Perf budget (plan §5 risk 6): cap the pool; the wiring layer owns any
 *  user-facing "too many strokes" messaging. */
const MAX_STROKES_3D = 60;

/** Resolve the paper CSS var ONCE at mount (plan §2.1). WebGL cannot consume
 *  `var(--dir-bg)` strings — passing them to three fails silently to black
 *  (same family as feedback_media_overlay_ink_doesnt_flip). Hex fallback keeps
 *  the scene warm-paper even with no stylesheet (tests / Make cold mounts). */
function resolvePaperHex(): string {
  if (typeof document === 'undefined') return WARM_PAPER_FALLBACK;
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--dir-bg').trim();
    return v.length > 0 ? v : WARM_PAPER_FALLBACK;
  } catch {
    return WARM_PAPER_FALLBACK;
  }
}

export interface Stroke3DSceneProps {
  /** Raw strokes in viewBox coords (y-down). Points are [x, y] or
   *  [x, y, pressure] — DrawSurface's `stroke.points` pass through unchanged.
   *  Pressure is ignored in MVP (radius modulation = stretch 6.1). */
  strokes: StrokeInputPoint[][];
  /** Source coordinate space. Defaults to the draw surface's 800×600. */
  viewBox?: ViewBoxSize;
  /** 'auto' picks per stroke: open → rod, closed → extrude. The stretch
   *  modes are EXPLICIT-ONLY — auto never resolves to them: 'inflate'
   *  (swept variable-radius capsule) and 'solid' (whole pool rasterized into
   *  ONE watertight mass — renders as a single mesh). */
  geometryMode?: GeometryModeSetting;
  /** Background override. Default: --dir-bg resolved once at mount,
   *  warm-paper hex fallback. */
  background?: string;
  /** Mesh color (plain-material MVP). */
  inkColor?: string;
  style?: CSSProperties;
  className?: string;
}

/** One mesh per stroke (matches the 2D commit layer's one-<path>-per-stroke),
 *  grouped so OrbitControls orbit the whole doodle. Geometries are built in a
 *  useMemo and EXPLICITLY disposed on swap/unmount — programmatic geometries
 *  don't auto-dispose (plan §5 risk 2). */
function StrokeMeshes({
  strokes,
  viewBox,
  geometryMode,
  inkColor,
}: {
  strokes: StrokeInputPoint[][];
  viewBox: ViewBoxSize;
  geometryMode: GeometryModeSetting;
  inkColor: string;
}) {
  const key = strokesKey(strokes);

  const builds = useMemo<StrokeGeometryResult[]>(() => {
    const pool = strokes.filter((s) => s.length > 0).slice(0, MAX_STROKES_3D);
    if (pool.length === 0) return [];
    // Pool bbox center (NOT per-stroke) keeps the strokes' relative layout
    // and centers the whole doodle at the origin (plan §1.2).
    const center = poolCenter(pool, viewBox);
    if (geometryMode === 'solid') {
      // Solid is pool-level by nature: ALL strokes rasterize into ONE
      // watertight mass (research §5b) — a single mesh, not per-stroke.
      return [buildPoolSolidGeometry(pool, { viewBox, center })];
    }
    return pool.map((points) => buildStrokeGeometry(points, { viewBox, mode: geometryMode, center }));
    // `key` stands in for the strokes array identity (cheap deterministic key).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, geometryMode, viewBox.w, viewBox.h]);

  useEffect(() => {
    return () => {
      for (const b of builds) b.geometry.dispose();
    };
  }, [builds]);

  // Shared unit sphere for rod endpoint caps, scaled per cap (plan §1.1 —
  // sibling meshes instead of CSG merge).
  const capSphere = useMemo(() => new THREE.SphereGeometry(1, 16, 12), []);
  useEffect(() => {
    return () => capSphere.dispose();
  }, [capSphere]);

  return (
    <group>
      {builds.map((b, i) => (
        <group key={i}>
          <mesh geometry={b.geometry}>
            <meshStandardMaterial color={inkColor} roughness={0.85} metalness={0} />
          </mesh>
          {b.kind === 'rod' &&
            b.capPositions.map((p, j) => (
              <mesh key={j} geometry={capSphere} position={p} scale={b.radius}>
                <meshStandardMaterial color={inkColor} roughness={0.85} metalness={0} />
              </mesh>
            ))}
        </group>
      ))}
    </group>
  );
}

export function Stroke3DScene({
  strokes,
  viewBox = DEFAULT_VIEWBOX,
  geometryMode = 'auto',
  background,
  inkColor = INK_SOFT_FALLBACK,
  style,
  className,
}: Stroke3DSceneProps) {
  // Lazy initializer = resolved once at mount, never re-read during render.
  const [paper] = useState(resolvePaperHex);
  const bg = background ?? paper;

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.5, 7], fov: 40 }}
      gl={{ antialias: true }}
      style={style}
      className={className}
    >
      <color attach="background" args={[bg]} />
      {/* Soft lighting (plan §2.1): ambient floor + one directional key. The
          key light is what will make extrude faces shade at different levels
          once the hatch pass lands. */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} />
      <StrokeMeshes strokes={strokes} viewBox={viewBox} geometryMode={geometryMode} inkColor={inkColor} />
      <OrbitControls makeDefault enableDamping />
    </Canvas>
  );
}

// Default export so the wiring layer can `React.lazy(() => import(...))` and
// keep three+drei out of the main chunk (plan §2.3).
export default Stroke3DScene;
