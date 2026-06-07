import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { ProjectLabel, TypeTag, ProofStat } from '../cards/CardAtoms';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import { primaryProject, supportProjects, type Project } from '../../data/projects';

// T1-S3 Media-Weighted Baseline — media carries first visual weight; content
// stack remains in the locked plane but is tonally quieter. Featured shifts
// media panel from 52% to 60% width (shell-legal); Standard media enlarges
// aspect to 4/3 for tonal presence; content palette is subdued.
function MediaWeightedFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ minHeight: 460, width: '100%' }}>
      <div
        style={{
          width: '60%',
          flexShrink: 0,
          borderRight: '1px solid var(--dir-border)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--dir-recessed)',
        }}
      >
        <Media project={p} role="Featured" style={{ flex: 1, aspectRatio: 'auto' }} />
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 32,
        }}
      >
        <div>
          <ProjectLabel label={p.label} meta={p.labelMeta} />
          <h2
            style={{
              fontFamily: IS,
              fontSize: 18,
              fontWeight: 500,
              lineHeight: 1.25,
              letterSpacing: '-0.015em',
              color: 'var(--dir-text-primary)',
              margin: 0,
              marginBottom: 12,
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
              margin: 0,
            }}
          >
            {p.framingCompressed}
          </p>
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 32 }}>
          <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
            {p.proof.map((s) => (
              <ProofStat key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
          <TagList tags={p.tags} typeTag={p.typeTag} max={3} nativeMode="hidden" />
          <div style={{ marginTop: 16 }}>
            <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
          </div>
        </div>
      </div>
    </CardFrame>
  );
}

function MediaWeightedStandard({
  project,
  mediaAspect,
  mediaHeight,
}: {
  project: (typeof supportProjects)[number];
  mediaAspect?: string;
  mediaHeight?: number;
}) {
  const mediaStyle: React.CSSProperties = mediaHeight
    ? { height: mediaHeight, aspectRatio: 'auto' }
    : { aspectRatio: mediaAspect ?? '4 / 3' };
  return (
    <CardFrame style={{ flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          width: '100%',
          borderBottom: '1px solid var(--dir-border)',
          backgroundColor: 'var(--dir-recessed)',
        }}
      >
        <Media
          project={project}
          role="Standard"
          style={mediaStyle}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 16 }}>
        <TypeTag>{project.typeTag}</TypeTag>
        <h3
          style={{
            fontFamily: IS,
            fontSize: 17,
            fontWeight: 500,
            lineHeight: 1.3,
            letterSpacing: '-0.015em',
            color: 'var(--dir-text-primary)',
            margin: 0,
            marginBottom: 8,
          }}
        >
          {project.title}
        </h3>
        <p
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.55,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 16,
          }}
        >
          {project.framingEditorial}
        </p>
        <div style={{ marginBottom: 16 }}>
          <TagList tags={project.tags} typeTag={project.typeTag} max={2} />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

export function T1_S3() {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<MediaWeightedFeatured />}
      standards={supports.map((p) => <MediaWeightedStandard project={p} />)}
    />
  );
}

export const T1_S3_renderers = {
  featured: (project: Project) => <MediaWeightedFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <MediaWeightedStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
