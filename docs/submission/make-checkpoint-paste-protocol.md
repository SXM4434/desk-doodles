# Make Checkpoint Paste Protocol — Checkpoint #2 (no-duplication edition)

**Date:** 2026-06-13 (Day 12). **Deadline:** 2026-06-18 11:59 PM PDT. **Scope:** the definitive, actionable step-by-step for re-pasting Desk Doodles into the EXISTING Figma Make project (which already holds checkpoint #1) **without Make duplicating files** (`Home_1` / `HomeNew` / parallel routes). Pairs with the `make-checkpoint-prep` skill (which assembles *what* goes; this doc is *how* to paste it safely) and `feedback_make_checkpoint_workflow`.

**The one-line answer:** YES, the `Home_1` duplication is preventable. The cause is documented (Make's AI-chat paste is non-deterministic). The cure is to **stop routing file CONTENT through the AI chat** — create the file tree via AI prompts (stubs only, paths only), then **paste each file's contents directly into the code editor, which modifies in place and never duplicates.** Details below.

---

## 1. Why duplication happens (root cause — sourced, not guessed)

Figma's own developer doc on importing existing code is explicit that the AI-chat path is **non-deterministic**:

> "Because it's a non-deterministic system, one of two things will likely happen: Figma Make will create two new files... The files may be at the same level as `App.tsx`, or added to a new or existing directory... Figma Make will combine the code and put it all into `App.tsx`."
> — [Figma Dev Docs — Iterate your code with AI](https://developers.figma.com/docs/code/iterate-your-code-with-ai)

So when you paste a `Home` page into the chat of a project that **already has** a `Home`, the AI may: (a) create a second file at a new path, (b) suffix it (`Home_1`), (c) reroute to the new one, or (d) merge everything into `App.tsx`. **This is the exact `Home_1` failure mode Sebs is worried about, and it is inherent to the AI-chat-paste path — no prompt phrasing makes the chat path deterministic.** Figma's doc presents three import "approaches" and does **not** claim any of them prevents duplication when files already exist.

**The corollary that saves us:** the manual code-editor path is a *different* mechanism. Figma's help doc:

> "In the code editor, you can make changes directly to files that exist in the file explorer."
> — [Figma Help — Edit the code of a functional prototype or web app](https://help.figma.com/hc/en-us/articles/33649966245783-Edit-the-code-of-a-functional-prototype-or-web-app)

Editing/pasting **into an already-open file in the editor modifies that file in place** (Make records a checkpoint, not a new file). No AI, no path-guessing, no duplication. That is the spine of this protocol.

**One hard constraint to respect:** *"You can't create or delete files in the file explorer. If you want to add new files... prompt Figma Make in the AI chat."* (same help doc). So **new files (the whole post-checkpoint-#1 social spine) MUST be born through the AI** — but we make the AI create them **empty, by exact path** (content carries zero duplication risk because there's no content for it to misplace), then fill them in the editor.

---

## 2. The protocol in one sentence

**AI creates the tree (stubs, exact paths, one batch). You fill every file's contents by hand in the code editor (in place). You verify the tree after each batch. Content never travels through the chat.**

This collapses the duplication surface to a single, controllable moment (stub creation), and that moment carries no content for the AI to fork.

---

## 3. Pre-flight (do these BEFORE opening Make)

1. **Run the `make-checkpoint-prep` skill** to get the authoritative changed-file list + batch grouping. As of the 2026-06-11 audit that's **~46–47 Make-relevant files** (checkpoint #1 = commit `e6c7889`, 34 files). Confirm the latest count from `docs/design/submission-checklist.md` §"Make checkpoint #2".
2. **Build must be green locally:** `npm run typecheck` (or `tsc --noEmit`) + `npm run build` clean. Never paste a tree that doesn't build locally — debugging a broken build inside Make burns credits and time.
3. **Have the file list split into two buckets:**
   - **OVERWRITE bucket** — files that already exist in checkpoint #1 and only changed (e.g. `App.tsx`, `routes.tsx`, `package.json`, `SvgStyleTransform.tsx`, `index.html`). These are *edit-in-place*, no AI needed at all.
   - **NEW bucket** — files that did not exist at checkpoint #1 (the whole social spine: `DeskPage`, `DeskGallery`, `DrawPanel`, `DrawSurface`, `ObjectCard`, `ObjectSurface`, `publish.ts`, `supabase.ts`, `session.ts`, `svgUpload.ts`, `deskNames.ts`, `deskCraft.ts`, `patchRoughDots.ts`, `chromeStyles.ts`, `CollapsiblePanel.tsx`, `canvas3d/*`, `geometry3d/*`, etc.). These need the AI to mint empty stubs first.
   - To generate the buckets mechanically:
     ```
     # NEW (added since checkpoint #1):
     git -C ~/Desktop/Projects/desk-doodles diff --name-status --diff-filter=A e6c7889 HEAD -- src/ index.html package.json vite.config.ts public/
     # OVERWRITE (modified since checkpoint #1):
     git -C ~/Desktop/Projects/desk-doodles diff --name-status --diff-filter=M e6c7889 HEAD -- src/ index.html package.json vite.config.ts public/
     # plus uncommitted — catch stragglers:
     git -C ~/Desktop/Projects/desk-doodles status --porcelain -- src/ index.html package.json vite.config.ts public/
     ```
4. **Exclude the repo-only set** (per the skill): `docs/` · `audit-runs/` · `tools/` · `test-fixtures/` · `supabase/*.sql` (pasted into the Supabase dashboard, NOT Make) · `.github/workflows/*` · `CLAUDE.md` · `SESSION-HANDOFF.md` · `package-lock.json`.
5. **Open the Make project's file explorer side-by-side with your local repo tree** so you can eyeball-match paths.

---

## 4. The exact sequence

### Step A — package.json + new deps FIRST (so installs resolve)
`package.json` is in the OVERWRITE bucket. Open it in Make's code editor and **paste the new contents over the old in place**. Checkpoint #2 adds `dompurify@^3.4.9` + `@types/dompurify@^3.0.5` — Make installs from public npm off the updated `package.json`. Do this first so every later file that imports a new dep resolves. (If Make doesn't auto-install on save, prompt: *"Install dependencies from package.json"* — that's an install action, not a file edit, so no duplication risk.)

### Step B — mint ALL new files as EMPTY stubs, by exact path (the only AI step that touches structure)
Send **one** AI prompt per batch of ≤10 new files. The prompt creates **empty files at exact paths** — no content, so nothing to fork. Use the verbatim block in §5 (the "STUB-CREATE" block).

After each stub batch, **verify the tree** (§6) before the next batch.

### Step C — fill every file's contents in the code editor, in place
For **both** the new stubs (from Step B) and the OVERWRITE files (already in the project): open each file in Make's code editor, select-all, paste the real contents over it. **This is a manual editor edit — it modifies the file in place, no AI, zero duplication.** Save (Cmd/Ctrl+S formats). Repeat per file.

> This is the heart of the no-dup guarantee: **content never goes through the chat.** The chat only ever saw empty stubs.

### Step D — per-batch tree verification (§6) after every batch of fills.

### Step E — last: entry + routing sanity
After all files are filled, open `App.tsx` / `src/main.tsx` / `src/app/routes.tsx` in the editor and confirm they are the canonical versions (routes `/` `/desk` `/desks` `/canvas` `/audit` `/playground`, no `Home_1`/`HomeNew` imports, no orphaned routes). If anything is off, fix it **in the editor**, not via a chat regen.

### Step F — build + publish + verify on the PUBLISHED URL
Let Make build. Fix build errors **in the code editor** where possible (cheaper, no duplication). Publish → test on the live `*.figma.site` URL (preview ≠ published — animations/embeds differ). Confirm `/desk` social flow, draw→style→place, realtime, and the keepalive are live.

---

## 5. Verbatim prompt blocks

### 5a. STUB-CREATE block (use ONCE PER BATCH of new files — Step B)
Paste this into Make's AI chat, with the batch's exact paths filled into the list:

> Create the following files as **EMPTY** files at these EXACT paths. Create any folder that doesn't exist. Do **NOT** add any code, boilerplate, imports, or placeholder content — the files must be empty; I will paste contents myself in the code editor.
>
> If a file ALREADY exists at one of these exact paths, **leave it untouched and skip it** — do NOT create a second copy, do NOT rename, do NOT append a suffix (no `_1` / `New` / `Copy`), do NOT fork a parallel version, do NOT change its import path. The path stays identical.
>
> Do NOT modify `App.tsx`, `routes.tsx`, or any routing/import file. Do NOT create alternate versions of any existing screen, page, or component. Do NOT reroute the app. Only create the empty files listed.
>
> Paths:
> - `src/app/components/DeskDoodles/DeskPage.tsx`
> - `src/app/components/DeskDoodles/DrawPanel.tsx`
> - ...(≤10 per batch)...

### 5b. OVERWRITE guard block (only if you are FORCED to use the chat for an existing file — avoid if possible)
Prefer Step C (paste in the editor). Use this **only** if a file is too large to paste in the editor or Make refuses the manual paste. It is the weaker path; verify the tree immediately after.

> Match the file `src/app/.../<EXACT PATH>` by its EXACT path and **overwrite its CONTENTS in place** with the content I provide. Do **NOT** create a new file, do **NOT** rename, do **NOT** append a suffix (no `_1` / `New` / `Copy`), do **NOT** fork a parallel component or route. The path stays identical; only the contents change. Do not change any import paths and do not create alternate versions of any existing screen or component. After applying, the file count must be unchanged.
>
> [paste the file contents]

### 5c. RECOVERY block (if Make duplicated anyway — §7)
> You created a duplicate. Delete the file at `<DUPLICATE PATH>` (e.g. the `_1`/`New` copy) and restore all routing/imports to point only at the original `<CANONICAL PATH>`. Do not create any new files. After this, there must be exactly one file at `<CANONICAL PATH>` and zero files matching `*_1`, `*New`, or `*Copy` for this component.

---

## 6. Per-batch tree verification (do this after EVERY batch — non-negotiable)

A single duplicated `Home`/`DeskPage` compounds across later batches (later files import the wrong one), so catch it immediately:

1. **Scan the file explorer** for siblings with `_1`, `_2`, `New`, `Copy`, or near-identical names next to a real file. Any hit = stop, run the recovery block (§5c) before continuing.
2. **Open `App.tsx` + `routes.tsx`** and confirm every import/route points at the canonical path — no `import Home from './Home_1'`, no duplicate route entries, no parallel screen wired as the new default.
3. **Confirm the file count** moved by exactly the number of files in the batch (new stubs) or stayed flat (overwrites). A jump of +2 when you added 1 = a duplicate.
4. **Spot-check one filled file renders** in preview before moving on (catches a stub that got content in the wrong place).

Only when the tree is clean do you send the next batch.

---

## 7. Recovery — if Make duplicates despite this

1. **Don't paste more.** Stop the current batch; a duplicate compounds.
2. **Identify the canonical vs the copy** — the original keeps the exact path other files import; the copy carries the suffix.
3. **Fix in the code editor first** if you can: re-point any stray import/route back to the canonical path manually (in-place edit, no AI). The file explorer can't delete files, so for the *deletion* you must use the chat — send the **RECOVERY block (§5c)** naming the duplicate path explicitly.
4. **Re-verify the tree** (§6) before resuming.
5. **Worst case — version history revert:** Make checkpoints every change; revert to the pre-batch checkpoint and redo that batch with the stub-first path. (Note: version history degrades after ~200 iterations — if iteration is crawling, that's a separate symptom, clone the file.)

---

## 8. Batch ordering (dependency-sane, ≤10 files/batch)

Same order as the skill, adapted to the stub-first flow. Roughly 5 batches for ~47 files.

| Batch | Files | Why this order |
|---|---|---|
| **0 (overwrite, no AI)** | `package.json` → save/install | Deps resolve before any importing file lands |
| **1 (overwrite, no AI)** | `index.html`, `vite.config.ts`, `src/main.tsx`, `src/app/App.tsx`, `src/app/routes.tsx` | Entry + config + routing — the files most prone to `_1` if sent via chat; doing them **in the editor** is the single biggest dup-risk reduction |
| **2 (new stubs → fill)** | `lib/` leaf utilities: `supabase.ts`, `session.ts`, `svgUpload.ts`, `deskNames.ts`, `deskCraft.ts`, `contentHash.ts`, `normalizeInput.ts`, `publish.ts`, `chromeStyles.ts`, `patchRoughDots.ts` | No intra-component deps; safe early |
| **3 (new stubs → fill)** | shared chrome + canvas3d/geometry3d: `CollapsiblePanel.tsx`, `canvas3d/*`, `geometry3d/*`, `smart/conversionMap.ts` | Imported by pages |
| **4 (new stubs → fill)** | desk pages + surfaces: `DeskPage.tsx`, `DeskGallery.tsx`, `DrawPanel.tsx`, `DrawSurface.tsx`, `ObjectCard.tsx`, `ObjectSurface.tsx` | Top of the import tree — land last |
| **5 (overwrite, no AI)** | remaining modified engine files (`SvgStyleTransform.tsx`, `smartHachure/*`, chrome specs), `public/og-image.png` | In-place edits; render-heavy, verify in preview |

(Exact membership comes from the `make-checkpoint-prep` skill's computed list — this is the shape, not the literal final manifest.)

---

## 9. Standalone notes (carry these, they're not file-paste but they gate the checkpoint)

- **`supabase/*.sql` is pasted into the Supabase dashboard SQL editor, NOT Make.** Make connects to the *same* Supabase project (don't let Make's "add Supabase" create a second project — point its integration at the existing `desk-doodles` project).
- **`.env` does not travel into Make.** `supabase.ts` carries baked client-safe fallbacks by design (publishable key, RLS gates everything) — that's why it works verbatim after paste. Never put secret keys (fal, Tripo) in client code.
- **Test on the PUBLISHED `*.figma.site` URL, not the in-Make preview** — they render differently (animations/embeds/state).
- **og:image must be an absolute URL** with the final `*.figma.site` origin baked in, and `/public/og-image.png` (1200×630) must exist before submission.
- **Keepalive:** confirm the GitHub Action fired (Supabase auto-pauses after 7 idle days → dead demo at judging).

---

## 10. The future escape hatch (NOT for checkpoint #2 — context only)

Figma shipped a **GitHub/local-codebase integration** that imports an existing repo and edits the running app directly, eliminating manual paste entirely:

- [Figma Help — Make in your local codebase](https://help.figma.com/hc/en-us/articles/40775535020695-Make-in-your-local-codebase) · [byteiota writeup](https://byteiota.com/figma-make-connects-to-your-codebase-what-developers-need-to-know/)

**Why we are NOT using it for this checkpoint:**
- **Mac-only, closed beta, waitlist** (`figma.com/join-waitlist-make`) — "joining the waitlist doesn't guarantee access." Not a deadline-safe dependency.
- **Sync is one-directional (Make → GitHub push)**, and per our **local-canonical rule** (`project_desk_doodles_local_is_canonical`) Make is deployment-only and must never push back to our GitHub. The repo-import flow inverts that and risks Make overwriting our canonical repo. Off-limits during the makeathon.
- If Sebs has beta access AND wants to revisit the workflow **post-makeathon**, this is the clean long-term answer. For 06-18, the manual stub-first + editor-paste protocol above is the safe one.

---

## 11. Why this protocol is the safest defensive path (honesty note)

- Figma's docs **confirm** the AI-chat paste is non-deterministic and **do not document** any prompt phrasing that forces in-place updates on existing files. So a "magic prompt" that makes the chat path safe **does not exist** — and any doc claiming one would be inventing provenance.
- What the docs **do** confirm: (a) the code editor edits existing files in place, (b) new files must be born via the AI but can be created empty by path, (c) Make checkpoints every change (revert is always available).
- This protocol is built entirely on those three confirmed behaviors. It removes the duplication risk by **never sending content through the non-deterministic surface** — not by trusting a prompt to tame it.

---

**Sources:**
- [Figma Dev Docs — Iterate your code with AI](https://developers.figma.com/docs/code/iterate-your-code-with-ai) (the "non-deterministic system" quote + the three import approaches + empty-stub-first pattern)
- [Figma Help — Edit the code of a functional prototype or web app](https://help.figma.com/hc/en-us/articles/33649966245783-Edit-the-code-of-a-functional-prototype-or-web-app) (code editor edits files in place; can't create/delete in explorer — must prompt the AI; checkpoints)
- [Figma Help — Make in your local codebase](https://help.figma.com/hc/en-us/articles/40775535020695-Make-in-your-local-codebase) + [byteiota — Figma Make connects to your codebase](https://byteiota.com/figma-make-connects-to-your-codebase-what-developers-need-to-know/) (GitHub-import beta — Mac-only, waitlist, one-directional)
- Internal: `docs/knowledge/08-the-stack.md` (Make-survival constraints) · `docs/locked-refs/F3-smart-hachure-system/20-research-figma-make-capabilities.md` (≤10 files/prompt, manual upload, one-way push) · `docs/design/submission-checklist.md` §"Make checkpoint #2" (changed-file accounting) · `.claude/skills/make-checkpoint-prep/SKILL.md` (the file-list + batch assembly) · memory `feedback_make_checkpoint_workflow`
