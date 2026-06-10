# Cross-System Rules — Locked

**Status: LOCKED — Final (Cycle 10 close 2026-05-13).** The operating manual for the locked system family — Type · Color · Spacing · CSML · Navigation · Media · Project Card — through the lens of intent + context. Consolidates the locks produced across Cycles 1–9 of the Cross-System Rules Build into a single integration layer. **Locked for current scope (Cycles 1–9 systems).** Future systems (Hero, Motion, Voice, etc.) extend this doc through documented surgical revisions when they lock — see §14 extension roadmap.

This doc is the **operating manual** for using the per-system locks together. The per-system locks are the **reference material** — authoritative values, role definitions, scale tables, anti-drift rules per domain. This doc is the manual that tells you how to use the catalog.

Read this doc **first** when building anything that uses any of the locked systems. Drill into per-system locks for canonical values once this doc tells you which to consult.

---

## Table of contents

1. Purpose + scope
2. How to use this doc
3. Where the locks live (pointer index)
4. System foundation (Cycles 1–4)
5. Reading-mode bucket composition (Cycle 5)
6. Spacing rhythm + density + composition axes (Cycle 6)
7. Customs (Cycle 7 per-module exceptions)
8. Cohesion at 4 zoom levels (Cycle 8)
9. Sanctioned register exceptions (Cycle 9 + W1 reopen close)
10. Intent + Context framework
11. Worked examples
12. Outcome protocol — three paths
13. Cross-domain anti-drift
14. Open work queued + extension roadmap
15. Precedent index

---

## 1) Purpose + scope

### What this doc owns

This is the **integration layer** that joins the per-system locks. It articulates:

- How locked systems compose into authored case-study surfaces
- How **intent + context** shape register behavior even when register values converge
- How **sanctioned exceptions** earn their place when intent + context demand divergence from default locks (META_VALUE pattern · Container-earned primary composition pattern · Body-soft register pattern)
- How **surgical revisions** to locked specs are sanctioned when combined application reveals the lock itself is wrong (Cycle 1 ISe 32 escalation pattern · Cycle 9 W1 reopen body-tier ink pattern)
- The **cross-domain anti-drift** rules that no per-system lock owns alone
- The **earning principles** that govern when and how the locked system expands

The cycles that produced this doc (Cycles 1–9 of the Cross-System Rules Build) didn't just lock values. They discovered and articulated the connective tissue between **value-to-role catalogs** (Type · Color · Spacing) and **behavior-to-structure systems** (CSML · Navigation). This doc names that connective tissue: **intent × context = behavior**, with the operating manual as the lens through which the catalogs become coherent under composition.

### What this doc does NOT own

Domain-canonical values stay in their per-system docs. This doc summarizes + points; it does not re-state.

- Token values, semantic roles, surface ladder, interaction behavior → `color-system-w1.md`
- Type scale, weight rules, role narratives, controlled exceptions → `typography-system.md`
- Spacing scale, width map, density modes, rhythm rules → `spacing-layout-rhythm.md`
- Module job boundaries, reading-mode arc, handoff rules, artifact distribution rule, hierarchy rule, reading-mode bucket composition → `case-study-module-system-v2.md` + `case-study-modules/01..11`
- Navigation layers, label vocabulary, state rules, responsive behavior → `navigation-system.md`
- Media presentation rules → `media-prototype-presentation-system.md`
- Project card structural variants → `project-card-system.md`

If you need a token value, a scale entry, a role narrative, or a module's locked job, the per-system doc is the canonical authority. This doc tells you **when to consult which**, and **how the consulted answers compose** when they meet in a real surface.

### Why this doc exists

Two structural facts about the locked system family make this doc necessary:

**1. The per-system labs are categorically different.** Value-to-role labs (Color, Spacing, Type) map concrete values to named roles — clean bijections. Behavior-to-structure labs (CSML, Navigation) define modules through behavior + structural rules — interpretive definitions. Both are self-consistent in isolation. Both pass their own audits. **Neither articulates the connective layer that joins them under composition.** When `/gate-a/ion/r1` was assembled and the systems met for the first time, gaps surfaced (title↔body adjacency contrast collapse · body→body sub-line scan · container-earned primary composition · TOC opacity vs color-token state model · rail-padding alignment override · 7+ other findings). The per-system locks were correct in their domains. The gaps lived **between** them.

