import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS, CD } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { PillCTA } from '../cards/PillCTA';
import { TagList } from '../cards/TagList';
import type { StandardShell } from './candidates';
import { primaryProject, supportProjects } from '../../data/projects';
import type { Project } from '../../data/projects';

// T7-S2 Brutalist Type-Only — title at 96px Clash Display dominates.
// Media still present per card-system rule but relegated to a small framed
// block at the base — type is the object, media is annotation.

function BrutalistFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ width: '100%', flexDirection: 'column', padding: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24, gap: 16, width: '100%' }}>
        <p
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--dir-text-primary)',
            margin: 0,
          }}
        >
          {p.label} / {p.labelMeta}
        </p>
        <p
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--dir-detail)',
            margin: 0,
          }}
        >
          Entry 01 / 05
        </p>
      </div>
      <h2
        style={{
          fontFamily: CD,
          fontSize: 72,
          fontWeight: 500,
          lineHeight: 0.95,
          letterSpacing: '-0.035em',
          color: 'var(--dir-text-primary)',
          margin: 0,
          marginBottom: 24,
          textTransform: 'uppercase',
        }}
      >
        {p.label}
      </h2>
      <div style={{ display: 'flex', gap: 48, marginBottom: 32, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, maxWidth: 560 }}>
          <p
            style={{
              fontFamily: IS,
              fontSize: 15,
              fontWeight: 300,
              lineHeight: 1.55,
              color: 'var(--dir-text-primary)',
              margin: 0,
              marginBottom: 16,
            }}
          >
            {p.title}
          </p>
          <p
            style={{
              fontFamily: IS,
              fontSize: 12,
              fontWeight: 400,
              lineHeight: 1.65,
              color: 'var(--dir-text-secondary)',
              margin: 0,
            }}
          >
            {p.framingFull}
          </p>
        </div>
        <div style={{ width: 200, flexShrink: 0, border: '1px solid var(--dir-border)' }}>
          <Media project={p} role="annotation" />
          <p
            style={{
              fontFamily: IS,
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--dir-detail)',
              margin: 0,
              padding: 8,
              borderTop: '1px solid var(--dir-border)',
            }}
          >
            Annotation · Fig. 1
          </p>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--dir-border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TagList tags={p.tags} typeTag={p.typeTag} nativeMode="slash" />
        <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
      </div>
    </CardFrame>
  );
}

function BrutalistStandard({
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
    <CardFrame style={{ flexDirection: 'column', height: '100%', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--dir-detail)',
            margin: 0,
          }}
        >
          {project.typeTag}
        </p>
      </div>
      <h3
        style={{
          fontFamily: CD,
          fontSize: 48,
          fontWeight: 500,
          lineHeight: 0.95,
          letterSpacing: '-0.04em',
          color: 'var(--dir-text-primary)',
          margin: 0,
          marginBottom: 16,
          textTransform: 'uppercase',
        }}
      >
        {project.label}
      </h3>
      <p
        style={{
          fontFamily: IS,
          fontSize: 13,
          fontWeight: 300,
          lineHeight: 1.5,
          color: 'var(--dir-text-primary)',
          margin: 0,
          marginBottom: 16,
        }}
      >
        {project.title}
      </p>
      <div style={{ width: 120, border: '1px solid var(--dir-border)', marginBottom: 12 }}>
        <Media project={project} role="annotation" style={mediaStyle} />
      </div>
      <p
        style={{
          fontFamily: IS,
          fontSize: 11,
          fontWeight: 400,
          lineHeight: 1.55,
          color: 'var(--dir-text-secondary)',
          margin: 0,
          marginBottom: 12,
        }}
      >
        {project.framingEditorial}
      </p>
      <TagList tags={project.tags} typeTag={project.typeTag} max={2} size="compact" nativeMode="hidden" />
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--dir-border)' }}>
        <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
      </div>
    </CardFrame>
  );
}

export function T7_S2({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<BrutalistFeatured />}
      standards={supports.map((p) => <BrutalistStandard project={p} />)}
    />
  );
}

export const T7_S2_renderers = {
  featured: (project: Project) => <BrutalistFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <BrutalistStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
