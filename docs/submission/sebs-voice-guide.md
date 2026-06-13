# Sebs Voice Guide + Voice-True Copy Drafts — Desk Doodles

**Date:** 2026-06-13 (Day 13 of 14). **Deadline:** 2026-06-18 11:59 PM PDT.
**What this is:** a distilled voice guide for Desk Doodles copy — so the social post, video captions, and taglines sound like **Sebastian**, not generic tech-ad copy — plus three voice-true options each for the hook, the social blurb, and alternate taglines.

**Why this exists:** Sebs rejected *"You drew this. Now spin it."* (the current locked cold-open in `the-story.md` §1) as **too generic — ad-copy, not him.** This doc separates the *job* a line does (stop a scroll, state the thesis) from the *voice* it does it in, and re-drafts every customer-facing line in Sebs's register.

> **Honesty note on source material (read this — it shapes confidence).** There is **no standalone ChatGPT "voice profile of Sebastian" document** anywhere in the repo or his memory. The "foundational naming kit (ChatGPT, 2026-06-11)" cited in `src/app/lib/deskNames.ts` is a *naming* kit — it produced desk-name pools and a documented tone target, but it is **not a personal-voice profile**, and it lives encoded in the code, not as a doc. So this guide is reverse-engineered from four real, in-repo sources (below). That's a solid foundation for the **product's** warm/wry/handmade voice, but it is *thinner* on Sebs's **personal first-person register** (how he writes "I built this"). Where a real ChatGPT voice-profile-of-Sebs would sharpen a draft, it's flagged inline. **Recommendation: if Sebs wants the first-person lines (the LinkedIn maker-note especially) to land exactly right, feed in that voice profile or 3–5 samples of his own writing — see "What would sharpen this" at the end.**

---

## 0. The four real voice sources (what this guide is built from)

1. **The desk-name well** (`src/app/lib/deskNames.ts` + `supabase/seed-test-desks.sql`) — the most concentrated dose of the intended voice. Documented tone target, verbatim: *"warm object + slightly-official container; one whimsical word max; ~50% warm / 25% silly-institutional / 15% poetic / 10% bilingual (Spanish)."* Hero names Sebs kept: **The Coffee-Ring Bureau · Cafecito Margin · Pencil Crumb Committee · The Graphite Orchard · La Mesa de Papelitos · The Porchlight Sketch Society · The Warm Eraser Union · The Doodle Weather Bureau · The Kitchen Table Guild · Rincón No. 12.**
2. **The product prose** (`README.md`, `docs/knowledge/14-the-social-desk.md`, `01-what-is-desk-doodles.md`) — the established Desk Doodles register: plain, warm, concrete-object-first, gently insistent on the one bet. *"Doodle the little things on your desk." / "draw a heart, hit Done, and it's sitting on a public desk next to a stranger's mug and someone else's boat." / "the desk is a place, not a feed."*
3. **The story / pitch doc** (`docs/submission/the-story.md`) — already screens hype: *"Real verifiable facts only — no invented metrics. The telling never outruns the build."* Its strongest *true* lines are the model for restraint: *"come leave something on the desk — not a civic intervention."*
4. **Sebs himself** (`user_profile_core.md`) — bilingual Spanish/English (Medellín → Long Island), ex-Computer-Engineering-turned-designer (engineering foundation, but in service of creative tools), endurance athlete (long arcs, boring consistency, no shortcuts), helps family translate complex systems into clear language. **Implication for voice:** he respects clarity-as-craft, distrusts inflation, and the bilingual touch is real and load-bearing (not decorative) — Spanish belongs in the well, used sparingly.

---

## 1. The voice in one breath

> **Warm, plain, and a little wry. Concrete objects, not abstractions. The dry-funny of treating a doodle like it matters — naming a coffee-ring stain "a Bureau." Quietly proud of the craft, never hyping it. Spanish when it's real, never as seasoning. He'd rather undersell a true thing than oversell a good one.**

It's the voice of someone who sketches the mug in front of him, files it under a name too official for a doodle because that's funny, and means the joke. Handmade, not slick. A maker's note, not a billboard.

---

## 2. DO / DON'T rules

### Tone
- **DO** be warm and low. Talk like you're showing a friend the thing on your desk, not pitching a room.
- **DO** use dry, deadpan humor — the comedy is in *taking the small thing seriously* (a "Committee" of pencil crumbs), never in being zany or punny.
- **DO** let quiet pride carry the craft. State what's true plainly and let it be impressive on its own.
- **DON'T** hype. No "revolutionary," "magic," "powerful," "seamless," "game-changing," "next-gen," "unleash," "supercharge."
- **DON'T** write the imperative ad-couplet (the "You drew this. Now spin it." shape — punchy command + punchy command). It reads as a slogan a brand bought, not a thing a person made. *This is the exact failure Sebs flagged.*
- **DON'T** be cute for its own sake. The whimsy has to mean something (the joke lands because the affection under it is real).

