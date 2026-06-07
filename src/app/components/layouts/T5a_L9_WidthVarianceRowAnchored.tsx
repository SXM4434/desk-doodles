import React from 'react';
import { Page1120 } from './PageInset';
import { IS } from '../cards/tokens';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { supportProjects, primaryProject } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5a-L9 Width-Variance Field, With Anchor:
// Anchored companion to T5a-L8. FH-A hero absorbs first-hit; field
// below is max 2 cards per row with authored width splits. Shared
// shelf height, gap uniform at 24.
//
// Distinct from T5a-L5 Featured + Alternating Two-Up (anchor + 2-up
// alternation at equal widths), T5b-L6 (anchor + height variance).
// Reads as hero + bounded width-rhythm field below.
export function T5a_L9({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const SHELF_HEIGHT = 280;
  const rows: { project: typeof primaryProject; flex: number }[][] = [
    [
      { project: supportProjects[0], flex: 1 },
      { project: supportProjects[1], flex: 2 },
    ],
    [
      { project: supportProjects[2], flex: 2 },
      { project: supportProjects[3], flex: 1 },
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
        Featured anchor · width-only variance below · max 2 per row · mirrored splits
      </p>
      <div style={{ marginBottom: 48 }}>
        {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
      </div>
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
