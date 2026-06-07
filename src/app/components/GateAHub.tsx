import React from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from './cards/tokens';
import { Page1120 } from './layouts/PageInset';

export function GateAHub() {
  return (
    <Page1120>
      {/* Status badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '6px 12px',
          border: '1px solid var(--dir-border)',
          backgroundColor: 'var(--dir-raised)',
          marginBottom: 24,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: 'var(--dir-text-primary)',
          }}
        />
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
          Gate A · Hub · Part 1 LOCKED · Part 2 ACTIVE
        </span>
      </div>

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
        Gate A · revised outline · two tracks
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
        Gate A assembles locked systems
        <br />
        into provisional hiring surfaces.
      </h1>
      <p
        style={{
          fontFamily: IS,
          fontSize: 15,
          fontWeight: 300,
          lineHeight: 1.6,
          color: 'var(--dir-text-secondary)',
          maxWidth: 780,
          margin: 0,
          marginBottom: 64,
        }}
      >
        Gate A is not a lab experiment and not a system definition pass. It is the first time locked systems are assembled into actual hiring-facing surfaces and judged as hiring surfaces. Two tracks — Homepage and Ion — run separately with independent workflows and separate reviews.
      </p>

      {/* Current status */}
      <section style={{ marginBottom: 64 }}>
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
          Current status
        </h2>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {[
            'Part 1 Homepage track — LOCKED 2026-04-25. Workflow 1.1–1.11 locked. Output: provisional winner + 1 backup. Final lock deferred until Hero (#8) + standard-cards grid validation.',
            'Part 2 Ion track — Steps 2.1–2.4 COMPLETE 2026-04-27. I1–I6 locked as planning directions in gate-a-ion-variation-space.md. No variations built, no artifacts authored.',
            '2.5.0 Pre-R1 architecture setup — COMPLETE. Route separation: /gate-a hub · /gate-a/homepage Part 1 · /gate-a/ion Part 2 · /gate-a/ion/r1 R1 workspace.',
            '2.5 R1 Build Round — NEXT. Build I1–I6 as real applied surfaces using locked systems only. Author approved POC artifacts (A for I2 required, A+B for I3 required).',
          ].map((line, i) => (
            <li
              key={i}
              style={{
                fontFamily: IS,
                fontSize: 13,
                fontWeight: 300,
                lineHeight: 1.6,
                color: 'var(--dir-text-secondary)',
                padding: '12px 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--dir-border)',
              }}
            >
              {line}
            </li>
          ))}
        </ul>
      </section>

      {/* Two track cards */}
      <section style={{ marginBottom: 64 }}>
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
          Two tracks
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
          }}
        >
          {/* Part 1 */}
          <div
            style={{
              padding: 24,
              border: '1px solid var(--dir-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div>
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
                Part 1 · Homepage track
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '3px 8px',
                  border: '1px solid var(--dir-border)',
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: IS,
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--dir-text-secondary)',
                  }}
                >
                  LOCKED · 2026-04-25
                </span>
              </div>
              <h3
                style={{
                  fontFamily: IS,
                  fontSize: 18,
                  fontWeight: 500,
                  lineHeight: 1.25,
                  color: 'var(--dir-text-primary)',
                  margin: 0,
                  marginBottom: 8,
                }}
              >
                Homepage provisional winner + backup
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
                Workflow 1.1–1.11 locked. Steps 1.1–1.4 pending. Source-of-truth: gate-a-homepage-track-locked.md.
              </p>
            </div>
            <NavLink
              to="/gate-a/homepage"
              style={{
                fontFamily: IS,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--dir-text-primary)',
                textDecoration: 'none',
                padding: '6px 12px',
                border: '1px solid var(--dir-text-primary)',
                alignSelf: 'flex-start',
              }}
            >
              Part 1 status →
            </NavLink>
          </div>

          {/* Part 2 */}
          <div
            style={{
              padding: 24,
              border: '1px solid var(--dir-text-primary)',
              backgroundColor: 'var(--dir-raised)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div>
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
                Part 2 · Ion track
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '3px 8px',
                  border: '1px solid var(--dir-text-primary)',
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: IS,
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--dir-text-primary)',
                  }}
                >
                  ACTIVE · 2.5 R1 NEXT
                </span>
              </div>
              <h3
                style={{
                  fontFamily: IS,
                  fontSize: 18,
                  fontWeight: 500,
                  lineHeight: 1.25,
                  color: 'var(--dir-text-primary)',
                  margin: 0,
                  marginBottom: 8,
                }}
              >
                Ion case page · I1–I6 locked
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
                Steps 2.1–2.4 complete. I1–I6 planning directions locked. 2.5 R1 build round is next. Source-of-truth: gate-a-ion-variation-space.md.
              </p>
            </div>
            <NavLink
              to="/gate-a/ion"
              style={{
                fontFamily: IS,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--dir-text-primary)',
                textDecoration: 'none',
                padding: '6px 12px',
                border: '1px solid var(--dir-text-primary)',
                alignSelf: 'flex-start',
              }}
            >
              Part 2 status →
            </NavLink>
          </div>
        </div>
      </section>

      {/* Track separation rules */}
      <section style={{ marginBottom: 64 }}>
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
          Track separation rules
        </h2>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {[
            'Tracks are worked separately. Do not blend research, decisions, or reviews between them.',
            'Tracks are reviewed separately. Homepage review = Recruiter Skim Audit. Ion review = Case Study Deep Dive.',
            'Cross-track issues require explicit documentation in gate-a-synthesis-and-decision.md.',
            'Both tracks share the Gate A frame and the 7 locked-inputs set. They do not share workflows or variation bets.',
            'Gate A does not design new systems. It does not reopen locked decisions. It assembles and applies.',
          ].map((line, i) => (
            <li
              key={i}
              style={{
                fontFamily: IS,
                fontSize: 13,
                fontWeight: 300,
                lineHeight: 1.6,
                color: 'var(--dir-text-secondary)',
                padding: '12px 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--dir-border)',
                display: 'flex',
                alignItems: 'baseline',
                gap: 12,
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
                  flexShrink: 0,
                }}
              >
                Rule
              </span>
              <span style={{ flex: 1 }}>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Artifact playground link */}
      <section style={{ marginBottom: 64 }}>
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
          Artifact playground
        </h2>
        <p
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.6,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 16,
            maxWidth: 780,
          }}
        >
          Catalog of 18 research artifacts as standalone explorable components. Cross-track resource — used by Ion case study (§03 Discovery and beyond) and any future case study with research synthesis surfaces. Default content seeded from real Ion materials; synthesized content explicitly marked.
        </p>
        <NavLink
          to="/artifacts"
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--dir-text-primary)',
            textDecoration: 'none',
            padding: '6px 12px',
            border: '1px solid var(--dir-text-primary)',
            display: 'inline-block',
          }}
        >
          Artifact playground →
        </NavLink>
      </section>
    </Page1120>
  );
}
