import React from 'react';
import { Page1120 } from '../layouts/PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';
import { HeroBandPlaceholder } from './HeroBandPlaceholder';

// Family A · V1 Grid — Anchored Work Field with 2-up pairs.
// FH-A hero anchors on top; below, 2 pairs of equal-width tiles at 16px
// intra-pair gap and 64px inter-pair gap (T1-L3 ratio 1:4 — above the 1:1.5
// Gestalt threshold below which the pair read collapses to grid).
//
// Hero #8 scaffolding (added 2026-05-26): HeroBandPlaceholder renders above
// the featured card as Family A's page-entry register. Horizontal-band
// placement, parallel to Family B's vertical-column IdentityAside.
export function FamilyA_V1Grid({ renderFeatured, renderStandard, renderHero }: ComboLayoutProps = {}) {
  const pairs = [
    [supportProjects[0], supportProjects[1]],
    [supportProjects[2], supportProjects[3]],
  ];
  return (
    <Page1120>
      {renderHero ? renderHero() : <HeroBandPlaceholder />}
      <div style={{ marginBottom: 80 }}>
        {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
        {pairs.map((pair, i) => (
          <div
            key={i}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}
          >
            {pair.map((p) => (
              <React.Fragment key={p.id}>
                {renderStandard ? renderStandard(p) : <SV_A project={p} />}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </Page1120>
  );
}
