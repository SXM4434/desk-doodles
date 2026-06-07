import React from 'react';
import { IS } from '../cards/tokens';
import { CardFrame } from './CardFrame';
import { Media } from '../cards/Media';
import { ProjectLabel } from '../cards/CardAtoms';
import { ProofBlock } from '../cards/ProofBlock';
import { useNarrow4FeaturedProofMode } from '../../state/Narrow4FeaturedProofModeContext';
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
  useDensityFeaturedTitle,
  useDensityFeaturedBody,
  useDensityFramingChoice,
  useAuthoredAspect,
  useRhythm,
  useProofPlacementMode,
} from '../cards/identityStyle';
import type { Project } from '../../data/projects';
import type { AspectVarianceState } from '../../state/AspectVarianceContext';

// FV-A — Featured Vertical / Classification-led
// Two foot variants:
//   - 'single' (default): full-width media top (3:4 native), single-column
//     content stack below. Tags anchor the read before title; CTA anchors foot.
//   - '2-col': wide-banner media top (21:9), asymmetric 2/3 + 1/3 foot. LEFT
//     carries eyebrow + 22px title + framingCompressed; RIGHT carries compact
//     pill-outline tags + native stack-grid proof, both right-flushed against
//     the card edge. Top-aligned: eyebrow Y === TagList Y via grid
//     alignItems:start + flex-column flex-start. Frame is off natively for the
//     2-col foot — the proof-forward register is structural, not chrome.
// LOCKED PLACEMENT RULE: must occupy ≥ 2/3 container width. Not legal in
// 50/50 paired, grid, or list placements. Caller owns the width guarantee.
// Proof is off in the authored 'single' baseline (classification-led); under
// '2-col' proof is on by default and can be opt-out via proofSuppressed.
export function FV_A({
  project,
  mediaAspect,
  mediaHeight,
  foot = 'single',
  eyebrow,
  proofSuppressed = false,
  eyebrowInRightCol = false,
  aspectVarianceOverride,
}: {
  project: Project;
  mediaAspect?: string;
  mediaHeight?: number;
  foot?: 'single' | '2-col';
  eyebrow?: React.ReactNode;
  proofSuppressed?: boolean;
  eyebrowInRightCol?: boolean;
  aspectVarianceOverride?: AspectVarianceState;
}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const titleDensity = useDensityFeaturedTitle('default');
  const bodyDensity = useDensityFeaturedBody('default');
  const framingChoice = useDensityFramingChoice('full');
  const mediaDivider = useDividerBorder('section');
  const proofDivider = useDividerBorder('section');
  const imageStyle = useImageTreatmentStyle('plain');
  const pad = useDensityFeaturedPadding('default');
  const authoredAspect = foot === '2-col' ? '21/9' : '3/4';
  const aspectFallback = 'uniform';
  const aspectOverride = useAuthoredAspect(authoredAspect, aspectFallback, aspectVarianceOverride);
  const { gapC, gapW } = useRhythm('featured');
  const placement = useProofPlacementMode('stack-grid');
  const proofAtBottom = placement === 'bottom-strip';
  const { state: featuredProofMode } = useNarrow4FeaturedProofMode();
  const fillCell = aspectOverride === 'auto';
  const framingText =
    framingChoice === 'compressed'
      ? project.framingCompressed
      : framingChoice === 'editorial'
        ? project.framingEditorial
        : project.framingFull;
  const mediaStyle: React.CSSProperties | undefined = mediaHeight
    ? { height: mediaHeight, aspectRatio: 'auto' }
    : mediaAspect
      ? { aspectRatio: mediaAspect }
      : fillCell
        ? { flex: 1, aspectRatio: 'auto', minHeight: 0 }
        : aspectOverride
          ? { aspectRatio: aspectOverride }
          : undefined;

  if (foot === '2-col') {
    return (
      <CardFrame
        nativeMode="off"
        style={{
          flexDirection: 'column',
          height: '100%',
          minHeight: fillCell ? 420 : undefined,
        }}
      >
        <Media project={project} role="Featured" style={mediaStyle} />
        <div
          style={{
            flex: fillCell ? '0 0 auto' : 1,
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 24,
            paddingTop: 16,
            alignItems: 'start',
          }}
        >
          {/* LEFT COL — Option A: tight eyebrow+title cluster · Option B: title+body only */}
          {eyebrowInRightCol ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <h2
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
              </h2>
              <p
                style={{
                  fontFamily: IS,
                  fontSize: 13,
                  fontWeight: 300,
                  lineHeight: 1.6,
                  color: 'var(--dir-text-secondary)',
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  ...captionStyle,
                }}
              >
                {project.framingCompressed}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              {/* space-1 (4px) tight cluster: eyebrow + title read as one unit */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {eyebrow ?? (
                  <ProjectLabel label={project.label} meta={project.labelMeta} />
                )}
                <h2
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
                </h2>
              </div>
              <p
                style={{
                  fontFamily: IS,
                  fontSize: 13,
                  fontWeight: 300,
                  lineHeight: 1.6,
                  color: 'var(--dir-text-secondary)',
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  ...captionStyle,
                }}
              >
                {project.framingCompressed}
              </p>
            </div>
          )}
          {/* RIGHT COL — Option A: proof only · Option B: eyebrow + proof */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              minWidth: 0,
              alignItems: 'flex-end',
            }}
          >
            {eyebrowInRightCol && eyebrow}
            {!proofSuppressed && featuredProofMode === 'inline-10' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'right' }}>
                {project.proof.map((p) => (
                  <p
                    key={p.label}
                    style={{
                      fontFamily: IS,
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      lineHeight: 1.4,
                      color: 'var(--dir-text-secondary)',
                      margin: 0,
                    }}
                  >
                    <span style={{ color: 'var(--dir-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{p.value}</span>{' '}
                    {p.label}
                    {p.sub ? ` (${p.sub})` : ''}
                  </p>
                ))}
              </div>
            ) : !proofSuppressed && featuredProofMode === 'stacked-13' ? (
              <div
                style={{
                  display: 'flex',
                  gap: 32,
                  flexWrap: 'wrap',
                }}
              >
                {project.proof.map((p) => (
                  <div key={p.label}>
                    <p
                      style={{
                        fontFamily: IS,
                        fontSize: 13,
                        fontWeight: 500,
                        lineHeight: 1.0,
                        letterSpacing: 0,
                        color: 'var(--dir-text-primary)',
                        fontVariantNumeric: 'tabular-nums',
                        margin: 0,
                      }}
                    >
                      {p.value}
                    </p>
                    <p
                      style={{
                        fontFamily: IS,
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        lineHeight: 1.4,
                        color: 'var(--dir-text-secondary)',
                        margin: 0,
                        marginTop: 4,
                      }}
                    >
                      {p.label}
                    </p>
                    {p.sub && (
                      <p
                        style={{
                          fontFamily: IS,
                          fontSize: 10,
                          fontWeight: 500,
                          color: 'var(--dir-detail)',
                          margin: 0,
                        }}
                      >
                        {p.sub}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : !proofSuppressed ? (
              <ProofBlock
                project={project}
                visibleNative="on"
                placementNative="stack-grid"
                divider="none"
                register="featured"
                compressed
                style={{ borderTop: 'none', paddingTop: 0 }}
              />
            ) : null}
          </div>
        </div>
      </CardFrame>
    );
  }

  return (
    <CardFrame style={{ flexDirection: 'column', width: '100%' }}>
      <div
        style={{
          width: '100%',
          borderBottom: mediaDivider,
          ...imageStyle,
        }}
      >
        <Media project={project} role="Featured reserve" style={mediaStyle} />
      </div>
      <ContentColumn gapC={gapC} padding={pad} paddingPolicy="bleed-x" mediaEdge="top">
        <Section gapWithin={gapW}>
          <ProjectLabel label={project.label} meta={project.labelMeta} />
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
              fontSize: 32,
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
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
              fontSize: 15,
              fontWeight: 300,
              lineHeight: 1.7,
              color: 'var(--dir-text-secondary)',
              maxWidth: 620,
              margin: 0,
              ...captionStyle,
              ...bodyDensity,
            }}
          >
            {framingText}
          </p>
        </Section>
        <ProofBlock
          project={project}
          visibleNative="off"
          placementNative="stack-grid"
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
          <PillCTA variant="primary">{project.ctaPrimary} →</PillCTA>
        </div>
      </ContentColumn>
    </CardFrame>
  );
}
