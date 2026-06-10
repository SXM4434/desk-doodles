# Repo Architecture and Doc Layers

## Purpose

This doc is the single reference for how the portfolio project is structured — what exists now, what is planned, and what each layer is for.

It is not a workflow status doc. It is not a module spec. It is not a task list.

---

## Current state vs. future state

| Item | Status |
|------|--------|
| `portfolio/` root | Current — exists |
| `portfolio-system-lab/` | Current — active workstream |
| `portfolio-site/` | Current — exists as an empty directory; reserved, not the active workstream |
| `docs/` subfolders (locked, system, labs, tooling, banks, references) | Current — all exist as folders |
| Written articulation bank docs | Not yet created |
| `docs/banks/case-study-modules/` subfolder | Planned future path — folder does not exist yet |
| Monorepo | Planned future state — not yet built |

---

## Doc layer map

| Layer | What it holds | Current source of truth | Future destination | What does NOT belong here |
|-------|--------------|------------------------|-------------------|--------------------------|
| `docs/locked/` | Finalized, source-of-truth system specs. Things that are decided and should not drift. | `case-study-module-system-v2.md`, `color-system-w1.md`, etc. | Stays in `locked/` unless explicitly superseded | Draft exploration, workflow status, tooling references, bank content |
| `docs/system/` | Cross-cutting meta docs only: phase order, north star, review lenses, brand direction, architecture rules, active editorial rules, toolchain planning. 7 files max — if it grows, something is wrong. | `north-star-filter.md`, `phase-1-5-order.md`, `phase-2-v1-brand-direction.md`, `editorial-typography-rules.md`, `toolchain-production-split-waves.md`, `review-lenses.md`, this doc | Stays in `system/` | Step docs, phase plans, lab history, skills lists, runtime dependency decisions |
| `docs/labs/` | Working history and step docs organized by which lab produced them. Subfolders: `case-study/`, `typography/`, `spacing/`, `navigation/`, `media/`, `color/`, `applied-surfaces/` (homepage, ion). These are upstream decision history — the locked doc always wins. | Step files per subfolder | `applied-surfaces/` grows at Gate A and beyond | Locked specs, cross-cutting meta docs, tooling decisions |
| `docs/tooling/` | Active tools, skills stack, use-now / use-later / ignore references, skill-vs-doc decisions, architecture watchlist. Things that govern what tools to use and when. | `use-now.md`, `skills-stack.md`, `skill-vs-doc-decisions.md` | Stays in `tooling/` | Module specs, locked decisions, implementation code |
| `docs/banks/` | May eventually hold extracted written bank docs for case study modules. Not every module will necessarily need one. | Nothing yet — written bank docs do not exist | `docs/banks/case-study-modules/` (planned subfolder, not yet created) | Visual articulation pages (those live in the lab app), locked module specs (those live in `docs/locked/`) |
| `docs/references/` | External pattern/reference material | `design-engineer-patterns.md` | TBD | Active tools, locked decisions, system rules |
| `apps/Case Study Module Lab/` | Internal visual articulation lab — comparison pages, tier family pages, bank explorations in code | **Current source of truth for visual bank exploration** | Stays in the lab app during Phase 1.5; may feed into production site decisions later | Written bank docs, locked specs, production site code |

---

## Source-of-truth precedence

When a question comes up, use this order:

| Question type | Source of truth |
|---------------|----------------|
| Workflow / current sequence | `CLAUDE.md` |
| Visual case-study module exploration | Internal visual articulation lab (`apps/Case Study Module Lab/`) |
| Locked module / system decisions | `docs/locked/` |
| Planning / structure / architecture rules | `docs/system/` |
| Step-by-step working history for a lab | `docs/labs/<lab-name>/` |
| Applied hiring-surface work (Gate A+) | `docs/labs/applied-surfaces/` |
| Tool usage and timing | `docs/tooling/` |

---

## Lab vs. banks distinction

**Visual articulation — current source of truth:**
The internal visual articulation lab (`apps/Case Study Module Lab/`) is where all visual bank exploration happens right now. Module comparison pages, tier family pages, and Ion implementations are TSX pages in this app. This is the authoritative record of visual module decisions.

**Written bank docs — do not exist yet:**
Written articulation bank docs would eventually live in `docs/banks/case-study-modules/`. That path is planned, not current. No written bank docs exist.

Do not create placeholder bank docs for individual modules. The two layers are separate by design. The lab is for visual exploration and locking. Written bank docs — if created — would hold prose-level module grammar, wording guidance, and tier rationale. If the visual lab page is enough, do not extract a written bank doc just for symmetry.

---

## portfolio-site/ status

`portfolio-site/` exists as a directory but is currently empty and is not the active workstream.

It is reserved for the production portfolio site. It should not be treated as an active workstream until Phase 1.5 system definition is complete and Phase 2 / Phase 3 implementation is explicitly opened.

---

## Planned monorepo

A monorepo migration is planned but has not been started.

The current structure is:

```
portfolio/
├── portfolio-system-lab/   ← active workstream
└── portfolio-site/         ← empty placeholder
```

The future monorepo structure has not been fully defined. When monorepo planning begins, consult `docs/tooling/design-harness-watchlist.md` for relevant architecture references.

Do not treat the monorepo as current-state reality. It is future-planned architecture only.

---

## Anti-drift rules

This doc is not:
- a workflow status tracker — that belongs in `CLAUDE.md`
- a module spec or bank content doc — that belongs in `docs/locked/` and the lab app
- a skills or tooling reference — that belongs in `docs/tooling/`
- an implementation guide
- justification for fake completeness or premature folder filling

If this doc is being used to make implementation decisions, stop. It is a structural reference only.
