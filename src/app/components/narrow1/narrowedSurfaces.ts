// Narrow Pass 1 — cleaned surface working set.
//
// Starts from a raw 14-entry list, reduced to 13 via conceptual-merge audit:
//   t8-s2 → t8-s1  (same unbounded label-below register; t8-s1 is the more
//                   featured version carrying the 3-line label stack + quiet
//                   CTA. t8-s2's minimal-caption emmiwu register is derivable
//                   from t8-s1 via CTA=none + meta compression.)
//
// Flagged-but-kept (decision deferred to post-render evidence, not cut):
//   - t2-s4 Quiet-Action Composition — potential merge with t1-s1 × cta=quiet
//     (Step 3 Axis C tension; earlier plan already scheduled a concrete test
//     `T2-S4 × visible` vs `T1-S1 × quiet`).
//   - t6-s2 / t6-s5 — same Ion case-brief register, contained vs unbounded.
//     Not a current axis toggle (container-strength is not wired), so not
//     mergeable within the existing cta/tags/media/margin axis model.
//
// The 13 IDs below reference candidates already present in
// `surfaces/candidates.ts`. This file does not duplicate metadata; it is a
// pure filter list for the Narrow Pass 1 lab.
export const NARROWED_SURFACE_IDS = [
  't1-s1',
  't1-s3',
  't1-s4',
  't2-s4',
  't3-s4',
  't5-s1',
  't5-s3',
  't5-s4',
  't5-s8',
  't6-s2',
  't6-s5',
  't8-s1',
  't8-s4',
] as const;

export const NARROWED_SURFACE_SET: ReadonlySet<string> = new Set(
  NARROWED_SURFACE_IDS,
);

export function isNarrowedSurface(id: string): boolean {
  return NARROWED_SURFACE_SET.has(id);
}
