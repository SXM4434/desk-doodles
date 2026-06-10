# Spacing + Layout Rhythm — Locked

**Status: LOCKED — Final.** Spacing scale, width map, density modes, break rules, usage map, and anti-drift rules are all finalized. Do not reopen exploration unless the system demonstrably fails on actual implementation surfaces.

**Operating manual:** `cross-system-rules.md`. Read first when applying this system to a new surface or resolving a divergence — the cross-system integration patterns, intent + context framework, outcome protocol, and precedent index live there.

Source steps: `docs/system/spacing-layout-rhythm-step-1.md` through `step-6.md`. Lab proofs: `apps/Spacing Layout Rhythm Lab/`.

---

## Overview

This system controls how space is allocated across all portfolio surfaces. It defines the token ladder that all spacing decisions reference, the width containers that govern layout, the density modes that adapt rhythm to context, and the break rules that define when the standard grammar may intentionally yield. All values were confirmed through visual proof in the dedicated Spacing + Layout Rhythm Lab before being locked here.

---

## A) Spacing Scale

Eleven tokens. Fixed step ladder. All values exact.

| Token | px | Job |
|-------|----|-----|
| space-1 | 4 | Sub-micro: icon nudges, tight rule offsets |
| space-2 | 8 | Micro: icon-to-label gap, tag internal gap, inline metadata |
| space-3 | 12 | Tight: label-to-field, list item gap, caption-to-media |
| space-4 | 16 | Component: internal component padding (standard default) |
| space-5 | 24 | Block: paragraph gap, card internal block rhythm |
| space-6 | 32 | Section-dense / subsection: sub-section divider in dense mode |
| space-7 | 48 | Section: between major content blocks within a page section |
| space-8 | 64 | Hero: hero internal padding, hero-to-content handoff |
| space-9 | 80 | Break (first): controlled exception — first escalation |
| space-10 | 96 | Break (escalation): controlled exception — only if 80px demonstrably fails |
| space-11 | 128 | Transition: section→section gap (case study + multi-section surfaces). Centered around an optional section divider as 64/64 split. Not a Break token. *Sanctioned 2026-05-11 via Cycle 6 Q5 — was Reserved.* |

### Job map

| Name | Value | Use |
|------|-------|-----|
| Micro | 8 | Icon gaps, inline metadata, tag internals |
| Tight | 12 | Label-to-field, list item, caption-to-media |
| Component | 16 | Internal component padding — standard default |
| Block | 24 | Paragraph rhythm, card internal spacing |
| Section | 48 | Between major blocks within a section |
| Hero | 64 | Hero padding, hero-to-content transition |
| Transition | 128 | Section→section gap on multi-section surfaces. 64/64 split around an optional centered divider. Sanctioned 2026-05-11 (Cycle 6 Q5). |
| Break | 80 / 96 | Controlled exception only — see Section E |

---

## B) Width Map

Four containers. All values exact.

| Name | px | Use |
|------|----|-----|
| Reading | 680 | Editorial body text, long-form prose |
| Standard | 1120 | Default content container for most surfaces |
| Wide | 1280 | Multi-column layouts, parallel-column media proofs |
| Shell | 1440 | Page shell / max site width |

### Desktop inset

48px from each edge inside full-bleed and shell contexts. Content within full-bleed surfaces still respects inset logic: 48px desktop · 32px tablet · 20px mobile.

### Width usage rules

- Reading (680) is for prose only — not component containers, not card grids
- Standard (1120) is the correct default for nearly all surfaces
- Wide (1280) must be earned — use only when parallel columns genuinely cannot function at Standard width
- Full-bleed escapes the container entirely — structural justification required (see Section E)
- Do not use Wide as a default for "bigger feels better"

### Note — Page Width Map vs. text reading column ladder

The Width Map above governs **page-shell** sizing (the container the whole page lives inside). It is distinct from the **text reading column** ladder, which governs the maxWidth of the reading column *inside* the page shell.

