import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  DEFAULT_VIEWBOX,
  INFLATE_BASE_RADIUS,
  INFLATE_PRESSURE_INFLUENCE,
  INFLATE_PROFILE_EXP,
  INFLATE_TIP_RADIUS,
  JOINT_ANGLE_THRESHOLD_DEG,
  ROD_RADIUS,
  SOLID_INK_RADIUS,
  SPHERE_SEGMENTS,
  TREATED_AS_CLOSED_DEFAULT,
  WORLD_SCALE,
  buildExtrudeGeometry,
  buildInflateGeometry,
  buildPoolSolidGeometry,
  buildRodGeometry,
  closureStateOf,
  extractPressures,
  isClosedStroke,
  isSolidFamilyClosure,
  normalizeStrokePoints,
  poolCenter,
  rdpPoints,
  resolveGeometryMode,
  strokeSignature,
  strokesKey,
  type GeometryModeSetting,
  type StrokeGeometryResult,
  type StrokeInputPoint,
  type ViewBoxSize,
} from '../../lib/geometry3d/strokeTo3d';
import { pushClosureCorrection } from '../../lib/smart/conversionMap';
import {
  DEFAULT_MODE3D_PARAMS,
  INFLATE_PROFILE_FAMILY_PRESETS,
  extrudeBevelAutoDisabled,
  extrudeEffectiveDepth,
  inflatePuffAspectZ,
  type Mode3DParams,
} from './modeParams';
import { rodAdornmentSpecs, type RodAdornmentSpec } from './rodAdornments';
import {
  INK_3D_DEFAULT,
  MATERIAL_PARAMS_3D,
  MODE_MATERIAL_DEFAULTS_3D,
  DEFAULT_NATIVE_PROPS_3D,
  applyNativeProps,
  type MaterialPresetId,
  type NativeProps3D,
} from './materials3d';
import {
  createHatchMaterial,
  updateHatchUniforms,
  updateHatchLightDir,
  type HatchInputs,
} from './hatchMaterial';

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

// ── Studio environment palette (named register — ink-black policy) ─────────
// The baked <Environment> is what clearcoat/envmap channels REFLECT, and
// specular reflection bypasses albedo — so any hue here lands on the object
// at full strength regardless of the ink-black base color. Values live in ONE
// named table so the material battery (tools/3d/material-battery) asserts
// against the exact rig the product ships.
//
// RATIFIED COLOR POLICY (3d-mode-controls-spec footer, Sebs 2026-06-12):
// everything renders as the single warm-graphite ink; presets differ ONLY in
// how light sits. Broad warm-TAN area bands are banned at every orbit angle
// (round-7 verifier measured rgb(142,118,91) on a Glossy Extrude slab —
// reproduced by the battery at rgb(146,122,96), Δr−b 50). Root cause: the
// original port "warmed" this palette for the paper world — env bg #8a8174
// (mid warm grey) + fill #ffd9b0 (Δr−b 79) re-entered through clearcoat/
// envmap ×1.8 as the tan flood. Same violation family as the sheenColor
// flood; same cure: re-register the hue-carrying channel to warm graphite.
//
// PROVENANCE: the Free Stroke calibration ancestor (origin/main
// viewport-3d.tsx, read via git show 2026-06-12) ran these EXACT material
// params against a NEAR-BLACK env bg (#15171a) + #ffffff key — dark bg is
// what the presets were tuned for (feedback_copy_implementation_before_
// tweaking_numbers). Panels keep their positions/intensities so clearcoat
// still has something to reflect (the Day-11 flat-black-blob bug was NO env;
// killing the panels would regress it).
export const STUDIO_ENV = {
  /** Environment background — fills every direction the panels don't; it is
   *  what tilted glossy faces mirror BROADLY. Warm-axis sibling of the FS
   *  ancestor's #15171a, inside the D2-E ink family (#121110–#383632): broad
   *  reflections read as dark warm graphite, never tan. */
  bg: '#211e1a',
  /** Big soft key panel (top-front) → broad clearcoat highlight. NEUTRALISED
   *  to near-grey white (#f8f7f6, Δr−b 2) — the be7aac7 fix darkened the env BG
   *  but left this panel whisper-warm (#fffaf0 Δ15), and rubber/softGel's WIDE
   *  sheen lobe (sheen 1.0) broadly MIRRORS this panel across a FLAT coplanar
   *  slab face → the milk-chocolate read (2026-06-13 slab battery: rubber lit
   *  Δ25, softGel Δ27, local warm buckets Δ29). Specular/sheen bypass albedo,
   *  so the panel HUE lands at full strength regardless of the ink-black base
   *  (RATIFIED COLOR POLICY / ink-black D2-E). Full value + intensity KEPT
   *  (clearcoat/sheen still have a bright source — no Day-11 flat-blob); only
   *  the warm CAST is removed, so a broad mirror reads grey, never tan. */
  key: { color: '#f8f7f6', intensity: 3 },
  /** Cool rim panel (back-left) → separates the form's dark side. */
  rim: { color: '#bcd0e8', intensity: 1.6 },
  /** Low fill (front-low) → soft underside glow for sheen. FS's #ffd9b0 (Δ79)
   *  → be7aac7 whisper-warm #e8e0d4 (Δ20) → NEUTRALISED #dcdad7 (Δ5): the same
   *  sheen-lobe flat-face mirror that warmed the KEY warmed this FILL too (it
   *  sits front-low, square in the sheen lobe of a down-tilted slab). Warmth
   *  killed, value/intensity kept (the underside glow that lifts sheen forms
   *  survives — just neutral now). Ink-black holds at every orbit angle. */
  fill: { color: '#dcdad7', intensity: 1.1 },
  /** Tight bright streak → crisp specular accent on curvature. */
  streak: { color: '#ffffff', intensity: 4 },
} as const;

