import React from 'react';
import { IS } from '../cards/tokens';
import { ION_AFFINITY_MAP, type Persona, type Cluster, type PostIt } from './data/ion-affinity-map';
import { useGateAIonArtifactPlayground, type A1State } from '../../state/GateAIonArtifactPlaygroundContext';

// A1 · Affinity Map — Step 4 first artifact build (full).
// Native = Leyi's iondesign affinity map verbatim (2 personas × 3 clusters × N post-its).
// All 4 variants built: grid (native), linear (editorial), compact, heatmap-tinted.
//
// SYSTEM ADHERENCE:
// - Typography: locked ladder (typography-system.md §B) — sizes 10·11·13·15·18·22·32·52
//   with exceptions 12 (CTA), 28 (proof numerals). NO 9, 14, 16, 17, 19, 20, 21, 24.
//   ISe is reserved for 22 (Editorial Section Heading) or 32 (Editorial Intro Heading) ONLY.
// - Spacing: locked tokens (spacing-layout-rhythm.md §A) — 4·8·12·16·24·32·48·64·80·96·128.
// - Density modes: locked names + values (spacing-layout-rhythm.md §C) — Dense / Standard / Airy.
//   Component/Block/Section per mode, Micro=8 and Tight=12 invariant across modes.
// - Color: W1 tokens only — var(--dir-text-primary) | --dir-text-secondary | --dir-detail
//   | --dir-border | --dir-raised. Heatmap uses color-mix with --dir-text-primary, no new tokens.

// Locked density modes per spacing-layout-rhythm.md §C:
// | Token     | Dense | Standard | Airy |
// | Component |   12  |    16    |  16  |
// | Block     |   16  |    24    |  32  |
// | Section   |   32  |    48    |  64  |
// | Micro=8 and Tight=12 invariant across all modes.
const DENSITY: Record<A1State['density'], { component: number; block: number; section: number }> = {
  dense: { component: 12, block: 16, section: 32 },
  standard: { component: 16, block: 24, section: 48 },
  airy: { component: 16, block: 32, section: 64 },
};
const MICRO = 8;
const TIGHT = 12;

const NOTE_LENGTH_LIMITS = {
  short: 60,
  medium: 120,
  long: Infinity,
} as const;

type Compactness = 'normal' | 'compact';

function truncatePost(text: string, length: 'short' | 'medium' | 'long'): string {
  const limit = NOTE_LENGTH_LIMITS[length];
  if (text.length <= limit) return text;
  return text.slice(0, limit - 1).trimEnd() + '…';
}

function PostItCard({
  note,
  showAttribution,
  noteLength,
  compactness,
}: {
  note: PostIt;
  showAttribution: boolean;
  noteLength: 'short' | 'medium' | 'long';
  compactness: Compactness;
}) {
  // Body text uses Dense Body (IS 13/300) at normal, Caption/Note (IS 11/300) at compact.
  // Attribution uses Meta/Label/UI (IS 10/500/0.12em uppercase) — same in both registers
  // because 10 is the locked floor; smaller would violate the type system.
  return (
    <div
      style={{
        padding: `${MICRO}px ${TIGHT}px`,
        border: '1px solid var(--dir-border)',
        backgroundColor: 'var(--dir-raised)',
        display: 'flex',
        flexDirection: 'column',
        gap: MICRO,
      }}
    >
      <p
        style={{
          fontFamily: IS,
          fontSize: compactness === 'compact' ? 11 : 13,
          fontWeight: 300,
          lineHeight: compactness === 'compact' ? 1.35 : 1.6,
          color: 'var(--dir-text-primary)',
          margin: 0,
        }}
      >
        {truncatePost(note.text, noteLength)}
      </p>
      {showAttribution && note.author && (
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            lineHeight: 1.4,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--dir-detail)',
            margin: 0,
          }}
        >
          {note.author}
        </p>
      )}
    </div>
  );
}

function clusterTint(noteCount: number, maxNotes: number): string {
  // Heatmap maps note density to W1's 4 discrete background-step tokens (color-system-w1.md
  // §B Structural tokens). NOT a continuous color-mix on --dir-text-primary — per W1 §D
  // "the graphite ink is the accent," accent ink isn't a sanctioned background tint source.
  // Quartile steps (lowest → highest density): --dir-bg → --dir-raised → --dir-recessed → --dir-muted.
  if (maxNotes === 0) return 'var(--dir-bg)';
  const ratio = noteCount / maxNotes;
  if (ratio <= 0.25) return 'var(--dir-bg)';
  if (ratio <= 0.5) return 'var(--dir-raised)';
  if (ratio <= 0.75) return 'var(--dir-recessed)';
  return 'var(--dir-muted)';
}

