# Hard 3D Path — AI Mesh (image/drawing → GLB) — Plan

**Status:** research + scaffold landed, **INERT / default-OFF**, 2026-06-13. R10, gated on Sebs's fal/Tripo credits.
**Scaffold:** `src/app/lib/hardPath.ts` (client) + `supabase/functions/image-to-3d/index.ts` (Edge fn, NOT deployed) + this doc. New files only; no existing src edited; `tsc --noEmit` green for client TS.
**Companion spec (same feature, deeper rationale):** `docs/design/ai-mesh-hard-path-spec.md` (the Round-9 interface spec + the fallback-ladder seam). This doc is the build/integration plan + the verified-2026-06-13 API research.

---

## 0. What the hard path is (and is not)

The **hard path** = the AI-mesh route: a recognizable doodle is rasterized to an image, sent to an AI image→3D generator, and a real **GLB mesh** comes back and loads into the existing R3F scene. It's the "way harder" path because it crosses the network, costs money (~$0.02–0.30/gen), runs async (~30–90s), and depends on Sebs-side keys.

It is the **complement** to the local geometry engine already shipped (`strokeTo3d.ts` — rod / extrude / inflate / solid). Those are deterministic, instant, free, offline. The hard path is none of those, but it produces a real volumetric mesh for subjects the local extrude/inflate heuristics can't honor (a cat with a face + tail, a coffee mug, a Pikachu).

**Directive (Round-9/R10):** when wired + a doodle is router-tagged for AI mesh, the hard mesh becomes the **default** 3D; the local modes stay as explicit options AND the fallback ladder underneath. **Today it is OFF** — `isHardPathEnabled()` is false, every flip uses local geometry.

**The wedge it serves:** Tripo/TRELLIS strip the artist's hand from the mesh. Our defensible position is *the hand survives the round-trip* — the clean GLB gets the user's 2D Style re-applied at render time (SVG-port 3D Style). Mesh-gen is the geometry engine; **we own the rendering layer.** Style is render-time only; no API can bake it.

---

## 1. Files in this scaffold

| File | Role | Edited? |
|---|---|---|
| `src/app/lib/hardPath.ts` | Client provider abstraction: `HardPathRequest → HardPathJob → HardPathMesh`; `probeHardPathConfig()` / `isHardPathEnabled()` (default OFF); `requestMesh` / `pollMeshJob` / `fetchMeshResult` / `runMesh` (talk ONLY to our Edge fn); pure `normalizeFalStatus` / `normalizeTripoStatus` / `isTerminalStatus`. | NEW |
| `supabase/functions/image-to-3d/index.ts` | Deno Edge fn (NOT deployed): cache check → provider dispatch (fal TRELLIS primary / Tripo fallback / Tripo-direct) → submit/poll/result → download GLB → re-host in Storage. Keys from secrets ONLY. | NEW |
| `docs/HARD-3D-PLAN.md` | This doc. | NEW |

`hardPath.ts` imports only the `ViewBoxSize` **type** from `strokeTo3d.ts` — zero runtime coupling to the 2D pipeline / smartHachure / SvgStyleTransform / canvas3d. The Edge fn is Deno-only (`@ts-nocheck`, not in the Vite tsconfig, not in the Make drag-drop set).

---

## 2. Provider APIs (verified vs live docs, 2026-06-13)

fal.ai fronts **both** engines with one queue protocol + one key (`FAL_KEY`); Tripo-direct is the alternate only when we want Tripo's `style` presets fal doesn't expose. All three are submit→poll→result async.

### 2a. fal queue protocol (raw HTTP — the Edge fn uses fetch, not the JS client) [C2]

