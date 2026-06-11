# 23 · Brief — Suzanne (suzanne3d.studio): competitive + relationship read

**Date:** 2026-06-10 (Day 9 of 14 — makeathon submission 2026-06-18 11:59 PM PDT)
**Purpose:** Sebs knows the founder via LinkedIn and wants to chat her up — learn the product, explore fit. This brief = what the product is, where it sits vs our locked wedge (`21-research` §13), integration options, and talking points.
**Method:** Live-site research 2026-06-10. The site is a JS SPA — direct fetches return only the tagline; full page content was retrieved via a rendering proxy (r.jina.ai) of suzanne3d.studio pages, plus search-index snippets. Quotes are as-captured from those renders; treat as close-to-verbatim. Everything not citable is explicitly marked **unverified**.

---

## 1. What it is

### Product

- **Suzanne** — "Turn any idea into a 3D model in minutes" (homepage H1) / "3D modeling at the speed of thought" (title tag). Meta description: "AI-native 3D studio where ideas become printable models in seconds. Generate 3D from text, photos, or voice, then refine in a browser editor. Export STL, GLB, OBJ, GLTF." [1]
- Positioned as an "AI-native 3D modeling tool for designers, engineers, and creators" — "Describe what you want, refine through chat, and export production-ready models, all in your browser." [1]
- Company: **Suzanne 3D Inc., San Francisco, CA**. Contact `help@suzanne3d.com` (support, press/partnerships, security). X: **@trysuzanne**. [6]
- App lives at `app.suzanne3d.studio/editor`. [1]
- Name is almost certainly a nod to Blender's Suzanne monkey mascot — **unverified**, but the audience wink is obvious.

### Workflow / inputs

- Three input modes on the homepage: **"Text · Sketch · Photo"**. [1] (The meta description also says "voice" [1] — discrepancy; voice doesn't appear in the docs' input modes. Status of voice input: **unverified / possibly stale copy**. Good chat question.)
- **Sketch→3D** (the mode that matters to us): "Upload a hand sketch or 2D line drawing. Suzanne reads the linework and **reconstructs an editable 3D model**." Best-results guidance: "Use clean, high-contrast linework on a plain background. **Closed outlines and clear silhouettes reconstruct best**." [3]
- **Text→3D:** descriptions can include "dimensions, materials, and style cues." [3]
- **Photo→3D:** "one reference image or up to four orthographic views" for mesh reconstruction. [3]
- **Refinement is conversational:** "Describe changes in plain English. Suzanne updates your model instantly" [1]; "Chat-based iteration lets you go from rough to right without menus or re-prompting from scratch." [4]
- **Browser editor:** primitives (box/sphere/cylinder/cone/torus), booleans (union/subtract/intersect), transforms, material library, **parametric sliders** ("Every number is live" — scale, wall thickness, detail levels), multi-select, full undo, multiple cameras. [1][3]
- Guides cover: first model, photo reconstruction, sketch→3D, **prepping for 3D printing** (wall thickness, STL for slicers), booleans without non-manifold breakage, **AR preview** (Vision Pro, Quest 3, HoloLens 2, iOS Quick Look). [5]

### Outputs

- **9 export formats.** Free: **STL, GLB, OBJ, GLTF, OpenSCAD**. Paid adds: **STEP, 3MF, 3DM, USDZ**. [2][3]
- OpenSCAD export is described as "for Parametric, code-defined models." [3]
- **Read on the tech (inference, unverified):** OpenSCAD + STEP + live parametric sliders strongly suggest the text (and possibly sketch) path is **LLM → parametric CAD code-gen**, not neural mesh diffusion — that's a fundamentally different architecture from Tripo/Meshy/TRELLIS. The Photo→3D Standard/Pro/Ultra tiering smells like a neural mesh-recon backend (possibly third-party). Probably a **dual-pipeline product**. No AI model names or architecture are disclosed anywhere on the site [4] — prime chat territory.

### Target users + use cases

- "Designers, engineers, and creators"; use cases named: "product design, collectibles, and rapid prototyping." [1][4]
- Strong **3D-printing center of gravity**: "printable models in seconds" [1], wall-thickness checks [5], slicer prep [5], "send-to-Bambu deep-link" [7], and "Print & ship — Coming soon" with "FDM, SLA, or SLS" end-to-end fulfillment [1].
- Enterprise/API pitched at "product design, e-commerce 3D visualization, and batch fulfillment workflows." [1]

