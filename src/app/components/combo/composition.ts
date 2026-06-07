// Combo composition registry.
//
// Couples the 37 layout components with the 37 surface renderer pairs that
// each surface file exports. The Combo page asks this module for a layout
// component and a surface renderer pair, then hands the surface renderers
// to the layout via its optional renderFeatured / renderStandard props.
//
// When renderFeatured / renderStandard are absent (layout mode), layouts
// render their current hard-coded shells — this file is not imported by
// layout-mode code, so layout mode is unaffected.

import type { ReactElement, ReactNode } from 'react';
import type { Project } from '../../data/projects';
import type { StandardShell } from '../surfaces/candidates';

// Opts a layout may pass to the surface's standard renderer so layouts
// that author per-tile aspect or shelf-height variance (T5a / T5b / T5c)
// can still shape their standards. Surfaces that can honor them should;
// surfaces that can't (T6–T8 registers with fixed aspects) may ignore.
export type StandardSlotOpts = {
  shell?: StandardShell;
  mediaAspect?: string;
  mediaHeight?: number;
};

export type SurfaceRenderers = {
  featured: (project: Project) => ReactNode;
  standard: (project: Project, opts?: StandardSlotOpts) => ReactNode;
};

export type ComboLayoutProps = {
  renderFeatured?: SurfaceRenderers['featured'];
  renderStandard?: SurfaceRenderers['standard'];
  // Hero #8 lab swap — when provided, replaces the family's hardcoded hero
  // zone (Family A's HeroBandPlaceholder · Family B's IdentityAside). The
  // family layout still owns the cards + work-field composition; only the
  // hero zone is swapped per F-family selection in the Hero #8 lab.
  renderHero?: () => ReactNode;
};

export type ComboLayoutComponent = (props?: ComboLayoutProps) => ReactElement;

// ── Surface renderers ─────────────────────────────────────────────────────

import { T1_S1_renderers } from '../surfaces/T1_S1_ExplicitContainer';
import { T1_S2_renderers } from '../surfaces/T1_S2_QuietContainer';
import { T1_S3_renderers } from '../surfaces/T1_S3_MediaWeighted';
import { T1_S4_renderers } from '../surfaces/T1_S4_ContentStack';
import { T2_S1_renderers } from '../surfaces/T2_S1_OpenSurface';
import { T2_S2_renderers } from '../surfaces/T2_S2_SplitPlate';
import { T2_S3_renderers } from '../surfaces/T2_S3_ScanRail';
import { T2_S4_renderers } from '../surfaces/T2_S4_QuietAction';
import { T3_S1_renderers } from '../surfaces/T3_S1_FloatingPlate';
import { T3_S2_renderers } from '../surfaces/T3_S2_DossierLabel';
import { T3_S3_renderers } from '../surfaces/T3_S3_Poster';
import { T3_S4_renderers } from '../surfaces/T3_S4_Modular';
import { T4_S1_renderers } from '../surfaces/T4_S1_ArtifactMount';
import { T4_S2_renderers } from '../surfaces/T4_S2_GalleryPlacard';
import { T4_S3_renderers } from '../surfaces/T4_S3_InstrumentPanel';
import { T4_S4_renderers } from '../surfaces/T4_S4_FragmentStack';
import { T5_S1_renderers } from '../surfaces/T5_S1_ItalicTitle';
import { T5_S2_renderers } from '../surfaces/T5_S2_MetaRail';
import { T5_S3_renderers } from '../surfaces/T5_S3_FramedImage';
import { T5_S4_renderers } from '../surfaces/T5_S4_AuthoredAspect';
import { T5_S5_renderers } from '../surfaces/T5_S5_Tombstone';
import { T5_S6_renderers } from '../surfaces/T5_S6_ChipCluster';
import { T5_S7_renderers } from '../surfaces/T5_S7_TerminalEyebrow';
import { T5_S8_renderers } from '../surfaces/T5_S8_CaptionRegister';
import { T6_S1_renderers } from '../surfaces/T6_S1_CaseBriefHorizontal';
import { T6_S2_renderers } from '../surfaces/T6_S2_CaseBriefCompact';
import { T6_S3_renderers } from '../surfaces/T6_S3_VersionFilmstrip';
import { T6_S4_renderers } from '../surfaces/T6_S4_ReleaseAuthoredAspect';
import { T6_S5_renderers } from '../surfaces/T6_S5_CaseBriefUnbounded';
import { T7_S1_renderers } from '../surfaces/T7_S1_SwissModular';
import { T7_S2_renderers } from '../surfaces/T7_S2_BrutalistType';
import { T7_S3_renderers } from '../surfaces/T7_S3_ConcretePoetry';
import { T7_S4_renderers } from '../surfaces/T7_S4_ChangelogRelease';
import { T8_S1_renderers } from '../surfaces/T8_S1_PlainTile';
import { T8_S2_renderers } from '../surfaces/T8_S2_CaptionTile';
import { T8_S3_renderers } from '../surfaces/T8_S3_AspectUnbounded';
import { T8_S4_renderers } from '../surfaces/T8_S4_ProofForward';