```
SUBMIT  POST https://queue.fal.run/{model_id}
        Authorization: Key $FAL_KEY
        body: { "image_url": "..." }
        → 200 { request_id, response_url, status_url, cancel_url, queue_position }

STATUS  GET  https://queue.fal.run/{model_id}/requests/{request_id}/status
        Authorization: Key $FAL_KEY
        → 200 { status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED", queue_position?, logs?, metrics? }

RESULT  GET  https://queue.fal.run/{model_id}/requests/{request_id}
        Authorization: Key $FAL_KEY
        → 200 { model_mesh: { url, content_type, file_name, file_size }, ... }

CANCEL  PUT  https://queue.fal.run/{model_id}/requests/{request_id}/cancel
```

Status enum: `IN_QUEUE → IN_PROGRESS → COMPLETED`. A failed gen surfaces at the result endpoint (mapped to `failed`).

### 2b. fal model: TRELLIS — `fal-ai/trellis` (PRIMARY) [C1]

- **Input:** `image_url` (required) · optional `seed`, `ss_guidance_strength` (7.5), `ss_sampling_steps` (12), `slat_guidance_strength` (3), `slat_sampling_steps` (12), `mesh_simplify` (0.95), `texture_size` (512/1024/2048, default 1024).
- **Output:** `model_mesh` (File: `{ url, content_type, file_name, file_size }`) = the GLB · `timings`.
- **Newer option:** `fal-ai/trellis-2` exists (same queue protocol, image→3D, GLB out) — a drop-in model-id swap if we want the v2 quality bump [C7].

### 2c. fal model: Tripo v2.5 — `tripo3d/tripo/v2.5/image-to-3d` (FALLBACK) [C3]

- Same `queue.fal.run/{model_id}/...` submit/status/result + `Key $FAL_KEY`.
- **Input:** `image_url` (required) · `texture` (`no`|`standard`|`HD`, default standard) · `pbr` (bool, default true) · `face_limit` · `seed` · `texture_seed` · `auto_size` · `quad` · `texture_alignment` (`original_image`|`geometry`) · `orientation` (`default`|`align_image`).
- **Output:** `model_mesh` (GLB, File `{url,content_type,file_name,file_size}`) · `pbr_model` · `base_model` · `rendered_image` · `task_id`.
- **Note:** the fal-hosted Tripo endpoint does **not** expose Tripo's `style` enum. For `object:clay` (hand-made feel) use Tripo-direct (§2d).

### 2d. Tripo direct REST — `api.tripo3d.ai/v2/openapi` (alternate, for style presets) [C4][C8]

```
AUTH    Authorization: Bearer $TRIPO_KEY
UPLOAD  POST https://api.tripo3d.ai/v2/openapi/upload   (→ file_token; OR pass a public url)
CREATE  POST https://api.tripo3d.ai/v2/openapi/task
        body: { type:"image_to_model", model_version:"v2.5-20250123",
                file:{ type:"jpg", file_token | url }, texture:true, pbr:true, style? }
        → { code:0, data:{ task_id } }
POLL    GET  https://api.tripo3d.ai/v2/openapi/task/{task_id}
        → { code:0, data:{ task_id, status, output:{ model, pbr_model } } }
```

- **Status enum:** `queued | running | success | failed | cancelled | unknown | banned | expired`.
- **Output:** `output.model` (GLB url) · `output.pbr_model`.
- **`style` enum:** `object:clay` · `object:steampunk` · `object:christmas` · `object:barbie` · `person:person2cartoon` · `animal:venom` · `gold` · `ancient_bronze`.

### 2e. Cost + latency

| Path | Cost/gen | Latency | Notes |
|---|---|---|---|
| TRELLIS via fal (`fal-ai/trellis`) | ~$0.02 | ~30–90s | open weights, cheap, primary; fal gives free signup credits |
| TRELLIS 2 via fal (`fal-ai/trellis-2`) | ~$0.25 | ~30–90s | quality bump, drop-in model-id swap |
| Tripo v2.5 via fal / direct | ~$0.13 (≈20 credits) | ~30–60s | stylized presets only via direct |
| Vision router (Haiku, upstream — optional) | ~$0.003 | ~1–2s | engine-pick, not part of this scaffold |

