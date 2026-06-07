import React from 'react';
import { IS, ISe, CD } from './cards/tokens';
import type { GateAIonS03PersonaArtifact } from '../state/GateAIonS03PersonaArtifactContext';
import type { GateAIonS03PersonaContentDensity } from '../state/GateAIonS03PersonaContentDensityContext';
import { useGateAIonS03NativePersonaLayout } from '../state/GateAIonS03NativePersonaLayoutContext';
import { useGateAIonBorderRadius } from '../state/GateAIonBorderRadiusContext';
import { TraitCluster } from './artifacts/E1PersonaTraitVisualization';
import { ION_PERSONA_TRAITS } from './artifacts/data/ion-persona-traits';
import type { E1State } from '../state/GateAIonArtifactPlaygroundContext';
import { useGateAIonS03ExtE1ThemesStyle } from '../state/GateAIonS03ExtE1ThemesStyleContext';
import { useGateAIonS03ExtE1LeanDirection } from '../state/GateAIonS03ExtE1LeanDirectionContext';

// EXT.E1 — overlap-spider trait-cluster (restored 2026-05-18 per user request).
// Single chart, both personas plotted as overlapping polygons on 3 bidirectional
// axes (one per spectrum). Each persona sits on whichever side of center they
// lean toward; distance from center = lean strength. Two polygons in opposing
// quadrants = direct visual proof of "two opposing user types." Raised-card
// composition per W1 locked F1 Panel 04/06 (raised-bg + border + radius +
// padding 24). Voice quotes rendered below the chart paired with marker
// indicators that match polygon style (filled vs outlined dashed).
const E1_TRAIT_CLUSTER_STATE: E1State = {
  variant: 'trait-cluster',
  spectrumCount: 3,
  personaCount: 2,
  annotations: 'off',
  derivedMarkers: 'on',
  endpointLabels: 'caps-micro',
  markerStyle: 'pill',
};

function E1TraitClusterStandalone({ personas }: { personas: readonly ArtifactPersona[] }) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  const voiceQuotes = personas.map((p) => p.quote);
  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: '1px solid var(--dir-border)', padding: 24, borderRadius, marginBottom: 24 }}>
      <TraitCluster state={E1_TRAIT_CLUSTER_STATE} voiceQuotes={voiceQuotes} />
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0, marginTop: 24 }}>
        Lighter labels · inferred from interview themes (not directly asked)
      </p>
    </div>
  );
}

// §03 Persona Artifact components — REPLACE the inline persona callout when active.
// 12 artifacts per `docs/labs/applied-surfaces-v2/ion/gate-a-ion-s03-phase-a-research.md`
// Track 2 (2026-05-05 · Family 1 revised 2026-05-16: 1.A/1.B cut → 1.D/1.E added).
//
// Each artifact does the callout's content job (persona names + value statements + quotes)
// in a heavier or structurally distinct register. Toggle behavior: `none` = callout renders;
// any artifact selection REPLACES the callout entirely. They never both render.
//
// W1 + type lock (IS/ISe/CD only · no ISe italic · no orange · no AI-smell traps).

// Persona shape matches S03_DATA.personas in GateAIonR1Shell.tsx
export type ArtifactPersona = {
  name: string;
  value: string;
  quote: string;
  themeTags?: string;
};

export type PersonaArtifactProps = {
  personas: readonly ArtifactPersona[];
};

// ─── Source-attributed verbatim quotes (Leyi affinity-map :47-93) ──────────────────
// Used by 1.E Themed-coded quote chorus. Chorus weight needs multiple source-traced
// quotes per persona; persona.quote alone is one quote. Quotes below are direct
// transcriptions from Leyi's published affinity-map screenshot, with named-source
// attribution per the affinity-map convention. NO INVENTED QUOTES.
const LEYI_CHORUS_QUOTES: Record<string, ReadonlyArray<{ theme: string; body: string; source: string }>> = {
  'Workflow-Focused': [
    { theme: 'Speed', body: 'ruby enters convo to validate these decisions and speed up his workflow and make it more efficient — bc he has limited time', source: 'Florence Chow' },
    { theme: 'Handoff', body: 'Wants Ruby to unblock engineers on asyn design request', source: 'Esther Pelaez' },
    { theme: 'Communication', body: 'Client is interested in the integration of design partner in Slack — resolves the issue of context switching with AI tools', source: 'Dora Zhang' },
  ],
  'Creative Control Seekers': [
    { theme: 'Control', body: 'They look for continuous & proactive design, feedback & updates, and end-to-end support', source: 'Dora Zhang' },
    { theme: 'Review', body: 'Wants ruby with context she has (PRD + personas), to critique the flows', source: 'Esther Pelaez' },
    { theme: 'Insights', body: 'Hopes that this tool gives them back time to focus on the discovery, product, and strategic piece', source: 'Esther Pelaez' },
  ],
};

const CHORUS_SOURCE_LINE = 'From 22 designer interviews · affinity sort · our discovery research';

// ─── Token atoms (mirror GateAIonR1Shell.tsx — keep in sync) ───────────────────────
// Locked type registers per typography-system.md (Cycle 11 close 2026-05-15).
// Core size ladder: 10 · 11 · 13 · 15 · 22 · 32 · 52. IS 18 DROPPED entirely. ISe sizes: 18 italic
// (Pull quote only, with side line) · 22 (Section Heading / content title) · 32 (Intro Heading).
// CD reserved for display tier (CD 52 hero). 28px proof-numeral exception IS 400 only.
const CAPS: React.CSSProperties = { fontFamily: IS, fontSize: 10, fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', margin: 0 };
const CAPS_13: React.CSSProperties = { fontFamily: IS, fontSize: 13, fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', margin: 0 };
const H2_CONTENT: React.CSSProperties = { fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.25, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 };
const BODY: React.CSSProperties = { fontFamily: IS, fontSize: 15, fontWeight: 400, lineHeight: 1.5, color: 'var(--dir-text-body)', margin: 0 };
const DENSE: React.CSSProperties = { fontFamily: IS, fontSize: 13, fontWeight: 400, lineHeight: 1.6, color: 'var(--dir-text-body)', margin: 0 };
const DENSE_SOFT: React.CSSProperties = { ...DENSE, color: 'var(--dir-text-body-soft)' };
const CAPTION: React.CSSProperties = { fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.4, color: 'var(--dir-text-secondary)', margin: 0 };
// Proof-numeral exception (Type spec §F): IS 400 · 28px · LH 1.0 · letterSpacing −0.03em · tabular-nums.
const PROOF_28: React.CSSProperties = { fontFamily: IS, fontSize: 28, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' as const, color: 'var(--dir-text-primary)', margin: 0 };
const INK_POP: React.CSSProperties = { color: 'var(--dir-text-primary)', fontWeight: 500 };
const RULE_HAIRLINE = '1px solid var(--dir-border)';

// ─── Source-grounded affinity-map cluster counts (Leyi `:47-93`) ──────────────────────
// Used to weight visual encodings (theme-density bars) by actual post-it count per cluster.
// Workflow-Focused cluster counts: Quick design requests (5) · Communication (2) · Unblock handoff (5).
// Creative Control Seekers cluster counts: Styles alignment (6) · Design Review (4) · Insights finding (4).
const LEYI_CLUSTER_COUNTS: Record<string, ReadonlyArray<{ theme: string; count: number }>> = {
  'Workflow-Focused': [
    { theme: 'Quick design requests', count: 5 },
    { theme: 'Communication', count: 2 },
    { theme: 'Unblock handoff', count: 5 },
  ],
  'Creative Control Seekers': [
    { theme: 'Styles alignment', count: 6 },
    { theme: 'Design Review', count: 4 },
    { theme: 'Insights finding', count: 4 },
  ],
};

// ─── Visual encoding helpers ─────────────────────────────────────────────────────────
// Each visual ENCODES persona content (themes, n=22 cohort, value-on-axis), not chrome.

// Theme-density bar — 3 segments per persona, segment width proportional to affinity-cluster
// post-it count (Leyi `:47-93`). Encodes "this cohort's themes cluster around X."
function ThemeDensityBar({ persona, height = 4 }: { persona: ArtifactPersona; height?: number }) {
  const clusters = LEYI_CLUSTER_COUNTS[persona.name] ?? [];
  const total = clusters.reduce((acc, c) => acc + c.count, 0);
  if (total === 0) return null;
  return (
    <div style={{ display: 'flex', height, gap: 1 }} aria-label={`Theme density for ${persona.name}`}>
      {clusters.map((c, i) => (
        <div
          key={i}
          style={{ flex: c.count / total, backgroundColor: 'var(--dir-text-primary)' }}
          title={`${c.theme} · ${c.count} posts`}
        />
      ))}
    </div>
  );
}

// 22-cell sparkline — visualizes the n=22 research base. No per-cohort claim (source silent).
// Used in journal-abstract + narrated-prose registers where research-base scale is the credibility marker.
function Cohort22Sparkline({ inline = false }: { inline?: boolean }) {
  const cellStyle: React.CSSProperties = { width: 3, height: 10, backgroundColor: 'var(--dir-text-primary)', display: 'inline-block' };
  return (
    <span style={{ display: inline ? 'inline-flex' : 'flex', gap: 1, verticalAlign: 'middle', margin: inline ? '0 4px' : 0 }} aria-label="n=22 cohort base">
      {Array.from({ length: 22 }).map((_, i) => (
        <span key={i} style={cellStyle} />
      ))}
    </span>
  );
}

// Value-axis indicator — small horizontal scale from Speed-pole to Control-pole, persona dots
// positioned per source-grounded tradeoff (Leyi §1: "tradeoff between empowering creativity vs.
// speeding automation"). Workflow-Focused near Speed pole, Creative Control Seekers near Control pole.
// Dot position encodes the value statement geometrically.
function ValueAxisIndicator({ personas }: { personas: readonly ArtifactPersona[] }) {
  const positions: Record<string, number> = {
    'Workflow-Focused': 0.15,           // near Speed pole — source: "values speed & efficiency"
    'Creative Control Seekers': 0.85,   // near Control pole — source: "values creativity, control & craft"
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 8 }}>
      <span style={CAPS}>Speed</span>
      <div style={{ flex: 1, height: 1, backgroundColor: 'var(--dir-border)', position: 'relative' }}>
        {personas.map((p) => {
          const pos = positions[p.name] ?? 0.5;
          return (
            <div
              key={p.name}
              style={{ position: 'absolute', left: `${pos * 100}%`, top: -4, width: 8, height: 8, backgroundColor: 'var(--dir-text-primary)', transform: 'translateX(-50%)', borderRadius: '50%' }}
              title={p.name}
              aria-label={p.name}
            />
          );
        })}
      </div>
      <span style={CAPS}>Control</span>
    </div>
  );
}

// Theme-tag rail — hairline horizontal rule divided into segments labeled with themes.
// Used as compact theme-attribution under quotes (2.A pull-quote diptych).
function ThemeTagRail({ persona }: { persona: ArtifactPersona }) {
  const themes = (persona.themeTags ?? '').split('·').map((t) => t.trim()).filter(Boolean);
  if (themes.length === 0) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${themes.length}, 1fr)`, columnGap: 8, marginTop: 8 }}>
      {themes.map((t, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ height: 1, backgroundColor: 'var(--dir-border)' }} aria-hidden="true" />
          <p style={CAPS}>{t}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Density-aware merged content (used by NativePersonaCalloutBlock only) ─────────
// Per-density render of one persona's content. Cohesive merging: each line stays at a
// SINGLE typographic register — no inline size jumps mid-line. Merging happens horizontally
// at the content level (commas / em-dashes), not vertically at the typographic-register level.

function valueText(persona: ArtifactPersona): string {
  return persona.value.replace(/^Values?\s+/i, '').toLowerCase();
}
function themesText(persona: ArtifactPersona): string {
  return (persona.themeTags ?? '').split('·').map((t) => t.trim()).filter(Boolean).join(' · ').toLowerCase();
}

// Option A · 4 treatments — each line a distinct register, connections explicit.
//   Eyebrow ties cohort size + value framing as the analytical-context line.
//   ISe name = the named cohort.
//   BODY quote = the cohort's verbatim evidence.
//   CAPTION = "Voiced themes" prefix ties the cluster list to interview voice (= what the quote represents).
function DensityABlock({ persona, isSideBySide = false }: { persona: ArtifactPersona; isSideBySide?: boolean }) {
  // Body register: DENSE 13 in compressed-context (1fr 1fr side-by-side), BODY 15 in main-flow stacked.
  // Per Cycle 2 lock — DENSE earns "compressed-container only / cards / sub-grids / 1fr 1fr layouts."
  const bodyReg = isSideBySide ? DENSE : BODY;
  return (
    <>
      <p style={{ ...CAPS, marginBottom: 8 }}>User type · 22 designers · values {valueText(persona)}</p>
      <p style={{ ...H2_CONTENT, marginBottom: 12 }}>{persona.name}</p>
      <p style={{ ...bodyReg, marginBottom: 8 }}>{persona.quote}</p>
      <p style={CAPTION}>What we heard across 22 interviews · {themesText(persona)}</p>
    </>
  );
}

// Option B · 3 treatments — name+value merged at single ISe register via comma compound.
//   The comma between name and value reads as a single named-content statement.
//   CAPTION themes line keeps "Voiced across" prefix to tie themes to interview voice.
function DensityBBlock({ persona }: { persona: ArtifactPersona }) {
  return (
    <>
      <p style={{ ...H2_CONTENT, marginBottom: 12 }}>{persona.name}, values {valueText(persona)}</p>
      <p style={{ ...BODY, marginBottom: 8 }}>{persona.quote}</p>
      <p style={CAPTION}>What we heard across 22 interviews · {themesText(persona)}</p>
    </>
  );
}

// Option C · 2 treatments — maximum merge. Two registers total: ISe 22 + BODY 15.
//   Line 1 (ISe 22 H2 content): named cohort + value compound.
//   Line 2 (BODY 15 main-flow): themes-as-subject prose sentence with verbatim quote as evidence.
//   n=22 context lives in wrapper eyebrow (NativePersonaCalloutBlock), not duplicated here.
//   BODY 15 (not DENSE 13) pairs with the ISe 22 H2 title — DENSE 13 is compressed-context
//   register, not appropriate under a content title that talks about a cohort.
function DensityCBlock({ persona }: { persona: ArtifactPersona }) {
  const themes = (persona.themeTags ?? '').split('·').map((t) => t.trim()).filter(Boolean);
  const themesPhrase = themes.length === 0
    ? ''
    : themes.length === 1
      ? themes[0].toLowerCase()
      : themes.slice(0, -1).map((t) => t.toLowerCase()).join(', ') + ', and ' + themes[themes.length - 1].toLowerCase();
  const themesLead = themesPhrase.charAt(0).toUpperCase() + themesPhrase.slice(1);
  return (
    <>
      <p style={{ ...H2_CONTENT, marginBottom: 8 }}>{persona.name}, values {valueText(persona)}</p>
      <p style={BODY}>
        {themesLead} kept surfacing — captured by one of them:{' '}
        {/* Verbatim quote at Inline emphasis register (IS 15 / 600 italic) per Cycle 4 lock —
            sanctioned "max emphasis" register for inline body emphasis. The quote IS the verbatim
            cohort voice; deserves the inline emphasis treatment within the prose. */}
        <span style={{ fontWeight: 600, fontStyle: 'italic' }}>{persona.quote}</span>
      </p>
    </>
  );
}

// NativePersonaCalloutBlock — replaces direction-native persona callout when density != 'original'
// AND personaArtifact === 'none'. Uniform across all directions (direction-specific register is
// the 'original' default; merged states are direction-agnostic). Exported for use in shell.
export function NativePersonaCalloutBlock({
  personas,
  density,
}: {
  personas: readonly ArtifactPersona[];
  density: 'A-4treat' | 'B-3treat' | 'C-2treat';
}) {
  const { state: layout } = useGateAIonS03NativePersonaLayout();
  const isSideBySide = layout === 'side-by-side';
  return (
    <div style={{ marginBottom: 48 }}>
      <p style={{ ...CAPS, marginBottom: 16 }}>Two user types emerged · 22 designer interviews</p>
      <div
        style={
          isSideBySide
            ? { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 24, paddingTop: 12, borderTop: '1px solid var(--dir-border)' }
            : undefined
        }
      >
        {personas.map((p, pi) => (
          <div
            key={p.name}
            style={
              isSideBySide
                ? {}
                : {
                    paddingTop: pi === 0 ? 12 : 16,
                    paddingBottom: pi < personas.length - 1 ? 16 : 0,
                    borderTop: '1px solid var(--dir-border)',
                  }
            }
          >
            {density === 'A-4treat' && <DensityABlock persona={p} />}
            {density === 'B-3treat' && <DensityBBlock persona={p} />}
            {density === 'C-2treat' && <DensityCBlock persona={p} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────────
// Family 1 · Data journalism
// ───────────────────────────────────────────────────────────────────────────────────

// 1.C · Persona-divided journey strip (Pew small-multiples 2×5 shape)
// Spec: Phase A Track 2 lines 359-369. Two parallel rows × 5-step Ion workflow.
// Source: Ion canonical 5-step workflow (Slack → Open → Prompt → Generate → Handoff).
// Markers source-grounded via Leyi affinity-map dropoff/friction patterns where supported.
export function Artifact1C({ personas }: PersonaArtifactProps) {
  // Canonical 5-step Ion workflow (per case-study-outline-source.md §06 + affinity-map).
  const STEPS = ['Slack', 'Open', 'Prompt', 'Generate', 'Handoff'] as const;
  // Per-persona × per-step friction markers. Per Phase A 1.C spec ("markers when source supports
  // it") + flag #66 close ("dropoff markers invented where source is silent" is an AI-smell trap):
  // ONLY source-grounded markers.
  // - Workflow-Focused × Handoff: Esther Pelaez "Wants Ruby to unblock engineers on asyn design
  //   request" (Leyi `:89`) — directly source-attributed handoff friction.
  // - Creative Control Seekers × Generate: Leyi Insights Block 2 "Manual vs. Generative" header
  //   "Users want and need creative control to remain authentic. ... most AI usage drop-offs are
  //   caused by execution limitations between users' vision and actual outcomes" (Leyi `:130-134`)
  //   — directly attributes execution/Generate-step friction to this cohort.
  // - All other persona × step cells: source silent → no marker (asymmetric is honest).
  const FRICTION: Record<string, ReadonlyArray<boolean>> = {
    'Workflow-Focused':         [false, false, false, false, true ],
    'Creative Control Seekers': [false, false, false, true,  false],
  };

  return (
    <div style={{ borderTop: RULE_HAIRLINE, paddingTop: 16, marginBottom: 24 }}>
      <p style={{ ...CAPS, marginBottom: 12 }}>Two user types × Ion workflow</p>
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', columnGap: 16 }}>
        {/* Header row: row label spacer + step labels */}
        <div />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', columnGap: 8, paddingBottom: 8, borderBottom: RULE_HAIRLINE }}>
          {STEPS.map((step, i) => (
            <p key={i} style={{ ...CAPS, textAlign: 'left' }}>{step}</p>
          ))}
        </div>
        {/* One row per persona */}
        {personas.map((p, pi) => {
          const markers = FRICTION[p.name] ?? [false, false, false, false, false];
          return (
            <React.Fragment key={p.name}>
              <div style={{ paddingTop: 12, paddingBottom: pi < personas.length - 1 ? 12 : 0, borderBottom: pi < personas.length - 1 ? RULE_HAIRLINE : 'none' }}>
                <p style={{ ...DENSE, fontWeight: 500, color: 'var(--dir-text-primary)' }}>{p.name}</p>
                <p style={{ ...CAPTION, marginTop: 4 }}>{p.themeTags ?? ''}</p>
              </div>
              <div style={{ paddingTop: 12, paddingBottom: pi < personas.length - 1 ? 12 : 0, borderBottom: pi < personas.length - 1 ? RULE_HAIRLINE : 'none', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', columnGap: 8, alignItems: 'center' }}>
                {markers.map((hasMarker, si) => (
                  <div key={si} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    {hasMarker ? (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--dir-text-primary)' }} aria-label="friction marker" />
                    ) : (
                      <div style={{ width: 8, height: 8, border: '1px solid var(--dir-detail)', borderRadius: '50%' }} aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <p style={{ ...CAPTION, marginTop: 12 }}>Filled disc = source-supported friction point · open disc = neutral step. {CHORUS_SOURCE_LINE}</p>
    </div>
  );
}

// 1.D · Pew typology comparison table (★ native + 1A · added 2026-05-16)
// Spec: Phase A Track 2 1.D. Rows = attributes, columns = personas. Top + bottom hairline
// rules bracket the table, no inner gridlines. Pew Political/Religious Typology register.
export function Artifact1D({ personas }: PersonaArtifactProps) {
  // Attribute rows are source-grounded (value field + themeTags field + verbatim quote).
  // Adding more rows risks invention; sticking to source-traced attributes only.
  const ATTRIBUTE_ROWS = [
    { label: 'Primary value', key: 'value' as const },
    { label: 'Recurring themes', key: 'themeTags' as const },
  ];

  return (
    <div style={{ borderTop: '1px solid var(--dir-text-primary)', borderBottom: '1px solid var(--dir-text-primary)', paddingTop: 16, paddingBottom: 16, marginBottom: 24 }}>
      <p style={{ ...CAPS, marginBottom: 16 }}>Two user types we identified · interview synthesis</p>
      {/* Header row: persona names + theme-density bar per persona (encodes affinity-cluster strength) */}
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', columnGap: 24, paddingBottom: 12, borderBottom: RULE_HAIRLINE }}>
        <div />
        {personas.map((p) => (
          <div key={p.name}>
            <p style={H2_CONTENT}>{p.name}</p>
            <div style={{ marginTop: 8 }}>
              <ThemeDensityBar persona={p} />
            </div>
          </div>
        ))}
      </div>
      {/* Attribute rows */}
      {ATTRIBUTE_ROWS.map((row, ri) => (
        <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', columnGap: 24, paddingTop: 12, paddingBottom: 12 }}>
          <p style={{ ...CAPS }}>{row.label}</p>
          {personas.map((p) => (
            <p key={`${row.label}-${p.name}`} style={DENSE}>{p[row.key] ?? '—'}</p>
          ))}
        </div>
      ))}
      {/* Quote footer row */}
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', columnGap: 24, paddingTop: 12, borderTop: RULE_HAIRLINE }}>
        <p style={CAPS}>Verbatim</p>
        {personas.map((p) => (
          <p key={`q-${p.name}`} style={{ ...BODY, color: 'var(--dir-text-body)' }}>{p.quote}</p>
        ))}
      </div>
      <p style={{ ...CAPTION, marginTop: 16 }}>{CHORUS_SOURCE_LINE}</p>
    </div>
  );
}

// 1.E · Affinity-map coding sheet (research artifact visualization — added 2026-05-16)
// Redesigned 2026-05-16: the literal research artifact (affinity-map post-it grouping) IS
// the visualization. The reader sees a 2-column post-it stack (one per cohort) where each
// post-it represents an affinity-cluster theme. Post-it box size scales with affinity-cluster
// post-it count (Leyi `:47-93` — visual encoding of theme weight). Cohort identity emerges
// from the visual pattern of stacked post-its per column. NOT a callout transcription —
// this is a research-method visualization (affinity sort coding sheet, the methodology used
// to derive the cohorts in the first place).
export function Artifact1E({ personas }: PersonaArtifactProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      {/* Header — what the reader is looking at, in plain words */}
      <p style={{ ...CAPS, marginBottom: 16, textAlign: 'center' }}>Themes from 22 designer interviews · grouped by recurring pattern</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 24 }}>
        {personas.map((p) => {
          const clusters = LEYI_CLUSTER_COUNTS[p.name] ?? [];
          const totalMentions = clusters.reduce((sum, c) => sum + c.count, 0);
          return (
            <div key={p.name} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Cohort column header */}
              <p style={{ ...CAPS_13, marginBottom: 12, paddingBottom: 12, borderBottom: RULE_HAIRLINE }}>{p.name}</p>
              {/* Theme stack — each box represents one recurring theme from research.
                  Box vertical padding scales with how often the theme came up (more mentions
                  = visually larger box). Hairline-bordered boxes = research-coding visual. */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {clusters.map((c) => {
                  // Vertical padding scales with mention count: 2 mentions ≈ 10px, 6 mentions ≈ 26px
                  const paddingY = 8 + (c.count - 2) * 4;
                  return (
                    <div
                      key={c.theme}
                      style={{
                        border: RULE_HAIRLINE,
                        padding: `${Math.max(paddingY, 8)}px 14px`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                      title={`${c.theme} — came up ${c.count} times across interviews`}
                    >
                      <p style={{ ...DENSE, color: 'var(--dir-text-primary)', fontWeight: 500 }}>{c.theme}</p>
                      <p style={CAPTION}>came up {c.count}× across interviews</p>
                    </div>
                  );
                })}
              </div>
              {/* Column total — cohort-level mention count */}
              <p style={{ ...CAPTION, marginTop: 12, textAlign: 'right' }}>{totalMentions} mentions across interviews</p>
            </div>
          );
        })}
      </div>
      {/* Footer — explains what the reader is seeing, no jargon */}
      <p style={{ ...CAPTION, marginTop: 16, paddingTop: 8, borderTop: RULE_HAIRLINE, textAlign: 'center' }}>
        Each box is one theme that came up across 22 designer interviews. Box size shows how often that theme repeated. The two columns show the two user types we identified from which themes grouped together.
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────────
// Family 2 · Editorial print
// ───────────────────────────────────────────────────────────────────────────────────

// 2.A · Pull-quote diptych (★ 2A)
// Spec: Phase A Track 2 lines 369-379. Spec called for "ISe 32 or 52 (NOT italic)" — DOWNGRADED
// to ISe 22 H2_CONTENT register per type lock: ISe 32 reserved for §03 section heading (register
// conflict); ISe 52 off-ladder. Persona quote earns ISe 22 per Cycle 11 content-vs-marker rule
// (verbatim quote is content, not a structural marker).
export function Artifact2A({ personas }: PersonaArtifactProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      {personas.map((p, pi) => (
        <div key={p.name} style={{ paddingTop: pi === 0 ? 0 : 24, paddingBottom: pi < personas.length - 1 ? 24 : 0, borderTop: pi > 0 ? RULE_HAIRLINE : 'none' }}>
          <p style={{ ...CAPS, marginBottom: 12 }}>{p.name}</p>
          <p style={H2_CONTENT}>{p.quote}</p>
          {/* Theme-tag rail — hairline-segmented theme attribution under the pull-quote.
              Encodes the cohort's affinity-map themes visually adjacent to the quote that voices them. */}
          <ThemeTagRail persona={p} />
        </div>
      ))}
    </div>
  );
}

// 2.B · Annotated typographic portrait pair (★ 2B + 2C)
// Spec: Phase A Track 2 lines 381-391. Spec called ISe 52 — DOWNGRADED to ISe 32 (the only
// ISe display size in locked ladder; ISe 52 off-ladder). Persona name earns ISe 32 Intro
// Heading register here as the "typography IS the portrait" anchor (register conflict with
// §03 section heading accepted as a per-direction earned exception — the artifact's whole
// concept depends on hero-typographic anchor; falling to ISe 22 collapses the concept).
export function Artifact2B({ personas }: PersonaArtifactProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      {personas.map((p, pi) => {
        const traits = (p.themeTags ?? '').split('·').map((t) => t.trim()).filter(Boolean).slice(0, 3);
        return (
          <div key={p.name} style={{ paddingTop: pi === 0 ? 0 : 24, paddingBottom: pi < personas.length - 1 ? 24 : 0, borderTop: pi > 0 ? RULE_HAIRLINE : 'none' }}>
            <div style={{ position: 'relative', minHeight: 80, display: 'grid', gridTemplateColumns: '1fr', alignItems: 'center', justifyItems: 'center' }}>
              <p style={{ fontFamily: ISe, fontSize: 32, fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0, textAlign: 'center' }}>
                {p.name}
              </p>
            </div>
            {/* Annotation labels — positioned below the name in N columns, source-grounded from themeTags */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(traits.length, 1)}, 1fr)`, columnGap: 16, marginTop: 16, paddingTop: 12, borderTop: RULE_HAIRLINE }}>
              {traits.map((t, ti) => (
                <div key={ti} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 1, backgroundColor: 'var(--dir-text-primary)', marginBottom: 4 }} aria-hidden="true" />
                  <p style={{ ...CAPS }}>{t}</p>
                </div>
              ))}
            </div>
            <p style={{ ...CAPTION, marginTop: 12 }}>{p.value}</p>
          </div>
        );
      })}
    </div>
  );
}

