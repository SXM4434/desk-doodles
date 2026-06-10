# 20 — Research: Figma Make capabilities + constraints

**Status:** complete 2026-06-04. Sources: Figma Help Center, Figma Developer Docs, Supabase docs, Figma Forum, third-party Make developer writeups. NO fake provenance — every claim is sourced; unverified flagged "verify directly."

**TL;DR for Desk Doodles:**
- Make is Vite + React 18 + TS + Tailwind + shadcn by default. Adding deps via npm works.
- Supabase is the ONLY blessed backend. First-class integration.
- File uploads from local → Make are MANUAL (no bulk folder upload). Make → GitHub is auto push.
- AI credits enforced — ~50-70 prompts/month on Professional plan.
- @react-three/rapier WASM is the highest-risk dep — must smoke test Day 1.
- Local codebase mode (closed beta, Mac-only) would solve upload friction entirely if Sebs gets in.

---

## 1. Framework support

**Default stack confirmed:** Vite + React 18 + TypeScript + Tailwind + shadcn/ui. Figma's dev docs explicitly: "build with Vite and React 18." Make uses Vite bundler internally + esm.sh as CDN for imports.

**Swapping / adding deps — yes.** Three paths:
1. Mention package in a prompt; Make's agent installs it
2. Edit `package.json` directly in the code tab
3. On paid plans: publish private packages via Figma's private npm registry

**How imports resolve:** Make rewrites `import` statements to use `esm.sh` URLs automatically. esm.sh handles CommonJS + ESM; "most packages work."

**Known failure modes (not hard blocks):**
- Node-only / SSR packages don't work (Make is browser-rendered Vite preview — no SSR)
- Peer-dependency packages: must install peers yourself
- Patched packages (pnpm-patch, patch-package) silently dropped — patches don't survive
- Workspace deps (`workspace:*`, pnpm-workspace.yaml) don't resolve — Make installs fresh from npm

**Desk Doodles implication:** Single-package Vite app, no sub-libraries, no workspace deps, no patches.

---

## 2. Supabase integration

**First-class native integration — yes, only blessed backend.** Setup via prompt ("add Supabase auth") or file settings.

**Auth:** email/password, magic links, GitHub OAuth, Google OAuth. (Google OAuth callbacks have known buggy reports — watch for it.) Anonymous auth: not explicitly documented but should work via standard Supabase SDK.

**Database:** Postgres via Supabase. Make's default scaffold uses **key-value table pattern**, not full relational schema. For real schemas, drop into Supabase dashboard and run migrations directly.

**Storage:** Supabase Storage works out-of-box.

**Realtime + Edge Functions:** both supported.

**Free tier limits:**
- 500 MB database storage
- 1 GB total file storage; 50 MB max per file
- 50,000 MAU
- 5 GB DB egress / 10 GB storage bandwidth
- 200 concurrent realtime connections / 2M messages/mo
- 500K Edge Function invocations/mo
- 2 projects max
- **7-day inactivity → project auto-pauses** ← CRITICAL for hackathon, must keep alive

**Desk Doodles implication:** Plenty of free-tier room for the makeathon. Heartbeat ping every 5 days mandatory.

---

## 3. File structure conventions

**Entry point:** `App.tsx` at root.

**Hidden friction:** `.tsx` files cannot be created manually through Make's UI — you ask the AI to create them. That costs an AI prompt every time you scaffold a new file. **Tip: ask Make to create the full file structure in ONE big initial prompt (~100 credits) then edit those files directly without consuming more credits.**

**Required folders/files:**
- `guidelines/Guidelines.md` — markdown files Make's AI reads as system prompts
- `Attributions.md` — auto-generated (shadcn license); don't delete
- `package.json` — editable
- `.figma/make/` — config files for local-codebase mode (auto-created)

**Workspace / monorepo:** NOT supported. Strip `pnpm-workspace.yaml` before upload.

---

## 4. Skills system

**Format:** Single Markdown (`.md`) following the Agent Skills spec (same as Claude Code).

