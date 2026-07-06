# Desk Doodles — Craft + Personality Upgrade Plan (BIG VISUAL PASS source)

*Source: video-analysis workflow `wf_519620d3-90d` (2026-06-15) — 3 parallel agents deep-read two reference
videos (the bar to surpass) + our own 3D/homepage frames (the gap), then synthesized. Reference 1 = "Exquisite
Corpse" Config-Makeathon film; Reference 2 = "Babbu" children's-dictionary promo. Frames: `/tmp/dd-refvid1`,
`/tmp/dd-refvid2`, `/tmp/rosevid2`. Per Sebs: this feeds the END-of-build big visual pass to "make it perfect."*

**Brand law throughout: everything stays INK-BLACK — no hue on the form, no grey-wash. Tonal range is created by
LIGHT and AO, never by tinting the ink.** (Already proven the hard way in R10: svg-port/hatch went grey because they
paint the drawing as albedo; the black-safe answer is light/relief, and the shipped **etching** — light incised lines
on the black form — is the first instance of "value from light, not pigment.")

---

## 1. THE BAR — what the references do that's premium

Neither reference wins on 3D fidelity. They win on **end-to-end world consistency, motion polish, and a point of
view.** That's the bar, and it's where a default three.js/r3f build is most exposed (technically rich, tonally flat,
motionally mechanical).

- **A. Material is a MATERIAL, not a color** — torn deckle paper edges, fiber roughness, ruled guide-lines, tiny
  registration marks; ink is a *textured brush* (dry-media grain, width variation, streaky fills). The medium has
  personality. Biggest "craft + care" tell.
- **B. One palette, one hand, zero drift** — one color system from title → every UI surface → outro; chrome + artifact
  in the *same hand* (handwritten UI labels so the interface feels drawn); two-tier type only; no default system font
  ever leaks in.
- **C. Motion alive in every beat** — two timescales at once (slow Ken-Burns drift UNDER fast per-element pops);
  one-element-at-a-time reveal cascade with scale-overshoot; title/brand type breathes on entry (organic easing, never a
  hard cut); custom cursors do narrative work.
- **D. The core idea IS the hero motion beat** — Exquisite Corpse pays off masked seams with the assembled-figure
  reveal; Babbu's baby-word→real-word width-tween IS the product thesis made visible, + a confetti reward sized to the
  achievement.
- **E. Color-as-identity + surgical realism** — each word gets one reused hue; photoreal touches (live status bar,
  recording dot, blinking cursor) make a playful flat brand read as a genuine shipping app; deliberate scene grammar.
- **F. A point of view** — art-historian usernames, a Dali actor, surrealist references. Feels made by people with
  taste, for a culture — not generated to spec.

---

## 2. OUR GAP — honest

**At/near the bar (don't regress):** the homepage is genuinely premium (warm-paper editorial layout, confident display
serif, radial bloom, restrained hand-drawn objects); the 3D control system is real + rich (Native/Rod/Extrude/Inflate/
Solid each expose meaningful params); Inflate genuinely delivers volume.

**Deficiencies, priority order:**
1. **VALUE RANGE (#1).** Ink-black material has almost no tonal gradient — Native/Extrude/Solid read as a flat 2D black
   silhouette; all geometry work is invisible. Inflate wows *because* its ridge sheen adds tonal variation. Solvable
   without breaking ink-black: tone from LIGHT/AO, not pigment. (The shipped etching is a partial down-payment on this.)
2. **LIGHTING / ENVIRONMENT.** Flat key, no IBL/env reflection, no contact shadow, no AO in concavities → "render
   preview," not "product shot." Fresnel rim too thin/dark to separate black form from paper at most angles.
3. **MATERIAL SEPARATION.** Same #000 everywhere → the 3D object has no identity, only an under-powered rim. (Brand law
   forbids fixing with hue → separation must come from rim, contact shadow, specular roll-off.)
4. **MOTION.** Flip is an instant swap; rotation is constant-velocity turntable. No ease, no overshoot/settle, no hero
   hold on the best 3/4 angle. The marquee 2D→3D moment — our entire wedge — lands flat.
5. **DEFAULT MODE.** Native-flat as the landing 3D state undersells; Inflate (the mode that wows) should lead.
6. **NO NARRATIVE SPINE / REWARD BEATS.** No morph/confetti payoff, no custom cursors, no scene grammar, no
   point-of-view in naming/copy.

---

