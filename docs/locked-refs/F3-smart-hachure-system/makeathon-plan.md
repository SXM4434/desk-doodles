# Desk Doodles — Makeathon Plan

**Status:** v1 lock 2026-06-04. **RE-BASELINED 2026-06-11** (see governing section below). Deadline 2026-06-18 11:59 PM PDT. Submission: Figma Make makeathon.

> **⚠️ LOCAL MAKEATHON COPY — RE-BASELINED.** This is the local Desk-Doodles working copy (`docs/locked-refs/...`), re-baselined 2026-06-11 against the as-built state. The portfolio source-of-truth copy is NOT updated by this pass — **portfolio re-mirror is post-makeathon** (after 2026-06-18). Edit here during the build; reconcile back to portfolio later.

This doc is the executable plan. Locked decisions live here. Open questions are flagged with `?`. **The RE-BASELINE 2026-06-11 section immediately below is the GOVERNING current plan** — the original §1–§9 are preserved as locked history (constraints, risk register, architecture decisions all still hold), but where the day grid in §4/§8.3 conflicts with the re-baseline, the re-baseline wins.

---

## RE-BASELINE 2026-06-11 (GOVERNING — read this first)

**Today:** 2026-06-11. **Deadline:** 2026-06-18 11:59 PM PDT. **Runway:** ~7 days.

This section supersedes the original day grid (§4) and the stale critical-dates block (§8.3, which still falsely claimed 06-11 = "end of Phase 3 / 3D done" — **3D has zero code**). The constraints (§1), the split (§6), the risk register (§5), and §8.6 Smart Rendering System framing all still hold and are not re-litigated here.

### A. What is DONE (as-built, verified)

The foundation + the 2D engine + the desk social spine are real and live. Specifically:

- **The desk flow is the real product and it persists.** `/desk` is fully wired to Supabase — loads the shared feed on mount, every Done auto-publishes (optimistic add + row-id attach), drag-end persists position (session-scoped), other sessions' doodles arrive live via realtime, header shows ●Live/○Connecting/○Offline status. `/desk` is the primary CTA from home + `/public`. Round-trip VERIFIED against the live DB (insert/update/select/delete). Pan/zoom in scope (~25%–400%). Add-doodle popup (`DrawPanel`) has the full input trio (Draw · Upload SVG · Upload image-stub).
- **Smart Hachure engine + `/audit`.** The 6-axis shading sub-system runs across 197 catalog shapes; `/audit` is both the regression surface and the smart-layer training dataset (`project_smart_layer_foundation_via_audit`). Golden baseline **v2 BLESSED** (`audit-runs/golden-labels.v2.json`) is the regression anchor.
- **Gap-sweep critical fixes landed** (06-11): demo-blocking nav fixed (judges reach `/desk`), `index.html` retitled "Desk Doodles" + OG/Twitter meta, **stored-XSS hole closed** (`sanitizeSvgMarkup` DOMPurify on read), `dompurify@^3` added (Make-safe pure-JS).
- **Classifier recall-hole FIXED with receipts** — root-tonal rules 0.55→0.70; golden-diff shows 140 flips across 67 shapes, ALL source-darkness 1.00 (pure-black details that were silently rendering as empty outlines now get hachure); visual A/B confirms light regions unchanged. Sebs blessed → v2 golden.
- **Dots determinism shipped** — runtime rough.js prototype patch (`lib/patchRoughDots.ts`, Make-safe), seeded jitter. dotScatter (stipple) + dotPattern (newsprint) made real.
- **Knowledge base + research docs** — `docs/knowledge/` (00-INDEX + 10 pages) complete; `21-research-3d-pipeline-and-style-translation.md` v1.2 (822 lines, 55 citations, all 17 asks); simplification (22), Suzanne brief (23), classifier (24) research docs on disk; **`docs/design/object-model-and-desk-architecture.md`** (the multi-desk social architecture this re-baseline sequences against).
- **Supabase wired** — project `desk-doodles` live; `supabase.ts` client with Make-safe baked fallbacks; `schema.sql` pasted ("Success"); fal.ai key staged in `.env.local` (no credits yet — fine until 3D-hard).
- **Chrome/system scaffold** — `lib/chromeStyles.ts` (PILL/CTA/SECTION_LABEL) + shared `CollapsiblePanel` + per-cluster collapse in `SmartHachureChrome`; pill-everywhere conformance done. (This is the WORKING SCAFFOLD only — see decision §C-2.)

### B. What REMAINS (the ~7-day build)

Three big things, all in scope per the §C-1 decision (build all three, not one spine):

1. **The multi-desk social system** — grow the object from blob → rich record, then the views: object surface (Sandbox-first), object card + naming-as-label, multi-desk caps/gallery/names, optional identity handle, desk craft surface. Per the build order in `docs/design/object-model-and-desk-architecture.md`.
2. **The 3D round-trip (the wedge)** — M6/M7/M8. Easy path first (Free Stroke Rod/Extrude + bi-directional flip + SVG-style→3D port), then the character-preserving hard path (vision-LLM router → Tripo / TRELLIS-via-fal). "The user's hand survives the round-trip" — the unoccupied competitive pole.
3. **The demo video (M13)** — biggest single scoring factor for the $50k Grand. Not started.

Plus two infra gates that don't exist yet:

- **Heartbeat M10** — Supabase auto-pause guard (5-day cron Edge Function). Doesn't exist → live-demo-dead risk at judging if forgotten (R4).
- **Own design + motion language** (M11) — the Day 12-13 pass where Desk Doodles diverges from the portfolio scaffold into its own voice (§C-2).

### C. Decisions LOCKED 2026-06-11 (Sebs)

