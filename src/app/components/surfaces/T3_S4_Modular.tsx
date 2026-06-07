import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { ProjectLabel, TypeTag, ProofStat } from '../cards/CardAtoms';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import { primaryProject, supportProjects, type Project } from '../../data/projects';

// T3-S4 Modular Surface — stack of visibly distinct modules cohering through
// shared alignment + ladder spacing. Modules: identifier / media / title+
// framing / proof+tag / action. Seam between modules = authored divider rule
// + locked 24px gutter; no decorative transitions.
const modStrip: React.CSSProperties = {
  padding: '16px 32px',
  borderBottom: '1px solid var(--dir-border)',
  fontFamily: IS,
};

function ModularFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ width: '100%', flexDirection: 'column' }}>
      <div style={modStrip}>
        <ProjectLabel label={p.label} meta={p.labelMeta} />
      </div>
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--dir-border)',
          minHeight: 280,
        }}
      >
        <div style={{ width: '52%', flexShrink: 0, borderRight: '1px solid var(--dir-border)' }}>
          <Media project={p} role="Featured" style={{ width: '100%', height: '100%', aspectRatio: 'auto' }} />
        </div>
        <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
              margin: 0,
            }}
          >
            {p.framingCompressed}
          </p>
        </div>
      </div>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', gap: 48, marginBottom: 16 }}>
          {p.proof.map((s) => (
            <ProofStat key={s.label} value={s.value} label={s.label} sub={s.sub} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <TagList tags={p.tags} typeTag={p.typeTag} max={4} />
          <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

function ModularStandard({
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
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--dir-border)' }}>
        <TypeTag>{project.typeTag}</TypeTag>
      </div>
      <Media project={project} role="Standard" style={mediaStyle} />
      <div
        style={{
          padding: 16,
          borderBottom: '1px solid var(--dir-border)',
        }}
      >
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
            lineHeight: 1.55,
            color: 'var(--dir-text-secondary)',
            margin: 0,
          }}
        >
          {project.framingCompressed}
        </p>
      </div>
      <div style={{ padding: 16, marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <TagList tags={project.tags} typeTag={project.typeTag} max={3} />
        <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
      </div>
    </CardFrame>
  );
}

export function T3_S4() {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<ModularFeatured />}
      standards={supports.map((p) => <ModularStandard project={p} />)}
    />
  );
}

export const T3_S4_renderers = {
  featured: (project: Project) => <ModularFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <ModularStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
