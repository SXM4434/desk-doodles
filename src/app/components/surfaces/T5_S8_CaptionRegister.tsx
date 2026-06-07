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

// T5-S8 Caption-Register Card — all typography compressed to caption scale
// except the title. Exhibit-caption register: 11px meta dominates, title
// the only break in scale. CTA is quiet text-link by default.

const CAPTION: React.CSSProperties = {
  fontFamily: IS,
  fontSize: 11,
  fontWeight: 400,
  lineHeight: 1.65,
  color: 'var(--dir-text-secondary)',
  letterSpacing: '0.02em',
  margin: 0,
};

function CaptionFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ minHeight: 440, width: '100%' }}>
      <div style={{ width: '62%', flexShrink: 0, borderRight: '1px solid var(--dir-border)', display: 'flex' }}>
        <Media project={p} role="Featured" style={{ flex: 1, aspectRatio: 'auto' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 48, backgroundColor: 'var(--dir-bg)' }}>
        <p style={{ ...CAPTION, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--dir-detail)', marginBottom: 16 }}>
          {p.label} · {p.labelMeta} · Fig. 01
        </p>
        <h2
          style={{
            fontFamily: ISe,
            fontSize: 32,
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
            color: 'var(--dir-text-primary)',
            margin: 0,
            marginBottom: 16,
          }}
        >
          {p.title}
        </h2>
        <div style={{ height: 1, width: '100%', backgroundColor: 'var(--dir-border)', marginBottom: 16 }} />
        <p style={{ ...CAPTION, lineHeight: 1.75 }}>{p.framingFull}</p>
        <p style={{ ...CAPTION, marginTop: 16, lineHeight: 1.75 }}>
          <span style={{ color: 'var(--dir-text-primary)', fontWeight: 500 }}>Medium.</span>{' '}
          {p.typeTag}
        </p>
        <div style={{ marginTop: 'auto', paddingTop: 24 }}>
          <PillCTA variant="text">{p.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

function CaptionStandard({
  project,
  fig,
  mediaAspect,
  mediaHeight,
}: {
  project: Project;
  fig: string;
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
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: 'var(--dir-bg)' }}>
        <p style={{ ...CAPTION, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--dir-detail)', marginBottom: 12 }}>
          {project.label} · Fig. {fig}
        </p>
        <h3
          style={{
            fontFamily: ISe,
            fontSize: 22,
            fontWeight: 400,
            lineHeight: 1.2,
            letterSpacing: '-0.005em',
            color: 'var(--dir-text-primary)',
            margin: 0,
            marginBottom: 12,
          }}
        >
          {project.title}
        </h3>
        <div style={{ height: 1, width: '100%', backgroundColor: 'var(--dir-border)', marginBottom: 12 }} />
        <p style={{ ...CAPTION, lineHeight: 1.7 }}>{project.framingEditorial}</p>
        <p style={{ ...CAPTION, marginTop: 8, color: 'var(--dir-detail)' }}>
          {project.typeTag}
        </p>
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

export function T5_S8({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<CaptionFeatured />}
      standards={supports.map((p, i) =>
        standardShell === 'sv-b' ? <SV_B project={p} /> : <CaptionStandard project={p} fig={String(i + 2).padStart(2, '0')} />,
      )}
    />
  );
}

export const T5_S8_renderers = {
  featured: (project: Project) => <CaptionFeatured project={project} />,
  standard: (project: Project, opts?: { shell?: StandardShell; mediaAspect?: string; mediaHeight?: number }) =>
    opts?.shell === 'sv-b'
      ? <SV_B project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />
      : <CaptionStandard project={project} fig="02" mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
