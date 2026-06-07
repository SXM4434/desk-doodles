import React from 'react';
import { useParams, NavLink } from 'react-router';
import { IS } from './cards/tokens';
import { GlobalNav } from './GlobalNav';
import { useResetIdentityToggles } from '../state/useResetIdentityToggles';
import {
  findSurfaceCandidate,
  surfaceCandidates,
  type StandardShell,
} from './surfaces/candidates';

import { T1_S1 } from './surfaces/T1_S1_ExplicitContainer';
import { T1_S2 } from './surfaces/T1_S2_QuietContainer';
import { T1_S3 } from './surfaces/T1_S3_MediaWeighted';
import { T1_S4 } from './surfaces/T1_S4_ContentStack';
import { T2_S1 } from './surfaces/T2_S1_OpenSurface';
import { T2_S2 } from './surfaces/T2_S2_SplitPlate';
import { T2_S3 } from './surfaces/T2_S3_ScanRail';
import { T2_S4 } from './surfaces/T2_S4_QuietAction';
import { T3_S1 } from './surfaces/T3_S1_FloatingPlate';
import { T3_S2 } from './surfaces/T3_S2_DossierLabel';
import { T3_S3 } from './surfaces/T3_S3_Poster';
import { T3_S4 } from './surfaces/T3_S4_Modular';
import { T4_S1 } from './surfaces/T4_S1_ArtifactMount';
import { T4_S2 } from './surfaces/T4_S2_GalleryPlacard';
import { T4_S3 } from './surfaces/T4_S3_InstrumentPanel';
import { T4_S4 } from './surfaces/T4_S4_FragmentStack';
import { T5_S1 } from './surfaces/T5_S1_ItalicTitle';
import { T5_S2 } from './surfaces/T5_S2_MetaRail';
import { T5_S3 } from './surfaces/T5_S3_FramedImage';
import { T5_S4 } from './surfaces/T5_S4_AuthoredAspect';
import { T5_S5 } from './surfaces/T5_S5_Tombstone';
import { T5_S6 } from './surfaces/T5_S6_ChipCluster';
import { T5_S7 } from './surfaces/T5_S7_TerminalEyebrow';
import { T5_S8 } from './surfaces/T5_S8_CaptionRegister';
import { T6_S1 } from './surfaces/T6_S1_CaseBriefHorizontal';
import { T6_S2 } from './surfaces/T6_S2_CaseBriefCompact';
import { T6_S3 } from './surfaces/T6_S3_VersionFilmstrip';
import { T6_S4 } from './surfaces/T6_S4_ReleaseAuthoredAspect';
import { T6_S5 } from './surfaces/T6_S5_CaseBriefUnbounded';
import { T7_S1 } from './surfaces/T7_S1_SwissModular';
import { T7_S2 } from './surfaces/T7_S2_BrutalistType';
import { T7_S3 } from './surfaces/T7_S3_ConcretePoetry';
import { T7_S4 } from './surfaces/T7_S4_ChangelogRelease';
import { T8_S1 } from './surfaces/T8_S1_PlainTile';
import { T8_S2 } from './surfaces/T8_S2_CaptionTile';
import { T8_S3 } from './surfaces/T8_S3_AspectUnbounded';
import { T8_S4 } from './surfaces/T8_S4_ProofForward';

type SurfaceComponent = (props?: { standardShell?: StandardShell }) => React.ReactElement;

