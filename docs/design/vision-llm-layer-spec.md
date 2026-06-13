# Vision/LLM Layer (Smart-System Layer #3) — Scaffold Spec

**Status:** scaffold-landed v1, 2026-06-13 (redo — the first attempt died on an API socket error). Interface + an inert, abstain-by-default provider + `probeVisionConfig()` are in `src/`; the live build (Edge Function + the Anthropic call + chain-wiring) is Round-9 work. **No live LLM calls in the scaffold. No DB writes. No key reads client-side. `tsc` green.**

**Grounding:**
- `project_desk_doodles_smart_layer_built` (memory) — the 3-layer architecture, Sebs-ratified 2026-06-13.
- `docs/knowledge/05-the-interconnection-graph.md` "Honest status" + `docs/knowledge/04-the-ml-layer.md` + `docs/knowledge/15-the-smart-ml-ladder.md`.
- `docs/design/vision-router-spec.md` (Rock K) — model choice, the prompt, the Edge Function, the fallback ladder, cost. **This doc does not re-derive that; it scaffolds the client-side layer the router lives inside.**
- `docs/design/ai-mesh-hard-path-spec.md` — the **sibling**. `mesh-generate` and `vision-router` are the same Edge Function family and share server-side key handling. The vision layer is the upstream engine picker; the hard path is its downstream consumer.
- `src/app/lib/smartHachure/classifier.ts` + `types.ts` — the `ClassifierProvider` contract this layer plugs into (READ-ONLY this pass).

---

## 0. What this layer is (and is not)

The smart system is a **3-layer additive stack** (Sebs ratified 2026-06-13), escalating cheap→expensive, **none replaces another**:

| # | Layer | What | Cost / cadence | Status |
|---|---|---|---|---|
| 1 | **Smart layer = the rule engine** | `signals → classify → treatment` via hand-written rules (`ruleEngineProvider`). The deterministic, traceable **floor + safety net, forever**. | cheap · instant · per-region | live |
| 2 | **ML layer** | A learned model trained on our own dataset; an additive provider that **augments** the rule engine where patterns beat rules. | cheap once trained · per-region | signals-only model trained (92.7%), not wired |
| 3 | **Vision/LLM layer** *(this doc)* | The **reasoning layer for the HARD cases** the other two can't crack: look at the source (esp. complex uploads) and reason about what it IS + which transformation / 3D path fits. | **expensive · sparingly (publish/upload, NOT per-region/render)** | **scaffold (this)** |

This layer is **not** a per-region shading classifier that runs at render time. It is the expensive escalation rung — it speaks only when the cheap layers don't, and its headline use is **routing**, not shading.

### The honest job (narrow on purpose)

- **The hard cases.** Rules + ML give a confident answer on most inputs; this layer is consulted only when they don't — a contested region, or a recognizable subject the geometry heuristics can't honor.
- **Routing (the headline).** Upload → which 3D path (local rod/extrude/inflate vs the AI-mesh hard path) + which treatment. This is the **vision-router**: one PNG + stroke stats → strict-JSON `RouteResult`. It is the upstream engine picker `ai-mesh-hard-path-spec.md` consumes (router emits `tripo`/`trellis` → hard path; `rod`/`extrude`/`inflate` → local).
- **It mostly ABSTAINS.** As a classifier-chain provider it returns `null` ("no opinion, delegate") on every region except the hard ones — so it slots into `classifier.ts`'s chain **without ever out-voting the cheap layers on the common case.** Abstain-by-default is the correct steady-state behavior, not a placeholder.

---

## 1. Files (this scaffold)

| File | Role |
|---|---|
| `src/app/lib/smart/visionProvider.ts` | The layer. `probeVisionConfig()` (not-configured until the Edge Function lands + the flag is set) · `routeDoodle()` stub (abstains — no live call) · `visionClassifierProvider` (a `ClassifierProvider` that returns `null` on every region) · the `RouteResult`/`RouteRequest`/`StrokeStats` contract (mirrors `vision-router-spec` §2 verbatim). |
| `docs/design/vision-llm-layer-spec.md` | This doc. |

Both are **new**. `visionProvider.ts` imports only **types** from `smartHachure/types.ts` (`Signals`, `Classification`, `ClassificationContext`, `ClassifierProvider`) — it edits no hot file and adds no dependency.

---

## 2. Model choice (decided — see vision-router-spec §1 for the full table + citations)

`claude-haiku-4-5` **primary** · `claude-sonnet-4-6` as the one-env-var quality fallback. Rationale, abridged:

- **Task shape:** one 512px PNG + stroke stats in → strict-JSON `RouteResult` out. Low reasoning depth, latency-sensitive (publish flow), needs **vision + structured output**. Haiku has all three; at ~$0.003/call it's sub-cent.
- **Anthropic-first** per repo standard; cost doesn't argue for a 2nd SDK + 2nd secret + 2nd failure mode in a 7-day runway. Provider-level outage is handled by the **fallback ladder** (abstain → local heuristic), not a second provider.
- **The model id lives server-side** in the `ROUTER_MODEL` secret — never in this client module. Swap Haiku→Sonnet without a redeploy.
- **Structured outputs** (`output_config.format`, `json_schema`, `additionalProperties:false`) make the response guaranteed-parseable — no regex repair. Adaptive thinking is **not** used (low-reasoning classifier; keep latency + cost down).

`RouteResult` (the strict schema — kept in lock-step with the server json_schema):

