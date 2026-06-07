import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { ProofStat } from '../cards/CardAtoms';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import { primaryProject, supportProjects, type Project } from '../../data/projects';
import type { StandardShell } from './candidates';

// T3-S2 Dossier Label Surface — labeled-record register. Metadata block
// foregrounded as the identifier: scope / provenance / relation atoms do real
// work. Title reads in relation to the label, not prior to it.
function DossierRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '104px 1fr',
        gap: 16,
        padding: '8px 0',
        borderBottom: '1px solid var(--dir-border)',
      }}
    >
      <span
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--dir-detail)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: IS,
          fontSize: 13,
          fontWeight: 400,
          color: 'var(--dir-text-primary)',
          letterSpacing: '0.01em',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function DossierLabelFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ minHeight: 460, width: '100%' }}>
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
            Dossier · {p.label}
          </p>
          <div style={{ marginBottom: 24 }}>
            <DossierRow label="Title" value={p.title} />
            <DossierRow label="Scope" value="Platform system · internal tooling" />
            <DossierRow label="Provenance" value={p.labelMeta ?? '—'} />
          </div>
          <p
            style={{
              fontFamily: IS,
              fontSize: 13,
              fontWeight: 300,
              lineHeight: 1.6,
              color: 'var(--dir-text-secondary)',
              maxWidth: 360,
              margin: 0,
              marginBottom: 16,
            }}
          >
            {p.framingCompressed}
          </p>
          <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
            {p.proof.map((s) => (
              <ProofStat key={s.label} value={s.value} label={s.label} sub={s.sub} />
            ))}
          </div>
          <TagList
            tags={p.tags}
            typeTag={p.typeTag}
            nativeMode="hidden"
          />
        </div>
        <div style={{ marginTop: 24 }}>
          <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

function DossierLabelStandardSvA({
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
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.14em',
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
        <div style={{ marginBottom: 12 }}>
          <DossierRow label="Scope" value={project.tags[0] ?? '—'} />
        </div>
        <p
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.55,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 16,
          }}
        >
          {project.framingCompressed}
        </p>
        <TagList
          tags={project.tags}
          typeTag={project.typeTag}
          size="compact"
          nativeMode="hidden"
        />
        <div style={{ marginTop: 'auto' }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

function DossierLabelStandardSvB({
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
        <div style={{ marginBottom: 12 }}>
          <DossierRow label="Scope" value={project.tags[0] ?? '—'} />
        </div>
        <p
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.6,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 12,
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
            paddingTop: 8,
            margin: 0,
            marginBottom: 16,
            letterSpacing: '0.01em',
          }}
        >
          {tiny}
        </p>
        <TagList
          tags={project.tags}
          typeTag={project.typeTag}
          size="compact"
          nativeMode="hidden"
        />
        <div style={{ marginTop: 'auto' }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

export function T3_S2({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<DossierLabelFeatured />}
      standards={supports.map((p) =>
        standardShell === 'sv-b'
          ? <DossierLabelStandardSvB project={p} />
          : <DossierLabelStandardSvA project={p} />,
      )}
    />
  );
}

export const T3_S2_renderers = {
  featured: (project: Project) => <DossierLabelFeatured project={project} />,
  standard: (project: Project, opts?: { shell?: StandardShell; mediaAspect?: string; mediaHeight?: number }) =>
    opts?.shell === 'sv-b'
      ? <DossierLabelStandardSvB project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />
      : <DossierLabelStandardSvA project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
