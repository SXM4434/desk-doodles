// ─── hatchMaterial — procedural band-quantized hachure (Hatch + SVG-port) ───
// Implements docs/design/3d-roundtrip-build-plan.md §3 with ONE architecture
// change mandated by the round-7 constraints: the plan's `postprocessing`
// Effect subclass needs a dep that is NOT installed (no-new-deps rule), so the
// hatch is a custom THREE.ShaderMaterial on the meshes themselves — same
// fragment math, no composer pass. Deterministic: fixed light directions
// mirroring the Stroke3DScene rig, no time uniforms, no randomness.
//
// ONE MATH, TWO RENDERERS (the wedge): the 8-band quantization table is
// `coverage.ts` COVERAGE_BANDS via bandTableForUniforms() — the SAME numbers
// the SVG renderer quantizes with (21-research §4, Praun Real-Time Hatching
// banding). The angle/gap/weight/ink uniforms read the LIVE 2D Shading sliders
// (F3RoughModifiersContext — wired by the scene, this module is React-free).
// Moving hachureGap re-hatches the 3D live; that slider moment is the demo
// wedge shot (build plan §13).
//
// TWO VARIANTS, one shader:
//   · 'hatch'    — D-4 shared interim style. Tone = lit-form darkness (the lit
//     face hatches sparse, the shadowed face dense — §7's multi-face problem
//     solved by luminance). Grammar = hachure with TAM-style layer stacking
//     (offset set → cross set → near-solid) from the band's tamLayers column.
//   · 'svg-port' — M8 v1, the honest 2D-treatment-on-3D bridge: SAME band
//     machinery for tone (the 3D form is the tone source — drawn strokes carry
//     no source darkness), but the MARK GRAMMAR comes from the full 2D chrome:
//     fillStyle picks the procedural pattern (hachure / cross-hatch / dots /
//     zigzag / dashed / zigzag-line / solid / none — all 8 real), wobble bends
//     the marks, fillOpacity scales them; an ink EdgesGeometry overlay
//     (Stroke3DScene) carries the outline read. What v1 does NOT do (the
//     post-makeathon TAM path, build plan §3.4): author marks with rough.js
//     into a TAM texture, project EdgesGeometry through SvgStyleTransform with
//     a stable seed, or follow surface tangents — v1 marks are screen-space.

import * as THREE from 'three';
import { bandTableForUniforms } from '../../lib/smart/coverage';

export type HatchVariant = 'hatch' | 'svg-port';

/** Live inputs from the 2D chrome (the scene copies these into uniforms in an
 *  effect — slider moves re-hatch without geometry rebuilds). */
export type HatchInputs = {
  /** m.hachureGap (0.5–30 px, default 4). */
  hachureGap: number;
  /** m.hachureAngle (−90..90°, default −41 — the house angle). */
  hachureAngle: number;
  /** m.strokeWidth (0.1–10, default 1.2). */
  strokeWidth: number;
  /** m.inkIntensity (0–1). */
  inkIntensity: number;
  /** SVG-port only: m.fillStyle — picks the procedural mark grammar. */
  fillStyle?: string;
  /** SVG-port only: m.wobble (0–2) — bends the marks. */
  wobble?: number;
  /** SVG-port only: m.fillOpacity (0–1) — scales mark ink. */
  fillOpacity?: number;
};

/** Screen-px calibration: 2D hachureGap is SVG-px inside an ~800px viewBox
 *  frame; on screen the 3D frame renders at comparable size, so k≈2 reads
 *  matched at defaults (build plan §3.2's calibration constant — eyeball
 *  budget; if it reads wrong after 2 tweaks, port rough.js spacing per
 *  feedback_copy_implementation_before_tweaking_numbers). */
export const HATCH_GAP_SCREEN_K = 2.0;

/** fillStyle → shader mode int (all 8 FillStyleStep values real). */
export function fillStyleToMode(fillStyle: string | undefined): number {
  switch (fillStyle) {
    case 'none':
      return 7;
    case 'solid':
      return 6;
    case 'cross-hatch':
      return 1;
    case 'dots':
      return 2;
    case 'zigzag':
      return 3;
    case 'dashed':
      return 4;
    case 'zigzag-line':
      return 5;
    case 'hachure':
    default:
      return 0;
  }
}

