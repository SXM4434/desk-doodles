import type { MarginToken } from '../../state/MarginContext';

export type Tier = 't1' | 't2' | 't3' | 't4' | 't5a' | 't5b' | 't5c';

export type Candidate = {
  id: string;
  tier: Tier;
  slot: 'l1' | 'l2' | 'l3' | 'l4' | 'l5' | 'l6' | 'l7' | 'l8' | 'l9' | 'l10';
  label: string;
  workingName: string;
  thesis: string;
  defaultCta: 'visible' | 'quiet' | 'none';
  defaultMedia: 'structural-placeholder' | 'real-asset';
  nativeMargin: MarginToken;
};

export const candidates: Candidate[] = [
  {
    id: 't1-l1',
    tier: 't1',
    slot: 'l1',
    label: 'T1-L1',
    workingName: 'Classical Anchor Grid',
    thesis:
      'One full-width FH-B Featured anchor, then a clean 3-col SV-A matrix below.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't1-l2',
    tier: 't1',
    slot: 'l2',
    label: 'T1-L2',
    workingName: 'Anchor Row Stream',
    thesis:
      'One FH-B Featured anchor, then SH-A Row supports in full-width serial rhythm.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't1-l3',
    tier: 't1',
    slot: 'l3',
    label: 'T1-L3',
    workingName: 'Anchor + Paired Field',
    thesis:
      'One FH-B Featured anchor, then SV-A supports grouped as 2-up paired blocks.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't1-l4',
    tier: 't1',
    slot: 'l4',
    label: 'T1-L4',
    workingName: 'Anchor + Compact Browse Shelf',
    thesis:
      'One FH-B Featured anchor + a tight 3-up SV-A shelf above the fold; remainder below.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't2-l1',
    tier: 't2',
    slot: 'l1',
    label: 'T2-L1',
    workingName: 'Reserve Featured Composition',
    thesis:
      'Primary FH-B + reserve FV-A at ≥ 2/3 container width + minimal SV-A support field.',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    nativeMargin: 'centered',
  },
  {
    id: 't2-l2',
    tier: 't2',
    slot: 'l2',
    label: 'T2-L2',
    workingName: 'Offset Anchor + Stable Support Field',
    thesis:
      'FH-B shifted 48–64px off centerline; 3-col SV-A grid held stable below.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't2-l3',
    tier: 't2',
    slot: 'l3',
    label: 'T2-L3',
    workingName: 'Wide Featured + Thin Support Rail',
    thesis:
      'FH-B at ~65–70% container width; SV-A stacked as thin adjacent rail ~30–35%.',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    nativeMargin: 'centered',
  },
  {
    id: 't2-l4',
    tier: 't2',
    slot: 'l4',
    label: 'T2-L4',
    workingName: 'Paired Identity + Work Field',
    thesis:
      'Identity block as macro-layout co-anchor beside FH-B + SV-A project field.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't3-l1',
    tier: 't3',
    slot: 'l1',
    label: 'T3-L1',
    workingName: 'Staggered Rhythm Matrix',
    thesis:
      'FH-B anchor; SV-A supports break uniform row rhythm with ladder-value vertical offsets on-grid.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't3-l2',
    tier: 't3',
    slot: 'l2',
    label: 'T3-L2',
    workingName: 'Descending Scale Ladder',
    thesis:
      'Featured at top; SV-A supports cascade at decreasing scale (100 / 75 / 55 / 40%).',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    nativeMargin: 'centered',
  },
  {
    id: 't3-l3',
    tier: 't3',
    slot: 'l3',
    label: 'T3-L3',
    workingName: 'Bilateral Uneven Columns',
    thesis:
      'Page divided into two vertical columns of unequal width (~60/40), each carrying different project densities.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't3-l4',
    tier: 't3',
    slot: 'l4',
    label: 'T3-L4',
    workingName: 'Anchor Cluster + Satellite Field',
    thesis:
      'Tight cluster (16–24 gaps) anchors; lower-priority SV-A satellites (48–64 gaps) orbit at ≥ 1:2 proximity ratio.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't4-l1',
    tier: 't4',
    slot: 'l1',
    label: 'T4-L1',
    workingName: 'Floating Islands',
    thesis:
      'Project blocks as separated islands in a large negative-space field (ladder 80/96/128).',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    nativeMargin: 'm6',
  },
  {
    id: 't4-l2',
    tier: 't4',
    slot: 'l2',
    label: 'T4-L2',
    workingName: 'Broken Matrix / Collage Field',
    thesis:
      'Projects deliberately rupture a visible 12-col grid skeleton at ladder-value offsets (48/64/96).',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    nativeMargin: 'm7',
  },
  {
    id: 't4-l3',
    tier: 't4',
    slot: 'l3',
    label: 'T4-L3',
    workingName: 'Dossier Board',
    thesis:
      'Projects read as pinned records on a catalog board — archival register rather than gallery register.',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    nativeMargin: 'centered',
  },
  {
    id: 't4-l4',
    tier: 't4',
    slot: 'l4',
    label: 'T4-L4',
    workingName: 'Editorial Spine + Side Interruptions',
    thesis:
      'Central vertical typographic spine anchors; FH-B + SV-A interrupt from the sides.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  // ── T5a Span-Variance Asymmetry (width is the asymmetry engine) ─────────
  {
    id: 't5a-l1',
    tier: 't5a',
    slot: 'l1',
    label: 'T5a-L1',
    workingName: 'Alternating Weight Rows',
    thesis:
      'No hero. Two rows of 2-up alternation (2fr/1fr then 1fr/2fr) — row-level weight inversion carries hierarchy without an anchor.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't5a-l2',
    tier: 't5a',
    slot: 'l2',
    label: 'T5a-L2',
    workingName: 'Two-Column Masonry',
    thesis:
      'FH-A anchor + CSS columns:2 flow with break-inside avoid — independent column advance abandons row registration.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't5a-l3',
    tier: 't5a',
    slot: 'l3',
    label: 'T5a-L3',
    workingName: 'Brick Wall Variance',
    thesis:
      '6-col grid with span pattern rotating per row (4+2 → 2+4) — bento-style brick rhythm under an FH-A hero spanning 6.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't5a-l4',
    tier: 't5a',
    slot: 'l4',
    label: 'T5a-L4',
    workingName: 'Salon Hang',
    thesis:
      '6-col dense-pack grid with variable spans (2/3/4), gap 16, gridAutoFlow dense — 17c Paris Académie gallery-wall density principle.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'm6',
  },
  {
    id: 't5a-l5',
    tier: 't5a',
    slot: 'l5',
    label: 'T5a-L5',
    workingName: 'Featured + Alternating Two-Up',
    thesis:
      'Full-width FH-A hero anchor + two 2-up rows alternating 2fr/1fr then 1fr/2fr (billguo.me composition).',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't5a-l6',
    tier: 't5a',
    slot: 'l6',
    label: 'T5a-L6',
    workingName: 'Centerline Editorial Stack',
    thesis:
      'All cards center-aligned on page vertical axis; widths cascade 1120 → 840 → 560 → 336. Proof-led shells (FH-B + SV-B whole-grid) — Brodovitch centerline register.',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    nativeMargin: 'centered',
  },
  {
    id: 't5a-l7',
    tier: 't5a',
    slot: 'l7',
    label: 'T5a-L7',
    workingName: 'Offset Inset Cascade',
    thesis:
      'Left-aligned vertical stack, widths alternate 1120/680/840/680/1120 — editorial tighten/loosen rhythm via content-inset variance.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't5a-l8',
    tier: 't5a',
    slot: 'l8',
    label: 'T5a-L8',
    workingName: 'Width-Variance Row',
    thesis:
      'Pure span-variance demonstration. Single row of 4 cards at shared shelf height (280) with authored flex widths (4/2/3/2). Widths vary, heights do not. No anchor.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't5a-l9',
    tier: 't5a',
    slot: 'l9',
    label: 'T5a-L9',
    workingName: 'Width-Variance Row, With Anchor',
    thesis:
      'FH-A anchor absorbs first-hit; below, single row of 4 cards at shared shelf height with authored flex widths — widths vary, heights do not. Hero-plus-shelf register.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  // ── T5b Aspect-Variance Asymmetry (height is the asymmetry engine) ──────
  {
    id: 't5b-l1',
    tier: 't5b',
    slot: 'l1',
    label: 'T5b-L1',
    workingName: 'Offset Paired Columns',
    thesis:
      'No hero. Two independent flex columns with authored per-card aspect variance (4:3, 1:1, 3:4, 16:9) — row registration falls away from intrinsic media-size rhythm. Emmiwu.com register (equal start Y).',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't5b-l2',
    tier: 't5b',
    slot: 'l2',
    label: 'T5b-L2',
    workingName: 'Staggered-Start Paired Columns',
    thesis:
      'Same independent-flex-column mechanism as T5b-L1, but the right column begins lower via an authored ladder-value Y-offset (96) — rachelchen.tech register where resume/identity content pushes the right column down.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't5b-l3',
    tier: 't5b',
    slot: 'l3',
    label: 'T5b-L3',
    workingName: 'Aspect-Length Divergent Columns',
    thesis:
      'Paired columns with authored aspect variance stacked so the two columns end at different Y — 3 tall-aspect cards left vs 2 short-aspect right, ≥ 1 full-card length delta is mandatory. Emmiwu.com intensified.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't5b-l4',
    tier: 't5b',
    slot: 'l4',
    label: 'T5b-L4',
    workingName: 'Featured Anchor + Aspect Rhythm',
    thesis:
      'FH-A full-width anchor on top; paired flex columns below carry authored aspect variance — anchor sets hierarchy, columns carry rhythm. Billguo.me-class register.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't5b-l5',
    tier: 't5b',
    slot: 'l5',
    label: 'T5b-L5',
    workingName: 'Height-Variance Row',
    thesis:
      'Pure aspect-variance demonstration. Single row of 4 cards at equal widths with authored per-tile aspects (4:3, 1:1, 3:4, 9:16). Heights vary, widths do not. No anchor.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't5b-l6',
    tier: 't5b',
    slot: 'l6',
    label: 'T5b-L6',
    workingName: 'Height-Variance Row, With Anchor',
    thesis:
      'FH-A anchor absorbs first-hit; below, single row of 4 cards at equal widths with authored per-tile aspects — heights vary, widths do not. Hero-plus-aspect-cascade register.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't5b-l7',
    tier: 't5b',
    slot: 'l7',
    label: 'T5b-L7',
    workingName: 'Featured Anchor + Asymmetric Paired Rows',
    thesis:
      'Billguo.me register. FH-A hero anchors the top; below, two paired rows where left/right widths are asymmetric and alternate row-over-row (3/2 then 2/3). Widths and heights both vary — the asymmetry lives inside each row, not just in the height cascade.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  // ── T5c Dual-Axis / Proportion-System Asymmetry ─────────────────────────
  {
    id: 't5c-l1',
    tier: 't5c',
    slot: 'l1',
    label: 'T5c-L1',
    workingName: 'Root-Rectangle Tessellation',
    thesis:
      'Hambidge √2 ratio held across two mirrored rows (630/394 then 394/630) — asymmetric yet mathematically coherent weight inversion.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't5c-l2',
    tier: 't5c',
    slot: 'l2',
    label: 'T5c-L2',
    workingName: 'Dual-Axis Variance, Anchor-Free',
    thesis:
      'Two independent flex tracks at unequal widths (4fr wide + 2fr narrow) carry authored per-tile aspect variance. Landscapes ride the wide track, portraits the narrow. Dual axis = track-width variance + per-tile aspect rhythm. No anchor.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't5c-l3',
    tier: 't5c',
    slot: 'l3',
    label: 'T5c-L3',
    workingName: 'Dual-Axis Variance, With Anchor',
    thesis:
      'FH-A anchor absorbs first-hit; below, two independent flex tracks at unequal widths (4fr wide + 2fr narrow) carry authored per-tile aspects — landscapes on wide, portraits on narrow. Rachelchen.tech-class register.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't5c-l4',
    tier: 't5c',
    slot: 'l4',
    label: 'T5c-L4',
    workingName: 'Aspect-Cascade Scaled Sequence',
    thesis:
      'Single left-aligned column of 4 tiles; each successive tile scales by 1/√2 with aspect locked to its own root rectangle (√2:1 alternated with 1:√2). Hambidge DNA applied sequentially.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'centered',
  },
  {
    id: 't5c-l5',
    tier: 't5c',
    slot: 'l5',
    label: 'T5c-L5',
    workingName: 'Track-Free Bento',
    thesis:
      'True dual-axis variance with no track grouping. 12-col CSS Grid, 6 tiles, each authoring col-span (width) AND row-span (height) independently. Uniform 24 gap on both axes. No anchor.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'm7',
  },
  {
    id: 't5c-l6',
    tier: 't5c',
    slot: 'l6',
    label: 'T5c-L6',
    workingName: 'Track-Free Bento, With Anchor',
    thesis:
      'FH-A anchor absorbs first-hit; below, 12-col CSS Grid bento where every tile authors col-span and row-span independently — no tracks, uniform 24 gap. Pure bento under the hero.',
    defaultCta: 'visible',
    defaultMedia: 'structural-placeholder',
    nativeMargin: 'm7',
  },
];

export const byId = Object.fromEntries(candidates.map((c) => [c.id, c]));

export function findCandidate(tier: string, slot: string): Candidate | undefined {
  return byId[`${tier}-${slot}`];
}
