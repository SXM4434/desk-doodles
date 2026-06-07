import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { ProjectLabel, TypeTag, ProofStat } from '../cards/CardAtoms';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import { primaryProject, supportProjects, type Project } from '../../data/projects';

// T2-S2 Split-Plate Surface — media and content formalized as two coupled
// plates with an authored seam: tone differential between plates (recessed on
// media side, raised on content side) + 2px seam rule + shared alignment marks
// (matching meta strips crossing the seam).
function SplitPlateFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame
      style={{
        minHeight: 440,
        width: '100%',
        backgroundColor: 'transparent',
        border: 'none',
      }}
    >
      <div
        style={{
          width: '52%',
          flexShrink: 0,
          backgroundColor: 'var(--dir-recessed)',
          borderRight: '1px solid var(--dir-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: 16,
        }}
      >
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--dir-detail)',
            margin: 0,
            marginBottom: 12,
          }}
        >
          media plate · 01
        </p>
        <Media project={p} role="Featured" style={{ flex: 1, aspectRatio: 'auto' }} />
      </div>
      <div
        style={{
          flex: 1,
          backgroundColor: 'var(--dir-raised)',
          display: 'flex',
          flexDirection: 'column',
          padding: 32,
        }}
      >
        <div>
          <p
            style={{
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--dir-detail)',
              margin: 0,
              marginBottom: 16,
            }}
          >
            content plate · 02
          </p>
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
            }}
          >
            {p.framingCompressed}
          </p>
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 32 }}>
          <div style={{ display: 'flex', gap: 48, marginBottom: 16 }}>
            {p.proof.map((s) => (
              <ProofStat key={s.label} value={s.value} label={s.label} sub={s.sub} />
            ))}
          </div>
          <TagList tags={p.tags} typeTag={p.typeTag} nativeMode="hidden" />
          <div style={{ marginTop: 16 }}>
            <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
          </div>
        </div>
      </div>
    </CardFrame>
  );
}

function SplitPlateStandard({
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          backgroundColor: 'var(--dir-recessed)',
          borderBottom: '1px solid var(--dir-border)',
          padding: 12,
        }}
      >
        <Media project={project} role="Standard" style={mediaStyle} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          backgroundColor: 'var(--dir-raised)',
          padding: 16,
        }}
      >
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

export function T2_S2() {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<SplitPlateFeatured />}
      standards={supports.map((p) => <SplitPlateStandard project={p} />)}
    />
  );
}

export const T2_S2_renderers = {
  featured: (project: Project) => <SplitPlateFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <SplitPlateStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
