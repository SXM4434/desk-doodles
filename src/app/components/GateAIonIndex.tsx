import React from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from './cards/tokens';
import { Page1120 } from './layouts/PageInset';

const ION_STEPS: { id: string; label: string; note: string }[] = [
  {
    id: '2.1',
    label: 'Setup',
    note: 'File-structure / planning-structure · source-of-truth hierarchy · artifact inventory shell · scope lock for 2.x.',
  },
  {
    id: '2.2',
    label: 'Research',
    note: 'Deep read of OG Ion outline + visual outline (anti-drift caveat applied) + locked systems. Tensions surfaced.',
  },
  {
    id: '2.3',
    label: 'Permission mapping',
    note: 'Three categories: safe / conditional / reopen — applied to Ion case-page surfaces.',
  },
  {
    id: '2.4',
    label: 'Approved variation plans',
    note: 'Ion variation bets I1–I6 approved before any building. Earliest entry point for Artifact A / B authoring.',
  },
  {
    id: '2.5',
    label: 'Round 1 builds',
    note: 'DEFERRED — baseline airtight pass runs first (cross-system rules build, see docs/system/cross-system-rules-build-plan.md). Once baseline locks, R1 builds resume: I1–I6 built as real applied surfaces using locked systems only.',
  },
  {
    id: '2.6',
    label: 'Round 1 narrowing',
    note: 'Review pass. Which directions survive to Round 2. Killed directions retain their why-cut record.',
  },
  {
    id: '2.7',
    label: 'Round 2 refinement',
    note: 'Survivors sharpened. New variation bets re-enter at 2.4 — never appear here.',
  },
  {
    id: '2.8',
    label: 'Round 2 review',
    note: 'Survivors re-judged at refined depth. Set narrows toward provisional Ion case page.',
  },
  {
    id: '2.9',
    label: 'Pre-lock pass',
    note: 'Asset honesty + system conformance + anti-drift checked across surviving directions.',
  },
  {
    id: '2.10',
    label: 'Ion provisional lock',
    note: 'Output: 1 provisional Ion case page carries forward into Gate A Case Study Deep Dive review.',
  },
];

const ION_NOT_DOING_AT_R1 = [
  'Build final I1–I6 surfaces. R1 builds are structure drafts — layout, module order, content flow. Not final visual polish.',
  'Author final Artifact A or Artifact B. R1 may include rough diagram POCs only — no final artifact production.',
  'Rewrite case-study copy. The OG narrative is locked as the primary content source.',
  'Modify the live Ion case page implementation. The live page is reference-only across all of Part 2.',
  'Modify any locked system doc. Gate A applies the locked systems; it does not redefine them.',
  'Inherit visual-outline chrome (full-bleed dark, ScrollReveal, sticky TOC, Reframe panel/callout chrome, motion notes). Anti-drift caveat per setup §4.',
  'Import systems not yet locked (Hero, Motion, Voice, Footer). Locked inputs only.',
  'Invent product media. Missing UI screens = structural placeholders labeled as such.',
];

