// Narrow Pass 2 — surface working set.
//
// Pass 2 only narrows the layout axis. The surface axis is unchanged from
// Narrow Pass 1's 13-surface cleaned set, so this file re-exports directly
// from `narrow1/narrowedSurfaces.ts` under Pass-2-prefixed names. If the
// surface axis is later re-audited independently of Pass 1, this file is
// where the divergence lands.
export {
  NARROWED_SURFACE_IDS as NARROW2_SURFACE_IDS,
  NARROWED_SURFACE_SET as NARROW2_SURFACE_SET,
  isNarrowedSurface as isNarrow2Surface,
} from '../narrow1/narrowedSurfaces';