export const SURFACE_RENDERERS: Record<string, SurfaceRenderers> = {
  't1-s1': T1_S1_renderers,
  't1-s2': T1_S2_renderers,
  't1-s3': T1_S3_renderers,
  't1-s4': T1_S4_renderers,
  't2-s1': T2_S1_renderers,
  't2-s2': T2_S2_renderers,
  't2-s3': T2_S3_renderers,
  't2-s4': T2_S4_renderers,
  't3-s1': T3_S1_renderers,
  't3-s2': T3_S2_renderers,
  't3-s3': T3_S3_renderers,
  't3-s4': T3_S4_renderers,
  't4-s1': T4_S1_renderers,
  't4-s2': T4_S2_renderers,
  't4-s3': T4_S3_renderers,
  't4-s4': T4_S4_renderers,
  't5-s1': T5_S1_renderers,
  't5-s2': T5_S2_renderers,
  't5-s3': T5_S3_renderers,
  't5-s4': T5_S4_renderers,
  't5-s5': T5_S5_renderers,
  't5-s6': T5_S6_renderers,
  't5-s7': T5_S7_renderers,
  't5-s8': T5_S8_renderers,
  't6-s1': T6_S1_renderers,
  't6-s2': T6_S2_renderers,
  't6-s3': T6_S3_renderers,
  't6-s4': T6_S4_renderers,
  't6-s5': T6_S5_renderers,
  't7-s1': T7_S1_renderers,
  't7-s2': T7_S2_renderers,
  't7-s3': T7_S3_renderers,
  't7-s4': T7_S4_renderers,
  't8-s1': T8_S1_renderers,
  't8-s2': T8_S2_renderers,
  't8-s3': T8_S3_renderers,
  't8-s4': T8_S4_renderers,
};

// ── Layout registry ───────────────────────────────────────────────────────

import { T1_L1 } from '../layouts/T1_L1_ClassicalAnchorGrid';
import { T1_L2 } from '../layouts/T1_L2_AnchorRowStream';
import { T1_L3 } from '../layouts/T1_L3_AnchorPairedField';
import { T1_L4 } from '../layouts/T1_L4_AnchorCompactBrowseShelf';
import { T2_L1 } from '../layouts/T2_L1_ReserveFeaturedComposition';
import { T2_L2 } from '../layouts/T2_L2_OffsetAnchorSupportField';
import { T2_L3 } from '../layouts/T2_L3_WideFeaturedThinRail';
import { T2_L4 } from '../layouts/T2_L4_PairedIdentityWorkField';
import { T3_L1 } from '../layouts/T3_L1_StaggeredRhythmMatrix';
import { T3_L2 } from '../layouts/T3_L2_DescendingScaleLadder';
import { T3_L3 } from '../layouts/T3_L3_BilateralUnevenColumns';
import { T3_L4 } from '../layouts/T3_L4_AnchorClusterSatelliteField';
import { T4_L1 } from '../layouts/T4_L1_FloatingIslands';
import { T4_L2 } from '../layouts/T4_L2_BrokenMatrix';
import { T4_L3 } from '../layouts/T4_L3_DossierBoard';
import { T4_L4 } from '../layouts/T4_L4_EditorialSpine';
import { T5a_L1 } from '../layouts/T5a_L1_AlternatingWeightRows';
import { T5a_L2 } from '../layouts/T5a_L2_TwoColumnMasonry';
import { T5a_L3 } from '../layouts/T5a_L3_BrickWallVariance';
import { T5a_L4 } from '../layouts/T5a_L4_SalonHang';
import { T5a_L5 } from '../layouts/T5a_L5_FeaturedAlternatingTwoUp';
import { T5a_L6 } from '../layouts/T5a_L6_CenterlineEditorialStack';
import { T5a_L7 } from '../layouts/T5a_L7_OffsetInsetCascade';
import { T5a_L8 } from '../layouts/T5a_L8_WidthVarianceRow';
import { T5a_L9 } from '../layouts/T5a_L9_WidthVarianceRowAnchored';
import { T5b_L1 } from '../layouts/T5b_L1_OffsetPairedColumns';
import { T5b_L2 } from '../layouts/T5b_L2_StaggeredStartPairedColumns';
import { T5b_L3 } from '../layouts/T5b_L3_AspectLengthDivergentColumns';
import { T5b_L4 } from '../layouts/T5b_L4_FeaturedAnchorAspectRhythm';
import { T5b_L5 } from '../layouts/T5b_L5_HeightVarianceRow';
import { T5b_L6 } from '../layouts/T5b_L6_HeightVarianceRowAnchored';
import { T5b_L7 } from '../layouts/T5b_L7_FeaturedAnchorAsymmetricRows';
import { T5c_L1 } from '../layouts/T5c_L1_RootRectangleTessellation';
import { T5c_L2 } from '../layouts/T5c_L2_DualAxisAnchorFree';
import { T5c_L3 } from '../layouts/T5c_L3_DualAxisWithAnchor';
import { T5c_L4 } from '../layouts/T5c_L4_AspectCascadeScaled';
import { T5c_L5 } from '../layouts/T5c_L5_TrackFreeBento';
import { T5c_L6 } from '../layouts/T5c_L6_TrackFreeBentoAnchored';

