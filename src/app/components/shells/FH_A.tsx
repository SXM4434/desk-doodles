import React from 'react';
import { IS } from '../cards/tokens';
import { CardFrame } from './CardFrame';
import { Media } from '../cards/Media';
import { ProjectLabel } from '../cards/CardAtoms';
import { ProofBlock } from '../cards/ProofBlock';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import { Section } from '../cards/Section';
import { ContentColumn } from '../cards/ContentColumn';
import {
  useTitleStyle,
  useCaptionStyle,
  useDividerBorder,
  useImageTreatmentStyle,
  useDensityFeaturedPadding,
  useDensityFeaturedSplit,
  useDensityFeaturedTitle,
  useDensityFeaturedBody,
  useDensityFramingChoice,
  useAuthoredAspect,
  useRhythm,
  useProofPlacementMode,
} from '../cards/identityStyle';
import type { AspectVarianceState } from '../../state/AspectVarianceContext';
import type { Project } from '../../data/projects';

// FH-A — Featured Horizontal / Classification-led
// 52/48 horizontal split, 420px min-height (320 under compact density),
// tags as scan anchor, single CTA. Proof is off in the authored baseline
// (tag-led register); the Shipped proof toggle can surface it. Under
// proofPlacement='bottom-strip' the proof collapses to a foot-of-card strip
// and the CTA follows below.
export function FH_A({
  project,
  mediaAspect,
  mediaHeight,
  eyebrow,
  proofSuppressed = false,
  ctaHidden = false,
  aspectVarianceOverride,
}: {
  project: Project;
  mediaAspect?: string;
  mediaHeight?: number;
  eyebrow?: React.ReactNode;
  proofSuppressed?: boolean;
  ctaHidden?: boolean;
  aspectVarianceOverride?: AspectVarianceState;
}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const titleDensity = useDensityFeaturedTitle('default');
  const bodyDensity = useDensityFeaturedBody('default');
  const framingChoice = useDensityFramingChoice('full');
  const columnDivider = useDividerBorder('section');
  const proofDivider = useDividerBorder('section');
  const imageStyle = useImageTreatmentStyle('plain');
  const pad = useDensityFeaturedPadding('default');
  const mediaWidth = useDensityFeaturedSplit('default');
  const aspectOverride = useAuthoredAspect('4/3', 'uniform', aspectVarianceOverride);
  const { gapC, gapW, minHeightFactor } = useRhythm('featured');
  const placement = useProofPlacementMode('stack-grid');
  const minHeight = minHeightFactor === 'reduced' ? 320 : 420;
  const proofAtBottom = placement === 'bottom-strip';
  const framingText =
    framingChoice === 'compressed'
      ? project.framingCompressed
      : framingChoice === 'editorial'
        ? project.framingEditorial
        : project.framingFull;
  const mediaStyle: React.CSSProperties = mediaHeight
    ? { flex: 1, height: mediaHeight, aspectRatio: 'auto' }
    : { flex: 1, aspectRatio: mediaAspect ?? aspectOverride ?? 'auto' };

  return (
    <CardFrame style={{ minHeight, width: '100%' }}>
      <div
        style={{
          width: mediaWidth,
          flexShrink: 0,
          borderRight: columnDivider,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          ...imageStyle,
        }}
      >
        <Media project={project} role="Featured" style={mediaStyle} />
      </div>
      <ContentColumn gapC={gapC} padding={pad} paddingPolicy="bleed-x" mediaEdge="left">
        <Section gapWithin={gapW}>
          {eyebrow ?? (
            <ProjectLabel label={project.label} meta={project.labelMeta} />
          )}
          <TagList
            tags={project.tags}
            typeTag={project.typeTag}
            nativeMode="pill-outline"
          />
        </Section>
        <Section gapWithin={gapW}>
          <h2
            style={{
              fontFamily: IS,
              fontSize: 22,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'var(--dir-text-primary)',
              margin: 0,
              ...titleStyle,
              ...titleDensity,
            }}
          >
            {project.title}
          </h2>
          <p
            style={{
              fontFamily: IS,
              fontSize: 13,
              fontWeight: 300,
              lineHeight: 1.7,
              color: 'var(--dir-text-secondary)',
              maxWidth: 380,
              margin: 0,
              ...captionStyle,
              ...bodyDensity,
            }}
          >
            {framingText}
          </p>
        </Section>
        {!proofSuppressed && (
          <ProofBlock
            project={project}
            visibleNative="off"
            placementNative="stack-grid"
            divider={proofDivider}
            register="featured"
            style={proofAtBottom ? { marginTop: 'auto' } : undefined}
          />
        )}
        {!ctaHidden && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: proofAtBottom ? 0 : 'auto',
            }}
          >
            <PillCTA variant="primary">{project.ctaPrimary} →</PillCTA>
          </div>
        )}
      </ContentColumn>
    </CardFrame>
  );
}