**Constraint vs Claude Code:** Make's custom skills do NOT support `scripts/`, `references/`, or `assets/` subdirectories. **Single-file skills only.** If we want to port Smart Hachure's drift-discipline as a Make skill, it must be one inlined `.md`.

**Discovery:** Skills become slash commands (e.g. `/smart-hachure-discipline`). Invoked explicitly in chat.

**Scope:** Account-scoped, not file-scoped.

---

## 5. Deploy + publish path

**Publish from inside Make** → public URL on `*.figma.site` (three random words). Updates are incremental.

**Custom domain:** Pro/Org/Enterprise. Was free through 2025 beta; 2026 pricing rolling out — verify.

**Hosted preview during dev:** live, re-renders on each prompt. Known issue: preview can lose state mid-iteration (reloads incrementally).

**Static export:** download project as `.zip` and run locally with Vite (some users report download failures).

**Hackathon submission format (FigBuild 2026 — likely matches the makeathon Sebs is entering):**
- Published `*.figma.site` URL
- Figma Slides deck embedding the Make file
- Demo video ≤ 5 min on YouTube/Vimeo
- **Solo entries NOT allowed in FigBuild 2026 — teams of 2-4 required.** Sebs must verify the specific makeathon he's entering.

**Iframe embedding:** NOT supported (CSP `frame-ancestors 'self'`). Desk Doodles cannot be embedded in Sebs's portfolio case-study page — link out only.

---

## 6. AI assistant + credits

**Credits model:**
- Professional plan: 3,000 credits/month ≈ 50-70 prompts
- Education plan: separate allowance
- Enterprise: ~3,000 credits ≈ 80-100 prompts

**Per-prompt cost ranges:**
- Simple ops (text/color edits): 10-30 credits
- Medium ops (single-screen layout): 50-150 credits
- Large ops (full-app gen, complex iterations): 200-340+ credits
- Initial app generation: 100+ credits
- Follow-up prompts: 25-45 credits typical

**Hard enforcement:** since March 18, 2026. Top-up: monthly subscription or PAYG (Org/Enterprise; Pro PAYG was scheduled May 2026 — verify status).

**Model selection per prompt:**
- Auto (balanced default)
- Claude Opus (best for complex; heavy credit burn)
- Gemini Flash (cheapest; cosmetic work)

**Free actions (zero credits):**
- Point-and-edit (visual edits via clicking; bypasses AI entirely)

**Best practices for Desk Doodles's tight credit budget:**
- Front-load detail in initial prompts (avoid 4 follow-ups for what one careful prompt achieves)
- Use point-and-edit for cosmetic work
- Gemini Flash for trivial styling tweaks
- Claude Opus ONLY for Supabase scaffolding (highest leverage moment)
- Start fresh files when conversation history balloons (history processed every prompt)

**Desk Doodles budget assumption:** Pro plan. 3,000 credits / 15 days = ~200 credits/day = ~3-5 prompts/day. **Realistically: use Make only for Supabase scaffold (Day 9) + final polish via point-and-edit (Days 11-14).**

---

## 7. Known limits / gotchas

**File-level:**
- Max 1 MB per text/code file when attached to a prompt
- Max 10 files per prompt
- 30+ file types as attachments (PDFs, images, code, docs)

**Code bloat:** Make generates verbose code. Simple apps ~3,000 lines; single edits can rewrite 1,600+ lines and TRUNCATE mid-generation, leaving broken builds. Don't trust large Make edits.

**Version history performance:** dies after ~200 iterations. Clone the file mid-hackathon if iteration crawls. Workaround.

**Browser memory:** 2 GB per browser tab (Figma-wide).

**Auth / DB / Storage:** Supabase free tier (see §2). Auto-pause after 7 idle days — MUST heartbeat.

**CSP / iframe:** Published Make site cannot be iframed. Has caused breaking-change incidents.

**Build / bundle size:** No published hard cap. For Three.js + Rapier + drei, initial-load cost is non-trivial. Verify by deploying.

**Preview vs published difference:** Animations, code layers, embeds render differently between in-Make preview and published. Test the published URL before deadline.

