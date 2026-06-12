// ─── conversionMap — Phase D2 conversion-semantics vocabulary + receipts ────
// THE second techniqueMap-style lookup (conversion-semantics-spec §1): one
// record, one treatment vocabulary, TWO register brains (RED-TEAM AMENDMENT,
// ratified 2026-06-12):
//
//   - DRAWN register: geometry/topology is the brain (closure + mark intent —
//     src/app/lib/geometry3d/markIntent.ts + convert.ts). The smartHachure
//     classifier is NEVER invoked on drawn stroke records (live-confirmed
//     paper@0.9 misfire — filed separately for a golden re-bless ceremony).
//   - UPLOAD register: the classifier is the brain — §3's role table applies
//     as written. This module holds that lookup as PURE DATA; it imports
//     nothing from the classifier (no locked-file contact, types only).
//
// PURITY CONTRACT (node-runnable like strokeTo3d.ts): no React, no DOM
// (window receipt hook is guarded), no wall-clock, no randomness.
//
// Receipts (gap G-1, QW-1 pattern — same idiom as smartHachure's
// __dd_decisionLog): every conversion decision logs to
// window.__dd_conversionLog. This is the training collector — chip flips and
// per-region corrections become labeled tuples through the same channel.

import type { TonalRole } from '../smartHachure/types';
import type { ClosureState, GeometryModeSetting } from '../geometry3d/strokeTo3d';

export type { ClosureState };

// ─── The treatment vocabulary (conversion-semantics §3 — shared by BOTH
//     registers; the drawn brain and the upload brain emit into this) ───────

/** What a region means AS MATTER. `surface-hatch` carries its band in the
 *  receipt / unit (band 0-7, the same COVERAGE_BANDS index both renderers
 *  quantize with). `relief` is the opt-in secondary axis (D2-D) — vocabulary
 *  slot reserved, no geometry consumer this round. */
export type ConversionTreatmentKind =
  | 'solid' // volumetric mass
  | 'shell' // the OUTLINE is the object; interior is air (makeathon cut: closed-rod ring, D2-C)
  | 'line-rod' // the stroke itself is the object (ink worm)
  | 'hole' // subtract from the containing solid (donut parity, D2-B)
  | 'air' // enclosed but means nothing; render nothing
  | 'surface-hatch' // band drives hatch density on the region's surface (I-2)
  | 'relief'; // band offsets extrusion depth (opt-in axis, OFF by default)

export type ConversionRegister = 'drawn' | 'upload';

/** Drawn-register mark intent (mark-intent-boundary-spec §1 — the three-way
 *  split closure alone cannot answer: thing / tone / fill). */
export type MarkIntent = 'structure' | 'shading-gesture' | 'fill-intent';

// ─── Upload-register lookup (spec §3 default role → treatment table) ────────
// NOT consumed by the drawn pipeline (two brains). The live upload wiring
// lands with the M8/SVG-port rounds; the lookup ships now as the contract.

export interface RoleTreatment {
  /** Treatment for the closed reading of the region. */
  closed: ConversionTreatmentKind;
  /** Treatment for the open reading. */
  open: ConversionTreatmentKind;
  /** Whether the region's source-darkness band rides along as surface-hatch
   *  density (the tonal family). */
  carriesBand: boolean;
  /** Spec §3 row note — receipts cite it as the fired rule. */
  rule: string;
}

export const ROLE_TREATMENT_MAP: Record<TonalRole, RoleTreatment> = {
  paper: { closed: 'air', open: 'air', carriesBand: false, rule: 'ROLE_paper_never_mass' },
  'structural-frame': { closed: 'shell', open: 'line-rod', carriesBand: false, rule: 'ROLE_frame_outline_not_slab' },
  'line-decoration': { closed: 'shell', open: 'line-rod', carriesBand: false, rule: 'ROLE_frame_outline_not_slab' },
  'sparse-tonal': { closed: 'solid', open: 'solid', carriesBand: true, rule: 'ROLE_tonal_mass_with_band' },
  'mid-tonal': { closed: 'solid', open: 'solid', carriesBand: true, rule: 'ROLE_tonal_mass_with_band' },
  'dense-tonal': { closed: 'solid', open: 'solid', carriesBand: true, rule: 'ROLE_tonal_mass_with_band' },
  'solid-content': { closed: 'solid', open: 'solid', carriesBand: true, rule: 'ROLE_tonal_mass_with_band' },
  'decorative-accent': { closed: 'line-rod', open: 'line-rod', carriesBand: false, rule: 'ROLE_accent_rod_scaled_down' },
  'label-text': { closed: 'line-rod', open: 'line-rod', carriesBand: false, rule: 'ROLE_label_flat_never_inflated' },
};

/** Upload-register treatment pick (classifier role + closure in → treatment
 *  out). The drawn register NEVER routes through this. */
export function treatmentForRole(role: TonalRole, closed: boolean): ConversionTreatmentKind {
  const row = ROLE_TREATMENT_MAP[role];
  return closed ? row.closed : row.open;
}

// ─── Per-mode application matrix (spec §4 — the geometry dropdown stays
//     sacred; treatments decide WITHIN the mode) ────────────────────────────

/** Concrete geometry directive a treatment resolves to inside one geometry
 *  mode. 'skip' = render nothing (air / hatch-only); 'hole-subtract' = the
 *  region is consumed as Shape.holes by its containing solid. */