**2. Cycles 1–9 implicitly produced the connective layer.** Earning conditions for sanctioned exceptions (META_VALUE, container-earned primary, body-tier ink) · cascade rules (flag #37) · cohesion principles (Cycle 8's four zoom levels) · reading-mode composition (Cycle 5) · surgical-revision protocols (Cycle 1 ISe 32 escalation, Cycle 2 phantom-weight fix, Cycle 4 italic register additions, Cycle 9 W1 reopen ladder expansion) — all of these are intent + context work expressed as locks. **This doc makes that work explicit so future cycles cite the protocol rather than rediscover it from scratch.**

The locked systems work as a value × role catalog without this doc. They work as a **living ecosystem** with it.

### Locked-for-current-scope framing

This doc is **locked for the scope of Cycles 1–9**: Body buckets (Cycles 1–4), Reading-mode composition (Cycle 5), Spacing rhythm + density + composition axes (Cycle 6), Customs (Cycle 7), Cohesion verification (Cycle 8), Sanctioned exceptions (Cycle 9 + W1 reopen close 2026-05-13).

It is **mutable through surgical revisions** when one of two things happens:

- **A new system locks in Phase 1.5.** Each new system (Hero #8 → Art artifacts #9 + placement #10 → Motion #11 → Animation vocab #12 → About #14 → Footer #15 → Playground #16 → Easter egg #17 → Voice #18 → Toolchain / A11y / Perf / Governance #19–22) triggers a documented extension to this doc per the extension protocol in §14. Extensions can add pointer entries, inheritance entries, earning entries, anti-drift entries, intent entries, or worked examples — the category of the new system determines which.
- **A documented implementation failure on a real surface surfaces a divergence the current locks don't carry.** The outcome protocol in §12 determines whether the divergence earns a sanctioned exception (Path B), requires a systemic revision (Path C) of an existing locked value, or confirms the system holds (Path A — no change, divergence was apparent not real).

**Casual reopening is not permitted.** Reopening requires a documented failure on a real implementation surface — the same standard each per-system lock uses for its own reopening. This rule applies bidirectionally: this doc cannot be reopened casually; reopening any per-system lock requires the same evidence threshold.

### Companion principle — `feedback_match_locked_labs`

When building any new surface, the read order before code is:

1. **This doc first.** Trace intent + context for what you're building. Identify which registers, compositions, and customs apply. Note convergence vs divergence.
2. **Per-system locks next.** Drill into the canonical doc for the exact values the manual identified.
3. **Locked labs next.** Read the source code of the locked lab surfaces (Color System Lab `/locked/w1`, Typography System Lab `/final`, the Case Study Module Lab surfaces) for any structural patterns the docs don't carry.
4. **Then build.**

This doc joins the locked-lab read-list. It is not consulted only when stuck — it is consulted by default before any new surface work begins.

---

## 2) How to use this doc

This doc supports three distinct workflows. Each has a different read order. Knowing which workflow you're in determines what to open first.

### Workflow A — Quick value lookup

**Trigger:** You already know what role you need and you need its canonical value. Examples:
- "What's the body color?"
- "What's the section heading register?"
- "What's the spacing between two consecutive body paragraphs?"

**Read order:**

1. Skip this doc. Go direct to the per-system canonical.
2. Token / scale / spacing value answers your question.

**Output:** Single value, takes seconds. This doc is NOT in the path.

This doc is not for lookups. It's for composition and decisions. If you know which role and you need its locked value, the per-system canonical is the fastest path. Reference table in §3 below.

---

### Workflow B — Building a new surface (most common)

**Trigger:** You're assembling something that uses any locked system. Examples:
- Building a new case-study module instance
- Applying the locked systems to a new page (About, Footer, Playground when those land)
- Adding a new content variant to a locked case-study module
- Composing a new component using locked registers + spacing + color
- Any surface where multiple locked systems meet

**Read order:**

1. **This doc first.** §10 (Intent + Context framework) + §11 (Worked examples). Trace the intent of what you're building (what's its job? what reading mode is it in? what comes before and after? what register cascade does it sit in?). Identify which buckets / compositions / customs the framework points to. Note whether your case looks like convergence (default values apply) or divergence (something doesn't fit — go to Workflow C).
2. **Per-system locks next.** Once §10 + §11 tell you "use the Body register with Cat 1 section opening + Subordinate aside for the closing line," go to `typography-system.md` for Body / Subordinate aside register values + `spacing-layout-rhythm.md` for Cat 1 24px value.
3. **Locked labs next** (per `feedback_match_locked_labs`). Read the source of the locked lab surfaces — `LockedW1Overview.tsx` for color application, `TypographySystemFinalPage.tsx` for type application, the case-study module lab `/system` for §06 step composition patterns — to see structural patterns the docs don't carry.
4. **CSML module spec if case-study work.** If you're building case-study content, `case-study-modules/0X.md` is the canonical authority for the module's job, what it must NOT become, and the artifact distribution rule.
5. **Build the surface.**

**Output:** A surface that composes correctly because intent + context were established first, canonical values were drilled into second, structural patterns were inherited from locked labs third.

This doc IS in the path. It's the lens. The per-system locks are the values the lens points to.

---

### Workflow C — Resolving a divergence

**Trigger:** Something feels off mid-build, or an audit surfaces a gap. Examples:
- "This title looks correct per the locks but the page reads flat — title↔body collapse problem"
- "This summary line is at Body 15 but reads identical to the chosen line above it — body→body sub-line scan problem"
- "The §08 takeaway needs structural elevation per CSML §08 line 120-134 but no existing register delivers it"
- "TOC labels render darker than the Nav §7 proofed 0.55 opacity state — system conformance gap"

These are the Cycle 9 / Cycle 9 W1 reopen / TOC audit precedents — each was a divergence the locks didn't cover, surfaced under real implementation.

**Read order:**

1. **This doc §12 (Outcome Protocol).** Step through the protocol:
   - **Step 1** — Document the failure on a real implementation surface (don't reopen on a hunch; the evidence threshold is "documented failure" per `feedback_research_before_visual_effects`).
   - **Step 2** — Trace intent + context across affected cases. Use §10 framework to name what's happening.
   - **Step 3** — Classify the outcome:
     - **Path A — Convergence reveals system holds.** The divergence was apparent, not real. Document the trace as precedent (§15) for future similar checks. No change.
     - **Path B — Single-role / per-context divergence earns a sanctioned exception.** Add to §9 (sanctioned exceptions) with earning conditions + sanctioned use list. Pattern: META_VALUE · Container-earned primary composition · body-soft register.
     - **Path C — Combined application reveals the lock itself is wrong.** Surgical revision of the affected per-system lock; cascade-propagate the change. Pattern: ISe 32 escalation (Cycle 1) · IS 400 phantom-weight fix (Cycle 2) · italic register additions (Cycle 4) · body-tier ink ladder addition (Cycle 9 W1 reopen).
   - **Step 4** — Lock the resolution with anti-drift. Sanctioned uses listed. Earning condition explicit. Casual extension to new contexts requires a new cycle.
   - **Step 5** — Add to §15 precedent index — note which path the resolution took, so future similar divergences cite the correct protocol.
2. **Per-system lock(s)** — if Path B, append the sanctioned exception to the relevant per-system doc's exception policy / anti-drift section. If Path C, edit the lock itself (status line surgical revision note + new values).
3. **Apply** — propagate the resolution through Shell sites, locked labs, and any cross-references.

**Output:** A locked resolution to the divergence that future-Sebs (and future-AI) can cite as precedent.

This doc IS the primary lens. Without it, divergences get resolved ad-hoc and the system fragments over time.

---

### The default principle

If you are building anything that uses any locked system, **assume Workflow B by default.** That means this doc is consulted **before** the per-system locks, every time, even if the value lookup would feel faster. The reason: most building looks like a value lookup (Workflow A) only if you already know what role / register / composition applies. The framework in §10 is what tells you whether you know that or whether you're skipping a step.

When the framework tells you the role is settled and the registers apply by convergence — go to the per-system lock and grab the value. Fast path is still fast. But the framework gates it.

When the framework reveals something doesn't fit — switch to Workflow C immediately. Resolve the divergence per the protocol. Don't paper over with an ad-hoc value. The cost of papering over compounds; the cost of running the protocol once is paid back the first time someone else encounters the same divergence and finds the precedent already documented.

### Why "default consult this doc" and not "consult when stuck"

The cycles 1–9 history is the receipt. Most of the major surgical revisions (Cycle 1 ISe 32, Cycle 2 phantom-weight, Cycle 4 italic registers, Cycle 9 W1 reopen) came from problems that **only surfaced under combined application**. Each was a case of "the per-system lock looked correct in isolation, but the combination revealed the lock was wrong / incomplete." If the cycles had been running this doc as a default lens from the start, several of those would have been caught earlier — at the design stage, before the surface was assembled and the failure was documented.

This is not theoretical. The §08 closing takeaway was extended from the §09 T3 pattern in Cycle 8 *without* updating the lock — caught in Cycle 9 audit and widened to the formal "container-earned primary composition" lock with explicit earning conditions. That extension happened ad-hoc, was caught, and was formalized retroactively. If the operating manual had been in place, the extension would have triggered the outcome protocol at the moment of extension, not three audit-passes later.

The cost of running this doc as default is small (read time + framework application). The cost of skipping it is paid in the audit pass that catches the drift months later, plus the rework to clean it up.

---
## 3) Where the locks live (pointer index)

The per-system canonicals organized by category. Each system entry includes its category, one-line summary, canonical doc path, and when to consult it in your workflow.

**Category legend:**

- **A** — Value-to-role labs. Map concrete values to named roles. Bijection from `value → role`.
- **B** — Behavior-to-structure labs. Define modules / systems through behavior + structural rules. Interpretive definitions.
- **C** — Art / Expression lane. Operate within the structured chassis A+B provide. Bounded expression latitude.
- **D** — Hybrid / Joining. Sit across multiple axes — value + behavior + sometimes expression.

The category determines the extension profile when the system locks (see §14 for the full extension roadmap).

---

### Currently locked systems (Cycles 1–9 scope)

#### Category A — Value-to-role labs (locked)

| System | Owns | Canonical doc | When to consult |
|---|---|---|---|
| **Typography** | Three-font system (Clash · ISe · IS), scale ladder (10·11·13·15·18·22·32·52), weight rules, role narratives, controlled exceptions (CTA 12 · Proof 28 · compressed proof 22/15 · META_VALUE), italic registers (Pull quote · Subordinate aside · Inline emphasis), anti-drift | `typography-system.md` | Any work needing a register's locked size/weight/family/LH/tracking. Read first for type questions. |
| **Color (W1)** | 20-var W1 token contract (`--dir-bg` · `--dir-raised` · `--dir-recessed` · `--dir-muted` · `--dir-text-primary` · `--dir-text-body` · `--dir-text-body-soft` · `--dir-text-secondary` · `--dir-border` · `--dir-accent` · `--dir-detail` · `--dir-exception-*` · `--dir-cta-*` · `--dir-link-color` · `--dir-chip-*`), 5-stop ink ladder, semantic roles, surface depth ladder, exception zone, archive rule | `color-system-w1.md` | Any work needing a token value or semantic role. Read first for color questions. |
| **Spacing + Layout Rhythm** | Spacing scale (4·8·12·16·24·48·64·128 · plus 96 Break reserved), width map (Reading 680 · Standard 1120 · Wide 1280 · Shell 1440 · plus reading column ladder cross-axis at 340–920), density modes, rhythm rules, title→body 3-category system, 128 Transition section→section gap, eyebrow split (Type 1 · Type 2+3) | `spacing-layout-rhythm.md` | Any work needing a spacing token, a width container, or a rhythm pattern. Read first for spacing questions. |
| **Project Card System** *(A with some B aspects)* | Project card structural variants (Featured / Standard tiers · scan strategy · type tags · pill tags · card chrome), card-tier register choices | `project-card-system.md` | Any work building a project card or the work index. Tiers + scan strategy are the locked structure. |
| **Media / Prototype Presentation System** *(A with some B aspects)* | Media presentation rules — aspect variance, image treatment, prototype frame chrome, body image / final image width policies | `media-prototype-presentation-system.md` | Any work placing media (images, prototypes, body-zone artifacts, final/hero media). |

#### Category B — Behavior-to-structure labs (locked)

| System | Owns | Canonical doc | When to consult |
|---|---|---|---|
| **Case Study Module System** *(behavior + per-module specs)* | The 11-module case-study spine (M1 Hero+Thesis · §01 Founder Scan · §02 Problem+Stakes · §03 Discovery → Requirements · §04 Diagnosis · §05 Bet/Reframe · §06 Solution Walkthrough · §07 Decision Snapshots · §08 Trade-offs · §09 Outcomes · §10 Reflection), module job boundaries, handoff rules, repetition rule, evidence-progression rule, artifact-distribution rule, authorship rule, tone rule, public-vs-internal language rule, project-tier consistency rule, compression rule, hierarchy rule with reading-mode bucket composition (Cycle 5 lock) + container-earned primary composition (Cycle 9 lock) | `case-study-module-system-v2.md` + `case-study-modules/00-index.md` + `case-study-modules/01..11.md` | ALL case-study work. Read the relevant module's doc + §11 cross-module rules for every module instance. The per-module specs are the only authority for what each module does + must NOT become. |
| **Navigation System** *(B with A-axis label/type ladder)* | Six navigation layers (Global · Browse · Local · Progress · Utility · Footer), anti-conflict rules, label vocabulary, nav type ladder (IS-only · 10–13px · weight 500), grouped TOC architecture, state rules (opacity-driven · 0.55 / 0.80 / 1.0 + 2px left border), responsive breakpoints (Desktop / Tablet / Mobile), reduced-motion rules, edge cases (short page · long labels · rail release · first-section-align override) | `navigation-system.md` | Any work involving nav, TOC, progress indicator, back-to-top, mobile menu. Multiple lanes coexist; the spec carves the boundaries. |

---

### Pending Phase 1.5 systems (not yet locked)

The categorization here is predicted, not locked. Final category emerges from each system's lock cycle. Extension profiles per category live in §14.

#### Category C — Art / Expression lane (pending)

| System | Phase 1.5 # | Predicted scope |
|---|---|---|
| **Hero system** | #8 | Hero composition (image / motion / hero text register), hero density mode, hero-zone intent (page-entry register), hero geometry, TL;DR variants. Inherits Type + W1 + Spacing + CSML M1. |
| **Art artifact inventory** | #9 | Catalog of sanctioned art categories (marginalia · diagrams · stamps · annotations · authored marks), placement rules per artifact type. Bounded-expression rule lives here. |
| **Art placement map** | #10 | Where art lives in the page composition (page edges · margin rails · in-content insertions · cover marks). Boundary conditions: where art is allowed, where it is forbidden. |
| **Playground system** | #16 | Sandboxed surfaces for bounded experimentation. Pure-C — expression latitude maxed within an explicit boundary container. |
| **Easter egg system** | #17 | Rare-and-bounded surprises. Frequency rule, trigger rule, "rare not generic" anti-drift. Surfaces sanctioned only when bounded by spec. |

#### Category D — Hybrid / Joining (pending)

| System | Phase 1.5 # | Predicted scope |
|---|---|---|
| **Motion system** | #11 | A-like motion ladder (durations · easings · travel distances) + B-like state-transition contracts + C-like motion-as-voice. The heaviest extension to this manual when it lands (new intent dimension: motion as voice carrier). |
| **Animation vocabulary** | #12 | Named motions mapped to specific timings + curves + intent (clarify · reveal · reward · stagger · etc.). Catalog the Motion system references. |
| **Animation production pipeline** | #13 | Process / workflow doc, not a system per se. Asset production timing, AI-assisted vs handmade work, ownership boundaries. |
| **Voice / writing system** | #18 | **Special case.** Voice provides the intent vocabulary this manual's §10 framework references. When Voice locks, §10 + §11 get a major surgical revision because Voice supplies the concrete intent names per-section per-mode. Likely the most consequential single extension to this manual after Cycle 9 W1 reopen. |

#### Category B — Behavior-to-structure (pending)

| System | Phase 1.5 # | Predicted scope |
|---|---|---|
| **About page system** | #14 | About page composition, self-presentation intent (distinct from case-study spine intents), bio / authorship / contact placement, inheritance from Type + W1 + Spacing + Nav. |
| **Footer system** | #15 | Footer composition, subordinate restatement of primary routes (per Nav §3 Layer 6), contact / social links, external-link indicator. Quieter register than primary nav. |
| **Toolchain / production split** | #19 | Asset-production decisions — when AI-assisted vs handmade, what gets proof-asset vs final-asset, waves of production. Sits at the boundary between locked systems and content production. |
| **Accessibility / fallback system** | #20 | A11y constraints inherited by all systems (contrast minimums on Type / Color, focus-ring rules, keyboard / reduced-motion / screen-reader rules), fallback rules when a system fails or content is missing. |
| **Performance system** | #21 | Asset budgets, variable-font subsetting, image/video performance rules, motion performance bounds. Touches A (asset values) and B (behavior under degradation). |
| **Content governance / maintenance system** | #22 | How content updates over time, version cadence, archive rules, deprecation. Mostly meta-governance. |

---

### Bidirectional pointers — each lock points back

Every per-system canonical doc above carries a one-line pointer at the top of its status section:

> **Operating manual:** `cross-system-rules.md`. Read first when applying these tokens / registers / values to a new surface or resolving a divergence.

So whichever doc future-Sebs (or future-AI) opens first — this one or a per-system canonical — the relationship to the other layer is visible immediately. The integration is not implicit; it is explicitly cross-linked.

If a per-system lock doc is missing the operating-manual pointer at top, that is drift — add the pointer.

---
## 4) System foundation (Cycles 1–4)

The locked register family that every case-study surface composes from. **Six body buckets** were locked across Cycles 1–4 to handle every editorial role the case study uses. Plus one Body sub-bucket (Inline emphasis) and one Type-lock sanctioned exception (META_VALUE — full earning details in §9). All values are canonical in `typography-system.md`; this section is a compact reference + cascade earning rules.

### The 6 body buckets

| # | Bucket | Scale entry(ies) | Role | Cycle |
|---|---|---|---|---|
| 1 | **Title** | Section heading ISe 32 / 400 / LH 1.18 / −0.025em + Sub-section title ISe 22 / 400 / LH 1.25 / −0.02em | Section openers (ISe 32 at every § per Cycle 1 surgical revision 2026-05-07) + top-claim / sub-section headings (ISe 22 for second-tier story-shaped sub-units) | 1 |
| 2 | **Body** | Body IS 15 / 400 / LH 1.75 / 0 tracking + Dense Body IS 13 / 400 / LH 1.6 / 0 tracking | Main-flow body text. Dense variant fires in compressed-context only (cards · sub-grids · 1fr 1fr · raised-bg containers — see cascade earning below) | 2 |
| 3 | **Eyebrow** | IS 10 / 500 / LH 1.4 / 0.12em UC | §# section identifier · sub-section eyebrows · research-artifact labels · state-pills · row-meta labels · reflection block labels · metadata-label (in META_VALUE pairs) | 3 |
| 4 | **Row title** *(compressed-context only)* | IS 18 / 400 / LH 1.4 / −0.01em | Per-row openers in repeating list structures **where compressed register is structurally earned**. Narrow production use: §03 persona names (compressed quote-body context) · §09 Mode A T5 items (1fr 1fr earned). Most "row titles" actually use Sub-section ISe 22 — see cascade rules. | 3 |
| 5 | **Pull quote** | ISe 18 / 400 italic / LH 1.4 / −0.01em / 2px var(--dir-border) left rule + 16px indent + Block (24) margin top/bottom | Editorial pull quotes — verbatim user quotes, deeper-issue / thesis emphasis lines, evidence-block proof. Italic ISe is **scoped to this register only** — no other ISe italic permitted (Anti-drift Type §H). | 4 |
| 6 | **Subordinate aside** | IS 15 / 400 italic / LH 1.5 / `--dir-text-body-soft` (per Cycle 9 W1 reopen 2026-05-13 — was `--dir-text-secondary` pre-reopen) | Quiet body-size supporting text — §03 pattern close · §04 stakes · §06 "My move" lines · §07 catch · §10 reflection asides. Italic + softer body ink carries the "supporting narrative" register vs main-flow body. | 4 |

### Body sub-bucket

| Sub-bucket | Scale entry | Role | Cycle |
|---|---|---|---|
| **Inline emphasis** | IS 15 / 600 italic / matches surrounding body LH | Highest-emphasis inline phrases within body paragraphs. Italic + bold = 2 cues from default Body — single highest-emphasis register. Production use: §02 paragraph "didn't trust the output enough to iterate". | 4 |

Inline emphasis is a Body sub-bucket, not a standalone bucket — it lifts a fragment within a Body paragraph rather than carrying its own line. Sanctioned only for inline use (anti-drift: never as standalone register, eyebrow, label, or heading replacement).

### Cascade earning rules (flag #37, locked 2026-05-07 with 2026-05-09 Mode B revision)

The Row title (IS 18/400) and Dense Body (IS 13/400) compressed registers are **earned**, not asserted. The earning principle is **structural, not labeled** (per flag #43 surgical revision 2026-05-09).

**Structural conditions that earn compressed register:**

- **1fr 1fr sibling layout** (two side-by-side columns of equal weight applying horizontal pressure)
- **Sub-grid pattern** (a child grid inside a parent grid — applies sub-row compression)
- **Card-shape container** (raised-bg + padding + radius bounding a content unit — `var(--dir-raised)` ground)
- **Recessed-bg container** (`var(--dir-recessed)` ground — same card-shape earning condition with quieter ink role)

**Labels alone do NOT earn compressed register.** A CAPS eyebrow or state-group title naming a content section does not by itself compress the content beneath it. Only structural pressure (horizontal squeeze or bounded container) earns compression.

**Example: §09 Mode A vs Mode B** (flag #43 case)

In §09 Outcomes:
- Mode A T5 "Team-Wide Leverage / Defined & In Development" earns compressed register via **1fr 1fr siblings** (`GateAIonR1Shell.tsx :2383` — two side-by-side state groups). Mode A T5 items can render at IS 18/400 + Dense 13.
- Mode A T6 + Mode B "What Still Needs Measurement" footers earn compressed register via **1fr 1fr metadata sub-grid + recessed-bg container** (`:2410, :2508`). The combination earns compressed items at Dense 13.
- **Mode B item rows** (Shipped / Prototyped & Enabled / In Development state groups in Mode B) do NOT earn compressed register — stacked single-column with no horizontal pressure. Per flag #43 path-a resolution, Mode B items use Sub-section register (ISe 22 + Body 15), not Row title (IS 18 + Dense 13).

This is the receipt for the structural-earning rule. Same module, same labels, same content type — different structural pressure produces different earned register.

### Italic anti-drift (Type §H locks)

The Cycle 4 surgical revisions opened italic for two scoped registers ONLY:

- **ISe italic SCOPED to Pull quote register only.** Never at 22 / 32 / any other size. Never for headings / body / non-pull-quote contexts. Outside Pull quote, ISe stays upright.
- **IS italic SCOPED to body inline emphasis (when paired with weight 600) + Subordinate aside register (weight 400 + body-soft color).** Never as standalone register, eyebrow, label, or heading replacement. Never in classification / metadata roles.

Crossing the italic scopes is drift — the system catches it because italic is otherwise forbidden everywhere.

### Cycle 1 surgical revision context — ISe 32 escalation

Section heading was originally ISe 22 (Cycle 1 initial lock). Cycle 3 cascade work (flag #37) surfaced an 18-vs-15 closeness problem — needed a tier above ISe 22 to handle multi-tier nesting in §03 / §06 / §07 / §08 / §09. **Surgical revision 2026-05-07:** Section heading promoted to **ISe 32** (Editorial Intro Heading register, reactivated from "no live use" reserved status). ISe 22 (formerly Section heading) was **displaced** to carry the section's top claim + sub-section title roles. Cascade rebuilt across §01–§10 via `replace_all`.

This is the canonical **Path C (systemic revision)** precedent — see §12 Outcome Protocol. Multiple sections traced under composition pressure revealed the lock value itself was wrong; the fix was to re-lock the register, not to add an exception.

### Cycle 2 surgical revision context — IS 300 → 400 phantom-weight

Cycle 2 originally locked Body / Dense Body / Caption / proof numerals at IS 300 Light. Cycle 3 cascade work surfaced the discovery: Google Fonts does not ship Instrument Sans 300. Browsers silently fell back to 400. **Surgical revision 2026-05-07:** Spec updated to IS 400 across all references. No visual change — rendering was always 400 via fallback. Spec accuracy fix.

This is a second **Path C (systemic revision)** precedent — Type lock was wrong, system-wide correction applied.

### Cascade table (flag #37, locked 2026-05-07 · Mode B revision 2026-05-09)

The post-Cycle-3 cascade table covers what register fires for each role across the case study. Canonical detail in `typography-system.md` §D Role Map. Compact reference:

- Section heading ISe 32 (every § opener)
- Top claim ISe 22 · Sub-section title ISe 22 (story-shaped sub-units — §03 insight titles · §06 step titles · §07 decision titles · §08 trade-off titles · §09 Mode B item rows per flag #43 path-a)
- Body IS 15/400 (main-flow body)
- Dense Body IS 13/400 (compressed-context only per cascade earning)
- Eyebrow / metadata layer label IS 10/500/UC (§# · sub-section eyebrows · CAPS labels)
- §09 Mode A block labels IS 10/500/UC (preserves certainty ladder per CSML §09 lines 55–61)
- Row title IS 18/400 (narrow earned compressed-row use only)
- Pull quote ISe 18 italic (Cycle 4 scoped)
- Subordinate aside IS 15 italic / body-soft color (Cycle 4 scoped + Cycle 9 W1 reopen color update)
- Inline emphasis IS 15/600 italic (Cycle 4 sub-bucket of Body)
- Card title IS 18/600 (Sub-heading register — for project card titles, distinct from Row title's IS 18/400)
- Card framing IS 13
- Card eyebrow IS 10/UC

### Where to drill next

For any specific register's canonical scale entry (size · weight · LH · tracking · case), go to `typography-system.md` §B Locked Scale Table. For role narratives + usage rules, `typography-system.md` §D Role Map. For controlled exceptions (CTA · proof numerals · compressed proof variants · META_VALUE), `typography-system.md` §F Exception Policy. For anti-drift, `typography-system.md` §H.

Cycle 5 reading-mode bucket composition (which buckets fire in which mode) is §5 of this doc + canonical in `case-study-modules/11-cross-module-rules.md`.

---
## 5) Reading-mode bucket composition (Cycle 5)

Cycle 5 locked the **4-mode × 6-bucket composition table** as a sub-section of CSML §11 Hierarchy Rule. The principle: a case study moves through four distinct reading modes, and each mode is expressed by **which body buckets fire** and **how layered the composition gets** — **not** by changes to spacing values, color, or new registers per mode. The 6 body buckets (§4) propagate uniformly across modes. What shifts is composition heaviness + bucket selection.

### The 4 reading modes — locked mapping

| Mode | Sections | What the mode does |
|---|---|---|
| **Framing** | §01 Founder Scan · §02 Problem + Stakes | Sets context · creates pressure |
| **Interpretation** | §03 Discovery → Requirements · §04 Diagnosis · §05 Bet / Reframe | Translates research · corrects · states directional move |
| **Proof** | §06 Solution Walkthrough · §07 Decision Snapshots · §08 Trade-offs / What We Cut | Shows the work · shows judgment · shows restraint |
| **Resolution** | §09 Outcomes / Scoreboards · §10 Reflection | Shows mixed-state truth · shows sharpened thinking |

Mode boundaries are CSML §11 canonical — `case-study-modules/11-cross-module-rules.md` lines 354–376.

### Composition character per mode

Each mode has a distinct composition signature:

| Axis | Framing | Interpretation | Proof | Resolution |
|---|---|---|---|---|
| **Layering depth** | Shallow (1–2 levels) | Deep (3+ levels nested) | Structured (2–3 levels + heavy containers) | Flat (1–2 levels) |
| **Structural containers** (cards · 1fr 1fr · sub-grids · recessed-bg) | Minimal (§01 meta-strip only) | Selective (persona 1fr 1fr · ruby-guardrails sub-grid) | Heavy (step cards · decision dossier · sub-grids · 2-col compressed) | Earned in §09 only (Mode A T5 / T6); §10 flat |
| **Pace** | Slower · atmospheric — sets stakes | Layered · analytical — accumulates evidence | Concrete · scannable — shows the work | Synthesizing · lifting — closes the loop |
| **What earns the eye** | Section heading + atmospheric pull-quote moment | Multi-tier nesting + persona / research callouts | Structural artifacts (cards · ledgers · sub-grids) + state pills | Narrative outcome headline + state-group certainty ladder |

The composition character is the **how it reads** of each mode — not the register values, which stay uniform.

### Bucket composition table (compact reference)

Which buckets fire in which mode. Canonical full table with all anti-patterns is in `case-study-modules/11-cross-module-rules.md` lines 378–425. Compact below:

| Bucket | Framing | Interpretation | Proof | Resolution |
|---|---|---|---|---|
| **Section heading (ISe 32)** | ✓ | ✓ | ✓ | ✓ |
| **Sub-section title (ISe 22)** | top claim only | multi-tier (2–3 layers nested) | multi-tier (step / decision / trade-off titles) | top claim + minimal sub-section |
| **Body (IS 15/400)** | ✓ main-flow, longer paragraphs | ✓ main-flow, broken by sub-sections | ✓ shorter, paired with structural containers | ✓ synthesizing, brief |
| **Eyebrow (IS 10/UC)** | §# + minimal block labels | §# + sub-section eyebrows + research-artifact labels | §# + state-pills + decision-row labels + sub-block eyebrows | §# + state-group labels + reflection block labels |
| **Row title compressed (IS 18/400)** | — | ✓ §03 persona names (1fr 1fr + card-shape earned) | ◐ where 1fr 1fr / sub-grid earns it | ◐ §09 Mode A T5 (1fr 1fr earned). Mode B path-a uses Sub-section register (flag #43) |
| **Pull quote (ISe 18 italic)** | ✓ §02 atmospheric blockquote | ✓ §04 deeper-issue line | ◐ §07 Proof 1 (Body × Proof state pairings) | — |
| **Subordinate aside (IS 15 italic / body-soft)** | — | ✓ §03 pattern close (section-closing aside) | ✓ §06 "My move" · §07 catch | ✓ §10 closer / reflective asides |
| **Inline emphasis (IS 15/600 italic)** | ◐ §02 stress points within paragraph | ◐ within prose sparingly | — (compressed contexts don't earn italic+bold) | ◐ closing summary statement |

Legend: ✓ required · ◐ optional / earned-when-content-warrants · — not used in this mode.

### What stays the same across all modes (the spine)

- All 6 body buckets are the same registers — **no new registers per mode**
- Spacing rhythm uniform (Cycle 6 lock — one density mode for the whole case study per coherent-state rule)
- W1 color palette uniform (no per-mode color emphasis)
- Section heading register ISe 32 fires at every section opener
- Eyebrow gap system uniform: Type 1 §# section identifier gap (locked tight = 4) + Types 2+3 mini-title gap (locked compact = 12)

### What shifts naturally between modes (the arc)

- Composition heaviness — Framing light → Interpretation layered → Proof structured → Resolution synthesizing
- Which optional buckets fire — Pull quote heavy in Framing / Interpretation, Subordinate aside heavy in Interpretation / Proof / Resolution
- Structural-container density — Proof heaviest, Framing lightest
- Multi-tier nesting depth — deepest in Interpretation, flattest in Framing / Resolution

### Anti-patterns — what NOT to do to express mode shift

These are locked rejections. They surfaced in cross-system audit and are explicit anti-drift rules:

- **Different spacing per section** — explicitly rejected. Cycle 6 / coherent-state rule locks ONE density mode for the whole case study. If a section "feels heavier" the mode arc + bucket composition does the work, not per-section spacing variance.
- **Color as a per-section emphasis device** — rejected. W1 palette is uniform across all modes. Emphasis lives in typography + spacing + content weight + composition heaviness, never per-section color shift.
- **Oversized "star moment" titles for specific sections** — rejected. Every section already gets ISe 32 via Cycle 1 surgical revision. Per-section title size variance would be custom register territory (Cycle 7) and must be **earned** via documented per-module CSML mandate, not asserted.
- **New registers introduced per mode** — rejected. Modes compose existing buckets differently; they do not introduce new registers. Custom registers per Cycle 7 are per-module (§05 ops 2×2 · §07 accordion · §09 primary outcome · §09 future-layer-last), not per-mode.

### Mode shift expresses through composition, not register

The system principle: a §02 Problem opening and a §10 Reflection opening both use ISe 32 / text-primary at the same Cat 1 spacing. What makes §02 read as "pressuring" and §10 as "reflective" is:

- The mode they're in (Framing vs Resolution)
- The bucket composition surrounding the title (§02 may have an atmospheric Pull quote next; §10 likely has a Subordinate aside closing)
- The content's intent + voice (Voice system #18 owns this)
- The reader's accumulated state from sections before (intent + context from §10 framework)

The register value is identical; the **behavior** that emerges from intent + context + composition is different. This is the core thesis the operating manual articulates — §10 unpacks it formally.

### Where to drill next

Canonical reading-mode bucket composition lock: `case-study-modules/11-cross-module-rules.md` lines 378–425 (the Cycle 5 sub-section "Reading-mode bucket composition" beneath the Hierarchy rule).

For why each mode's character is what it is — the CSML §11 narrative sections "What stays the same across all modes (the spine)" + "What shifts naturally between modes (the arc)" + the anti-patterns list.

For per-section job boundaries (what each § must do, must NOT become): `case-study-modules/01..10.md` per-module specs.

---
## 6) Spacing rhythm + density + composition axes (Cycle 6)

Cycle 6 locked four interlocking pieces: **one density mode for the whole case study** · **three-category title→body system** · **128 Transition section→section gap** · **eyebrow gap split (Type 1 vs Types 2+3)**. The principle: spacing carries rhythm; mode shifts express through composition heaviness + bucket selection (§5), NOT through per-section spacing variance. All values canonical in `spacing-layout-rhythm.md`.

### Density mode — coherent-state rule

**One density mode for the whole case study.** Standard density locked for Ion (Cycle 6 Q1). Per-module density variance is rejected (flag #5 / coherent-state rule); a section that "feels heavier" expresses that through bucket composition + content weight, not by switching density mode. Hero density A/B (Standard / Airy) tested in Cycle 6 — Airy hypothesis was tested and rejected as not producing meaningful read-difference for this hero; toggle kept for future revisit but does not represent a sanctioned per-section variance.

### 3-category title→body system

| Cat | Token | Value | Pairing |
|---|---|---|---|
| **Cat 1 — Section opening** | Block | **24** | Section heading (ISe 32) → first body paragraph. Applies to §02 / §04 / §05 / §06 / §09 outcome headline / §10. |
| **Cat 2 — Sub-section opening** | Tight | **12** | Sub-section title (ISe 22) → body. Applies to §03 insight title, §06 step title. |
| **Cat 3 — Row title topic+answer tight pair** | Micro | **4** | Compressed-row label → answer. Applies to §07 decision row, §09 Mode B item row (per flag #43 path-a), §05 Ruby Guardrails item row (Cycle 7 Q1 lock). |

The Cat 3 row tight pair is **earned**, not asserted (cascade earning rules per §4 — structural conditions only). Three sanctioned production uses; no casual extension to other contexts.

Earlier proposed "head + framing tight pair" sub-category at 16 was collapsed during Cycle 6 close: 8px difference vs default 24 was perceptually marginal and read as drift, not editorial pairing. §09 Mode A T1 and Mode B narrative headlines bumped 16 → 24 to fit Cat 1.

### 128 Transition (section→section gap)

| Relationship | Token | Value | Layout |
|---|---|---|---|
| **Section → next section** | **Transition** | **128** | Split as **64 / 64** around the centered section divider. `secWrap` paddingTop 64, paddingBottom 0 (non-last sections) or 64 (last section). `sectionDividerEl` marginTop 64. |

128 was promoted from "Reserved · not in use" in `spacing-layout-rhythm.md` to its locked role as Transition gap (sanctioned 2026-05-11). Multi-pass arrival: 96 (Break-tier) violated Break rules · 64 (Hero, 32/32) too tight · 128 (64/64) fits — on-ladder, not Break-tier, no longer Reserved. 48 (Section within-section) and 64 (Hero within-hero) didn't have enough room for between-section transitions; 80 / 96 are Break tier (rare-only). 128 fills the gap.

### Eyebrow gap split (Type 1 vs Types 2+3)

Cycle 6 surfaced two distinct eyebrow contexts that need different gaps:

| Type | Context | Token | Value |
|---|---|---|---|
| **Type 1 — §# section identifier** | Section opener's eyebrow (§01 / §02 / etc.) → section title (ISe 32) | `sectionNumberSpacing` → tight | **4** (Micro) |
| **Types 2+3 — Mini-title eyebrow** | Sub-section eyebrow / metadata-block eyebrow / state-pill → following content | `eyebrowChunkGap` → compact | **12** (Tight) |

Two independent toggles control these contexts in code. Cycle 8 §06 audit applied this split surgically (4 step eyebrows in §06 converted from inline `fontSize: 11 / marginBottom: 12 hardcoded` to `{...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap]}`).

### Composition axes — mode / tier / state

Cycle 6 also locked the composition axes language for how rhythm follows from composition pressure:

- **Mode axis** — Framing / Interpretation / Proof / Resolution (Cycle 5). Determines which buckets fire; spacing rhythm uniform across modes.
- **Tier axis** — within §09 the certainty gradient (T1 Outcome headline → T2 framing → T3 primary outcome → T4 support → T5 lower support → T6 future-layer-last). Locked in Cycle 7 Q3.
- **State axis** — §07 accordion (collapsed / expanded). Locked in Cycle 7 Q4 as the only sanctioned narrative-content interaction in the case study.

### Cycle 9 W1 reopen impact on spacing

The W1 reopen surgical revision (2026-05-13) removed the **§07 chosen → summary 16 Compact** spacing hack that was the interim solution for flag #42 (body→body sub-line scan differentiation). Color axis now carries the chosen↔summary register differentiation via `--dir-text-body-soft`. Chosen→summary reverts to BODY's natural LH 1.75 stacking — no explicit gap. This is the canonical receipt that **spacing hacks for register differentiation get retired when the register axis becomes available**: the cleaner answer was always color; spacing was the workaround per flag #42 because color was forbidden by Cycle 2 / flag #32 pre-reopen.

### Open spacing flag — flag #18

Flag #18 (Width Map gap — sebs preset 840px) was resolved 2026-05-12 as **scope distinction**: page Width Map (`spacing-layout-rhythm.md` §B — 680 / 1120 / 1280 / 1440 page-shell containers) is a different axis from the reading column ladder (`GateAIonTextColumnWidthContext.tsx` — 11 research-grounded text column widths 340–920). Both sanctioned at their respective layers. Cross-reference note added to `spacing-layout-rhythm.md` §B.

### Where to drill next

Canonical spacing scale + width map + density modes + rhythm rules: `spacing-layout-rhythm.md`. Body→body paragraph rhythm (24 Block) lock: flag #49 detail in `cross-system-rules-build-plan.md`. Eyebrow gap split implementation: search Shell for `sectionNumberSpacing` and `eyebrowChunkGap` context references.

---

## 7) Customs — per-module sanctioned exceptions (Cycle 7)

Cycle 7 closed four customs that the cycles 1–6 audit surfaced as needing per-module sanction. Each custom is a register / composition / interaction that's sanctioned ONLY for the specific module + earning condition documented. The principle (locked Cycle 7 Q4 close): **interaction axes and per-module register exceptions are sanctioned per-module via Cycle 7-style customs, not assumed or extended.** Cycle 9 audit verified all 4 customs remain bounded.

### Custom 1 — §05 ops blocks (Ruby Guardrails 2×2 grid)

**Module:** §05 Bet / Reframe (Ion's "Ruby Guardrails")
**Lock:** Cycle 7 Q1 Phase B (2026-05-12)

**Pattern:** 4 operating-principle items rendered as **Cat 3 row tight pair** (ISe 22 title + Body 15 desc + 4 Micro gap), layered into a **1fr 1fr grid** (2×2 layout — A/B-tested with stacked flex column variant).

**Earning condition:** Operating-principle content (short labeled rules, ~4 items, half-column desc fits). The 2×2 grid earns compressed-cluster reading via 1fr 1fr structural pressure + 4-short-item symmetry. The locked production state is **2×2 grid** (Ruby Guardrails — 4 rules: Clarify before acting · Show reasoning · Preserve user work · Admit uncertainty); stacked flex retained as toggle off-state.

**Sanctioned use:** §05 only — operating-principle / contract-terms content type.

**Anti-drift (Cycle 9 audit verified):** The 2×2 grid + Cat 3 row tight pair signature does NOT appear elsewhere in the Shell. Cat 3 row tight pair (4 Micro gap) appears in 3 sanctioned contexts only — §05 ops, §07 decision rows, §09 Mode B items per flag #43 path-a. No proliferation.

**Plus:** §05 Before/After interaction model converted to **artifact placeholder pattern** per CSML §05 line 306-307 ("interaction model / before-after diagram" sanctioned artifact support). Drops the earlier DENSE-fontSize-11-dir-detail drift entirely.

### Custom 2 — §09 Primary outcome statement → Container-earned primary composition (widened Cycle 9)

**Module:** §09 Outcomes / Scoreboards (T3 tier — primary outcome statement)
**Lock:** Cycle 7 Q2 Path A (2026-05-12) · Widened Cycle 9 (2026-05-13) to general composition lock

**Pattern:** **Body 15 / `--dir-text-primary` in raised-bg container** (`var(--dir-raised)` background, padding 16, borderRadius). The container alone earns "primary" via cascade card-shape condition; type-axis stays Body 15 to (a) avoid competing with T1 ISe 32 outcome headline, (b) preserve same-voice continuity with T2 framing line, (c) avoid pulling Pull quote register (Cycle 4 scoped) into §09.

**Cycle 9 widening:** Cycle 8 §08 surgical fix had independently applied the same composition to §08 closing takeaway (CSML §08 line 120–134 "stronger summary strip" mandate). Cycle 9 audit caught the extension and widened the lock from "§09 T3 only" to the general **Container-earned primary composition** lock with §09 T3 + §08 takeaway as the two current sanctioned uses. Locked in `case-study-modules/11-cross-module-rules.md` "Container-earned primary composition" sub-section.

**Sanctioned uses (post Cycle 9 widening):**
- §09 T3 — Primary outcome statement (CSML §09 lines 65–67 mandate)
- §08 — Closing takeaway (CSML §08 lines 120–134 mandate, Tier 1 / Heavy projects)

**Earning conditions (all must hold):** CSML mandate for the role · role is anchor or summary-strip · container is the only structural signal (no borderTop / off-ladder type / color shift) · position matches the role.

**Anti-drift:** Do NOT use the composition for arbitrary body paragraphs that "should feel important." Do NOT layer additional structural signals (borderTop / off-ladder type / weight shift / color shift) — the container is the signal. Do NOT invent a new type-axis register to "feel primary" — see Typography §H anti-drift back-pointer. New role claims must surface as flags (the way §08 did in Cycle 8) and either fit earning conditions or earn separate sanctioned exception via a new cycle.

### Custom 3 — §09 Future-layer-last (position + composition + certainty gradient)

**Module:** §09 Outcomes / Scoreboards (T6 / footer tier)
**Lock:** Cycle 7 Q3 Path B (2026-05-12)

**Three sub-locks:**

**(a) Position rule.** Per CSML §09 lines 103–110 + 203–213, the measurement block is always LAST in §09 (both Mode A + Mode B). The locked hierarchy reads strongest-present-truth → weakest-or-future-truth: Intro family → Primary proof → Support layer → Secondary layer → Future layer. Position rule is structural — moving measurement higher would lie about certainty.

**(b) Footer composition.** Sanctioned canonical treatment combining: last position in module · `var(--dir-recessed)` background (quieter than raised-bg / plain-bg, signals lower certainty via color tier) · `var(--dir-border)`-radius padded card-shape (earns compressed register per cascade card-shape condition per flag #43) · 1fr 1fr metadata sub-grid (earns Dense 13 per cascade horizontal-pressure condition) · CAPS eyebrow + mini-title gap (the structural label "What Still Needs Measurement"). This combination IS the locked "future-layer footer" composition — not a single register but a sanctioned composition pattern per CSML §09 line 197 mandate.

**(c) §09 certainty-gradient hierarchy.** Intro family → Primary proof → Support → Secondary → Future. The gradient reads strongest-to-weakest certainty. Order is locked; reordering would compromise the §09 mixed-state truth mandate.

**Sanctioned use:** §09 only — Mode A T6 (`GateAIonR1Shell.tsx :2410`) and §09 Mode B footer (`:2508`). Same canonical composition both modes per CSML §09 line 110.

**Anti-drift (Cycle 9 audit verified):** The composition (recessed-bg + Dense 13 + 1fr 1fr + CAPS eyebrow + last position) appears only in §09 Mode A T6 + §09 Mode B footer. Certainty-gradient hierarchy is §09-internal; no other module attempts a similar gradient. Recessed-bg as a token has a separate sanctioned use (media tray pattern at §05 / §06 step media slots / §09 narrative anchor image) which doesn't conflict with the future-layer footer composition. No proliferation.

### Custom 4 — §07 Accordion (narrative-content interaction axis)

**Module:** §07 Decision Snapshots
**Lock:** Cycle 7 Q4 (2026-05-12)

**Three sub-locks:**

**(a) Accordion as canonical interaction pattern for §07** per CSML §07 line 154: "The accordion is the final interaction pattern." §07 is the **only narrative-content interaction in the case study**; all other modules render static.

**(b) First-open-by-default production rule** per CSML §07 line 156. Implemented at `:394` via `useState<number | null>(1)` — decision id=1 opens on load, others collapsed. Not a toggle, not user-state-persisted; fresh on every load.

**(c) Collapsed-must-carry-value rule** per CSML §07 lines 165–166: "The section should not require interaction for basic understanding. The collapsed rows already need to carry real value." Collapsed state renders title + chosen + summary (post Cycle 9 W1 reopen: chosen at `--dir-text-body`, summary at `--dir-text-body-soft` — color axis carries the register differentiation per §4 + §9). Expanded state adds Why → My move + What it changed → optional catch.

**System principle (locked Cycle 7 Q4, broader than §07):** Interaction axes are sanctioned **per-module** via Cycle 7-style customs, **not assumed or extended**. Future stateful interactions (e.g., §06 step animations, media zoom, etc.) each need their own custom lock — they do NOT inherit §07's accordion sanction.

**Sanctioned use:** §07 only.

**Anti-drift (Cycle 9 audit verified):** §07 is the only narrative-content interaction. Other useState instances in the Shell are either lab A/B toggles (separate axis — lab chrome, not module-narrative) or Navigation hover / scrollspy / back-to-top (Navigation system locked). No `<button>` / `onClick` / `useState`-driven open/close pattern in any other §. No proliferation.

### Where to drill next

Canonical custom locks: `case-study-modules/05-bet-and-reframe.md` (§05 ops blocks) · `case-study-modules/07-decision-snapshots.md` (§07 accordion) · `case-study-modules/09-outcomes-and-scoreboards.md` (§09 primary outcome + future-layer-last). Container-earned primary composition (Cycle 9 widening): `case-study-modules/11-cross-module-rules.md` Container-earned primary composition sub-section.

---

## 8) Cohesion at 4 zoom levels (Cycle 8)

Cycle 8 verified that the cross-system rules locked across Cycles 1–7 hold at four zoom levels in both directions — top-down (outside → in) and bottom-up (inside → out). The principle: a coherent system must hold at every zoom level, not just at the lock layer. Cycle 8 closed 2026-05-12 with the system verified + 18 surgical fixes applied across the section bodies.

### The 4 zoom levels

**Zoom 1 — Within-module.** Each module's internal cohesion: header pattern (SHPair Eyebrow + Title) · body buckets fire per CSML mandate · spacing rhythm uniform (Cat 1 / Cat 2 / Cat 3 + Body→Body 24) · register cascade holds. Cycle 8 ran full audits of §01 + §08 + §10 (never previously audited explicitly), §06 surgical drift cleanup, and §02/§03/§04/§05/§07/§09 re-verify passes. 18 surgical fixes applied (body→body 16→24 paragraph rhythm in §01+§04 · §01 contribution topBorder 32→24 · §06 4 step eyebrows replace_all IS 11→IS 10 with CAPS const + chunk-gap toggle · 6 stale comments cleared · §08 closing takeaway register fix to match §09 T3 pattern · §10 inline eyebrow→CAPS const · §04 stakes converted to Subordinate aside per §03 pattern).

**Zoom 2 — Between-modules.** Section transitions: 10 section transitions verified uniform (128 Transition gap, centered divider, last-section flag on §10 only). Reading-mode arc Framing → Interpretation → Proof → Resolution verified per Cycle 5 lock; mode shifts express via composition heaviness, no register breaks. Both directions hold (§01 → §10 narrative arc + §10 → §01 reading-back coherence).

**Zoom 3 — Between-case-studies (principle check).** System content-shape-independent at lock layer (registers + spacing + buckets + customs all transfer). Ion-specific content lives at content layer correctly. **Structural completeness gaps flagged for when 2nd case study builds:** weight variations per module (Heavy / Medium / Light) not implemented (Ion = Heavy across all modules); §05 Ruby Guardrails 2×2 grid assumes 4-short-item shape (toggle preserves escape for other shapes); §06 + §08 architectural rebuilds needed before clean transfer to a second case study (flags #45 / #52). Full cross-case verification deferred until 2nd case builds.

**Zoom 4 — Site-level (partial).** Shared register system + W1 palette + nav + spacing tokens cohere across homepage + case study. Homepage → case study Airy → Standard density seam sanctioned per locked spec. Tone arc (identity → hook CD → section ISe → prose IS) holds. **Visual jolt-test of homepage → case-study handoff remains as user-eye verification** (flag #3 — programmatic audit done; visual verification pending). Project index / About / Project cards full cross-check deferred to Gate B applied-surfaces depth pass.

### Cohesion principle — system must hold in both directions

A system that holds top-down (locks → application) but not bottom-up (composition → coherence) is incomplete. Cycle 8's verification ran in both directions at each zoom:

- **Top-down:** does each locked rule produce the right outcome when applied? (Mode arc fires correctly per section · registers fire per cascade · spacing tokens fire per rhythm · custom earning fires per condition.)
- **Bottom-up:** does the composed surface read as a coherent system? (Same module read from §01 → §10 vs §10 → §01 should hold · cross-module transitions feel like one continuous argument · register cascades don't break under composition pressure.)

Cycle 8 confirmed both directions hold for Zooms 1–2. Zoom 3 verified at principle layer (system is content-shape-independent); awaits 2nd case study build for full cross-case verification. Zoom 4 partial — site-level audit programmatically clean, visual user-eye verification queued (flag #3).

### Resolved flags from Cycle 8 surgical pass

#44 §06 step eyebrow drift · #49 body→body 16→24 paragraph rhythm · #50 §01 topBorder asymmetric → symmetric · #51 §01 stale comment · #53 §08 closing takeaway register fix · #54 §08 stale comment · #56 §10 inline eyebrow → CAPS const + stale comment · #57 §06 stale comment · #61 6 stale-comment family.

### Deferred from Cycle 8 to downstream work

Logged for later cycles / module rebuilds: #45 §06 Body × Proof state pairings (architectural rebuild scope) · #48 META_VALUE de-facto register (sanctioned in Cycle 9) · #52 §08 trade-off rows pattern off-CSML-spec (architectural rebuild scope) · #55 §10 placeholder title (content work) · #58 §01/§03 IS 11/UC outliers (re-verify in respective scopes) · #59 §03 alt direction variants (persona track Phase A) · #60 §01 TLDR variants (hero zone audit).

### The cohesion principle as an operating manual rule

The 4-zoom verification is now a **default audit pattern**. When any new system locks (Hero, Motion, Voice, etc.), the operating manual recommends running a 4-zoom cohesion pass to verify the system holds at each zoom level. This is the standard post-lock audit. Reading-mode bucket composition checks live at Zoom 2; spacing rhythm checks at Zoom 1; cross-case checks at Zoom 3 (when 2+ cases exist); site-level checks at Zoom 4 (when site assembly exists).

### Where to drill next

Cycle 8 close detail + 18 surgical fixes detail: `cross-system-rules-build-plan.md` Cycle 8 row + resolved flag entries. CSML §11 reading-mode bucket composition lock + cohesion-rule narrative: `case-study-modules/11-cross-module-rules.md`. For project-tier consistency rule (Zoom 3 axis): `case-study-modules/11-cross-module-rules.md` Project-tier consistency rule section.

---
<!-- §7 — Customs (Cycle 7 per-module exceptions) · pending draft -->
<!-- §8 — Cohesion at 4 zoom levels (Cycle 8) · pending draft -->
## 9) Sanctioned register exceptions (Cycle 9 + W1 reopen close)

Cycle 9 closed with **four sanctioned register / composition exceptions** to the Cycles 1–6 locks. Each was earned through documented implementation surface failure on `/gate-a/ion/r1`; each has explicit earning conditions; each has anti-drift; each fits the outcome protocol (§12) at either **Path B** (single-role / per-context exception) or **Path C** (systemic revision of a locked value).

Quick summary table:

| # | Exception | Type | Outcome path | Canonical lock |
|---|---|---|---|---|
| 1 | **META_VALUE register** | Type-axis exception | **Path B** (single-role) | `typography-system.md` §F Exception Policy |
| 2 | **Container-earned primary composition** | Composition exception | **Path B** (widened from §09-only to general lock) | `case-study-modules/11-cross-module-rules.md` Container-earned primary composition section |
| 3 | **`--dir-text-body`** | W1 ink-tier addition | **Path C** (systemic revision — body register shifts globally) | `color-system-w1.md` §B Token System |
| 4 | **`--dir-text-body-soft`** | W1 ink-tier addition (per-role) | **Path B** (single-role scoped to body-size supporting text) | `color-system-w1.md` §B Token System |

---

### Exception 1 — META_VALUE register *(Cycle 9 close 2026-05-12 · Path B)*

**Pattern:** Dense Body 13 (IS 400 / 13 / LH 1.6) with color overridden from `--dir-text-primary` (locked Body color) to `--dir-text-secondary`. Not a new font size; not a new family; the type-axis stays on the locked Dense Body register. The exception is **color slot only**.

**Earning conditions (all must hold):**
1. Content is a **metadata value** — not narrative body
2. Paired with an **IS 10/UC eyebrow / metadata-label** (the value half of a label/value pair)
3. Container is **structurally bounded** — metadata strip / sub-grid / dedicated metadata panel, not a free-floating paragraph in main-flow

**Sanctioned uses:**
- §01 Founder Scan facts band (`GateAIonR1Shell.tsx :1007 / :1049` — project-details metadata grid)
- §03 Discovery Methods/Artifacts metadata blocks (`:1163, :1219, :1226`)

**Anti-drift:** Text-secondary on Dense Body 13 is sanctioned ONLY for the metadata-value role under the earning conditions above. Do NOT use the pattern for narrative body, callouts, asides, or any other softer-body need. Per flag #41 lock, softer-than-default body renders are earned as sanctioned exceptions per role — not by unlocking the locked body ink.

**Outcome path classification:** **Path B** — single-role exception. The Body / Dense Body locks remain unchanged for narrative use; the exception fires only when the metadata-value role earning conditions hold.

**Why this is an exception, not a revision:** The locked body ink (Cycle 2 / flag #32) is correct for narrative body. Metadata values are a different role — they pair with an eyebrow label at a scan-tier reading level. A documented failure surfaced this role; the resolution earned a per-role exception rather than unlocking the body color.

---

### Exception 2 — Container-earned primary composition *(Cycle 7 Q2 origin 2026-05-12 · widened Cycle 9 2026-05-12 · Path B widened)*

**Pattern:** **Body 15 / `--dir-text-primary` in raised-bg container** (`backgroundColor: var(--dir-raised)`, padding 16, borderRadius). The raised-bg card-shape earns the "primary feel" cascade condition per flag #43's earning principle ("earning compressed register is structural, not labeled" — same principle, applied to "primary feel" instead of "compressed feel"). Type stays on-ladder; the container does the structural elevation.

**Cycle history:** Cycle 7 Q2 Path A originally locked this as the §09 T3 primary outcome statement pattern (single-use). Cycle 8 §08 surgical fix independently applied the same composition to §08 closing takeaway under CSML §08 lines 120–134 "stronger summary strip" mandate, citing §09 T3 as reference — extension without an updated lock. Cycle 9 audit caught the extension and **widened** the lock from "§09 T3 only" to the general Container-earned primary composition lock with explicit earning conditions and a sanctioned-use list.

**Earning conditions (all must hold):**
1. **CSML mandate** — the module's locked spec explicitly requires structural elevation for this role (examples: §09 lines 65–67 "feels clearly primary"; §08 lines 120–134 "stronger summary strip" for Tier 1 / Heavy projects)
2. **Role is anchor or summary-strip** — primary outcome statement, closing takeaway that compresses rows above, or structural summary. NOT a generic body paragraph that "should feel important"
3. **Container is the only structural signal** — no borderTop, no off-ladder type register, no color modifier on the body. Raised-bg + padding + radius alone deliver the elevation
4. **Position matches the role** — anchor near the role's natural position (§09 T3 sits after T1 + T2; §08 takeaway sits after the rows it compresses)

**Sanctioned uses:**
- §09 T3 — Primary outcome statement (`GateAIonR1Shell.tsx :2349`)
- §08 — Closing takeaway (`:2324`)

**Anti-drift:** Do NOT use the composition for arbitrary body paragraphs the author wants to "feel important." Do NOT layer additional structural signals (borderTop / off-ladder type / weight shift / color shift) — the container IS the signal. Do NOT invent a new type-axis register to "feel primary"; the Type lock is closed (see Typography §H back-pointer — "primary feel is a composition rule, not a type-axis register"). New role claims must surface as flags (the way §08 did in Cycle 8) and either fit the earning conditions above or earn a separate sanctioned exception via a new cycle. Casual reuse without flagging is proliferation.

**Outcome path classification:** **Path B widened** — single composition exception, two sanctioned uses. The widening from Cycle 7 to Cycle 9 was protocol-correct (when audit revealed extension, the lock was widened with explicit conditions rather than left implicit).

**Why this is a composition exception, not a type-axis revision:** The Type lock cannot deliver "primary feel" without inventing a new type-axis register (which is closed per Type lock §H anti-drift). The structural axis (containers + raised-bg + position) can. Composition does the work; type stays on-ladder.

---

### Exception 3 — `--dir-text-body` *(Cycle 9 W1 reopen close 2026-05-13 · Path C)*

**Pattern:** New W1 token added to the warm-graphite axis between locked `--dir-text-primary` (`#121110`, L*5.1) and `--dir-text-secondary` (`#5F5B54`, L*38.8).

| Token | Value | L* | warm-Δ (R−B) | Contrast on `--dir-bg` |
|---|---|---|---|---|
| `--dir-text-primary` (locked anchor) | `#121110` | 5.1 | 2 | 18.4:1 AAA |
| **`--dir-text-body` (new sanctioned exception)** | **`#383632`** | **22.7** | **6** | **11.7:1 AAA** |
| `--dir-text-secondary` (locked anchor) | `#5F5B54` | 38.8 | 11 | 6.6:1 AA |
| `--dir-detail` (locked anchor) | `#878075` | 53.9 | 18 | 3.8:1 AA-lg |

**Role:** Body main-flow ink. The Shell BODY const + DENSE const both bind to `--dir-text-body` post-revision. Every body paragraph, every Dense Body block, every body-tier rendering of text-primary shifts to this token.

**Earning conditions (all must hold):**
1. Content is **body-size main-flow text** (IS 15 / IS 13 dense in compressed contexts)
2. Adjacent **title (ISe 22 / 32) renders at `--dir-text-primary`** — color-axis cue carries title↔body register step that family + size alone insufficient under real reading conditions (documented failure on `/gate-a/ion/r1`)
3. **Body weight unchanged** (IS 400) · **body line-height unchanged** (1.75 / 1.6 dense) — only the color slot shifts

**Sanctioned uses:** ALL body main-flow content — body paragraphs across §01–§10, Dense Body in compressed contexts, §07 chosen / why / my move / what changed, §09 framing + T3 primary outcome, §08 closing takeaway. Effectively every BODY/DENSE-consuming site in the Shell.

**Anti-drift:** Do NOT use `--dir-text-body` for titles (titles stay at `--dir-text-primary`). Do NOT use it for small-text uses below body size (those use `--dir-text-secondary`). The token is scoped to body-size main-flow ONLY — its role is to step the body register down one stop on the warm-graphite axis from the locked title anchor.

**Outcome path classification:** **Path C — systemic revision.** The Cycle 2 lock that pinned body to `--dir-text-primary` was correct for body-in-isolation reading; the documented implementation failure showed title↔body **adjacency** reading collapses when both are at the same ink. The fix wasn't a per-role exception — it was to **expand the W1 ink ladder** from 4 stops to 5 and shift body to the new body-tier stop globally. Same shape as Cycle 1 ISe 32 escalation (re-lock the value system-wide when combined application reveals the original lock was wrong).

**Why this is a systemic revision, not an exception:** Body appears in every module, every reading mode, every layout. The title↔body adjacency problem applied EVERYWHERE body lives — not just one specific role. A per-role exception would have left the problem unsolved in every other context. The protocol-correct outcome is the systemic ladder expansion.

---

### Exception 4 — `--dir-text-body-soft` *(Cycle 9 W1 reopen close 2026-05-13 · Path B)*

**Pattern:** New W1 token added to the warm-graphite axis between locked `--dir-text-secondary` and `--dir-detail`.

| Token | Value | L* | warm-Δ | Contrast on `--dir-bg` |
|---|---|---|---|---|
| `--dir-text-secondary` (locked anchor) | `#5F5B54` | 38.8 | 11 | 6.6:1 AA |
| **`--dir-text-body-soft` (new sanctioned exception)** | **`#797369`** | **48.7** | **16** | **4.58:1 AA edge** (+0.08 above WCAG floor) |
| `--dir-detail` (locked anchor) | `#878075` | 53.9 | 18 | 3.8:1 AA-lg |

**Role:** Body-size **supporting text** ink. Specifically the Subordinate aside register (IS 15 italic / LH 1.5) and the §07 summary register (upright IS 15 / LH 1.75, the chosen-direction's narrative one-liner in collapsed accordion state).

**Earning conditions (all must hold):**
1. Content is **body-size supporting text** — Subordinate aside register OR §07 summary register
2. **Adjacent main-flow body renders at `--dir-text-body`** — color delta carries body→body sub-line register step that spacing alone could not (resolves flag #42 body→body sub-line scan)
3. **Body-size only** — IS 15. Small-text uses (eyebrows IS 10, captions IS 11, META_VALUE Dense Body 13) keep the locked `--dir-text-secondary` for contrast comfort

**Sanctioned uses:**
- §07 summary (collapsed accordion narrative one-liner)
- §07 catch (Subordinate aside register, expanded state)
- §06 "My move:" lines (×4 steps, Subordinate aside register)
- §03 pattern close (Subordinate aside register, section-closing aside)
- §04 stakes (Subordinate aside register)
- §10 reflection asides (when content earns Subordinate aside register — inherited via BODY-soft fallthrough; specific reflection sites added as the §10 module-by-module rebuild lands)

**Anti-drift:** Do NOT use `--dir-text-body-soft` for small text (use `--dir-text-secondary`). Do NOT use it for narrative main-flow body (use `--dir-text-body`). Do NOT use it as a generic "softer body" register for any content that wants to feel quieter; the role is scoped to body-size supporting text under the earning conditions above.

**Outcome path classification:** **Path B — single-role exception.** Unlike `--dir-text-body` (which shifts body system-wide), `--dir-text-body-soft` is scoped to the body-size supporting text role. The locked `--dir-text-secondary` retains its sanctioned use for small text. The Body-only architectural decision (Cycle 9) deliberately chose this per-role scoping over a global `--dir-text-secondary` replacement — keeps small-text contrast comfort at the locked 6.6:1 while solving body-size differentiation at the new 4.58:1.

**Why this is a per-role exception, not a systemic revision:** The body→body sub-line scan problem is body-size-specific. Small text (eyebrows, captions, META_VALUE) has a different perceptual need (legibility, not register differentiation from adjacent body). A global lift would have degraded small-text contrast from 6.6:1 to 4.58:1 — a cost that doesn't serve the small-text role's needs. Per-role scoping is protocol-correct.

---

### Cycle 9 also produced together — both Path B and Path C in a single resolution

Cycle 9 W1 reopen demonstrated that a complex divergence can produce **both outcome paths in the same resolution**:
- `--dir-text-body` = **Path C** (systemic body ink revision)
- `--dir-text-body-soft` = **Path B** (per-role exception)

The framework doesn't gatekeep "either exception or revision" — it guides which path each divergence demands, and a single cycle can deliver both. This is canonical precedent (recorded in §15 precedent index).

### Where to drill next

`color-system-w1.md` §B Token System for canonical values + §C Semantic Roles for full per-role usage + §D Interaction & Depth Behavior for the 5-stop ink ladder + §H Anti-Drift. `typography-system.md` §F Exception Policy for META_VALUE + §D Role Map for Subordinate aside register narrative + §H Anti-Drift. `case-study-modules/11-cross-module-rules.md` Container-earned primary composition section.

---

## 10) Intent + Context framework

The connective layer the per-system locks don't carry. The cycles 1–9 work produced this layer implicitly through earning conditions, cascade rules, cohesion principles, and surgical revisions. This section makes it explicit so future cycles cite it as protocol rather than rediscover it.

### The thesis — Intent × Context = Behavior

A title at ISe 32 / `--dir-text-primary` / Cat 1 24 margin is the same register everywhere. But the **behavior** that title produces in §01 (orienting / welcoming) is different from §02 (pressuring / framing), §04 (corrective / sharper-not-heavier), §09 (resolving / mixed-truth), §10 (reflective / synthesizing). Same register, different behavior. **What shapes the behavior is intent + context.**

- **Intent** is the role's specific job in this specific context. Not "what's a title" generically — "what is THIS title FOR in §02 specifically?"
- **Context** is what surrounds the role — what came before, what comes after, what's adjacent spatially and narratively, what reading mode the section is in, what density it's composed at, what voice the content carries.
- **Behavior** is what emerges when intent and context shape the register's expression. The register value is held constant; the behavior is the live perceptual outcome.

This is not a theoretical addition. It is what the cycles have been implicitly modeling all along. Cascade rules (flag #37) are intent + context formalized as register selection. Earning conditions for sanctioned exceptions (META_VALUE, Container-earned primary, body-tier ink) are intent + context formalized as exception scoping. Reading-mode bucket composition (Cycle 5) is intent + context formalized at the mode-axis level. The cycles produced this layer one piece at a time; §10 names the whole.

### Why the per-system locks don't carry it

The per-system locks are **value-to-role catalogs** (Type, Color, Spacing) and **behavior-to-structure systems** (CSML, Navigation). Both are self-consistent in their domains. Neither articulates what happens at composition time when intent + context interact with the value or the structure.

- A value-to-role lab says "Title register = ISe 32 / text-primary / Cat 1 24 margin." It does NOT say "this register reads as orienting in §01 and as pressuring in §02 because of where each title sits in the case-study spine."
- A behavior-to-structure lab says "§04's job is to correct the earlier understanding · §04 must not become Problem + Stakes repeated with smarter language." It does NOT say "the corrective intent expresses through the family + size cascade from §03's research presentation to §04's sharper diagnosis, and the title register reads as sharper-not-heavier because the surrounding context is laden with research insight from §03."

The connective layer that joins these two halves — "register value + module behavior → composed surface that reads as authored" — lives in this section.

### The complementary gap

| Lab type | What it knows | What it doesn't know alone |
|---|---|---|
| **Value-to-role labs** (Type · Color · Spacing · Project Card · Media) | The bijection: this value plays this role | What context surrounds the role at composition time, and how that shapes the role's behavior |
| **Behavior-to-structure labs** (CSML · Navigation) | The module / system definitions: what each module does, what it must NOT become | How the behavior is upheld when wrapped in the surrounding case-study context, and how intent + context shape the rendering of the locked behavior |

The cycles 1–9 history made the gap visible. The per-system locks were correct in their domains — Type was right, Color was right, CSML was right. The gaps lived **between** them:

- Title↔body adjacency contrast (Cycle 9 W1 reopen) — neither Type nor Color owned the problem alone; it surfaced under composition
- Body→body sub-line scan (flag #42) — Type lock said "Body 15," Color lock said "text-primary," CSML §07 said "row carries title + chosen + summary"; composition revealed the chosen↔summary register collapse
- Container-earned primary composition (Cycle 7 Q2 + Cycle 9 widening) — neither Type's primary register nor CSML's §09 spec owned the structural-elevation problem; composition with raised-bg containers was the answer

The intent + context framework names this connective layer so future cycles know **where to look** when divergences surface — not just at the per-system lock, but at the composition seam where the lock meets the surrounding context.

### How intent and context combine

Six dimensions of intent + context shape behavior:

| Dimension | What it captures |
|---|---|
| **Mode axis (intent)** | Which reading mode is this role in? Framing / Interpretation / Proof / Resolution (Cycle 5). Each mode has a characteristic intent vocabulary (framing intent = orienting · pressuring; interpretation intent = analyzing · correcting; etc.) |
| **Module job (intent)** | What is this specific module's job per CSML? §02 = framing what was broken; §04 = correcting the earlier read; §10 = showing what sharpened. The module job constrains what the role's title / body / aside MUST be doing. |
| **Tier or state (intent)** | Within a module, what tier or state is this element in? §09 T1 (Outcome headline) ≠ §09 T3 (Primary outcome statement) ≠ §09 T6 (Future-layer-last). The certainty gradient is intent at the tier axis. |
| **Adjacent registers (context)** | What's above? What's below? A Title above body reads as opener; the same Title above a Subordinate aside reads as anchor. The relationship to neighbors shapes the title's behavior. |
| **Composition heaviness (context)** | How layered is the surrounding composition? Framing mode is shallow; Proof mode is structured-heavy. The same register in shallow vs heavy contexts reads differently. |
| **Position in case study (context)** | Where does this element sit in the full §01 → §10 arc? A reflective Subordinate aside in §10 lands differently than the same register in §03 because the reader's accumulated state is different. |

Intent dimensions are largely owned by CSML (module jobs) + Cycle 5 (reading-mode mapping) + Cycle 7 customs (tier/state axes). Context dimensions are owned by composition — they emerge at the surface assembly time. **The intent + context framework is the language that joins them.**

### Convergence is the system working

This is the principle the user named explicitly in Cycle 10 scope discussion. Most of the time, tracing a role through intent + context produces a **convergent** answer: the locked register value applies; the default earning conditions hold; the composition feels right.

Examples of convergence:
- All §01–§10 section titles trace to ISe 32 / text-primary / Cat 1 24 — convergent. Different intents, same register. The framework confirms the lock.
- All Subordinate aside instances (§03 pattern close · §04 stakes · §06 "My move" · §07 catch · §10 reflection) trace to IS 15 italic / `--dir-text-body-soft` / LH 1.5 — convergent. Different intents (synthesis · stakes · author-stance · catch · reflection), same register. The framework confirms the lock.
- All §09 future-layer-last instances (Mode A T6 · Mode B footer) trace to the locked footer composition (recessed-bg + Dense 13 + 1fr 1fr + CAPS) — convergent. Two modes, same composition. The framework confirms the custom.

**Convergence is not the framework being wasteful.** It is the framework **demonstrating its own coherence**. Each traced path that converges reinforces the system's mental model: "I checked. The role earns the standard answer here." Repeated convergence builds the pathways in the head of whoever is working in the system. Authored systems become intuitive through this repetition. It is exactly the same shape as cohesion verification at the 4 zoom levels (Cycle 8) — the system holding under audit IS the system working, not the system being uninteresting.

### Divergence is the payoff

When intent + context produces a result the locked register cannot deliver, the framework routes the divergence into the outcome protocol (§12). Three paths exist:

- **Path A — Convergence reveals system holds.** What looked like divergence turned out to be apparent, not real. The framework's trace surfaces the convergent answer and the lock holds.
- **Path B — Single-role / per-context divergence earns a sanctioned exception.** The divergence is real and role-specific. The exception is added with explicit earning conditions and sanctioned uses. Precedent: META_VALUE · Container-earned primary · body-soft register.
- **Path C — Combined application reveals the lock itself is wrong.** The divergence is real and systemic. The lock changes globally via surgical revision. Precedent: ISe 32 escalation · IS 400 phantom-weight · italic register additions · body-tier ink ladder expansion.

The user articulated this point in Cycle 10 scope discussion: "many of them might end up being the same value … but when they don't, what then? This thinking guides to proper decisions on these edge cases." That's the payoff. The framework reinforces the system through convergent traces AND guides correct decisions when divergences surface.

§12 unpacks the outcome protocol formally.

### Where intent + context comes from operationally

When you trace a role through intent + context:

1. **Identify the intent dimensions.** What reading mode is this role in? What module's job does it serve? What tier / state is it carrying? (Look to Cycle 5 mode map + CSML module spec + Cycle 7 customs.)
2. **Identify the context dimensions.** What's adjacent? How heavy is the surrounding composition? Where does this sit in the case-study arc? (Look to surrounding code + Reading-mode bucket composition + Cycle 6 spacing rhythm.)
3. **Apply the framework.** Does intent + context point to the convergent locked register? Or does it surface a real divergence?
4. **If convergent:** lock the trace as precedent (§15) for future similar checks; build with the locked register.
5. **If divergent:** route into §12 outcome protocol.

This is the workflow the operating manual recommends by default (§2 Workflow B). The framework is the lens; the per-system locks are the values the lens points to; the outcome protocol handles the cases the lens reveals as edge cases.

### Voice / writing system (#18) will extend this

The intent dimensions named above (orienting · pressuring · corrective · proof-asserting · synthesizing · etc.) are placeholder names. When the **Voice / writing system** (Phase 1.5 #18) locks, it will provide the canonical intent vocabulary — concrete per-section intent names, per-module voice profiles, the language for how content carries intent at the sentence level. At that point, §10 + §11 of this manual get a major surgical revision: Voice's vocabulary replaces the placeholders, and the worked examples in §11 gain real voice-level traces.

For now, the framework is **operational** with placeholder intent names. Voice locking will sharpen it.

---

## 11) Worked examples

Four traces that demonstrate the framework operationally. Two are **convergence** demonstrations (Path A — system holds), two are **divergence** demonstrations (Path B + Path C). Each trace shows the role, the contexts it appears in, the intent in each context, and what the framework reveals.

---

### Worked example 1 — Title register traced across §01–§10 (convergence demonstration — Path A)

**Role:** Section heading at ISe 32 / 400 / LH 1.18 / −0.025em / `--dir-text-primary` / Cat 1 24 margin to first body. Locked Cycle 1 surgical revision 2026-05-07.

**Context dimensions to trace:** Mode axis, module job, position in case-study arc.

| § | Mode | Module job (CSML) | Intent placeholder | Locked register applies? |
|---|---|---|---|---|
| §01 | Framing | Establish what the project was, where you sat in it, what you drove, basic facts | Orienting / welcoming | ✓ |
| §02 | Framing | Frame what was broken and why that mattered | Pressuring / stakes-laden | ✓ |
| §03 | Interpretation | Show how research translated into product requirements | Analytical / opening discovery | ✓ |
| §04 | Interpretation | Correct the earlier understanding, expose the deeper issue | Corrective / sharper-not-heavier | ✓ |
| §05 | Interpretation | Show the directional move that followed from the diagnosis | Strategic / framing the bet | ✓ |
| §06 | Proof | Prove how the reframe became a usable system | Proof-asserting / walking through | ✓ |
| §07 | Proof | Show the key judgment calls that shaped the system | Judgment-revealing | ✓ |
| §08 | Proof | Make restraint visible | Restraint / cut-acknowledging | ✓ |
| §09 | Resolution | Show what is true now — mixed-state truth | Resolving / certainty-gradient | ✓ |
| §10 | Resolution | Show what sharpened in thinking through the work | Reflective / synthesizing | ✓ |

**Framework outcome:** **Path A — full convergence.** Every section's intent + context produces the same locked Title register. Ten distinct intents (orienting / pressuring / analytical / corrective / strategic / proof-asserting / judgment-revealing / restraint / resolving / reflective) — one locked register that holds across all of them.

**What this trace demonstrates:**
- The framework reinforces the lock. Ten traces, ten convergences. The Cycle 1 surgical revision (ISe 32 escalation) was the right call — the register holds under every section's intent + context.
- **Convergence is the system working.** Reading this trace gives future-Sebs (and future-AI) ten reinforcement points for the locked Title register. The mental model is "Title means ISe 32 / text-primary / Cat 1 24 — regardless of which section's intent it carries."
- The **behavior** of each title differs even when the **register** is identical. §02 reads as pressuring; §10 reads as reflective. The intent + context shapes the behavior; the locked register stays constant. That's the thesis from §10 made concrete.

**What the framework would catch if it broke:** If a future cycle proposed "§02 needs a more pressuring title — let's use Clash Display 52," the framework's response is: trace it. Does the intent (pressuring) genuinely require a different register, OR does the register hold + the surrounding composition + voice carry the pressuring read? Per Cycle 5 anti-pattern: "oversized 'star moment' titles for specific sections" is explicitly rejected. The framework routes the proposal to convergence: the register holds; the pressuring intent is carried by §02's content + body + Pull quote, not by escalating the title.

---

### Worked example 2 — Subordinate aside traced across modes (convergence demonstration — Path A)

**Role:** Subordinate aside register at IS 15 / 400 italic / LH 1.5 / `--dir-text-body-soft`. Locked Cycle 4 surgical revision 2026-05-08 (color updated Cycle 9 W1 reopen 2026-05-13).

**Sites traced:**

| Site | Mode | Intent placeholder | Adjacent register (context) | Locked register applies? |
|---|---|---|---|---|
| §03 pattern close ("The pattern: …") | Interpretation | Section-closing synthesis | Follows §03 insight rows (sub-section register ISe 22 + Body 15 evidence + req) | ✓ |
| §04 stakes ("The stakes: …") | Interpretation | Closing-synthesis sub-line, sharper-not-heavier | Follows §04 diagnosis body + Pull quote deeper-issue line | ✓ |
| §06 step "My move" lines (×4) | Proof | Author-stance / showing your move per step | Follows each §06 step's body paragraph; precedes §06 Result line (deferred per flag #25) | ✓ |
| §07 catch (expanded, optional) | Proof | Catch-qualification / quiet note quieter than three main elements | Follows §07 expanded Why + My move + What it changed | ✓ |
| §10 reflection asides | Resolution | Reflective-close / restraint | Follows §10 reflection body blocks | ✓ |

**Framework outcome:** **Path A — full convergence.** Five distinct intents (section-closing synthesis · stakes-closing · author-stance · catch-qualification · reflective restraint) — one locked register holds.

**What this trace demonstrates:**
- The Subordinate aside register's role is genuinely **role-universal** across the case-study spine. Different sections give it different intents, but the register handles them all without strain.
- The Cycle 9 W1 reopen color update (`--dir-text-secondary` → `--dir-text-body-soft`) propagates uniformly across all five sites because the role is consistent — supporting body-size narrative quieter than main-flow body. The framework predicted this propagation; the surgical revision delivered it.
- §04 stakes is worth flagging: it was originally rendered as a CAPS eyebrow + Dense 13 / text-detail labeled block. Cycle 5 audit caught the drift (CSML §02 line 120–122 forbids labeled blocks for stakes-family content; CSML §04 line 235 mandates "sharper, not heavier"). Cycle 5 §04 surgical fix converted it to Subordinate aside register matching §03 pattern close. **The framework's trace would have caught this drift earlier** if the operating manual had been in place — Subordinate aside is the convergent register for closing-synthesis sub-lines in interpretation mode; §04 stakes diverged into a labeled-block pattern that didn't fit the convergent answer.

**What the framework would catch if it broke:** If a future module proposes a "labeled stakes block" pattern at CAPS eyebrow + Dense Body, the framework's response is: trace the intent (stakes-closing synthesis), trace the context (interpretation mode, follows diagnosis body), check convergence. Convergent answer is Subordinate aside register (per §03 / §04 / §06 / §07 / §10 precedent). The labeled-block proposal diverges from the convergent register; route through §12 outcome protocol — either it earns a sanctioned exception with explicit earning conditions, or the convergent register is the correct answer.

---

### Worked example 3 — Container-earned primary composition across §09 vs §08 (divergence demonstration — Path B widened)

**Role:** Body 15 / `--dir-text-primary` in raised-bg container. Locked Cycle 7 Q2 Path A 2026-05-12 as §09-only · widened Cycle 9 W1 reopen close 2026-05-13 to general Container-earned primary composition lock.

**The divergence trace:**

**Phase 1 — Cycle 7 Q2 (origin)**

CSML §09 lines 65–67 require the primary outcome statement to "feel clearly primary." Type lock cannot deliver "feel clearly primary" without inventing a new type-axis register (which is closed per Type §H). The divergence: §09 T3 needs primary-feel; no existing register delivers it.

Cycle 7 Q2 traced the intent (primary anchor in §09's certainty gradient) + context (T1 ISe 32 headline above, T2 framing line above, T3 the actual primary statement). Outcome: **Path B** sanctioned exception scoped to §09 T3 — Body 15 / text-primary in raised-bg container. Container does the structural elevation; type stays on-ladder. Single sanctioned use: `:2349`.

**Phase 2 — Cycle 8 §08 surgical fix**

CSML §08 lines 120–134 require Tier 1 / Heavy projects (Ion is flagship) to render a "stronger summary strip" that "compresses the pattern across the rows." Cycle 8 §08 audit caught the existing §08 closing takeaway rendering at off-spec IS 12/500/text-secondary with redundant borderTop + raised-bg container — drifted from spec. Surgical fix applied: Body 15 / text-primary in raised-bg container, citing §09 T3 as reference pattern. **The fix was correct visually, but it was an extension of the Cycle 7 Q2 lock without an updated lock statement.** §08 takeaway began using the §09 T3 pattern under a different CSML mandate (§08 line 120–134 instead of §09 line 65–67). Ad-hoc extension. Caught audit-passes later.

**Phase 3 — Cycle 9 audit + widening**

Cycle 9 audit traced the extension. The pattern (Body 15 / text-primary in raised-bg) was clearly being used in two modules under two different CSML mandates with the same composition. Two paths to resolve:

- Option A: revert §08 to its own pattern; keep §09 T3-only lock.
- Option B (widening): widen the lock to a general Container-earned primary composition with explicit earning conditions and sanctioned uses (§09 T3 + §08 takeaway).

User chose Path B widening. Cycle 9 close locked Container-earned primary composition in CSML §11 with explicit earning conditions (CSML mandate · role is anchor or summary-strip · container is only structural signal · position matches role) and a sanctioned-use list (§09 T3, §08 takeaway).

**Framework outcome:** **Path B widened.** Same composition pattern, two sanctioned uses, each earned via CSML mandate in its own module. The lock widening was protocol-correct — extending without updating the lock would have left the §08 use as ad-hoc, vulnerable to future drift.

**What this trace demonstrates:**
- The framework would have caught the Cycle 8 §08 ad-hoc extension at the moment of extension if the operating manual had been in place. The §08 surgical fix would have triggered §12 outcome protocol: is this a Path A (convergence holds — revert), or Path B (earn the extension as sanctioned exception)? Cycle 8 would have routed to Path B and the widening would have happened then, not three audit-passes later.
- **The widening retroactively cleaned up the ad-hoc extension.** Cycle 9 audit was the catch. The lock is now correct; future similar role claims under CSML mandate will route through the widened lock cleanly.
- The protocol's "anti-drift" clause is critical: "Future module roles claiming this pattern must surface as flags (the way §08 did in Cycle 8) and either fit the earning conditions or earn a separate sanctioned exception via a new cycle. Casual reuse without flagging is proliferation." This is the receipt for why the framework matters.

---

### Worked example 4 — Body-tier ink trace (Cycle 9 W1 reopen — divergence demonstration · Path C)

**Role:** Body main-flow ink color. Locked at `--dir-text-primary` (`#121110`) from Cycle 2 (flag #32). Reopened + revised to `--dir-text-body` (`#383632`) in Cycle 9 W1 reopen close 2026-05-13.

**The divergence trace:**

**Phase 1 — Cycle 2 / flag #32 lock**

A/B/C visual proof in §01 Overview compared: (A) text-primary `#121110`, (B) 80% mid-tone, (C) text-secondary `#5F5B54`. A vs B was visually indistinguishable at body-in-isolation 15px reading; C was visibly caption-tier. Decision: body = text-primary. Lock holds.

**Phase 2 — `/gate-a/ion/r1` documented implementation failure**

When the case study was assembled and §07 Decisions came into view, the user identified that title (ISe 32 / text-primary at `#121110`) and body (IS 15 / text-primary at `#121110`) rendered at **identical ink**. The type-axis hierarchy (family ISe → IS + size 32 → 15) was carrying 100% of the title↔body register step. Under real reading conditions at desktop distance, the eye read "block of dark ink" first and resolved the family/size differentiation second. The locked register pair was working *legibly* but not *forcefully*.

This is a different perceptual condition than the Cycle 2 / flag #32 A/B/C test. The flag #32 test isolated **body-in-isolation reading**. The `/gate-a/ion/r1` failure surfaced **title↔body adjacency contrast**. Different question; the flag #32 test didn't address it.

**Phase 3 — Cycle 9 W1 reopen**

Reopen authorized per documented implementation failure. 7-candidate A/B test (`GateAIonS07BodyInkSetContext` with native + A/B/C/D/E/F sets) + architectural scope toggle (`GateAIonSecondaryLiftScopeContext` body-only vs global) shipped to `/gate-a/ion/r1` §07. All candidates interpolated on the locked W1 warm-graphite axis (primary → secondary → detail).

**Framework trace at the reopen:**
- **Intent:** Body main-flow ink for case-study reading. Must (a) read distinct from adjacent title, (b) carry sustained reading comfort (AAA), (c) preserve the W1 "near-graphite never drifts brown" character.
- **Context:** Body appears in every module, every reading mode, every layout. Adjacent title is ISe 22 / 32 at text-primary. Adjacent body→body sub-lines (chosen↔summary in §07) need register-differentiation that color delta can deliver.
- **Convergence check:** Does the locked text-primary register satisfy the intent under this context? NO — the title↔body adjacency contrast collapses.
- **Path classification:** The body role appears EVERYWHERE — every module, every mode. A per-role exception would leave the title↔body adjacency problem unsolved at every other body site. **Path C systemic revision** is protocol-correct.

Set E + Body-only scope locked. `--dir-text-body` (`#383632`) added to the W1 ink ladder as the new body-tier stop. The W1 ladder expanded from 4 stops to 5 (primary · body · body-soft · secondary · detail). All BODY/DENSE consumers shifted system-wide.

**Framework outcome:** **Path C — systemic revision.** The locked W1 body ink (Cycle 2 / flag #32) was correct for body-in-isolation; documented implementation failure surfaced a different perceptual condition that the original lock did not address. The fix was systemic — re-lock the body color globally — not a per-role exception. Cascade-propagated across the Shell BODY + DENSE consts; canonical revision documented in W1 spec §B + status line.

**What this trace demonstrates:**
- **Path C precedent.** Some divergences are systemic, not per-role. The framework distinguishes them at Step 3 of the outcome protocol (§12): "Combined application reveals the lock itself is wrong" → Path C.
- **The body-in-isolation vs title↔body adjacency distinction.** The Cycle 2 test was correct for what it tested. Real implementation revealed a different perceptual condition. Both can be true; the framework reconciles them by widening the lock to handle both.
- **Cycle 9 produced both Path B (body-soft) and Path C (body) in a single resolution.** Body color shifted globally (Path C); body-soft was added as a per-role exception scoped to body-size supporting text (Path B). Same cycle, both paths. The framework guides each divergence to its correct path; complex resolutions can be hybrid.

This is the **canonical Path C precedent** for the operating manual. Future systemic divergences should cite this trace + the Cycle 1 ISe 32 escalation + the Cycle 2 IS 400 phantom-weight + the Cycle 4 italic register additions as the four-precedent set demonstrating when Path C is the correct outcome.

---

### What the four worked examples together demonstrate

- **Examples 1 + 2 (convergence)** show the framework reinforcing the locked system. The cycles 1–9 work produced locks that hold under composition; convergent traces verify it.
- **Example 3 (Path B widening)** shows the framework catching ad-hoc extension and routing it to a sanctioned widened lock with explicit earning conditions. The §08 takeaway extension was caught audit-passes later; the operating manual would have caught it at the moment of extension.
- **Example 4 (Path C systemic revision)** shows the framework distinguishing systemic divergences from per-role exceptions. The body-tier ink was a system-wide problem; per-role exception would not have addressed it. Path C delivered a re-locked register; cascade propagated.

The framework operates the same way across all four examples. What differs is the outcome path the framework routes to — Path A (convergence), Path B (sanctioned exception), or Path C (systemic revision). §12 unpacks the protocol that makes the path choice formal.

---
<!-- §10 — Intent + Context framework · pending draft -->
<!-- §11 — Worked examples · pending draft -->
## 12) Outcome protocol — three paths

When intent + context produces a result the locked register / composition / behavior does not deliver, the divergence routes through this protocol. Five steps, three possible outcome paths.

### The five-step protocol

**Step 1 — Document the failure on a real implementation surface.**

Reopening requires a documented failure, not a hunch. The evidence threshold is the same across all locks — `feedback_research_before_visual_effects` + `feedback_verify_before_flipping` apply. If you are tempted to reopen a lock because something "feels off" but you cannot point at a specific surface where it fails, the reopen is not yet warranted. Build the surface; capture the failure; document the trace. Reopens that bypass this step fragment the system without precedent.

Examples that cleared Step 1 in Cycle 9:
- `/gate-a/ion/r1` title↔body adjacency contrast collapse (visible at desktop reading distance — screenshot evidence)
- `/gate-a/ion/r1` §07 chosen↔summary body→body sub-line scan (visible in collapsed accordion rows — flagged via flag #42's open status)
- Cycle 8 §08 closing takeaway extension audit catch (drift in `:2323` documented during audit pass)

**Step 2 — Trace intent + context across affected cases.**

Use the framework in §10. Identify:
- The role being traced (Title, Body, Subordinate aside, etc.)
- The intent dimensions (mode axis · module job · tier or state)
- The context dimensions (adjacent registers · composition heaviness · position in case study)
- The cases affected by the divergence — is it one site, one role, multiple roles, system-wide?

The trace produces evidence about **scope**. A divergence visible in one specific site under one specific intent has a different scope than a divergence visible across every body site in the case study. Scope determines path classification at Step 3.

**Step 3 — Classify the outcome.**

Three paths exist. Path choice depends on the trace at Step 2:

#### Path A — Convergence reveals system holds

What looked like a divergence turned out to be apparent, not real. The framework's trace surfaces the convergent answer. No change needed.

Receipts: Cycle 5 audit ran convergence checks across §02 / §03 / §06 / §09 reading-mode bucket composition — most checks passed, no register changes needed. Cycle 8 cohesion audit at the 4 zoom levels — system holds at every zoom level (with surgical comment cleanup but no register changes). Convergence is the most common outcome of running the protocol.

Output: Document the trace as precedent (§15). Build with the locked register. The trace itself is value — it reinforces future-Sebs's mental model.

#### Path B — Single-role / per-context divergence earns a sanctioned exception

The divergence is real and role-specific. The intent + context produces a behavior the locked register cannot deliver, but the divergence applies to a specific role / context combination, not to every site where the role appears.

Receipts: **META_VALUE register** (sanctioned exception scoped to metadata-value role) · **Container-earned primary composition** (sanctioned composition exception scoped to §09 T3 + §08 takeaway via CSML mandate) · **`--dir-text-body-soft`** (sanctioned ink-tier exception scoped to body-size supporting text). Three Path B precedents from Cycle 9.

Output: Earn the exception with explicit earning conditions and sanctioned-use list. Lock anti-drift (when NOT to use the exception). Append to the relevant per-system canonical (Type §F · CSML §11 · W1 §B as appropriate). Add to §15 precedent index marked Path B.

#### Path C — Combined application reveals the lock itself is wrong

The divergence is real and systemic. The intent + context trace at Step 2 shows the divergence applies across the case study — to every site where the role appears, not just one specific context. The locked value is wrong; per-role exception would leave the problem unsolved at every other site. The fix is to **change the lock itself**.

Receipts: **Cycle 1 ISe 32 escalation** (Section heading register moved from ISe 22 to ISe 32 system-wide; cascade rebuilt across §01–§10) · **Cycle 2 IS 300 → 400 phantom-weight** (locked Body / Dense Body / Caption / proof numerals weight corrected system-wide) · **Cycle 4 italic register additions** (Pull quote · Subordinate aside · Inline emphasis added to the locked Type ladder) · **Cycle 9 W1 reopen `--dir-text-body`** (W1 ink ladder expanded from 4 stops to 5; body shifts globally). Four Path C precedents.

Output: Surgical revision of the affected per-system lock. Update the status line. Cascade-propagate the change across the Shell + locked labs + dependent surfaces. Add to §15 precedent index marked Path C.

**Step 4 — Lock the resolution with anti-drift.**

Whichever path the outcome takes, the lock must include anti-drift. Anti-drift answers "when does this NOT apply?" — the boundary that prevents casual extension to contexts the lock didn't sanction.

- Path A locks the **trace as precedent** — anti-drift in this case is the framework itself (future similar checks cite this trace).
- Path B locks the **earning conditions + sanctioned-use list** — anti-drift names the role boundaries and the protocol for future additions (the §08 widening pattern: new role claims must surface as flags, not silent extension).
- Path C locks the **revised value + cascade-propagation receipt** — anti-drift documents which other locks the change touches and what migration is required.

The lock is the system's defense against future ad-hoc reopen. Without anti-drift, a sanctioned exception becomes a casual pattern within a cycle; a systemic revision becomes a one-off correction without precedent value.

**Step 5 — Add to §15 precedent index.**

The precedent index is the cumulative memory of the protocol. Every resolution — A or B or C — adds an entry. The entry includes:
- The divergence (what surfaced under what context)
- The path taken (A / B / C)
- The lock the resolution produced (which per-system canonical owns it now)
- The flag the resolution closed (if any)
- The cycle that closed the resolution

Future cycles cite the precedent index. If a new divergence looks similar to a logged precedent, the path is usually the same path. If the new divergence is meaningfully different, the precedent still informs the trace — sometimes the difference is what reveals which path applies.

### Choosing the right path — diagnostic questions

The three paths look distinct on paper but can feel ambiguous in practice. The diagnostic questions:

**Is the divergence apparent or real?** (Path A check)
- Trace intent + context across affected cases. If the convergent answer emerges naturally — the locked register holds — the divergence was apparent. Document the trace; no change.
- If the convergent answer does NOT emerge — the locked register genuinely cannot deliver the intent + context — the divergence is real. Proceed to B vs C.

**Is the divergence role-specific or systemic?** (Path B vs Path C check)
- If the divergence applies ONLY in this specific role + context combination, AND a per-role exception scoped to that combination would resolve it cleanly, **Path B**. The locked value remains correct for every other role; the exception narrows the scope of the change.
- If the divergence applies across the case study — to every site where the role appears — a per-role exception would leave the problem unsolved at every other site, **Path C**. The locked value is wrong system-wide; the fix is system-wide.

**Is the CSML mandate the gate?**
- Path B exceptions for module roles often gate through CSML mandate. The §08 closing takeaway pattern is sanctioned only because CSML §08 lines 120–134 mandate "stronger summary strip" for Tier 1 / Heavy projects. If the same composition were attempted in a module without a CSML mandate for structural elevation, it would be Path A drift (convergence holds; don't apply the composition there) or require a CSML mandate update (which is its own outcome trace).

**Does the divergence look like an extension of an existing exception?**
- If a Path B lock exists for one site and a similar site shows the same divergence, the question is **widening** (the §08 widening from Cycle 7 Q2's §09-only lock). The widening protocol: append the new sanctioned use to the existing earning-conditions list. The §08 case demonstrated this — the Container-earned primary composition lock widened from one to two sanctioned uses with the same earning conditions.

### The Cycle 9 hybrid case

Cycle 9 W1 reopen produced **both Path B and Path C in a single resolution**:
- `--dir-text-body` = Path C (systemic body ink revision)
- `--dir-text-body-soft` = Path B (per-role exception scoped to body-size supporting text)

A single divergence trace can produce multiple resolutions if the trace surfaces multiple problems with different scopes. The framework guides each problem to its correct path. Hybrid resolutions are sanctioned; the precedent (§15) records both paths.

### Anti-drift on the protocol itself

The protocol is the system's defense against ad-hoc reopening. Two failure modes to watch:

- **Skipping Step 1 (documented failure).** Reopening on a hunch fragments the system. If you cannot point at a surface where the lock fails, the reopen is not warranted. Build the surface; capture the failure first.
- **Defaulting to Path B when Path C is correct.** A per-role exception feels lower-cost than a systemic revision. But if the divergence is systemic, a per-role exception leaves the system inconsistent — and a future audit catches the gap. Trace scope honestly at Step 2; let the trace determine the path at Step 3.

Skipping Step 5 (precedent index) is the third failure mode — but it produces silent drift rather than ad-hoc reopen. Without precedent, future cycles re-derive answers that have already been resolved. The §15 index is the system's memory; keep it current.

### Where to drill next

The four canonical precedents are documented in §11 worked examples. The §15 precedent index logs every Cycle 1–9 resolution with its path classification. Per-system locks (Type §F · CSML §11 · W1 §B) carry the locked exceptions in their own anti-drift sections.

---

## 13) Cross-domain anti-drift

The consolidated "don't" list that crosses systems. Each rule was earned through a documented incident in Cycles 1–9; each names the precedent that produced it. These rules supplement the per-system anti-drift (Type §H · W1 §H · Spacing rhythm rules · CSML §11 anti-patterns) — they are the cross-domain rules that no single per-system lock owns alone.

### Type-axis vs composition-axis rules

**Do not invent a new type-axis register to "feel primary."** Primary feel is a composition rule, not a type-axis register. The Type lock is closed at the value level; new "feels important" needs route to composition (raised-bg container at Body 15 / text-primary) per the Container-earned primary composition lock. **Precedent:** §08 closing takeaway extension (Cycle 8 → widened Cycle 9) · Typography §H back-pointer.

**Compressed register is structural, not labeled.** A CAPS eyebrow or state-group title naming a content section does not by itself compress the content beneath it. Compressed register (Row title IS 18 + Dense Body 13) earns ONLY via structural conditions — 1fr 1fr sibling layout · sub-grid pattern · card-shape container · recessed-bg container. Labels alone do not earn. **Precedent:** flag #43 cascade earning surgical revision 2026-05-09 (§09 Mode B item rows moved from compressed register to sub-section register when the structural earning conditions weren't present).

**Title↔body adjacency contrast belongs to W1 (body-tier ink), not Typography (type ladder).** When title and body need visual distinction, the answer is to step the body ink down one stop on the warm-graphite axis to `--dir-text-body`, NOT to add a new type-axis register or escalate the title size. **Precedent:** Cycle 9 W1 reopen — the documented failure surfaced from type-axis-only differentiation collapsing under real reading; the systemic fix was on the color axis (W1 ladder expansion), not the type axis.

**Body-size vs small-text register split — each ink stop owns one role.** The 5-stop W1 ink ladder (post Cycle 9 W1 reopen) has one role per stop:
- `--dir-text-primary` — titles / nav-active / top-of-ladder
- `--dir-text-body` — body main-flow (IS 15 + Dense 13)
- `--dir-text-body-soft` — body-size supporting (Subordinate aside · §07 summary)
- `--dir-text-secondary` — small text only (IS 10 / 11 / 13: eyebrows / captions / META_VALUE)
- `--dir-detail` — annotation accents / margin rules

Crossing roles between tokens (e.g., `--dir-text-body-soft` on a caption, or `--dir-text-secondary` on body-size supporting text) is drift; correct to the per-role token. **Precedent:** W1 §B Token System anti-drift + Type §H anti-drift back-pointer.

### Mode-axis rules (CSML §11 anti-patterns)

**Color uniform across modes; emphasis lives in type + spacing + content weight, never per-section color shift.** W1 palette is uniform across Framing / Interpretation / Proof / Resolution. A section that "feels heavier" expresses that through bucket composition + content weight, not by switching colors. **Precedent:** CSML §11 reading-mode bucket composition anti-patterns + W1 lock unified-darks rule.

**One density mode for the whole case study.** Coherent-state rule. Per-section density variance is rejected; Cycle 6 Q1 locked Standard density for Ion. Hero density A/B toggle exists for future revisits but does not represent a sanctioned per-section variance. **Precedent:** Cycle 6 Q1 close + flag #5 close (per-module density was rejected).

**Different spacing per section is rejected.** Section→section uses the locked 128 Transition gap (64/64 split around centered divider). Within-section spacing uses the Cycle 6 token map. No section has special spacing rhythm. **Precedent:** CSML §11 reading-mode anti-patterns + Cycle 6 close.

**Oversized "star moment" titles for specific sections are rejected.** Every section gets ISe 32 via Cycle 1 surgical revision. Per-section title size variance would be custom register territory (Cycle 7) and must be earned via CSML mandate, not asserted. **Precedent:** Cycle 5 reading-mode bucket composition anti-patterns + Cycle 7 customs lock.

**New registers introduced per mode are rejected.** Modes compose existing buckets differently; they do not introduce new registers. Custom registers per Cycle 7 are per-module, not per-mode. **Precedent:** Cycle 5 close + Cycle 7 close.

### Interaction-axis rules

**Interaction axes are sanctioned per-module via Cycle 7-style customs, not assumed or extended.** §07 accordion is the only narrative-content interaction in the case study (Cycle 7 Q4). Future stateful interactions (§06 step animations, media zoom, etc.) each need their own custom lock — they do NOT inherit §07's sanction. **Precedent:** Cycle 7 Q4 lock + Cycle 9 §07 audit verified bounded.

**Lab A/B toggles are separate from production interactions.** A toggle in LabShell that lets the user switch between candidate registers / layouts / values is **lab chrome** for visual articulation. It is not a sanctioned in-module narrative interaction. Lab toggles do not inherit §07's interaction-axis sanction. **Precedent:** Cycle 9 §07 audit (separated lab toggles from narrative interactions during the §07 accordion containment check).

### Spacing-as-substitute rules

**Spacing hacks for register differentiation get retired when the register axis becomes available.** When color / weight / italic / family differentiation is forbidden by a lock, spacing can carry hierarchy as an interim — but the spacing solution is temporary. When the register axis opens (e.g., Cycle 9 W1 reopen adding `--dir-text-body-soft`), the spacing hack reverts to default rhythm. **Precedent:** Cycle 9 W1 reopen removed the §07 chosen→summary 16 Compact gap — color axis now carries the chosen↔summary register differentiation; spacing reverted to BODY's natural LH 1.75 stacking. flag #42 close.

### Earning + protocol rules

**Earned exceptions never extend casually; widening requires a new cycle.** A Path B lock with one sanctioned use can be widened to multiple uses only via the outcome protocol (§12) with explicit earning-condition documentation. Casual extension (using the pattern in a new context without an audit + widening) is drift. **Precedent:** Cycle 8 §08 closing takeaway extension caught audit-passes later; Cycle 9 widening protocol-corrected it.

**Reopening any lock requires documented implementation failure.** Same evidence threshold across all locks. Reopens that bypass Step 1 of the outcome protocol fragment the system. **Precedent:** Cycle 9 W1 reopen authorized only after the user identified the specific surface failure (`/gate-a/ion/r1` title↔body collapse) — `feedback_color_palette_changes` requires explicit auth + documented surface.

**Page Width Map ≠ reading column ladder.** Two axes, both sanctioned at their respective layers, do not conflate. Page Width Map (`spacing-layout-rhythm.md` §B) covers page-shell container sizing. Reading column ladder (`GateAIonTextColumnWidthContext.tsx`) covers reading-column maxWidth inside a page shell. **Precedent:** flag #18 scope-distinction close 2026-05-12 + cross-reference note added to `spacing-layout-rhythm.md` §B.

### Audit + cohesion rules

**The 4-zoom cohesion audit pattern is the default post-lock audit.** Within-module · between-modules · between-case-studies (principle) · site-level. Run after any new system locks, in both directions (top-down + bottom-up). **Precedent:** Cycle 8 close — verified Cycles 1–7 system holds at all four zooms in both directions.

**Inline-styled equivalents of locked consts are drift.** When a register is defined as a const (BODY · DENSE · CAPS · META_VALUE in Shell), inline-styled re-implementations of the same register fragment the system. Audit-pass discipline: refactor inline patterns to const references. **Precedent:** `feedback_no_lazy_audit_skips` + Cycle 9 §01 metadata refactor (9 inline-styled sites consolidated to central CAPS + META_VALUE references) + flag #61 stale comment cleanup.

**Stale code comments are drift.** Comments referencing pre-revision register values (e.g., "IS 15/300" post-Cycle-2 flag #36, or "ISe 22/400" post-Cycle-1 ISe 32 escalation) mislead future-Sebs / future-AI even when the code is correct. Audit-pass discipline: update comments when surgical revisions land. **Precedent:** Cycle 8 surgical fix family (flags #51 · #54 · #56 · #57 · #61) — 6 stale comments cleaned in a single pass.

### Voice + content rules (placeholder until Voice system #18 locks)

**Public-facing language does not visibly use internal system terminology.** CSML §11 line 293–306 anti-drift rule. Public case studies do not use terms like "lens," "weight," "family logic," "supporting beat," "tier mode," "operational proof," "compression floor," "diagnosis lens." Internal system language stays internal. **Precedent:** CSML §11 Public vs internal language rule. Will be extended when Voice system #18 locks.

**Content quality is not a register concern — content lives in module rebuilds or content passes.** When a register holds but the specific content reads weakly (e.g., flag #64 — §07 row summaries + §03 req lines under-authored vs §03 close baseline), the resolution is content work scoped to the relevant module rebuild OR a dedicated content pass — not a register change. **Precedent:** flag #64 logged 2026-05-13; scoped to §03 / §07 module-by-module rebuild OR content pass between Cycle 10 close and Project Card audit.

### Where to drill next

Per-system anti-drift sections carry domain-specific rules: Type §H · W1 §B + §H · CSML §11 anti-patterns + reading-mode bucket composition anti-patterns + Public vs internal language rule. The full flag tracker (`cross-system-rules-build-plan.md`) carries the precedent for every rule above.

---

## 14) Open work queued + extension roadmap

The current state of work queued beyond Cycle 10. Two categories: **pending Phase 1.5 systems** (each will extend this manual when it locks, with extension profile per category) + **open flags within Cycles 1–9 scope** (deferred to specific downstream cycles or workstreams).

### Pending Phase 1.5 systems — extension predictions

The extension-protocol-per-category was articulated in §3. Each system below is mapped to its predicted category and the specific extensions its lock will trigger to this manual.

| # | System | Category | Predicted extensions to this manual |
|---|---|---|---|
| **8** | **Hero system** | C (with A-like + B-like aspects) | Pointer entry §3 · Inheritance entry (Type + W1 + Spacing + CSML M1) · **Intent entry** — adds "page-entry intent" as new dimension (the case study spine's intent #0 — hooking before §01 orients) · **Anti-drift entry** — hero zone boundary conditions (hero must serve case-study framing; must not become feature showcase / gallery / page-summary) · Earning entry possible (if hero display register diverges from Clash 52 under real impl) · Worked example recommended — trace hero composition through framework |
| **9** | **Art artifact inventory** | C | Pointer entry · Inheritance (Spacing + Media presentation + CSML artifact distribution rule) · **Earning entry — bounded-experimentation rule** at operating manual level (art sanctioned only when serving module job, never as decoration) · **Anti-drift entry** — sanctioned artifact categories + boundary conditions · Intent entry possible — "evidence-of-thinking intent" as meta-rule |
| **10** | **Art placement map** | C | Pointer entry · Inheritance (CSML artifact distribution rule + Spacing width map) · **Anti-drift entry** — where art is allowed per module (per CSML §11 artifact distribution) + where forbidden · Likely paired with #9 in extension landing |
| **11** | **Motion system** | D (hybrid — heaviest extension) | Pointer entry · Inheritance (every locked system) · **Earning entry — motion ladder (durations + easings + travel distances)** as A-like reference + **state-transition contracts** as B-like reference · **Anti-drift entry** — motion must clarify / reveal / reward, not decorate or perform · **Intent entry — motion-as-voice** new dimension (motion carries intent: considered / energetic / staged / surprise) · Worked example required — trace a motion through the framework (e.g., §07 accordion open animation) |
| **12** | **Animation vocabulary** | D | Pointer entry · Inheritance (Motion system #11) · Named motions mapped to specific timings + curves + intent · Likely paired with #11 in extension landing |
| **13** | **Animation production pipeline** | (process, not system) | Pointer entry only · No structural extension (process / workflow doc, not a lock) |
| **14** | **About page system** | B | Pointer entry · Inheritance (Type + W1 + Spacing + Nav) · **Intent entry — "self-presentation intent"** new dimension (distinct from case-study spine intents) · Earning entry possible (page-tier registers) · Worked example possible — trace one register across §01 case study → About → Footer to show cross-page coherence |
| **15** | **Footer system** | B | Pointer entry · Inheritance (Type + W1 + Nav §3 Layer 6) · Likely paired with #14 in extension landing |
| **16** | **Playground system** | C | Pointer entry · Inheritance (chassis) · **Anti-drift entry — sandboxed experimentation rule** (Playground = bounded sandbox surface) · Intent entry possible — "exploration intent" |
| **17** | **Easter egg system** | C | Pointer entry · **Anti-drift entry — "rare not generic" rule** (frequency rule, trigger rule, sanctioned-when-bounded) · Intent entry possible — "delight bounded by rule" |
| **18** | **Voice / writing system** | D (special case — most consequential single extension) | Pointer entry · Inheritance (structural chassis but ADDS the intent vocabulary §10 framework references) · **Earning entry — voice register variants** (case-study / about / hero / playground voice profiles) · **Anti-drift entry** — public vs internal language (CSML §11 rule extended) · **Intent entry — major surgical revision to §10.** Voice provides concrete per-section intent vocabulary (§01 = "orienting"; §02 = "pressuring"; §04 = "corrective sharper"; §10 = "reflective restraint"). When Voice locks, §10 + §11 placeholders get replaced with Voice taxonomy. Worked examples gain real voice-level traces. |
| **19** | **Toolchain / production split** | B | Pointer entry · Inheritance · Anti-drift entry possible (asset-production timing rules, AI-assisted vs handmade boundaries) |
| **20** | **A11y / fallback system** | B | Pointer entry · Inheritance · **Anti-drift entry** — a11y constraints imposed on other systems (contrast minimums on Type / Color, focus-ring rules, keyboard / reduced-motion / screen-reader rules) |
| **21** | **Performance system** | B | Pointer entry · Inheritance · **Anti-drift entry** — performance constraints (asset budgets, font subsetting, motion performance bounds) |
| **22** | **Content governance / maintenance system** | B (meta-governance) | Pointer entry · Inheritance · Anti-drift entry possible (versioning, archive rules, deprecation) |

### Locked sequence reminder

Per `phase-1-5-order.md`: cycles → persona track Phase A → module-by-module rebuilds → continued Phase 1.5 system locks. Hero (#8) is the next system to lock in the dependency order.

After Cycle 10 close, the pause-checkpoint task triggers: **audit Project Card lab for type drift surfaced by the rules. Mechanical cleanup if needed.** Then §03 directions / persona track Phase A.

### Open flags within Cycles 1–9 scope

Flags that remain open from Cycles 1–9, with their owning resolution path. Full flag tracker (with all 64 flag entries + their statuses) lives in `cross-system-rules-build-plan.md` §10 flag tracker.

#### Architectural — deferred to module-by-module rebuilds

| Flag | Description | Resolution path |
|---|---|---|
| **#14** | §09 Outcomes Eyebrow + Title additions override locked CSML lab pattern | Module-by-module pass after Cycle 10 lock — backport to spec or revert in Shell |
| **#15** | §10 Reflection Title "Placeholder" addition overrides locked spec | Module-by-module pass after Cycle 10 lock — decide between spec update, real Title content, or revert |
| **#45** | §06 Body × Proof state pairings not implemented (CSML §06 lines 376+ lock 3 state pairs; Shell has Body + Subordinate aside + Result line only) | §06 module-by-module rebuild |
| **#52** | §08 trade-off rows off-CSML-spec (current 3-element pattern; CSML §08 says title + body) | §08 module-by-module rebuild |
| **#55** | §10 placeholder title needs real reflective opening copy | §10 module-by-module rebuild · content work per `feedback_solution_section_source_first` |

#### Soft-locks — user-eye verification or content decisions

| Flag | Description | Resolution path |
|---|---|---|
| **#3** | Site-level density seam jolt-test (homepage → case study Airy → Standard handoff) | User-eye visual verification — programmatic audit done |
| **#38** | Card proof mode (Narrow4FeaturedProofMode A/B options) | **Soft-locked 2026-05-24 at `inline-10`** (single line IS 10/500/UC, sub combined inline). No Type-system surgery needed (vs `stacked-13` which would add 13 to compressed-proof exception list). Stays soft until Hero / Cards integration sweep can A/B in real card density contexts. Toggle remains live in lab. |
| **#43** | §09 Mode B path-b revisit if Mode B ships as production winner | ✅ **CLOSED 2026-05-24.** Path A (sub-section register) final; Path B (uniform card rebuild) = dead branch per CSML §09 line 137 (color/chrome cannot do main certainty work). See `case-study-modules/09-outcomes-and-scoreboards.md` §09 close history. |

#### Deferred to other workstreams (per locked sequence)

| Flag | Description | Resolution path |
|---|---|---|
| **#58** | §01:667 + §03:1153 IS 11/UC outliers needing verification | Respective module re-verify passes (§03 quick re-verify + §01 hero zone work) |
| **#59** | §03 alt direction variants bulk drift (IS 11 / IS 12 / text-secondary patterns in 1A-pew-multiples etc.) | Persona track Phase A — rebuild §03 alternative directions per locked registers |
| **#60** | §01 hero TLDR variant inline-styled patterns | Phase 1.5 #8 Hero system + hero zone audit |
| **#64** | Content quality gap — §07 row summaries + §03 req lines under-authored vs §03 close baseline | §07 / §03 module-by-module rebuild OR dedicated content pass between Cycle 10 close + Project Card audit |

### Cross-system rules build sequence — what's next

The Cross-System Rules Build (Cycles 1–10) closes with Cycle 10 (this doc). Sequence after:

1. **Project Card lab audit** (pause checkpoint per `cross-system-rules-build-plan.md` §11). Mechanical cleanup if rules surfaced drift in Project Card lab. ~30 min.
2. **§03 directions / persona track Phase A.** Resume the deferred §03 register-direction work (flags #20 · #21 · #59).
3. **Module-by-module rebuilds.** §06 + §08 + §10 architectural rebuilds (flags #45 · #52 · #55). Optionally a content pass closes flag #64 ahead of or alongside module rebuilds.
4. **Hero system locks (#8).** First Phase 1.5 system to lock post Cycle 10. Triggers the first extension to this manual per the extension roadmap above.
5. **Continued Phase 1.5 system locks** through #22. Each triggers an extension.

### Where to drill next

Full flag tracker: `cross-system-rules-build-plan.md` §10. Phase 1.5 dependency order: `phase-1-5-order.md`. Per-system pending locks: each system has its own step docs at `portfolio-system-lab/docs/system/` and `portfolio-system-lab/docs/labs/`.

---
<!-- §13 — Cross-domain anti-drift · pending draft -->
<!-- §14 — Open work queued + extension roadmap · pending draft -->
## 15) Precedent index

The cumulative memory of the protocol. Every resolution from Cycles 1–9 logged with its outcome-path classification, the lock that owns it, and the closing date. Future cycles cite this index when resolving similar divergences — same shape divergence usually means same path.

Three categories of precedent:

- **Path A — Convergence reveals system holds.** Audits that confirmed the locked system, sometimes with surgical drift cleanup but no register change.
- **Path B — Sanctioned exception earned.** Per-role / per-context exceptions to a locked register or composition.
- **Path C — Systemic revision.** Locked value itself changed; cascade-propagated across the Shell + locked labs.

Plus a sidebar: **tracker reconciliation closures** from the Cycle 9 audit pass — these resolved tracker entries that had been substantively closed in earlier cycles but rows hadn't been updated. Separate kind of close from the protocol-class entries.

---

### Path A — Convergence precedents (system holds)

These resolutions verified the locked system without changing any register / composition / behavior. The trace surfaced the convergent answer; the lock holds.

| Date | Resolution | Owning canonical | Scope |
|---|---|---|---|
| 2026-05-09 | Cycle 5 reading-mode bucket composition audit · §02 / §03 / §09 all confirmed clean | CSML §11 + Cycle 5 close | Mode-axis convergence; surfaced §06 step eyebrow drift (handled separately) |
| 2026-05-12 | Cycle 8 cohesion audit Zoom 2 — 10 section transitions verified uniform (128 Transition gap · centered divider · last-section flag) | CSML §11 + Cycle 6 + Cycle 8 close | Between-modules convergence |
| 2026-05-12 | Cycle 8 cohesion audit Zoom 3 — system content-shape-independent at lock layer (registers + spacing + buckets + customs all transfer) | Cycle 8 close | Between-case-studies principle convergence (full cross-case verification deferred until 2nd case builds) |
| 2026-05-12 | Cycle 8 cohesion audit Zoom 4 partial — shared register system + W1 palette + nav + spacing cohere across homepage + case study (programmatic clean; visual user-eye remains) | Cycle 8 close · flag #3 open for visual | Site-level partial convergence |
| 2026-05-12 | Cycle 9 §05 ops 2×2 grid containment audit · pattern bounded to §05 ops · Cat 3 row tight pair used only in 3 sanctioned contexts (§05 ops · §07 decision rows · §09 Mode B items) | Cycle 9 audit | Custom containment verified |
| 2026-05-12 | Cycle 9 §09 future-layer-last containment audit · composition appears only in §09 Mode A T6 + Mode B footer · certainty-gradient hierarchy §09-internal · no proliferation | Cycle 9 audit | Custom containment verified |
| 2026-05-12 | Cycle 9 §07 accordion containment audit · only narrative-content interaction in case study · other useState instances are lab A/B toggles or locked Navigation chrome · no proliferation | Cycle 9 audit | Custom containment verified |
| 2026-05-13 | TOC audit · group labels match locked Nav vocabulary · child item typography matches Nav §5 ladder · TOC spacing matches Nav §6 + Cycle 6 + Current-section indicator matches Nav §7/§8 lock + Group header in-group state shift matches Nav §7 + Back-to-top placement/threshold matches Nav spec | Nav §5 / §6 / §7 / §8 + Cycle 9 close | TOC convergence across multiple Nav sub-locks (with two drifts surfaced separately as #62 + #63) |

---

### Path B — Sanctioned exception precedents (per-role / per-context exceptions)

These resolutions earned a sanctioned exception when the locked value couldn't deliver the role's specific intent + context. Each has explicit earning conditions + sanctioned-use list + anti-drift.

| Date | Resolution | Owning canonical | Sanctioned use(s) |
|---|---|---|---|
| 2026-05-12 | **Cycle 7 Q1 §05 Ruby Guardrails 2×2 grid + Cat 3 row tight pair** (Phase A drift cleanup + Phase B 2×2 grid lock + Before/After artifact placeholder pattern) | CSML §05 (Bet/Reframe) + Cycle 7 close | §05 ops blocks only |
| 2026-05-12 | **Cycle 7 Q2 Path A §09 Primary outcome statement** Body 15 / text-primary in raised-bg container (container alone earns "primary" via cascade card-shape condition) · flag #28 resolved · widened Cycle 9 | CSML §09 + flag #28 | §09 T3 (initial scope) → widened to Container-earned primary composition lock |
| 2026-05-12 | **Cycle 7 Q3 §09 Future-layer-last canonical footer composition** (recessed-bg + Dense 13 + 1fr 1fr + CAPS eyebrow + last position) — three sub-locks: position rule + footer composition + certainty-gradient hierarchy | CSML §09 + Cycle 7 close | §09 Mode A T6 + §09 Mode B footer |
| 2026-05-12 | **Cycle 7 Q4 §07 Accordion interaction axis** — three sub-locks: canonical interaction pattern + first-open-by-default + collapsed-must-carry-value · plus system principle (interaction axes sanctioned per-module, not assumed or extended) | CSML §07 + Cycle 7 close | §07 only · plus broader principle applies to all future stateful interactions |
| 2026-05-12 | **Cycle 9 META_VALUE register** formal sanction (Dense Body 13 + text-secondary color override · scoped to metadata-value role paired with IS 10/UC label in structurally-bounded panel) · flag #48 resolved · 9 inline-styled sites refactored to central META_VALUE const | Type lock §F Exception Policy + §H Anti-Drift · W1 spec §C semantic role · Shell `:552` central const | §01 facts band · §03 Methods/Artifacts metadata blocks |
| 2026-05-12 | **Cycle 9 Container-earned primary composition** widening (Cycle 7 Q2 §09-only lock → general lock covering §09 T3 + §08 takeaway) · flag #28 widened · §08 ad-hoc extension protocol-corrected | CSML §11 new "Container-earned primary composition" sub-section + Type §H back-pointer | §09 T3 + §08 closing takeaway |
| 2026-05-13 | **Cycle 9 W1 reopen `--dir-text-body-soft`** ink-tier register added at L*48.7 / warm-Δ 16 / contrast 4.58:1 AA edge · scoped to body-size supporting text role · flag #42 resolved (body→body sub-line scan now carried by color axis; spacing hack removed) | W1 §B Token System + §C Semantic Roles + §H Anti-Drift · Type §D Subordinate aside register color updated · Shell Subordinate aside sites refactored | §07 catch + §07 summary + §06 "My move:" ×4 + §03 pattern close + §04 stakes + (§10 reflection asides when module rebuild lands) |

---

### Path C — Systemic revision precedents (locked value changed)

These resolutions changed a locked value globally because combined application revealed the lock was wrong. Each cascade-propagated across the Shell + locked labs + dependent surfaces.

| Date | Resolution | Owning canonical | Cascade scope |
|---|---|---|---|
| 2026-05-06 | **Cycle 1 surgical revision · Row title role added at IS 400 / 18** (Cycle 3 cascade work surfaced Hierarchy Economy budget gap; new register added to close it) · cascade table flag #37 | Type lock §D Role Map + §B Scale Table | Row title slot added to ladder; cascade applied where compressed-row context earns |
| 2026-05-07 | **Cycle 1 surgical revision · Section heading ISe 32 escalation** (was ISe 22; promoted to ISe 32 / Editorial Intro Heading register reactivated from "no live use" reserved status; ISe 22 displaced to top claim + sub-section title roles) — addresses Hierarchy Economy 18-vs-15 closeness problem surfaced by cascade work | Type lock §B + §D + §H | All 9 section Titles in Shell · SHPair refactored · cascade rebuilt §01–§10 · canonical Path C precedent #1 |
| 2026-05-07 | **Cycle 2 surgical revision · IS 300 → IS 400 phantom-weight fix** (Google Fonts does not ship IS 300; browsers silently fell back to 400; spec updated to match actual rendering) · flag #36 resolved | Type lock §B + §C + §D (status line + scale table + utility weight rules + role narrative + exception policy all updated 300→400) · `TypographySystemFinalPage.tsx` 10 fontWeight values updated · `fonts.css` import URLs updated to remove phantom 300 from wght@ query · Shell `GateAIonR1Shell.tsx` 68 `fontWeight: 300 → 400` | System-wide · no visual change (rendering was always 400 via fallback) · spec-accuracy fix · canonical Path C precedent #2 |
| 2026-05-08 | **Cycle 4 surgical revision · ISe 18 italic Pull quote register added** to the locked Type ladder (opens ISe italic SCOPED to Pull quote register only with anti-drift) · flags #19 + #23 resolved | Type lock §B + §D + §H | §02 blockquote · §04 deeper-issue line |
| 2026-05-08 | **Cycle 4 surgical revision · IS italic + IS 600 inline emphasis register added** to the locked Type ladder (italic + bold combination = highest-emphasis register · scoped to body inline use only) | Type lock §B + §D + §H | §02 inline emphasis on "didn't trust the output enough to iterate" |
| 2026-05-08 | **Cycle 4 surgical revision · IS 400 italic / text-secondary Subordinate aside register added** to the locked Type ladder (italic + softer body color · scoped to body-size supporting use only) · color subsequently updated to `--dir-text-body-soft` per Cycle 9 W1 reopen | Type lock §B + §D + §H + W1 §C | §03 pattern close + §04 stakes + §06 "My move:" ×4 + §07 catch + §10 reflection asides |
| 2026-05-11 | **Cycle 6 surgical revision · 128 Transition token sanctioned** (was Reserved · not in use in `spacing-layout-rhythm.md`) · moved to "Transition: section→section gap" with 64/64 split around centered divider · Job map gains a Transition row at 128 | Spacing §B token table + Job map + §11 Anti-drift | All 10 section→section gaps + sectionDivider geometry |
| 2026-05-12 | **Cycle 7 Q1 §05 Phase A drift fix** — Ruby Guardrails dek + Interaction Contract tagline reverted from IS 11 / dir-detail (Caption-tier misuse per flag #31) to Body 15 main-flow | CSML §05 + Type lock § utility roles | §05 only · part of broader Phase A drift cleanup |
| 2026-05-12 | **Cycle 8 cohesion audit surgical fixes** (18 fixes across §01 + §04 + §06 + §08 + §10) — body→body 16→24 paragraph rhythm in §01 + §04 · §01 contribution topBorder 32→24 · §06 4 step eyebrows replace_all IS 11→IS 10 with CAPS const + chunk-gap toggle · 6 stale comments cleared across §02/§04/§05 + 3 broader code sites · §08 closing takeaway register fix to match §09 T3 pattern · §10 inline eyebrow→CAPS const · §04 stakes converted to Subordinate aside per §03 pattern · flags #44/#49/#50/#51/#53/#54/#56/#57/#61 all resolved | CSML modules + Type lock + Shell | Per-module drift cleanup; canonical post-lock audit pass |
| 2026-05-13 | **Cycle 9 W1 reopen `--dir-text-body`** ink-tier addition at L*22.7 / warm-Δ 6 / contrast 11.7:1 AAA · W1 ladder expanded from 4 stops to 5 · BODY/DENSE consts shift globally · `theme.css` updated in both labs · `LockedW1Overview.tsx` updated · `typography-system.md` Body register color reference updated · canonical Path C precedent for the title↔body adjacency problem | W1 §B Token System + §C Semantic Roles + §D Interaction & Depth Behavior + §G CSS contract + §H Anti-Drift + §I Provenance · Shell BODY + DENSE consts · Type §D Body register narrative · `theme.css` (Homepage Surfaces v2 Lab + Color System Lab) · `LockedW1Overview.tsx` | System-wide body main-flow ink · canonical Path C precedent #4 (system-wide ink ladder expansion) |
| 2026-05-13 | **TOC audit refactor · TOC + Back-to-top opacity-driven state model** (Nav system conformance gap — was color-token swap, refactored to opacity 0.55 / 0.80 / 1.0 over `var(--dir-text-primary)` per Nav §7 lock) · flag #62 resolved · side benefit: TOC inactive labels independent of `--dir-text-secondary` token (W1 reopen lift scope toggle no longer affects TOC) | Nav §7 + Shell `ChildItem` + Shell Back-to-top button | TOC inactive labels + Back-to-top default state |
| 2026-05-13 | **Nav §6 rail-padding first-section-align override sanctioned** (16px default + override when CONTEXT label / first-eyebrow alignment is a design intent) · flag #63 resolved | Nav §6 Rail top internal padding | Case-study rail (48px override) · Homepage local nav (16px default if it ever adds rail) |

---

### Tracker reconciliation closures (Cycle 9 close pass)

Separate from the protocol-class entries above. These resolutions were substantively closed in earlier cycles but their tracker rows hadn't been updated. Cycle 9 close reconciled the tracker. Listed for completeness; not a separate outcome path.

| Flag | Originally resolved in | Tracker reconciled |
|---|---|---|
| #2 | §03 production layout doesn't have Lead→media direct gap | 2026-05-12 (Cycle 9) — scope-resolved + alt variants → flag #59 |
| #4 | Cycle 1 SHPair refactor uniform across §01–§10 | 2026-05-12 (Cycle 9) — verified uniform |
| #5 | Case Study Module Lab was never type-locked (framing correction) | 2026-05-12 (Cycle 9) |
| #7 | §05 "the bet" folded into standard section opening pattern (no custom) | 2026-05-12 (Cycle 9) |
| #9 | §09 primary outcome — duplicate of #28 | 2026-05-12 (Cycle 9) |
| #10 | §09 future-layer-last position rule | Cycle 7 Q3 (Path B custom) |
| #11 | §07 accordion | Cycle 7 Q4 (Path B custom) |
| #12 | Per-row titles propagated to ISe 22 per cascade replace_all | Cycle 3 (Path C cascade work) |
| #18 | Width Map gap (sebs preset 840px) — scope-distinction (page Width Map ≠ reading column ladder) | 2026-05-12 (Cycle 9) |
| #24 | §05 Ruby Guardrails sub-bullets (IS 12/500 + IS 11/300 drift) | Cycle 7 Q1 (Path B custom) + Phase A drift cleanup |
| #27 | §08 close box (IS 12/500/LH 1.6 drift) | Cycle 8 (Path C surgical fix → §09 T3 pattern) — superseded by flag #53 |
| #31 | Caption 11 list-row body — scope-split close (§05 resolved Cycle 7 Q1; §03 native-original anti-example sanctioned via flag #20) | 2026-05-12 (Cycle 9) |
| #37 | Cascade table locked + applied across all production-path Shell content | Cycle 3 (Path C cascade work) — application distribution to downstream flags #21/#22/#38/#45/#52/#55/#59/#60 |
| #46 | Stale comments — `:1217` §03 native-fixed SYSTEM ADHERENCE comment block updated to Cycle 2 surgical revision values | 2026-05-13 (Cycle 9) |

---

### How to use this index

When a new divergence surfaces:

1. **Scan Path A precedents** to see if a similar trace has been logged as convergent — if so, the convergent answer likely applies again.
2. **Scan Path B precedents** to see if a similar role / context combination earned a sanctioned exception — if so, your divergence may earn the same Path B treatment, or widen an existing Path B lock.
3. **Scan Path C precedents** to see if a similar systemic divergence triggered a surgical revision — if so, your divergence may be Path C.

The Cycle 1 ISe 32 escalation + Cycle 2 IS 400 phantom-weight + Cycle 4 italic register additions + Cycle 9 W1 reopen body-tier ink form the **canonical four-precedent Path C set**. Future systemic divergences cite these as protocol precedent.

The Cycle 9 META_VALUE + Container-earned primary composition + body-soft register form the **canonical three-precedent Path B set**. Future per-role exceptions cite these.

### Where to drill next

The full flag tracker with every Cycle 1–9 flag entry (64 flags total) lives in `cross-system-rules-build-plan.md` §10. Each flag entry carries source cycle + intended addressing cycle + status + close-date when resolved. The build plan is the working surface; this index is the reference surface.

When future cycles close, append new precedents to this index. Cycle 10 close (this doc lock) does not produce new precedents — it locks the framework that future cycles will reference when producing precedents.

---

## Cycle 10 close — operating manual locked 2026-05-13

This doc locks the cross-system rules consolidated from Cycles 1–9. **Locked for current scope.** Mutable through documented surgical revisions when:

- A new Phase 1.5 system locks (extensions per §14 roadmap)
- A documented implementation failure on a real surface surfaces a divergence the current locks don't carry (outcome protocol per §12)

The companion task — adding the "Operating manual: `cross-system-rules.md`" pointer to each per-system lock doc's status line — is the closing surgical pass. See §3 bidirectional pointers note for the rationale and the list of per-system docs that gain the pointer.

After Cycle 10 close, the post-Cycle-10 pause-checkpoint task triggers: audit Project Card lab for type drift surfaced by the rules. Mechanical cleanup if needed. Then §03 directions / persona track Phase A resumes per `phase-1-5-order.md`.

