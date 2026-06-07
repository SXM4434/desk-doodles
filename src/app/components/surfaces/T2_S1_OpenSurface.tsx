import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { Media } from '../cards/Media';
import { ProjectLabel, TypeTag, ProofStat } from '../cards/CardAtoms';
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
import { primaryProject, supportProjects, type Project } from '../../data/projects';

// T2-S1 Open Surface — container removed entirely. Grouping carried by
// proximity + alignment + identifier anchor (ProjectLabel/TypeTag at top of
// content zone). No border, no raised fill, no inner divider.
// Identity toggles wired: cardFrame (native off; toggle on wraps in full
// frame) / title / caption / image treatment / aspect variance / divider /
// shipped proof. Scan-rail borderTop wired to the divider axis.

function OpenFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
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
        display: 'flex',
        minHeight: 420,
        width: '100%',
        gap: 48,
        borderTop: frameVisible ? 'none' : dividerBorder,
        paddingTop: frameVisible ? 0 : 24,
        padding: frameVisible ? 48 : undefined,
        backgroundColor: frameVisible ? 'var(--dir-raised)' : 'transparent',
        border: frameVisible ? '1px solid var(--dir-border)' : undefined,
      }}
    >
      <div style={{ width: '52%', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ ...imageStyle, flex: 1, display: 'flex' }}>
          <Media
            project={p}
            role="Featured"
            style={{ flex: 1, aspectRatio: aspectOverride ?? 'auto' }}
          />
        </div>
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div>
          <ProjectLabel label={p.label} meta={p.labelMeta} />
          <h2
            style={{
              fontFamily: IS,
              fontSize: 22,
              fontWeight: 500,
              lineHeight: 1.2,
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
              lineHeight: 1.6,
              color: 'var(--dir-text-secondary)',
              maxWidth: 360,
              margin: 0,
              ...captionStyle,
            }}
          >
            {p.framingCompressed}
          </p>
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 32 }}>
          {proofVisible && (
            <div style={{ display: 'flex', gap: 48, marginBottom: 16 }}>
              {p.proof.map((s) => (
                <ProofStat key={s.label} value={s.value} label={s.label} sub={s.sub} />
              ))}
            </div>
          )}
          <TagList tags={p.tags} typeTag={p.typeTag} nativeMode="hidden" />
          <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
            {p.ctaSecondary && <PillCTA variant="outline">{p.ctaSecondary}</PillCTA>}
          </div>
        </div>
      </div>
    </div>
  );
}

function OpenStandard({
  project,
  mediaAspect,
  mediaHeight,
}: {
  project: (typeof supportProjects)[number];
  mediaAspect?: string;
  mediaHeight?: number;
}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const imageStyle = useImageTreatmentStyle('plain');
  const aspectOverride = useAuthoredAspect(mediaAspect ?? '4 / 3', 'uniform');
  const dividerBorder = useDividerBorder('section');
  const frameVisible = useCardFrameVisible('off');
  const mediaStyle: React.CSSProperties | undefined = mediaHeight
    ? { height: mediaHeight, aspectRatio: 'auto' }
    : aspectOverride
      ? { aspectRatio: aspectOverride }
      : mediaAspect
        ? { aspectRatio: mediaAspect }
        : undefined;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderTop: frameVisible ? 'none' : dividerBorder,
        paddingTop: frameVisible ? 0 : 16,
        padding: frameVisible ? 24 : undefined,
        backgroundColor: frameVisible ? 'var(--dir-raised)' : 'transparent',
        border: frameVisible ? '1px solid var(--dir-border)' : undefined,
      }}
    >
      <div style={{ ...imageStyle }}>
        <Media project={project} role="Standard" style={mediaStyle} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: 16 }}>
        <TypeTag>{project.typeTag}</TypeTag>
        <h3
          style={{
            fontFamily: IS,
            fontSize: 18,
            fontWeight: 500,
            lineHeight: 1.25,
            letterSpacing: '-0.015em',
            color: 'var(--dir-text-primary)',
            margin: 0,
            marginBottom: 8,
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
            marginBottom: 12,
            ...captionStyle,
          }}
        >
          {project.framingEditorial}
        </p>
        <div style={{ marginBottom: 16 }}>
          <TagList tags={project.tags} typeTag={project.typeTag} />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </div>
  );
}

export function T2_S1() {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<OpenFeatured />}
      standards={supports.map((p) => <OpenStandard project={p} />)}
    />
  );
}

export const T2_S1_renderers = {
  featured: (project: Project) => <OpenFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <OpenStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
