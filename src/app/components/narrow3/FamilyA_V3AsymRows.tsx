import React from 'react';
import { Page1120 } from '../layouts/PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';
import { HeroBandPlaceholder } from './HeroBandPlaceholder';

// Family A · V3 Asymmetric Rows — Anchored Work Field with paired rows at
// row-over-row width inversion. FH-A hero anchors on top; below, two rows
// where left/right widths are asymmetric and alternate (3/2 then 2/3).
// Authored per-tile aspects (1512:1024, 4:5, 1:1, 16:9) drive height variance.
// T5b-L7 / billguo.me register.
//
// Hero #8 scaffolding (added 2026-05-26): HeroBandPlaceholder renders above
// the featured card as Family A's page-entry register.
export function FamilyA_V3AsymRows({ renderFeatured, renderStandard, renderHero }: ComboLayoutProps = {}) {
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
      {renderHero ? renderHero() : <HeroBandPlaceholder />}
      <div style={{ marginBottom: 64 }}>
        {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        <div style={rowStyle}>
          <div style={{ flex: 3, minWidth: 0 }}>{renderTile(s0, '1512 / 1024')}</div>
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