**Per hard-path interaction ≈ $0.02–0.04 (TRELLIS) or ~$0.13–0.30 (Tripo).** Content-hash cache (re-hosted GLB in Storage, keyed by `content_hash`) makes repeat demos free.

### ⚠️ 2f. Tripo "$50 dev grant" — do NOT bank on it

The "$50 / 5,000-credit dev grant" is the **Tripo Game Hub Developer API Credits Program** — strictly for developing games on Tripo Game Hub, Google-Form application, misuse-disqualification. A makeathon demo app is not a Game-Hub game [C5]. Use pay-as-you-go (~$0.13/gen — a demo week is single-digit dollars) or lean on TRELLIS-via-fal (~$0.02/gen + fal free signup credits).

---

## 3. The pipeline (where the hard path sits)

```
Doodle published (publish.ts stamps content_hash)
  ↓
[upstream engine pick — local heuristic now; optional vision router later]
  ├─ rod / extrude / inflate / solid  → LOCAL engine (strokeTo3d.ts) — instant, free
  └─ AI-mesh requested (chip)         → HARD PATH (this doc)
                                          ↓
                                        rasterize the doodle → image data-url
                                          ↓
                                        hardPath.requestMesh({ imageUrl, contentHash })
                                          ↓  (Edge fn holds FAL_KEY/TRIPO_KEY)
                                        image-to-3d Edge fn
                                          ├─ mesh_cache hit by content_hash → GLB url (free)
                                          └─ submit → poll → result → download GLB → re-host
                                          ↓
                                        Supabase Storage GLB url (re-hosted; provider urls expire)
                                          ↓
                                        R3F scene: useGLTF(glbUrl) → <primitive> + cannon body
                                          ↓
                                        3D STYLE applies (SVG-port re-applies the hand)
```

The hard path is one async stage. While the GLB generates, the fallback ladder still resolves an **instant local floor** (`buildStrokeGeometry`), and the mesh swaps in when ready.

---

## 4. Loading a remote GLB in R3F (the scene integration point) [C6]

**Constraint honored:** I did NOT edit `canvas3d/Stroke3DScene.tsx` (stale-base merge safety). This is the exact wire-up, to apply at R10.

`Stroke3DScene.tsx` today mounts `<StrokeMeshes>` inside `<Canvas>` (line ~162) and builds per-stroke geometry in a `useMemo`. The hard mesh slots in as a **sibling component the ladder chooses instead of `<StrokeMeshes>`** when a `HardPathMesh` is in hand:

```tsx
// NEW sibling component (drop into canvas3d/ at R10 — drei useGLTF):
import { useGLTF } from '@react-three/drei';

function HardMesh({ glbUrl }: { glbUrl: string }) {
  // useGLTF(url) is Suspense-driven; accepts any string url (Storage/OPFS blob).
  // Draco decode is ON by default (CDN decoders). Returns { scene, nodes, materials }.
  const { scene } = useGLTF(glbUrl);
  // Clone so multiple desk objects can share one cached GLB without sharing the
  // same Object3D instance (drei caches by url).
  const cloned = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={cloned} />;
}

// In Stroke3DScene, behind <Suspense fallback={<StrokeMeshes .../>}>:
//   ladder rung 'hard-mesh' → <HardMesh glbUrl={mesh.glbUrl} />
//   any other rung          → <StrokeMeshes ... />  (the instant local floor)
//
// Pre-warm before a demo:  useGLTF.preload(glbUrl)
```

**Dispose hygiene (important — the existing file already disposes programmatic geometry):**
- drei caches loaded GLTFs by url. When a desk object's mesh is permanently removed, call `useGLTF.clear(glbUrl)` to drop the cache entry and free GPU memory; cloning the scene (above) means per-instance clones are GC'd with React unmount.
- `useGLTF` signature: `useGLTF(path, useDraco = true, useMeshOpt = true, extendLoader?)`. Returns `{ nodes, materials, scene, animations, cameras, asset }`.
- Wrap the loader in `<Suspense fallback={…}>`; the natural fallback is the instant local mesh (ladder rung `local-build`), so the user always sees *something* while the GLB streams.

