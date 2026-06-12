import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  DEFAULT_VIEWBOX,
  DEDUPE_MIN_DIST,
  EXTRUDE_BEVEL_SEGMENTS,
  EXTRUDE_BEVEL_SIZE,
  EXTRUDE_BEVEL_THICKNESS,
  EXTRUDE_SMOOTH_MIN_ANCHORS,
  INFLATE_BASE_RADIUS,
  INFLATE_PRESSURE_INFLUENCE,
  INFLATE_TIP_RADIUS,
  JOINT_ANGLE_THRESHOLD_DEG,
  JOINT_DEDUP_FACTOR,
  JOINT_ENDPOINT_EPS_FACTOR,
  MIN_EXTRUDE_AREA,
  ROD_RADIUS,
  SOLID_INK_RADIUS,
  SPHERE_SEGMENTS,
  WORLD_SCALE,
  buildExtrudeGeometry,
  buildInflateGeometry,
  buildPoolSolidGeometry,
  buildRodGeometry,
  extractPressures,
  isClosedStroke,
  normalizeStrokePoints,
  poolCenter,
  rdpPoints,
  resolveGeometryMode,
  strokesKey,
  type GeometryModeSetting,
  type StrokeGeometryResult,
  type StrokeInputPoint,
  type ViewBoxSize,
} from '../../lib/geometry3d/strokeTo3d';
import {
  DEFAULT_MODE3D_PARAMS,
  extrudeBevelAutoDisabled,
  extrudeEffectiveDepth,
  inflatePuffAspectZ,
  type Mode3DParams,
} from './modeParams';
import {
  INK_3D_DEFAULT,
  MATERIAL_PARAMS_3D,
  MODE_MATERIAL_DEFAULTS_3D,
  type MaterialPresetId,
} from './materials3d';
import { createHatchMaterial, updateHatchUniforms, type HatchInputs } from './hatchMaterial';

// ─── Stroke3DScene — R3F scene for the stroke→3D round-trip ────────────────
// Round-7 chrome-split build (docs/design/3d-mode-controls-spec.md): the scene
// now consumes the FULL per-mode param sets + the 3-style taxonomy:
//   · Native   — FS MeshPhysicalMaterial presets (materials3d.ts, D-C)
//   · Hatch    — band-quantized procedural hachure, uniforms from the LIVE 2D
//                Shading sliders (hatchMaterial.ts — one math, two renderers)
//   · SVG-port — M8 v1: same band machinery + the 2D chrome's mark grammar
//                (fillStyle/wobble/fillOpacity) + ink EdgesGeometry outline.
// Self-contained: the wiring layer (DeskDoodlesCanvas / chrome) passes strokes
// + params — this file reads no app contexts.
//
// Determinism: no unseeded randomness, no wall-clock reads. Same strokes +
// props → same scene.

const WARM_PAPER_FALLBACK = '#FDFCF9'; // theme.css --dir-bg (light direction)

// ── Studio rig — PORTED from Free Stroke ───────────────────────────────────
// PROVENANCE: free-stroke origin/main components/viewport-3d.tsx (ambient/key/
// fill/rim + baked <Environment> with four Lightformer panels), read via
// `git show origin/main:...` 2026-06-12. ADAPTED for white paper (hemisphere
// stands in for paper bounce). The single mid-graphite material that lived
// here (#5A5043) is GONE per amendment D2-E — it sat at the W1 caption-ink
// tier and produced the bronze/clay read. Native now uses the FS material
// presets verbatim (materials3d.ts); ink for the mark styles = INK_3D_DEFAULT.

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
// (FRAME_K = 3.0, verbatim). Gentler mostly-frontal 3/4 so the doodle still
// reads as the drawing, with top + side walls visible for depth.
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

// ── Param-default sync guard (dev only) ─────────────────────────────────────
// modeParams.ts duplicates strokeTo3d defaults as literals (it must stay
// three-free for the lazy-chunk split). This assert catches drift the moment
// either side moves.
if (import.meta.env.DEV) {
  const d = DEFAULT_MODE3D_PARAMS;
  if (
    d.rod.radius !== ROD_RADIUS ||
    d.rod.jointSensitivityDeg !== JOINT_ANGLE_THRESHOLD_DEG ||
    d.inflate.baseRadius !== INFLATE_BASE_RADIUS ||
    d.inflate.tipRadius !== INFLATE_TIP_RADIUS ||
    d.inflate.pressureInfluence !== INFLATE_PRESSURE_INFLUENCE ||
    d.solid.inkRadius !== SOLID_INK_RADIUS
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      '[Stroke3DScene] modeParams defaults drifted from strokeTo3d constants — re-sync modeParams.ts',
    );
  }
}

