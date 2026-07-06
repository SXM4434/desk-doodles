# FIX-SPEC — 2D shade-brush tone fills ignore fill-style [READY TO IMPLEMENT]

Source: read-only fix-spec agent (aa8b374a), verified against HEAD `ce30289`. No code edited yet. I-1/I-2 safe, classifier-only.

## Root cause (pinned, with evidence)
NOT a pipeline bypass — the tone patch DOES reach `renderSmartHachure` like SVG-source fills. It's a **classifier topology
trap**: a shade-brush tone patch is a **fill-only path (`stroke=none`) whose bbox ENCLOSES the ink strokes** drawn inside
the shaded region (`enclosesSiblingCount ≥ 1`). That enclosure disqualifies every rule that would make it fillable:
- `RULE_root_tonal_sparse/mid/dense` require `enclosesSiblingCount === 0` → **disqualified**.
- `RULE_inner_*` require `containedInZIndex !== null` → null → no fire.
- `RULE_dark_enclosing_body` / dark frame branch require darkness ≥ 0.55 → **Light/Mid (0.10–0.55) don't reach**.
- `RULE_outer_frame_bordered_wash` requires a stroke → tone is stroke-none → no fire.
→ `firings.length === 0` → `paper` fallback (`classifier.ts:60-68`) → `fillStyle:'none'` → `renderRegion` returns `[]` (no
marks) → `paper` is in `keepsSourceFill` (`index.ts:387`) so the grey is preserved → **flat grey, identical for every
fillStyle** (the DOM-confirmed symptom; an I-2 violation). Dark/near-black patches (≥0.55) already get marks via
`RULE_dark_enclosing_body` — that's why the bug shows on the Light/Mid bands the brush most commonly lays down.
Darkness reads correctly (TONE_BAND_HEX greys → OKLab → exact band darkness); not the problem. SVG-source fills avoid the
trap because they're usually inner/contained/stroke-bearing, so they land on inner-* / root-tonal / frame rules.

## The fix — ONE additive classifier rule
**File: `src/app/lib/smartHachure/classifier.ts`.** Add after `RULE_dark_enclosing_body` (~line 193):
```ts
// Cluster F+ — ENCLOSING TONAL WASH: a fill-only (stroke=none) region with
// darkness >= 0.10 that ENCLOSES line-art siblings (the shade-brush tone patch,
// and any uploaded fill-only wash that contains line art). The enclosure locks
// it out of RULE_root_tonal_* (need enclosesSiblingCount===0) and the inner-*
// rules (need containedInZIndex); at Light/Mid darkness the dark-body rules
// don't reach and the wash-frame rule needs a stroke — so it fires NOTHING and
// falls to `paper` → no marks (the "tone ignores fillStyle" bug, I-2 violation).
// Band by darkness EXACTLY as RULE_root_tonal_* (09-LOCKED-MODEL I-2) so the
// fillStyle override (index.ts) then swaps mark grammar (I-1). Object-agnostic.
const RULE_enclosing_tonal_wash: Rule = {
  id: 'enclosing-tonal-wash',
  description: 'Fill-only region, darkness>=0.10, encloses siblings → banded tonal role; rescues the shade-brush tone patch.',
  evaluate: (s) => {
    if (s.fill === null || s.fill === 'none' || s.fill === 'transparent') return null;
    if (s.stroke !== null && s.stroke !== 'none' && s.stroke !== 'transparent') return null;
    if (s.enclosesSiblingCount < 1) return null;     // root-tonal handles non-enclosing
    if (s.containedInZIndex !== null) return null;   // inner-* handles contained
    if (s.darknessL < 0.10) return null;             // Paper band stays paper (I-2)
    const role: TonalRole = s.darknessL < 0.30 ? 'sparse-tonal' : s.darknessL < 0.55 ? 'mid-tonal' : 'dense-tonal';
    return { role, confidence: 0.7 };
  },
};
```
Register in `ALL_RULES` ("F. root tonal" group, ~line 420):
```ts
  RULE_root_tonal_sparse, RULE_root_tonal_mid, RULE_root_tonal_dense,
  RULE_enclosing_tonal_wash,   // ← ADD
```

## Why in-bounds
- **I-2:** role banded strictly by `darknessL` at the locked 0.10/0.30/0.55 boundaries — source darkness still owns identity.
- **I-1:** classification-only; the existing fillStyle override (`index.ts:311-344`) swaps mark grammar per the dropdown,
  same code that already works for source fills. No override/gap/weight/opacity/layer change.
- **Narrow:** additive, accumulative scoring (conf 0.7 ties root-tonal), gated fill+no-stroke+encloses+not-contained+≥0.10;
  can't flip a stroke-only or contained region.

## Risks to verify LIVE (paired-vs-Clean) + REQUIRED regression sweep
1. Holed/donut tone patches (evenodd) — rough.js may fill the hole (pre-existing; same family as nested-fill bugs).
2. Stacked light-in-dark bands — inner band is contained → `RULE_inner_*` handles it (new rule's `containedInZIndex` guard skips). Confirm both render marks.
3. Near-full-frame light wash (area≥0.8, encloses≥3) — `RULE_outer_frame_encloses_all` LIGHT branch (conf 0.85) may out-score → still empty. If so, follow-up = gate that LIGHT frame branch on `stroke!==null` (a wash has no border) — **Sebs design call, don't pre-apply.**
4. Tiny dabs (<40px²) → clamped to solid (correct).
5. **REQUIRED:** audit sweep + 6-shape-class before/after (`feedback_never_declare_fixed_without_regression_check`) — expected delta = only previously-empty enclosing washes gain marks.

## Files: `classifier.ts` (the fix) · index.ts:277-344 (consumes role, unchanged) · signals.ts (topology signals) ·
DrawSurface.tsx:308-315 TONE_BAND_HEX / :1991-2031 styled tone→pipeline path · 09-LOCKED-MODEL I-1/I-2 (the contract).
**VERIFY LIVE: draw shape → shade a band → set fillStyle=hachure/dots → marks appear (not flat grey), swap styles → grammar changes.**
