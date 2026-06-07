import React from 'react';
import { Page1120 } from './PageInset';
import { IS } from '../cards/tokens';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { supportProjects, primaryProject } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5b-L7 Featured Anchor + Asymmetric Paired Rows:
// Billguo.me register. Full-width FH-A hero anchors the top; below,
// two paired rows where each row splits left/right at asymmetric
// flex ratios (row 1 = 3/2, row 2 = 2/3). Widths differ per-slot and
// alternate row-over-row; authored aspects drive height variance.
// Distinct from T5b-L4 (equal-width columns below anchor) and T5b-L6
// (equal-width masonry below anchor) — the asymmetry lives inside
// each row here, not just in heights.
export function T5b_L7({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const [s0, s1, s2, s3] = supportProjects;

  const renderTile = (p: typeof s0, aspect: string) =>
    renderStandard
      ? renderStandard(p, { mediaAspect: aspect })
      : <SV_A project={p} mediaAspect={aspect} />;

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 32,
    alignItems: 'flex-start',
  };

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
        Featured anchor · asymmetric paired rows · alternating weight
      </p>
      <div style={{ marginBottom: 64 }}>
        {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        <div style={rowStyle}>
          <div style={{ flex: 3, minWidth: 0 }}>{renderTile(s0, '16 / 10')}</div>
          <div style={{ flex: 2, minWidth: 0 }}>{renderTile(s1, '4 / 5')}</div>
        </div>
        <div style={rowStyle}>
          <div style={{ flex: 2, minWidth: 0 }}>{renderTile(s2, '1 / 1')}</div>
          <div style={{ flex: 3, minWidth: 0 }}>{renderTile(s3, '16 / 9')}</div>
        </div>
      </div>
    </Page1120>
  );
}
