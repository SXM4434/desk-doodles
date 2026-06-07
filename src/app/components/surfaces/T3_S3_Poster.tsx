import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { ProjectLabel, TypeTag, ProofStat } from '../cards/CardAtoms';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import { primaryProject, supportProjects, type Project } from '../../data/projects';

// T3-S3 Poster Surface — display-scale title paired with media at authored
// weight balance. Title scale lifted toward 52px (CD display register). Type
// is the first formal act; media supports. Proof row hugs the baseline.
function PosterFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ minHeight: 500, width: '100%', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          flex: 1,
          borderBottom: '1px solid var(--dir-border)',
        }}
      >
        <div
          style={{
            width: '46%',
            flexShrink: 0,
            borderRight: '1px solid var(--dir-border)',
            display: 'flex',
            flexDirection: 'column',
            padding: 32,
            justifyContent: 'space-between',
          }}
        >
          <ProjectLabel label={p.label} meta={p.labelMeta} />
          <h2
            style={{
              fontFamily: IS,
              fontSize: 52,
              fontWeight: 500,
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
              color: 'var(--dir-text-primary)',
              margin: 0,
            }}
          >
            {p.title}
          </h2>
          <div>
            <p
              style={{
                fontFamily: IS,
                fontSize: 15,
                fontWeight: 300,
                lineHeight: 1.5,
                color: 'var(--dir-text-secondary)',
                margin: 0,
                marginBottom: 16,
              }}
            >
              {p.framingCompressed}
            </p>
            <TagList tags={p.tags} typeTag={p.typeTag} max={3} nativeMode="hidden" />
          </div>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Media project={p} role="Featured" style={{ flex: 1, aspectRatio: 'auto' }} />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          gap: 48,
        }}
      >
        <div style={{ display: 'flex', gap: 48 }}>
          {p.proof.map((s) => (
            <ProofStat key={s.label} value={s.value} label={s.label} sub={s.sub} />
          ))}
        </div>
        <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
      </div>
    </CardFrame>
  );
}

function PosterStandard({
  project,
  mediaAspect,
  mediaHeight,
}: {
  project: (typeof supportProjects)[number];
  mediaAspect?: string;
  mediaHeight?: number;
}) {
  const mediaStyle: React.CSSProperties | undefined = mediaHeight
    ? { height: mediaHeight, aspectRatio: 'auto' }
    : mediaAspect
      ? { aspectRatio: mediaAspect }
      : undefined;
  return (
    <CardFrame style={{ flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '24px 16px 16px 16px' }}>
        <TypeTag>{project.typeTag}</TypeTag>
        <h3
          style={{
            fontFamily: IS,
            fontSize: 26,
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: 'var(--dir-text-primary)',
            margin: 0,
          }}
        >
          {project.title}
        </h3>
      </div>
      <Media project={project} role="Standard" style={mediaStyle} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 16 }}>
        <p
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.6,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 16,
          }}
        >
          {project.framingEditorial}
        </p>
        <div style={{ marginBottom: 16 }}>
          <TagList tags={project.tags} typeTag={project.typeTag} max={3} />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

export function T3_S3() {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<PosterFeatured />}
      standards={supports.map((p) => <PosterStandard project={p} />)}
    />
  );
}

export const T3_S3_renderers = {
  featured: (project: Project) => <PosterFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <PosterStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
