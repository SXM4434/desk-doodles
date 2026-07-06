# Desk Doodles — UX / UI Improvements Backlog

**Scope:** every user-facing surface (`/`, `/canvas`, `/desk`, `/desks`, draw popup, draw tools, card detail / RE-DRAW / export modals, upload, onboarding). **Analysis only** — no src edits, no commits. Companion to the BUG hunt (crashes/breaks live there; this doc is polish/experience/affordance, *not* crashes).

**How to read severity/effort/agent-able:**
- **Severity** — High = a first-timer or demo viewer will hit it; Med = noticeable friction; Low = nice-to-have.
- **Effort** — S = <1hr clear-cut, M = a few hours, L = design+build.
- **Agent-able?** — **Yes** = clear-cut parallel work an agent can do alone. **Decision** = needs Sebs's design call first (per `feedback_agent_vs_main_chat_division`).
- **Now vs R12** — Most rows are **Now** (functional/experience). Rows tagged **R12** are visual/brand and should wait for the identity pass (`project_desk_doodles_own_design_language`) so we don't prematurely systematize.

**The standing context that shaped this audit:** this codebase is *unusually* UX-conscious already. There are explicit "UX-audit fix 1-4," honest connectivity chips, reduced-motion twins on every keyframe, focus traps, ARIA roles, empty/error/loading state separation, and a `feedback_keep_running_todo_doc` culture. Several surfaces are genuinely good and are called out as such. The improvements below are the real remaining gaps, not filler.

---

## TOP 10 — SPIN THESE FIRST

Ranked by leverage (severity × reach × how cheap the win is).

| # | Improvement | Surface | Sev | Eff | Agent? |
|---|---|---|---|---|---|
| 1 | **No per-stroke Undo/Redo anywhere in the draw flow** — only "Clear" (destroys all) + chip-level undos exist. The single highest-impact gap. | Draw tools (DrawSurface) | High | M | Decision (then Yes) |
| 2 | **No first-run guidance on `/desk`** — the empty-state copy is the *only* teaching, and a non-empty desk teaches nothing. A first-timer lands on a wall of strangers' doodles with no "this is yours / draw here" moment. | `/desk` | High | M | Decision |
| 3 | **OnboardingFlow is built but never mounted** — a finished "claim your space" moment sits dormant behind a flag that isn't wired into DeskPage. Wire it (even handle-only) or cut it. | Onboarding | High | S–M | Decision |
| 4 | **Draw tools are deeply hidden** (Snap/Straighten/Shade/Fill/Lasso) — discoverable only by reading captions while already in a tool. No legend, no "what can I do here." | Draw popup / `/canvas` | High | M | Decision |
| 5 | **Zero mobile/touch responsiveness contract** — no media queries app-wide; home page has none; touch targets fall below 44px in several clusters (zoom pills, drawer Place pill at 9px font). | All | High | M | Decision |
| 6 | **Home page undersells + dead-ends** — single 720px column, no visual of the product, "Try the engine" exposes the internal test surface to users as a peer CTA. | `/` | Med | S–M | Decision |
| 7 | **Slider controls have no keyboard/scrub affordance beyond native range** — 13 sliders, no double-click-to-reset, no type-a-value, tiny 14px track hard to grab on trackpad. | Chrome (Slider) | Med | S | Yes |
| 8 | **No keyboard-shortcut legend** — ⌘\, ⌘0, Esc-layers, pinch-zoom all exist but are invisible. A `?` cheatsheet or footer hint. | `/desk`, `/canvas` | Med | S | Yes |
| 9 | **"Add doodle" is the only entry to creating** — no canvas double-click-to-draw, no empty-desk "draw here" hotspot; the CTA is a single header pill. | `/desk` | Med | S | Decision |
| 10 | **Export/share has no shareable link or copy-to-clipboard** — only file download (SVG/PNG). A playful social app wants "copy link to this doodle." | Card detail modal | Med | M | Decision |

---

## By surface

### `/` — Home page
File: `src/app/components/DeskDoodles/DeskDoodlesHome.tsx`