const VERTEX = /* glsl */ `
varying vec3 vWorldNormal;
void main() {
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Lambert tone from the rig's key/fill structure (Stroke3DScene directional
// positions, normalized) + ambient floor — deterministic, no scene queries.
const FRAGMENT = /* glsl */ `
varying vec3 vWorldNormal;
uniform vec3 u_bands[8];      // [darknessMin, darknessMax, tamLayers] — coverage.ts verbatim
uniform float u_gapPx;        // hachure gap, device px
uniform float u_angleRad;     // hachure angle
uniform float u_weightPx;     // line half-thickness, device px
uniform float u_inkIntensity; // 0..1
uniform vec3 u_ink;
uniform vec3 u_paper;
uniform int u_fillMode;       // 0 hachure · 1 cross-hatch · 2 dots · 3 zigzag · 4 dashed · 5 zigzag-line · 6 solid · 7 none
uniform float u_wobblePx;     // svg-port mark bend amplitude, device px
uniform float u_markOpacity;  // svg-port fillOpacity (1.0 for hatch variant)

// Distance-to-line-set mask: lines run along x at spacing 'gap'.
float lineMask(vec2 p, float gap, float halfW) {
  float d = abs(fract(p.y / gap) - 0.5) * gap;
  float aa = 0.9;
  return 1.0 - smoothstep(halfW - aa, halfW + aa, d);
}

// Dashed variant: rough.js default duty cycle 0.5 (dash length == dash gap).
float dashedMask(vec2 p, float gap, float halfW) {
  float m = lineMask(p, gap, halfW);
  float duty = step(fract(p.x / (gap * 2.0)), 0.5);
  return m * duty;
}

// Triangle wave for zigzag grammars.
float tri(float x) {
  return abs(fract(x) - 0.5) * 2.0;
}

// Dot-grid mask (one dot per gap² cell — the coverage.ts dots model).
float dotMask(vec2 p, float cell, float r) {
  vec2 g = (fract(p / cell) - 0.5) * cell;
  float d = length(g);
  float aa = 0.9;
  return 1.0 - smoothstep(r - aa, r + aa, d);
}

