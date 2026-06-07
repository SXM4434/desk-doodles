import React from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from './cards/tokens';
import { useResetIdentityToggles } from '../state/useResetIdentityToggles';
import { candidates, type Tier } from './layouts/candidates';
import { surfaceCandidates, type SurfaceTier } from './surfaces/candidates';
import { Page1120 } from './layouts/PageInset';
import { NARROWED_LAYOUT_IDS, NARROWED_LAYOUT_SET } from './narrow1/narrowedLayouts';
import {
  NARROWED_SURFACE_IDS,
  NARROWED_SURFACE_SET,
} from './narrow1/narrowedSurfaces';

// Narrow Pass 1 index: 15 × 13 pair matrix.
//
// Rows = 15 narrowed layout candidates. Columns = 13 narrowed surface
// candidates. Tier grouping is preserved for visual continuity with the full
// Combo index, but both axes are filtered to the Narrow Pass 1 working sets.
export function NarrowPass1Index() {
  useResetIdentityToggles();
  const narrowedLayouts = candidates.filter((c) => NARROWED_LAYOUT_SET.has(c.id));
  const narrowedSurfaces = surfaceCandidates.filter((c) =>
    NARROWED_SURFACE_SET.has(c.id),
  );
  const totalPairs = narrowedLayouts.length * narrowedSurfaces.length;

  const layoutTierBoundary = new Set<number>();
  for (let i = 0; i < narrowedLayouts.length - 1; i++) {
    if (narrowedLayouts[i].tier !== narrowedLayouts[i + 1].tier)
      layoutTierBoundary.add(i);
  }
  const surfaceTierBoundary = new Set<number>();
  for (let i = 0; i < narrowedSurfaces.length - 1; i++) {
    if (narrowedSurfaces[i].tier !== narrowedSurfaces[i + 1].tier)
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
        Homepage Surfaces v2 · Narrow Pass 1
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
        {narrowedLayouts.length} × {narrowedSurfaces.length} pair matrix · {totalPairs} combos
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
        First narrowing pass over the 37 × 37 Combo space: {narrowedLayouts.length}{' '}
        layouts × {narrowedSurfaces.length} surfaces. Axes resolve pair-native by
        default (margin gutter-dominant, CTA most-suppressed-wins, media
        real-asset-wins, tags per-atom-authored); LabShell toggles override any
        axis per session.
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
        Layouts across T1 · T2 · T3 · T4 · T5a · T5b · T5c (top-to-bottom,
        narrowed to {narrowedLayouts.length}). Surfaces across T1 · T2 · T3 ·
        T5 · T6 · T8 (left-to-right, narrowed to {narrowedSurfaces.length};
        T4 / T7 not represented in this pass). Tier boundaries marked by
        thicker rules.
      </p>

      {/* Matrix */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `72px repeat(${narrowedSurfaces.length}, minmax(0, 1fr))`,
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
        {narrowedSurfaces.map((s, ci) => (
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
        {narrowedLayouts.map((l, ri) => (
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
            {narrowedSurfaces.map((s, ci) => (
              <NavLink
                key={s.id}
                to={`/narrow-1/${l.id}/${s.id}`}
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

      {/* Narrowed set readout — layouts */}
      <section style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--dir-text-primary)',
            margin: 0,
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: '1px solid var(--dir-border)',
          }}
        >
          Narrowed set · {narrowedLayouts.length} layouts
        </h2>
        <p
          style={{
            fontFamily: IS,
            fontSize: 12,
            fontWeight: 300,
            lineHeight: 1.6,
            color: 'var(--dir-text-secondary)',
            margin: 0,
          }}
        >
          {NARROWED_LAYOUT_IDS.join(' · ')}
        </p>
      </section>

      {/* Narrowed set readout — surfaces */}
      <section style={{ marginBottom: 48 }}>
        <h2
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--dir-text-primary)',
            margin: 0,
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: '1px solid var(--dir-border)',
          }}
        >
          Narrowed set · {narrowedSurfaces.length} surfaces
        </h2>
        <p
          style={{
            fontFamily: IS,
            fontSize: 12,
            fontWeight: 300,
            lineHeight: 1.6,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 8,
          }}
        >
          {NARROWED_SURFACE_IDS.join(' · ')}
        </p>
        <p
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 300,
            lineHeight: 1.55,
            color: 'var(--dir-detail)',
            margin: 0,
          }}
        >
          Cut 14 → 13: t8-s2 collapsed into t8-s1 (same unbounded label-below
          register; t8-s1 carries more meta, t8-s2's emmiwu-minimal end is
          derivable via CTA=none + meta compression). Flagged-but-kept: t2-s4
          (potential merge with t1-s1 × cta=quiet) and t6-s2 / t6-s5 (same
          case-brief register, contained vs unbounded) — decisions deferred
          to post-render evidence.
        </p>
      </section>

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
          By layout · each narrowed layout × {narrowedSurfaces.length} narrowed surfaces
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {layoutTiers.map((lt) => {
            const tierLayouts = narrowedLayouts.filter((c) => c.tier === lt);
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
                        const tierSurfaces = narrowedSurfaces.filter((s) => s.tier === st);
                        if (!tierSurfaces.length) return null;
                        return (
                          <React.Fragment key={st}>
                            {tierSurfaces.map((s) => (
                              <NavLink
                                key={s.id}
                                to={`/narrow-1/${l.id}/${s.id}`}
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
