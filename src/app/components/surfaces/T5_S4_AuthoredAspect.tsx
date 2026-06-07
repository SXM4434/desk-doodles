import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { ProjectLabel, TypeTag } from '../cards/CardAtoms';
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

// T5-S4 Authored-Aspect Card — rhythm comes from per-slot authored aspects.
// Featured keeps 21:9 (or 16:9 under content-forward density). Standards
// carry 4:3 / 1:1 / 3:4 rotating. Composition follows the Homepage
// Surfaces v2 compositional skeleton so every identity + pair-native toggle
// rearranges rhythm rather than merely toggling atom visibility.

const ASPECTS = ['4 / 3', '1 / 1', '3 / 4'];

function AuthoredAspectFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const imageStyle = useImageTreatmentStyle('plain');
  const mediaDivider = useDividerBorder('section');
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
  const contentMax = density === 'content-forward' ? 720 : 540;

  return (
    <CardFrame
      nativeMode="on"
      style={{ flexDirection: 'column', minHeight: 460, width: '100%' }}
    >
      <div
        style={{
          borderBottom: mediaDivider,
          ...imageStyle,
        }}
      >
        <Media
          project={p}
          role="Featured"
          style={{ aspectRatio: aspectOverride ?? 'auto' }}
        />
      </div>
      <ContentColumn
        gapC={gapC}
        padding={pad}
        paddingPolicy="bleed-x"
        mediaEdge="top"
      >
        <Section gapWithin={gapW}>
          <ProjectLabel label={p.label} meta={p.labelMeta} />
          <h2
            style={{
              fontFamily: IS,
              fontSize: titleSize,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'var(--dir-text-primary)',
              margin: 0,
              maxWidth: contentMax,
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
        <TagList
          tags={p.tags}
          typeTag={p.typeTag}
          max={3}
          nativeMode="hidden"
        />
        <ProofBlock
          project={p}
          visibleNative="off"
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
        </div>
      </ContentColumn>
    </CardFrame>
  );
}

function AspectStandard({
  project,
  aspect,
  mediaAspect,
  mediaHeight,
}: {
  project: Project;
  aspect: string;
  mediaAspect?: string;
  mediaHeight?: number;
}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const imageStyle = useImageTreatmentStyle('plain');
  const mediaDivider = useDividerBorder('section');
  const proofDivider = useDividerBorder('section');
  const pad = useDensityStandardPadding('default');
  const { gapC, gapW } = useRhythm('standard');
  const placement = useProofPlacementMode('inline');
  const proofAtBottom = placement === 'bottom-strip';

  const { state: densityState } = useDensity();
  const density = densityState === 'native' ? 'default' : densityState;
  const aspectOverride = useAuthoredAspect(aspect, 'authored');
  const titleSize = 15;

  const mediaStyle: React.CSSProperties = mediaHeight
    ? { height: mediaHeight, aspectRatio: 'auto' }
    : { aspectRatio: mediaAspect ?? aspectOverride ?? aspect };

  return (
    <CardFrame
      nativeMode="on"
      style={{ flexDirection: 'column', height: '100%' }}
    >
      <div
        style={{
          borderBottom: mediaDivider,
          ...imageStyle,
        }}
      >
        <Media
          project={project}
          role={`Standard · ${mediaAspect ?? aspectOverride ?? aspect}`}
          style={mediaStyle}
        />
      </div>
      <ContentColumn
        gapC={gapC}
        padding={pad}
        paddingPolicy="bleed-x"
        mediaEdge="top"
      >
        <Section gapWithin={gapW}>
          <TypeTag>{project.typeTag}</TypeTag>
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
              lineHeight: 1.6,
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
          nativeMode="pill-outline"
        />
        <ProofBlock
          project={project}
          visibleNative="off"
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

export function T5_S4({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<AuthoredAspectFeatured />}
      standards={supports.map((p, i) => <AspectStandard project={p} aspect={ASPECTS[i]} />)}
    />
  );
}

export const T5_S4_renderers = {
  featured: (project: Project) => <AuthoredAspectFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <AspectStandard project={project} aspect={ASPECTS[0]} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
