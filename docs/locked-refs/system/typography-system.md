# Typography System — Locked

**Status: LOCKED — Final** (surgical revision 2026-05-06: Row title role added at IS 400 / 18 to close Hierarchy Economy budget gap surfaced by Cycle 3 · surgical revision 2026-05-07: IS 300 Light replaced with IS 400 Regular for Body / Dense Body / Caption — Google Fonts does not ship Instrument Sans 300, browsers were silently falling back to 400; spec updated to match actual rendering · surgical revision 2026-05-08: ISe 18 italic added as Pull quote register (Cycle 4 close — opens ISe italic SCOPED to Pull quote register only) · surgical revision 2026-05-08: IS italic + IS 600 inline use sanctioned for body inline emphasis (Cycle 4 close — italic+bold combination = max emphasis register, scoped to body inline use only) · surgical revision 2026-05-12: META_VALUE register sanctioned as Exception (Cycle 9 close — Dense Body 13 with text-secondary color override, scoped to metadata-value role paired with IS 10/UC label in structurally-bounded panels) · surgical revision 2026-05-12: Anti-Drift §H clarifies "primary feel" is a composition rule (not a type-axis register) — see CSML §11 Container-earned primary composition lock · surgical revision 2026-05-13: Body register + Subordinate aside register color tokens updated to point at new W1 ink-tier exceptions — Body now resolves to `--dir-text-body` (`#383632`) and Subordinate aside now resolves to `--dir-text-body-soft` (`#797369`) per Cycle 9 W1 reopen close; color is owned by W1 spec, type-axis register definitions (size/weight/family/LH) unchanged from Cycle 2/4 locks; see §F Exception Policy and §H Anti-Drift Rules for scoping · **Cycle 11 reopen close 2026-05-15: IS 18 DROPPED entirely (both Sub-heading and Row title); IS CAPS 15 added as common sub-section divider register; IS CAPS 13 added as compressed-context sub-divider register; Color-lift emphasis register sanctioned (IS 500 + text-primary, no italic) for frequent quiet lifts in body prose; ISe 22 earning rule formalized (content vs marker discipline); Body lh tightened from 1.75 to 1.5 (was outlier vs scale curve — Body 15 × 1.75 = 26.25px exceeded Sub-heading 18 × 1.4 = 25.2px which was structurally backwards; 1.5 matches scale-curve interpolation between Dense 13 lh 1.6 and Sub-headings 18 lh 1.4, matches Subordinate aside locked lh 1.5, and matches editorial body convention) — surfaced by Rachel Chen PokerGPT case-study comparison + §03 Phase C audit. Body family question (sans vs serif) deferred to lab evaluation.**). Font system, role map, scale values, weight rules, and usage policy are all finalized. Do not reopen exploration unless the system demonstrably fails on actual implementation pages.

**Operating manual:** `cross-system-rules.md`. Read first when applying this system to a new surface or resolving a divergence — the cross-system integration patterns, intent + context framework, outcome protocol, and precedent index live there.

---

## A) Locked System

Three fonts. Three distinct roles. All decisions final.

| Font | Weight | Role |
|------|--------|------|
| **Clash Display** | 500 Medium | Top-level display / hero moments |
| **Instrument Serif** | 400 Regular (upright only) | Editorial / case-study headings |
| **Instrument Sans** | 400 Regular (body) · 500 Medium (UI / CAPS / color-lift) · 600 italic (inline emphasis) | Body / UI / metadata / CAPS dividers / base system |

Self-hosted: Clash Display (woff2).
Google Fonts: Instrument Serif, Instrument Sans.

---

## B) Locked Scale Table

This is the definitive reference. All values are exact. No ranges.

Base: 1rem = 16px.

