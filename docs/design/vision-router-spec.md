# Vision-LLM Router — Implementation Spec (Rock K)

**Status:** spec v1, 2026-06-11. De-risks the Day 15 (06-15) hard-path build so it lands in one day.
**Grounding:** `docs/research/21-research-3d-pipeline-and-style-translation.md` §8 (router = vision LLM analyzes drawing → routes to 3D generator; **no production case study exists** — closest is research-stage arXiv 2505.20129 [8]) · `makeathon-plan.md` RE-BASELINE §B-2/§D 06-15/§E (cached-example demo-safety rule, Sebs API prereqs) · SESSION-HANDOFF 06-11 Sebs decision: **NSFW/moderation rides this same call** (one extra instruction, nearly free).
**Hard constraint:** no `src/` edits in this pass — this doc is the build contract.

---

## 1. Model choice

Task shape: one PNG of a doodle + stroke stats in → strict JSON classification out. Low reasoning depth, latency-sensitive (publish flow), needs vision + structured output.

| Model | $/MTok in / out | Est. cost/call¹ | Vision | Structured output | Notes |
|---|---|---|---|---|---|
| **claude-haiku-4-5** ★ | $1 / $5 [1] | **~$0.003** | ✓ (all current Claude models) [1] | ✓ `output_config.format` [3] | Fastest Claude; 200K ctx (irrelevant here) |
| claude-sonnet-4-6 (fallback) | $3 / $15 [1] | ~$0.008 | ✓ | ✓ | Quality upgrade, one env-var swap |
| claude-fable-5 | $10 / $50 [1] | ~$0.025 | ✓ | ✓ | Top tier — overkill for a 4-field classifier |
| GPT-5.5 / gpt-5.4-mini | $5/$30 · $0.75/$4.50 [4] | ~$0.01 / ~$0.001 | ✓ | ✓ | Mini is cheap, but adds a 2nd SDK + 2nd secret |
| Gemini 2.5 Pro / Flash | $1.25/$10 · $0.30/$2.50 [5] | ~$0.004 / ~$0.001 | ✓ (vision input ≈ 258 tok per 768px tile) [5] | ✓ | Same 2nd-provider tax |

¹ At 512×512 PNG = ⌈512/28⌉² = **361 image tokens** (Claude patch formula) [2] + ~1.1K prompt tokens + ~200 output tokens.

**Recommendation: `claude-haiku-4-5` primary, `claude-sonnet-4-6` as the quality fallback** (single `ROUTER_MODEL` env var on the Edge Function — swap without redeploy). Repo standard is Anthropic-first unless cost argues otherwise; here cost doesn't argue — Haiku is sub-cent per call, so the marginal savings from gpt-5.4-mini never pay for a second SDK, second secret, and second failure mode in a 7-day runway. Provider-level outage is handled by the fallback ladder (§4), not by a second provider. Eval set for the haiku-vs-sonnet call: run both against ~20 fixtures from the 197-shape `/audit` catalog + 5 drawn doodles; if Haiku misroutes >2, flip the env var.

---

## 2. The prompt

One call, single pass (the 21-research 2-pass StyleGuide flow is the *3D Artist mode* analysis — this router is the cheaper pre-step; they stay separate calls). Use structured outputs (`output_config.format`, `json_schema`, `additionalProperties:false`) so the response is guaranteed-parseable [3] — no regex repair, no self-heal loop. `max_tokens: 1024`, no thinking param.