### Pricing + API

| Tier | Price | Credits | Notes |
|---|---|---|---|
| Free | $0 | 30/mo, no card | All generation workflows; free exports STL/GLB/OBJ/GLTF/OpenSCAD [1][2] |
| Pro | $15/mo | 200/mo | Priority queue, all export formats, auto-refund on failed generations [2] |
| Max | $35/mo | 500/mo | Pro + 5 concurrent generations [2] |
| Enterprise | Custom | Custom | "50+ concurrent tasks, **full API access**, dedicated account support," custom retention, 24/7 [2] |

- Credit costs: Text→3D Std 2 / Pro 3 · Photo→3D Std 2 / Pro 5 / Ultra 10 · **Sketch→3D 2** · Model iteration 2 · Editing/export free. [2]
- **API: enterprise-gated.** "The Suzanne API is priced with custom quotes based on your usage." [2] **No public API endpoint docs exist** ("No API endpoints are documented" in docs [3]); the `/api` route on the marketing site 404s. No self-serve dev tier.
- Cute mechanic: "sending feedback now earns you 5 credits per day." [7]

### Team / founder

- About page: "a small, independent team" building "the fastest way to make a 3D model"; values speed ("designs must launch in under a minute"), functionality, open standards; "read every email, ship weekly." Explicitly framed as "Version 1.0," inviting testers. [8]
- **No founder names, team size, location detail, or investors are published anywhere I could find** — not on the site, not in search indexes, no Product Hunt listing (PH search returns "No products found" [9]), no LinkedIn company page surfaced. **Founder identity: unverified from public sources** — Sebs's LinkedIn connection is the better source than the open web here. Do not assume anything about her background in the chat; ask.

### Launch timeline (from the public changelog [7])

- **2025-11-08 → 11-10:** v0.1–v0.4 — prototype "proved the basic prompt-to-model loop"; sketch input + conversational edits at v0.3; "the project found its name" at v0.4.
- **~5-month public gap** (Nov 2025 → Apr 2026).
- **2026-04-09 → 04-27:** v0.5–v0.11 — fast sprint: generation reliability, editor (v0.8 "full browser-based 3D editor"), product identity + credits (v0.9), mobile, onboarding.
- **2026-05-11:** v0.12 — paid subscriptions.
- **2026-05-15:** **v1.0 — "Suzanne is out of beta. The 1.0 release locks in the editor, API, and export pipeline as stable."**
- So: **~4 weeks out of 1.0** as of today. Very fresh.

### Traction signals

- **Unverified / none public.** No PH launch [9], no funding announcements found, no user counts, no testimonials on the marketing site [4]. The credits-for-feedback mechanic [7] and "Version 1.0 — test it and tell us" framing [8] both read early-stage, feedback-hungry. That's a *good* moment to be a thoughtful early voice in her ear.

---

## 2. Vs our wedge — does "the user's hand survives the round-trip" hold?

**Our locked claim** (`21-research` §13): no shipping tool treats stroke grammar as first-class transport between 2D and 3D — Tripo/Meshy/Krea/Womp all strip the artist's signature; Desk Doodles' defensible position is drawn marks generate 3D AND the 3D re-renders in the same mark family.

**Where Suzanne sits:** even further from our axis than the mesh-gen tools — by *design*, not by failure.

- Suzanne's sketch mode "**reconstructs** an editable 3D model" from linework and explicitly asks users to **sanitize their input**: "clean, high-contrast linework… closed outlines and clear silhouettes reconstruct best." [3] That's the tell — the sketch is treated as a *geometry specification to be disambiguated*, not as mark-making to be honored. Wobble, pressure, hatching, stroke character are noise to her pipeline; they're the signal to ours.
- The whole product gradient points at **engineering-clean, watertight, printable geometry**: parametric sliders, wall thickness, booleans-without-non-manifold-traps, STEP/3MF/OpenSCAD export, slicer prep. [1][2][3][5] An OpenSCAD/STEP representation *cannot* carry a hand-drawn surface character — it's code-defined ideal geometry.
- **Zero style-preservation claims anywhere**: "The page doesn't explicitly claim to preserve sketch or image style/character" [4]; guides "emphasize practical, repeatable workflows rather than stylistic preferences or output fidelity claims." [5]
- And on the render side: Suzanne has a material library and standard previews [3] — there is no NPR/stylized re-rendering of the 3D back into the input's mark family. Our round-trip's second half doesn't exist there at all.