export const LAYOUT_REGISTRY: Record<string, ComboLayoutComponent> = {
  't1-l1': T1_L1 as ComboLayoutComponent,
  't1-l2': T1_L2 as ComboLayoutComponent,
  't1-l3': T1_L3 as ComboLayoutComponent,
  't1-l4': T1_L4 as ComboLayoutComponent,
  't2-l1': T2_L1 as ComboLayoutComponent,
  't2-l2': T2_L2 as ComboLayoutComponent,
  't2-l3': T2_L3 as ComboLayoutComponent,
  't2-l4': T2_L4 as ComboLayoutComponent,
  't3-l1': T3_L1 as ComboLayoutComponent,
  't3-l2': T3_L2 as ComboLayoutComponent,
  't3-l3': T3_L3 as ComboLayoutComponent,
  't3-l4': T3_L4 as ComboLayoutComponent,
  't4-l1': T4_L1 as ComboLayoutComponent,
  't4-l2': T4_L2 as ComboLayoutComponent,
  't4-l3': T4_L3 as ComboLayoutComponent,
  't4-l4': T4_L4 as ComboLayoutComponent,
  't5a-l1': T5a_L1 as ComboLayoutComponent,
  't5a-l2': T5a_L2 as ComboLayoutComponent,
  't5a-l3': T5a_L3 as ComboLayoutComponent,
  't5a-l4': T5a_L4 as ComboLayoutComponent,
  't5a-l5': T5a_L5 as ComboLayoutComponent,
  't5a-l6': T5a_L6 as ComboLayoutComponent,
  't5a-l7': T5a_L7 as ComboLayoutComponent,
  't5a-l8': T5a_L8 as ComboLayoutComponent,
  't5a-l9': T5a_L9 as ComboLayoutComponent,
  't5b-l1': T5b_L1 as ComboLayoutComponent,
  't5b-l2': T5b_L2 as ComboLayoutComponent,
  't5b-l3': T5b_L3 as ComboLayoutComponent,
  't5b-l4': T5b_L4 as ComboLayoutComponent,
  't5b-l5': T5b_L5 as ComboLayoutComponent,
  't5b-l6': T5b_L6 as ComboLayoutComponent,
  't5b-l7': T5b_L7 as ComboLayoutComponent,
  't5c-l1': T5c_L1 as ComboLayoutComponent,
  't5c-l2': T5c_L2 as ComboLayoutComponent,
  't5c-l3': T5c_L3 as ComboLayoutComponent,
  't5c-l4': T5c_L4 as ComboLayoutComponent,
  't5c-l5': T5c_L5 as ComboLayoutComponent,
  't5c-l6': T5c_L6 as ComboLayoutComponent,
};

export function getSurfaceRenderers(id: string): SurfaceRenderers | undefined {
  return SURFACE_RENDERERS[id];
}

export function getLayoutComponent(id: string): ComboLayoutComponent | undefined {
  return LAYOUT_REGISTRY[id];
}
