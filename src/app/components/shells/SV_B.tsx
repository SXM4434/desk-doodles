import React from 'react';
import { IS } from '../cards/tokens';
import { CardFrame } from './CardFrame';
import { Media } from '../cards/Media';
import { ProofBlock } from '../cards/ProofBlock';
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

// SV-B — Standard Vertical / Proof-led browse
// Media top (3:4 native), content below. Tiny proof cue as scan entry in
// place of classification tags. Locked placement: whole-grid-only (cannot be
// mixed with SV-A in the same grid).
//
// mediaAspect / mediaHeight: mirrors SV_A. See SV_A.tsx for the contract.
export function SV_B({
  project,
  mediaAspect,
  mediaHeight,
  eyebrow,
  proofSuppressed = false,
  ctaHidden = false,
}: {
  project: Project;
  mediaAspect?: string;
  mediaHeight?: number;
  eyebrow?: React.ReactNode;
  proofSuppressed?: boolean;
  ctaHidden?: boolean;
}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const mediaDivider = useDividerBorder('section');
  const proofDivider = useDividerBorder('section');
  const imageStyle = useImageTreatmentStyle('plain');
  const pad = useDensityStandardPadding('default');
  const aspectOverride = useAuthoredAspect('16/9', 'uniform');
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
        <Section gapWithin={gapW}>
          {eyebrow}
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
              lineHeight: 1.65,
              color: 'var(--dir-text-secondary)',
              margin: 0,
              ...captionStyle,
            }}
          >
            {project.framingCompressed}
          </p>
        </Section>
        {!proofSuppressed && (
          <ProofBlock
            project={project}
            visibleNative="on"
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
