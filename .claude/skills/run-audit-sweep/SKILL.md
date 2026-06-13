---
name: run-audit-sweep
description: Use when running a Desk Doodles audit sweep — driving the /audit 197-shape catalog (or a representative sample) headless through a style/geometry-mode matrix, pixel-analyzing each render, building contact sheets, READING them back with vision, and flagging failures. Triggers on "run the audit sweep", "sweep all 197", "2D style sweep", "3D render sweep", "pixel-analyze the catalog", "contact sheets of /audit". The non-negotiable: every render claim is backed by a screenshot taken AND read back — never sample-and-claim.
---

# Run Audit Sweep

Drive the `/audit` catalog (ALL 197 shapes — 93 Trophy Wall PinShape + 104 Pegboard PegToolShape) across a style or geometry-mode matrix, pixel-analyze each render headless, assemble contact sheets, **read them back with vision**, and produce a per-item table that flags every failure. This is THE render + smart-layer dataset producer (`project_smart_layer_foundation_via_audit`): every "X breaks at value Y on shape Z" row is one labeled training example.

## The five non-negotiables (from BUILD-TEST-FLOW.md)

1. **VISUAL CHECK ALWAYS.** A render claim requires a screenshot taken AND read back with vision. Pixel-diff numbers and DOM counts lie. No "check X" until the contact sheets are read green.
2. **ALL 197.** When the task says all, run the full catalog and produce per-item rows. Never sample-and-claim — "checked all" after 6 is the lie caught 2026-06-08 (`feedback_no_sampled_verification_claims`).
3. **BREAK ON PURPOSE.** Push sliders to extremes, degenerate shapes, forced modes.
4. **DEBUG WITH REAL DATA FIRST.** If a render is wrong, instrument + observe before patching (`feedback_diagnose_with_real_data_first`).
5. **READ, don't trust the flag.** The auto-flags (EMPTY/BLOB/WALL/etc.) are a triage filter, not the verdict — the WALL flag itself exists because warm-graphite walls slipped past the dark-luma blob flag on sweep run 1. Eyeball the sheets.

## Which sweep to run

| Goal | Harness | Driver | Notes |
|---|---|---|---|
| 2D style coverage (197 × ~11 styles) | `tools/2d/*` audit-sweep harness | `tools/2d/*.mjs` | Pixel analysis + mosaics; reads `/audit` route directly |
| 3D render look (sample × 5 geometry modes) | `tools/3d/audit-sweep.html` | `tools/3d/audit-sweep.mjs` | Visual; samples representative shapes, renders through the REAL `Stroke3DScene`. **Do NOT run while canvas3d is HOT** (see collision rule). |
| 3D geometry correctness (ALL 197 × 5 modes, no pixels) | `tools/3d/catalog-geometry-sweep.html` | `tools/3d/catalog-geometry-sweep.mjs` | Headless geometry gates only — safe to run even while canvas3d is under edit (no render). |

When canvas3d render files are in the active-edit zone, the **visual** 3D sweep waits; the **headless geometry** sweep runs anyway because it doesn't render. (BUILD-TEST-FLOW collision rule.)

## Procedure

### 1. Start (or reuse) the dev server
The sweeps hit `localhost:5182` (vite `server.port`). For a sweep concurrent with other fleets, prefer an **isolated preview** to dodge HMR churn:

```
npm run build -- --outDir /tmp/ddsweep-dist
npx vite preview --outDir /tmp/ddsweep-dist --port <uniqueport>   # then point the driver at it
```

Drivers honor a URL override env var (e.g. `SWEEP_URL`, `GAUNTLET_URL`) — check the top of the `.mjs` for the exact name.

### 2. Run the driver
```
node tools/3d/audit-sweep.mjs                 # dev server on :5182, or SWEEP_URL=... to override
node tools/3d/catalog-geometry-sweep.mjs      # headless geometry, ALL 197 × 5 modes
```
Playwright browsers are cached at `~/Library/Caches/ms-playwright` and the playwright module is borrowed from `portfolio/tools/lab-screenshots/node_modules/playwright` (see the require path at the top of each driver — verify it resolves before launching).

### 3. Read the outputs
Visual sweep writes under `/tmp/dd-3d-sweep/`:
- `shots/NNN-<shape>-<mode>.png` — per-render captures
- `sheets/sheet-N.png` — contact sheets (grid of shapes × modes)
- `results.json` — raw per-render records
- `sweep-table.md` — per-shape×mode table

Geometry sweep writes under `/tmp/dd-catalog-geom/` (`reports.json` = the per-shape dataset + a per-shape×mode markdown table).

**Read the contact sheets with the Read tool (vision)** — sheet by sheet. The auto-flags:
- `EMPTY` — ink coverage < 0.4% (nothing rendered)
- `BLOB` — dark pixels > 60% (flat-black read)
- `WALL` — ink coverage > 85% (form fills the camera, no edges)
- `NANS` — non-finite vertices in built geometry
- `CONSOLE` — console/page errors during render
- `FALLBACK` — informational only: forced mode degraded to rod (honest degenerate path — counted, NOT failed)

Geometry gates (a FAIL is a real engine bug): `NONFINITE`, `NONDET`, `MI-NONDET`, `ENGINE-ERR`, `EMPTY-NONVAC` (hard); `FALLBACK`, `NO-SAMPLE`, `ZERO-HOLE` (informational).

### 4. Produce the per-item table + flag failures
One row per item actually checked. Flagged cells get: shape id, mode/style, the flag, and the read-back observation (what the eye saw, not just the auto-flag). Distinguish real failures from honest-degenerate FALLBACK/ZERO-HOLE rows.

### 5. Archive if it caught a bug or documents a fix
Copy human-readable reports into `audit-runs/YYYY-MM-DD/report-<style>.md` (+ `.json` of raw per-cell hashes). **Do not delete old runs** — the catalog accumulates as the labeled dataset (`audit-runs/README.md`).

## Hard rules

- **NO live Supabase writes** — the sweep only reads `/audit`; never trigger publish/delete/insert.
- **Read back before claiming.** Pixel numbers are triage; the vision read is the verdict.
- **Commit only files you touch** (never `git add -A` — concurrent fleets share the tree). Reports go under `audit-runs/`; commit message ends with the Co-Authored-By line.
- If a blocker stops the run (canvas3d HOT, server won't start, playwright missing), record it in `docs/PENDING-AUTOFIRE-QUEUE.md` instead of forcing it.

## References
- `docs/BUILD-TEST-FLOW.md` — the five non-negotiables + tooling list
- `tools/3d/audit-sweep.mjs` / `catalog-geometry-sweep.mjs` — driver headers document flags + outputs
- `audit-runs/README.md` — run layout + "do not delete" rule
- `src/app/components/DeskDoodles/DeskDoodlesAudit.tsx` — the /audit route (197-shape grid)
