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

// T6-S1 Case Brief Horizontal — Image 4 reference register on FH-A.
// Layered-stack media · accent eyebrow · display title · body · 3 outlined
// chips · rule · twin proof stats · dual CTA · footer meta.
// Kept within card-system legality: FH-A, ≤3 tags, dual-CTA earned by live URL.

function StackedMedia({ project }: { project: Project }) {
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: 280, padding: 24 }}>
      <div
        style={{
          position: 'absolute',
          inset: '32px 64px 24px 24px',
          border: '1px solid var(--dir-border)',
          backgroundColor: 'var(--dir-muted)',
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '32px 48px 32px 32px',
          border: '1px solid var(--dir-border)',
          backgroundColor: 'var(--dir-recessed)',
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: 'relative',
          marginLeft: 64,
          marginTop: 32,
          border: '1px solid var(--dir-border)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
        }}
      >
        <Media project={project} role="Featured · stack-top" />
      </div>
    </div>
  );
}

function CaseBriefFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ width: '100%', minHeight: 540 }}>
      <div style={{ width: '48%', flexShrink: 0, borderRight: '1px solid var(--dir-border)', display: 'flex', alignItems: 'center' }}>
        <StackedMedia project={p} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 32 }}>
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--dir-accent)',
            margin: 0,
            marginBottom: 16,
          }}
        >
          Case Study · {p.label} · {p.labelMeta}
        </p>
        <h2
          style={{
            fontFamily: IS,
            fontSize: 22,
            fontWeight: 600,
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
        <div style={{ height: 1, width: '100%', backgroundColor: 'var(--dir-border)', marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 48, marginBottom: 24 }}>
          {p.proof.map((s) => (
            <ProofStat key={s.label} value={s.value} label={s.label} sub={s.sub} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
          {p.ctaSecondary && <PillCTA variant="outline">{p.ctaSecondary}</PillCTA>}
        </div>
      </div>
    </CardFrame>
  );
}

function CaseBriefStandard({
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
      <div style={{ borderBottom: '1px solid var(--dir-border)', padding: 16 }}>
        <div style={{ border: '1px solid var(--dir-border)' }}>
          <Media project={project} role="Standard" style={mediaStyle} />
        </div>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--dir-accent)',
            margin: 0,
            marginBottom: 8,
          }}
        >
          Case · {project.label}
        </p>
        <h3
          style={{
            fontFamily: IS,
            fontSize: 15,
            fontWeight: 600,
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
        <div style={{ marginBottom: 12 }}>
          <TagList tags={project.tags} typeTag={project.typeTag} max={2} />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

export function T6_S1({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<CaseBriefFeatured />}
      standards={supports.map((p) => <CaseBriefStandard project={p} />)}
    />
  );
}

export const T6_S1_renderers = {
  featured: (project: Project) => <CaseBriefFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <CaseBriefStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
