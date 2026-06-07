import React from 'react';
import { Page1120 } from './PageInset';
import { IS } from '../cards/tokens';
import { SV_A } from '../shells/SV_A';
import { supportProjects, primaryProject } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5c-L5 Track-Free Bento, Anchor-Free:
// Dual-axis variance without the unequal-gap artifact. Each row
// authors its own width-split AND its own row-height; row-mates
// share mediaHeight so there is never a flex-row with mismatched
// tile heights.
export function T5c_L5({ renderStandard }: ComboLayoutProps = {}) {
  const rows: {
    mh: number;
    tiles: { project: typeof primaryProject; flex: number }[];
  }[] = [
    {
      mh: 260,
      tiles: [
        { project: primaryProject, flex: 2 },
        { project: supportProjects[0], flex: 1 },
      ],
    },
    {
      mh: 200,
      tiles: [
        { project: supportProjects[1], flex: 1 },
        { project: supportProjects[2], flex: 2 },
      ],
    },
    {
      mh: 320,
      tiles: [
        { project: supportProjects[3], flex: 3 },
        { project: primaryProject, flex: 2 },
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
        Track-free bento · per-row width-split · per-row height · max 2 per row · uniform 24 gap
      </p>
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
