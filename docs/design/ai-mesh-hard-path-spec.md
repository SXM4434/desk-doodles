# AI-Mesh Hard 3D Path — Implementation Spec (Round 9)

**Status:** scaffold-landed v1, 2026-06-13. Interface + stubs + this doc + the fallback-ladder seam are in `src/`; the live build (Edge Function + provider calls + GLB loader wiring) is the Round-9 work. **No live API calls in the scaffold** — Tripo/fal keys are Sebs-side at point-of-need (~Day 14).
**Grounding:** `docs/research/21-research-3d-pipeline-and-style-translation.md` §3 (orchestration), §5/§5c (3D Artist + cost realism), §8 (vision router + image-to-3D API landscape) · `docs/design/vision-router-spec.md` (the upstream engine picker + the routing-layer fallback ladder) · SESSION-HANDOFF Round-9 note: **"hard path (AI mesh) becomes the DEFAULT 3D when available; local geometry modes stay as options + fallback ladder."**
**Hard constraints honored by the scaffold:** new files only (no edits to `classifier.ts` / `index.ts` smartHachure / `SvgStyleTransform` / canvas3d render / draw panel); no live provider calls; no DB writes; `tsc` green.

---

## 0. What this path is (and is not)

The **hard path** is the AI-mesh route: a recognizable doodle → an AI 3D generator (Tripo or Microsoft TRELLIS) produces a real GLB mesh → loaded into the R3F scene. It is the "way harder 3D path" because it crosses the network, costs money, runs async (~30–90s), and depends on Sebs-side keys.

It is the **complement** to the local geometry engine already shipped (`strokeTo3d.ts` / `convert.ts` — rod / extrude / inflate / solid). Those are deterministic, instant, free, offline. The hard path is none of those, but it produces a real volumetric mesh for subjects the local extrude/inflate heuristics can't honor (a cat with a face and a tail, a coffee mug, a Pikachu).

**The Round-9 directive:** when the hard path is wired and a doodle is router-tagged `tripo`/`trellis`, the hard mesh is the **default** 3D. The local modes do not disappear — they become explicit user options AND the fallback ladder underneath (see §5).

**The wedge it serves (21-research §13):** Tripo/TRELLIS strip the artist's hand from the mesh. Our defensible position is *the hand survives the round-trip* — so the hard path's clean GLB gets the user's 2D Style re-applied at render time via the SVG-port 3D Style (EdgesGeometry → SvgStyleTransform overlay). The mesh-gen is the geometry engine; **we own the rendering layer.** The hard path never bakes style into the mesh (no API can — 21-research §5c); style is render-time only.

---

## 1. Files (this scaffold)

| File | Role |
|---|---|
| `src/app/lib/geometry3d/hardPath.ts` | The interface — `HardPathRequest` → `HardPathJob` → `HardPathMesh`; provider/style/status types; `probeHardPathConfig()` (returns not-configured); stub `requestMesh` / `pollMeshJob` / `fetchMeshResult`; pure status-normalization helpers (`normalizeFalStatus` / `normalizeTripoStatus`). |
| `src/app/lib/geometry3d/fallbackLadder.ts` | The seam — `resolveFallback(LadderInput) → LadderDecision`; rungs `hard-mesh → local-cached → local-build → paper-card`; pure, no I/O. |
| `docs/design/ai-mesh-hard-path-spec.md` | This doc. |

All three are **new**. Nothing here imports from or edits a hot file. `hardPath.ts` imports only the `ViewBoxSize` type from `strokeTo3d.ts`; `fallbackLadder.ts` imports only types from `hardPath.ts` + `strokeTo3d.ts`.

---

## 2. Provider API shapes (real, verified 2026-06-13)

The research doc recommends **fal.ai as the integration layer** (one queue protocol fronts both TRELLIS and Tripo); Tripo-direct is the alternative if we want the `style` presets fal doesn't expose. All three are queue/poll async.

### 2a. fal.ai — TRELLIS (`fal-ai/trellis`) [C1]

- **Submit:** `POST https://queue.fal.run/fal-ai/trellis`
- **Status:** `GET https://queue.fal.run/fal-ai/trellis/requests/{request_id}/status`
- **Result:** `GET https://queue.fal.run/fal-ai/trellis/requests/{request_id}`
- **Auth:** `Authorization: Key $FAL_KEY`
- **Input:** `image_url` (required) · optional `seed`, `ss_guidance_strength` (7.5), `ss_sampling_steps` (12), `slat_guidance_strength` (3), `slat_sampling_steps` (12), `mesh_simplify` (0.95), `texture_size` (512/1024/2048, default 1024)
- **Output:** `model_mesh` (File: `url`, `content_type`, `file_name`, `file_size`) = the GLB · `timings`
- **Submit response fields:** `request_id`, `response_url`, `status_url`, `cancel_url`, `queue_position`
- **Status enum:** `IN_QUEUE` → `IN_PROGRESS` → `COMPLETED` [C2]