// ── Local mirrors of strokeTo3d module-private steps ────────────────────────
// strokeTo3d.ts is the geometry rock's file (exclusive ownership) — the two
// helpers below mirror its private logic so the spec'd params (joint
// sensitivity 20–70°, bevel toggle) are REAL today. Followup filed for the
// builders to grow `jointAngleThresholdDeg` / `bevelEnabled` options so these
// mirrors can be deleted (cross-rock contract, see rock report).

const DEDUPE_MIN_DIST_SQ = DEDUPE_MIN_DIST * DEDUPE_MIN_DIST;
function dedupeConsecutiveLocal(world: THREE.Vector3[]): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  for (const v of world) {
    const prev = out[out.length - 1];
    if (!prev || prev.distanceToSquared(v) > DEDUPE_MIN_DIST_SQ) out.push(v);
  }
  return out;
}

/** MIRROR of strokeTo3d detectJointPositions (FS detectJoints3D semantics)
 *  with the angle threshold as a PARAMETER — at 40° output is identical to
 *  the lib walk; the chrome's Joint-sensitivity slider drives it 20–70°. */
function detectJointsWithAngle(
  filtered: THREE.Vector3[],
  startPt: THREE.Vector3,
  endPt: THREE.Vector3,
  radius: number,
  angleDeg: number,
): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const angleThresholdRad = (angleDeg * Math.PI) / 180;
  const endpointEps = radius * JOINT_ENDPOINT_EPS_FACTOR;
  const jointDedup = radius * JOINT_DEDUP_FACTOR;
  for (let i = 1; i < filtered.length - 1; i++) {
    const prev = filtered[i - 1];
    const curr = filtered[i];
    const next = filtered[i + 1];
    const ax = curr.x - prev.x, ay = curr.y - prev.y, az = curr.z - prev.z;
    const bx = next.x - curr.x, by = next.y - curr.y, bz = next.z - curr.z;
    const magA = Math.sqrt(ax * ax + ay * ay + az * az);
    const magB = Math.sqrt(bx * bx + by * by + bz * bz);
    if (magA < 1e-6 || magB < 1e-6) continue;
    const dot = ax * bx + ay * by + az * bz;
    const cosAngle = Math.max(-1, Math.min(1, dot / (magA * magB)));
    const deviation = Math.PI - Math.acos(cosAngle);
    if (deviation > angleThresholdRad) {
      if (curr.distanceTo(startPt) < endpointEps) continue;
      if (curr.distanceTo(endPt) < endpointEps) continue;
      if (positions.length > 0 && curr.distanceTo(positions[positions.length - 1]) < jointDedup)
        continue;
      positions.push(curr.clone());
    }
  }
  return positions;
}

/** Signed shoelace area (mirror of strokeTo3d's private helper). */
function shoelaceAreaLocal(world: THREE.Vector3[]): number {
  let area = 0;
  for (let i = 0; i < world.length; i++) {
    const a = world[i];
    const b = world[(i + 1) % world.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

function hasNonFinitePositionsLocal(geometry: THREE.BufferGeometry): boolean {
  const pos = geometry.getAttribute('position');
  if (!pos) return true;
  const arr = pos.array as ArrayLike<number>;
  for (let i = 0; i < arr.length; i++) {
    if (!Number.isFinite(arr[i])) return true;
  }
  return false;
}

const EXTRUDE_SMOOTH_SAMPLES_PER_ANCHOR = 8; // mirror (private in strokeTo3d)
const EXTRUDE_SMOOTH_MAX_SAMPLES = 256; // mirror (private in strokeTo3d)

/** MIRROR of strokeTo3d buildExtrudeGeometry with `bevelEnabled` exposed —
 *  called ONLY when the Bevel toggle is OFF (or auto-disabled below the FS
 *  tiny-width threshold); bevel-ON extrudes go through the lib builder
 *  verbatim. Same smooth-dispatch, same degenerate fallbacks. */
function buildExtrudeNoBevel(
  world: THREE.Vector3[],
  depth: number,
  rodRadius: number,
): StrokeGeometryResult {
  const pts = dedupeConsecutiveLocal(world);
  if (pts.length > 1 && pts[0].distanceToSquared(pts[pts.length - 1]) < 1e-12) pts.pop();
  if (pts.length < 3 || Math.abs(shoelaceAreaLocal(pts)) < MIN_EXTRUDE_AREA) {
    return buildRodGeometry(world, { radius: rodRadius });
  }
  try {
    let outline = pts;
    if (pts.length >= EXTRUDE_SMOOTH_MIN_ANCHORS) {
      const loop = new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.5);
      const divisions = Math.min(
        pts.length * EXTRUDE_SMOOTH_SAMPLES_PER_ANCHOR,
        EXTRUDE_SMOOTH_MAX_SAMPLES,
      );
      outline = loop.getPoints(divisions);
      outline.pop();
    }
    const shape = new THREE.Shape(outline.map((v) => new THREE.Vector2(v.x, v.y)));
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 12,
      steps: 1,
    });
    if (hasNonFinitePositionsLocal(geometry)) {
      geometry.dispose();
      throw new Error('extrude produced non-finite positions');
    }
    geometry.translate(0, 0, -depth / 2);
    return { kind: 'extrude', geometry, holesCut: 0 };
  } catch {
    return buildRodGeometry(world, { radius: rodRadius, closed: true });
  }
}