// 2.C · Two-named-subject magazine feature spread (★ 2C if rec'd)
// Redesigned 2026-05-16 per visual-vocabulary thinking: the magazine-feature register IS
// the visualization. Two-column featured-subjects layout where the chapter-numeral +
// named-subject headline + pull-quote + themes byline COMPOSE an editorial spread visual.
// Cohort identity reads through magazine-spread chrome (chapter marks + columnar composition
// + named-subject framing), not through callout content stacked vertically. ValueAxisIndicator
// at top encodes Speed↔Control position geometrically.
export function Artifact2C({ personas }: PersonaArtifactProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      {/* Value-axis indicator — geometrically encodes cohort position on Speed↔Control axis.
          Visual moment that doesn't need text label of the value statement. */}
      <ValueAxisIndicator personas={personas} />
      {/* Featured-subjects header — magazine convention */}
      <p style={{ ...CAPS, marginTop: 16, marginBottom: 16 }}>Featured subjects · two user types</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 32 }}>
        {personas.map((p, pi) => (
          <div key={p.name} style={{ paddingTop: 16, borderTop: RULE_HAIRLINE }}>
            {/* Chapter numeral — CD proof-tier as magazine chapter mark */}
            <p style={{ fontFamily: CD, fontSize: 22, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 12 }}>
              No. {String(pi + 1).padStart(2, '0')}
            </p>
            {/* Subject headline — ISe 22 named-content register */}
            <p style={{ ...H2_CONTENT, marginBottom: 12 }}>{p.name}</p>
            {/* Pull-quote — the magazine pull-quote moment, BODY register */}
            <p style={{ ...BODY, marginBottom: 12 }}>{p.quote}</p>
            {/* Byline — magazine byline framing for themes (ties themes to interview voice) */}
            <p style={CAPTION}>What we heard across interviews: {(p.themeTags ?? '').toLowerCase()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────────
// Family 3 · Out-of-the-box
// ───────────────────────────────────────────────────────────────────────────────────

// 3.A · Twin framed-tombstone pair (museum gallery card chrome — redesigned 2026-05-16)
// The full hairline-framed card chrome IS the museum tombstone visual. Two adjacent tombstones
// (museum wall convention: paired labels for related works). Each card frames its own contained
// content with metadata header → named subject → interpretive line → themes footer. The frame
// is the visual identity — reader sees "two museum-label cards displayed side by side."
export function Artifact3A({ personas }: PersonaArtifactProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16 }}>
        {personas.map((p, pi) => (
          <div
            key={p.name}
            style={{
              border: RULE_HAIRLINE,
              padding: '20px 20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {/* Tombstone metadata header — museum-card convention */}
            <p style={CAPS}>{String(pi + 1).padStart(2, '0')} · User research · 2024</p>
            {/* Named subject — primary tombstone label */}
            <p style={H2_CONTENT}>{p.name}</p>
            {/* Interpretive line — value + verbatim quote inline (museum interpretive paragraph register) */}
            <p style={BODY}>
              {p.value}. {p.quote}
            </p>
            {/* Bottom-of-card themes — separated by hairline (museum tombstone footer convention) */}
            {p.themeTags && (
              <p style={{ ...CAPTION, paddingTop: 8, marginTop: 'auto', borderTop: RULE_HAIRLINE }}>
                What we heard: {p.themeTags.toLowerCase()}
              </p>
            )}
          </div>
        ))}
      </div>
      {/* Gallery-wall footer — sample base sparkline (museum wall context: scope of the show) */}
      <div style={{ paddingTop: 12, marginTop: 16, borderTop: RULE_HAIRLINE, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <span style={CAPS}>Discovery research · 22 designer interviews</span>
        <Cohort22Sparkline />
      </div>
    </div>
  );
}

// 3.B · Structured-abstract participants block (★ 3B · JAMA/NEJM register)
// Spec: Phase A Track 2 lines 421-431. Single block headed `Participants.` (IS UC 10),
// flat structured-abstract paragraph naming both personas inline. CD 10 inline n=.
// Em-dash separator. Hairline rule above. No card.
export function Artifact3B({ personas }: PersonaArtifactProps) {
  return (
    <div style={{ marginBottom: 24, paddingTop: 16, borderTop: RULE_HAIRLINE }}>
      {/* Inline structured-abstract: total n=22 + named cohorts + themes per cohort.
          22-cell sparkline visually encodes n=22 base inline next to the Participants. label. */}
      <p style={{ ...CAPS, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>Participants.</span>
        <Cohort22Sparkline inline />
      </p>
      <p style={BODY}>
        <span style={INK_POP}>22 designers</span> in two named user types:
        {personas.map((p, pi) => (
          <React.Fragment key={p.name}>
            {' '}<span style={INK_POP}>{p.name}</span>
            {p.themeTags ? <span> — {p.themeTags.toLowerCase()}</span> : null}
            {pi < personas.length - 1 ? '; ' : '.'}
          </React.Fragment>
        ))}
        {' Cohorts assigned by sorting interview transcripts into recurring themes.'}
      </p>
      <div style={{ marginTop: 12 }}>
        {personas.map((p) => (
          <p key={p.name} style={{ ...DENSE, marginTop: 4 }}>
            <span style={INK_POP}>{p.name}:</span> {p.quote}
          </p>
        ))}
      </div>
    </div>
  );
}

// 3.C · Letter-prose named-cohort passage (★ 3A · Berkshire/Stripe letter voice)
// Spec: Phase A Track 2 lines 433-443. IS 15 body prose, persona names ink-popped,
// quotes embedded with quotation marks. No frame.
export function Artifact3C({ personas }: PersonaArtifactProps) {
  if (personas.length < 2) return null;
  const [a, b] = personas;
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={BODY}>
        Two shapes of designer kept showing up in the synthesis.{' '}
        <span style={INK_POP}>{a.name}</span> designers prized {a.value.replace(/^Values?\s+/i, '').toLowerCase()} —
        {' '}as one of them put it, {a.quote}.{' '}
        <span style={INK_POP}>{b.name}</span> wanted something different: {b.value.replace(/^Values?\s+/i, '').toLowerCase()}.
        {' '}From a Creative Control Seeker we kept hearing some version of {b.quote}.
        {' '}The contrast wasn't a continuum — these were two distinct postures, each grounded in different work realities.
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────────
// Family 4 · Design portfolio
// ───────────────────────────────────────────────────────────────────────────────────

// 4.A · Hairline-bordered persona card pair (★ 4A · Bill Guo / Leyi screenshot 17)
// Spec: Phase A Track 2 lines 449-459. Spec called ISe 22 name + ISe 32 value — value
// DOWNGRADED to BODY 15 (ISe 32 reserved for §03 section heading; using ISe 32 here creates
// register conflict; persona name keeps ISe 22 as named content per Cycle 11 earning rule;
// value statement falls to BODY paragraph register inside the card). IS 11 Caption byline
// (locked substitute for CD 10).
export function Artifact4A({ personas }: PersonaArtifactProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16, marginBottom: 24 }}>
      {personas.map((p, pi) => (
        <div
          key={p.name}
          style={{
            border: '1px solid var(--dir-border)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Card header — case numeral + label, premium portfolio convention */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <p style={CAPS}>User type</p>
            <p style={{ fontFamily: CD, fontSize: 22, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--dir-text-primary)', margin: 0 }}>
              {String(pi + 1).padStart(2, '0')}
            </p>
          </div>
          {/* Theme-density bar — visual encoding of theme weight per user type */}
          <ThemeDensityBar persona={p} />
          {/* Subject identity */}
          <p style={H2_CONTENT}>{p.name}</p>
          {/* Value statement + verbatim quote */}
          <p style={{ ...BODY, color: 'var(--dir-text-primary)' }}>{p.value}</p>
          <p style={BODY}>{p.quote}</p>
          {/* Card footer — themes attribution, hairline-separated */}
          <p style={{ ...CAPTION, paddingTop: 8, marginTop: 'auto', borderTop: RULE_HAIRLINE }}>
            What we heard: {(p.themeTags ?? '').toLowerCase()}
          </p>
        </div>
      ))}
    </div>
  );
}

// 4.B · Senior-narrated rule-bounded paragraph (★ 4B · van Schneider / Frank Chimero)
// Spec: Phase A Track 2 lines 461-471. IS 15 body, persona names ink-popped, IS 13 quotes,
// CD 10 byline, 1px top + bottom rule (no sides, no fill).
export function Artifact4B({ personas }: PersonaArtifactProps) {
  if (personas.length < 2) return null;
  const [a, b] = personas;
  return (
    <div style={{ borderTop: RULE_HAIRLINE, borderBottom: RULE_HAIRLINE, paddingTop: 16, paddingBottom: 16, marginBottom: 24 }}>
      <p style={BODY}>
        Across <span style={INK_POP}>22 interviews</span>, two distinct user shapes surfaced.{' '}
        <span style={INK_POP}>{a.name}</span> designers — who {a.value.replace(/^Values?\s+/i, 'value ').toLowerCase()} — kept returning to one frustration: {a.quote}.
        {' '}Another user type, <span style={INK_POP}>{b.name}</span>, were looking for something else entirely: they {b.value.replace(/^Values?\s+/i, 'value ').toLowerCase()}, and one of them put it sharply — {b.quote}.
        {' '}Same 22 interviews; two distinct postures.
      </p>
      {/* 22-cell sparkline encodes the n=22 research base — mid-prose visual anchor for narrative claim */}
      <p style={{ ...CAPTION, marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Cohort22Sparkline inline />
        <span>{CHORUS_SOURCE_LINE}</span>
      </p>
    </div>
  );
}

// 4.C · Numbered case-study row pair (★ 4C · MetaLab/Linear Design)
// Spec: Phase A Track 2 lines 473-483. Spec called CD 22 numerals + ISe 18 persona name —
// FIXED: CD reserved for hero display tier (CD 52); numerals use locked IS 28 proof-numeral
// exception (PROOF_28). ISe 18 dropped per Cycle 11 except for Pull quote register (italic +
// side line); persona name = named content → ISe 22 H2_CONTENT. IS 11 Caption byline.
export function Artifact4C({ personas }: PersonaArtifactProps) {
  return (
    <div style={{ marginBottom: 24, borderTop: RULE_HAIRLINE, borderBottom: RULE_HAIRLINE }}>
      {personas.map((p, pi) => (
        <div
          key={p.name}
          style={{
            paddingTop: 20,
            paddingBottom: 20,
            borderTop: pi > 0 ? RULE_HAIRLINE : 'none',
            display: 'grid',
            gridTemplateColumns: '80px 1fr',
            columnGap: 24,
            alignItems: 'start',
          }}
        >
          {/* Case numeral column — proof numeral + sub-label form the case marker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={PROOF_28}>{String(pi + 1).padStart(2, '0')}</p>
            <p style={CAPS}>Case</p>
          </div>
          {/* Content column — hierarchical case description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={H2_CONTENT}>{p.name}</p>
            <p style={BODY}>{p.quote}</p>
            {/* Theme-density bar — visual encoding of theme weight per user type */}
            <ThemeDensityBar persona={p} />
            {/* Case footer — "what we heard" attribution */}
            <p style={CAPTION}>What we heard: {(p.themeTags ?? '').toLowerCase()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────────
// EXT.E1 family · Graph-style persona-trait visualizations (research-driven 2026-05-18)
// ───────────────────────────────────────────────────────────────────────────────────
//
// EXT.E1   = overlap spider (existing — both personas as overlapping polygons)
// EXT.E1.S = slope graph (Tufte) — 2 persona columns, 3 trait lines crossing between
// EXT.E1.B = butterfly chart — central spine, bars extending left/right per trait row
// EXT.E1.P = profile chart (clinical psych) — 3 horizontal trait axes, persona ribbons
//
// All four pull trait positions from ION_PERSONA_TRAITS (3 spectrums × 2 personas)
// and pair with quote voice from the shell's persona data. Each communicates the
// SAME content (name · values · themes · voice) + opposition through a different
// graph paradigm. Locked typography ladder, W1 ink-only.

export function ArtifactExtE1({ personas }: PersonaArtifactProps) {
  return <E1TraitClusterStandalone personas={personas} />;
}

// ─── Shared helpers for E1.S / E1.B / E1.P ─────────────────────────────────────

// Strip "Values " prefix from the persona's values phrase ("Values speed & efficiency"
// → "speed & efficiency") for use as a values-tag eyebrow.
function valuesTag(persona: ArtifactPersona): string {
  return persona.value.replace(/^Values?\s+/i, '').trim();
}

// Get the trait-positions dataset paired with the shell's persona data.
// ION_PERSONA_TRAITS.personas[i] order matches S03_DATA.personas[i] order
// (workflow-focused first, creative-control second). Returns the combined
// view: { id, name, value, quote, themeTags, positions: {primary, process, trust} }
function combinedPersonas(personas: readonly ArtifactPersona[]) {
  return ION_PERSONA_TRAITS.personas.slice(0, 2).map((traitsP, i) => ({
    id: traitsP.id,
    name: personas[i]?.name ?? traitsP.name,
    value: personas[i]?.value ?? traitsP.thesis,
    quote: personas[i]?.quote ?? '',
    primary: ION_PERSONA_TRAITS.spectrums[0].positions[traitsP.id],
    process: ION_PERSONA_TRAITS.spectrums[1].positions[traitsP.id],
    trust: ION_PERSONA_TRAITS.spectrums[2].positions[traitsP.id],
  }));
}

// ─── EXT.E1.S — Slope graph (Tufte) ────────────────────────────────────────────
// Two vertical persona columns (WF left, CCS right). Three trait lines cross
// between them, each plotted at the persona's position (0-100) on the trait's
// spectrum. With the Ion data, two lines slope up-right (Primary, Process —
// CCS higher than WF), one slopes down-right (Trust — WF higher than CCS),
// producing a dramatic crossing pattern that visually communicates opposition.
//
// Per Tufte's "Cancer Survival Rates" slopegraph lineage + Storytelling With
// Data's "Total Organization vs Sales Team" two-group slopegraph precedent.
export function ArtifactExtE1S({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  const combined = combinedPersonas(personas);
  const [wf, ccs] = combined;
  const spectrums = ION_PERSONA_TRAITS.spectrums;

  // Chart geometry — SVG dims include label space at top/bottom + outside columns
  const W = 720, H = 480;
  const LEFT_X = 200, RIGHT_X = W - 200;
  const TOP_Y = 90, BOTTOM_Y = H - 100;
  const RANGE = BOTTOM_Y - TOP_Y;
  const yOf = (pos: number) => BOTTOM_Y - (pos / 100) * RANGE;

  // Build per-trait line geometry
  const lines = spectrums.map((s, idx) => ({
    spectrum: s,
    idx,
    wfY: yOf(s.positions[wf.id]),
    ccsY: yOf(s.positions[ccs.id]),
  }));

  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <div style={{ position: 'relative', width: W, height: H, margin: '0 auto' }}>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {/* Persona column reference lines */}
          <line x1={LEFT_X} y1={TOP_Y - 12} x2={LEFT_X} y2={BOTTOM_Y + 12} stroke="var(--dir-border)" strokeWidth={1} />
          <line x1={RIGHT_X} y1={TOP_Y - 12} x2={RIGHT_X} y2={BOTTOM_Y + 12} stroke="var(--dir-border)" strokeWidth={1} />

          {/* Trait lines — each connects WF position to CCS position */}
          {lines.map((l) => (
            <line
              key={l.spectrum.id}
              x1={LEFT_X}
              y1={l.wfY}
              x2={RIGHT_X}
              y2={l.ccsY}
              stroke="var(--dir-text-primary)"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          ))}

          {/* Persona dots at each (column, position) endpoint */}
          {lines.map((l) => (
            <g key={`dots-${l.spectrum.id}`}>
              <circle cx={LEFT_X} cy={l.wfY} r={6} fill="var(--dir-text-primary)" />
              <circle cx={RIGHT_X} cy={l.ccsY} r={6} fill="var(--dir-bg)" stroke="var(--dir-text-primary)" strokeWidth={2.5} />
            </g>
          ))}
        </svg>

        {/* Column headers — persona names + value tags at top of each column */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: LEFT_X * 2, textAlign: 'center' }}>
          <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{wf.name}</p>
          <p style={{ ...CAPS, color: 'var(--dir-text-secondary)', marginTop: 4 }}>{valuesTag(personas[0])}</p>
        </div>
        <div style={{ position: 'absolute', right: 0, top: 0, width: LEFT_X * 2, textAlign: 'center' }}>
          <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{ccs.name}</p>
          <p style={{ ...CAPS, color: 'var(--dir-text-secondary)', marginTop: 4 }}>{valuesTag(personas[1])}</p>
        </div>

        {/* Per-trait labels — trait name + endpoint labels positioned at line ends */}
        {lines.map((l) => {
          const leftPos = l.spectrum.positions[wf.id];
          const rightPos = l.spectrum.positions[ccs.id];
          const wfLean = leftPos < 50 ? l.spectrum.leftLabel : l.spectrum.rightLabel;
          const ccsLean = rightPos < 50 ? l.spectrum.leftLabel : l.spectrum.rightLabel;
          return (
            <React.Fragment key={`labels-${l.spectrum.id}`}>
              {/* Trait name at line midpoint (above the line) */}
              <p
                style={{
                  position: 'absolute',
                  left: (LEFT_X + RIGHT_X) / 2,
                  top: (l.wfY + l.ccsY) / 2 - 16,
                  transform: 'translate(-50%, -100%)',
                  ...CAPS,
                  color: 'var(--dir-text-primary)',
                  backgroundColor: 'var(--dir-raised)',
                  padding: '0 8px',
                  whiteSpace: 'nowrap',
                  margin: 0,
                }}
              >
                {l.spectrum.axisName}
              </p>
              {/* WF endpoint label (left of WF column) */}
              <p
                style={{
                  position: 'absolute',
                  left: LEFT_X - 16,
                  top: l.wfY,
                  transform: 'translate(-100%, -50%)',
                  ...CAPS,
                  color: 'var(--dir-text-secondary)',
                  textAlign: 'right',
                  margin: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {wfLean}
              </p>
              {/* CCS endpoint label (right of CCS column) */}
              <p
                style={{
                  position: 'absolute',
                  left: RIGHT_X + 16,
                  top: l.ccsY,
                  transform: 'translate(0, -50%)',
                  ...CAPS,
                  color: 'var(--dir-text-secondary)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {ccsLean}
              </p>
            </React.Fragment>
          );
        })}
      </div>

      {/* Voice quotes below the chart — paired with persona name + marker style */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 32 }}>
        <SpiderLegendPanel persona={personas[0]} filled />
        <SpiderLegendPanel persona={personas[1]} filled={false} />
      </div>
    </div>
  );
}

// Legend panel — persona marker indicator (filled vs outlined dot) + name + quote
function SpiderLegendPanel({ persona, filled }: { persona: ArtifactPersona; filled: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: filled ? 'var(--dir-text-primary)' : 'var(--dir-bg)', border: '2px solid var(--dir-text-primary)', flexShrink: 0 }} />
        <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 500, letterSpacing: '-0.005em', color: 'var(--dir-text-primary)', margin: 0 }}>{persona.name}</p>
      </div>
      <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{persona.quote}</p>
    </div>
  );
}

// ─── Shared geometry for E1.C (coxcomb) + E1.R (polar bar) ─────────────────────
// 3 trait spectrums map to 6 endpoint directions (3 axes through center, each
// bipolar). Endpoints are placed at angles 270° (Speeding) / 90° (Empowering) /
// 210° (Hands-off) / 30° (Hands-on) / 150° (Skeptical) / 330° (Trusting).
// For each persona, on each spectrum, we direct the wedge/bar toward whichever
// endpoint they lean toward (pos<50 = leftLabel pole; pos>50 = rightLabel pole).
const SIDE_BY_SIDE_AXIS_ANGLES: Record<string, { left: number; right: number }> = {
  'primary-driver':   { left: 270, right: 90 },   // Speeding(S) ↔ Empowering(N)
  'process-control':  { left: 210, right: 30 },   // Hands-off(SW) ↔ Hands-on(NE)
  'trust-in-output':  { left: 150, right: 330 },  // Skeptical(NW) ↔ Trusting(SE)
};

function polarPt(cx: number, cy: number, angleDeg: number, dist: number): { x: number; y: number } {
  const r = (angleDeg * Math.PI) / 180;
  return { x: cx + Math.cos(r) * dist, y: cy - Math.sin(r) * dist };
}

// ─── EXT.E1.C — Diverging radial coxcomb (Nightingale lineage) ─────────────────
// Per-persona disc with 3 wedges (one per trait). Each wedge occupies the
// hemisphere matching the persona's lean — Workflow-Focused leans south
// (Speeding) + SW (Hands-off) + SE (Trusting), so all 3 wedges sit in the
// lower disc. Creative Control Seekers leans the opposite, so wedges sit in
// the upper disc. Side-by-side = literal mirror image of disc halves.
// Precedent: Nightingale's two-rose Crimean War mortality comparison; the
// canonical "small multiples coxcomb for paired comparison" form.
export function ArtifactExtE1C({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <CoxcombPanel persona={personas[0]} personaIndex={0} filled />
        <CoxcombPanel persona={personas[1]} personaIndex={1} filled={false} />
      </div>
    </div>
  );
}

function CoxcombPanel({ persona, personaIndex, filled }: { persona: ArtifactPersona; personaIndex: number; filled: boolean }) {
  const spectrums = ION_PERSONA_TRAITS.spectrums;
  const personaId = ION_PERSONA_TRAITS.personas[personaIndex].id;
  const CW = 280, CH = 280;
  const CX = CW / 2, CY = CH / 2;
  const MAX_R = 110;
  const WEDGE_HALF_DEG = 30; // 60° wedge → ±30° around the lean pole's angle

  // For each spectrum, compute the wedge: angle range + radius (lean strength)
  const wedges = spectrums.map((s) => {
    const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
    const pos = s.positions[personaId];
    const angleCenter = pos < 50 ? angles.left : angles.right;
    const leanStrength = Math.abs(pos - 50) / 50; // 0..1
    const radius = leanStrength * MAX_R;
    return {
      spectrum: s,
      angleCenter,
      radius,
      pos,
    };
  });

  // Build SVG arc path for each wedge (pie slice from center)
  // SVG arc command: M cx cy L p1 A r r 0 0 0 p2 Z
  const wedgePath = (angleCenter: number, radius: number): string => {
    const a1 = angleCenter - WEDGE_HALF_DEG;
    const a2 = angleCenter + WEDGE_HALF_DEG;
    const p1 = polarPt(CX, CY, a1, radius);
    const p2 = polarPt(CX, CY, a2, radius);
    // sweep flag = 0 (counterclockwise in SVG screen coords because Y is flipped)
    return `M ${CX} ${CY} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${radius} ${radius} 0 0 0 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`;
  };

  // Endpoint labels at perimeter — 6 total, one per spectrum endpoint
  const endpointLabels = spectrums.flatMap((s) => {
    const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
    return [
      { key: `${s.id}-L`, label: s.leftLabel, pt: polarPt(CX, CY, angles.left, MAX_R + 26) },
      { key: `${s.id}-R`, label: s.rightLabel, pt: polarPt(CX, CY, angles.right, MAX_R + 26) },
    ];
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      {/* Header — persona name + values tag */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{persona.name}</p>
        <p style={{ ...CAPS, color: 'var(--dir-text-secondary)', marginTop: 6 }}>{valuesTag(persona)}</p>
      </div>

      {/* Coxcomb canvas */}
      <div style={{ position: 'relative', width: CW, height: CH }}>
        <svg width={CW} height={CH} style={{ position: 'absolute', inset: 0 }}>
          {/* Reference circle at MAX_R — shows the scale */}
          <circle cx={CX} cy={CY} r={MAX_R} fill="none" stroke="var(--dir-border)" strokeWidth={1} strokeDasharray="3 3" />
          {/* Axis lines (light, through center) */}
          {spectrums.map((s) => {
            const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
            const p1 = polarPt(CX, CY, angles.left, MAX_R);
            const p2 = polarPt(CX, CY, angles.right, MAX_R);
            return <line key={s.id} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--dir-border)" strokeWidth={1} />;
          })}
          {/* Wedges — the persona's lean territory */}
          {wedges.map((w) => (
            <path
              key={w.spectrum.id}
              d={wedgePath(w.angleCenter, w.radius)}
              fill={filled ? 'var(--dir-text-primary)' : 'var(--dir-bg)'}
              stroke="var(--dir-text-primary)"
              strokeWidth={filled ? 1 : 2}
              strokeDasharray={filled ? undefined : '5 3'}
              strokeLinejoin="round"
            />
          ))}
          {/* Center dot */}
          <circle cx={CX} cy={CY} r={2} fill="var(--dir-detail)" />
        </svg>
        {/* Endpoint labels at perimeter */}
        {endpointLabels.map((l) => (
          <p
            key={l.key}
            style={{
              position: 'absolute',
              left: l.pt.x,
              top: l.pt.y,
              transform: 'translate(-50%, -50%)',
              ...CAPS,
              color: 'var(--dir-text-secondary)',
              whiteSpace: 'nowrap',
              margin: 0,
              textAlign: 'center',
            }}
          >
            {l.label}
          </p>
        ))}
      </div>

      {/* Voice quote below */}
      <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0, marginTop: 8, textAlign: 'center', maxWidth: 320 }}>
        {persona.quote}
      </p>
    </div>
  );
}

// ─── EXT.E1.R — Polar bar chart per persona ────────────────────────────────────
// Per-persona disc with 3 thin bars radiating from center, each bar at the
// trait's lean-pole angle, bar length = lean strength. Cleaner / more
// instrument-like than the coxcomb. Same side-by-side mirror-image effect
// because both personas have bars in opposing hemispheres.
// Precedent: Highcharts radial bar, Nivo polar bar — modern data-viz library
// canon for "asymmetric radial distribution" displays.
export function ArtifactExtE1R({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <PolarBarPanel persona={personas[0]} personaIndex={0} filled />
        <PolarBarPanel persona={personas[1]} personaIndex={1} filled={false} />
      </div>
    </div>
  );
}

function PolarBarPanel({ persona, personaIndex, filled }: { persona: ArtifactPersona; personaIndex: number; filled: boolean }) {
  const spectrums = ION_PERSONA_TRAITS.spectrums;
  const personaId = ION_PERSONA_TRAITS.personas[personaIndex].id;
  const CW = 280, CH = 280;
  const CX = CW / 2, CY = CH / 2;
  const MAX_R = 110;
  const BAR_WIDTH = 18;

  const bars = spectrums.map((s) => {
    const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
    const pos = s.positions[personaId];
    const angle = pos < 50 ? angles.left : angles.right;
    const leanStrength = Math.abs(pos - 50) / 50;
    return {
      spectrum: s,
      angle,
      length: leanStrength * MAX_R,
    };
  });

  // Build a rectangle aligned along the radial axis from center outward
  const barPath = (angle: number, length: number): string => {
    // The bar is a rectangle of width BAR_WIDTH centered on the radial axis.
    // 4 corners in polar: (perpendicular_offset, distance_from_center)
    const perp = angle + 90;
    const halfW = BAR_WIDTH / 2;
    const c1 = polarPt(CX, CY, perp, halfW);
    const c2 = polarPt(CX, CY, perp, -halfW);
    const c3 = polarPt(c2.x, c2.y, angle, length);
    const c4 = polarPt(c1.x, c1.y, angle, length);
    return `M ${c1.x.toFixed(2)} ${c1.y.toFixed(2)} L ${c2.x.toFixed(2)} ${c2.y.toFixed(2)} L ${c3.x.toFixed(2)} ${c3.y.toFixed(2)} L ${c4.x.toFixed(2)} ${c4.y.toFixed(2)} Z`;
  };

  const endpointLabels = spectrums.flatMap((s) => {
    const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
    return [
      { key: `${s.id}-L`, label: s.leftLabel, pt: polarPt(CX, CY, angles.left, MAX_R + 26) },
      { key: `${s.id}-R`, label: s.rightLabel, pt: polarPt(CX, CY, angles.right, MAX_R + 26) },
    ];
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{persona.name}</p>
        <p style={{ ...CAPS, color: 'var(--dir-text-secondary)', marginTop: 6 }}>{valuesTag(persona)}</p>
      </div>

      <div style={{ position: 'relative', width: CW, height: CH }}>
        <svg width={CW} height={CH} style={{ position: 'absolute', inset: 0 }}>
          {/* Reference circle */}
          <circle cx={CX} cy={CY} r={MAX_R} fill="none" stroke="var(--dir-border)" strokeWidth={1} strokeDasharray="3 3" />
          {/* Axis lines */}
          {spectrums.map((s) => {
            const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
            const p1 = polarPt(CX, CY, angles.left, MAX_R);
            const p2 = polarPt(CX, CY, angles.right, MAX_R);
            return <line key={s.id} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--dir-border)" strokeWidth={1} />;
          })}
          {/* Bars — the persona's lean strength on each trait */}
          {bars.map((b) => (
            <path
              key={b.spectrum.id}
              d={barPath(b.angle, b.length)}
              fill={filled ? 'var(--dir-text-primary)' : 'var(--dir-bg)'}
              stroke="var(--dir-text-primary)"
              strokeWidth={filled ? 1 : 2}
              strokeDasharray={filled ? undefined : '5 3'}
              strokeLinejoin="round"
            />
          ))}
          {/* Center dot */}
          <circle cx={CX} cy={CY} r={2} fill="var(--dir-detail)" />
        </svg>
        {endpointLabels.map((l) => (
          <p
            key={l.key}
            style={{
              position: 'absolute',
              left: l.pt.x,
              top: l.pt.y,
              transform: 'translate(-50%, -50%)',
              ...CAPS,
              color: 'var(--dir-text-secondary)',
              whiteSpace: 'nowrap',
              margin: 0,
              textAlign: 'center',
            }}
          >
            {l.label}
          </p>
        ))}
      </div>

      <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0, marginTop: 8, textAlign: 'center', maxWidth: 320 }}>
        {persona.quote}
      </p>
    </div>
  );
}

// ─── EXT.E1.B — Butterfly chart (Pew-style divergent bars) ─────────────────────
// 3 horizontal trait rows, central spine. Each persona's bar extends from the
// spine toward their lean direction; bar length = lean strength (|pos - 50|).
// Per row, axis is oriented so WF lean = left, CCS lean = right (consistent
// visual side per persona). Trust row's natural axis is flipped to maintain
// consistency. Pole labels at each row's outer ends.
//
// Per Pew Research "Distance between Democrats and Republicans" divergent
// stacked bars; Heiberger & Robbins 2014 Likert-scale paper.
export function ArtifactExtE1B({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  const combined = combinedPersonas(personas);
  const [wf, ccs] = combined;
  const spectrums = ION_PERSONA_TRAITS.spectrums;

  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      {/* Header — persona name legend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32, alignItems: 'baseline' }}>
        <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 16, height: 16, backgroundColor: 'var(--dir-text-primary)', flexShrink: 0 }} />
          <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.2, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{wf.name}</p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
          <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.2, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{ccs.name}</p>
          <div style={{ width: 16, height: 16, backgroundColor: 'var(--dir-bg)', border: '2px solid var(--dir-text-primary)', flexShrink: 0 }} />
        </div>
      </div>

      {/* 3 butterfly rows — one per trait */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {spectrums.map((s) => {
          const wfPos = s.positions[wf.id];
          const ccsPos = s.positions[ccs.id];
          // WF lean: which endpoint does WF lean toward?
          const wfLean = wfPos < 50 ? s.leftLabel : s.rightLabel;
          // CCS lean: which endpoint does CCS lean toward?
          const ccsLean = ccsPos < 50 ? s.leftLabel : s.rightLabel;
          // Bar length = lean strength (0..100 → 0..50% of half-width)
          const wfBarPct = Math.abs(wfPos - 50);
          const ccsBarPct = Math.abs(ccsPos - 50);
          return (
            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Trait name eyebrow + derived flag */}
              <p style={{ ...CAPS_13, color: 'var(--dir-text-primary)' }}>
                {s.axisName}
                {s.derived && <span style={{ ...CAPS, color: 'var(--dir-detail)', marginLeft: 8 }}>· Derived</span>}
              </p>
              {/* Butterfly row — pole label · bar · spine · bar · pole label */}
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr 180px', alignItems: 'center', gap: 12 }}>
                <p style={{ ...CAPTION, textAlign: 'right', color: 'var(--dir-text-secondary)' }}>{wfLean}</p>
                {/* WF half — bar extends from RIGHT (spine) toward LEFT (pole) */}
                <div style={{ position: 'relative', height: 20 }}>
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 4,
                    height: 12,
                    width: `${wfBarPct * 2}%`,
                    backgroundColor: 'var(--dir-text-primary)',
                  }} />
                </div>
                {/* CCS half — bar extends from LEFT (spine) toward RIGHT (pole) */}
                <div style={{ position: 'relative', height: 20, borderLeft: '1.5px solid var(--dir-text-primary)' }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 4,
                    height: 12,
                    width: `${ccsBarPct * 2}%`,
                    border: '1.5px solid var(--dir-text-primary)',
                    backgroundColor: 'var(--dir-bg)',
                  }} />
                </div>
                <p style={{ ...CAPTION, textAlign: 'left', color: 'var(--dir-text-secondary)' }}>{ccsLean}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Voice quotes below */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 32 }}>
        <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[0].quote}</p>
        <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0, textAlign: 'right' }}>{personas[1].quote}</p>
      </div>
    </div>
  );
}

// ─── EXT.E1.P — Profile chart (clinical psych variant) ────────────────────────
// 3 horizontal trait axes stacked vertically. Each axis has pole labels at
// both ends + each persona plotted as a dot at their position. Vertical lines
// (ribbons) connect each persona's dots across all 3 axes — the line silhouette
// IS the personality signature. Two opposing ribbons threading in opposite
// directions = mirror-image polylines = visual proof of opposition.
//
// Per clinical psychology profile-analysis convention (Eysenck/MMPI/Big Five
// latent profile analysis). The polyline-as-signature reading is the form's
// strength.
export function ArtifactExtE1P({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  const combined = combinedPersonas(personas);
  const [wf, ccs] = combined;
  const spectrums = ION_PERSONA_TRAITS.spectrums;

  // Chart geometry
  const W = 720;
  const ROW_H = 80;       // height per trait row (axis + label space)
  const AXIS_LEFT = 160;  // x offset for axis start
  const AXIS_RIGHT = W - 160;
  const AXIS_W = AXIS_RIGHT - AXIS_LEFT;
  const H = ROW_H * spectrums.length + 40; // total chart height
  const xOf = (pos: number) => AXIS_LEFT + (pos / 100) * AXIS_W;
  const rowY = (idx: number) => 32 + idx * ROW_H + ROW_H / 2;

  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <div style={{ position: 'relative', width: W, height: H, margin: '0 auto' }}>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {/* Horizontal axis lines — one per trait row */}
          {spectrums.map((s, idx) => (
            <line
              key={`axis-${s.id}`}
              x1={AXIS_LEFT}
              y1={rowY(idx)}
              x2={AXIS_RIGHT}
              y2={rowY(idx)}
              stroke="var(--dir-border)"
              strokeWidth={1}
            />
          ))}

          {/* WF ribbon — connects WF's positions across all 3 rows */}
          <polyline
            points={spectrums.map((s, idx) => `${xOf(s.positions[wf.id])},${rowY(idx)}`).join(' ')}
            fill="none"
            stroke="var(--dir-text-primary)"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          {/* CCS ribbon — connects CCS's positions across all 3 rows */}
          <polyline
            points={spectrums.map((s, idx) => `${xOf(s.positions[ccs.id])},${rowY(idx)}`).join(' ')}
            fill="none"
            stroke="var(--dir-text-primary)"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            strokeLinejoin="round"
          />

          {/* Persona dots per row */}
          {spectrums.map((s, idx) => (
            <g key={`dots-${s.id}`}>
              <circle cx={xOf(s.positions[wf.id])} cy={rowY(idx)} r={6} fill="var(--dir-text-primary)" />
              <circle cx={xOf(s.positions[ccs.id])} cy={rowY(idx)} r={6} fill="var(--dir-bg)" stroke="var(--dir-text-primary)" strokeWidth={2.5} />
            </g>
          ))}
        </svg>

        {/* Row labels (left + right pole + trait name) */}
        {spectrums.map((s, idx) => (
          <React.Fragment key={`labels-${s.id}`}>
            {/* Trait name at row top */}
            <p
              style={{
                position: 'absolute',
                left: AXIS_LEFT,
                top: 32 + idx * ROW_H + ROW_H / 2 - 28,
                ...CAPS_13,
                color: 'var(--dir-text-primary)',
                margin: 0,
              }}
            >
              {s.axisName}
              {s.derived && <span style={{ ...CAPS, color: 'var(--dir-detail)', marginLeft: 8 }}>· Derived</span>}
            </p>
            {/* Left pole label */}
            <p
              style={{
                position: 'absolute',
                left: AXIS_LEFT - 16,
                top: rowY(idx),
                transform: 'translate(-100%, -50%)',
                ...CAPS,
                color: 'var(--dir-text-secondary)',
                textAlign: 'right',
                whiteSpace: 'nowrap',
                margin: 0,
              }}
            >
              {s.leftLabel}
            </p>
            {/* Right pole label */}
            <p
              style={{
                position: 'absolute',
                left: AXIS_RIGHT + 16,
                top: rowY(idx),
                transform: 'translate(0, -50%)',
                ...CAPS,
                color: 'var(--dir-text-secondary)',
                whiteSpace: 'nowrap',
                margin: 0,
              }}
            >
              {s.rightLabel}
            </p>
          </React.Fragment>
        ))}
      </div>

      {/* Voice quotes below — paired with marker indicator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 32 }}>
        <SpiderLegendPanel persona={personas[0]} filled />
        <SpiderLegendPanel persona={personas[1]} filled={false} />
      </div>
    </div>
  );
}

// ─── EXT.E1.H — Hofstede-style vertical bar chart per persona ─────────────────
// Two side-by-side per-persona panels. Each panel = 3 vertical bars (one per
// trait spectrum). Bar height = persona's position 0-100. The bar-landscape
// silhouette per panel IS the persona's identity (high-high-low vs low-low-high).
// Direct precedent: Hofstede country comparison bar charts
// (theculturefactor.com/country-comparison-tool) — the canonical "2 entities ×
// N traits, opposite silhouettes" data-viz pattern, published for decades.
export function ArtifactExtE1H({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <HofstedeBarPanel persona={personas[0]} personaIndex={0} filled />
        <HofstedeBarPanel persona={personas[1]} personaIndex={1} filled={false} />
      </div>
    </div>
  );
}

function HofstedeBarPanel({ persona, personaIndex, filled }: { persona: ArtifactPersona; personaIndex: number; filled: boolean }) {
  const spectrums = ION_PERSONA_TRAITS.spectrums;
  const personaId = ION_PERSONA_TRAITS.personas[personaIndex].id;
  const CHART_H = 200;
  const BAR_W = 56;
  const BAR_GAP = 32;
  const CHART_W = spectrums.length * BAR_W + (spectrums.length - 1) * BAR_GAP + 40;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{persona.name}</p>
        <p style={{ ...CAPS, color: 'var(--dir-text-secondary)', marginTop: 6 }}>{valuesTag(persona)}</p>
      </div>
      <div style={{ position: 'relative', height: CHART_H + 50, width: CHART_W }}>
        <svg width={CHART_W} height={CHART_H + 8} style={{ position: 'absolute', left: 0, top: 0 }}>
          {[0, 50, 100].map((y) => {
            const yPos = CHART_H - (y / 100) * CHART_H + 4;
            return <line key={y} x1={32} y1={yPos} x2={CHART_W} y2={yPos} stroke="var(--dir-border)" strokeWidth={1} strokeDasharray={y === 50 ? '3 3' : undefined} />;
          })}
          {spectrums.map((s, idx) => {
            const pos = s.positions[personaId];
            const barH = (pos / 100) * CHART_H;
            const barX = 40 + idx * (BAR_W + BAR_GAP);
            const barY = CHART_H - barH + 4;
            return (
              <rect
                key={s.id}
                x={barX}
                y={barY}
                width={BAR_W}
                height={barH}
                fill={filled ? 'var(--dir-text-primary)' : 'var(--dir-bg)'}
                stroke="var(--dir-text-primary)"
                strokeWidth={filled ? 0 : 2}
              />
            );
          })}
        </svg>
        {[0, 50, 100].map((y) => {
          const yPos = CHART_H - (y / 100) * CHART_H + 4;
          return <p key={`tick-${y}`} style={{ position: 'absolute', left: 0, top: yPos, transform: 'translateY(-50%)', ...CAPS, color: 'var(--dir-text-secondary)', margin: 0 }}>{y}</p>;
        })}
        {spectrums.map((s, idx) => {
          const barX = 40 + idx * (BAR_W + BAR_GAP) + BAR_W / 2;
          return (
            <p key={`xlabel-${s.id}`} style={{ position: 'absolute', left: barX, top: CHART_H + 16, transform: 'translateX(-50%)', ...CAPS, color: 'var(--dir-text-primary)', margin: 0, textAlign: 'center', lineHeight: 1.2, width: BAR_W + 24 }}>
              {s.axisName}
            </p>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {spectrums.map((s) => (
          <p key={s.id} style={{ ...CAPS, color: 'var(--dir-text-secondary)', margin: 0 }}>
            {s.axisName}: <span style={INK_POP}>{s.leftLabel}</span> 0 ↔ 100 <span style={INK_POP}>{s.rightLabel}</span>
          </p>
        ))}
      </div>
      <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0, marginTop: 4 }}>
        {persona.quote}
      </p>
    </div>
  );
}

// ─── EXT.E1.M — Pew/Spotify small multiples (bipolar spectrum bars) ────────────
// Two side-by-side per-persona panels. Each panel = 3 stacked horizontal bipolar
// spectrum rows. Pole labels at row ends; dot at the persona's position. The
// dot-cluster pattern per panel reads as the persona's signature.
// Precedent: Pew Research small multiples + Spotify Wrapped listening-personality
// bipolar spectrum bars.
export function ArtifactExtE1M({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <SmallMultiplesPanel persona={personas[0]} personaIndex={0} filled />
        <SmallMultiplesPanel persona={personas[1]} personaIndex={1} filled={false} />
      </div>
    </div>
  );
}

function SmallMultiplesPanel({ persona, personaIndex, filled }: { persona: ArtifactPersona; personaIndex: number; filled: boolean }) {
  const spectrums = ION_PERSONA_TRAITS.spectrums;
  const personaId = ION_PERSONA_TRAITS.personas[personaIndex].id;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch' }}>
      <div>
        <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{persona.name}</p>
        <p style={{ ...CAPS, color: 'var(--dir-text-secondary)', marginTop: 6 }}>{valuesTag(persona)}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {spectrums.map((s) => {
          const pos = s.positions[personaId];
          return (
            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ ...CAPS, color: 'var(--dir-text-primary)' }}>
                {s.axisName}
                {s.derived && <span style={{ color: 'var(--dir-detail)', marginLeft: 8 }}>· Derived</span>}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center' }}>
                <p style={{ ...CAPTION, color: 'var(--dir-text-secondary)', textAlign: 'right', whiteSpace: 'nowrap' }}>{s.leftLabel}</p>
                <div style={{ position: 'relative', height: 20 }}>
                  <div style={{ position: 'absolute', left: 0, right: 0, top: 9, height: 2, backgroundColor: 'var(--dir-border)' }} />
                  <div style={{ position: 'absolute', left: '50%', top: 6, width: 1, height: 8, backgroundColor: 'var(--dir-detail)', transform: 'translateX(-50%)' }} />
                  <div style={{
                    position: 'absolute',
                    left: `${pos}%`,
                    top: 2,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: filled ? 'var(--dir-text-primary)' : 'var(--dir-bg)',
                    border: '2px solid var(--dir-text-primary)',
                    transform: 'translateX(-50%)',
                  }} />
                </div>
                <p style={{ ...CAPTION, color: 'var(--dir-text-secondary)', textAlign: 'left', whiteSpace: 'nowrap' }}>{s.rightLabel}</p>
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0, marginTop: 8 }}>
        {persona.quote}
      </p>
    </div>
  );
}

// ─── EXT.E1.A — Merged cluster (OG aesthetic + callout content embedded) ───────
// Two side-by-side per-persona radial clusters. Preserves the OG cluster look
// (persona pill at center · all 6 trait endpoints visible · radiating labels ·
// connecting lines · distance from pill encodes alignment) but MERGES the
// C-2treat callout's content INTO the cluster visually:
//
//   - persona NAME → pill at center
//   - VALUES phrase → CAPS caption right under the pill
//   - LEAN endpoints (3 per persona) → BOLD label · CLOSE to pill · paired
//     with the persona's THEME keyword as italic sub-label
//   - NON-LEAN endpoints (3 per persona) → faded at perimeter · no theme
//   - VERBATIM QUOTE → pull-quote below the cluster (ISe 18 italic, Cycle 4
//     Pull Quote register)
//
// The two clusters look dramatically different because each persona's LEAN
// labels (with themes attached) cluster in opposite hemispheres of the disc.
// Workflow-Focused: bold labels + themes in southern hemisphere; non-lean
// labels faded in north. Creative Control Seekers: bold labels + themes in
// north; non-lean faded in south. Mirror-image asymmetric clusters that
// communicate the callout's content WITHOUT transcribing the callout sentence.
export function ArtifactExtE1A({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <MergedClusterPanel persona={personas[0]} personaIndex={0} filled />
        <MergedClusterPanel persona={personas[1]} personaIndex={1} filled={false} />
      </div>
    </div>
  );
}

function MergedClusterPanel({ persona, personaIndex, filled }: { persona: ArtifactPersona; personaIndex: number; filled: boolean }) {
  const spectrums = ION_PERSONA_TRAITS.spectrums;
  const personaId = ION_PERSONA_TRAITS.personas[personaIndex].id;
  // OG dimensions (scaled to fit two side-by-side at standard width)
  const CW = 380, CH = 320;
  const CX = CW / 2, CY = CH / 2;
  const MIN_R = 58;   // closest a label sits to the pill (strong lean toward it)
  const MAX_R = 138;  // farthest a label sits (weak lean / no lean toward it)
  const themes = (persona.themeTags ?? '').split('·').map((t) => t.trim()).filter(Boolean);

  // For each spectrum, compute BOTH endpoints (left + right). Distance is
  // intuitive: LEAN endpoint sits CLOSE to pill (strong alignment) and
  // NON-LEAN sits FAR (the persona doesn't reach that direction).
  // ALL 6 endpoints render with the same caps-eyebrow styling — matching the
  // OG visual aesthetic (no fade, no italic, no special emphasis per endpoint).
  const placements = spectrums.flatMap((s) => {
    const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
    const pos = s.positions[personaId];
    // distance to LEFT endpoint: small when pos is small (persona aligned with left)
    const leftDist = MIN_R + (pos / 100) * (MAX_R - MIN_R);
    // distance to RIGHT endpoint: small when pos is large (persona aligned with right)
    const rightDist = MIN_R + ((100 - pos) / 100) * (MAX_R - MIN_R);
    return [
      { key: `${s.id}-L`, label: s.leftLabel, pt: polarPt(CX, CY, angles.left, leftDist), derived: s.derived },
      { key: `${s.id}-R`, label: s.rightLabel, pt: polarPt(CX, CY, angles.right, rightDist), derived: s.derived },
    ];
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      {/* OG header — persona name (IS 13/500) + values phrase (IS 11/300/secondary) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 500, letterSpacing: '-0.005em', color: 'var(--dir-text-primary)', margin: 0 }}>
          {persona.name}
        </p>
        <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.5, color: 'var(--dir-text-secondary)', margin: 0 }}>
          {persona.value}
        </p>
      </div>

      {/* Cluster canvas — OG faithful: 6 endpoints all same style, thin lines from
          pill to each endpoint, pill at center. The asymmetry between the two
          clusters comes purely from the data-driven distance variations: WF's
          leaning endpoints (Speeding/Hands-off/Trusting) sit close to its pill
          in the southern hemisphere; CCS's leaning endpoints sit close to its
          pill in the northern hemisphere. Two clusters = mirror-image label
          density patterns. */}
      <div style={{ position: 'relative', width: CW, height: CH }}>
        <svg width={CW} height={CH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
          {placements.map((p) => (
            <line
              key={`line-${p.key}`}
              x1={CX}
              y1={CY}
              x2={p.pt.x}
              y2={p.pt.y}
              stroke="var(--dir-border)"
              strokeWidth={1}
            />
          ))}
        </svg>

        {/* Persona pill at center (just the name — OG style) */}
        <div style={{ position: 'absolute', left: CX, top: CY, transform: 'translate(-50%, -50%)', zIndex: 2 }}>
          <span
            style={{
              fontFamily: IS,
              fontSize: 11,
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: '-0.005em',
              color: filled ? 'var(--dir-bg)' : 'var(--dir-text-primary)',
              backgroundColor: filled ? 'var(--dir-text-primary)' : 'var(--dir-raised)',
              border: '1px solid var(--dir-text-primary)',
              borderRadius: 9999,
              padding: '0 12px',
              height: 24,
              display: 'inline-flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            {persona.name}
          </span>
        </div>

        {/* 6 trait endpoint labels — all in the SAME caps eyebrow style (OG faithful).
            No fade, no italic, no theme embedding. Background bg-knockout under each
            label so the connector lines don't pass through text. */}
        {placements.map((p) => (
          <div
            key={`label-${p.key}`}
            style={{
              position: 'absolute',
              left: p.pt.x,
              top: p.pt.y,
              transform: 'translate(-50%, -50%)',
              padding: '2px 6px',
              backgroundColor: 'var(--dir-raised)',
              zIndex: 3,
            }}
          >
            <p
              style={{
                fontFamily: IS,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                lineHeight: 1.25,
                color: p.derived ? 'var(--dir-text-secondary)' : 'var(--dir-text-primary)',
                margin: 0,
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {p.label}
            </p>
          </div>
        ))}
      </div>

      {/* THEMES — chip rail below the cluster. Merge content #1: the observed
          behaviors from the affinity sort, rendered as the locked theme-tag
          chip pattern (IS 10/500/0.12em UC, hairline border, 9999 radius). */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {themes.map((t) => (
          <span
            key={t}
            style={{
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-secondary)',
              padding: '3px 10px',
              border: RULE_HAIRLINE,
              borderRadius: 9999,
              whiteSpace: 'nowrap',
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* QUOTE — pull-quote register (ISe 18 italic). Merge content #2: the
          verbatim cohort voice. */}
      <p
        style={{
          fontFamily: ISe,
          fontSize: 18,
          fontWeight: 400,
          fontStyle: 'italic',
          lineHeight: 1.4,
          letterSpacing: '-0.01em',
          color: 'var(--dir-text-primary)',
          margin: 0,
          maxWidth: CW,
        }}
      >
        {persona.quote}
      </p>
    </div>
  );
}

// ─── EXT.E1.V1 / V2 / V3 — Themes-replace-trait-labels-at-lean variants ────────
// 2026-05-18 builds applying user-chosen design decisions:
//   (i) THEMES INCORPORATED: the persona's themeTags REPLACE the abstract trait
//       endpoint labels at the persona's lean endpoints. So WF's south endpoint
//       reads "QUICK DESIGN REQUESTS" instead of "SPEEDING AUTOMATION". The
//       endpoint label IS the theme — themes are literally where they belong
//       (at the position the persona leans toward), zero extra elements.
//   (α) LEAN DIRECTION: connector lines from pill ONLY go to the 3 lean
//       endpoints (not all 6). Presence/absence of line = lean. Non-lean
//       endpoints just sit as caps labels at perimeter without lines.

function personaThemesArray(persona: ArtifactPersona): string[] {
  return (persona.themeTags ?? '').split('·').map((t) => t.trim()).filter(Boolean);
}

// ─── EXT.E1.V1 — Full OG cluster (6 endpoints, themes at lean, lines to lean) ──
// Two side-by-side per-persona clusters. ALL 6 endpoints visible — 3 lean
// endpoints (with theme keyword AS the label, line from pill, dot) + 3 non-lean
// endpoints (trait label only at perimeter, no line, no dot). Header above:
// persona name + values phrase. Pull-quote below. Carries all callout content.
export function ArtifactExtE1V1({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <p style={{ ...CAPS, marginBottom: 24 }}>{CHORUS_SOURCE_LINE}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <FullOGClusterPanel persona={personas[0]} personaIndex={0} filled />
        <FullOGClusterPanel persona={personas[1]} personaIndex={1} filled={false} />
      </div>
    </div>
  );
}

function FullOGClusterPanel({ persona, personaIndex, filled }: { persona: ArtifactPersona; personaIndex: number; filled: boolean }) {
  const { state: themesStyle } = useGateAIonS03ExtE1ThemesStyle();
  const { state: leanDirection } = useGateAIonS03ExtE1LeanDirection();
  const spectrums = ION_PERSONA_TRAITS.spectrums;
  const personaId = ION_PERSONA_TRAITS.personas[personaIndex].id;
  const themes = personaThemesArray(persona);
  // Geometry · 2026-05-20 second spacing pass:
  //   CW: 400 → 360 (chart canvas was wider than the half-column cell at 3XL text-
  //                  width — caused overflow, asymmetric label spacing despite
  //                  alignSelf: center. Now chart fits with buffer on both sides.)
  //   CH: 380 (keep — vertical breathing room from first pass)
  //   LEAN_MAX_R: 110 → 100 (proportional shrink to keep pills inside narrower canvas)
  //   LEAN_MIN_R: 78 → 72 (proportional shrink)
  //   PERIMETER_R: 128 → 116 (proportional shrink to keep non-lean labels inside)
  const CW = 360, CH = 380;
  const CX = CW / 2, CY = CH / 2;
  const LEAN_MIN_R = 72;
  const LEAN_MAX_R = 100;
  const PERIMETER_R = 116;

  const placements = spectrums.map((s, idx) => {
    const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
    const pos = s.positions[personaId];
    const leanAngle = pos < 50 ? angles.left : angles.right;
    const nonLeanAngle = pos < 50 ? angles.right : angles.left;
    const leanLabel = pos < 50 ? s.leftLabel : s.rightLabel;
    const nonLeanLabel = pos < 50 ? s.rightLabel : s.leftLabel;
    const leanStrength = Math.abs(pos - 50) / 50;
    const leanDist = LEAN_MAX_R - leanStrength * (LEAN_MAX_R - LEAN_MIN_R);
    return {
      spectrum: s,
      theme: themes[idx] ?? '',
      leanAngle,
      leanLabel,
      leanPt: polarPt(CX, CY, leanAngle, leanDist),
      leanDist,
      nonLeanAngle,
      nonLeanLabel,
      nonLeanPt: polarPt(CX, CY, nonLeanAngle, PERIMETER_R),
      derived: s.derived,
    };
  });

  // β — compute average lean direction so pill can shift toward it
  const avgLeanX = placements.reduce((sum, p) => sum + Math.cos((p.leanAngle * Math.PI) / 180), 0) / placements.length;
  const avgLeanY = placements.reduce((sum, p) => sum - Math.sin((p.leanAngle * Math.PI) / 180), 0) / placements.length;
  const pillOffsetPx = leanDirection === 'beta' ? 32 : 0;
  const pillX = CX + avgLeanX * pillOffsetPx;
  const pillY = CY + avgLeanY * pillOffsetPx;

  // γ — unique arrow marker id per persona (avoid SVG defs collisions)
  const arrowId = `arrow-v1-${personaIndex}`;

  // δ — lean dots are big, non-lean dots are tiny; lines drawn to all 6
  const isDelta = leanDirection === 'delta';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 500, letterSpacing: '-0.005em', color: 'var(--dir-text-primary)', margin: 0 }}>{persona.name}</p>
        <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.5, color: 'var(--dir-text-secondary)', margin: 0 }}>{persona.value}</p>
      </div>

      <div style={{ position: 'relative', width: CW, height: CH, alignSelf: 'center' }}>
        <svg width={CW} height={CH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
          {leanDirection === 'gamma' && (
            <defs>
              <marker id={arrowId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L5,3 z" fill="var(--dir-text-primary)" />
              </marker>
            </defs>
          )}

          {/* Lines to lean endpoints (always present).
              Stroke updated 2026-05-25 (user-flagged W1-D walkthrough): swapped
              from --dir-border (1.35:1 quiet-structural) to --dir-detail
              (~3.5:1 AA-lg in both W1 and W1-D) — connector lines are authored
              detail marks per the W1 token spec, not structural borders.
              Stroke width left at 1 per user feedback — visibility carried by
              ink contrast only, not by weight. */}
          {placements.map((p) => (
            <line
              key={`lean-line-${p.spectrum.id}`}
              x1={pillX}
              y1={pillY}
              x2={p.leanPt.x}
              y2={p.leanPt.y}
              stroke={leanDirection === 'gamma' ? 'var(--dir-text-primary)' : 'var(--dir-detail)'}
              strokeWidth={leanDirection === 'gamma' ? 1.5 : 1}
              markerEnd={leanDirection === 'gamma' ? `url(#${arrowId})` : undefined}
            />
          ))}

          {/* δ — also draw faint lines to non-lean endpoints */}
          {isDelta && placements.map((p) => (
            <line
              key={`nonlean-line-${p.spectrum.id}`}
              x1={pillX}
              y1={pillY}
              x2={p.nonLeanPt.x}
              y2={p.nonLeanPt.y}
              stroke="var(--dir-detail)"
              strokeWidth={0.5}
              opacity={0.35}
            />
          ))}

          {/* δ — markers: big at lean, tiny at non-lean */}
          {isDelta && (
            <>
              {placements.map((p) => (
                <circle
                  key={`lean-dot-${p.spectrum.id}`}
                  cx={p.leanPt.x}
                  cy={p.leanPt.y}
                  r={9}
                  fill={filled ? 'var(--dir-text-primary)' : 'var(--dir-raised)'}
                  stroke="var(--dir-text-primary)"
                  strokeWidth={2}
                />
              ))}
              {placements.map((p) => (
                <circle
                  key={`nonlean-dot-${p.spectrum.id}`}
                  cx={p.nonLeanPt.x}
                  cy={p.nonLeanPt.y}
                  r={2.5}
                  fill="var(--dir-detail)"
                />
              ))}
            </>
          )}

          {/* iii — themes drawn INLINE on the lines (rotated SVG text) */}
          {themesStyle === 'iii' && placements.map((p) => {
            const midX = (pillX + p.leanPt.x) / 2;
            const midY = (pillY + p.leanPt.y) / 2;
            const angleDeg = (Math.atan2(p.leanPt.y - pillY, p.leanPt.x - pillX) * 180) / Math.PI;
            const textAngle = angleDeg > 90 || angleDeg < -90 ? angleDeg + 180 : angleDeg;
            return (
              <text
                key={`inline-${p.spectrum.id}`}
                x={midX}
                y={midY - 4}
                transform={`rotate(${textAngle} ${midX} ${midY})`}
                fontFamily="Instrument Sans, sans-serif"
                fontSize={10}
                fontWeight={500}
                fill="var(--dir-text-primary)"
                textAnchor="middle"
                letterSpacing="0.12em"
                style={{ textTransform: 'uppercase' }}
              >
                {p.theme.toUpperCase()}
              </text>
            );
          })}
        </svg>

        {/* Persona pill — position may be shifted (β) */}
        <div style={{ position: 'absolute', left: pillX, top: pillY, transform: 'translate(-50%, -50%)', zIndex: 2 }}>
          <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.005em', color: filled ? 'var(--dir-bg)' : 'var(--dir-text-primary)', backgroundColor: filled ? 'var(--dir-text-primary)' : 'var(--dir-raised)', border: '1px solid var(--dir-text-primary)', borderRadius: 9999, padding: '0 12px', height: 24, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            {persona.name}
          </span>
        </div>

        {/* LEAN endpoint labels — themes render as FILLED PILLS so visual treatment
            differentiates them from plain-text trait poles at non-lean. The constellation
            geometry stays (radial cluster around persona pill, lean distance encoded by
            position) — only the visual role of "theme label" gets chrome (pill bg).
            iii renders inline in SVG above. */}
        {themesStyle !== 'iii' && placements.map((p) => (
          <div
            key={`lean-label-${p.spectrum.id}`}
            style={{
              position: 'absolute',
              left: p.leanPt.x,
              top: p.leanPt.y,
              transform: 'translate(-50%, -50%)',
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {themesStyle === 'i' ? (
              <span style={spectrumPillStyle(filled)}>
                {p.theme}
              </span>
            ) : (
              <>
                {/* ii — trait label PLUS filled theme pill beneath it */}
                <p style={{ ...CAPS, color: 'var(--dir-text-primary)', margin: 0, whiteSpace: 'nowrap', textAlign: 'center', backgroundColor: 'var(--dir-raised)', padding: '2px 6px' }}>
                  {p.leanLabel}
                </p>
                <span style={spectrumPillStyle(filled)}>
                  {p.theme}
                </span>
              </>
            )}
          </div>
        ))}

        {/* NON-LEAN endpoint labels (unless δ which uses tiny dots only). Plain CAPS
            text in secondary ink — visually subordinate to the filled theme pills at
            lean, so reader can't confuse pole anchor with theme data point. */}
        {!isDelta && placements.map((p) => (
          <p
            key={`non-lean-label-${p.spectrum.id}`}
            style={{
              position: 'absolute',
              left: p.nonLeanPt.x,
              top: p.nonLeanPt.y,
              transform: 'translate(-50%, -50%)',
              ...CAPS,
              color: 'var(--dir-text-secondary)',
              margin: 0,
              whiteSpace: 'nowrap',
              textAlign: 'center',
              opacity: 0.7,
            }}
          >
            {p.nonLeanLabel}
          </p>
        ))}
      </div>

      <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0, maxWidth: CW }}>
        {persona.quote}
      </p>
    </div>
  );
}

// ─── EXT.E1.V2 — Improved overlap spider (themes at lean positions) ────────────
// Single chart, both personas as overlapping polygons. 6 endpoint positions
// all labeled with whichever persona's theme leans toward that endpoint.
// WF themes occupy southern hemisphere (Quick design requests S, Communication
// SW, Unblock handoff SE); CCS themes occupy northern (Styles alignment N,
// Design review NE, Insights finding NW). Two triangles in opposing quadrants
// formed by connecting each persona's 3 lean theme positions.
export function ArtifactExtE1V2({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <p style={{ ...CAPS, marginBottom: 24 }}>{CHORUS_SOURCE_LINE}</p>
      <ImprovedOverlapSpiderChart personas={personas} />
    </div>
  );
}

function ImprovedOverlapSpiderChart({ personas }: { personas: readonly ArtifactPersona[] }) {
  const spectrums = ION_PERSONA_TRAITS.spectrums;
  const [wfData, ccsData] = ION_PERSONA_TRAITS.personas;
  const wfThemes = personaThemesArray(personas[0]);
  const ccsThemes = personaThemesArray(personas[1]);
  const W = 600, H = 500;
  const CX = W / 2, CY = H / 2;
  const MAX_R = 160;
  const LABEL_OFFSET = 30;

  // Compute each persona's 3 lean endpoint positions (where their triangle vertices sit)
  const wfPoints = spectrums.map((s, idx) => {
    const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
    const pos = s.positions[wfData.id];
    const angle = pos < 50 ? angles.left : angles.right;
    const leanStrength = Math.abs(pos - 50) / 50;
    return { angle, pt: polarPt(CX, CY, angle, leanStrength * MAX_R), theme: wfThemes[idx] ?? '' };
  });
  const ccsPoints = spectrums.map((s, idx) => {
    const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
    const pos = s.positions[ccsData.id];
    const angle = pos < 50 ? angles.left : angles.right;
    const leanStrength = Math.abs(pos - 50) / 50;
    return { angle, pt: polarPt(CX, CY, angle, leanStrength * MAX_R), theme: ccsThemes[idx] ?? '' };
  });

  // 6 endpoint label positions at perimeter — each shows the theme of whoever leans there
  const labelEndpoints = spectrums.flatMap((s, idx) => {
    const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
    const wfPos = s.positions[wfData.id];
    return [
      {
        key: `${s.id}-L`,
        angle: angles.left,
        // theme of whichever persona leans toward LEFT endpoint
        theme: wfPos < 50 ? wfThemes[idx] : ccsThemes[idx],
        pt: polarPt(CX, CY, angles.left, MAX_R + LABEL_OFFSET),
      },
      {
        key: `${s.id}-R`,
        angle: angles.right,
        theme: wfPos > 50 ? wfThemes[idx] : ccsThemes[idx],
        pt: polarPt(CX, CY, angles.right, MAX_R + LABEL_OFFSET),
      },
    ];
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      <div style={{ position: 'relative', width: W, height: H }}>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
          {/* Three bidirectional axis lines through center */}
          {spectrums.map((s) => {
            const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
            const p1 = polarPt(CX, CY, angles.left, MAX_R);
            const p2 = polarPt(CX, CY, angles.right, MAX_R);
            return <line key={s.id} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--dir-border)" strokeWidth={1} />;
          })}
          {/* Center dot */}
          <circle cx={CX} cy={CY} r={2} fill="var(--dir-detail)" />
          {/* WF triangle — filled */}
          <polygon
            points={wfPoints.map((p) => `${p.pt.x},${p.pt.y}`).join(' ')}
            fill="var(--dir-text-primary)"
            stroke="var(--dir-text-primary)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/* CCS triangle — outlined dashed */}
          <polygon
            points={ccsPoints.map((p) => `${p.pt.x},${p.pt.y}`).join(' ')}
            fill="none"
            stroke="var(--dir-text-primary)"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            strokeLinejoin="round"
          />
          {/* Vertex dots */}
          {wfPoints.map((p, i) => (
            <circle key={`wf-vert-${i}`} cx={p.pt.x} cy={p.pt.y} r={5} fill="var(--dir-text-primary)" stroke="var(--dir-text-primary)" strokeWidth={2} />
          ))}
          {ccsPoints.map((p, i) => (
            <circle key={`ccs-vert-${i}`} cx={p.pt.x} cy={p.pt.y} r={5} fill="var(--dir-raised)" stroke="var(--dir-text-primary)" strokeWidth={2.5} />
          ))}
        </svg>
        {/* Theme labels at perimeter — one per spectrum endpoint, labeled with whichever persona's theme leans there */}
        {labelEndpoints.map((l) => (
          <p
            key={l.key}
            style={{
              position: 'absolute',
              left: l.pt.x,
              top: l.pt.y,
              transform: 'translate(-50%, -50%)',
              ...CAPS,
              color: 'var(--dir-text-primary)',
              margin: 0,
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            {l.theme}
          </p>
        ))}
      </div>

      {/* Persona legend with quotes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 16, height: 16, backgroundColor: 'var(--dir-text-primary)', flexShrink: 0 }} />
            <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 500, letterSpacing: '-0.005em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[0].name}</p>
            <p style={{ ...CAPS, color: 'var(--dir-text-secondary)', margin: 0 }}>{valuesTag(personas[0])}</p>
          </div>
          <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[0].quote}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 16, height: 16, backgroundColor: 'var(--dir-raised)', border: '2px dashed var(--dir-text-primary)', flexShrink: 0 }} />
            <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 500, letterSpacing: '-0.005em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[1].name}</p>
            <p style={{ ...CAPS, color: 'var(--dir-text-secondary)', margin: 0 }}>{valuesTag(personas[1])}</p>
          </div>
          <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[1].quote}</p>
        </div>
      </div>
    </div>
  );
}

// ─── EXT.E1.V3 — Lean-only cluster (cleaned pre-merge, 3 endpoints only) ───────
// Two side-by-side per-persona clusters. ONLY the persona's 3 lean endpoints
// shown (no non-lean labels at all). Themes ARE the labels at lean positions.
// Cleanest reading — no perimeter clutter. Pull-quote below.
export function ArtifactExtE1V3({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <p style={{ ...CAPS, marginBottom: 24 }}>{CHORUS_SOURCE_LINE}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <LeanOnlyClusterPanel persona={personas[0]} personaIndex={0} filled />
        <LeanOnlyClusterPanel persona={personas[1]} personaIndex={1} filled={false} />
      </div>
    </div>
  );
}

function LeanOnlyClusterPanel({ persona, personaIndex, filled }: { persona: ArtifactPersona; personaIndex: number; filled: boolean }) {
  const { state: themesStyle } = useGateAIonS03ExtE1ThemesStyle();
  const { state: leanDirection } = useGateAIonS03ExtE1LeanDirection();
  const spectrums = ION_PERSONA_TRAITS.spectrums;
  const personaId = ION_PERSONA_TRAITS.personas[personaIndex].id;
  const themes = personaThemesArray(persona);
  // Geometry · 2026-05-20 spacing pass: CH 320 → 340 to match V1 breathing-room
  // adjustment. V3 has no non-lean perimeter labels so only the lean pills need
  // room — bottom pill at south now has ~50px to canvas edge instead of ~28px.
  const CW = 360, CH = 340;
  const CX = CW / 2, CY = CH / 2;
  const LEAN_MIN_R = 78;
  const LEAN_MAX_R = 118;

  const placements = spectrums.map((s, idx) => {
    const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
    const pos = s.positions[personaId];
    const leanAngle = pos < 50 ? angles.left : angles.right;
    const leanLabel = pos < 50 ? s.leftLabel : s.rightLabel;
    const leanStrength = Math.abs(pos - 50) / 50;
    const leanDist = LEAN_MAX_R - leanStrength * (LEAN_MAX_R - LEAN_MIN_R);
    return {
      spectrum: s,
      theme: themes[idx] ?? '',
      leanAngle,
      leanLabel,
      leanPt: polarPt(CX, CY, leanAngle, leanDist),
      leanDist,
      derived: s.derived,
    };
  });

  const avgLeanX = placements.reduce((sum, p) => sum + Math.cos((p.leanAngle * Math.PI) / 180), 0) / placements.length;
  const avgLeanY = placements.reduce((sum, p) => sum - Math.sin((p.leanAngle * Math.PI) / 180), 0) / placements.length;
  const pillOffsetPx = leanDirection === 'beta' ? 28 : 0;
  const pillX = CX + avgLeanX * pillOffsetPx;
  const pillY = CY + avgLeanY * pillOffsetPx;
  const arrowId = `arrow-v3-${personaIndex}`;
  const isDelta = leanDirection === 'delta';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 500, letterSpacing: '-0.005em', color: 'var(--dir-text-primary)', margin: 0 }}>{persona.name}</p>
        <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.5, color: 'var(--dir-text-secondary)', margin: 0 }}>{persona.value}</p>
      </div>

      <div style={{ position: 'relative', width: CW, height: CH, alignSelf: 'center' }}>
        <svg width={CW} height={CH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
          {leanDirection === 'gamma' && (
            <defs>
              <marker id={arrowId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L5,3 z" fill="var(--dir-text-primary)" />
              </marker>
            </defs>
          )}
          {placements.map((p) => (
            <line
              key={`line-${p.spectrum.id}`}
              x1={pillX}
              y1={pillY}
              x2={p.leanPt.x}
              y2={p.leanPt.y}
              stroke={leanDirection === 'gamma' ? 'var(--dir-text-primary)' : 'var(--dir-border)'}
              strokeWidth={leanDirection === 'gamma' ? 1.5 : 1}
              markerEnd={leanDirection === 'gamma' ? `url(#${arrowId})` : undefined}
            />
          ))}
          {isDelta && placements.map((p) => (
            <circle
              key={`lean-dot-${p.spectrum.id}`}
              cx={p.leanPt.x}
              cy={p.leanPt.y}
              r={9}
              fill={filled ? 'var(--dir-text-primary)' : 'var(--dir-raised)'}
              stroke="var(--dir-text-primary)"
              strokeWidth={2}
            />
          ))}
          {themesStyle === 'iii' && placements.map((p) => {
            const midX = (pillX + p.leanPt.x) / 2;
            const midY = (pillY + p.leanPt.y) / 2;
            const angleDeg = (Math.atan2(p.leanPt.y - pillY, p.leanPt.x - pillX) * 180) / Math.PI;
            const textAngle = angleDeg > 90 || angleDeg < -90 ? angleDeg + 180 : angleDeg;
            return (
              <text
                key={`inline-${p.spectrum.id}`}
                x={midX}
                y={midY - 4}
                transform={`rotate(${textAngle} ${midX} ${midY})`}
                fontFamily="Instrument Sans, sans-serif"
                fontSize={10}
                fontWeight={500}
                fill="var(--dir-text-primary)"
                textAnchor="middle"
                letterSpacing="0.12em"
                style={{ textTransform: 'uppercase' }}
              >
                {p.theme.toUpperCase()}
              </text>
            );
          })}
        </svg>

        <div style={{ position: 'absolute', left: pillX, top: pillY, transform: 'translate(-50%, -50%)', zIndex: 2 }}>
          <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.005em', color: filled ? 'var(--dir-bg)' : 'var(--dir-text-primary)', backgroundColor: filled ? 'var(--dir-text-primary)' : 'var(--dir-raised)', border: '1px solid var(--dir-text-primary)', borderRadius: 9999, padding: '0 12px', height: 24, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            {persona.name}
          </span>
        </div>

        {/* Lean endpoint labels — themes as filled pills (V3 has no non-lean labels). */}
        {themesStyle !== 'iii' && placements.map((p) => (
          <div
            key={`label-${p.spectrum.id}`}
            style={{
              position: 'absolute',
              left: p.leanPt.x,
              top: p.leanPt.y,
              transform: 'translate(-50%, -50%)',
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {themesStyle === 'i' ? (
              <span style={spectrumPillStyle(filled)}>
                {p.theme}
              </span>
            ) : (
              <>
                <p style={{ ...CAPS, color: 'var(--dir-text-primary)', margin: 0, whiteSpace: 'nowrap', textAlign: 'center', backgroundColor: 'var(--dir-raised)', padding: '2px 6px' }}>
                  {p.leanLabel}
                </p>
                <span style={spectrumPillStyle(filled)}>
                  {p.theme}
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0, maxWidth: CW }}>
        {persona.quote}
      </p>
    </div>
  );
}

// ─── EXT.E1.OSG — Semantic Differential (Osgood 1957) ───────────────────────────
// The literal academic ancestor of bipolar persona spectrums. 3 stacked
// horizontal rows. Each row: pole label LEFT (anchor word) · continuum line ·
// 2 persona markers at their positions · pole label RIGHT (anchor word).
// Verbal anchors at row ends are load-bearing — the chart's information lives
// in the words. Quote per persona below.
// Precedent: Osgood 1957 attitude-measurement instrument.
export function ArtifactExtE1Osg({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  const spectrums = ION_PERSONA_TRAITS.spectrums;
  const [wfData, ccsData] = ION_PERSONA_TRAITS.personas;
  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      {/* Persona legend at top */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: 'var(--dir-text-primary)' }} />
          <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 500, color: 'var(--dir-text-primary)', margin: 0 }}>{personas[0].name}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: 'var(--dir-raised)', border: '2px solid var(--dir-text-primary)' }} />
          <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 500, color: 'var(--dir-text-primary)', margin: 0 }}>{personas[1].name}</p>
        </div>
      </div>

      {/* 3 stacked Osgood rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {spectrums.map((s) => {
          const wfPos = s.positions[wfData.id];
          const ccsPos = s.positions[ccsData.id];
          return (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 180px', alignItems: 'center', gap: 16 }}>
              <p style={{ ...CAPS, color: 'var(--dir-text-primary)', textAlign: 'right', margin: 0 }}>{s.leftLabel}</p>
              <div style={{ position: 'relative', height: 28 }}>
                {/* Axis line */}
                <div style={{ position: 'absolute', left: 0, right: 0, top: 13, height: 2, backgroundColor: 'var(--dir-border)' }} />
                {/* Endpoint ticks */}
                <div style={{ position: 'absolute', left: 0, top: 8, width: 2, height: 12, backgroundColor: 'var(--dir-border)' }} />
                <div style={{ position: 'absolute', right: 0, top: 8, width: 2, height: 12, backgroundColor: 'var(--dir-border)' }} />
                {/* Midpoint tick */}
                <div style={{ position: 'absolute', left: '50%', top: 10, width: 1, height: 8, backgroundColor: 'var(--dir-detail)', transform: 'translateX(-50%)' }} />
                {/* WF marker */}
                <div style={{ position: 'absolute', left: `${wfPos}%`, top: 7, width: 14, height: 14, borderRadius: 7, backgroundColor: 'var(--dir-text-primary)', border: '2px solid var(--dir-text-primary)', transform: 'translateX(-50%)' }} />
                {/* CCS marker */}
                <div style={{ position: 'absolute', left: `${ccsPos}%`, top: 7, width: 14, height: 14, borderRadius: 7, backgroundColor: 'var(--dir-raised)', border: '2px solid var(--dir-text-primary)', transform: 'translateX(-50%)' }} />
              </div>
              <p style={{ ...CAPS, color: 'var(--dir-text-primary)', textAlign: 'left', margin: 0 }}>{s.rightLabel}</p>
            </div>
          );
        })}
      </div>

      {/* Quotes below */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 32 }}>
        <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[0].quote}</p>
        <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[1].quote}</p>
      </div>
    </div>
  );
}

// ─── EXT.E1.BUL — Bullet Graph small multiples (Stephen Few) ────────────────────
// 3 stacked rows. Each row: pole label · shaded range track · persona markers.
// The track has tonal gradient/shading representing the qualitative range
// (low/mid/high). Persona markers sit at their positions. Quote per persona.
// Precedent: Stephen Few's 2005 Bullet Graph Design Spec.
export function ArtifactExtE1Bul({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  const spectrums = ION_PERSONA_TRAITS.spectrums;
  const [wfData, ccsData] = ION_PERSONA_TRAITS.personas;
  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 32, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 18, backgroundColor: 'var(--dir-text-primary)' }} />
          <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 500, color: 'var(--dir-text-primary)', margin: 0 }}>{personas[0].name}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 18, border: '2px solid var(--dir-text-primary)', backgroundColor: 'var(--dir-raised)' }} />
          <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 500, color: 'var(--dir-text-primary)', margin: 0 }}>{personas[1].name}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {spectrums.map((s) => {
          const wfPos = s.positions[wfData.id];
          const ccsPos = s.positions[ccsData.id];
          return (
            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ ...CAPS_13, color: 'var(--dir-text-primary)' }}>{s.axisName}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 160px', alignItems: 'center', gap: 12 }}>
                <p style={{ ...CAPS, color: 'var(--dir-text-secondary)', textAlign: 'right', margin: 0 }}>{s.leftLabel}</p>
                <div style={{ position: 'relative', height: 28 }}>
                  {/* Shaded range bands — light → mid → dark from left pole to right pole */}
                  <div style={{ position: 'absolute', left: 0, top: 0, width: '33.33%', height: 28, backgroundColor: 'var(--dir-recessed)' }} />
                  <div style={{ position: 'absolute', left: '33.33%', top: 0, width: '33.33%', height: 28, backgroundColor: 'var(--dir-raised)' }} />
                  <div style={{ position: 'absolute', left: '66.66%', top: 0, width: '33.33%', height: 28, backgroundColor: 'var(--dir-muted)' }} />
                  {/* WF marker — thick vertical bar */}
                  <div style={{ position: 'absolute', left: `${wfPos}%`, top: 4, width: 4, height: 20, backgroundColor: 'var(--dir-text-primary)', transform: 'translateX(-50%)' }} />
                  {/* CCS marker — outlined vertical bar */}
                  <div style={{ position: 'absolute', left: `${ccsPos}%`, top: 4, width: 12, height: 20, border: '2px solid var(--dir-text-primary)', backgroundColor: 'transparent', transform: 'translateX(-50%)' }} />
                </div>
                <p style={{ ...CAPS, color: 'var(--dir-text-secondary)', textAlign: 'left', margin: 0 }}>{s.rightLabel}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 32 }}>
        <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[0].quote}</p>
        <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[1].quote}</p>
      </div>
    </div>
  );
}

