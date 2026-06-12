// ─── convert — Phase D2 drawn-register conversion (strokes → matter) ────────
// The layer that ASKS what each region means (conversion-semantics-spec §1)
// under the RED-TEAM AMENDMENT architecture: for DRAWN stroke records,
// geometry/topology + mark intent are the brain — the classifier is never
// invoked. One entry point:
//
//   convertStrokePool(strokes, opts) → { units, receipts }
//
//   mode 'auto'    → the D2 pipeline: 3-state closure · mark-intent v1 ·
//                    donut-parity holes (D2-B) · shading-gesture → band, ZERO
//                    geometry · fill-intent → one clean solid patch. THE
//                    arrow/auto-fill fix lives here.
//   explicit modes → the geometry dropdown stays sacred (I-1): every stroke
//                    renders through the picked mode exactly as today;
//                    Extrude additionally inherits donut-parity holes; the
//                    intent brain still runs and its reading rides the
//                    receipts (training data, never an override).
//
// Every decision logs a ConversionReceipt to window.__dd_conversionLog
// (QW-1 pattern — the training collector starts tonight, gap G-1).
//
// PURITY CONTRACT: node-runnable, no DOM, no randomness, no wall-clock.

import {
  CLOSE_GAP_PX,
  CLOSE_GAP_BBOX_RATIO,
  DEFAULT_VIEWBOX,
  EXTRUDE_BEVEL_THICKNESS,
  EXTRUDE_DEPTH,
  RDP_EPSILON,
  WORLD_SCALE,
  buildExtrudeGeometryWithHoles,
  buildPoolSolidGeometry,
  buildRodGeometry,
  buildSolidGeometry,
  buildStrokeGeometry,
  closureStateOf,
  containmentDepths,
  normalizeStrokePoints,
  pointInLoop,
  poolCenter,
  rdpPoints,
  type ClosureState,
  type GeometryModeSetting,
  type StrokeGeometryResult,
  type StrokeInputPoint,
  type ViewBoxSize,
} from './strokeTo3d.ts';
import { analyzeMarkIntent, type IntentCluster, type MarkIntentAnalysis } from './markIntent.ts';
import {
  directiveForTreatment,
  pushConversionReceipt,
  type ConversionReceipt,
  type ConversionTreatmentKind,
  type MarkIntent,
} from '../smart/conversionMap.ts';

// ─── Riding offsets (addendum §1.4 "ink riding the solid") ──────────────────
// Contained marks that keep their own geometry must not drown inside the host
// slab: they shift toward the viewer so they read as ink ON the surface.

/** Contained line-rod centerline lands ON the host's front face (half-proud
 *  ink line). Offset = hostDepth/2 + bevel. */
export function rodRideOffset(hostDepth: number): number {
  return hostDepth / 2 + EXTRUDE_BEVEL_THICKNESS;
}
/** Contained fill patch sits proud of the host face by this much beyond its
 *  own front bevel. */
export const FILL_RIDE_PROUD = 0.04;

// ─── Result shapes (the rock-1 scene contract) ──────────────────────────────

export interface ConversionUnit {
  /** Matches the unit's receipt (`unitId`). */
  id: string;
  strokeIndices: number[];
  /** Built geometry — null when the treatment produces none (shading-gesture
   *  band, air, hole-consumed loops). Rod units carry cap/joint positions,
   *  already ride-offset when contained. */
  build: StrokeGeometryResult | null;
  treatment: ConversionTreatmentKind;
  intent: MarkIntent | null;
  closure: ClosureState | null;
  /** Coverage band (surface-hatch density / fill = 7); null when N/A. */
  band: number | null;
  /** THE chip: solid family applied inside the ambiguous closure band. */
  treatedAsClosed: boolean;
  /** Mark-intent margin < 0.15 — the 3-way Lines/Shading/Fill chip. */
  ambiguous: boolean;
  /** Donut-parity holes cut into this unit. */
  holesCut: number;
}

export interface ConvertResult {
  units: ConversionUnit[];
  receipts: ConversionReceipt[];
  /** The full drawn-register analysis (debug surfaces / harnesses). */
  analysis: MarkIntentAnalysis;
}