The text reading column ladder is research-grounded (Bringhurst 45–75ch optimal · Ruder · JLREQ · Tufte · Stripe · Medium · Nature · IEEE) and offers 11 sanctioned widths from 340px to 920px. It is implemented in the Homepage Surfaces v2 Lab at `apps/Homepage Surfaces v2 Lab/src/app/state/GateAIonTextColumnWidthContext.tsx`.

These are two axes, not one:

- **Page Width Map** (this section) — page-shell containers · Reading 680 / Standard 1120 / Wide 1280 / Shell 1440 · governs the outer page frame
- **Text reading column ladder** (research-grounded) — 340 / 480 / 560 / 640 / 680 / 720 / 760 / 840 / 920 px · governs the reading-text column inside the page shell

Both are sanctioned at their respective layers. Do not conflate them as one map.

---

## C) Density Modes

Three modes. Each mode is a complete coherent state, not a per-token override.

| Token | Dense | Standard | Airy |
|-------|-------|----------|------|
| Component | 12 | 16 | 16 |
| Block | 16 | 24 | 32 |
| Section | 32 | 48 | 64 |
| Hero | 64 | 64 | 80 |
| Micro | 8 | 8 | 8 |
| Tight | 12 | 12 | 12 |

Micro and Tight are shared anchors — stable across all three modes.

### Mode usage

| Mode | When |
|------|------|
| Dense | Compact data surfaces, dense card grids, high-information contexts |
| Standard | Default for all surfaces — correct starting point unless a specific mode is justified |
| Airy | Opening / entry / hero-transition surfaces only — not body sections, not card grids |

### Mode rules

- Standard is the correct default. Start here; move to another mode only when a specific structural reason justifies it.
- Dense does not mean cramped. Component=12 and Block=16 are compression values for high-information contexts, not a signal of degraded quality.
- Airy does not earn itself on body sections, supporting content, or grids. It earns itself at page entry, on hero-transition surfaces, and on opening beats only.
- Modes are coherent states — do not mix mode tokens within the same surface unless a structural seam justifies the switch.

---

## D) Applied Lock Summary

Final confirmed values. Do not reopen without lab proof of failure.

| Decision | Value |
|----------|-------|
| Reading width | **680px** |
| Component padding — standard default | **16px** |
| Component padding — dense-mode | **12px** (dense-only compression, not global default) |
| Dense mode | Valid — Component=12, Block=16 hold on real surfaces |
| Standard mode | Correct default — reliable starting point for all surfaces |
| Airy mode | Opening / entry / hero-transition surfaces only |
| Transition (128) | Section→section gap on multi-section surfaces — 64/64 split around centered divider. Sanctioned 2026-05-11 (Cycle 6 Q5 — was Reserved). |
| Break | Rare, capped, must recover within one section |

Proof sources: Step 4 S3b (reading width) · Step 4 S5b (component padding) · Step 5 S11–S14 (density modes) · Step 6 S22–S25 (break rules).

---

## E) Break Rules

A Break is a **controlled, explicit, and rare override** where standard spacing or container logic is suspended for a structurally or narratively justified moment. A Break is not an art-direction preference, not a rescue move, not a second spacing system.

### Three allowed categories

**Category 1 — Hero / page-entry**
The opening beat of a page requires a stronger entry than Airy Hero spacing alone provides.
- Allowed on: Homepage opener · Flagship case-study opener · About opener if directly justified
- Not for: section intros · mid-page statements · project cards · ordinary page openings

**Category 2 — Full-bleed transition**
A visual or structural moment that intentionally escapes the container to mark a phase shift.
- Allowed on: Hero media · transition visual between major case-study chapters · one major evidence moment per page if the content truly earns edge-to-edge width
- Not for: routine screenshots · normal media blocks · padding overcompensation · any moment where the content reads fine at Standard or Wide width

**Category 3 — Authored emphasis**
One singular moment that must feel distinctly authored — a thesis, a core insight, a reflective turn with clear narrative purpose.
- Allowed on: one reflective turn per page · one core thesis or insight beat
- Not for: repeated visual drama · decorative whitespace · fixing boring content with theatrics

