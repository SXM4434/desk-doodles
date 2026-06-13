# Render-Survival Battery — run report (gap-hunt H4/H5/H7)

**Built + run 2026-06-13.** Closes the gap-hunt's H4 ("arbitrary / sanitized-hostile
SVG never driven through the 2D RENDER path"), measures H5 ("O(n²) sibling pass /
no element cap"), and verifies H7 ("`<use>`/`<symbol>` silently dropped"). Twin of
the security battery — but where security proves a payload does NOT *execute*, this
proves the sanitized/normalized output then *RENDERS* without crash / NaN / hang /
console error. Read-only on `src/`; adds tool files only.

## What it drives

42 fixtures × 4 representative styles = **168 cells**, each through the REAL render
path `normalizeSvgSize → SvgStyleTransform` (smartHachure ON for the rough family),
wrapped in the REAL providers, in real Chromium on an isolated `vite preview` dist
(no HMR churn — the active /desk + canvas3d edit zones are untouched).

Styles run by default (`DD_RSB_STYLES` overridable): `clean`, `rough-handdrawn`
(the smartHachure path), `wireframe`, `newsprint` (the filter/mask path).

Corpus = the two pre-existing `test-fixtures/*` (edge-case-torture + gradient-
sampler, the H4 "rows 1–2") + the two pre-written seeds (use-symbol, quadratic) +
35 generated static fixtures (`generate-fixtures.mjs`, families A–F) + 3
programmatic giants (10k-element, 500-`<g>`, 1000-subpath) generated in-memory.

## The contract (HARD-FAIL gates → exit 1)

A cell HARD-FAILS if any of: page-level uncaught throw · `normalizeSvgSize` threw ·
≥1 `pageerror` · ≥1 console error during the cell · ≥1 NaN/Infinity/undefined/null
in a rendered geometry attribute (`d`/`points`/`cx`/`transform`/…) · renderMs over
the per-cell budget (default 2500 ms — the hang gate). Visual `BLANK`/`FLOOD` are
recorded as findings but do NOT fail the run (they are symptoms to flag, not
contract violations).

## Result — 155 PASS / 13 HARD-FAIL (4 fixtures), every screenshot READ

### HARD-FAILS (flag to the hot-file owners — do NOT fix here)

1. **`nan-coords`** (all 4 styles) — a literal `NaN` inside a `d`-string
   (`M NaN 10 L 20 NaN L 40 40 Z`) survives **into the rendered DOM attribute**.
   Chromium logs `Error: <path> attribute d: Expected number` (1–4× per style) and
   the path silently drops; the valid sibling rect still renders.
   *Screenshot read:* `nan-coords__rough-handdrawn.png` — clean black square top-left
   (the sibling), NaN path invisible. **Flag:** the `d`-string parser/sampler in
   `SvgStyleTransform.tsx` does not sanitize non-finite tokens before they reach
   the DOM; the smart path passes the raw `d` through.

2. **`infinity-coords`** (all 4 styles) — coordinate `1e400` parses to `Infinity`;
   the wireframe path writes `M 10 10 L Infinity 50 L 90 90` into the rendered DOM
   (NAN-DOM flag), console errors every style, path drops.
   *Screenshot read:* `infinity-coords__wireframe.png` — the small valid rect renders
   as a correct hairline outline; the Infinity path is gone. **Flag:** same root as
   nan-coords — no finite-guard on coordinate tokens; the gap-hunt's worry that
   `getPointAtLength`/`samplePathForPenTip` could OOM on Infinity did NOT reproduce
   (the path drops before sampling), but Infinity reaching the DOM is still a defect.

3. **`negative-dims`** (all 4 styles) — `<rect width="-50" height="-50">` → browser
   console errors (`A negative value is not valid`). **The worst case is the rough/
   smart path:** the negative dims propagate into the geometry builder and produce a
   `M NaN NaN L NaN Na…` cascade (the console shows it). Yet it still rendered a dense
   black hatched square.
   *Screenshot read:* `negative-dims__rough-handdrawn.png` — a fully-inked dense
   black square (the rough builder absorbed the negatives into geometry); `__clean`,
   `__wireframe`, `__newsprint` render BLANK. **Flag:** negative dimensions are not
   clamped/normalized at the input boundary or in the rough geometry builder; the
   render is both inconsistent across styles AND NaN-polluted in the rough path.

