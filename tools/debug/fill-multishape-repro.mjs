// fill-multishape-repro.mjs
// DETERMINISTIC repro of BUG A: fill region detection degrades/misses when the
// drawing has 2+ separated shapes.
//
// It imports the REAL production grid core (extractPoolRegions + its helpers,
// bundled from src/app/lib/geometry3d/strokeTo3d.ts via esbuild) — so the
// cell-size / raster / marching-squares / containment math is BYTE-EXACT.
// extractFillRegions + innermostPaperRegionAt are copied VERBATIM from
// src/app/components/DeskDoodles/DrawSurface.tsx (they are thin adapters; the
// load-bearing math is all in the bundled core).
//
//   extractFillRegions()  ->  extractPoolRegions()  ->  rasterizePoolLoops()
//     cell = max(spanX,spanY)/200   (spanX/Y = UNION bbox of ALL strokes)
//   -> marchingSquaresLoops -> containmentDepths -> map to viewBox
//   -> innermostPaperRegionAt()   (the fill-tap resolver; -1 = honest miss)
//
// PREP (run from repo root):
//   cat > /tmp/dd-entry.ts <<'EOF'
//   export { extractPoolRegions, pointInLoop, normalizeStrokePoints, poolCenter,
//     rdpPoints, WORLD_SCALE, VIEWBOX_W, VIEWBOX_H, SOLID_INK_RADIUS,
//     SOLID_MAX_GRID_RESOLUTION }
//     from '/ABS/.../src/app/lib/geometry3d/strokeTo3d.ts';
//   EOF
//   node_modules/.bin/esbuild /tmp/dd-entry.ts --bundle --format=esm \
//     --platform=node --outfile=/tmp/dd-bundle.mjs
//
// RUN:  node tools/debug/fill-multishape-repro.mjs

import {
  extractPoolRegions,
  pointInLoop,
  normalizeStrokePoints,
  poolCenter,
  rdpPoints,
  WORLD_SCALE,
  VIEWBOX_W,
  VIEWBOX_H,
  SOLID_INK_RADIUS,
  SOLID_MAX_GRID_RESOLUTION,
} from '/tmp/dd-bundle.mjs';

const RDP_EPSILON = 3.0; // strokeTo3d.ts:106
const GAP_MULT = 1.0;    // 1x gap ladder step (default shade gap)

// ── extractFillRegions — copied VERBATIM from DrawSurface.tsx:470 ─────────────
function extractFillRegions(strokes, gapMult) {
  const raw = strokes.map((s) => s.points).filter((s) => s.length > 0);
  if (raw.length === 0) return [];
  const viewBox = { w: VIEWBOX_W, h: VIEWBOX_H };
  const simplified = raw.map((s) => rdpPoints(s, RDP_EPSILON));
  const center = poolCenter(simplified, viewBox);
  const world = simplified.map((s) => normalizeStrokePoints(s, viewBox, WORLD_SCALE, center));
  const extraction = extractPoolRegions(world, {
    inkRadius: SOLID_INK_RADIUS * gapMult,
    closedFlags: world.map(() => false), // INK-ONLY TOPOLOGY (production setting)
    crisp: true,
    resolution: SOLID_MAX_GRID_RESOLUTION,
  });
  const toVb = ([wx, wy]) => [
    Math.round((wx / WORLD_SCALE + center.x) * 10) / 10,
    Math.round((center.y - wy / WORLD_SCALE) * 10) / 10,
  ];
  return extraction.regions.map((r) => ({
    outline: r.outline.map(toVb),
    depth: r.depth,
    role: r.role,
    parentIndex: r.parentIndex,
    areaWorld: r.areaWorld,
  }));
}

// ── innermostPaperRegionAt — copied VERBATIM from DrawSurface.tsx:632 ─────────
function innermostPaperRegionAt(x, y, regions) {
  let best = -1;
  for (let i = 0; i < regions.length; i++) {
    const r = regions[i];
    if (r.depth % 2 !== 1) continue;
    if (r.outline.length < 3 || !pointInLoop(x, y, r.outline)) continue;
    if (best < 0 || r.depth > regions[best].depth ||
       (r.depth === regions[best].depth && r.areaWorld < regions[best].areaWorld)) best = i;
  }
  return best;
}

// ── Test geometry: drawn ellipse OUTLINE as [x,y,pressure] (the live Stroke) ──
function circleStroke(id, cx, cy, rx, ry, n = 120) {
  const points = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    points.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a), 0.5]);
  }
  return { id, points };
}

function bboxOf(strokes) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of strokes) for (const [x, y] of s.points) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return { spanX: maxX - minX, spanY: maxY - minY };
}

