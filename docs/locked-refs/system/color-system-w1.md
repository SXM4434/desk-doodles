# Color System — W1 Near-White Hold — Locked

**Status: LOCKED — Final** (surgical revision 2026-05-13, Cycle 9 W1 reopen close: added two sanctioned exception registers `--dir-text-body` (`#383632`) and `--dir-text-body-soft` (`#797369`) to resolve title↔body adjacency contrast and body→body sub-line scan differentiation in §07 — earned per-role exceptions on the locked warm-graphite axis, parallel to META_VALUE register sanctioned in Cycle 9; locked W1 anchors `--dir-text-primary` / `--dir-text-secondary` / `--dir-detail` unchanged · documented receipt was a real implementation surface failure on `/gate-a/ion/r1` where title #121110 and body #121110 collapsed under reading conditions, and body→body sub-line scan needed color-axis differentiation that Cycle 2 / flag #32 / flag #42 had previously deferred). The color system for the portfolio is W1 Near-White Hold. Token values, semantic roles, interaction behavior, exception-zone rules, dark/accent rules, and archive policy are all finalized. Do not reopen exploration unless the system demonstrably fails on actual implementation pages.

**Operating manual:** `cross-system-rules.md`. Read first when applying this system to a new surface or resolving a divergence — the cross-system integration patterns, intent + context framework, outcome protocol, and precedent index live there.

Canonical direction id in code: `w2-near-white-hold`. Displayed as **W1** because it sits at position 1 in the cleaner→warmer refinement band. The id is an internal artifact of the Pass 4 spec; the display number is the one the rest of the portfolio refers to.

---

## A) Why W1 won

Pass 4 searched a tight refinement band inside the Pass 3 winner zone (H1 warmth + H2 cleanliness). Three coherent variants were built:

- **W1 Near-White Hold** — cleaner end of the band. Near-white ground, near-pure graphite darks, minimum authored warmth.
- W2 Warm Paper Clean — balanced midpoint.
- W3 Warm Body Controlled — warmer end, still cleaner than H1.

W1 was selected because it is the minimum-warmth expression that still reads **authored, not sterile**. It:

- Reads as paper, not as page. The warm trace in the near-white ground keeps the surface from going clinical under product UI (A lane) and keeps editorial surfaces (B lane) from flattening into a generic white.
- Holds a near-pure graphite dark (`#121110`) that never drifts brown. H1's darks pulled muddy; W1's do not.
- Keeps the border discipline tight (`#E3DFD4`) — visible as structure, not as nostalgia. H1's borders read beige; W1's do not.
- Is the least fragile of the three variants under real application. W2 (balanced) read fine but did not clearly beat W1; W3 (warmer) reintroduced the H1 problems W1 was designed to solve.

W2 and W3 are archived as reference bounds, not candidates.

---

## B) Final Token System

The 12 structural + 6 behavioral token contract used across the full surface universe. All values exact. No ranges.

### Structural tokens

| Token | Value | Role |
|-------|-------|------|
| `--dir-bg` | `#FDFCF9` | Primary surface ground |
| `--dir-raised` | `#F9F7F3` | Raised surface (one step above ground) |
| `--dir-recessed` | `#F3F0E8` | Recessed surface (one step below ground) |
| `--dir-muted` | `#EBE7DC` | Muted field — metadata strips, quieter regions |
| `--dir-text-primary` | `#121110` | Primary ink — headlines, nav-active, top-of-ladder ink |
| `--dir-text-body` *(added Cycle 9 W1 reopen 2026-05-13)* | `#383632` | Body ink — main-flow body / dense body register. Earned exception below primary ink for body-size main-flow text only. |
| `--dir-text-body-soft` *(added Cycle 9 W1 reopen 2026-05-13)* | `#797369` | Body-soft ink — body-size supporting text (Subordinate aside, §07 summary, §07 catch, §06 "My move:", §03 pattern close, §04 stakes, §10 reflection). Earned exception below body ink for body-size supporting role only. |
| `--dir-text-secondary` | `#5F5B54` | Secondary ink — captions, eyebrows, metadata values (small-text uses ONLY: IS 10 / 11 / 13). Body-size supporting text uses `--dir-text-body-soft`, not this token. |
| `--dir-border` | `#E3DFD4` | Default border / divider |
| `--dir-accent` | `#121110` | Accent ink (near-pure graphite; intentionally unified with text-primary) |
| `--dir-detail` | `#878075` | Authored detail marks, annotation accents, margin rules |
| `--dir-exception-bg` | `#121110` | Exception-zone ground (dark inversion) |
| `--dir-exception-text` | `#FDFCF9` | Exception-zone primary ink |
| `--dir-exception-accent` | `#878075` | Exception-zone detail / accent |

### Behavioral tokens

| Token | Value | Role |
|-------|-------|------|
| `--dir-cta-bg` | `#121110` | Primary filled CTA background |
| `--dir-cta-text` | `#FDFCF9` | Primary filled CTA text |
| `--dir-cta-border` | `transparent` | Filled CTAs carry no border |
| `--dir-link-color` | `#121110` | Inline link color — reads as ink, not as "web blue" |
| `--dir-chip-bg` | `transparent` | Chips / tags default to transparent ground |
| `--dir-chip-border` | `#E3DFD4` | Chip / tag outline |

### Surgical refinement applied at winner-lock

Only one token moved between the Pass 4 build and the locked system:

- `--dir-text-secondary` tightened from `#625D55` to `#5F5B54`. Warm-delta (R-B channel gap) reduced 13 → 11. Result: captions and metadata read quieter without losing the warm pairing with `--dir-bg`.

`--dir-border`, `--dir-muted`, `--dir-accent`, `--dir-recessed`, and the exception tokens were already clean at design-time. They were not moved.

### Cycle 9 W1 reopen (surgical revision 2026-05-13)

The W1 reopen added two sanctioned exception ink registers on the locked primary→secondary→detail warm-graphite axis. They are NOT replacements of locked tokens; they sit between the existing anchors as earned per-role exceptions.

**Axis math (verified on-axis interpolation):**

| Register | Token | Hex | L* | warm-Δ (R−B) | Contrast on bg |
|---|---|---|---|---|---|
| primary (locked anchor) | `--dir-text-primary` | `#121110` | 5.1 | 2 | 18.4:1 AAA |
| **body (Cycle 9 exception)** | **`--dir-text-body`** | **`#383632`** | **22.7** | **6** | **11.7:1 AAA** |
| **body-soft (Cycle 9 exception)** | **`--dir-text-body-soft`** | **`#797369`** | **48.7** | **16** | **4.58:1 AA edge** |
| secondary (locked anchor) | `--dir-text-secondary` | `#5F5B54` | 38.8 | 11 | 6.6:1 AA |
| detail (locked anchor) | `--dir-detail` | `#878075` | 53.9 | 18 | 3.8:1 AA-lg |

Body-soft sits ABOVE secondary on the lightness axis (L*48 vs L*39). The two are different roles, not redundant: secondary is for small-text contrast comfort (captions, eyebrows, metadata values at IS 10/11/13); body-soft is for body-size supporting text where same-size body→body sub-line differentiation is the perceptual need (chosen↔summary in §07 collapsed accordion, Subordinate aside register across all body modules).

**Earning conditions for `--dir-text-body`:**
1. Content is body-size main-flow text (IS 15 / IS 13 dense in compressed contexts).
2. Adjacent title (ISe 22 / 32) renders at `--dir-text-primary` — color-axis cue carries title↔body register step that family + size alone insufficient under real reading conditions per documented failure on `/gate-a/ion/r1`.
3. Body weight unchanged (IS 400). Body line-height unchanged (1.75 / 1.6 dense). Only the color slot shifts.

**Earning conditions for `--dir-text-body-soft`:**
1. Content is body-size supporting text — Subordinate aside register (italic IS 15 / LH 1.5) OR §07 summary register (upright IS 15 / LH 1.75, the chosen-direction's narrative one-liner).
2. Adjacent main-flow body renders at `--dir-text-body` — color delta carries body→body sub-line register step that spacing alone could not (resolves flag #42 body→body sub-line scan).
3. Sanctioned uses: §07 summary · §07 catch · §06 "My move:" (×4 steps) · §03 pattern close · §04 stakes · §10 reflection. New use cases must (a) match the body-size supporting-text role, (b) earn through being a documented register-step problem, (c) be added to this list.

**What this is NOT:**
- Not a replacement of `--dir-text-secondary`. Secondary stays at `#5F5B54` for small-text uses (eyebrows, captions, META_VALUE). Body-only architectural decision (Cycle 9 close) — small text retains the locked secondary; body-size supporting text uses the new body-soft register.
- Not a header-zone register. Titles stay at `--dir-text-primary`. The cascade is: primary (titles) → body (main-flow body) → body-soft (body-size supporting) → secondary (small-text). Each register has a single role, no overlap.
- Not a path to relax the locked title color. Title remains `#121110`. The title↔body adjacency problem is solved by lifting body, not by lowering title.

---

## C) Semantic Roles

Where each token is used. Surfaces resolve these via `[data-direction="w2-near-white-hold"]` CSS scope.

| Role | Token | Notes |
|------|-------|-------|
| Page ground | `--dir-bg` | Default page and major-surface ground |
| Card / panel | `--dir-raised` | Anything that needs to sit above ground by one step |
| Recessed inset | `--dir-recessed` | Code blocks, inset panels, chapter breaks |
| Metadata strip | `--dir-muted` | Footer meta, byline rows, quieter regions |
| Display / heading ink | `--dir-text-primary` | All Clash Display and Instrument Serif headings (locked anchor) |
| Body ink | `--dir-text-body` *(Cycle 9 W1 reopen 2026-05-13)* | Reading-length Instrument Sans body — `BODY` const (IS 15) + `DENSE` const (IS 13 compressed). Was `--dir-text-primary` pre-Cycle-9-reopen. Cycle 2 lock superseded by W1 reopen close. |
| Body-soft / supporting-body ink | `--dir-text-body-soft` *(Cycle 9 W1 reopen 2026-05-13)* | Body-size supporting text — Subordinate aside register · §07 summary · §07 catch. Was `--dir-text-secondary` pre-Cycle-9-reopen; lifted to a separate body-tier register so small-text uses keep secondary's 6.6:1 contrast. |
| Caption / eyebrow / metadata-value ink | `--dir-text-secondary` | Small-text UI labels (IS 10/11), captions (IS 11), metadata values via META_VALUE register (IS 13 + text-secondary, Cycle 9 lock). Body-size supporting text uses `--dir-text-body-soft`, not this token. |
| Divider / frame | `--dir-border` | 1px lines, card frames, rule-based structure |
| Inline link | `--dir-link-color` | Unified with ink. Link-ness comes from underline, not color shift |
| Primary CTA | `--dir-cta-bg` / `--dir-cta-text` | Graphite ground, near-white ink |
| Outline button | `--dir-border` frame, `--dir-text-primary` ink | Chip tokens reused |
| Tag / chip | `--dir-chip-bg` / `--dir-chip-border` | Transparent fill, quiet outline |
| Authored detail | `--dir-detail` | Margin rules, annotation accents, minor marks |
| Exception zone | `--dir-exception-*` | Dark inversion for rupture / emphasis registers |

---

## D) Interaction & Depth Behavior

- **Depth ladder (light → dark):** `bg → raised → recessed → muted`. Four surface registers. No additional stops; any fifth register belongs in the exception zone.
- **Ink ladder (dark → light):** `primary (#121110) → body (#383632) → body-soft (#797369) → secondary (#5F5B54) → detail (#878075)`. **Five register stops**, all sanctioned, all on the locked warm-graphite axis. Each register has a distinct role; no overlap. Adding stops beyond these requires a documented role failure on a real implementation surface + a new sanctioned exception cycle.
- **Darks are unified.** `--dir-text-primary`, `--dir-accent`, `--dir-cta-bg`, `--dir-exception-bg`, and `--dir-link-color` all resolve to `#121110`. This is intentional: in W1, the graphite ink is the accent. Separate accent hues would reintroduce chromatic promotion W1 was selected specifically to avoid.
- **Ink-tier scope is role-locked.** `--dir-text-body` is sanctioned for body-size main-flow text only (BODY/DENSE consts). `--dir-text-body-soft` is sanctioned for body-size supporting text only (Subordinate aside, §07 summary, §07 catch). `--dir-text-secondary` is sanctioned for small-text uses only (IS 10/11/13: captions, eyebrows, META_VALUE). Crossing roles between these tokens (e.g., using `--dir-text-body-soft` for a caption, or `--dir-text-secondary` for body-size supporting text) is drift — corrects to the per-role correct token.
- **Link behavior.** Links read as ink with an underline. No hue shift. No hover-state color reveal. This is deliberate — the design language around W1 does not carry a web-blue affordance.
- **Chips / tags** use a transparent fill by default. The chip outline `--dir-chip-border` matches `--dir-border` — chips read as structural tokens, not as saturated pills.
- **CTAs** are filled graphite on light ground, or outline graphite when a second CTA is needed. Outline = border + ink + transparent fill. No ghost, no tertiary, no colored CTA variants.
- **Exception zone** inverts the ladder: dark ground `#121110`, near-white ink `#FDFCF9`, warm detail `#878075`. It is a register shift, not a new color direction. Reserve for editorial rupture, hero darks, and the dark side of proof / stat registers.

---

## E) Archive Rule — W2, W3, and the 22-direction field

**W1 is the canonical system.** W2 and W3 are archived reference bounds, not selectable alternatives.

- `/pass4/w1-warm-paper-clean` and `/pass4/w3-warm-body-controlled` remain live for side-by-side inspection only. They are NOT selectable outputs of the color system.
- The full 22-direction lab at `/`, the Pass 2 finalists at `/pass2`, and the Pass 3 hybrids at `/pass3` are retained as provenance. None of them are the production system.
- New surfaces, new case studies, and all applied hiring-facing work use W1 tokens. Do not reintroduce H1 / H2 / H3 behavior or any T2 / T3 direction into applied surfaces without explicitly reopening the color system.

---

## F) What was rejected from W2 and W3

For the record, so future review passes have receipts:

- **From W2 (Warm Paper Clean):** the `#FBF9F4` ground read as paper at rest but pulled beige on dense reading surfaces (A6) and on B-lane editorial closes. The extra warmth was not load-bearing — it added weight without adding authorship.
- **From W3 (Warm Body Controlled):** the `#FAF7F1` ground and `#15120F` ink retained more of the H1 body but reintroduced the muddy-dark drift W1 was designed to eliminate. The warmer paper helped a handful of C-lane atmospheric surfaces and hurt everything else.
- **Common to both:** under F1 Panel 07 (WCAG contrast readout) and F1 Panel 08 (behavioral grid), W2 and W3 produced marginal readings on muted / recessed contexts that W1 clears comfortably.

---

## G) Implementation Rule

Production surfaces consume W1 through the same CSS-var contract used in the lab:

```css
[data-direction="w2-near-white-hold"] {
  --dir-bg: #FDFCF9;
  --dir-raised: #F9F7F3;
  --dir-recessed: #F3F0E8;
  --dir-muted: #EBE7DC;
  --dir-text-primary: #121110;
  --dir-text-body: #383632;
  --dir-text-body-soft: #797369;
  --dir-text-secondary: #5F5B54;
  --dir-border: #E3DFD4;
  --dir-accent: #121110;
  --dir-detail: #878075;
  --dir-exception-bg: #121110;
  --dir-exception-text: #FDFCF9;
  --dir-exception-accent: #878075;
  --dir-cta-bg: #121110;
  --dir-cta-text: #FDFCF9;
  --dir-cta-border: transparent;
  --dir-link-color: #121110;
  --dir-chip-bg: transparent;
  --dir-chip-border: #E3DFD4;
}
```

When the portfolio site is built, the `[data-direction]` scope may be dropped and the tokens promoted to `:root` — the names and values do not change. The 20-var contract is the portable surface (was 18-var pre Cycle 9 W1 reopen close 2026-05-13; +2 ink-tier exception tokens).

---

## H) Conformance

The locked system has been validated against the full active surface universe:

- A lane (7 surfaces): A1–A7 product surfaces.
- B lane (8 surfaces): B1–B8 portfolio / editorial surfaces.
- C lane (5 surfaces): C1–C5 experimental.
- D lane (5 surfaces): D1–D5 breakpoint.
- E lane (15 surfaces, E V2): E1.1–E1.5 authored abstraction; E2.1, E2.2, E2.5 absurd systems; E3.1–E3.7 substrate as voice.
- F1 diagnostics (8 panels): tokens, hierarchy, depth, containment, coherence, contrast readout (Panel 07), behavioral grid (Panel 08).

All surfaces resolve W1 through the shared CSS-var contract. F1 Panel 07 produces clean contrast readings for the locked tokens on bg / raised / recessed / muted / exception contexts. F1 Panel 08 confirms the behavioral grid (filled CTA · outline button · text link · chip) holds across all four background contexts under W1.

E V1 (the archived 8-surface rupture lane) resolves W1 through the same contract but is preserved as an archive register. Production surfaces use E V2.

---

## I) Provenance

- Prompt 2B (complete): surface universe — 41 surfaces + 8 F1 panels.
- Prompt 3A (complete): 22 color directions defined.
- Prompt 3B (complete): 22 × 41 × 8 grid rendered. Authoritative record of the direction field.
- Pass 2 (archived at `/pass2`): 4 finalist directions.
- Pass 3 (archived at `/pass3`): 5 hybrid directions — introduced H1 / H2 synthesis.
- Pass 4 (archived at `/pass4`): 3 refinement variants inside the H1 warmth + H2 cleanliness zone. **W1 selected as winner and locked.**
- Winner-lock surgical refinement pass: `--dir-text-secondary` tightened 13→11 warm-delta. No other tokens moved.
- Cycle 9 W1 reopen close (2026-05-13): added two sanctioned exception ink-tier registers — `--dir-text-body` (`#383632`, L*22.7, warm-Δ 6) and `--dir-text-body-soft` (`#797369`, L*48.7, warm-Δ 16) — on the locked primary→secondary→detail warm-graphite axis. Reopen authorized by documented implementation failure (`/gate-a/ion/r1` title↔body collapse + §07 body→body sub-line scan). Architectural decision: Body-only (per-role exception) over Global (single-token replacement) — keeps small-text contrast comfort at locked secondary 6.6:1 while solving body-size differentiation. 7-candidate A/B test surface (`GateAIonS07BodyInkSetContext`) at `/gate-a/ion/r1` §07 + lift-scope architectural toggle (`GateAIonSecondaryLiftScopeContext`) used for decision; Set E (body L*23, body-soft L*49) won, Body-only scope locked. Resolved flags #28 / #32 (Cycle 2 body-ink reopen path) / #40 (sub-section title→body closeness — eventually carried by spacing, body-soft also helps) / #42 (body→body sub-line scan).

The live locked lab surface is at `/locked/w1` in the Color System Lab app. It is a tabbed page: the index is the spec view; sibling tabs (`/a /b /c /d /e /e-v1 /f1`) carry the full W1 playground — every active surface and diagnostic panel rendered under the locked tokens.
