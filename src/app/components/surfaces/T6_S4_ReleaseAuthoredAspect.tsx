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

// T6-S4 Release with Authored Aspect — same release-register as T6-S3, but
// versioned stack respects each frame's authored aspect (addresses the
// user's Image-5 feedback: "don't love the flat letterbox aspect").

const MONO: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", "SF Mono", Menlo, monospace',
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
};

const AUTHORED_ASPECTS = ['4 / 3', '16 / 9', '3 / 4'];
// Asymmetric column widths tied to aspect: narrow-portrait / wide-landscape /
// medium-square. Variance is structurally visible at a glance, not only
// through the aspect of each frame. Resolves the T6-S3 collision where equal
// columns + shared proxy image collapsed to the same flat 21:9 read.
const AUTHORED_COLUMNS = '3fr 5fr 3fr';

function AuthoredVersionStack({
  project,
  large = false,
  overrideAspect,
  overrideHeight,
}: {
  project: Project;
  large?: boolean;
  overrideAspect?: string;
  overrideHeight?: number;
}) {
  const versions = ['v1.1', 'v1.2', 'v1.3'];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: overrideAspect || overrideHeight ? '1fr 1fr 1fr' : AUTHORED_COLUMNS,
        gap: large ? 12 : 8,
        padding: large ? 20 : 12,
        backgroundColor: 'var(--dir-recessed)',
        borderBottom: '1px solid var(--dir-border)',
        alignItems: 'end',
      }}
    >
      {versions.map((v, i) => {
        const frameStyle: React.CSSProperties = overrideHeight
          ? { height: overrideHeight }
          : { aspectRatio: overrideAspect ?? AUTHORED_ASPECTS[i] };
        return (
          <div key={v} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={{
                border: '1px solid var(--dir-border)',
                overflow: 'hidden',
                backgroundColor: 'var(--dir-muted)',
                ...frameStyle,
              }}
            >
              <Media
                project={project}
                role={v}
                style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
              />
            </div>
            <p style={{ ...MONO, fontSize: large ? 10 : 9, color: 'var(--dir-detail)', margin: 0 }}>{v}</p>
          </div>
        );
      })}
    </div>
  );
}

function ReleaseAspectFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ width: '100%', flexDirection: 'column' }}>
      <AuthoredVersionStack project={p} large />
      <div style={{ padding: 32 }}>
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

function ReleaseAspectStandard({
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
      <AuthoredVersionStack project={project} overrideAspect={mediaAspect} overrideHeight={mediaHeight} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <p style={{ ...MONO, color: 'var(--dir-text-primary)', margin: 0 }}>{project.label}</p>
          <span style={{ ...MONO, color: 'var(--dir-detail)', margin: 0 }}>{project.status}</span>
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

export function T6_S4({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<ReleaseAspectFeatured />}
      standards={supports.map((p) => <ReleaseAspectStandard project={p} />)}
    />
  );
}

export const T6_S4_renderers = {
  featured: (project: Project) => <ReleaseAspectFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <ReleaseAspectStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