function reportCase(label, strokes, taps) {
  const regions = extractFillRegions(strokes, GAP_MULT);
  const paper = regions.filter((r) => r.depth % 2 === 1);
  const ink = regions.filter((r) => r.depth % 2 === 0);
  const bb = bboxOf(strokes);
  const cellVb = Math.max(bb.spanX, bb.spanY) / SOLID_MAX_GRID_RESOLUTION;
  console.log(`\n=== ${label} ===`);
  console.log(`  union bbox: ${bb.spanX.toFixed(1)} x ${bb.spanY.toFixed(1)} vb-px -> cell ~= ${cellVb.toFixed(3)} vb-px (one ${SOLID_MAX_GRID_RESOLUTION}-grid spans the WHOLE union)`);
  console.log(`  regions: ${regions.length}  (paper/odd-depth=${paper.length}, ink/even-depth=${ink.length})`);
  let allInteriorHit = true;
  for (const [name, x, y] of taps) {
    const hit = innermostPaperRegionAt(x, y, regions);
    const ok = hit >= 0;
    if (name.startsWith('inside') && !ok) allInteriorHit = false;
    console.log(`    tap "${name}" @ (${x},${y}): ${ok ? `HIT region #${hit} (depth ${regions[hit].depth}, areaWorld ${regions[hit].areaWorld.toFixed(4)})` : 'MISS (-1)  <<< FILL DOES NOTHING'}`);
  }
  return { regions, paper, cellVb, allInteriorHit };
}

console.log('BUG A repro — fill region detection vs number/separation of shapes');
console.log('(REAL extractPoolRegions core; extractFillRegions + innermostPaperRegionAt verbatim from DrawSurface)');
console.log(`constants: SOLID_INK_RADIUS=${SOLID_INK_RADIUS} world, WORLD_SCALE=${WORLD_SCALE}, MAX_GRID=${SOLID_MAX_GRID_RESOLUTION}`);
console.log(`ink half-width in viewBox px @ gap ${GAP_MULT}: ${(SOLID_INK_RADIUS * GAP_MULT / WORLD_SCALE).toFixed(1)} px`);

const results = [];

results.push(['CASE 1 single', reportCase(
  'CASE 1 — ONE circle (rx120 ry100 @ 400,300)  [baseline, MUST work]',
  [circleStroke('c', 400, 300, 120, 100)],
  [['center', 400, 300]],
)]);

results.push(['CASE 2 spread', reportCase(
  'CASE 2 — TWO circles spread apart (@180,300 & @620,300, each rx120 ry100)',
  [circleStroke('L', 180, 300, 120, 100), circleStroke('R', 620, 300, 120, 100)],
  [['inside LEFT', 180, 300], ['inside RIGHT', 620, 300], ['gap between (want miss)', 400, 300]],
)]);

results.push(['CASE 3 moderate', reportCase(
  'CASE 3 — TWO circles moderate gap (@280,300 & @520,300, rx110 ry95)',
  [circleStroke('A', 280, 300, 110, 95), circleStroke('B', 520, 300, 110, 95)],
  [['inside A', 280, 300], ['inside B', 520, 300]],
)]);

results.push(['CASE 4 close', reportCase(
  'CASE 4 — TWO circles close (@330,300 & @470,300, rx110 ry95)  [control]',
  [circleStroke('C', 330, 300, 110, 95), circleStroke('D', 470, 300, 110, 95)],
  [['inside C', 330, 300], ['inside D', 470, 300]],
)]);

results.push(['CASE 5 diag', reportCase(
  'CASE 5 — TWO circles spread diagonally (@150,150 & @650,450, rx90 ry80)  [worst case]',
  [circleStroke('P', 150, 150, 90, 80), circleStroke('Q', 650, 450, 90, 80)],
  [['inside P', 150, 150], ['inside Q', 650, 450]],
)]);

// Sweep: TWO equal circles, widen the gap progressively, watch detection fail.
console.log('\n--- GAP SWEEP: two rx90/ry80 circles, increasing horizontal separation ---');
for (const gap of [200, 280, 360, 440, 520, 600]) {
  const lx = 400 - gap / 2, rx = 400 + gap / 2;
  const strokes = [circleStroke('L', lx, 300, 90, 80), circleStroke('R', rx, 300, 90, 80)];
  const regions = extractFillRegions(strokes, GAP_MULT);
  const paper = regions.filter((r) => r.depth % 2 === 1).length;
  const hitL = innermostPaperRegionAt(lx, 300, regions) >= 0;
  const hitR = innermostPaperRegionAt(rx, 300, regions) >= 0;
  const bb = bboxOf(strokes);
  const cellVb = Math.max(bb.spanX, bb.spanY) / SOLID_MAX_GRID_RESOLUTION;
  console.log(`  gap=${String(gap).padStart(3)}vb | union ${bb.spanX.toFixed(0)}x${bb.spanY.toFixed(0)} | cell=${cellVb.toFixed(2)}vb | ~${(160 / cellVb).toFixed(0)} cells across a circle | paper=${paper} | hitL=${hitL} hitR=${hitR}${hitL && hitR ? '' : '  <<< MISS'}`);
}

console.log('\n--- SUMMARY ---');
for (const [label, r] of results) {
  console.log(`  ${label.padEnd(16)} cell=${r.cellVb.toFixed(2)}vb | paper(odd) regions: ${r.paper.length} | all-interior-taps-hit: ${r.allInteriorHit}`);
}