| Role | Font | Weight | px | rem | Line-height | Tracking | Case |
|------|------|--------|-----|-----|-------------|----------|------|
| Display / Hero | Clash Display | 500 | 52 | 3.25rem | 1.08 | −0.03em | Sentence |
| Editorial Intro Heading | Instrument Serif | 400 | 32 | 2rem | 1.18 | −0.025em | Sentence |
| Editorial Section Heading *(content title — see §D earning rule)* | Instrument Serif | 400 | 22 | 1.375rem | 1.25 | −0.02em | Sentence |
| Pull quote *(added 2026-05-08, Cycle 4)* | Instrument Serif | 400 italic | 18 | 1.125rem | 1.4 | −0.01em | Sentence |
| **Common sub-section TITLE *(added 2026-05-15, Cycle 11 · weight + family confirmed 2026-05-16 via lab A/B)*** | **Instrument Sans** | **500** | **15** | **0.9375rem** | **1.4** | **0.12em (uppercase)** | **Uppercase** |
| **Compressed-context sub-section TITLE *(added 2026-05-15, Cycle 11 · weight + family confirmed 2026-05-16 via lab A/B)*** | **Instrument Sans** | **500** | **13** | **0.8125rem** | **1.4** | **0.12em (uppercase)** | **Uppercase** |
| Body | Instrument Sans | 400 | 15 | 0.9375rem | **1.5** | 0 | Sentence |
| Dense Body | Instrument Sans | 400 | 13 | 0.8125rem | 1.6 | 0 | Sentence |
| Meta / Label / UI (eyebrow) | Instrument Sans | 500 | 10 | 0.625rem | 1.4 | 0.12em (uppercase) | Uppercase |
| Caption / Note | Instrument Sans | 400 | 11 | 0.6875rem | 1.35 | 0 | Sentence |

### Controlled exceptions — not roles, specific jobs

| Job | Font | Weight | px | rem | Line-height | Tracking |
|-----|------|--------|-----|-----|-------------|----------|
| CTA / small action text | Instrument Sans | 500 | 12 | 0.75rem | 1.4 | 0 |
| Proof / stat numerals | Instrument Sans | 400 | 28 | 1.75rem | 1.0 | −0.03em |
| **Color-lift emphasis *(added 2026-05-15, Cycle 11)*** | **Instrument Sans** | **500** | inherits body | inherits | inherits | 0 |

**The full core ladder: 10 · 11 · 13 · 15 · 18 · 22 · 32 · 52** (ISe sizes: 18 italic [Pull quote] · 22 [Section Heading / content title] · 32 [Intro Heading])
**Allowed exceptions: 12 (CTA), 28 (proof numerals)**
**Not in the system: 14 · 16 · 17 · 19 · 20 · 21 · 24 · 27 · 31 · 36**
**DROPPED 2026-05-15 (Cycle 11): IS 18 entirely (both Sub-heading IS 18/600 and Row title IS 18/400).**

36px is deferred. It is only allowed if a real compressed display role proves necessary in implementation. It cannot be introduced before then.

---

## C) Utility Weight Rules

Kill all ranges. These are exact.

| Job | Weight |
|-----|--------|
| Navigation labels | IS **500** |
| Project metadata / category lines | IS **500** |
| Pill tags / type tags | IS **500** |
| Proof-row labels | IS **500** |
| CTA text | IS **500** |
| Small UI labels | IS **500** |
| **CAPS dividers (15 / 13 / 10)** | IS **500** |
| **Color-lift emphasis (inline body)** | IS **500** |
| **Inline body emphasis (italic)** | IS **600** |
| Body copy | IS **400** |
| Dense body | IS **400** |
| Captions / notes | IS **400** |

**Rule:** Utility defaults to 500. 600 is now reserved exclusively for IS 600 italic Inline body emphasis (the "max emphasis" register from Cycle 4). 400 is the body and caption base. (Was 300 in earlier drafts; surgical revision 2026-05-07 corrected this — Google Fonts does not serve Instrument Sans 300, so all references to IS 300 were silently rendering as 400 via fallback. Spec now matches reality. Cycle 11 close 2026-05-15: IS 18/600 Supporting/Sub-heading dropped — was the only non-italic 600 use case; now 600 is italic-only.)

---

## D) Role Map — Narrative

Exact scale values are above. This section records where each role lives and its behavioral rules.

### Clash Display 500 — Display / Hero