**Verdict: the wedge claim survives, cleanly — and Suzanne actually sharpens it.** The 2026 field now has two poles: *fidelity-to-intent for functional objects* (Suzanne: sketch → clean parametric printable thing) and *fidelity-to-mesh for assets* (Tripo/Meshy/TRELLIS: image → clean textured mesh). Both poles strip the hand. Nobody is doing *fidelity-to-the-hand* — sketch in, sketch out, signature intact. Useful demo-video line: Suzanne answers "what did you mean?"; Desk Doodles answers "how did you draw it?"

One honest caveat: Suzanne's conversational-edit loop ("rough to right" [4]) is a *workflow* wedge we don't have and shouldn't chase mid-makeathon. Different problem; her solution is good; not our fight.

---

## 3. Fit options — integration vs conversation

**Could Suzanne slot into our input-routing table (complex-input → cloud 3D API) next to Tripo/TRELLIS?**

| Factor | Tripo / TRELLIS (locked, 21-research §8) | Suzanne |
|---|---|---|
| Public self-serve API | Yes — documented endpoints, $50 dev grant / $20 fal credits | **No** — Enterprise-only, custom quotes, no published endpoints [2][3] |
| Cost per gen | ~$0.02–0.13, known | **Unknown** (credits imply ~cents/gen in-app, but API pricing unpublished) [2] |
| Output class | Neural mesh (GLB), stylized-capable | Parametric/clean CAD-leaning (OpenSCAD, STEP) + mesh recon [2][3] |
| Latency | 30–90s known | **Unverified** ("in seconds"/"under a minute" marketing claims [1][8]) |
| Makeathon-usable by 06-18 | Yes (already planned, keys in motion) | **No** — no self-serve path, 8 days out |

- **For the makeathon: no integration. Tripo + TRELLIS stay locked.** No public API, no published pricing, no time.
- **Post-makeathon: genuinely interesting complement, not a substitute.** Our vision-LLM router (21-research §8) classifies `object_class` — today everything routes to mesh-gen. Suzanne would add a **parametric route**: doodle of a *functional* thing (stand, box, vase, bracket) → clean editable printable geometry, while expressive doodles keep routing to mesh-gen + SVG-port. A router with a "did you draw an object you want to *use* or a thing you want to *see*?" branch is a richer story than mesh-gen-for-everything. That requires API access she doesn't publicly sell — which is exactly what a founder relationship can unlock (early/indie dev tier, or even just a "we'd be your first router-integration case study" conversation).
- **Realistic near-term fit: conversation + community.** She's 4 weeks post-1.0, feedback-hungry (5 credits/day for feedback [7], "read every email" [8]), with no public launch noise yet [9]. Sebs is researching the same sketch→3D problem from the opposite pole with receipts (21-research, the audit harness). Peer-trade is the play; integration is a v2 option to leave on the table, not the ask.

---

## 4. Chat talking points for Sebs

**Etiquette flag — lead with this:** Sebs is mid-competition (ConFigMakeathon, submits 06-18) building an adjacent sketch→3D product. **Say that in the first message**, before asking anything. The wedges are genuinely complementary (hers: clean, parametric, printable; his: expressive, hand-preserved, NPR-rendered) — name that framing explicitly so questions read as peer curiosity, not competitive intel-mining. Don't ask for anything proprietary (model names, vendors, margins) beyond what she volunteers; if a question lands near the line, let her decide where the line is. Deeper integration talk is cleaner *after* 06-18.

### Founder-to-founder questions (pick 5–6, don't run all 8)

