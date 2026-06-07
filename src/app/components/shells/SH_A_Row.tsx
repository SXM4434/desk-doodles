import React from 'react';
import { IS } from '../cards/tokens';
import { CardFrame } from './CardFrame';
import { Media } from '../cards/Media';
import { TypeTag } from '../cards/CardAtoms';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import { Section } from '../cards/Section';
import { ContentColumn } from '../cards/ContentColumn';
import {
  useTitleStyle,
  useCaptionStyle,
  useDividerBorder,
  useImageTreatmentStyle,
  useDensityStandardPadding,
  useRhythm,
} from '../cards/identityStyle';
import type { Project } from '../../data/projects';

// SH-A Row — Reduced-height list variant
// List-only placement. 280px min-height (240 compact). 52% media / 48% content
// split. Proof never renders on this shell — 280px physically cannot fit it
// without breaking the compact row register. ProofPlacement changes still apply
// to every other proof-carrying shell; SH-A Row sits this axis out.
export function SH_A_Row({
  project,
  mediaAspect,
  mediaHeight,
  eyebrow,
  ctaHidden = false,
}: {
  project: Project;
  mediaAspect?: string;
  mediaHeight?: number;
  eyebrow?: React.ReactNode;
  ctaHidden?: boolean;
}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const columnDivider = useDividerBorder('section');
  const imageStyle = useImageTreatmentStyle('plain');
  const pad = useDensityStandardPadding('default');
  const { gapC, gapW, minHeightFactor } = useRhythm('standard');
  const minHeight = minHeightFactor === 'reduced' ? 240 : 280;
  const mediaStyle: React.CSSProperties = mediaHeight
    ? { flex: 1, height: mediaHeight, aspectRatio: 'auto' }
    : { flex: 1, aspectRatio: mediaAspect ?? 'auto' };

  return (
    <CardFrame style={{ minHeight, width: '100%' }}>
      <div
        style={{
          width: '52%',
          flexShrink: 0,
          borderRight: columnDivider,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          ...imageStyle,
        }}
      >
        <Media project={project} role="Row" style={mediaStyle} />
      </div>
      <ContentColumn gapC={gapC} padding={pad} paddingPolicy="bleed-x" mediaEdge="left">
        <Section gapWithin={gapW}>
          {eyebrow ?? <TypeTag>{project.typeTag}</TypeTag>}
          <h3
            style={{
              fontFamily: IS,
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
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
              fontSize: 13,
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
          size="compact"
          nativeMode="pill-outline"
        />
        {!ctaHidden && (
          <div style={{ marginTop: 'auto' }}>
            <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
          </div>
        )}
      </ContentColumn>
    </CardFrame>
  );
}
