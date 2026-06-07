import React from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from './cards/tokens';
import { useResetIdentityToggles } from '../state/useResetIdentityToggles';
import { candidates, type Tier } from './layouts/candidates';
import { Page1120 } from './layouts/PageInset';
import { NARROW2_LAYOUT_SET } from './narrow2/narrowedLayouts';

// Narrow Pass 2 — 2-family space.
//
// Replaces the prior 5 × 13 pair matrix. Surfaces collapsed into 2 families:
// Cards (10 shells → 1 family) + Tiles (3 shells → 1 family). Layout axis
// holds the 5 narrowed Pass-2 layouts (t1-l3, t2-l4, t4-l4, t5a-l2, t5c-l6).
//
// Total pairs: 5 × 2 = 10. All 8 axis toggles enabled here (cardFrame,
// divider, titleRegister, imageTreatment, captionRegister, shippedProof,
// proofPlacement, aspectVariance) — dedup suppression applies only on the
// /cards and /tiles articulation pages, not in the family space.

const FAMILIES = [
  {
    id: 'cards',
    label: 'Cards',
    members: 10,
    baseline: 'T1-S1 · Explicit Container Baseline',
    thesis: 'Framed project chassis — border + padding, media and text inside one enclosure.',
  },
  {
    id: 'tiles',
    label: 'Tiles',
    members: 3,
    baseline: 'T8-S1 · Plain Tile',
    thesis: 'Media-as-object — no outer frame, grouping by typographic rhythm alone.',
  },
] as const;

export function NarrowPass2Index() {
  useResetIdentityToggles();
  const layoutTiers: Tier[] = ['t1', 't2', 't3', 't4', 't5a', 't5b', 't5c'];
  const narrow2Layouts = candidates.filter((c) => NARROW2_LAYOUT_SET.has(c.id));
  const totalPairs = narrow2Layouts.length * FAMILIES.length;

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
        Homepage Surfaces v2 · Narrow Pass 2 · 2-family space
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
        {narrow2Layouts.length} × {FAMILIES.length} · {totalPairs} combos
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
        Surfaces collapsed from the prior 13 narrowed shells into 2 families: <strong>Cards</strong> (10 shells) and{' '}
        <strong>Tiles</strong> (3 shells). Layout axis holds the {narrow2Layouts.length} Pass-2 narrowed layouts. Each
        family renders with its baseline surface and exposes all 8 shared axis toggles. Dedup suppression lives on the
        articulation pages (<NavLink to="/cards" style={link}>/cards</NavLink> ·{' '}
        <NavLink to="/tiles" style={link}>/tiles</NavLink>); the family space keeps every toggle enabled to probe
        combinations across the space.
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
          <NavLink
            key={f.id}
            to={`/${f.id}`}
            style={{
              display: 'block',
              padding: 20,
              backgroundColor: 'var(--dir-raised)',
              border: '1px solid var(--dir-border)',
              textDecoration: 'none',
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
                {f.members} shells
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
                marginBottom: 8,
              }}
            >
              {f.thesis}
            </p>
            <p
              style={{
                fontFamily: IS,
                fontSize: 11,
                fontWeight: 300,
                color: 'var(--dir-detail)',
                margin: 0,
              }}
            >
              Baseline render → {f.baseline}
            </p>
          </NavLink>
        ))}
      </div>

      {/* 5 × 2 matrix */}
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
          {narrow2Layouts.length} narrowed layouts × {FAMILIES.length} families
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `240px repeat(${FAMILIES.length}, minmax(0, 1fr))`,
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
            Layout
          </div>
          {FAMILIES.map((f) => (
            <div
              key={f.id}
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
              {f.label}
            </div>
          ))}
          {layoutTiers.map((t) => {
            const list = narrow2Layouts.filter((c) => c.tier === t);
            return list.map((c, i) => {
              const isLastInTier = i === list.length - 1;
              return (
                <React.Fragment key={c.id}>
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRight: '1px solid var(--dir-border)',
                      borderBottom: isLastInTier
                        ? '2px solid var(--dir-border)'
                        : '1px solid var(--dir-border)',
                      fontFamily: IS,
                      fontSize: 11,
                      color: 'var(--dir-text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{c.label}</span>{' '}
                    <span style={{ color: 'var(--dir-detail)' }}>· {c.workingName}</span>
                  </div>
                  {FAMILIES.map((f) => (
                    <NavLink
                      key={f.id}
                      to={`/narrow-2/${c.id}/${f.id}`}
                      title={`${c.label} × ${f.label}`}
                      style={{
                        display: 'block',
                        aspectRatio: '2 / 1',
                        backgroundColor: 'var(--dir-raised)',
                        borderRight: '1px solid var(--dir-border)',
                        borderBottom: isLastInTier
                          ? '2px solid var(--dir-border)'
                          : '1px solid var(--dir-border)',
                      }}
                    />
                  ))}
                </React.Fragment>
              );
            });
          })}
        </div>
      </section>

      {/* Axis toggle roster */}
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
          Axes enabled in the family space
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
          All 8 shared axes are toggleable in the family space, plus ShellPicker for baseline / layout-native /
          manual shell selection. The articulation pages enforce dedup suppression (<NavLink to="/cards" style={link}>/cards</NavLink>
          {' · '}<NavLink to="/tiles" style={link}>/tiles</NavLink>); here every toggle stays open.
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
          <li>Card frame · on / off</li>
          <li>Divider · none / section / inline</li>
          <li>Title register · default / ISe italic / small-caps</li>
          <li>Image treatment · plain / framed / double-frame / mat</li>
          <li>Caption register · default / small-caps</li>
          <li>Shipped proof · on / off</li>
          <li>Proof placement · stack-grid / inline / bottom-strip</li>
          <li>Aspect variance · uniform / authored</li>
          <li>Shell picker · baseline / layout-native / manual</li>
        </ul>
      </section>
    </Page1120>
  );
}

const link: React.CSSProperties = {
  color: 'var(--dir-text-primary)',
  fontWeight: 500,
};
