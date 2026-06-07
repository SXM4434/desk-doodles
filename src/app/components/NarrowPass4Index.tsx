import React from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from './cards/tokens';
import { useResetIdentityToggles } from '../state/useResetIdentityToggles';
import { Page1120 } from './layouts/PageInset';
import { FAMILIES, VERSIONS } from './narrow3/narrowedFamilies';

// Narrow Pass 4 — dedicated card-register authoring lab.
//
// Reuses the Narrow 3 family × version matrix read-only: the layout grids
// still come from narrow3/, but Narrow 4 routes FH-A + SV-A through
// FV-A foot='2-col' + SV-A with narrow-4 props (eyebrow override + proof
// opt-in + ctaHidden) via the render-props contract. Preset = T8-S4,
// density = compact, CTA hidden, Option C eyebrow.
export function NarrowPass4Index() {
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
        Homepage Surfaces v2 · Narrow Pass 4 · card register authoring
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
        Dedicated card-register pass against the same 2 × 3 family × version
        matrix Narrow 3 carries. T8-S4 Proof-Forward preset, compact density,
        Option C eyebrow grammar, no CTA. Narrow 3 family layouts render
        read-only; Narrow 4 replaces the FH-A + SV-A shells via the
        render-props contract — shells are swapped, not wrapped. See the
        upstream narrowed matrix at{' '}
        <NavLink
          to="/narrow-3"
          style={{ color: 'var(--dir-text-primary)', fontWeight: 500 }}
        >
          /narrow-3
        </NavLink>
        . The shell-only research view —{' '}
        <NavLink
          to="/narrow-4/family"
          style={{ color: 'var(--dir-text-primary)', fontWeight: 500 }}
        >
          /narrow-4/family
        </NavLink>{' '}
        — renders the 8 locked Project Card shells under the same register
        hard-sets so each shell&apos;s native behavior is visible alongside
        the candidate matrix above.
      </p>

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
                  to={`/narrow-4/${f.id}/${v.id}`}
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
          Register locks
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
          <li>
            <strong style={{ color: 'var(--dir-text-primary)' }}>Preset</strong>{' '}
            — T8-S4 Proof-Forward Tile (hard-set, not a live toggle).
          </li>
          <li>
            <strong style={{ color: 'var(--dir-text-primary)' }}>Density</strong>{' '}
            — compact (hard-set).
          </li>
          <li>
            <strong style={{ color: 'var(--dir-text-primary)' }}>CTA</strong> —
            removed entirely; the pair-native CTA resolution is overridden to
            hidden.
          </li>
          <li>
            <strong style={{ color: 'var(--dir-text-primary)' }}>Eyebrow</strong>{' '}
            — Option C grammar{' '}
            <code>{'{LABEL} · [META] · [STATUS-IF-NON-SHIPPED] {YEAR}'}</code>;
            Elara uses the <code>CONTRACT</code> STATUS override.
          </li>
          <li>
            <strong style={{ color: 'var(--dir-text-primary)' }}>
              Featured foot
            </strong>{' '}
            — 2-column geometry: title + framing LEFT, tags + inline-prose proof
            RIGHT, <code>align-items: end</code>.
          </li>
          <li>
            <strong style={{ color: 'var(--dir-text-primary)' }}>
              Live toggles
            </strong>{' '}
            — aspect variance + margin only.
          </li>
        </ul>
      </section>

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
