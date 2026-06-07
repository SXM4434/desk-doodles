import React from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from './cards/tokens';
import { useLane } from '../state/LaneContext';
import { useResetIdentityToggles } from '../state/useResetIdentityToggles';
import { candidates, type Tier } from './layouts/candidates';
import { Page1120 } from './layouts/PageInset';

const TIER_LABELS: Record<Tier, string> = {
  t1: 'T1 · System Aligned',
  t2: 'T2 · Controlled Stretch',
  t3: 'T3 · Middle Zone',
  t4: 'T4 · Max Divergence',
  t5a: 'T5a · Span-Variance Asymmetry',
  t5b: 'T5b · Aspect-Variance Asymmetry',
  t5c: 'T5c · Dual-Axis / Proportion-System Asymmetry',
};

export function LayoutIndex() {
  useResetIdentityToggles();
  const { lane } = useLane();
  const filtered =
    lane === 'all' ? candidates : candidates.filter((c) => c.tier === lane);

  const tiers: Tier[] = ['t1', 't2', 't3', 't4', 't5a', 't5b', 't5c'];
  const shownTiers =
    lane === 'all' ? tiers : tiers.filter((t) => t === lane);

  return (
    <Page1120>
      <NavLink
        to="/gate-a"
        style={{
          display: 'inline-block',
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-text-primary)',
          textDecoration: 'none',
          padding: '4px 10px',
          border: '1px solid var(--dir-border)',
          borderRadius: 999,
          marginBottom: 16,
        }}
      >
        Gate A · Part 1 · Homepage track LOCKED →
      </NavLink>
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
        Homepage Surfaces v2 · Step 5a · Layout mode · research substrate for 1.2
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
        37 layout candidates · surface held at T1-S1
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
          marginBottom: 64,
        }}
      >
        Each candidate renders the locked card system at T1-S1 Explicit Container
        Baseline — visible border, surface-raised differential, atoms at locked
        weights. CTA and media-truth toggles are global. GlobalNav is the only
        nav layer on candidate surfaces.
      </p>

      {shownTiers.map((t) => {
        const tierCands = filtered.filter((c) => c.tier === t);
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
                <NavLink
                  key={c.id}
                  to={`/layout/${c.tier}/${c.slot}`}
                  style={{
                    display: 'block',
                    padding: 24,
                    backgroundColor: 'var(--dir-raised)',
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
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--dir-text-secondary)',
                      margin: 0,
                      marginBottom: 8,
                    }}
                  >
                    {c.label}
                  </p>
                  <h3
                    style={{
                      fontFamily: IS,
                      fontSize: 18,
                      fontWeight: 500,
                      lineHeight: 1.25,
                      letterSpacing: '-0.015em',
                      color: 'var(--dir-text-primary)',
                      margin: 0,
                      marginBottom: 8,
                    }}
                  >
                    {c.workingName}
                  </h3>
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
                    {c.thesis}
                  </p>
                </NavLink>
              ))}
            </div>
          </section>
        );
      })}
    </Page1120>
  );
}
