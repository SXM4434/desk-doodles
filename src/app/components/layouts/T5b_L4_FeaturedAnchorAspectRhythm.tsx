import React from 'react';
import { Page1120 } from './PageInset';
import { IS } from '../cards/tokens';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { supportProjects, primaryProject } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5b-L4 Featured Anchor + Aspect-Rhythm Paired Columns:
// Anchor variant of the T5b aspect-rhythm family. Full-width FH-A
// Featured hero anchors the top; below, two independent flex columns
// carry per-card authored aspect variance — the anchor sets hierarchy,
// the columns carry rhythm.
export function T5b_L4({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
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
        Featured anchor · paired columns aspect rhythm below
      </p>
      <div style={{ marginBottom: 48 }}>
        {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        <div style={columnStyle}>
          {renderTile(s0, '3 / 4')}
          {renderTile(s2, '4 / 3')}
        </div>
        <div style={columnStyle}>
          {renderTile(s1, '2 / 3')}
          {renderTile(s3, '1 / 1')}
        </div>
      </div>
    </Page1120>
  );
}
