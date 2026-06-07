import React from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from './cards/tokens';
import { Page1120 } from './layouts/PageInset';
import { useResetIdentityToggles } from '../state/useResetIdentityToggles';

// Gate A · Part 1 · Homepage track · LOCKED status page.
// Source-of-truth doc: docs/labs/applied-surfaces/homepage/gate-a-homepage-track-locked.md
// Output of Part 1 = provisional winner + 1 backup. NOT a final homepage lock.
// Final homepage lock deferred until Hero (#8) + standard-cards grid validation.

const STEPS: { id: string; label: string; note: string }[] = [
  {
    id: '1.1',
    label: 'Setup',
    note: 'Folder/doc scaffolding · asset inventory structure · scope lock for provisional output.',
  },
  {
    id: '1.2',
    label: 'Research',
    note: 'Deep read of locked inputs. Consumes the Homepage Surfaces v2 Lab research bank as substrate.',
  },
  {
    id: '1.3',
    label: 'Permission mapping',
    note: 'Three categories carried unchanged: safe / conditional / reopen.',
  },
  {
    id: '1.4',
    label: 'Approved variation plans',
    note: 'Variation bets H1–H6 approved before any building. Global CTA toggle is a diagnostic, not a multiplier.',
  },
  {
    id: '1.5',
    label: 'Round 1 builds',
    note: 'H1–H6 built as real applied surfaces using locked systems only. No Hero / Motion / Voice / Footer imports.',
  },
  {
    id: '1.6',
    label: 'Round 1 narrowing',
    note: 'Review pass. Which directions survive to Round 2. Killed directions retain their why-cut record.',
  },
  {
    id: '1.7',
    label: 'Round 2 refinement',
    note: 'Survivors sharpened. New variation bets re-enter at 1.4 — never appear here.',
  },
  {
    id: '1.8',
    label: 'Round 2 review',
    note: 'Survivors re-judged at refined depth. Set narrows toward provisional winner + backup.',
  },
  {
    id: '1.9',
    label: 'Pre-lock pass',
    note: 'Asset honesty + system conformance + anti-drift checked across surviving directions.',
  },
  {
    id: '1.10',
    label: 'Final review under Gate A frame',
    note: 'Surfaces judged as hiring-facing pages. Recruiter Skim Audit dry-run on the survivors.',
  },
  {
    id: '1.11',
    label: 'Homepage provisional lock',
    note: 'Output: 1 provisional winner + 1 provisional backup carry forward. NOT a final lock.',
  },
];

const STAYS_UNCHANGED = [
  {
    label: 'Global CTA toggle',
    note: 'Diagnostic — cross-variation comparison instrument. Not a multiplier on H1–H6, not its own variation.',
  },
  {
    label: '6 homepage variation bets',
    note: 'H1, H2, H3, H4, H5, H6. No expansion under Part 1. New bets re-enter at 1.4 with re-approval.',
  },
  {
    label: 'Permission categories',
    note: 'safe / conditional / reopen — three categories carried verbatim from prior scaffold.',
  },
  {
    label: 'Workflow',
    note: 'Claude deep dive → refine here → approved plan → Claude builds → review. No build before approval.',
  },
];

const NOT_DOING = [
  'Lock a final homepage. Final lock waits for Hero (#8) + standard-cards grid validation.',
  'Start Part 2 (Ion track). Ion is worked separately under its own 8 docs at applied-surfaces-v2/ion/.',
  'Reopen locked systems (Project Card · Typography · Spacing · Navigation · Media · Color W1). Part 1 applies them.',
  'Touch the Hero system. Hero is the next system-definition workstream (Phase 1.5 #8).',
  'Touch the standard-cards grid. Grid validation is downstream of Part 1.',
  'Modify Narrow 4 work. Narrow 4 feeds the Project Card System; Part 1 consumes it.',
  'Convert the Homepage Surfaces v2 Lab into the Gate A track. v2 lab stays as research substrate input to 1.2.',
];

const FINAL_LOCK_TRIGGERS = [
  {
    label: 'Phase 1.5 #8 — Hero system locked',
    note: 'Hero composition decides which homepage layout finally locks. Hero changes the read of everything below it.',
  },
  {
    label: 'Standard-cards grid validated against real portfolio content',
    note: 'Real proof / framing / status / year / asset density for all 5 projects pushed through the grid.',
  },
];