### 2b. fal.ai — Tripo (`tripo3d/tripo/v2.5/image-to-3d`) [C3]

- Same `queue.fal.run/{model_id}/...` submit/status/result flow + `Key $FAL_KEY` auth.
- **Input:** `image_url` (required) · `texture` (`standard`|`no`|`HD`, default standard) · `pbr` (bool, default true) · `face_limit` · `seed` · `texture_seed` · `auto_size` · `quad` · `texture_alignment` (`original_image`|`geometry`) · `orientation` (`default`|`align_image`)
- **Output:** `task_id` · `model_mesh` (GLB) · `pbr_model` · `base_model` · `rendered_image`
- **Note:** the fal-hosted Tripo v2.5 endpoint does **not** expose Tripo's `style` enum. For `object:clay` (the hand-made-feel default, 21-research §5c) use Tripo-direct (§2c).

### 2c. Tripo — direct REST (`api.tripo3d.ai/v2/openapi`) [C4]

- **Create:** `POST /task` — body: `type: "image_to_model"` · `file: { type, file_token | url }` · `model_version` (default `"v2.5-20250123"`) · `texture` (bool, default true) · `pbr` (bool, default true) · `style` (`object:clay` · `object:steampunk` · `object:christmas` · `object:barbie` · `person:person2cartoon` · `animal:venom` · `gold` · `ancient_bronze`)
- **Upload (to get a `file_token`):** the upload endpoint; or pass a public `url` instead.
- **Poll:** `GET /task/{task_id}` — status: `queued` · `running` · `success` · `failed` · `cancelled` · `unknown` · `banned` · `expired`
- **Output:** `output.model` (GLB url) · `output.pbr_model`
- **Auth:** `Authorization: Bearer $TRIPO_KEY`

### 2d. Cost + latency (21-research §5c/§8, re-confirmed where possible)

| Path | Cost/gen | Latency | Notes |
|---|---|---|---|
| Tripo v2.5/v3 image-to-3d | ~$0.13 (20 credits) | ~30–60s | stylized presets via direct API |
| TRELLIS via fal | ~$0.02 (original) – ~$0.25 (TRELLIS 2) | ~30–90s | open weights; 68% benchmark wins; cheap fallback |
| Vision router (Haiku, upstream) | ~$0.003 | ~1–2s | vision-router-spec §1 |

**Per hard-path interaction ≈ $0.15–0.30** (router + Tripo) or **~$0.02–0.04** (router + TRELLIS-original). Content-hash cache (OPFS) makes repeat demos free.

### ⚠️ 2e. Tripo "$50 dev grant" — CORRECTION FOR SEBS

The research doc (21-research §8, §5c) repeatedly cites a **"$50 free dev credits / 5,000-credit dev grant"** for Tripo as if it's a general developer/hackathon perk. **The actual program is narrower** [C5]: the "Tripo Game Hub Developer API Credits Program" grants 5,000 credits (worth $50) **strictly for developing games on Tripo Game Hub**, requires a Google-Form application, and explicitly disqualifies "commercial misuse." A makeathon demo app is not a Tripo-Game-Hub game.

