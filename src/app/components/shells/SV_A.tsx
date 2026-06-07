import React from 'react';
import { IS } from '../cards/tokens';
import { CardFrame } from './CardFrame';
import { Media } from '../cards/Media';
import { TypeTag } from '../cards/CardAtoms';
import { ProofBlock } from '../cards/ProofBlock';
import { TagList } from '../cards/TagList';
import type { TagStyleMode } from '../../state/TagStyleContext';
import { PillCTA } from '../cards/PillCTA';
import { Section } from '../cards/Section';
import { ContentColumn } from '../cards/ContentColumn';
import {
  useTitleStyle,
  useCaptionStyle,
  useDividerBorder,
  useImageTreatmentStyle,
  useDensityStandardPadding,
  useAuthoredAspect,
  useRhythm,
  useProofPlacementMode,
} from '../cards/identityStyle';
import type { Project } from '../../data/projects';
import type { AspectVarianceState } from '../../state/AspectVarianceContext';

// SV-A — Standard Vertical / Tag-led browse
// Media top (4:3 native), content below. Type tag is the scan anchor; pill
// tags render the secondary classification.
//
// mediaAspect overrides the asset pool aspect for T5b aspect-rhythm layouts.
// mediaHeight pins the media region to a fixed pixel height and releases the
// aspect constraint — used by T5a equal-height shelves. Image still object-
// covers; only the container aspect (or height) varies.
export function SV_A({
  project,
  mediaAspect,
  mediaHeight,
  eyebrow,
  proofOptIn = false,
  proofSuppressed = false,
  ctaHidden = false,
  tagStyle,
  tagPlacement = 'stack',
  eyebrowPlacement,
  aspectVarianceOverride,
}: {
  project: Project;
  mediaAspect?: string;
  mediaHeight?: number;
  eyebrow?: React.ReactNode;
  proofOptIn?: boolean;
  proofSuppressed?: boolean;
  ctaHidden?: boolean;
  tagStyle?: TagStyleMode;
  tagPlacement?: 'stack' | 'foot-right' | 'foot-left';
  eyebrowPlacement?: 'option-a' | 'option-b';
  aspectVarianceOverride?: AspectVarianceState;
}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const mediaDivider = useDividerBorder('section');
  const proofDivider = useDividerBorder('section');
  const imageStyle = useImageTreatmentStyle('plain');
  const pad = useDensityStandardPadding('default');
  const aspectOverride = useAuthoredAspect('16/9', 'uniform', aspectVarianceOverride);
  const { gapC, gapW } = useRhythm('standard');
  const placement = useProofPlacementMode('inline');
  const proofAtBottom = placement === 'bottom-strip';
  const mediaStyle: React.CSSProperties | undefined = mediaHeight
    ? { height: mediaHeight, aspectRatio: 'auto' }
    : mediaAspect
      ? { aspectRatio: mediaAspect }
      : aspectOverride
        ? { aspectRatio: aspectOverride }
        : undefined;

  return (
    <CardFrame style={{ flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          width: '100%',
          borderBottom: mediaDivider,
          ...imageStyle,
        }}
      >
        <Media project={project} role="Standard" style={mediaStyle} />
      </div>
      <ContentColumn gapC={gapC} padding={pad} paddingPolicy="bleed-x" mediaEdge="top">
        {eyebrowPlacement === 'option-a' ? (
          // Tight cluster: eyebrow+h3 at gap:4, caption below at gapW. Tags dropped.
          <Section gapWithin={gapW}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {eyebrow ?? <TypeTag>{project.typeTag}</TypeTag>}
              <h3
                style={{
                  fontFamily: IS,
                  fontSize: 18,
                  fontWeight: 600,
                  lineHeight: 1.4,
                  letterSpacing: '-0.01em',
                  color: 'var(--dir-text-primary)',
                  margin: 0,
                  ...titleStyle,
                }}
              >
                {project.title}
              </h3>
            </div>
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
        ) : eyebrowPlacement === 'option-b' ? (
          // 2-col grid: title+caption LEFT, eyebrow RIGHT (mirrors foot-right, eyebrow replaces tags). Tags dropped.
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
              columnGap: 16,
              alignItems: 'start',
            }}
          >
            <Section gapWithin={gapW}>
              <h3
                style={{
                  fontFamily: IS,
                  fontSize: 18,
                  fontWeight: 600,
                  lineHeight: 1.4,
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
            <div style={{ textAlign: 'right' }}>{eyebrow ?? <TypeTag>{project.typeTag}</TypeTag>}</div>
          </div>
        ) : tagPlacement === 'foot-right' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
              columnGap: 16,
              alignItems: 'start',
            }}
          >
            <Section gapWithin={gapW}>
              {eyebrow ?? <TypeTag>{project.typeTag}</TypeTag>}
              <h3
                style={{
                  fontFamily: IS,
                  fontSize: 18,
                  fontWeight: 600,
                  lineHeight: 1.4,
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
              align="right"
              nativeMode={tagStyle ?? 'pill-outline'}
            />
          </div>
        ) : tagPlacement === 'foot-left' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)',
              columnGap: 16,
              alignItems: 'start',
            }}
          >
            <TagList
              tags={project.tags}
              typeTag={project.typeTag}
              size="compact"
              align="left"
              nativeMode={tagStyle ?? 'pill-outline'}
            />
            <Section gapWithin={gapW}>
              {eyebrow ?? <TypeTag>{project.typeTag}</TypeTag>}
              <h3
                style={{
                  fontFamily: IS,
                  fontSize: 18,
                  fontWeight: 600,
                  lineHeight: 1.4,
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
          </div>
        ) : (
          <Section gapWithin={gapW}>
            {eyebrow ?? <TypeTag>{project.typeTag}</TypeTag>}
            <h3
              style={{
                fontFamily: IS,
                fontSize: 18,
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
        )}
        {!eyebrowPlacement && tagPlacement === 'stack' && (
          <TagList
            tags={project.tags}
            typeTag={project.typeTag}
            size="compact"
            nativeMode={tagStyle ?? 'pill-outline'}
          />
        )}
        {!proofSuppressed && (
          <ProofBlock
            project={project}
            visibleNative={proofOptIn ? 'on' : 'off'}
            placementNative="inline"
            divider={proofDivider}
            register="standard"
            style={proofAtBottom ? { marginTop: 'auto' } : undefined}
          />
        )}
        {!ctaHidden && (
          <div style={{ marginTop: proofAtBottom ? 0 : 'auto' }}>
            <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
          </div>
        )}
      </ContentColumn>
    </CardFrame>
  );
}