### Rhythm
- **DO** vary sentence length. A short true line can land hard *after* a longer warm one — not as a stacked pair of equal punches.
- **DO** use the plain conjunctive list when describing the loop: *"draw something, restyle it, flip it 2D↔3D, and leave it next to a stranger's."* That run-on warmth is his rhythm (straight from the README).
- **DON'T** end every line on a mic-drop. One earned beat per piece, not a drumroll.

### Vocabulary
- **DO** name concrete desk objects: mug, coffee-ring, pencil crumb, sticky note, the little things around you, a stranger's boat.
- **DO** use his real product words when they're warm: *the hand, wobble, the round-trip, the desk, leave it.* "Your hand" (not "your line quality" / "stroke fidelity") is the human version.
- **DO** use Spanish sparingly and *correctly*, where it's real: *cafecito, rincón, la mesa, sobremesa, papelito.* One touch, never a costume.
- **DON'T** use SaaS verbs: "simplifies," "streamlines," "empowers," "enables," "leverages," "transforms your workflow."
- **DON'T** use category-claim nouns: "platform," "solution," "tool that…," "the future of."
- **DON'T** over-explain the tech in customer copy. "A real hand-drawn engine" is enough; "parametric NPR mark engine across ~13 live axes" is for the README/judges, not the hook.

### What to avoid entirely
- Invented metrics, precedents, or impact claims (the honesty laws — `the-story.md` §intro). The voice is *credible because it's true.*
- "Built in Make" framing — it's **authored locally, deployed/run live as a Figma Make site** (the standing guardrail). Voice-wise: be honest about the hybrid, it actually reads *more* like him (a maker who shows his work).
- "AI that learned your style" — it's a **rule engine.** If a line implies learning, it's off-voice *and* off-fact.

---

## 3. In-voice vs off-voice — 8 example phrases

| # | Off-voice (don't) | In-voice (do) | Why |
|---|---|---|---|
| 1 | "You drew this. Now spin it." | "Draw the mug in front of you. Watch it stand up in 3D — still wobbly." | The reject was a bought-slogan couplet. The fix is concrete, warm, and keeps the dry pride ("still wobbly"). |
| 2 | "Revolutionary sketch-to-3D platform." | "A shared desk where your doodles live together." | Kills the category-claim; states the place plainly. |
| 3 | "Unleash your creativity with powerful tools." | "Draw the little things around you and leave them on the desk." | Concrete objects + the gentle verb "leave," no hype verbs. |
| 4 | "Our engine intelligently transforms your art." | "A hand-drawn engine that shows its reasons." | "Shows its reasons" is true (the smart-pick chip) and modest — pride without a brag. |
| 5 | "Seamlessly flip between 2D and 3D." | "Flip it to 3D and back — your hand survives the round-trip." | "Seamlessly" is the banned slick word; "your hand survives" is his real thesis in human words. |
| 6 | "Join a community of creators!" | "It's one desk for everybody. Come leave something." | Warm invitation, not a CTA bark. ("Come leave something" is straight from his own pitch register.) |
| 7 | "Simplifies the design workflow." | "Sketch in, sketch out — signature intact." | No "simplifies"; the contrast line he already wrote and likes. |
| 8 | "A coffee-ring stain, reimagined." | "The Coffee-Ring Bureau." | The naming-kit move: warm object + slightly-official container, the joke played straight. |

---

## 4. Voice-true copy drafts

All options are honest, carry the real product, and avoid every banned move above. For each: **confidence** (how sure this is *him*) and **what a real ChatGPT voice-profile-of-Sebs would sharpen.**

---

### (a) The hook / opening line — for the social post + video cold open

> **Job:** the first line/gesture that stops the scroll and states the thesis. Must read muted (≈85% of social plays are silent — `demo-video-plan.md` §1) and rhyme with the on-screen caption. This is the line Sebs is replacing.

**Hook 1 — "the thing on your desk" (recommended)**
> **Draw the mug in front of you. Watch it stand up — still wobbly.**
- *Confidence: HIGH.* This is the most on-voice: a concrete desk object (mug), the dry pride in "still wobbly," and it *shows* the thesis (your hand survives) without saying "round-trip." Reads in 2 lines, works muted, pairs with the cold-open clip (a sketched object flips to 3D keeping its wobble).
- *Sharpen with a voice profile:* whether Sebs would say "stand up," "stand up in 3D," or his own verb for the 2D→3D flip — the exact word is a fingerprint a profile would settle.

