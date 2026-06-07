// Narrow Pass 2 — second-pass layout working set.
//
// Starts from the Narrow Pass 1 set of 15 layouts, reduced to 5 via
// user-led pass-2 pruning + a mechanism-duplication audit on the T5a/T5b
// triplet (t5a-l2 / t5b-l4 / t5b-l6), which all render as "FH-A anchor +
// 2-column tile field below" at 4 tiles:
//   - t5a-l2 uses CSS `columns: 2` + `breakInside: avoid` — real masonry
//     flow (browser balances by height; scales honestly to more tiles).
//   - t5b-l4 is hardcoded 2×2 flex with aspect set A (L [3:4, 4:3], R [2:3, 1:1]).
//   - t5b-l6 is hardcoded 2×2 flex with aspect set B (L [4:3, 1:1], R [3:4, 16:9]).
// t5b-l4 and t5b-l6 differ only by aspect authoring — same mechanism.
// Kept t5a-l2 as the mechanism-honest representative; cut t5b-l4 / t5b-l6.
//
// t5b-l7 added (2026-04-23) as the billguo.me register — FH-A featured
// hero on top + two paired rows below where left/right widths are
// asymmetric and alternate row-over-row (3/2 then 2/3). Distinct from
// t5a-l2 (masonry behind a hero, equal-width tiles) because the
// asymmetry lives inside each row here, not just in the height cascade.
//
// Pruned from Narrow Pass 1 (not in Pass 2): t1-l4, t3-l3, t3-l4, t5a-l3,
// t5a-l5, t5a-l9, t5b-l3, t5c-l3 — user-directed; the tighter set below
// trims mechanism-adjacent or less-distinct candidates toward a read-ready
// Gate A pool.
//
// The IDs below reference candidates already present in
// `layouts/candidates.ts`. This file does not duplicate metadata; it is a
// pure filter list for the Narrow Pass 2 lab.
export const NARROW2_LAYOUT_IDS = [
  't1-l3',
  't2-l4',
  't4-l4',
  't5a-l2',
  't5b-l7',
  't5c-l6',
] as const;

export const NARROW2_LAYOUT_SET: ReadonlySet<string> = new Set(
  NARROW2_LAYOUT_IDS,
);

export function isNarrow2Layout(id: string): boolean {
  return NARROW2_LAYOUT_SET.has(id);
}
