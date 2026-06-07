import { AXES, type Axis, type AxisValueByAxis, type SurfaceAttrs } from './types';

// Dedup resolver.
//
// A toggle value on a surface is "duplicative" if applying it would make the
// surface converge on another shell already in the family. Concretely:
// there exists another surface in the family whose identity matches the
// current surface on every axis except `axis`, AND whose fixed value on
// `axis` is `targetValue`.
//
// Rationale: if the family already has a shell that is "this shell but with
// tags off", toggling tags off here would duplicate. So the toggle is
// suppressed on BOTH shells — user must switch shell instead.
//
// Identity match on an axis = both surfaces fixed + same value, OR both
// unfixed with same baseline. (Unfixed vs unfixed is debatable; here we
// require baseline equality to be conservative — otherwise two surfaces that
// differ only on a fixed + an unfixed axis would spuriously dedup.)

function identityMatches(a: SurfaceAttrs, b: SurfaceAttrs, except: Axis): boolean {
  for (const axis of AXES) {
    if (axis === except) continue;
    const sa = a.attributes[axis];
    const sb = b.attributes[axis];
    const va = sa.fixed ? sa.value : sa.baseline;
    const vb = sb.fixed ? sb.value : sb.baseline;
    if (va !== vb) return false;
  }
  return true;
}

export function wouldDuplicate<A extends Axis>(
  surface: SurfaceAttrs,
  axis: A,
  targetValue: AxisValueByAxis[A],
  family: SurfaceAttrs[],
): { dup: boolean; conflictWith?: string } {
  const siblings = family.filter((s) => s.id !== surface.id);
  for (const other of siblings) {
    const oa = other.attributes[axis];
    const otherValue = oa.fixed ? oa.value : oa.baseline;
    if (otherValue !== targetValue) continue;
    if (!identityMatches(surface, other, axis)) continue;
    return { dup: true, conflictWith: other.id };
  }
  return { dup: false };
}

// For a given surface + axis, compute which target values are dedup-allowed.
// Used by the articulation pages to grey out toggle options.
export function allowedTargets<A extends Axis>(
  surface: SurfaceAttrs,
  axis: A,
  candidates: AxisValueByAxis[A][],
  family: SurfaceAttrs[],
): { value: AxisValueByAxis[A]; allowed: boolean; conflictWith?: string }[] {
  return candidates.map((v) => {
    const { dup, conflictWith } = wouldDuplicate(surface, axis, v, family);
    return { value: v, allowed: !dup, conflictWith };
  });
}