export function GateAPlanIndex() {
  useResetIdentityToggles();
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
          Part 1 · Homepage track · LOCKED · 2026-04-25
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
        Gate A · revised outline · Part 1 of 4
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
        Homepage track locked as a workflow.
        <br />
        Output is a provisional winner, not a final lock.
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
          marginBottom: 24,
        }}
      >
        The 1.1–1.11 workflow is locked. Step 1.11 produces a provisional winner + 1 backup that carry forward — not a final homepage lock. Final lock is deferred until two preconditions are met: Phase 1.5 #8 — Hero system is locked, AND the standard-cards grid is validated against real portfolio content. Hero composition decides which homepage layout finally locks; the grid that holds standard cards is unvalidated against real density. Until both hold, the homepage carries a winner + backup, not a single final answer.
      </p>
      <p
        style={{
          fontFamily: IS,
          fontSize: 13,
          fontWeight: 400,
          lineHeight: 1.6,
          color: 'var(--dir-text-secondary)',
          maxWidth: 780,
          margin: 0,
          marginBottom: 64,
        }}
      >
        Source of truth: <code style={{ fontFamily: IS, fontSize: 12, color: 'var(--dir-text-primary)' }}>docs/labs/applied-surfaces/homepage/gate-a-homepage-track-locked.md</code>. Master plan Part 1 LOCKED section: <code style={{ fontFamily: IS, fontSize: 12, color: 'var(--dir-text-primary)' }}>docs/labs/applied-surfaces/gate-a-master-plan.md</code>.
      </p>

      {/* Locked workflow */}
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
          Locked workflow · 1.1 → 1.11
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
          }}
        >
          {STEPS.map((s) => {
            const isProvisional = s.id === '1.11';
            return (
              <div
                key={s.id}
                style={{
                  padding: 24,
                  backgroundColor: isProvisional ? 'var(--dir-raised)' : 'transparent',
                  border: isProvisional
                    ? '1px solid var(--dir-text-primary)'
                    : '1px solid var(--dir-border)',
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
                      color: 'var(--dir-text-secondary)',
                    }}
                  >
                    {s.id}
                  </span>
                  {isProvisional && (
                    <span
                      style={{
                        fontFamily: IS,
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--dir-text-primary)',
                        padding: '2px 8px',
                        border: '1px solid var(--dir-text-primary)',
                      }}
                    >
                      Provisional · winner + backup
                    </span>
                  )}
                </div>
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
                  {s.label}
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
                  {s.note}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Output of Part 1 */}
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
          Output of Part 1
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
          }}
        >
          <div
            style={{
              padding: 24,
              backgroundColor: 'var(--dir-raised)',
              border: '1px solid var(--dir-text-primary)',
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
              Provisional winner
            </p>
            <h3
              style={{
                fontFamily: IS,
                fontSize: 18,
                fontWeight: 500,
                color: 'var(--dir-text-primary)',
                margin: 0,
                marginBottom: 8,
              }}
            >
              1 candidate · pending 1.11
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
              Locked at Part 1's depth. Hands forward to the post-Hero + grid validation pass.
            </p>
          </div>
          <div
            style={{
              padding: 24,
              backgroundColor: 'transparent',
              border: '1px solid var(--dir-border)',
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
              Provisional backup
            </p>
            <h3
              style={{
                fontFamily: IS,
                fontSize: 18,
                fontWeight: 500,
                color: 'var(--dir-text-primary)',
                margin: 0,
                marginBottom: 8,
              }}
            >
              1 candidate · pending 1.11
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
              Vetted at Part 1's depth. Absorbs the risk that Hero or grid validation invalidates the winner.
            </p>
          </div>
        </div>
      </section>

      {/* Final lock triggers */}
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
          Final homepage lock · deferred until both triggers hold
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
          }}
        >
          {FINAL_LOCK_TRIGGERS.map((t) => (
            <div
              key={t.label}
              style={{
                padding: 24,
                border: '1px solid var(--dir-border)',
              }}
            >
              <h3
                style={{
                  fontFamily: IS,
                  fontSize: 15,
                  fontWeight: 500,
                  lineHeight: 1.35,
                  color: 'var(--dir-text-primary)',
                  margin: 0,
                  marginBottom: 8,
                }}
              >
                {t.label}
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
                {t.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stays unchanged */}
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
          What stays unchanged
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
          }}
        >
          {STAYS_UNCHANGED.map((s) => (
            <div
              key={s.label}
              style={{
                padding: 24,
                border: '1px solid var(--dir-border)',
              }}
            >
              <h3
                style={{
                  fontFamily: IS,
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--dir-text-primary)',
                  margin: 0,
                  marginBottom: 8,
                }}
              >
                {s.label}
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
                {s.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What Part 1 does NOT do */}
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
          What Part 1 does NOT do
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
          {NOT_DOING.map((line, i) => (
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
                Not
              </span>
              <span style={{ flex: 1 }}>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Cross-track navigation */}
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
          Gate A tracks
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <NavLink
            to="/gate-a"
            style={{
              fontFamily: IS,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-secondary)',
              textDecoration: 'none',
              padding: '6px 12px',
              border: '1px solid var(--dir-border)',
            }}
          >
            Gate A hub
          </NavLink>
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
            }}
          >
            Part 2 · Ion track →
          </NavLink>
        </div>
      </section>

      {/* Lab linkbacks */}
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
          Lab modes · research substrate
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
          The Homepage Surfaces v2 Lab is the research substrate Part 1 consumes at step 1.2. It stays open as input. Mode entries below.
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {[
            { to: '/', label: 'Layout · 37 candidates' },
            { to: '/surface', label: 'Surface · 37 candidates' },
            { to: '/combo', label: 'Combo · 1,369 pairs' },
            { to: '/narrow-1', label: 'Narrow 1' },
            { to: '/narrow-2', label: 'Narrow 2' },
            { to: '/narrow-3', label: 'Narrow 3' },
            { to: '/narrow-4', label: 'Narrow 4 · card register' },
            { to: '/cards', label: 'Cards family' },
            { to: '/tiles', label: 'Tiles family' },
          ].map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              style={{
                fontFamily: IS,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--dir-text-primary)',
                textDecoration: 'none',
                padding: '6px 12px',
                border: '1px solid var(--dir-border)',
              }}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </section>
    </Page1120>
  );
}
