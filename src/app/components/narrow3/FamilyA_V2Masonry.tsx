import React from 'react';
import { Page1120 } from '../layouts/PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';
import { HeroBandPlaceholder } from './HeroBandPlaceholder';

// Family A · V2 Masonry — Anchored Work Field with column-flow masonry.
// FH-A hero anchors on top; below, CSS columns:2 + break-inside:avoid so
// each tile claims its own flow position. Authored per-slot aspects
// (3:2 / 1:1 / 3:4 / 16:9) surface the advance-mismatch principle.
//
// Hero #8 scaffolding (added 2026-05-26): HeroBandPlaceholder renders above
// the featured card as Family A's page-entry register.
export function FamilyA_V2Masonry({ renderFeatured, renderStandard, renderHero }: ComboLayoutProps = {}) {
  const [s0, s1, s2, s3] = supportProjects;
  const tiles: Array<{ project: typeof s0; aspect: string }> = [
    { project: s0, aspect: '3 / 2' },
    { project: s1, aspect: '1 / 1' },
    { project: s2, aspect: '3 / 4' },
    { project: s3, aspect: '16 / 9' },
  ];
  return (
    <Page1120>
      {renderHero ? renderHero() : <HeroBandPlaceholder />}
      <div style={{ marginBottom: 48 }}>
        {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
      </div>
      <div style={{ columns: 2, columnGap: 32 }}>
        {tiles.map((t) => (
          <div key={t.project.id} style={{ breakInside: 'avoid', marginBottom: 32 }}>
            {renderStandard
              ? renderStandard(t.project, { mediaAspect: t.aspect })
              : <SV_A project={t.project} mediaAspect={t.aspect} />}
          </div>
        ))}
      </div>
    </Page1120>
  );
}
