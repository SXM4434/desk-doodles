import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import { SV_B } from '../shells/SV_B';
import type { StandardShell } from './candidates';
import { primaryProject, supportProjects } from '../../data/projects';
import type { Project } from '../../data/projects';

// T5-S6 Chip Cluster — three labeled pill clusters (stack / year / domain)
// foregrounded above the title. Classification carries first weight; title
// and framing sit below a hairline rule as secondary register.

function ClusterChip({ heading, value }: { heading: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
        {heading}
      </p>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 12px',
          fontFamily: IS,
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--dir-text-primary)',
          backgroundColor: 'var(--dir-recessed)',
          border: '1px solid var(--dir-border)',
          borderRadius: 9999,
          alignSelf: 'flex-start',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ChipClusterFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ minHeight: 440, width: '100%' }}>
      <div style={{ width: '48%', flexShrink: 0, borderRight: '1px solid var(--dir-border)', display: 'flex' }}>
        <Media project={p} role="Featured" style={{ flex: 1, aspectRatio: 'auto' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 48 }}>
        <div style={{ display: 'flex', gap: 32, marginBottom: 32, flexWrap: 'wrap' }}>
          <ClusterChip heading="Domain" value={p.typeTag} />
          <ClusterChip heading="Stack" value={p.tags[0]} />
          <ClusterChip heading="Status" value={p.status} />
        </div>
        <div style={{ height: 1, width: '100%', backgroundColor: 'var(--dir-border)', marginBottom: 24 }} />
        <p
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--dir-text-primary)',
            margin: 0,
            marginBottom: 16,
          }}
        >
          {p.label}
        </p>
        <h2
          style={{
            fontFamily: IS,
            fontSize: 24,
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
        <p
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.7,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 'auto',
          }}
        >
          {p.framingFull}
        </p>
        <div style={{ marginTop: 24 }}>
          <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

function ChipClusterStandard({
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
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <ClusterChip heading="Domain" value={project.typeTag} />
          <ClusterChip heading="Status" value={project.status} />
        </div>
        <div style={{ height: 1, width: '100%', backgroundColor: 'var(--dir-border)', marginBottom: 16 }} />
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
          }}
        >
          {project.framingEditorial}
        </p>
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

export function T5_S6({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<ChipClusterFeatured />}
      standards={supports.map((p) =>
        standardShell === 'sv-b' ? <SV_B project={p} /> : <ChipClusterStandard project={p} />,
      )}
    />
  );
}

export const T5_S6_renderers = {
  featured: (project: Project) => <ChipClusterFeatured project={project} />,
  standard: (project: Project, opts?: { shell?: StandardShell; mediaAspect?: string; mediaHeight?: number }) =>
    opts?.shell === 'sv-b'
      ? <SV_B project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />
      : <ChipClusterStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
