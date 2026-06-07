// Narrow Pass 1 — cleaned layout working set.
//
// Starts from a raw 23-entry list, reduced to 15 via:
//   1. Exact duplicate-ID dedup (t5b-l3 appeared 3× → kept once).
//   2. Anchor/non-anchor mirror collapse — when two layouts share the same
//      mechanism and one simply adds an FH-A/FH-B anchor on top of the other,
//      keep the anchor version. Six pairs collapsed:
//        t5a-l1 → t5a-l5  (2-up alternating rows, +anchor)
//        t5a-l8 → t5a-l9  (width-variance row, +anchor)
//        t5b-l1 → t5b-l4  (paired-columns aspect rhythm, +anchor)
//        t5b-l5 → t5b-l6  (height-variance row, +anchor)
//        t5c-l2 → t5c-l3  (dual-axis variance, +anchor)
//        t5c-l5 → t5c-l6  (track-free bento, +anchor)
//
// t1-l3 / t1-l4 deliberately both kept — their mechanism difference
// (paired-Gestalt 2×2 grid vs 3-up shelf + fold-marker narrative) is the
// kind of call better informed by seeing them rendered against 37 surfaces
// than by reading theses. A later narrowing pass may drop one.
//
// The 15 IDs below reference candidates already present in
// `layouts/candidates.ts`. This file does not duplicate metadata; it is a
// pure filter list for the Narrow Pass 1 lab.
export const NARROWED_LAYOUT_IDS = [
  't1-l3',
  't1-l4',
  't2-l4',
  't3-l3',
  't3-l4',
  't4-l4',
  't5a-l2',
  't5a-l3',
  't5a-l5',
  't5a-l9',
  't5b-l3',
  't5b-l4',
  't5b-l6',
  't5c-l3',
  't5c-l6',
] as const;

export const NARROWED_LAYOUT_SET: ReadonlySet<string> = new Set(
  NARROWED_LAYOUT_IDS,
);

export function isNarrowedLayout(id: string): boolean {
  return NARROWED_LAYOUT_SET.has(id);
}
