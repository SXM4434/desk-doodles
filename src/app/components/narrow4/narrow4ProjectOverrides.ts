import type { Project, ProofStat } from '../../data/projects';

// Per-project eyebrow overrides for Narrow 4. The shared data/projects.ts
// statuses are stale (see memory: project_portfolio_project_statuses); this
// lookup carries honest values without rippling a data-file rewrite.
//
// Grammar: {COMPANY} · {STATUS} · {YEAR} (Rachel Chen style).
// Status is ALWAYS present (even for shipped projects). Company is always
// first and primary. Status and Year are separate segments (not concatenated).
// Tag chips are dropped entirely — eyebrow carries all project metadata.
export type Narrow4Override = {
  year: string;
  statusOverride: string;
};

export const NARROW4_OVERRIDES: Record<string, Narrow4Override> = {
  ion: { year: '2024', statusOverride: 'Shipped' },
  elara: { year: '2026', statusOverride: 'Contract' },
  canopi: { year: '2025', statusOverride: 'MVP' },
  iyna: { year: '2025', statusOverride: 'Shipped' },
  gardens: { year: '2023', statusOverride: 'Shipped' },
};

export function getNarrow4Override(projectId: string): Narrow4Override | undefined {
  return NARROW4_OVERRIDES[projectId];
}

// Payload guard: every proof stat value is the em-dash placeholder.
// Narrow 4 suppresses the proof line entirely when this returns true.
export function isPlaceholderProof(proof: ProofStat[]): boolean {
  return proof.every((p) => p.value === '\u2014' || p.value === '—');
}

export type EyebrowSegment = {
  text: string;
  tier: 'primary' | 'secondary';
};

export function getEyebrowSegments(
  project: Project,
  override?: Narrow4Override,
): EyebrowSegment[] {
  const segments: EyebrowSegment[] = [];
  // Company — always first, always primary
  segments.push({ text: project.label.toUpperCase(), tier: 'primary' });
  // Status — always present as its own segment
  if (override?.statusOverride) {
    segments.push({ text: override.statusOverride, tier: 'secondary' });
  }
  // Year — always present as its own segment
  if (override?.year) {
    segments.push({ text: override.year, tier: 'secondary' });
  }
  return segments;
}

export type Narrow4Meta = {
  override?: Narrow4Override;
  eyebrowSegments: EyebrowSegment[];
  proofSuppressed: boolean;
};

export function withNarrow4Overrides(project: Project): {
  project: Project;
  narrow4: Narrow4Meta;
} {
  const override = getNarrow4Override(project.id);
  const eyebrowSegments = getEyebrowSegments(project, override);
  const proofSuppressed = isPlaceholderProof(project.proof);
  return {
    project,
    narrow4: { override, eyebrowSegments, proofSuppressed },
  };
}