4. **`gen-10000-element`** (rough-handdrawn) — 10,000 innocent sibling `<rect>`
   renders in **20–23 s** (9× over the 2.5 s budget) on the rough family. `clean`,
   `wireframe`, `newsprint` complete in 50–130 ms.
   *Screenshot read:* `gen-10000-element__rough-handdrawn.png` — a dense, complete
   field of 10k hand-drawn rects (it renders correctly, it just *hangs the tab* for
   20 s doing it). **Flag:** no element cap; see H5 below.

### H5 — the blowup, MEASURED (corrects the gap-hunt hypothesis)

The gap-hunt attributed the hang to `signals.ts:extractTopology`'s O(n²) sibling
pass. The element-count growth curve says the bottleneck is **elsewhere**:

| n siblings | clean renderMs | clean ms/el | rough renderMs | rough ms/el |
|---|---|---|---|---|
| 250 | 32 | 0.13 | 40 | 0.16 |
| 1000 | 30 | 0.030 | 266 | 0.27 |
| 4000 | 23 | 0.0058 | 3340 | 0.84 |
| 10000 | 49 | 0.0049 | 20125 | 2.01 |

- **clean path: flat** — the signals topology pass does NOT manifest as a quadratic
  bottleneck at these counts (~0.005 ms/element at 10k). The feared signals O(n²) is
  not the cost driver.
- **rough-handdrawn path: SUPERLINEAR** — per-element time climbs 0.16 → 2.01 ms
  (~12.6× time per 4× size). The blowup is the **per-element rough/smartHachure
  transform**, and it gets worse with size. **Flag:** an element cap (or a fast-path
  / batched transform) belongs on the rough/smart render path, NOT (only) on the
  signals walk. There is no cap anywhere today.

### Non-fatal findings (BLANK / under-render — flag, not gate)

- `single-point-path`, `single-point-polyline` — zero-length geometry renders blank
  (arguably correct, but silent — a one-point upload vanishes).
- `extreme-aspect` (10000×1 sliver) — `normalizeSvgSize` scales the 1px height to
  sub-pixel; renders completely blank. *Screenshot read:* `extreme-aspect__clean.png`
  — empty paper. A valid sliver upload disappears.
- `gradient-no-stops` — `fill="url(#empty)"` (zero-stop gradient) → nothing visible.
  *Screenshot read:* `gradient-no-stops__clean.png` — empty paper.
- `filter-on-renderable` (wireframe) — blank under the wireframe register.
- `use-symbol-unresolved` (H7) — the `<use>` instances render as **bare boxes**, the
  `<symbol>` content never resolved into the smart path. *Screenshot read:*
  `use-symbol-unresolved__clean.png` — two solid black boxes at the wrong scale,
  not the intended 16×16 icon. Confirms H7: a valid icon-system SVG renders as boxes.

### Confirmed PASS (proves the harness genuinely renders, not blank-everything)

- `gradient-sampler` (rough-handdrawn) — *screenshot read:* 6 swatches with correctly
  ORDERED hand-drawn hatch density (pale-sparse → dark-dense). The smartHachure path
  is genuinely engaged.
- `edge-case-torture`, `giant-10000px`, `micro-1px`, `self-intersecting-polygon`,
  `deep-nesting-500-g`, `1000-subpath`, `comment-bomb`, `prolog-garbage`, the
  sanitized-hostile family, etc. — all render without crash/NaN/hang.

## Keep-feeding

The driver emits `/tmp/dd-rsb/render-survival.fidelity2d.json` — a render-fidelity
feed (label = `render-crash` / `render-blank` / `render-survived`). This is the
NEGATIVE-example breakage curriculum the smart-layer dataset is otherwise blind to
(the 197 catalog never crashes). Ingested 2026-06-13:

```
node tools/dataset/feed-dataset.mjs --from-fidelity-2d /tmp/dd-rsb/render-survival.fidelity2d.json
# 1394 → 1562 examples; feeder honestly flags regime "unknown" (S11 mixed-regime guard)
```

## NOT done here (by design — hot files / deferred wiring)

- No edits to `SvgStyleTransform.tsx`, `smartHachure/*`, `classifier.ts`,
  `index.ts`, `canvas3d/*`, the draw panel. The battery catalogs + flags; the
  fixes belong to the owners of those files.
- The fixes the findings imply (finite-guard on `d`/coords, negative-dim clamp,
  element cap / fast-path on the rough render, `<use>` shadow-tree expand) are the
  flagged work, not this tool's job.
