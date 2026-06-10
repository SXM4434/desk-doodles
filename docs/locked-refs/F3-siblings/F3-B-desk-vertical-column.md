# Hero #8 · Cell F3-B · Desk · Family B vertical column / identity aside

**Status:** 8.1-B.1 research pass OPENED 2026-05-29. NOT a lock. NO code yet. NO composition decisions yet. Question scope only — findings populate as research streams return.
**Effort:** xhigh — every micro-decision researched online with verifiable citations per `feedback_research_first_no_fake_provenance`.
**Ground-up invariant:** This is the F3-B composition specifically — vertical-column geometry running beside the work field. NOT the desk concept abstractly. F3-A (horizontal hero band) is its own ground-up research pass; **nothing here ports mechanically from F3-A.** Per F3-A.md K5: vertical-column geometry asks different composition questions than horizontal band. Treat the desk concept as fresh material; the layout is the question.

---

## What this cell is

F3 = **Desk / Workbench** F-family (per `project_hero_8_scaffolding_and_layout_relationship` memory + `portfolio-style-art-voice-source.md` §5.1–5.3).
Family B placement = **vertical column / identity aside running beside the work field** (per `gate-a-homepage-track-locked.md` Family B definition + `narrow3/IdentityAside.tsx` scaffolding shipped 2026-05-26).

The composition this cell investigates: **a desk-themed hero living as a sticky vertical column on the left of the page**, with the featured project card + standards work-field running in the right column. Sub-grid measurements (per narrow3 Family B layouts): identity column at `minmax(288px, 5fr)`, work column at `minmax(512px, 9fr)`, 48px gap.

### Geometric facts that distinguish F3-B from F3-A

These are the constraints F3-B is composing against. They are NOT carried from F3-A — they are facts of Family B's published geometry that F3-B research must respond to ground-up.

