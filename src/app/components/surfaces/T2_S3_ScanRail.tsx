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

// T2-S3 Scan-Rail Surface — proof row formalized as a bottom-rail on Featured
// (full-width band, recessed background, tabular-nums). Standard tag cluster
// elevated as a top-rail strip above media. SV-B variant: tiny proof line
// formalized as a rail at the card head.
function ScanRailFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ minHeight: 460, width: '100%', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flex: 1 }}>
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
            <p
              style={{
                fontFamily: IS,
                fontSize: 13,
                fontWeight: 300,
                lineHeight: 1.6,
                color: 'var(--dir-text-secondary)',
                maxWidth: 360,
                margin: 0,
              }}
            >
              {p.framingCompressed}
            </p>
          </div>
          <div>
            <TagList tags={p.tags} typeTag={p.typeTag} nativeMode="hidden" />
            <div style={{ marginTop: 16, marginBottom: 24 }}>
              <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 64,
          borderTop: '1px solid var(--dir-border)',
          backgroundColor: 'var(--dir-recessed)',
          padding: '16px 32px',
        }}
      >
        {p.proof.map((s) => (
          <ProofStat key={s.label} value={s.value} label={s.label} sub={s.sub} />
        ))}
      </div>
    </CardFrame>
  );
}

function ScanRailStandardSvA({
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
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--dir-border)',
          backgroundColor: 'var(--dir-recessed)',
        }}
      >
        <TagList tags={project.tags} typeTag={project.typeTag} />
      </div>
      <Media project={project} role="Standard" style={mediaStyle} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 24 }}>
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
        <div style={{ marginTop: 'auto' }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

function ScanRailStandardSvB({
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
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--dir-border)',
          backgroundColor: 'var(--dir-recessed)',
          fontFamily: IS,
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--dir-text-primary)',
          letterSpacing: '0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {tiny}
      </div>
      <Media project={project} role="Standard" style={mediaStyle} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 24 }}>
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
        <div style={{ marginBottom: 16 }}>
          <TagList tags={project.tags} typeTag={project.typeTag} nativeMode="hidden" />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </CardFrame>
  );
}

export function T2_S3({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<ScanRailFeatured />}
      standards={supports.map((p) =>
        standardShell === 'sv-b'
          ? <ScanRailStandardSvB project={p} />
          : <ScanRailStandardSvA project={p} />,
      )}
    />
  );
}

export const T2_S3_renderers = {
  featured: (project: Project) => <ScanRailFeatured project={project} />,
  standard: (project: Project, opts?: { shell?: StandardShell; mediaAspect?: string; mediaHeight?: number }) =>
    opts?.shell === 'sv-b'
      ? <ScanRailStandardSvB project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />
      : <ScanRailStandardSvA project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
