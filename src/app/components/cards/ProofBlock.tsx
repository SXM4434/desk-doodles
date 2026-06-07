import React from 'react';
import { IS } from './tokens';
import { ProofStat } from './CardAtoms';
import { useShippedProof } from '../../state/ShippedProofContext';
import { useProofPlacement, type ProofPlacementMode } from '../../state/ProofPlacementContext';
import type { Project } from '../../data/projects';

// Shared proof render atom — responds to both ShippedProof (on/off) and
// ProofPlacement (stack-grid / inline / bottom-strip) contexts with per-shell
// authored native baselines. Every shell that renders proof consumes this
// atom so the two axes actually reshape the render path on every shell.

type Register = 'featured' | 'standard';

type Props = {
  project: Project;
  visibleNative?: 'on' | 'off';
  placementNative?: ProofPlacementMode;
  divider: string;
  register?: Register;
  compressed?: boolean;
  style?: React.CSSProperties;
};

export function ProofBlock({
  project,
  visibleNative = 'on',
  placementNative = 'stack-grid',
  divider,
  register = 'featured',
  compressed = false,
  style,
}: Props) {
  const { state: visState } = useShippedProof();
  const { state: placeState } = useProofPlacement();
  const visible = (visState === 'native' ? visibleNative : visState) === 'on';
  const placement: ProofPlacementMode =
    placeState === 'native' ? placementNative : placeState;

  if (!visible) return null;

  const standard = register === 'standard';

  if (placement === 'inline') {
    const line = project.proof.map((p) => `${p.value} ${p.label}`).join(' · ');
    return (
      <p
        style={{
          fontFamily: IS,
          fontSize: standard ? 11 : 12,
          fontWeight: 400,
          color: 'var(--dir-detail)',
          borderTop: divider,
          paddingTop: standard ? 12 : 16,
          margin: 0,
          letterSpacing: '0.01em',
          ...style,
        }}
      >
        {line}
      </p>
    );
  }

  if (placement === 'bottom-strip') {
    const line = project.proof.map((p) => `${p.value} ${p.label}`).join('  ·  ');
    return (
      <p
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-text-secondary)',
          borderTop: divider,
          paddingTop: standard ? 12 : 16,
          margin: 0,
          ...style,
        }}
      >
        {line}
      </p>
    );
  }

  // stack-grid — horizontal row of ProofStat atoms
  return (
    <div
      style={{
        borderTop: divider,
        paddingTop: standard ? 12 : compressed ? 16 : 24,
        display: 'flex',
        gap: standard ? 24 : compressed ? 32 : 48,
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {project.proof.map((p) => (
        <ProofStat
          key={p.label}
          value={p.value}
          label={p.label}
          sub={p.sub}
          compressed={compressed}
        />
      ))}
    </div>
  );
}
