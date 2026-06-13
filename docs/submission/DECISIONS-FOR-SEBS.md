# Decisions waiting on Sebs (the one consolidated package)

Everything parked for your call, in one place so nothing's forgotten. Grouped: quick rulings → eyeball boards → strategy → submission-narrative taste. Boards/screenshots are at the listed paths. Nothing here blocks the running fleets; these unblock the *final* polish + submission.

## A. Quick rulings (one-line each)
- [ ] **Arrow rule** — open-rod+chip (current default) vs welded-solid+chip. Board: `/tmp/dd-arrow-rule/board.png`. If you pick solid, it's a 1-line flip + re-snapshot.
- [ ] **Golden v3 re-bless** — Phase-A recalibration + the wash-darkness fix flipped 279/1394 classifier decisions (ALL wash regions, bug-clean) + 1 recal flip. Needs your bless to make v3 the baseline. (Eyeball the /audit darkness first.)
- [ ] **Band-7 look policy** — how dark the darkest tone band should render across styles.
- [ ] **SA-2 tone-never-vanishes** — lock that sketchy/clean fall back to a flat grey wash instead of dropping shading? (I recommend yes.)

## B. Eyeball boards (look + approve/tune)
- [ ] **Phase-A A/B board** — before/after the darkness recalibration (it's a big, intentional darkening).
- [ ] **Tier-2 geometry family boards** — `/tmp/dd-tier2/board-{rod,extrude,inflate,solid}.png`. Lock the family lists. (balloon-vs-cushion inflate is the weakest separation — calibration candidate.)
- [ ] **F1 preview opacity** — raw Sketch tone raised 0.55→0.9; confirm the value on real doodles (`/tmp/dd-rockf1/`).
- [ ] **Glossy Plastic re-check** — the warm-tan band fix landed (env→graphite); confirm the glossy slab reads ink-black at angles now (`/tmp/dd-mat/`).
- [ ] **Hatch grammar board + Native dials** — when the gap-cells fleet lands (Hachure/Cross-hatch/Stipple/Contour × bands; Polish/Reflection/Sheen/Outline strips).

## C. Strategy / your-side actions
- [ ] **Make checkpoint #2** (your-side: you run Make uploads) — full current code → Make → publish. Gates the live URL + working-file link + makes the Make-version the public repo. Claude preps the clean file list + importability re-check + upload prompt. ⚠️ Use the **stub-first + code-editor-paste** protocol (no magic prompt prevents Home_1 duplication — see make-checkpoint-paste-protocol.md).
- [ ] **HARD GATE: orbit the 3D wedge on the PUBLISHED Make URL.** 3D *probably* runs in Make (three.js is Figma's own example lib) but preview≠published is a known gap — only confirmed when you load the live site and orbit. Do this before relying on Make for the live link.
- [ ] **Lock the F1 insurance:** if published-Make 3D breaks, host the live link on **Vercel/Netlify** (free, ~5 min) and keep Make as the Community file — rules allow live-link ≠ Figma-file-link, so this is eligibility-safe backup. Decide: set it up pre-emptively or only if Make fails?
- [ ] **Turn ON Supabase realtime *replication*** for the doodles table (default OFF — the likeliest cause of realtime not working on the published site). + include dompurify in checkpoint #2 (added post-checkpoint-#1, untested in Make).
- [ ] **Push origin/main?** — ~31 commits unpushed. Entangled with the Make-repo plan: do we also push this local repo, or is the public/submission repo the Make version only? Your call.
- [x] **Figma Agent access — CONFIRMED (Sebs has the beta, 2026-06-13).** Agent goes back into the workflow story as the 5th suite tool (strengthens Innovative-Workflow criterion #4). ⚠️ HONESTY: must actually USE Agent on real work (the Community Figma file / the intro graphic / video design assets — things we're doing anyway) so "built across Make+MCP+Local+Weave+Agent" is TRUE, not just "we have access." Reintegration across narrative docs is QUEUED (fires when the doc-editing fleet lands).
- [ ] **Ask Contra host: does +5 Community-share stack?** Rule says "projects" (singular) — don't assume two shares = +10. Score-plan on the Make share alone; design-file share = upside. (hello@contra.com)
- [ ] **Create a Figma Community profile** (needed to publish the design-system file) + confirm Pro/Full seat active (unlocks Make→Community).
- [ ] **Order of ops** (recommended): checkpoint #2 → Make→Community publish → design-system file→Community (rides the 06-16 identity pass) → Motion Spec page lives inside that file.
- [ ] **Identity / 06-16 pass** — the own design+motion language pass (design decision, comes to you).
- [ ] **First-visit intro animation** — your Weave creative direction (not auto-built so it doesn't clash with your aesthetic).

## D. Submission-narrative taste (from the story/post/video fleet)
- [ ] **Hook line** — A "You drew this. Now spin it." (rec for X / share-bait) · B "I sketch at my desk constantly. Those drawings die in a notebook." (rec for LinkedIn) · C "It's one desk for everybody." (rec for IG). Default rec: A on X, B on LinkedIn, C on IG (one platform qualifies; more = Community-Favorite reach).
- [ ] **Purpose framing ceiling** (`the-story.md` §6) — I wrote the strongest TRUE version (a creative habit deserves a place · refusing to flatten the maker out of the made thing · the process is the gift), conceding Building-with-Purpose without faking impact. Keep at that ceiling, dial softer to "it's a creative toy," or is there a real angle you'd stand behind?
- [ ] **Video length** — 2:35 lean vs 3:10 (your prior pick). Both timed, no beat dropped.
- [ ] **Video voice** — VO + burned captions (rec) vs screen-only + captions.
- [ ] **Priority capture** — the lockstep-slider wedge (Shot 8 / Beat 4) is built but not yet filmed; it's the Grand/Runner-Up linchpin. First clean capture once the published Make URL exists? Fallback (2D→3D flip + orbit) is ready if not shot by edit time.

## E. Gap-hunt rulings (2026-06-13 — flagged, now tracked)
- [ ] **WEDGE HONESTY (H1/H2):** the round-trip *back half* (3D→2D) is deferred in code + the conversion cache is stamped-but-never-read — but we state both as fact (CLAUDE.md/README). Forward (hand→3D + 3D-wears-your-marks via Hatch) IS real. → **Reframe** the public claim to the true version ("your hand becomes 3D, and the 3D wears your own marks") — REC — vs **scope** the back-half/cache build. Protects credibility.
- [ ] **DESK 2D↔3D FLIP (H3, the demo climax):** flipping a *placed desk object* to 3D has no code path (no geometry field, no convert action — only /canvas works). → **Build the desk-flip** (real work; I'm scaffolding the seam now so it's cheap) vs **demo the flip on /canvas** (free, already works). REC: scaffold now, decide at demo-cut.
- [ ] **GOLDEN v3 bless = the ML go-live gate:** blessing golden v3 (after the clean wall) is now also what lets the 92.7% learned model wire LIVE (re-validated honestly). One eyeball → ML in production.

_Claude clears B-board prep + C/D options as fleets land; you just rule._
