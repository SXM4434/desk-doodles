import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { ProofStat } from '../cards/CardAtoms';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import { SV_B } from '../shells/SV_B';
import type { StandardShell } from './candidates';
import { primaryProject, supportProjects } from '../../data/projects';
import type { Project } from '../../data/projects';

// T6-S2 Case Brief Compact — same case-brief register as T6-S1 condensed to
// tighter 52/48 split with single-layer media instead of layered stack.
// Tests whether the register survives at a reduced footprint.

function CaseBriefCompactFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ width: '100%', minHeight: 420 }}>
      <div style={{ width: '52%', flexShrink: 0, borderRight: '1px solid var(--dir-border)', display: 'flex' }}>
        <Media project={p} role="Featured" style={{ flex: 1, aspectRatio: 'auto' }} />
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
            marginBottom: 12,
          }}
        >
          Case · {p.label} · {p.labelMeta}
        </p>
        <h2
          style={{
            fontFamily: IS,
            fontSize: 22,
            fontWeight: 500,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: 'var(--dir-text-primary)',
            margin: 0,
            marginBottom: 12,
          }}
        >
          {p.title}
        </h2>
        <p
          style={{
            fontFamily: IS,
            fontSize: 12,
            fontWeight: 300,
            lineHeight: 1.65,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 16,
          }}
        >
          {p.framingCompressed}
        </p>
        <div style={{ marginBottom: 16 }}>
          <TagList tags={p.tags} typeTag={p.typeTag} max={3} size="compact" />
        </div>
        <div style={{ height: 1, width: '100%', backgroundColor: 'var(--dir-border)', marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
          {p.proof.map((s) => (
            <ProofStat key={s.label} value={s.value} label={s.label} sub={s.sub} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
          <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
          {p.ctaSecondary && <PillCTA variant="outline">{p.ctaSecondary}</PillCTA>}
        </div>
      </div>
    </CardFrame>
  );
}

function CaseBriefCompactStandard({
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
            fontSize: 17,
            fontWeight: 500,
            lineHeight: 1.25,
            letterSpacing: '-0.015em',
            color: 'var(--dir-text-primary)',
            margin: 0,
            marginBottom: 8,
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
        <TagList tags={project.tags} typeTag={project.typeTag} max={2} size="compact" />
        <div style={{ height: 1, width: '100%', backgroundColor: 'var(--dir-border)', marginTop: 12, marginBottom: 8 }} />
        <p
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 400,
            letterSpacing: '0.01em',
            color: 'var(--dir-detail)',
            margin: 0,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {project.proof.map((s) => `${s.value} ${s.label}`).join(' · ')}
        </p>
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

export function T6_S2({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<CaseBriefCompactFeatured />}
      standards={supports.map((p) =>
        standardShell === 'sv-b' ? <SV_B project={p} /> : <CaseBriefCompactStandard project={p} />,
      )}
    />
  );
}

export const T6_S2_renderers = {
  featured: (project: Project) => <CaseBriefCompactFeatured project={project} />,
  standard: (project: Project, opts?: { shell?: StandardShell; mediaAspect?: string; mediaHeight?: number }) =>
    opts?.shell === 'sv-b'
      ? <SV_B project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />
      : <CaseBriefCompactStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