1. **Sketch interpretation:** "Your docs say Suzanne 'reads the linework and reconstructs an editable model,' and OpenSCAD export is in the free tier — is sketch→3D going through a parametric/code representation, or mesh reconstruction? I built a vision-LLM routing layer for the same input problem and I'm fascinated by which representation wins where." (Shows he read the docs; opens the architecture conversation without demanding vendor names.)
2. **Where quality breaks:** "You advise closed outlines + clean high-contrast linework. What actually happens with messy, expressive, half-closed sketches — wrong topology, hallucinated geometry, refusal? I catalog per-shape breakage on my side and the failure taxonomy is the most useful artifact I own." (His `/audit` dataset is real credibility here.)
3. **What users actually do:** "What share of generations end up printed vs viewed in AR vs just exported? Does the Bambu deep-link get used?" (Tests whether the printing bet is the real usage center.)
4. **Edit-loop stability:** "On chat iteration — does an edit regenerate the model or patch the existing parameter tree? How do you stop edit #5 from undoing edit #2?" (The flip-flop problem; any builder of conversational editors has scars here.)
5. **The gap:** "Your changelog shows the prototype in Nov 2025, then a five-month quiet stretch, then a brutal four-week sprint to 1.0. What changed in April?" (Founder-journey question; shows he read the changelog; usually unlocks the best stories.)
6. **API plans:** "API is enterprise-only today — any plans for a self-serve dev tier? I have a concrete routing use case: expressive doodles go to mesh-gen, functional doodles could go to a parametric engine like yours." (The integration door, opened honestly.)
7. **Style demand:** "Have users asked for outputs that keep the *character* of their sketch — the wobble, the line quality — or does everyone want it cleaned up? Your wedge says cleaned-up; mine bets some users want the opposite. Curious what your data says." (Directly tests our wedge against her user reality — highest-value question in the list.)
8. **Unit economics of failure:** "Auto-refund on failed generations is a gutsy pricing line — what's your failure rate and who eats the compute?" (Operator question; only ask if rapport is good.)

### What Sebs offers in return (2–3)

1. **Build-in-public audience + a genuine shout-out:** he's posting daily through the makeathon (Contra + X). A "tools I researched while building" post featuring Suzanne is honest content for him and reach for a 4-week-old product with zero launch coverage. (Per `feedback_selective_brand_tagging`: this counts as a workflow-lesson post — tag thoughtfully, once.)
2. **Designer's-eye structured feedback:** he can run his audit-catalog discipline (197-shape breakage taxonomy, per-class failure tables) against her sketch input and hand her a real bug/QA artifact — the literal thing her 5-credits-a-day feedback mechanic is begging for, at 100× the typical quality.
3. **His vision-LLM-router findings:** 21-research found *no production precedent* for a vision-LLM pre-step that classifies a sketch and routes/tunes the 3D generation prompt — and he has a working structured-output schema (subject/silhouette/line-quality/shading JSON). For a company whose core problem is "what did this sketch mean," that's a genuinely useful trade.

---

## Sources

1. Suzanne homepage (rendered): https://www.suzanne3d.studio/ — H1, input modes, parametric editing, free tier, print-&-ship, enterprise/API copy. Title/meta via search index.
2. Suzanne pricing page (rendered): https://www.suzanne3d.studio/pricing — tiers, credit costs, export-format gating, API custom quotes.
3. Suzanne docs (rendered): https://www.suzanne3d.studio/docs — sketch/text/photo workflows, editor capabilities, OpenSCAD note, no API endpoints documented.
4. Suzanne product page (rendered): https://www.suzanne3d.studio/product — chat iteration copy, no style-preservation claims, no model-architecture disclosure.
5. Suzanne guides (rendered): https://www.suzanne3d.studio/guides — 6 walkthroughs incl. sketch→3D, print prep, booleans, AR preview.
6. Suzanne contact page (rendered): https://www.suzanne3d.studio/contact — Suzanne 3D Inc., San Francisco CA, help@suzanne3d.com, @trysuzanne.
7. Suzanne changelog (rendered): https://www.suzanne3d.studio/changelog — v0.1 (2025-11-08) → v1.0 (2026-05-15), all entries quoted in §1.
8. Suzanne about page (rendered): https://www.suzanne3d.studio/about — small independent team, Version 1.0 framing, ship-weekly.
9. Product Hunt search: https://www.producthunt.com/search?q=suzanne%203d — "No products found for 'suzanne 3d'" (checked 2026-06-10).
10. Internal: `docs/research/21-research-3d-pipeline-and-style-translation.md` §8 (API routing table), §13 (the wedge).

**Unverified items (do not state as fact in the chat):** founder name/background · team size · funding · user numbers · underlying AI models/vendors · whether photo path is third-party · voice-input status (meta copy vs site copy conflict) · API latency/cost · the Blender-mascot naming story.

---

**Doc status: COMPLETE 2026-06-10. Research-only — no integration work, no plan changes. Next action is Sebs's LinkedIn message, post-Day-10 work if he wants the timing clean.**
