// Child-process worker for the geometry gauntlet — builds ONE geometry from a
// serialized stroke pool under a capped heap, so OOM-prone pathological inputs
// (e.g. Infinity coords that make resampleWorldPolyline loop unboundedly) fail
// in isolation instead of killing the parent gauntlet. Repo tool only.
//
//   node --max-old-space-size=512 _gauntlet-build-worker.mjs '<json>'
//   json = { mode: 'rod'|'extrude'|'inflate'|'solid'|'auto', strokes: [[[x,y,p],…],…] }
//
// Prints a single JSON line to stdout: { ok, kind, vertexCount, nonFinite } or
// exits non-zero (the parent reads exit code + stderr for OOM/crash).

const st = await import(new URL('../../src/app/lib/geometry3d/strokeTo3d.ts', import.meta.url));
const { buildStrokeGeometry, buildPoolSolidGeometry } = st;

const payload = JSON.parse(process.argv[2]);
// JSON.stringify turns Infinity/NaN into null — restore from string sentinels.
function revive(v) {
  if (v === '__INF__') return Infinity;
  if (v === '__NINF__') return -Infinity;
  if (v === '__NAN__') return NaN;
  return v;
}
const strokes = payload.strokes.map((s) => s.map((pt) => pt.map(revive)));
const mode = payload.mode;

const build =
  mode === 'solid'
    ? buildPoolSolidGeometry(strokes, {})
    : buildStrokeGeometry(strokes[0] ?? [], { mode });

const pos = build.geometry.getAttribute('position');
let nonFinite = 0;
const arr = pos ? pos.array : [];
for (let i = 0; i < arr.length; i++) if (!Number.isFinite(arr[i])) nonFinite++;

process.stdout.write(
  JSON.stringify({ ok: true, kind: build.kind, vertexCount: pos ? pos.count : 0, nonFinite }),
);
