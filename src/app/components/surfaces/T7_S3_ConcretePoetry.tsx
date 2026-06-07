import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS, ISe } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import type { StandardShell } from './candidates';
import { primaryProject, supportProjects } from '../../data/projects';
import type { Project } from '../../data/projects';

// T7-S3 Concrete-Poetry Card — title words arranged spatially at authored
// positions so the shape carries meaning. Other atoms locked so only the
// title does the experimental work. CTA quiet.

function splitTitle(title: string): string[] {
  return title.split(/\s+/).filter(Boolean);
}

function ConcreteTitle({ title, scale }: { title: string; scale: 'featured' | 'standard' }) {
  const words = splitTitle(title);
  const base = scale === 'featured' ? 48 : 28;
  const positions: Array<{ paddingLeft: number; letterSpacing: string; fontSize: number }> = [
    { paddingLeft: 0, letterSpacing: '-0.02em', fontSize: base },
    { paddingLeft: base * 0.5, letterSpacing: '0em', fontSize: base * 0.92 },
    { paddingLeft: base * 0.25, letterSpacing: '-0.02em', fontSize: base },
    { paddingLeft: base * 0.8, letterSpacing: '0em', fontSize: base * 0.88 },
    { paddingLeft: base * 0.6, letterSpacing: '-0.01em', fontSize: base * 0.96 },
    { paddingLeft: base * 0.15, letterSpacing: '0em', fontSize: base * 0.9 },
    { paddingLeft: base * 0.7, letterSpacing: '-0.01em', fontSize: base * 0.95 },
    { paddingLeft: base * 0.4, letterSpacing: '0em', fontSize: base * 0.92 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: scale === 'featured' ? 2 : 0 }}>
      {words.map((w, i) => {
        const pos = positions[i % positions.length];
        return (
          <span
            key={i}
            style={{
              fontFamily: ISe,
              fontStyle: i % 3 === 1 ? 'italic' : 'normal',
              fontSize: pos.fontSize,
              fontWeight: 400,
              lineHeight: 0.95,
              letterSpacing: pos.letterSpacing,
              color: 'var(--dir-text-primary)',
              paddingLeft: pos.paddingLeft,
              display: 'inline-block',
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
}

function ConcreteFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ minHeight: 460, width: '100%' }}>
      <div style={{ width: '56%', flexShrink: 0, borderRight: '1px solid var(--dir-border)', padding: 48, display: 'flex', alignItems: 'center' }}>
        <ConcreteTitle title={p.title} scale="featured" />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 32 }}>
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
          {p.label} · {p.labelMeta}
        </p>
        <div style={{ marginBottom: 16, border: '1px solid var(--dir-border)' }}>
          <Media project={p} role="Featured" />
        </div>
        <p
          style={{
            fontFamily: IS,
            fontSize: 12,
            fontWeight: 300,
            lineHeight: 1.65,
            color: 'var(--dir-text-secondary)',
            margin: 0,
          }}
        >
          {p.framingCompressed}
        </p>
        <div style={{ marginTop: 12 }}>
          <TagList
            tags={p.tags}
            typeTag={p.typeTag}
            size="compact"
            nativeMode="hidden"
          />
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <PillCTA variant="text">{p.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

function ConcreteStandard({
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
      <div style={{ padding: 24, borderBottom: '1px solid var(--dir-border)', minHeight: 140 }}>
        <ConcreteTitle title={project.title} scale="standard" />
      </div>
      <Media project={project} role="Standard" style={mediaStyle} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
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
          {project.label} · {project.typeTag}
        </p>
        <p
          style={{
            fontFamily: IS,
            fontSize: 12,
            fontWeight: 300,
            lineHeight: 1.55,
            color: 'var(--dir-text-secondary)',
            margin: 0,
          }}
        >
          {project.framingEditorial}
        </p>
        <div style={{ marginTop: 8 }}>
          <TagList
            tags={project.tags}
            typeTag={project.typeTag}
            size="compact"
            nativeMode="hidden"
          />
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

export function T7_S3({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<ConcreteFeatured />}
      standards={supports.map((p) => <ConcreteStandard project={p} />)}
    />
  );
}

export const T7_S3_renderers = {
  featured: (project: Project) => <ConcreteFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <ConcreteStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