const REGISTRY: Record<string, SurfaceComponent> = {
  't1-s1': T1_S1 as SurfaceComponent,
  't1-s2': T1_S2 as SurfaceComponent,
  't1-s3': T1_S3 as SurfaceComponent,
  't1-s4': T1_S4 as SurfaceComponent,
  't2-s1': T2_S1 as SurfaceComponent,
  't2-s2': T2_S2 as SurfaceComponent,
  't2-s3': T2_S3 as SurfaceComponent,
  't2-s4': T2_S4 as SurfaceComponent,
  't3-s1': T3_S1 as SurfaceComponent,
  't3-s2': T3_S2 as SurfaceComponent,
  't3-s3': T3_S3 as SurfaceComponent,
  't3-s4': T3_S4 as SurfaceComponent,
  't4-s1': T4_S1 as SurfaceComponent,
  't4-s2': T4_S2 as SurfaceComponent,
  't4-s3': T4_S3 as SurfaceComponent,
  't4-s4': T4_S4 as SurfaceComponent,
  't5-s1': T5_S1 as SurfaceComponent,
  't5-s2': T5_S2 as SurfaceComponent,
  't5-s3': T5_S3 as SurfaceComponent,
  't5-s4': T5_S4 as SurfaceComponent,
  't5-s5': T5_S5 as SurfaceComponent,
  't5-s6': T5_S6 as SurfaceComponent,
  't5-s7': T5_S7 as SurfaceComponent,
  't5-s8': T5_S8 as SurfaceComponent,
  't6-s1': T6_S1 as SurfaceComponent,
  't6-s2': T6_S2 as SurfaceComponent,
  't6-s3': T6_S3 as SurfaceComponent,
  't6-s4': T6_S4 as SurfaceComponent,
  't6-s5': T6_S5 as SurfaceComponent,
  't7-s1': T7_S1 as SurfaceComponent,
  't7-s2': T7_S2 as SurfaceComponent,
  't7-s3': T7_S3 as SurfaceComponent,
  't7-s4': T7_S4 as SurfaceComponent,
  't8-s1': T8_S1 as SurfaceComponent,
  't8-s2': T8_S2 as SurfaceComponent,
  't8-s3': T8_S3 as SurfaceComponent,
  't8-s4': T8_S4 as SurfaceComponent,
};

export function SurfaceCandidatePage() {
  useResetIdentityToggles();
  const { tier, slot, variant } = useParams();
  const id = `${tier}-${slot}`;
  const candidate = findSurfaceCandidate(tier ?? '', slot ?? '');
  const Surface = REGISTRY[id];

  if (!candidate || !Surface) {
    return (
      <>
        <GlobalNav />
        <div style={{ padding: 48, fontFamily: IS }}>
          <p style={{ fontSize: 13 }}>
            Unknown surface. <NavLink to="/surface">Return to surface index</NavLink>.
          </p>
        </div>
      </>
    );
  }

  if (variant && variant !== 'sv-b' && variant !== 'quiet') {
    return (
      <>
        <GlobalNav />
        <div style={{ padding: 48, fontFamily: IS }}>
          <p style={{ fontSize: 13 }}>
            Unknown variant "{variant}".{' '}
            <NavLink to={`/surface/${candidate.tier}/${candidate.slot}`}>
              Return to {candidate.label}
            </NavLink>
            .
          </p>
        </div>
      </>
    );
  }

  if (variant === 'sv-b' && candidate.svbAlternate === 'none') {
    return (
      <>
        <GlobalNav />
        <div style={{ padding: 48, fontFamily: IS }}>
          <p style={{ fontSize: 13 }}>
            {candidate.label} has no SV-B alternate.{' '}
            <NavLink to={`/surface/${candidate.tier}/${candidate.slot}`}>
              Return to {candidate.label}
            </NavLink>
            .
          </p>
        </div>
      </>
    );
  }

  if (variant === 'quiet' && !candidate.quietArtifact) {
    return (
      <>
        <GlobalNav />
        <div style={{ padding: 48, fontFamily: IS }}>
          <p style={{ fontSize: 13 }}>
            {candidate.label} has no quiet artifact.{' '}
            <NavLink to={`/surface/${candidate.tier}/${candidate.slot}`}>
              Return to {candidate.label}
            </NavLink>
            .
          </p>
        </div>
      </>
    );
  }

  const idx = surfaceCandidates.findIndex((c) => c.id === id);
  const prev = surfaceCandidates[(idx - 1 + surfaceCandidates.length) % surfaceCandidates.length];
  const next = surfaceCandidates[(idx + 1) % surfaceCandidates.length];

  const variantLabel =
    variant === 'sv-b'
      ? candidate.svbAlternate === 'conditional'
        ? ' · SV-B (conditional)'
        : ' · SV-B'
      : variant === 'quiet'
        ? ' · quiet artifact'
        : '';

  const standardShell: StandardShell = variant === 'sv-b' ? 'sv-b' : 'sv-a';

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
            {variantLabel}
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
            Featured {candidate.featuredShell} · {candidate.thesis}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
          <NavLink
            to={`/surface/${prev.tier}/${prev.slot}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            ← {prev.label}
          </NavLink>
          <NavLink to="/surface" style={{ color: 'var(--dir-text-secondary)' }}>
            index
          </NavLink>
          <NavLink
            to={`/surface/${next.tier}/${next.slot}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            {next.label} →
          </NavLink>
        </div>
      </div>
      <GlobalNav />
      <Surface standardShell={standardShell} />
    </>
  );
}
