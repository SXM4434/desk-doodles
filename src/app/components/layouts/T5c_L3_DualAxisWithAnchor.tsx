import React from 'react';
import { Page1120 } from './PageInset';
import { IS } from '../cards/tokens';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { supportProjects, primaryProject } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5c-L3 Dual-Axis Variance, With Anchor:
// Anchored companion to T5c-L2. FH-A hero at top establishes hierarchy;
// below, two independent column tracks at UNEQUAL widths (4fr wide +
// 2fr narrow) carry authored per-tile aspect variance.
export function T5c_L3({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
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
        Featured anchor · dual-axis variance below · 4fr / 2fr tracks
      </p>
      <div style={{ marginBottom: 48 }}>
        {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
      </div>
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
          {renderTile(supportProjects[0], '21 / 9')}
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
          {renderTile(supportProjects[3], '9 / 16')}
          {renderTile(supportProjects[1], '1 / 1')}
        </div>
      </div>
    </Page1120>
  );
}
