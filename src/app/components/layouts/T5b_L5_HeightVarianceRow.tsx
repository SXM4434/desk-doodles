import React from 'react';
import { Page1120 } from './PageInset';
import { IS } from '../cards/tokens';
import { SV_A } from '../shells/SV_A';
import { supportProjects, primaryProject } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5b-L5 Height-Variance Field, Anchor-Free:
// Aspect-variance demonstration as a 2-column masonry. Two equal-
// width columns (flex 1 each) stack independently; each tile inside a
// column authors its own aspect, so heights vary per tile.
export function T5b_L5({ renderStandard }: ComboLayoutProps = {}) {
  const cols: { project: typeof primaryProject; aspect: string }[][] = [
    [
      { project: primaryProject, aspect: '4 / 3' },
      { project: supportProjects[1], aspect: '3 / 4' },
    ],
    [
      { project: supportProjects[0], aspect: '1 / 1' },
      { project: supportProjects[2], aspect: '16 / 9' },
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
        Height-only variance · 2-column masonry · equal widths · authored aspects
      </p>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {cols.map((col, ci) => (
          <div
            key={ci}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            {col.map((t, ti) => (
              <React.Fragment key={ti}>
                {renderStandard
                  ? renderStandard(t.project, { mediaAspect: t.aspect })
                  : <SV_A project={t.project} mediaAspect={t.aspect} />}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </Page1120>
  );
}
