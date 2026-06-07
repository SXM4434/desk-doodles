import React from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from './cards/tokens';
import { useResetIdentityToggles } from '../state/useResetIdentityToggles';
import { candidates, type Tier } from './layouts/candidates';
import { surfaceCandidates, type SurfaceTier } from './surfaces/candidates';
import { Page1120 } from './layouts/PageInset';

// Combo mode index: 37 × 37 pair matrix.
//
// Rows = 37 layout candidates (T1 → T5c). Columns = 37 surface candidates
// (T1 → T8). Each cell is a NavLink to the combo candidate page. Cells are
// tier-grouped via thicker borders at tier boundaries so scan lines survive
// the density.
export function ComboIndex() {
  useResetIdentityToggles();
  const totalPairs = candidates.length * surfaceCandidates.length;

  // Tier boundaries (position of the LAST member of each tier, 0-indexed).
  // Used to draw a thicker borderRight after each tier's last column, and a
  // thicker borderBottom after each tier's last row.
  const layoutTierBoundary = new Set<number>();
  for (let i = 0; i < candidates.length - 1; i++) {
    if (candidates[i].tier !== candidates[i + 1].tier) layoutTierBoundary.add(i);
  }
  const surfaceTierBoundary = new Set<number>();
  for (let i = 0; i < surfaceCandidates.length - 1; i++) {
    if (surfaceCandidates[i].tier !== surfaceCandidates[i + 1].tier)
      surfaceTierBoundary.add(i);
  }

  const layoutTiers: Tier[] = ['t1', 't2', 't3', 't4', 't5a', 't5b', 't5c'];
  const surfaceTiers: SurfaceTier[] = [
    't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8',
  ];

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
        Homepage Surfaces v2 · Combo mode
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
        {candidates.length} × {surfaceCandidates.length} pair matrix · {totalPairs} combos
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
        Every cell is one layout × surface pair. Cells render at pair-native
        defaults — margin gutter-dominant, CTA most-suppressed-wins, media
        real-asset-wins, tags per-atom-authored. Click any cell to open the
        combo; LabShell toggles override any axis per session.
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
          marginBottom: 48,
        }}
      >
        Layouts across T1 · T2 · T3 · T4 · T5a · T5b · T5c (top-to-bottom). Surfaces across T1 · T2 · T3 · T4 · T5 · T6 · T7 · T8 (left-to-right). Tier boundaries marked by thicker rules.
      </p>

      {/* Matrix */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `72px repeat(${surfaceCandidates.length}, minmax(0, 1fr))`,
          gap: 0,
          marginBottom: 48,
        }}
      >
        {/* Top-left corner — empty */}
        <div
          style={{
            borderRight: '2px solid var(--dir-border)',
            borderBottom: '2px solid var(--dir-border)',
          }}
        />

        {/* Surface column headers */}
        {surfaceCandidates.map((s, ci) => (
          <div
            key={s.id}
            title={`${s.label} · ${s.workingName}`}
            style={{
              fontFamily: IS,
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.04em',
              color: 'var(--dir-text-primary)',
              textAlign: 'center',
              padding: '6px 0',
              borderBottom: '2px solid var(--dir-border)',
              borderRight: surfaceTierBoundary.has(ci)
                ? '2px solid var(--dir-border)'
                : '1px solid var(--dir-border)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {s.label.replace(/^T/, '').replace('-', '·')}
          </div>
        ))}

        {/* Rows */}
        {candidates.map((l, ri) => (
          <React.Fragment key={l.id}>
            <div
              title={`${l.label} · ${l.workingName}`}
              style={{
                fontFamily: IS,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.04em',
                color: 'var(--dir-text-primary)',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                borderRight: '2px solid var(--dir-border)',
                borderBottom: layoutTierBoundary.has(ri)
                  ? '2px solid var(--dir-border)'
                  : '1px solid var(--dir-border)',
                whiteSpace: 'nowrap',
              }}
            >
              {l.label}
            </div>
            {surfaceCandidates.map((s, ci) => (
              <NavLink
                key={s.id}
                to={`/combo/${l.id}/${s.id}`}
                title={`${l.label} × ${s.label} — ${l.workingName} × ${s.workingName}`}
                style={{
                  display: 'block',
                  aspectRatio: '1 / 1',
                  backgroundColor: 'var(--dir-raised)',
                  borderRight: surfaceTierBoundary.has(ci)
                    ? '2px solid var(--dir-border)'
                    : '1px solid var(--dir-border)',
                  borderBottom: layoutTierBoundary.has(ri)
                    ? '2px solid var(--dir-border)'
                    : '1px solid var(--dir-border)',
                }}
              />
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Per-layout quick-pair lookup (hierarchical fallback) */}
      <section>
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
          By layout · every layout × all 37 surfaces
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {layoutTiers.map((lt) => {
            const tierLayouts = candidates.filter((c) => c.tier === lt);
            if (!tierLayouts.length) return null;
            return (
              <div key={lt} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tierLayouts.map((l) => (
                  <div key={l.id}>
                    <p
                      style={{
                        fontFamily: IS,
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: '0.08em',
                        color: 'var(--dir-text-primary)',
                        margin: 0,
                        marginBottom: 6,
                      }}
                    >
                      {l.label} · {l.workingName}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px 8px',
                        fontFamily: IS,
                        fontSize: 10,
                      }}
                    >
                      {surfaceTiers.map((st) => {
                        const tierSurfaces = surfaceCandidates.filter((s) => s.tier === st);
                        if (!tierSurfaces.length) return null;
                        return (
                          <React.Fragment key={st}>
                            {tierSurfaces.map((s) => (
                              <NavLink
                                key={s.id}
                                to={`/combo/${l.id}/${s.id}`}
                                title={`${l.workingName} × ${s.workingName}`}
                                style={{
                                  color: 'var(--dir-text-secondary)',
                                  textDecoration: 'none',
                                  padding: '2px 6px',
                                  backgroundColor: 'var(--dir-raised)',
                                  border: '1px solid var(--dir-border)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {s.label}
                              </NavLink>
                            ))}
                            <span style={{ color: 'var(--dir-detail)', padding: '0 2px' }}>·</span>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>
    </Page1120>
  );
}