1. **Aspect ratio:** ~5:9 column at full viewport (vs F3-A's ~21:9 to 32:9 horizontal band). Tall-narrow instead of wide-short.
2. **Sticky behavior:** identity column is `position: sticky; top: 32px; align-self: start` in Family B layouts — it persists in view while the work column scrolls past it (F3-A is natural-flow; scrolls out before featured card claims viewport).
3. **Shared viewport with cards:** identity column and work-field cards COEXIST in viewport at any scroll position above the standards (vs F3-A where independent-containers invariant means the band scrolls out before card claims viewport). This is a fundamentally different visual relationship.
4. **Narrower hit-target footprint:** ~280–320px wide vs F3-A's full viewport width. The 9-object scatter from F3-A would require denser packing or fewer objects.
5. **Vertical scroll dimension is unused real estate:** F3-A has no scroll-linked depth axis to play with; F3-B's sticky behavior + work-column scroll means the hero column can react to scroll position (work-column scroll-y → hero state changes).

These five differences are why F3-B is NOT a rotated F3-A. The composition principles differ: F3-A composes against a wide-short read; F3-B composes against a tall-narrow stack PLUS a sticky-scroll relationship.

### Deferred — separate variation research pass

A **hand-drawn-line F3-B variation** (using the existing `lib/handFeel.ts` primitives — seeded LCG · multi-stroke jitter · already shipping in B1 Venn / C3 UserFlow / D1 Wavy Spectrum) is on the docket as a separate variation research pass. NOT in scope for the current 8.1-B.1 research. NOT a composition-step toggle decision now. It opens as **8.1-B-VARIANT-handdrawn** AFTER the initial F3-B default direction is set (8.1-B.1 → 8.1-B.2 → 8.1-B.3 approval → THEN 8.1-B-VARIANT-handdrawn research opens). Mirror of F3-A's deferred variant.

### Source material (already in repo — not re-pasted here)

- `portfolio-style-art-voice-source.md` §5.1 — 9 desk-object candidate list with meanings + GF alt POV
- §5.2 — 3 interactive picks
- §5.3 — hero interaction candidates (3D desk scene · clickable hover scenes · interactive orbit · click hotspots · drag · tooltip style)
- §6 — performance preferences
- §3.7 — art style tokens
- §3.9 — easter egg budget
- F3-A.md §I2 — sourcing strategy (Tripo / Meshy / Blender pipeline) — **shared infrastructure across F3-A and F3-B**, but per-object choices are ground-up
- F3-A.md §L — Claude-native AI tooling pipeline (MCP servers, Blender plugins) — **shared infrastructure**

### What deliberately is NOT carried from F3-A

Per the ground-up invariant, F3-B research must independently re-evaluate even questions F3-A answered. The following F3-A conclusions DO NOT automatically apply to F3-B:

- Rendering tech choice (F3-A leaned R3F + drei + CSS 3D sprite; F3-B may want something different given the column geometry)
- Object inventory (the 9-object Seb list was chosen for F3-A's horizontal scatter; F3-B may want fewer / different / vertically-priority-ordered objects)
- Interaction model (F3-A leaned click hotspots only; F3-B's sticky behavior may suggest scroll-linked or hover-orbit instead)
- Hover tooltip pattern (F3-A's cursor-follow DOM tooltip may not survive in a narrow sticky column where cursor often hovers over the WORK column, not the hero column)
- Object style (toon-shaded + outline was F3-A's lean; F3-B may want a different style that reads at narrow column scale)
- CS-hero continuity option (F3-A leaned no-continuity; F3-B's sticky column has a natural "persist into case-study side rail" affordance F3-A doesn't have)
- Page-entry intent statement (F3-A's "scattered authorship → focused work" is a F3-A-shape; F3-B's geometry suggests a different statement)
- Default copy / title placement (F3-A puts title above the band; F3-B's column has top-stack vs sticky-stack questions)

What DOES carry: the F-family identity (desk = identity through objects), the sourcing pipeline (Tripo / Meshy / Blender), the easter-egg budget rules, the W1 art-system tokens.

---

## Research questions (8.1-B.1 scope)

Each question must be answered with verifiable online citations. No name-dropping. No invented precedents. Mirror of F3-A.md research question structure but tuned to vertical-column geometry.

### A. Rendering technology decision (re-evaluated for column geometry)

A1. What does "lightweight canvas" mean for a 280–320px wide × tall-as-viewport sticky column 3D scene? Re-evaluate the options matrix from F3-A.md §A specifically for column geometry — narrower viewport = lower triangle budget feasibility, sticky-scroll = render loop must be lazy or paused.
- React Three Fiber + drei
- Native Three.js
- Native HTML canvas with custom 2.5D
- Spline embed
- Pre-rendered video / image sprite sequence
- CSS 3D transforms (sprite planes)
- **NEW for F3-B:** SVG-based "stack of objects" with scroll-linked transforms (no WebGL at all)

A2. For each option above: bundle size · perf characteristics (especially when the canvas is offscreen during deep scroll) · hover/click interaction at narrow widths · the "thin hairline pure line flat 2D" art style fit at small render scale.

A3. Does the narrow column let us get away with a simpler renderer (SVG / CSS 3D) where F3-A needed real WebGL? Or does the tall column with scroll-linked transforms actually need MORE renderer capability?

A4. **Sticky column-specific:** when the column is sticky and the work-column scrolls past, what's the right render-loop behavior? Pause render during scroll (perf)? Drive render off scroll-y (interactive depth)? Both?

### B. Reference site technical decoding (column / sidebar heroes)

Visit each URL and document **what the site actually does technically** for sticky vertical hero columns specifically. Different reference set than F3-A — F3-A's references were horizontal-band sites; F3-B needs column-shape references.

B1. **Sticky-aside portfolio precedents** — find 6+ portfolio sites with a sticky vertical identity column (text or visual) running beside a scrolling work field. Decode rendering, scroll behavior, and how the column reacts (or doesn't) to work-column scroll position.

B2. **Editorial / magazine column heroes** — sites with sticky vertical illustration / scene columns. NYT, Pudding, Polygraph, Stripe, Linear long-form pages — find ones that use the column shape for hero content.

B3. **aninguyenle.com homepage column structure** (per F3-A.md §B1 finding) — the left column carries the cycling line-illustration. This is the closest direct precedent. Decode the column dimensions, the cycling state machine, and whether/how scroll affects it.

B4. **3D sidebar precedents** — sites where the 3D scene IS the column (rare). If none exist, document that absence — it informs whether F3-B is novel geometry like F3-A is.

B5. **Scroll-linked transform precedents** in narrow column contexts — sites where a sticky column element's state changes as the work column scrolls (object rotates, scene reorganizes, color shifts, etc.).

### C. 3D hero precedents in column / sidebar contexts

C1. Survey of 2026 portfolios with vertical-column 3D heroes (not full-bleed, not banded). Need ~6+ documented precedents with citations. Expected finding: thinner field than F3-A's set — column 3D is less common than full-bleed.

C2. **Critical question:** if no portfolio 3D-in-column precedent exists, F3-B is even more novel-geometry than F3-A. Document the absence carefully — that's a real research finding, not a gap to paper over.

C3. **Desk / workspace specifically in column form** — are there any precedents? If a desk concept has ever been compressed into a narrow column, what was lost/gained?

C4. **Comparison with F3-A's precedent set:** F3-A's closest references (Pokrzywa hotspot model + Carl Gordon banded layout) — neither maps to a sticky column. F3-B has to compose across DIFFERENT references.

### D. Interaction patterns (column-specific)

D1. **Hover patterns in narrow columns** — the F3-A hover set (scale, outline, halo, tooltip pop, cursor change) needs re-evaluation. Narrow column = fewer hit targets visible at once, smaller mesh footprint per object.

D2. **Click patterns in sticky columns** — when the column persists while work-column scrolls, the click target persists too. New affordance: object can be clicked from anywhere on the page (until standards take over scroll). Does this change which click action makes sense? Zoom-in might be off because the column position is fixed; modal/jump-out might be more natural.

D3. **The user's three control models from §5.3** revisited for column geometry:
- (a) Interactive orbit pick-one — does narrow column afford orbit? probably not — column is too narrow for camera path.
- (b) Click hotspots only — F3-A's choice. Need to re-evaluate for column scale: 9 hit targets in 280px column = ~31px per target — too dense.
- (c) Drag in given area — narrow column drag is constrained but possible (drag-to-rotate-scene as a whole).
- **NEW for F3-B:** scroll-linked (work-column scroll position drives column scene state). This is uniquely available to F3-B because the column is sticky.

D4. **Tooltip-cursor pattern from F3-A** — re-evaluate. Cursor often hovers over WORK column (cards) not hero column. Tooltip following cursor over a card may visually compete with the card's own hover state. Decode precedents for tooltip-cursor in sticky-aside contexts specifically.

D5. **Signature interaction for F3-B** — F3-A's signature was hover-tooltip-cursor. F3-B may want a different signature: scroll-driven object choreography (objects reorganize as work-column scrolls), or column-anchor-tooltip (tooltip anchors to object rather than cursor).

### E. Hero column vertical composition (independent of 3D)

E1. Real precedents of sticky vertical hero columns in portfolio sites. Document geometry, sticky offset, scroll behavior, vertical stack ordering inside the column (eyebrow / title / scene / footer-row).

E2. **The independent-containers invariant from F3-A.md K6 DOES NOT APPLY to F3-B.** Family B explicitly shares viewport between identity column and work cards. Re-articulate F3-B's own viewport-sharing invariant: what coexists, what doesn't, what the eye reads first.

E3. **The CardFitContext compact-mode interaction** — F3-A's compact mode assumed hero band scrolls out before card claims viewport. F3-B's hero column persists DURING card claiming viewport. What's the right `mediaHeight` math when the hero column is sticky-visible? Does compact mode even apply, or does it need a different feel for Family B?

E4. **Stack ordering inside the column:** eyebrow top → title → 3D scene → optional footer? Or 3D scene first → title overlaid? Or stacked sub-modules? Document precedents.

### F. Performance budgets (re-evaluated for narrower column)

F1. Core Web Vitals targets stay the same (LCP / INP / CLS). What changes for a narrow-column WebGL scene:
- Smaller canvas → less GPU pixel work → higher framerate ceiling
- But sticky-scroll means canvas stays mounted longer → memory pressure stays high
- LCP element: less likely the canvas (canvas is narrower so less visual weight) — likely a title or first work card

F2. **Triangle / texture budgets for narrow-column scene:** does the narrower viewport allow a higher-detail single object (because fewer objects fit), or does the constrained art-system still demand low-poly?

F3. **Render loop pause on offscreen scroll:** drei `<PerformanceMonitor>` can suspend render when canvas isn't in viewport. F3-B's sticky column IS in viewport for most of the page — but goes offscreen when standards section claims full height. Decode the pause/resume thresholds for sticky-aside contexts.

F4. **Asset preload mapping to F3-B:** F3-A's "first 1–2 seconds preload" applies to the hero-band-as-LCP-context. F3-B's hero column is LESS likely to be LCP (work column carries the LCP candidates). Does this change preload priority?

### G. A11y / reduced-motion / mobile fallback (column-specific)

G1. **`prefers-reduced-motion` for sticky-column heroes** — when reduced motion is set, does the column still sticky-pin? Or fall to natural-flow? Document the W3C / WCAG read on sticky + reduced motion.

G2. **Keyboard navigation in a sticky column** — tab order through column objects vs work-column cards. When the user tabs from column object to work card, focus jumps across geometric distance. UX implications.

G3. **Mobile fallback:** narrow column on desktop already approximates mobile width. On mobile, does the column become a full-bleed hero band at top (effectively becoming F3-A)? Or stay column-shaped and stack above cards? Decode patterns for sticky-aside collapse to mobile.

G4. **Kill switch for column-shape failure modes:** different from F3-A's failure modes — column overheating, column hijacking scroll, column blocking work-column reads.

### H. CS-hero continuity for F3-B (re-evaluated)

The F3-A.md §H analysis (morph / persist / no-continuity) needs full re-evaluation for F3-B. **The column geometry creates a natural persist affordance that F3-A doesn't have.**

H1. **Morph option re-evaluated:** column → case-study §01 hero. CSML M1 is a vertical stack — closer geometric fit with a column than with a horizontal band. Does this make morph more honest for F3-B than for F3-A? Cite shared-element / View Transitions / FLIP techniques specifically.

H2. **Persist option re-evaluated:** F3-B's sticky column COULD natively persist into case-study pages as a sticky side rail (same column geometry, different content). F3-A had to invent persist; F3-B might have persist built into its geometry. Decode the technical pattern and whether it competes with case-study's own content claim.

H3. **No-continuity option:** clean cut. F3-B can do this too but loses the geometric affordance.

H4. **F3-B specific continuity strength:** the column → case-study side rail handoff is a unique strength of Family B that no other layout family has. This may be the most honest answer for F3-B and is potentially a strong reason to prefer Family B over Family A at the homepage-final-lock step (per `gate-a-homepage-track-locked.md` — Family A vs B decision at end of Hero #8 narrowing).

### I. The 9 desk objects in column geometry — re-evaluate slate, priority, style

**This is where F3-B most clearly departs from F3-A.** The 9-object Seb slate was chosen for horizontal scatter; vertical column changes the question.

I1. **Object slate re-evaluation:** does column geometry change which objects belong? Vertical column may favor fewer, larger, more iconic objects rather than 9 small scattered ones. Or it may favor a vertical-priority stack (most identity-signaling object at top, supporting objects below). Re-derive the slate from F3-B's geometry, not from F3-A's slate.

I2. **Per-object priority ordering** — column has natural top-to-bottom read order. Which objects deserve top-of-column priority? Which fall to bottom or get cut?

I3. **Style mapping at narrow scale:** F3-A leaned toon-shaded + edge-line. Does that style READ at 280px column width? Or does the edge-line aesthetic actually shine MORE at small scale (where outlines clarify silhouettes that detail would muddy)? Evaluate.

I4. **Object scale relative to column:** narrow column = each object renders at smaller px size than F3-A. Hit target accessibility (WCAG SC 2.5.5 target size). Composition density.

I5. **GF alt-POV objects revisited for column:** GF list (lego · calendar · clock/timer · keyboard etc.) cross-checked again — may map better to column priority than to horizontal scatter.

### J. Page-entry intent for F3-B (re-evaluated from F3-A)

F3-A.md §J landed on: *"scattered authorship → focused work"* — the desk surfaces identity through scattered hover-discoverable objects; the featured card below surfaces work as focused composition.

F3-B inherits NEITHER half of that statement automatically. Re-derive ground-up.

J1. **Family B's geometry:** identity column persists alongside work cards. The intent shift is NOT "scatter → focus" (since they coexist); it's something else. Candidate statements:
- "Identity beside work" — column carries who, work column carries what, both visible simultaneously
- "Identity as anchor, work as field" — column is the orientation marker; work cards are the explored field
- "Sticky authorship through scroll" — identity persists as work changes

J2. **§10 framework re-trace** (Intent × Context = Behavior) — F3-A traced as "Pre-framing mode + establish-authorship-before-establishing-project + top-tier identity." F3-B's mode axis may be different (not pre-framing but co-framing).

J3. **Phase-2-v1 brand DNA trace** — "premium with handmade underlayer · cool on first read, warm on interaction." Does F3-B's sticky persistence read MORE warm than F3-A's band (because it stays with you), or LESS warm (because it's always-there ≠ surprising)?

J4. **North-star mantra trace** — "Structured enough to trust. Alive enough to feel authored." F3-B's sticky structure is high-trust-signal; the authored aliveness has to come from object choreography or interaction.

### K. Anti-drift — what F3-B must NOT do

K1. **Hero zone boundary** (per setup plan + cross-system-rules §14): F3-B must NOT become a navigation panel, a TOC, or a sticky CTA stack. It's a hero composition that PERSISTS as the page scrolls — but it's still a hero, not a chrome.

K2. **Rule-breaking composition** (per `feedback_rule_breaking_standard`): F3-B's "messy desk in a sticky column" must be composed messy through compositional tension, not actually-messy random arrangement. Each object placement intentional. Tilt ranges bounded.

K3. **North-star anti-list applied to F3-B:**
- "Cool but less clear" — column objects must be readable as identity-signal within 5 seconds
- "Expressive but ungoverned" — sticky-scroll choreography needs explicit bounds (no objects flying around)
- "Premium but lifeless" — sticky column risks reading "always-there" → boring; the hand-feel VARIANT may be more critical for F3-B than F3-A
- "Handmade but messy" — composed messy passes; actual mess fails
- "Experimental but unbounded" — scroll-linked choreography is the experimental risk; bound it
- "Dense and muddy" — narrow column + 9 objects = high density; this may be where F3-B's slate has to shrink
- "Obviously borrowed from someone else's portfolio language" — sticky-column 3D is uncommon; whatever we land on, it'll be distinctive
- "Interactive without purpose" — column interactions must resolve into meaning
- "Decorative before structural" — objects must structure identity, not decorate it

K4. **The "cool toys" trap** (from F3-A.md K4): same trap applies. Every column object must resolve into meaning on interaction — case-study route, about anchor, easter egg, external link.

K5. **Ground-up-per-layout invariant:** F3-B does NOT borrow F3-A conclusions. The 5 geometric facts at the top of this doc are F3-B's constraints; F3-A's compositional rules are NOT.

K6. **Viewport-sharing invariant** (replaces F3-A's K6 independent-containers): Family B's identity column and work cards SHARE viewport. F3-B compositions must NOT fight this — must NOT pin / overlay / takeover. The column claims its lane; the work column claims its lane.

K7. **Per-cell continuity addressability** (per setup plan item 6): F3-B must articulate its CS-hero continuity proposal. Section H above frames the choices; final pick lands in 8.1-B.2 composition proposal.

K8. **NEW for F3-B — no rotation drift:** F3-B compositions must not silently rotate / reflow F3-A's scatter into a vertical column. Reviewer test: ask whether the composition could have been derived independently from "9 objects in a sticky tall-narrow sticky column"; if the answer is "no, it's just F3-A rotated," it's drift.

---

## Research findings

*Populated as research streams return. Each finding cites the URL it came from. STOP after each section for user review before proceeding to next per `feedback_build_one_section_stop`.*

### A. Rendering technology decision findings

**Option matrix** (each evaluated against F3-B's brief: 280–320px wide sticky column · tall-as-viewport · coexists in viewport with scrolling work cards · ≤9 desk objects to consider · narrow column may favor fewer · render-loop must be cheap when standards scroll past the column):

| Option | Bundle / perf | F3-B fit | Verdict for F3-B default |
|---|---|---|---|
| **R3F + drei + `@14islands/r3f-scroll-rig`** | r3f-scroll-rig is the canonical pattern for syncing 3D meshes to scrolling DOM elements per [official npm package](https://www.npmjs.com/package/@14islands/r3f-scroll-rig). Calls `getBoundingClientRect()` once on mount + uses IntersectionObserver / ResizeObserver to track elements per [GitHub repo](https://github.com/14islands/r3f-scroll-rig). Ships `StickyScrollScene` component specifically for sticky elements per [Unpkg type defs](https://app.unpkg.com/@14islands/r3f-scroll-rig@8.13.1/files/dist/powerups/StickyScrollScene.d.ts). Uses Lenis (`@studio-freight/lenis`) internally for smooth scroll. | **Direct geometric fit.** StickyScrollScene is built for this exact case. Sync is on main thread but optimized via IO/RO. Hover/click + drei `<Html occlude>` tooltip pattern carries over from F3-A. | **Strong candidate** — and the only renderer with a dedicated sticky-element abstraction. |
| **R3F + drei (no scroll-rig) + `frameloop="demand"`** | `frameloop="demand"` renders only when scene graph changes via `invalidate` per [R3F Scaling Performance docs](https://r3f.docs.pmnd.rs/advanced/scaling-performance). drei + react-spring call invalidate automatically per [R3F discussion #1701](https://github.com/pmndrs/react-three-fiber/discussions/1701). | Sticky column with mostly-static scene → perfect for demand. But you lose r3f-scroll-rig's DOM↔WebGL sync helpers; manual scroll-listening if you want scroll-linked state. | **Strong runner-up** if scroll-driven choreography is rejected and the scene is mostly static (hover/click only). Lighter than scroll-rig. |
| **R3F + drei + `useInView` (react-use) + frame-pause pattern** | Canonical pause pattern per [R3F discussion #769](https://github.com/pmndrs/react-three-fiber/discussions/769): `const DisableRender = () => useFrame(() => null, 1000)` + `{!inView && <DisableRender />}`. | Useful when column scrolls fully out (deep in standards). But F3-B's sticky column is in view for most of the page; pause-on-offscreen only kicks in late. Less leverage than for F3-A. | **Companion to either of the above** — not a primary pick; layer on. |
| **`@react-three/offscreen` (OffscreenCanvas in Web Worker)** | Per [npm package](https://www.npmjs.com/package/@react-three/offscreen) + [GitHub repo](https://github.com/pmndrs/react-three-offscreen) — moves R3F render to a Web Worker via OffscreenCanvas. 2026 production case (avatar models, Krapton) saw FPS rise from 45–55 → consistent 60 with OffscreenCanvas per [Krapton 2026 deep dive](https://www.krapton.com/blog/boosting-react-three-fiber-mobile-performance-in-2026-a-deep-dive-d6105c). | F3-B's sticky column needs continuous (or near-continuous) render attention; offloading to worker means main thread stays free for scroll + card interaction. **Better for F3-B than F3-A** because F3-A's band scrolls out quickly. | **Worth A/B against the StickyScrollScene approach.** Defer-ship if integration cost is high; consider for Phase 2/3 if perf becomes an issue. |
| **Native Three.js (no React)** | Smallest bundle if page IS the scene; loses JSX co-location + drei tooltip helpers. Codrops 2026 portfolios still vanilla for pure-3D pages. | F3-B is a column INSIDE a DOM-heavy lab + production page. JSX co-location wins. | **Skip.** Same verdict as F3-A. |
| **Spline embed** | Heavier abstraction wrapping Three.js. Auto Zoom for responsive sizing per [Jack Redley responsive guide](https://www.jackredley.design/articles/how-to-make-3d-models-fully-responsive-for-web-mobile-spline-tool). Sticky requires custom CSS track height (`100vh` + buffer) per [Flowsuggest tutorial](https://www.flowsuggest.com/tutorials/create-captivating-3d-scroll-interaction-using-webflow-and-spline-step-by-step-guide/). Performance: <3 embeds per page, lazy-load via spline-viewer, <3 lights per scene per [Spline optimization docs](https://docs.spline.design/doc/how-to-optimize-your-scene/doczPMIye7Ko). | Tooltip-cursor + DOM overlay still has to live OUTSIDE Spline (same problem as F3-A §A). Spline's State+Event system COULD drive scroll-linked transforms but it's a black box. | **Skip for default.** Useful as a prototype path only; signature interaction lives outside it. |
| **CSS 3D transforms (sprite planes, tilted in 3D space)** | Lightest by far. Browser-native hover/click/a11y. No WebGL surface area. Sticky behavior is also CSS-native (just `position: sticky`). | 9 sprite planes in a narrow column = legitimate. Loses real orbit + shadow casting + normal lighting. **Stays line-flat → on-brand with art system §3.7's "depth reserved for 3D modules" carve-out.** Sticky behavior maps onto CSS sticky directly — no JS coordination. | **Strong dark-horse candidate** for F3-B specifically. Possibly STRONGER fit for F3-B than F3-A because column scale + CSS sticky pair so naturally. Worth A/B against R3F+StickyScrollScene. |
| **Pre-rendered video / image sprite sequence** | Frame-index-driven canvas (Apple pattern). | Hover-discoverability dies. Same verdict as F3-A. | **Skip.** |
| **NEW for F3-B: SVG + GSAP ScrollTrigger** | Proven pattern for scroll-linked vertical SVG. ScrollTrigger with `scrub: 1` ties `yPercent` and rotation directly to scrollbar per [Codrops 2026-03 tutorial](https://tympanus.net/codrops/2026/03/11/svg-mask-transitions-on-scroll-with-gsap-and-scrolltrigger/). Pinning + timeline-scrub pattern documented in [Codrops 2026-05 SVG map animations](https://tympanus.net/codrops/2026/05/21/creating-scroll-driven-svg-map-animations-with-gsap/). No WebGL. | **For a 2.5D / illustrated-line F3-B variant**, SVG + GSAP ScrollTrigger gives scroll-driven choreography without R3F. Works exceptionally well at column scale. But: no real 3D depth, no normals lighting, no shadow. **If we conclude F3-B should NOT be true 3D, this is the answer.** | **Strong candidate IF we decide F3-B is line-flat 2.5D illustration** rather than 3D. Question lands in §I (object style) not here. |

**Critical re-evaluation: should F3-B even be 3D?**

F3-A.md §A concluded F3-A should be 3D (R3F + drei or CSS 3D). The question is open again for F3-B. The narrow column geometry + the art-system rule "depth reserved for 3D modules" + the sticky-scroll choreography opportunity all push different directions:

- **Pro-3D for F3-B:** unifies F3-A and F3-B as the "Desk family" — both use the same desk objects in the same rendering style; switching layout family doesn't switch art family.
- **Anti-3D for F3-B:** narrow column reads as "decorative column ornament" if it's 3D — risk of "cool toys" trap (per F3-A.md K4) is HIGHER in a column than in a band because the column persists in view. A 2.5D scroll-driven illustration may feel more like an authored object and less like a toy.

**Land for 8.1-B.2 — DECISION 2026-05-29 (user):** BOTH paths build as sibling F3-B variants — not either/or:

- **F3-B Path 1 — `f3-b-3d`**: R3F + drei + r3f-scroll-rig StickyScrollScene · true 3D · shared rendering style with F3-A · geometric column fit · uses the same per-object Blender/Tripo/Meshy pipeline from F3-A.md §L.
- **F3-B Path 2 — `f3-b-2d`**: SVG + GSAP ScrollTrigger scroll-linked column illustration · line-flat 2.5D · scroll-choreographed · uses **vector asset pipeline distinct from the 3D pipeline**.

Both ship as toggle-able variants within the F3-B cell at 8.1-B.4 build (similar to how F3-A's §I1 carried toon-shaded vs CSS 3D sprite as a sub-pick — but in F3-B's case both are full directions, not stylization variants). User picks production direction after both walk under the lab's narrow-4 chrome.

**F3-B Path 2 vector asset pipeline (user direction 2026-05-29):**

For the line-flat / SVG illustration variant, vector asset generation runs through:
- **Quiver** (per `portfolio-style-art-voice-source.md` §3.7 watchlist) — fast vector ideation
- **Gemini** — image-2 / vector-aware generations
- **ChatGPT image 2** — strong at clean vector style + line work

These are the tools the user has already validated for vector / line illustration output. They do NOT replace the 3D pipeline (Tripo / Meshy / Blender from F3-A.md §L) — they run in parallel for Path 2 only. The two paths feed two different rendering targets and use two different asset toolchains. See [[reference-vector-asset-tools]] for the broader vector-tool reference.

**Sticky column render-loop behavior decision (A4):**

The render loop must be cheap while standards scroll past the column. Three real options to combine:

1. **`frameloop="demand"`** (R3F docs cited above) — render only when scene changes. Default for static-with-hover.
2. **`useInView` + `useFrame(() => null, 1000)` pause** (R3F #769 cited above) — hard pause when column fully offscreen.
3. **StickyScrollScene's IO/RO tracking** (r3f-scroll-rig cited above) — built-in scroll-linked + sticky-aware.

**Recommended composition** (regardless of renderer pick): `frameloop="demand"` as the base + `useInView` pause when offscreen + scroll-driven invalidation if scroll-linked choreography is part of the composition. Mirrors the same defense-in-depth ladder F3-A landed on in its §G4 kill-switch.

Cross-cutting constraints (all options):
- Pixel ratio clamp `Math.min(devicePixelRatio, 2)` (carries from F3-A.md §A).
- Skip post-processing on column hero (carries from F3-A.md §A).
- Bake all lighting; disable `matrixAutoUpdate` on static objects (carries from F3-A.md §A).
- Sticky column-specific: column's render loop pauses when canvas fully offscreen via `useInView`. Layer `frameloop="demand"` underneath.

### B. Reference site technical decoding findings

**Methodology note** (same caveat as F3-A.md §B): WebFetch's markdown extractor strips `<head>`, scripts, and inline JS — direct script-tag inspection wasn't possible. Findings combine framework signatures that survive the extractor, third-party catalogues, agency-published case studies, and the F3-A.md aninguyenle.com recording-verified finding.

**B1. aninguyenle.com — RECORDING-VERIFIED 2026-05-29 (Sebs walkthrough, finding lifted from F3-A.md §B1).** Closest direct precedent for F3-B. Decoded behavior:

- **Homepage hero**: structured editorial layout. **Left column** = name + bio + a **small hand-drawn line-illustration of Ani that cycles between poses** (standing → drawing → with glasses). Either hover-triggered or auto-cycling on a timer. Right column = project tiles.
- The left column has the geometric shape F3-B is composing against — narrow, tall, identity-bearing, line-illustration aesthetic. **This is the closest live-precedent the research surfaced for F3-B Path 2 (SVG / line-flat column).**
- F3-B Path 1 (3D in column) has NO direct analog in the aninguyenle reference; the column hosts a cycling illustration, not a 3D scene.
- Framework: Framer.
- **Application:** F3-B Path 2's default lean should reference the aninguyenle pattern (small line illustration anchoring identity); F3-B Path 1 is geometrically NEW (no precedent in F3-A.md's research bank nor in B's research bank).

Sources: F3-A.md §B1 recording-verified finding 2026-05-29 · [aninguyenle.com](https://aninguyenle.com/) · [aninguyenle.framer.website](https://aninguyenle.framer.website/) (Framer origin signature).

**B2. The Pudding — CSS position:sticky scrollytelling pattern (CANONICAL editorial precedent).** Per [Pudding's process article on scrollytelling-sticky](https://pudding.cool/process/scrollytelling-sticky/):

- **Sticky graphic + scrolling steps** is The Pudding's published pattern. The graphic stays "stuck" while steps scroll past in an adjacent or below column. This is F3-B's geometric pattern verbatim — column on one side, scrollable content on the other.
- **JavaScript's role is minimal**: "the sticky graphic is entirely handled by CSS, while the only thing done in JavaScript is handling the step triggers."
- **Parent-bounded sticky** is the load-bearing technique: "a sticky element is always relatively positioned to its parent" — the column sticks only "within the bounds of its parent element." Maps directly to Family B's `position: sticky; top: 32px; align-self: start` in `IdentityAside` scaffolding.
- **No scroll listener required.** Prevents jumping-into-place perf issues that scroll-listener implementations suffer.
- **F3-B Path 2 inherits this pattern wholesale.** Column = the sticky graphic; work column = the scrolling steps. The scroll-driven illustration choreography from §A's GSAP ScrollTrigger pattern composes ON TOP of Pudding's sticky+steps base.

**B3. Scrollama.js (lightweight library for step triggers).** Per [Pudding's introducing-scrollama](https://pudding.cool/process/introducing-scrollama/):

- Modern JS library for scrollytelling using **IntersectionObserver in favor of scroll events**. Provides convenience functions for the sticky-graphic + scrolling-steps pattern.
- **F3-B implication**: if scroll-driven choreography is needed in the column (e.g., desk objects reorganize as work column scrolls past), Scrollama gives the step-trigger API without needing GSAP. **Scrollama vs GSAP ScrollTrigger**: Scrollama is lighter (IntersectionObserver only); GSAP ScrollTrigger gives richer timeline scrubbing. Pick lands at 8.1-B.2 composition based on whether F3-B needs simple step changes (Scrollama) or scrub-blended transitions (GSAP).

**B4. NYT "Snowfall" (2012) — origin of scrollytelling genre.** Per [shorthand.com scrollytelling examples](https://shorthand.com/the-craft/scrollytelling-examples/index.html) + general consensus. **Not column-specific** — Snowfall is full-bleed. Cited only as the genre's origin point; not a direct geometric precedent for F3-B.

**B5. Portfolio sticky-aside precedents — survey.** Per [Navbar Gallery sidebar examples 2026](https://www.navbar.gallery/blog/best-side-bar-navigation-menu-design-examples) + [Crocoblock sidebar designs](https://crocoblock.com/blog/wordpress-sidebar-navigation-menu-examples/) + [VictorFlow Framer sidebar templates](https://www.victorflow.com/blog/best-sidebar-framer-templates):

- **Shapeshyft** — sticky sidebar project text per [One Page Love feature](https://onepagelove.com/shapeshyft-2026). Pattern: persistent project context as user scrolls work. Closer to "sticky CHROME" than "sticky HERO COMPOSITION."
- **Paul Hanaoka** — two-part sidebar layout separating primary navigation from secondary controls. Chrome pattern, not hero.
- **La Playa** — two-column grid + sticky right sidebar with drop-down info reveal. Chrome.
- **Robin Spielmann** — sidebar enhances navigation, theme toggles (blue/light/dark). Chrome.

**Critical finding**: the surveyed portfolio sticky-asides treat the column as **navigation chrome** (nav, theme, info), NOT as **identity-bearing hero composition**. F3-B's brief — sticky column AS hero — has thin portfolio precedent. The aninguyenle homepage is the closest, but its column carries cycling line illustration not a fully-composed hero scene.

**B6. 3D-in-sidebar precedents — CRITICAL ABSENCE FINDING.** Search across [creativedevjobs Three.js portfolios 2026](https://www.creativedevjobs.com/blog/best-threejs-portfolio-examples-2025) + [Three.js forum showcase](https://discourse.threejs.org/t/my-personal-portfolio-website-3d-room/63822) + [Really Good Designs interactive portfolios](https://reallygooddesigns.com/interactive-portfolio-examples/) (cited in F3-A.md §C):

- Scroll-driven 3D portfolios documented: **Aimee's Papercraft World**, **JReyes MC**, **Jordan Breton's floating island**, **Bruno Simon**, **Diya Basu's Desk Tour**, **Chris Pokrzywa**. All **full-bleed**, not column-shape.
- **No documented portfolio precedent for a 3D scene running INSIDE a sticky vertical column.** This is consistent with F3-A.md §C's finding that the F3-A geometry (horizontal hero band + explorable 3D desk) was also novel.
- **F3-B Path 1 (3D sticky column) is inventing geometry — same novelty class as F3-A.** Document the absence: this is a real research finding, not a gap.

**B7. Scroll-linked transforms in narrow columns — pattern documented.** Per [Codrops 2026-05 Reactive Depth scroll-driven 3D image tube](https://tympanus.net/codrops/2026/02/17/reactive-depth-building-a-scroll-driven-3d-image-tube-with-react-three-fiber/) + [r3f-scroll-rig GitHub](https://github.com/14islands/r3f-scroll-rig):

- The 14islands `r3f-scroll-rig` `ScrollScene` / `StickyScrollScene` pattern (cited Section A) is the canonical R3F-side implementation of the Pudding sticky+steps pattern.
- F3-B Path 1 maps cleanly: `StickyScrollScene` for the column + standard DOM cards in the work column. The IO/RO tracking handles position sync without scroll-listener perf issues.

**Aggregate steals into F3-B composition palette:**

- **Path 2 base architecture** = Pudding sticky+steps CSS pattern (B2) + Scrollama OR GSAP ScrollTrigger for step triggers (B3 + Section A)
- **Path 2 default illustration register** = aninguyenle cycling line illustration (B1) — small, identity-bearing, hover/timer cycles
- **Path 1 base architecture** = r3f-scroll-rig `StickyScrollScene` (B7) on top of the same Family B sticky column geometry
- **Path 1 acknowledged novelty** = no portfolio precedent for 3D-in-sticky-column (B6). Composition has to be justified ground-up, not borrowed.
- **De-prioritize**: NYT Snowfall (B4 — wrong geometry, cited for genre origin only) + portfolio sticky-aside nav patterns (B5 — wrong intent, those are chrome).

**KEY FINDING — F3-B Path 1 inherits F3-A's novelty problem.** F3-A.md §C concluded F3-A "is inventing geometry" because no documented precedent exists for a horizontal hero band + fully-explorable 3D desk. F3-B Path 1 is in the same boat — no documented portfolio precedent for a 3D scene in a sticky vertical column. F3-B Path 2 has cleaner precedent (Pudding sticky + aninguyenle column illustration). **This may be a reason to prefer Path 2 as production-pick after the lab walk, but the call doesn't get made here — composition pass decides.**

### C. 3D hero precedents in column / sidebar contexts findings

**Status note**: §B6 already documented the critical finding — **no portfolio precedent exists for a 3D scene running INSIDE a sticky vertical column**. This section derives the constraints F3-B Path 1 navigates ground-up, since there's no precedent set to borrow from.

**CRITICAL FRAMING CORRECTION 2026-05-29 (user-issued):** earlier drafts of §C treated F3-B Path 1 as "F3-A's 9-object horizontal scatter, packed/rotated into the column." That was mechanical-carry drift in violation of K5 + K8 + the ground-up invariant at the top of this doc. **F3-B Path 1 is NOT F3-A's desk-scatter concept reshaped.** It's the F3 (Desk / Workbench) family expressed natively in vertical-column geometry — which can be any real-world / cultural form that pairs F-family meaning with column shape: pegboard, tool wall, mounted shelf, side-profile workbench, trophy wall, vertical tool reel, etc. The 9-object slate is F3-A's specific expression; F3-B gets its own ground-up concept + slate. See `feedback_ground_up_means_concept_not_just_layout` memory.

Sections C3, C4, C5 (camera, arrangement, slate ceiling) below are REWRITTEN against the corrected framing. C1–C2 (precedent survey + novelty acknowledgement) stand.

**C1. The 12 precedents F3-A.md §C documented — REVISITED for column applicability.**

| Precedent (cited in F3-A.md §C) | Geometry | F3-B applicability |
|---|---|---|
| **Bruno Simon** ([case study](https://medium.com/@bruno_simon/bruno-simon-portfolio-case-study-960402cc259b)) | Full-bleed | Not applicable — full-bleed orbit-around-car doesn't compress to column |
| **Jesse Zhou — Ramen** ([Awwwards](https://www.awwwards.com/sites/jesses-ramen-portfolio)) | Full-bleed isometric | Isometric camera *would* compose into column shape (see C3 below), but Jesse's ramen scene fills the page |
| **Diya Basu — Desk Tour** ([case study](https://medium.com/@diya.basu73/react-three-fiber-3d-portfolio-case-study-6e1fbd9e6dcb)) | Full-bleed | Closest subject (desk) but wrong geometry |
| **Chris Pokrzywa** ([chrispokey.com](https://chrispokey.com/)) | Full-bleed home-office | Closest subject + click-hotspots model — but full-bleed |
| **Carl Gordon** ([carlgordonmedia.com](https://www.carlgordonmedia.com/)) | Horizontal band | F3-A precedent, not F3-B |
| **Jordan Breton** orbit island | Full-bleed | Not applicable |
| **Ameen Abdullah** WebGPU sakura | Full-bleed | Not applicable |
| **JReyes MC** Minecraft | Full-bleed | Not applicable |
| **Jesse Martinez** draggable cubes | Banded | F3-A precedent |
| **Pierre Nel / Max Milkin / André Souza / Maxime Guillon** | Full-bleed / banded variants | Not applicable |
| **Bastian Gasser** banded type-hero | Banded | F3-A precedent |
| **Justine Soulié** WebGPU showcase | Full-bleed | Not applicable |

**12 of 12 precedents from F3-A.md §C are non-applicable to F3-B Path 1.** This is the empirical underpinning of B6's absence finding — the column shape isn't just rare in the surveyed bank, it's absent.

**C2. Why this matters more than F3-A's novelty.**

F3-A.md §C concluded F3-A "is inventing geometry" by composing across Pokrzywa's hotspot model + Carl Gordon's banded layout. **F3-B Path 1 has no equivalent compose-across candidates** — there's no analogue to Pokrzywa's hotspot model in column form, and no analogue to Carl Gordon's banded layout in column form. F3-B Path 1's composition has to be derived from first principles + the geometric facts at the top of this doc + WHAT F3-B Path 2 (Pudding + aninguyenle) does well — extrapolated into 3D rather than borrowed.

**This is a stronger anti-drift signal for Path 1**: if there's no precedent to compose-across, the temptation to silently rotate F3-A's scatter into a vertical stack is even higher. K8 (no-rotation-drift reviewer test) becomes load-bearing.

**C3. Candidate ground-up F-family expressions for F3-B Path 1 (REWRITTEN against the framing correction).**

F3 = Desk / Workbench abstractly. Real-world / cultural forms that pair the F-family meaning with a NATIVE vertical-column shape — none of these are F3-A's desk scatter reshaped:

| Candidate concept | What it is | Why it pairs with column natively | Camera implication |
|---|---|---|---|
| **Vertical pegboard / tool wall** | Wall-mounted tools, slotted into pegs. Each tool = an interactive hit target. | Pegboards ARE vertically-oriented workspaces in reality (workshop walls, kitchen tool walls). Column geometry maps to the pegboard's natural shape. | Flat eye-level perspective looking at the wall. No orbit needed. |
| **Vertical display shelf** | Shelves stacked vertically, each shelf holds 1–2 objects. Curio-cabinet feel. | Shelves ARE vertically-stacked structures. Column = a cross-section of the shelf unit. | Slight perspective looking into shelves; can show depth on each shelf. |
| **Workbench seen edge-on (side profile)** | Desk rotated 90° in scene-space — viewer sees the side of the desk, top surface running vertically through the column with objects sitting on it. | Same desk concept as F3-A but viewed from a fundamentally different camera. Items still rest on the desk surface; they just appear in vertical order to the column-shape viewer. | Side-on perspective. Depth into scene = the desk's far edge. |
| **Trophy wall / mounted display** | Wall of pinned/mounted identity objects — framed sketches, running pin, polaroids, flag, letter pinned up. | Trophy walls / pinboards ARE column-friendly vertical surfaces. The "workspace" register holds. | Flat eye-level on the wall. Items are pinned/affixed, not free-standing. |
| **Vertical tool reel / scroll-revealed objects** | Items revealed as user scrolls — like a vertical Rolodex of identity objects. Sticky column + scroll-linked R3F scene change. | Uses F3-B's UNIQUE scroll-linked affordance natively. Each scroll position = a different visible object. | Camera fixed; objects animate in/out as scrollY changes. |
| **Climbing wall / object ladder** | Objects positioned on a vertical surface like climbing holds — project history climbing up. | Climbing walls ARE vertical workspaces (training walls). Workshop-adjacent. | Flat eye-level on the wall. |
| **Floating canvas / no surface (user-added 2026-05-29)** | NO table / NO wall / NO shelf. Objects float freely in the column space (or appear on an abstract background added later). User-direction option: *"as if the items are on a moveable 3d canvas where we can move them around"* — implies drag-and-place affordance, freeform composition, user-arrangeable. | Most permissive form — surface-agnostic. Lets the concept be PURE object scatter without committing to a workspace metaphor. Pairs with scroll-linked or drag interaction natively. | No camera anchor needed (free positioning); can use any camera; could even use 2D translation only (CSS) for Path 2. |

Each candidate is a legit F3-family expression that the column geometry asks for natively. **No "F3-A scatter rotated" interpretation appears in this list deliberately.** Composition pass (8.1-B.2) picks among these; this section's job is to surface the concept space ground-up.

**Camera implication:** the camera question depends on the concept. The earlier "orthographic isometric vs top-down vs eye-level" matrix only made sense when the unstated assumption was "F3-A's desk scatter in some form." With ground-up concepts, the camera is downstream of concept choice:
- Pegboard / trophy wall / climbing wall → flat eye-level perspective
- Display shelf → slight perspective with shelf depth read
- Side-profile workbench → side-on perspective
- Tool reel → fixed camera, scroll-driven object Y position

Pick concept first; camera follows.

**C4. Object arrangement constraint — vertical stack is the answer for ALL candidate concepts (REWRITTEN).**

User-issued 2026-05-29: F3-B is a VERTICAL reading space — items go top-to-bottom one under another, not scattered across width. This is geometric ground truth and applies to every candidate concept above.

- ✗ Horizontal scatter packing — **rejected**, wrong axis entirely
- ✗ Top-down floor plane (orthographic from above) — **rejected**, that's a wide horizontal floor; column is vertical
- ✗ Scatter-from-above with scroll-driven camera-y reveal — **rejected**, same wrong-axis problem
- ✓ **Vertical stack of items, top-to-bottom**, in whatever concept-native form the C3 candidate dictates (pegboard slots, shelf rows, wall positions, reel ticks, etc.)

Slot count = how many rows fit at the chosen row register. At ~80–100px per row, ~6–7 slots. At ~120–150px per row, ~4–5 slots. The art-system row register decides — picks at 8.1-B.2 composition.

**C5. Hit-target sizing — WCAG concern eliminated by vertical-stack form (REWRITTEN).**

Earlier draft of C5 misapplied WCAG by assuming horizontal packing (mathematical error walked back in chat 2026-05-29). With vertical-stack form, each item has the FULL column width (~280px) as its horizontal hit-target footprint and ~80–150px vertical — comfortably above WCAG 2.5.5 AAA (44×44) and 2.5.8 AA (24×24) for any slot count up to ~6–7 rows. Standard invisible-hit-volume padding (the drei pattern F3-A.md §C cited) gives further forgiveness as needed.

**WCAG ceases to be a constraint on F3-B Path 1's slate count.** Slate size is now driven by:
- Reading-rhythm at the chosen row register
- Whether each item earns a slot (per-object meaning per K4 anti-drift)
- Composition cohesion (4 strong slots may read better than 7 mediocre slots)

These are composition decisions for 8.1-B.2, not research-pass ceilings.

**C6. Final constraint list for F3-B Path 1 (REWRITTEN).**

Synthesizing C1–C5 against corrected framing:

1. **No portfolio precedent for 3D-in-sticky-column** — composition is ground-up, not compose-across (C1, C2)
2. **Concept space is open** — 6 candidate ground-up forms identified (pegboard / shelf / side-profile / trophy wall / tool reel / climbing wall); composition pass picks (C3)
3. **Arrangement: vertical stack, top-to-bottom** — geometric ground truth (C4)
4. **Camera follows concept** — pegboard/wall/trophy/climbing → flat eye-level; shelf → slight depth; side-profile → side-on; tool reel → fixed + scroll-driven (C3)
5. **Slate count is a composition decision**, not a research-pass ceiling — driven by row register + reading rhythm + per-object meaning (C5)
6. **Sticky column + scroll-linked behavior is a uniquely available F3-B affordance** — particularly load-bearing for the tool-reel concept; available as enhancement for all others (C3)
7. **Hit-test forgiveness via invisible padding** carries from F3-A.md §C as standard practice (C5)
8. **Coexistence with work cards** — hover state on column item shouldn't visually compete with hover on adjacent card; treatment quieter than F3-A's full-bleed band hover (carries from earlier draft)

**KEY FINDING — F3-B Path 1's concept space is open, not constrained.** Six legit ground-up concepts identified. Composition pass (8.1-B.2) picks among them based on which concept best expresses F3-family identity in vertical-column form. No slate ceilings to fight; geometry + concept-native form do the slate sizing naturally.

**Path 2 (vector / SVG) status unchanged:** Path 2's row-stack structure is also vertical-stack-native (each row = one illustration), so the corrected framing doesn't disturb Path 2's bearing. Path 2 inherits the same concept-space breadth (pegboard / shelf / trophy wall could all be illustrated rather than 3D-rendered) — picks at 8.1-B.2.

### D. Interaction patterns findings

**Framing**: each of the 6 candidate concepts from §C3 has its own native interaction signature. Generic "scale on hover + tooltip pop" (F3-A's pattern) is the wrong default — F3-A's interaction was tuned for an objects-on-a-desk scatter; F3-B's interaction has to be tuned for whichever concept lands. This section documents the interaction signatures per concept + the cross-cutting choices that apply to all.

**D1. Cross-cutting interaction question: tooltip strategy when cursor often leaves the column.**

F3-A.md §D landed on a DOM cursor-following tooltip with spring lag. That choice assumed cursor stayed within the hero band most of the time. **F3-B breaks that assumption** — the cursor moves freely between the sticky identity column and the scrolling work column. A cursor-following tooltip would visually compete with hover state on work cards every time cursor crossed into the work column.

Three real strategies:

| Strategy | Implementation | F3-B fit |
|---|---|---|
| **Cursor-following (F3-A pattern)** | DOM tooltip listens to mousemove, lerps toward cursor. Per [Material UI Tooltip `followCursor`](https://mui.com/material-ui/react-tooltip/). | **Reject** — tooltip following cursor over work cards is visual noise on top of card hover states |
| **Row-anchored** | Tooltip attaches to the row of the hovered item, appears to the LEFT or RIGHT of the column (in the gutter or floating beside it). Per [UX Patterns Tooltip pattern](https://uxpatterns.dev/patterns/content-management/tooltip) + [shadcn/ui Sidebar tooltip pattern](https://ui.shadcn.com/docs/components/radix/sidebar) — anchored to the icon-tab in a collapsed sidebar. | **Strong fit** — tooltip stays in the column's gutter, doesn't compete with work card hovers. Max-width 200–250 px per [Setproduct tooltip best practices](https://www.setproduct.com/blog/tooltip-ui-design). |
| **Row-expansion** | Hovered row expands inline to show the tooltip content within the column itself. Sidebar-hover-expand pattern. Per [GeeksforGeeks expand sidebar on hover](https://www.geeksforgeeks.org/css/how-to-expand-sidebar-on-hover-in-css/) + [9cv9 hover-triggered expandable sidebar tutorial](https://medium.com/@9cv9official/create-a-beautiful-hover-triggered-expandable-sidebar-with-simple-html-css-and-javascript-9f5f80a908d1). | **Strongest fit IF column width allows expansion**. Eliminates separate tooltip surface — the row IS the tooltip. Coexists cleanly with work cards because nothing leaves the column. |

**Lean for F3-B default tooltip strategy: row-expansion** (with row-anchored as fallback if column geometry doesn't allow expansion). Eliminates the cursor-over-work-card competition risk entirely. Specific implementation depends on concept choice — pegboard expansion shows the tool's spec card; shelf expansion shows the object's story; trophy wall expansion shows the pin's note.

**D2. Cross-cutting interaction question: scroll-linked choreography as a NEW interaction class.**

Per [Scrollama README](https://github.com/russellsamora/scrollama) + [Pudding's Scrollama introduction](https://pudding.cool/process/introducing-scrollama/) + [Metadrop's Scrollama guide](https://metadrop.net/en/articles/scrollytelling-using-scrollamajs-css-and-best-practices): Scrollama gives three features — **Step triggers** (fires when element crosses threshold), **Step progress** (0–100% completion, for scrub), **Sticky graphic** (canonical sticky+steps pattern).

F3-B's sticky column + scrolling work column = the canonical Scrollama setup. Three real choreography ladders:

| Ladder | Implementation | F3-B fit |
|---|---|---|
| **No scroll choreography** | Items static; hover/click only | Floor option — always available |
| **Cascade-reveal on enter** | Each row stagger-fades in via IntersectionObserver as the user scrolls the page in. Per [FreeCodeCamp scroll animations with IntersectionObserver](https://www.freecodecamp.org/news/scroll-animations-with-javascript-intersection-observer-api/) + [Medium · animate on scroll with IO](https://medium.com/@cgustin/animate-on-scroll-with-the-intersection-observer-api-ad368d91ebab) — `setTimeout` with incrementing delay (100ms stagger) creates row-by-row reveal. | Light touch; entrance ceremony only; doesn't react to ongoing scroll | Default for most concepts (pegboard/shelf/trophy/climbing wall). |
| **Step-driven object swap (Scrollama)** | Work-column scroll steps trigger column object state changes. Step triggers = discrete object swap; Step progress = scrub-blended morph. | **Required for the Tool Reel concept** — scroll IS the interaction. Useful enhancement for Side-Profile Workbench (camera Y-pan as scroll). Optional flourish for others. |

**Lean for F3-B default scroll behavior: Cascade-reveal on entrance** (Ladder 2) for any concept; **upgrade to Step-driven for Tool Reel concept**.

**D3. Per-concept native interaction signatures.**

| C3 concept | Hover signature (D1 row-expand + concept-native cue) | Click signature | Scroll-linked behavior (D2) |
|---|---|---|---|
| **Vertical pegboard** | Tool slot highlights (peg glows); tool sits forward slightly. Row expands rightward into work-column gutter showing tool spec card. | Tool "lifts off peg" with slight bounce → opens link / case study. Alternative: drag-tool-off-peg interaction (delight; gated behind `prefers-reduced-motion`). | Cascade-reveal entrance: tools snap into pegs row-by-row. |
| **Vertical display shelf** | Object pulls forward on its shelf slightly; row glows. Expansion shows the object's story / context. | Object pulls out of shelf → modal / case study route. Returns to shelf on close. | Cascade-reveal entrance: shelves slide into view; objects place onto shelves. |
| **Workbench seen edge-on (side profile)** | Object silhouette highlights (edge-line thickens); slight depth-shift toward viewer. Expansion shows object's role. | Camera rotates to look down at the object from above → modal or link. (Click is camera-state change, not modal jump-cut.) | Cascade-reveal entrance: desk fades in left-to-right; objects place on top. Optional: scroll-Y pans camera along desk length. |
| **Trophy wall / mounted display** | Pin "loosens" — small jitter / tilt animation; row glows. Expansion shows the pin's note (handwritten caption, dated). | "Take down off wall" → modal showing the artifact in detail; closes returning it to the wall. | Cascade-reveal entrance: pins arrive one-by-one with a stamp / pin-press sound (silent default, opt-in audio). |
| **Vertical tool reel** | Hover PAUSES the reel rotation; centers the focused tool; expansion shows tool spec. | Tool spins out of the reel into focused view → modal / case study. | **Scroll-driven — load-bearing.** Work-column scroll position drives reel rotation; each scroll-step ticks the reel one item. Step progress (Scrollama) for scrub-blended rotation. |
| **Climbing wall / object ladder** | Hold "grips" — small tighten animation; row glows. Expansion shows what the hold represents (project phase, year). | Hold pops out → opens project. Holds remain visible on the wall as a climbing path. | Cascade-reveal entrance: holds drill into wall bottom-up (building the climbing path). |

**D4. The user's three F3-A control models revisited for F3-B (per §5.3).**

F3-A.md §D evaluated three control models — (a) Interactive orbit, (b) Click hotspots only, (c) Drag in given area. F3-B re-evaluates each for vertical stack:

| Model | F3-B re-evaluation |
|---|---|
| **(a) Interactive orbit pick-one** | Vertical stack has no orbit affordance — each row is its own slot. **Reject** for all concepts except Side-Profile Workbench, where camera rotation could be the click action (D3 row 3). |
| **(b) Click hotspots only** | **Default fit** for pegboard / shelf / trophy / climbing concepts. Same as F3-A.md §D's lean. |
| **(c) Drag in given area** | Drag-tool-off-peg / drag-object-off-shelf is a delight option per concept (D3 hover signatures cite this). NOT the primary interaction; opt-in enhancement; gated by `prefers-reduced-motion`. |
| **(NEW for F3-B) (d) Scroll-driven** | **Load-bearing for Tool Reel concept** (D3 row 5). Optional enhancement for Side-Profile Workbench (camera-Y pan). Not applicable to flat-wall concepts (pegboard / trophy / climbing). |

**D5. Signature interaction for F3-B (the equivalent of F3-A's cursor-tooltip signature).**

F3-A's signature interaction was: hover-tooltip-cursor with spring lag — the cursor IS the read direction across the band. F3-B's signature is different. The strongest candidate per concept:

| Concept | Signature interaction |
|---|---|
| Pegboard | Tool lift-off-peg on click (delight; gated reduced-motion) |
| Display shelf | Object pull-out-of-shelf with shelf shadow on click |
| Side-profile workbench | Camera rotate to look down on object on click |
| Trophy wall | Pin loosen / take-down animation on click |
| **Tool reel** | **Scroll-driven reel rotation** (signature = scroll IS interaction; carries the F3-B-unique scroll affordance) |
| Climbing wall | Hold pop with climbing rope follow on click |

**Composition pass (8.1-B.2)** picks the concept and therefore the signature. The signature decision rides on the concept decision.

**D6. WCAG keyboard / focus implications.**

Vertical stack form maps naturally onto tab order — each row gets one focusable element (button or anchor). Per F3-A.md §G2's proxy-DOM mirror pattern: hidden focusable `<button>` per row, positioned over the visual row with same activation. WCAG 2.4.11 Focus Appearance (3:1 contrast) — focus state per concept:
- Pegboard: focused peg glows + 1.5× outline width
- Shelf: focused shelf row highlights + outline
- Trophy: focused pin pulses (gated reduced-motion)
- Tool reel: focus moves the reel to center the focused tool (replaces scroll-as-interaction for keyboard users)
- Climbing wall: focused hold ring with glow

Per [Material UI Tooltip docs](https://mui.com/material-ui/react-tooltip/) row-anchored tooltip pattern: focus-anchored tooltip works identically to hover-anchored — keyboard accessibility free.

**Key finding — interaction is downstream of concept choice.** F3-A had a unified interaction model (click hotspots + cursor tooltip) because its concept (desk scatter) was unified. F3-B's concept space is plural (6 candidates), so interaction is plural — the composition pass picks both concept AND its native interaction signature in one decision. **8.1-B.2 deliverable**: concept × signature pair lock.

### E. Hero column vertical composition findings

**E1. Family B's published geometry (from narrow3 source, not derived).**

Confirmed from `apps/Hero-8-Lab/src/app/components/narrow3/FamilyB_V1Grid.tsx` and `IdentityAside.tsx`:

- **Grid**: `gridTemplateColumns: 'minmax(288px, 5fr) minmax(512px, 9fr)'`, `gap: 48`. Identity column = 5fr (min 288px); work column = 9fr (min 512px). Ratio ≈ 5:9.
- **Sticky behavior**: `<aside style={{ position: 'sticky', top: 96 }}>` — 96px top offset (clearing LabShell chrome strip).
- **Align**: `alignItems: 'start'` on the grid — identity column doesn't stretch to match work column's height.
- **Current content**: eyebrow (Sebastian Moncada · IS 11 caps 0.12em uppercase) → title (ISe 22) → body (IS 13). Typographic-only baseline; F3-B hero composes against / replaces this.

These are NOT theoretical numbers — they're what the lab renders right now. F3-B Path 1 and Path 2 both build inside this exact geometry.

**E2. F3-B's viewport-sharing invariant (REPLACES F3-A.md K6 independent-containers).**

F3-A.md K6 stated: "F3-A composition must NOT compose with the featured project card below as a single viewport unit. Hero band and featured card are independent containers." That invariant is **F3-A-specific** and does NOT carry to F3-B. F3-B inverts it:

> **F3-B Viewport-Sharing Invariant**: Identity column and work column coexist in viewport for the entire scroll-from-top through the featured-project-card region. The eye reads the column AND the cards in the same visual frame. Compositions must NOT fight this — must NOT pin / overlay / takeover the work column. The column claims its lane (5fr); the work column claims its lane (9fr); coexistence is geometric ground truth.

Subcomponents of the invariant:
- (a) Column's interaction state (hover, expand, scene change) must NOT cause work-column reflow.
- (b) Column's tooltip/expansion surface (per §D1) must NOT cross the 48px gap into the work column.
- (c) Column's scroll-linked choreography (per §D2) must NOT visually pull eye away from work-column content during scroll.
- (d) Column's reading register (eyebrow / title / body / scene) must NOT compete with work-card register (eyebrow / title / proof / body).

(d) is the load-bearing register-collision concern. Section I addresses it via per-concept register decisions.

**E3. F-pattern eye-flow advantage (this is privileged geometry for F3-B).**

Per [NN/G F-Shaped Pattern (original eyetracking research)](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content-discovered/) + [NN/G F-Pattern: misunderstood but still relevant](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/) + [Interaction Design Foundation: Visual Hierarchy](https://ixdf.org/literature/article/visual-hierarchy-organizing-content-to-follow-natural-eye-movement-patterns): users scan text-dense web pages in an F-pattern — first horizontal sweep across the top, second horizontal sweep below, then **vertical scan down the LEFT side**.

**F3-B's identity column sits exactly where the F-pattern's vertical stripe lands.** This is privileged geometric position. Per [NN/G](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/) + [99designs F/Z patterns](https://99designs.com/blog/tips/visual-hierarchy-landing-page-designs/): "Sidebars, right-aligned callouts, and content placed in the right half of a text-heavy layout are largely invisible to scanning users." **F3-B's column escapes the standard "sidebar is invisible" trap because it's LEFT-aligned in an F-pattern context.**

Implication: the column carries first-touch identity signal. It IS read first, then eye sweeps right to cards. This is a strong argument for putting substantive identity content in the column — not just a name + title + decorative aside.

**Counter-consideration** (per [NN/G F-Pattern: misunderstood but still relevant](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/)): F-pattern emerges in text-dense pages; less so in card-grid pages. F3-B's work column is card-grid, so the F-pattern read is weaker than it would be in a long-form article. Eye flow may resemble Z-pattern more than F-pattern. Still: left-column-first read holds in both patterns.

**E4. Sticky math — what F3-B inherits and what's new.**

Sticky positioning fundamentals per [CSS-Tricks · Dynamically-Sized Sticky Sidebar](https://css-tricks.com/a-dynamically-sized-sticky-sidebar-with-html-and-css/) + [LogRocket · CSS sticky troubleshooting](https://blog.logrocket.com/troubleshooting-css-sticky-positioning/) + [MDN position docs](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position):

- **Threshold required**: `top: 0` (or larger offset) must be set for sticky to activate.
- **Ancestor constraint**: sticky element sticks to nearest ancestor with scrolling overflow; no `overflow: hidden` on parents.
- **Height management**: `height: fit-content` is the standard pattern (current `IdentityAside` doesn't set this explicitly; relies on intrinsic content height).
- **Tall column risk**: when sticky element exceeds viewport height, some content becomes inaccessible — element "scrolls out" once threshold passes its own height. **F3-B Path 1 / Path 2 must size column content to fit viewport at the smallest target window height.**

Current `top: 96` offset is the LabShell chrome strip clearance. In the Hero #8 Lab, LabShell is replaced with the new Hero8Shell — chrome height differs. The 96px will need re-measurement at 8.1-B.4 build (likely smaller; Hero8Shell is 3 rows, not the full LabShell stack).

**Viewport-height target** for F3-B sizing:
- 720px-tall window: viewport - 96px sticky offset - 32px breathing = ~590px usable column height. **F3-B at the smallest reasonable desktop window size has ~590px of vertical column real estate.**
- 900px window: ~770px usable.
- F3-B should target 590px as the layout floor — content must fit within 590px without forcing scroll-the-column.

**E5. Stack ordering inside the column.**

Vertical Stack principles per [Kuika Academy · Vertical Stack](https://academy.kuika.com/en/content/vertical-stack) + Eyebrow heading principles per [Reading Patterns research](https://writefulcopy.com/blog/f-shaped-pattern-explained): profile components stack top-to-bottom (name → role → bio); eyebrow heading provides context above title.

Current `IdentityAside` order (baseline): **eyebrow → title → body** (typographic only, no scene yet).

F3-B introduces the scene. Four candidate orderings:

| Order | Layout | Read implication |
|---|---|---|
| **A. eyebrow → title → body → scene** | Identity text up top, scene at bottom | Familiar editorial register; scene reads as "supporting illustration to my words." Risk: scene scrolls past viewport bottom in 720px windows. |
| **B. eyebrow → title → scene → body** | Identity text → scene → body afterthought | Scene in middle disrupts F-pattern vertical sweep. Body becomes appendix. Risk: scene weakens text hierarchy. |
| **C. scene → eyebrow → title → body** | Scene first, identity below | Scene IS the first read; matches aninguyenle's "Ani by Ani" pattern (per §B1) where the cycling illustration anchors above the bio. Strong identity-through-visual claim. |
| **D. scene + eyebrow co-anchored → title → body** | Scene sits next to or contains the eyebrow; title + body below | Most integrated. Scene and identity read as one cluster, not two. Hardest to compose. |

**Lean for 8.1-B.2 composition**: Order C (scene first, identity below) — matches aninguyenle precedent, gives the scene first-read priority in F-pattern eye-flow, lets identity text serve as caption. **But the call depends on concept choice** (per §C/D): a Pegboard concept needs a tool-spec eyebrow row at top; a Tool Reel concept needs the reel anchored at top with title in caption below; a Trophy Wall concept might want title in MIDDLE as a "the work" anchor between top-pin and bottom-pin clusters.

**Stack ordering is downstream of concept choice + native-interaction signature**. Composition pass picks order with the concept-signature pair.

**E6. The viewport-share invariant tested against each concept.**

| Concept | Viewport-share verdict |
|---|---|
| **Pegboard** | ✅ Coexists cleanly with cards; rows expand WITHIN column gutter (per §D1 row-expansion). |
| **Display shelf** | ⚠️ Click action that pulls object OUT of shelf could spill into work-column gutter — needs constraint. Alternative: object pulls forward in-place, then modal opens. |
| **Side-profile workbench** | ⚠️ Camera rotation on click is column-internal but could feel jarring with cards visible — needs taming. |
| **Trophy wall** | ✅ Pin loosen + modal opens; clean invariant respect. |
| **Tool reel** | ⚠️ Scroll-linked rotation MAY pull eye from work-column scroll — needs §D2 step-trigger calibration so reel-rotation cadence matches work-column scroll cadence (one card scrolled = one reel tick). |
| **Climbing wall** | ✅ Holds remain in column; click opens modal. |

**Key finding — viewport-share invariant + concept-fit interaction**: Pegboard, Trophy Wall, Climbing Wall are clean fits. Display Shelf and Side-Profile Workbench need invariant-respecting design choices at composition. **Tool Reel has the highest scroll-coordination risk** (reel rotation pulling eye away from card scroll); calibration is load-bearing if Tool Reel is the concept pick.

**E7. CardFitContext compact mode — F3-A.md §E3 assumption REVOKED for F3-B.**

F3-A.md §E3 said: "compact mode sized the CARD ALONE to fill viewport (when scrolled to it). Hero band renders at natural size above; the user scrolls past it to see the full card." This assumed hero band scrolled OUT before card claimed viewport — the F3-A independent-containers invariant.

**F3-B invalidates that assumption.** Identity column persists in viewport DURING card-claims-viewport scroll position. Compact-mode math for F3-B:

- F3-B card's visible width = work-column width = 9fr / (5fr + 9fr + 48px gap) ≈ 60% of total content width
- F3-B card's visible height in compact mode = viewport - chrome - measured-content-below-media - breathing (same math as F3-A)
- BUT: identity column is visible alongside the card — eye reads both. Compact mode that crops the card to fit viewport doesn't free up real estate for the identity column (they're side-by-side, not stacked).

**Conclusion**: compact mode for F3-B is OPTIONAL not necessary — the card already shares viewport with the column by Family B's grid geometry. Compact mode may still be useful as a "card alone fills viewport when scrolled past column" mode, but the column-and-card-coexist invariant is the default, not the override.

**Build implication**: `CardFitContext` semantics don't need new modes for F3-B; existing 'current' / 'compact' values cover the cases. F3-B does NOT need a new context. Carries.

---

**Section E summary:**

F3-B inherits Family B's published 5fr / 9fr / 48px / sticky-top-96 geometry as ground truth. The viewport-sharing invariant inverts F3-A's K6 — column and cards COEXIST in viewport for the full scroll-through-featured-card region. F-pattern eye-flow privileges the LEFT column, escaping the "sidebar is invisible" trap that right-aligned sidebars suffer. Stack ordering is downstream of concept-signature pair (§C×§D). Viewport-share fits cleanly with Pegboard / Trophy Wall / Climbing Wall; needs care for Display Shelf / Side-Profile Workbench / Tool Reel. Compact-mode handling stays compatible with existing `CardFitContext`.

### F. Performance budgets findings

**F1. Core Web Vitals targets (unchanged from F3-A.md §F1).**

- **LCP** ≤ 2.5s · needs improvement 2.6–4.0s · poor > 4.0s
- **INP** ≤ 200ms · needs improvement 201–500ms · poor > 500ms
- **CLS** ≤ 0.1

Per [Core Web Vitals 2026 guide](https://www.corewebvitals.io/core-web-vitals) + [Google Search Central CWV](https://developers.google.com/search/docs/appearance/core-web-vitals): LCP candidates are images, text blocks, or videos visible in the viewport. Whichever element is largest and renders first becomes LCP.

**F3-B LCP analysis** — different from F3-A's:
- F3-A.md §F1 concluded LCP is "the hero band's poster image OR headline" because the band is the visually dominant element at first paint.
- F3-B inverts: **work-column cards' first card has the dominant image area** (~512–800px wide work column × ~400–600px card height = the visual heavyweight). **Identity column's content (column ~280–380px wide) is smaller in area** even when fully rendered.
- **F3-B LCP candidate = first featured card's media area** (work-column side), NOT the identity column. Confirms F3-A.md §F1's takeaway in inverted form.

**Implication**: column rendering can stream in AFTER LCP without harming the metric. Card media must hit LCP target on its own. The column's perf budget is forgiving on LCP, tight on INP (since column hover/click MUST stay <200ms response).

**F2. Path 1 (R3F sticky canvas) — perf characteristics.**

Carries from F3-A.md §F2 with column-specific deltas:

| Parameter | F3-A.md §F2 baseline | F3-B Path 1 delta |
|---|---|---|
| Triangle budget · mobile | 50k sustains 60fps on 3-year-old Android · 65k = drops | Narrower canvas (280–380px wide) → fewer pixels to shade → SLIGHTLY higher polygon ceiling possible. Practical: still target ≤50k for safety. |
| Hero focal mesh | 50k–100k | Each row's object: 5k–15k tris (smaller render scale = less detail needed) |
| Scene total | <500k | F3-B Path 1 scene: <100k (4–7 rows × ~10k each + scaffolding). FAR under budget. |
| Draw calls | <100 for 60fps | F3-B Path 1: ~20–40 (small object count) |

**NEW concern for F3-B — GPU memory in persistent sticky canvas.** Per [Three.js GPU memory leak primer](https://ritik-chopra28.medium.com/why-your-three-js-app-is-secretly-eating-gpu-memory-and-how-to-stop-it-fe8ca6b2f72d) + [Three.js forum: R3F memory leak when canvas scrolled out of view](https://discourse.threejs.org/t/r3f-threejs-memory-leak-when-canvas-is-scrolled-out-of-view/48440) + [Mindful Chase: fixing Three.js memory leaks](https://www.mindfulchase.com/explore/troubleshooting-tips/frameworks-and-libraries/fixing-performance-drops-and-memory-leaks-in-three-js-applications.html): Three.js does NOT garbage collect GPU resources. Sticky column = persistent canvas = GPU resources allocated for the entire page lifetime. Without explicit `dispose()` on geometries/materials/textures, memory grows unchecked.

**F3-A's hero band scrolls out → R3F unmounts canvas → GPU resources released.** F3-B's sticky column STAYS MOUNTED for the page lifetime. Different memory model.

**Practical defenses for F3-B Path 1:**
- **Persistent renderer pattern** (per Three.js forum + Mindful Chase) — single renderer instance, geometry/material instancing, no canvas recreation on route change
- **Explicit `dispose()` on unmount** — when user navigates away from `/hero-8/f3/b/*`, all geometries + materials + textures must dispose
- **Monitor `renderer.info.memory`** during dev — counts shouldn't grow during static hover/click
- **Combine §A's `frameloop="demand"` + `useInView` pause** — pauses render when column offscreen (helps perf, doesn't help memory)

**F3-B Path 1 perf budget revised:**
- Geometry: ≤30k tris TOTAL scene (massive headroom under F3-A's 75k target)
- Textures: 512² hero objects + 256² props (smaller render scale = lower-res textures still read fine)
- Total payload: <1 MB compressed first paint slice; <2 MB fully loaded (HALF of F3-A.md §F3 targets)
- GPU memory: cap explicitly at ~50–80 MB (less than F3-A.md §F2's 80–250 MB range; smaller scene)

**F3. Path 2 (SVG sticky column) — perf characteristics.**

Per [CSS-Tricks · High Performance SVGs](https://css-tricks.com/high-performance-svgs/) + [GSAP · large complex SVG perf](https://gsap.com/community/forums/topic/15292-performance-on-large-complex-svg/) + [Khan Academy · doubling SVG FPS](https://www.crmarsh.com/svg-performance/) + [Zigpoll · SVG animation optimization](https://www.zigpoll.com/content/how-can-i-optimize-svg-animations-to-run-smoothly-on-both-desktop-and-mobile-browsers-without-significant-performance-loss):

**Key SVG perf rules:**
- **Animate `transform` and `opacity` ONLY** — these are GPU-accelerated via compositor thread
- **NEVER animate `fill`, `stroke`, `d` (path data), `width`, `height`, `x`, `y`** — these trigger CPU repaint / layout recalculation
- **Path point reduction** — hundreds of points often render identically to thousands; use SVGO/SVGOMG to optimize
- **Combine paths to reduce DOM node count** — fewer DOM nodes = faster layout + style recalculation
- **IntersectionObserver-gated animation** — disable when column offscreen (carries from §A4 + §D2)

**F3-B Path 2 perf budget:**
- SVG path count: 4–7 illustrations × ~5–15 path elements each = 20–105 paths total in column
- DOM node count: <200 total in column (well under SVG perf thresholds)
- Animation strategy: transform + opacity only; cascade-reveal via IntersectionObserver
- Memory footprint: negligible compared to Path 1 (SVG = vector data, no GPU buffers)
- LCP impact: zero — SVG inlined in HTML renders synchronously with first paint

**F3-B Path 2 is dramatically lighter than Path 1.** No GPU memory concern, no canvas mounted, no `dispose()` needed, no `frameloop` management. Just SVG with transform/opacity animations.

**F4. Path 1 vs Path 2 perf comparison at column scale.**

| Metric | Path 1 (R3F) | Path 2 (SVG) |
|---|---|---|
| First paint blocking | Canvas mount + WebGL init = ~100–300ms | SVG inline = synchronous with HTML = ~0ms |
| LCP impact | Column not LCP; lazy-load behind cards is safe | Column not LCP; no impact |
| INP (hover/click response) | <16ms (frame budget) achievable with `frameloop="demand"` | <16ms achievable with transform/opacity animations |
| Sticky canvas GPU memory | 50–80 MB persistent | 0 |
| Bundle size | Three.js + R3F + drei = ~200 KB gzipped baseline | GSAP ScrollTrigger or Scrollama = ~30–50 KB |
| Mobile FPS at column scale | 60fps achievable with <30k tris | 60fps trivial for ≤200 DOM nodes |
| Render loop concern | Persistent canvas = persistent render loop ticks (mitigated by demand+useInView) | No render loop |

**Aggregate**: Path 2 is dramatically lighter on every axis. Path 1 needs careful engineering (dispose pattern, demand frameloop, IntersectionObserver pause) to be safe at sticky-column scale.

**F5. Sticky-column preload priority.**

F3-A.md §F4 mapped preload to 3D hero assets: static poster as LCP element + R3F lazy-loaded behind. F3-B inverts:

- **Work-column first card's media** = the LCP candidate → `fetchpriority="high"` + preload
- **F3-B Path 1's canvas** = lazy-load AFTER first card paints (R3F via `React.lazy` + `Suspense`)
- **F3-B Path 2's SVG** = inline in HTML (zero load cost); no preload needed

**F3-A's three patterns from §F4 carry, but inverted:**
1. Static poster as LCP element → BECOMES → first card's media as LCP element (work-column heavyweight)
2. Nested `<Suspense>` inside canvas → carries for Path 1 only
3. glTF Transform pipeline at build → carries for Path 1 only (Path 2 uses SVGO)

**F6. Kill-switch behavior.**

F3-A.md §G4 kill-switch ladder (PerformanceMonitor → DPR drop → outline disable → static poster) carries for F3-B Path 1 with a column-specific addition:

- **Sticky column kill-switch tier added**: if Path 1 PerformanceMonitor declines within first 3 seconds of mount, swap canvas for Path 2 (SVG static) — the SVG path becomes the degraded fallback. This is unique to F3-B because we're building BOTH paths anyway; the degrade can swap to the other path rather than to a generic poster image.
- **`prefers-reduced-motion`**: Path 1 = single static frame; Path 2 = no animations, all illustrations rendered statically. Both clean.

**F7. Performance verdict.**

- Path 2 has near-zero perf risk at column scale. Engineering effort to ship safely: low.
- Path 1 has manageable perf risk with documented mitigations (dispose / demand / useInView). Engineering effort to ship safely: medium.
- **Path 1's persistent-canvas GPU memory is the only real new concern** vs F3-A — but it's solvable with standard patterns. NOT a reason to drop Path 1.

**Key finding**: perf is NOT a discriminator between paths. Both are viable at column scale. Concept choice + identity/composition fit are the dominant factors. Perf becomes load-bearing only IF the column needs frequent state changes (e.g., scroll-driven Tool Reel with continuous rotation) — that case favors Path 2 strongly.

### G. A11y / reduced-motion / mobile fallback findings

**G1. `prefers-reduced-motion` for sticky column — UNIQUE concern not in F3-A.md §G1.**

Per [Scott O'Hara · Reduced Position Sticky](https://www.scottohara.me/note/2019/03/27/reduced-sticky.html) — the canonical reference: "Since sticky positioning behavior could be considered a form of parallax scrolling, it may be a triggering issue for some people, and developers should respect those who have opted to prefer reduced motion." Pattern documented:

```css
@media screen and (prefers-reduced-motion: reduce) {
  .identity-aside {
    position: relative; /* negates sticky */
  }
}
```

**F3-A.md §G1 didn't have to address this** because F3-A's hero band wasn't sticky — natural-flow scrolled it out. F3-B's sticky behavior IS the column's load-bearing UX, AND it's a reduced-motion concern.

Two viable defaults for F3-B:

| Option | Behavior under reduced-motion | Trade-off |
|---|---|---|
| **A. Disable sticky** (Scott O'Hara pattern) | Column becomes `position: relative`; scrolls naturally with the work column | Loses persistent identity-co-anchor effect; column scrolls out as user scans cards. **Honest to the user's preference.** |
| **B. Keep sticky, disable everything else** | Column stays sticky but cascade-reveal / hover animation / scroll-linked choreography all disabled | Keeps the persistence affordance; minimizes the parallax-like read. **Less aggressive interpretation of "reduced motion."** |

**Lean for F3-B default**: **Option B** — keep sticky, disable motion. Sticky itself doesn't move pixels through space the way parallax does (the column stays geometrically fixed; the scroll progresses past it). The motion concern is the cascade-reveal + hover + scroll-linked choreography, not the sticky itself. Reduced-motion users still see the identity column persist; they just don't see it animate in.

**Option A as escape hatch** — if user feedback flags sticky-as-uncomfortable, drop to A. Add to lab's reduced-motion testing as a Phase 2 toggle (`sticky-mode = persist | scroll-naturally`).

For Path 1 (R3F): also carries F3-A.md §G1's `gsap.matchMedia()` / `useFrame` mutation gate — single static frame on reduced-motion, no scene animation.

For Path 2 (SVG): also disables `transform`/`opacity` animations on reduced-motion — illustrations render in initial state, no cascade-reveal.

**G2. Keyboard tab order — sticky column + work column geometry.**

Per [MDN Grid layout and accessibility](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Grid_layout_and_accessibility) + [WebAbility Tab Order glossary](https://www.webability.io/glossary/tab-order) + [WCAG H4 logical tab order](https://www.w3.org/TR/WCAG20-TECHS/H4.html) + [Centre for Excellence in Universal Design](https://universaldesign.ie/communications-digital/web-and-mobile-accessibility/web-accessibility-techniques/developers-introduction-and-index/provide-an-accessible-page-structure-and-layout/maintain-a-logical-tab-and-reading-order-and-provide-a-clear-focus-indicator):

**Critical finding**: CSS Grid visual reordering does NOT affect tab order. Tab order follows DOM source order. F3-B's identity column appears BEFORE the work column in DOM (per `FamilyB_V1Grid.tsx` order: `<IdentityAside />` then `{renderFeatured}` then standards). **This means tab order naturally goes: column items → work column featured card → standards.** Matches F-pattern eye-flow (§E3) by accident — DOM source order and reading order both put column first.

**Tab order for F3-B Path 1 / Path 2:**

1. Column item 1 (top row) → 2 → 3 → ... → N (bottom row of column)
2. → Featured project card (work column)
3. → Standard card 1 → 2 → 3 → 4

**The geometric jump from last-column-row to first-work-card** is the load-bearing UX moment. Users tabbing through column finish the column, then focus visibly jumps right + up to the work column featured card. This is a meaningful traversal (column carries identity, work column carries work), but visually surprising.

**Mitigation patterns (cite [accessibility.digital.gov tab order](https://accessibility.digital.gov/ux/tab-order/) + [AlastairC responsive order conflict](https://alastairc.uk/2017/06/the-responsive-order-conflict/))**:

- **Skip link at top of page**: "Skip to work" — bypasses column for users who want to scan cards immediately. Standard pattern. Required if column has >3 interactive rows.
- **Focus visible animation**: when focus jumps from column-last to work-first, show a subtle focus-traversal hint (animated focus ring or arrow) so the user understands where focus went. Gated by reduced-motion.
- **Tabindex audit at 8.1-B.4 build**: confirm no `tabindex` higher than `0` is introduced (positive tabindex breaks natural order).

**Per-concept keyboard implications** carry from §D6's table.

**G3. Mobile fallback — sticky column on mobile is a problem.**

Per [Adekola Olawale · Handling Fixed and Sticky Elements in Responsive Layouts](https://medium.com/@Adekola_Olawale/handling-fixed-and-sticky-elements-in-responsive-layouts-7a79a70a014b) + [Elegant Themes · Sticky sidebar with CSS Grid](https://www.elegantthemes.com/blog/divi-resources/how-to-build-a-sticky-sidebar-layout-with-css-grid-in-divi-5) + [shadcn/ui Sidebar](https://ui.shadcn.com/docs/components/radix/sidebar):

**Mobile reality**: a sticky column eats viewport real estate that mobile can't afford (~280px on a 360px-wide screen = 78% of viewport gone to identity). Three documented mobile fallback patterns:

| Pattern | Behavior on mobile | F3-B fit |
|---|---|---|
| **Stack above content** | Sidebar collapses + stacks above main content; sticky disabled | Cleanest fit for F3-B. Column content renders ONCE at top, then cards below. Sticky → relative on mobile. |
| **Hamburger / off-canvas drawer** | Column hidden behind menu; tap to reveal | Wrong intent — column is identity content, not nav. Skip. |
| **Sticky navbar collapse** | Column collapses to a thin sticky bar with name only | Loses identity content. Skip. |

**Lean for F3-B mobile**: **Stack above content.** Column becomes a once-at-top content block on mobile; work cards stack below. Sticky disables via media query. Column content (eyebrow + title + body + scene) renders at top of page in natural reading order.

**This is essentially F3-A geometry on mobile.** Above-the-cards horizontal-ish hero block. The column → band collapse is not a problem — it's the natural responsive degradation. Per `feedback_ground_up_means_concept_not_just_layout`, this is OK because the MOBILE expression of F3-B converges with F3-A's expression — but the desktop expressions remain ground-up distinct. The convergence happens at the responsive breakpoint, not in the concept.

**Per-concept mobile note**:
- Pegboard / Trophy Wall / Climbing Wall → still legible as a horizontal-ish content block at top
- Display Shelf → reads fine as a horizontal stack of shelves at mobile width
- Side-Profile Workbench → camera angle still works
- Tool Reel → scroll-driven rotation maps to mobile scroll too — may stay sticky longer than other concepts

**Breakpoint**: lean toward `min-width: 768px` (tablet+) for sticky behavior; below = stack. Pick at 8.1-B.4 build based on smallest target window.

**G4. Kill-switch ladder for column-shape failure modes.**

F3-A.md §G4 documented the kill-switch ladder (PerformanceMonitor → DPR drop → outline disable → static poster). F3-B inherits + adds column-specific failure modes:

- **Column overheating** — too many scroll-linked changes, animation density too high. Mitigation: cap scroll-linked state changes per second; throttle.
- **Column hijacking scroll** — Tool Reel concept done wrong (reel rotation that locks user's scroll input). Mitigation: NEVER intercept scroll events for Tool Reel — react to scroll, never prevent it.
- **Column blocking work-column reads** — column animation too visually loud, eye can't focus on cards. Mitigation: hover state on column quieter than card hover state (carries from §E2 invariant subcomponent c).
- **Sticky scroll glitch** — sticky + smooth scroll + reduced motion interaction can cause jitter (per [WTTech blog · CSS transitions and reduced motion](https://wttech.blog/blog/2020/css-transitions-and-reduced-motion/)). Mitigation: test sticky behavior at all four combinations of (Path 1 vs 2) × (reduced motion vs full motion).
- **Path 1 → Path 2 degrade** (from §F6) — if Path 1 PerformanceMonitor declines within 3 seconds of mount, swap canvas for Path 2 SVG.

**G5. Manual reduced-motion toggle in lab chrome.**

F3-A.md §G4's "user-initiated kill switch (a 'reduce motion' toggle in page chrome, separate from OS preference)" carries. The Hero #8 Lab chrome can include a "Reduce motion" toggle that overrides OS preference for live testing. Defer to 8.1-B.4 build phase 2.

**Section G summary:**

`prefers-reduced-motion` for sticky introduces a NEW concern not in F3-A.md §G1 — sticky behavior itself is parallax-like for some users. Default = keep sticky, disable motion (Option B); fall back to Option A (disable sticky) if user-tested as uncomfortable. Tab order works naturally because DOM source order matches reading order (column before work column). Mobile fallback = stack above content; sticky disabled below ~768px. Kill-switch ladder gains column-specific failure modes (overheating / hijacking / blocking) on top of F3-A.md §G4's baseline.

### H. CS-hero continuity findings

**CSML M1 register grammar to respect** (per `docs/locked/case-study-modules/01-founder-scan-overview.md`):
- Eyebrow ("01 — OVERVIEW" format) + single-line Title + Summary + Context paragraph
- **Full-width vertical stack** — side-by-side rejected in CSML lock pass; "broke harmony with the module below"
- Hierarchy solved by spacing, not decorative elements
- Universal Eyebrow + Title pattern shared across §01–§10 (cross-module cohesion)

The "full-width vertical stack" is the load-bearing constraint for F3-B continuity analysis. F3-B's column geometry interacts with CSML M1 differently than F3-A's band did — both options below are re-evaluated against CSML M1's lock.

**H1. Morph option for F3-B — REGISTERS ARE STRUCTURALLY ALIGNED, unlike F3-A.**

F3-A.md §H1 verdict: "partial morph (text only) is the most honest morph implementation; full-composition morph is dishonest" because F3-A's wide-short band and CSML M1's tall-vertical-stack are cross-aspect — full morph reads as squash.

**F3-B inverts this finding.** F3-B's column is ALSO a tall vertical stack — same geometric direction as CSML M1. The morph is structurally honest at the geometric level:

- **F3-B's column = vertical stack** (eyebrow → title → body + scene)
- **CSML M1 = vertical stack** (eyebrow → title → summary → context)
- Both stacks read top-to-bottom in similar register order

**Implementation patterns** (per [React Router · View Transitions](https://reactrouter.com/how-to/view-transitions) + [Pete Murphy · React Router and View Transitions](https://pete-murphy.github.io/posts/2023-05-17-react-router-view-transitions-api.html) + [Motion · React Layout Animations layoutId](https://motion.dev/docs/react-layout-animations) + [SupremeTech · smooth navigation transitions](https://www.supremetech.vn/create-smooth-navigation-transitions-with-view-transitions-api-and-react-router/)):

| Mechanism | How | F3-B fit |
|---|---|---|
| **View Transitions API + `view-transition-name`** | Add `viewTransition` prop to NavLink/Link; assign `view-transition-name` to eyebrow + title elements. Browser handles crossfade + position interpolation. | **Clean fit.** Native browser API; no React-specific runtime cost. |
| **Framer Motion `layoutId`** | Same `layoutId` on F3-B column's title + CSML M1's title; Motion auto-FLIPs. | Works but adds runtime cost. View Transitions API preferred for production. |
| **Hybrid (View Transitions + Motion fallback)** | View Transitions where supported; Motion `layoutId` polyfill where not. | Possibly over-engineered for v1; pick one. |

**F3-B morph specifics:**
- **Eyebrow text morph**: F3-B's eyebrow ("Sebastian Moncada") → CSML M1's eyebrow ("01 — OVERVIEW"). The text content CHANGES across the morph; the position/typography of the eyebrow slot persists. Browser crossfades text contents. Per [React docs on `<ViewTransition>`](https://react.dev/reference/react/ViewTransition).
- **Title morph**: F3-B's column title (ISe 22) → CSML M1's title (locked typography). Different typography; crossfade still reads as continuous.
- **Scene morph**: F3-B's column scene (3D scene OR illustration stack) has no §01 counterpart. Two options: (a) fade out cleanly (scene disappears, M1 takes over), (b) collapse into a corner persistent element (sets up the persist option, below).
- **Geometric continuity**: column 280–380px wide → M1 full-width. Either crossfade the geometric expansion (column widens to full width as content morphs), or scene moves to a corner persistent slot while text fills full width.

**Verdict for F3-B morph**: **honest at the text register, geometric expansion is the open question.** F3-A's morph was limited because cross-aspect; F3-B's morph is unbounded because same-axis stacks. **F3-B morph is the strongest the morph option has been in F3-x research.**

**H2. Persist option for F3-B — POTENTIALLY F3-B'S STRONGEST MOVE, but cross-system cost.**

The persist option: F3-B's sticky column continues into case-study pages as a permanent left rail. Per [Allison Berels · Navigation Redesign Case Study](https://www.allisonberels.com/work/sf-navigation) + [Dmitry Sergushkin · Sidebar Navigation case study](https://uxplanet.org/case-study-research-sidebar-navigation-b41272026c6d?gi=f63d1a368486): "The left side of the screen is valuable real estate for navigation placement, and vertical lists are more efficient for visual search than horizontal layouts."

**F3-B has a built-in persist affordance F3-A doesn't have.** F3-A had to invent persist (a corner element that survives the transition). F3-B's column ALREADY EXISTS as a sticky column — extending it INTO case-study pages is a natural extension of its homepage geometry.

**Persist patterns:**

| Pattern | Behavior | Trade-off |
|---|---|---|
| **Full column persists** | Same column lives on case-study pages; content changes (homepage = identity scene; case-study = scrollytelling for §01–§10) | **Most invasive — forces cross-system change**: CSML M1's full-width vertical-stack lock is broken (M1 becomes 9fr work column, not full-width). Triggers cross-system-rules outcome-protocol Path C (locked-doc revision). |
| **Column shrinks to side-rail TOC** | Column persists at narrower width (~64–96px) as a §01–§10 case-study TOC indicator | Less invasive: M1 stays at most of full-width, just inset 64–96px on the left. Still requires CSML M1 lock revision (full-width → "full-width minus left inset"). |
| **Column persists ONLY in case-study §01** | Column appears in §01 as a co-anchor, disappears at §02+ | Hybrid: respects rest of CSML but introduces a one-section exception. M1 absorbs the column for the duration of §01 only. |

**Critical cross-system cost**: Path 1 + Path 2 of persist BOTH force CSML M1 to be reopened. Per `cross-system-rules.md` §12 outcome protocol:
- **Path A** = surgical revision to CSML M1 lock to accommodate F3-B persist column
- **Path B** = downgrade F3-B persist to NOT cross CSML M1's full-width zone (i.e., persist-only-in-§01)
- **Path C** = drop F3-B persist; lock no-continuity (H3 below)

**Persist verdict for F3-B**: geometrically the strongest F3-B move, but it forces a cross-system locked-doc decision. **This is a Hero #8 → CSML cross-system question, not an F3-B-only decision.** Composition pass (8.1-B.2) flags this for the cross-system addendum at 8.8 Hero #8 lock; final call is at Hero #8 + CSML coordination, not in this cell.

**Best-of-both candidate**: **column-persists-in-§01-only** (Path B). The column carries identity through the M1 entry register, dissolves at §02 transition. This honors CSML M1's full-width stack lock for §02–§10 while exploiting F3-B's persist affordance at the case-study entry moment.

**H3. No-continuity option for F3-B — clean cut.**

F3-A.md §H3 verdict carried "no-continuity as recommended default" because F3-A was already inventing geometry and stacking continuity novelty compounded risk. F3-B's situation differs:

- F3-B's morph is HONEST (H1 — same-axis stacks)
- F3-B's persist has a NATURAL affordance (H2 — sticky column already exists)
- Dropping both means leaving real continuity affordances on the table

**No-continuity verdict for F3-B**: still valid as a fallback, but **less obviously the right call than for F3-A.** F3-B has earned continuity options that F3-A didn't. Picking no-continuity for F3-B is a deliberate sacrifice of available affordances, not a "respect-the-lock" default.

**H4. F3-B continuity strength summary — this section may be the strongest argument for picking Family B at the homepage-vs-homepage-Family-decision.**

Per `gate-a-homepage-track-locked.md` — Family A vs B decision happens at the END of Hero #8 narrowing. F3-B's continuity affordances are uniquely strong vs F3-A's:

| Continuity axis | F3-A | F3-B |
|---|---|---|
| Morph honesty | Partial (text only) — cross-aspect | Full (same-axis stacks) — geometrically aligned |
| Persist affordance | None native; has to invent corner element | Built-in (sticky column already extends to case-study) |
| No-continuity defaulting | Reasonable (band geometry doesn't suggest continuity) | A sacrifice (column geometry DOES suggest continuity) |

**This may be a reason to prefer Family B at the Hero #8 → homepage-final-lock step.** F3-A → CSML §01 transition is honest no-continuity; F3-B → CSML §01 transition has genuinely stronger options. **Continuity is not a tiebreaker between F3-A and F3-B individually (both desk concepts must walk in lab first), but it is a tiebreaker between Family A and Family B layout-family decisions if continuity ranks high in the final hiring-surface criteria.**

**H5. Recommendation for F3-B 8.1-B.2 composition.**

Carry THREE continuity proposals into composition:
1. **No-continuity** (default) — clean cut, respects CSML M1 lock, lowest cross-system cost
2. **Text morph only** (H1) — title + eyebrow morph; scene fades out; geometric expansion handled by crossfade
3. **Column-persists-in-§01-only** (H2 best-of-both) — column extends into M1 region for §01; dissolves at §02

Composition pass picks ONE; the cross-system Path A/B/C question (if persist picked) escalates to Hero #8 → CSML coordination at 8.8 lock.

**Anti-drift for H**: F3-B continuity decision must not silently force CSML M1 lock to change without going through the cross-system outcome protocol. If H2 is picked, the lock revision is a CROSS-SYSTEM Path A/B/C decision, NOT an F3-B internal call.

---

**Section H summary:**

F3-B's continuity options are genuinely stronger than F3-A's. **Morph is honest** (same-axis vertical stacks). **Persist has a built-in affordance** (sticky column natively extends). **No-continuity is a sacrifice rather than a default.** Three proposals carry into 8.1-B.2 composition: no-continuity, text-morph, column-persists-§01-only. Persist option requires cross-system locked-doc revision (CSML M1) and is escalated to Hero #8 → CSML coordination, not an F3-B unilateral call. **Continuity may be a tiebreaker for Family B vs Family A at the homepage-final-lock step.**

### I. Desk objects in column geometry findings

**Framing**: per `feedback_ground_up_means_concept_not_just_layout` + §C corrected framing, F3-B's object slate is derived PER CONCEPT, not carried mechanically from F3-A's 9-object scatter. Each of the 6 candidate concepts from §C3 calls for its own native object slate.

What carries across all F3-B concepts: the **personal-identity signal** the F-family (Desk / Workbench) is meant to surface. Sebs's identity markers per F3-A.md §I + `portfolio-style-art-voice-source.md` §5.1–5.2:
- Work signals: Ion case study, Elara, Canopi, sketchbook process
- Personal signals: GF (love letter), running (Strava), Colombia + USA roots, Pokémon (inner child), seltzer/baby-juice (quirk), clicky pen (fidget)
- Cultural signals: pyramid (roots/history)

F3-A expressed these as 9 objects scattered on a desk. F3-B expresses the same identity through CONCEPT-NATIVE objects — pegs on a pegboard, items on a shelf, pins on a trophy wall, etc. The objects DIFFER per concept; the identity signaled stays.

**I1. Per-concept native slates.**

Each concept calls for objects that naturally belong in THAT form. The slate counts target §C4's vertical-stack capacity (4–7 rows at the chosen row register).

| Concept | Native slate (4–7 items) | Identity signal coverage |
|---|---|---|
| **Vertical pegboard** | (1) X-acto knife · (2) ruler · (3) sketchbook (mounted) · (4) clicky pen · (5) headphones · (6) running shoe by laces · (7) Polaroid camera | Work tools (1–4) + personal (5–7). Tools-as-identity. Workshop register. |
| **Vertical display shelf** | (1) Sketchbook (Elara process) · (2) Polaroid of GF · (3) Pyramid figurine (roots) · (4) Pokémon figure · (5) running medal · (6) Colombian+American flag pin | Identity-as-curation. Each shelf row = one chapter. Closest to a personal-shelf register. |
| **Workbench (side-profile)** | (1) Monitor (Ion case-study screen) · (2) MacBook (closed, stacked) · (3) Sketchbook · (4) Seltzer can · (5) Clicky pen · (6) Plant | Workspace surface viewed from side. Items sit on the desk in vertical alignment to viewer. Closest concept to F3-A's desk reading. |
| **Trophy wall** | (1) Pinned love letter · (2) Framed sketch (Elara concept) · (3) Pinned Polaroid (GF or trip) · (4) Running pin (race medal) · (5) Postcard from Colombia · (6) Pokémon trading card pinned · (7) Boarding pass / ticket stub | Memorabilia register. Each item has a "story" caption available on hover (per §D3 row-expansion). Strongest narrative pairing for F3-B. |
| **Vertical tool reel** | Rotating cycle of (1) Figma · (2) React/code editor · (3) Notion · (4) Linear · (5) Sketchbook (analog) — represents the TOOLS Sebs works with, not personal life | Pro-toolkit register. Different identity claim — "this is how I work" not "this is who I am." Less personal than other concepts. **Mismatch warning**: tool reel may not surface the personal-life identity F3-A and other F3-B concepts carry. |
| **Climbing wall** | (1) Ion (top hold, big) · (2) Elara · (3) Canopi · (4) IYNA · (5) Gardens — represents project history climbing up | Project-timeline register. Different identity claim — "this is my work history." Reads as portfolio TOC, not personal identity. **Risk**: borders on K1 hero-zone violation (becomes feature showcase / page-summary). |

**Critical finding — concept choice determines identity register**:
- **Pegboard / Shelf / Workbench / Trophy Wall** → personal-life identity (matches F3-A's identity register)
- **Tool Reel** → pro-toolkit identity (different claim)
- **Climbing Wall** → project-timeline identity (different claim; near K1 violation)

The first four concepts pair cleanly with F3-A's identity claim. The last two reposition what F3-B signals — they're legitimate but DIFFERENT identity statements. **8.1-B.2 composition pass picks not just concept-form but identity-statement.**

**I2. Per-object priority — top-to-bottom read in vertical stack.**

Top-of-column gets the strongest signal per §E3 F-pattern eye-flow. For each concept's slate, the row order matters:

- **Pegboard**: TOP = most identity-bearing tool (sketchbook or X-acto). BOTTOM = supporting tools (pen, running shoe).
- **Display shelf**: TOP = most-prized object (Polaroid of GF or sketchbook). BOTTOM = older / less-current objects.
- **Workbench (side)**: TOP = monitor (the showpiece). BOTTOM = supporting items (cup, pen). Natural eye-level read.
- **Trophy wall**: TOP = current / most-recent (Elara sketch, recent race pin). BOTTOM = older artifacts (boarding pass, postcard).
- **Tool reel**: ROTATING — no fixed top/bottom; scroll position determines what's focused.
- **Climbing wall**: TOP = current peak (Ion). BOTTOM = early holds (first projects). **NOTE: inverts F-pattern strongest-at-top** — climbing-wall metaphor places oldest at bottom, current at top, which is a metaphor mismatch IF user reads top-down chronologically.

**Priority guidance**: top three rows get the load-bearing identity weight; rows 4–7 are supporting cast. Most concepts honor F-pattern top-strongest read; Climbing Wall is the exception.

**I3. Style mapping at column scale — per concept.**

§A1 finding: F3-B may favor SVG (Path 2) over R3F (Path 1) at column scale because narrow column makes 3D's depth-driven scale gradient less effective. Per-concept style:

| Concept | Path 1 (3D) style fit | Path 2 (vector) style fit |
|---|---|---|
| Pegboard | Toon-shaded + edge-line (matches F3-A); flat lighting; objects render clearly at small scale | **Strong fit**. Line-illustration tools, hand-drawn-feel. Aninguyenle pattern. |
| Display shelf | Toon-shaded with slight depth; shelf shadow helps depth read | Line-illustration with implied depth via overlap |
| Workbench (side) | **Most demanding Path 1 fit** — side view requires camera composition + lighting from one side. Highest 3D craft cost. | Line-side-profile illustration. Simpler than 3D side. |
| Trophy wall | Toon-shaded objects pinned with shadow under each | **Strong fit**. Hand-drawn ink + watercolor wash register; pinned-collage feel. |
| Tool reel | 3D logos rotating in a vertical drum | **Strong fit**. SVG icon stack with scroll-linked transform |
| Climbing wall | 3D holds with depth read on the wall surface | Line-illustration holds on a flat-wall illustration |

**Aggregate**: Trophy Wall + Pegboard pair particularly well with Path 2 (line-illustration). Workbench (side-profile) is the hardest concept for Path 1 (camera composition cost). Other concepts work in both paths with similar quality.

**I4. GF alt-POV revisited for column geometry.**

F3-A.md §I4 cross-checked GF's 9 alternative objects: Photo of her · Lego · Calendar · Sketchpad · Laptop · Fidget thing · Baby juice (= seltzer) · Clock/timer · Keyboard.

Per `portfolio-style-art-voice-source.md` §5.1: GF's list was "divergent intuition for direction-shaping" — Sebs vs GF tension synthesis lives in `phase-2-v1-brand-direction.md`. For F3-A, GF list stayed as cross-check reference only.

**F3-B re-check**: GF's slate maps better to certain F3-B concepts than to F3-A's horizontal scatter:
- **Display shelf** suits GF's curation impulse (Photo, Lego, Sketchpad, Calendar = items with intentional placement)
- **Trophy wall** suits GF's collection impulse (Photo, Sketchpad, Calendar = pinnable)
- **Pegboard / Workbench / Tool Reel / Climbing Wall** match GF's list less directly

If F3-B picks Shelf or Trophy Wall, **GF's slate becomes a stronger composition input** than it was for F3-A. Specifically:
- Lego (consider generic construction-blocks for IP cleanliness per F3-A.md §I3 — though user 2026-05-29 overruled Pokémon IP concern)
- Calendar (Sebs-meaningful date — anniversary, birthday, project ship date)
- Clock/timer (race time, deep-work-block)

These three GF candidates could slot into F3-B's Trophy Wall or Shelf slate. **8.1-B.2 composition pass should re-evaluate GF alt-POV inputs against the picked concept**, not carry F3-A's "GF list stays as cross-check only" verdict mechanically.

**I5. Per-object purpose (carries F3-A.md K4 + §3.9 easter-egg budget).**

F3-A.md K4 + §I2's per-object purpose toggle: every column object must resolve into meaning on interaction:
- **Case-study route** (object → click → opens specific case study)
- **About-page anchor** (object → click → scrolls to about-page section)
- **Easter-egg reveal** (object → click → small reveal within hero)
- **External link** (object → click → external destination)

Easter-egg budget per `portfolio-style-art-voice-source.md` §3.9: max 6 site-wide, max 3 per page, 10-second discovery target. **F3-B inherits this budget.** F3-A used 5 easter-egg slots; if F3-A and F3-B both ship as siblings on the homepage, the combined easter-egg count must stay under 6 site-wide. Either:
- (a) F3-A and F3-B share easter eggs (same object → same easter egg)
- (b) F3-A's easter-egg objects get reassigned to non-easter-egg actions (case-study / about / external) when F3-B layout is active

**Decision deferred to 8.1-B.2 composition + 8.5/8.8 implementation handoff.** Documented as a cross-cell budget concern.

**Per-concept default purpose map (composition pass picks defaults):**

| Concept | Likely purpose distribution (composition input) |
|---|---|
| Pegboard | 2 case-study tools (sketchbook → Elara, MacBook → Ion) · 2 about anchors (running, fidgets) · 2 easter eggs (Pokémon, seltzer) · 1 external (Strava) |
| Display shelf | Mostly easter-egg reveals (each shelf object has a story shown on hover) + 2 case-study (sketchbook → Elara, top shelf item) |
| Workbench (side) | Closest to F3-A's distribution (monitor → Ion, sketchbook → Elara, seltzer/pen → easter, running/flag → about) |
| Trophy wall | Mostly easter-egg reveals (pinned items reveal stories) + 1–2 case-study (pinned project sketch) + 1–2 external (race pin → Strava, postcard → Colombia link) |
| Tool reel | Mostly external (logo → tool homepage) + 1 case-study per tool's matching project |
| Climbing wall | All case-study routes (each hold = one project) — risks K1 hero-zone violation (becomes navigation, not identity) |

---

**Section I summary:**

Six concept-native slates derived ground-up — none are F3-A's 9-object scatter rotated. **Concept choice determines identity register**: Pegboard / Shelf / Workbench / Trophy Wall pair with F3-A's personal-life identity claim; Tool Reel surfaces pro-toolkit identity; Climbing Wall surfaces project-timeline identity (borders K1 violation). Top-of-column gets identity weight per F-pattern (Climbing Wall is the metaphor-mismatch exception). Path 2 (vector) pairs particularly well with Trophy Wall + Pegboard at column scale. GF alt-POV inputs ranked higher for Shelf / Trophy Wall concepts than they did for F3-A. Easter-egg budget (site-wide max 6) is a cross-cell concern between F3-A and F3-B if both ship together.

### J. Page-entry intent findings

**§10 framework recap** (per `cross-system-rules.md` §10): Intent × Context = Behavior. Six dimensions shape behavior: Mode axis · Module job · Tier/state (intent dimensions) + Adjacent registers · Composition heaviness · Position in case study (context dimensions). Hero #8 introduces **page-entry intent** as a new dimension (intent #0 — hooking before §01 orients).

F3-A.md §J landed F3-A's page-entry intent statement as:
> *"F3-A's page-entry intent is **scattered authorship → focused work**. The desk surfaces identity through scattered hover-discoverable objects; the featured card below surfaces work as focused composition. The hand-off from scattered to focused IS the intent — it primes the reader that Sebs is the person who orchestrates this scatter into shipped work."*

**F3-B inherits NEITHER half of that statement.** Per the §C corrected framing + §E2 viewport-share invariant: F3-B's column does NOT scatter (vertical stack per concept), and the column does NOT hand off to work (column persists alongside work cards). Both halves of F3-A's statement are F3-A-specific. F3-B re-derives ground-up.

**J1. F3-B page-entry intent statements — one per candidate concept.**

Per §I1's finding that concept choice = identity register choice, each candidate concept implies a distinct intent statement:

| Concept | Page-entry intent statement (candidate for 8.1-B.2 lock + §14 cross-system addendum) |
|---|---|
| **Pegboard** | *"Tools beside work. The pegboard surfaces the toolkit Sebs builds with; the work column shows what was built. Co-anchored: who-with-what."* |
| **Display shelf** | *"Curation beside work. The shelf surfaces curated identity objects, each with a story; the work column surfaces the work itself. Identity and output coexist."* |
| **Workbench (side)** | *"Workspace alongside work. The side-profile desk IS the workspace Sebs works at; the cards beside it are the output. Closest to F3-A's intent register, but in coexisting form rather than handed-off form."* |
| **Trophy wall** | *"Memory beside work. The trophy wall surfaces pinned identity artifacts (past); the work column surfaces shipped projects (present). Memory anchors current."* |
| **Tool reel** | *"Capability shown WITH work. The reel surfaces the tools Sebs reaches for; the work column shows what those tools made. Identity = capability."* — DIFFERENT identity claim than the others. |
| **Climbing wall** | *"Path leading to work. The wall surfaces project history climbing up; the current work hangs at the top. Identity = trajectory."* — DIFFERENT identity claim; risks K1 violation. |

**Common kernel across F3-B intent statements**: "beside work" — coexisting-viewport invariant (§E2) baked into the intent. F3-A's "scattered → focused" is a HANDOFF; F3-B's "X beside work" is a COEXISTENCE. Geometrically faithful.

**J2. §10 framework trace for F3-B.**

| Dimension | F3-A (per F3-A.md §J table) | F3-B (re-derived) |
|---|---|---|
| **Mode axis (intent)** | "Pre-framing" — outside §01–§10 reading-mode arc; hooks before §01 orients. New mode added to Cycle 5's map. | **"Co-framing"** — also outside §01–§10 reading-mode arc, but coexists with work-column reads instead of preceding them. **F3-B introduces a SECOND new mode** to Cycle 5's framing/interpretation/proof/resolution map. |
| **Module job (intent)** | "Establish authorship before establishing project." | **"Establish authorship ALONGSIDE establishing project."** Different ordering — same content claim. |
| **Tier/state (intent)** | "Top tier of identity expression." Same as §01 Section eyebrow + Title cluster's importance, but at page-entry. | **Top tier of identity expression** — unchanged. F3-B's column carries equivalent identity weight, just via a different delivery mechanism. |
| **Adjacent registers (context)** | Above: Nav. Below: featured project card. Hand-off from scatter above → focus below IS the intent shift. | **Beside: featured project card.** Above: Nav. Hand-off is REPLACED by coexistence. The intent shift is from "identity-as-precursor" to "identity-as-co-anchor". |
| **Composition heaviness (context)** | 40–55vh, horizontal sweep, ≤9 objects laid across. Medium heaviness. | 280–380px wide × ~600px tall, vertical stack, 4–7 objects. **Lighter composition heaviness** per object slot than F3-A; but persists in viewport so accumulated weight may be similar over time. |
| **Position in case study (context)** | Outside case-study arc. | **Outside case-study arc + persists into case-study §01 if H2 persist option picked.** F3-B's continuity option (§H2) makes this dimension complicated — column may CROSS the page-entry → §01 boundary. |

**Critical finding — F3-B introduces TWO new §10 framework elements**:
1. **"Co-framing" mode** (new alongside F3-A's "Pre-framing")
2. **Cross-boundary continuity** if H2 persist option picked — first hero pattern that may EXTEND into the case-study reading-mode arc

Both go into the §14 cross-system addendum at 8.8 Hero #8 lock (per `cross-system-rules.md` §14 extension roadmap pre-stages Hero #8).

**J3. Brand DNA trace** (per `portfolio-style-art-voice-source.md` §§6–7 — distilled brand-direction claim).

> *"Premium-leaning with handmade underlayer · Cool on first read, warm on interaction"*

F3-A.md §J traced: "cool surface read = scattered-but-composed reads as restrained at first glance; warm-on-interaction = hover-discoverable objects reveal personal meaning on demand."

**F3-B trace differs subtly:**
- **Cool first read**: vertical stack of identity objects reads as restrained AT COLUMN SCALE — the geometry imposes its own discipline; the stack itself is the cool surface
- **Warm on interaction**: concept-native interactions (peg highlight, pin loosen, shelf glow, row expansion per §D3) deliver warmth on demand — same vector as F3-A
- **Sustained warmth via persistence**: F3-A's warmth was transient (scroll past the band and it's gone). F3-B's warmth PERSISTS — column stays in view; warmth is available throughout the page scan, not just during initial scan. **F3-B's warmth is sustained where F3-A's is transient.**

This is a meaningful brand-DNA difference. F3-B may read as MORE WARM than F3-A by sustained-availability, even if individual interactions are equivalent.

**J4. North-star mantra trace** (per `north-star-filter.md`).

> *"Structured enough to trust. Alive enough to feel authored."*

F3-A.md §J traced: "compositional rule + horizontal scatter discipline = structured-to-trust; hover-discoverability + handmade-line VARIANT = alive-to-feel-authored."

**F3-B trace:**
- **Structured to trust**: sticky-column persistence + vertical-stack discipline + concept-native form (pegboard / shelf / wall) ALL convey structural intention. F3-B may be MORE structured than F3-A because the sticky persistence itself is a high-trust signal (predictability + persistence = trust).
- **Alive to feel authored**: concept-native interactions + scroll-linked choreography (where applicable) + hand-drawn VARIANT (deferred 8.1-B-VARIANT-handdrawn) all carry the authoring signal. Same vector as F3-A.

**F3-B may bias the mantra toward "structured" more than F3-A does.** Risk: tipping toward "premium but lifeless" (north-star anti-list) if the structure dominates. Mitigation: concept-native interactions must remain ALIVE — not lapsing into "sticky sidebar = nav chrome" register (the trap §B5 documented portfolio sticky-asides fall into).

**J5. Convergence / divergence vs locked systems.**

F3-A.md §J landed: "F3-A is a path C convergence at the page-entry layer. The locked Type / Color / Spacing systems all apply convergently (no register surgery needed). The new intent dimension (page-entry) is a §10 framework expansion at 8.8 lock — Path C surgical revision to `cross-system-rules.md` §10."

**F3-B's convergence/divergence is more complex than F3-A's:**

- **Type / Color / Spacing**: all apply convergently (no surgery). Same as F3-A.
- **§10 framework**: F3-B adds TWO new elements (co-framing mode + cross-boundary continuity option) — **larger §14 addendum than F3-A's single page-entry addition.**
- **CSML M1 (case-study §01)**: F3-B's H2 persist option, if picked, forces CSML M1 lock revision = Path A surgical revision, NOT just §10 expansion. This is the cross-system flag from §H4.
- **Navigation system**: F3-B's column persistence may interact with locked Nav rail-padding patterns. Audit needed at 8.8 if H2 picked.

**Verdict**: F3-B is Path C convergence at the type/color/spacing layer (clean), Path A revision at the CSML M1 layer (if H2 picked), §14 expansion at the §10-framework layer (regardless of H2 pick). **Larger cross-system footprint than F3-A.** This is a real cost of F3-B's stronger continuity affordances — H2 isn't free.

**J6. Anti-drift for J.**

F3-A.md §J anti-drift: "do NOT bleed case-study reading-mode intent vocabulary backward into the page-entry layer." F3-B re-articulates:

- Do NOT silently let F3-B's column inherit CSML §01's eyebrow + title register grammar at column scale. F3-B's column register is its own thing.
- If H2 persist picked, the column INTO case-study §01 is a CSML LOCK REVISION not a register inheritance — the column register stays F3-B's; M1 changes to accommodate.
- Do NOT let the "co-framing" mode label compress to "the same as F3-A's pre-framing but I forgot the prefix" — co-framing introduces coexistence semantics that pre-framing does NOT have. Different mode, not a synonym.

---

**Section J summary:**

F3-B's page-entry intent statement is concept-dependent (6 candidates from §I1 carry to J1 as intent statements). Common kernel across all: "X beside work" — coexistence replaces F3-A's "scatter → focus" handoff. **F3-B introduces TWO new §10 framework elements**: co-framing mode + cross-boundary continuity option (if H2 picked). **F3-B's warmth is SUSTAINED (persists in view) where F3-A's was transient.** **F3-B may bias toward "structured" more than F3-A, requiring concept-native interaction craft to keep it "alive."** F3-B has a **larger cross-system footprint than F3-A** — Path C convergence at type/color/spacing, §14 expansion at §10-framework (always), Path A revision at CSML M1 (if H2 persist picked).

### K. Anti-drift findings

K1–K8 were framed at the top of this doc as scope-setting anti-drift principles. This section tests each against what sections C–J surfaced and adds findings.

**K1. Hero zone boundary — TEST RESULTS.**

Principle: F3-B must NOT become a navigation panel, a TOC, or a sticky CTA stack. Hero zone, not chrome.

**Per-concept verdicts:**

| Concept | K1 verdict | Why |
|---|---|---|
| Pegboard | ✅ Clean | Tools-as-identity, not tools-as-nav |
| Display shelf | ✅ Clean | Curation-as-identity, not browse-chrome |
| Workbench (side) | ✅ Clean | Workspace-as-identity, geometrically distinct from nav |
| Trophy wall | ✅ Clean | Memorabilia-as-identity, narrative-bearing |
| Tool reel | ⚠️ Borderline | "Tools Sebs reaches for" can read as "my software stack page" — borders showcase territory. Mitigation: each tool surface = a project link, not just a logo display |
| **Climbing wall** | ❌ **Documented K1 violation risk** (§I1) | Project-history-climbing-up = navigation/TOC. The metaphor itself surfaces work, not identity. **Strongest K1 risk in the F3-B concept space.** |

**Composition pass (8.1-B.2) flag**: if Climbing Wall is picked, must do additional anti-drift work to keep it identity-bearing not nav-bearing. Otherwise prefer one of the four ✅ concepts.

**K2. Rule-breaking composition (composed messy, not actually messy) — TEST RESULTS.**

Principle: F3-B's column messiness emerges from compositional tension, not from random arrangement. Per-concept mess rules:

- **Pegboard**: peg positions intentional (not random); tool angles within sanctioned range (e.g., -5° to +5°); peg layout asymmetric BUT geometric. Composed messy = workshop-handled, not chaos.
- **Display shelf**: shelf heights vary intentionally (rhythm); object placement on each shelf intentional. NOT randomly-rotated objects.
- **Workbench (side)**: items rest on desk in deliberate spatial composition; no random scatter.
- **Trophy wall**: pin positions, tilt angles, item sizes all intentional. Composed-collage register; not actually-thrown-up.
- **Tool reel**: rotation cadence intentional; not random ticks.
- **Climbing wall**: hold positions follow a deliberate path; not scattered random holds.

**Anti-failure** (carries from F3-A.md K2): a procedurally-shuffled column that re-shuffles per page load reads as gimmick. **Lock the composition per concept; the messiness is in the locked composition, not in the randomization.**

**K3. North-star anti-list applied to F3-B — TEST RESULTS.**

Per `north-star-filter.md` "Kill it if it feels:" list, tested against F3-B findings:

| Anti-list item | F3-B failure mode |
|---|---|
| "Cool but less clear" | Column objects with unclear meaning fail — 5-second hover-readability rule per concept |
| "Expressive but ungoverned" | Scroll-linked Tool Reel without bounds fails; sticky column without §G1 reduced-motion respect fails |
| **"Premium but lifeless"** | **§J4 flagged risk: F3-B biases more structured than F3-A. Mitigation requires concept-native interaction craft.** Hand-feel VARIANT (deferred 8.1-B-VARIANT-handdrawn) carries countermeasure as it did for F3-A. |
| "Handmade but messy" | See K2 — composed messy passes; actual mess fails. |
| "Experimental but unbounded" | H2 persist option without CSML coordination = unbounded experiment. Outcome protocol Path A/B/C bounds it. |
| "Dense and muddy" | 7-row column at small row register = density risk. Mitigation: per-concept row-register choice + invisible-hit-volume padding. |
| **"Obviously borrowed from someone else's portfolio language"** | **§B5 flagged: portfolio sticky-asides exist as nav chrome (Shapeshyft / Hanaoka / La Playa / Spielmann). F3-B as identity-bearing column is uncommon.** Pegboard / Trophy Wall / Climbing Wall concepts each have real-world precedent OUTSIDE portfolio language (workshops, curio cabinets, climbing gyms) — borrowing FROM real-world workspaces, not from someone else's portfolio. Tool Reel comes closest to portfolio-language borrowing (skills carousel). |
| "Interactive without purpose" | Per K4 — per-object purpose carries. |
| "Decorative before structural" | Column scene must structure page-entry intent (per §J1 statements) before decorating it. |

**K4. The "cool toys" trap revisited — TEST RESULTS.**

Per F3-A.md K4 + §I5 per-object purpose mapping: every column object must resolve into meaning on interaction. Cross-cell easter-egg budget concern (§I5) carries.

**F3-B-specific: column persistence amplifies the trap.** Since the column STAYS in view longer than F3-A's band, decorative objects have more time to read as decorative. **Composition pass must verify each object's purpose is interaction-discoverable WITHIN a reasonable hover-time (max 1.5s tooltip-reveal delay).**

**K5. Ground-up-per-layout invariant — TEST RESULTS.**

Tested across the entire research pass:
- ✅ §C corrected framing (6 concepts derived ground-up, not F3-A scatter rotated)
- ✅ §I object slates derived per concept (not F3-A's 9 mechanical-carried)
- ✅ §J intent statements derived per concept (not F3-A's "scatter → focus" recycled)
- ⚠️ Memory created during research: `feedback_ground_up_means_concept_not_just_layout` (2026-05-29) — flags the slippage that happened during early-draft §C5 work; safeguard going forward.

**K6. Viewport-sharing invariant (replaces F3-A K6 independent-containers) — TEST RESULTS.**

Articulated in §E2 with 4 subcomponents (a–d). Tested against the 6 concepts in §E6:
- ✅ Pegboard / Trophy Wall / Climbing Wall — clean fit
- ⚠️ Display Shelf — needs constraint on pull-out animation extent
- ⚠️ Side-Profile Workbench — camera-rotation taming required
- ⚠️ Tool Reel — scroll-coordination calibration load-bearing

Composition pass (8.1-B.2) must address the ⚠️ items as design constraints.

**K7. Per-cell continuity addressability — TEST RESULTS.**

§H articulated three proposals: no-continuity, text-morph, column-persists-§01-only.

- **Continuity addressability requirement met**: F3-B has three defensible continuity options on the table.
- **Cross-system flag**: H2 persist option requires CSML M1 lock revision — escalation to Hero #8 → CSML coordination at 8.8 lock, NOT an F3-B unilateral call.
- **Composition pass deliverable**: pick ONE of three; flag cross-system escalation if H2 picked.

**K8. No-rotation-drift reviewer test — TEST RESULTS.**

Principle: F3-B compositions must NOT silently rotate F3-A's scatter into a vertical column. Reviewer test: ask whether the composition could have been derived independently from "F3 family in vertical-column geometry"; if "no, it's F3-A rotated," it's drift.

**Test results:**
- ✅ All 6 §C3 concepts pass — none are scatter rotated; each is a real-world vertical-workspace metaphor
- ⚠️ Side-Profile Workbench is the CLOSEST to F3-A's concept (same desk subject, different camera) — passes the test because the camera change is fundamental, but reviewer should re-verify at 8.1-B.2 lock
- ✅ Per-concept object slates (§I1) all derived per concept-native form, not from F3-A's 9-object list

**Memory invoked**: `feedback_ground_up_means_concept_not_just_layout` is now a standing reviewer safeguard for all future ground-up cells.

---

**K9 — NEW: Cross-system cost transparency (added 2026-05-29).**

F3-B's stronger continuity affordances (§H) come with cross-system cost. Anti-drift rule:

- F3-B persist option (H2) MUST NOT be silently picked without escalation. CSML M1 lock revision = cross-system Path A/B/C decision per `cross-system-rules.md` §12 outcome protocol.
- §10 framework expansion (J2 — "co-framing" mode + cross-boundary continuity) MUST be documented in the §14 cross-system addendum at 8.8 Hero #8 lock.
- Composition pass MUST flag the cross-system footprint as a deliverable, not hide it.

**Anti-failure**: shipping F3-B persist option in the lab without flagging the CSML M1 reopen requirement is a silent cross-system overreach. Forbidden.

**K10 — NEW: Identity register fidelity (added 2026-05-29).**

§I1 finding: concept choice = identity register choice. Anti-drift rule:

- If F3-B is meant to claim PERSONAL-LIFE identity (matching F3-A), only Pegboard / Shelf / Workbench / Trophy Wall qualify.
- Tool Reel and Climbing Wall claim DIFFERENT identity types (pro-toolkit, project-timeline). Both legitimate but represent a positioning SHIFT vs F3-A.
- Composition pass MUST make the identity claim explicit when picking the concept. Not "we picked Tool Reel because it looks cool" — but "we picked Tool Reel because we're claiming pro-toolkit identity here, which is a positioning shift."
- Family A vs Family B decision at homepage-final-lock should consider identity-register coherence: F3-A + F3-B claim should align (both personal-life), or the shift must be deliberate.

**Anti-failure**: picking a concept for visual / interaction reasons without confronting the identity-register implication. Forbidden.

---

**Section K summary:**

K1–K8 tested with mostly clean results. **Climbing Wall has documented K1 violation risk** (project-history-as-nav, not identity). **Side-Profile Workbench has highest K8 (rotation drift) risk** because it shares F3-A's desk subject — reviewer should re-verify at 8.1-B.2. **Two NEW anti-drift rules** added from research findings: **K9 cross-system cost transparency** (H2 persist requires escalation) and **K10 identity register fidelity** (concept = identity claim; positioning shift must be explicit). Composition pass (8.1-B.2) has clear flags to address.

---

## 8.1-B.1 close-out summary

**Status as of 2026-05-29:** all 11 research sections populated (A–K). Findings, citations, and per-concept analysis support 6 candidate concepts × 2 rendering paths × 3 continuity options for 8.1-B.2 composition proposal.

**Headline findings:**
- §A: rendering tech has two viable defaults — R3F + StickyScrollScene (Path 1) and SVG + GSAP (Path 2); both build as sibling F3-B variants per user direction 2026-05-29
- §B: Pudding sticky+steps is canonical precedent for Path 2; 3D-in-sticky-column is novel geometry (Path 1)
- §C: 6 ground-up concepts derived (pegboard / shelf / side-profile / trophy wall / tool reel / climbing wall) — NOT F3-A scatter rotated
- §D: interaction = downstream of concept; row-expansion tooltip strategy; scroll-linked unique to F3-B
- §E: viewport-share invariant REPLACES F3-A's K6; F-pattern privileges F3-B's left column
- §F: persistent-canvas GPU memory is NEW concern for Path 1; Path 2 dramatically lighter on all axes
- §G: `prefers-reduced-motion` + sticky introduces NEW concern; tab order works naturally; mobile = stack-above
- §H: F3-B's continuity options are GENUINELY STRONGER than F3-A's; H2 persist forces CSML M1 cross-system revision
- §I: 6 concept-native slates derived; concept = identity register; Path 2 pairs particularly well with Trophy Wall + Pegboard
- §J: 6 intent statement candidates; F3-B introduces TWO new §10 framework elements; warmth SUSTAINED vs F3-A's TRANSIENT; larger cross-system footprint
- §K: 8 anti-drift principles + 2 NEW principles (K9 cross-system transparency, K10 identity register fidelity)

**Open for 8.1-B.2 composition proposal:**
- Concept × signature × identity-register × continuity × rendering path = the pick set (composition pass picks each axis)
- Cross-system flags: §10 framework expansion (always); CSML M1 revision (if H2); easter-egg cross-cell budget (if F3-A + F3-B ship together)

**Standing by for 8.1-B.2 composition proposal authorization.**

---

## 8.1-B.2 composition proposal

**Status:** Opened 2026-05-29 after 8.1-B.1 research close-out. Still docs-only. NO code. NO concept LOCK — defaults lean per research; user picks at 8.1-B.3 review. Two rendering paths build as sibling F3-B variants per user direction 2026-05-29.

**Framing**: this proposal locks the **default lean** for each F3-B decision and names the **toggle inventory** that will be wired into Hero8Shell chrome at 8.1-B.4 build. Variant toggles for "which concept / which treatment / which path"; on/off toggles for "include or not." Matches LabShell convention from F3-A.md §8.1-A.2.

---

### Concept pick — primary default lean

Per `feedback_decision_discipline`, enumerated 6 candidates from §C3 with evaluation across §B–§K criteria. Scoring table:

| Concept | K1 (hero boundary) | K8 (rotation drift) | Path 1 (3D) fit | Path 2 (SVG) fit | Identity register | Viewport-share (§E6) | Continuity affordance (§H) | B-precedent grounding |
|---|---|---|---|---|---|---|---|---|
| **Trophy Wall** | ✅ Clean | ✅ Clean | Medium | **Strongest** | Personal-life ✅ | ✅ Clean | Morph + Persist available | Real-world precedent (pinboards / curio cabinets) |
| **Pegboard** | ✅ Clean | ✅ Clean | Strong | **Strong** | Personal-life ✅ | ✅ Clean | Morph + Persist available | Real-world precedent (workshop walls) |
| Display shelf | ✅ Clean | ✅ Clean | Medium | Medium | Personal-life ✅ | ⚠️ Pull-out constraint | Morph + Persist available | Real-world precedent (curio shelf) |
| Workbench (side) | ✅ Clean | ⚠️ Highest drift risk | Hardest | Medium | Personal-life ✅ | ⚠️ Camera-rotation taming | Morph available | Real-world precedent (side-view desk) |
| Tool reel | ⚠️ Borderline showcase | ✅ Clean | Specific | Strong | **Pro-toolkit** (positioning shift) | ⚠️ Scroll-coordination | Morph weaker (no fixed elements) | Closer to portfolio-language borrow |
| Climbing wall | ❌ **K1 violation risk** | ✅ Clean | Medium | Medium | **Project-timeline** (positioning shift, near nav) | ✅ Clean | Morph weaker (no per-row text mapping) | Real-world precedent (climbing gym) |

**Primary default lean: TROPHY WALL.**

Rationale:
- **Strongest Path 2 (SVG) fit** — pinboard / collage register pairs natively with line-illustration + watercolor wash + hand-drawn pins (per §I3)
- **Clean K1 + K8** — identity-bearing, not navigation; no F3-A rotation
- **Personal-life identity register** — matches F3-A's claim; no positioning shift
- **Strongest continuity narrative** for the morph option (§H1) — pinned items have eyebrow + title pairings that morph cleanly to CSML M1's eyebrow + title
- **B-precedent grounding** — pinboards and curio displays are real-world objects, not borrowed portfolio language
- **Story-bearing register** — each pinned item has a hover-revealed story (per §D3 row-expansion); leans into F3-B's sustained-warmth advantage (§J3)
- **Survives all 10 anti-drift principles** (§K test results)

**Strong runner-up: PEGBOARD.** Strongest Path 1 (3D) fit if the user prefers a workshop register over a memorabilia register. Toggle exposes both for live A/B at 8.1-B.4 walkthrough.

---

### Default lean (the "set" that ships first at 8.1-B.4 build)

When the user first loads `/hero-8/f3/b/v1` in the lab after 8.1-B.4 build, this is what they see before touching any toggle:

| Decision | Default | Cited from |
|---|---|---|
| **Concept** | Trophy Wall | §I1 + scoring table above |
| **Identity register** | Personal-life (matches F3-A) | §I1, §J1, §K10 |
| **Rendering path default** | Path 2 (SVG / vector) — strongest Trophy Wall fit | §A + §F (Path 2 dramatically lighter for column scale + Trophy Wall pinboard register favors line illustration) |
| **Rendering path toggle** | Path 1 (R3F StickyScrollScene) live alongside | User direction 2026-05-29 (both paths build as siblings) |
| **Object slate** | (1) Framed Elara sketch · (2) Pinned love letter · (3) Pinned Polaroid (GF) · (4) Running pin/medal · (5) Postcard from Colombia · (6) Pokémon trading card pinned · (7) Boarding pass / ticket stub | §I1 Trophy Wall slate |
| **Object arrangement** | Vertical stack, top-to-bottom; pin tilt within -8° to +8°; composed messy per §K2 | §C4 + §K2 |
| **Interaction model** | Click hotspots + row-expansion tooltip on hover; pin "loosens" with slight tilt animation on hover | §D1 + §D3 Trophy Wall row |
| **Signature interaction** | Pin loosen + click → take-down → modal showing artifact + handwritten caption | §D5 Trophy Wall row |
| **Sticky offset** | `top: 32` (Hero8Shell chrome height; lower than LabShell's 96) | §E4 |
| **Stack ordering** | Order C: scene (wall) first, eyebrow + title below | §E5 (matches aninguyenle pattern) |
| **Viewport-share** | Column persists alongside work cards for full scroll; coexistence is geometric ground truth | §E2 invariant |
| **Title copy** | "Sebastian Moncada · Product designer working at the seam between tools and teams." (carries from existing `IdentityAside`) | §E1 baseline |
| **CS-hero continuity** | Text morph (H1) — eyebrow + title morph at homepage → case-study transition; wall scene fades out | §H5 (does not force CSML M1 lock revision; uses F3-B's morph advantage honestly) |
| **Entrance choreography** | Cascade-reveal on entrance: each pin arrives stagger 100ms top-to-bottom via IntersectionObserver | §D2 default |
| **Scroll-linked behavior** | None (cascade entrance only) | §D2 default for Trophy Wall |
| **Performance — Path 1** | ≤30k tris total · `frameloop="demand"` + `useInView` pause · `dispose()` on unmount · KTX2 textures · pixel ratio clamp `Math.min(devicePixelRatio, 2)` · no post-processing beyond outline | §F2 |
| **Performance — Path 2** | ≤100 SVG paths total · transform + opacity animations only (GPU-accelerated) · IntersectionObserver-gated · SVGO-optimized | §F3 |
| **Fallback ladder** | drei `<PerformanceMonitor>` bounds [30, 500]: Path 1 onDecline → drop DPR + disable outline → second decline → swap Path 1 canvas for Path 2 SVG (cross-path degrade, unique to F3-B) → final → static poster | §F6 |
| **Mobile fallback** | Stack above content at viewport width <768px; sticky disabled | §G3 |
| **A11y** | Proxy-DOM mirror — hidden focusable `<button>` per pin row; skip link to work column at top of page; `role="application"` on Path 1 canvas; `aria-label` per pin; focus indicator: pin glow + 1.5× outline | §G2 + §D6 |
| **`prefers-reduced-motion`** | Keep sticky behavior; disable cascade-reveal + pin-loosen animation + scroll-linked motion. Option B per §G1. | §G1 |

---

### Toggle inventory (what gets wired into Hero8Shell chrome at 8.1-B.4 build)

All toggles match the Hero8Shell `Dropdown` chrome pattern. Each toggle's default value matches the lean above.

#### Variant toggles (pick-one selection)

| Toggle | Options | Lean | Why a toggle |
|---|---|---|---|
| **Rendering path** | Path 1 (R3F 3D) · Path 2 (SVG vector) | Path 2 | User direction 2026-05-29: both paths build; toggle exposes A/B |
| **Concept** | Trophy Wall · Pegboard · Display Shelf · Side-Profile Workbench · Tool Reel · Climbing Wall | Trophy Wall | §C3 — full concept space; user evaluates live |
| **Object style — Path 1** | Toon-shaded + outline · Flat low-poly · Hatched-3D | Toon-shaded + outline | §I3 |
| **Object style — Path 2** | Line + watercolor wash · Line only · Filled solid · Hand-drawn rough | Line + watercolor wash | §I3 Trophy Wall row |
| **Tilt-angle range (pin/object)** | Tight (-3° to +3°) · Medium (-8° to +8°) · Wide (-15° to +15°) | Medium | §K2 |
| **Hover treatment** | Pin loosen only · Row glow only · Pin loosen + Row glow + Row expansion | Pin loosen + Row glow + Row expansion | §D3 Trophy Wall row |
| **Entrance stagger** | Off · Subtle (60ms) · Medium (100ms) · Pronounced (200ms) | Medium | §D2 |
| **Sticky offset** | 0px · 16px · 32px · 64px · 96px | 32 | §E4 |
| **Stack ordering** | A (text → scene) · B (text-scene-body) · C (scene first then identity) · D (co-anchored) | C | §E5 |
| **CS-hero continuity** | No-continuity · Text morph · Column-persists-§01-only | Text morph | §H5 |
| **Mobile breakpoint** | 640px · 768px · 1024px | 768 | §G3 |
| **Reduced-motion sticky behavior** | Keep sticky, disable animation (B) · Disable sticky entirely (A) | Keep sticky disable animation | §G1 |
| **Title copy** | Current ("Product designer working at the seam between tools and teams.") · Alt 1 ("Designing where teams meet tools.") · Alt 2 ("Building tool-and-team systems that ship.") | Current | §E1 baseline |

#### Per-object on/off toggles (one per pin)

Each of the 7 Trophy Wall pins gets its own on/off toggle so individual pins can be A/B'd or temporarily hidden:

`pin.framedElaraSketch` · `pin.loveLetter` · `pin.polaroidGF` · `pin.runningPin` · `pin.postcardColombia` · `pin.pokemonCard` · `pin.boardingPass`

Default: all on. Off-state removes the pin from the wall (column reflows, other pins redistribute).

#### Per-object purpose toggle (§K4 deliverable — what each pin DOES on click)

| Pin | Click action options | Default |
|---|---|---|
| **Framed Elara sketch** | Case-study (Elara) · About anchor (Process) · Easter-egg (sketch reveal) | Case-study (Elara) |
| **Pinned love letter** | Easter-egg (caption "for her") · About anchor (Personal) · External | Easter-egg |
| **Pinned Polaroid (GF)** | Easter-egg (caption + alt views) · About anchor (Personal) · External | Easter-egg |
| **Running pin / medal** | External (Strava) · About anchor (Discipline) · Easter-egg (race result reveal) | External (Strava) |
| **Postcard from Colombia** | About anchor (Roots) · Easter-egg (place reveal) · External (Colombian culture link) | About anchor (Roots) |
| **Pokémon trading card** | Easter-egg (caption "inner child") · About anchor (Inner child) · External | Easter-egg |
| **Boarding pass** | Easter-egg (trip reveal) · About anchor (Travel) · External | Easter-egg |

All click actions match `portfolio-style-art-voice-source.md §3.9` easter-egg budget (max 6 site-wide, max 3 per page). F3-B's 5 easter-egg slots + 1 about anchor + 1 case-study + 1 external = 8 click affordances · 5 easter eggs (within page budget).

**§I5 cross-cell concern flagged**: if F3-A and F3-B both ship together, combined easter-egg count would be F3-A's 5 + F3-B's 5 = 10, exceeding the site-wide 6 cap. Resolution deferred to 8.5/8.8 implementation handoff. Options: (a) F3-A and F3-B share easter-egg objects; (b) one layout's easter-eggs reassign to non-easter actions when the other layout is active.

#### On/off toggles (auxiliary)

| Toggle | Default | Notes |
|---|---|---|
| Row expansion tooltip | On | §D1 default; off-state falls back to row-anchored tooltip |
| Outline pass (Path 1 only) | On | §I3 Trophy Wall row |
| Watercolor wash (Path 2 only) | On (Subtle) | §I3 |
| Cascade-reveal on entrance | On | §D2 |
| Adjacent-hover dim | On | Sibling pins dim when one is hovered |
| Grain mask across column | Off (default) · subtle alt | §B2 Tammy steal — Trophy Wall texture |
| Page-chrome reduce-motion toggle | On | User-controlled kill switch independent of OS preference |
| Skip-link visible-on-focus | On | §G2 WCAG required |

---

### Deferred VARIANT passes (separate research + build · not toggles in this cell)

| Variant pass | When it opens | Scope |
|---|---|---|
| **8.1-B-VARIANT-handdrawn** | After F3-B default lands + Sebs review | Hand-drawn line aesthetic using `lib/handFeel.ts` family · could replace the watercolor wash treatment with rough.js-style hand stroke · mirror of F3-A's deferred variant |
| **8.1-B-VARIANT-pegboard** | If user picks Pegboard as runner-up alternative | Pegboard concept as full alternate render path; not just a stylization variant |
| **8.1-B-VARIANT-scroll-driven-reel** | If composition pass surfaces strong scroll-driven affordance with the Trophy Wall concept | Tool Reel mechanic adapted onto Trophy Wall (pins rotate / refresh as work-column scrolls) — uses F3-B's unique scroll-linked affordance §D2 |

---

### F3-B composition geometry — text mockup

A schematic of the lean composition (text-only; visual mockup at 8.1-B.4 build):

```
┌─ HERO8SHELL CHROME (3 rows) ────────────────────────────────────────────┐
├─ FAMILY B GRID — 5fr / 9fr / 48px gap ──────────────────────────────────┤
│                                                                          │
│ ┌─ IDENTITY COLUMN ──┐  ┌─ WORK COLUMN ────────────────────────────────┐ │
│ │  STICKY top: 32    │  │  NATURAL FLOW                                │ │
│ │                    │  │                                              │ │
│ │ ┌─ TROPHY WALL ──┐ │  │ ┌────────────────────────────────────────┐ │ │
│ │ │ ❒ Elara sketch │ │  │ │ FEATURED PROJECT CARD (Ion)            │ │ │
│ │ │ ❒ Love letter  │ │  │ │   T8-S4 tile · compact · narrow-4 reg  │ │ │
│ │ │ ❒ GF Polaroid  │ │  │ └────────────────────────────────────────┘ │ │
│ │ │ ❒ Running pin  │ │  │ ┌─────────────┐ ┌─────────────┐            │ │
│ │ │ ❒ Postcard CO  │ │  │ │ std 1       │ │ std 2       │            │ │
│ │ │ ❒ Pokémon card │ │  │ └─────────────┘ └─────────────┘            │ │
│ │ │ ❒ Boarding ps  │ │  │ ┌─────────────┐ ┌─────────────┐            │ │
│ │ └────────────────┘ │  │ │ std 3       │ │ std 4       │            │ │
│ │                    │  │ └─────────────┘ └─────────────┘            │ │
│ │ Sebastian Moncada  │  │                                              │ │
│ │ Product designer.. │  │                                              │ │
│ │ [body description] │  │                                              │ │
│ └────────────────────┘  └──────────────────────────────────────────────┘ │
│   ↑ COLUMN PERSISTS ALONGSIDE CARDS                                      │
│   ↑ ON SCROLL, COLUMN STAYS · CARDS SCROLL                               │
└──────────────────────────────────────────────────────────────────────────┘
```

- Stack ordering C: scene (wall) first at top, eyebrow / title / body below
- Each pin row expands rightward into the column gutter on hover (per §D1 row-expansion)
- Pin click triggers "take-down" modal showing artifact + handwritten caption
- Cascade-reveal: pins stagger-arrive on first page-entry from top to bottom
- Mobile (<768px): column stacks above cards as a once-at-top content block; sticky disabled

---

### Anti-drift checklist applied to this composition

| Anti-drift | Composition status |
|---|---|
| **K1 — hero zone boundary** | ✅ Trophy Wall is identity-bearing memorabilia, not navigation. Every pin resolves to per-object purpose (§I5 mapping above). |
| **K2 — composed messy not actually messy** | ✅ Pin positions + tilt angles locked in code; tilt range bounded (-8° to +8° default · toggle exposes others). No procedural shuffle. |
| **K3 — north-star anti-list** | ✅ Per-object meaning (per-object purpose); pin loosen + row expansion (governed interaction); kill-switch ladder bounds rendering; hand-drawn VARIANT (8.1-B-VARIANT-handdrawn) addresses "premium but lifeless" risk; Trophy Wall borrows from real-world pinboards not portfolio language. |
| **K4 — cool-toys trap** | ✅ Per-object purpose toggle deliberately maps each pin to case-study OR about OR external OR easter-egg. No decorative-only pins. |
| **K5 — ground-up per layout** | ✅ Trophy Wall concept derived for vertical column geometry, not F3-A's scatter rotated. |
| **K6 — viewport-sharing invariant** | ✅ Column + cards coexist; pin row-expansion stays within column gutter (per §E6 Trophy Wall row clean fit). |
| **K7 — continuity addressability** | ✅ Three proposals carried; default = Text morph (H1) — uses F3-B's morph advantage without forcing CSML M1 lock revision. |
| **K8 — no rotation drift** | ✅ Trophy Wall passes reviewer test — could have been derived independently from "F3 family on vertical column" without F3-A reference. |
| **K9 — cross-system cost transparency** | ✅ Text-morph default avoids CSML M1 reopen. If user later picks Column-persists-§01-only at toggle, escalation flag fires. |
| **K10 — identity register fidelity** | ✅ Trophy Wall = personal-life identity register, matching F3-A's claim. No positioning shift; no register drift. |

---

### Open questions for 8.1-B.3 review

| # | Question | Composition pass position |
|---|---|---|
| 1 | Concept primary lean | Trophy Wall (strongest evaluation). User can switch live to Pegboard / Shelf / Workbench / Tool Reel / Climbing Wall via toggle. |
| 2 | Rendering path default | Path 2 (SVG). User can switch to Path 1 (3D) via toggle. Both ship as siblings. |
| 3 | Per-pin click destinations | Defaults proposed in §I5 mapping above (Elara case-study · Strava external · roots about · others easter-egg). User picks live at 8.1-B.4 walkthrough. |
| 4 | Tilt range | Medium default (-8° to +8°). Toggle exposes Tight / Wide alternatives. |
| 5 | CS-hero continuity | Text morph default. Toggle exposes No-continuity and Column-persists-§01-only (latter requires cross-system escalation per K9). |
| 6 | Title copy | Current ("Product designer working at the seam…") retained as default. Toggle exposes 2 alternates. |

---

### What 8.1-B.2 does NOT do

- Does not write any code (`.tsx` / `.ts` / `.css` / routes).
- Does not pick the final answers for the variant toggles — those reveal themselves after the build is walkable.
- Does not commit to assets — 8.1-B.4 build starts with placeholder geometry (Path 1 = primitive low-poly proxies; Path 2 = placeholder SVG paths from Quiver / Gemini / ChatGPT image 2 per `reference_vector_asset_tools`).
- Does not modify `cross-system-rules.md` §10 — that addendum lands at 8.8 Hero #8 lock with both F3-A and F3-B contributions.
- Does not escalate H2 persist option — it's on the toggle but flagged for user-initiated escalation if the picked-live default.

---

### Handoff to 8.1-B.3 review

Sebs reviews this composition proposal. Possible outcomes:
- **Approve as written** → 8.1-B.4 build opens with Trophy Wall × Path 2 default + all toggles wired
- **Adjust + approve** → updates merge into this section · 8.1-B.4 opens
- **Reject + redirect** → revisit 8.1-B.1 research scope OR pick a different concept as the primary lean

Standing by for review.

---

## 8.1-B.3 user review notes

*Populated during user review of 8.1-B.2 composition proposal.*

---

## 8.1-B.4 build trace

*Populated after build (Step 8.1-B.4 — not yet authorized; opens after 8.1-B.3 approval).*

---

## Pipeline reference (shared with F3-A)

F3-A.md §L documents the Claude-native 3D tooling pipeline (Anthropic Blender MCP connector · Tripo 3D · Meshy · BlenderKit · Dream Textures · basementstudio/mcp-three · R3F skills stack · style adaptation PBR → toon + outline). **This pipeline is shared infrastructure between F3-A and F3-B.** Per-object choices within F3-B are ground-up; the tools that produce assets are not.
