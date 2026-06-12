// ─── The 10-fixture mark-intent battery — stroke records ────────────────────
// mark-intent-boundary-spec.md §6, golden-gated. Every fixture is a
// DETERMINISTIC generator (fixed trig, no randomness) producing drawn-register
// stroke records in the 800×600 viewBox. Expected labels live in
// tools/3d/markintent-golden.json (the golden file — same ceremony as
// golden-labels.v2); tools/3d/mark-intent-battery.mjs drives the comparison +
// per-fixture screenshots through mark-intent-battery.html.
//
// Fixture 0 is SUPPLEMENTARY (the donut — visual proof of the D2-B parity
// holes); fixtures 1-10 are the spec battery verbatim.

import type { StrokeInputPoint } from '../../src/app/lib/geometry3d/strokeTo3d';

export interface MarkIntentFixture {
  id: number;
  name: string;
  title: string;
  /** Supplementary cells ride the battery but are not part of the spec's 10. */
  supplementary?: boolean;
  strokes: StrokeInputPoint[][];
}

type Pt3 = StrokeInputPoint;

// ── Generators (all deterministic) ──────────────────────────────────────────

function line(x1: number, y1: number, x2: number, y2: number, n = 30): Pt3[] {
  const out: Pt3[] = [];
  for (let i = 0; i <= n; i++) {
    out.push([x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n, 0.5]);
  }
  return out;
}

function circle(cx: number, cy: number, r: number, n = 96, startDeg = 0, endDeg = 360): Pt3[] {
  const out: Pt3[] = [];
  const a0 = (startDeg * Math.PI) / 180;
  const a1 = (endDeg * Math.PI) / 180;
  for (let i = 0; i <= n; i++) {
    const t = a0 + ((a1 - a0) * i) / n;
    out.push([cx + r * Math.cos(t), cy + r * Math.sin(t), 0.5]);
  }
  return out;
}

function ellipse(cx: number, cy: number, rx: number, ry: number, n = 96): Pt3[] {
  const out: Pt3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    out.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t), 0.5]);
  }
  return out;
}

function polylineThrough(points: Array<[number, number]>, perSeg = 24): Pt3[] {
  const out: Pt3[] = [];
  for (let s = 0; s + 1 < points.length; s++) {
    const [ax, ay] = points[s];
    const [bx, by] = points[s + 1];
    const last = s + 2 === points.length;
    const steps = last ? perSeg : perSeg - 1;
    for (let i = 0; i <= steps; i++) {
      out.push([ax + ((bx - ax) * i) / perSeg, ay + ((by - ay) * i) / perSeg, 0.5]);
    }
  }
  return out;
}

/** Dense back-and-forth scribble filling a rect (hairpin rows). */
function scribbleRect(x: number, y: number, w: number, h: number, rowStep: number): Pt3[] {
  const pts: Array<[number, number]> = [];
  const rows = Math.max(Math.floor(h / rowStep), 1);
  for (let r = 0; r <= rows; r++) {
    const yy = y + r * rowStep;
    if (r % 2 === 0) {
      pts.push([x, yy], [x + w, yy]);
    } else {
      pts.push([x + w, yy], [x, yy]);
    }
  }
  return polylineThrough(pts, 12);
}

/** Archimedean spiral — windings spaced so the ink bodies fuse (≤ 14px). */
function spiral(cx: number, cy: number, turns: number, spacingPerTurn: number, r0 = 6): Pt3[] {
  const out: Pt3[] = [];
  const steps = Math.floor(turns * 64);
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * turns * Math.PI * 2;
    const r = r0 + (spacingPerTurn * theta) / (Math.PI * 2);
    out.push([cx + r * Math.cos(theta), cy + r * Math.sin(theta), 0.5]);
  }
  return out;
}

function dot(cx: number, cy: number): Pt3[] {
  return [
    [cx, cy, 0.5],
    [cx + 1.5, cy + 1, 0.5],
    [cx + 0.5, cy + 2, 0.5],
  ];
}

/** Prolate-cycloid cursive run — self-crossing loops, sprawling hull. */
function cursive(x0: number, y0: number, r: number, d: number, loops: number): Pt3[] {
  const out: Pt3[] = [];
  const steps = loops * 48;
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * loops * Math.PI * 2;
    out.push([x0 + r * (theta - d * Math.sin(theta)), y0 - r * (1 - d * Math.cos(theta)), 0.5]);
  }
  return out;
}

// ── The fixtures ─────────────────────────────────────────────────────────────

// F1 — Sebs's ARROW: outline with an 18px endpoint gap on a ~304px-diag shape
// → tight bound 8px < gap < loose bound 24.3px → treated-as-closed band.
const arrowOutline = polylineThrough(
  [
    [200, 300],
    [400, 300],
    [400, 260],
    [480, 320],
    [400, 380],
    [400, 340],
    [200, 340],
    [202, 318], // 18px from the start point
  ],
  20,
);

