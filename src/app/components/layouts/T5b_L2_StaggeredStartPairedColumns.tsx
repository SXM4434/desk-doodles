import React from 'react';
import { Page1120 } from './PageInset';
import { IS } from '../cards/tokens';
import { SV_A } from '../shells/SV_A';
import { supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5b-L2 Staggered-Start Paired Columns:
// Rachelchen.tech register. Same independent-flex-column mechanism as
// T5b-L1, but the right column begins lower than the left — an authored
// Y-offset sits at the top of the right column. The offset is a ladder
// value (96), not a tweaked pixel nudge.
//
// Distinct from T5b-L1 (same mechanism, both columns start at identical
// Y) and T5a-L2 (auto-flow masonry). Aspect variance authored per slot
// via SV_A mediaAspect — asset pool aspect (16:9) is overridden.
export function T5b_L2({ renderStandard }: ComboLayoutProps = {}) {
  const [s0, s1, s2, s3] = supportProjects;

  const columnBase: React.CSSProperties = {
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
        Paired columns · staggered start (96) · authored aspect variance
      </p>
      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        <div style={columnBase}>
          {renderTile(s0, '3 / 4')}
          {renderTile(s2, '16 / 9')}
        </div>
        <div style={{ ...columnBase, paddingTop: 96 }}>
          {renderTile(s1, '4 / 3')}
          {renderTile(s3, '1 / 1')}
        </div>
      </div>
    </Page1120>
  );
}
