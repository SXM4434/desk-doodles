import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS, ISe } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { ProjectLabel } from '../cards/CardAtoms';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import type { StandardShell } from './candidates';
import { SV_B } from '../shells/SV_B';
import { primaryProject, supportProjects } from '../../data/projects';
import type { Project } from '../../data/projects';

// T5-S1 Italic Title Card — editorial posture earned through type alone.
// Title set in Instrument Serif italic at 36px display scale; framing hangs
// below a hairline rule as caption; no visual decoration.

function ItalicTitleFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ minHeight: 420, width: '100%' }}>
      <div
        style={{
          width: '52%',
          flexShrink: 0,
          borderRight: '1px solid var(--dir-border)',
          display: 'flex',
        }}
      >
        <Media project={p} role="Featured" style={{ flex: 1, aspectRatio: 'auto' }} />
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 48,
        }}
      >
        <div>
          <ProjectLabel label={p.label} meta={p.labelMeta} />
          <h2
            style={{
              fontFamily: ISe,
              fontStyle: 'italic',
              fontSize: 36,
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: 'var(--dir-text-primary)',
              margin: 0,
              marginBottom: 24,
            }}
          >
            {p.title}
          </h2>
          <div
            style={{
              height: 1,
              width: 48,
              backgroundColor: 'var(--dir-border)',
              marginBottom: 16,
            }}
          />
          <p
            style={{
              fontFamily: IS,
              fontSize: 13,
              fontWeight: 300,
              lineHeight: 1.7,
              color: 'var(--dir-text-secondary)',
              maxWidth: 400,
              margin: 0,
            }}
          >
            {p.framingFull}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
          <TagList tags={p.tags} typeTag={p.typeTag} max={2} size="compact" nativeMode="dot" />
        </div>
      </div>
    </CardFrame>
  );
}

function ItalicTitleStandard({
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
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--dir-detail)',
            margin: 0,
            marginBottom: 12,
          }}
        >
          {project.typeTag}
        </p>
        <h3
          style={{
            fontFamily: ISe,
            fontStyle: 'italic',
            fontSize: 20,
            fontWeight: 400,
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
            color: 'var(--dir-text-primary)',
            margin: 0,
            marginBottom: 12,
          }}
        >
          {project.title}
        </h3>
        <div
          style={{
            height: 1,
            width: 32,
            backgroundColor: 'var(--dir-border)',
            marginBottom: 12,
          }}
        />
        <p
          style={{
            fontFamily: IS,
            fontSize: 12,
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
          <TagList tags={project.tags} typeTag={project.typeTag} max={2} size="compact" nativeMode="hidden" />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

export function T5_S1({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<ItalicTitleFeatured />}
      standards={supports.map((p) =>
        standardShell === 'sv-b' ? <SV_B project={p} /> : <ItalicTitleStandard project={p} />,
      )}
    />
  );
}

export const T5_S1_renderers = {
  featured: (project: Project) => <ItalicTitleFeatured project={project} />,
  standard: (project: Project, opts?: { shell?: StandardShell; mediaAspect?: string; mediaHeight?: number }) =>
    opts?.shell === 'sv-b'
      ? <SV_B project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />
      : <ItalicTitleStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