function ClusterColumn({
  cluster,
  notesLimit,
  showAttribution,
  density,
  background,
  noteLength,
  tintBg,
  compactness,
}: {
  cluster: Cluster;
  notesLimit: number;
  showAttribution: boolean;
  density: A1State['density'];
  background: A1State['background'];
  noteLength: A1State['noteLength'];
  tintBg?: string;
  compactness: Compactness;
}) {
  const d = DENSITY[density];
  const visibleNotes = cluster.notes.slice(0, notesLimit);
  const bg =
    tintBg ??
    (background === 'raised' ? 'var(--dir-raised)' : 'transparent');
  const border = background === 'dashed' ? '1px dashed var(--dir-border)' : 'none';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: TIGHT, // notes inside a cluster sit at Tight (list-item gap, locked invariant)
        padding: d.component,
        backgroundColor: bg,
        border,
        minWidth: 0,
      }}
    >
      <h4
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          lineHeight: 1.4,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-text-primary)',
          margin: 0,
          paddingBottom: MICRO,
          borderBottom: '1px solid var(--dir-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: MICRO,
        }}
      >
        <span>{cluster.name}</span>
        <span
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.06em',
            color: 'var(--dir-detail)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {cluster.notes.length}
        </span>
      </h4>
      {visibleNotes.map((note, i) => (
        <PostItCard
          key={i}
          note={note}
          showAttribution={showAttribution}
          noteLength={noteLength}
          compactness={compactness}
        />
      ))}
    </div>
  );
}

function ConnectorGlyph({ kind, vertical = false }: { kind: 'lines' | 'arrows'; vertical?: boolean }) {
  if (kind === 'lines') {
    return (
      <span
        aria-hidden
        style={{
          alignSelf: 'stretch',
          width: vertical ? 1 : 'auto',
          height: vertical ? 'auto' : 1,
          minWidth: vertical ? 1 : MICRO * 3,
          backgroundColor: 'var(--dir-border)',
          flexShrink: 0,
        }}
      />
    );
  }
  // arrows — chevron rendered as Caption/Note (IS 11) so it stays inside the type ladder
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        color: 'var(--dir-detail)',
        fontFamily: IS,
        fontSize: 11,
        fontWeight: 500,
        flexShrink: 0,
        transform: vertical ? 'rotate(90deg)' : 'none',
      }}
    >
      →
    </span>
  );
}

function PersonaHeader({
  persona,
  compactness,
  index,
}: {
  persona: Persona;
  compactness: Compactness;
  index: number;
}) {
  // Persona eyebrow ("Persona 01" / "Persona 02") = Meta/Label/UI (IS 10/500/0.12em uppercase),
  // --dir-detail color. Adds editorial-register index for affinity-map IC quality.
  // Persona name uses Supporting/Sub-heading (IS 18/600) at normal; Dense Body (IS 13/300)
  // at compact. Persona thesis = Dense Body (IS 13/300) normal / Caption/Note (IS 11/300)
  // compact. ISe is NOT used — locked roles for ISe are 22 / 32 only.
  const isCompact = compactness === 'compact';
  const indexLabel = `Persona ${String(index + 1).padStart(2, '0')}`;
  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <p
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-detail)',
          margin: 0,
          marginBottom: 4,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {indexLabel}
      </p>
      <h3
        style={{
          fontFamily: IS,
          fontSize: isCompact ? 13 : 18,
          fontWeight: isCompact ? 300 : 600,
          lineHeight: isCompact ? 1.6 : 1.4,
          letterSpacing: isCompact ? 0 : '-0.01em',
          color: 'var(--dir-text-primary)',
          margin: 0,
        }}
      >
        {persona.name}
      </h3>
      <p
        style={{
          fontFamily: IS,
          fontSize: isCompact ? 11 : 13,
          fontWeight: 300,
          lineHeight: isCompact ? 1.35 : 1.6,
          color: 'var(--dir-text-secondary)',
          margin: 0,
        }}
      >
        {persona.thesis}
      </p>
    </header>
  );
}