- Homepage hero headline
- Case-study page hero headline
- Top-level page-identity moments
- Scale: **52px / 3.25rem** at hero / page level
- Line-height: 1.08 (tight structural)
- Tracking: −0.03em
- Case: sentence case
- Usage: **rare and controlled** — not a default heading font, not used for section headings, not used in navigation or UI
- The 28px proof numeral exception uses IS 400, not Clash — numerals are not display moments

### Instrument Serif 400 upright — Editorial / Case-Study Headings

- Case-study intro headings (editorial opening statement) — **32px**
- Editorial section headings within case studies — **22px**
- Positioning / manifesto-like intro lines — **32px**
- Line-height: 1.18 at 32px / 1.25 at 22px
- Tracking: −0.025em at 32px / −0.02em at 22px
- Case: sentence case
- Font style: **upright only for headings** — italic SANCTIONED ONLY for Pull quote register at 18px (added Cycle 4 surgical revision 2026-05-08); italic at 22 / 32 is NOT in the locked system
- Usage: **quieter editorial counterpoint to Clash** — not used in dense UI, navigation, metadata, or body

**ISe 22 — Content title earning rule *(formalized 2026-05-15, Cycle 11)***

ISe 22 (Editorial Section Heading register) is reserved for **content titles at sub-section tier**. The earning rule:

**ISe 22 earns when the line is CONTENT — a name, a defining statement, or a sub-section title that IS what's being communicated. NOT a structural marker, label, number, or category tag.**

Single criterion: content vs marker.

**Examples that EARN ISe 22:**
- Insight statements: "Trust breaks when output ≠ vision" · "Prompts create a learning curve"
- Persona names: "Workflow-Focused" · "Creative Control Seekers"
- Named sub-section openers: "What I learned" · "The deeper issue"
- §10 Reflection title

**Examples that DO NOT earn ISe 22 (use IS CAPS 15 instead):**
- Structural eyebrows above content blocks: "Two user types emerged · n=22" · "Three key insights"
- Numbered markers: "01" · "02" · "03" · "Insight 01"
- Category labels: "PERSONA PROFILE · DISCOVERY · 2024" · "POKER SOLVERS" · "COURSES & BOOTCAMPS"
- Tombstone metadata strips
- Structured-abstract section labels: "METHODS." · "FINDINGS." · "CONCLUSION."

**Geometric note (not an earning criterion):** When a content title earns ISe 22 but the layout geometry can't accommodate it (e.g., 1fr 1fr 1fr 3-col tight cards where ISe 22 wraps 3+ lines), the LAYOUT decision is to either restructure the geometry or render the content statement as body within the card (no separate title tier). The earning rule itself stays content-vs-marker; geometric fit is a per-direction layout decision documented separately. Do NOT introduce smaller serif registers (e.g., ISe 18 upright) to bridge the gap — IS 18 was dropped in this cycle precisely to avoid that pattern.

### Instrument Serif 400 italic — Pull quote register *(added 2026-05-08, Cycle 4)*

- Editorial pull quotes anchored by subtle vertical side line within case-study modules
- Use cases: §02 verbatim user quotes · §04 deeper-issue / thesis emphasis lines · §07 Proof 1 default (pull quote) · §07 Proof 2 evidence block
- Scale: **18px / 1.125rem**, LH 1.4, tracking −0.01em, italic, sentence case
- Color: text-primary
- Layout: 2px solid `var(--dir-border)` left rule + 16px indent · no box · not centered · no decorative quote glyphs
- Spacing: marginTop + marginBottom = Block (24)
- **Why this register exists:** ISe 22 (Section Heading) tier-conflicts with sub-section register; IS 15 italic loses serif gravitas verbatim quotes need; ISe 18 italic with side line provides editorial gravitas at a tier visibly distinct from sub-section heading. Mirrors NYT / Atlantic / Stripe Press pull-quote convention.
- **Anti-drift:** ISe italic is sanctioned ONLY at 18px for Pull quote register. Do not use ISe italic at any other size. Do not use ISe italic for headings, body, or any non-pull-quote context.

