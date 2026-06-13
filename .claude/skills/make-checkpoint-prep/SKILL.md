---
name: make-checkpoint-prep
description: Use when preparing a Figma Make checkpoint for Desk Doodles — assembling the clean Make-importable file list (what's in the drag-drop set vs repo-only), re-checking importability against Make's constraints, and writing the upload/routing prompt set (≤10 files per prompt). Triggers on "prep the Make checkpoint", "what files go to Make?", "Make importability check", "checkpoint #2/#3 prep", "build the upload prompt". This gates the REQUIRED live *.figma.site URL + Community working-file link for the submission.
---

# Make Checkpoint Prep

Assemble the clean, Make-importable file list, re-verify each file survives Figma Make's constraints, and produce the upload/routing prompt set. This is queue item **P1** in `docs/PENDING-AUTOFIRE-QUEUE.md` and gates the two REQUIRED submission deliverables: the published `*.figma.site` URL and the Community working-file link.

Per the local-canonical rule (`project_desk_doodles_local_is_canonical`): **local + GitHub is source of truth; Make is deployment only, never pushed back to GitHub.** This skill prepares the one-way local→Make drag-drop, it does not sync.

## What goes IN the drag-drop set vs repo-only

**IN (Make must receive):**
- Everything under `src/` that the running app imports.
- `index.html`, `package.json` (Make installs deps fresh from public npm — package.json MUST be in the drop set), `vite.config.ts`.
- `public/` assets the app references at runtime (e.g. `public/og-image.png`).

**REPO-ONLY — never in the drag-drop set:**
- `docs/` · `audit-runs/` · `tools/` · `test-fixtures/`
- `supabase/*.sql` (pasted into the Supabase dashboard, NOT Make)
- `.github/workflows/*` · `CLAUDE.md` · `SESSION-HANDOFF.md`
- `package-lock.json` (repo-only — Make installs from public npm, ignores the lock)

## Make's constraints — the importability filter (every file must clear these)

From `docs/knowledge/08-the-stack.md`:
- **Fresh install from public npm.** `node_modules` edits, patch-package, postinstall hooks DO NOT survive → any dependency fix must be ordinary runtime app code (e.g. `src/app/lib/patchRoughDots.ts`, the rough.js dots patch).
- **No monorepo / `workspace:*` deps.** Desk Doodles is a single flat package — no shared-lib imports from the portfolio repo.
- **Imports rewritten through esm.sh CDN.** Browser-pure packages work; Node-only/SSR packages don't. Everything in the stack is browser-pure (Rapier was rejected for the WASM cold-load race — `project_desk_doodles_no_rapier_in_make`; cannon-es is the locked physics engine).
- **`.env` files do NOT travel into Make.** `src/app/lib/supabase.ts` carries baked client-safe fallback URL/key so it works verbatim after drag-drop — that's deliberate, not a leak (publishable key, RLS gates everything). The line never to cross: secret keys (fal, Tripo) in client code — those live in Edge Function secrets only.
- **Supabase is the only blessed backend.**
- **≤10 files per upload prompt** → ~47 changed files ≈ 5+ prompts. One late checkpoint = high risk; do interim checkpoints, don't let the final one be the first upload of the real product.

## Procedure

1. **Compute the changed Make-relevant set since the last checkpoint.** Diff against the last checkpoint commit (checkpoint #1 was commit `e6c7889`, 34 files — verify the latest in `docs/design/submission-checklist.md`). Count: modified + new under `src/` + the three roots (`index.html`, `package.json`, `vite.config.ts`) + referenced `public/` assets. Exclude every repo-only path above.
   ```
   git -C <repo> diff --name-only <lastCheckpointCommit> HEAD -- src/ index.html package.json vite.config.ts public/
   git -C <repo> status --porcelain -- src/ index.html package.json vite.config.ts public/   # catch uncommitted/untracked
   ```
2. **Importability re-check — per file.** For each file in the set, confirm it clears the filter: no node-only imports, no `workspace:*`, no patch-package reliance, no `.env`-dependent runtime path without a baked fallback, no secret keys in client code. Flag any new npm dep Make must install (it must be in `package.json` in the drop set).
3. **Verify prerequisites** (submission-checklist §"Prerequisites before checkpoint"): the tree committed (Sebs go — a gate), the delete/persist RPC fix live (the right `schema-v3-rls.sql` actually pasted into Supabase), `tsc --noEmit` + `npm run build` clean, keepalive workflow committed.
4. **Group into ≤10-file upload prompts** in dependency-sane order (entry + config first: `package.json`, `index.html`, `vite.config.ts`, `src/main.tsx`, `src/app/App.tsx`, `routes.tsx`; then libs; then components; then pages/assets). Number the prompts.
5. **Write the upload/routing prompt** — for each batch, the file list + a one-line "what this batch is" + the routing note (which routes/features it lights up). Include the standalone notes: new deps Make installs · `supabase/*.sql` is pasted into the dashboard not Make · test on the PUBLISHED `*.figma.site` URL not preview · og:image absolute URL baked + share-preview tested · keepalive verified fired.

## Hard rules

- **Read-only assembly.** This skill produces a file list + prompts; it does NOT upload to Make (that's Sebs at the Make UI) and does NOT push to GitHub (Make is one-way deployment).
- **NO live Supabase writes.**
- **Conservative on deletes** — if unsure whether a file is in the import set, FLAG it for Sebs, don't drop it.
- **Commit only files you touch** (the prepared list/prompt doc) — never `git add -A`. Co-Authored-By line on the commit.
- **Blocked?** (canvas3d/shade-fill still settling, tree not committed, RPC fix unverified) → this is exactly P1's blocker; update its row in `docs/PENDING-AUTOFIRE-QUEUE.md` rather than forcing a premature file list.

## References
- `docs/design/submission-checklist.md` §"Make checkpoint #2" — the changed-file accounting, deps, prerequisites, friction math
- `docs/knowledge/08-the-stack.md` — the Make-survival constraint table + the "does it survive Figma Make?" filter
- `docs/PENDING-AUTOFIRE-QUEUE.md` — P1 (this work) + the collision map
- `src/app/lib/supabase.ts` / `patchRoughDots.ts` — the two Make-survival patterns (baked fallbacks · runtime patch)
