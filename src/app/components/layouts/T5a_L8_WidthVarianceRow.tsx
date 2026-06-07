import React from 'react';
import { Page1120 } from './PageInset';
import { IS } from '../cards/tokens';
import { SV_A } from '../shells/SV_A';
import { supportProjects, primaryProject } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5a-L8 Width-Variance Field, Anchor-Free:
// Pure span-variance demonstration. Max 2 cards per row; each row
// has a different authored width split. Shared shelf height (280px)
// keeps heights constant so only widths vary. Gap uniform at 24 on
// both axes.
//
// Mechanism: flex-row per row, flex values in [1, 2] only — max 2:1
// ratio per row, never more than 2 tiles side by side. Row 1 = 2:1,
// row 2 = 1:2 (mirrored). Width variance reads across rows, not as
// a single dense shelf.
export function T5a_L8({ renderStandard }: ComboLayoutProps = {}) {
  const SHELF_HEIGHT = 280;
  const rows: { project: typeof primaryProject; flex: number }[][] = [
    [
      { project: primaryProject, flex: 2 },
      { project: supportProjects[0], flex: 1 },
    ],
    [
      { project: supportProjects[1], flex: 1 },
      { project: supportProjects[2], flex: 2 },
    ],
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
        Width-only variance · max 2 cards per row · mirrored 2:1 splits · shared shelf height
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {rows.map((row, ri) => (
          <div
            key={ri}
            style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}
          >
            {row.map((t, ti) => (
              <div key={ti} style={{ flex: t.flex, minWidth: 0 }}>
                {renderStandard
                  ? renderStandard(t.project, { mediaHeight: SHELF_HEIGHT })
                  : <SV_A project={t.project} mediaHeight={SHELF_HEIGHT} />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Page1120>
  );
}
