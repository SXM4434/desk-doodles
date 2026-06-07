import React from 'react';
import { FH_A } from './FH_A';
import { FH_B } from './FH_B';
import { FV_A } from './FV_A';
import { SV_A } from './SV_A';
import { SV_B } from './SV_B';
import { SH_A_Row } from './SH_A_Row';
import type { ShellId } from '../../state/ShellPickerContext';
import type { Project } from '../../data/projects';

type ShellProps = {
  project: Project;
  mediaAspect?: string;
  mediaHeight?: number;
};

const SHELL_COMPONENT: Record<ShellId, React.ComponentType<ShellProps>> = {
  'FH-A': FH_A,
  'FH-B': FH_B,
  'FV-A': FV_A,
  'SV-A': SV_A,
  'SV-B': SV_B,
  'SH-A-Row': SH_A_Row,
};

export function renderShell(
  shellId: ShellId,
  project: Project,
  opts?: { mediaAspect?: string; mediaHeight?: number },
): React.ReactElement {
  const Component = SHELL_COMPONENT[shellId];
  return (
    <Component
      project={project}
      mediaAspect={opts?.mediaAspect}
      mediaHeight={opts?.mediaHeight}
    />
  );
}

export const FEATURED_SHELL_IDS: ShellId[] = ['FH-A', 'FH-B', 'FV-A'];
export const STANDARD_SHELL_IDS: ShellId[] = ['SV-A', 'SV-B', 'SH-A-Row'];