### Instrument Sans — Body / UI / CAPS / Base System

Everything below the editorial heading roles. Multiple weights with distinct jobs.

**IS 18 DROPPED 2026-05-15 (Cycle 11 close).** Both Supporting / Sub-heading IS 18/600 and Row title IS 18/400 removed. Row title was a Cycle 3 stop-gap whose main use (compressed-cell persona names + 4A/4B insight titles) is now handled cleanly by CAPS divider registers (CAPS 15 / CAPS 13) or by ISe 22 content-title register per the earning rule below. Sub-heading IS 18/600 was the only non-italic 600 use case; with it dropped, IS 600 is now italic-only (Inline body emphasis register exclusively).

**IS 500 — UI / Labels / Meta**
- Navigation labels (exact size deferred to Navigation system — weight is locked at 500)
- Project metadata / category lines: **10px**, uppercase, tracking 0.12em
- Pill tags, type tags: **11px**, sentence case
- Proof-row labels: **11px**
- CTA / action text: **12px** (controlled exception)
- All other small UI classification text: **10px or 11px**

**IS CAPS — Sub-section divider family (Cycle 11 sanction)**

Three CAPS sizes form a graduated divider family. ALL at IS 500 / 0.12em tracking / uppercase / color text-secondary (or text-primary when the divider needs additional weight).

- **CAPS 15** — Common sub-section divider. Default for repeating sub-section markers, structural dividers above content blocks, category labels. Examples: "Two user types emerged · n=22" above persona blocks; "Three key insights" above insight rows; "POKER SOLVERS" / "COURSES & BOOTCAMPS"–style category headers. LH 1.4, marginBottom 4 (Cat 3 Micro tight pair to content below).
- **CAPS 13** — Compressed-context sub-divider. Use when CAPS 15 would crowd: inside compressed cells (1fr 1fr 1fr 3-col cards, structurally-bounded panels with limited height), tombstone metadata strips, outer marginalia columns (≤200px). LH 1.4.
- **CAPS 10** — Page-level eyebrow / smallest marker tier (existing Meta / Label / UI register). LH 1.4.

**CAPS family discipline:**
- All CAPS use IS 500 weight (uppercase needs the 500 bump beyond 400 to read at small sizes without weakening; 600 would compete with locked Inline emphasis register)
- Sans by default — uppercase serif renders gnarly at small sizes; sans CAPS matches editorial convention (NYT, Stripe Press use sans CAPS for labels regardless of body family)
- Color: default `--dir-text-secondary` (Cycle 9 W1 reopen); `--dir-text-primary` only when CAPS divider carries extra emphasis weight
- Anti-drift: Do NOT use CAPS at sizes other than 10 / 13 / 15. Do NOT use ISe (serif) for CAPS. Do NOT use weights other than 500.

**IS 600 italic — Inline body emphasis register *(added 2026-05-08, Cycle 4)***
- Highest-emphasis inline phrases within body paragraphs ("italic + bold" combination)
- Use cases: key proof phrases, claim emphasis, vocabulary terms within case-study body prose — RESERVED for the truly emphatic moment (1-2 per § max)
- Scale: matches surrounding body size (15 in case-study body, 13 in compressed contexts), italic + 600 weight
- Color: text-primary (matches body)
- **Anti-drift:** Italic IS + 600 weight combination is sanctioned ONLY for inline body emphasis. For FREQUENT quiet inline lifts (cohort names, key phrases, stat callouts), use Color-lift emphasis register below instead.