// ─── EXT.E1.CRD — Sports-Card Pair (FIFA Ultimate Team / Pokemon stat block) ───
// Two side-by-side persona "cards" with FIFA-style stat grid composition.
// Each card: header with persona name + values phrase · stat grid showing 3
// trait positions with theme keywords · pull-quote at bottom. The two cards'
// stat-value patterns differ creating distinct visual mass.
// Precedent: EA FC / FIFA Ultimate Team card design; Pokemon stat hexagon.
export function ArtifactExtE1Crd({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <PersonaStatCard persona={personas[0]} personaIndex={0} filled />
        <PersonaStatCard persona={personas[1]} personaIndex={1} filled={false} />
      </div>
    </div>
  );
}

function PersonaStatCard({ persona, personaIndex, filled }: { persona: ArtifactPersona; personaIndex: number; filled: boolean }) {
  const spectrums = ION_PERSONA_TRAITS.spectrums;
  const personaId = ION_PERSONA_TRAITS.personas[personaIndex].id;
  const themes = personaThemesArray(persona);
  return (
    <div style={{ border: RULE_HAIRLINE, backgroundColor: filled ? 'var(--dir-text-primary)' : 'var(--dir-bg)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Card header — name + values phrase */}
      <div style={{ borderBottom: `1px solid ${filled ? 'var(--dir-bg)' : 'var(--dir-border)'}`, paddingBottom: 12 }}>
        <p style={{ fontFamily: ISe, fontSize: 28, fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: filled ? 'var(--dir-bg)' : 'var(--dir-text-primary)', margin: 0 }}>{persona.name}</p>
        <p style={{ ...CAPS, color: filled ? 'var(--dir-bg)' : 'var(--dir-text-secondary)', margin: 0, marginTop: 6, opacity: filled ? 0.7 : 1 }}>{valuesTag(persona)}</p>
      </div>

      {/* Stat grid — 3 trait rows with position + theme */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {spectrums.map((s, idx) => {
          const pos = s.positions[personaId];
          const leanLabel = pos < 50 ? s.leftLabel : s.rightLabel;
          return (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: 12, alignItems: 'baseline' }}>
              <p style={{ ...PROOF_28, color: filled ? 'var(--dir-bg)' : 'var(--dir-text-primary)', textAlign: 'right' }}>{pos}</p>
              <div>
                <p style={{ ...CAPS, color: filled ? 'var(--dir-bg)' : 'var(--dir-text-primary)', margin: 0, opacity: filled ? 0.9 : 1 }}>{leanLabel}</p>
                {themes[idx] && (
                  <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.4, color: filled ? 'var(--dir-bg)' : 'var(--dir-text-secondary)', margin: 0, opacity: filled ? 0.7 : 1 }}>{themes[idx]}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quote footer */}
      <p style={{ fontFamily: ISe, fontSize: 16, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: filled ? 'var(--dir-bg)' : 'var(--dir-text-primary)', margin: 0, marginTop: 4, opacity: filled ? 0.9 : 1 }}>{persona.quote}</p>
    </div>
  );
}

// ─── EXT.E1.TOR — Tornado Diagram (magnitude-ordered divergent bars) ───────────
// Central spine, 3 rows ordered by ABSOLUTE MAGNITUDE of divergence (largest
// at top). Each row: pole label LEFT · WF bar extending left · spine · CCS bar
// extending right · pole label RIGHT. Sharper visual rhythm than butterfly
// because magnitude ordering creates a funnel/tornado silhouette.
// Precedent: Edward Bodmer's tornado-diagram convention (sensitivity analysis).
export function ArtifactExtE1Tor({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  const spectrums = ION_PERSONA_TRAITS.spectrums;
  const [wfData, ccsData] = ION_PERSONA_TRAITS.personas;
  // Sort spectrums by total divergence (descending)
  const sortedSpectrums = [...spectrums].sort((a, b) => {
    const aDiv = Math.abs(a.positions[wfData.id] - a.positions[ccsData.id]);
    const bDiv = Math.abs(b.positions[wfData.id] - b.positions[ccsData.id]);
    return bDiv - aDiv;
  });
  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
          <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, color: 'var(--dir-text-primary)', margin: 0 }}>{personas[0].name}</p>
          <div style={{ width: 16, height: 16, backgroundColor: 'var(--dir-text-primary)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 16, height: 16, backgroundColor: 'var(--dir-raised)', border: '2px solid var(--dir-text-primary)' }} />
          <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, color: 'var(--dir-text-primary)', margin: 0 }}>{personas[1].name}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {sortedSpectrums.map((s) => {
          const wfPos = s.positions[wfData.id];
          const ccsPos = s.positions[ccsData.id];
          const wfLean = wfPos < 50 ? s.leftLabel : s.rightLabel;
          const ccsLean = ccsPos < 50 ? s.leftLabel : s.rightLabel;
          const wfBarPct = Math.abs(wfPos - 50);
          const ccsBarPct = Math.abs(ccsPos - 50);
          return (
            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ ...CAPS_13, color: 'var(--dir-text-primary)', textAlign: 'center' }}>{s.axisName}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr 180px', alignItems: 'center', gap: 12 }}>
                <p style={{ ...CAPTION, color: 'var(--dir-text-secondary)', textAlign: 'right', margin: 0 }}>{wfLean}</p>
                <div style={{ position: 'relative', height: 24 }}>
                  <div style={{ position: 'absolute', right: 0, top: 4, height: 16, width: `${wfBarPct * 2}%`, backgroundColor: 'var(--dir-text-primary)' }} />
                </div>
                <div style={{ position: 'relative', height: 24, borderLeft: '1.5px solid var(--dir-text-primary)' }}>
                  <div style={{ position: 'absolute', left: 0, top: 4, height: 16, width: `${ccsBarPct * 2}%`, border: '2px solid var(--dir-text-primary)', backgroundColor: 'var(--dir-raised)' }} />
                </div>
                <p style={{ ...CAPTION, color: 'var(--dir-text-secondary)', textAlign: 'left', margin: 0 }}>{ccsLean}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 32 }}>
        <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[0].quote}</p>
        <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0, textAlign: 'right' }}>{personas[1].quote}</p>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────────
// EXT.E1.SC / BR / VP — Convergent / synthesis (Ion serves both)
// ───────────────────────────────────────────────────────────────────────────────────
//
// Three variants of the same conceptual move: the two opposed personas resolve
// to two opposed postures (AI-as-deputy vs AI-as-consultant), and BOTH converge
// on Ion as the common tool. Built 2026-05-18.
//
// Per gate-a-ion-s03-artifact-section-placement-thinking.md: these are §06 intro
// candidates (or §04/§05 contenders) — NOT a §03 lock. §03 toggle is the eval
// surface; final placement is module-by-module work.
//
// W1 raised-card composition (F1 Panel 04/06: raised-bg + border + padding 32 +
// radius). Posture labels are NEW content not present in V1/V2/V3 — they
// articulate what each persona's trait pattern means as a single relational stance.

// Posture synthesis — derived from the trait-pattern. Source-grounded vocabulary
// per 2026-05-19 audit: "AI as collaborator" appears verbatim in case-study prose
// (lines 1611, 1678, 1910) + source materials (ion-deck-demo-day, ion-deck-cocreate).
// "AI as accelerator" derived from Florence Chow's verbatim "speed up the workflow"
// and matches WF's Speeding-Hands off-Trusting trait pattern.
// Used by EXT.E1.SC / BR / VP convergent artifacts only (NOT by V1/V2/V3 cluster
// artifacts — those let surrounding §03 prose carry the synthesis, per 2026-05-19
// pull-back to avoid duplicating synthesis at panel-header register).
const PERSONA_POSTURES: Record<string, { label: string; stance: string }> = {
  'Workflow-Focused':         { label: 'AI as accelerator', stance: 'Speed up · hand it off' },
  'Creative Control Seekers': { label: 'AI as collaborator', stance: 'Stay involved · keep control' },
};

function postureFor(persona: ArtifactPersona): { label: string; stance: string } {
  return PERSONA_POSTURES[persona.name] ?? { label: '', stance: '' };
}

// What Ion provides that serves BOTH postures (the overlap content). The
// affinity-map themes already point at these cross-cutting benefits — they
// surfaced from both clusters' interview quotes in different forms.
const ION_COVERAGE: ReadonlyArray<string> = [
  'One tool across the workflow',
  'Designer-defined entry points',
  'Output you can edit OR ship',
];

// ─── EXT.E1.SC — Shared-Center Spider (single chart · central Ion) ─────────────
// Two opposing polygons (WF filled · CCS dashed) share a central anchor: an
// "Ion" pill at the chart center. The convergence is literal — both personas'
// trait patterns radiate outward from the same point. Mirrors V2 geometry but
// adds the convergence marker + posture labels in legend.
export function ArtifactExtE1Sc({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  const spectrums = ION_PERSONA_TRAITS.spectrums;
  const [wfData, ccsData] = ION_PERSONA_TRAITS.personas;
  const wfThemes = personaThemesArray(personas[0]);
  const ccsThemes = personaThemesArray(personas[1]);
  const wfPosture = postureFor(personas[0]);
  const ccsPosture = postureFor(personas[1]);
  const W = 600, H = 500;
  const CX = W / 2, CY = H / 2;
  const MAX_R = 160;
  const LABEL_OFFSET = 30;

  const wfPoints = spectrums.map((s, idx) => {
    const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
    const pos = s.positions[wfData.id];
    const angle = pos < 50 ? angles.left : angles.right;
    const leanStrength = Math.abs(pos - 50) / 50;
    return { pt: polarPt(CX, CY, angle, leanStrength * MAX_R), theme: wfThemes[idx] ?? '' };
  });
  const ccsPoints = spectrums.map((s, idx) => {
    const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
    const pos = s.positions[ccsData.id];
    const angle = pos < 50 ? angles.left : angles.right;
    const leanStrength = Math.abs(pos - 50) / 50;
    return { pt: polarPt(CX, CY, angle, leanStrength * MAX_R), theme: ccsThemes[idx] ?? '' };
  });
  const labelEndpoints = spectrums.flatMap((s, idx) => {
    const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
    const wfPos = s.positions[wfData.id];
    return [
      { key: `${s.id}-L`, theme: wfPos < 50 ? wfThemes[idx] : ccsThemes[idx], pt: polarPt(CX, CY, angles.left, MAX_R + LABEL_OFFSET) },
      { key: `${s.id}-R`, theme: wfPos > 50 ? wfThemes[idx] : ccsThemes[idx], pt: polarPt(CX, CY, angles.right, MAX_R + LABEL_OFFSET) },
    ];
  });

  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <div style={{ position: 'relative', width: W, height: H, margin: '0 auto' }}>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
          {spectrums.map((s) => {
            const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
            const p1 = polarPt(CX, CY, angles.left, MAX_R);
            const p2 = polarPt(CX, CY, angles.right, MAX_R);
            return <line key={s.id} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--dir-border)" strokeWidth={1} />;
          })}
          <polygon
            points={wfPoints.map((p) => `${p.pt.x},${p.pt.y}`).join(' ')}
            fill="var(--dir-text-primary)"
            fillOpacity={0.92}
            stroke="var(--dir-text-primary)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <polygon
            points={ccsPoints.map((p) => `${p.pt.x},${p.pt.y}`).join(' ')}
            fill="none"
            stroke="var(--dir-text-primary)"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            strokeLinejoin="round"
          />
          {wfPoints.map((p, i) => (
            <circle key={`wf-vert-${i}`} cx={p.pt.x} cy={p.pt.y} r={5} fill="var(--dir-text-primary)" stroke="var(--dir-text-primary)" strokeWidth={2} />
          ))}
          {ccsPoints.map((p, i) => (
            <circle key={`ccs-vert-${i}`} cx={p.pt.x} cy={p.pt.y} r={5} fill="var(--dir-raised)" stroke="var(--dir-text-primary)" strokeWidth={2.5} />
          ))}
        </svg>

        {/* Central Ion pill — the convergence marker */}
        <div style={{ position: 'absolute', left: CX, top: CY, transform: 'translate(-50%, -50%)', zIndex: 2 }}>
          <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 500, lineHeight: 1, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-bg)', backgroundColor: 'var(--dir-text-primary)', border: '1px solid var(--dir-text-primary)', borderRadius: 9999, padding: '0 14px', height: 28, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            Ion
          </span>
        </div>

        {/* Theme labels at perimeter */}
        {labelEndpoints.map((l) => (
          <p
            key={l.key}
            style={{ position: 'absolute', left: l.pt.x, top: l.pt.y, transform: 'translate(-50%, -50%)', ...CAPS, color: 'var(--dir-text-primary)', whiteSpace: 'nowrap', textAlign: 'center', backgroundColor: 'var(--dir-raised)', padding: '2px 6px' }}
          >
            {l.theme}
          </p>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 16, height: 16, backgroundColor: 'var(--dir-text-primary)', flexShrink: 0 }} />
            <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 500, letterSpacing: '-0.005em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[0].name}</p>
          </div>
          <p style={{ ...CAPS_13 }}>{wfPosture.label}</p>
          <p style={{ ...CAPTION }}>{wfPosture.stance}</p>
          <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[0].quote}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 16, height: 16, backgroundColor: 'var(--dir-raised)', border: '2px dashed var(--dir-text-primary)', flexShrink: 0 }} />
            <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 500, letterSpacing: '-0.005em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[1].name}</p>
          </div>
          <p style={{ ...CAPS_13 }}>{ccsPosture.label}</p>
          <p style={{ ...CAPTION }}>{ccsPosture.stance}</p>
          <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[1].quote}</p>
        </div>
      </div>
    </div>
  );
}

