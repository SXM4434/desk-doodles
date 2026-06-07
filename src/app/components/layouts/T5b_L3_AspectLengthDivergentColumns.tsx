import React from 'react';
import { Page1120 } from './PageInset';
import { IS } from '../cards/tokens';
import { SV_A } from '../shells/SV_A';
import { supportProjects, primaryProject } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5b-L3 Aspect-Length Divergent Columns:
// Emmiwu.com register intensified. Two independent flex columns, equal
// start Y, but the per-slot aspect choices are stacked so that one
// column runs visibly longer than the other — the inequality of column
// height is the composition, not an accident.
export function T5b_L3({ renderStandard }: ComboLayoutProps = {}) {
  const [s0, s1, s2] = supportProjects;

  const renderTile = (p: typeof s0, aspect: string) =>
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
        Paired columns · authored length divergence ≥ 1 card
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
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
            minWidth: 0,
          }}
        >
          {renderTile(primaryProject, '2 / 3')}
          {renderTile(s0, '3 / 4')}
          {renderTile(s2, '4 / 5')}
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
            minWidth: 0,
          }}
        >
          {renderTile(s1, '4 / 3')}
          {renderTile(primaryProject, '16 / 9')}
        </div>
      </div>
    </Page1120>
  );
}
