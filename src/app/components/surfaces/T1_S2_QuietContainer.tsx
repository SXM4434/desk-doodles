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

// T1-S2 Quiet Container Baseline — softened border + softened raised fill,
// grouping cue still carried by boundary but signal is measurably quieter.
// Border dropped to muted color; raised fill dropped to bg (no surface-raised
// differential); inner dividers removed. Atoms stay in locked positions.
// Identity toggles wired: cardFrame (borders collapse when off) / title /
// caption / image treatment / aspect variance / divider / shipped proof.

function QuietFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const imageStyle = useImageTreatmentStyle('plain');
  const aspectOverride = useAuthoredAspect('16 / 10', 'uniform');
  const frameBorder = useDividerBorder('section');
  const proofVisible = useProofVisible('on');
  const frameVisible = useCardFrameVisible('on');
  return (
    <div
      style={{
        backgroundColor: frameVisible ? 'var(--dir-bg)' : 'transparent',
        borderTop: frameVisible ? frameBorder : 'none',
        borderBottom: frameVisible ? frameBorder : 'none',
        overflow: 'hidden',
        display: 'flex',
        minHeight: 420,
        width: '100%',
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
          padding: frameVisible ? 48 : '48px 0 48px 48px',
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
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
            {p.ctaSecondary && <PillCTA variant="outline">{p.ctaSecondary}</PillCTA>}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuietStandard({
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
  const frameBorder = useDividerBorder('section');
  const frameVisible = useCardFrameVisible('on');
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
        backgroundColor: frameVisible ? 'var(--dir-bg)' : 'transparent',
        borderTop: frameVisible ? frameBorder : 'none',
        borderBottom: frameVisible ? frameBorder : 'none',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div style={{ ...imageStyle }}>
        <Media project={project} role="Standard" style={mediaStyle} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: frameVisible ? 24 : '24px 0 0' }}>
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
            marginBottom: 12,
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
            marginBottom: 16,
            ...captionStyle,
          }}
        >
          {project.framingEditorial}
        </p>
        <div style={{ marginBottom: 24 }}>
          <TagList tags={project.tags} typeTag={project.typeTag} />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </div>
  );
}

export function T1_S2() {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<QuietFeatured />}
      standards={supports.map((p) => <QuietStandard project={p} />)}
    />
  );
}

export const T1_S2_renderers = {
  featured: (project: Project) => <QuietFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <QuietStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
