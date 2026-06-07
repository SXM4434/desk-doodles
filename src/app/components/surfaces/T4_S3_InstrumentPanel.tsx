import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { CardFrame } from '../shells/CardFrame';
import { Media } from '../cards/Media';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
import { primaryProject, supportProjects, type Project } from '../../data/projects';
import type { StandardShell } from './candidates';

// T4-S3 Instrument Panel Surface — operational readout grammar. Proof
// numerals render as live metrics (tabular-nums, status chip, delta caret);
// labels read as operational descriptors (uppercase, small-caps, locked
// letter-spacing); tags recast as unit/status markers; title framed as
// operational report header.
function MetricCell({
  label,
  value,
  unit,
  delta,
  status = 'nominal',
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  status?: 'nominal' | 'watch' | 'hold';
}) {
  const statusColor =
    status === 'nominal'
      ? 'var(--dir-text-primary)'
      : status === 'watch'
        ? 'var(--dir-detail)'
        : 'var(--dir-text-secondary)';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '16px 16px',
        borderRight: '1px solid var(--dir-border)',
        flex: 1,
      }}
    >
      <span
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--dir-detail)',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span
          style={{
            fontFamily: IS,
            fontSize: 28,
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            color: 'var(--dir-text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            style={{
              fontFamily: IS,
              fontSize: 11,
              fontWeight: 400,
              color: 'var(--dir-detail)',
              letterSpacing: '0.04em',
            }}
          >
            {unit}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: statusColor,
          }}
        >
          ● {status}
        </span>
        {delta && (
          <span
            style={{
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 400,
              color: 'var(--dir-detail)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

function InstrumentPanelFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ minHeight: 480, width: '100%', flexDirection: 'column' }}>
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--dir-border)',
          backgroundColor: 'var(--dir-recessed)',
        }}
      >
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--dir-detail)',
            margin: 0,
          }}
        >
          Readout · {p.label} · {p.labelMeta}
        </p>
      </div>
      <div style={{ display: 'flex', flex: 1 }}>
        <div
          style={{
            width: '52%',
            flexShrink: 0,
            borderRight: '1px solid var(--dir-border)',
          }}
        >
          <Media project={p} role="Featured" style={{ width: '100%', height: '100%', aspectRatio: 'auto' }} />
        </div>
        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
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
                margin: 0,
              }}
            >
              {p.framingCompressed}
            </p>
            <div style={{ marginTop: 16 }}>
              <TagList
                tags={p.tags}
                typeTag={p.typeTag}
                nativeMode="hidden"
              />
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          borderTop: '1px solid var(--dir-border)',
          backgroundColor: 'var(--dir-recessed)',
        }}
      >
        {p.proof.map((s, i) => (
          <MetricCell
            key={s.label}
            label={s.label}
            value={s.value}
            unit={s.sub}
            delta={i === 0 ? '+18 / wk' : i === 1 ? '−12 / wk' : 'steady'}
            status={i === 0 ? 'nominal' : i === 1 ? 'watch' : 'nominal'}
          />
        ))}
      </div>
    </CardFrame>
  );
}

function InstrumentPanelStandardSvA({
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
          padding: '8px 16px',
          borderBottom: '1px solid var(--dir-border)',
          backgroundColor: 'var(--dir-recessed)',
        }}
      >
        <span
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--dir-detail)',
          }}
        >
          {project.typeTag}
        </span>
      </div>
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
            lineHeight: 1.55,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 16,
          }}
        >
          {project.framingCompressed}
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            borderTop: '1px solid var(--dir-border)',
            paddingTop: 12,
            marginBottom: 16,
          }}
        >
          {project.proof.slice(0, 2).map((s) => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontFamily: IS,
                  fontSize: 18,
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--dir-text-primary)',
                }}
              >
                {s.value}
              </span>
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
                {s.label}
              </span>
            </div>
          ))}
        </div>
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

function InstrumentPanelStandardSvB({
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
          padding: '8px 16px',
          borderBottom: '1px solid var(--dir-border)',
          backgroundColor: 'var(--dir-recessed)',
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--dir-detail)',
        }}
      >
        Readout · {project.typeTag}
      </div>
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
            lineHeight: 1.6,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 16,
          }}
        >
          {project.framingCompressed}
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            borderTop: '1px solid var(--dir-border)',
            paddingTop: 12,
            marginBottom: 16,
          }}
        >
          {project.proof.map((s) => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontFamily: IS,
                  fontSize: 15,
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--dir-text-primary)',
                }}
              >
                {s.value}
              </span>
              <span
                style={{
                  fontFamily: IS,
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--dir-detail)',
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
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

export function T4_S3({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<InstrumentPanelFeatured />}
      standards={supports.map((p) =>
        standardShell === 'sv-b'
          ? <InstrumentPanelStandardSvB project={p} />
          : <InstrumentPanelStandardSvA project={p} />,
      )}
    />
  );
}

export const T4_S3_renderers = {
  featured: (project: Project) => <InstrumentPanelFeatured project={project} />,
  standard: (project: Project, opts?: { shell?: StandardShell; mediaAspect?: string; mediaHeight?: number }) =>
    opts?.shell === 'sv-b'
      ? <InstrumentPanelStandardSvB project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />
      : <InstrumentPanelStandardSvA project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
