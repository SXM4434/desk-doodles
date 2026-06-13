# The Build–Test Flow (the gauntlet) — canonical process doc

**This is how we build and test Desk Doodles. Every rock, every agent prompt, every fix obeys it.** The scattered rules live in memory (`feedback_build_means_build_break_verify`, `feedback_no_sampled_verification_claims`, `feedback_never_declare_fixed_without_regression_check`, `feedback_diagnose_with_real_data_first`); this doc is the single consolidated reference they all point at. Saved in-repo so the flow travels with the project.

> Standing law (Sebs, 2026-06-12, reinforced 2026-06-13): **"Don't ever just build — break, debug, edge-case test, and VISUALLY check."** A build is done only when, in the same breath, it was broken on purpose, debugged with real data, edge-cased across the full object set, and visually checked with screenshots read back. Code compiling ≠ done. "Works once" ≠ done.

---

## The five non-negotiables

1. **VISUAL CHECK ALWAYS.** Any claim about how something looks/renders requires a screenshot TAKEN and READ BACK with vision. DOM counts, pixel-diff numbers, and "it should look like X" all lie. No "check X" to Sebs until the proof package (screenshots/contact sheets) is green.
2. **ALL 197 AUDIT OBJECTS.** When testing rendering/conversion, run through the FULL 197-shape `/audit` catalog (the smart-layer dataset), not a sample. Per-item tables. Never sample-and-claim ("checked all" after 6 = a lie we got caught on 2026-06-08).
3. **BREAK ON PURPOSE.** Weird sequences, double-actions, extremes, mid-action interrupts, degenerate inputs, hostile-judge behavior. The build isn't trusted until someone tried to break it.
4. **DEBUG WITH REAL DATA FIRST.** For any visual/render bug, instrument + observe (playwright/console diagnostic) BEFORE patching. Speculative patch past attempt 2 → stop, build the inspection tool.
5. **REGRESSION RITUAL before "fixed."** Baseline-screenshot representative shape classes → apply fix → re-screenshot → diff each pair → run the sweep harness if smartHachure/SvgStyleTransform/coverage touched → only then "done."

---

## The rock structure (one unit of work)

```
BUILD → own BATTERY (per-item table, screenshots READ) → adversarial VERIFIER (independent, re-runs evidence, hostile) → [fix round if verify fails] → re-VERIFY → SMASH (hostile edge/break passes) → [blocker-fix round]
```

- **Build** reads the authoritative spec FIRST, then the real code it composes with.
- **Own battery** = the builder proves its own work: enumerated edge cases, the full object set, screenshots read, tsc + build green.
- **Adversarial verifier** = a SEPARATE agent told to assume the build lies; it re-runs evidence itself (not the build's artifacts), produces its own screenshots/tables. Two prior "all PASS" claims fell to verifiers (byte-diff, angle-sampling) — this catch is why the step exists.
- **Smash** = hostile users hitting newly-landed surfaces with weird sequences + pathological content. Blockers get a fix round.
- A rock that can't pass its battery does NOT report done.

## The verify gauntlet, baked into every agent prompt (the LAWS block)

Every build/test agent prompt carries this verbatim (adapt paths/ports):

```
LAWS:
- Never "just build": build + break-on-purpose + debug-with-real-data + edge-case enumeration + VISUAL check (screenshots taken AND read back), one unit, before reporting.
- Per-item tables. Use ALL 197 audit objects where the task says all — never sample-and-claim.
- NO live Supabase writes (no publish RPC/deletes/test rows; route-intercept only).
- Isolated preview to dodge HMR churn from concurrent fleets: vite build --outDir /tmp/<tag>-dist && vite preview --port <uniqueport>. Playwright browsers cached ~/Library/Caches/ms-playwright.
- tsc --noEmit AND npm run build green before done.
- Commit own files ONLY (never git add -A / git add src/ — concurrent fleets share the tree). If git index locked, wait + retry. Message ends with the Co-Authored-By line.
- Output is structured data for the orchestrator, not prose.
```

## Fleet orchestration (multi-rock waves)

- **Lane by file-ownership.** Rocks touching the same files run SERIALLY; rocks on disjoint files run in PARALLEL. Active-edit zones are documented in SESSION-HANDOFF so the next wave knows what to avoid.
- **Collision rule.** Never launch a rock onto files another fleet is actively editing — sequence it or defer to the next wave (e.g., the visual 3D render sweep waits while canvas3d is under edit; the headless engine gauntlet runs anyway because it doesn't render).
- **Commit hygiene.** Each rock commits only its explicit files. A broad `git add` steals another rock's work (happened — see commit-hygiene notes).
- **Right-size.** Justify agent counts; verifier fleets only for contested facts, never taste questions. Past the ~16 concurrency cap, new agents queue (fine) — but "launch more" ≠ "more parallelism" once saturated.
- **Model:** all agents run on **Opus** (`model:'opus'`) — Fable 5 is suspended (`feedback_fable_suspended_use_opus`).
- **Autonomy:** spin agents as work is found, no permission-ask (`feedback_spin_agents_autonomously`); auto-fire the next wave when a fleet lands and frees files/slots.

## Tooling that supports the flow

- `/audit` — the 197-shape catalog; THE render + smart-layer dataset (`project_smart_layer_foundation_via_audit`).
- `tools/3d/*.mjs` — headless geometry/conversion correctness harnesses (smoke suite, mark-intent battery) + the browser audit-sweep driver (playwright + pixel analysis + contact sheets).
- `tools/classifier/` — golden-snapshot / golden-diff (THE classifier regression gate) / reliability(ECE) / ambiguity-queue.
- `window.__dd_decisionLog` (+ surface tagging), `__dd_inputPickLog`, conversion receipts — the decision/training collectors; also debug introspection.
- `window.__dd_crashPanel` — DEV crash probe for PanelBoundary resilience batteries.

## Reporting

When a fleet/agent lands: plain-language per-agent accounting to Sebs + verified state (`feedback_report_agent_outcomes`). Never a silent "done." Decisions that are genuinely his (rulings, eyeball calls, scope) come to main chat; clear-cut build/test/research is autonomous.

---

_Living doc — update when the flow changes. The memory files are the cross-session rules; this is their consolidated in-repo home._