void main() {
  vec3 n = normalize(vWorldNormal);
  // Two-light lambert mirroring the scene rig (key 5,8,5 · fill -4,2,-2).
  float shade = 0.22;
  shade += 0.95 * max(dot(n, normalize(vec3(5.0, 8.0, 5.0))), 0.0);
  shade += 0.33 * max(dot(n, normalize(vec3(-4.0, 2.0, -2.0))), 0.0);
  shade = clamp(shade, 0.0, 1.0);
  float darkness = 1.0 - shade;

  // 8-band quantization — the SAME table the SVG renderer uses (one math).
  int band = 0;
  float layers = 0.0;
  for (int i = 7; i >= 0; i--) {
    if (darkness >= u_bands[i].x) {
      band = i;
      layers = u_bands[i].z;
      break;
    }
  }

  // Rotated screen-space mark coordinate (gl_FragCoord is device px).
  float c = cos(u_angleRad);
  float s = sin(u_angleRad);
  vec2 p = mat2(c, -s, s, c) * gl_FragCoord.xy;
  // SVG-port wobble: deterministic low-frequency bend along the mark direction.
  p.y += sin(p.x * 0.045) * u_wobblePx;

  float gap = max(u_gapPx, 2.0);
  // "Lines never merge" cap (techniqueMap render policy, weight ≤ 0.7·gap).
  float halfW = min(u_weightPx, gap * 0.35);
  vec2 pc = vec2(p.y, -p.x); // +90° cross direction

  float mask = 0.0;
  if (band > 0) {
    if (u_fillMode == 2) {
      // dots: radius grows with TAM layer depth; layer 3+ adds offset set.
      float r = halfW * (0.9 + 0.6 * layers);
      mask = dotMask(p, gap, r);
      if (layers >= 3.0) mask = max(mask, dotMask(p + vec2(gap * 0.5), gap, r));
    } else if (u_fillMode == 6) {
      // solid grammar: any inked band is solid ink.
      mask = 1.0;
    } else if (u_fillMode == 7) {
      // none: marks off — the edge overlay carries the read.
      mask = 0.0;
    } else {
      vec2 pl = p;
      if (u_fillMode == 3 || u_fillMode == 5) {
        // zigzag family: triangular perturbation across the line direction.
        pl.y += tri(pl.x / (gap * 1.6)) * gap * 0.45;
      }
      bool dashed = (u_fillMode == 4);
      // TAM-style layer stacking (build plan §3.3 / tamLayers column):
      //   L1 base set · L2 + half-gap offset set · L3 + cross set · L4 + cross offset.
      // cross-hatch grammar starts crossed at L1 (its grammar IS crossed).
      float base = dashed ? dashedMask(pl, gap, halfW) : lineMask(pl, gap, halfW);
      mask = base;
      if (layers >= 2.0 || u_fillMode == 1) {
        float crossSet = dashed ? dashedMask(pc, gap, halfW) : lineMask(pc, gap, halfW);
        if (u_fillMode == 1) mask = max(mask, crossSet); // crossed from the start
        if (layers >= 2.0) {
          float off = dashed ? dashedMask(pl + vec2(0.0, gap * 0.5), gap, halfW)
                             : lineMask(pl + vec2(0.0, gap * 0.5), gap, halfW);
          mask = max(mask, off);
        }
        if (layers >= 3.0 && u_fillMode != 1) mask = max(mask, crossSet);
        if (layers >= 4.0) {
          float crossOff = dashed ? dashedMask(pc + vec2(0.0, gap * 0.5), gap, halfW)
                                  : lineMask(pc + vec2(0.0, gap * 0.5), gap, halfW);
          mask = max(mask, crossOff);
        }
      }
    }
    // Band 7 approaches solid in every grammar (build plan §3.3 step 3).
    if (band >= 7) mask = max(mask, 0.92);
  }

  // Paper carries a whisper of form shade so the volume never goes cardboard.
  vec3 paper = u_paper * (0.94 + 0.06 * shade);
  float ink = clamp(mask * u_inkIntensity * u_markOpacity, 0.0, 1.0);
  gl_FragColor = vec4(mix(paper, u_ink, ink), 1.0);
}
`;

export function createHatchMaterial(variant: HatchVariant): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      u_bands: { value: bandsAsVec3() },
      u_gapPx: { value: 8.0 },
      u_angleRad: { value: (-41 * Math.PI) / 180 },
      u_weightPx: { value: 1.0 },
      u_inkIntensity: { value: 1.0 },
      u_ink: { value: new THREE.Color('#2A2622') },
      u_paper: { value: new THREE.Color('#FDFCF9') },
      u_fillMode: { value: 0 },
      u_wobblePx: { value: 0.0 },
      u_markOpacity: { value: 1.0 },
    },
    name: variant === 'hatch' ? 'dd-hatch' : 'dd-svg-port',
  });
}

/** coverage.ts band table → vec3[8] (stride 3: darknessMin/darknessMax/tamLayers). */
function bandsAsVec3(): THREE.Vector3[] {
  const flat = bandTableForUniforms();
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < 8; i++) {
    out.push(new THREE.Vector3(flat[i * 3], flat[i * 3 + 1], flat[i * 3 + 2]));
  }
  return out;
}

/** Copy live slider values into uniforms (no rebuild — the live re-hatch). */
export function updateHatchUniforms(
  mat: THREE.ShaderMaterial,
  variant: HatchVariant,
  inputs: HatchInputs,
  inkHex: string,
  paperHex: string,
  pixelRatio: number,
): void {
  const u = mat.uniforms;
  u.u_gapPx.value = Math.max(inputs.hachureGap * HATCH_GAP_SCREEN_K, 1.5) * pixelRatio;
  u.u_angleRad.value = (inputs.hachureAngle * Math.PI) / 180;
  // strokeWidth 0.1–10 → half-thickness px (×0.6 reads matched to the 2D line
  // at default 1.2); the gap*0.35 merge cap applies in-shader.
  u.u_weightPx.value = Math.max(inputs.strokeWidth * 0.6, 0.35) * pixelRatio;
  u.u_inkIntensity.value = Math.min(Math.max(inputs.inkIntensity, 0), 1);
  (u.u_ink.value as THREE.Color).set(inkHex);
  (u.u_paper.value as THREE.Color).set(paperHex);
  if (variant === 'svg-port') {
    u.u_fillMode.value = fillStyleToMode(inputs.fillStyle);
    u.u_wobblePx.value = (inputs.wobble ?? 0) * 2.2 * pixelRatio;
    u.u_markOpacity.value = inputs.fillOpacity ?? 1.0;
  } else {
    // Hatch variant: hachure grammar with TAM stacking, no wobble — the
    // Shading cluster is its whole control surface (D-4 interim contract).
    u.u_fillMode.value = 0;
    u.u_wobblePx.value = 0;
    u.u_markOpacity.value = 1.0;
  }
}