**IS 500 + text-primary — Color-lift emphasis register *(added 2026-05-15, Cycle 11)***
- Frequent quiet lifts within body prose paragraphs (cohort names, key phrases, stat callouts)
- Use cases: cohort names lifted inline in narrated prose (1B Pudding, 3A annual letter, 4B persona block); key stat callouts ("22 designers", "21 of 22"); key insight phrases lifted in continuous prose
- Spec: IS 500 weight (Body's 400 plus a +100 weight bump) + `--dir-text-primary` color shift. Inherits body's size + line-height + tracking + italic state. NO italic, NO fontFamily change.
- 1 cue from default body (weight bump from 400→500) + color tier shift (body→primary). Sub-tier emphasis below the Inline emphasis register (600 italic).
- **Why this register exists:** Inline body emphasis (600 italic) is sanctioned for THE emphatic moment — too loud for frequent use. In body prose with multiple lifts per paragraph (cohort names + stat callouts + key phrases), 600 italic becomes visually noisy. Color-lift emphasis handles "frequent quiet emphasis" at a register that reads as deliberate (color + slight weight bump) without screaming.
- **Anti-drift:** IS 500 + text-primary is sanctioned ONLY for inline body emphasis use. Do NOT use as standalone register, eyebrow, or block-tier title. Do NOT use IS 500 + text-primary outside body prose context. The CAPS divider family also uses IS 500 weight but is differentiated by uppercase + tracking + standalone block use; Color-lift is inline within sentence-case body prose only.

**IS 600 italic — Inline body emphasis register *(added 2026-05-08, Cycle 4)***
- Highest-emphasis inline phrases within body paragraphs ("italic + bold" combination)
- Use cases: key proof phrases, claim emphasis, vocabulary terms within case-study body prose
- Scale: matches surrounding body size (15 in case-study body, 13 in compressed contexts), italic + 600 weight
- Color: text-primary (matches body)
- 2 cues from default body (style + weight) — single highest-emphasis register
- **Why this register exists:** italic alone (1 cue) is editorial but quiet; bold alone (1 cue) is functional but breaks editorial flow when used as primary emphasis; italic+bold combines both for unmistakable highest-emphasis treatment that pairs with serif heading hierarchy. Mirrors NYT longform editorial practice for proof statements / vocabulary terms.
- **Anti-drift:** Italic IS + 600 weight combination is sanctioned ONLY for inline body emphasis. Do not use as standalone register. Do not use for eyebrows, labels, headings, or any non-inline context. Italic IS at 400 weight is also sanctioned (separate register, see Subordinate aside / inline emphasis-quiet variants).

**IS 400 italic — Subordinate aside register *(added 2026-05-08, Cycle 4 · color updated 2026-05-13, Cycle 9 W1 reopen)***
- Quiet aside register for content that supports body without competing
- Use cases: §03 pattern close · §06 "My move" lines · §07 catch · §11 / closer · authorship clarification asides
- Scale: matches body (15 / LH 1.5), italic, 400 weight
- Color: `--dir-text-body-soft` (`#797369`) per W1 lock — was `--dir-text-secondary` pre-Cycle-9-reopen. Body-size supporting text earns the body-tier ink exception (not the small-text secondary). 2 cues from default body (style + color tier).
- **Anti-drift:** Italic IS + body-soft color combination is sanctioned ONLY for Subordinate aside use. Do not use italic IS at body-soft as standalone register or eyebrow. Do not use body-soft as a softer-body color in non-supporting contexts.

**IS 400 — Body / Dense Body / Caption**
- Body copy (editorial, case study, about): **15px / 0.9375rem**, LH **1.5** *(Cycle 11 close 2026-05-15 — was 1.75; tightened to align with scale curve and editorial body convention; matches Subordinate aside lh 1.5; resolves prior structural backwardness where Body lh 26.25px exceeded Sub-heading lh 25.2px)*, ragged-right, color `--dir-text-body` *(Cycle 9 W1 reopen 2026-05-13)*
- Dense body (card framing, compressed zones): **13px / 0.8125rem**, LH 1.6, color `--dir-text-body` *(Cycle 9 W1 reopen 2026-05-13)*
- Proof / stat numerals: **28px** (controlled exception), LH 1.0, tracking −0.03em, color `--dir-text-primary`
- Captions / prototype notes: **11px / 0.6875rem**, LH 1.35, color `--dir-text-secondary`

(Note: this register was originally specced at IS 300 Light. Google Fonts does not ship Instrument Sans 300 — only 400/500/600/700 are served. Browsers silently fall back to 400. Surgical revision 2026-05-07 updated the spec to match actual rendering. No visual change; this is a spec accuracy fix.)

(Note 2026-05-13: Body and Dense Body color resolved to `--dir-text-primary` (`#121110`) from Cycle 2 lock until the Cycle 9 W1 reopen close. Reopen sanctioned `--dir-text-body` (`#383632`) as an earned exception for body-size main-flow text — title↔body adjacency contrast was insufficient at single-ink (primary=primary) reading. Title register remains at primary; body register shifts down one stop on the warm-graphite axis. See `color-system-w1.md` Cycle 9 W1 reopen section for full axis math + earning conditions.)

---

## E) Scale Usage Rules

### Role-first sizing rule

Size follows role. Not vibes, not visual feel, not "this just feels slightly off."

If the hierarchy feels wrong, audit the role assignment first. Do not invent a new size to paper over a role decision.

### Do

- Use the smallest number of sizes that still creates clear role separation
- Let role decide size — if something doesn't fit a role, question whether it's a new role or a misassigned element
- Keep body at 15px and dense body at 13px unless implementation failure is documented
- Keep 32px / 22px as the IS Serif editorial pair unless a real page breaks them
- Keep utility default at IS 500
- Use IS 600 only for clear Supporting / Sub-heading hierarchy moments
- Use IS 400 for all body copy and captions
- Keep the 10px / 11px / 12px utility band tight — the distinction is weight-driven, not size-driven

### Don't

- Don't invent 14 / 16 / 17 / 19 / 20 / 21 / 24 / 27 / 31 because something feels slightly off
- Don't let Clash drift into section-heading duty — Clash is display-only
- Don't let IS Serif drift into UI, metadata, labels, or body roles
- Don't solve layout or spacing problems by inventing new type sizes
- Don't confuse spacing scale with type scale — if a block feels cramped, that's spacing, not type
- Don't use IS 600 as a default utility weight — 500 is the default
- Don't use IS 400 for UI labels to feel minimal — 400 is for body and captions, not classification (utility default is 500)
- Don't leave fuzzy ranges in implementation code — all values are exact

---

## F) Exception Policy

### Allowed

- **12px (CTA / strong small UI):** When an action label or button text needs slightly more presence than a 10px or 11px label. CTA only — not a general purpose mid-size.
- **28px (proof / stat numerals):** For proof-row metric numbers, stat callouts, and numerical highlights in card contexts. IS 400 only — these are numbers, not display moments.
- **15px or 22px IS 500 compressed proof numerals:** Allowed in compressed card contexts (featured cards in narrow shells, card foots where 28px overpowers the surrounding hierarchy). Same numeric register as 28px — not a new role, a compressed variant of the existing proof-numeral exception. Per-size tracking (LH 1.0, tabular-nums across all): 28px → −0.03em · 22px → −0.02em · 15px → −0.01em (smaller sizes want gentler tracking). 22px is the moderate compression when title is at 22px or larger; 15px is the deeper compression for narrow-shell registers where even 22 competes with the title (e.g. FV-A foot=2-col with an 18px title). Uses in-ladder sizes; standard proof remains 11px IS 400 inline.
- **META_VALUE register (Dense Body 13 + text-secondary color):** *(added 2026-05-12, Cycle 9)* Sanctioned for the metadata-value role — the value half of a label/value metadata pair. Type-axis: inherits Dense Body 13 (Cycle 2 lock — IS 400 / 13 / LH 1.6); color softens to `var(--dir-text-secondary)`. Earning conditions (all must hold): (a) content is a metadata value, not narrative body; (b) paired label uses the IS 10/UC Eyebrow register (Meta / Label / UI); (c) container is a structurally-bounded metadata panel (strip / sub-grid / dedicated metadata block — not a free-floating paragraph in main-flow). Currently sanctioned uses: case-study Shell §01 facts band (label-above-value pattern) · §03 Methods/Artifacts metadata blocks. **Why this register exists:** metadata values pair with eyebrow labels at the scan-tier reading level; the softer color separates the metadata zone from main-flow body without inventing a new type-axis size or unlocking the Cycle 2 body-ink lock for narrative body. Per flag #41 resolution rule, softer-than-DENSE renders are earned as sanctioned exceptions — not by unlocking DENSE. **Anti-drift:** text-secondary on Dense Body 13 is sanctioned ONLY for this metadata-value role under the earning conditions above. Do not use the pattern for narrative body, callouts, or any other softer-body need (see §H).
- **36px (deferred):** Only if a real compressed display role proves necessary during implementation — for example, a hero that must fit a tighter viewport without fluid scaling. Cannot be introduced before implementation exposes the failure.
- **Responsive / fluid step-downs:** Deferred to Phase 3 implementation. Scale values here are desktop-first reference values. Mobile and fluid scaling rules are not defined in this pass.

### Not Allowed

- Random one-off sizes for layouts that feel slightly awkward
- New middle sizes (14, 17, 19, 20, 21) because a card element feels off
- Changing body size to fix perceived spacing problems
- Changing heading size to add fake personality
- Using 36px before implementation exposes a real need

---

## G) What Won and Why

### vs. Single Clash (System A)
Single Clash collapsed the editorial heading into the same typeface as the display heading. At 32px, Clash 500 felt like the same geometric font scaled down — not a distinct editorial register. The hybrid earns its complexity because IS Serif at 32px creates genuine counterpoint that Clash alone could not.

### vs. Single Gambetta (System D)
Gambetta 600 at 52px display scale felt too literary and weighted for the portfolio's product-design positioning. It holds editorial presence well, but reads as a publishing or personal essay stack — not the "structured enough to trust, alive enough to feel authored" north star.

### vs. Hybrid B / Gambetta 500 (System C)
Gambetta 500 in the editorial heading role was narrower than Gambetta 600, but the coherence gap between Clash (geometric, modern) and Gambetta (warm, literary) remained. IS Serif is quieter, thinner, and structurally closer to IS Sans — the family pairing earns more coherence than the Clash/Gambetta split.

### vs. other challenger lanes
All other candidates (Satoshi solo, Schibsted Grotesk solo, Newsreader + Source Sans, IBM Plex) were cut in Step 2.5 triage. Rationale is documented in `docs/system/typography-step-2-5-triage.md`.

---

## H) Anti-Drift Rules

- **Do not use Clash for every heading.** Clash is the display font. Section headings use IS Serif. Using Clash at heading scale makes it generic heading text, not a controlled display register.
- **Do not let IS Serif become a body or UI font.** IS Serif lives in the editorial heading role only. Dense body, labels, metadata, and UI copy all use IS Sans.
- **Do not mix Clash and IS Serif in the same single heading line.** They operate in separate scale registers — Display and Editorial Heading — not as mixed elements within one typographic unit.
- **IS Sans 300 is the only body/UI/base font.** Do not introduce IS Serif or Clash into utility, navigation, metadata, captions, or any support role.
- **ISe italic SCOPED to Pull quote register only** *(updated 2026-05-08)*. Italic IS Serif sanctioned at 18px for Pull quote register only (added Cycle 4 surgical revision). Do not use ISe italic at 22 / 32 / any other size. Do not use ISe italic for headings, body, or any non-pull-quote context. Outside the Pull quote register, ISe stays upright only.
- **IS italic SCOPED to body inline emphasis + Subordinate aside only** *(added 2026-05-08, Cycle 4)*. Italic Instrument Sans sanctioned for: (a) inline body emphasis when paired with weight 600 (italic+bold = highest-emphasis register); (b) Subordinate aside register at 400 weight + text-secondary color. Do not use italic IS as standalone register, eyebrow, label, or heading replacement. Do not use italic IS in classification or metadata roles.
- **META_VALUE register SCOPED to metadata-value role only** *(added 2026-05-12, Cycle 9)*. Dense Body 13 with `--dir-text-secondary` color is sanctioned ONLY for metadata values paired with IS 10/UC labels in structurally-bounded panels (see §F Exception Policy). Do not use text-secondary on Dense Body 13 for narrative main-flow body, callouts, asides, or any softer-body register need. Per flag #41 lock, softer-than-default body renders are earned as sanctioned exceptions per role, not by unlocking the W1 body-ink tokens.
- **Body-tier ink register split SCOPED per role** *(added 2026-05-13, Cycle 9 W1 reopen close)*. The W1 ink ladder now has 5 register stops: `--dir-text-primary` (titles/headings) → `--dir-text-body` (body main-flow, NEW) → `--dir-text-body-soft` (body-size supporting text, NEW) → `--dir-text-secondary` (small-text only: eyebrows / captions / META_VALUE) → `--dir-detail` (annotation accents). Each stop has a single role; crossing roles between tokens is drift. Specifically: do not use `--dir-text-body` for titles (use primary), do not use `--dir-text-body-soft` for captions or eyebrows (use secondary), do not use `--dir-text-secondary` for body-size supporting text (use body-soft). See `color-system-w1.md` §B Token System + §C Semantic Roles for full per-role earning conditions.
- **"Primary feel" is a composition rule, not a type-axis register** *(added 2026-05-12, Cycle 9)*. When a module role needs to "feel primary" (anchor outcome statement, closing summary strip, structural takeaway), the answer is **composition**, not a new type register. The locked pattern is Body 15 / text-primary inside a raised-bg container — type stays on-ladder, the container delivers the elevation. See `case-study-modules/11-cross-module-rules.md` Container-earned primary composition lock for full earning conditions and sanctioned uses. Do not invent a new type-axis size, weight, or color shift to deliver "primary feel" — reach for the composition pattern instead. The Type lock is closed; primary emphasis is owned by composition.
- **Archive fonts are not active options.** Gambetta, Satoshi, Schibsted Grotesk, Newsreader, and all other exploration candidates are archive-only. Do not reintroduce them without a documented failure in the locked system.
- **Do not add a fourth font.** The system is three fonts. Mono / Technical Accent was judged conditional and unnecessary. Do not add it without a real, specific, documented need.
- **Do not break scale without a role reason.** A new size must map to a new role that cannot be served by any existing role. Visual discomfort alone is not a reason.
- **Do not reopen Typography exploration.** The system is locked. Future work happens through implementation, QA, and failure-based refinement only. The only valid reason to revisit a decision is a documented failure on a real implementation page — not a preference, not a "feels slightly off," not a new idea.

---

## I) Archive References

The following exploration pages in the Typography System Lab remain available for lookback:

| Route | Purpose |
|-------|---------|
| `/` | Step 2.5 — Visual Triage Board — 10-candidate initial triage |
| `/step-3` | Step 3 — Deeper Visual Lab — shortlisted candidate comparison |
| `/finalists` | Finalists Micro-Round — focused final candidate pressure-test |
| `/display-refinement-round` | Display Refinement Round — isolated display role comparison |
| `/hybrid-proof` | Hybrid Proof — 3-font hybrid configs, Gambetta 500 patch, coexistence test |
| `/system-control` | System Control — 4-system control comparison, the real decision page |
| `/final` | **Locked System reference page** |

---

## J) What Is Deferred

These are explicitly not part of this locked system. Do not reopen them here:

- **Responsive / fluid type scaling** — viewport-based step-downs and fluid scaling: Phase 3 implementation. The scale values here are desktop-first reference values only.
- **Spacing scale and layout rhythm** — internal page rhythm, section spacing, card spacing, container density: Spacing + Layout Rhythm system (next phase). Type scale values are inputs for that phase, not outputs from it.
- **Navigation label exact sizing** — Nav labels use IS 500 (locked). Exact size (likely 10–11px) is determined by the Navigation system, not this pass.
- **Final color system** — type color, dark mode, contrast modes: Color system.
- **Hero typography choreography** — large-format display moments, motion: Hero system.
- **Type animation** — reveal, enter/exit, choreographed type: Motion system.
- **Font loading / subsetting / performance** — variable font decisions, subsetting strategy: Performance system.
- **Compact tier card type** — no Compact tier defined yet: deferred.