**System prompt (draft — freeze before Day 15, it's the cache prefix):**

```
You are the routing brain of Desk Doodles, a playful web app where people doodle on a
shared desk and flip their doodles into 3D. You see one PNG render of a doodle plus
stroke statistics. Pick the 3D engine that fits it best, and screen it for safety.

Engines:
- rod      open strokes, stick figures, scribbles, single-line drawings (tube along stroke)
- extrude  flat closed shapes: icons, letters, hearts, stars, arrows (prism from outline)
- inflate  one rounded closed blob that wants to look puffy (balloon inflation)
- tripo    recognizable subject with implied volume/detail: characters, creatures,
           objects (AI mesh generation, stylized — costs money, takes ~30-60s)
- trellis  complex multi-part subjects/scenes where fidelity beats style (AI mesh, hi-fi)

Rules:
- Prefer local engines (rod/extrude/inflate) whenever they would honestly look good.
- complexity: "simple" = local engine clearly sufficient · "medium" = local works but AI
  adds real value · "complex" = only AI generation does it justice.
- subjectGuess: 2-6 lowercase words a person would say ("dog", "coffee mug",
  "abstract scribble"). Never identify a real person.
- Moderation: set moderation.ok=false ONLY for clearly explicit sexual imagery, hate
  symbols or slurs (drawn or written), or graphic gore. Crude, childish, or silly
  doodles are fine — this is a playful public desk; do not over-block. ok=false needs a
  short neutral reason; ok=true means reason=null.
```

**User content:** image block (PNG base64) + text block:

```
Stroke stats: {strokeCount} strokes · {closedCount} closed / {openCount} open · bbox {w}x{h}px.
Examples (stats+content → engine): 1 open stroke wavy line → rod · 3 closed strokes star
outline → extrude · 1 closed round blob → inflate · 14 strokes cat with face and tail →
tripo · 40+ strokes castle with towers and windows → trellis.
Classify this doodle.
```

**Few-shot verdict:** textual exemplars only (above — they anchor the stats→engine mapping for ~60 tokens). Image few-shot would ~5× input cost for marginal gain at this task difficulty; revisit only if the §1 eval shows misroutes.

**Output schema (the strict JSON, enforced server-side):**

```ts
type RouteResult = {
  complexity: 'simple' | 'medium' | 'complex';
  subjectGuess: string;
  recommendedEngine: 'rod' | 'extrude' | 'inflate' | 'tripo' | 'trellis';
  moderation: { ok: boolean; reason: string | null };
};
```

Client maps unavailable engines to nearest shipped one (`inflate → extrude` until Inflate-Lite lands) — the schema stays stable across the build.

---

## 3. Where it runs — Supabase Edge Function `vision-router`

Server-side because keys never ship client-side — this is the locked security model: handoff 06-10 records `FAL_KEY` lives in `.env.local` with **no `VITE_` prefix ("never bundles client-side; moves to Edge Function secrets Day 13")**. `ANTHROPIC_API_KEY` follows the identical path: `supabase secrets set ANTHROPIC_API_KEY=… ROUTER_MODEL=claude-haiku-4-5`. Same function family later hosts the Tripo/TRELLIS gen calls.

```ts
// POST {SUPABASE_URL}/functions/v1/vision-router      (anon key auth, like the rest of the app)
type RouteRequest = {
  contentHash: string;                    // SHA-1 from lib/contentHash.ts — the cache key
  imageBase64: string;                    // PNG, 512px long edge, rasterized client-side (§5)
  strokeStats: { strokeCount: number; closedCount: number; openCount: number;
                 bbox: { w: number; h: number } };
};
type RouteResponse =
  | { ok: true; route: RouteResult; source: 'cache' | 'llm' }
  | { ok: false; error: string };         // client drops to heuristic rung (§4)
```

Function body: (1) look up `contentHash` in `route_cache` → return `source:'cache'`; (2) else call Anthropic Messages API (TS SDK, `AbortController` at 25s, SDK default retry on 429/529); (3) validate against the json_schema; (4) upsert `route_cache` (service-role client) and return. Fits Edge Function limits comfortably: the Anthropic call is async I/O (doesn't burn the 2s CPU budget); wall-clock cap is 150s free tier / 400s paid [6].

**Circuit breaker (client side, in the pipeline chain):** Cockatiel is the locked orchestration pick (21-research §3 [7]). Wrap the fetch in `wrap(retry(handleAll, { maxAttempts: 2, backoff: ExponentialBackoff }), timeout(20s), consecutiveBreaker(3 failures → open 60s))`. Circuit open = skip straight to the heuristic rung; surface state in UI as a quiet chip ("router cooling down — using local 3D").

**Cost per call / budget:** ~$0.003 (Haiku, §1 math). Demo-day worst case 200 publishes ≈ **$0.60/day**; full demo week ≈ **$4–5**. The router is noise next to the gen APIs (Tripo ~$0.13/gen vs TRELLIS-via-fal ~$0.02/gen, $50 Tripo dev grant — 21-research §5c/§8). Proposed cap: **$5 router budget for the week**, enforced informally via Anthropic console usage page; hard enforcement (count column in `route_cache`) is post-makeathon.

**New table (rides the next Sebs schema paste, §E of the re-baseline):**

```sql
create table route_cache ( content_hash text primary key, route jsonb not null,
  model text not null, created_at timestamptz default now() );
alter table route_cache enable row level security;
create policy route_cache_read on route_cache for select using (true);  -- writes: service role only
```

---

## 4. Fallback ladder (every rung always answers)

| Rung | Path | Returns | Cost |
|---|---|---|---|
| 0 | `route_cache` hit (server) / IndexedDB memo (client) | exact cached `RouteResult` | free |
| 1 | Edge Function → Claude (`ROUTER_MODEL`) | fresh `RouteResult`, cached | ~$0.003 |
| 2 | **Local heuristic** (`lib/routeHeuristic.ts`, pure fn) — majority-open OR ≤2 strokes → `rod`; majority-closed AND ≤8 strokes → `extrude`; single closed near-circular blob → `inflate`; else → `tripo` if hard path live, else `extrude` | best-effort `RouteResult`, `moderation.ok=true` (unscreened — see decision 3) | free |
| 3 | **Always-works cached example** — demo fixtures pre-warmed into `route_cache` + their GLBs into OPFS before the video shoot; if even the gen API is down, the demo flips to the cached GLB | demo never dies | free |

Rung 3 is the locked demo-safety rule (RE-BASELINE §D 06-15: "Ship with a CACHED example as fallback — external API failure can't kill the demo moment"; rate-limit mitigation in 21-research §11: Claude tier-1 ≈ 50 RPM → demo from pre-warmed cache).

---

## 5. Client integration points

- **Fire point — ONE call per publish, max.** After `Done` → `publishDoodle()` succeeds (optimistic add, `publish.ts` already stamps `content_hash` per `lib/contentHash.ts`), fire `vision-router` **async**. Never blocks the Done flow. Mode-flips, re-renders, and Sandbox views re-use the cached route — the content hash is the identity.
- **Rasterization:** client renders the styled SVG to a 512×512 PNG via canvas (`canvas.toBlob`) — no API accepts SVG natively (21-research §8 "SVG note"); 512px keeps the image at 361 tokens [2].
- **What gets cached:** `RouteResult` keyed by `content_hash` — server (`route_cache`, enables cross-session demo pre-warm) + client IndexedDB memo (per the OPFS-GLB / IndexedDB-metadata split, 21-research §3). GLBs from the hard path cache in OPFS under the same hash.
- **Moderation enforcement:** publish-then-revoke — if `moderation.ok === false`, client calls `deleteDoodle(id)` + toast ("that one's not for the shared desk"). Keeps Done instant; the doodle exists publicly for ~2–5s worst case (acceptable at demo scale — see decision 4).
- **UI while waiting:** **instant local 3D first.** The 2D→3D flip renders Rod/Extrude immediately from strokes (`lib/geometry3d` is already built per the 3D build plan — the honesty-gate wiring). If the route comes back `tripo`/`trellis`, show an upgrade chip ("✨ AI mesh available — generate?") rather than auto-spending credits; on accept, show progress on the desk object, swap the GLB in when ready. The local render is the floor; the router only ever upgrades, never gates.

---

## 6. Sebs decisions (flag before Day 15 build)

1. **Model:** `claude-haiku-4-5` primary + `sonnet-4-6` env-var fallback (rec), or Sonnet primary for accuracy headroom at 3× sub-cent cost.
2. **Budget cap:** $5/week router cap, console-monitored (rec) — or a number you pick. (Real budget lever = Tripo/TRELLIS spend; $50 grant + fal credits per §E prereqs.)
3. **Moderation strictness:** lenient flagrant-only as drafted (rec — over-blocking kills the playful desk), or stricter wording. Also: heuristic rung is **unscreened fail-open** when the API is down (rec for demo week) vs fail-closed (block publish on router outage).
4. **Enforcement shape:** publish-then-revoke (rec, Done stays instant) vs pre-publish gate (+1–3s on every Done).
5. **`route_cache` table:** server cache + pre-warm via one extra paste (rec) vs client-only IndexedDB (zero paste, but no cross-session pre-warm for the video shoot).

---

**Citations:** [1] Anthropic models overview (fetched 2026-06-11) — Haiku 4.5 $1/$5, Sonnet 4.6 $3/$15, Fable 5 $10/$50; all current models support vision: https://platform.claude.com/docs/en/about-claude/models/overview · [2] Anthropic vision docs (fetched 2026-06-11) — visual tokens = ⌈w/28⌉×⌈h/28⌉: https://platform.claude.com/docs/en/build-with-claude/vision · [3] Anthropic structured outputs — `output_config.format` json_schema, supported on Haiku 4.5: https://platform.claude.com/docs/en/build-with-claude/structured-outputs · [4] OpenAI pricing (June 2026) — GPT-5.5 $5/$30, gpt-5.4-mini $0.75/$4.50: https://developers.openai.com/api/docs/pricing · [5] Gemini API pricing — 2.5 Flash $0.30/$2.50, 2.5 Pro $1.25/$10 (vision input tiled at ~258 tok/768px): https://ai.google.dev/gemini-api/docs/pricing · [6] Supabase Edge Function limits (fetched 2026-06-11) — 150s free / 400s paid wall clock, 2s CPU, 256MB: https://supabase.com/docs/guides/functions/limits · [7] Cockatiel: https://github.com/connor4312/cockatiel (21-research ref [17]) · [8] arXiv 2505.20129 "Agentic 3D Scene Generation with Spatially Contextualized VLMs" (via 21-research §8 — router-as-pre-step has no production precedent).
