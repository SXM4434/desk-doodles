# ConFig Makeathon — Official Rules, Eligibility Verdict, and Make-Framing

**Compiled:** 2026-06-12 (Day 11). **Deadline:** 2026-06-18 11:59 PM PDT.
**Purpose:** single source for the official rules + an honest eligibility verdict + judge-ready framing sentences for the README/submission that describe what we ACTUALLY did with Figma Make. No fabrication of Make-authoring.

> Method note: the official guidelines page (`contra.com/community/topic/configmakeathon/guidelines`) is a JS SPA — a plain fetch returns only `<meta>` ("$100k in prizes for ideas built in Figma"). The rules text below was retrieved via a server-side rendering proxy (`r.jina.ai`) on 2026-06-12 and cross-checked against the internal `submission-checklist.md` (rendered 2026-06-11, same method) and `makeathon-plan.md` §1.3–1.5 (confirmed 2026-06-04). All three agree on every point re-checked. Where a source is stale or in tension, it is flagged inline — no point is presented as settled when it isn't.

---

## 1. Eligibility — the load-bearing question

**Q: Does the submission have to be BUILT IN Figma Make, or just USE Figma's suite somewhere?**

### Official guidelines (LIVE, binding) — the broad reading

Exact text, retrieved 2026-06-12 via rendering proxy, confirmed verbatim twice in the same session:

> **"Must be made using Figma's suite of products (Figma Make, MCP, agent, etc.)"**

Source: https://contra.com/community/topic/configmakeathon/guidelines

This is the **governing requirement** and it is deliberately broad: it names a *suite* ("Figma Make, MCP, agent, etc.") rather than mandating Make as the sole authoring environment. The novel-use judging category reinforces the breadth — it rewards usage "across Make, MCP, Local, Weave, design agent, etc." The published surface being a Make site satisfies "made using Figma's suite of products."

### Stale terms page (NOT binding for this edition) — the narrow reading

