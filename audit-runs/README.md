## Audit runs — foundational dataset for the smart-layer build

Per `portfolio-system-lab/docs/labs/hero/cells/F3-smart-hachure-system/makeathon-plan.md §8.6` (Manual-toggle smart-layer foundation), each subdirectory here is a snapshot of the `/audit` route + sweep harness run on a given date / style. Every "X breaks at slider value Y on shape Z" entry in a report is one labeled training example for the future smart-layer / ML classifier.

**Do not delete.** The catalog accumulates; old runs document the system's state at a moment in time and inform what's regressed vs improved.

### Layout

- `YYYY-MM-DD/report-<style>.md` — human-readable per-modifier matrix + failure summary
- `YYYY-MM-DD/report-<style>.json` — raw per-cell hashes (one row per shape × modifier × value)

### Producing a new run

The sweep harness lives at `/tmp/dd-audit-sweep.js` (uncommitted, drives the running dev server). Invoke with `node /tmp/dd-audit-sweep.js <style-id>`; default style = `rough-handdrawn`. Output lands in `/tmp/dd-audit/`. Copy reports here when they catch a new bug or document a fix.

### Cross-references

- Makeathon plan §8.6 — smart-layer foundation framing
- `07-architecture-ml-pipeline.md` "Per-shape breakage catalog" section
- Memory: `project_smart_layer_foundation_via_audit`