export interface ConvertOptions {
  viewBox?: ViewBoxSize;
  mode?: GeometryModeSetting;
  /** Pool bbox center (poolCenter) — defaults to the pool's own. */
  center?: { x: number; y: number };
  epsilon?: number;
  /** Rod radius / extrude+solid depth / inflate fullness passthroughs. */
  radius?: number;
  depth?: number;
  inflateRadius?: number;
  /** D2-B Holes toggle (donut parity). Default ON. */
  holes?: boolean;
  /** Optional correlation id stamped on every receipt. */
  svgHash?: string;
}

// ─── Internals ───────────────────────────────────────────────────────────────

type Pt = [number, number];

function loopPolygonViewBox(points: Pt[]): Pt[] {
  return points;
}

/** Translate a build (geometry + rod cap/joint metadata) along z. */
function translateBuildZ(build: StrokeGeometryResult, dz: number): void {
  if (dz === 0) return;
  build.geometry.translate(0, 0, dz);
  if (build.kind === 'rod') {
    for (const p of build.capPositions) p.z += dz;
    for (const p of build.jointPositions) p.z += dz;
  }
}

function geometryKindOf(build: StrokeGeometryResult | null): ConversionReceipt['geometry'] {
  return build ? build.kind : 'none';
}

// ─── THE entry point ─────────────────────────────────────────────────────────