**Implication:** do not bank on the $50 grant covering Desk Doodles demos. Options: (a) use Tripo's standard pay-as-you-go / Pro credits (~$0.13/gen — a demo week of a few hundred gens is single-digit dollars), (b) lean on **TRELLIS via fal** (~$0.02/gen, plus fal's own free signup credits) as the primary, or (c) apply to the grant only if Desk Doodles can be honestly framed as a Game-Hub project (it can't, cleanly). This is a Sebs decision — see §6.

---

## 3. The pipeline (where the hard path sits)

```
Doodle published (publish.ts stamps content_hash)
  ↓  (async, one call per publish — vision-router-spec §5)
VISION ROUTER (Edge Function: vision-router)  → RouteResult.recommendedEngine
  ↓
  ├─ rod / extrude / inflate  → LOCAL engine (convert.ts) — instant, free
  └─ tripo / trellis          → HARD PATH (this spec)
                                  ↓
                                MESH-GENERATE (Edge Function: mesh-generate)
                                  ↓  holds FAL_KEY / TRIPO_KEY (server-side only)
                                  ├─ OPFS cache hit by content_hash → return GLB
                                  └─ submit to fal/Tripo queue → poll → GLB
                                  ↓
                                OPFS cache (GLB blob by content_hash — biggest win)
                                  ↓
                                R3F scene: useGLTF(glb.url) → mesh + cannon-es body
                                  ↓
                                3D STYLE applies (SVG-port re-applies the hand)
```

**Orchestration (21-research §3):** the hard path is one async stage in the typed function chain. Wrap the Edge Function fetch in Cockatiel (`retry` + `timeout` + `consecutiveBreaker`) so a provider outage opens the circuit and the fallback ladder (§5) engages instantly. GLB blobs cache in OPFS keyed by `content_hash` (10× faster than IndexedDB for blobs); job metadata in IndexedDB.

---

## 4. Server wiring (the build, NOT done here)

The hard path runs server-side because the keys never ship client-side (locked, handoff 06-10 + vision-router-spec §3). The `mesh-generate` Edge Function (sibling of `vision-router`):

1. **Auth:** anon-key like the rest of the app; reads `FAL_KEY` / `TRIPO_KEY` from `supabase secrets`.
2. **Cache:** look up `content_hash` in a `mesh_cache` table → if a GLB storage URL exists, return it (`source:'cache'`).
3. **Submit:** POST to fal (`queue.fal.run/{model_id}`, `Key $FAL_KEY`) or Tripo (`POST /task`, `Bearer $TRIPO_KEY`). Return `{ jobId, provider, status:'queued' }`.
4. **Poll proxy:** a status endpoint that GETs the provider status and maps it (the client uses `normalizeFalStatus` / `normalizeTripoStatus`).
5. **Result proxy:** on `succeeded`, GET the provider result (fal `output.model_mesh.url` / Tripo `output.model`), download the GLB, upload to Supabase Storage under `content_hash`, upsert `mesh_cache`, return the storage URL.
6. **Moderation:** reuse the router's `moderation.ok` — never spend a gen credit on a flagged doodle.

`probeHardPathConfig()` flips to `configured:true` only once this function is deployed AND a runtime flag (e.g. `VITE_HARD_PATH_ENABLED` or a cached `/functions/v1/mesh-generate` health ping at boot) is set. Until then it returns not-configured and the ladder always falls through to local.

New table (rides a Sebs schema paste, like `route_cache`):
```sql
create table mesh_cache ( content_hash text primary key, glb_url text not null,
  provider text not null, file_size int, created_at timestamptz default now() );
alter table mesh_cache enable row level security;
create policy mesh_cache_read on mesh_cache for select using (true);  -- writes: service role only
```

---

## 5. The fallback ladder (`fallbackLadder.ts`)

Every rung always answers — a 2D→3D flip never shows a blank scene or a fake mesh.

| Rung | When | What renders | Cost |
|---|---|---|---|
| `hard-mesh` | hard path requested + a succeeded GLB in hand | `useGLTF(mesh.glb.url)` | free if cached, else a gen |
| `local-cached` | a prior local geometry for this `content_hash` (OPFS) | cached BufferGeometry | free |
| `local-build` | the doodle has strokes | `convertStrokePool(strokes, {mode})` now | free |
| `paper-card` | no strokes, no mesh (upload-without-trace / total failure) | 2D paper card billboard in the scene | free |

`resolveFallback()` is pure over already-known state (`probeHardPathConfig()` result + whether a mesh/job/cache/strokes exist + the user's geometry-mode pick). It returns the chosen rung **plus** the skipped rungs with reasons, so the honest UI chip can say *"AI mesh cooling down — built locally from your strokes."*

**Default behavior (Round-9):** when `probeHardPathConfig().configured` is true and the router tagged the doodle `tripo`/`trellis`, the hard path is requested and `hard-mesh` is the default rung. While the GLB generates, the ladder still resolves `local-build` for an **instant local floor** (vision-router-spec §5 "instant local 3D first"); the mesh swaps in when ready. If config is false (today's scaffold) or generation fails, the ladder degrades cleanly and marks `degraded:true`.

**I-1 respected:** the user's explicit geometry-mode pick is sacred. The hard path is opt-in per doodle (the router *suggests*, the user accepts via the "✨ AI mesh available — generate?" chip rather than auto-spending credits). The local modes are always available as explicit picks regardless of router output.

---

## 6. Sebs decisions (flag before the Round-9 build)

1. **Tripo vs fal/TRELLIS vs both.**
   - *Both, fal-first (rec):* fal fronts both providers with one queue protocol + one key (`FAL_KEY`, already in `.env.local`). Start with **TRELLIS via fal** (~$0.02/gen, cheapest, open weights, 68% benchmark wins) as the default; add Tripo-via-fal for stylized output; reserve Tripo-direct only if we want the `object:clay` style preset (fal doesn't expose it). One key, two engines, lowest setup tax.
   - *Tripo-direct only:* unlocks the `style` presets and the (restricted) dev grant, but needs a second key (`TRIPO_KEY`) + its own upload-to-get-file_token flow.
   - *fal/TRELLIS only:* simplest, cheapest, no style presets — fine if we don't need clay-look.

2. **Makeathon vs post-makeathon scope.** The hard path is the *headline wedge demo moment* but also the riskiest surface (network, cost, async, keys). Options: (a) **full wire by Day 15** per the re-baseline grid (router + mesh-generate + GLB loader + SVG-port re-style) — high payoff, high risk; (b) **demo-from-cache only** — pre-warm a handful of demo doodles' GLBs into OPFS/Storage before the video shoot, ship the hard path "live" for those inputs, local modes for everything else (much lower risk, the demo still lands the wedge); (c) **scaffold-only for the makeathon**, full build post-deadline (safest, but loses the headline). Rec: **(b) demo-from-cache** as the floor, attempt (a) if Days 13–15 stay clear.

3. **The key/credits prerequisite (Sebs-side, ~Day 14).** Needed before any live gen: a `FAL_KEY` with credits loaded (fal gives free signup credits; ~$5 covers dozens of TRELLIS gens) and/or a `TRIPO_KEY`. **The $50 Tripo dev grant is Game-Hub-only (§2e) — do not count on it.** Decide the budget cap (rec: ~$5–10 for the demo week, dominated by Tripo if used; TRELLIS-via-fal keeps it near-free). Keys go to `supabase secrets`, never client-side, never into Make.

---

## 7. Open questions / followups

- **cannon-es body for the GLB mesh.** A generated mesh is an arbitrary triangle soup. cannon-es Convex needs a convex hull; Trimesh is slow with many triangles. Mitigation (21-research §11): auto-convex-hull or fall back to an oriented bounding box for physics. Decide at wire time.
- **GLB → useGLTF with a runtime URL.** `useGLTF` takes any string url (remote signed url, OPFS-derived blob url) and is Suspense-driven; `useGLTF.preload(url)` for pre-warm; Draco decode is on by default [C6]. The OPFS-cached GLB is read into a blob URL for the loader.
- **SVG-port re-style under rotation.** The hard mesh must render with the user's hand re-applied (SVG-port 3D Style). Rotation stability = stable-seed for the makeathon (F3-toggle-architecture / 21-research §6). The hard mesh is a heavier EdgesGeometry source than a local primitive — profile before committing SVG-port-on-hard-mesh to the demo.
- **Signed-URL expiry.** fal/Tripo result URLs are short-lived — always download + re-cache in Supabase Storage/OPFS at result time; never persist a provider URL.

---

## 8. Citations

- [C1] fal.ai TRELLIS image-to-3D API — model id `fal-ai/trellis`, `image_url` input, `model_mesh` GLB output, queue submit/status/result. https://fal.ai/models/fal-ai/trellis/api (fetched 2026-06-13)
- [C2] fal.ai async queue spec — `https://queue.fal.run/{model_id}`, `/requests/{request_id}/status`, `/requests/{request_id}`, `Authorization: Key $FAL_KEY`, `IN_QUEUE`/`IN_PROGRESS`/`COMPLETED`, `request_id`. https://fal.ai/docs/model-endpoints/queue (fetched 2026-06-13)
- [C3] fal.ai Tripo v2.5 image-to-3D — model id `tripo3d/tripo/v2.5/image-to-3d`, `image_url`/`texture`/`pbr`/`face_limit` input, `model_mesh`/`pbr_model`/`base_model` output. https://fal.ai/models/tripo3d/tripo/v2.5/image-to-3d/api (fetched 2026-06-13)
- [C4] Tripo direct REST — base `api.tripo3d.ai/v2/openapi`, `POST /task` (`type:image_to_model`, `file{type,file_token|url}`, `model_version:v2.5-20250123`, `style` enum), `GET /task/{task_id}`, status `queued|running|success|failed|cancelled|unknown|banned|expired`, `output.model`/`output.pbr_model`, `Authorization: Bearer`. https://github.com/VAST-AI-Research/tripo-python-sdk (docs/API.md, fetched 2026-06-13)
- [C5] Tripo Game Hub Developer API Credits Program — one-time 5,000 credits ($50) **for Game-Hub game development only**, Google-Form application, misuse disqualification. https://www.tripo3d.ai/blog/tripo-game-hub-developer-api-credits-program-english (fetched 2026-06-13)
- [C6] `@react-three/drei` useGLTF — `useGLTF(url)` returns `{nodes, materials, scene}`, Suspense-driven, `useGLTF.preload(url)`, Draco-on-by-default. https://drei.docs.pmnd.rs/loaders/gltf-use-gltf (fetched 2026-06-13)
- 21-research synthesis (local): `docs/research/21-research-3d-pipeline-and-style-translation.md` §3/§5/§5c/§8/§13
- vision-router-spec (local): `docs/design/vision-router-spec.md` §3/§4/§5 (upstream engine picker + routing-layer ladder)
```