// ─── EXT.E1.BR — Bridge Chart (WF | Ion bridge | CCS) ──────────────────────────
// 3-column layout. Each persona gets a column with full content (name · values ·
// posture · themes · quote). Center column carries an "Ion" pill on a
// horizontal connector — arrows pointing outward to both personas. Footer line
// reads "Same goal · different starting points."
export function ArtifactExtE1Br({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  const wfPosture = postureFor(personas[0]);
  const ccsPosture = postureFor(personas[1]);
  const wfThemes = personaThemesArray(personas[0]);
  const ccsThemes = personaThemesArray(personas[1]);

  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 32, alignItems: 'stretch' }}>
        {/* Left persona */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ ...CAPS }}>{valuesTag(personas[0])}</p>
          <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[0].name}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
            <p style={{ ...CAPS_13 }}>{wfPosture.label}</p>
            <p style={{ ...CAPTION }}>{wfPosture.stance}</p>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {wfThemes.map((t) => (
              <li key={t} style={{ ...DENSE }}>· {t}</li>
            ))}
          </ul>
          <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[0].quote}</p>
        </div>

        {/* Ion bridge — horizontal connector + central pill + outward arrows */}
        <div style={{ width: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 240 }}>
          <svg width={96} height={48} aria-hidden style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)' }}>
            <defs>
              <marker id="br-arrow-l" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M6,0 L6,6 L1,3 z" fill="var(--dir-text-primary)" />
              </marker>
              <marker id="br-arrow-r" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L5,3 z" fill="var(--dir-text-primary)" />
              </marker>
            </defs>
            <line x1={32} y1={20} x2={4} y2={20} stroke="var(--dir-text-primary)" strokeWidth={1.5} markerEnd="url(#br-arrow-l)" />
            <line x1={64} y1={28} x2={92} y2={28} stroke="var(--dir-text-primary)" strokeWidth={1.5} markerEnd="url(#br-arrow-r)" />
          </svg>
          <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-bg)', backgroundColor: 'var(--dir-text-primary)', borderRadius: 9999, padding: '0 14px', height: 28, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', position: 'relative', zIndex: 2 }}>
            Ion
          </span>
        </div>

        {/* Right persona */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ ...CAPS }}>{valuesTag(personas[1])}</p>
          <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[1].name}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
            <p style={{ ...CAPS_13 }}>{ccsPosture.label}</p>
            <p style={{ ...CAPTION }}>{ccsPosture.stance}</p>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ccsThemes.map((t) => (
              <li key={t} style={{ ...DENSE }}>· {t}</li>
            ))}
          </ul>
          <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[1].quote}</p>
        </div>
      </div>

      <p style={{ ...CAPS, textAlign: 'center', marginTop: 24 }}>Same goal · different starting points</p>
    </div>
  );
}