/** The full studio rig (scene lights + baked Environment) — EXPORTED so the
 *  material battery renders through the EXACT product rig (the tier-2 board
 *  harness omitted the Environment bake, which is precisely the gap that let
 *  the env-reflection tan band ship unseen). */
export function StudioRig() {
  return (
    <>
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
          (static, deterministic, no per-frame cost). Palette = STUDIO_ENV. */}
      <Environment resolution={256} frames={1} background={false}>
        <color attach="background" args={[STUDIO_ENV.bg]} />
        <Lightformer
          form="rect"
          intensity={STUDIO_ENV.key.intensity}
          color={STUDIO_ENV.key.color}
          position={[2.5, 4, 3]}
          rotation={[-Math.PI / 3, 0, 0]}
          scale={[8, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={STUDIO_ENV.rim.intensity}
          color={STUDIO_ENV.rim.color}
          position={[-4, 1.5, -3]}
          rotation={[0, Math.PI / 2.2, 0]}
          scale={[5, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={STUDIO_ENV.fill.intensity}
          color={STUDIO_ENV.fill.color}
          position={[1, -2.5, 2]}
          rotation={[Math.PI / 2.5, 0, 0]}
          scale={[6, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={STUDIO_ENV.streak.intensity}
          color={STUDIO_ENV.streak.color}
          position={[-1.5, 3, 2.5]}
          rotation={[-Math.PI / 4, 0, 0]}
          scale={[0.6, 5, 1]}
        />
      </Environment>
    </>
  );
}

/** Native preset → MeshPhysicalMaterial — EXPORTED factory so the material
 *  battery instantiates the EXACT product material (no harness re-typing of
 *  the param table). `inkColor` = the legacy explicit override prop.
 *  `nativeProps` = the four PROPERTY dials (symmetry-law gap cell §2); when
 *  omitted/neutral the preset params pass through unchanged (default-identity).
 *  Reflection is HARD-bounded inside applyNativeProps — ink-black holds at
 *  every dial position (be7aac7 policy). */
export function createNativeMaterial(
  preset: MaterialPresetId,
  inkColor?: string,
  nativeProps?: NativeProps3D,
): THREE.MeshPhysicalMaterial {
  const base = MATERIAL_PARAMS_3D[preset];
  const p = nativeProps ? applyNativeProps(base, nativeProps) : base;
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
}

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

// ── Content-fit camera framing — PORTED from Free Stroke, made FOV-aware ────
// PROVENANCE: viewport-3d.tsx `bounds.center + dir · bounds.radius × FRAME_K`
// (FRAME_K = 3.0, verbatim). Gentler mostly-frontal 3/4 so the doodle still
// reads as the drawing, with top + side walls visible for depth.
//
// RC-4(b) framing-aware fix: the verbatim FS framing distances the camera by
// bounds.RADIUS (the bounding-sphere half-diagonal) × a fixed K. That K was
// tuned for roughly-cubic doodles. For an ELONGATED form (a tall can, a wide
// boarding pass) — and ESPECIALLY when the rod is thin so the cross-section is
// negligible — the half-diagonal ≈ the major HALF-axis, the camera pulls in
// close, and the long axis runs off the frame (the overflow the audit caught).
// The fix keeps the sphere-radius distance as a FLOOR (so the verbatim look is
// untouched for normal doodles) but ALSO computes the distance the perspective
// frustum needs to fit the box's largest projected extent, and takes the max.
// So a normal doodle frames exactly as before; only an elongated one gets
// pushed back enough to stop clipping.
const FRAME_K = 3.0;
const FRAME_DIR = new THREE.Vector3(0.5, 0.55, 1).normalize();
/** Floor on the framing radius so a dot-tap doodle doesn't slam the camera
 *  into the near plane. */
const FRAME_MIN_RADIUS = 1.2;
/** Extra breathing room around the fitted box (RC-4(b)) — the form sits inside
 *  the frame with margin, never kissing the border. */
const FRAME_FIT_MARGIN = 1.18;

interface PoolBounds {
  center: THREE.Vector3;
  radius: number;
  minY: number;
  /** Full world-space extents (RC-4(b) framing-aware fit). */
  size: THREE.Vector3;
}

/** Deterministic one-shot camera fit: position = center + dir·dist, target =
 *  center. Re-runs only when the pool bounds OR the viewport aspect change
 *  (new strokes / mode / resize) — user orbits are never fought mid-gesture. */
function CameraFramer({ bounds }: { bounds: PoolBounds | null }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size); // re-fit on container resize (aspect)
  const controls = useThree((s) => s.controls) as unknown as {
    target: THREE.Vector3;
    update: () => void;
  } | null;
  useEffect(() => {
    if (!bounds) return;
    const radius = Math.max(bounds.radius, FRAME_MIN_RADIUS);
    // Verbatim-FS distance (the look for normal doodles) = the floor.
    let dist = radius * FRAME_K;
    // FOV-aware distance: push back far enough that the box's largest projected
    // extent fits the frustum with margin. Vertical fov fits the box HEIGHT;
    // the box WIDTH must fit the horizontal fov (= vfov scaled by aspect). Use
    // whichever needs the farther camera so neither axis overflows.
    const persp = camera as THREE.PerspectiveCamera;
    if (persp.isPerspectiveCamera) {
      const vFov = (persp.fov * Math.PI) / 180;
      const aspect = persp.aspect || (size.height > 0 ? size.width / size.height : 1);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
      // Half-extents the camera must fit: include depth so an oblique 3/4 view
      // (FRAME_DIR is not axis-aligned) never tucks a corner past the edge.
      const halfH = (bounds.size.y + bounds.size.z * 0.6) * 0.5 * FRAME_FIT_MARGIN;
      const halfW = (bounds.size.x + bounds.size.z * 0.6) * 0.5 * FRAME_FIT_MARGIN;
      const distForH = halfH / Math.tan(vFov / 2);
      const distForW = halfW / Math.tan(hFov / 2);
      dist = Math.max(dist, distForH, distForW);
    }
    camera.position.copy(bounds.center).addScaledVector(FRAME_DIR, dist);
    camera.lookAt(bounds.center);
    if (controls) {
      controls.target.copy(bounds.center);
      controls.update();
    }
  }, [bounds, camera, controls, size]);
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
    INFLATE_PROFILE_FAMILY_PRESETS.balloon.profileExp !== INFLATE_PROFILE_EXP ||
    d.solid.inkRadius !== SOLID_INK_RADIUS
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      '[Stroke3DScene] modeParams defaults drifted from strokeTo3d constants — re-sync modeParams.ts',
    );
  }
}

// ── Engine-option wiring (rock X) ───────────────────────────────────────────
// The rock-1 local mirrors (detectJointsWithAngle / buildExtrudeNoBevel) are
// DELETED — joint sensitivity and bevel profile are REAL strokeTo3d options
// now; the chrome drives the engine, not a copy.

/** Per-stroke build with the FULL spec §2 param sets + Tier-2 families
 *  applied. EXPORTED: the tools/3d board harness renders contact sheets
 *  through this exact product path. `treatAsClosed` = the ARROW RULE chip
 *  override for this stroke (auto mode only). */
export function buildStrokeWithParams(
  points: StrokeInputPoint[],
  viewBox: ViewBoxSize,
  center: { x: number; y: number },
  setting: GeometryModeSetting,
  p: Mode3DParams,
  treatAsClosed?: boolean,
): StrokeGeometryResult {
  const simplified = rdpPoints(points);
  const mode = resolveGeometryMode(setting, simplified, { treatAsClosed });
  const world = normalizeStrokePoints(simplified, viewBox, WORLD_SCALE, center);

  if (mode === 'extrude') {
    const depth = extrudeEffectiveDepth(p.extrude.width, p.extrude.depthMult);
    // Spec §2.2 tiny-width auto-disable: profile falls to 'sharp' under the
    // floor (the chrome surfaces the chip — never silent).
    const profile = extrudeBevelAutoDisabled(p.extrude.width)
      ? 'sharp'
      : p.extrude.bevelProfile;
    return buildExtrudeGeometry(world, {
      depth,
      rodRadius: p.rod.radius,
      bevelProfile: profile,
      sideWall: p.extrude.sideWall,
    });
  }

  if (mode === 'inflate') {
    const family = INFLATE_PROFILE_FAMILY_PRESETS[p.inflate.profileFamily];
    const result = buildInflateGeometry(world, {
      baseRadius: p.inflate.baseRadius,
      tipRadius: p.inflate.tipRadius,
      pressures: extractPressures(simplified),
      pressureInfluence: p.inflate.pressureInfluence,
      profileExp: family.profileExp,
      rodRadius: p.rod.radius,
    });
    // Puff (D-A): FS Z-aspect applied as a geometry-space Z scale, modulated
    // by the Tier-2 profile family (presets OVER the Puff curve).
    // applyMatrix4 runs positions AND normals through the normal matrix, so
    // the non-uniform scale shades correctly. aspect 1.0 is skipped (no-op).
    if (result.kind === 'inflate') {
      const aspectZ = inflatePuffAspectZ(p.inflate.puff) * family.aspectScale;
      if (Math.abs(aspectZ - 1) > 1e-3) {
        result.geometry.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, aspectZ));
      }
    }
    return result;
  }

  // rod — explicit pick keeps the tolerant ring closure (today); an
  // AUTO-resolved rod from the ambiguous band stays an OPEN tube (the gap is
  // the honest read; the chip welds it, not the engine).
  const closeRing =
    setting === 'auto'
      ? isSolidFamilyClosure(closureStateOf(simplified), treatAsClosed)
      : isClosedStroke(simplified);
  return buildRodGeometry(world, {
    radius: p.rod.radius,
    closed: closeRing,
    jointAngleThresholdDeg: p.rod.jointSensitivityDeg,
  });
}

