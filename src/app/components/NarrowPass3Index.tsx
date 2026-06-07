import React from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from './cards/tokens';
import { useResetIdentityToggles } from '../state/useResetIdentityToggles';
import { Page1120 } from './layouts/PageInset';
import {
  FAMILIES,
  VERSIONS,
} from './narrow3/narrowedFamilies';
import { SURFACE_ATTRS } from './family/surfaceAttributes';

// Narrow Pass 3 — family × version index.
//
// 2 families (Anchored Work Field · Identity + Work Field) × 3 versions
// (Grid · Masonry · Asymmetric Rows) = 6 layout renders on the tile surface.
// Preset axis cycles the 3 tile presets via the toolbar dropdown; preset
// lives in context, not URL (matching narrow-2).

const TILE_PRESETS = SURFACE_ATTRS.filter((s) => s.family === 'tiles');

export function NarrowPass3Index() {
  useResetIdentityToggles();
  const totalRenders = FAMILIES.length * VERSIONS.length;

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
        Homepage Surfaces v2 · Narrow Pass 3 · family × version matrix
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
        {FAMILIES.length} × {VERSIONS.length} · {totalRenders} renders
      </h1>
      <p
        style={{
          fontFamily: IS,
          fontSize: 15,
          fontWeight: 300,
          lineHeight: 1.6,
          color: 'var(--dir-text-secondary)',
          maxWidth: 720,
          margin: 0,
          marginBottom: 16,
        }}
      >
        Two families carry different featured-to-standard relationships;
        three versions carry different standards-field compositions (grid,
        masonry, asymmetric rows). Tile surface only — the preset axis cycles
        the {TILE_PRESETS.length} tile presets (t5-s4 · t8-s1 · t8-s4) through the
        toolbar dropdown. See the full tile shell gallery at{' '}
        <NavLink
          to="/tiles"
          style={{ color: 'var(--dir-text-primary)', fontWeight: 500 }}
        >
          /tiles
        </NavLink>
        .
      </p>

      {/* Family summary strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${FAMILIES.length}, minmax(0, 1fr))`,
          gap: 16,
          marginBottom: 48,
        }}
      >
        {FAMILIES.map((f) => (
          <div
            key={f.id}
            style={{
              padding: 20,
              backgroundColor: 'var(--dir-raised)',
              border: '1px solid var(--dir-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 12,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontFamily: IS,
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--dir-text-primary)',
                }}
              >
                {f.label}
              </span>
              <span
                style={{
                  fontFamily: IS,
                  fontSize: 11,
                  fontWeight: 300,
                  color: 'var(--dir-detail)',
                }}
              >
                {f.workingName}
              </span>
            </div>
            <p
              style={{
                fontFamily: IS,
                fontSize: 13,
                fontWeight: 300,
                lineHeight: 1.55,
                color: 'var(--dir-text-secondary)',
                margin: 0,
              }}
            >
              {f.thesis}
            </p>
          </div>
        ))}
      </div>

      {/* 2 × 3 matrix */}
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
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid var(--dir-border)',
          }}
        >
          {FAMILIES.length} families × {VERSIONS.length} versions
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `200px repeat(${VERSIONS.length}, minmax(0, 1fr))`,
            border: '1px solid var(--dir-border)',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              borderRight: '1px solid var(--dir-border)',
              borderBottom: '1px solid var(--dir-border)',
              backgroundColor: 'var(--dir-recessed)',
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-primary)',
            }}
          >
            Family
          </div>
          {VERSIONS.map((v) => (
            <div
              key={v.id}
              style={{
                padding: '8px 12px',
                borderRight: '1px solid var(--dir-border)',
                borderBottom: '1px solid var(--dir-border)',
                backgroundColor: 'var(--dir-recessed)',
                fontFamily: IS,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--dir-text-primary)',
                textAlign: 'center',
              }}
            >
              {v.label} · {v.workingName}
            </div>
          ))}
          {FAMILIES.map((f, fi) => (
            <React.Fragment key={f.id}>
              <div
                style={{
                  padding: '12px',
                  borderRight: '1px solid var(--dir-border)',
                  borderBottom:
                    fi === FAMILIES.length - 1
                      ? 'none'
                      : '1px solid var(--dir-border)',
                  fontFamily: IS,
                  fontSize: 11,
                  color: 'var(--dir-text-primary)',
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{f.label}</div>
                <div style={{ color: 'var(--dir-detail)', fontSize: 10 }}>
                  {f.workingName}
                </div>
              </div>
              {VERSIONS.map((v) => (
                <NavLink
                  key={`${f.id}-${v.id}`}
                  to={`/narrow-3/${f.id}/${v.id}`}
                  title={`${f.label} × ${v.label} ${v.workingName}`}
                  style={{
                    display: 'block',
                    aspectRatio: '2 / 1',
                    backgroundColor: 'var(--dir-raised)',
                    borderRight: '1px solid var(--dir-border)',
                    borderBottom:
                      fi === FAMILIES.length - 1
                        ? 'none'
                        : '1px solid var(--dir-border)',
                  }}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Preset axis */}
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
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid var(--dir-border)',
          }}
        >
          Preset axis · {TILE_PRESETS.length} tile presets
        </h2>
        <p
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.6,
            color: 'var(--dir-text-secondary)',
            maxWidth: 720,
            margin: 0,
            marginBottom: 16,
          }}
        >
          Switch presets from the toolbar Preset dropdown on any candidate
          render. Preset state lives in context — the URL does not change.
        </p>
        <ul
          style={{
            fontFamily: IS,
            fontSize: 12,
            fontWeight: 300,
            lineHeight: 1.6,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            paddingLeft: 18,
          }}
        >
          {TILE_PRESETS.map((p) => (
            <li key={p.id}>
              <strong style={{ color: 'var(--dir-text-primary)' }}>
                {p.label}
              </strong>{' '}
              · {p.workingName} — {p.identitySummary}
            </li>
          ))}
        </ul>
      </section>

      {/* Axis notes */}
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
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid var(--dir-border)',
          }}
        >
          Version axis · standards-field compositions
        </h2>
        <ul
          style={{
            fontFamily: IS,
            fontSize: 12,
            fontWeight: 300,
            lineHeight: 1.6,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            paddingLeft: 18,
          }}
        >
          {VERSIONS.map((v) => (
            <li key={v.id}>
              <strong style={{ color: 'var(--dir-text-primary)' }}>
                {v.label} · {v.workingName}
              </strong>{' '}
              — {v.thesis}
            </li>
          ))}
        </ul>
      </section>
    </Page1120>
  );
}
