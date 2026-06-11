# 25 — Research: Desk Doodles' Own Design + Motion Language (M11 prep)

**Status:** research-first deliverable for the Day 12-13 (plan slot 06-16) divergence pass. NO code changed.
**Governs against:** `makeathon-plan.md` RE-BASELINE §C-2 ("Desk Doodles earns its OWN design + motion language — NOT a portfolio reskin") + D-grid 06-16 + memory `project_desk_doodles_own_design_language` ("i dont want to just use my portfolio design system i want this to feel like me but still have its own language" — Sebs 2026-06-11).
**Craft bar:** `feedback_no_cheap_polish`. **Choosing an identity is SEBS'S call** — §6.

---

## 0. What we already have (harvest, then diverge)

The vocabulary the pass harvests is already accumulating in-repo:

- **W1 scaffold tokens** (`docs/locked-refs/system/color-system-w1.md`): `--dir-bg #FDFCF9` ground, `#121110` graphite ink, `#E3DFD4` borders. This is the portfolio's voice — near-white, minimum-warmth, editorial. Desk Doodles' ground should get WARMER than this (a desk under a lamp, not a printed page).
- **Chrome canon** (`src/app/lib/chromeStyles.ts`): PILL/CTA/CHIP/SECTION_LABEL — pill geometry stays (it's a Sebs constant, `feedback_fully_rounded_pill_ui`), but the ink/voice inside it is up for grabs.
- **deskCraft material** (`src/app/lib/deskCraft.ts`): two-scale PAPER_GRAIN (f0.8 + f0.35), WARM_POOL lamp gradient, OBJECT_SIT_SHADOW hue-tinted layered shadows (Comeau, https://www.joshwcomeau.com/css/designing-shadows/). This is already Desk Doodles' own — the divergence pass extends it, doesn't replace it.
- **Motion today:** 260ms ease-out panel collapse, 0.15s chrome transitions, instant direct manipulation (drag persists on release, no flourish).
- **Fonts bundled:** Instrument Sans + Instrument Serif (Google Fonts import, `src/styles/fonts.css`) + Clash Display (local woff2, Fontshare/ITF free license).

---

## 1. Aesthetic territory — what makes warm-analog-digital desks feel like PLACES

### 1a. Desk-sim games

- **Unpacking (Witch Beam).** The place is built from OBJECTS WITH HISTORY, not from set dressing — the story is told entirely through someone's belongings, and a core design principle was "acknowledge whatever the player chose to do" without suggesting choices were invalid (https://www.gamedeveloper.com/design/telling-story-someones-belongings-unpacking · https://www.escapistmagazine.com/unpacking-design-delve-interview-witch-beam-developers-wren-brier-tim-dawson/). **Device for us:** the desk's warmth comes from doodles ACCUMULATING and staying where people put them (already true — drag persists); never auto-tidy or grid-snap the desk. Acknowledgment > judgment maps to publish copy ("On the desk" not "Submitted").
- **A Little to the Left (Max Inferno).** Forms stay close to reality so the hidden structure feels magical when found; art is soft-pastel and flat while REALISTIC, ASMR-ish sound describes the material and space (https://www.gamedeveloper.com/design/the-methodical-catharsis-of-tidying-in-a-little-to-the-left). **Device for us:** flat art + one strong material cue is enough to read as a place — we don't need skeuomorphic depth; grain + sit-shadow + (post-makeathon) a paper-scratch sound on Done would complete the trick.

### 1b. Stationery brands

- **Field Notes.** Kraft cover + ONE typeface (Futura; a Monotype collaboration was announced at Adobe MAX 2024 — https://www.monotype.com/company/press-release/monotype-reveals-universe-type-and-new-collaboration-field-notes-adobe-max) + the spec-list colophon printed inside every book — utilitarian-nostalgic discipline modeled on agricultural memo books (https://en.wikipedia.org/wiki/Field_Notes · https://fieldnotesbrand.com/products/original-kraft). **Device for us:** the COLOPHON LINE — a tiny one-typeface spec footer on every ObjectCard ("№ 047 · hachure · desk: Warm Riso Press · 06-14") — identity through disciplined metadata, and it doubles as the ML-label surface.
- **Risograph print culture.** Translucent soy inks layered one color at a time; overlaps mix via multiply; 0–3mm misregistration between layers is unavoidable and EMBRACED; grain from ink absorption is the identifying mark (https://splitarrowprints.com/learn/risograph-printing-quirks-an-intro-into-risograph-imperfections-and-their-causes/ · https://www.odditiesprints.com/risograph). **Devices for us:** (1) two-ink palettes that overlap with `mix-blend-mode: multiply`; (2) a deliberate 1–2px layer offset as a hover/active treatment; (3) our PAPER_GRAIN is already the riso grain — same family.

### 1c. Concrete device extraction

| Axis | Device | Status |
|---|---|---|
| Texture | Two-scale feTurbulence grain, whisper-quiet, never wood/cork | DONE (deskCraft) |
| Shadow | Hue-tinted (60,50,40) layered contact+ambient; objects sit, not float | DONE (deskCraft) |
| Color temp | Ground moves warmer than W1's #FDFCF9 — cream/oat, lamp-pool warmth | Divergence pass |
| Edges | Sticker die-cut: 2–3px paper-white outline around desk objects (the "cut out and stuck down" read — uses existing SVG pipeline, no new tech) | Candidate |
| Edges (alt) | Riso misregistration offset on interactive states | Candidate |
| Metadata | Field Notes colophon line on cards + desks | Candidate |

---

## 2. Motion character — calm-paper vs springy-playful (Kowalski vocabulary)

Grounding: Emil Kowalski's "Great Animations" — ease-out as the default for responses to user input, most UI animations under ~300ms, taste = knowing when NOT to animate (https://emilkowal.ski/ui/great-animations). Terms below per `reference_vocab_motion`.

**The two poles, each with a real exemplar:**

- **Calm-paper — Things 3 (Cultured Code).** Every animation purposeful, buttery, subtle — widely praised for restrained, utility-first motion that never gets in the way (https://medium.com/@jordanborth/an-ode-to-cultured-code-and-things-3-292e20112624 · clips at https://60fps.design/apps/things-3). Character: ease-out, short durations, near-zero overshoot, motion as orientation not personality.
- **Springy-playful — Family wallet (Benji Taylor / LFE).** Design principles "simplicity, fluidity, delight"; transitions feel like one continuous journey; big rare moments (wallet creation) get a full interactive animation marking the occasion (https://benji.org/family-values). Character: springs with visible bounce, origin-aware morphs, moments celebrated.

**What fits "doodles on a shared desk": a hybrid, weighted calm.** The desk is paper — paper doesn't bounce. But the OBJECTS are playful hand-drawn things, and minting one is rare enough (frequency-of-use principle) to earn a moment. This maps cleanly onto the decisions already locked:

| Surface | Existing decision | Kowalski mapping |
|---|---|---|
| Drag / sliders / pan-zoom | Instant, no flourish | Direct manipulation = zero added motion; momentum only from the gesture itself |
| Panel collapse | 260ms ease-out | Keep; frequency-of-use says chrome stays ≤300ms, no spring |
| Popovers/menus | — | Origin-aware scale-in (grows from trigger), ease-out ~180ms |
| Doodle lands on desk | Discrete moment | ONE spring: scale-in 0.92→1 with slight overshoot + sit-shadow fade — the object "drops" onto the paper. Interruptible. |
| Card reveal (mint) | Discrete moment | The flagship moment: shared-element transition desk-object→card, then a single tilt settle. Rare = allowed to be ~500ms. |
| Surface morph (Create/Edit/Sandbox) | One-surface-3-modes | Layout animation / continuity transition — the panel IS the same surface, so morph, never crossfade-replace |
| Gallery / desk load | — | Stagger ~40–60ms cascade, fade+rise, ease-out |
| Reduced motion | Already in CollapsiblePanel | Holds everywhere (vocab: reduced motion) |

**Spring tuning per identity** (§5): calm-paper = critically damped (no visible bounce); riso = one soft overshoot; marker = low damping on the two discrete moments only.

---

## 3. Type + color candidates (license-checked: Google Fonts OFL or already bundled)

All three keep Instrument Sans as UI/chrome workhorse (already bundled, pills stay legible) — divergence lives in the DISPLAY/NAME voice + palette. Clash Display is the portfolio's display voice → retire it from Desk Doodles to break the reskin read.

### A. Warm-paper-plus-one-accent ("the desk under a lamp")
- **Type:** Instrument Sans (bundled) + **Caveat** for hand-written accents — names, "why" lines (OFL, Impallari Type, https://fonts.google.com/specimen/Caveat).
- **Palette:** `paper #FAF5EA` · `ink #2B2722` · `border #E6DCC8` · `accent #D14B3F` (riso-adjacent warm red, used ONCE per view) · `shadow-tint rgba(60,50,40,…)` (existing).
- **Why it reads as Sebs:** the smallest move off the portfolio — same warm-graphite taste, ground warmed to actual paper, one ink-red accent like a margin correction. Lowest risk, least distinct.

### B. Risograph-two-tone ("Warm Riso Press")
- **Type:** **Fraunces** display (OFL; soft-serif with SOFT + WONK variable axes — the WONK axis swaps in wonky, leaned glyph forms — an irregularity dial in spirit, https://fonts.google.com/specimen/Fraunces · https://fraunces.undercase.xyz/) + Instrument Sans UI.
- **Palette (two translucent inks on cream, real riso ink standards per the Stencil community ink library, https://www.stencil.wiki/colors):** `paper #FAF3E3` · `ink-blue #0078BF` (Riso Blue) · `ink-orange #FF6C2F` (Riso Orange) · `overlap` = multiply of the two (≈ deep brown-violet, computed not authored) · `graphite #2B2722` for body text.
- **Why it reads as Sebs:** his own desk-name pool already says it ("Warm Riso Press" · "Ridgeline Riso") — print-shop craft, ink-on-paper, imperfection embraced; pairs natively with the grain + the hand-drawn marks.

### C. Graphite-and-cream ("Quiet Graphite Morning")
- **Type:** **Newsreader** text serif (OFL, Production Type for Google Fonts, optical sizes, https://fonts.google.com/specimen/Newsreader) for card names/editorial + Instrument Sans UI; optionally **Shantell Sans** (OFL, marker-style with Informality + Bounce variable axes, https://fonts.google.com/specimen/Shantell+Sans · https://github.com/arrowtype/shantell-sans) as the single playful register for desk names.
- **Palette:** near-monochrome pencil ladder — `cream #F8F4EB` · `graphite-9 #26231F` · `graphite-5 #6B645A` · `graphite-2 #D9D2C4` · one warm highlight `#E8A13D` (pencil-cedar amber) for Live/status only.
- **Why it reads as Sebs:** it's his sketchbook — graphite hachure on cream is what the engine literally draws; the UI becomes the same material as the art. Risk: close to portfolio W1's axis; the warmer cream + serif/marker voice has to carry the divergence.

---

## 4. The card as identity anchor (TCG canon → ObjectCard)

What makes Pokémon/MTG cards feel premium, with the transferable rule extracted:

- **Foil restraint = the premium signal.** Holo treatments only begin at the Rare tier; commons stay matte — scarcity of shine is what makes shine mean anything (https://bulbapedia.bulbagarden.net/wiki/Holofoil · https://www.cardsnpacks.com/en/blog/raretes-cartes-pokemon-holo-full-art/). **Rule: most ObjectCards are matte paper. Shine is earned, never default** — candidates for "rare": first doodle on a new desk, a remixed-lineage doodle, the desk-closing doodle.
- **Two foil grammars:** standard holo = ART shines, frame matte; reverse holo = FRAME shines, art matte (same Bulbapedia source). If we ever shine, shine the ART (the user's hand is the wedge — never out-glow it with chrome).
- **Frame hierarchy (MTG M15 redesign):** thinner border → more art; name bar at top; the machine-readable collector line (number/rarity/set) lives in a dedicated bottom strip (https://mtg.fandom.com/wiki/Card_frame · https://www.coolstuffinc.com/a/adam-styborski-01062014-new-card-frame-coming-in-magic-2015). MTG's identity glue is ONE proprietary display face (Beleren) used nowhere else — our equivalent: the chosen display font (§3) appears ONLY in the name-banner. **ObjectCard mapping:** art window dominates ≥65% · graphite name-banner (the ML label) · capped why-line · colophon strip = collector line (№ · style · desk · date · handle) — which is also the Field Notes device (§1b), so card and brand share one grammar.
- **Info density:** TCG cards survive ~8 data fields by strict zoning (name/cost top, art middle, rules box, collector strip bottom — same M15 sources). We have 5 fields; zone them, never float them over art.
- **Implementable foil, already proven on the web:** simey's CSS holographic Pokémon cards — pointer-tilt + layered gradient/blend-mode foil, pure CSS (https://poke-holo.simey.me/). Scope: ONE tilt-shine on the mint moment fits Day 12-13; full foil library does not.

---

## 5. Candidate identities (coherent bundles — names from Sebs's own desk-name pool)

### I. "Quiet Graphite Morning" — the sketchbook that ships
- **Palette:** §3C graphite-and-cream + amber highlight. **Type:** Newsreader names · Instrument Sans UI · (opt.) Shantell Sans desk-names.
- **Motion:** calm-paper (Things 3 pole). Everything ease-out ≤260ms, critically-damped springs (zero visible bounce); the ONLY flourish is the card mint shared-element transition.
- **Signature device:** the colophon line — every card, desk, and the app footer carry the same tiny spec-strip; pencil-amber Live dot is the single non-graphite mark.
- **Read:** disciplined, editorial, closest to "Sebs the craftsman." Lowest divergence risk; weakest "own product" jump.

### II. "Warm Riso Press" — the print shop
- **Palette:** §3B cream + Riso Blue + Riso Orange, overlaps multiply. **Type:** Fraunces (wonk on for display, off for text) · Instrument Sans UI.
- **Motion:** middle pole. Ease-out chrome; landing + mint get one soft-overshoot spring; hover/active states use the 1–2px misregistration offset instead of color shifts.
- **Signature device:** two-ink overprint — chips, badges, and the desk-gallery cards print in the two inks and visibly multiply where they overlap; misregistration as the press/hover language.
- **Read:** distinctly its own product, still analog-warm; the strongest brand for a public/social surface. Risk: two strong inks need discipline near user art (palette never overrides doodle ink — `feedback_palette_overrides_ink_not_paper` instinct generalizes).

### III. "Marker Smudge Monday" — the playground desk
- **Palette:** §3A warm paper + marker-blue `#2456D6` accent swapped for the red (felt-tip, not ballpoint). **Type:** Shantell Sans names/headers (Bounce axis up for the wordmark only) · Instrument Sans UI.
- **Motion:** springy-playful (Family pole) — but ONLY at the two discrete moments: doodle-lands (low-damping pop-in) and card mint (tilt + simey-style one-shot shine); chrome stays calm.
- **Signature device:** sticker die-cut white edge on every desk object + holo-tilt on minted cards — the desk reads as a sticker-covered laptop lid.
- **Read:** most playful, best demo-video energy, most "shared toy." Risk: closest to generic-cute if the calm chrome discipline slips.

**Build note (any pick):** divergence = one `deskTheme.ts` token module + font swap + the motion table in §2 — the scaffold's token indirection (`--dir-*`) means recoloring is a css-variable remap, not a refactor. Fits the 06-16 slot.

---

## 6. Decisions for Sebs (HIS call, per `feedback_decision_discipline`)

1. **Pick the identity:** I (Quiet Graphite Morning) · II (Warm Riso Press) · III (Marker Smudge Monday) — or name a merge (e.g., II's palette + I's motion).
2. **Card shine policy:** which states earn foil/tilt (first-on-desk · remix-lineage · desk-closer · mint-moment-only · none)?
3. **Desk-object edge treatment:** sticker die-cut white edge vs riso misregistration vs none (grain+shadow only)?
4. **Retire Clash Display from Desk Doodles?** (Recommended yes — it's the portfolio's display voice; keeping it is the reskin tell.)
5. **Colophon line in scope for 06-16?** It's cheap (one component, fields exist) and is the strongest brand-glue device found.
