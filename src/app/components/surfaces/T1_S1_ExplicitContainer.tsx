import React from 'react';
import { SurfacePage } from './SurfacePage';
import { FH_B } from '../shells/FH_B';
import { SV_A } from '../shells/SV_A';
import { SV_B } from '../shells/SV_B';
import { primaryProject, supportProjects, type Project } from '../../data/projects';
import type { StandardShell } from './candidates';

// T1-S1 — Explicit Container Baseline.
// The locked card system rendered at full strength. FH-B Featured + SV-A or SV-B
// grid below. No authored surface move — this is the reference against which
// every other candidate is measured.
export function T1_S1({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<FH_B project={primaryProject} />}
      standards={supports.map((p) =>
        standardShell === 'sv-b' ? <SV_B project={p} /> : <SV_A project={p} />,
      )}
    />
  );
}

export const T1_S1_renderers = {
  featured: (project: Project) => <FH_B project={project} />,
  standard: (project: Project, opts?: { shell?: StandardShell; mediaAspect?: string; mediaHeight?: number }) =>
    opts?.shell === 'sv-b'
      ? <SV_B project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />
      : <SV_A project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