export function GateAIonIndex() {
  return (
    <Page1120>
      {/* Status banner */}
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
          Part 2 · Ion track · ACTIVE · 2.4 COMPLETE · BASELINE AIRTIGHT PASS BEFORE 2.5
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
        Gate A · revised outline · Part 2 of 4
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
        Ion case page.
        <br />
        Baseline airtight pass active. I1–I6 deferred until baseline locks.
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
          marginBottom: 16,
        }}
      >
        Steps 2.1–2.4 are complete as of 2026-04-27. 2.4 locked I1–I6 as planning directions in gate-a-ion-variation-space.md. Before R1 builds (2.5) start, a baseline airtight pass runs — composition layer that resolves how the 7 locked input systems compose into case-study sections. Plan: docs/system/cross-system-rules-build-plan.md. Once baseline composition rules lock + apply across §01–§09, 2.5 R1 builds resume per the original I1–I6 directions. Variation work is deferred, not cancelled.
      </p>
      <p
        style={{
          fontFamily: IS,
          fontSize: 13,
          fontWeight: 300,
          lineHeight: 1.6,
          color: 'var(--dir-text-secondary)',
          maxWidth: 780,
          margin: 0,
          marginBottom: 32,
        }}
      >
        Active source of truth: <code style={{ fontFamily: IS, fontSize: 12, color: 'var(--dir-text-primary)' }}>docs/system/cross-system-rules-build-plan.md</code> (baseline airtight pass plan). Variation work source of truth (deferred): <code style={{ fontFamily: IS, fontSize: 12, color: 'var(--dir-text-primary)' }}>docs/labs/applied-surfaces-v2/ion/gate-a-ion-variation-space.md</code>. Module-by-module build plan: <code style={{ fontFamily: IS, fontSize: 12, color: 'var(--dir-text-primary)' }}>gate-a-ion-approved-variation-plan.md</code>. Secondary: <code style={{ fontFamily: IS, fontSize: 12, color: 'var(--dir-text-primary)' }}>gate-a-ion-permission-map.md</code> · <code style={{ fontFamily: IS, fontSize: 12, color: 'var(--dir-text-primary)' }}>gate-a-ion-research.md</code> · <code style={{ fontFamily: IS, fontSize: 12, color: 'var(--dir-text-primary)' }}>gate-a-ion-artifact-inventory.md</code>.
      </p>

      {/* Workflow 2.1 → 2.10 */}
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
          Workflow · 2.1 → 2.10
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
          }}
        >
          {ION_STEPS.map((s) => {
            const isComplete = s.id === '2.1' || s.id === '2.2' || s.id === '2.3' || s.id === '2.4';
            const isActive = s.id === '2.4';
            const isNext = s.id === '2.5';
            return (
              <div
                key={s.id}
                style={{
                  padding: 24,
                  backgroundColor: isActive ? 'var(--dir-raised)' : 'transparent',
                  border: isActive
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
                  {isActive && (
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
                      Complete · 2026-04-27
                    </span>
                  )}
                  {isComplete && !isActive && (
                    <span
                      style={{
                        fontFamily: IS,
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--dir-text-secondary)',
                        padding: '2px 8px',
                        border: '1px solid var(--dir-border)',
                      }}
                    >
                      Complete
                    </span>
                  )}
                  {isNext && (
                    <span
                      style={{
                        fontFamily: IS,
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--dir-text-secondary)',
                        padding: '2px 8px',
                        border: '1px solid var(--dir-border)',
                      }}
                    >
                      Next
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

      {/* Current Part 2 state */}
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
          Current Part 2 state · post-2.4 · baseline airtight pass
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
          }}
        >
          <div style={{ padding: 24, border: '1px solid var(--dir-border)' }}>
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
              Variation space · 2.4 complete
            </p>
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
              I1–I6 locked as planning directions · 15-section doc
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
              gate-a-ion-variation-space.md created. Per-bet thesis, module emphasis, artifact dependency, S/C-code permissions, risk register, cross-variation comparison table, artifact approval set, forbidden moves, 2.5 R1 handoff. Same fused Hero baseline across all six. C-14 not ratified.
            </p>
          </div>
          <div style={{ padding: 24, border: '1px solid var(--dir-border)' }}>
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
              Artifact A · Artifact B
            </p>
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
              R1 POC candidates · approved in 2.4 · NOT built in 2.1–2.4
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
              Artifact A required for I2 + I3. Artifact B required for I3, optional for I2. Candidacy approved in 2.4 plan. Authoring starts no earlier than 2.5 R1.
            </p>
          </div>
          <div style={{ padding: 24, border: '1px solid var(--dir-border)' }}>
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
              Source-of-truth hierarchy
            </p>
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
              OG narrative → visual notes (ref-only) → locked systems → live impl (ref-only)
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
              Visual-noted outline is reference-only for artifact identification. Anti-drift caveat applied: do NOT inherit full-bleed dark, ScrollReveal, sticky TOC, Reframe chrome, motion notes.
            </p>
          </div>
          <div style={{ padding: 24, border: '1px solid var(--dir-border)' }}>
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
              Gate A review
            </p>
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
              Not started
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
              Gate A Case Study Deep Dive runs after 2.10 produces a provisional Ion case page. No review under 2.1, 2.2, 2.3, or 2.4.
            </p>
          </div>
        </div>
      </section>

      {/* What R1 does NOT do */}
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
          What 2.5 R1 does NOT do (rules apply once R1 resumes)
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
          {ION_NOT_DOING_AT_R1.map((line, i) => (
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

      {/* R1 workspace link */}
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
          R1 workspace
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
          The R1 workspace at /gate-a/ion/r1 is the active build surface. Currently used for the baseline airtight pass — §03 register directions, persona track, artifact playground, and cross-system rules application all live there. Once the baseline locks, this same workspace continues into the I1–I6 R1 build round.
        </p>
        <NavLink
          to="/gate-a/ion/r1"
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
          R1 workspace → active (baseline airtight pass)
        </NavLink>
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
          Separate space exploring 18 research artifacts as standalone components — independent of any single section's render. Default content from real Ion materials where available; synthesized content explicitly marked. Per playground plan §10 — Step 3 page shell complete; Step 4 will populate the 18 artifact components.
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
          Artifact playground → 16 artifacts catalogued
        </NavLink>
      </section>

      {/* Back to hub */}
      <section style={{ marginBottom: 64 }}>
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
            display: 'inline-block',
          }}
        >
          ← Gate A hub
        </NavLink>
      </section>
    </Page1120>
  );
}