**cannon-es body for the GLB:** a generated mesh is arbitrary triangle soup. cannon Convex needs a convex hull; Trimesh is slow with many tris. Mitigation: auto-convex-hull, or fall back to an oriented bounding box for physics. Decide at wire time (this scaffold ships no physics body).

**SVG-port re-style under rotation:** the hard mesh should render with the user's hand re-applied (SVG-port 3D Style). The hard mesh is a heavier EdgesGeometry source than a local primitive — profile before committing SVG-port-on-hard-mesh to the demo.

---

## 5. The fallback ladder

Every rung always answers — a 2D→3D flip never shows a blank scene or a fake mesh. (`fallbackLadder.ts` in the companion spec is pure over already-known state.)

| Rung | When | What renders | Cost |
|---|---|---|---|
| `hard-mesh` | hard path on + a succeeded/cached GLB in hand | `useGLTF(mesh.glbUrl)` | free if cached, else a gen |
| `local-cached` | a prior local geometry for this `content_hash` | cached BufferGeometry | free |
| `local-build` | the doodle has strokes | `buildStrokeGeometry(strokes, {mode})` now | free |
| `paper-card` | no strokes, no mesh (upload-without-trace / total failure) | 2D paper card billboard in the scene | free |

**Default behavior:** OFF today (`probeHardPathConfig().configured === false` → ladder always falls to `local-build`). When configured + a doodle is AI-mesh-tagged, `hard-mesh` is the default rung; `local-build` shows as the instant floor while the GLB generates; failure degrades cleanly.

**I-1 respected:** the user's explicit geometry-mode pick is sacred. The hard path is opt-in per doodle (a "✨ AI mesh — generate?" chip, never auto-spending credits). Local modes are always available as explicit picks regardless of router output.

---

## 6. Security + key handling (HARD CONSTRAINT)

- `FAL_KEY` / `TRIPO_KEY` are **secrets**: never `VITE_`-prefixed, never in client code, never committed. They live ONLY in Supabase Edge secrets and are used ONLY inside `image-to-3d`.
- The Edge fn also needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (for re-hosting GLBs in Storage + writing `mesh_cache`) — also secrets, server-side only.
- The client (`hardPath.ts`) sends ONLY the client-safe **anon/publishable key** (`Authorization` + `apikey`) — the same key the rest of the app uses. No secret ever leaves the server.
- The ON switch is a **flag**, not a key: `VITE_HARD_PATH_ENABLED=1`. With it unset (today), `isHardPathEnabled()` is false.
- **No DB writes / no deploy from this scaffold** — these files are artifacts. The Edge fn returns an honest **503** until secrets are set; the client maps that to a `failed` job and the ladder falls through.
- Provider result URLs are short-lived → the Edge fn **downloads + re-hosts** the GLB in Storage; the client never persists a raw provider URL.

---

## 7. What's left to wire (the R10 build — NOT done here)

1. **Sebs-side:** load credits (FAL_KEY with credits and/or TRIPO_KEY) → `supabase secrets set` (NOT `.env`, NOT Make). Decide budget cap (~$5–10 demo week; TRELLIS-via-fal keeps it near-free). The $50 Tripo grant is Game-Hub-only — don't count on it.
2. **Storage + cache table:** create a public-read `meshes` bucket + the `mesh_cache` table:
   ```sql
   create table mesh_cache ( content_hash text primary key, glb_url text not null,
     provider text not null, file_size int, created_at timestamptz default now() );
   alter table mesh_cache enable row level security;
   create policy mesh_cache_read on mesh_cache for select using (true);  -- writes: service role only
   ```
   (Rides a Sebs SQL paste, like the desk schema.)
