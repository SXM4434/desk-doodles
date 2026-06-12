import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  DEFAULT_VIEWBOX,
  SPHERE_SEGMENTS,
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

// ── Warm-graphite material + studio rig — PORTED from Free Stroke ──────────
// PROVENANCE: free-stroke origin/main components/viewport-3d.tsx (liveMaterial
// MeshPhysicalMaterial + ambient/key/fill/rim + baked <Environment> with four
// Lightformer panels) and lib/style-system.ts MATERIAL_PARAMS. Read via
// `git show origin/main:...` 2026-06-12 — the local checkout is stale.
// ADAPTED for white paper: Free Stroke tunes charcoal ink (#26262b) against a
// dark viewport; on warm-paper white the same albedo collapses to a flat
// silhouette (Sebs 2026-06-12: "flat unlit black blobs"). The structure ports
// verbatim (3 directionals at FS positions + low ambient + baked env so
// clearcoat/sheen have something to reflect); albedo lifts to a mid warm
// graphite so DIFFUSE shading carries curvature, and a hemisphere light
// stands in for paper bounce. Verified by tools/3d/audit-sweep.mjs.
const INK_SOFT_FALLBACK = '#5A5043'; // warm graphite, mid tone — curvature shows on white
/** MeshPhysicalMaterial params — Free Stroke "ink" preset character (soft
 *  clearcoat + a whisper of sheen) re-balanced for a light background. */
const MATERIAL_PARAMS = {
  roughness: 0.48,
  metalness: 0.0,
  clearcoat: 0.6,
  clearcoatRoughness: 0.22,
  reflectivity: 0.5,
  sheen: 0.35,
  sheenRoughness: 0.6,
  sheenColor: '#d8c9ae', // warm paper-tinted sheen — soft top glow, not plastic
  envMapIntensity: 0.8,
} as const;
/** Ground-contact shadow (soft AO pool under the doodle — the cue that the
 *  form is an OBJECT above paper, not a flat mark on it). */
const CONTACT_SHADOW = {
  opacity: 0.32,
  blur: 2.6,
  color: '#3a3128',
  resolution: 256,
  scale: 14, // pool is ≤ 8 world units wide — covers with margin
  far: 6, // capture height above the plane
} as const;
/** Gap between the lowest geometry point and the shadow plane. */
const CONTACT_SHADOW_DROP = 0.04;

// ── Content-fit camera framing — PORTED from Free Stroke ───────────────────
// PROVENANCE: viewport-3d.tsx `bounds.center + dir · bounds.radius × FRAME_K`
// (FRAME_K = 3.0, verbatim). Without it the camera sits at a FIXED distance,
// so a full-canvas doodle (8×6 world units) overflows the ~5-unit frustum —
// big closed shapes rendered as a wall filling 100% of the frame (the worst
// "blob" case the 2026-06-12 sweep caught: framedSketch/pitchDeckCover auto
// + solid). Free Stroke frames along the (1,1,1) iso diagonal; we keep a
// gentler mostly-frontal 3/4 so the doodle still reads as the drawing, with
// top + side walls visible for depth.
const FRAME_K = 3.0;
const FRAME_DIR = new THREE.Vector3(0.5, 0.55, 1).normalize();
/** Floor on the framing radius so a dot-tap doodle doesn't slam the camera
 *  into the near plane. */
const FRAME_MIN_RADIUS = 1.2;

interface PoolBounds {
  center: THREE.Vector3;
  radius: number;
  minY: number;
}

/** Deterministic one-shot camera fit: position = center + dir·radius·K,
 *  target = center. Re-runs only when the pool bounds change (new strokes /
 *  mode) — user orbits are never fought mid-gesture. */
