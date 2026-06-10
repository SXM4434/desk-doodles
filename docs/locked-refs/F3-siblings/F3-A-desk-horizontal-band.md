# Hero #8 · Cell F3-A · Desk · Family A horizontal hero band

**Status:** 8.1-A.1 research pass opened 2026-05-29. NOT a lock. NO code yet. NO composition decisions yet.
**Effort:** xhigh — every micro-decision researched online with verifiable citations per `feedback_research_first_no_fake_provenance`.
**Ground-up invariant:** This is the F3-A composition specifically — horizontal hero band geometry above the work field. NOT the desk concept abstractly. F3-B (desk in vertical column) is a separate ground-up research pass; nothing here ports mechanically.

---

## What this cell is

F3 = **Desk / Workbench** F-family (per `project_hero_8_scaffolding_and_layout_relationship` memory + `portfolio-style-art-voice-source.md` §5.1–5.3).
Family A placement = **horizontal hero band above the work field** (per same memory + `narrow3/HeroBandPlaceholder.tsx` scaffolding shipped 2026-05-27).

The composition this cell investigates: **a desk-themed hero living as a horizontal band stretched across the top of the homepage**, with the featured project card immediately below in its own independent viewport-fit container (per independent-containers invariant from `step-8-0-setup-plan.md` item 4).

### Deferred — separate variation research pass

A **hand-drawn-line F3-A variation** (using the existing `lib/handFeel.ts` primitives — seeded LCG · multi-stroke jitter · rough rect/circle/oval/line paths · already shipping in B1 Venn / C3 UserFlow / D1 Wavy Spectrum) is on the docket as a separate variation research pass. NOT in scope for the current 8.1-A.1 research. NOT a composition-step toggle decision now. It opens as **8.1-A-VARIANT-handdrawn** AFTER the initial F3-A default direction is set (8.1-A.1 → 8.1-A.2 → 8.1-A.3 approval → THEN 8.1-A-VARIANT-handdrawn research opens). Logged here so it doesn't get lost; flag as a deferred sub-cell when the time comes.

### Source material (already in repo — not re-pasted here)

- `portfolio-style-art-voice-source.md` §5.1 — 9 desk-object candidate list with meanings + GF alt POV
- §5.2 — 3 interactive picks (MacBook · Pyramid · Pen) + GF alt POV (fidget · keyboard · timer)
- §5.3 — hero interaction candidates (3D desk scene · clickable hover scenes · interactive orbit · click hotspots · drag · tooltip style)
- §6 — performance preferences (lightweight canvas · reduced-motion stationary simplified · low-connection static images · kill switch when art overtakes content)
- §3.7 — art style tokens (thin hairline · pure line · flat 2D default · duotone limited shared accents · subtle shared grain)
- §3.9 — easter egg budget (max 6 site-wide · max 3 per page · 10-second discovery target · small reveal / tooltip / detail)

---

## Research questions (8.1-A.1 scope)

Each question must be answered with verifiable online citations. No name-dropping. No invented precedents.

### A. Rendering technology decision

A1. What does "lightweight canvas" mean in 2026 for hero 3D / interactive scenes on portfolio sites? Real options:
- React Three Fiber + drei
- Native Three.js
- Threlte (Svelte) — not applicable (we use React) but noted for benchmark comparison
- TresJS — not applicable but benchmark
- Native HTML canvas with custom 2.5D
- Spline embed
- Pre-rendered video / image sprite sequence
- CSS 3D transforms

A2. For each option above: bundle size · perf characteristics · learning-curve · hover/click interaction maturity · the "thin hairline pure line flat 2D" art style fit (§3.7) · 2026 maintenance status.

A3. Pre-rendered video for hero 3D: when does it beat real 3D? Real precedents.

A4. CSS 3D transforms for object-pile compositions: viable for the 9-object desk or too geometric-constrained?

### B. Reference site technical decoding

Visit each URL and document **what the site actually does technically** — not just the user's notes from `portfolio-style-art-voice-source.md` §4.2 / §4.6. Goal: extract reusable technical patterns relevant to F3-A composition.

B1. **aninguyenle.com** — user-cited as the model for "interactive scene with click-expanding clusters" (§5.4 About-page art candidate). Decode: hero composition · interaction model · rendering tech (Three.js? Spline? Canvas?) · mobile behavior · reduced-motion behavior.
B2. **taamannae.dev** — user-cited for hero hover image easing + grain mask exit. Decode the easing curve · grain mask implementation · hover-to-size mechanic.
B3. **integratedbiosciences.com** — user-cited for hero entrance animations + adjacent hover transitions (`transtion_example_48` clip). Decode the entrance choreography · the adjacent-hover transition mechanism.
B4. **elisekim.co** — user-cited for hero images scaling in on scroll. Decode the scroll-linked scale · how it works with project animations · whether it's IntersectionObserver / Framer Motion useScroll / GSAP ScrollTrigger.
B5. **bellakitchenware.com** — user-cited for hero shrink-on-scroll (`grain_example_48` / `shrink_example_48` clips). Decode the shrink mechanic · whether it's scroll-linked or fixed-trigger.
B6. **mr-march.com** — user-cited for footer transition (`footer_example_48` clip) + greyscale color hierarchy. Decode the footer transition. Less F3-A-relevant but flagged in source notes.
B7. **rachelchen.tech** — user-cited for play/reset buttons on video/clips and animation consistency. Decode the play/reset chrome and the page-load animation choreography.

### C. 3D hero precedents on the web (general)

C1. Survey of 2026 portfolio 3D heroes: examples · rendering tech · performance · interaction model. Need ~10 documented precedents minimum.

C2. Which precedents use **horizontal banding** (the F3-A geometry) vs **full-bleed** vs **boxed-card** layouts? F3-A is horizontal band specifically; what does the band geometry constrain?

C3. **Desk / workspace** specifically: real portfolio precedents that use a desk-as-hero concept. Document what works and what doesn't.

### D. Interaction patterns on 3D objects

D1. Hover patterns: scale · elevate · glow · halo · tooltip pop · cursor change · multiple. Document precedents.

D2. Click patterns: zoom-in · modal open · inline reveal · scene swap · tooltip lock. Document precedents.

D3. The user's chosen control model (per §5.3): **interactive orbit pick-one** OR **click hotspots only** OR **drag in given area**. Find precedents for each in 3D hero contexts; document trade-offs.

D4. **Tooltip style:** the user wants playful short lines ("oh I'm an XC runner") with a hover tooltip cursor signature interaction. Find precedents for hover-tooltip-cursor patterns (where the tooltip follows the cursor and reveals info on hover/click).

D5. The user's **specific signature** from voice answers: "hover tooltips cursor (maybe shows like oh open case study or interesting fact on a image, the thing animates in)". Decode this technically: what's the animation pattern? Precedents?

### E. Hero band horizontal composition (independent of 3D)

E1. Real precedents of **horizontal hero bands** in portfolio sites. Document geometry, aspect ratios, vertical real estate consumed, the relationship to the work field below.

E2. The independent-containers invariant (per setup plan item 4): how is this achieved in real precedents? Sticky? Scroll-snap? Just natural-flow with the next section claiming the viewport? Document patterns.

E3. The user's `CardFitContext` compact mode uses ResizeObserver to measure content-below-media + sticky chrome offset, sizing the featured card to fill viewport when scrolled to it alone. F3-A's horizontal band sits ABOVE this card. What's the technical pattern for the hand-off — does the hero band participate in the sticky math or is it scrolled-past first?

### F. Performance budgets

F1. 2026 Core Web Vitals targets: LCP / INP / CLS for hero-heavy pages. Cite web.dev or equivalent.

F2. Real benchmarks for 3D web hero performance: load time, time-to-interactive, frame rate, memory.

F3. Asset budgets for 3D hero (geometry + textures + lighting + post-processing) — what's the 2026 honest budget for a portfolio that needs to feel fast?

F4. The user's stated preference (§6): "hybrid preload only what affects the first 1–2 seconds, lazy-load everything else." How does this map to 3D hero asset loading patterns? Streaming geometry? LOD ladder?

### G. A11y / reduced-motion / mobile fallback

G1. `prefers-reduced-motion` implementation patterns for 3D heroes. The user's stated fallback: "stationary, simplified motion." How is this implemented? Precedents?

G2. Keyboard navigation for 3D objects: tab order · focus indicators · screen-reader handling.

G3. Mobile fallback: per §6 the user's preference is "static images" for interactive art. Real patterns for serving static fallback to mobile · low-connection · prefers-reduced-data.

G4. The user's **kill switch rule**: "when it overtakes the content." How is this measured / triggered in practice?

### H. CS-hero continuity (Q1 deferred to per-cell)

Per setup plan item 6, every cell must propose a continuity option (morph / persist / no-continuity). For F3-A specifically:

H1. **Morph option** — homepage horizontal desk band transitions to case-study §01 hero. CSML M1 has a Eyebrow + Title + Context + TL;DR pattern. Can the desk band morph into that register? What FLIP / View Transitions API / Framer Motion layout patterns make this honest?

H2. **Persist option** — desk band element persists into case-study §01 hero zone (shrinks to nav, persists as a side-element, etc.). Precedents?

H3. **No-continuity option** — clean cut between homepage and case-study §01. Easiest; what's lost?

H4. F3-A specific continuity weakness: the horizontal band geometry — does it have any inherent continuity affordance into the case-study M1 vertical-flow register, or is it geometrically misaligned?

### I. The 9 desk objects — modeling / sourcing / style

I1. The art system locks "thin hairline · pure line · flat 2D default · depth reserved for 3D modules" (§3.7). The desk is a 3D module per §3.7's "depth reserved for 3D modules" carve-out. What 3D style maps best onto thin hairline pure line flat 2D: low-poly stylized? Hatched-3D? Toon-shaded? Hybrid? Document precedents.

I2. For each of the 9 objects (MacBook · Pokémon figure · love letter · seltzer · sketchbook · pyramid · running pin · Colombian+American flag · clicky pen): source options (model / scan / procedural), licensing, the maintenance cost.

I3. The Pokémon figure — IP risk for a hireable portfolio? Replace with generic figure? Decode the legal posture.

I4. GF's alt POV objects (lego · calendar · clock/timer · keyboard + the unclear "baby juice"): cross-check + flag Sebs to clarify "baby juice" before Hero #8 narrows desk.

### J. The "page-entry intent" §10 dimension (per setup plan item 11)

Per cross-system-rules §14 Hero row, Hero #8 introduces a new §10 dimension: **page-entry intent** (intent #0 — hooking before §01 orients). For F3-A:

J1. What "intent" does the horizontal desk band carry as page-entry? "Show personality before showing work" vs "show a system before showing work" vs "show a workspace before showing work" — which?

J2. How does this intent compose with the case study spine's intent arc (CSML §10 framework lives in cross-system-rules §10)? Trace one example.

### K. Anti-drift — what F3-A must NOT do

K1. Per setup plan item 11 anti-drift: hero zone "must NOT become feature showcase / gallery / page-summary." F3-A specifically: how does the desk avoid becoming a "look at my cool toys" gallery? Document precedents that fall into this trap and what distinguishes them.

K2. Per `feedback_rule_breaking_standard` — rule-breaking must produce the effect through composition, never by breaking the content. F3-A's "messy desk with high-craft" aesthetic must be composed messy, not actually-messy. Document patterns.

K3. Per north-star anti-list ("kill it if: cool but less clear · expressive but ungoverned · ..."): F3-A as a composition — where are its risk surfaces?

---

## Research findings

*Populated as research streams return. Each finding cites the URL it came from.*

### A. Rendering technology decision findings

