import React from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from './cards/tokens';
import { useResetIdentityToggles } from '../state/useResetIdentityToggles';
import {
  surfaceCandidates,
  type SurfaceTier,
} from './surfaces/candidates';
import { Page1120 } from './layouts/PageInset';

const TIER_LABELS: Record<SurfaceTier, string> = {
  t1: 'T1 · Locked Baseline',
  t2: 'T2 · Decomposition',
  t3: 'T3 · Identity Reframe',
  t4: 'T4 · Formal Mode Shift',
  t5: 'T5 · Editorial Paired-Column',
  t6: 'T6 · Case Brief / Release',
  t7: 'T7 · Abstract / Experimental',
  t8: 'T8 · Unbounded / Label-Below',
};

function CandCard({
  to,
  meta,
  label,
  title,
  thesis,
  ghost = false,
}: {
  to: string;
  meta?: string;
  label: string;
  title: string;
  thesis?: string;
  ghost?: boolean;
}) {
  return (
    <NavLink
      to={to}
      style={{
        display: 'block',
        padding: ghost ? '16px 20px' : 24,
        backgroundColor: ghost ? 'var(--dir-recessed)' : 'var(--dir-raised)',
        border: '1px solid var(--dir-border)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <p
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--dir-detail)',
          margin: 0,
          marginBottom: 6,
        }}
      >
        {[label, meta].filter(Boolean).join(' · ')}
      </p>
      <h3
        style={{
          fontFamily: IS,
          fontSize: ghost ? 15 : 18,
          fontWeight: 500,
          lineHeight: 1.25,
          letterSpacing: '-0.015em',
          color: 'var(--dir-text-primary)',
          margin: 0,
          marginBottom: thesis ? 8 : 0,
        }}
      >
        {title}
      </h3>
      {thesis && (
        <p
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.6,
            color: 'var(--dir-text-secondary)',
            margin: 0,
          }}
        >
          {thesis}
        </p>
      )}
    </NavLink>
  );
}

export function SurfaceIndex() {
  useResetIdentityToggles();
  const tiers: SurfaceTier[] = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'];

  const alternateCount = surfaceCandidates.reduce(
    (n, c) => n + (c.svbAlternate !== 'none' ? 1 : 0) + (c.quietArtifact ? 1 : 0),
    0,
  );

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
          marginBottom: 12,
        }}
      >
        Homepage Surfaces v2 · Step 5b · Surface mode
      </p>
      <h1
        style={{
          fontFamily: ISe,
          fontSize: 52,
          fontWeight: 400,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          color: 'var(--dir-text-primary)',
          margin: 0,
          marginBottom: 24,
        }}
      >
        37 surface candidates · layout held at T1-L1
      </h1>
      <p
        style={{
          fontFamily: IS,
          fontSize: 15,
          fontWeight: 300,
          lineHeight: 1.6,
          color: 'var(--dir-text-secondary)',
          maxWidth: 680,
          margin: 0,
          marginBottom: 16,
        }}
      >
        Each candidate renders at T1-L1 Classical Anchor Grid geometry: full-width
        Featured above, 3-column Standard grid below. Featured shell (FH-A vs
        FH-B) is a per-candidate Axis B attribute. Standard default SV-A; SV-B
        renders as a whole-grid-only alternate where the candidate permits it.
      </p>
      <p
        style={{
          fontFamily: IS,
          fontSize: 13,
          fontWeight: 300,
          lineHeight: 1.6,
          color: 'var(--dir-detail)',
          maxWidth: 680,
          margin: 0,
          marginBottom: 64,
        }}
      >
        {surfaceCandidates.length} primary renders + 1 T1-S1 quiet artifact + {alternateCount - 1} SV-B alternate grids. GlobalNav is the only nav layer. CTA and media-truth toggles are global.
      </p>

      {tiers.map((t) => {
        const tierCands = surfaceCandidates.filter((c) => c.tier === t);
        if (!tierCands.length) return null;
        return (
          <section key={t} style={{ marginBottom: 64 }}>
            <h2
              style={{
                fontFamily: IS,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--dir-text-primary)',
                margin: 0,
                marginBottom: 24,
                paddingBottom: 12,
                borderBottom: '1px solid var(--dir-border)',
              }}
            >
              {TIER_LABELS[t]}
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 24,
              }}
            >
              {tierCands.map((c) => (
                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <CandCard
                    to={`/surface/${c.tier}/${c.slot}`}
                    label={c.label}
                    title={c.workingName}
                    thesis={c.thesis}
                  />
                  {c.quietArtifact && (
                    <CandCard
                      to={`/surface/${c.tier}/${c.slot}/quiet`}
                      label={c.label}
                      meta="quiet artifact"
                      title={`${c.workingName} — CTA forced quiet`}
                      ghost
                    />
                  )}
                  {c.svbAlternate !== 'none' && (
                    <CandCard
                      to={`/surface/${c.tier}/${c.slot}/sv-b`}
                      label={c.label}
                      meta={
                        c.svbAlternate === 'conditional'
                          ? 'SV-B · conditional alternate'
                          : 'SV-B · clean alternate'
                      }
                      title={`${c.workingName} — whole-grid SV-B`}
                      ghost
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </Page1120>
  );
}
