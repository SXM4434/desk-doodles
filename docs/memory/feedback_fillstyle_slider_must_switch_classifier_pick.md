---
name: fillstyle-slider-must-switch-classifier-pick
description: "User's fillStyle slider must swap WHICH style fills the regions the classifier chose to fill — narrow override only. Don't lift gap/weight/opacity. Don't recurse into <g>. Don't override on no-fill roles."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9fe905f2-0f57-4ff7-8d81-c236f0e7ff1b
---

When Sebs picks a fillStyle (hachure / cross-hatch / dots / zigzag / etc), the slider must actually swap which mark grammar shows up on the regions Smart Hachure classified as "fillable." Don't sit there pretending the slider does nothing.

**Why:** Caught lying TWICE in one day 2026-06-08 on Desk Doodles.

1. FIRST drift: I applied an over-broad override (swap fillStyle + lift gap/weight/opacity + recurse into `<g>` groups) so EVERY shape filled with user's pick — including paper regions, decorative regions, line-decoration regions. Sebs: "now these things just fill the whole object with same hachure lines like wtf we are just rebreaking stuff" — Smart Hachure's per-region differentiation destroyed.

2. SECOND drift: I over-reverted, removing the NARROW override too. Result: classifier picks per-region treatments (hachure / cross-hatch / dots) and user's fillStyle slider does literally nothing. Sebs: "fill style for shading doesn't change anything rn it just stays as hachure" → later when reverted further, "hachure is gone you fucking overrode it that's not hachure style and now each option only does that stupid dot thing" — slider lying to user again.

**The narrow fix Sebs actually wants:** in `lib/smartHachure/index.ts`, AFTER `selectTreatment`:
```ts
const userPick = fullModifiers.fillStyle;
const classifierWantsFill = baseTreatment.fillStyle !== 'none';
const treatment = {
  ...baseTreatment,
  fillStyle: userPick === 'none' || !classifierWantsFill
    ? ('none' as const)
    : userPick,
};
```

**How to apply:**
- DO swap `treatment.fillStyle` to user's pick when classifier picked any fill style.
- DO honor user picking `'none'` globally → forces all 'none'.
- DO keep classifier's 'none' decisions intact (paper / structural-frame / decorative-accent / line-decoration / label-text).
- DO NOT lift `gap`/`weight`/`layerCount`/`opacity` — classifier's tonal-density per-role choice stays. The user is swapping the GRAMMAR, not the DENSITY.
- DO NOT recurse into `<g>` elements — let the classifier decide groups holistically. If a group classifies as no-fill, that's the call.
- DO NOT touch `lib/smartHachure/renderRegion.ts` — leave the renderer alone.

If you find yourself adding more than the 4-line swap above, STOP — you're drifting. The narrow override IS the fix.
