# BIG-DADDY OFAT harness

Runs the **full user flow on the LIVE app** (`localhost:5182`): per catalog object,
per source, render the **Clean baseline** + **OFAT every toggle at LOW/MID/HIGH**
(hold all others at the baseline), in **2D and 3D**, plus **SVG-upload** and
**online-SVG** sources. One **vision-safe contact sheet** per object-source + a
per-panel **findings manifest** (status left blank for a later vision-read pass to
fill by comparing each panel to its Clean).

Read-only on `src/`. Writes only to `/tmp/bigdaddy/` and this folder. Uses
`/canvas` + `/audit` (never `/desk`). Idempotent per object-source. Deterministic
hand-wobble (seeded per object).

## Files
- `run-bigdaddy.mjs` — orchestrator (flags below).
- `bigdaddy-lib.mjs` — live-app drivers (catalog load · manual-draw via real
  tools · DONE-commit · dropdown/slider/section drivers · 3D seams · in-browser
  contact-sheet builder · change-hint signatures).
- `factors.mjs` — the OFAT factor matrix (every toggle → L/M/H).
- `feed-bigdaddy.mjs` — ingest a **labeled** manifest into
  `datasets/smart-layer.clean.jsonl` (regime `bigdaddy-current`), AFTER the vision
  pass fills `status`. Sibling to `tools/dataset/feed-live-ofat.mjs`.

## Run it
```bash
# one of 8 parallel shards (split the 197 by index % 8)
node tools/bigdaddy/run-bigdaddy.mjs --chunk 0/8
# ... 1/8 ... through 7/8 in parallel agents

# explicit object set (testing)
node tools/bigdaddy/run-bigdaddy.mjs --objects macbook,polaroid

# flags
--port 5182                 # dev server port
--out /tmp/bigdaddy         # output root
--sources 2d-draw,svg-upload,3d   # which sources (default these three)
--with-fixtures             # also run the online-svg corpus (test-fixtures/*.svg); run on ONE shard only
--force                     # re-do object-sources even if their contact sheet exists
```
Each shard writes `/tmp/bigdaddy/<object>/<source>/` (per-panel PNGs + `_contact.png`)
and `/tmp/bigdaddy/manifest-<chunk>.jsonl`.

## Coverage per object
| source | baseline + factors | panels |
|---|---|---|
| 2d-draw | Clean ref + Rough base + 20 2D factors ×3 | 62 |
| svg-upload | same | 62 |
| 3d | Clean(auto+Native) + 7 3D factors ×3 | 22 |
| online-svg (`--with-fixtures`) | per fixture: 62 (2D) + 22 (3D) | — |

Toggles × LMH covered: **2D = 20 factors × 3 = 60** per 2D source ·
**3D = 7 factors × 3 = 21** per 3D source. Drawing-tools (ink/snap/fill) are
just-verify-live (one `draw-tools` row per object, no Clean diff), per Sebs's law.

## Two behavioral findings baked into the harness (probed live 2026-06-14)
1. **Two-tier 2D baseline.** Under **Clean** the chrome exposes only 4 controls
   (SVG style, Stroke palette, Fill palette, Texture). The pen / multi-stroke /
   shading controls only **mount under a rough-family style**, so each factor is run
   on its required `baseStyle` (`factors.mjs`): `Clean` for style/palette/texture,
   `Rough hand-drawn` for everything else. The Clean screenshot is always captured
   as the comparison reference; a rough-baseline panel is captured too. Also:
   `expandSection`/`expandAll` skip `aria-haspopup` buttons — dropdown triggers
   carry `aria-expanded=false` and a naive match clicks them OPEN, jamming the next
   dropdown set.
2. **3D change-hint via Playwright screenshot, not canvas readback.** The WebGL
   canvas uses `preserveDrawingBuffer=false`, so an in-browser `drawImage(canvas)`
   readback returns a blank/identical buffer every mode. `canvasShotSig()` uses the
   Playwright `main canvas` screenshot bytes instead (verified distinct per
   geo/style/material/slider). 2D uses the richest render-SVG markup hash.

`pixelChangedVsClean` is a **cheap mechanical hint only** — the real label comes
from the vision-read pass; it never substitutes for it.

## After the vision pass
A later agent reads each `_contact.png` (paired-with-Clean, one image per
object-source — vision-safe, no 32MB overflow), fills `status` per manifest row
(`works`/`broken`/`partial`/`blocked`), then:
```bash
node tools/bigdaddy/feed-bigdaddy.mjs '/tmp/bigdaddy/manifest-*.jsonl' --append
```
ingests the labeled rows into `datasets/smart-layer.clean.jsonl` (regime
`bigdaddy-current`). Rows with blank status are skipped until labeled.

## GATE (per SESSION-HANDOFF 2026-06-14)
Big-daddy is meant to run on **FIXED code** after the broken-map bug-fixes AND the
drawing-tool features (Phases 1-3) land — it certifies the full flow through the
final tools. The harness is built and verified now; fire the full 197 sweep once
that gate is met.
