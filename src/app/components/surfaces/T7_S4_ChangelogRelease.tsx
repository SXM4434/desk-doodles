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

// T7-S4 Changelog Release — Linear / Vercel changelog register.
// Version tag + date + terse title + bulleted change list + media.
// Every project becomes a "log entry," not a showcase.

const MONO: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", "SF Mono", Menlo, monospace',
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

function VersionBadge({ value }: { value: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 8px',
        fontFamily: '"JetBrains Mono", "SF Mono", Menlo, monospace',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.08em',
        color: 'var(--dir-bg)',
        backgroundColor: 'var(--dir-text-primary)',
        borderRadius: 4,
      }}
    >
      {value}
    </span>
  );
}

function changesFor(project: Project): string[] {
  if (project.id === 'ion') {
    return [
      'Shipped Slack + Canvas surfaces',
      'Launched Ruby clarify-before-execution contract',
      '5 guardrails for trust + control',
      'No team stack change required',
    ];
  }
  return project.tags.slice(0, 3).map((t) => `Explored ${t.toLowerCase()} register`);
}

function ChangelogFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  const changes = changesFor(p);
  return (
    <CardFrame style={{ width: '100%', flexDirection: 'column' }}>
      <div
        style={{
          padding: '16px 32px',
          borderBottom: '1px solid var(--dir-border)',
          backgroundColor: 'var(--dir-recessed)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <VersionBadge value="v1.0" />
        <span style={{ ...MONO, color: 'var(--dir-text-primary)', margin: 0 }}>{p.label}</span>
        <span style={{ ...MONO, color: 'var(--dir-detail)', margin: 0 }}>{p.labelMeta}</span>
        <span style={{ marginLeft: 'auto', ...MONO, color: 'var(--dir-detail)', margin: 0 }}>{p.status}</span>
      </div>
      <div style={{ display: 'flex', minHeight: 360 }}>
        <div style={{ flex: 1, padding: 32 }}>
          <h2
            style={{
              fontFamily: IS,
              fontSize: 26,
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
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {changes.map((c, i) => (
              <li
                key={i}
                style={{
                  fontFamily: IS,
                  fontSize: 13,
                  fontWeight: 400,
                  lineHeight: 1.7,
                  color: 'var(--dir-text-secondary)',
                  paddingLeft: 16,
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '0.7em',
                    width: 6,
                    height: 1,
                    backgroundColor: 'var(--dir-detail)',
                  }}
                />
                {c}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 24 }}>
            <TagList
              tags={p.tags}
              typeTag={p.typeTag}
              nativeMode="hidden"
            />
          </div>
          <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
            {p.ctaSecondary && <PillCTA variant="text">{p.ctaSecondary} →</PillCTA>}
          </div>
        </div>
        <div style={{ width: '44%', flexShrink: 0, borderLeft: '1px solid var(--dir-border)', display: 'flex' }}>
          <Media project={p} role="Featured" style={{ flex: 1, aspectRatio: 'auto' }} />
        </div>
      </div>
    </CardFrame>
  );
}

function ChangelogStandard({
  project,
  version,
  mediaAspect,
  mediaHeight,
}: {
  project: Project;
  version: string;
  mediaAspect?: string;
  mediaHeight?: number;
}) {
  const changes = changesFor(project).slice(0, 2);
  const mediaStyle: React.CSSProperties | undefined = mediaHeight
    ? { height: mediaHeight, aspectRatio: 'auto' }
    : mediaAspect
      ? { aspectRatio: mediaAspect }
      : undefined;
  return (
    <CardFrame style={{ flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid var(--dir-border)',
          backgroundColor: 'var(--dir-recessed)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <VersionBadge value={version} />
        <span style={{ ...MONO, color: 'var(--dir-detail)', margin: 0, fontSize: 9 }}>{project.label}</span>
        <span style={{ marginLeft: 'auto', ...MONO, color: 'var(--dir-detail)', margin: 0, fontSize: 9 }}>{project.status}</span>
      </div>
      <Media project={project} role="Standard" style={mediaStyle} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3
          style={{
            fontFamily: IS,
            fontSize: 16,
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
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {changes.map((c, i) => (
            <li
              key={i}
              style={{
                fontFamily: IS,
                fontSize: 12,
                fontWeight: 400,
                lineHeight: 1.55,
                color: 'var(--dir-text-secondary)',
                paddingLeft: 12,
                position: 'relative',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '0.65em',
                  width: 5,
                  height: 1,
                  backgroundColor: 'var(--dir-detail)',
                }}
              />
              {c}
            </li>
          ))}
        </ul>
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

export function T7_S4({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  const versions = ['v0.9', 'v0.7', 'v0.4'];
  return (
    <SurfacePage
      featured={<ChangelogFeatured />}
      standards={supports.map((p, i) =>
        standardShell === 'sv-b' ? <SV_B project={p} /> : <ChangelogStandard project={p} version={versions[i]} />,
      )}
    />
  );
}

export const T7_S4_renderers = {
  featured: (project: Project) => <ChangelogFeatured project={project} />,
  standard: (project: Project, opts?: { shell?: StandardShell; mediaAspect?: string; mediaHeight?: number }) =>
    opts?.shell === 'sv-b'
      ? <SV_B project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />
      : <ChangelogStandard project={project} version="v0.9" mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