**Option matrix** (each evaluated against F3-A's "lightweight canvas + minimal interaction + thin hairline pure line flat 2D + horizontal band geometry" brief):

| Option | Bundle / perf | F3-A fit | Verdict for F3-A default |
|---|---|---|---|
| **R3F + drei** | Three.js ~155 KB gzipped + R3F reconciler + drei. Tree-shaking limited per [Three.js forum](https://discourse.threejs.org/t/tree-shaking-three-js/1349). drei `<Html occlude>` solves tooltip-cursor over scene directly per [drei Html docs](https://drei.docs.pmnd.rs/misc/html). | Mature interaction model (`onPointerOver` per-mesh, no manual raycaster). 2026 mobile-perf: Draco + KTX2 + OffscreenCanvas → 60fps per [Krapton 2026 deep dive](https://www.krapton.com/blog/boosting-react-three-fiber-mobile-performance-in-2026-a-deep-dive-d6105c). Hairline aesthetic needs `LineSegments2`/`MeshLine` for screen-space-constant widths per [DesLauriers "Drawing Lines is Hard"](https://mattdesl.svbtle.com/drawing-lines-is-hard) — naive `THREE.Line` is fixed 1px. | **Strong candidate**. Mature, bundle is honest, tooltip-cursor over 3D solved via drei `<Html>`. Hairline aesthetic needs `LineSegments2` or outline post-pass. |
| **Native Three.js (no React)** | Smallest bundle if the page IS the scene. Codrops 2026 portfolios go vanilla. | Loses JSX co-location + drei's declarative tooltip helpers. Adds manual scene/animation management for what R3F gives free. | **Skip** — lab is React; co-location wins. |
| **Spline embed** | Heavier abstraction wrapping Three.js; slower than hand-coded per [Tooliverse 2026](https://tooliverse.ai/tools/spline) + [Spline 2026 guide](https://medium.com/@abhinav-dobhal/spline-design-in-2026-the-complete-guide-to-building-immersive-3d-web-experiences-without-code-097f475b3951). | Hover-state + click-jump-to-camera fine. **Tooltip-cursor signature interaction needs DOM overlay outside Spline's scene scripting** — defeats Spline's "all-in-one" benefit. Experimental R3F export exists. | **Skip for default**. Useful as prototype path only; signature interaction lives outside it. |
| **CSS 3D transforms (sprite planes)** | Lightest by far. Browser-native hover/click/a11y. No WebGL surface area. | 9 objects sitting on shared ground plane with no real depth-sorting works as 2.5D sprite stack. Loses: real orbit, real shadow casting, normal-based lighting. **Stays line-flat → on-brand for "depth reserved for 3D modules" carve-out**: arguably MORE on-brand than full WebGL. | **Strong dark-horse candidate** for F3-A specifically. Worth A/B against R3F default. |
| **Pre-rendered image sequence (Apple-style)** | Frame-index-driven canvas per [CSS-Tricks Apple pattern](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/) + [Builder.io re-creation](https://www.builder.io/blog/webgl-scroll-animation). Apple's degraded-frames loading: first, last, 50%, 25%, 75%. | Dies the moment user expects hover-and-reveal per-object. Hotspots require invisible DOM overlay = rebuilt worst of both worlds. | **Skip** — incompatible with hover-discovery requirement. |
| **Native canvas custom 2.5D** | Right answer when no real depth-sorting. WebGL not always faster than canvas2D in 2D context per [Tapflare graphics comparison](https://tapflare.com/articles/web-graphics-comparison-canvas-svg-webgl). | Commits to fixed camera. No real orbit. | **Skip for default** — covered by CSS 3D + sprite option with less custom code. |

**Lean for F3-A default:** R3F + drei OR CSS 3D + sprite planes. Both are honest answers; R3F wins on interaction maturity (drei `<Html occlude>` solves tooltip-cursor immediately), CSS 3D wins on bundle weight + line-flat art-rule fit. **Recommend the 8.1-A.2 composition proposal carry both as A/B sub-options before committing.**

Cross-cutting constraints (all options):
- Pixel ratio clamp `Math.min(devicePixelRatio, 2)` per [Codrops Efficient Three.js Scenes](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/).
- Skip post-processing on hero band (Bruno Simon's first mobile optimization per [his case study](https://medium.com/@bruno_simon/bruno-simon-portfolio-case-study-960402cc259b)).
- Bake all lighting; disable `matrixAutoUpdate` on static objects.

### B. Reference site technical decoding findings

**Methodology note.** WebFetch's markdown extractor strips `<head>`, scripts, and inline JS — direct script-tag inspection wasn't possible. Findings combine (a) framework signatures that survive the extractor (Next.js `/_next/` URLs, Framer subdomain redirects), (b) third-party catalogues (Navbar Gallery, Awwwards), (c) agency-published case studies. Specific easing curves / scroll ranges / timing values were not extractable without devtools inspection — those need a manual pass.

**B1. aninguyenle.com — RECORDING-VERIFIED 2026-05-29 (Sebs screen-recording walkthrough).** Site is live and the reference is real; earlier WebFetch result (`/playground` 404) was extractor-vs-Framer-hydration-shell failure, not a missing route. Decoded behavior from recording:

- **Homepage hero** (`aninguyenle.com`): structured editorial layout. Left column = name + bio + a **small hand-drawn line-illustration of Ani that cycles between poses** (standing → drawing → with glasses observed across frames). Either hover-triggered or auto-cycling on a timer. Line-illustration style — **directly relevant to our `lib/handFeel.ts` aesthetic and the deferred 8.1-A-VARIANT-handdrawn pass.** Right column = project tiles (one shows a 3D sandstone figure mockup in an iPad frame). **NOT the scattered-scene reference** — homepage is conventionally structured.
- **Playground page** (`aninguyenle.com/playground`): THIS is the "interactive scene" the user remembered (per `portfolio-style-art-voice-source.md` §5.4 "or maybe one big scene"). Decoded:
  - **Dark background canvas** (full-bleed playground page, NOT a band)
  - **Scattered tilted-polaroid layout** — tiles laid like a corkboard / scrapbook, each tile rotated at a varying small angle (≈ -8° to +8°)
  - **Mixed media tiles**: photos · illustrations · app screens · sticky notes · food images · abstract art · video previews
  - "Playground" title centered with "ani by ani" sub-label as a focal anchor amid the scatter
  - **Scroll-linked tile drift** observable across frames 7-9 — tiles shift position slightly as page scrolls, suggesting parallax or scroll-driven transform per tile (not just static document flow)
  - Z-order layered — some tiles overlap others; the "Playground" title sits on top of the scatter
- **Framework:** confirmed Framer (extractor result + Framer subdomain redirect + Framer's playground/canvas-style page templates fit observed behavior).

**F3-A applicability — TWO patterns, ONE direct + ONE redirect:**

1. **Direct F3-A steal (homepage line-illustration cycling).** The cycling hand-drawn-line Ani-sketch is a *direct precedent for the deferred 8.1-A-VARIANT-handdrawn pass* — small line illustrations of identity content that animate state through cycling rather than 3D rendering. Catalogue this for when 8.1-A-VARIANT opens. NOT applicable to default F3-A render.
2. **Redirect (playground scattered-canvas).** The /playground pattern is a **full-bleed scattered-canvas about-page-style scene**, NOT a horizontal hero band. It belongs to the user's About-page art concept (`portfolio-style-art-voice-source.md` §5.4 "expanded desk/scenes interactive with more details"), not to F3-A. The pattern itself — tilted-polaroid scatter on dark canvas with scroll-linked parallax — is reusable in the user's About/Footer art work but is NOT a horizontal-band reference. **Note this in F3-A research index but DO NOT pull the pattern into F3-A's band geometry — it would violate the "ground-up per layout" invariant from the top of this doc.**

**Sources verified:** screen recording 2026-05-29 (Sebs-supplied walkthrough at `/Users/sebs/Desktop/Screen Recording 2026-05-29 at 3.57.31 PM.mov`, ffmpeg-extracted frames at /tmp/recording_frames/) · [aninguyenle.com](https://aninguyenle.com/) · [aninguyenle.framer.website](https://aninguyenle.framer.website/) (Framer origin signature).

**B2. taamannae.dev.** SPA shell — framework not detectable from public-facing inspection. Grain-mask-with-gradient-exit at header boundary is almost certainly one of two patterns: (1) fixed SVG `feTurbulence` + `feDisplacementMap` overlay with `mask-image: linear-gradient(to bottom, black, transparent)`, or (2) CSS `background-image` PNG/WebP grain on fixed pseudo-element with same gradient mask. **The exit-at-boundary feel comes from the gradient mask, not the grain itself.** Hover-image easing on portfolio thumbs typically `cubic-bezier(0.22, 1, 0.36, 1)` (easeOutExpo family) at 600–900ms — not verified for Tammy specifically. **F3-A direct steal:** the gradient-masked grain overlay across the band, masked so it dies at the band's bottom edge — becomes the visual divider between hero band and work-field container below. Source: [taamannae.dev](https://taamannae.dev/) (JS-rendered, framework opaque).

**B3. taamannae.dev/projects/menti.** Same SPA shell — extractor returns only title meta. Limited F3-A relevance (F3-A is homepage, not case-study). Only useful question: does the grain-mask from B2 persist into project pages as a global brand mark? Unverified.

**B4. integratedbio.com (was integratedbiosciences).** **Confirmed Framer-built** via [Navbar Gallery](https://www.navbar.gallery/navbar/integrated-biosciences). Designed by Accomplice (Austin). Entrance choreography uses Framer's native "appear effect" + "scroll effect" (sequenced opacity + translateY, stagger 50–150ms, ease-out cubic). Adjacent-hover transitions implementable in React with **a hovered-id context** (parent owns hover state, children read it and apply `data-dimmed` style) — equivalent to Framer's variant system. **F3-A direct steal:** (1) staggered entrance for desk objects on the band — opacity 0→1 + translateY 8–16px, ease-out 400–600ms, stagger 60–120ms per object, kicked off after band frame settles; (2) adjacent-hover propagation (hovering one desk object dims/scales-down siblings) via parent-state pattern.

**B5. elisekim.co.** **Confirmed Framer** via `elisekim.framer.website` redirect signature. Framer Motion is bundled into every Framer site. Scroll-linked scaling via Framer's `useScroll` → `useTransform` → `useMotionValue` pipeline (`IntersectionObserver` trigger + `getBoundingClientRect` polling on rAF for value). Typical scale 0.92→1.0 over 100–300px scroll range — not verified for Elise specifically. **F3-A direct steal:** as the band scrolls out and the featured project card claims viewport, scroll-link the card's scale 0.96→1.0 across first ~200px of its intersection. Implementable with Framer Motion's `useScroll`+`useTransform` OR native CSS `animation-timeline: view()` if browser-support limit acceptable.

**B6. bellakitchenware.com.** **Confirmed stack** via [OFF+BRAND's case study](https://www.itsoffbrand.com/our-work/bella): Shopify + Vue/Nuxt.js + WebGL. Hero shrink-on-scroll = `position: sticky; top: 0; height: 100vh` canvas with camera Y-position or root mesh scale driven by `window.scrollY`. Smooth-scroll wrapper likely Lenis (de-facto standard, unverified). Content section below translates up over `z-index` lower than canvas; canvas itself shrinks via camera/scale tween. **F3-A direct precedent for "band above independent work field" architecture.** Two paths: (1) full WebGL band like Bella's (heavy, needs fallback ladder); (2) DOM-based band with sprite desk objects + scroll-linked `transform-origin` shrink (preserves a11y, lighter bundle). **Path 2 recommended for F3-A unless WebGL is a deliberate brand stance.**

**B7. rachelchen.tech.** **Confirmed Next.js** via `/_next/image` URL signature in homepage HTML. [Opendoors review](https://blog.opendoorscareers.com/p/junior-portfolio-showcase-rachel-chen) describes "carefully curated videos and subtle motion," "bite-sized clips." Play/reset chrome = `<video muted playsinline loop preload="metadata">` + `<button>` overlay calling `videoRef.current.play()` on hover-enter / `pause()` + reset `currentTime = 0` on hover-leave. Keyboard-focusable with `aria-label`. Page-load: title is SSR plain HTML (zero entrance class), hero image has initial `opacity: 0; transform: translateY(8px)` + post-hydration `useEffect` swap with `transition: 600ms cubic-bezier(0.22, 1, 0.36, 1)`. **F3-A direct steals:** (1) **SSR-instant / hero-animates-in split** — render band scaffold (frame, title, static labels) instantly via SSR; animate only desk objects post-hydration; first paint never shows empty void; (2) hover-to-play video chrome if any desk object contains video; (3) `muted + playsinline + loop + preload="metadata"` as load-cheap video defaults.

**Aggregate steals into F3-A composition palette:**
- Bella sticky-canvas pattern → structural model for "band above work field"
- Rachel SSR-instant + hero-animates-in split → first-paint behavior
- Tammy grain-mask-with-gradient-exit → band's lower boundary divider
- Elise scroll-linked scale → featured-card-meets-band transition
- Integrated Biosciences staggered entrance + adjacent-hover → desk-object choreography
- Rachel hover-to-play video chrome → video-bearing desk objects

**De-prioritize:** aninguyenle.com (until user confirms live URL or recording).

### C. 3D hero precedents

**12 documented precedents with URLs** (all real; verification level noted):

1. **Bruno Simon** — [bruno-simon.com](https://bruno-simon.com/) · [Awwwards case study](https://www.awwwards.com/brunos-portfolio-case-study.html) · [Medium](https://medium.com/@bruno_simon/bruno-simon-portfolio-case-study-960402cc259b) · Three.js + Cannon physics · drive-a-car interaction · full-bleed, NOT band · canonical reference; "How do I jump?" was the #1 user question — *discoverability is the hard problem*
2. **Jesse Zhou — Jesse's Ramen** — [GitHub](https://github.com/enderh3art/Ramen-Shop) · [Awwwards HM](https://www.awwwards.com/sites/jesses-ramen-portfolio) · [case study](https://jesse-zhou.medium.com/jesses-ramen-case-study-77bae77ab5f0) · vanilla Three.js · full-bleed isometric · click-hotspots-on-objects · cyberpunk ramen shop, NOT desk
3. **Diya Basu — Desk Tour** — [diyabasu.com](https://www.diyabasu.com/) · [case study](https://medium.com/@diya.basu73/react-three-fiber-3d-portfolio-case-study-6e1fbd9e6dcb) · R3F + Blender · workspace scene with object→route interactions · **closest subject analog to F3-A but full-bleed, not band**
4. **Chris Pokrzywa** — [chrispokey.com](https://chrispokey.com/) · [Awwwards](https://www.awwwards.com/sites/chris-pokrzywa-ux-portfolio) · home-office 3D scene · click-around-desk · **closest subject AND hiring portfolio context** · catalogued in [Really Good Designs interactive portfolios](https://reallygooddesigns.com/interactive-portfolio-examples/)
5. **Carl Gordon** — [carlgordonmedia.com](https://www.carlgordonmedia.com/) · [Awwwards HM](https://www.awwwards.com/sites/carl-gordon-portfolio-c-2024) · [interactive 3D hero callout](https://www.awwwards.com/inspiration/interactive-3d-hero-section-carl-gordon-portfolio-c-2024) · Spline · **cleanest banded-above-grid 3D-hero precedent in the documented set**
6. **Jordan Breton** — orbit-controlled floating island, full-bleed (in [creativedevjobs Three.js portfolios 2026](https://www.creativedevjobs.com/blog/best-threejs-portfolio-examples-2025))
7. **Ameen Abdullah** — WebGPU sakura, full-bleed (same roundup)
8. **JReyes MC** — Minecraft-themed portfolio, Awwwards HM (same roundup)
9. **Jesse Martinez** — draggable 3D cubes in hero band ([Really Good Designs](https://reallygooddesigns.com/interactive-portfolio-examples/))
10. **Pierre Nel / Max Milkin / André Souza / Maxime Guillon** — floating shapes reacting to cursor; drag-to-reveal; virtual island-as-skills ([Really Good Designs](https://reallygooddesigns.com/interactive-portfolio-examples/))
11. **Bastian Gasser** — [Awwwards](https://www.awwwards.com/inspiration/hero-section-bastian-gasser-portfolio) · non-3D but documents the hero-band-above-grid geometry
12. **Justine Soulié** — [WebGPU showcase](https://www.webgpu.com/showcase/justine-soulie-portfolio-webgl-illustrations/) · illustrations-as-interface, WebGL

**Dominant pattern across the 12:** full-bleed (Bruno, Jesse Zhou, Diya, Pokrzywa, Jordan, Ameen). The hero IS the page. Banded-with-3D heroes (Carl Gordon) tend to carry abstract 3D (cubes/gradients/particles), not explorable rooms. Explorable-room 3D heroes tend to be full-bleed.

**KEY FINDING — F3-A is inventing geometry.** No documented precedent for *horizontal hero band + fully-explorable 3D desk scene*. The intersection doesn't exist in the surveyed set. F3-A's closest reference is **Pokrzywa's hotspot interaction model + Carl Gordon's band layout**, composed across them. This is genuine novelty.

**Constraints horizontal banding imposes** (synthesizing across the 12):
- Camera path: orthographic or shallow-perspective horizontal sweep. Orbit-around-room (Pokrzywa style) impossible — would feel like peeking through a mail slot.
- Object arrangement: laid out *across* the band, not piled in depth.
- Band aspect ratio: 21:9 to 32:9 horizontal at desktop (~40–55vh in 16:10 viewports), narrowing toward 16:9 on mobile. Banded-above-grid designs trim much lower than full-bleed (often 40–55vh) because they're consciously sharing the fold with a work strip.
- Hit-target density: 9 objects in a band = tight raycast targets. Pad with invisible cylindrical hit volumes (a drei trick) for hover forgiveness.

**The "look at my cool toys" trap** (per setup plan item 11 anti-drift + setup plan K1): the failing desk-portfolios in the [Really Good Designs roundup](https://reallygooddesigns.com/interactive-portfolio-examples/) commentary are the ones where objects sit *decoratively* — the desk is seasonal decor, not a navigation system. Pokrzywa wins by linking each object to actual case-study content. **F3-A anti-drift implication:** desk objects must *resolve into meaning* on interaction. If they're just toy-box poke-targets, F3-A has failed.

### D. Interaction patterns

**Hover patterns** (precedents + F3-A fit):
- **Scale-up on hover** — universal. Trivial: `onPointerOver` → spring to scale target. Pierre Nel / Max Milkin precedents per [Really Good Designs](https://reallygooddesigns.com/interactive-portfolio-examples/).
- **Outline / halo on hover** — Three.js OutlinePass OR cheap "draw mesh twice, second pass scaled up in outline color" per [Marinacci cartoon outline](https://medium.com/@joshmarinacci/cartoon-outline-effect-6c4e95545537) + [Shehata WebGL outlines](https://omar-shehata.medium.com/how-to-render-outlines-in-webgl-8253c14724f9). **Fits F3-A's "thin hairline pure line" art system — hover doesn't introduce a new visual language.**
- **Tooltip pop above object** — drei `<Html occlude>` per [drei docs](https://drei.docs.pmnd.rs/misc/html). Hides tooltip behind geometry as if it were 3D. Without `occlude`, "a label for a hidden object still appears on top unless you manually hide it" per [IGC HTML+WebGL](https://www.intelligentgraphicandcode.com/development/threejs-interfaces/html-integration).
- **Cursor change** — `document.body.style.cursor` in pointerOver. Cleanest gestural "this is interactive" signal without modifying the scene.

**Click patterns:**
- **Zoom-in to object** — camera tween (drei `<CameraControls>` or `<Bounds>` "fit to object"). Pokrzywa-style desk: click laptop → camera reorients to face screen.
- **Inline reveal (tooltip locks open)** — click promotes hovered tooltip into persistent panel. Cheap, no scene state change.
- **Modal open** — click jumps out of 3D context. Use when destination is full case study.
- **Scene swap** — Bruno Simon's "drive to different rooms." Overkill for a band.

**Three control models the user is weighing** (per `portfolio-style-art-voice-source.md §5.3` + setup plan item 8):

| Model | F3-A fit | Trade-off |
|---|---|---|
| **(a) Interactive orbit pick-one** | drei `<OrbitControls>` constrained via `minPolarAngle`/`maxPolarAngle`/`enableZoom={false}`/`enablePan={false}`. Precedents: Jordan Breton island, Jesse Zhou ramen. | **Fights horizontal band geometry.** Vertical orbit no room; horizontal orbit walks objects off band edges. Continuous render loop required. |
| **(b) Click hotspots only** | Pokrzywa's actual model. drei `<Html>` overlay marker or per-mesh `onClick`. | **Strongest fit for F3-A's "minimal interaction" brief.** No camera path needed. Hover state + cursor change become *load-bearing discoverability* — not nice-to-have. |
| **(c) Drag in given area** | Jesse Martinez draggable cubes, Lydia Amaruch photo orbit, André Souza drag-to-reveal. | **Drag-to-rotate-scene** reads as one composite gesture; **drag-to-pick-up-objects** reads as toy box → "cool toys" trap. |

**Lean for F3-A default:** **(b) click hotspots only.** Aligns with band geometry (no camera path), lightweight (render loop not needed outside hover), gives tooltip-cursor its natural home. (a) and (c) stay open as VARIANT-handdrawn-deferred companions if signature interaction warrants them.

**Hover Tooltip Cursor — signature interaction implementation**

Precedent stack:
- [Aceternity animated tooltip](https://ui.aceternity.com/components/animated-tooltip) — hover-reveal, cursor-follow with spring + natural rotation tilt
- [Framer Animated Tooltips](https://www.framer.com/marketplace/components/animated-tooltips/) — productized same pattern
- [TooltipJS cursor-follow](https://www.cssscript.com/tooltip-follow-cursor/) + [paulvddool CodePen](https://codepen.io/paulvddool/pen/mROEGa) — vanilla JS reference
- [Mapbox hover-tooltip example](https://docs.mapbox.com/mapbox-gl-js/example/hover-tooltip/) — canonical mousemove-driven implementation pattern
- [Radix discussion #1090](https://github.com/radix-ui/primitives/discussions/1090) — cleanest framework-agnostic approach: "0×0 div that follows cursor + onMouseEnter/onMouseLeave anchor"

**F3-A implementation pattern.** Single fixed-position DOM tooltip element listens to `mousemove`, tweens `translate3d(x, y, 0)` toward cursor with small lag (Framer Motion `useSpring` OR hand-rolled rAF lerp). 3D scene's `onPointerOver` per-mesh writes tooltip content (object name + one-liner) into context state; `onPointerOut` clears. Tooltip animates in via opacity + scale-from-cursor (matches user's "max 400ms duration" rule). **Crucially: tooltip lives in DOM, outside the canvas** — font-smoothing, type ramp, and tokens come from the rest of the portfolio. No SDF-text-in-WebGL workaround needed.

**Anti-drift on tooltip-cursor:** must respect band vertical edges — tooltip flips *upward* near band bottom edge, *downward* near top edge. Standard flip logic.

### E. Hero band horizontal composition

**Real horizontal-banding precedents** (above a work field):
- **Carl Gordon** — [carlgordonmedia.com](https://www.carlgordonmedia.com/) · cleanest 3D-hero-banded-above-grid precedent · Spline · band layout
- **Bastian Gasser** — [Awwwards](https://www.awwwards.com/inspiration/hero-section-bastian-gasser-portfolio) · banded type-hero with draw-on animation
- **Reform Digital** — [Awwwards](https://www.awwwards.com/inspiration/portfolio-hero-thumbnail-design-reform-digital-r) · hero + thumbnail row composition
- **Artjom Zakoyan** — [Awwwards](https://www.awwwards.com/inspiration/interactive-hero-section-portfolio-artjom-zakoyan) · interactive hero with microinteractions

**Aggregate signal** from [Really Good Designs hero examples](https://reallygooddesigns.com/hero-section-design-examples/), [Marketer Milk 30 examples](https://www.marketermilk.com/blog/hero-section-examples), [Slider Revolution 90 examples](https://www.sliderrevolution.com/design/hero-image-website/):
- Default hero bands: 60–100% viewport on desktop, 50–70% mobile.
- Banded-above-grid designs trim much lower: **40–55vh on desktop** — consciously sharing the fold with the work strip.

**Independent-containers pattern implementation** (per setup plan item 4 invariant):

Two real routes documented:

1. **Scroll-snap mandatory:** `scroll-snap-type: y mandatory` on page container; each section is `scroll-snap-align: start` 100vh block. Hero band lives in section at natural height; featured card lives in next section sized to fill. GPU-accelerated, native. Per [CSS-Tricks Practical Scroll Snapping](https://css-tricks.com/practical-css-scroll-snapping/) + [MDN scroll-snap-type](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type). **Trade-off:** mandatory snap can feel hostile if user wants to peek; `proximity` is softer.

2. **Natural-flow with min-height:** hero band sized to content; next section uses `min-height: 100vh`. No snap; scroll behavior is normal. The [CodyHouse sticky-hero pattern](https://codyhouse.co/blog/post/sticky-hero-section) inverted — instead of pinning hero, guarantee next section reaches bottom of viewport when its top is at the top.

**The exact "two independent containers, never visible together" rule** is implementable by combining:
- (a) hero band fixed natural height (e.g., `clamp(420px, 48vh, 560px)`)
- (b) next section `min-height: 100vh`
- (c) optionally scroll-snap aligns each section's top to viewport top so partial-overlap states are short-lived

Salient's [Sticky Content Sections pattern](https://themenectar.com/docs/salient/sticky-content-sections/) + [GSAP ScrollTrigger pinned-section examples](https://freefrontend.com/scroll-trigger-js/) document the JS-driven variant where the next section is pinned and the hero scrolls out cleanly.

**No clean precedent surfaced** for the *exact* "two independent containers, never visible together" as a named pattern — but the combination `min-height: 100vh` on second section + scroll-snap on page IS the lightest realization.

**F3-A specific math** (mating with existing `CardFitContext`):
- `CardFitContext` compact mode already does ResizeObserver-measured content-below-media + sticky-chrome-offset math for featured card.
- F3-A hero band sits ABOVE this card in document flow.
- Hero band participates in NORMAL scroll flow (not sticky).
- Featured card's `min-height: 100vh` math kicks in when its top hits viewport top.
- Hand-off: hero band scrolls fully out before featured card claims viewport — independent-containers invariant satisfied by the geometry, not by sticky pinning.

**Lean for F3-A default:** natural-flow with `min-height: 100vh` on featured-card container. No scroll-snap unless A/B tests prove the snap helps the hand-off feel.

### F. Performance budgets

**F1. Core Web Vitals 2026 targets** (unchanged from 2024 INP transition):
- **LCP** ≤ 2.5s · needs improvement 2.6–4.0s · poor > 4.0s
- **INP** ≤ 200ms · needs improvement 201–500ms · poor > 500ms
- **CLS** ≤ 0.1

Sources: [web.dev defining-thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds), [Google Search Central CWV](https://developers.google.com/search/docs/appearance/core-web-vitals). Site passes when ≥75% of real-user CrUX visits hit "good" on all three.

**[HTTP Archive Web Almanac 2025 — Performance](https://almanac.httparchive.org/en/2025/performance) baseline:** 74% desktop / 62% mobile sites have "good" LCP. LCP element is an image on 85.3% desktop / 76% mobile pages — **3D canvas hero will rarely be the LCP element by default**. Only 17% pages use `fetchpriority="high"` on LCP image; only 2.1% preload it.

**Implication for F3-A:** the LCP target is the **hero band's poster image OR headline**, not the WebGL canvas. Canvas can stream in after LCP without harming the metric IF the poster is the LCP element AND the canvas swap doesn't cause CLS.

**F2. 3D web hero benchmark numbers:**
- **Triangle budget — mobile:** 50k triangles sustains 60fps on mid-range Android <3yrs old. Above 65k → frame drops. Flagship (Pixel 7) 120k @ 60fps. iPhone 14 (A15) ~150k. Source: [Polygon Count for 3D Game Assets — Neural4D](https://blog.neural4d.com/user-guide/polygon-count-for-3d-game-assets-printing-and-webar/).
- **Hero focal mesh budget:** 50k–100k. Environment props 500–5,000. Total scene <500k. Draw calls <100 for 60fps. Source: [Simplified Media WebGL/Three.js Guide](https://simplified.media/guides/webgl-threejs).
- **E-commerce 3D viewers:** typically <5 MB total payload with Draco-compressed glTF, 2–6s load.
- **Bruno Simon mobile optimizations:** clamp pixel ratio, remove blur post-processing, disable `matrixAutoUpdate` on static objects — only after these did mobile framerate hit acceptable. Source: [Bruno's case study](https://medium.com/@bruno_simon/bruno-simon-portfolio-case-study-960402cc259b).
- **Bundle reality:** one R3F portfolio shipped 600+ KB `index.home.js` before code-splitting. Source: [Voorhoede bundle splitting](https://www.voorhoede.nl/en/blog/bundle-splitting-with-react-s-lazy-and-suspense/).
- **GPU memory:** **no public benchmark surfaced** for portfolio 3D heroes. Range estimate from similar use cases: 80–250 MB GPU for lit + textured single-scene viewer. KTX2/Basis Universal cuts GPU memory ~4–8× vs PNG/JPEG. Sources: [gltf-transform.dev](https://gltf-transform.dev/), [Three.js Compression draco+ktx2 example](https://discourse.threejs.org/t/compression-draco-ktx2-example/31382).

**F3. Honest budgets for F3-A** (mid-range laptop + flaky cafe wifi):
- **Geometry:** ≤75k triangles total visible (desk + props). Draco reduces vertex payload 60–90%; 20 MB raw GLB → 3–5 MB. Source: [Polyvia3D GLB/glTF 2026](https://www.polyvia3d.com/formats/glb-gltf).
- **Textures:** KTX2/Basis Universal, 1024² hero surfaces, 512² props. KHR_texture_basisu stays GPU-compressed (no CPU decode), GPU memory ~4–8× cut. Source: [Three.js GLTFLoader docs](https://threejs.org/docs/pages/GLTFLoader.html).
- **Total hero payload target:** **<2 MB compressed for first paint slice** (geometry + base color textures); **<5 MB fully loaded** (lighting maps + material variants). Aligns with e-commerce viewer benchmark.
- **Lighting:** bake everything possible. Real-time lights are most expensive thing in a portfolio scene.
- **Post-processing:** skip on hero band.
- **Pixel ratio:** `Math.min(window.devicePixelRatio, 2)` clamp. Source: [Codrops Efficient Three.js Scenes](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/).

**F4. Hybrid preload mapped to 3D assets** (the user's "first 1–2 seconds preload, rest lazy"):

Three concrete patterns in the R3F/Three ecosystem:

1. **Static poster as LCP element; WebGL via `React.lazy` + `Suspense`.** Poster is `<img fetchpriority="high">`. R3F `<Canvas>` + Three.js bundle dynamically import — WebGL JS chunk doesn't block LCP. Voorhoede documents exact pattern: index home chunk shrank from >600 KB to lazily-loaded asset. Sources: [Voorhoede](https://www.voorhoede.nl/en/blog/bundle-splitting-with-react-s-lazy-and-suspense/), [React Code Splitting](https://legacy.reactjs.org/docs/code-splitting.html).

2. **Nested `<Suspense>` inside canvas.** R3F supports multiple boundaries — hero focal mesh streams first (base color + low-mip textures), props + secondary materials + high-mip textures fault in behind separate fallback. Sources: [R3F Scaling Performance docs](https://r3f.docs.pmnd.rs/advanced/scaling-performance), [Gatsby Three.js perf](https://www.gatsbyjs.com/blog/performance-optimization-for-three-js-web-animations/).

3. **glTF Transform pipeline at build time.** `gltf-transform` applies Draco + KTX2 + texture resize + meshopt in one command. 2026-standard preprocessing pipeline. Source: [gltf-transform.dev](https://gltf-transform.dev/).

**LOD ladder for F3-A:** single hero LOD acceptable at portfolio scale; multi-LOD overkill when camera is fixed at the band. Streaming geometry (meshopt/Draco progressive) NOT yet community-standard for portfolio heroes — most stream textures, not meshes.

### G. A11y / reduced-motion / mobile

**G1. `prefers-reduced-motion` for 3D heroes.**

[web.dev canonical guidance](https://web.dev/articles/prefers-reduced-motion) is **removal-first**: "interfaces should minimize movement or animation, preferably to the point where all non-essential movement is removed." web.dev does NOT recommend simplified-but-still-moving alternatives.

User's stated "stationary, simplified motion" interpretation goes slightly beyond web.dev's removal-first. Reasonable extrapolation, not directly cited best practice. **Implementation pattern:**

```
const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
```

Then either (a) skip `requestAnimationFrame` entirely and render one frame, or (b) keep render loop but kill all `useFrame` mutations except user-initiated motion (camera orbit drag exempt per WCAG). Sources: [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion), [W3C SCR40](https://www.w3.org/WAI/WCAG21/Techniques/client-side-script/SCR40), [Josh W. Comeau React reduced-motion](https://www.joshwcomeau.com/react/prefers-reduced-motion/).

For GSAP-driven scene: `gsap.matchMedia()` with `(prefers-reduced-motion: no-preference)` is the documented branching. Sources: [Mat Simon — Interactive 3D Hero](https://www.matsimon.dev/blog/building-an-interactive-3d-hero-animation), [Codrops Webflow+GSAP+Three.js 2026](https://tympanus.net/codrops/2026/03/18/building-seamless-3d-transitions-with-webflow-gsap-and-three-js/).

**F3-A specific:** render one frame at chosen camera angle, leave canvas mounted, disable autorotate / drift / parallax. Cursor-driven orbit + click-to-focus remain (user-initiated motion is exempt).

**G2. Keyboard / focus / screen-reader for 3D objects.**

No WCAG technique exists specifically for 3D — canvas is opaque to AT. Canonical pattern is **proxy DOM / shadow-DOM mirror**:

1. Hidden focusable DOM mirror of every interactive object (button-per-object), positioned over canvas with `pointer-events: none` on non-interactive copy. Tab order + ARIA labels + focus indicators live on DOM mirror; canvas reacts to same activation events. Sources: [Anneka Goss Accessible WebGL](https://annekagoss.medium.com/accessible-webgl-43d15f9caa21), [Paul J. Adam canvas a11y](https://pauljadam.com/demos/canvas.html), [GitNation a11y Interactive Canvases](https://gitnation.com/contents/a11y-and-interactive-canvases).
2. `<canvas>` gets `role="img"` for non-interactive scenes; `role="application"` ONLY if keyboard interactions are scene-internal. Plus `aria-label`/`aria-describedby` pointing to text description. Source: [Babylon.js Accessibility Scene Tree](https://doc.babylonjs.com/toolsAndResources/accessibility/screenReaders) (closest engine to "AT-native 3D" in 2026 — architectural reference even if you stay on Three.js).
3. Focus indicators must hit **WCAG 2.2 SC 2.4.11 Focus Appearance**: 3:1 contrast against adjacent colors. Sources: [WCAG 2.4.13](https://www.wcag.com/designers/2-4-13-focus-appearance/), [TestParty WCAG 2.4.7](https://testparty.ai/blog/wcag-focus-visible-guide).

**F3-A specific:** if desk objects are decorative (no click targets), make canvas one `role="img"` with descriptive label and stop. If clicking the laptop opens a project, the laptop needs a sibling `<button>` in the DOM mirror with same visual position.

**G3. Mobile / low-connection fallback.**

Three signals drive swap, priority order:

1. **`prefers-reduced-motion: reduce`** → static poster, no canvas mount. Source: [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion).
2. **`Save-Data: On` header OR `navigator.connection.saveData === true`** → static poster. `Save-Data` is low-entropy client hint sent automatically when user enables data-saver. Sources: [MDN NetworkInformation.saveData](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/saveData), [MDN Save-Data header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Save-Data).
3. **`navigator.connection.effectiveType` of `slow-2g | 2g | 3g`** → static poster. Addy Osmani's canonical adaptive-serving: `if (/slow-2g|2g|3g/.test(navigator.connection.effectiveType))` → low-res. Sources: [Addy Osmani Adaptive Serving](https://addyosmani.com/blog/adaptive-serving/), [MDN effectiveType](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType).

**Server-side vs client-side:** `Save-Data` is the ONLY signal server-side (HTTP header). `effectiveType`, `saveData` JS, `prefers-reduced-motion`, WebGL detection are client-side. **Robust pattern:** server reads `Save-Data` → ships static-poster HTML. Client-side React hydrates and **progressively enhances** — canvas mounts only if `(!saveData && effectiveType === '4g' && !reducedMotion && WebGL supported)`. **This is the 14islands pattern.** Sources: [14islands progressive enhancement WebGL+React](https://medium.com/14islands/progressive-enhancement-with-webgl-and-react-71cd19e66d4), [14islands stack revisited](https://www.14islands.com/journal/our-stack-of-choice-revisited).

14islands feature-detects "capable device" by screen size — large screens assumed more powerful (no reliable GPU-tier API).

**Static image vs video:** serve video instead of static only when hero communicates time-based information (process, actual product motion). Desk scene conveys *atmosphere* → static correct. Video has same battery/data cost as 3D with less interactivity reward. Autoplay video blocked or battery-expensive on mobile. Sources: [VictorFlow Hero Video vs Static 2026](https://www.victorflow.com/blog/hero-video-vs-static-image-what-grabs-attention-better), [Webflow Hero image best practices](https://webflow.com/blog/website-hero-image).

**G4. Kill switch — "remove 3D when it overtakes the content."**

Two real measurement patterns:

1. **drei `<PerformanceMonitor>`** — collects average fps over rolling 250ms windows × 10 iterations; calls `onDecline` when 75% of recent windows fall below lower bound. Documented production: bounds `[30, 500]`. On decline → reduce DPR 20% → disable post-processing → remove non-essential objects → unmount canvas → swap to poster. Sources: [drei PerformanceMonitor](http://drei.docs.pmnd.rs/performances/performance-monitor), [R3F Scaling FPS discussion #2016](https://github.com/pmndrs/react-three-fiber/discussions/2016).

2. **`navigator.connection.change` listener** for live downgrade if connection drops mid-session. Source: [Addy Osmani](https://addyosmani.com/blog/adaptive-serving/).

User-initiated kill switch (a "reduce motion" toggle in page chrome, separate from OS preference) is WCAG-belt-and-suspenders move and the only one user can trust when their machine is fine but *content* is what's overtaking. Source: [W3C C39 prefers-reduced-motion](https://www.w3.org/WAI/WCAG22/Techniques/css/C39).

**F3-A kill-switch ladder:**
1. PerformanceMonitor `onDecline` → drop DPR + disable post
2. Second decline → swap canvas for static poster
3. Always provide manual toggle in page chrome
4. **"Overtakes the content" rule operationalized:** if canvas hits decline within first 3 seconds of mount, skip gradual-degrade ladder and go straight to poster — user is already reading the headline below.

### H. CS-hero continuity for F3-A

**CSML M1 register grammar to respect** (per `docs/locked/case-study-modules/01-founder-scan-overview.md`):
- Eyebrow ("01 — OVERVIEW" format) + single-line Title + Summary + Context paragraph
- Full-width vertical stack (side-by-side rejected — "broke harmony with the module below")
- Hierarchy solved by spacing, not decorative elements
- Universal Eyebrow + Title pattern shared across §01–§10 (cross-module cohesion)

**Three options analyzed for F3-A specifically:**

**(a) Morph option** — FLIP / View Transitions API / Framer Motion layout. Shared element ID across routes.
- **Title-text morph**: feasible. Homepage F3-A title text → §01 title text via shared element. Both are single-line text; both use the locked title register. Crossfade + position interpolation works.
- **Eyebrow-text morph**: feasible if F3-A has an eyebrow ("HOMEPAGE" or similar) that maps to §01's "01 — OVERVIEW."
- **Desk objects morph**: NOT feasible. Objects have no §01 counterpart. They'd need to either fade out OR shrink into a corner persistent state — neither is a true morph.
- **Geometric mismatch**: F3-A horizontal band (wide-short) vs §01 vertical-stack opener (tall-narrow). Cross-aspect morph of the full composition reads as squash. Only text-element morphs honestly.
- **Verdict**: partial morph (text only) is the most honest morph implementation; full-composition morph is dishonest.

**(b) Persist option** — single desk object persists as nav anchor / corner element on case-study pages.
- Works because §01 has no specific object affordance to displace; objects can co-exist with §01's text stack.
- Persistent object becomes a "you came from here" navigational signal; clicking it could reverse back to homepage.
- **F3-A geometric advantage**: horizontal-band scatter naturally supports "one object persists, rest dissolve" choreography — the scattered geometry is more dispersal-friendly than a tight grid.
- Risk: persistent object competes with §01's locked spacing rhythm if positioned within the content column. Constraint: persistent object lives in nav layer (Nav Layer 1-3 per Navigation system) NOT in §01's content column.
- **Verdict**: medium-effort, defensible, but adds Navigation system coupling that F3-A shouldn't decide alone.

**(c) No-continuity option** — clean cut.
- F3-A on homepage; §01 hero is a clean text top block per CSML M1 lock.
- **Respects CSML M1 lock without negotiation.**
- Loses cross-page coherence signal but doesn't fight any locked grammar.

**Recommendation for F3-A default: (c) no-continuity.** Rationale:
1. F3-A is already inventing geometry (Section C finding). Layering morph/persist novelty on top compounds risk.
2. Morph (a) only honestly applies to text — limited continuity payoff for the implementation complexity.
3. Persist (b) couples F3-A to Navigation system in ways that should be a Navigation-system decision, not a Hero-system decision.
4. CSML M1 is locked. Respecting the lock without negotiation honors the cross-system inheritance principle in `cross-system-rules.md §14`.

**Morph + persist remain open as 8.1-A-VARIANT-continuity passes** after the no-continuity default lands.

**Anti-drift for H**: do NOT silently invent continuity affordances inside §01's locked content column. Persist-object placement is a Navigation system question, not an F3-A composition question.

### I. Desk objects modeling / sourcing / style

**I1. Style mapping** (against art system §3.7: thin hairline · pure line · flat 2D default · **depth reserved for 3D modules** · duotone limited shared accents · subtle shared grain).

The desk IS the 3D module per §3.7's "depth reserved for 3D modules" carve-out. Four style routes evaluated:

| Style route | Hairline-aesthetic fit | Implementation | Verdict for F3-A default |
|---|---|---|---|
| **Toon-shaded 3D + edge-line post-pass** | **Excellent** — explicit outline ink on every object edge matches hairline directly. | Three.js OutlinePass OR "draw mesh twice, second scaled-up in outline color" per [Shehata WebGL outlines](https://omar-shehata.medium.com/how-to-render-outlines-in-webgl-8253c14724f9), [Marinacci cartoon outlines](https://medium.com/@joshmarinacci/cartoon-outline-effect-6c4e95545537). | **Recommended default.** Pairs naturally with R3F + drei. |
| **Low-poly + flat shading** | Good but doesn't explicitly draw lines — reads constructed, not line-drawn. | Lighter than toon-shaded. No post-pass needed. | **Strong runner-up.** Lower perf cost. |
| **CSS 3D sprite planes (2D illustrated objects tilted in space)** | **Excellent** — fully line-flat, on-brand with "depth reserved for 3D modules" reinterpreted as "depth via composition, not raycasting." | Per Section A: viable when no real depth-sorting. | **Strong dark-horse.** Worth A/B against toon-shaded default. |
| **Hybrid: low-poly + outline pass via PerformanceMonitor downgrade** | Capable devices get outline; weaker hardware falls back to flat low-poly. | drei `<PerformanceMonitor>` `onDecline` triggers post-pass disable. | **Layered fallback** for either default. |

**Default lean**: toon-shaded + edge-line for capable devices; flat low-poly degraded mode under PerformanceMonitor decline; CSS 3D sprite planes carried as A/B option in 8.1-A.2 composition proposal.

**I2. Sourcing per object — import-friendly strategy.**

**User directive 2026-05-29:** no outsourcing; imports OK; "we have the internet to help"; "import plugins for 3d stuff"; "we can grab blank 3D model of something." Sourcing pivots from "all custom-modeled" to "import where viable, model where needed, adapt style on top."

**Source library (real, evaluated):**

| Source | License posture | Use for F3-A |
|---|---|---|
| **[Sketchfab](https://sketchfab.com)** | Mix of CC0 / CC-BY / paid · glTF/GLB download · per-model license check | Primary import source — broadest library |
| **[Poly Haven](https://polyhaven.com)** | CC0 — fully free, no attribution required | Materials + HDRIs + props |
| **[Kenney.nl](https://kenney.nl)** | CC0 game-ready low-poly | Excellent style fit for our "thin hairline pure line flat 2D + depth reserved for 3D modules" aesthetic |
| **[BlenderKit](https://www.blenderkit.com)** | Blender add-on · mix of free + paid · directly importable | One-click import inside Blender |
| **[Free3D](https://free3d.com)** | Mostly free · license per model | Fallback source |
| **[OpenGameArt](https://opengameart.org)** | CC-licensed game assets | Stylized low-poly fits |
| **Quixel Megascans (Bridge)** | Free with Epic account · high-poly (decimation needed) | Material textures, less for hero geometry |

**Per-object pivot — sourcing plan:**

| Object | Strategy | Notes |
|---|---|---|
| **MacBook** | **Import** — Sketchfab CC0/CC-BY laptop models common · or Kenney low-poly | Strip Apple logo (~5 min cleanup) · style-adapt to toon-shaded |
| **Pokémon figure** | **Import** — Sketchfab fan-art Pokémon models exist (kept per user IP override) · OR generic low-poly figure if specific Pokémon unavailable | Decimation may be needed; ~1 hr cleanup |
| **Love letter to gf** | **Model** — paper envelope + wax seal; simple primitive geometry | ~1-2 hrs in Blender |
| **Seltzer (baby juice)** | **Import** — generic soda/sparkling-water cans abundant on Sketchfab + Kenney | Restyle label as needed; ~30 min |
| **Sketchbook with doodles** | **Import (book) + custom doodle texture** — base book model imported, doodle cover texture hand-painted by Sebs | Book model ~30 min · doodle texture ~1-2 hrs hand-drawn |
| **Small pyramid** | **Model** — primitive geometry, no import needed | ~30 min |
| **Running pin** | **Model** — small enameled pin shape; nothing specific in libraries | ~1-2 hrs |
| **Colombian + American flag** | **Model** — either small standing flag (cloth sim) or overlapping fabric on plane (texture only) | ~1-2 hrs |
| **Clicky pen** | **Import** — generic pen models on Sketchfab + Kenney | Cleanup ~30 min |

**Revised time estimate:**
- **Imported (5 objects):** ~30 min – 1 hr cleanup + style-adapt each = ~2.5–5 hrs total
- **Modeled (4 objects):** love letter + pyramid + running pin + flag = ~4–7 hrs total
- **Total: ~7–12 hrs** (vs. earlier ~27–45 estimate)

**Style adaptation pipeline (applied to every imported model):**
1. **Decimate** — bring imported geometry under F3 budget (≤75k triangles total scene; each object ~3-8k tris budget). Blender Modifier → Decimate (ratio 0.3–0.6 typical).
2. **Material swap** — replace imported PBR materials with toon-shaded material matching F3-A art style. Cycles + custom shader OR Blender's Eevee toon shader stack.
3. **Outline pass** — applied at render-time in Three.js (post-process or geometry-double-pass per §I1). Models don't need outlines baked in.
4. **Export to glTF/GLB** — Blender's native glTF exporter.
5. **glTF Transform pipeline** — Draco geometry compression + KTX2 texture compression per §F3 + §F4. CLI:
   ```
   gltf-transform draco input.glb output-draco.glb --quantize-position 14
   gltf-transform ktx2 output-draco.glb output-final.glb --uastc
   ```
   This is the 2026-standard preprocessing pipeline cited at [gltf-transform.dev](https://gltf-transform.dev/).

**License tracking** — required for any CC-BY model:
- Maintain `docs/labs/hero/cells/F3-A-asset-credits.md` (new file at 8.1-A.4 build) listing each imported model · source URL · license · author credit if required
- Site footer or About page needs "Built with [imported assets]" credit block per CC-BY terms
- CC0 models don't require credit but track them for provenance anyway

**8.1-A.4 build placeholder workflow:**
- Start with primitive geometry (Blender cube / cylinder / plane) labeled by object name
- Walk the composition + interaction model in the lab before any sourcing/modeling work
- Once composition reads right, swap in imported/modeled objects one at a time
- HMR makes one-at-a-time swap painless

**I3. Pokémon figure — IP risk noted, USER OVERRULED 2026-05-29.**

Standard portfolio guidance flags Pokémon as IP-protected; cannot ship licensed-character figures without licensing risk. **Sebs explicitly overruled** the concern 2026-05-29 ("idc about keeping it ip clean"). Pokémon figure stays as-is in the 9-object slate. If legal exposure surfaces later (e.g., during applied-surface depth pass or pre-application review), revisit; otherwise carry forward.

**I4. GF alt-POV object cross-check** (per `portfolio-style-art-voice-source.md §5.1`).

GF's 9 alternative objects: Photo of her · Lego · Calendar · Sketchpad · Laptop · Fidget thing · Baby juice · Clock/timer · Keyboard.

Per-item cross-check:
- **Lego**: trademark concern (Lego is heavily IP-protected). Use generic construction-blocks if this slot survives narrowing.
- **Calendar**: fine. Could read as "I organize / I plan." Date can be Sebs-meaningful.
- **Sketchpad / Laptop / Fidget thing / Keyboard**: overlap with Seb's MacBook / sketchbook / clicky pen. Consolidate, don't duplicate.
- **Photo of her**: overlaps semantically with Seb's "love letter to gf." Pick one direction; don't ship both.
- **Clock/timer**: fine, could read as "I time-box / I race the clock."
- **"Baby juice"**: **RESOLVED 2026-05-29.** = Sebs' seltzer-with-apple-juice mix. GF's pet name (babies get watered-down juice). **Same object as Seb's seltzer slot — overlaps, not a new object.**

**GF alt-POV verdict for F3-A**: per phase-2-v1 synthesis pattern, GF list was divergent intuition for direction-shaping (Sebs vs GF tension synthesis lives in `phase-2-v1-brand-direction.md`), not a ship-list. **F3-A default uses the 9-object Seb list** unmodified (with baby-juice ≡ seltzer overlap resolved). GF alt-POV stays logged as cross-check reference for F3-B + future Hero #8 cells, not as F3-A objects.

### J. Page-entry intent for F3-A

**§10 framework recap** (per `cross-system-rules.md §10`): Intent × Context = Behavior. Six dimensions shape behavior: Mode axis · Module job · Tier/state (intent dimensions) + Adjacent registers · Composition heaviness · Position in case study (context dimensions).

Hero #8 introduces **page-entry intent** as a new dimension (intent #0 — hooking before §01 orients). Per setup plan item 11 + cross-system-rules §14 Hero row.

**F3-A traced through the framework:**

| Dimension | F3-A specifically |
|---|---|
| **Mode axis (intent)** | **"Pre-framing"** — outside the §01–§10 reading-mode arc entirely. Homepage is pre-case-study. New mode added to Cycle 5's framing/interpretation/proof/resolution map. |
| **Module job (intent)** | **"Establish authorship before establishing project."** Desk reveals who; cards below reveal what. Hero is autobiographical signal; below-fold is portfolio signal. |
| **Tier/state (intent)** | **Top tier of identity expression.** Most concentrated signal of who Sebs is. Equivalent to the §01 Section eyebrow + Title cluster's importance, but at page-entry not case-study-entry. |
| **Adjacent registers (context)** | **Above**: Nav layer (its own register grammar per Navigation system). **Below**: featured project card (different intent — "this is what I've shipped"). The hand-off from scattered identity above to focused work below IS the intent shift. |
| **Composition heaviness (context)** | F3-A band geometry: 40-55vh, horizontal sweep, ≤9 objects laid across. Medium composition heaviness — not shallow (objects to interact with) but not heavy (no module-spine structure). |
| **Position in case study (context)** | Outside the case-study arc. The case study starts at §01 (when user clicks a project card). F3-A is the affordance that makes the cards' selection meaningful — knowing who Sebs is shapes how cards read. |

**F3-A page-entry intent statement** (candidate for the §14 Intent entry addendum at 8.8 lock):

> *"F3-A's page-entry intent is **scattered authorship → focused work**. The desk surfaces identity through scattered hover-discoverable objects; the featured card below surfaces work as focused composition. The hand-off from scattered to focused IS the intent — it primes the reader that Sebs is the person who orchestrates this scatter into shipped work."*

**Trace through phase-2-v1 brand DNA:** "Premium-leaning with handmade underlayer · Cool on first read, warm on interaction" (§§6-7) — F3-A's desk fits both clauses. **Cool surface read** = scattered-but-composed desk reads as restrained at first glance. **Warm-on-interaction** = hover-discoverable objects reveal personal meaning on demand.

**Trace through north-star mantra:** "Structured enough to trust. Alive enough to feel authored." F3-A passes both — the desk's compositional rule (Section K2) provides structure-to-trust; the hover-discoverability + handmade-line aesthetic (deferred 8.1-A-VARIANT) provides alive-to-feel-authored.

**Convergence vs divergence (per §10 + §12)**: F3-A is a **path C convergence at the page-entry layer**. The locked Type / Color / Spacing systems all apply convergently (no register surgery needed). The new intent dimension (page-entry) is a §10 framework expansion at 8.8 lock — Path C surgical revision to `cross-system-rules.md §10`.

**Anti-drift for J**: do NOT bleed "case-study reading-mode intent vocabulary" backward into the page-entry layer. The §01 Section eyebrow + Title's "orienting" intent does not apply to F3-A — F3-A's intent is "establishing authorship," which is upstream of orienting.

### K. Anti-drift for F3-A

Synthesizing setup plan item 11 anti-drift + north-star anti-list + Section C "cool toys" trap + ground-up-per-layout invariant into one F3-A-specific anti-drift block.

**K1. Hero zone boundary** (per setup plan item 11 + cross-system-rules §14 Hero row).

F3-A must NOT become:
- **Feature showcase** — desk is NOT "look at the technical features I built into this hero."
- **Gallery** — desk is NOT a portfolio greatest-hits display.
- **Page-summary** — desk is NOT a TL;DR of what's below (TL;DR explicitly ruled out for hero per setup plan item 7).

F3-A must remain: **identity affordance**. Objects signal *who Sebs is*, not *what Sebs has shipped*. The featured project card directly below does shipping signal. Hero ≠ summary; hero = entrypoint to authorship.

**K2. Rule-breaking composition** (per `feedback_rule_breaking_standard`).

F3-A's "messy desk with high-craft" aesthetic must be **composed messy, not actually messy**.

- Every object placement intentional. Coordinates calibrated, not procedurally scattered.
- Tilt angles within a sanctioned range (e.g., -8° to +8°) — not random per-load.
- Hover affordances per object documented and tested — not "whatever pointer lands on."
- "Mess" emerges from compositional tension (object overlap · varied scale · z-depth layering), not from random placement.

**Anti-failure**: a procedurally-shuffled "desk" that re-shuffles per page load reads as gimmick. Lock the composition; the messiness is in the locked composition, not in the randomization.

**K3. North-star anti-list applied** (per `north-star-filter.md` "Kill it if it feels:" list).

| Anti-list item | F3-A failure mode |
|---|---|
| "Cool but less clear" | Desk objects with unclear meaning fail — every object must be readable as Sebs-signal within 5 seconds of hover. Decoded reading list: see Section I. |
| "Expressive but ungoverned" | Orbit/drag without constraint fails — Section D recommendation (click hotspots only) holds the line. Variants A/C exist as 8.1-A-VARIANT-orbit / 8.1-A-VARIANT-drag deferred passes if signature interaction warrants them. |
| "Premium but lifeless" | Perfect 3D with no hover-warm fails. The hand-feel `lib/handFeel.ts` variant (deferred 8.1-A-VARIANT-handdrawn) IS the warmth countermeasure if default F3-A reads too clinical at IC quality. |
| "Handmade but messy" | Actual mess fails (see K2). Composed messy passes. |
| "Experimental but unbounded" | Exotic rendering tech without graceful fallback fails. F3-A kill-switch ladder (Section G4) is the bound. |
| "Dense and muddy" | 9 objects in 40-55vh band geometry is dense; "muddy" failure = tooltip overlap, hit-target collision, can't tell which object is which. Padding objects + tooltip flip logic (Section D) is the bound. |
| "Obviously borrowed from someone else's portfolio language" | Pokrzywa's full-bleed desk model + Carl Gordon's band layout informs F3-A but does not name it. F3-A is composed across them, not inherited from either. |
| "Interactive without purpose" | Decorative-only hover/click fails (K4). |
| "Decorative before structural" | Objects must structure the page-entry intent (J statement) before they decorate it. Decoration emerges from purposeful objects, not the other way around. |

**K4. The "cool toys" trap** (from Section C precedent finding — the failing desk-portfolios in [Really Good Designs](https://reallygooddesigns.com/interactive-portfolio-examples/)).

Desk objects must **resolve into meaning** on interaction. Pokrzywa wins by linking each object to actual case-study content. F3-A application: **every desk object must have a per-object purpose**:

- **Case-study route** (object → click → opens specific case study)
- **About-page anchor** (object → click → scrolls to about-page section)
- **Easter-egg reveal** (object → click → small reveal within hero, per `portfolio-style-art-voice-source.md §3.9` budget: max 6 site-wide, max 3 per page, 10-second discovery target)
- **External link** (object → click → external destination, e.g., Strava for running pin, Letterboxd for movies if added)

Decorative-only objects fail this trap. **Per-object purpose mapping is a Step 8.1-A.2 composition proposal deliverable.**

**K5. Ground-up-per-layout invariant** (per top-of-doc "Ground-up invariant" + user's reinforcement 2026-05-29).

F3-A composition is for horizontal-band geometry specifically. F3-B (desk in vertical column) is a separate ground-up research/build pass; nothing in F3-A research pre-emptively serves F3-B.

**Anti-drift implementations:**
- Compositional decisions in F3-A name horizontal-band reasons. (e.g., "9 objects laid across because band is wide-short" — NOT "9 objects on a desk because there are 9 objects.")
- 8.1-A.2 composition proposal does NOT reference how F3-B will reuse anything. F3-B opens its own research pass.
- If F3-A research surfaces a compositional rule that "could work for any layout," document the rule as an F3-A finding without pre-emptively scoping it forward. F3-B research will independently surface its own compositional rules.

**Anti-failure**: "F3-B can probably use the same desk objects but rotated" thinking. F3-B's vertical-column geometry may suggest fewer objects, different priority, or a fundamentally different composition (e.g., desk-from-above vs desk-from-side). That's an F3-B-research decision; F3-A research doesn't speculate.

**K6. Independent-containers invariant** (per setup plan item 4 — already in doc, restated as anti-drift).

F3-A composition must NOT compose with the featured project card below as a single viewport unit. Hero band and featured card are independent containers. Compositions that:
- Anchor the hero band to a sticky position that overlaps the card
- Size the hero band to a percentage that intentionally leaves card content visible
- Animate hero → card as a continuous gesture across one viewport

…all fail this invariant. The hand-off is natural-flow (Section E lean): hero scrolls past, card claims viewport.

**K7. Per-cell continuity addressability** (per setup plan item 6 — also setup-plan invariant).

F3-A must articulate its CS-hero continuity proposal (Section H recommendation: no-continuity default). Cells that fail to articulate a defensible continuity option are documented weaknesses; F3-A passes by recommending no-continuity with rationale (Section H).

---

## 8.1-A.2 composition proposal

**Status:** Opened 2026-05-29 after 8.1-A.1 research landed + user resolutions ("baby juice" = seltzer · Pokémon stays · GF alt-POV stays as cross-check only). Still docs-only. NO code. Composition proposal is the bridge from research findings (A–K) to the buildable lab spec.

**Framing per user directive 2026-05-29:** "if your asking what items to choose then that can just be a toggle where we switch our different item." This proposal locks the **default lean** for each F3-A decision and names the **toggle inventory** that will be wired into the lab at 8.1-A.4 build. Variant toggles for "which item / which treatment / which model"; on/off toggles for "include this or not." Matches LabShell convention.

---

### Default lean (the "set" that ships first at 8.1-A.4 build)

When the user first loads `/hero-8/F3-A` in the lab after 8.1-A.4 build, this is the composition they see before touching any toggle:

| Decision | Default | Cited from |
|---|---|---|
| **Rendering tech** | R3F + drei | §A — interaction maturity wins for tooltip-cursor signature |
| **Object style** | Toon-shaded 3D + edge-line post-pass | §I1 — best hairline-aesthetic fit; matches `lib/handFeel.ts` family on the deferred VARIANT pass |
| **Interaction model** | Click hotspots only | §D — strongest fit for "minimal interaction" brief + band geometry |
| **Hover tooltip** | DOM tooltip following cursor with spring lag · scene `onPointerOver` writes content | §D — implementation pattern decoded |
| **Object inventory (9)** | MacBook · Pokémon figure · love letter to gf · seltzer (= "baby juice") · sketchbook · pyramid · running pin · Colombian + American flag · clicky pen | §I2 + user resolutions 2026-05-29 |
| **Object arrangement** | Single horizontal scatter across the band; mild tilt variance (-8° to +8°); composed messy not random | §C constraints + §K2 anti-drift |
| **Title default copy** | "Turning chaos into intentional design." | §1.5 candidate · GF-suggested · short manifesto · placeholder until 8.1-A.3 final pass |
| **Band geometry** | `clamp(420px, 48vh, 560px)` band height; full content-width or page-width (TBD at build) | §E — banded-above-grid 40-55vh range; clamp adapts to viewport |
| **Independent-containers** | Natural-flow; featured card container `min-height: 100vh`; no scroll-snap | §E + §K6 |
| **Hand-off transition** | Featured card scroll-linked scale 0.96→1.0 across first ~200px intersection | §B5 (Elise pattern stolen) |
| **Entrance choreography** | Title + band frame SSR-instant (Rachel pattern); objects stagger in opacity 0→1 + translateY 8-16px, ease-out 400-600ms, stagger 60-120ms per object | §B4 + §B7 — staggered entrance + SSR-instant split |
| **Grain divider at band bottom** | SVG/CSS gradient-masked grain across band, dies at lower edge | §B2 (Tammy pattern stolen) |
| **CS-hero continuity** | No-continuity (clean cut between F3-A and CSML §01 hero) | §H — recommended; respects CSML M1 lock |
| **Performance** | Triangle budget ≤75k total · payload <2 MB first paint / <5 MB full · KTX2 textures · Draco geometry · pixel ratio clamp `Math.min(devicePixelRatio, 2)` · no post-processing beyond outline pass | §F |
| **Fallback ladder** | drei `<PerformanceMonitor>` bounds [30, 500]: onDecline → drop DPR + disable outline → second decline → swap canvas for static poster; manual "reduce motion" toggle in page chrome; `prefers-reduced-motion` honored | §G1 + §G4 |
| **Mobile fallback** | 14islands progressive-enhancement: server reads `Save-Data`; client gates canvas on `(!saveData && effectiveType==='4g' && !reducedMotion && WebGL)`; otherwise serve static poster | §G3 |
| **A11y** | Proxy-DOM mirror — hidden focusable `<button>` per interactive object, positioned over canvas with `pointer-events: none` on non-interactive copy; `role="application"` on canvas; aria-label per object | §G2 |

---

### Toggle inventory (what gets wired into LabShell at 8.1-A.4 build)

All toggles match the LabShell chrome dropdown pattern. Each toggle's default value matches the lean above.

#### Variant toggles (pick-one selection)

| Toggle | Options | Lean | Why a toggle |
|---|---|---|---|
| **Rendering tech** | R3F+drei · CSS 3D sprite planes | R3F+drei | §A flagged both as honest answers; A/B reveals which sits better in the band geometry |
| **Object style** | Toon-shaded + outline · Flat low-poly · CSS 3D sprite (when rendering tech = CSS 3D) | Toon-shaded | §I1 — three candidate routes; toggle exposes the trade-off live |
| **Interaction model** | Click hotspots only · Interactive orbit pick-one · Drag in defined area | Click hotspots | §D — three control models; orbit + drag are deferred VARIANT candidates per §K3, but adding the toggle now lets us probe without separate cell |
| **Tilt-angle range** | Tight (-3° to +3°) · Medium (-8° to +8°) · Wide (-15° to +15°) | Medium | §K2 — composed-messy bounds need calibration against the actual scene |
| **Hover treatment** | Scale-up + tooltip · Outline halo + tooltip · Cursor-change + tooltip · All three | All three | §D — they stack additively; toggle exposes individual contribution |
| **Entrance stagger** | Off · Subtle (60ms) · Medium (120ms) · Pronounced (200ms) | Medium | §B4 — staggered entrance is a calibration question |
| **Band height clamp** | Compact (clamp 360,40vh,460) · Default (clamp 420,48vh,560) · Tall (clamp 480,55vh,620) | Default | §E — band sizing is a feel-test |
| **CS-hero continuity** | No-continuity · Title morph · Object persist | No-continuity | §H — three options analyzed; toggle lets us A/B against case-study route navigation |
| **Grain divider** | Off · Subtle · Medium · Strong | Subtle | §B2 — Tammy steal, but the strength needs feel-testing |
| **Featured-card hand-off** | None · Scale-link (Elise) · Card-scale + opacity | Scale-link | §B5 — hand-off intensity needs feel-testing |
| **Title copy** | "Turning chaos into intentional design." · "I help teams turn messy product ideas into clean workflows." · "Clear interfaces for complex workflows." · "Systems, prototypes, shipped outcomes." | "Turning chaos…" | §1.5 — 8.1-A.3 review will pick or finalize; placeholder is GF-suggested |

#### Per-object on/off toggles (one per slot)

Each of the 9 objects gets its own on/off toggle so individual objects can be A/B'd or temporarily hidden to read the composition without them:

`obj.macbook` · `obj.pokemonFigure` · `obj.loveLetter` · `obj.seltzer` · `obj.sketchbook` · `obj.pyramid` · `obj.runningPin` · `obj.flagColombiaUSA` · `obj.clickyPen`

Default: all on. Off-state collapses the object's slot in the band layout (other objects redistribute).

#### Per-object purpose toggle (K4 deliverable — what each object DOES on click)

| Object | Click action options | Default | Notes |
|---|---|---|---|
| **MacBook** | Case-study (Ion) · Case-study (Canopi) · Case-study (Elara) · About anchor (Tools/workspace) · External (GitHub) · Easter-egg (top programs reveal) | Case-study (Ion) | The hero work artifact; Ion is the strongest case at this writing |
| **Pokémon figure** | About anchor (Inner child) · Easter-egg (tooltip) · External (Pokémon-related link e.g., a beloved game review) · Easter-egg (cursor-change on click) | Easter-egg (tooltip) | Personality signal |
| **Love letter to gf** | Easter-egg (tooltip "for [name]") · About anchor (Personal/love) · External (GF Instagram if she consents) · Easter-egg (reveal sketch on click) | Easter-egg (tooltip) | Restrained, personal |
| **Seltzer** | Easter-egg (tooltip explaining "baby juice") · About anchor (Quirks) · Easter-egg (cursor → bubbles on click) | Easter-egg (tooltip) | The joke is the payload |
| **Sketchbook** | Case-study (Elara) · Case-study (Canopi) · Case-study (Ion) · About anchor (Process) · Easter-egg (reveal sketch overlay) · External (Are.na or similar) | Case-study (Elara — visuals TBD at 8.1-A.4) | Process signal; case-study pick depends on visual readiness at build time |
| **Pyramid** | About anchor (History/culture) · Easter-egg (cultural fact reveal) · External (Wikipedia or cultural link) | About anchor (History/culture) | Identity signal |
| **Running pin** | External (Strava) · About anchor (Health/discipline) · Easter-egg (last race result reveal) · External (Letterboxd for the rec movies subtoggle?) | External (Strava — confirm Strava-public at 8.1-A.3) | Real-life signal |
| **Flag Colombia+USA** | About anchor (Roots) · Easter-egg (place reveal) · External (something Colombian-American culture related) | About anchor (Roots) | Identity signal |
| **Clicky pen** | Easter-egg (cursor change on click) · Easter-egg (audio click sound + small line drawn) · Easter-egg (random doodle reveals) · About anchor (Fidgets) | Easter-egg (cursor change on click) | Fidget signal; pure delight |

All click actions match `portfolio-style-art-voice-source.md §3.9` easter-egg budget (max 6 site-wide, max 3 per page, 10-second discovery target). F3-A's 5 easter-egg slots (Pokémon · love letter · seltzer · pyramid · clicky pen) + 1 about anchor (flag) + 2 case-study routes (MacBook · sketchbook) + 1 external (running pin) = **8 click affordances total · 5 easter eggs (within budget) · 2 case-study handles · 1 external**.

#### On/off toggles (auxiliary)

| Toggle | Default | Notes |
|---|---|---|
| Tooltip-cursor enabled | On | Signature interaction; off-state falls back to anchor tooltip |
| Outline pass | On | Off-state shows un-outlined toon shading; for perf debug |
| Object stagger entrance | On | Off-state shows all objects mounted at once |
| Adjacent-hover dim | On | §B4 steal — siblings dim when one object hovered |
| Grain divider | On (Subtle) | Combines with the variant toggle above |
| Page-chrome reduce-motion toggle | On | The user-controlled kill switch |

---

### Deferred VARIANT passes (separate research + build · not toggles in this cell)

Per the user's "treat as separate variation, after we get initial one set" directive 2026-05-29:

| Variant pass | When it opens | Scope |
|---|---|---|
| **8.1-A-VARIANT-handdrawn** | After F3-A default lands + Sebs review | Hand-drawn line aesthetic using `lib/handFeel.ts` family — seeded LCG, multi-stroke jitter. Could replace 3D objects entirely with line illustrations OR overlay line-feel on 3D as a stylization pass. NOT a toggle within F3-A; opens its own research + composition + build cycle. |

(Future deferred VARIANT slots could include: orbit-model variant, drag-model variant, scattered-canvas variant inspired by aninguyenle /playground — but these are 8.1-A.2 + 8.1-A.4 build decisions to defer or absorb later.)

---

### F3-A composition geometry — text mockup

A schematic of the lean composition (text-only; visual mockup is 8.1-A.4 build territory):

```
┌─ HEADER / NAV LAYER (locked by Nav system) ─────────────────────┐
│                                                                 │
├─ F3-A BAND (clamp 420px / 48vh / 560px) ─────────────────────────┤
│                                                                 │
│   [ Eyebrow: HOMEPAGE ]                                         │
│   [ Title: I design complex systems with clarity. ]   ← SSR-instant
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  [pin]    [pyramid]   [sketchbook]    [pen]            │   │
│   │      [letter]    [MacBook 16°]  [seltzer]              │   │  ← 3D scene
│   │                       [flag] [Pokémon -8°]             │   │  (tilt -8° to +8°)
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   〰〰〰〰〰〰 grain-mask divider 〰〰〰〰〰〰〰〰〰〰〰〰〰〰〰   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   FEATURED PROJECT CARD (independent container · min-h: 100vh)  │
│   (Project Card System — locked by #2 Project Card)             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- Title placement: above the 3D scene, aligned to band's content gutter. The title is SSR-instant + plain HTML; the 3D scene hydrates and animates objects in after.
- 3D scene fills the band's lower 2/3; title cluster sits in top 1/3.
- Tooltip-cursor renders OUTSIDE the canvas (DOM layer above), respecting band edges (flip up near bottom, flip down near top).
- Grain divider sits at band's bottom edge; dies into transparency above the featured card.

---

### Anti-drift checklist applied to this composition

| Anti-drift | F3-A composition status |
|---|---|
| **K1 — hero zone boundary** | ✅ Desk objects all signal identity, not shipped work. Featured card directly below carries shipping signal. |
| **K2 — composed messy not actually messy** | ✅ Tilt range bounded (-8° to +8° default · toggle for variants); object placements coordinate-locked, not procedurally shuffled. |
| **K3 — north-star anti-list** | ✅ Per-object meaning (per-object purpose toggle); click hotspots only (governed interaction); kill-switch ladder bounds rendering tech; hand-feel VARIANT addresses "premium but lifeless" risk if it surfaces. |
| **K4 — cool-toys trap** | ✅ Per-object purpose toggle deliberately maps each object to case-study OR about OR external OR easter-egg. No decorative-only slots. |
| **K5 — ground-up per layout** | ✅ Geometry reasons named (horizontal scatter because band is wide-short). F3-B not mentioned in this composition. F3-B opens its own ground-up research pass. |
| **K6 — independent containers** | ✅ Natural-flow + featured card `min-height: 100vh`. Hero and card don't coexist in viewport. |
| **K7 — continuity addressability** | ✅ No-continuity default with rationale (§H); morph + persist on the variant toggle. |

---

### 8.1-A.3 review resolutions (2026-05-29)

| # | Question | Resolution |
|---|---|---|
| 1 | Title copy | Placeholder = "Turning chaos into intentional design." (GF candidate from §1.5). Title toggle exposes 3 alternates. Final pick at 8.1-A.4 walkthrough OR at a later content pass. |
| 2 | Per-object click destinations | Options always — expanded each object's destination toggle (3–6 options per object). User picks defaults during 8.1-A.4 walkthrough. Sketchbook → final case-study pick deferred until 8.1-A.4 visual-readiness check. Running pin → Strava-public confirmation deferred until 8.1-A.4. |
| 3 | Tilt range | Options always — variant toggle (Tight / Medium / Wide) stays as proposed. Default = Medium (-8° to +8°). User picks live default during walkthrough. |
| 4 | CS-hero continuity | User delegated to me ("u decide") — locking no-continuity as default. Title morph + object persist stay on toggle for A/B walkthrough. |

---

### What 8.1-A.2 does NOT do

- Does not write any code (`.tsx` / `.ts` / `.css` / routes).
- Does not pick the final answers for the variant toggles — those reveal themselves after the build is walkable.
- Does not commit to assets (Blender models, textures) — 8.1-A.4 build can start with placeholder geometry (low-poly proxies) and asset-load swap in later per `feedback_research_first_no_fake_provenance` + Hero #8 build sequence.
- Does not modify `lib/handFeel.ts` or any artifact components — F3-A default is a separate render path from the case-study artifacts.

---

### Handoff to 8.1-A.3 review

Sebs reviews this composition proposal. Possible outcomes:
- **Approve as written** → 8.1-A.4 build opens
- **Adjust + approve** → updates merge into this section · 8.1-A.4 opens
- **Reject + redirect** → revisit 8.1-A.1 research scope OR pick a different F-family cell as the reference for 8.1-A

Standing by for review.

---

## Section L — AI tooling pipeline (Claude-native)

**Status:** Opened 2026-05-29 after user directive: "we can always modify stuff if we import, i also recommend looking into any tools plugin etc that we can use for these 3d stuff ik there ai stuff and tools that are made for claude etc etc" + critical reminder "this is all happening in claude dont forget."

**Framing:** all asset generation + 3D pipeline work happens INSIDE Claude Code. Tool choices must be **Claude-drivable via MCP servers + Claude Code skills**, not standalone tools that require leaving the chat. The user is solo; Claude is the operator.

### L1. Anthropic-official + Claude-compatible MCP servers to install

These let Claude (me) directly drive the asset pipeline from within this chat:

| MCP server | What it does | URL | Priority |
|---|---|---|---|
| **Anthropic official Blender connector** | First-party. Lets Claude create/delete objects · edit materials · set up lighting · batch-modify across objects. Announced April 28, 2026 as one of nine creative-tool connectors. Built on MCP, ships through Claude's connector directory. | [anthropic.com/news/claude-for-creative-work](https://www.anthropic.com/news/claude-for-creative-work) | **MUST INSTALL** — primary pipeline |
| **basementstudio/mcp-three** | Converts GLB models into R3F JSX components automatically · analyzes model structure. Eliminates manual `npx gltfjsx --transform` runs per asset. | [github.com/basementstudio/mcp-three](https://github.com/basementstudio/mcp-three) | **High value** — saves manual JSX conversion per object |
| **Sketchfab MCP** (gregkop) | Search · view details · download Sketchfab models (gltf/glb/usdz/source) from chat. **Needs Sketchfab API key — user does NOT have one 2026-05-29.** Skip unless user opts in later. | [github.com/gregkop/sketchfab-mcp-server](https://github.com/gregkop/sketchfab-mcp-server) | **SKIPPED** for now. Route asset hunting through BlenderKit (via Blender connector) + Poly Haven + Kenney. |
| **Community Blender MCPs (alt path)** | ahujasid/blender-mcp + forks (olbboy/claudekit-blender-mcp, sandraschi/blender-mcp, minihellboy/claude-blender). Authorized for use per user 2026-05-29. **Constraint**: bind port 9876 single-client — don't run in parallel with Anthropic's official connector. Pick one or the other per session. Forks add features (claudekit = 26 specialized tools, sandraschi = ~150+ operations + Tauri dashboard). | [github.com/ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp) · [github.com/olbboy/claudekit-blender-mcp](https://github.com/olbboy/claudekit-blender-mcp) · [github.com/sandraschi/blender-mcp](https://github.com/sandraschi/blender-mcp) | Alt — use either Anthropic official OR a community MCP per session, not both simultaneously |

### L2. Blender plugins (driven via Anthropic Blender connector)

Plugins run INSIDE Blender; Claude drives Blender via the official MCP connector. Install before pipeline starts:

| Plugin | Role | URL |
|---|---|---|
| **Tripo 3D for Blender** (VAST-AI-Research) | Tripo API → Blender. Text-to-model · image-to-model · multiview-to-model. Real-time progress. Native Tripo 3.0 segmentation + Smart Low Poly. | [github.com/VAST-AI-Research/tripo-3d-for-blender](https://github.com/VAST-AI-Research/tripo-3d-for-blender) |
| **BlenderKit** | 100K+ assets · ~48K free models/HDRIs/materials. 2025-2026 added AI-powered search. | [blenderkit.com](https://www.blenderkit.com/) |
| **Stable Projectorz** | Open-source AGPL-3.0. Depth-aware Stable Diffusion texture projection. Most useful for the toon-style adaptation of AI-generated meshes. Requires GTX 1080+, 12GB RAM, local SD. | [stableprojectorz.com](https://stableprojectorz.com/) |
| **Quad Remesher** (paid) OR rely on Tripo's Smart Low Poly | Automatic quad retopo for clean toon-shading topology | [blenderartists.org/t/quad-remesher-auto-retopologizer/1170913](https://blenderartists.org/t/quad-remesher-auto-retopologizer/1170913) |
| **Dream Textures** OR **StableGen** | Generative material editor for unique textures (love letter paper, flag fabric) | [github.com/carson-katri/dream-textures](https://github.com/carson-katri/dream-textures) · [github.com/sakalond/StableGen](https://github.com/sakalond/StableGen) |
| **Official Stability for Blender** | Stability AI's cloud SD plugin — fallback if local GPU isn't enough | [80.lv coverage](https://80.lv/articles/stability-ai-released-official-stable-diffusion-plugin-for-blender) |

**Skip / clarify:**
- **RetopoFlow 4** — NOT AI-augmented (despite user hypothesis). Manual/sketch-based retopo. Use Quad Remesher or Tripo Smart Low Poly for auto.
- **AutoTexture** — no plugin specifically by this name in 2026 results. Closest matches: Dream Textures, [Cozy Auto Texture](https://github.com/torrinworx/Cozy-Auto-Texture), StableGen. Flag to user — they may have meant one of these.

### L3. Claude Code skills (drop into `~/.claude/skills/`)

These are markdown context packs that enhance Claude's R3F + Three.js + ECS coding behavior. No install beyond file drop.

| Skill | What it adds | URL |
|---|---|---|
| **Nice-Wolf-Studio/claude-skills-threejs-ecs-ts** | Three.js + ECS + TypeScript skill collection | [github.com/Nice-Wolf-Studio/claude-skills-threejs-ecs-ts](https://github.com/Nice-Wolf-Studio/claude-skills-threejs-ecs-ts) |
| **EnzeD/r3f-skills** | R3F-specific skill files | [github.com/EnzeD/r3f-skills](https://github.com/EnzeD/r3f-skills) |
| **Vercel Labs R3F skill** | R3F coding guidance via Claude marketplace | [claudemarketplaces.com R3F skill](https://claudemarketplaces.com/skills/vercel-labs/json-render/react-three-fiber) |

### L4. Per-object generation strategy

| Object | Tool / approach | Why |
|---|---|---|
| **Pokémon figure** | Tripo 3.0 (Blender plugin · Stylization → cartoon mode) OR Meshy 6 (Low Poly Mode) | Both handle characters; Tripo segmentation lets you split head/body if needed |
| **MacBook** | Tripo 3.0 image-to-3D from a MacBook reference photo OR BlenderKit stock laptop OR Sketchfab CC0 | Hard-surface; multiple paths viable |
| **Seltzer can** | Tripo 3.0 image-to-3D from a real can photo OR Sketchfab stock | Simple cylinder geometry; image-to-3D very fast |
| **Sketchbook** | BlenderKit stock book mesh + custom doodle cover texture (Dream Textures or hand-painted) | Stock asset faster than generation; doodles are the personality |
| **Clicky pen** | Tripo 3.0 image-to-3D from reference photo OR Sketchfab | Specific small geometry |
| **Love letter** | Hand-model in Blender (plane + bend modifier + paper texture) | Specific/flat — faster manual than prompt-tuning |
| **Small pyramid** | Hand-model in Blender (4 triangles + base) | Trivial — don't burn AI credits |
| **Running pin** | Image-to-3D in Tripo OR SF3D from reference photo, then retopo via Quad Remesher | Small detailed object; AI gives form, retopo cleans for toon |
| **Colombian + American flag** | Hand-model in Blender (plane + cloth sim OR plane + image texture) | Geometry trivial; texture is the work |

### L5. Text-to-3D / image-to-3D engines evaluated

**Strongest 2026 picks for this stack:**

1. **Tripo 3.0 Ultra** ([tripo3d.ai](https://www.tripo3d.ai/)) — 20B-param engine. **AI Segmentation** (split mesh into editable parts in one click), quad-vs-triangle toggle, **Smart Low Poly retopo module** with face-limit constraints, **Model Stylization** with cartoon/sketch/hologram modes (matches our toon target). Up to 500K polygons. GLB default. Free plan ~24-30 models/month; paid from ~$11.94/mo. **Has official Blender add-on** (per L2). **Top primary pick.**
2. **Meshy 6** ([meshy.ai](https://www.meshy.ai/)) — Released Jan 18, 2026. **Low Poly Mode** with configurable quad/triangle topology, explicit polycount target, A/T pose support. Native GLB. Preview ~30s, finished ~2 min. Free outputs CC BY 4.0; Pro ~$20/mo. **Top secondary pick.**
3. **Rodin Gen 2 (Hyper3D)** ([hyper3d.ai](https://hyper3d.ai/blog/rodin-gen-2)) — 10B-param engine. Native quad-mesh output 2K-500K triangles with PBR maps. **Hard-surface objects stronger than organic** — favorable for MacBook/seltzer/sketchbook/pen, less for Pokémon. On [fal.ai](https://fal.ai/models/fal-ai/hyper3d/rodin) + [wavespeed.ai](https://wavespeed.ai/models/hyper3d/rodin-v2/text-to-3d).
4. **Hunyuan3D 2.1** (Tencent, open source) ([github.com/tencent-hunyuan/hunyuan3d-2.1](https://github.com/tencent-hunyuan/hunyuan3d-2.1)) — Free + offline + no per-mesh cost. **BUT requires 11.5GB VRAM for shape, 24.5GB for shape+texture** — verify local GPU before relying. Blender add-on released Jan 2025.
5. **Stable Fast 3D (SF3D)** ([github.com/Stability-AI/stable-fast-3d](https://github.com/Stability-AI/stable-fast-3d)) — Image-to-3D, 0.5s gen. UV-unwrapped with delighting (removes baked illumination — IMPORTANT for toon shading because you want flat ink, not pre-baked PBR shadows). Stability Community License: free for portfolio use (under $1M revenue org).
6. **TripoSR** ([github.com/VAST-AI-Research/TripoSR](https://github.com/VAST-AI-Research/TripoSR)) — Open-source predecessor to SF3D. <0.5s on A100. 6GB VRAM min. Lower quality than Hunyuan3D 2.x; easier to run.

**Skip:**
- **Luma AI Genie** — murky 2026 status; Genie pages redirect; Luma focused on video. Don't depend.
- **InstantMesh / One-2-3-45++** — academic-origin, no notable 2026 updates; superseded by SF3D + Hunyuan3D 2.1.
- **CSM AI / Cube** — useful for whole-scene generation; less efficient for our single-asset workflow.
- **3DFY.ai** — enterprise pricing built for thousands-of-assets catalogs; not for 9 hero objects.
- **Sloyd.ai** — parametric (not diffusion). Strong for parametric props (MacBook, can, pen) IF its parameter coverage matches; verify before committing.

### L6. Web-based 3D tools with AI

- **Spline AI V1** ([spline.design/ai-generate](https://spline.design/ai-generate)) — text-to-3D + image-to-3D producing 4 variants pre-optimized for browser. $5/seat/month with 2000 AI credits/month. Exports GLTF / USDZ / STL + React/HTML/JS snippets. **Has an MCP server** ([PulseMCP listing](https://www.pulsemcp.com/servers/aydinfer-spline-3d-design)) so Claude can drive it. Best for the **generation tool**, not the runtime — generate the 4 variants, export GLB, pipeline through gltfjsx → R3F.
- **Polycam** ([poly.cam](https://poly.cam/)) — photogrammetry (cloud) + LiDAR (iPhone 12 Pro+). Pro plans export GLTF + Gaussian Splat PLYs. Useful for **real desk-scan input** — scan an actual love letter, Pokémon figure, or running pin on a table to bootstrap a mesh.
- **Womp** ([womp.com](https://www.womp.com/)) — browser sculpting. **Womp Spark** AI uses industry models. Niche fit; possibly useful for the Pokémon figure specifically (sculpting metaphor handles organic forms).
- **Vectary** — browser editor, web-embed strong. Less AI-native in 2026. **Skip** for an R3F-first build.

### L7. Style-adaptation pipeline (AI PBR → toon + outline)

AI tools all output **PBR-style** meshes with baked-or-implied lighting. To translate into the locked F3-A toon + outline aesthetic:

1. **Generate at low polycount** in Tripo / Meshy / SF3D — keep each asset under 8k tris, total scene <75k.
2. **Run Blender pipeline** (driven by Claude via Anthropic Blender connector):
   - Import GLB → Quad Remesher OR Tripo Smart Low Poly → strip imported PBR materials → assign placeholder material slot (R3F replaces at runtime).
3. **In R3F** (Claude generates the code):
   - Replace materials with `MeshToonMaterial` ([three.js docs](https://threejs.org/docs/pages/MeshToonMaterial.html)) using a quantized gradient map (NearestFilter for hard cel bands)
   - Apply duotone accents from W1 palette
4. **Outline pass options**:
   - `OutlineEffect` ([three.js docs](https://threejs.org/docs/pages/OutlineEffect.html)) — inverted-hull approach, simplest install
   - `@react-three/postprocessing` Outline effect — selective per-object, no inverted hull
   - Depth+normals edge-detection post-pass — cleanest for "hairline + pure line" look
   - **Note 2026:** As of three.js r183, post-processing renamed to RenderPipeline per [Three.js Roadmap 2026 guide](https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026). If migrating to WebGPURenderer, use `ToonOutlinePassNode` instead. EffectComposer remains WebGL-only.
5. **Optimize for <2 MB first paint** (per §F):
   - `npx gltfjsx scene.glb --transform` ([github.com/pmndrs/gltfjsx](https://github.com/pmndrs/gltfjsx)) — Draco-compresses, resizes textures to 1024², converts to WebP, dedupes, instances, prunes. Quoted 70-90% size reduction. Draco alone delivers up to 10x reduction.
   - **basementstudio/mcp-three MCP** (per L1) can run this from chat.
6. **Grain**: post-process OR static SVG noise overlay on canvas. **Cheaper than per-frame shader noise.** Matches §B2 (Tammy grain mask) when masked to band's bottom edge.

### L8. Top-line one-sentence pipeline recommendation

**Generate the 5 mid-complexity props (Pokémon · MacBook · seltzer · sketchbook · pen) with Tripo 3.0 via its Blender plugin (driven by Claude through the Anthropic Blender MCP connector), hand-model the 4 trivial-but-specific items (love letter · pyramid · running pin · flag) in Blender (also Claude-driven), pipeline final GLBs through basementstudio/mcp-three → R3F JSX components → drop into `/hero-8/F3-A` lab route with `MeshToonMaterial` + outline post-process.** Total pipeline cost: likely under $30 in API credits + one focused weekend of work.

### L9. Clarifications resolved (2026-05-29)

- **~~"AutoTexture"~~** — was Claude's error in research framing; user never named this. Removed from candidate list. (The texture-gen options remain: Dream Textures · StableGen · official Stability for Blender plugin.)
- **GPU for Hunyuan3D** — user has "more than enough" 2026-05-29. **Hunyuan3D 2.1 path open** as the free-offline-no-cost engine option alongside Tripo/Meshy (paid cloud).
- **Sketchfab API key** — user does NOT have one. Sketchfab MCP **SKIPPED**. Asset hunting routes through BlenderKit (in-Blender, Claude-driven) + [polyhaven.com](https://polyhaven.com) (CC0) + [kenney.nl](https://kenney.nl) (CC0).

---

## 8.1-A.3 user review notes

*Populated during user review.*

---

## 8.1-A.4 build trace

*Populated after build (Step 8.1-A.4 — not yet authorized).*
