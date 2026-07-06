# Rules audit — candidates for durable memory / skills

Decisions and rules stated in `SESSION-HANDOFF.md` (top sections, dated 2026-06-15) that are
load-bearing and currently live only in the handoff. The handoff is short/current/disposable by
design (per CLAUDE.md), so these risk evaporating. Listed as **candidates** only — I did NOT write
to the memory dir. Sebs decides which graduate to a memory entry vs a skill vs stay in the handoff.

## Durable-memory candidates (rules / locked decisions)

1. **3D north-star: "it's ALL ONE PENCIL."** — The entire aesthetic is monochrome (black + grayscale);
   what reads as color is VALUE from pencil moves (pressure, shading, hatch density). 3D must carry the
   same matte pencil-sketch character — never glossy/lit/plastic-black. Load-bearing, gates ALL 3D work.

2. **Two 3D modes = two translation chains (architecture).** Straight-3D is its OWN style, a peer/sibling
   to the 2D svg styles (compare to the clean form, NOT the 2D marks). SVG-port is a there-and-back port
   that CARRIES the 2D style+toggles onto the form (compare to the same 2D style). Same nominal style via
   the two chains gives different output BY DESIGN — don't "fix" that. Architectural invariant.

3. **3D verify rule + baseline-depends-on-chain.** Always compare a 3D render to its baseline: straight-3D
   ↔ clean SVG; svg-port ↔ the SAME svg style rendered in 2D. Pair every svg-port OFAT cell
   `[clean SVG] · [2D style X] · [svg-port 3D style X]`. Use the 197 audit-catalog objects (known
   baselines) as the 3D/svg-port test fixtures, not just hand-drawn scribbles. Standing verification law.

4. **solid/native vs svg-port tone-carry (locked design call).** svg-port wears the literal 2D shading;
   solid/native carry only tone (light/dark) via etch + slight recess, never the literal hatch texture.
   Locked 2026-06-15 — a real design decision that will be re-litigated if not recorded.

5. **Stale-base law / "your tab was stale."** If a 3D render looks all-black/wrong, suspect a STALE tab
   (hard-refresh) or a theme/geometry-mode difference before assuming a regression. Verify against a fresh
   build. Recurring diagnostic trap worth a durable note.

6. **Headless cannot verify 3D — headed Chrome + real mouse only.** Never claim a 3D render verified from a
   headless harness; WebGL needs a real GPU and rotation needs Sebs's real mouse. (Reinforces the existing
   `feedback_live_check_not_headless_harness` memory, specifically for the 3D/WebGL case.)

7. **"Stopped blind 3D work" — 3D quality needs Sebs's eyes + real-time iteration.** 3D shading/quality is
   a focused awake-session task, not autonomous. A working-mode rule for how 3D gets done.

8. **Personal-space DB verified working (2026-06-15).** All RPC flows pass against live Supabase via the
   harness; migrations 0001/0003/0004/0005 live, 0002 intentionally deferred (post-makeathon anon-auth);
   `desk_index` is globally-unique negative. Project-status fact worth persisting so it isn't re-verified.

9. **Default-black fill is scoped to UPLOADS only (by construction).** `svgUpload.ts normalizeDefaultBlackFills`
   makes default-black explicit in the upload sanitizer, which the 197 catalog never passes through — so
   uploads fill and the catalog is untouched without any global guard flip. Locked design constraint that
   protects the catalog; easy to accidentally violate later.

10. **github / nonzero-winding knockout stays a known-rough STRESS fixture.** Not a real user doodle;
    extending region-recompute to nonzero winding is broad/risky and detailed logos read stylized-rough
    anyway. A "leave alone for the makeathon" decision worth recording so it isn't re-opened.

## Skill candidates

- **3D-verify skill** — headed Chrome, draw/shade → 3D → drive the custom 3D-STYLE dropdown → capture, with
  the per-chain baseline-comparison rule (candidate #2/#3) baked in. Generalizes `dd-svgport-cap.mjs`.

- **OFAT toggle skill** — hold baseline, change ONE control across its range, capture each step, diff vs the
  held baseline. Generalizes `dd-pressure-cap.mjs`; matches the project's existing one-factor-at-a-time
  discipline. (Both skill candidates already noted in this folder's README.)

## Already-covered (NOT new candidates — flagged so they aren't double-filed)

- The pressure-slider fix mechanics, the demo-wall / demo-add / gallery features, and the nested-fill
  resolution scaling are implementation details with full writeups in
  `docs/submission/FEATURES-BUILD-LOG.md` / `docs/submission/RUNNING-TODO.md` and don't need memory entries.
- The Make 3D self-heal / duplicate-three / context-race saga is extensively logged in the handoff's R10d/e
  sections; if anything graduates it's a single "Make preview = WebGL cold-load race → auto-retry boundary"
  line, but the existing `project_desk_doodles_no_rapier_in_make` already covers the Make-flakiness family.