**HMR / state loss:** Preview reloads on every prompt, sometimes incrementally. Save often to Supabase if state matters.

---

## 8. Manual file upload mechanics — THE WORKFLOW QUESTION

**Direction:** Figma Make → GitHub is **one-way push only**. GitHub → Make is manual. **If you edit in GitHub and then push from Make, Make overwrites your GitHub state silently.**

**BUT — Local codebase mode (closed beta) changes everything.** Mac-only, requires Figma Beta desktop app. Make edits your local repo; you commit/push via git; changes round-trip with true two-way sync. **Upload friction = zero.**

### Workflow A: If Sebs gets local codebase beta access
- Edit Desk Doodles locally in IDE
- Make sees changes live via the `.figma/make/` config
- Continuous sync — no "upload events"
- Sebs can switch between local IDE and Make UI for the same project
- Best workflow by far

### Workflow B: If not (the manual paste-back path)
Three upload methods, all manual:

1. **Prompt Make to scaffold the file structure**, then copy-paste each file's contents into Make's code tab
2. **Attach files to a prompt** (max 10 files, ≤1 MB each)
3. **Use community tools** like `figma-make-local-runner` or the VS Code extension `figma make add` for zip ↔ local conversion

**For Desk Doodles under Workflow B: 3 upload checkpoints.**

| Checkpoint | When | What |
|---|---|---|
| **Day 4 evening** | After Phase 0 foundation done | Minimal stub Vite app with all 9 deps. ONLY to de-risk Rapier WASM loading. Throwaway file. |
| **Day 7** | After SVG mode + draw + upload work | SVG-mode-only checkpoint. Validate Make's component model expectations + package install behavior. Resolves any conformance issues early so Day 12 isn't a fire drill. |
| **Day 12** | After full app + Supabase + intelligence layer | Full app upload. Sebs lets Make's AI scaffold Supabase (highest-leverage credit spend). |
| **Day 14** | Final polish | UX polish via point-and-edit (zero credits). Final upload of any local changes. |

Note: each upload is hours of manual paste-back work under Workflow B. We've BATCHED the checkpoints to minimize this. Don't do incremental uploads — only at validated milestones.

### Workflow recommendation
**Sebs requests beta access on Day 1.** If granted: switch to Workflow A. If not: ride Workflow B with the 4 checkpoints above.

---

## 9. Dependency compatibility for Desk Doodles

| Package | Prognosis | Notes |
|---|---|---|
| `three` | ✅ High | Pure browser ESM. Figma plugin precedent exists. |
| `@react-three/fiber` | ✅ High | Standard R3F, Vite-friendly. |
| `@react-three/drei` | ✅ Likely | Same. Watch initial-load cost. |
| **`@react-three/rapier`** | ❌ INTERMITTENT IN MAKE (cold-load race) — UNSHIPPABLE 2026-06-05 | **Mechanism (refined):** cold-load race condition in Make's sandboxed Vite. Warm cache: `RAPIER.init()` resolves fast enough, useFrame doesn't touch uninit world, green. Cold load (fresh optimizeDeps): WASM fetch loses race, useFrame hits uninit world, throws `Cannot read properties of undefined (reading 'fg')`. Observed: same code alternated green↔red across reload cycles. **Not fixable from inside Make** — needs Vite `optimizeDeps.exclude` config OR top-level await entrypoint, neither available. Hackathon demo URL opened cold by judges = guaranteed first-impression failure. **Locked: Desk Doodles uses cannon-es (pure JS, no race).** See [memory project_desk_doodles_no_rapier_in_make]. |
| `rough.js` | ✅ VERIFIED 2026-06-05 | Loaded clean in Make smoke test. |
| `perfect-freehand` | ✅ VERIFIED 2026-06-05 | Loaded clean in Make smoke test. |
| `svgson` | ✅ VERIFIED 2026-06-05 | Loaded clean in Make smoke test. |
| `culori` | ✅ VERIFIED 2026-06-05 | Loaded clean in Make smoke test. |
| `@supabase/supabase-js` | ✅ VERIFIED 2026-06-05 (+ first-class Make scaffold) | Loaded clean. |
| `polygon-clipping` | ✅ VERIFIED 2026-06-05 | Loaded clean (smoke-test probe returned false due to typeof check error; actual import resolved fine). |
| `three` | ✅ VERIFIED 2026-06-05 | Loaded clean. |
| `@react-three/fiber` | ✅ VERIFIED 2026-06-05 | Canvas mounted, HMR worked. |
| `@react-three/drei` | ✅ VERIFIED 2026-06-05 | OrbitControls mounted clean. |