1. **Build ALL THREE great things, not one spine.** Earlier framing asked "demo spine = wedge (hand→3D) vs social desk." **Resolved: do both + the video.** The wedge 3D round-trip, the social desk system, AND the demo video are all in scope. Sequence them (§D), don't pick one.
2. **Desk Doodles earns its OWN design + motion language at the Day 12-13 pass** — NOT a portfolio reskin (`project_desk_doodles_own_design_language`). The portfolio tokens (W1/W1-D, ISe ladder, locked spacing, pill chrome) are the WORKING SCAFFOLD used to move fast during the build. The M11 pass is where Desk Doodles diverges into its own color personality / type voice / motion character / card-desk-drawer craft — rooted in Sebs's taste so it still reads as him, but a distinct voice. This **supersedes** the CLAUDE.md / §2.x "don't invent a new design system mid-makeathon" line (that was a speed constraint = don't stop mid-build to systematize, NOT a mandate to ship portfolio-flat).
3. **Keep session-UUID identity for the demo.** Identity stays the client-minted localStorage UUID (`session.ts`) through submission. The anon-auth swap (`signInAnonymously()` → real RLS + free real-account upgrade later) is **post-makeathon** — it carries a migration either way, and the demo doesn't need it. (The design doc's "swap now" recommendation is acknowledged but deferred by this decision.)
4. **Object cap = 50 per public desk.** The research-backed Lighthouse-headroom default (50 × 20–80 DOM nodes stays under the ~800-node warn line). Drives the auto-spawn-at-cap → desk N+1 transaction.
5. **Sandbox before Edit.** The object surface ships **Sandbox mode first** (re-renders someone else's markup through viewer config, writes nothing — lowest risk, exactly the S12 mechanism). Edit-after-place comes second and needs source-stroke retention (a real slice — strokes are currently discarded at Done), which is **post-makeathon** unless time remains.

### D. Day-by-day — 06-11 through 06-18 (THE current grid)

One coherent sequence. Build-full default per `feedback_build_full_dont_self_stop_at_mvp` — the per-day list is the floor; push into the next block if a day finishes early. Sebs calls time.

**Day 06-11 (today) — Record + Sandbox + commit + heartbeat scaffold**
- **Grow the record** (design doc build-order #1): add the config snapshot (style + modifier values) + `name` / `why` columns to the object; keep blob rendering working. This is the data shape S12/S13 + every view below already require.
- **Object surface, Sandbox mode FIRST** (#2, decision §C-5): evolve `DrawPanel` into the one-surface-three-modes shell; wire `DeskPage.activeSurface: {mode, objectId?} | null` single-slot state so nesting is structurally impossible. Sandbox re-renders others' markup through viewer config, ✕ Discard writes nothing.
- **COMMIT the overdue tree** (2+ days uncommitted: chrome+panels, conformance batch, dots determinism, knowledge base, research docs, /desk flow + DrawPanel + uploads, golden v1/v2, supabase wiring). Commit gate is Sebs's go.
- **Heartbeat M10 stub** if time — Supabase Edge Function skeleton (wire the cron Day 17).

**Day 06-12 — Object views: inspect + quick-actions + card + naming**
- **Per-object Inspect + lightweight quick-actions** (#3): open / delete / remix as a trivially-dismissible selection chip (NOT a pinned floating toolbar — the Miro anti-pattern). Desk object delete UI (✕) — `deleteDoodle` exists, UI missing.
- **Object card view + naming-as-label** (#4): TCG-tall card, render as art, graphite name-banner (the name IS the ML label), capped why-line, handle/anon footer. A view of the record — presentation only.

**Day 06-13 — Multi-desk + 3D easy path begins**
- **Multi-desk** (#5): write **schema-v2** (additive `desks` table + `doodles.desk_id` FK + cap 50 + auto-spawn RPC with partial-unique `is_open` index), `listDoodlesForDesk` / `listDesks` / `getOpenDesk`, gallery grid + recents strip, `preview_svg` thumbnail cached at desk-close, deterministic fun names (xmur3→mulberry32 from the Sebs-themed pools).
- **3D easy path STARTS (M6):** port Free Stroke engine lib (`geometry-engines.ts`, `stroke-processing.ts`, `solid-mask.ts`, `solid-vector.ts` from `SXM4434/free-stroke`), drop Next.js imports, wire Rod (TubeGeometry) + Extrude (ExtrudeGeometry). cannon-es, not Rapier.

**Day 06-14 — 3D round-trip core (M7/M8)**
- **Bi-directional SVG ↔ 3D flip (M7)** with cached intermediate (content-hash → reuse cached GLB; OPFS for GLB, IndexedDB for metadata per the pipeline research).
- **SVG-style → 3D port (M8, the headline):** rough-handdrawn → EdgesGeometry → silhouette → screen-space hachure post-process (`@react-three/postprocessing`); Clean / Outline / Wireframe easy variants. Visual sign-off — style must carry over so the flip feels coherent.

**Day 06-15 — 3D hard path (the wedge) + identity + desk craft**
- **Character-preserving hard path:** vision-LLM router (Claude/GPT-4o/Gemini analyze → route engine) → Tripo / TRELLIS-via-fal Edge Function. Ship with a CACHED example as fallback (external API failure can't kill the demo moment). **Gated on Sebs API prereqs (§E).**
- **Optional identity Layer 1** (#6): deterministic generated handle from the session UUID (Keep / Reroll / Type-your-own) — additive, skippable, never a gate. Session-UUID stays (§C-3).
- **Desk craft surface** (#6): feTurbulence paper-grain (NOT wood/cork), Comeau layered hue-tinted shadows so objects sit not float.

**Day 06-16 — Own design + motion language (M11) + buffer absorb**
- **The divergence pass (§C-2):** harvest the accumulated vocabulary (chromeStyles, 260ms panel motion) → Desk Doodles' own color/type/motion/craft language. Held to the no-cheap-polish craft bar. **The flow is the craft work** (per the design doc) — how the morphing panel transitions, how identity feels invitational, how creating feels like minting a collectible, how the desk feels like a place.
- Absorb any slip from 06-11..06-15 here.

**Day 06-17 — Demo video shoot/edit + final Make checkpoint + heartbeat live**
- **Demo video (M13):** script + shot list (drafted start-of-day), shoot, edit the 5-min main + 30-sec social cut. Must show: the work, the idea, **the problem** (*"designers sketch at their desks constantly — no shared space makes that creative habit social and visible"*), the workflow, the wedge (hand survives the round-trip). Figma Weave for motion assets / Figma Agent for logo + intro visuals + UI polish (Innovative-Workflow multi-tool positioning).
- **Make upload checkpoint (final):** push full app state; test on PUBLISHED URL not just preview.
- **Heartbeat M10 cron wired + fired** — prevents 7-day Supabase auto-pause across judging (R4).

**Day 06-18 — SUBMISSION ONLY (hard deadline 11:59 PM PDT)**
- **NO build work.** All code locked end of 06-17.
- Confirm `*.figma.site` URL works on the PUBLISHED surface · heartbeat ping fired · upload demo videos · share Make file to Figma Community · social post `#ConfigMakeathon` (+ `@figma` on this final post only, per `feedback_selective_brand_tagging`) · submit on Contra.

> **Video timing note:** the task brief floated "script Day 12, shoot/edit Day 12-13." With all three big things in scope, the video is anchored to **06-17** (after the build is feature-complete) so it can show the finished wedge + social desk rather than a half-built app. Script can be drafted incrementally from 06-12 onward; the shoot/edit block is 06-17. If 3D-hard slips, the video shoots against the easy-path round-trip + the social desk — still a complete story.

### E. Sebs-side prerequisites (OPEN — dated to-do, some are GATING)

| Item | Why it gates | Need-by |
|---|---|---|
| **Paste `harden-v1.sql`** | LIVE SECURITY HOLE until pasted — current anon policies let any visitor DELETE/UPDATE the whole feed via the public key; also tightens INSERT svg cap 1MB→64KB. On clipboard, written, NOT pasted. | **NOW (06-11)** |
| **Paste schema-v2 (multi-desk)** | Multi-desk system (Day 06-13) can't ship without the `desks` table + `desk_id` FK + spawn RPC. schema-v2.sql does not exist yet — write it Day 06-13, then Sebs pastes. | 06-13 |
| **Tripo API key rotation** | 3D-hard path (Day 06-15) calls Tripo; key has been pending rotation since an early session. | before 06-15 |
| **fal.ai credits** | TRELLIS-via-fal is the dual-API in the hard path; account currently has $0 credits (~$5 covers dozens of gens). | before 06-15 |
| **Make local-codebase beta email** | Daily check; if granted, switches to continuous sync and kills the manual-upload friction. | daily |

### F. What this re-baseline does NOT change

- §1 constraints, §1.5 prize targeting (still: Grand conditional · Runner-Up / Innovative-Workflow / Build-in-Public / Community-Favorite strong · Building-with-Purpose don't-target), §4.5 git workflow, §5 risk register, §6 build-split, §7 D-decisions, §8.6 Smart Rendering System framing — all still hold.
- The Smart Hachure locked contract (`09-LOCKED-MODEL.md` I-1..I-14) is untouched and sacred.
- Build-in-Public stays a designated-day workstream (§8.5), not a daily tax.

---

## 1. Constraints (the box we're building inside)

### 1.1. Deadline
- **2026-06-18 at 11:59 PM PDT.** Confirmed 2026-06-04 from ConFigMakeathon guidelines.
- **14 days from today, not 15.** One day tighter than initial estimate.
- Winners announced June 23 at Config.
- Effective build budget = ~12 working days (no buffer day — submission Day 14 includes all upload + paperwork + social shares).

### 1.2. Figma Make hard constraints (per `20-research-figma-make-capabilities.md`)
- **No monorepo / workspace support.** Make installs from public npm. `workspace:*` deps don't resolve. `pnpm-workspace.yaml` does nothing. **Desk Doodles is a single self-contained Vite app — every dependency lives inside its `package.json`, every file lives inside its `src/`.**
- **No bulk file upload.** Manual paste-back per file, OR attach up to 10 files per prompt (each ≤1 MB). Each upload is friction.
- **Make → GitHub is one-way push.** GitHub → Make is manual. Push from Make overwrites whatever's in GitHub.
- **Local codebase mode** (closed beta, Mac-only, Figma Beta desktop) would solve all of this. **ACTION ITEM:** Sebs requests beta access immediately. If granted, the entire upload-checkpoint friction disappears.
- **AI credits enforced.** Professional plan ≈ 50–70 prompts/month. Initial app gen: 100+ credits. Complex prompts: 200–340+. Effective budget: ~4 Make prompts per day. **Use point-and-edit (zero credit cost) for cosmetic work. Use Gemini Flash model for trivial prompts. Reserve Claude Opus for Supabase scaffolding only.**
- **No iframe embedding** of published Make site. Portfolio case-study links out, doesn't embed.
- **Auto-pause Supabase after 7 idle days.** During hackathon, fire a heartbeat DB query every 5 days — critical for the live demo not to be dead at judging.
- **Version history performance dies after ~200 iterations.** Plan to clone the Make file mid-hackathon if iteration count crawls.
- **`.tsx` file creation in UI costs an AI prompt.** Either ask Make to scaffold the full file structure on first prompt (one big credit hit, saves dozens later) OR paste a complete folder via attachment.

### 1.3. ConFigMakeathon submission requirements (confirmed 2026-06-04 from guidelines)
- **All required to qualify:**
  1. Live project link (the `*.figma.site` Make URL)
  2. Community / working project file link (Make file shared to Figma Community)
  3. Main video walking through work + idea + workflow + design decisions
  4. 30-second project walkthrough video for the social post
  5. Social post on Instagram / X / LinkedIn tagged `#ConfigMakeathon` + `@figma`
- **Bonus / scoring:**
  - 5 points per judging category (4 categories = 20 max)
  - +5 points for social share
  - +5 points for Figma Community share (potential to be featured at top of figma.com/community)
- **Judging criteria (4 categories):**
  1. Quality of work — design + build + impact + craft
  2. Quality of idea — solves real problem
  3. Quality of video — workflow + design decisions + emulatable process
  4. Building in Figma in novel/innovative/unexpected way
- **Tools available (each is in-scope to use):**
  - Figma Make (primary)
  - Figma MCP
  - Figma Weave (1.5k AI credits for image/video/creative media — useful for video assets)
  - Figma Agent beta (only if preregistered before June 3 5pm PST — Sebs verify access)
  - Figma Pro plan w/ 3k AI credits granted via Contra confirmation email
- **Build tooling rule (re-read):** must be made using Figma's suite. Make is the primary build environment. External Vite dev IS the dev environment per our plan; published surface MUST be the Make site.

### 1.4. Prize structure ($100k total)
- **$50k Grand Prize** — best overall across all 4 categories
- **$15k Runner Up** — delivered on all dimensions
- **$10k Innovative Workflow** — most inventive design-to-build workflow
- **$10k Building with Purpose** — most exemplary use of design to solve real problems
- **$10k Build-in-Public** — most generous documentation of process for the community
- **$5k Community Favorite** — makes people stop scrolling

### 1.5. Prize-targeting strategy (REVISED 2026-06-07 per guidelines audit)

Realistic targeting based on guidelines + scope:

| Prize | Fit | Why |
|---|---|---|
| **$50k Grand** | Conditional | Needs strong showing across all 4 judging categories. Execution-dependent. |
| **$15k Runner-Up** | Strong | Creative Figma usage + working prototype = direct fit. |
| **$10k Innovative Workflow** | Strong (CONDITIONAL on multi-tool usage) | Currently weak if Make-only. Strong if we add Figma Weave (video assets) + Figma Agent (logo + intro visuals + UI polish). Guidelines explicitly reward usage across "Make, MCP, Local, Weave, design agent, etc." |
| **$10k Build-in-Public** | Strong | Existing locked-model + scope-audit + playground-decoding docs + 3 designated content days + buffer artifacts. Aligns directly with "screencasts, breakdowns, explainers — most generous documentation." |
| **$5k Community Favorite** | Strong | Public canvas scatter metaphor is distinctive; "stop scrolling" energy. |
| **$10k Building with Purpose** | **Weak — DON'T target** | Desk Doodles is creative/expressive, not solving a serious real-world problem. Don't twist the narrative to claim this. |

**Multi-tool usage breakdown for Innovative Workflow positioning:**
- **Figma Make** — primary build environment (Day 5 fork onward)
- **Figma Weave** — video assets (chapter dividers, motion behind voiceover, hero animation, end card) on Days 12-13
- **Figma Agent** — logo + intro visuals + UI polish (Days 6, 12, 13)
- **Figma MCP** — natural byproduct IF Agent integrates with it (don't force standalone usage; code → Figma → Make is backwards for our workflow)
- **Figma Pro** — 3k AI credits for Make work

Build-in-Public requires extra work (recording designated-day screencasts, polishing existing docs as public artifacts) but the raw artifacts mostly already exist.

### 1.4. Credit + capacity assumptions
- Sebs's primary AI capacity is Claude Code (here, in this conversation). Unlimited cycles.
- Make's AI = scarce. Strategic use only.
- Sebs is one person. Time budget = realistically 6-10 focused hours/day across 12-14 days = ~80-120 hours total.

---

## 2. The decoded architecture

### 2.1. App shape

```
Desk Doodles (single Vite + React + TS + Tailwind + shadcn app)
│
├── INPUT
│   ├── Draw in-app (capture stroke data via pointer events)
│   ├── Upload image (PNG/JPG/etc.) → autotrace → SVG
│   └── Upload SVG (direct)
│
├── INTELLIGENCE LAYER (the "smart" core — drives all routing)
│   ├── Source analysis (extract signals: stroke count, bbox, fill, complexity)
│   ├── ML object analysis (route engine + suggest physics preset + suggest SVG style)
│   │   └── v1 = heuristic (shape/stroke analysis); v2+ = personal sketch-style training
│   └── Cross-axis interconnection (per playground decoding §19; foundation of "intelligent system")
│
├── SVG MODE CANVAS
│   ├── 11 user-pickable SVG styles (clean / outline / wireframe / rough-handdrawn / sketchy / bold-ink / wet-ink / stipple / charcoal / risograph / newsprint)
│   ├── Smart Hachure SHADING SUB-SYSTEM (active for styles 4–11, the shading-enabled set)
│   │   └── 6-axis output: (gap · weight · layers · pressure · color · opacity)
│   └── Per-style toggle clusters (Multi-Stroke · Pen Tip · Shading · Surface Texture · Color/Palette)
│
├── 3D MODE CANVAS
│   ├── 3D mesh (from Free Stroke OR Tripo OR pre-prepped GLB, depending on input)
│   ├── SVG style → 3D rendering port layer (R3F + EdgesGeometry + shaders)
│   ├── Physics layer (rapier — hard/soft body)
│   ├── Interaction patterns spectrum (no-rotate → slight → free → physics-driven)
│   └── 3D-specific toggles (lighting · material · camera · animation)
│
├── BACKEND (Supabase)
│   ├── Auth (anonymous + email/magic-link)
│   ├── DB (Postgres — projects table, settings table, ML feedback table)
│   ├── Storage (cached SVGs, GLBs, source images by content hash)
│   ├── Edge Functions (Tripo proxy, autotrace, heartbeat keep-alive)
│   └── Realtime (multi-user sharing — stretch tier)
│
└── BI-DIRECTIONAL CANVAS MODE FLIP
    └── Cached → no re-generation on flip
```

### 2.2. Smart Hachure scope clarification (locked)

**Smart Hachure = the intelligent SHADING sub-system inside SVG mode.** Active for 8 of the 11 SVG styles. NOT the whole SVG render system. NOT the whole app.

Smart Hachure's 6-axis output `(gap, weight, layers, pressure, color, opacity)` feeds the active SVG style's render register. The locked-model contract `09-LOCKED-MODEL.md` still governs Smart Hachure's behavior; this plan doc extends scope to the app shell that wraps it.

### 2.3. The 3D pipeline split by input KIND (not source)

Per the playground interconnection findings + Free Stroke video decoding:

| Input KIND | Engine | Reason |
|---|---|---|
| Writing / signature / cursive / single-gesture pen-stroke | Free Stroke (Rod / Extrude / Solid / Inflate) | Engine designed for this — "Seb" demo proves it |
| Simple closed silhouette (one main path) | Free Stroke Solid mode | Silhouette extrusion is Solid's job; H1/H2/H3 hole support handles complex closed shapes |
| Object drawing / scene / illustration / complex composition | Cloud AI (Tripo) → textured 3D mesh | Free Stroke would extrude the bbox as a slab; wrong result |
| Uploaded SVG (complex multi-element, like Trophy Wall pins) | Cloud AI (Tripo) | Same as above |
| Uploaded raster image (simple) | Vectorize → simple path → Free Stroke OR direct Tripo | Routing by complexity |
| Uploaded raster image (complex) | Direct Tripo | Skip the vectorize step |

**Routing intelligence:** the ML object analysis layer (heuristic in v1) classifies the input and picks the right engine. Same intelligence layer that suggests physics preset.

### 2.4. SVG style → 3D port (the UX-integrity requirement)

When the canvas flips from SVG to 3D, the user's chosen SVG style must carry over. Without this, the canvas-mode flip feels disconnected.

| SVG style | 3D rendering counterpart | MVP / Stretch |
|---|---|---|
| Clean | Default R3F PBR / flat material | MVP — trivial |
| Outline only | EdgesGeometry → line render | MVP — standard pattern |
| Wireframe | WireframeGeometry → line render | MVP — standard pattern |
| Rough hand-drawn (Smart Hachure) | EdgesGeometry → silhouette → hachure marks projected onto surface | **MVP target** — real engineering, the headline feature |
| Sketchy / Bold ink | Variants of rough-handdrawn pipeline | Stretch |
| Wet ink | Gaussian-blur post-process shader | Stretch |
| Stipple | Vertex-distributed dot rendering | Stretch |
| Charcoal | 3D-noise overlay shader | Stretch |
| Risograph | Per-pass offset render | Stretch |
| Newsprint | Halftone pattern shader | Stretch |

---

## 3. Feature list — MVP vs Stretch

**NOTE 2026-06-08:** M5 (Smart Hachure hachure fillStyle) + S3 (cross-hatch + dots) + S6 (ML heuristic v1) + S10 (interconnection wiring) + Day 13 T2 (ML heuristic) are RECONCILED into ONE Smart Rendering System per §8.6. The entries below stay for traceability but are now phases of the unified system, not separate features.

### 3.1. MVP (must ship for a credible submission)

| # | Feature | Owner-bucket |
|---|---|---|
| M1 | Draw in-app (pointer capture, smooth strokes) | Frontend core |
| M2 | Upload SVG (direct) | Frontend core |
| M3 | SVG canvas mode with 3 SVG styles working: Clean, Outline only, Rough hand-drawn (Smart Hachure) | Frontend + Smart Hachure restoration |
| M4 | **Restored playground regressions** (wobble master, path polyline sampler, conditional stableLayerNudge, locked HAND_FEEL_BASE ratios) — per §19 fix list | **FOUNDATION — blocks everything else** |
| M5 | Smart Hachure: hachure fillStyle working end-to-end with 6-axis tuple output | Smart Hachure core |
| M6 | 3D canvas mode with Free Stroke 4-mode picker (Rod / Extrude / Solid / Inflate) | 3D engine port |
| M7 | Bi-directional SVG ↔ 3D flip | Frontend |
| M8 | SVG style → 3D port: at minimum Clean + Outline + Rough hand-drawn (hachure marks on 3D surface via EdgesGeometry) | 3D + Smart Hachure bridge |
| M9 | Basic Supabase: anonymous session ID (no auth UI), cached SVG/GLB (storage), **public canvas as primary surface** — every saved drawing/conversion lands on a shared global feed others can browse. **Infinite canvas (Figma-style pan/zoom).** **Auto-scatter on publish** with slight rotation (-8° to +8°). **Anti-cover validator:** bounding-box check rejects placement that fully obscures another object. Mixed styles on canvas = the feel (style chaos). Session-ID in localStorage lets a user edit/delete THEIR posts during a session. No private/per-user scope at MVP — going private requires real auth (Stretch S9). | Backend + public canvas (MVP-PROMOTED 2026-06-05, scope expanded 2026-06-07) |
| M10 | Heartbeat keep-alive (5-day cron via Supabase Edge Function) | Backend |
| M11 | Portfolio language design system (W1 tokens, ISe ladder, locked spacing) | Frontend polish |
| M12 | Published `*.figma.site` URL working end-to-end | Deployment |
| M13 | Demo video (≤5 min, shows draw → SVG → 3D round-trip) | Submission paperwork |

### 3.2. Stretch tier (in scope if time allows, in order of priority)

| # | Feature | Adds |
|---|---|---|
| S1 | Image upload + autotrace → SVG | Bigger input range |
| S2 | Tripo cloud AI for complex SVG → 3D mesh | Better 3D for non-stroke input |
| S3 | Additional Smart Hachure fillStyles: cross-hatch + dots | Shading expressiveness |
| S4 | Physics layer (rapier) with 3-4 presets (rock / balloon / glass / wood) | Headline 3D interaction |
| S5 | Custom physics editor | Power-user mode |
| S6 | ML object analysis (heuristic v1) for engine + physics + style routing | The "intelligent" wedge |
| S7 | Additional SVG style → 3D ports: stipple, charcoal | Visual range in 3D |
| S8 | Override store + JSON export per `09-LOCKED-MODEL.md` D-9.c | Locked contract scope |
| S9 | **Private canvas (auth-gated)** — adds real auth (email/magic-link), per-user DB scope, per-user storage folders, login UI + flow. Lets a user keep work off the public wall. NOT in MVP because the cheap version (no auth + localStorage only) = blank every session = pointless. Real private requires the auth machinery, that's the cost. Public-vs-private surface UX + remix/moderation model NOT yet defined. | Personal workspace + future paid tier |
| S10 | All 13 sliders with 6+ ticks per `09-LOCKED-MODEL.md` D-5.a + interconnection matrix wired (cluster-aware) | Honors the locked discipline fully |
| S11 | **Drag-to-position publish option** — alternative to auto-scatter; user drags doodle to placement before confirming publish. Anti-cover validator still active. | More authored publish flow |
| S12 | **Unify toggle + global style/mode pickers (Path A binary)** — viewer toggles "Unify": every doodle on the canvas snaps to a baseline (same style + mode). Global style/mode pickers become active, twist them to see all objects respond together. Toggle off → snap back to as-published. OG mode hides the pickers entirely. Re-renders cached doodles through viewer-controlled config on demand. | Comparison mode for the feed — biggest demo-video moment for the feed itself |
| S13 | **Path B partial-toggle (buffer-only extension to S12)** — in OG mode, global pickers visible but only affect doodles that natively support the toggled axis (others stay as-published). Requires feedback affordance (per-doodle indicator showing "this toggle applies to me / not to me") to avoid feeling buggy. Buffer-day work if S12 lands and time remains. | Power-user "selectively explore in place" mode |

### 3.3. Explicit out-of-scope (for v1 submission)

- Sketch-style ML training (task #30) — separate scope, future
- All 7 fillStyles' research docs (only hachure ships at MVP)
- All Style register research docs (only rough-handdrawn registers fully)
- Full pair-wise interaction matrix in chrome (cluster taxonomy in code; chrome shows clusters but doesn't expose all interactions)
- Multi-user collaborative editing
- Plotter export (G-code / HPGL)
- Browser extension
- Personal hosted domain (use `*.figma.site` for submission; custom domain later)

---

## 4. Day-by-day sequence (the 15-day build)

**REVISED 2026-06-04 (Sebs's call):** Foundation first in Hero-8-Lab, fork second. Forking broken toggles propagates broken behavior into Desk Doodles. Fix the foundation against real F3-B Trophy Wall content, THEN fork a working system. Plus: interconnection is FOUNDATIONAL (per playground decoding §19), not stretch — every toggle participates in its cluster coupling.

### Phase 0 — Hero-8-Lab Foundation Pass (Days 1-4) ✅ COMPLETE 2026-06-05

**The scope:** EVERY toggle's options work + EVERY interconnection per §C matrix fires + clusters per §E lock + 4 named regressions restored. See `phase-0-hero-lab-foundation.md` for the detailed checklist.

**Closeout status (2026-06-05):** All 4 days landed. Foundation passes Trophy Wall validation. Day 4 evening smoke test produced Rapier verdict: WASM is **intermittent in Make** (cold-load race condition, can't harden from inside sandbox) — `cannon-es` locked as the physics swap. See `[memory project_desk_doodles_no_rapier_in_make]` + `20-research-figma-make-capabilities.md` §9 for the controlled-comparison evidence.

**Day 1 — Setup + wobble + per-toggle audit start**
- Update `09-LOCKED-MODEL.md` with invariants I-11 (Wobble master), I-12 (One render pipeline), I-13 (Cluster taxonomy), I-14 (sketchingStyle owns layer transform)
- Reintroduce `wobble: 0-2` to F3ModifiersState; multiply HAND_FEEL_BASE per shape; chrome slider with Excalidraw warn > 1.4
- Lock per-shape HAND_FEEL_BASE ratios (2.4/2.4/2.0/1.4/1.6) as system constants with calibration comment
- Begin per-toggle audit: roughness, bowing, curve — verify each tick value produces visually distinct output against framedFlyer test pin
- Sebs: request Figma Make local codebase mode beta + verify hackathon team-size rule + rotate Tripo API key

**Day 2 — Path pipeline + remaining per-toggle audit**
- Route `<path>` content through polyline sampler so endpointBehavior + sketchingStyle apply identically across primitives (fixes regressions B.2 + B.4 from doc 19)
- Make `stableLayerNudge` conditional on `sketchingStyle === 'single-pass'` (fixes regression B.3)
- Decide kink: drop name OR build randomized-angle behavior. Lock in `09-LOCKED-MODEL.md`
- Per-toggle audit continues: stroke width, multi-stroke (all 8 values), endpoint (4 values), sketching style (4 values), pen tip (8 presets), texture (10 presets), fillStyle (8 options), hachure params, ink/fill opacity, palettes

**Day 3 — Wire interconnections + clusters**
- Lock the 5 clusters per §E in code (group state, group chrome, cluster-level event triggers)
- Wire every pair-wise interaction from §C matrix that's marked → (direct drive). ~20 specific call paths.
- Wire N-way compounds from §D (kink × loose-overlap × strokeCount fan-of-overshoots; pen-tip × strokeCount × sketchingStyle × texture compound; etc.)
- Add `bannedCombinations` to STYLE_PRESETS per §F.5 (bones for future classifier)

**Day 4 — Validation + sign-off**
- Run all 6 Trophy Wall test pins (framedFlyer, vinylLpSleeve, stackedSketchbooks, Polaroid, NES cartridge, PSA Charizard) through:
  - Every fillStyle x every Style register combo
  - Wobble sweep 0 → 2 (verify ratios preserved)
  - Each cluster's master toggle full range
- Visual sign-off checkpoint. **Foundation done.** Sebs gives explicit go.
- Day 4 evening: De-risk Make. Push minimal Vite stub to a Make file with all 9 deps (three, R3F, rapier, rough, perfect-freehand, supabase, svgson, culori, polygon-clipping) — confirm Rapier WASM loads. If broken, swap to cannon-es.

### Phase 1 — Fork Desk Doodles + port foundation (Days 5-6)

**Day 5 — Fork** (real date: 2026-06-06)
- Fork Hero-8-Lab → `~/Desktop/Projects/desk-doodles/` per `feedback_fork_a_lab_means_port_everything`. Port: chrome contexts, fixed smartHachure lib, hand-feel primitives, F3-B Trophy Wall as test surface, ALL the Phase 0 foundation fixes.
- Strip Hero-specific cells (Hero #8 chrome rows, F3-A/B path UI, etc.) — keep only what Desk Doodles needs.
- Strip `workspace:*` deps, normalize `package.json` for Make's "install from npm" expectation.
- Add Desk Doodles-specific deps: **`cannon-es` + `@react-three/cannon` (NOT `@react-three/rapier` — see Phase 0 closeout)**, `@supabase/supabase-js`.
- Confirm Vite dev server runs end-to-end. F3-B Trophy Wall test surface renders correctly (proves the port).
- **🎤 Build-in-Public designated day** — record the fork moment + first-day intro tweet thread (3 posts: intro, engine clip, smoke-test build).

**Day 6 — App shell scaffold**
- Strip Hero #8 chrome → Desk Doodles chrome (mode toggle, input panel, settings panel)
- Top-level routes: home (intro), canvas (the app), gallery (stretch)
- Input panel: draw / upload SVG / upload image
- Mode toggle: SVG canvas / 3D canvas
- Settings panel: SVG style picker + Smart Hachure sliders (already wired from foundation)

### Phase 2 — SVG mode in Desk Doodles (Day 7)

**Day 7 — Draw + upload input working**
- Draw input: pointer-event capture, smooth strokes via perfect-freehand
- Upload SVG: file picker, svgson parse, render through Smart Hachure pipeline
- Smart Hachure renders correctly on draw/upload content (already validated against Trophy Wall in Phase 0)
- **First Make upload checkpoint** — push SVG mode alone to Make. Validate workflow, fix any conformance issues.

### Phase 3 — 3D mode (Days 8-10)

**Day 8 — Free Stroke engine port**
- Lift `lib/geometry-engines.ts`, `stroke-processing.ts`, `solid-mask.ts`, `solid-vector.ts` from `SXM4434/free-stroke` GitHub → `Desk-Doodles/src/app/lib/free-stroke/`
- Adapt 2 component files (drawing-canvas, viewport-3d) — drop Next.js imports
- 4-mode picker (Rod / Extrude / Solid / Inflate) wired

**Day 9 — Bi-directional flip + Supabase**
- SVG ↔ 3D mode flip with cached intermediate
- Supabase setup: anonymous auth, project DB, GLB Storage, heartbeat Edge Function
- Test mode-flip caching (same input hash → reuse cached GLB)

**Day 10 — SVG style → 3D port (headline feature)**
- Rough-handdrawn → 3D: EdgesGeometry → silhouette extraction → hachure marks projected on mesh
- Clean / Outline only / Wireframe → 3D (easy variants)
- Visual sign-off — the canvas-mode flip should feel coherent (style carries over)

### Phase 4 — Smart Rendering System + physics + polish (Days 11-12)

**RECONCILED 2026-06-08:** What was previously split as "Smart Hachure (M5)" + "ML heuristic v1 (S6)" + "Cross-axis interconnection (S10)" + "Additional fillStyles (S3)" is actually **ONE unified Smart Rendering System** — `signals → classify → treatment` applied to multiple decision surfaces. See §8.6 for the unified framing. Days 11-12 are MVP-first per day with extension-if-time.

**Day 11 — Smart Rendering System Phase A + cannon-es MVP**

MVP that day (must ship):
- **Smart Phase A baseline:** per-fillStyle darkness→density calibration for hachure (per `F3-shading-calibration-spec.md` §4.4.1). Source darkness → effective gap + weight formulas. Dark solid fills become hachure marks, light areas stay open.
- **cannon-es World setup:** imperative World + Body, step in `useFrame`. 1 body preset (rock = high mass + low restitution).
- **Interaction patterns:** no-rotate / free orbit toggle (2 of 4 from spectrum)

Extension if time:
- Smart Phase A for cross-hatch + dots fillStyles (§4.4.2, §4.4.3)
- Smart Phase C MVP: auto-pick SVG style from input signals (size + complexity) — the "intelligent wedge" demo moment
- Additional cannon-es presets (balloon, glass)
- Remaining interaction patterns (slight rotate, physics-driven)

- **🎤 Build-in-Public designated day** (or Day 12) — record the "smart shading + physics live" moment

**Day 12 — Smart Rendering System Phase B/C + polish + demo video starts**

MVP that day (must ship):
- **Smart Phase B baseline:** apply smart shading across all rough-family SVG styles (rough-handdrawn + sketchy + bold-ink + stipple — the 4 that use the shading axis)
- **Smart Phase C baseline:** auto-pick fillStyle + texture from signals on input. When user drops an item, system picks the right shading technique based on the source.
- **Portfolio design system overlay** on shadcn defaults (W1/W1-D, ISe ladder, locked spacing)
- **Second Make upload checkpoint** — full app
- **Demo video script + shot list draft.** Must include: the work, the idea, **the problem we're solving** (framing: *"Designers sketch at their desks constantly — there's no shared space to make that creative habit social and visible."*), the workflow.

Extension if time:
- Smart Phase B extended to wet-ink + charcoal + risograph + newsprint (the non-rough-family shading styles)
- Smart Phase F: wire cross-axis interconnection cascade (style change → fillStyle defaults → texture defaults)
- Smart Phase C extended to penTip + multiStroke auto-pick
- First demo video takes recorded

- **🤖 Figma Agent usage:** UI polish pass on chrome / panels / button-state refinement
- **🎨 Figma Weave usage:** generate video assets — chapter dividers, motion behind voiceover, hero animation, end card

### Phase 5 — Stretch ladder + video edit + submission (Days 13-14)

**Day 13 — Stretch ladder + Make checkpoint #3 + video edit + intro visuals (REVISED 2026-06-06)**

- **🤖 Figma Agent usage (continued):** generate intro visuals + Desk Doodles logo + end-card composition for demo video
- **🎨 Figma Weave usage (continued):** edit video footage with Weave-generated motion graphics; ~30-sec social cut also gets Weave-generated transitions

**The ladder (REVISED 2026-06-08 — Smart system now spans Days 11-12, ladder updated):**

Shop down this ordered list based on actual remaining time. Commit to Tier 1, then add Tier 2 if a day's left, then Tier 3. **DO NOT attempt all 3 from the start** — three half-shipped features look worse than one well-shipped feature.

| Tier | Feature | Cost | Why this order |
|---|---|---|---|
| **T1** | **Smart Phase D — engine routing** (signals → Free Stroke vs Tripo for 3D conversion). Plus **Phase E — physics preset suggestion** (drop a shape, system suggests rock/balloon/etc). The remaining ML-heuristic-v1 surfaces not covered by Days 11-12. | ~1 day | Closes the "intelligent system" claim across input-routing + interaction, not just shading. Pure local code. |
| **T2** | **Smart Phase F — cross-axis interconnection cascade end-to-end** (cluster master ↔ sub-toggle dependencies wired throughout chrome + render). Makes the system feel coherent — picking a style cascades to fillStyle + texture defaults, etc. | ~0.5-1 day | Honors `09-LOCKED-MODEL.md` I-13 interconnection contract fully. |
| **T3** | **Tripo image-to-3D** (image upload → cloud-AI 3D mesh via Supabase Edge Function). | ~1 day | Biggest "wow" demo moment IF it works (judges photograph their desk → 3D version on canvas). API-dependent → goes last because external failure kills the moment. If attempting, ship with a CACHED example as fallback. |

**Day 13 also includes:**
- **Demo video edit** (priority alongside ladder). Cut the 5-min main + 30-sec social. Video is the single biggest factor for the $50k Grand Prize.
- **Make upload checkpoint #3** — push final app state to Make

**Day 14 — SUBMISSION ONLY (deadline 11:59 PM PDT 2026-06-18)**

**Hard rule: NO build work on Day 14.** All code work locked at end of Day 13. Day 14 is paperwork + upload + paperwork. Build-day overflow into Day 14 is the single biggest reason makeathon submissions fail.

**Submission deliverables (REQUIRED to qualify):**
- Final upload to Make; confirm `*.figma.site` URL works
- **Test on PUBLISHED URL not just preview** — they differ per `20-research-figma-make-capabilities.md` §5
- Heartbeat ping fired (prevents 7-day Supabase auto-pause mid-judging)
- Upload demo videos to YouTube/Vimeo
- Share Make file to Figma Community (bonus 5 pts + potential featuring at top of figma.com/community)
- Social post to Instagram / X / LinkedIn with `#ConfigMakeathon` tag — per `feedback_selective_brand_tagging` use `@figma` only on the final submission post, NOT every Day 14 touch
- Submit on Contra

### Phase 6 — Buffer (real days 2026-06-16, -17, -18 morning)

**3 buffer days reserved.** Submission lands Day 14 (real date 2026-06-15 Sunday). Buffer days 06-16 / 06-17 / 06-18 morning = polish + breakage recovery + Build-in-Public artifact prep + Figma Community engagement.

**If nothing broke:** Build-in-Public publish push (long-form posts: foundation-first methodology, Smart Hachure algorithm breakdown, the Rapier verdict writeup). Each is a candidate for separate publication on dev.to / personal blog / Twitter thread. ~30-60 min each, sit on top of the existing locked-model + scope-audit + playground-decoding research that's already written.

**If something broke:** absorb here. Final hard deadline = 06-18 11:59 PM PDT.

**Submission filed before 11:59 PM PDT 2026-06-18.**

(Winners announced June 23 at Config.)

---

## 4.5. Git workflow rule (LOCKED 2026-06-07)

**Local `~/Desktop/Projects/desk-doodles/` + `github.com/SXM4434/desk-doodles` is canonical source of truth.** Figma Make is purely deployment artifact + Community-share working file.

- **Do NOT use Make's "Connect to GitHub" / "Push to GitHub" feature.** Off-limits for the makeathon duration. Would overwrite clean local commit history with Make's post-AI-edited state.
- All dev in local Vite. Commits + pushes flow local → `origin/main`.
- Make uploads are one-way (local → Make, manual paste-back at Days 7/12/13/14).
- After each Make session: if Make AI auto-fixed something, manually port the fix back to local + commit. Otherwise local drifts behind Make.
- **Submission deliverables don't require GitHub:** live URL = `*.figma.site` (Make), working file = Make Community share. GitHub is purely the Build-in-Public process trail + docs.
- If Make local-codebase beta lands (Action #53): revisit. Continuous sync changes the math, probably still keep `main` as source.

Memory anchor: `project_desk_doodles_local_is_canonical`.

---

## 5. Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | ~~@react-three/rapier WASM doesn't load in Make~~ — RESOLVED 2026-06-05 (intermittent cold-load race, can't harden from inside Make; cannon-es locked) | n/a | n/a | Closed. See `[memory project_desk_doodles_no_rapier_in_make]` + `20-research-figma-make-capabilities.md` §9. |
| R2 | Wobble restoration breaks existing tests | Low | Medium | Wobble is additive — old `roughness` slider stays, wobble multiplies into HAND_FEEL_BASE |
| R3 | Tripo API costs balloon during demo | Low (just one user) | Low | Hard rate-limit in Edge Function; Supabase free tier covers |
| R4 | Supabase auto-pauses mid-judging | High if forgotten | High | Heartbeat Edge Function (cron weekly) — Day 7 wired |
| R5 | Make AI credits run out before final polish | High | Medium | Use point-and-edit (free) for cosmetic work; reserve credits for Supabase scaffolding; Gemini Flash for trivial prompts |
| R6 | Make file performance degrades after 200+ iterations | Medium | Medium | Clone file mid-hackathon if iteration crawls |
| R7 | Free Stroke engine port surfaces hidden Next.js dependencies | Medium | Medium | Strip Next imports during port; framework-agnostic code in lib/ should be clean |
| R8 | SVG style → 3D port (hachure on 3D surface) is harder than expected | High | High | Time-box to Day 8. If not working, ship Clean + Outline only in 3D; defer hachure-on-3D to stretch |
| R9 | ~~Solo team-size rule~~ — RESOLVED 2026-06-04: ConFigMakeathon allows solo | n/a | n/a | Resolved. |
| R10 | Make's manual upload workflow eats too much time | High | Medium | Get local codebase mode beta access. If not, batch upload checkpoints (Days 5, 11, 14 only) |
| R11 | shadcn defaults clash with portfolio design system | Medium | Low | Override Tailwind tokens; replace component theming on Day 11 |
| R12 | Demo video doesn't render Smart Hachure clearly | Low | Medium | Day 14 video — script the demo flow to show SVG→3D flip explicitly |

---

## 6. The split: what's built HERE vs what's built IN Make

### 6.1. Built here (`~/Desktop/Projects/desk-doodles/` Vite app, on Sebs's machine)
- All Smart Hachure logic (signals, classifier, FillStyleModels, render-region)
- All 3D rendering (R3F, Free Stroke engine, physics, SVG-style-to-3D bridge)
- Input handling (draw capture, file upload)
- ML object analysis (heuristic v1)
- Portfolio design system (W1 tokens, ISe ladder)
- All component logic, all state management
- Backend WIRING (Supabase client setup, Edge Function code, schema migrations)

### 6.2. Built in Make (during upload checkpoints)
- Supabase scaffolding (run Make's "add Supabase" once — scaffolds auth + schema)
- Final cosmetic polish via point-and-edit
- Submission paperwork (Figma Slides embedding)
- Possibly: shadcn component theming tweaks if needed

### 6.3. NEVER touched in Make (would burn credits + likely break)
- 3D rendering loop, R3F + Rapier physics
- SVG → 3D extrusion math
- Color logic / culori
- Polygon clipping algorithms
- Smart Hachure FillStyleModels
- Tight iteration on stroke math

---

## 7. Open decisions (DECIDE BEFORE BUILDING)

### D-makeathon-1. Local codebase mode beta access
**Status 2026-06-04: Sebs is on the waitlist.** Beta access may activate mid-makeathon. Plan accommodates both workflows:
- **If activated before Day 7 (first planned upload):** switch to Workflow A — true two-way local↔Make sync. Skip the 4 batched upload checkpoints; use continuous sync instead. **Big productivity win.**
- **If activated mid-makeathon (Day 7-14):** transition mid-flight. Upload current state as one final batch, then activate continuous sync from there forward.
- **If never activated:** stay on Workflow B — 4 batched upload checkpoints (Days 4 evening, 7, 12, 14) per `20-research-figma-make-capabilities.md` §8.

Daily check: when Sebs sees the access-granted email, switch workflows immediately.

### D-makeathon-2. ~~Hackathon team-size rule~~ — LOCKED 2026-06-04
ConFigMakeathon on Contra. Solo allowed. Not FigBuild. **Resolved.** Sebs to still pull the rest of the submission rules from the guidelines page (deadline timezone, format, AI usage, IP) per §1.3 action item.

### D-makeathon-3. ML object analysis: heuristic-only or do we ship a real model in v1?
- **Recommendation: heuristic only in v1.** Real ML is the deferred sketch-style training (task #30). v1 heuristic uses stroke count, bbox aspect, fill density to route engine + suggest style + suggest physics. Good enough for the wedge claim.

### D-makeathon-4. Tripo integration: ship at MVP or stretch?
- **Recommendation: stretch (S2).** Free Stroke covers the drawing pathway perfectly. Tripo covers complex SVG/image. If time runs out, only-draw-mode 3D still ships a credible app.

### D-makeathon-5. ~~Public gallery / sharing~~ — RESOLVED 2026-06-05 — PUBLIC CANVAS PROMOTED TO MVP
**Decision flipped 2026-06-05.** Original framing was "private canvas in MVP, public stretch." Sebs flagged: anonymous private = localStorage only = blank every session = pointless. Real private requires auth machinery; that's the cost. Public canvas (anonymous session ID + global shared feed + opt-in publish, no Realtime required for MVP — simple `ORDER BY created_at DESC` query works) is structurally SIMPLER. And public-canvas-first was Sebs's original intent + better fits the Build-in-Public + Community Favorite prize criteria.
- **MVP M9:** public canvas with anonymous session ID, shared global feed, opt-in publish
- **Stretch S9:** private canvas with auth gating (was previously the MVP, swap stuck)

### D-makeathon-6. The kink behavior
- Per `19-research-cross-axis-interconnection.md` finding: `isKink()` defined but never called in playground either. Both apps treat kink as protrude.
- Options: (a) drop the kink name entirely, (b) build the randomized-angle behavior the doc-comment promises.
- **Recommendation: (a) drop the name.** Saves time; eliminates fake-provenance source-of-truth issue. Add kink as a real future toggle, properly researched.

### D-makeathon-7. Custom domain
- **Recommendation: skip for v1.** Use `*.figma.site` URL. Custom domain post-makeathon if Desk Doodles graduates to long-term hosting.

---

## 8. Standing tracker / state

### 8.1. Sign-offs needed before code starts
- [ ] Sebs reviews this plan + locks D-makeathon-1 through D-makeathon-7
- [ ] Sebs requests local codebase mode beta access
- [ ] Sebs confirms hackathon team-size rule
- [ ] Sebs reviews `09-LOCKED-MODEL.md` updates (I-11, I-12, I-13, I-14)
- [ ] Sebs schedules Tripo API key rotation (need fresh key before Day 13 if S2 stretches in)

### 8.2. Day 1 immediate actions
- Fork Desk-Doodles from Hero-8-Lab
- Smoke test Rapier WASM in Make
- Sebs: request beta + verify team rule + rotate Tripo

### 8.3. Critical dates (RE-BASELINED 2026-06-11 — supersedes the stale 06-06 grid)

> The old grid below the line claimed "2026-06-11 = end of Phase 3 / 3D done." **That is FALSE — 3D has zero code as of 06-11.** The real as-built state and the corrected day grid are in the **RE-BASELINE 2026-06-11** section at the top of this doc. This block is kept only to mark the off-by-one drift the gap sweep caught.

**Corrected dates (governing — see §D of the re-baseline for the per-day build):**
- 2026-06-11 (today): desk flow live + persists · Smart Hachure + audit · gap-sweep critical fixes · classifier recall-hole fix · dots determinism · knowledge base · research docs · supabase wired. **3D = not started.** Record + Sandbox + commit begin today.
- 2026-06-12: object views (inspect / quick-actions / card / naming)
- 2026-06-13: multi-desk (schema-v2) + 3D easy path starts (Free Stroke Rod/Extrude)
- 2026-06-14: 3D round-trip core (bi-directional flip + SVG-style→3D port)
- 2026-06-15: 3D hard path (vision-LLM router → Tripo/TRELLIS) + identity + desk craft
- 2026-06-16: own design + motion language (M11) + buffer absorb
- 2026-06-17: demo video shoot/edit + final Make checkpoint + heartbeat live
- **2026-06-18 11:59 PM PDT: HARD DEADLINE** — SUBMISSION ONLY, no build work
- 2026-06-23: winners announced at Config

**— stale 06-06 grid (off-by-one, DO NOT follow; kept as drift evidence only) —**
- ~~2026-06-11: end of Phase 3 (3D mode + SVG-style-to-3D port done)~~ FALSE — 3D had zero code on 06-11
- ~~2026-06-13: end of Phase 4 (physics + polish + demo video start) — Make checkpoint #2~~
- ~~2026-06-15: Day 14 (SUBMISSION-ONLY day)~~ — actual submission day is 2026-06-18

---

## 8.6. Smart Rendering System — unified framing (LOCKED 2026-06-08)

What was previously scoped as separate plan entries — **M5 (Smart Hachure)**, **S3 (cross-hatch + dots fillStyles)**, **S6 (ML heuristic v1)**, **S10 (cross-axis interconnection)**, **Day 13 T2 (ML heuristic)** — is actually ONE unified Smart Rendering System with the same `signals → classify → select treatment → render` engine applied to multiple decision surfaces.

This is the makeathon headline (the wedge): *"an intelligent design system that picks the right transformation per region per source."*

### Where smart applies (and where it doesn't)

| Toggle type | Examples | Smart applies? |
|---|---|---|
| **Conversion / transformation pickers** (discrete options that pick which transformation to apply) | SVG style, fillStyle, texture, penTip, multiStroke, sketchingStyle, palette modes | **YES** — smart auto-pick |
| **Calibration parameters** (numeric values that should vary based on source signals) | hachureGap per darkness (spec §4), fillDensity per region, hachureAngle per shape orientation | **YES** — smart auto-tune |
| **Direct-manipulation sliders** (user expression controls) | wobble, bowing, strokeWidth, curveTightness, inkIntensity, fillOpacity, blurAmount, etc. (NOT roughness — see note below) | **REVISED 2026-06-08: slider VALUE stays direct (user picks 0-2 on wobble etc.). But HOW that value applies PER-REGION needs a smart layer — applying the same slider value uniformly across outer-shell + internal-detail + decorative-hatching shatters small/internal geometry at the slightest nudge (caught on Desk Doodles audit 2026-06-08: stacked-books outer shell read rigid while pencil-jar internal stubs went full-rough at identical slider state). Smart layer = per-detail scaling curve on top of user value; user intent preserved, per-region application protected. Adds as new sub-surface to the same `signals → classify → treatment` engine — same Smart Hachure region tagging fans out to manual-toggle scaling, not just hachure parameters. NOTE on roughness: the roughness slider does NOT belong in this row currently — per `09-LOCKED-MODEL.md §I-11` (locked 2026-06-04), roughness is reserved for Cluster 4 Surface Texture repurpose (3D-PBR-style stroke surface quality: edge raggedness, pencil grain, ink-density variation, feTurbulence micro-displacement). Slider stays visible as placeholder; per-region smart-layer scaling for roughness applies ONLY after that Cluster 4 wiring lands.** |

### Explicit issues parked for smart-system to resolve (added 2026-06-08)

These were diagnosed during Desk Doodles audit work and intentionally NOT patched in user-visible code today. Each will naturally improve when the smart-system build resumes:

- **fillStyle slider silent on 150/197 shapes** — Smart Hachure's classifier correctly decides "no fillable region" for stroke-only / wash-only shapes. UX gap: user can't tell which shapes are fillable. Smart system fix = surface per-shape fillable signal in chrome, OR widen what classifier considers fillable when user explicitly picks a fill.
- **Rough-handdrawn variance by shape complexity** — geomean bbox produces sliding-scale wobble. Simple shapes (actionFigure stick figure) look near-clean while complex ones look hand-drawn. Smart-layer per-element role classifier (outer-shell / decoration / internal-detail) will normalize VISUAL character regardless of element count.
- **Wobble per-element-type variance (HAND_FEEL_BASE ratios)** — `<line>` wobbles at 1.4× while `<rect>` at 2.4× per §I-11 sacred ratios. Visible inconsistency within a single SVG. Smart layer can detect "make all lines in this shape match the dominant character" instead of literal per-type ratios.
- **Curve-path dense sampling crinkle** (sombrero brim, folded map arcs) — 12px sampling on long shallow curves produces too many jitter points. Per-element classifier can detect "this is a decorative arc, sample sparser."
- **fillStyle classifier-vs-user override** — already partially resolved with the narrow override; smart system will refine by classifying per-region treatment intent.

These DON'T need separate fixes today. They're the natural payoff of the smart-layer build per the audit-catalog framing.

### Manual-toggle smart-layer foundation — built from the audit catalog (added 2026-06-08)

**Architecturally: building the smart layer is itself a two-part build.**

1. **The recognition + classification system** — a learned model that recognizes our objects' element roles (outer-shell / decorative-tip / internal-detail / hatching / etc.) and predicts the right per-element scaling for each manual toggle. This system becomes THE FOUNDATION the rest of the rendering pipeline plugs into.
2. **The foundational dataset that bootstraps it** — the per-shape breakage catalog produced by the Desk Doodles `/audit` route + sweep harness. The system *initially* learns from our catalog (our 93 shapes, every modifier swept, every breakage logged), and that's what makes its predictions stable enough to ship as the foundation.

So the order is: build the audit catalog → train the recognition system on it → set the trained system as the smart-layer foundation → everything else (visitor-canvas uploads, future asset additions, runtime classification) plugs into that foundation.

The manual-toggle smart layer (per-element scaling of wobble / bowing / strokeWidth / etc.) is the parallel surface to fillStyle smartness. Its **foundational training data isn't override events — it's the per-shape breakage catalog produced by the Desk Doodles `/audit` route + sweep harness.**

**Concrete kickoff example (logged 2026-06-08 during audit work):**

At rough-handdrawn defaults with wobble=0.8, `pencilStubJar` rendered with pencil-tip polygons (4-5px decorative geometry inside an 80px parent SVG) totally shredded — same slider value applied uniformly to outer-shell and decorative-tip is wrong. That single observation = one labeled example: `{role: decorative-tip, parentSize: 80, ownSize: 5} → scaling-curve(wobble) = 0.2-0.4 of user value`. Every analogous "X breaks on shape Y at value Z" surfaced by the audit grows the dataset.

**Pipeline (mirrors fillStyle maturity model from `07-architecture-ml-pipeline.md`):**

- **v1 (rules-only)** = geomean compromise currently shipped in `SvgStyleTransform.tsx` — `sizeClampBbox = sqrt(perChild × group)`. Soft per-detail scaling. Handles ~95% without classifier. Ships now.
- **v2 (cached LLM pre-pass)** = at build time, for each shape in inventory, ask the LLM to label each element's role (outer-shell / decorative-tip / internal-detail / hatching / etc.) and cache. Runtime classifier reads cache.
- **v3 (decision tree)** = retrain on accumulated audit labels + user overrides.

**Method (don't throw the audit data away):**

- Audit runs catalog `/tmp/dd-audit/` for now → graduate to repo-local `audit-runs/YYYY-MM-DD/` when corpus grows.
- Every catalogued bug = one labeled data point. The audit isn't a throwaway debug tool, it's the dataset.
- When the manual-toggle smart-layer build opens as its own session, start from the audit catalog — don't re-derive.

**Cross-references:**

- `07-architecture-ml-pipeline.md` — full pipeline architecture, now has a sibling section "Per-shape breakage catalog" mirroring this entry.
- Memory: `project_smart_layer_foundation_via_audit`.
- Table row below ("Direct-manipulation sliders") for the user-value vs per-region application split.

### Phases (rolled out across Days 11-13)

| Phase | What | Where it lands |
|---|---|---|
| **A** | Per-fillStyle darkness→density calibration formulas per `F3-shading-calibration-spec.md` §4 (hachure / cross-hatch / dots / zigzag / dashed / etc.) | Day 11 MVP (hachure) + Day 11 extension (cross-hatch + dots) |
| **B** | Apply across all 8 shading-capable SVG styles (rough-handdrawn / sketchy / bold-ink / wet-ink / stipple / charcoal / risograph / newsprint), not just rough-handdrawn | Day 12 MVP (4 rough-family styles) + Day 12 extension (other 4) |
| **C** | Auto-pick conversion pickers from input signals (SVG style / fillStyle / texture / penTip / multiStroke). When user drops an item, system picks defaults intelligently. | Day 12 MVP (SVG style + fillStyle auto-pick) + Day 12 extension (others) |
| **D** | Engine routing (signals → Free Stroke vs Tripo for 3D conversion) | Day 13 ladder T1 |
| **E** | Physics preset suggestion (signals → rock / balloon / glass / wood) | Day 13 ladder T1 |
| **F** | Cross-axis interconnection cascade (cluster master ↔ sub-toggles per `09-LOCKED-MODEL.md` I-13 and `19-research-cross-axis-interconnection.md`) | Day 12 extension OR Day 13 ladder T2 |

### Architecture (one engine, many surfaces)

`lib/smartHachure/` becomes `lib/smart/` (or keep name) — one classifier + treatment-selector + renderer pipeline that takes signals and produces decisions. Each phase adds a new "decision surface" to the same engine. NO separate ML system, NO separate ML heuristic — same code path, different application points.

### Build-full rule (CORRECTED 2026-06-08)

**Build the FULL system. Sebs calls time when needed — don't self-stop at MVP.**

The day blocks below list MVP as the floor of what ships, but the default is to push for the full phases that day. Don't artificially time-box to MVP and stop — keep going through the extensions. The only triggers to stop:
- Sebs explicitly calls time ("end here, we've spent enough")
- Real blocker that needs separate session (broken dep, missing decision, etc.)
- End-of-day natural break + work needs validation before extending

If we naturally finish a phase early in a day, push into the NEXT phase that day. Don't manufacture MVP-stops.

### Old plan entries — now subsumed

- **M5 (Smart Hachure: hachure fillStyle)** = Smart System Phase A MVP. Still MVP-required.
- **S3 (cross-hatch + dots)** = Smart System Phase A extensions. Drops from Stretch tier — now Day 11 extension.
- **S6 (ML heuristic v1)** = Smart System Phases C + D + E. Drops from Stretch tier — split across Day 12 + Day 13 ladder.
- **S10 (interconnection wiring)** = Smart System Phase F. Drops from Stretch tier — Day 12 extension or Day 13 T2.

### What's still post-makeathon (Phase G — explicit out-of-scope)

Generalize the engine to OTHER rendering domains per `project_generalizable_rendering_decision_pattern` memory (motion · type · color · spacing · 3D fidelity · etc.). DO NOT pre-build the meta-engine — extract only when 2nd concrete example justifies it. The makeathon ships the FIRST instance applied across all of Desk Doodles' surfaces; the cross-domain generalization is roadmap.

---

## 8.5. Build-in-Public discipline (REVISED 2026-06-06)

**Build-in-Public is a designated workstream, not a daily-screencast tax.** Daily capture eats ~30-60 min and accumulates to ~7 hrs over the build — that time is more valuable spent on the actual product. Instead:

### Designated content days (3 across the makeathon)

- **Day 5 (2026-06-06):** fork + intro. The Day 1 tweet batch (3 posts: Desk Doodles concept intro, engine clip, Rapier smoke-test build) — see drafts in session memory.
- **Day 9 (2026-06-10):** public canvas going live. Real shareable moment — record the feed appearing as a publish lands.
- **Day 11 or 12 (whichever lands physics+interactions first):** the "smart" feel + physics live. Voiceover + clip.

### Tagging discipline

Per `feedback_selective_brand_tagging`: hashtag `#ConfigMakeathon` on every post. Tag `@figma` ONLY on Day 1 kickoff + final submission post (2 tags total across 14 days). NOT every Build-in-Public update.

### Other days

Lightweight: single screenshot + 1-2 line caption if anything. No screencast/edit tax.

### Buffer-day artifacts (post-submission, 06-16/17 if clean)

Convert existing locked-model + scope-audit + playground-decoding docs into 2-3 long-form public posts:
- Foundation-first methodology breakdown
- Smart Hachure algorithm + the 13-axis parametric model
- The Rapier verdict writeup (controlled comparison, cold-load race finding)

Each is ~30-60 min of polish — the raw material exists.

---

## 9. Cross-reference index

- Foundation contract: `09-LOCKED-MODEL.md` (will receive I-11..I-14 update per playground decoding)
- Scope audit: `18-scope-audit.md`
- Playground interconnection: `19-research-cross-axis-interconnection.md` (to be written from agent #2 output)
- Figma Make capabilities: `20-research-figma-make-capabilities.md`
- Free Stroke source: `SXM4434/free-stroke` GitHub (private)
- Free Stroke video: `~/Desktop/style/Screen Recording 2026-06-04 at 2.00.46 PM.mov`
- Memory anchor: `project_desk_doodles_makeathon.md`
- Anti-drift: `feedback_smart_hachure_drift_pattern.md`

---

**End of plan.** Sebs reviews, locks D-makeathon-1 through D-makeathon-7, and Day 1 opens.