## 3. ABOVE & BEYOND — prioritized (all Make-safe; all ink-black: value from light/AO/rim/contact-shadow, never hue)

### 3D RENDER CRAFT
- **[CRITICAL] R1 — Value range via light, not pigment (M).** Key+fill+rim 3-light rig (lighter terminator + darker
  shadow side on a black body) + AO (`<AccumulativeShadows>`/SSAO) so crevices darken and the bas-relief carve depth
  reads + use the bas-relief bump carve + hatch shaders we already have so hatch density = mid-tone falloff (ink hatch
  IS the shading). *(Partly down-paid by the shipped etching.)*
- **[CRITICAL] R2 — Environment / IBL (S–M).** Soft studio HDRI or procedural gradient `<Environment>` → graduated
  reflection separates the black form from paper at every angle. Keep low-saturation/neutral.
- **[CRITICAL] R3 — Contact shadow + soft AO grounding (S).** `<ContactShadows>` so it sits ON the desk. Cheapest
  preview→product upgrade. Neutral/warm, not a grey wash.
- **[HIGH] R4 — Strengthen + luminance-adapt the Fresnel rim (S).** Warmer/brighter, intensity adapts to bg luminance
  so the black edge always reads. (We already have the rim — tune + a luminance-aware uniform.)
- **[HIGH] R5 — Make Inflate the DEFAULT 3D mode (S).** Only mode that delivers the 2D→3D wow on first contact. Config.
- **[HIGH] R6 — Matte Clay fix (S–M).** Wrap/area light + AO; lift the lit-response shoulders (darkest valley still
  #000) so clay reads sculpted, not sticker.
- **[MEDIUM] R7 — Ink as textured media in 3D (M).** Dry-media grain + slightly irregular silhouette edge so the black
  form reads as drawn ink standing up off the page; tie to the Smart Hachure mark family (same hand as 2D strokes).

### APP VISUALS / MOTION / PERSONALITY
- **[CRITICAL] A1 — Choreograph the flip as the hero beat (M).** ease-in → overshoot-and-settle → slow auto-orbit that
  HOLDS the best 3/4 angle. Anticipation (flat ink "tenses") + settle. Show the transform, don't tell it.
- **[HIGH] A2 — Two motion timescales on the desk (S–M).** Slow Ken-Burns drift UNDER fast per-object micro-anim.
- **[HIGH] A3 — One-element-at-a-time reveal cascade (S).** Pop objects in one at a time w/ scale-overshoot.
- **[HIGH] A4 — Reward beat sized to the achievement (S).** Fire on a real completion; ink-black paper-scrap/torn
  confetti (reward matches Babbu, palette stays ours).
- **[HIGH] A5 — One hand on the chrome (M).** Audit every label/tooltip/button — no default-font leak; the drawn hand
  runs homepage → draw panel → 3D viewport chrome.
- **[MEDIUM] A6 — Custom cursors (S).** Precision crosshair while drawing; pointing-hand on chrome.
- **[MEDIUM] A7 — Live ambient 3D demo above the fold (M).** Flip 1–2 homepage doodles into upgraded 3D (after R1–R5).
- **[MEDIUM] A8 — Color-as-identity, ink edition (S–M).** Per-object ink signature: consistent ink-outline weight +
  warm-paper drop shadow + reused silhouette so a heterogeneous gallery rhymes (die-cut sticker border in ink).
- **[MEDIUM] A9 — Scene grammar for promos (S).** Crossfade-through-white, fade-to-black, open-small/close-fuller.
- **[LOW–MED] A10 — A point of view (S).** Named demo doodles, playful on-brand copy, inside jokes (Day 12–13 pass).
- **[MEDIUM] A11 — Material the paper itself (S–M).** Irregular torn/deckle edge + faint fiber + barely-there grid on
  the warm-paper ground (homepage + 3D desk) so empty canvas is never dead. Ink stays ink.

---

## 4. QUICK WINS vs BIG-VISUAL-PASS

**QUICK WINS (land now — S, low-risk, mostly config/tuning):** R3 (contact shadow) · R2 (procedural-gradient env) ·
R5 (Inflate default) · R4 (rim tune) · A3 (reveal cascade) · A6 (cursors) · A4 (ink confetti reward) · A2 (Ken-Burns).

**BIG-VISUAL-PASS (the perfecting pass — M/L, interdependent, calibration-heavy):** R1 (value range: light+AO+hatch-
as-tone) · R7 (textured ink media) · R6 (matte-clay) · A1 (flip as hero beat) · A5 (one-hand chrome audit) · A7 (live
above-fold 3D) · A8 (ink-signature identity) · A11 (material the paper) · A9/A10 (scene grammar + POV) — part of the
Day 12–13 own-design-language pass.

---

## 5. THIRD REFERENCE — "Doodle Fonts" (2026-06-16, our exact genre: a build-in-public creative TOOL)

*Source video: `/Users/sebs/Downloads/y1k3quxqhnrjo5tydzwn.mp4` (35s, 1200×674). Frames: `/tmp/vid3`. Unlike refs 1–2
(promo films), this is the CLOSEST genre match to Desk Doodles — a build-in-public app for MAKING something doodly (a
font editor). It's the bar for "how a doodle-tool should look + present itself"; most of its lessons are UI-craft, not
3D.*

**What it nails:**
- **Clean editorial TOOL chrome.** White ground, hairline grey rules, MONOSPACE technical labels (Dot size 42px ·
  Spacing · Opacity · Shape paint), a left tool-rail, and a big central canvas with real type GUIDELINES (baseline /
  x-height / side bearings). The instrument reads precise + editorial; the OUTPUT is expressive doodle. That contrast —
  precise tool / loose artifact — IS the charm, and it's exactly ours (precise Smart-Hachure engine / hand-drawn doodles).
- **Product-as-hero in every frame.** A big A–Z SPECIMEN line always on top, a live glyph-MAP grid (A-Z/a-z/0-9/punct)
  on the right, the editor in the center — you never lose sight of the artifact. (Our homepage does this with floating
  styled objects; the DRAW/CANVAS surfaces don't yet — they could foreground a live specimen/preview.)
- **Eats its own dog food (the "one hand," taken literally).** The wordmark + chrome animate from a sans INTO the doodle
  font being made ("Doodle Fonts" → the dotted/scribbly "Doodle fonts"). The product literally makes the type that
  brands it — the strongest possible version of our **A5 one-hand chrome**, and it validates A5 hard.
- **A curated library with a POINT OF VIEW.** Named style families — Shakey · Grids · Scribbles · Dot World · Config ·
  Box Box. Not "presets," a *collection* with taste. (We have 11 render styles + 197 objects — name + curate them like
  this for the gallery/demo.)
- **Type-forward, minimal outro.** "Doodle fonts" set in its own font on plain white; closing thought "design matters
  now more than ever." No 3D, no effects — just the artifact + a POV line.

**Don't over-index:** no 3D, no motion choreography, no material/lighting craft — refs 1–2 still own that bar (§1–§3).
This ref owns the **UI-craft + self-referential brand + tool-presentation** bar, in our exact genre.

**NEW actionables (fold into the visual pass):**
- **[HIGH] V1 — Editorial tool-chrome pass on Draw / Canvas / 3D panels.** Monospace technical labels, hairline rules, a
  big central canvas with faint guidelines, a restrained rail — make the *instrument* read precise + editorial (the foil
  to the loose doodle). Extends A5 from "one hand" to "one editorial system."
- **[HIGH] V2 — Foreground a live SPECIMEN/preview on the work surfaces** (product-as-hero, like the A–Z line). The
  PREVIEW pane is a start; make it the hero — "here's your doodle, here's how it reads in each style/3D."
- **[MED] V3 — Render the chrome wordmark + section labels in our own doodle hand** (the literal A5 dog-food move).
- **[MED] V4 — Name + curate the 11 styles / object families as a "library" with a POV** (gallery + demo), so they stop
  reading as presets.
- **[DEMO] V5 — Borrow the outro grammar for our Weavy demo video** (task #5): type-forward, plain ground, the artifact
  in its own hand, one POV line to close. Feeds the video-build doc.

**One-line:** refs 1–2 = the 3D/motion bar; Doodle Fonts = the *tool-presentation + self-referential-brand* bar — the
one in our exact genre. Its lesson: a doodle tool wins by pairing a PRECISE editorial instrument with LOOSE expressive
output, and by literally branding itself in the thing it makes.

---

### One-line thesis
**We don't beat the references on 3D fidelity — we beat them by matching their end-to-end world-consistency + motion
polish AND delivering the one thing they can't: a 2D-ink → 3D-object transform that looks like ink physically standing
up off the page. The fix for our flat-silhouette problem is light, AO, rim, contact shadow, and hatch-as-tone — never
hue. The ink stays black; the craft comes from how light finds the form and how the transform is choreographed.**