```ts
type RouteResult = {
  complexity: 'simple' | 'medium' | 'complex';
  subjectGuess: string;                 // 2–6 lowercase words; never a real person
  recommendedEngine: 'rod' | 'extrude' | 'inflate' | 'tripo' | 'trellis';
  moderation: { ok: boolean; reason: string | null };  // NSFW screen rides this same call
};
```

---

## 3. When it runs (sparingly — the expensive layer)

- **ONE call per publish/upload, max** — fired async **after** `Done`/`publishDoodle()` succeeds, never blocking the flow. Keyed by `contentHash` (`lib/contentHash.ts`): same doodle → cached route → free. Mode-flips, re-renders, Sandbox views reuse the cache.
- **NEVER per-region at render.** The render loop is the rule + ML floor (I-10 ~16ms/frame budget; the LLM is a network round-trip and costs money). The vision result feeds **back** into the pipeline as cached signals/overrides out-of-band — it does not run inside `classify()`.
- **As a classifier provider it abstains every frame** (`classify() → null`) in the scaffold, and even when wired only returns a *cached* hard-case verdict — never a live call inside `classify()`.
- **Cost** (vision-router-spec §3): ~$0.003/call (Haiku). Demo week ≈ $4–5; noise next to the gen APIs. Proposed cap: $5 router budget for the week, console-monitored.

---

## 4. How it slots in (abstain-by-default, then escalate)

```
region/source → classify() walks the provider chain:
   [ ruleEngineProvider ]            ← layer 1: the floor (live)
   [ , learnedProvider ]             ← layer 2: ML augment (trained, not wired)
   [ , visionClassifierProvider ]    ← layer 3: THIS — abstains (null) except hard cases
   ↓
order encodes cheap→expensive escalation: each provider only consulted when the
prior returned null / under-threshold. Vision is LAST: it can only rescue a
region the floor already failed on, never out-vote it on the common case.
```

The routing use is separate from the chain — it fires at publish/upload (`routeDoodle`), async, once. Its `RouteResult.recommendedEngine` flows downstream into the 3D fallback ladder (`ai-mesh-hard-path-spec.md` §5): `tripo`/`trellis` → hard path; local engines otherwise. Abstain (scaffold default, or any outage) → the **local heuristic rung** picks an engine and local 3D renders — the demo never dies.

`probeVisionConfig()` returns **not-configured** until:
1. the `vision-router` Edge Function is deployed (holds `ANTHROPIC_API_KEY` + `ROUTER_MODEL` as Supabase secrets — same server-side key handling as `mesh-generate`), **and**
2. the runtime flag `VITE_VISION_LAYER_ENABLED` is set (off by default — even a deployed function stays inert until flipped).

Until then: `routeDoodle()` abstains, `visionClassifierProvider.classify()` returns `null`, the rule+ML floor + local 3D answer everything.

---

## 5. Security model (locked)

The `ANTHROPIC_API_KEY` **never ships client-side.** The model call runs server-side in the `vision-router` Edge Function — the same family + same key-handling pattern as `mesh-generate` (the hard-path sibling). `FAL_KEY` is already in `.env.local` **without** a `VITE_` prefix; `ANTHROPIC_API_KEY` follows the identical path (`supabase secrets set …`). This module is the client-side contract + a server-call shim that returns `not-configured` and abstains until the function exists. Keys never enter Make.

---

## 6. Chain-wiring is HOT — FLAGGED for the pending queue (NOT done here)

Making the layer live requires editing TWO hot files, both under the BUILD-WHEN-RUNNABLE / watchdog protocol — wire only when COLD:

1. **`src/app/lib/smartHachure/index.ts`** — where `renderSmartHachure` builds the provider array passed to `classify()`. Append the vision provider **after** the rule engine (and the future `learnedProvider`):
   ```ts
   providers: [ruleEngineProvider, /* learnedProvider, */ visionClassifierProvider]
   ```
2. **`classifier.ts`** — the **consumer** of the chain; needs **no change** (it already walks whatever array `index.ts` hands it; `Classification.classifiedBy` already enumerates `'cached-llm'`). READ-ONLY this pass regardless.

The **routing** wire (`routeDoodle`) lands separately at the publish/upload site (`publish.ts` / the Done flow) — one async call per publish, never in the render path. Also hot; same pending-queue item.

**Until all of the above lands AND the Edge Function is deployed AND the flag is set, the module is fully inert.**

---

## 7. decisionsForSebs

1. **Model:** `claude-haiku-4-5` primary + `claude-sonnet-4-6` env-var fallback (rec — sub-cent/call, vision+structured-output, Anthropic-first). Or Sonnet primary for accuracy headroom at ~3× sub-cent cost. (Same call as vision-router-spec §6.1 — they're the same router.)
2. **When it runs:** one async call per publish/upload, cached by content hash, never per-region at render (rec — the layer is expensive by design; the floor handles the render loop). Confirm you're happy with publish-time (vs upload-only).
3. **Makeathon vs post scope:** the scaffold (this) is makeathon-safe and inert. For the live build, rec **demo-from-cache** as the floor (pre-warm a few demo doodles' routes + GLBs before the shoot; live router for those inputs, local heuristic for everything else) — lands the wedge with low risk; attempt the full wire by Day 15 only if Days 13–15 stay clear. The headline routing moment (upload → AI-mesh path) is the highest-payoff/highest-risk surface; keep the local floor instant underneath it.
4. **Flag default:** `VITE_VISION_LAYER_ENABLED` ships **off** — the layer stays inert until you flip it post-deploy. Confirm that's the intended safety posture (vs auto-on once the function is healthy).
