// Inflate-Lite + Solid visual harness (see inflate-preview.html). Repo tool
// only — mounts the REAL Stroke3DScene so the screenshot verifies the
// component path, not a parallel render. Deterministic fixtures: fixed trig,
// no randomness.
import { createRoot } from 'react-dom/client';
import { Stroke3DScene } from '../../src/app/components/canvas3d';
import type { StrokeInputPoint } from '../../src/app/lib/geometry3d/strokeTo3d';

// Open S-curve across the canvas, neutral pressure 0.5 (mouse default).
const sCurve: StrokeInputPoint[] = [];
for (let i = 0; i <= 200; i++) {
  const t = i / 200;
  sCurve.push([120 + 560 * t, 300 + 130 * Math.sin(t * Math.PI * 2), 0.5]);
}

// Same geometry with a pressure ramp 0 → 1 (skews the bulge toward the end).
const sCurveRamp: StrokeInputPoint[] = sCurve.map(([x, y], i) => [x, y, i / 200]);

// Short diagonal stroke — exercises the base-radius-vs-arc-length clamp.
const shortStroke: StrokeInputPoint[] = [];
for (let i = 0; i <= 40; i++) {
  shortStroke.push([330 + 3.5 * i, 120 + 1.5 * i, 0.5]);
}

// Closed circle (solid → filled disc) + two overshooting open half-arcs
// enclosing an empty middle (solid → annulus with a real hole).
const circle: StrokeInputPoint[] = [];
for (let i = 0; i < 120; i++) {
  const t = (i / 120) * Math.PI * 2;
  circle.push([220 + 110 * Math.cos(t), 300 + 110 * Math.sin(t), 0.5]);
}
const arcA: StrokeInputPoint[] = [];
const arcB: StrokeInputPoint[] = [];
for (let i = 0; i <= 80; i++) {
  const t1 = -0.2 + (i / 80) * (Math.PI + 0.4);
  arcA.push([560 + 130 * Math.cos(t1), 300 + 130 * Math.sin(t1), 0.5]);
  const t2 = Math.PI - 0.2 + (i / 80) * (Math.PI + 0.4);
  arcB.push([560 + 130 * Math.cos(t2), 300 + 130 * Math.sin(t2), 0.5]);
}

function Pane({ title, strokes, mode }: {
  title: string;
  strokes: StrokeInputPoint[][];
  mode: 'rod' | 'extrude' | 'inflate' | 'solid' | 'auto';
}) {
  return (
    <div className="pane">
      <h2>{title}</h2>
      <div className="scene">
        {/* DEFAULT ink on purpose — after the 2026-06-12 rig port the default
            warm-graphite material must read dimensional on its own; this
            harness verifies the REAL app look, not a lightened stand-in. */}
        <Stroke3DScene strokes={strokes} geometryMode={mode} />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <>
    <div className="row">
      <Pane title="rod (constant radius)" strokes={[sCurve, shortStroke]} mode="rod" />
      <Pane title="inflate (sine-eased capsule)" strokes={[sCurve, shortStroke]} mode="inflate" />
      <Pane title="inflate + pressure ramp 0→1" strokes={[sCurveRamp]} mode="inflate" />
    </div>
    <div className="row">
      <Pane title="solid: closed circle → disc · open arcs → annulus (hole)" strokes={[circle, arcA, arcB]} mode="solid" />
      <Pane title="same strokes, auto (extrude + rods) for contrast" strokes={[circle, arcA, arcB]} mode="auto" />
    </div>
  </>,
);
