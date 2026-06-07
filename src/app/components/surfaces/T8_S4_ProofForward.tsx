import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import { ProofBlock } from '../cards/ProofBlock';
import { Section } from '../cards/Section';
import { ContentColumn } from '../cards/ContentColumn';
import {
  useTitleStyle,
  useCaptionStyle,
  useImageTreatmentStyle,
  useDividerBorder,
  useDensityFeaturedPadding,
  useDensityStandardPadding,
  useAuthoredAspect,
  useRhythm,
  useProofPlacementMode,
} from '../cards/identityStyle';
import { useDensity } from '../../state/DensityContext';
import type { StandardShell } from './candidates';
import { primaryProject, supportProjects } from '../../data/projects';
import type { Project } from '../../data/projects';

// T8-S4 Proof-Forward Unbounded — tile register where proof is the thesis.
// Composition follows the Homepage Surfaces v2 compositional skeleton so
// every toggle (identity + pair-native) rearranges rhythm rather than just
// appearing / disappearing. Proof native='on' — this is the surface whose
// whole concept is that proof leads the scan; off suppresses the proof
// atoms while CTA still resolves the card.

function ProofForwardFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const imageStyle = useImageTreatmentStyle('plain');
  const proofDivider = useDividerBorder('section');
  const pad = useDensityFeaturedPadding('default');
  const { gapC, gapW } = useRhythm('featured');
  const placement = useProofPlacementMode('inline');
  const proofAtBottom = placement === 'bottom-strip';

  const { state: densityState } = useDensity();
  const density = densityState === 'native' ? 'default' : densityState;
  const authoredHeroAspect = density === 'content-forward' ? '16 / 9' : '21 / 9';
  const aspectOverride = useAuthoredAspect(authoredHeroAspect, 'authored');
  const titleSize = 22;
  const contentMax = density === 'content-forward' ? 760 : 680;

  return (
    <CardFrame
      nativeMode="off"
      style={{ flexDirection: 'column', width: '100%' }}
    >
      <div style={{ ...imageStyle }}>
        <Media
          project={p}
          role="Featured"
          style={{ aspectRatio: aspectOverride ?? 'auto' }}
        />
      </div>
      <ContentColumn
        gapC={gapC}
        padding={pad}
        paddingPolicy="bleed-all"
        mediaEdge="top"
      >
        <Section gapWithin={gapW}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 24,
            }}
          >
            <p
              style={{
                fontFamily: IS,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--dir-text-primary)',
                margin: 0,
              }}
            >
              {p.label} · {p.labelMeta} · {p.status}
            </p>
            <TagList
              tags={p.tags}
              typeTag={p.typeTag}
              max={3}
              align="right"
              nativeMode="slash"
            />
          </div>
          <h2
            style={{
              fontFamily: IS,
              fontSize: titleSize,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'var(--dir-text-primary)',
              margin: 0,
              maxWidth: contentMax + 80,
              ...titleStyle,
            }}
          >
            {p.title}
          </h2>
          <p
            style={{
              fontFamily: IS,
              fontSize: 13,
              fontWeight: 300,
              lineHeight: 1.7,
              color: 'var(--dir-text-secondary)',
              margin: 0,
              maxWidth: contentMax,
              ...captionStyle,
            }}
          >
            {p.framingFull}
          </p>
        </Section>
        <ProofBlock
          project={p}
          visibleNative="on"
          placementNative="inline"
          divider={proofDivider}
          register="featured"
          style={proofAtBottom ? { marginTop: 'auto' } : undefined}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: proofAtBottom ? 0 : 'auto',
          }}
        >
          <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
          {p.ctaSecondary && <PillCTA variant="outline">{p.ctaSecondary}</PillCTA>}
        </div>
      </ContentColumn>
    </CardFrame>
  );
}

function ProofForwardStandard({
  project,
  mediaAspect,
  mediaHeight,
}: {
  project: Project;
  mediaAspect?: string;
  mediaHeight?: number;
}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const imageStyle = useImageTreatmentStyle('plain');
  const proofDivider = useDividerBorder('section');
  const pad = useDensityStandardPadding('default');
  const { gapC, gapW } = useRhythm('standard');
  const placement = useProofPlacementMode('inline');
  const proofAtBottom = placement === 'bottom-strip';

  const { state: densityState } = useDensity();
  const density = densityState === 'native' ? 'default' : densityState;
  const aspectOverride = useAuthoredAspect(mediaAspect ?? '4 / 3', 'authored');
  const titleSize = 15;

  const mediaStyle: React.CSSProperties = mediaHeight
    ? { height: mediaHeight, aspectRatio: 'auto' }
    : { aspectRatio: aspectOverride ?? 'auto' };

  return (
    <CardFrame
      nativeMode="off"
      style={{ flexDirection: 'column', height: '100%' }}
    >
      <div style={{ ...imageStyle }}>
        <Media project={project} role="Standard" style={mediaStyle} />
      </div>
      <ContentColumn
        gapC={gapC}
        padding={pad}
        paddingPolicy="bleed-all"
        mediaEdge="top"
      >
        <Section gapWithin={gapW}>
          <p
            style={{
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--dir-detail)',
              margin: 0,
              ...captionStyle,
            }}
          >
            {project.label} · {project.typeTag}
          </p>
          <h3
            style={{
              fontFamily: IS,
              fontSize: titleSize,
              fontWeight: 600,
              lineHeight: 1.25,
              letterSpacing: '-0.015em',
              color: 'var(--dir-text-primary)',
              margin: 0,
              ...titleStyle,
            }}
          >
            {project.title}
          </h3>
          <p
            style={{
              fontFamily: IS,
              fontSize: 12,
              fontWeight: 300,
              lineHeight: 1.55,
              color: 'var(--dir-text-secondary)',
              margin: 0,
              ...captionStyle,
            }}
          >
            {project.framingEditorial}
          </p>
        </Section>
        <TagList
          tags={project.tags}
          typeTag={project.typeTag}
          max={2}
          size="compact"
          nativeMode="hidden"
        />
        <ProofBlock
          project={project}
          visibleNative="on"
          placementNative="inline"
          divider={proofDivider}
          register="standard"
          style={proofAtBottom ? { marginTop: 'auto' } : undefined}
        />
        <div style={{ marginTop: proofAtBottom ? 0 : 'auto' }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </ContentColumn>
    </CardFrame>
  );
}

export function T8_S4({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<ProofForwardFeatured />}
      standards={supports.map((p) => <ProofForwardStandard project={p} />)}
    />
  );
}

export const T8_S4_renderers = {
  featured: (project: Project) => <ProofForwardFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <ProofForwardStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