The terms page (https://contra.com/figma-hackathon-terms) carries a stricter phrasing:

> **"Predominantly created using Figma's products and leverage Figma Make"**
> **"Significant portions of the project must be developed during the Hackathon"** (original work clause)

**This page is from an earlier Figma hackathon edition and is NOT confirmed for the ConFig edition.** Hard evidence it is stale: the deadline it states is **"March 2nd 2026 at 11:59pm PST"** — the wrong date for an event that runs through June 18, 2026. Its eligibility framework (18+, OFAC/sanctions-country exclusions, you keep IP but grant a perpetual promo license) is the best public signal we have for those areas, but its build-tool phrasing should not be treated as the binding rule when the live guidelines page says something broader.

### Verdict

**SAFE — with a managed-risk caveat.** Under the binding live guidelines ("made using Figma's suite of products"), our workflow qualifies cleanly: the app is deployed to and runs as a Figma Make site, plus we use Figma Weave (and, if access confirmed, Agent/MCP) — that is multi-product suite usage. The only path on which we'd be exposed is if a judge applied the *stale* terms page's narrower "predominantly created using Figma's products and leverage Figma Make" standard to a workflow that authored source in a local Vite repo and imported it into Make. That standard is not the published rule, but because the wording exists in a Figma-branded terms doc, it is a non-zero risk that Sebs should be aware of and that the framing below is written to neutralize. See §5.

---

## 2. Prize structure ($100k total)

Source: guidelines page (rendering proxy 2026-06-12) + `makeathon-plan.md` §1.4 (confirmed 2026-06-04). Agree exactly.

| Prize | Amount | Criterion (as published) |
|---|---|---|
| **Grand Prize** | **$50,000** | Best overall across all 4 judging categories |
| **Runner-Up** | **$15,000** | Delivered on all dimensions |
| **Innovative Workflow Award** | **$10,000** | Most inventive design-to-build workflow |
| **Building with Purpose Award** | **$10,000** | Most exemplary use of design to solve real problems |
| **Build-in-Public Award** | **$10,000** | Most generous documentation of process for the community |
| **Community Favorite** | **$5,000** | Makes people stop scrolling |

Teams ≤ 2 (solo allowed); only the submitter receives winnings (per `submission-checklist.md` §1). Winners announced **June 23 at Config** (internal plan §1.1, confirmed 06-04; not re-verified this session).

### Our targeting (from `makeathon-plan.md` §1.5 — unchanged)
- **Grand ($50k):** conditional (needs strong showing across all 4 categories).
- **Runner-Up / Innovative-Workflow / Build-in-Public / Community-Favorite:** strong fit.
- **Building-with-Purpose:** weak — **do NOT target** (Desk Doodles is creative/expressive, not solving a serious real-world problem; don't twist the narrative).

---

## 3. Judging criteria + scoring

Source: guidelines (rendering proxy 2026-06-12) + plan §1.3. Four categories × 5 points = 20 max, plus two +5 bonuses (max 30).

| # | Category | What it rewards |
|---|---|---|
| 1 | **Quality of work** | Design + build + impact + craft |
| 2 | **Quality of idea** | Solves a real problem |
| 3 | **Quality of video** | Workflow + design decisions + emulatable process |
| 4 | **Novel / innovative Figma use** | "Across Make, MCP, Local, Weave, design agent, etc." |
| Bonus | **Social share** | +5 |
| Bonus | **Figma Community share** | +5 (potential to be featured at top of figma.com/community) |

---

## 4. Required submission deliverables (all required to qualify)

Source: guidelines (rendering proxy) + plan §1.3 + `submission-checklist.md` §1.

1. **Live project link** — the published `*.figma.site` Make URL.
2. **Community / working project file link** — the Make file shared to Figma Community.
3. **Main video** — walks through the work, the idea, the problem solved, and the workflow used to bring it to life. (No official max length is published; our ≤5-min target / ~3:10 VO+captions cut is an internal convention, not a rule.)
4. **30-second project walkthrough video** for the social post — covers the project, the process, and the tools used.
5. **Social post** on Instagram / X / LinkedIn tagged `#ConfigMakeathon` + `@figma`, with 1–2 sentences on creation + tools. Guidelines social-sharing section states verbatim: **"Note: this is required to qualify for the prize pool."**
6. **Submit via the Contra platform** (entry form prompts for social links after submission).

**Tool requirement (the eligibility line again, in context):** "Must be made using Figma's suite of products (Figma Make, MCP, agent, etc.)" — published surface = the Make site.

### Honesty notes (what is NOT cleanly findable)
- **Timezone:** guidelines render says **11:59pm PDT**; the Contra announcement post says "11:59pm PST." Treat **PDT as binding** (earlier wall-clock; June California = PDT anyway). File ≥3 hours early.
- **Terms page is stale** (March 2026 deadline) — its IP/eligibility terms are the best public signal but not confirmed verbatim for this edition.
- No published rubric weighting beyond flat 5-pts-per-category; no published AI-usage policy.

---

## 5. Make usage — what we ACTUALLY did, and how to frame it honestly

### The real workflow (the ground truth — do not misrepresent)
Per `project_desk_doodles_local_is_canonical` and CLAUDE.md: development happens in a **local Vite + React + TS repo** (`~/Desktop/Projects/desk-doodles/`, public on GitHub for Build-in-Public). **Figma Make is used as a deployment + live-test surface**, not the authoring IDE. Concretely and verifiably:
- We ran **Make checkpoints** (checkpoint #1 = commit `e6c7889`, 34 files drag-dropped + AI-routed in Make on 2026-06-10; checkpoint #2 planned with the full social/3D product).
- We **uploaded the app into Figma Make** and **ran it live in Make's preview** (the Day 4 Rapier-vs-cannon smoke test was decided BY running both in Make's preview across reloads; the whole stack was verified loading in Make).
- The **published submission surface is the Make site** (`*.figma.site`) and the working file is **shared to Figma Community** — both deliverables are genuinely Make artifacts.
- We deliberately **did not** push Make→GitHub (to keep the Build-in-Public commit trail clean), so it's accurate to say we author locally and deploy/run through Make — NOT that the app was authored inside Make.

### Candidate framing sentences (all STRICTLY TRUE — pick one or blend)

These emphasize the genuine live-deploy + live-test usage of Make without claiming Make was the authoring environment. None fabricates Make-authoring.

> **A (recommended — emphasizes Make as the running product surface + suite usage):**
> "Desk Doodles ships as a live Figma Make site — the app is deployed to and runs in Figma Make, where we ran it live across the build via Make checkpoints, with the working file shared to the Figma Community. Figma Weave produced the demo's motion assets, making this a multi-product Figma build."

> **B (emphasizes the iterative live-test loop):**
> "We built and hardened Desk Doodles against Figma Make throughout — uploading the app at recurring Make checkpoints and running it live in Make's preview to verify the full experience deploys and behaves there, with the published `*.figma.site` as the submission surface."

> **C (tightest, social-post length):**
> "Made with Figma's suite — deployed and run live as a Figma Make site, with motion assets from Figma Weave. #ConfigMakeathon @figma"

### Why these are safe and honest
- They claim Make as the **deployment + live-test + published surface** — all literally true and verifiable (checkpoints, preview runs, the `.figma.site` URL, the Community share).
- They name **Figma Weave** (and MCP/Agent if confirmed) so the "suite of products" requirement is satisfied beyond Make alone — which is exactly what the broad guidelines language rewards.
- They **never say** the app was authored/coded inside Make, because it wasn't. No false provenance (per `feedback_research_first_no_fake_provenance`).

### Recommended sentence
**Option A** for the README/submission body (full suite + running-product framing), with **Option C** as the social-post one-liner.

---

## 6. Eligibility risk + actions for Sebs

**Verdict: SAFE under the live guidelines; MANAGED-RISK only against the stale terms page.**

- **The risk is narrow and second-order:** the binding guidelines say "made using Figma's suite of products," which we satisfy. The only exposure is the stale terms page's "predominantly created using Figma's products and leverage Figma Make" wording — not the published rule, but it exists in a Figma-branded doc.
- **How the framing neutralizes it:** Options A/B/C foreground Make as the live running + published surface and add Weave (+ MCP/Agent), so the submission reads as a genuine multi-product Figma build rather than "a local app we exported." That is both true and the strongest honest posture.
- **Residual unknowns (not blockers):** (1) timezone PST/PDT mismatch — file early; (2) terms-page IP/eligibility wording unconfirmed for this edition; (3) Agent access required pre-June-3 preregistration — if absent, drop Agent from the workflow story honestly (Make + Weave + MCP still qualifies as multi-tool); (4) Supabase 7-day auto-pause — keepalive must be verified firing before judging or the live demo is dead.

---

## Sources

- **Official guidelines** (binding; rendering proxy 2026-06-12, confirmed twice): https://contra.com/community/topic/configmakeathon/guidelines — "Must be made using Figma's suite of products (Figma Make, MCP, agent, etc.)"; social post "required to qualify for the prize pool."
- **Contra announcement** (date/prize-pool only): https://contra.com/community/Pq6S4yhl-the-figma-x-contra-config-makeathon — "$100K in prizes," June 4 launch.
- **Terms page** (STALE edition — flagged §1): https://contra.com/figma-hackathon-terms — "Predominantly created using Figma's products and leverage Figma Make"; "Significant portions of the project must be developed during the Hackathon"; 18+; OFAC/sanctions exclusions; perpetual promo license; deadline stated as "March 2nd 2026" (the staleness tell).
- **Internal:** `docs/locked-refs/F3-smart-hachure-system/makeathon-plan.md` §1.3–1.5; `docs/design/submission-checklist.md` §1; `docs/memory/project_desk_doodles_local_is_canonical.md`; CLAUDE.md.
</content>
</invoke>