export function convertStrokePool(
  strokes: StrokeInputPoint[][],
  opts: ConvertOptions = {},
): ConvertResult {
  const viewBox = opts.viewBox ?? DEFAULT_VIEWBOX;
  const mode = opts.mode ?? 'auto';
  const epsilon = opts.epsilon ?? RDP_EPSILON;
  const depth = opts.depth ?? EXTRUDE_DEPTH;
  const holesEnabled = opts.holes ?? true; // D2-B recommended default
  const nonEmpty = strokes
    .map((points, index) => ({ points, index }))
    .filter((s) => s.points.length > 0);
  const center =
    opts.center ?? poolCenter(nonEmpty.map((s) => s.points), viewBox);

  const analysis = analyzeMarkIntent(strokes, viewBox);
  const units: ConversionUnit[] = [];
  const receipts: ConversionReceipt[] = [];

  const emit = (
    unit: ConversionUnit,
    extra: {
      rawScore: number;
      margin: number;
      firedRules: string[];
      register?: ConversionReceipt['register'];
    },
  ) => {
    units.push(unit);
    const receipt: ConversionReceipt = {
      surface: 'conversion',
      register: extra.register ?? 'drawn',
      unitId: unit.id,
      strokeIndices: unit.strokeIndices,
      closure: unit.closure,
      intent: unit.intent,
      treatment: unit.treatment,
      directive: directiveForTreatment(unit.treatment, mode),
      geometry: geometryKindOf(unit.build),
      band: unit.band,
      treatedAsClosed: unit.treatedAsClosed,
      ambiguous: unit.ambiguous,
      rawScore: extra.rawScore,
      margin: extra.margin,
      firedRules: extra.firedRules,
      mode,
      holesCut: unit.holesCut,
      ...(opts.svgHash !== undefined ? { svgHash: opts.svgHash } : {}),
    };
    receipts.push(receipt);
    pushConversionReceipt(receipt);
  };

  const simplifiedOf = (index: number) => rdpPoints(strokes[index], epsilon);
  const worldOf = (pts: StrokeInputPoint[]) =>
    normalizeStrokePoints(pts, viewBox, WORLD_SCALE, center);

  // ─── Explicit 'solid': pool-level, exactly today's behavior ───────────────
  if (mode === 'solid') {
    const pool = nonEmpty.map((s) => s.points);
    const build = buildPoolSolidGeometry(pool, {
      viewBox,
      center,
      epsilon,
      depth: opts.depth,
      rodRadius: opts.radius,
    });
    emit(
      {
        id: 'pool',
        strokeIndices: nonEmpty.map((s) => s.index),
        build,
        treatment: 'solid',
        intent: null,
        closure: null,
        band: null,
        treatedAsClosed: false,
        ambiguous: false,
        holesCut: build.kind === 'solid' ? build.holes : 0,
      },
      { rawScore: 1, margin: 1, firedRules: ['MODE_explicit_solid_pool'] },
    );
    return { units, receipts, analysis };
  }

  // ─── Explicit 'rod' / 'inflate': per-stroke, exactly today's behavior;
  //     the intent brain's reading rides the receipts (training data) ────────
  if (mode === 'rod' || mode === 'inflate') {
    const clusterByStroke = new Map<number, IntentCluster>();
    for (const c of analysis.clusters) {
      for (const si of c.strokeIndices) clusterByStroke.set(si, c);
    }
    for (const { points, index } of nonEmpty) {
      const build = buildStrokeGeometry(points, {
        viewBox,
        mode,
        center,
        epsilon,
        radius: opts.radius,
        depth: opts.depth,
        inflateRadius: opts.inflateRadius,
      });
      const cluster = clusterByStroke.get(index);
      const closure = closureStateOf(simplifiedOf(index));
      emit(
        {
          id: `stroke-${index}`,
          strokeIndices: [index],
          build,
          treatment: 'line-rod', // explicit pick is sacred — honest outline/worm read
          intent: cluster?.intent ?? null,
          closure,
          band: cluster?.band ?? null,
          treatedAsClosed: false, // no solid-family default was applied
          ambiguous: cluster?.ambiguous ?? false,
          holesCut: 0,
        },
        {
          rawScore: cluster?.rawScore ?? 1,
          margin: cluster?.margin ?? 1,
          firedRules: [`MODE_explicit_${mode}`, ...(cluster?.firedRules ?? [])],
        },
      );
    }
    return { units, receipts, analysis };
  }

  // ─── 'auto' (D2 pipeline) and explicit 'extrude' (today + parity holes) ───

  // 1. Structure loops (closed/treated-as-closed singles + composite cycles
  //    whose cluster intent is structure) feed the donut-parity walk.
  const structureClusters = analysis.clusters.filter((c) => c.intent === 'structure');
  const structureLoopRefs: Array<{
    cluster: IntentCluster;
    loopId: string | null;
    /** Geometry source: rdp anchors (single) / composed polyline (composite). */
    outlineViewBox: Pt[];
    closure: ClosureState;
    strokeIndices: number[];
  }> = [];
  const structureOpen: IntentCluster[] = [];

  for (const c of structureClusters) {
    if (c.kind === 'composite-loop' && c.loopId) {
      const loop = analysis.loops.find((l) => l.id === c.loopId)!;
      const anchors = rdpPoints(
        loop.points.map((p): StrokeInputPoint => [p[0], p[1]]),
        epsilon,
      ).map((p): Pt => [p[0], p[1]]);
      structureLoopRefs.push({
        cluster: c,
        loopId: c.loopId,
        outlineViewBox: anchors,
        closure: 'closed', // graph merge IS the closure (R3 — silent)
        strokeIndices: c.strokeIndices,
      });
      continue;
    }
    // Singles (incl. dot beads — beads are open by construction).
    const index = c.strokeIndices[0];
    const simplified = simplifiedOf(index);
    const closure = closureStateOf(simplified);
    if (closure !== 'open' && !analysis.features[index].dotness) {
      const loop = analysis.loops.find(
        (l) => !l.composite && l.strokeIndices.length === 1 && l.strokeIndices[0] === index,
      );
      structureLoopRefs.push({
        cluster: c,
        loopId: loop?.id ?? null,
        outlineViewBox: simplified.map((p): Pt => [p[0], p[1]]),
        closure,
        strokeIndices: [index],
      });
    } else {
      structureOpen.push(c);
    }
  }

  // 2. Donut parity over the structure loops (viewBox polygons).
  const loopPolys = structureLoopRefs.map((r) => loopPolygonViewBox(r.outlineViewBox));
  const depths = containmentDepths(loopPolys);

  // A loop is a HOLE iff: parity odd ∧ Holes toggle ON ∧ its region carries
  // band 0 (a shaded inner loop is solid mass, never subtracted — spec §3
  // "enclosed + band 0 + odd containment depth → hole").
  const isHole = structureLoopRefs.map((r, i) => {
    if (!holesEnabled || depths[i] % 2 !== 1) return false;
    const band = r.loopId ? analysis.loopBands[r.loopId] ?? 0 : 0;
    return band === 0;
  });

  // Holes attach to their innermost containing loop one parity level up.
  const holeChildren = new Map<number, number[]>();
  for (let i = 0; i < structureLoopRefs.length; i++) {
    if (!isHole[i]) continue;
    const [x, y] = loopPolys[i][0];
    let best = -1;
    let bestArea = Infinity;
    for (let j = 0; j < structureLoopRefs.length; j++) {
      if (j === i || depths[j] !== depths[i] - 1 || isHole[j]) continue;
      if (pointInLoop(x, y, loopPolys[j])) {
        const a = Math.abs(
          loopPolys[j].reduce((acc, [ax, ay], k) => {
            const [bx, by] = loopPolys[j][(k + 1) % loopPolys[j].length];
            return acc + ax * by - bx * ay;
          }, 0) / 2,
        );
        if (a < bestArea) {
          bestArea = a;
          best = j;
        }
      }
    }
    if (best >= 0) {
      if (!holeChildren.has(best)) holeChildren.set(best, []);
      holeChildren.get(best)!.push(i);
    } else {
      isHole[i] = false; // orphan hole — render as its own mass, never vanish
    }
  }

  // 3. Mass loops → extrude slabs with their holes (the §4 'solid' row in
  //    Extrude; auto composes the same way).
  for (let i = 0; i < structureLoopRefs.length; i++) {
    const ref = structureLoopRefs[i];
    if (isHole[i]) {
      // Consumed by the parent slab — receipt, no unit geometry.
      emit(
        {
          id: ref.loopId ?? `loop-extra-${i}`,
          strokeIndices: ref.strokeIndices,
          build: null,
          treatment: 'hole',
          intent: 'structure',
          closure: ref.closure,
          band: null,
          treatedAsClosed: ref.closure === 'treated-as-closed',
          ambiguous: ref.cluster.ambiguous,
          holesCut: 0,
        },
        {
          rawScore: ref.cluster.rawScore,
          margin: ref.cluster.margin,
          firedRules: ['D2B_donut_parity_hole', ...ref.cluster.firedRules],
        },
      );
      continue;
    }
    const holeWorlds = (holeChildren.get(i) ?? []).map((h) =>
      worldOf(structureLoopRefs[h].outlineViewBox.map((p): StrokeInputPoint => [p[0], p[1]])),
    );
    const world = worldOf(ref.outlineViewBox.map((p): StrokeInputPoint => [p[0], p[1]]));
    const build = buildExtrudeGeometryWithHoles(world, holeWorlds, {
      depth: opts.depth,
      rodRadius: opts.radius,
    });
    emit(
      {
        id: ref.loopId ?? `loop-extra-${i}`,
        strokeIndices: ref.strokeIndices,
        build,
        treatment: 'solid',
        intent: 'structure',
        closure: ref.closure,
        band: ref.loopId ? analysis.loopBands[ref.loopId] ?? null : null,
        treatedAsClosed: ref.closure === 'treated-as-closed',
        ambiguous: ref.cluster.ambiguous,
        holesCut: build.kind === 'extrude' ? build.holesCut : 0,
      },
      {
        rawScore: ref.cluster.rawScore,
        margin: ref.cluster.margin,
        firedRules: [
          ref.closure === 'treated-as-closed'
            ? 'CLOSURE_treated_as_closed_solid_chip'
            : 'CLOSURE_closed_solid_silent',
          ...ref.cluster.firedRules,
        ],
      },
    );
  }

  // Rendered solid hosts (for riding offsets): loopId → that unit exists.
  const renderedSolidLoopIds = new Set(
    structureLoopRefs.filter((r, i) => !isHole[i] && r.loopId).map((r) => r.loopId as string),
  );

  // 4. Open structure strokes → rods (line-rod row; in explicit 'extrude' the
  //    pick is sacred: open strokes keep today's per-stroke extrude attempt).
  for (const c of structureOpen) {
    const index = c.strokeIndices[0];
    const simplified = simplifiedOf(index);
    const closure = closureStateOf(simplified);
    const world = worldOf(simplified);
    let build: StrokeGeometryResult;
    let firedRule: string;
    if (mode === 'extrude') {
      build = buildExtrudeGeometryWithHoles(world, [], {
        depth: opts.depth,
        rodRadius: opts.radius,
      });
      firedRule = 'MODE_explicit_extrude_open_stroke';
    } else {
      build = buildRodGeometry(world, { radius: opts.radius, closed: false });
      firedRule = analysis.features[index].dotness ? 'R1_dot_bead_rod' : 'TREATMENT_line_rod';
      // Ink rides the solid (addendum §1.4): a decoration stroke contained in
      // a rendered slab shifts to the host's front face.
      const f = analysis.features[index];
      if (f.containment >= 0.7 && f.hostLoopId && renderedSolidLoopIds.has(f.hostLoopId)) {
        translateBuildZ(build, rodRideOffset(depth));
        firedRule = 'TREATMENT_line_rod_riding_host_face';
      }
    }
    emit(
      {
        id: `stroke-${index}`,
        strokeIndices: [index],
        build,
        treatment: 'line-rod',
        intent: 'structure',
        closure,
        band: null,
        treatedAsClosed: false,
        ambiguous: c.ambiguous,
        holesCut: 0,
      },
      { rawScore: c.rawScore, margin: c.margin, firedRules: [firedRule, ...c.firedRules] },
    );
  }

  // 5. Shading-gesture clusters: ZERO geometry of their own (preserve-marks
  //    rule) — the band lands on the containing region; receipts carry it.
  //    In explicit 'extrude' the pick is sacred: strokes still render.
  for (const c of analysis.clusters) {
    if (c.intent !== 'shading-gesture') continue;
    let build: StrokeGeometryResult | null = null;
    if (mode === 'extrude') {
      // Explicit override: each stroke renders through the picked mode.
      for (const index of c.strokeIndices) {
        const world = worldOf(simplifiedOf(index));
        const b = buildExtrudeGeometryWithHoles(world, [], {
          depth: opts.depth,
          rodRadius: opts.radius,
        });
        emit(
          {
            id: `stroke-${index}`,
            strokeIndices: [index],
            build: b,
            treatment: 'surface-hatch',
            intent: 'shading-gesture',
            closure: closureStateOf(simplifiedOf(index)),
            band: c.band,
            treatedAsClosed: false,
            ambiguous: c.ambiguous,
            holesCut: 0,
          },
          {
            rawScore: c.rawScore,
            margin: c.margin,
            firedRules: ['MODE_explicit_extrude_overrides_intent', ...c.firedRules],
          },
        );
      }
      continue;
    }
    emit(
      {
        id: c.id,
        strokeIndices: c.strokeIndices,
        build,
        treatment: 'surface-hatch',
        intent: 'shading-gesture',
        closure: null,
        band: c.band,
        treatedAsClosed: false,
        ambiguous: c.ambiguous,
        holesCut: 0,
      },
      { rawScore: c.rawScore, margin: c.margin, firedRules: c.firedRules },
    );
  }

  // 6. Fill-intent clusters: the marks' envelope becomes the region — ONE
  //    clean solid mass via the Solid raster machinery (never per-stroke
  //    blobs). Contained patches ride proud of the host face.
  for (const c of analysis.clusters) {
    if (c.intent !== 'fill-intent') continue;
    const memberSimplified = c.strokeIndices.map((i) => simplifiedOf(i));
    const worldStrokes = memberSimplified.map((s) => worldOf(s));
    const closedFlags = memberSimplified.map((s) => closureStateOf(s) !== 'open');
    const build = buildSolidGeometry(worldStrokes, {
      depth: opts.depth,
      closedFlags,
      rodRadius: opts.radius,
    });
    const firedRules = [...c.firedRules];
    const hostId = c.hostLoopId;
    if (hostId && renderedSolidLoopIds.has(hostId)) {
      translateBuildZ(build, EXTRUDE_BEVEL_THICKNESS + FILL_RIDE_PROUD);
      firedRules.unshift('TREATMENT_fill_patch_riding_host_face');
    }
    emit(
      {
        id: c.id,
        strokeIndices: c.strokeIndices,
        build,
        treatment: 'solid',
        intent: 'fill-intent',
        closure: null,
        band: c.band ?? 7,
        treatedAsClosed: false,
        ambiguous: c.ambiguous,
        holesCut: 0,
      },
      { rawScore: c.rawScore, margin: c.margin, firedRules },
    );
  }

  return { units, receipts, analysis };
}

// Re-export the contract pieces a consumer needs alongside the entry point.
export { CLOSE_GAP_BBOX_RATIO, CLOSE_GAP_PX };
export type { ConversionReceipt, GeometryModeSetting, StrokeInputPoint, ViewBoxSize };