// ─── EXT.E1.VP — Venn-of-Postures (AI-as-deputy ∩ AI-as-consultant) ────────────
// Two overlapping circles. Left lobe = AI-as-deputy posture + WF themes.
// Right lobe = AI-as-consultant posture + CCS themes. Overlap = Ion's coverage
// (cross-cutting benefits that surfaced in both clusters' interview themes).
// Persona quotes below frame the two stances in their own voice.
export function ArtifactExtE1Vp({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  const wfPosture = postureFor(personas[0]);
  const ccsPosture = postureFor(personas[1]);
  const wfThemes = personaThemesArray(personas[0]);
  const ccsThemes = personaThemesArray(personas[1]);
  const W = 760, H = 380;
  const R = 168;
  const CX1 = 270, CX2 = 490, CY = 190;
  const OVERLAP_CX = (CX1 + CX2) / 2;

  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <div style={{ position: 'relative', width: W, height: H, margin: '0 auto' }}>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
          <circle cx={CX1} cy={CY} r={R} fill="none" stroke="var(--dir-text-primary)" strokeWidth={1.5} />
          <circle cx={CX2} cy={CY} r={R} fill="none" stroke="var(--dir-text-primary)" strokeWidth={1.5} strokeDasharray="6 4" />
        </svg>

        {/* Left-only zone — WF posture title above center, themes below */}
        <div style={{ position: 'absolute', left: CX1 - R + 30, top: CY - 90, width: 150, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ ...CAPS_13 }}>{wfPosture.label}</p>
          <p style={{ ...CAPTION }}>{wfPosture.stance}</p>
        </div>
        <div style={{ position: 'absolute', left: CX1 - R + 30, top: CY + 16, width: 150, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {wfThemes.map((t) => (
            <p key={t} style={{ ...DENSE, fontSize: 11, lineHeight: 1.4 }}>· {t}</p>
          ))}
        </div>

        {/* Right-only zone — CCS posture title above center, themes below */}
        <div style={{ position: 'absolute', left: CX2 - 30, top: CY - 90, width: 150, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <p style={{ ...CAPS_13 }}>{ccsPosture.label}</p>
          <p style={{ ...CAPTION, textAlign: 'right' }}>{ccsPosture.stance}</p>
        </div>
        <div style={{ position: 'absolute', left: CX2 - 30, top: CY + 16, width: 150, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          {ccsThemes.map((t) => (
            <p key={t} style={{ ...DENSE, fontSize: 11, lineHeight: 1.4, textAlign: 'right' }}>{t} ·</p>
          ))}
        </div>

        {/* Overlap zone — Ion's coverage */}
        <div style={{ position: 'absolute', left: OVERLAP_CX, top: CY, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: 140 }}>
          <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-bg)', backgroundColor: 'var(--dir-text-primary)', borderRadius: 9999, padding: '0 14px', height: 28, display: 'inline-flex', alignItems: 'center' }}>
            Ion
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center' }}>
            {ION_COVERAGE.map((c) => (
              <p key={c} style={{ fontFamily: IS, fontSize: 11, fontWeight: 500, lineHeight: 1.35, color: 'var(--dir-text-primary)', margin: 0 }}>{c}</p>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 16 }}>
        <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[0].quote}</p>
        <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0, textAlign: 'right' }}>{personas[1].quote}</p>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────────
// EXT.E1.HR / RS — Spectrum-plotted themes (political-compass paradigm)
// ───────────────────────────────────────────────────────────────────────────────────
//
// Two variants of the same structural fix: theme labels become PILLS (with background
// fill) plotted as DATA POINTS on the axis lines, while pole labels stay as TEXT at
// axis ends. Different visual roles enforced by visual treatment (pill vs text), not
// by position alone — solves the perimeter-label-role ambiguity that the radial
// cluster (V1/V3) keeps surfacing.
//
// .HR · Horizontal spectrum rows — 3 stacked rows, pole text at row ends, theme pills
//       on the line. Political-compass / Spotify Wrapped paradigm.
// .RS · Radial spectrum — V2-style geometry (3 bipolar axes through center), pole
//       text at perimeter, theme pills on the axis lines at lean positions.
//
// 2026-05-19 build. WF themes = filled pills (var(--dir-text-primary) bg);
// CCS themes = outlined pills (var(--dir-raised) bg + border).

const SPECTRUM_PILL_BASE: React.CSSProperties = {
  fontFamily: IS,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  borderRadius: 9999,
  padding: '4px 10px',
  whiteSpace: 'nowrap',
  lineHeight: 1,
};

function spectrumPillStyle(filled: boolean): React.CSSProperties {
  return {
    ...SPECTRUM_PILL_BASE,
    color: filled ? 'var(--dir-bg)' : 'var(--dir-text-primary)',
    backgroundColor: filled ? 'var(--dir-text-primary)' : 'var(--dir-raised)',
    border: '1px solid var(--dir-text-primary)',
  };
}

function SpectrumPersonaLegend({ personas }: { personas: readonly ArtifactPersona[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 32 }}>
      {[0, 1].map((i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: i === 0 ? 'var(--dir-text-primary)' : 'var(--dir-raised)', border: '2px solid var(--dir-text-primary)', flexShrink: 0 }} />
            <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 500, letterSpacing: '-0.005em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[i].name}</p>
            <p style={{ ...CAPS, color: 'var(--dir-text-secondary)', margin: 0 }}>{valuesTag(personas[i])}</p>
          </div>
          <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>{personas[i].quote}</p>
        </div>
      ))}
    </div>
  );
}

// ─── EXT.E1.HR — Horizontal Spectrum Rows ──────────────────────────────────────
// 3 stacked rows, one per axis. Each row: pole label LEFT (CAPS 10 text) · spectrum
// line (1px horizontal rule) · WF theme pill (filled) at WF's lean position · CCS
// theme pill (outlined) at CCS's lean position · pole label RIGHT (CAPS 10 text).
// Persona legend with quotes below the rows.
export function ArtifactExtE1Hr({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  const spectrums = ION_PERSONA_TRAITS.spectrums;
  const [wfData, ccsData] = ION_PERSONA_TRAITS.personas;
  const wfThemes = personaThemesArray(personas[0]);
  const ccsThemes = personaThemesArray(personas[1]);

  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <p style={{ ...CAPS, marginBottom: 32 }}>{CHORUS_SOURCE_LINE}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
        {spectrums.map((s, idx) => {
          const wfPos = s.positions[wfData.id];
          const ccsPos = s.positions[ccsData.id];
          const wfTheme = wfThemes[idx] ?? '';
          const ccsTheme = ccsThemes[idx] ?? '';
          return (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 160px', alignItems: 'center', gap: 16 }}>
              <p style={{ ...CAPS, color: 'var(--dir-text-primary)', textAlign: 'right', margin: 0 }}>{s.leftLabel}</p>
              <div style={{ position: 'relative', height: 32 }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'var(--dir-border)' }} />
                <span style={{ ...spectrumPillStyle(true), position: 'absolute', left: `${wfPos}%`, top: '50%', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
                  {wfTheme}
                </span>
                <span style={{ ...spectrumPillStyle(false), position: 'absolute', left: `${ccsPos}%`, top: '50%', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
                  {ccsTheme}
                </span>
              </div>
              <p style={{ ...CAPS, color: 'var(--dir-text-primary)', textAlign: 'left', margin: 0 }}>{s.rightLabel}</p>
            </div>
          );
        })}
      </div>

      <SpectrumPersonaLegend personas={personas} />
    </div>
  );
}

// ─── EXT.E1.RS — Radial Spectrum ────────────────────────────────────────────────
// V2-style overlap-spider geometry — 3 bipolar axes through center. 6 pole labels
// at perimeter (text). Theme pills (filled = WF, outlined = CCS) plotted ON the
// axis lines at each persona's lean position (distance from center = lean strength).
// No polygon — themes ARE the data points. Pole labels and theme pills have
// distinct visual treatment so their roles can't be confused.
export function ArtifactExtE1Rs({ personas }: PersonaArtifactProps) {
  const { state: borderRadius } = useGateAIonBorderRadius();
  if (personas.length < 2) return null;
  const spectrums = ION_PERSONA_TRAITS.spectrums;
  const [wfData, ccsData] = ION_PERSONA_TRAITS.personas;
  const wfThemes = personaThemesArray(personas[0]);
  const ccsThemes = personaThemesArray(personas[1]);
  const W = 700, H = 540;
  const CX = W / 2, CY = H / 2;
  const AXIS_R = 180;   // axis line length from center to perimeter
  const POLE_R = 218;   // pole-label distance from center (just outside the axis line)

  const wfPills = spectrums.map((s, idx) => {
    const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
    const pos = s.positions[wfData.id];
    const angle = pos < 50 ? angles.left : angles.right;
    const leanStrength = Math.abs(pos - 50) / 50;
    return { pt: polarPt(CX, CY, angle, leanStrength * AXIS_R), theme: wfThemes[idx] ?? '' };
  });
  const ccsPills = spectrums.map((s, idx) => {
    const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
    const pos = s.positions[ccsData.id];
    const angle = pos < 50 ? angles.left : angles.right;
    const leanStrength = Math.abs(pos - 50) / 50;
    return { pt: polarPt(CX, CY, angle, leanStrength * AXIS_R), theme: ccsThemes[idx] ?? '' };
  });
  const polePositions = spectrums.flatMap((s) => {
    const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
    return [
      { key: `${s.id}-L`, label: s.leftLabel, pt: polarPt(CX, CY, angles.left, POLE_R) },
      { key: `${s.id}-R`, label: s.rightLabel, pt: polarPt(CX, CY, angles.right, POLE_R) },
    ];
  });

  return (
    <div style={{ backgroundColor: 'var(--dir-raised)', border: RULE_HAIRLINE, padding: 32, borderRadius, marginBottom: 24 }}>
      <p style={{ ...CAPS, marginBottom: 24 }}>{CHORUS_SOURCE_LINE}</p>

      <div style={{ position: 'relative', width: W, height: H, margin: '0 auto' }}>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
          {spectrums.map((s) => {
            const angles = SIDE_BY_SIDE_AXIS_ANGLES[s.id] || { left: 270, right: 90 };
            const p1 = polarPt(CX, CY, angles.left, AXIS_R);
            const p2 = polarPt(CX, CY, angles.right, AXIS_R);
            return <line key={s.id} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--dir-border)" strokeWidth={1} />;
          })}
          <circle cx={CX} cy={CY} r={3} fill="var(--dir-detail)" />
        </svg>

        {polePositions.map((p) => (
          <p key={p.key} style={{
            position: 'absolute',
            left: p.pt.x,
            top: p.pt.y,
            transform: 'translate(-50%, -50%)',
            ...CAPS,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}>
            {p.label}
          </p>
        ))}

        {wfPills.map((p, i) => (
          <span key={`wf-${i}`} style={{
            ...spectrumPillStyle(true),
            position: 'absolute',
            left: p.pt.x,
            top: p.pt.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
          }}>
            {p.theme}
          </span>
        ))}
        {ccsPills.map((p, i) => (
          <span key={`ccs-${i}`} style={{
            ...spectrumPillStyle(false),
            position: 'absolute',
            left: p.pt.x,
            top: p.pt.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
          }}>
            {p.theme}
          </span>
        ))}
      </div>

      <SpectrumPersonaLegend personas={personas} />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────────
// Router + dropdown sections
// ───────────────────────────────────────────────────────────────────────────────────

export function PersonaArtifactRenderer({
  artifact,
  density,
  personas,
}: {
  artifact: GateAIonS03PersonaArtifact;
  density?: GateAIonS03PersonaContentDensity;
  personas: readonly ArtifactPersona[];
}) {
  // When artifact === 'none' AND density override is active (not 'original'), render the
  // density-aware native callout block instead of returning null. This unifies the call
  // contract so the shell can always render <PersonaArtifactRenderer .../> regardless of
  // JSX-child vs JS-expression position.
  if (artifact === 'none') {
    if (!density || density === 'original') return null;
    return <NativePersonaCalloutBlock density={density} personas={personas} />;
  }
  switch (artifact) {
    case '1.C': return <Artifact1C personas={personas} />;
    case '1.D': return <Artifact1D personas={personas} />;
    case '1.E': return <Artifact1E personas={personas} />;
    case '2.A': return <Artifact2A personas={personas} />;
    case '2.B': return <Artifact2B personas={personas} />;
    case '2.C': return <Artifact2C personas={personas} />;
    case '3.A': return <Artifact3A personas={personas} />;
    case '3.B': return <Artifact3B personas={personas} />;
    case '3.C': return <Artifact3C personas={personas} />;
    case '4.A': return <Artifact4A personas={personas} />;
    case '4.B': return <Artifact4B personas={personas} />;
    case '4.C': return <Artifact4C personas={personas} />;
    case 'EXT.E1': return <ArtifactExtE1 personas={personas} />;
    case 'EXT.E1.S': return <ArtifactExtE1S personas={personas} />;
    case 'EXT.E1.B': return <ArtifactExtE1B personas={personas} />;
    case 'EXT.E1.P': return <ArtifactExtE1P personas={personas} />;
    case 'EXT.E1.C': return <ArtifactExtE1C personas={personas} />;
    case 'EXT.E1.R': return <ArtifactExtE1R personas={personas} />;
    case 'EXT.E1.H': return <ArtifactExtE1H personas={personas} />;
    case 'EXT.E1.M': return <ArtifactExtE1M personas={personas} />;
    case 'EXT.E1.A': return <ArtifactExtE1A personas={personas} />;
    case 'EXT.E1.V1': return <ArtifactExtE1V1 personas={personas} />;
    case 'EXT.E1.V2': return <ArtifactExtE1V2 personas={personas} />;
    case 'EXT.E1.V3': return <ArtifactExtE1V3 personas={personas} />;
    case 'EXT.E1.OSG': return <ArtifactExtE1Osg personas={personas} />;
    case 'EXT.E1.BUL': return <ArtifactExtE1Bul personas={personas} />;
    case 'EXT.E1.CRD': return <ArtifactExtE1Crd personas={personas} />;
    case 'EXT.E1.TOR': return <ArtifactExtE1Tor personas={personas} />;
    case 'EXT.E1.SC': return <ArtifactExtE1Sc personas={personas} />;
    case 'EXT.E1.BR': return <ArtifactExtE1Br personas={personas} />;
    case 'EXT.E1.VP': return <ArtifactExtE1Vp personas={personas} />;
    case 'EXT.E1.HR': return <ArtifactExtE1Hr personas={personas} />;
    case 'EXT.E1.RS': return <ArtifactExtE1Rs personas={personas} />;
    default: return null;
  }
}

// Dropdown sections for LabShell Persona Artifact toggle.
// Caller injects the ★ recommended-for-active-direction annotation into `meta` field.
export type PersonaArtifactOption = { value: GateAIonS03PersonaArtifact; label: string; detail: string };
export type PersonaArtifactSection = { heading: string; options: PersonaArtifactOption[] };

export const PERSONA_ARTIFACT_SECTIONS: ReadonlyArray<PersonaArtifactSection> = [
  {
    heading: 'Default',
    options: [
      { value: 'none', label: 'None · inline callout', detail: 'Persona callout renders in the active direction\'s register. Any artifact REPLACES the callout entirely.' },
    ],
  },
  {
    heading: 'Family 1 · Data journalism',
    options: [
      { value: '1.C', label: '1.C · Journey strip', detail: 'Pew small-multiples 2×5 — both personas across the canonical 5-step Ion workflow with per-cell friction markers. Source-grounded.' },
      { value: '1.D', label: '1.D · Pew typology table', detail: 'Pew Political/Religious Typology register. Comparison table: rows = attributes, columns = personas. Top + bottom hairline rules + per-persona theme-density bars.' },
      { value: '1.E', label: '1.E · Theme coding sheet', detail: 'Research-artifact visual. Each box = one theme that recurred across our 22 designer interviews. Box size shows how often the theme came up. Two columns show which themes grouped into each user type.' },
    ],
  },
  {
    heading: 'Family 2 · Editorial print',
    options: [
      { value: '2.A', label: '2.A · Pull-quote diptych', detail: 'Two pull-quotes at ISe 22 H2 content register (locked downgrade from ISe 32 to avoid §03 section-heading conflict). New Yorker / NY Magazine register.' },
      { value: '2.B', label: '2.B · Annotated portrait pair', detail: 'Persona name at ISe 32 Intro Heading as visual anchor (downgrade from ISe 52 off-ladder); hand-feel annotation lines pointing to trait labels (Nigel Holmes register, no axis).' },
      { value: '2.C', label: '2.C · Magazine feature spread', detail: 'Two-column editorial spread profiling each user type as a featured subject. Chapter numerals + named-subject headlines + pull-quotes + interview-voice byline. Speed↔Control axis at top positions each user type geometrically.' },
    ],
  },
  {
    heading: 'Family 3 · Out-of-the-box',
    options: [
      { value: '3.A', label: '3.A · Twin museum tombstones', detail: 'Two adjacent framed museum-label cards. Full hairline border per card. Metadata header → named subject → interpretive line → "what we heard" footer. The framed-card chrome IS the museum-gallery visual.' },
      { value: '3.B', label: '3.B · Structured-abstract participants', detail: 'JAMA/NEJM `Participants.` block. Flat structured-abstract paragraph naming both user types inline.' },
      { value: '3.C', label: '3.C · Letter-prose passage', detail: 'Berkshire/Stripe annual-letter voice. Running first-person prose names both user types inline, embeds quotes. No frame.' },
    ],
  },
  {
    heading: 'Family 4 · Design portfolio',
    options: [
      { value: '4.A', label: '4.A · Portfolio card pair', detail: 'Premium portfolio card register (Bill Guo style). Each user type is a hairline-bordered case card with header (label + case numeral), theme-density bar, subject identity, and hairline-separated footer with "what we heard" attribution.' },
      { value: '4.B', label: '4.B · Narrated paragraph', detail: 'van Schneider / Frank Chimero senior-narrated body. BODY 15 paragraph delimited by 1px top + bottom rule + inline 22-cell sparkline encoding the 22 designer interviews.' },
      { value: '4.C', label: '4.C · Numbered case-study deck', detail: 'MetaLab / Linear Design numbered case-study deck. Each user type is a case row with proof-numeral marker (Case 01 / 02), named subject, verbatim quote, theme-density bar, and "what we heard" footer. Top + bottom deck frame; rows divided by hairlines.' },
    ],
  },
  {
    heading: 'EXT.E1 family · Graph-style persona-trait visualizations',
    options: [
      { value: 'EXT.E1.V1', label: 'EXT.E1.V1 · OG cluster (themes at lean, lines to lean)', detail: '2026-05-18 build with (i)+(α) fixes. Per-persona side-by-side. 6 endpoints visible — 3 LEAN endpoints labeled with THEMES (concrete behaviors, replacing abstract trait names) + 3 NON-LEAN at perimeter showing trait names only. Lines ONLY to lean endpoints. Pull-quote below.' },
      { value: 'EXT.E1.V2', label: 'EXT.E1.V2 · Overlap spider (themes at lean)', detail: '2026-05-18 build with (i)+(α) fixes. Single chart, both personas as overlapping triangles. ALL 6 endpoint positions labeled with whichever persona\'s THEME leans there — WF themes in southern hemisphere, CCS themes in northern. Persona legend with quote below.' },
      { value: 'EXT.E1.V3', label: 'EXT.E1.V3 · Lean-only cluster (cleaned pre-merge)', detail: '2026-05-18 cleaned-up pre-merge variant. Per-persona side-by-side. ONLY the 3 lean endpoints visible per chart (no non-lean labels at all). Themes ARE the labels. Cleanest reading.' },
      { value: 'EXT.E1.A', label: 'EXT.E1.A · Asymmetric cluster (OG-faithful, chip rail)', detail: 'Original OG-faithful version with theme chip rail + quote below. Kept for comparison.' },
      { value: 'EXT.E1.OSG', label: 'EXT.E1.OSG · Semantic Differential (Osgood 1957)', detail: 'The literal academic ancestor of bipolar persona spectrums. 3 stacked rows · pole label LEFT + continuum + both persona markers + pole label RIGHT. Verbal anchors at row ends. Precedent: Osgood 1957 attitude-measurement instrument.' },
      { value: 'EXT.E1.BUL', label: 'EXT.E1.BUL · Bullet Graph (Stephen Few)', detail: '3 stacked rows · shaded range bands (low/mid/high zones) · persona markers at positions. Background gradient does the spectrum work; markers do the persona work. Precedent: Stephen Few\'s 2005 Bullet Graph Design Spec.' },
      { value: 'EXT.E1.CRD', label: 'EXT.E1.CRD · Sports-Card pair (FIFA / Pokemon)', detail: 'Two persona "cards" side-by-side. FIFA Ultimate Team / Pokemon stat block composition: header with name + values phrase · stat grid (3 traits with position + theme) · quote at bottom. WF card filled, CCS card outlined.' },
      { value: 'EXT.E1.TOR', label: 'EXT.E1.TOR · Tornado Diagram', detail: 'Central spine, 3 rows ordered by ABSOLUTE MAGNITUDE of divergence (largest at top — tornado/funnel silhouette). Each row: pole label · WF bar extending left · spine · CCS bar extending right · pole label. Precedent: Edward Bodmer\'s tornado-diagram convention (sensitivity analysis).' },
      { value: 'EXT.E1', label: 'EXT.E1 · Overlap spider', detail: 'Single chart, both personas as overlapping polygons on 3 bidirectional axes. Distance from center = lean strength. Mirror-image polygons across center = opposition.' },
      { value: 'EXT.E1.S', label: 'EXT.E1.S · Slope graph (Tufte)', detail: 'Two vertical persona columns, 3 trait lines crossing between them. Two lines slope up, one crosses down — the crossing IS the visual signature. Precedent: Tufte cancer survival rates; Storytelling With Data two-group slopegraphs.' },
      { value: 'EXT.E1.B', label: 'EXT.E1.B · Butterfly chart (Pew)', detail: 'Central spine, persona bars extending left/right per trait row. Bar length = lean strength. Per-row axes oriented so WF lean = left, CCS lean = right (consistent visual side). Precedent: Pew Research "Distance between Democrats and Republicans" divergent stacked bars.' },
      { value: 'EXT.E1.P', label: 'EXT.E1.P · Profile chart (clinical psych)', detail: '3 horizontal trait axes stacked vertically. Each persona threads through all axes as a connected ribbon (polyline). The line silhouette IS the personality signature. Two ribbons crossing in opposite directions = visual mirror image. Precedent: Eysenck/MMPI/Big Five clinical-psych profile-analysis convention.' },
      { value: 'EXT.E1.C', label: 'EXT.E1.C · Diverging radial coxcomb', detail: 'Side-by-side per-persona discs. 3 wedges per persona, each in the hemisphere matching the persona\'s lean. Workflow-Focused\'s wedges all south; Creative Control Seekers\' all north. Side-by-side = literal mirror image of disc halves. Precedent: Nightingale\'s two-rose Crimean War comparison.' },
      { value: 'EXT.E1.R', label: 'EXT.E1.R · Polar bar (per persona)', detail: 'Side-by-side per-persona discs. 3 thin radial bars per persona, bar length = lean strength, bar angle = lean pole. Cleaner / more instrument-like than coxcomb. Same mirror-image effect via bars in opposing hemispheres. Precedent: Highcharts radial bar, Nivo polar bar.' },
      { value: 'EXT.E1.H', label: 'EXT.E1.H · Hofstede bar chart', detail: 'Two side-by-side per-persona panels. 3 vertical bars per panel (one per trait). Bar height = position 0-100. The bar-landscape silhouette per panel IS the persona\'s identity (high-high-low vs low-low-high). Direct precedent: Hofstede country comparison tool — canonical "2 entities × N traits" data-viz pattern published for decades.' },
      { value: 'EXT.E1.M', label: 'EXT.E1.M · Small multiples (Pew/Spotify)', detail: 'Two side-by-side per-persona panels. 3 stacked horizontal bipolar spectrum rows per panel (pole-left ↔ pole-right) with persona dot at position. Dots cluster on opposite sides between panels = mirror dot patterns. Precedent: Pew Research small multiples + Spotify Wrapped listening-personality spectrum bars.' },
    ],
  },
  {
    heading: 'EXT.E1 family · Convergent / synthesis (Ion serves both)',
    options: [
      { value: 'EXT.E1.SC', label: 'EXT.E1.SC · Shared-center spider (central Ion)', detail: '2026-05-18 build. Single chart, both personas as opposing polygons (WF filled · CCS dashed) anchored at a central "Ion" pill. Theme labels at perimeter endpoints. Legend below adds posture labels (AI-as-deputy / AI-as-consultant). Synthesis: opposed patterns share a common center. Likely §06 intro candidate.' },
      { value: 'EXT.E1.BR', label: 'EXT.E1.BR · Bridge chart (WF | Ion | CCS)', detail: '2026-05-18 build. 3-column layout. Each persona gets a full column (name · values · posture · themes · quote). Center column carries an Ion pill on a horizontal connector with outward arrows to both personas. Footer: "Same goal · different starting points."' },
      { value: 'EXT.E1.VP', label: 'EXT.E1.VP · Venn-of-postures (Ion in overlap)', detail: '2026-05-18 build. Two overlapping circles. Left lobe = AI-as-deputy posture + WF themes (solid circle). Right lobe = AI-as-consultant posture + CCS themes (dashed circle). Overlap = Ion\'s coverage (cross-cutting benefits). Persona quotes below.' },
    ],
  },
  {
    heading: 'EXT.E1 family · Spectrum-plotted themes (political-compass paradigm)',
    options: [
      { value: 'EXT.E1.HR', label: 'EXT.E1.HR · Horizontal spectrum rows', detail: '2026-05-19 build. 3 stacked rows, one per axis. Each row: pole label LEFT (text) · spectrum line · WF theme pill (filled) at WF\'s lean position · CCS theme pill (outlined) at CCS\'s lean position · pole label RIGHT (text). Pills are clearly data points; pole text is clearly categorical anchor — no role ambiguity. Political-compass / Spotify Wrapped paradigm.' },
      { value: 'EXT.E1.RS', label: 'EXT.E1.RS · Radial spectrum (themes plotted on axes)', detail: '2026-05-19 build. V2-style geometry — 3 bipolar axes through center, 6 pole labels at perimeter. Theme pills (filled = WF · outlined = CCS) plotted ON the axis lines at lean positions. No polygon — themes ARE the data. Pole text and theme pills have distinct visual treatment so roles can\'t be confused.' },
    ],
  },
];
