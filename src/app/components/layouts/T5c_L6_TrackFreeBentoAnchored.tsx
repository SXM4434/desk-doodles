import React from 'react';
import { Page1120 } from './PageInset';
import { IS } from '../cards/tokens';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { supportProjects, primaryProject } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5c-L6 Track-Free Bento, With Anchor:
// Anchored companion to T5c-L5. FH-A hero absorbs first-hit; below,
// per-row width-split + per-row height dual-axis field.
export function T5c_L6({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const rows: {
    mh: number;
    tiles: { project: typeof primaryProject; flex: number }[];
  }[] = [
    {
      mh: 220,
      tiles: [
        { project: supportProjects[0], flex: 2 },
        { project: supportProjects[1], flex: 1 },
      ],
    },
    {
      mh: 300,
      tiles: [
        { project: supportProjects[2], flex: 1 },
        { project: supportProjects[3], flex: 2 },
      ],
    },
    {
      mh: 180,
      tiles: [
        { project: supportProjects[1], flex: 1 },
        { project: supportProjects[0], flex: 1 },
      ],
    },
  ];

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
        Featured anchor · track-free bento below · per-row width-split · per-row height · uniform 24 gap
      </p>
      <div style={{ marginBottom: 48 }}>
        {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 24 }}>
            {row.tiles.map((t, ti) => (
              <div key={ti} style={{ flex: t.flex, minWidth: 0 }}>
                {renderStandard
                  ? renderStandard(t.project, { mediaHeight: row.mh })
                  : <SV_A project={t.project} mediaHeight={row.mh} />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Page1120>
  );
}