3. **Deploy:** `supabase functions deploy image-to-3d`.
4. **Rasterize-the-doodle step:** the client needs to turn the published doodle's SVG render into a PNG/JPEG data-url to pass as `imageUrl` (canvas rasterize of the SvgStyleTransform render, or a server-side render). Currently the client passes `imageUrl` through — the rasterizer is the missing producer.
5. **Scene wire-up:** add the `HardMesh` component + the ladder branch in `Stroke3DScene.tsx` (§4) + a cannon body strategy + Suspense fallback to the local floor.
6. **The chip + progress UI:** "✨ AI mesh available — generate?" chip; honest progress (`queued`/`running`/queue position via `runMesh({ onStatus })`); "AI mesh cooling down — built locally" copy on failure.
7. **Turn ON:** `VITE_HARD_PATH_ENABLED=1` → `isHardPathEnabled()` true.
8. **SVG-port re-style on the hard mesh** (the wedge) + rotation-stability profile.

**Makeathon-scope rec (companion spec §6.2):** floor = **demo-from-cache** (pre-warm a handful of demo doodles' GLBs into Storage before the video shoot, ship the hard path "live" for those, local modes for everything else). Attempt the full live wire only if Days 13–15 stay clear.

---

## 8. Citations (all fetched 2026-06-13)

- [C1] fal.ai TRELLIS image-to-3D — model id `fal-ai/trellis`, `image_url` input, `model_mesh` GLB output, queue submit/status/result. https://fal.ai/models/fal-ai/trellis/api
- [C2] fal.ai queue REST spec — `POST queue.fal.run/{model_id}`, `/requests/{request_id}/status`, `/requests/{request_id}`, `PUT …/cancel`, `Authorization: Key $FAL_KEY`, `IN_QUEUE`/`IN_PROGRESS`/`COMPLETED`, `request_id`/`status_url`/`queue_position`. https://fal.ai/docs/model-endpoints/queue
- [C3] fal.ai Tripo v2.5 image-to-3D — model id `tripo3d/tripo/v2.5/image-to-3d`, `image_url`/`texture`/`pbr`/`face_limit`/`orientation` input, `model_mesh`/`pbr_model`/`base_model` output. https://fal.ai/models/tripo3d/tripo/v2.5/image-to-3d/api
- [C4] Tripo OpenAPI — base `https://api.tripo3d.ai/v2/openapi`, `POST /task` (`type:image_to_model`, `model_version`, `file`), `GET /task/{task_id}`, `{code,data:{task_id,status,output:{model,pbr_model}}}` envelope, `Authorization: Bearer`. https://docs.tripo3d.ai/get-started/introduction.html · https://apidog.com/blog/how-to-use-tripo-3d-api/
- [C5] Tripo Game Hub Developer API Credits Program — 5,000 credits ($50) **for Game-Hub game development only**, Google-Form, misuse-disqualification. https://www.tripo3d.ai/blog/tripo-game-hub-developer-api-credits-program-english
- [C6] `@react-three/drei` useGLTF — `useGLTF(path, useDraco=true, useMeshOpt=true, extendLoader?)` → `{ nodes, materials, scene, animations, cameras, asset }`; accepts remote url; Suspense-driven; `useGLTF.preload(url)`; `useGLTF.clear(url)`; Draco CDN decoders default-on. https://drei.docs.pmnd.rs/loaders/gltf-use-gltf
- [C7] fal.ai TRELLIS 2 — newer `fal-ai/trellis-2` image-to-3D model, same queue protocol, GLB output. https://fal.ai/models/fal-ai/trellis-2/api
- [C8] Tripo task status enum + output (`status: queued|running|success|failed|cancelled|…`, `output.model`/`output.pbr_model` GLB urls, `Authorization: Bearer`, `GET …/task/{task_id}`). https://platform.tripo3d.ai/docs/generation
- Companion spec (local): `docs/design/ai-mesh-hard-path-spec.md`
- 21-research synthesis (local): `docs/research/21-research-3d-pipeline-and-style-translation.md` §3/§5/§8
- Edge-fn pattern (local template): `supabase/functions/image-to-svg/index.ts`
