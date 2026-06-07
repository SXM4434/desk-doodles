import React from 'react';
import { Page1120 } from './PageInset';
import { IS } from '../cards/tokens';
import { SV_A } from '../shells/SV_A';
import { supportProjects, primaryProject } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5c-L2 Dual-Axis Variance, Anchor-Free:
// Two independent column tracks at UNEQUAL widths (4fr wide + 2fr narrow),
// with authored per-tile aspect variance in each track. Dual-axis means:
// (axis 1) column widths vary between tracks — span variance at track
// level; (axis 2) aspects vary per tile within each track.
export function T5c_L2({ renderStandard }: ComboLayoutProps = {}) {
  const renderTile = (p: typeof primaryProject, aspect: string) =>
    renderStandard
      ? renderStandard(p, { mediaAspect: aspect })
      : <SV_A project={p} mediaAspect={aspect} />;

  return (
    <Page1120>
      <p
        style={{
          fontFamily: IS,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-text-secondary)',
          margin: 0,
          marginBottom: 16,
          paddingBottom: 16,
          borderBottom: '1px solid var(--dir-border)',
        }}
      >
        Dual-axis variance · no anchor · 4fr wide / 2fr narrow tracks
      </p>
      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            flex: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            minWidth: 0,
          }}
        >
          {renderTile(primaryProject, '21 / 9')}
          {renderTile(supportProjects[1], '16 / 9')}
          {renderTile(supportProjects[2], '4 / 3')}
        </div>
        <div
          style={{
            flex: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            minWidth: 0,
          }}
        >
          {renderTile(supportProjects[3], '1 / 1')}
          {renderTile(supportProjects[0], '3 / 4')}
          {renderTile(supportProjects[2], '9 / 16')}
        </div>
      </div>
    </Page1120>
  );
}