// F2 — CAT-FACE: closed head + two ear triangles OUTSIDE the head circle +
// two blacked-in eye scribbles (dense — the fill-intent read).
const catHead = circle(400, 300, 150);
const earL = polylineThrough(
  [
    [292, 198],
    [318, 110],
    [368, 168],
    [293, 197],
  ],
  16,
);
const earR = polylineThrough(
  [
    [508, 198],
    [482, 110],
    [432, 168],
    [507, 197],
  ],
  16,
);
const eyeL = scribbleRect(322, 258, 36, 24, 3);
const eyeR = scribbleRect(442, 258, 36, 24, 3);

// F3 — TWO-ARC CIRCLE: two open half-arcs, junction gaps ≈ 24px < merge
// tolerance (max(24, 8% joint diag ≈ 31.7) ) → composite loop.
const arcRight = circle(400, 300, 140, 64, -85, 85);
const arcLeft = circle(400, 300, 140, 64, 95, 265);

// F4 — DELIBERATE SPIRAL-FILL: 4.5 turns, 13px ring spacing (ink fuses).
const spiralFill = spiral(400, 300, 4.5, 13);

// F5 — HAND-HATCHING INSIDE AN OUTLINE: ellipse + 7 parallel strokes,
// regular 28px spacing, consistent angle.
const hatchOutline = ellipse(400, 300, 190, 150);
const hatchStrokes = Array.from({ length: 7 }, (_, k) =>
  line(310 + k * 28, 215, 340 + k * 28, 390, 36),
);

// F6 — LIGHTNING BOLT: sharp zigzag, uncontained — turns ≈ 120° (below the
// 150° reversal bar) → calm structure.
const lightning = polylineThrough(
  [
    [420, 180],
    [360, 290],
    [410, 290],
    [340, 420],
  ],
  24,
);

// F7 — CURSIVE SIGNATURE: self-crossing loops, sprawling, low ink density.
const signature = cursive(220, 330, 24, 2.2, 4);

// F8 — SINGLE WAVY LINE INSIDE A REGION: calm decoration — guards R4 from
// eating calm contained strokes.
const wavyOutline = circle(400, 300, 170);
const wavyLine: Pt3[] = [];
for (let i = 0; i <= 96; i++) {
  const x = 280 + (240 * i) / 96;
  wavyLine.push([x, 300 + 18 * Math.sin((i / 96) * Math.PI * 4), 0.5]);
}

// F9 — FULL-CANVAS SCRIBBLE, NO CONTAINER: dense (4px rows → ink ≈ 0.75 of
// hull) → fill-intent over its own hull, not "shading of nothing".
const bigScribble = scribbleRect(200, 150, 400, 300, 4);

// F10 — DOT CLUSTER INSIDE OUTLINE + ONE LONE DOT OUTSIDE: stipple band vs
// structure bead.
const dotOutline = circle(400, 300, 150);
const dotCluster = [0, 1, 2, 3, 4, 5].map((k) => dot(350 + k * 20, 300));
const loneDot = dot(660, 140);

// F0 — SUPPLEMENTARY DONUT: nested drawn loops → D2-B parity hole, visually.
const donutOuter = circle(400, 300, 160);
const donutInner = circle(400, 300, 65);

export const MARK_INTENT_FIXTURES: MarkIntentFixture[] = [
  {
    id: 0,
    name: 'extra-donut',
    title: 'EXTRA — donut (parity hole)',
    supplementary: true,
    strokes: [donutOuter, donutInner],
  },
  { id: 1, name: 'arrow', title: 'F1 — arrow (open-ish outline)', strokes: [arrowOutline] },
  {
    id: 2,
    name: 'cat-face',
    title: 'F2 — cat face, scribbled eyes',
    strokes: [catHead, earL, earR, eyeL, eyeR],
  },
  { id: 3, name: 'two-arc-circle', title: 'F3 — two-arc circle', strokes: [arcRight, arcLeft] },
  { id: 4, name: 'spiral-fill', title: 'F4 — deliberate spiral-fill', strokes: [spiralFill] },
  {
    id: 5,
    name: 'hatching-in-outline',
    title: 'F5 — hand-hatching inside outline',
    strokes: [hatchOutline, ...hatchStrokes],
  },
  { id: 6, name: 'lightning', title: 'F6 — lightning bolt', strokes: [lightning] },
  { id: 7, name: 'cursive-signature', title: 'F7 — cursive signature', strokes: [signature] },
  {
    id: 8,
    name: 'wavy-in-region',
    title: 'F8 — wavy line inside region',
    strokes: [wavyOutline, wavyLine],
  },
  { id: 9, name: 'full-canvas-scribble', title: 'F9 — full-canvas scribble', strokes: [bigScribble] },
  {
    id: 10,
    name: 'dots-stipple-and-bead',
    title: 'F10 — dot cluster + lone dot',
    strokes: [dotOutline, ...dotCluster, loneDot],
  },
];