/** Per-stroke build with the FULL spec §2 param sets applied. */
function buildStrokeWithParams(
  points: StrokeInputPoint[],
  viewBox: ViewBoxSize,
  center: { x: number; y: number },
  setting: GeometryModeSetting,
  p: Mode3DParams,
): StrokeGeometryResult {
  const simplified = rdpPoints(points);
  const mode = resolveGeometryMode(setting, simplified);
  const world = normalizeStrokePoints(simplified, viewBox, WORLD_SCALE, center);

  if (mode === 'extrude') {
    const depth = extrudeEffectiveDepth(p.extrude.width, p.extrude.depthMult);
    const bevelOn = p.extrude.bevel && !extrudeBevelAutoDisabled(p.extrude.width);
    const result = bevelOn
      ? buildExtrudeGeometry(world, { depth, rodRadius: p.rod.radius })
      : buildExtrudeNoBevel(world, depth, p.rod.radius);
    return result;
  }

  if (mode === 'inflate') {
    const result = buildInflateGeometry(world, {
      baseRadius: p.inflate.baseRadius,
      tipRadius: p.inflate.tipRadius,
      pressures: extractPressures(simplified),
      pressureInfluence: p.inflate.pressureInfluence,
      rodRadius: p.rod.radius,
    });
    // Puff (D-A): FS Z-aspect applied as a geometry-space Z scale.
    // applyMatrix4 runs positions AND normals through the normal matrix, so
    // the non-uniform scale shades correctly. aspect 1.0 is skipped (no-op).
    if (result.kind === 'inflate') {
      const aspectZ = inflatePuffAspectZ(p.inflate.puff);
      if (Math.abs(aspectZ - 1) > 1e-3) {
        result.geometry.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, aspectZ));
      }
    }
    return result;
  }

  // rod (and auto-resolved rod)
  const rod = buildRodGeometry(world, {
    radius: p.rod.radius,
    closed: isClosedStroke(simplified),
  });
  if (
    rod.kind === 'rod' &&
    p.rod.jointBlobs &&
    p.rod.jointSensitivityDeg !== JOINT_ANGLE_THRESHOLD_DEG
  ) {
    // Re-detect joints at the user's sensitivity (lib walk is fixed at 40°).
    const pts = dedupeConsecutiveLocal(world);
    if (pts.length >= 3) {
      rod.jointPositions = detectJointsWithAngle(
        pts,
        pts[0],
        pts[pts.length - 1],
        p.rod.radius,
        p.rod.jointSensitivityDeg,
      );
    }
  }
  return rod;
}

export interface Stroke3DSceneProps {
  /** Raw strokes in viewBox coords (y-down). Points are [x, y] or
   *  [x, y, pressure] — DrawSurface's `stroke.points` pass through unchanged. */
  strokes: StrokeInputPoint[][];
  /** Source coordinate space. Defaults to the draw surface's 800×600. */
  viewBox?: ViewBoxSize;
  /** 'auto' picks per stroke: open → rod, closed → extrude. 'inflate' and
   *  'solid' are explicit-only — auto never resolves to them. */
  geometryMode?: GeometryModeSetting;
  /** 3D style (spec §3): native (lit presets) · hatch (Shading-slider
   *  hachure) · svg-port (2D-chrome-driven treatment + ink edges). */
  style3d?: 'native' | 'hatch' | 'svg-port';
  /** Native material preset. Default: FS per-mode default for geometryMode. */
  materialPreset?: MaterialPresetId;
  /** Per-mode param sets (spec §2). Default: the spec's tuned defaults. */
  modeParams?: Mode3DParams;
  /** Live 2D Shading-cluster values for hatch/svg-port (the scene only
   *  consumes; the wiring layer reads F3RoughModifiersContext). */
  hatchInputs?: HatchInputs;
  /** Background override. Default: --dir-bg resolved once at mount. */
  background?: string;
  /** Legacy explicit ink override — when set, overrides the Native preset's
   *  color and the mark styles' ink. Default ink = INK_3D_DEFAULT (D2-E). */
  inkColor?: string;
  style?: CSSProperties;
  className?: string;
}

