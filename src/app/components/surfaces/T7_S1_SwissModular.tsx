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

// T7-S1 Swiss Modular — Müller-Brockmann 12-col module grid inside the card.
// Title, media, meta occupy specific non-adjacent module blocks; white
// counterforms (empty modules) carry rhythm.

function ModuleCell({
  colStart,
  colSpan,
  rowStart,
  rowSpan,
  children,
  bordered = true,
  padded = true,
}: {
  colStart: number;
  colSpan: number;
  rowStart?: number;
  rowSpan?: number;
  children?: React.ReactNode;
  bordered?: boolean;
  padded?: boolean;
}) {
  return (
    <div
      style={{
        gridColumn: `${colStart} / span ${colSpan}`,
        gridRow: rowStart ? `${rowStart} / span ${rowSpan ?? 1}` : undefined,
        border: bordered ? '1px solid var(--dir-border)' : 'none',
        padding: padded ? 16 : 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  );
}

function SwissFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  return (
    <CardFrame style={{ width: '100%', padding: 24 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridAutoRows: 'minmax(80px, auto)',
          gap: 1,
          width: '100%',
          backgroundColor: 'var(--dir-border)',
        }}
      >
        <ModuleCell colStart={1} colSpan={3} rowStart={1} rowSpan={1}>
          <p
            style={{
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-primary)',
              margin: 0,
            }}
          >
            {p.label}
          </p>
          <p
            style={{
              fontFamily: IS,
              fontSize: 10,
              color: 'var(--dir-detail)',
              margin: 0,
              marginTop: 4,
            }}
          >
            {p.labelMeta}
          </p>
        </ModuleCell>
        <ModuleCell colStart={4} colSpan={5} rowStart={1} rowSpan={1} bordered={false} padded={false} />
        <ModuleCell colStart={9} colSpan={4} rowStart={1} rowSpan={1}>
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
            Cat. 001 / {p.status}
          </p>
        </ModuleCell>

        <ModuleCell colStart={1} colSpan={6} rowStart={2} rowSpan={2}>
          <h2
            style={{
              fontFamily: IS,
              fontSize: 40,
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: 'var(--dir-text-primary)',
              margin: 0,
            }}
          >
            {p.title}
          </h2>
        </ModuleCell>
        <ModuleCell colStart={7} colSpan={6} rowStart={2} rowSpan={2} bordered={false} padded={false}>
          <Media project={p} role="Featured" style={{ width: '100%', height: '100%', aspectRatio: 'auto' }} />
        </ModuleCell>

        <ModuleCell colStart={1} colSpan={3} rowStart={4} rowSpan={1}>
          <p
            style={{
              fontFamily: IS,
              fontSize: 12,
              fontWeight: 300,
              lineHeight: 1.55,
              color: 'var(--dir-text-secondary)',
              margin: 0,
              marginBottom: 8,
            }}
          >
            {p.framingCompressed}
          </p>
          <TagList tags={p.tags} typeTag={p.typeTag} max={3} size="compact" nativeMode="hidden" />
        </ModuleCell>
        <ModuleCell colStart={4} colSpan={3} rowStart={4} rowSpan={1}>
          {p.proof[0] && <ProofStat value={p.proof[0].value} label={p.proof[0].label} sub={p.proof[0].sub} />}
        </ModuleCell>
        <ModuleCell colStart={7} colSpan={3} rowStart={4} rowSpan={1}>
          {p.proof[1] && <ProofStat value={p.proof[1].value} label={p.proof[1].label} sub={p.proof[1].sub} />}
        </ModuleCell>
        <ModuleCell colStart={10} colSpan={3} rowStart={4} rowSpan={1} padded>
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
            Action
          </p>
          <div style={{ marginTop: 'auto' }}>
            <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
          </div>
        </ModuleCell>
      </div>
    </CardFrame>
  );
}

function SwissStandard({ project }: { project: Project }) {
  return (
    <CardFrame style={{ flexDirection: 'column', height: '100%', padding: 12 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gridAutoRows: 'minmax(40px, auto)',
          gap: 1,
          backgroundColor: 'var(--dir-border)',
          flex: 1,
        }}
      >
        <ModuleCell colStart={1} colSpan={4} rowStart={1} rowSpan={1}>
          <p
            style={{
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-primary)',
              margin: 0,
            }}
          >
            {project.label}
          </p>
        </ModuleCell>
        <ModuleCell colStart={5} colSpan={2} rowStart={1} rowSpan={1} bordered padded>
          <p style={{ fontFamily: IS, fontSize: 9, color: 'var(--dir-detail)', margin: 0, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {project.typeTag}
          </p>
        </ModuleCell>
        <ModuleCell colStart={1} colSpan={6} rowStart={2} rowSpan={1} bordered={false} padded={false}>
          <Media project={project} role="Standard" />
        </ModuleCell>
        <ModuleCell colStart={1} colSpan={6} rowStart={3} rowSpan={1}>
          <h3
            style={{
              fontFamily: IS,
              fontSize: 17,
              fontWeight: 500,
              lineHeight: 1.2,
              letterSpacing: '-0.015em',
              color: 'var(--dir-text-primary)',
              margin: 0,
              marginBottom: 8,
            }}
          >
            {project.title}
          </h3>
          <p style={{ fontFamily: IS, fontSize: 12, fontWeight: 300, lineHeight: 1.55, color: 'var(--dir-text-secondary)', margin: 0 }}>
            {project.framingEditorial}
          </p>
        </ModuleCell>
        <ModuleCell colStart={1} colSpan={4} rowStart={4} rowSpan={1}>
          <TagList tags={project.tags} typeTag={project.typeTag} max={2} />
        </ModuleCell>
        <ModuleCell colStart={5} colSpan={2} rowStart={4} rowSpan={1}>
          <div style={{ marginLeft: 'auto' }}>
            <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
          </div>
        </ModuleCell>
      </div>
    </CardFrame>
  );
}

export function T7_S1({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<SwissFeatured />}
      standards={supports.map((p) =>
        standardShell === 'sv-b' ? <SV_B project={p} /> : <SwissStandard project={p} />,
      )}
    />
  );
}

export const T7_S1_renderers = {
  featured: (project: Project) => <SwissFeatured project={project} />,
  standard: (project: Project, opts?: { shell?: StandardShell; mediaAspect?: string; mediaHeight?: number }) =>
    opts?.shell === 'sv-b'
      ? <SV_B project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />
      : <SwissStandard project={project} />,
};
