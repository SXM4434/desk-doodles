import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { ProofStat } from '../cards/CardAtoms';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import type { StandardShell } from './candidates';
import { primaryProject, supportProjects } from '../../data/projects';
import type { Project } from '../../data/projects';

// T6-S3 Version Filmstrip — Image 5 reference register.
// Versioned screenshot filmstrip (v1.1 / v1.2 / v1.3) + terminal eyebrow +
// title + "Prototyping Lead" subtitle + right-aligned tags + stats + body.
// Kept at reference fidelity: flat 21:9 letterbox aspect per version frame.

const MONO: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", "SF Mono", Menlo, monospace',
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
};

function VersionStrip({
  project,
  large = false,
  thumbAspect,
  thumbHeight,
}: {
  project: Project;
  large?: boolean;
  thumbAspect?: string;
  thumbHeight?: number;
}) {
  const versions = ['v1.1', 'v1.2', 'v1.3'];
  const mediaStyle: React.CSSProperties = thumbHeight
    ? { height: thumbHeight, aspectRatio: 'auto' }
    : { aspectRatio: thumbAspect ?? '21 / 9' };
  return (
    <div
      style={{
        display: 'flex',
        gap: large ? 8 : 4,
        padding: large ? 16 : 8,
        backgroundColor: 'var(--dir-recessed)',
        borderBottom: '1px solid var(--dir-border)',
      }}
    >
      {versions.map((v) => (
        <div key={v} style={{ flex: 1, minWidth: 0 }}>
          <Media project={project} role={`${project.label} · ${v}`} style={mediaStyle} />
          <p
            style={{
              ...MONO,
              fontSize: large ? 10 : 9,
              color: 'var(--dir-detail)',
              margin: 0,
              marginTop: 4,
            }}
          >
            {v}
          </p>
        </div>
      ))}
    </div>
  );
}

function FilmstripFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ width: '100%', flexDirection: 'column' }}>
      <VersionStrip project={p} large />
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16, gap: 16 }}>
          <p style={{ ...MONO, color: 'var(--dir-text-primary)', margin: 0 }}>
            {p.label} · {p.labelMeta} · {p.status}
          </p>
          <TagList tags={p.tags} typeTag={p.typeTag} max={3} align="right" />
        </div>
        <h2
          style={{
            fontFamily: IS,
            fontSize: 32,
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: 'var(--dir-text-primary)',
            margin: 0,
            marginBottom: 4,
          }}
        >
          {p.title}
        </h2>
        <p
          style={{
            fontFamily: IS,
            fontSize: 14,
            fontWeight: 400,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 16,
          }}
        >
          Prototyping Lead · {p.typeTag}
        </p>
        <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
          {p.proof.map((s) => (
            <ProofStat key={s.label} value={s.value} label={s.label} sub={s.sub} />
          ))}
        </div>
        <p
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.7,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 24,
            maxWidth: 720,
          }}
        >
          {p.framingFull}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
          {p.ctaSecondary && <PillCTA variant="outline">{p.ctaSecondary}</PillCTA>}
        </div>
      </div>
    </CardFrame>
  );
}

function FilmstripStandard({
  project,
  mediaAspect,
  mediaHeight,
}: {
  project: Project;
  mediaAspect?: string;
  mediaHeight?: number;
}) {
  return (
    <CardFrame style={{ flexDirection: 'column', height: '100%' }}>
      <VersionStrip project={project} thumbAspect={mediaAspect} thumbHeight={mediaHeight} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, gap: 8 }}>
          <p style={{ ...MONO, color: 'var(--dir-text-primary)', margin: 0 }}>{project.label}</p>
          <span
            style={{
              ...MONO,
              color: 'var(--dir-detail)',
              margin: 0,
            }}
          >
            {project.status}
          </span>
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
            marginBottom: 4,
          }}
        >
          {project.title}
        </h3>
        <p
          style={{
            fontFamily: IS,
            fontSize: 12,
            fontWeight: 400,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 12,
          }}
        >
          {project.typeTag}
        </p>
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

export function T6_S3({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<FilmstripFeatured />}
      standards={supports.map((p) => <FilmstripStandard project={p} />)}
    />
  );
}

export const T6_S3_renderers = {
  featured: (project: Project) => <FilmstripFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <FilmstripStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
