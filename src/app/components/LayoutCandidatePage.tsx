import React from 'react';
import { useParams, NavLink } from 'react-router';
import { IS } from './cards/tokens';
import { GlobalNav } from './GlobalNav';
import { useResetIdentityToggles } from '../state/useResetIdentityToggles';
import { findCandidate, candidates } from './layouts/candidates';

// Layout imports
import { T1_L1 } from './layouts/T1_L1_ClassicalAnchorGrid';
import { T1_L2 } from './layouts/T1_L2_AnchorRowStream';
import { T1_L3 } from './layouts/T1_L3_AnchorPairedField';
import { T1_L4 } from './layouts/T1_L4_AnchorCompactBrowseShelf';
import { T2_L1 } from './layouts/T2_L1_ReserveFeaturedComposition';
import { T2_L2 } from './layouts/T2_L2_OffsetAnchorSupportField';
import { T2_L3 } from './layouts/T2_L3_WideFeaturedThinRail';
import { T2_L4 } from './layouts/T2_L4_PairedIdentityWorkField';
import { T3_L1 } from './layouts/T3_L1_StaggeredRhythmMatrix';
import { T3_L2 } from './layouts/T3_L2_DescendingScaleLadder';
import { T3_L3 } from './layouts/T3_L3_BilateralUnevenColumns';
import { T3_L4 } from './layouts/T3_L4_AnchorClusterSatelliteField';
import { T4_L1 } from './layouts/T4_L1_FloatingIslands';
import { T4_L2 } from './layouts/T4_L2_BrokenMatrix';
import { T4_L3 } from './layouts/T4_L3_DossierBoard';
import { T4_L4 } from './layouts/T4_L4_EditorialSpine';
import { T5a_L1 } from './layouts/T5a_L1_AlternatingWeightRows';
import { T5a_L2 } from './layouts/T5a_L2_TwoColumnMasonry';
import { T5a_L3 } from './layouts/T5a_L3_BrickWallVariance';
import { T5a_L4 } from './layouts/T5a_L4_SalonHang';
import { T5a_L5 } from './layouts/T5a_L5_FeaturedAlternatingTwoUp';
import { T5a_L6 } from './layouts/T5a_L6_CenterlineEditorialStack';
import { T5a_L7 } from './layouts/T5a_L7_OffsetInsetCascade';
import { T5a_L8 } from './layouts/T5a_L8_WidthVarianceRow';
import { T5a_L9 } from './layouts/T5a_L9_WidthVarianceRowAnchored';
import { T5b_L1 } from './layouts/T5b_L1_OffsetPairedColumns';
import { T5b_L2 } from './layouts/T5b_L2_StaggeredStartPairedColumns';
import { T5b_L3 } from './layouts/T5b_L3_AspectLengthDivergentColumns';
import { T5b_L4 } from './layouts/T5b_L4_FeaturedAnchorAspectRhythm';
import { T5b_L5 } from './layouts/T5b_L5_HeightVarianceRow';
import { T5b_L6 } from './layouts/T5b_L6_HeightVarianceRowAnchored';
import { T5c_L1 } from './layouts/T5c_L1_RootRectangleTessellation';
import { T5c_L2 } from './layouts/T5c_L2_DualAxisAnchorFree';
import { T5c_L3 } from './layouts/T5c_L3_DualAxisWithAnchor';
import { T5c_L4 } from './layouts/T5c_L4_AspectCascadeScaled';
import { T5c_L5 } from './layouts/T5c_L5_TrackFreeBento';
import { T5c_L6 } from './layouts/T5c_L6_TrackFreeBentoAnchored';

const REGISTRY: Record<string, React.ComponentType> = {
  't1-l1': T1_L1,
  't1-l2': T1_L2,
  't1-l3': T1_L3,
  't1-l4': T1_L4,
  't2-l1': T2_L1,
  't2-l2': T2_L2,
  't2-l3': T2_L3,
  't2-l4': T2_L4,
  't3-l1': T3_L1,
  't3-l2': T3_L2,
  't3-l3': T3_L3,
  't3-l4': T3_L4,
  't4-l1': T4_L1,
  't4-l2': T4_L2,
  't4-l3': T4_L3,
  't4-l4': T4_L4,
  't5a-l1': T5a_L1,
  't5a-l2': T5a_L2,
  't5a-l3': T5a_L3,
  't5a-l4': T5a_L4,
  't5a-l5': T5a_L5,
  't5a-l6': T5a_L6,
  't5a-l7': T5a_L7,
  't5a-l8': T5a_L8,
  't5a-l9': T5a_L9,
  't5b-l1': T5b_L1,
  't5b-l2': T5b_L2,
  't5b-l3': T5b_L3,
  't5b-l4': T5b_L4,
  't5b-l5': T5b_L5,
  't5b-l6': T5b_L6,
  't5c-l1': T5c_L1,
  't5c-l2': T5c_L2,
  't5c-l3': T5c_L3,
  't5c-l4': T5c_L4,
  't5c-l5': T5c_L5,
  't5c-l6': T5c_L6,
};

export function LayoutCandidatePage() {
  useResetIdentityToggles();
  const { tier, slot } = useParams();
  const id = `${tier}-${slot}`;
  const candidate = findCandidate(tier ?? '', slot ?? '');
  const Layout = REGISTRY[id];

  if (!candidate || !Layout) {
    return (
      <>
        <GlobalNav />
        <div style={{ padding: 48, fontFamily: IS }}>
          <p style={{ fontSize: 13 }}>
            Unknown candidate. <NavLink to="/">Return to layout index</NavLink>.
          </p>
        </div>
      </>
    );
  }

  const idx = candidates.findIndex((c) => c.id === id);
  const prev = candidates[(idx - 1 + candidates.length) % candidates.length];
  const next = candidates[(idx + 1) % candidates.length];

  return (
    <>
      <div
        style={{
          padding: '12px 48px',
          borderBottom: '1px solid var(--dir-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: IS,
          fontSize: 11,
          color: 'var(--dir-text-secondary)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            minWidth: 0,
            flex: 1,
          }}
        >
          <span
            style={{
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-primary)',
              flexShrink: 0,
            }}
          >
            {candidate.label}
          </span>
          <span
            style={{
              color: 'var(--dir-text-primary)',
              flexShrink: 0,
            }}
          >
            {candidate.workingName}
          </span>
          <span
            style={{
              color: 'var(--dir-detail)',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {candidate.thesis}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
          <NavLink
            to={`/layout/${prev.tier}/${prev.slot}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            ← {prev.label}
          </NavLink>
          <NavLink to="/" style={{ color: 'var(--dir-text-secondary)' }}>
            index
          </NavLink>
          <NavLink
            to={`/layout/${next.tier}/${next.slot}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            {next.label} →
          </NavLink>
        </div>
      </div>
      <GlobalNav />
      <Layout />
    </>
  );
}
