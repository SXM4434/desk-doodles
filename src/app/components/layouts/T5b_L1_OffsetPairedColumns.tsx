import React from 'react';
import { Page1120 } from './PageInset';
import { IS } from '../cards/tokens';
import { SV_A } from '../shells/SV_A';
import { supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5b-L1 Offset Paired Columns:
// Emmiwu.com register. Two independent flex columns side by side —
// each column is its own vertical stack and advances at its own pace
// because its cards carry authored aspect variance. Row registration
// is never attempted (no grid, no masonry algorithm). Both columns
// start at the same Y.
//
// Distinct from T5a-L2 Two-Column Masonry (CSS columns auto-flow with
// uniform shells) and T5b-L2 Staggered-Start Paired Columns (same
// mechanism + intentional Y-offset). Aspect variance authored per slot
// via SV_A mediaAspect — asset pool aspect (16:9) is overridden.
export function T5b_L1({ renderStandard }: ComboLayoutProps = {}) {
  const [s0, s1, s2, s3] = supportProjects;

  const columnStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
    minWidth: 0,
  };

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
        Paired columns · equal start Y · authored aspect variance
      </p>
      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        <div style={columnStyle}>
          {renderTile(s0, '4 / 3')}
          {renderTile(s2, '3 / 4')}
        </div>
        <div style={columnStyle}>
          {renderTile(s1, '1 / 1')}
          {renderTile(s3, '16 / 9')}
        </div>
      </div>
    </Page1120>
  );
}