function PersonaRowGrid({
  persona,
  a1,
  compactness,
  tinted,
  index,
}: {
  persona: Persona;
  a1: A1State;
  compactness: Compactness;
  tinted: boolean;
  index: number;
}) {
  const d = DENSITY[a1.density];
  const visibleClusters = persona.clusters.slice(0, a1.clusterCount);
  const maxNotes = Math.max(...persona.clusters.map((c) => c.notes.length));
  const items: React.ReactNode[] = [];
  visibleClusters.forEach((c, i) => {
    items.push(
      <ClusterColumn
        key={`c${i}`}
        cluster={c}
        notesLimit={a1.notesPerCluster}
        showAttribution={a1.attribution === 'show'}
        density={a1.density}
        background={a1.background}
        noteLength={a1.noteLength}
        tintBg={tinted ? clusterTint(c.notes.length, maxNotes) : undefined}
        compactness={compactness}
      />,
    );
    if (i < visibleClusters.length - 1 && a1.connectors !== 'off') {
      items.push(<ConnectorGlyph key={`x${i}`} kind={a1.connectors} vertical />);
    }
  });
  const cols = visibleClusters.length;
  const connectorCols = a1.connectors === 'off' ? 0 : cols - 1;
  const template = a1.connectors === 'off'
    ? `repeat(${cols}, minmax(0, 1fr))`
    : Array.from({ length: cols + connectorCols })
        .map((_, idx) => (idx % 2 === 0 ? 'minmax(0, 1fr)' : 'auto'))
        .join(' ');
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: TIGHT }}>
      <PersonaHeader persona={persona} compactness={compactness} index={index} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: template,
          gap: d.block,
          alignItems: 'stretch',
        }}
      >
        {items}
      </div>
    </section>
  );
}

function PersonaRowLinear({ persona, a1, index }: { persona: Persona; a1: A1State; index: number }) {
  const d = DENSITY[a1.density];
  const visibleClusters = persona.clusters.slice(0, a1.clusterCount);
  // Cluster-name rail at 128px (space-11). Wide enough for "Quick design requests" at IS 10/500
  // caps; narrower would clip. PostIt minimum at 128 (space-11) so 3 cards fit at ≥640px row.
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: d.block }}>
      <PersonaHeader persona={persona} compactness="normal" index={index} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: d.block }}>
        {visibleClusters.map((c, i) => {
          const visibleNotes = c.notes.slice(0, a1.notesPerCluster);
          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '128px 1fr',
                gap: d.block,
                alignItems: 'start',
                paddingTop: i === 0 ? 0 : d.component,
                borderTop: i === 0 ? 'none' : '1px solid var(--dir-border)',
              }}
            >
              <h4
                style={{
                  fontFamily: IS,
                  fontSize: 10,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--dir-text-primary)',
                  margin: 0,
                  paddingTop: 4,
                }}
              >
                {c.name}
              </h4>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: TIGHT,
                  alignItems: 'stretch',
                }}
              >
                {visibleNotes.map((note, j) => (
                  <React.Fragment key={j}>
                    <div style={{ flex: '1 1 128px', minWidth: 0 }}>
                      <PostItCard
                        note={note}
                        showAttribution={a1.attribution === 'show'}
                        noteLength={a1.noteLength}
                        compactness="normal"
                      />
                    </div>
                    {j < visibleNotes.length - 1 && a1.connectors !== 'off' && (
                      <ConnectorGlyph kind={a1.connectors} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function A1AffinityMap() {
  const { a1 } = useGateAIonArtifactPlayground();
  const personas = ION_AFFINITY_MAP.slice(0, a1.personaCount);
  const sectionGap = DENSITY[a1.density].section;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sectionGap }}>
      {personas.map((persona, i) => {
        if (a1.variant === 'linear') {
          return <PersonaRowLinear key={i} persona={persona} a1={a1} index={i} />;
        }
        const compactness: Compactness = a1.variant === 'compact' ? 'compact' : 'normal';
        const tinted = a1.variant === 'heatmap';
        return (
          <PersonaRowGrid
            key={i}
            persona={persona}
            a1={a1}
            compactness={compactness}
            tinted={tinted}
            index={i}
          />
        );
      })}
    </div>
  );
}
