import type { MarginToken } from '../../state/MarginContext';

export type SurfaceTier = 't1' | 't2' | 't3' | 't4' | 't5' | 't6' | 't7' | 't8';
export type SurfaceSlot = 's1' | 's2' | 's3' | 's4' | 's5' | 's6' | 's7' | 's8';
export type FeaturedShell = 'FH-A' | 'FH-B';
export type SvbAlternate = 'none' | 'clean' | 'conditional';

export type SurfaceCandidate = {
  id: string;
  tier: SurfaceTier;
  slot: SurfaceSlot;
  label: string;
  workingName: string;
  thesis: string;
  featuredShell: FeaturedShell;
  defaultCta: 'visible' | 'quiet' | 'none';
  defaultMedia: 'structural-placeholder' | 'real-asset';
  svbAlternate: SvbAlternate;
  quietArtifact?: boolean;
  nativeMargin: MarginToken;
};

export const surfaceCandidates: SurfaceCandidate[] = [
  {
    id: 't1-s1',
    tier: 't1',
    slot: 's1',
    label: 'T1-S1',
    workingName: 'Explicit Container Baseline',
    thesis:
      'Locked card system at full container strength — visible border, surface-raised fill, atoms in locked positions and locked weights.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'clean',
    quietArtifact: true,
    nativeMargin: 'centered',
  },
  {
    id: 't1-s2',
    tier: 't1',
    slot: 's2',
    label: 'T1-S2',
    workingName: 'Quiet Container Baseline',
    thesis:
      'Same locked atoms and positions, container signal softened to the minimum that still holds the object together — muted border, softer raised fill.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'centered',
  },
  {
    id: 't1-s3',
    tier: 't1',
    slot: 's3',
    label: 'T1-S3',
    workingName: 'Media-Weighted Baseline',
    thesis:
      'Within locked shell geometry, media carries first visual weight via tonal dominance and media-edge prominence — content stack remains in its locked plane.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'centered',
  },
  {
    id: 't1-s4',
    tier: 't1',
    slot: 's4',
    label: 'T1-S4',
    workingName: 'Content-Stack Baseline',
    thesis:
      'Highly disciplined typographic content stack — media present per shell rules but modest in tonal presence; ordering, rhythm, and type color carry the read.',
    featuredShell: 'FH-A',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'conditional',
    nativeMargin: 'centered',
  },
  {
    id: 't2-s1',
    tier: 't2',
    slot: 's1',
    label: 'T2-S1',
    workingName: 'Open Surface',
    thesis:
      'Project object becomes page-integrated — container edge reduced to zero — grouping carried by proximity, alignment, and identifier anchor.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'centered',
  },
  {
    id: 't2-s2',
    tier: 't2',
    slot: 's2',
    label: 'T2-S2',
    workingName: 'Split-Plate Surface',
    thesis:
      'Media and content formalized as two coupled plates — seam between them authored via tone differential and a shared alignment mark crossing the seam.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'centered',
  },
  {
    id: 't2-s3',
    tier: 't2',
    slot: 's3',
    label: 'T2-S3',
    workingName: 'Scan-Rail Surface',
    thesis:
      'One deliberate information rail formalizes the scan anchor — proof row elevated to a bottom-rail on Featured; tag row elevated to a top-rail on Standard.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'clean',
    nativeMargin: 'centered',
  },
  {
    id: 't2-s4',
    tier: 't2',
    slot: 's4',
    label: 'T2-S4',
    workingName: 'Quiet-Action Composition',
    thesis:
      'Action zone composed at minimum structurally-legal footprint — TextCTA on Featured, compact placement; title and framing carry more of the path-forward cue.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'clean',
    nativeMargin: 'centered',
  },
  {
    id: 't3-s1',
    tier: 't3',
    slot: 's1',
    label: 'T3-S1',
    workingName: 'Floating Info Plate',
    thesis:
      'Content behaves as a floating plate docked over media — visibly detached from the media plane via inset + soft tonal differential.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'conditional',
    nativeMargin: 'centered',
  },
  {
    id: 't3-s2',
    tier: 't3',
    slot: 's2',
    label: 'T3-S2',
    workingName: 'Dossier Label Surface',
    thesis:
      'Object reads like a labeled record — metadata block foregrounded as the identifier; title reads in relation to the label; scope / provenance / relation atoms do real work.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'clean',
    nativeMargin: 'centered',
  },
  {
    id: 't3-s3',
    tier: 't3',
    slot: 's3',
    label: 'T3-S3',
    workingName: 'Poster Surface',
    thesis:
      'Title, framing, and media compose like a poster — display-scale typography paired with media at authored weight balance.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'centered',
  },
  {
    id: 't3-s4',
    tier: 't3',
    slot: 's4',
    label: 'T3-S4',
    workingName: 'Modular Surface',
    thesis:
      'Object is a stack of 3–5 visibly distinct modules (media / identifier / title+framing / proof+tag / action) cohering through shared alignment + ladder spacing.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'centered',
  },
  {
    id: 't4-s1',
    tier: 't4',
    slot: 's1',
    label: 'T4-S1',
    workingName: 'Artifact Mount',
    thesis:
      'Project formally mounted as artifact — media held with display-register spacing; content flips role into wall-label serving the artifact.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'm7',
  },
  {
    id: 't4-s2',
    tier: 't4',
    slot: 's2',
    label: 'T4-S2',
    workingName: 'Gallery Placard Surface',
    thesis:
      'Media behaves like an exhibit; metadata behaves like a three-tier museum label (intro / tombstone / caption) — detached formal block.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'clean',
    nativeMargin: 'centered',
  },
  {
    id: 't4-s3',
    tier: 't4',
    slot: 's3',
    label: 'T4-S3',
    workingName: 'Instrument Panel Surface',
    thesis:
      'Proof, meta, and action encoded with operational readout clarity — proof numerals as live metrics, labels as operational descriptors, status chips as unit markers.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'clean',
    nativeMargin: 'centered',
  },
  {
    id: 't4-s4',
    tier: 't4',
    slot: 's4',
    label: 'T4-S4',
    workingName: 'Fragment Stack',
    thesis:
      'Object assembled from visible fragments (chips, strips, plates) held together as one project by alignment + proximity + typographic repetition.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'centered',
  },
  // T5 · Editorial / Paired-Column Card Register (8)
  // The emmiwu / rachelchen / billguo register — asymmetric editorial posture,
  // authored typographic rhythm, card body reads like a set piece.
  {
    id: 't5-s1',
    tier: 't5',
    slot: 's1',
    label: 'T5-S1',
    workingName: 'Italic Title Card',
    thesis:
      'Editorial posture earned through typography alone — title set in Instrument Serif italic at display scale, framing carried as caption below a hairline rule, meta reduced to a single line.',
    featuredShell: 'FH-A',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'clean',
    nativeMargin: 'centered',
  },
  {
    id: 't5-s2',
    tier: 't5',
    slot: 's2',
    label: 'T5-S2',
    workingName: 'Right-Aligned Meta Rail',
    thesis:
      'Identifier sits left, project meta docks flush-right on the same baseline — asymmetric rail created by alignment, not decoration; body hangs below.',
    featuredShell: 'FH-A',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'centered',
  },
  {
    id: 't5-s3',
    tier: 't5',
    slot: 's3',
    label: 'T5-S3',
    workingName: 'Framed-Image Card',
    thesis:
      'Media held inside a visible authored frame — double-border inset + mat, like a billguo.me artifact; frame reads as evidence, not chrome.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'clean',
    nativeMargin: 'centered',
  },
  {
    id: 't5-s4',
    tier: 't5',
    slot: 's4',
    label: 'T5-S4',
    workingName: 'Authored-Aspect Card',
    thesis:
      'Each Standard carries its own authored media aspect (4:3 / 1:1 / 3:4 / 16:9) — rhythm comes from aspect variance within a held grid, not layout drift.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'centered',
  },
  {
    id: 't5-s5',
    tier: 't5',
    slot: 's5',
    label: 'T5-S5',
    workingName: 'Tombstone Label',
    thesis:
      'Card body reads like a museum tombstone — title / maker-and-date / medium / support / credit on five typographically distinct lines, no prose.',
    featuredShell: 'FH-A',
    defaultCta: 'quiet',
    defaultMedia: 'real-asset',
    svbAlternate: 'conditional',
    nativeMargin: 'centered',
  },
  {
    id: 't5-s6',
    tier: 't5',
    slot: 's6',
    label: 'T5-S6',
    workingName: 'Chip Cluster',
    thesis:
      'Three labeled pill clusters (stack / year / domain) foregrounded as the primary scan object above the title — classification carries first weight.',
    featuredShell: 'FH-A',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'clean',
    nativeMargin: 'centered',
  },
  {
    id: 't5-s7',
    tier: 't5',
    slot: 's7',
    label: 'T5-S7',
    workingName: 'Terminal Release Eyebrow',
    thesis:
      'Mono / caps eyebrow treats project like a release — "ION · SHIPPED · YC W24" — before the editorial body resumes; two registers kept under one card.',
    featuredShell: 'FH-A',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'centered',
  },
  {
    id: 't5-s8',
    tier: 't5',
    slot: 's8',
    label: 'T5-S8',
    workingName: 'Caption-Register Card',
    thesis:
      'All typography compressed to caption scale except the title — exhibit-caption register, almost entirely 11px, title the only break in scale.',
    featuredShell: 'FH-A',
    defaultCta: 'quiet',
    defaultMedia: 'real-asset',
    svbAlternate: 'clean',
    nativeMargin: 'centered',
  },
  // T6 · Case Brief / Release Register (4)
  // Directly responding to supplied reference frames (Image 4 + Image 5) —
  // a denser, pressure-ceiling-adjacent register that still respects
  // locked card-system legality (FH-A, ≤3 tags, dual-CTA only where earned).
  {
    id: 't6-s1',
    tier: 't6',
    slot: 's1',
    label: 'T6-S1',
    workingName: 'Case Brief Horizontal',
    thesis:
      'Ion Design "case brief" register horizontal — layered-stack media + accent eyebrow + display title + body paragraph + 3 chip tags + rule + twin proof stats + dual CTA. Stays FH-A-legal (≤3 tags, live-URL earns secondary).',
    featuredShell: 'FH-A',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'centered',
  },
  {
    id: 't6-s2',
    tier: 't6',
    slot: 's2',
    label: 'T6-S2',
    workingName: 'Case Brief Compact',
    thesis:
      'Same case-brief register as T6-S1, condensed to a tighter 52/48 split — tests whether the layered-stack + dual-CTA reads at reduced footprint or breaks.',
    featuredShell: 'FH-A',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'clean',
    nativeMargin: 'centered',
  },
  {
    id: 't6-s3',
    tier: 't6',
    slot: 's3',
    label: 'T6-S3',
    workingName: 'Version Filmstrip',
    thesis:
      'Release-note register — versioned screenshot filmstrip (v1.1 / v1.2 / v1.3) + terminal eyebrow + title + "Prototyping Lead" subtitle + right-aligned tags + stats + body. Kept at reference fidelity (flat letterbox aspect).',
    featuredShell: 'FH-A',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'centered',
  },
  {
    id: 't6-s4',
    tier: 't6',
    slot: 's4',
    label: 'T6-S4',
    workingName: 'Release with Authored Aspect',
    thesis:
      'Same release-register as T6-S3, but versioned media stack respects each frame\u2019s authored aspect instead of collapsing to letterbox — tests whether the register survives without the forced flat strip.',
    featuredShell: 'FH-A',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'centered',
  },
  {
    id: 't6-s5',
    tier: 't6',
    slot: 's5',
    label: 'T6-S5',
    workingName: 'Case Brief Unbounded',
    thesis:
      'Ion case-brief register lifted out of the card frame — no border, no raised fill; media reads as a tiled artifact and the copy column hangs in raw flow. Tests whether the case-brief can earn its weight through hierarchy alone.',
    featuredShell: 'FH-A',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'centered',
  },
  // T7 · Abstract / Experimental Card Register (4)
  // Deliberately pushed registers — still respect card-system atoms and
  // media-present rule, but break the default type-scale / arrangement grammar
  // to probe the outer bound of "card" before it stops reading as a card.
  {
    id: 't7-s1',
    tier: 't7',
    slot: 's1',
    label: 'T7-S1',
    workingName: 'Swiss Modular',
    thesis:
      'M\u00fcller-Brockmann register — strict 12-col module grid inside the card; title, media, meta occupy specific non-adjacent module blocks; white counterforms carry rhythm.',
    featuredShell: 'FH-B',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'clean',
    nativeMargin: 'centered',
  },
  {
    id: 't7-s2',
    tier: 't7',
    slot: 's2',
    label: 'T7-S2',
    workingName: 'Brutalist Type-Only',
    thesis:
      'Title at 96px Clash Display dominates the card; media present per system rule but relegated to a small framed block at the base — type is the object, media is the annotation.',
    featuredShell: 'FH-A',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'm6',
  },
  {
    id: 't7-s3',
    tier: 't7',
    slot: 's3',
    label: 'T7-S3',
    workingName: 'Concrete-Poetry Card',
    thesis:
      'Title typography arranged spatially — words broken across lines at authored positions so the form carries meaning; other atoms held in locked positions so only the title does the work.',
    featuredShell: 'FH-A',
    defaultCta: 'quiet',
    defaultMedia: 'real-asset',
    svbAlternate: 'conditional',
    nativeMargin: 'm7',
  },
  {
    id: 't7-s4',
    tier: 't7',
    slot: 's4',
    label: 'T7-S4',
    workingName: 'Changelog Release',
    thesis:
      'Linear / Vercel changelog register — version tag + date + terse title + bulleted change list + media; every project becomes an "entry" in a log, not a showcase.',
    featuredShell: 'FH-A',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'clean',
    nativeMargin: 'centered',
  },
  // T8 · Unbounded / Label-Below Register (4)
  // Direct match to rachelchen.tech / emmiwu.com / billguo.me references — no
  // card frame, no border, no raised fill. Media is the object; typography
  // sits below in raw flow. Featured stays side-by-side media+text where the
  // system demands a Featured weight, but the container chrome is gone.
  {
    id: 't8-s1',
    tier: 't8',
    slot: 's1',
    label: 'T8-S1',
    workingName: 'Plain Tile',
    thesis:
      'rachelchen.tech register — full-bleed media on page ground, label stack (project / title / year) outside the frame. No border, no bg, no padding container; typography and alignment do all the grouping.',
    featuredShell: 'FH-A',
    defaultCta: 'quiet',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'm6',
  },
  {
    id: 't8-s2',
    tier: 't8',
    slot: 's2',
    label: 'T8-S2',
    workingName: 'Caption Tile',
    thesis:
      'emmiwu.com register — unbounded media + minimal caption register (1–2 lines, mono caps meta + ISe title). Sparser than T8-S1; each object holds space through rhythm alone.',
    featuredShell: 'FH-A',
    defaultCta: 'none',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'm6',
  },
  {
    id: 't8-s3',
    tier: 't8',
    slot: 's3',
    label: 'T8-S3',
    workingName: 'Aspect-Variant Unbounded',
    thesis:
      'billguo.me-adjacent register — each unbounded tile holds a different authored aspect (4:3 / 1:1 / 3:4 / 16:9); rhythm comes from aspect variance within the gapped grid, no framing chrome.',
    featuredShell: 'FH-A',
    defaultCta: 'quiet',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'm6',
  },
  {
    id: 't8-s4',
    tier: 't8',
    slot: 's4',
    label: 'T8-S4',
    workingName: 'Proof-Forward Unbounded',
    thesis:
      'Improves on rachel/emmi/bill references — unbounded tiles but each carries a single compact proof atom (28px numeral + label) inline with the metadata line. Earns hiring-legibility the reference register does not.',
    featuredShell: 'FH-A',
    defaultCta: 'visible',
    defaultMedia: 'real-asset',
    svbAlternate: 'none',
    nativeMargin: 'm6',
  },
];

export const surfaceById = Object.fromEntries(
  surfaceCandidates.map((c) => [c.id, c]),
);

export function findSurfaceCandidate(
  tier: string,
  slot: string,
): SurfaceCandidate | undefined {
  return surfaceById[`${tier}-${slot}`];
}

export type StandardShell = 'sv-a' | 'sv-b';
