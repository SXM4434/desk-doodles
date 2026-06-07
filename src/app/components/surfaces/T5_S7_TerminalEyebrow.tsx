import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import type { StandardShell } from './candidates';
import { primaryProject, supportProjects } from '../../data/projects';
import type { Project } from '../../data/projects';

// T5-S7 Terminal Release Eyebrow — mono / caps eyebrow treats project like a
// release. "ION · SHIPPED · YC W24 · 2024" then editorial body resumes.
// Two registers kept under one card via eyebrow strip.

const MONO: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", "SF Mono", Menlo, monospace',
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
};

function TerminalStrip({ project, large = false }: { project: Project; large?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: large ? '12px 32px' : '8px 16px',
        backgroundColor: 'var(--dir-bg)',
        borderBottom: '1px solid var(--dir-border)',
        color: 'var(--dir-text-secondary)',
      }}
    >
      <span style={MONO}>{project.label.toUpperCase()}</span>
      <span style={{ ...MONO, color: 'var(--dir-detail)' }}>·</span>
      <span style={MONO}>{project.status.toUpperCase()}</span>
      {project.labelMeta && (
        <>
          <span style={{ ...MONO, color: 'var(--dir-detail)' }}>·</span>
          <span style={MONO}>{project.labelMeta.toUpperCase()}</span>
        </>
      )}
      <span style={{ marginLeft: 'auto', ...MONO, color: 'var(--dir-detail)' }}>v1.0</span>
    </div>
  );
}

function TerminalFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ width: '100%', flexDirection: 'column' }}>
      <TerminalStrip project={p} large />
      <div style={{ display: 'flex', minHeight: 400 }}>
        <div style={{ width: '52%', flexShrink: 0, borderRight: '1px solid var(--dir-border)', display: 'flex' }}>
          <Media project={p} role="Featured" style={{ flex: 1, aspectRatio: 'auto' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 32 }}>
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
              marginBottom: 16,
            }}
          >
            {p.framingFull}
          </p>
          <div style={{ marginBottom: 24 }}>
            <TagList tags={p.tags} typeTag={p.typeTag} max={3} />
          </div>
          <div style={{ marginTop: 'auto' }}>
            <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
          </div>
        </div>
      </div>
    </CardFrame>
  );
}

function TerminalStandard({
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
      <TerminalStrip project={project} />
      <Media project={project} role="Standard" style={mediaStyle} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
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

export function T5_S7({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<TerminalFeatured />}
      standards={supports.map((p) => <TerminalStandard project={p} />)}
    />
  );
}

export const T5_S7_renderers = {
  featured: (project: Project) => <TerminalFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <TerminalStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