function CameraFramer({ bounds }: { bounds: PoolBounds | null }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as {
    target: THREE.Vector3;
    update: () => void;
  } | null;
  useEffect(() => {
    if (!bounds) return;
    const radius = Math.max(bounds.radius, FRAME_MIN_RADIUS);
    camera.position
      .copy(bounds.center)
      .addScaledVector(FRAME_DIR, radius * FRAME_K);
    camera.lookAt(bounds.center);
    if (controls) {
      controls.target.copy(bounds.center);
      controls.update();
    }
  }, [bounds, camera, controls]);
  return null;
}

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
  material,
}: {
  strokes: StrokeInputPoint[][];
  viewBox: ViewBoxSize;
  geometryMode: GeometryModeSetting;
  material: THREE.Material;
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

  // Shared unit sphere for rod endpoint caps AND joint spheres, scaled per
  // use (plan §1.1 — sibling meshes instead of CSG merge). Tessellation =
  // free-stroke SPHERE_SEGMENTS (14×14, origin/main lib/geometry-engines.ts).
  const capSphere = useMemo(() => new THREE.SphereGeometry(1, SPHERE_SEGMENTS, SPHERE_SEGMENTS), []);
  useEffect(() => {
    return () => capSphere.dispose();
  }, [capSphere]);

  // World-space pool bounds across every geometry (incl. cap/joint spheres,
  // which extend radius around their centerline positions). Drives the
  // ground-contact shadow plane (minY) AND the content-fit camera framing
  // (center + radius). Deterministic: pure function of builds.
  const bounds = useMemo<PoolBounds | null>(() => {
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (const b of builds) {
      b.geometry.computeBoundingBox();
      const bb = b.geometry.boundingBox;
      if (bb && Number.isFinite(bb.min.x) && Number.isFinite(bb.max.x)) {
        min.min(bb.min);
        max.max(bb.max);
      }
      if (b.kind === 'rod') {
        for (const p of b.capPositions.concat(b.jointPositions)) {
          min.min(new THREE.Vector3(p.x - b.radius, p.y - b.radius, p.z - b.radius));
          max.max(new THREE.Vector3(p.x + b.radius, p.y + b.radius, p.z + b.radius));
        }
      }
    }
    if (!Number.isFinite(min.x) || !Number.isFinite(max.x)) return null;
    const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
    const radius = new THREE.Vector3().subVectors(max, min).length() / 2;
    return { center, radius, minY: min.y };
  }, [builds]);

  return (
    <group>
      {builds.map((b, i) => (
        <group key={i}>
          <mesh geometry={b.geometry} material={material} />
          {b.kind === 'rod' &&
            b.capPositions.map((p, j) => (
              <mesh key={j} geometry={capSphere} position={p} scale={b.radius} material={material} />
            ))}
          {/* Joint spheres (free-stroke ink-blob character): centerline
              spheres at tube radius fill the pinch crease at kinks. */}
          {b.kind === 'rod' &&
            b.jointPositions.map((p, j) => (
              <mesh key={`j${j}`} geometry={capSphere} position={p} scale={b.radius} material={material} />
            ))}
        </group>
      ))}
      {/* Soft ground-contact shadow (rig adaptation for white paper — grounds
          the form so it reads as an object, not a flat mark). frames={1} bakes
          ONCE per mount = deterministic; the key remounts it whenever the
          strokes/mode (and therefore the geometry) change. Scale rides the
          pool radius so big doodles keep a full shadow pool. */}
      {builds.length > 0 && bounds && (
        <ContactShadows
          key={`${key}|${geometryMode}`}
          frames={1}
          position={[bounds.center.x, bounds.minY - CONTACT_SHADOW_DROP, bounds.center.z]}
          opacity={CONTACT_SHADOW.opacity}
          blur={CONTACT_SHADOW.blur}
          color={CONTACT_SHADOW.color}
          resolution={CONTACT_SHADOW.resolution}
          scale={Math.max(CONTACT_SHADOW.scale, bounds.radius * 3)}
          far={CONTACT_SHADOW.far}
        />
      )}
      <CameraFramer bounds={bounds} />
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

  // ONE shared MeshPhysicalMaterial for every mesh (Free Stroke liveMaterial
  // pattern) — disposed on color change / unmount.
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(inkColor),
        roughness: MATERIAL_PARAMS.roughness,
        metalness: MATERIAL_PARAMS.metalness,
        clearcoat: MATERIAL_PARAMS.clearcoat,
        clearcoatRoughness: MATERIAL_PARAMS.clearcoatRoughness,
        reflectivity: MATERIAL_PARAMS.reflectivity,
        sheen: MATERIAL_PARAMS.sheen,
        sheenRoughness: MATERIAL_PARAMS.sheenRoughness,
        sheenColor: new THREE.Color(MATERIAL_PARAMS.sheenColor),
        envMapIntensity: MATERIAL_PARAMS.envMapIntensity,
      }),
    [inkColor],
  );
  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.5, 7], fov: 40 }}
      gl={{ antialias: true }}
      style={style}
      className={className}
    >
      <color attach="background" args={[bg]} />
      {/* Studio rig — Free Stroke key+fill+rim structure (positions verbatim
          from viewport-3d.tsx), re-balanced for white paper: hemisphere light
          stands in for paper bounce (sky-warm above, paper-bounce below) and
          the ambient floor drops so form shading keeps its gradient range. */}
      <ambientLight intensity={0.25} />
      <hemisphereLight args={['#fff7e8', '#cdbfa6', 0.55]} />
      <directionalLight position={[5, 8, 5]} intensity={1.45} color="#fff3e0" />
      <directionalLight position={[-4, 2, -2]} intensity={0.5} color="#e3eaf2" />
      <directionalLight position={[0, -3, -5]} intensity={0.3} />
      {/* Soft near point light (white-paper adaptation): directionals shade a
          FLAT camera-facing extrude face perfectly uniformly (constant N·L) —
          a nearby point light varies with position, so flat faces get a real
          brightness gradient instead of the blob read. decay 2 physical. */}
      <pointLight position={[4, 5, 6.5]} intensity={75} decay={2} color="#fff6e6" />
      {/* Offline studio environment (no HDR fetch) — ported from Free Stroke:
          clearcoat/sheen need something to reflect or the physical material
          collapses to flat diffuse. resolution 256, frames={1} bakes it ONCE
          (static, deterministic, no per-frame cost). Panels warmed to match
          the paper-world palette. */}
      <Environment resolution={256} frames={1} background={false}>
        <color attach="background" args={['#8a8174']} />
        {/* Big soft key panel (top-front) → broad clearcoat highlight */}
        <Lightformer
          form="rect"
          intensity={3}
          color="#fffaf0"
          position={[2.5, 4, 3]}
          rotation={[-Math.PI / 3, 0, 0]}
          scale={[8, 6, 1]}
        />
        {/* Cool rim panel (back-left) → separates the form's dark side */}
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#bcd0e8"
          position={[-4, 1.5, -3]}
          rotation={[0, Math.PI / 2.2, 0]}
          scale={[5, 4, 1]}
        />
        {/* Warm low fill (front-low) → soft underside glow for sheen */}
        <Lightformer
          form="rect"
          intensity={1.1}
          color="#ffd9b0"
          position={[1, -2.5, 2]}
          rotation={[Math.PI / 2.5, 0, 0]}
          scale={[6, 3, 1]}
        />
        {/* Tight bright streak → crisp specular accent on curvature */}
        <Lightformer
          form="rect"
          intensity={4}
          color="#ffffff"
          position={[-1.5, 3, 2.5]}
          rotation={[-Math.PI / 4, 0, 0]}
          scale={[0.6, 5, 1]}
        />
      </Environment>
      <StrokeMeshes strokes={strokes} viewBox={viewBox} geometryMode={geometryMode} material={material} />
      <OrbitControls makeDefault enableDamping />
    </Canvas>
  );
}

// Default export so the wiring layer can `React.lazy(() => import(...))` and
// keep three+drei out of the main chunk (plan §2.3).
export default Stroke3DScene;