**Strategic implication (UPDATED 2026-06-05):** Smoke test done. 9 of 10 deps verified working in Make; Rapier confirmed broken. Desk Doodles physics layer = **cannon-es** (pure JS, no WASM). Cost = ~1 day re-architecting from declarative `<RigidBody>` JSX to imperative World/Body/step in `useFrame`. Cost is absorbed in Desk Doodles plan as the budgeted fallback path. No re-test needed unless Make announces WASM support.

---

## 10. Strategic recommendations

### What Desk Doodles does INSIDE Make
- Initial scaffold prompt (~100 credits, one-time, biggest leverage moment)
- Supabase scaffolding (Day 9 — let Make do auth + DB + storage setup)
- Final cosmetic polish via point-and-edit (Days 11-14, zero credits)
- Make-specific submission paperwork

### What Desk Doodles does OUTSIDE Make
- All Smart Hachure logic
- All 3D rendering (R3F + Free Stroke + physics + style port)
- Input handling
- ML object analysis
- Component logic, state management
- Tight algorithm iteration

### Critical Day 1 actions for Sebs
1. Request Figma Make local codebase mode beta access ([Help article](https://help.figma.com/hc/en-us/articles/40775535020695-Make-in-your-local-codebase))
2. Verify the specific makeathon's team-size rule (FigBuild 2026 requires teams of 2-4)
3. Rotate Tripo API key
4. Smoke test @react-three/rapier WASM in a throwaway Make file

### Day-of-submission checklist
- Published `*.figma.site` URL confirmed live
- Heartbeat ping fired (prevents 7-day auto-pause from killing demo mid-judging)
- Figma Slides deck created, embedding Make file
- Demo video ≤5 min uploaded to YouTube/Vimeo
- Submission paperwork filed
- Test on the PUBLISHED URL (not just preview) — they differ

---

## Sources (key URLs)

- [Help — Publish a Make file](https://help.figma.com/hc/en-us/articles/31304586129559-Publish-update-or-unpublish-a-functional-prototype-or-web-app)
- [Help — Push from Make to GitHub](https://help.figma.com/hc/en-us/articles/35463818346647-Push-from-Figma-Make-to-GitHub)
- [Help — Make in your local codebase](https://help.figma.com/hc/en-us/articles/40775535020695-Make-in-your-local-codebase)
- [Help — Add a backend (Supabase)](https://help.figma.com/hc/en-us/articles/32640822050199-Add-a-backend-to-a-functional-prototype-or-web-app)
- [Help — Custom skills for Make](https://help.figma.com/hc/en-us/articles/40283639496599-Custom-skills-for-Figma-Make)
- [Help — How AI credits work](https://help.figma.com/hc/en-us/articles/33459875669015-How-AI-credits-work)
- [Help — Best practices for AI credits](https://help.figma.com/hc/en-us/articles/40097793879191-Best-practices-for-optimizing-AI-credits-in-Figma-Make)
- [Figma Dev Docs — Use packages](https://developers.figma.com/docs/code/use-packages-and-third-party-libraries/)
- [Supabase Blog — Make support](https://supabase.com/blog/figma-make-support-for-supabase)
- [Supabase Pricing](https://supabase.com/pricing)
- [Supabase Storage limits](https://supabase.com/docs/guides/storage/uploads/file-limits)
- [FigBuild 2026 Rules](https://figbuild2026.devpost.com/rules)
- [Finch — Get your design system into Make](https://finchy.medium.com/how-to-get-your-design-system-into-figma-make-3ac735205e7f)
