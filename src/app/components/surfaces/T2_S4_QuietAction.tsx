import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { ProjectLabel, TypeTag, ProofStat } from '../cards/CardAtoms';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import { primaryProject, supportProjects, type Project } from '../../data/projects';
import type { StandardShell } from './candidates';

// T2-S4 Quiet-Action Composition — action zone composed at minimum
// structurally-legal footprint. Featured uses TextCTA (no pill) placed inline
// after framing; no secondary CTA slot. Standard keeps text CTA but collapses
// chevron visual weight. Title + framing carry more of the path-forward cue.
function QuietActionFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ minHeight: 420, width: '100%' }}>
      <div
        style={{
          width: '52%',
          flexShrink: 0,
          borderRight: '1px solid var(--dir-border)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Media project={p} role="Featured" style={{ flex: 1, aspectRatio: 'auto' }} />
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 32,
        }}
      >
        <div>
          <ProjectLabel label={p.label} meta={p.labelMeta} />
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
        </div>
        <p
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 400,
            lineHeight: 1.6,
            color: 'var(--dir-text-primary)',
            margin: 0,
          }}
        >
          <span style={{ color: 'var(--dir-text-secondary)', fontWeight: 300 }}>
            {p.framingCompressed.replace(/\.$/, '')}{' '}
          </span>
          <PillCTA nativeMode="underline">{p.ctaPrimary} →</PillCTA>
        </p>
        <div style={{ marginTop: 'auto', paddingTop: 32 }}>
          <div style={{ display: 'flex', gap: 48, marginBottom: 16 }}>
            {p.proof.map((s) => (
              <ProofStat key={s.label} value={s.value} label={s.label} sub={s.sub} />
            ))}
          </div>
          <TagList tags={p.tags} typeTag={p.typeTag} nativeMode="hidden" />
        </div>
      </div>
    </CardFrame>
  );
}

function QuietActionStandardSvA({
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
      <Media project={project} role="Standard" style={mediaStyle} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 16 }}>
        <TypeTag>{project.typeTag}</TypeTag>
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
            lineHeight: 1.6,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 16,
          }}
        >
          {project.framingEditorial}
        </p>
        <div style={{ marginBottom: 16 }}>
          <TagList tags={project.tags} typeTag={project.typeTag} />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <PillCTA nativeMode="caps">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

function QuietActionStandardSvB({
  project,
  mediaAspect,
  mediaHeight,
}: {
  project: (typeof supportProjects)[number];
  mediaAspect?: string;
  mediaHeight?: number;
}) {
  const tiny = project.proof.map((p) => `${p.value} ${p.label}`).join(' · ');
  const mediaStyle: React.CSSProperties | undefined = mediaHeight
    ? { height: mediaHeight, aspectRatio: 'auto' }
    : mediaAspect
      ? { aspectRatio: mediaAspect }
      : undefined;
  return (
    <CardFrame style={{ flexDirection: 'column', height: '100%' }}>
      <Media project={project} role="Standard" style={mediaStyle} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 16 }}>
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
            lineHeight: 1.65,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 16,
          }}
        >
          {project.framingCompressed}
        </p>
        <p
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 400,
            color: 'var(--dir-detail)',
            borderTop: '1px solid var(--dir-border)',
            paddingTop: 12,
            margin: 0,
            marginBottom: 16,
            letterSpacing: '0.01em',
          }}
        >
          {tiny}
        </p>
        <div style={{ marginBottom: 16 }}>
          <TagList tags={project.tags} typeTag={project.typeTag} nativeMode="hidden" />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <PillCTA nativeMode="caps">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

export function T2_S4({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<QuietActionFeatured />}
      standards={supports.map((p) =>
        standardShell === 'sv-b'
          ? <QuietActionStandardSvB project={p} />
          : <QuietActionStandardSvA project={p} />,
      )}
    />
  );
}

export const T2_S4_renderers = {
  featured: (project: Project) => <QuietActionFeatured project={project} />,
  standard: (project: Project, opts?: { shell?: StandardShell; mediaAspect?: string; mediaHeight?: number }) =>
    opts?.shell === 'sv-b'
      ? <QuietActionStandardSvB project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />
      : <QuietActionStandardSvA project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
