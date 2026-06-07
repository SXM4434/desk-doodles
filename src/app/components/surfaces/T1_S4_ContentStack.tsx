import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { ProjectLabel } from '../cards/CardAtoms';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import { SV_A } from '../shells/SV_A';
import { SV_B } from '../shells/SV_B';
import { primaryProject, supportProjects, type Project } from '../../data/projects';
import type { StandardShell } from './candidates';

// T1-S4 Content-Stack Baseline — typographic stack does the heavy lifting.
// Media panel narrowed to 40% (vs FH-B 48% / T1-S3 60%); content plane gets
// 60% and carries the full atom stack in editorial order. The claim: title
// and framing carry weight, media supports.
function ContentStackFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ minHeight: 460, width: '100%' }}>
      <div
        style={{
          width: '40%',
          flexShrink: 0,
          borderRight: '1px solid var(--dir-border)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Media project={p} role="Featured" style={{ flex: 1, aspectRatio: 'auto' }} />
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 48,
        }}
      >
        <ProjectLabel label={p.label} meta={p.labelMeta} />
        <h2
          style={{
            fontFamily: IS,
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: 'var(--dir-text-primary)',
            margin: 0,
            marginBottom: 16,
            maxWidth: 560,
          }}
        >
          {p.title}
        </h2>
        <p
          style={{
            fontFamily: IS,
            fontSize: 14,
            fontWeight: 300,
            lineHeight: 1.7,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 16,
            maxWidth: 560,
          }}
        >
          {p.framingFull}
        </p>
        <div style={{ marginBottom: 16 }}>
          <TagList tags={p.tags} typeTag={p.typeTag} max={4} nativeMode="hidden" />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

export function T1_S4({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<ContentStackFeatured />}
      standards={supports.map((p) =>
        standardShell === 'sv-b' ? <SV_B project={p} /> : <SV_A project={p} />,
      )}
    />
  );
}

export const T1_S4_renderers = {
  featured: (project: Project) => <ContentStackFeatured project={project} />,
  standard: (project: Project, opts?: { shell?: StandardShell; mediaAspect?: string; mediaHeight?: number }) =>
    opts?.shell === 'sv-b'
      ? <SV_B project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />
      : <SV_A project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
