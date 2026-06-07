import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { Media } from '../cards/Media';
import { ProofStat } from '../cards/CardAtoms';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import {
  useTitleStyle,
  useCaptionStyle,
  useImageTreatmentStyle,
  useAuthoredAspect,
  useDividerBorder,
  useProofVisible,
  useCardFrameVisible,
} from '../cards/identityStyle';
import type { StandardShell } from './candidates';
import { primaryProject, supportProjects } from '../../data/projects';
import type { Project } from '../../data/projects';

// T6-S5 Case Brief Unbounded — T6-S1 Ion-brief register lifted out of
// the card frame. No border, no raised fill by default; the layered-stack
// media reads as a tiled artifact on page ground and the copy column hangs
// in raw flow. Only internal hairlines separate proof row from CTA row.
// Identity toggles wired: cardFrame (native off; toggle on wraps the whole
// brief in an explicit frame) / title / caption (eyebrow + prose) / image
// treatment (top media plate) / aspect variance / divider (layered-stack
// borders + internal hairline above proof row) / proof (proof row + its
// hairline gate together so the copy doesn't orphan an empty rule).

function StackedMedia({
  project,
  divider,
  imageStyle,
  aspectOverride,
}: {
  project: Project;
  divider: string;
  imageStyle: React.CSSProperties;
  aspectOverride?: string;
}) {
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: 300 }}>
      <div
        style={{
          position: 'absolute',
          inset: '48px 80px 24px 16px',
          border: divider,
          backgroundColor: 'var(--dir-muted)',
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '32px 48px 32px 32px',
          border: divider,
          backgroundColor: 'var(--dir-recessed)',
          opacity: 0.85,
        }}
      />
      <div
        style={{
          position: 'relative',
          marginLeft: 64,
          marginTop: 16,
          border: divider,
          boxShadow: '0 16px 36px rgba(0,0,0,0.07)',
          ...imageStyle,
        }}
      >
        <Media
          project={project}
          role="Featured · stack-top"
          style={aspectOverride ? { aspectRatio: aspectOverride } : undefined}
        />
      </div>
    </div>
  );
}

function CaseBriefUnboundedFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const imageStyle = useImageTreatmentStyle('plain');
  const aspectOverride = useAuthoredAspect('16 / 10', 'uniform');
  const dividerBorder = useDividerBorder('section');
  const proofVisible = useProofVisible('on');
  const frameVisible = useCardFrameVisible('off');
  return (
    <div
      style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 48%) 1fr',
        gap: 64,
        alignItems: 'center',
        backgroundColor: frameVisible ? 'var(--dir-raised)' : 'transparent',
        border: frameVisible ? '1px solid var(--dir-border)' : undefined,
        padding: frameVisible ? 40 : 0,
      }}
    >
      <StackedMedia
        project={p}
        divider={dividerBorder}
        imageStyle={imageStyle}
        aspectOverride={aspectOverride ?? undefined}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--dir-accent)',
            margin: 0,
            marginBottom: 16,
            ...captionStyle,
          }}
        >
          Case Study · {p.label} · {p.labelMeta}
        </p>
        <h2
          style={{
            fontFamily: IS,
            fontSize: 32,
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: 'var(--dir-text-primary)',
            margin: 0,
            marginBottom: 16,
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
            marginBottom: 24,
            maxWidth: 520,
            ...captionStyle,
          }}
        >
          {p.framingFull}
        </p>
        <div style={{ marginBottom: 24 }}>
          <TagList tags={p.tags} typeTag={p.typeTag} max={3} />
        </div>
        {proofVisible && (
          <>
            <div
              style={{
                borderTop: dividerBorder,
                marginBottom: 16,
              }}
            />
            <div style={{ display: 'flex', gap: 48, marginBottom: 24 }}>
              {p.proof.map((s) => (
                <ProofStat key={s.label} value={s.value} label={s.label} sub={s.sub} />
              ))}
            </div>
          </>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
          {p.ctaSecondary && <PillCTA variant="outline">{p.ctaSecondary}</PillCTA>}
        </div>
      </div>
    </div>
  );
}

function CaseBriefUnboundedStandard({
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
  const aspectOverride = useAuthoredAspect(mediaAspect ?? '16 / 9', 'uniform');
  const frameVisible = useCardFrameVisible('off');
  const mediaStyle: React.CSSProperties = mediaHeight
    ? { height: mediaHeight, aspectRatio: 'auto' }
    : { aspectRatio: aspectOverride ?? mediaAspect ?? '16 / 9' };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        backgroundColor: frameVisible ? 'var(--dir-raised)' : 'transparent',
        border: frameVisible ? '1px solid var(--dir-border)' : undefined,
        padding: frameVisible ? 20 : 0,
      }}
    >
      <div style={imageStyle}>
        <Media project={project} role="Standard" style={mediaStyle} />
      </div>
      <div>
        <div
          style={{
            height: 1,
            width: 32,
            backgroundColor: 'var(--dir-accent)',
            marginBottom: 8,
          }}
        />
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--dir-accent)',
            margin: 0,
            marginBottom: 8,
            ...captionStyle,
          }}
        >
          Case · {project.label} · {project.labelMeta ?? project.typeTag}
        </p>
        <h3
          style={{
            fontFamily: IS,
            fontSize: 17,
            fontWeight: 500,
            lineHeight: 1.25,
            letterSpacing: '-0.015em',
            color: 'var(--dir-text-primary)',
            margin: 0,
            marginBottom: 12,
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
            marginBottom: 12,
            ...captionStyle,
          }}
        >
          {project.framingEditorial}
        </p>
        <div style={{ marginBottom: 12 }}>
          <TagList tags={project.tags} typeTag={project.typeTag} max={2} />
        </div>
        <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
      </div>
    </div>
  );
}

export function T6_S5({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  void standardShell;
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<CaseBriefUnboundedFeatured />}
      standards={supports.map((p) => <CaseBriefUnboundedStandard project={p} />)}
    />
  );
}

export const T6_S5_renderers = {
  featured: (project: Project) => <CaseBriefUnboundedFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <CaseBriefUnboundedStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
