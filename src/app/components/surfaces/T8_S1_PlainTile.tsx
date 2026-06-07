import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { PillCTA } from '../cards/PillCTA';
import { TagList } from '../cards/TagList';
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

// T8-S1 Plain Tile — rachelchen.tech register.
// Media reads as the object. No native frame, no raised fill; the plain-tile
// register is unbounded by definition. Composition follows the Homepage
// Surfaces v2 compositional skeleton: CardFrame(nativeMode='off') wraps the
// column so the cardFrame toggle still activates the frame when toggled on;
// ContentColumn owns the padding + cross-section rhythm; Section groups
// share within-group rhythm. marginTop:auto on the CTA (or proof when
// placement is bottom-strip) absorbs leftover space so every toggle
// rearranges the layout rather than just appearing / disappearing.

function PlainTileFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
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
  const contentMax = density === 'content-forward' ? 720 : 560;

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
          <p
            style={{
              fontFamily: IS,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--dir-detail)',
              margin: 0,
            }}
          >
            {p.label} · {p.labelMeta} · {p.status}
          </p>
          <h2
            style={{
              fontFamily: IS,
              fontSize: titleSize,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'var(--dir-text-primary)',
              margin: 0,
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
              lineHeight: 1.65,
              color: 'var(--dir-text-secondary)',
              margin: 0,
              maxWidth: contentMax,
              ...captionStyle,
            }}
          >
            {p.framingCompressed}
          </p>
        </Section>
        <TagList
          tags={p.tags}
          typeTag={p.typeTag}
          max={3}
          nativeMode="pill-outline"
        />
        <ProofBlock
          project={p}
          visibleNative="off"
          placementNative="inline"
          divider={proofDivider}
          register="featured"
          style={proofAtBottom ? { marginTop: 'auto' } : undefined}
        />
        <div style={{ marginTop: proofAtBottom ? 0 : 'auto' }}>
          <PillCTA variant="text">{p.ctaPrimary} →</PillCTA>
        </div>
      </ContentColumn>
    </CardFrame>
  );
}

function PlainTileStandard({
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
  const authoredStandardAspect = density === 'content-forward' ? '1 / 1' : '4 / 3';
  const aspectOverride = useAuthoredAspect(authoredStandardAspect, 'authored');
  const titleSize = 15;

  const mediaStyle: React.CSSProperties = mediaHeight
    ? { height: mediaHeight, aspectRatio: 'auto' }
    : { aspectRatio: mediaAspect ?? aspectOverride ?? 'auto' };

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
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                fontFamily: IS,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--dir-text-primary)',
              }}
            >
              {project.label}
            </span>
            <span
              style={{
                fontFamily: IS,
                fontSize: 10,
                fontWeight: 300,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--dir-detail)',
              }}
            >
              {project.typeTag}
            </span>
          </div>
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

export function T8_S1({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<PlainTileFeatured />}
      standards={supports.map((p) => <PlainTileStandard project={p} />)}
    />
  );
}

export const T8_S1_renderers = {
  featured: (project: Project) => <PlainTileFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <PlainTileStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
