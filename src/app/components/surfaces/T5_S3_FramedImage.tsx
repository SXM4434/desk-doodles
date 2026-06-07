import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { ProjectLabel } from '../cards/CardAtoms';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import { SV_B } from '../shells/SV_B';
import type { StandardShell } from './candidates';
import { primaryProject, supportProjects } from '../../data/projects';
import type { Project } from '../../data/projects';

// T5-S3 Framed-Image Card — media held inside a visible authored frame.
// Double-border + mat register, like a billguo.me artifact; frame itself
// reads as evidence of thinking, not container chrome.

function FramedMedia({
  project,
  role,
  mediaAspect,
  mediaHeight,
}: {
  project: Project;
  role: string;
  mediaAspect?: string;
  mediaHeight?: number;
}) {
  const mediaStyle: React.CSSProperties | undefined = mediaHeight
    ? { height: mediaHeight, aspectRatio: 'auto' }
    : mediaAspect
      ? { aspectRatio: mediaAspect }
      : undefined;
  return (
    <div
      style={{
        padding: 24,
        backgroundColor: 'var(--dir-recessed)',
        border: '1px solid var(--dir-border)',
      }}
    >
      <div style={{ border: '1px solid var(--dir-border)' }}>
        <Media project={project} role={role} style={mediaStyle} />
      </div>
      <p
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 400,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--dir-detail)',
          margin: 0,
          marginTop: 12,
          textAlign: 'center',
        }}
      >
        {project.realAssetLabel}
      </p>
    </div>
  );
}

function FramedFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ width: '100%', padding: 48, flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', gap: 48 }}>
        <div style={{ width: '58%', flexShrink: 0 }}>
          <FramedMedia project={p} role="Featured" />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ProjectLabel label={p.label} meta={p.labelMeta} />
          <h2
            style={{
              fontFamily: IS,
              fontSize: 24,
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

function FramedStandard({
  project,
  mediaAspect,
  mediaHeight,
}: {
  project: Project;
  mediaAspect?: string;
  mediaHeight?: number;
}) {
  return (
    <CardFrame style={{ flexDirection: 'column', height: '100%', padding: 16 }}>
      <FramedMedia project={project} role="Standard" mediaAspect={mediaAspect} mediaHeight={mediaHeight} />
      <div style={{ padding: '16px 8px 8px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--dir-detail)',
            margin: 0,
            marginBottom: 8,
          }}
        >
          {project.typeTag}
        </p>
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

export function T5_S3({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<FramedFeatured />}
      standards={supports.map((p) =>
        standardShell === 'sv-b' ? <SV_B project={p} /> : <FramedStandard project={p} />,
      )}
    />
  );
}

export const T5_S3_renderers = {
  featured: (project: Project) => <FramedFeatured project={project} />,
  standard: (project: Project, opts?: { shell?: StandardShell; mediaAspect?: string; mediaHeight?: number }) =>
    opts?.shell === 'sv-b'
      ? <SV_B project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />
      : <FramedStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
