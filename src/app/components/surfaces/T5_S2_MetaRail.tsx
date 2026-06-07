import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { PillCTA } from '../cards/PillCTA';
import { TagList } from '../cards/TagList';
import type { StandardShell } from './candidates';
import { primaryProject, supportProjects } from '../../data/projects';
import type { Project } from '../../data/projects';

// T5-S2 Right-Aligned Meta Rail — identifier on left, meta rail docks
// flush-right on the same baseline. Asymmetric rail via alignment only.

function MetaRailFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ minHeight: 420, width: '100%' }}>
      <div style={{ width: '52%', flexShrink: 0, borderRight: '1px solid var(--dir-border)', display: 'flex' }}>
        <Media project={p} role="Featured" style={{ flex: 1, aspectRatio: 'auto' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 48 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            paddingBottom: 16,
            borderBottom: '1px solid var(--dir-border)',
            marginBottom: 24,
            gap: 16,
          }}
        >
          <p
            style={{
              fontFamily: IS,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-primary)',
              margin: 0,
            }}
          >
            {p.label}
          </p>
          <p
            style={{
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-secondary)',
              margin: 0,
              textAlign: 'right',
            }}
          >
            {p.labelMeta} · {p.status}
          </p>
        </div>
        <h2
          style={{
            fontFamily: IS,
            fontSize: 26,
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
            lineHeight: 1.7,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 'auto',
          }}
        >
          {p.framingFull}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 16,
            borderTop: '1px solid var(--dir-border)',
            marginTop: 24,
            gap: 24,
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <TagList tags={p.tags} typeTag={p.typeTag} max={3} align="right" nativeMode="slash" />
          </div>
        </div>
      </div>
    </CardFrame>
  );
}

function MetaRailStandard({
  project,
  mediaAspect,
  mediaHeight,
}: {
  project: Project;
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
      <div style={{ borderBottom: '1px solid var(--dir-border)' }}>
        <Media project={project} role="Standard" style={mediaStyle} />
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 16,
            gap: 8,
          }}
        >
          <p
            style={{
              fontFamily: IS,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-primary)',
              margin: 0,
            }}
          >
            {project.label}
          </p>
          <p
            style={{
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--dir-detail)',
              margin: 0,
              textAlign: 'right',
            }}
          >
            {project.typeTag} · {project.status}
          </p>
        </div>
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
            fontSize: 12,
            fontWeight: 300,
            lineHeight: 1.6,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 12,
          }}
        >
          {project.framingEditorial}
        </p>
        <TagList tags={project.tags} typeTag={project.typeTag} max={2} size="compact" nativeMode="hidden" />
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

export function T5_S2({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<MetaRailFeatured />}
      standards={supports.map((p) => <MetaRailStandard project={p} />)}
    />
  );
}

export const T5_S2_renderers = {
  featured: (project: Project) => <MetaRailFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <MetaRailStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