const DEFAULT_HATCH_INPUTS: HatchInputs = {
  hachureGap: 4,
  hachureAngle: -41,
  strokeWidth: 1.2,
  inkIntensity: 1.0,
};

/** Copies live slider values into the hatch uniforms (device-px aware).
 *  Runs as an effect INSIDE the Canvas so it can read the real pixel ratio. */
function HatchUniformSync({
  material,
  variant,
  inputs,
  ink,
  paper,
}: {
  material: THREE.ShaderMaterial;
  variant: 'hatch' | 'svg-port';
  inputs: HatchInputs;
  ink: string;
  paper: string;
}) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    updateHatchUniforms(material, variant, inputs, ink, paper, gl.getPixelRatio());
  }, [material, variant, inputs, ink, paper, gl]);
  return null;
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
  modeParams,
  showEdges,
  edgeColor,
}: {
  strokes: StrokeInputPoint[][];
  viewBox: ViewBoxSize;
  geometryMode: GeometryModeSetting;
  material: THREE.Material;
  modeParams: Mode3DParams;
  showEdges: boolean;
  edgeColor: string;
}) {
  const key = strokesKey(strokes);
  const paramsKey = JSON.stringify(modeParams);

  const builds = useMemo<StrokeGeometryResult[]>(() => {
    const pool = strokes.filter((s) => s.length > 0).slice(0, MAX_STROKES_3D);
    if (pool.length === 0) return [];
    // Pool bbox center (NOT per-stroke) keeps the strokes' relative layout
    // and centers the whole doodle at the origin (plan §1.2).
    const center = poolCenter(pool, viewBox);
    if (geometryMode === 'solid') {
      // Solid is pool-level by nature: ALL strokes rasterize into ONE
      // watertight mass — a single mesh, not per-stroke. NOTE: `holes` rides
      // along for the day the geometry rock's builder accepts it (option needs
      // filed cross-rock); until then the chrome surfaces the toggle as
      // pending — never a silent no-op.
      return [
        buildPoolSolidGeometry(pool, {
          viewBox,
          center,
          inkRadius: modeParams.solid.inkRadius,
          depth: modeParams.solid.depth,
          rodRadius: modeParams.rod.radius,
          holes: modeParams.solid.holes,
        } as Parameters<typeof buildPoolSolidGeometry>[1]),
      ];
    }
    return pool.map((points) =>
      buildStrokeWithParams(points, viewBox, center, geometryMode, modeParams),
    );
    // `key`/`paramsKey` stand in for array/object identity (cheap deterministic keys).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, paramsKey, geometryMode, viewBox.w, viewBox.h]);

  useEffect(() => {
    return () => {
      for (const b of builds) b.geometry.dispose();
    };
  }, [builds]);

  // Debug introspection (window.__dd_decisionLog house pattern, QW-2): the
  // verify harness + future calibration sweeps read what the scene actually
  // built — no sampled claims, receipts from the live object.
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__dd3d = {
      geometryMode,
      paramsKey,
      builds: builds.map((b) =>
        b.kind === 'rod'
          ? { kind: b.kind, joints: b.jointPositions.length, caps: b.capPositions.length, radius: b.radius }
          : { kind: b.kind },
      ),
    };
  }, [builds, geometryMode, paramsKey]);

  // SVG-port ink outline: EdgesGeometry per mesh (30° crease threshold —
  // smooth tubes contribute almost nothing, slab rims read as drawn lines).
  // This is the v1 bridge's outline register; the post-makeathon TAM path
  // replaces it with a stable-seed SvgStyleTransform projection (M8 doc).
  const edges = useMemo<THREE.EdgesGeometry[]>(() => {
    if (!showEdges) return [];
    return builds.map((b) => new THREE.EdgesGeometry(b.geometry, 30));
  }, [builds, showEdges]);
  useEffect(() => {
    return () => {
      for (const e of edges) e.dispose();
    };
  }, [edges]);
  const edgeMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ color: new THREE.Color(edgeColor) }),
    [edgeColor],
  );
  useEffect(() => {
    return () => edgeMaterial.dispose();
  }, [edgeMaterial]);

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
          {showEdges && edges[i] && (
            <lineSegments geometry={edges[i]} material={edgeMaterial} />
          )}
          {/* Endpoint caps — chrome-controlled (spec §2.1 End caps toggle). */}
          {b.kind === 'rod' &&
            modeParams.rod.caps &&
            b.capPositions.map((p, j) => (
              <mesh key={j} geometry={capSphere} position={p} scale={b.radius} material={material} />
            ))}
          {/* Joint spheres (free-stroke ink-blob character) — chrome-controlled
              (spec §2.1 Joint blobs toggle + sensitivity slider). */}
          {b.kind === 'rod' &&
            modeParams.rod.jointBlobs &&
            b.jointPositions.map((p, j) => (
              <mesh key={`j${j}`} geometry={capSphere} position={p} scale={b.radius} material={material} />
            ))}
        </group>
      ))}
      {/* Soft ground-contact shadow (rig adaptation for white paper). frames={1}
          bakes ONCE per mount = deterministic; the key remounts it whenever
          the strokes/mode/params (and therefore the geometry) change. */}
      {builds.length > 0 && bounds && (
        <ContactShadows
          key={`${key}|${geometryMode}|${paramsKey}`}
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
  style3d = 'native',
  materialPreset,
  modeParams = DEFAULT_MODE3D_PARAMS,
  hatchInputs = DEFAULT_HATCH_INPUTS,
  background,
  inkColor,
  style,
  className,
}: Stroke3DSceneProps) {
  // Lazy initializer = resolved once at mount, never re-read during render.
  const [paper] = useState(resolvePaperHex);
  const bg = background ?? paper;
  const ink = inkColor ?? INK_3D_DEFAULT;

  // ── Native: FS preset MeshPhysicalMaterial (materials3d.ts, verbatim) ──
  const preset: MaterialPresetId = materialPreset ?? MODE_MATERIAL_DEFAULTS_3D[geometryMode];
  const nativeMaterial = useMemo(() => {
    const p = MATERIAL_PARAMS_3D[preset];
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(inkColor ?? p.color),
      roughness: p.roughness,
      metalness: p.metalness,
      clearcoat: p.clearcoat,
      clearcoatRoughness: p.clearcoatRoughness,
      reflectivity: p.reflectivity,
      sheen: p.sheen,
      sheenRoughness: p.sheenRoughness,
      sheenColor: new THREE.Color(p.sheenColor),
      emissive: new THREE.Color(p.emissive),
      emissiveIntensity: p.emissiveIntensity,
      envMapIntensity: p.envMapIntensity,
    });
  }, [preset, inkColor]);
  useEffect(() => {
    return () => nativeMaterial.dispose();
  }, [nativeMaterial]);

  // ── Hatch / SVG-port: the band-quantized ShaderMaterial (one instance,
  // uniforms updated live — slider moves re-hatch without rebuilds). ──
  const hatchVariant = style3d === 'svg-port' ? 'svg-port' : 'hatch';
  const hatchMaterial = useMemo(() => {
    if (style3d === 'native') return null;
    return createHatchMaterial(hatchVariant);
  }, [style3d, hatchVariant]);
  useEffect(() => {
    return () => {
      if (hatchMaterial) hatchMaterial.dispose();
    };
  }, [hatchMaterial]);

  const material: THREE.Material = hatchMaterial ?? nativeMaterial;

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
          the ambient floor drops so form shading keeps its gradient range.
          The hatch/svg-port ShaderMaterial computes its own lambert from the
          same key/fill directions — the rig stays for Native + shadows. */}
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
      {hatchMaterial && (
        <HatchUniformSync
          material={hatchMaterial}
          variant={hatchVariant}
          inputs={hatchInputs}
          ink={ink}
          paper={bg}
        />
      )}
      <StrokeMeshes
        strokes={strokes}
        viewBox={viewBox}
        geometryMode={geometryMode}
        material={material}
        modeParams={modeParams}
        showEdges={style3d === 'svg-port'}
        edgeColor={ink}
      />
      <OrbitControls makeDefault enableDamping />
    </Canvas>
  );
}

// Default export so the wiring layer can `React.lazy(() => import(...))` and
// keep three+drei out of the main chunk (plan §2.3).
export default Stroke3DScene;