export type GeometryDirective =
  | 'tube' // open rod
  | 'closed-tube' // closed-loop rod ring (honest outline read / shell cut D2-C)
  | 'slab' // filled extrude
  | 'capsule' // inflate
  | 'raster-mass' // Solid pool-raster mass
  | 'hole-subtract'
  | 'skip';

type ConcreteMode = Exclude<GeometryModeSetting, 'auto'>;

const APPLICATION_MATRIX: Record<
  Extract<ConversionTreatmentKind, 'line-rod' | 'solid' | 'shell' | 'hole' | 'air'>,
  Record<ConcreteMode, GeometryDirective>
> = {
  // Spec §4 table, row by row.
  'line-rod': { rod: 'tube', extrude: 'tube', inflate: 'tube', solid: 'tube' },
  solid: { rod: 'closed-tube', extrude: 'slab', inflate: 'capsule', solid: 'raster-mass' },
  shell: { rod: 'closed-tube', extrude: 'closed-tube', inflate: 'capsule', solid: 'closed-tube' },
  hole: { rod: 'skip', extrude: 'hole-subtract', inflate: 'skip', solid: 'hole-subtract' },
  air: { rod: 'skip', extrude: 'skip', inflate: 'skip', solid: 'skip' },
};

/** Resolve a treatment to its in-mode geometry directive (spec §4). 'auto'
 *  composes per region: line-rod regions ride the Rod machinery, solid
 *  regions ride Extrude — inside ONE object (the arrow fix). surface-hatch /
 *  relief are material-layer treatments — they never produce geometry of
 *  their own in any mode. */
export function directiveForTreatment(
  treatment: ConversionTreatmentKind,
  mode: GeometryModeSetting,
): GeometryDirective {
  if (treatment === 'surface-hatch' || treatment === 'relief') return 'skip';
  if (mode === 'auto') {
    // Auto composes: §4 "per REGION, line-rod regions → Rod machinery, solid
    // regions → Extrude, inside ONE object."
    switch (treatment) {
      case 'line-rod':
        return 'tube';
      case 'solid':
        return 'slab';
      case 'shell':
        return 'closed-tube';
      case 'hole':
        return 'hole-subtract';
      case 'air':
        return 'skip';
    }
  }
  return APPLICATION_MATRIX[treatment][mode];
}

// ─── ConversionReceipt — THE type contract (gap G-1) ────────────────────────
// Rock 1 (chrome/scene) renders the "Treated as closed" chip from
// `treatedAsClosed` and the 3-way Marks chip from `ambiguous`; the training
// collector reads the whole row. One receipt per conversion unit (stroke /
// cluster / composite loop / pool).

export interface ConversionReceipt {
  surface: 'conversion';
  /** Which brain decided (two-register architecture). */
  register: ConversionRegister;
  /** Deterministic unit id within one conversion pass:
   *  'stroke-N' | 'cluster-N' | 'loop-N' | 'pool'. */
  unitId: string;
  /** Record indices of the strokes this unit covers (drawn register). */
  strokeIndices: number[];
  /** 3-state closure of the unit's loop/stroke (null for pool-level units). */
  closure: ClosureState | null;
  /** Drawn-register mark intent (null for upload register / pool-level). */
  intent: MarkIntent | null;
  treatment: ConversionTreatmentKind;
  /** Geometry directive the treatment resolved to in the active mode. */
  directive: GeometryDirective;
  /** What was actually built ('none' for skip / hole-consumed units). */
  geometry: 'rod' | 'extrude' | 'inflate' | 'solid' | 'none';
  /** Coverage band 0-7 (surface-hatch / fill); null when no band applies. */
  band: number | null;
  /** THE chip flag: closure fell in the ambiguous gap band and the solid
   *  family was applied by default (addendum A-2). One tap flips it — every
   *  flip is a labeled correction. */
  treatedAsClosed: boolean;
  /** Mark-intent margin < threshold — the 3-way Lines/Shading/Fill chip. */
  ambiguous: boolean;
  /** Winning intent's raw score (drawn) / rule confidence (upload). */
  rawScore: number;
  /** Winner − runner-up across intents (QW-2 pattern). */
  margin: number;
  firedRules: string[];
  /** The geometry-mode setting the conversion ran under. */
  mode: GeometryModeSetting;
  /** Donut-parity holes cut into this unit (outer slabs). */
  holesCut: number;
  /** Optional correlation id (content hash) supplied by the caller. */
  svgHash?: string;
}

// FIFO cap — same guard as smartHachure's decision log.
const CONVERSION_LOG_MAX = 5000;
const conversionLog: ConversionReceipt[] = [];

export function pushConversionReceipt(receipt: ConversionReceipt): void {
  conversionLog.push(receipt);
  if (conversionLog.length > CONVERSION_LOG_MAX) {
    conversionLog.splice(0, conversionLog.length - CONVERSION_LOG_MAX);
  }
}

/** Snapshot of the in-memory receipt log (copy — safe to mutate/serialize). */
export function getConversionLog(): ConversionReceipt[] {
  return conversionLog.slice();
}

/** Reset the collector (harnesses call this between runs). */
export function clearConversionLog(): void {
  conversionLog.length = 0;
}

// Harness access from DevTools / playwright — same window-flag idiom as
// __dd_decisionLog (smartHachure/index.ts) and __dd_diag.
if (typeof window !== 'undefined') {
  (
    window as {
      __dd_conversionLog?: { get: () => ConversionReceipt[]; clear: () => void };
    }
  ).__dd_conversionLog = { get: getConversionLog, clear: clearConversionLog };
}