export interface Stroke3DSceneProps {
  /** Raw strokes in viewBox coords (y-down). Points are [x, y] or
   *  [x, y, pressure] — DrawSurface's `stroke.points` pass through unchanged. */
  strokes: StrokeInputPoint[][];
  /** ARROW RULE: seed chip overrides (strokeSignature → treat-as-closed).
   *  The chip mutates scene-local state from here; harness boards use it to
   *  show the 'solid' variant without flipping the constant. */
  initialTreatAsClosed?: Record<string, boolean>;
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
  /** Native PROPERTY dials (symmetry-law gap cell §2): polish/reflection/
   *  sheen/outline. Default = neutral (preset passes through, no outline). */
  nativeProps?: NativeProps3D;
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
  // Light-following + contour read the camera-relative light direction, which
  // changes every orbit frame — push it per-frame (one matrix transform; for
  // Fixed hachure the uniform is set but the shader ignores it, so this is
  // harmless when light-following is off).
  useFrame((s) => {
    updateHatchLightDir(material, s.camera.matrixWorldInverse);
  });
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
  outlineWidth = 0,
  treatAsClosedBySig,
}: {
  strokes: StrokeInputPoint[][];
  viewBox: ViewBoxSize;
  geometryMode: GeometryModeSetting;
  material: THREE.Material;
  modeParams: Mode3DParams;
  showEdges: boolean;
  edgeColor: string;
  /** Native OUTLINE dial → inverted-hull silhouette weight (0 = off). */
  outlineWidth?: number;
  /** ARROW RULE chip overrides, keyed by strokeSignature (auto mode only). */
  treatAsClosedBySig?: Record<string, boolean>;
}) {
  const key = strokesKey(strokes);
  const paramsKey = JSON.stringify(modeParams) + '|' + JSON.stringify(treatAsClosedBySig ?? {});

  const builds = useMemo<StrokeGeometryResult[]>(() => {
    const pool = strokes.filter((s) => s.length > 0).slice(0, MAX_STROKES_3D);
    if (pool.length === 0) return [];
    // Pool bbox center (NOT per-stroke) keeps the strokes' relative layout
    // and centers the whole doodle at the origin (plan §1.2).
    const center = poolCenter(pool, viewBox);
    if (geometryMode === 'solid') {
      // Solid is pool-level by nature: ALL strokes rasterize into ONE
      // watertight mass — a single mesh, not per-stroke. Holes + edge are
      // REAL engine options now (rock X) — the chrome toggle drives the
      // builder directly.
      return [
        buildPoolSolidGeometry(pool, {
          viewBox,
          center,
          inkRadius: modeParams.solid.inkRadius,
          depth: modeParams.solid.depth,
          rodRadius: modeParams.rod.radius,
          holes: modeParams.solid.holes,
          edge: modeParams.solid.edge,
        }),
      ];
    }
    return pool.map((points) =>
      buildStrokeWithParams(
        points,
        viewBox,
        center,
        geometryMode,
        modeParams,
        treatAsClosedBySig?.[strokeSignature(points)],
      ),
    );
    // `key`/`paramsKey` stand in for array/object identity (cheap deterministic keys).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, paramsKey, geometryMode, viewBox.w, viewBox.h]);

  useEffect(() => {
    return () => {
      for (const b of builds) b.geometry.dispose();
    };
  }, [builds]);

  // ── SOLID FACE-INK (RC-2 fix) ──────────────────────────────────────────────
  // The pool-raster Solid merges EVERY stroke into ONE watertight silhouette
  // mass — faithful to the OUTLINE, but it buries the drawing's interior hand
  // into a featureless dark slab (the exhaustive audit's RC-2: 144/197 shapes).
  // rod + inflate preserve the hand because they're per-stroke; Solid is
  // pool-level by nature, so the fix is not topology — it's wearing the marks.
  // The mass stays the BODY; we overlay the user's ACTUAL strokes as ink rods
  // riding PROUD of the front face, so the hand survives into the solid ("the
  // 3D wears your own marks", CLAUDE.md). Solid mode ONLY — every other mode
  // returns null → byte-identical default render. The overlay rods are NOT in
  // `builds`, so they take their own glossy-ink material (read on the matte
  // mass), and never pick up the mass's EdgesGeometry / adornments / framing.
  const solidFaceInk = useMemo<THREE.BufferGeometry[] | null>(() => {
    if (geometryMode !== 'solid' || builds.length === 0) return null;
    const mass = builds[0];
    mass.geometry.computeBoundingBox();
    const bb = mass.geometry.boundingBox;
    if (!bb || !Number.isFinite(bb.max.z)) return null;
    const pool = strokes.filter((s) => s.length > 0).slice(0, MAX_STROKES_3D);
    if (pool.length === 0) return null;
    const center = poolCenter(pool, viewBox);
    // Raise the rod centerline ~half a radius above the front face so the marks
    // sit PROUD as relief ridges (the lower arc still tucks into the mass, so
    // they read as ink raised FROM the surface, not wires hovering over it).
    // Relief + specular is how the hand reads at all under the ink-black-
    // everything policy: same ink hue/value as the body, separated only by how
    // the light sits on a raised glossy mark vs the flat matte mass.
    const lift = bb.max.z + modeParams.rod.radius * 0.5;
    const geoms: THREE.BufferGeometry[] = [];
    for (const points of pool) {
      const rod = buildStrokeWithParams(points, viewBox, center, 'rod', modeParams);
      rod.geometry.translate(0, 0, lift);
      geoms.push(rod.geometry);
    }
    return geoms;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builds, key, paramsKey, geometryMode, viewBox.w, viewBox.h]);
  useEffect(() => {
    return () => {
      if (solidFaceInk) for (const g of solidFaceInk) g.dispose();
    };
  }, [solidFaceInk]);
  // Glossy-Plastic ink material for the face-ink rods — max clearcoat + low
  // roughness so each raised mark catches a tight bright specular highlight,
  // reading as wet ink against the matte-clay Solid body. Same ink hue/value as
  // the body (ink-black policy holds); the SEPARATION is purely surface +
  // relief + the light, never color. Solid mode only.
  const faceInkMaterial = useMemo<THREE.MeshPhysicalMaterial | null>(
    () => (geometryMode === 'solid' ? createNativeMaterial('glossyPlastic', edgeColor) : null),
    [geometryMode, edgeColor],
  );
  useEffect(() => {
    return () => {
      if (faceInkMaterial) faceInkMaterial.dispose();
    };
  }, [faceInkMaterial]);

  // Debug introspection (window.__dd_decisionLog house pattern, QW-2): the
  // verify harness + future calibration sweeps read what the scene actually
  // built — no sampled claims, receipts from the live object.
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__dd3d = {
      geometryMode,
      paramsKey,
      // RC-2 receipt: how many ink-hand rods the Solid body is wearing (0 for
      // every non-solid mode). The verify harness reads this from the live
      // object — no sampled claims.
      solidFaceInkRods: solidFaceInk ? solidFaceInk.length : 0,
      rodFamilies: {
        capStyle: modeParams.rod.capStyle,
        jointStyle: modeParams.rod.jointStyle,
        jointSensitivityDeg: modeParams.rod.jointSensitivityDeg,
      },
      builds: builds.map((b) =>
        b.kind === 'rod'
          ? { kind: b.kind, joints: b.jointPositions.length, caps: b.capPositions.length, radius: b.radius }
          : b.kind === 'solid'
            ? { kind: b.kind, outerContours: b.outerContours, holes: b.holes }
            : b.kind === 'extrude'
              ? { kind: b.kind, holesCut: b.holesCut }
              : { kind: b.kind },
      ),
    };
  }, [builds, geometryMode, paramsKey, modeParams.rod, solidFaceInk]);

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

  // Shared UNIT primitives for rod adornments (caps + joint blobs), scaled/
  // oriented per rodAdornmentSpecs (plan §1.1 — sibling meshes instead of CSG
  // merge). Sphere tessellation = free-stroke SPHERE_SEGMENTS (14×14).
  const capSphere = useMemo(() => new THREE.SphereGeometry(1, SPHERE_SEGMENTS, SPHERE_SEGMENTS), []);
  const capDisk = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 24), []);
  useEffect(() => {
    return () => {
      capSphere.dispose();
      capDisk.dispose();
    };
  }, [capSphere, capDisk]);

  // Tier-2 rod families → adornment specs (ONE placement source of truth —
  // rodAdornments.ts — shared with the tools/3d board harness).
  const adornments = useMemo<RodAdornmentSpec[][]>(
    () =>
      builds.map((b) =>
        b.kind === 'rod'
          ? rodAdornmentSpecs(b, modeParams.rod.capStyle, modeParams.rod.jointStyle, modeParams.rod.caps)
          : [],
      ),
    [builds, modeParams.rod.capStyle, modeParams.rod.jointStyle, modeParams.rod.caps],
  );

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
        // Pad by the largest adornment reach (ink-blob bead = 1.5×radius) so
        // shadow + framing cover every cap family without re-measuring.
        const pad = b.radius * 1.5;
        for (const p of b.capPositions.concat(b.jointPositions, b.endPositions)) {
          min.min(new THREE.Vector3(p.x - pad, p.y - pad, p.z - pad));
          max.max(new THREE.Vector3(p.x + pad, p.y + pad, p.z + pad));
        }
      }
    }
    if (!Number.isFinite(min.x) || !Number.isFinite(max.x)) return null;
    const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
    const size = new THREE.Vector3().subVectors(max, min);
    const radius = size.length() / 2;
    return { center, radius, minY: min.y, size };
  }, [builds]);

  // Native OUTLINE: inverted-hull material — backfaces pushed out along the
  // normal by (outlineWidth × radius-scaled amount), flat ink. Push is in
  // world units scaled by the pool radius so the silhouette weight reads the
  // same regardless of object scale; depthWrite off so it never z-fights the
  // body. 0 = no hull at all (default — byte-identical default render).
  const outlinePush = outlineWidth > 0 && bounds ? outlineWidth * 0.04 * Math.max(bounds.radius, 0.5) : 0;
  const hullMaterial = useMemo<THREE.ShaderMaterial | null>(() => {
    if (outlinePush <= 0) return null;
    return new THREE.ShaderMaterial({
      uniforms: {
        u_push: { value: outlinePush },
        u_ink: { value: new THREE.Color(edgeColor) },
      },
      vertexShader: /* glsl */ `
        uniform float u_push;
        void main() {
          vec3 p = position + normal * u_push;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 u_ink;
        void main() { gl_FragColor = vec4(u_ink, 1.0); }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, [outlinePush, edgeColor]);
  useEffect(() => {
    return () => {
      if (hullMaterial) hullMaterial.dispose();
    };
  }, [hullMaterial]);

  return (
    <group>
      {builds.map((b, i) => (
        <group key={i}>
          {/* Native OUTLINE — inverted-hull backface pass UNDER the body. */}
          {hullMaterial && <mesh geometry={b.geometry} material={hullMaterial} />}
          <mesh geometry={b.geometry} material={material} />
          {showEdges && edges[i] && (
            <lineSegments geometry={edges[i]} material={edgeMaterial} />
          )}
          {/* Rod adornments — Tier-2 cap family (round/flat/ink-blob) + joint
              family (blob/clean) + the End-caps toggle, all through
              rodAdornmentSpecs (one placement source, shared with the board
              harness). */}
          {adornments[i]?.map((spec, j) => (
            <mesh
              key={`a${j}`}
              geometry={spec.shape === 'sphere' ? capSphere : capDisk}
              position={spec.position}
              scale={spec.scale}
              quaternion={spec.quaternion}
              material={material}
            />
          ))}
        </group>
      ))}
      {/* SOLID FACE-INK (RC-2): the user's actual strokes as glossy-ink rods
          riding proud of the matte Solid body — the hand survives into the
          solid instead of being buried in a featureless slab. Solid mode only. */}
      {solidFaceInk && faceInkMaterial && (
        <group>
          {solidFaceInk.map((g, i) => (
            <mesh key={`faceink${i}`} geometry={g} material={faceInkMaterial} />
          ))}
        </group>
      )}
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
  initialTreatAsClosed,
  viewBox = DEFAULT_VIEWBOX,
  geometryMode = 'auto',
  style3d = 'native',
  materialPreset,
  nativeProps = DEFAULT_NATIVE_PROPS_3D,
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

  // ── ARROW RULE chip state (scene-local, signature-keyed — a stroke edit
  // changes its signature and the stale override simply stops matching). ──
  const [treatAsClosedBySig, setTreatAsClosedBySig] = useState<Record<string, boolean>>(
    () => initialTreatAsClosed ?? {},
  );

  /** Ambiguous-closure strokes (auto mode only — explicit picks are sacred,
   *  no chip). One chip per stroke; resolution = override > default. */
  const ambiguousStrokes = useMemo(() => {
    if (geometryMode !== 'auto') return [];
    const out: Array<{ sig: string; index: number; resolvedSolid: boolean }> = [];
    const pool = strokes.filter((s) => s.length > 0).slice(0, MAX_STROKES_3D);
    for (let i = 0; i < pool.length; i++) {
      const simplified = rdpPoints(pool[i]);
      if (closureStateOf(simplified) !== 'treated-as-closed') continue;
      const sig = strokeSignature(pool[i]);
      out.push({
        sig,
        index: i,
        resolvedSolid: isSolidFamilyClosure('treated-as-closed', treatAsClosedBySig[sig]),
      });
    }
    return out;
  }, [strokes, geometryMode, treatAsClosedBySig]);

  const flipTreatAsClosed = (sig: string, resolvedSolid: boolean) => {
    // Every flip = a labeled correction into the unified decision log
    // (conversion-semantics §8 / addendum §1.1 chip-flip training tuples).
    pushClosureCorrection({
      entryType: 'conversion-correction',
      surface: 'conversion',
      renderSurface: null,
      strokeSignature: sig,
      from: resolvedSolid,
      to: !resolvedSolid,
      defaultAtFlip: TREATED_AS_CLOSED_DEFAULT,
      mode: geometryMode,
    });
    setTreatAsClosedBySig((prev) => ({ ...prev, [sig]: !resolvedSolid }));
  };

  // ── Native: FS preset MeshPhysicalMaterial (materials3d.ts, verbatim) +
  // the four PROPERTY dials (symmetry-law gap cell §2). Neutral dials =
  // preset params unchanged; Reflection is hard-bounded (ink-black holds). ──
  const preset: MaterialPresetId = materialPreset ?? MODE_MATERIAL_DEFAULTS_3D[geometryMode];
  const nativeMaterial = useMemo(
    () => createNativeMaterial(preset, inkColor, nativeProps),
    [preset, inkColor, nativeProps],
  );
  useEffect(() => {
    return () => nativeMaterial.dispose();
  }, [nativeMaterial]);

  // Native OUTLINE dial → inverted-hull silhouette in ink (the drawn edge
  // weight on the form). 0 = off (default → no overlay → byte-identical
  // default Native render). The hull pushes backfaces out along the normal,
  // so weight reads even on non-spherical forms and scales with the object.
  const outlineWidth = style3d === 'native' ? nativeProps.outline : 0;

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
    // Wrapper carries the caller's style/className (the Canvas fills it) so
    // the ARROW RULE chips can overlay the GL viewport as HTML.
    <div style={{ position: 'relative', ...style }} className={className}>
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.5, 7], fov: 40 }}
      gl={{ antialias: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={[bg]} />
      <StudioRig />
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
        outlineWidth={outlineWidth}
        treatAsClosedBySig={treatAsClosedBySig}
      />
      <OrbitControls makeDefault enableDamping />
    </Canvas>
    {/* ARROW RULE chips — the honest boundary made tappable (conversion-
        semantics §6 row 2). One pill per ambiguous stroke; copy follows the
        RESOLVED family; every tap is a logged correction. */}
    {ambiguousStrokes.length > 0 && (
      <div
        style={{
          position: 'absolute',
          left: 12,
          bottom: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 6,
          zIndex: 2,
        }}
      >
        {ambiguousStrokes.map((a, n) => (
          <button
            key={a.sig}
            type="button"
            data-dd-chip="treat-as-closed"
            data-resolved={a.resolvedSolid ? 'closed' : 'open'}
            onClick={() => flipTreatAsClosed(a.sig, a.resolvedSolid)}
            title={
              a.resolvedSolid
                ? 'This nearly-closed stroke was welded into a solid — tap to keep it an open line instead.'
                : 'This stroke nearly closes — tap to weld the gap and fill it as a solid.'
            }
            style={{
              fontFamily:
                "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: 10,
              letterSpacing: '0.04em',
              lineHeight: 1.2,
              padding: '5px 12px',
              borderRadius: 999,
              border: '1px solid var(--dir-border, #d8d2c6)',
              background: 'var(--dir-raised, #ffffff)',
              color: 'var(--dir-text-secondary, #5f5b54)',
              cursor: 'pointer',
            }}
          >
            {ambiguousStrokes.length > 1 ? `Stroke ${n + 1} · ` : ''}
            {a.resolvedSolid ? 'Treated as closed — tap to open' : 'Open-ish — treat as closed?'}
          </button>
        ))}
      </div>
    )}
    </div>
  );
}

// Default export so the wiring layer can `React.lazy(() => import(...))` and
// keep three+drei out of the main chunk (plan §2.3).
export default Stroke3DScene;