| Improvement | Axis | Why it matters (source) | Sev | Eff | Agent? | Now/R12 | Build hint |
|---|---|---|---|---|---|---|---|
| No product visual at all — pure text column. First impression forms in ~50ms; a confusing/empty first screen loses users before they engage. | Info hierarchy / delight | NN/g: users form first impression within 50ms ([Raw.Studio](https://raw.studio/blog/empty-states-error-states-onboarding-the-hidden-ux-moments-users-notice/)) | Med | M | Decision | R12 (brand visual) | Add a live mini-desk strip or animated doodle hero; reuse `MiniDesk` from `DeskGallery.tsx` |
| "Try the engine" link sits as a peer of the two real CTAs — exposes the internal test surface (`/canvas`) as a user-facing option. | Affordance / IA | Capability/IA clarity — don't surface dev tools as product ([UXPin progressive disclosure](https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/)) | Med | S | Decision | Now | Demote or remove the `/canvas` link in `DeskDoodlesHome.tsx` (lines 86-97); keep it reachable, not advertised |
| No responsive treatment — 52px h1 + 96px vertical padding don't reflow for phones; `maxWidth:720` with fixed paddings will crowd small screens. | Trackpad/mobile | WCAG/Material touch + responsive type ([LogRocket touch targets](https://blog.logrocket.com/ux-design/all-accessible-touch-target-sizes/)) | Med | S | Yes | Now | Add a `@media` or clamp() type scale; the home file uses inline styles only |
| CTA row wraps awkwardly — three items (`Start doodling`, `Browse the wall`, text link) with `gap:12` and no `flexWrap`. | Consistency | Layout robustness | Low | S | Yes | Now | Add `flexWrap:'wrap'` to the CTA row container (line 61) |
| "Built in public · github…" band is a non-link styled like a card — looks clickable, isn't. | Affordance | Affordances must match behavior ([Zivtech UX principles](https://www.zivtech.com/blog/ux-principles-constraints-discoverability-feedback-and-more)) | Low | S | Yes | Now | Make it an actual `<a>` to the repo, or remove the card chrome |

**Verdict:** functional but thin. It's the weakest surface relative to the depth behind it. Most of the *visual* upgrade is correctly R12; the IA fixes (demote `/canvas`, fix the fake-link band) are Now.

---

### `/desk` — The shared desk (the real product)
File: `src/app/components/DeskDoodles/DeskPage.tsx` (2483 lines — already heavily UX-worked)

| Improvement | Axis | Why it matters (source) | Sev | Eff | Agent? | Now/R12 | Build hint |
|---|---|---|---|---|---|---|---|
| **No first-run guidance** — only the *empty* desk teaches ("Hit Add doodle…", line ~2262). A desk with others' doodles (the common case) gives a newcomer zero orientation. | Discoverability / onboarding | Empty states are teachable moments, but only fire when empty; need a real first-run layer ([Carbon empty states](https://carbondesignsystem.com/patterns/empty-states-pattern/)) | High | M | Decision | Now | A dismissible first-visit coachmark (localStorage-gated like `dd.onboarded`); point at "Add doodle" + "drag to arrange" + "Pen panel" |
| **No canvas-level entry to draw** — creating requires finding the header "Add doodle" pill. No double-click-empty-paper-to-draw, no floating "+" near the cursor. | Friction / click-count | Discoverability of the core action ([mannhowie UX principles](https://mannhowie.com/ux-design-principles)) | Med | S | Decision | Now | Wire `onDoubleClick` on the empty desk → `setDrawOpen(true)` placing at the click point |
| **Pen vs Desk scope is subtle** — the gate is two small pills with a 9px caption; the concept (live lens vs your-next-doodle) is genuinely hard and under-explained for a first-timer. | Affordance / copy | Mode visibility — modes must be obvious ([Zivtech](https://www.zivtech.com/blog/ux-principles-constraints-discoverability-feedback-and-more)) | Med | M | Decision | Now | Consider a one-time tooltip on first Pen→Desk flip; or a clearer label ("Restyle desk" vs "Pen") — *design decision* |
| **Foreign-doodle nudge is the only feedback you can't drag someone else's** — good, but there's no positive affordance that *yours* are draggable (cursor:grab helps; nothing else). | Affordance | Affordance visibility ([LinkedIn discoverability](https://www.linkedin.com/pulse/5-fundamental-ux-design-concepts-improve-usability-lisa-dzera)) | Low | S | Yes | Now | Subtle hover lift/outline on own objects only (ownerSession check already exists) |
| **No presence / "who else is here"** — realtime arrivals animate in (nice) but there's no live cursor or "3 people doodling" — a shared-canvas app's signature delight. | Delight / collaboration | Live presence keeps shared canvases from feeling dead ([FigJam](https://www.figma.com/online-whiteboard/)) | Med | L | Decision | R12 (or post-makeathon) | Supabase realtime presence channel; cursor labels per FigJam pattern |
| **Zoom pills are tiny touch targets** — `padding:'4px 10px'` − / + / Fit inside a pill group; below the 44px guidance for touch. | Accessibility / touch | WCAG 2.5.8 (24px min, 44px best practice) ([Smashing tap targets](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/)) | Med | S | Yes | Now | Bump min-height to 44px on coarse pointers (`@media (pointer:coarse)`) |
| **Camera shortcuts invisible** — ⌘0 Fit, pinch-zoom, two-finger pan all work but nothing tells the user. | Discoverability | Hidden features must hint at themselves ([IxDF progressive disclosure](https://ixdf.org/literature/topics/progressive-disclosure)) | Med | S | Yes | Now | Title attr on Fit already says ⌘0; add a `?` legend popover in the header |
| **`saveState` badge copy** uses curly apostrophes inconsistently and only shows under-object — fine, but a transient toast for the *first* save would reassure first-timers their work persisted. | Feedback / copy | Status visibility ([Setproduct empty/feedback states](https://www.setproduct.com/blog/empty-state-ui-design)) | Low | S | Yes | Now | One-time "saved to the shared desk ✓" toast on first successful publish |
| Empty-desk copy is 3 lines of instruction crammed center-screen — could be a friendlier illustrated empty state. | Empty state / delight | Designed empty states beat text walls ([SaaSFactor empty states](https://www.saasfactor.co/blogs/empty-state-ux-turn-blank-screens-into-higher-activation-and-saas-revenue)) | Low | M | Decision | R12 | Reuse `EmptyDeskMark` motif from gallery; add a single arrow to "Add doodle" |

**Verdict:** the *mechanics* are excellent (drag, camera, realtime, honest connectivity, retry, pan leash, fit-to-content). The gap is **education** — a powerful surface with almost no teaching for someone who didn't build it.

---

### Draw popup + `/canvas` — the drawing surface & tools
Files: `DrawPanel.tsx` (1775 lines), `DrawSurface.tsx` (2645), `DeskDoodlesCanvas.tsx`

| Improvement | Axis | Why it matters (source) | Sev | Eff | Agent? | Now/R12 | Build hint |
|---|---|---|---|---|---|---|---|
| **No Undo/Redo of strokes** — `Clear` wipes everything; there is no ⌘Z, no per-stroke remove, no Backspace. The chip "undos" (smart-pick, snap-original) are unrelated. This is the #1 expected drawing-app affordance. | Friction / standards / feedback | Undo is fundamental to drawing apps; multiple discoverable paths expected ([Concepts workspace](https://concepts.app/en/android/manual/yourworkspace), [TheCodingBus undo](https://thecodingbus.info/designing-a-basic-drawing-app-with-undo-functionality/)) | High | M | Decision (scope), then Yes | Now | `strokes` is plain state in DrawSurface — push a history stack; wire ⌘Z + a visible Undo pill next to Clear (line ~2332). Tone grid needs snapshotting too (snapshot pattern already exists for Escape-cancel) |
| **Tools are caption-only discoverable** — Ink/Shade/Snap/Straighten + (under Shade) Brush/Fill/Lasso/Erase/8 bands. A user who never taps a pill never learns the feature exists (by design for Snap, but Shade/Fill are core). | Discoverability | Capability invisibility → underused features ([UXPin](https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/)) | High | M | Decision | Now | A first-open mini-legend or labeled tool group; or icons + labels instead of text pills |
| **`Done` label is ambiguous in the popup** — popup `Done` *stages* (→ naming), but in-frame `Done` on `/canvas` *commits*. Two different "Done" meanings across surfaces. | Consistency / copy | Consistency principle ([mannhowie](https://mannhowie.com/ux-design-principles)) | Med | S | Yes | Now | Popup `Done` → "Next" or "Name it"; keep `/canvas` Done |
| **Snap/Straighten/Shade pills sit in a wrapping toolbar with a divider** — at narrow widths they reflow; the caption is the flexible item but the *tool group* can feel cluttered. | Info hierarchy | Balance showing vs clutter ([MIT discussion](https://community.appinventor.mit.edu/t/drawing-app-undo-redo-button/73049)) | Low | M | Decision | R12 | Group into a single segmented "tools" control; revisit at identity pass |
| **Shade band ladder = 7 swatches + Erase inline** — strong, but no per-swatch hover label for what each band's darkness means beyond the caption naming the active one. | Affordance / feedback | Signifiers for advanced functions ([LogRocket progressive disclosure](https://blog.logrocket.com/ux-design/progressive-disclosure-ux-types-use-cases/)) | Low | S | Yes | Now | `title` per swatch with the band name (COVERAGE_BANDS already has names) |
| **`Cancel` vs `Done` vs `Back` footer** — three buttons + an armed-Esc inline hint; the staged "Place on desk" replaces the footer. The flow is correct but button placement shifts between stages (cognitive load). | Consistency | Consistent control placement ([Zivtech](https://www.zivtech.com/blog/ux-principles-constraints-discoverability-feedback-and-more)) | Low | M | Decision | R12 | Keep primary action anchored bottom-right across all stages |
| **Brush cursor is `none` when active** (custom drawn cursor) — verify it renders on all browsers; a missing custom cursor = invisible brush. | Feedback | Pointer feedback | Med | S | Yes | Now | DrawSurface line ~2086 `cursor: brushActive ? 'none'` — confirm the custom ring always paints; add fallback `crosshair` |
| **Size-cap "Shrink to fit" is excellent** — honest, keeps work, real lever. No change; cite as a model. | Feedback | Honest error recovery ([Raw.Studio error states](https://raw.studio/blog/empty-states-error-states-onboarding-the-hidden-ux-moments-users-notice/)) | — | — | — | — | **Already good** |
| **Focus trap + restore-to-opener is correct** — aria-modal, Tab cycling, focus returns to Add-doodle pill. No change. | Accessibility | Modal focus management | — | — | — | — | **Already good** |

**Verdict:** the tool *engine* is rich and the honesty/feedback discipline is exemplary. The gap is **Undo** (critical) and **discoverability of the tools themselves**.

---

### Card detail / Edit / Sandbox / RE-DRAW / Export modal
File: `src/app/components/DeskDoodles/ObjectSurface.tsx` (1169 lines)

| Improvement | Axis | Why it matters (source) | Sev | Eff | Agent? | Now/R12 | Build hint |
|---|---|---|---|---|---|---|---|
| **Export is download-only** — no "copy link to this doodle" / no share URL. A playful social app's natural share is a link, not a file on disk. | Delight / friction | Sharing is the social loop; reduce distance to share ([FigJam collaboration](https://www.figma.com/online-whiteboard/)) | Med | M | Decision | Now (needs route) | Add "Copy link" → `/desk?desk=N` + future per-doodle deep link; clipboard API |
| **RE-DRAW has no undo either** — inherits DrawSurface, same gap; re-editing a saved doodle can only Clear. | Friction / standards | Same as draw undo ([Concepts](https://concepts.app/en/android/manual/yourworkspace)) | High | — | — | Now | Covered by the DrawSurface undo fix (#1) |
| **"drawn before re-editing existed" copy** is honest but cryptic to a user who never knew re-editing was new. | Copy | Plain-language microcopy | Low | S | Yes | Now | Soften to "This doodle can't be re-drawn — it was made the old way." |
| **Restyle column has 13+ controls with no search/grouping beyond mini-headers** — power is great (`feedback_never_trim_control_sets`), but a newcomer faces a wall. | Info hierarchy | Progressive disclosure of complexity ([UXUIprinciples](https://uxuiprinciples.com/en/principles/progressive-disclosure)) | Med | M | Decision | R12 | Collapse advanced clusters by default (like SmartHachureChrome's collapsible sections); keep Style + 3 feel sliders open |
| **Sandbox "Remix as mine" is absent** (noted in code as returning later) — a viewer can play but can't keep someone's doodle. Big delight miss for a shared wall. | Delight / friction | The remix loop is the shared-canvas payoff | Med | L | Decision | post-makeathon | Fork-into-owned-object write; UI slot already reserved |
| **Delete has no confirm** — `onDelete` fires immediately (optimistic + rollback on fail). For a destructive action, a quick confirm or undo-toast is safer. | Feedback / safety | Destructive-action confirmation ([Zivtech constraints](https://www.zivtech.com/blog/ux-principles-constraints-discoverability-feedback-and-more)) | Med | S | Decision | Now | Add an "undo delete" toast (the rollback path already exists — surface it) rather than a blocking dialog |
| **Sandbox dashed-border signposting** (read-only vs editable) is a nice touch — no change. | Consistency | Signposting | — | — | — | — | **Already good** |
| **Export captures the live-rendered art** (current restyle in progress) — correct and well-scoped. No change. | Feedback | WYSIWYG export | — | — | — | — | **Already good** |

---

### `/desks` — The gallery ("wall of walls")
File: `src/app/components/DeskDoodles/DeskGallery.tsx`

| Improvement | Axis | Why it matters (source) | Sev | Eff | Agent? | Now/R12 | Build hint |
|---|---|---|---|---|---|---|---|
| **Mini-desk previews each fire their own fetch** (`listDoodlesForDesk` per card) — fine at demo scale but cards pop in staggered with no skeleton; reads as jank with many desks. | Feedback / loading | Loading-state polish ([Setproduct](https://www.setproduct.com/blog/empty-state-ui-design)) | Low | S | Yes | Now | Add a faint paper skeleton in MiniDesk `loading` phase (currently renders nothing until ready) |
| **Cards are buttons but have no focus-visible distinction beyond the global ring** — keyboard users get the ring (good); hover lift is mouse-only. | Accessibility | Keyboard parity ([WebAbility target size](https://www.webability.io/glossary/target-size)) | Low | S | Yes | Now | Mirror the hover lift on `:focus-visible` |
| **No sort/filter** — newest-first only; "Live" desk isn't pinned to the top. | Friction / IA | Findability | Low | M | Decision | post-makeathon | Pin the open (Live) desk first |
| **Error + empty states are correctly distinct** (timeout ≠ "no desks yet") with Retry. No change. | Feedback | Honest failure ([Raw.Studio](https://raw.studio/blog/empty-states-error-states-onboarding-the-hidden-ux-moments-users-notice/)) | — | — | — | — | **Already good** |

**Verdict:** clean and honest. Only loading-polish + keyboard parity are Now.

---

### Drawer ("My doodles" binder)
File: `src/app/components/DeskDoodles/DrawerPanel.tsx`

| Improvement | Axis | Why it matters (source) | Sev | Eff | Agent? | Now/R12 | Build hint |
|---|---|---|---|---|---|---|---|
| **"Place here" pill is 9px font, hover-revealed** — below readable + touch-target minimums; on touch there's no hover so it's effectively keyboard/drag-only. | Accessibility / touch | WCAG 2.5.8 + drag needs a non-drag alternative ([Pencil&Paper drag-drop](https://www.pencilandpaper.io/articles/ux-pattern-drag-and-drop)) | Med | S | Yes | Now | On `(pointer:coarse)` keep the pill always-visible and ≥44px; the hover-reveal is a mouse optimization only |
| **Drag-to-place has no drop-zone feedback on the desk** — `dropEffect:'copy'` sets the cursor, but the desk doesn't highlight as a valid target. | Feedback | Drag-drop needs visible drop affordance ([Pencil&Paper](https://www.pencilandpaper.io/articles/ux-pattern-drag-and-drop)) | Med | M | Yes | Now | On `dragover` with DD_DOODLE_MIME, tint the desk / show a ghost outline at the drop point |
| **Mini cards are plain-injected (deterministic)** — good perf call; no change. | Consistency | Perf vs fidelity tradeoff documented | — | — | — | — | **Already good** |
| **One-record footer copy** ("Removing a doodle removes it from your drawer too") is honest + well-placed. No change. | Copy | Honest mental model | — | — | — | — | **Already good** |

---

### Onboarding
File: `src/app/components/DeskDoodles/OnboardingFlow.tsx`

| Improvement | Axis | Why it matters (source) | Sev | Eff | Agent? | Now/R12 | Build hint |
|---|---|---|---|---|---|---|---|
| **Built but NOT mounted** — DeskPage has no `OnboardingFlow` / `hasOnboarded` import; the "claim your space" moment never shows. Either wire it or it's dead weight for the demo. | Discoverability / onboarding | Onboarding = the first teachable moment ([Raw.Studio](https://raw.studio/blog/empty-states-error-states-onboarding-the-hidden-ux-moments-users-notice/)) | High | S–M | Decision | Now | The component is solid (pre-filled valid handle, Reroll, custom, skip, Esc, focus). Wiring is gated on `isPersonalSpaceEnabled()` + migrations — decide: ship handle-only now, or cut |
| **Onboarding teaches identity but not the app** — even when wired, it greets a handle, not "here's how to doodle." | Onboarding | Progressive onboarding should cover key actions ([NN/g via Raw.Studio](https://raw.studio/blog/empty-states-error-states-onboarding-the-hidden-ux-moments-users-notice/)) | Med | M | Decision | Now | Pair the handle moment with the `/desk` first-run coachmark (row #2 above) so identity + how-to land together |
| **The flow itself is well-crafted** — minimum-friction (one-click Keep), invitational skip, collision retry, framer-motion entrance, paper-grain warmth. No change to the flow. | Affordance / delight | Min-friction-to-aha ([UXPin](https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/)) | — | — | — | — | **Already good** |

---

### Upload (SVG / image)
Files: `DrawPanel.tsx` (upload states), `svgUpload.ts`, `imageToSvg.ts`

| Improvement | Axis | Why it matters (source) | Sev | Eff | Agent? | Now/R12 | Build hint |
|---|---|---|---|---|---|---|---|
| **No drag-and-drop file upload** — must click "Pick an .svg file"; dropping a file onto the pane is the expected modern affordance. | Friction / affordance | Drag-drop is the expected upload pattern ([Pencil&Paper](https://www.pencilandpaper.io/articles/ux-pattern-drag-and-drop)) | Med | M | Yes | Now | Add a dropzone on the upload PANE_OVERLAY; reuse `prepareSvgUpload` |
| **Image-upload stub is honest** ("coming with autotrace") — good, but it's a dead tab that a user clicks expecting it to work. | Feedback / discoverability | Honest stubs over fake controls ([Carbon](https://carbondesignsystem.com/patterns/empty-states-pattern/)) | Low | S | Decision | Now (or when S1 lands) | Either grey/disable the "Upload image" pill with a "soon" badge, or land the imageToSvg path (already drafted per handoff) |
| **Un-embeddable SVG fallback** (file hides its size → no draw-over, but still places) is a genuinely thoughtful honest state. No change. | Feedback | Honest degradation | — | — | — | — | **Already good** |

---

### Cross-cutting (all surfaces)

| Improvement | Axis | Why it matters (source) | Sev | Eff | Agent? | Now/R12 | Build hint |
|---|---|---|---|---|---|---|---|
| **No mobile/touch contract** — zero `@media` queries in any CSS; home page has none; all adaptation is flex + measured-width. Works for narrow desktop, not phones (no touch-target sizing, no stacked layouts, draw popup is 1180×820 fixed). | Accessibility / touch | WCAG 2.5.8 target size; phones need layout, not shrink ([Smashing](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/), [Siteimprove](https://www.siteimprove.com/blog/motor-impairments-and-mobile-ui-the-touch-target-problem/)) | High | L | Decision | Now (at least graceful) | Decide the mobile stance for the demo. Minimum: `(pointer:coarse)` 44px targets + a "best on desktop" note; full responsive = L |
| **Sliders: no double-click-reset, no value entry, 14px track** — 13 of them; trackpad users can't fine-tune precisely or reset one. | Friction / trackpad | Direct-manipulation precision ([mannhowie](https://mannhowie.com/ux-design-principles)) | Med | S | Yes | Now | `Slider.tsx`: add dbl-click→default, optional number input, thicker hit area |
| **No keyboard-shortcut legend** — ⌘\, ⌘0, Esc-layering, pinch/pan are all undiscoverable. | Discoverability | Hidden features must hint ([IxDF](https://ixdf.org/literature/topics/progressive-disclosure)) | Med | S | Yes | Now | A `?`-key cheatsheet popover, shared across `/desk` + `/canvas` |
| **Curly-quote / apostrophe inconsistency in copy** — mix of straight and curly apostrophes across captions and notes. | Copy / consistency | Typographic polish | Low | S | Yes | R12 | Normalize to curly throughout at the copy pass |
| **`/canvas` "Publish" button is permanently disabled** with a tooltip — a dead control on a user-reachable page. | Affordance | Don't show inert controls ([Carbon](https://carbondesignsystem.com/patterns/empty-states-pattern/)) | Low | S | Decision | Now | Since `/canvas` is the test surface, consider removing the button or making it a "this is the engine" note |
| **Focus-visible ring exists app-wide** (theme.css 2px accent outline, offset 3px) and **reduced-motion twins on every keyframe** — both genuinely good accessibility baselines. No change. | Accessibility | Focus indication + motion safety ([WCAG](https://www.allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide)) | — | — | — | — | **Already good** |
| **Honest connectivity + retry everywhere** (Live/Connecting/Offline chip, 5s auto-retry, publish backoff, link-health poll) — a model of trustworthy feedback. No change. | Feedback | System-status visibility ([Setproduct](https://www.setproduct.com/blog/empty-state-ui-design)) | — | — | — | — | **Already good** |

---

## Summary counts

- **Total improvements logged:** 43 actionable rows (excludes the 11 "Already good" callouts).
- **Agent-able (clear-cut parallel work):** ~22.
- **Needs Sebs design decision first:** ~21.
- **Now:** ~34 · **R12 / post-makeathon:** ~9.

## The 3 highest-leverage experience wins

1. **Ship per-stroke Undo/Redo** (⌘Z + visible pill, across DrawSurface so RE-DRAW gets it free). It's the single most-expected drawing affordance and its absence undercuts an otherwise rich tool engine. Effort M, reach total.
2. **Add a first-run teaching layer on `/desk`** (a dismissible coachmark) and **wire the dormant OnboardingFlow** so the handle moment + how-to-doodle land together. The product is deep but currently teaches almost nothing to anyone who didn't build it — this is what a demo judge or first visitor will feel immediately.
3. **Make the draw tools discoverable** — Snap/Straighten/Shade/Fill/Lasso are caption-only today (capability-invisible). A small labeled tool legend (plus the undo from win #1) turns a powerful-but-hidden toolset into one a first-timer actually uses.

---

### Sources cited
- NN/g via Raw.Studio — empty/error/onboarding moments: https://raw.studio/blog/empty-states-error-states-onboarding-the-hidden-ux-moments-users-notice/
- Carbon Design System — empty states pattern: https://carbondesignsystem.com/patterns/empty-states-pattern/
- Setproduct — empty state UI design: https://www.setproduct.com/blog/empty-state-ui-design
- SaaSFactor — empty state UX: https://www.saasfactor.co/blogs/empty-state-ux-turn-blank-screens-into-higher-activation-and-saas-revenue
- Concepts App — workspace / undo + tool wheel: https://concepts.app/en/android/manual/yourworkspace
- TheCodingBus — drawing app with undo: https://thecodingbus.info/designing-a-basic-drawing-app-with-undo-functionality/
- Zivtech — UX principles (constraints, discoverability, feedback): https://www.zivtech.com/blog/ux-principles-constraints-discoverability-feedback-and-more
- mannhowie — 5 key UX design principles: https://mannhowie.com/ux-design-principles
- LinkedIn (Dzera) — discoverability & usability: https://www.linkedin.com/pulse/5-fundamental-ux-design-concepts-improve-usability-lisa-dzera
- UXPin — progressive disclosure: https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/
- LogRocket — progressive disclosure types/use cases: https://blog.logrocket.com/ux-design/progressive-disclosure-ux-types-use-cases/
- IxDF — progressive disclosure: https://ixdf.org/literature/topics/progressive-disclosure
- UXUIPrinciples — progressive disclosure pattern: https://uxuiprinciples.com/en/principles/progressive-disclosure
- FigJam — real-time collaboration / presence: https://www.figma.com/online-whiteboard/
- Pencil & Paper — drag & drop UX best practices: https://www.pencilandpaper.io/articles/ux-pattern-drag-and-drop
- Smashing Magazine — accessible tap target sizes: https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/
- LogRocket — accessible touch target sizes: https://blog.logrocket.com/ux-design/all-accessible-touch-target-sizes/
- Siteimprove — motor impairments & touch targets: https://www.siteimprove.com/blog/motor-impairments-and-mobile-ui-the-touch-target-problem/
- AllAccessible — WCAG 2.5.8 target size guide: https://www.allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide
- WebAbility — target size glossary: https://www.webability.io/glossary/target-size