### Trigger criteria

A Break must satisfy **at least one** before proceeding:

| Trigger | Description |
|---------|-------------|
| Page entry | First impression — the opening beat of the page |
| Chapter shift | A new structural phase begins — not just the next section |
| Major media transition | The content cannot communicate at container width |
| Singular thesis / emphasis | One clear narrative beat that standard rhythm would weaken |

If none of these are true, it is not a Break.

### Frequency caps

| Surface | Maximum Breaks |
|---------|----------------|
| Homepage | 2 |
| Flagship case study | 3 |
| Smaller page / normal project | 1 |

If a page appears to need more Breaks than the cap allows: fix the layout or the content. Do not raise the cap.

### Recovery rule

After any Break, the system returns to standard rhythm within the next section or block. A Break without recovery is a drift, not an authored moment.

### Break strength rule

- Use 80px (space-9) first
- Use 96px (space-10) only if 80px demonstrably fails
- 128px is not a Break token — reserved, not in use
- No new spacing values invented for Break moments
- Full-bleed only when container escape is structurally justified
- Break still belongs to the same ladder and width map

### Anti-abuse

These are not valid Break triggers:

- "This section feels cramped" → fix the base spacing
- "This card needs more room" → fix the component or density mode
- "The composition feels boring" → fix the hierarchy or content
- "I want it to feel more premium" → fix the layout or type
- "The content is awkward" → fix the content
- "I want more differentiation" → fix the structure
- "This screenshot looks better bigger" → use Wide if justified
- "The page feels too safe" → not a spacing problem

---

## F) Anti-Drift Rules

These rules prevent the system from degrading during implementation:

1. **Standard is the default.** Do not reach for Dense or Airy without a named structural reason.
2. **Tokens only.** Never introduce a spacing value that is not on the ladder (4·8·12·16·24·32·48·64·80·96·128). Off-ladder values are bugs.
3. **Modes are coherent states.** Do not cherry-pick tokens across modes within the same surface unless a structural seam justifies the switch.
4. **Airy is not a style choice.** Airy is allowed on opening/entry/hero-transition surfaces only. Using it on body sections or grids is a drift.
5. **Wide must be earned.** Standard (1120) is the correct default. Wide (1280) is not "bigger for better."
6. **Break is rare by definition.** If a Break is starting to feel routine, the base spacing is wrong.
7. **Reading width is 680.** Do not experiment with other prose widths without reopening the decision through the lab.
8. **Component padding is 16 (standard) / 12 (dense).** These are not interchangeable. 12px is dense-mode only.
9. **128px is not in use.** If you are reaching for it, the layout has a structural problem.

---

## G) Archive References

These lab step pages are the primary lookback references for the visual proof work behind locked decisions. They are archives — not active decision surfaces.

| Step | Route | What it answered |
|------|-------|-----------------|
| Step 4 — Visual proof | `/` | Reading width (680) and component padding (16) confirmed via A/B proof |
| Step 5 — Dense vs Standard vs Airy | `/step-5` | All three density modes proven on real surfaces · Airy scope limited to entry/opening |
| Step 6 — Break rules | `/step-6` | Three break categories locked · Trigger criteria · Frequency caps · Anti-abuse |
| Step 7 — Final locked reference | `/step-7` | Compressed locked system · Final proof strip · Lookback links |

Lab: `portfolio-system-lab/apps/Spacing Layout Rhythm Lab/`
Step docs: `docs/system/spacing-layout-rhythm-step-1.md` through `step-6.md`

---

## H) Deferred

These items are explicitly out of scope for this system definition:

| Item | Deferred to |
|------|-------------|
| Implementation CSS / Tailwind tokens | Phase 3 |
| Responsive spacing across breakpoints | Phase 3 — tablet/mobile behavior roughed in during lab only |
| Fluid / clamp spacing | Phase 3 |
| Hero system choreography specifics | Hero system |
| Navigation spacing details | Navigation system |
| Motion / enter-exit spacing interaction | Motion system |
| Final color system (surface color, borders, separators) | Color system |
