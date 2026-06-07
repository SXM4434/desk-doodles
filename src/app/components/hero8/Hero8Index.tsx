import React from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from '../cards/tokens';
import { Page1120 } from '../layouts/PageInset';
import {
  F_FAMILIES,
  LAYOUT_FAMILIES,
  getCellStatus,
  type CellStatus,
} from './heroFamilies';

const STATUS_LABEL: Record<CellStatus, string> = {
  active: 'active · Phase 1',
  pending: 'research pending',
  inactive: 'inactive',
};

const STATUS_BG: Record<CellStatus, string> = {
  active: 'var(--dir-text-primary)',
  pending: 'var(--dir-raised)',
  inactive: 'var(--dir-bg)',
};

const STATUS_FG: Record<CellStatus, string> = {
  active: 'var(--dir-bg)',
  pending: 'var(--dir-text-primary)',
  inactive: 'var(--dir-detail)',
};

export function Hero8Index() {
  const total = F_FAMILIES.length * LAYOUT_FAMILIES.length;

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
        Phase 1.5 #8 · Hero system lab · separate from Gate A
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
        {F_FAMILIES.length} F-families × {LAYOUT_FAMILIES.length} layout placements · {total} cells
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
          marginBottom: 32,
        }}
      >
        Hero #8 research bank. F-family (F1–F8) × layout-family (A horizontal band · B vertical column).
        Each cell renders the narrow-4 family layout — featured project card + work-field grid — with the
        F-family composition replacing the hero zone (HeroBandPlaceholder on Family A · IdentityAside on
        Family B). F3 Desk / Workbench is the first reference family; F3-A and F3-B both ship before any
        other F-family opens. Other 14 cells stay inactive until F3 narrows.
      </p>

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
          {F_FAMILIES.length} F-families × {LAYOUT_FAMILIES.length} layout placements
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `220px repeat(${LAYOUT_FAMILIES.length}, minmax(0, 1fr))`,
            border: '1px solid var(--dir-border)',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              borderRight: '1px solid var(--dir-border)',
              borderBottom: '1px solid var(--dir-border)',
              backgroundColor: 'var(--dir-raised)',
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-primary)',
            }}
          >
            F-family
          </div>
          {LAYOUT_FAMILIES.map((l) => (
            <div
              key={l.id}
              style={{
                padding: '8px 12px',
                borderRight: '1px solid var(--dir-border)',
                borderBottom: '1px solid var(--dir-border)',
                backgroundColor: 'var(--dir-raised)',
                fontFamily: IS,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--dir-text-primary)',
                textAlign: 'center',
              }}
            >
              {l.label} · {l.workingName}
            </div>
          ))}
          {F_FAMILIES.map((f, fi) => (
            <React.Fragment key={f.id}>
              <div
                style={{
                  padding: '12px',
                  borderRight: '1px solid var(--dir-border)',
                  borderBottom:
                    fi === F_FAMILIES.length - 1 ? 'none' : '1px solid var(--dir-border)',
                  fontFamily: IS,
                  fontSize: 11,
                  color: 'var(--dir-text-primary)',
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{f.label}</div>
                <div style={{ color: 'var(--dir-detail)', fontSize: 10 }}>{f.workingName}</div>
              </div>
              {LAYOUT_FAMILIES.map((l) => {
                const status = getCellStatus(f.id, l.id);
                return (
                  <NavLink
                    key={`${f.id}-${l.id}`}
                    to={`/hero-8/${f.id}/${l.id}/v1`}
                    title={`${f.label} × ${l.label} · ${STATUS_LABEL[status]}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      aspectRatio: '2 / 1',
                      backgroundColor: STATUS_BG[status],
                      color: STATUS_FG[status],
                      borderRight: '1px solid var(--dir-border)',
                      borderBottom:
                        fi === F_FAMILIES.length - 1 ? 'none' : '1px solid var(--dir-border)',
                      fontFamily: IS,
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                    }}
                  >
                    {STATUS_LABEL[status]}
                  </NavLink>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </section>
    </Page1120>
  );
}
