import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS, ISe } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { PillCTA } from '../cards/PillCTA';
import { SV_B } from '../shells/SV_B';
import type { StandardShell } from './candidates';
import { primaryProject, supportProjects } from '../../data/projects';
import type { Project } from '../../data/projects';
import { TagList } from '../cards/TagList';

// T5-S5 Tombstone Label — museum-label register.
// Title · maker-and-date · medium · support · credit on five typographically
// distinct lines. No prose body. CTA quiet by default.

function TombstoneLines({ project, scale }: { project: Project; scale: 'featured' | 'standard' }) {
  const titleSize = scale === 'featured' ? 28 : 18;
  const lineStyles: React.CSSProperties = {
    fontFamily: IS,
    fontSize: scale === 'featured' ? 12 : 11,
    fontWeight: 400,
    color: 'var(--dir-text-secondary)',
    lineHeight: 1.6,
    margin: 0,
  };
  const creditStyles: React.CSSProperties = {
    ...lineStyles,
    fontSize: scale === 'featured' ? 10 : 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--dir-detail)',
  };
  return (
    <>
      <h3
        style={{
          fontFamily: ISe,
          fontSize: titleSize,
          fontWeight: 400,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          color: 'var(--dir-text-primary)',
          margin: 0,
          marginBottom: 16,
        }}
      >
        {project.title}
      </h3>
      <p style={{ ...lineStyles, fontStyle: 'italic' }}>
        {project.label} ({project.labelMeta ?? 'n.d.'})
      </p>
      <p style={lineStyles}>{project.typeTag}</p>
      {scale === 'featured' && (
        project.tags.length > 0 ? (
          <div style={{ ...lineStyles, display: 'flex' }}>
            <TagList tags={project.tags} typeTag={project.typeTag} max={2} size="normal" nativeMode="dot" />
          </div>
        ) : (
          <p style={lineStyles}>Mixed media</p>
        )
      )}
      <p style={creditStyles}>Status · {project.status}</p>
    </>
  );
}

function TombstoneFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ minHeight: 440, width: '100%' }}>
      <div style={{ width: '60%', flexShrink: 0, borderRight: '1px solid var(--dir-border)', display: 'flex' }}>
        <Media project={p} role="Featured" style={{ flex: 1, aspectRatio: 'auto' }} />
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 48,
          backgroundColor: 'var(--dir-bg)',
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
            marginBottom: 24,
          }}
        >
          Label · Cat. {p.label}
        </p>
        <TombstoneLines project={p} scale="featured" />
        <div style={{ marginTop: 'auto', paddingTop: 32 }}>
          <PillCTA variant="text">{p.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

function TombstoneStandard({
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
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: 'var(--dir-bg)' }}>
        <TombstoneLines project={project} scale="standard" />
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

export function T5_S5({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<TombstoneFeatured />}
      standards={supports.map((p) =>
        standardShell === 'sv-b' ? <SV_B project={p} /> : <TombstoneStandard project={p} />,
      )}
    />
  );
}

export const T5_S5_renderers = {
  featured: (project: Project) => <TombstoneFeatured project={project} />,
  standard: (project: Project, opts?: { shell?: StandardShell; mediaAspect?: string; mediaHeight?: number }) =>
    opts?.shell === 'sv-b'
      ? <SV_B project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />
      : <TombstoneStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