**Hook 2 — "the honest small problem" (warm, slower — good for the longer cut / LinkedIn)**
> **I sketch the little things on my desk all day. They usually die in a notebook.**
- *Confidence: HIGH on register, MEDIUM on it being *his* exact phrasing.* This is his maker-note voice (matches `the-story.md` §2 and the social draft's Variant B). Warm, true, no hype, sets up the bet. The first-person "I" is exactly where a real voice profile matters most.
- *Sharpen with a voice profile:* his actual cadence in first person — does he write tight ("They die in a notebook.") or looser ("…and they usually just die in a notebook")? Confidence on the *content* is high; on the *fingerprint* it's medium.

**Hook 3 — "the place" (communal, legible-in-a-glance — good for Instagram)**
> **One desk. Everybody's doodles, sitting next to each other.**
- *Confidence: MEDIUM-HIGH.* Leans on his real "it's one desk for everybody" + "next to a stranger's mug" register. Warm, plain, no command-couplet. Slightly less *distinctly* him than Hook 1 because it states a feature (shared desk) rather than playing the dry-affection move.
- *Sharpen with a voice profile:* whether he'd want the bilingual touch here (e.g. *"Una mesa para todos"* as a second-line echo on IG) — that's a real-vs-costume call only he can make.

---

### (b) The "what it is + how I built it" blurb — 1–2 sentences for the social post body

> **Job:** the read-after copy under the video. The guidelines ask for *what it is + how it was built* in ≈1–2 sentences, carrying the honest provenance line. Tags (`#ConfigMakeathon @figma`) ride after; not counted here.

**Blurb 1 — concrete-loop + honest build (recommended)**
> Desk Doodles is a shared desk where you draw the little things around you, restyle them with a real hand-drawn engine, and flip them between 2D and 3D — and your hand's wobble comes along for the ride. I built it solo over two weeks: authored locally, run live as a Figma Make site, with the motion pieces made in Figma Weave.
- *Confidence: HIGH.* The run-on warm list is his README rhythm exactly; "comes along for the ride" is the human version of "survives the round-trip"; the build sentence is plain and honest (matches the guardrail). No banned words.
- *Sharpen with a voice profile:* "comes along for the ride" vs "survives the round-trip" vs his own metaphor — a profile would confirm whether he leans playful or plain on the thesis.

**Blurb 2 — the-bet-first (for the build-in-public / LinkedIn read)**
> I sketch at my desk constantly and those drawings just die in a notebook, so I built a shared desk where everyone's doodles live together — draw something, restyle it with a hand-drawn engine, flip it 2D↔3D, and leave it next to a stranger's. Solo build, authored locally and run live as a Figma Make site, motion made in Weave, documented in public the whole way.
- *Confidence: MEDIUM-HIGH.* Strong maker-note register; "documented in public the whole way" nudges the Build-in-Public judge. The opening first-person clause is the spot a voice profile would most improve (see honesty note).

**Blurb 3 — the wedge stated dry (tightest, most X-friendly)**
> Desk Doodles is a live shared desk for the little drawings you make and never keep. Most sketch-to-3D tools sanitize your line; this one keeps the wobble — sketch in, sketch out, signature intact. Built solo: local code, live Figma Make site, motion in Weave.
- *Confidence: HIGH.* "the little drawings you make and never keep" is very him; "this one keeps the wobble" is dry pride done right; "signature intact" is his own line. Fits X's tighter cap.
- *Sharpen with a voice profile:* whether "sanitize your line" is too tech-critique-y for his register vs. the product docs (which use it). A profile would calibrate how pointed he gets about competitors.

---

### (c) Alternate taglines — 2–3 word marks / sub-lines

> **Job:** a short repeatable line for the end card, OG image, repo header, or wordmark sub-line. Must survive being read in isolation. The bar: it must NOT sound like a slogan a brand bought.

**Tagline 1 — "Doodle the little things." (recommended)**
> **Doodle the little things on your desk.**
- *Confidence: HIGH.* It's literally his README opener — already in-voice, already approved-by-use, warm and concrete, zero hype. The safest pick precisely because it's *his sentence.*

**Tagline 2 — "Sketch in, sketch out. Signature intact."**
> **Sketch in, sketch out. Signature intact.**
- *Confidence: MEDIUM-HIGH.* His own line (`the-story.md` §1 quotable spares). Dry and tight; states the thesis. The one caution: it's the closest of the three to the rhythmic-couplet shape he rejected — but it earns it because it's *true and specific* (signature = his real wedge), not a generic command. Use as a sub-line, not the primary if he's couplet-shy.

**Tagline 3 — "One desk for everybody." / bilingual echo**
> **One desk for everybody.**  *(IG/Spanish-audience echo: "Una mesa para todos.")*
- *Confidence: MEDIUM-HIGH.* His verbatim phrase, warm and communal. The bilingual echo is on-voice *only if* Sebs wants Spanish surfaced here — it's real to him (Medellín/Long Island, bilingual native), but whether it belongs on *this* line vs. staying in the desk-name well is his call. Flag, don't assume.

---

## 5. Sebs running — short scannable overview

- **The problem:** "You drew this. Now spin it." is generic ad-copy. Sebs wants the customer-facing lines to sound like **him** — warm, dry, handmade, never hyped.
- **What I found:** no ChatGPT voice-profile-*of-Sebs* exists in the repo — only the *naming* kit (encoded in `deskNames.ts`) plus strong product prose (README, knowledge page 14) and his bio (`user_profile_core.md`). Enough to nail the **product** voice; **thinner on his first-person "I built this" fingerprint.**
- **The voice, distilled:** warm + plain + a little wry; concrete desk objects; the dry-funny of taking a small thing seriously; quiet pride, no hype; Spanish when real, not as seasoning; would rather undersell a true thing.
- **What I built:** this guide (DO/DON'T across tone/rhythm/vocab/avoid + 8 in-vs-off examples) and **3 options each** for the hook, the blurb, and the tagline — every one grounded in his real sources, with confidence + a flag for where a voice profile sharpens it.
- **The honest gap:** the *first-person* lines (Hook 2, Blurb 2) are right in *content* but only **medium** confidence on his exact *cadence.* If those matter, feed me his voice profile or a few writing samples.

---

## 6. decisionsForSebs

What I'd lean to, for you to confirm or overrule:

| Slot | My lean | Runner-up | Why |
|---|---|---|---|
| **Hook (video + post)** | **Hook 1 — "Draw the mug in front of you. Watch it stand up — still wobbly."** | Hook 2 (for the longer/LinkedIn cut) | Most distinctly *you*: concrete object + dry pride, shows the thesis muted, kills the rejected couplet shape. Use Hook 2 as the slower VO/LinkedIn opener if you want a maker-note register there. |
| **Blurb (post body)** | **Blurb 1 — concrete-loop + honest build** | Blurb 3 (for X's tighter cap) | Your exact README rhythm; "comes along for the ride" is the human version of the wedge; build sentence is plainly honest. |
| **Tagline (end card / OG / repo)** | **Tagline 1 — "Doodle the little things on your desk."** | Tagline 2 (as a sub-line, not primary) | It's already your sentence — safest because it's *yours.* Keep Tagline 2 for spots that want the thesis stated, but watch that it's the closest to the couplet you rejected. |

**Two calls only you can make:**
1. **Bilingual surfacing** — should Spanish appear in a *customer-facing line* (Hook 3 echo, Tagline 3 echo), or stay confined to the desk-name well? It's real to you; the question is taste, not authenticity.
2. **Voice profile** — do you want to feed me the ChatGPT voice-profile-of-you (or 3–5 samples of your own writing)? It would mainly upgrade the **first-person** lines (Hook 2, Blurb 2) from "right idea" to "unmistakably you." The product-voice lines (Hook 1, all blurbs/taglines) are already high-confidence without it.

---

## Sources
- **Voice / naming material:** `src/app/lib/deskNames.ts` (tone target + hero names; "foundational naming kit, ChatGPT 2026-06-11") · `supabase/seed-test-desks.sql` (seeded desk names) · `docs/knowledge/14-the-social-desk.md` (the desk-name well + social register).
- **Product prose register:** `README.md` · `docs/knowledge/01-what-is-desk-doodles.md` · `docs/submission/the-story.md` (§1 hooks/spares, §2 problem, §6 honest "why").
- **Existing copy under revision:** `docs/submission/social-post-draft.md` (the three current variants — all built on the rejected "You drew this. Now spin it." hook).
- **Sebs's voice foundation:** `user_profile_core.md` (bilingual Medellín→Long Island, ex-CompEng→designer, endurance-athlete restraint, clarity-as-craft).
- **Honesty + tagging laws:** `the-story.md` §intro + §5 guardrail (never "built in Make"; "rule engine" not "AI that learned") · `feedback_selective_brand_tagging`.
