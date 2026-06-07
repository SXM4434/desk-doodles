// Narrow Pass 3 — family-based layout system for the tile surface.
//
// Two families, each with three internal versions. The families carry
// different featured-to-standard relationships; the versions carry
// different standards-field compositions (grid / masonry / asymmetric rows).
//
// Family A — Anchored Work Field: full-width FH-A hero on top, standards
//   below in a version-specific composition.
// Family B — Identity + Work Field: sticky typographic aside + work column;
//   FH-A hero inside the work column, standards below.
//
// Both families share the same 3-version axis:
//   V1 Grid       — equal-width 2-up pairs (T1-L3 register)
//   V2 Masonry    — equal widths, aspect-varied heights (T5a-L2 register)
//   V3 Asym Rows  — widths + heights vary, alternating (T5b-L7 register)
//
// Tile surface only (t8-s1 PlainTile renderers). The preset axis cycles the
// 3 tile presets (t5-s4 / t8-s1 / t8-s4) via the PresetApplier cascade.

import type { ComboLayoutComponent } from '../combo/composition';
import { FamilyA_V1Grid } from './FamilyA_V1Grid';
import { FamilyA_V2Masonry } from './FamilyA_V2Masonry';
import { FamilyA_V3AsymRows } from './FamilyA_V3AsymRows';
import { FamilyB_V1Grid } from './FamilyB_V1Grid';
import { FamilyB_V2Masonry } from './FamilyB_V2Masonry';
import { FamilyB_V3AsymRows } from './FamilyB_V3AsymRows';

export type FamilyId = 'a' | 'b';
export type VersionId = 'v1' | 'v2' | 'v3';

export const FAMILY_IDS: FamilyId[] = ['a', 'b'];
export const VERSION_IDS: VersionId[] = ['v1', 'v2', 'v3'];

export type FamilyMeta = {
  id: FamilyId;
  label: string;
  workingName: string;
  thesis: string;
};

export const FAMILIES: FamilyMeta[] = [
  {
    id: 'a',
    label: 'Family A',
    workingName: 'Anchored Work Field',
    thesis:
      'Full-width FH-A hero on top anchors hierarchy; standards run below in a version-specific composition.',
  },
  {
    id: 'b',
    label: 'Family B',
    workingName: 'Identity + Work Field',
    thesis:
      'Sticky typographic identity aside runs beside a work column; FH-A hero inside the work column + standards below.',
  },
];

export type VersionMeta = {
  id: VersionId;
  label: string;
  workingName: string;
  thesis: string;
};

export const VERSIONS: VersionMeta[] = [
  {
    id: 'v1',
    label: 'V1',
    workingName: 'Grid',
    thesis:
      'Equal-width 2-up pairs with uniform aspect — the T1-L3 register. Rhythm comes from pair grouping alone.',
  },
  {
    id: 'v2',
    label: 'V2',
    workingName: 'Masonry',
    thesis:
      'CSS columns:2 flow with break-inside avoid and authored per-tile aspects — the T5a-L2 register. Columns advance by content height; row registration falls away.',
  },
  {
    id: 'v3',
    label: 'V3',
    workingName: 'Asymmetric Rows',
    thesis:
      'Two paired rows with asymmetric widths (3/2 then 2/3) and authored per-tile aspects — the T5b-L7 register. Widths and heights both vary; asymmetry lives inside each row.',
  },
];

export const COMPONENT_BY_KEY: Record<string, ComboLayoutComponent> = {
  'a/v1': FamilyA_V1Grid as ComboLayoutComponent,
  'a/v2': FamilyA_V2Masonry as ComboLayoutComponent,
  'a/v3': FamilyA_V3AsymRows as ComboLayoutComponent,
  'b/v1': FamilyB_V1Grid as ComboLayoutComponent,
  'b/v2': FamilyB_V2Masonry as ComboLayoutComponent,
  'b/v3': FamilyB_V3AsymRows as ComboLayoutComponent,
};

export function getNarrow3Component(
  familyId: FamilyId,
  versionId: VersionId,
): ComboLayoutComponent | undefined {
  return COMPONENT_BY_KEY[`${familyId}/${versionId}`];
}

export function isFamilyId(s: string): s is FamilyId {
  return s === 'a' || s === 'b';
}

export function isVersionId(s: string): s is VersionId {
  return s === 'v1' || s === 'v2' || s === 'v3';
}
