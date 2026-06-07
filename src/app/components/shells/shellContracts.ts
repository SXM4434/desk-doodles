// Shell composition contracts — single source of truth for every Project Card
// shell's authored baseline AND the complete inventory of every toggle the
// lab exposes (identity / pair-native / structural). When a new shell, axis,
// or axis value is added, update this registry first; the validator script +
// any registry-consuming tooling reads from here.
//
// See `docs/labs/applied-surfaces-v2/homepage/homepage-shell-composition-system.md`
// for the full architecture + extension process.

// --- Shell identity ---------------------------------------------------------

export type ShellId =
  | 'fh-b'
  | 'fh-a'
  | 'fv-a'
  | 'sv-a'
  | 'sv-b'
  | 'sh-a-row'
  | 'ion-fmid-1cta'
  | 'ion-f2';

export type ShellRegister = 'featured' | 'standard';
export type ShellOrientation = 'horizontal' | 'vertical';
export type MediaEdge = 'left' | 'top' | 'right' | 'bottom';

// What atom carries the shell's scan-anchor register. If pair-native toggles
// suppress this atom (e.g. tags='hidden' on a tag-led shell, CTA='hidden' on
// every shell's foot), the validator flags the combo as register collapse.
export type ScanAnchor =
  | 'tag-led'        // TagList is the primary anchor (FH-A, FV-A)
  | 'proof-led'      // Proof row/inline is the primary anchor (FH-B, SV-B)
  | 'typetag-led'    // TypeTag atom renders at top (SV-A, SH-A-Row)
  | 'label-led';     // ProjectLabel dominates (IonFMid-1CTA, IonF2)

// --- Identity axes (9) -----------------------------------------------------
// Every identity axis resolves 'native' to the shell's authored baseline in
// the `nativeAxes` field of its contract. Axes modify the shell's internal
// composition: padding, rhythm, register shape, proof placement, aspect.

export type NativeAxes = {
  cardFrame: 'on' | 'off';
  divider: 'none' | 'section' | 'inline';
  titleRegister: 'default' | 'ise-italic' | 'small-caps';
  captionRegister: 'default' | 'small-caps';
  imageTreatment: 'plain' | 'framed' | 'double-frame' | 'mat';
  shippedProof: 'on' | 'off';
  proofPlacement: 'stack-grid' | 'inline' | 'bottom-strip';
  aspectVariance: 'uniform' | 'authored';
  density: 'default' | 'compact' | 'content-forward';
};

export const IDENTITY_AXIS_VALUES = {
  cardFrame: ['native', 'on', 'off'] as const,
  divider: ['native', 'none', 'section', 'inline'] as const,
  titleRegister: ['native', 'default', 'ise-italic', 'small-caps'] as const,
  captionRegister: ['native', 'default', 'small-caps'] as const,
  imageTreatment: ['native', 'plain', 'framed', 'double-frame', 'mat'] as const,
  shippedProof: ['native', 'on', 'off'] as const,
  proofPlacement: ['native', 'stack-grid', 'inline', 'bottom-strip'] as const,
  aspectVariance: ['native', 'uniform', 'authored'] as const,
  density: ['native', 'default', 'compact', 'content-forward'] as const,
} as const;

// --- Pair-native axes (4) --------------------------------------------------
// Page-geometry + atom-gating axes. Shells consume these via atom-level hooks
// (PillCTA → useCta, TagList → useTagStyle, Media → useMediaTruth) or via the
// page-level Margin context. 'auto' / 'native' = per-surface default.
//
// Pair-native matters to shell composition because:
//   • CTA='hidden' removes the foot-of-card anchor from EVERY shell. Proof
//     placement and marginTop:auto behave differently without a CTA.
//   • Tags='hidden' collapses a tag-led shell's scan-anchor register.
//   • Tags='pill-outline' (etc.) forced onto tags='hidden' natives (FH-B,
//     SV-B) injects atoms those shells weren't designed to accommodate.
//   • Margin extremes (m1=16px or m15=640px) starve layout width; shell
//     rhythm stays constant but flexing width changes what's legible.
//   • Media='structural-placeholder' doesn't affect composition (Media atom
//     owns that decision) but is an explicit axis the validator tracks.

export const PAIR_NATIVE_AXIS_VALUES = {
  margin: [
    'native', 'centered',
    'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8',
    'm9', 'm10', 'm11', 'm12', 'm13', 'm14', 'm15',
  ] as const,
  cta: [
    'auto',
    'pill-filled', 'pill-outline', 'text', 'underline', 'rect', 'caps',
    'hidden',
  ] as const,
  tags: [
    'auto',
    'pill-outline', 'pill-filled', 'slash', 'dot', 'bracket', 'underline', 'typeTag',
    'hidden',
  ] as const,
  media: ['real-asset', 'structural-placeholder'] as const,
} as const;

// --- Structural axes (3) ---------------------------------------------------
// Higher-level controls that select WHICH shell renders, WHICH preset cascade
// is active, and WHICH tier of layouts is filtered. These don't modify shell
// internals, but they determine which shell-contract the page consumes.

export const STRUCTURAL_AXIS_VALUES = {
  shellPicker: ['baseline', 'native', 'manual'] as const,
  preset: ['custom'] as const, // dynamic per family — actual preset ids live in SURFACE_ATTRS
  lane: ['all', 't1', 't2', 't3', 't4', 't5a', 't5b', 't5c'] as const,
} as const;

// --- Layout axis (37) ------------------------------------------------------
// Layouts ARE a toggle for the cards: each layout determines which shells get
// rendered, in which slots, at what widths, under what placement constraints.
// The combinatorial space is (37 layouts × 37 surfaces × identity × pair-native)
// and every shell × layout combination has to honor the shell's placement rules.
//
// Authoritative shell-for-slot mapping lives at `family/nativeShellForLayout.ts`
// as `NATIVE_SHELL_FOR_LAYOUT`. This registry declares the LAYOUT IDS so the
// validator can enumerate the layout axis; it does NOT duplicate the shell
// mapping (that's owned by nativeShellForLayout.ts).

export const LAYOUT_IDS = [
  't1-l1', 't1-l2', 't1-l3', 't1-l4',
  't2-l1', 't2-l2', 't2-l3', 't2-l4',
  't3-l1', 't3-l2', 't3-l3', 't3-l4',
  't4-l1', 't4-l2', 't4-l3', 't4-l4',
  't5a-l1', 't5a-l2', 't5a-l3', 't5a-l4', 't5a-l5', 't5a-l6', 't5a-l7', 't5a-l8', 't5a-l9',
  't5b-l1', 't5b-l2', 't5b-l3', 't5b-l4', 't5b-l5', 't5b-l6',
  't5c-l1', 't5c-l2', 't5c-l3', 't5c-l4', 't5c-l5', 't5c-l6',
] as const;

export type LayoutId = typeof LAYOUT_IDS[number];

// --- Shell placement constraints -------------------------------------------
// Rules from `docs/locked/project-card-system.md` honored by every layout.
// A shell declares its placement constraint; layouts honor it by only
// placing the shell in slots that satisfy the constraint. The validator
// walks NATIVE_SHELL_FOR_LAYOUT to confirm no layout violates a shell's
// declared placement.

export type ShellPlacement =
  | { kind: 'unrestricted' }
  | { kind: 'min-container-width'; minFraction: number; notLegalIn: string }
  | { kind: 'whole-grid-only'; notLegalIn: string }
  | { kind: 'list-only'; notLegalIn: string };

// --- Exceptions -------------------------------------------------------------

export type ShellExceptions = {
  // SH-A-Row physically cannot fit proof in its 280px min-height. Proof is
  // permanently suppressed regardless of shippedProof / proofPlacement state.
  suppressProofAlways?: boolean;
};

// --- Authoring extensions --------------------------------------------------
// Per-shell caller props that extend the native render without participating
// in the axis system. These are NOT toggles — they're render-site overrides
// used by dedicated authoring passes (e.g. Narrow Pass 4 passes its own
// eyebrow ReactNode + proof flags). Listed here so the contract advertises
// the shell's extension surface; the validator doesn't enforce them.

export type FootVariant = 'single' | '2-col';

export type AuthoringExtension =
  | 'foot'           // FV-A: foot='single' | '2-col' — 2-col swaps to unframed
                     //       media-banner + asymmetric 2/3+1/3 foot (used by
                     //       Narrow Pass 4 featured slots).
  | 'eyebrow'        // ReactNode override for the top-of-content eyebrow
                     //       slot. Replaces the shell's native ProjectLabel /
                     //       TypeTag atom when provided.
  | 'proofOptIn'     // Flip a tag-led shell's native shippedProof from 'off'
                     //       to 'on' without touching the global context.
                     //       Complements the shippedProof axis at the call
                     //       site (narrow-4 uses this on SV-A).
  | 'proofSuppressed' // Force-hide the proof block regardless of context /
                     //       opt-in state (used when data is placeholder).
  | 'ctaHidden'      // Suppress the foot CTA at the call site without
                     //       touching the CTA context (narrow-4 drops the CTA
                     //       from SV-A).
  | 'tagStyle'       // SV-A: caller-owned TagStyleMode. Forwards to TagList's
                     //       nativeMode so narrow-4's standard-card tag-style
                     //       toggle can override the authored 'pill-outline'
                     //       without touching the global tagStyle context.
  | 'tagPlacement';  // SV-A: 'stack' (native) | 'foot-right' | 'foot-left'.
                     //       foot-right = title + caption LEFT, tags column RIGHT
                     //       (rachelchen.tech / billguo.me register).
                     //       foot-left = mirror — tags column LEFT, title +
                     //       caption RIGHT.

// --- Contract --------------------------------------------------------------

export type ShellContract = {
  id: ShellId;
  register: ShellRegister;
  orientation: ShellOrientation;
  // The edge of the content column adjacent to media. Its padding is internal
  // and never bleeds under cardFrame='off'. ContentColumn uses this to
  // preserve the internal media→content gap regardless of divider state.
  mediaEdge: MediaEdge;
  // What atom carries the shell's scan-anchor register. Used by the validator
  // to detect register-collapse combos (e.g. tag-led × tags='hidden').
  scanAnchor: ScanAnchor;
  // Layout placement constraint. Layouts that violate this fail validation.
  placement: ShellPlacement;
  nativeAxes: NativeAxes;
  nativeAspect: string;
  // Horizontal shells pin their height; verticals flow naturally.
  minHeight: { full: number; reduced: number } | null;
  exceptions: ShellExceptions;
  // Caller-prop extensions the shell accepts beyond its axis state. See
  // AuthoringExtension comments for semantics. Empty array = no extensions.
  authoringExtensions: readonly AuthoringExtension[];
  // For shells that expose a foot variant, the available variant keys.
  // Undefined = no foot-variant axis (the shell has a single native foot).
  footVariants?: readonly FootVariant[];
};

const DEFAULT_AXES: NativeAxes = {
  cardFrame: 'on',
  divider: 'section',
  titleRegister: 'default',
  captionRegister: 'default',
  imageTreatment: 'plain',
  shippedProof: 'off',
  proofPlacement: 'stack-grid',
  aspectVariance: 'uniform',
  density: 'default',
};

export const SHELL_CONTRACTS: Record<ShellId, ShellContract> = {
  'fh-b': {
    id: 'fh-b',
    register: 'featured',
    orientation: 'horizontal',
    mediaEdge: 'left',
    scanAnchor: 'proof-led',
    placement: { kind: 'unrestricted' },
    nativeAxes: { ...DEFAULT_AXES, shippedProof: 'on', proofPlacement: 'stack-grid' },
    nativeAspect: '16/9',
    minHeight: { full: 420, reduced: 320 },
    exceptions: {},
    authoringExtensions: ['eyebrow', 'proofSuppressed', 'ctaHidden'],
  },
  'fh-a': {
    id: 'fh-a',
    register: 'featured',
    orientation: 'horizontal',
    mediaEdge: 'left',
    scanAnchor: 'tag-led',
    placement: { kind: 'unrestricted' },
    nativeAxes: { ...DEFAULT_AXES, shippedProof: 'off', proofPlacement: 'stack-grid' },
    nativeAspect: '4/3',
    minHeight: { full: 420, reduced: 320 },
    exceptions: {},
    authoringExtensions: ['eyebrow', 'proofSuppressed', 'ctaHidden'],
  },
  'fv-a': {
    id: 'fv-a',
    register: 'featured',
    orientation: 'vertical',
    mediaEdge: 'top',
    scanAnchor: 'tag-led',
    placement: {
      kind: 'min-container-width',
      minFraction: 2 / 3,
      notLegalIn: '50/50 paired, grid, or list placements',
    },
    nativeAxes: { ...DEFAULT_AXES, shippedProof: 'off', proofPlacement: 'stack-grid' },
    nativeAspect: '3/4',
    minHeight: null,
    exceptions: {},
    authoringExtensions: ['foot', 'eyebrow', 'proofSuppressed'],
    footVariants: ['single', '2-col'],
  },
  'sv-a': {
    id: 'sv-a',
    register: 'standard',
    orientation: 'vertical',
    mediaEdge: 'top',
    scanAnchor: 'typetag-led',
    placement: { kind: 'unrestricted' },
    nativeAxes: { ...DEFAULT_AXES, shippedProof: 'off', proofPlacement: 'inline' },
    nativeAspect: '4/3',
    minHeight: null,
    exceptions: {},
    authoringExtensions: ['eyebrow', 'proofOptIn', 'proofSuppressed', 'ctaHidden', 'tagStyle', 'tagPlacement'],
  },
  'sv-b': {
    id: 'sv-b',
    register: 'standard',
    orientation: 'vertical',
    mediaEdge: 'top',
    scanAnchor: 'proof-led',
    placement: {
      kind: 'whole-grid-only',
      notLegalIn: 'grids mixed with SV-A',
    },
    nativeAxes: { ...DEFAULT_AXES, shippedProof: 'on', proofPlacement: 'inline' },
    nativeAspect: '3/4',
    minHeight: null,
    exceptions: {},
    authoringExtensions: ['eyebrow', 'proofSuppressed', 'ctaHidden'],
  },
  'sh-a-row': {
    id: 'sh-a-row',
    register: 'standard',
    orientation: 'horizontal',
    mediaEdge: 'left',
    scanAnchor: 'typetag-led',
    placement: {
      kind: 'list-only',
      notLegalIn: 'grid or card-face placements',
    },
    nativeAxes: { ...DEFAULT_AXES, shippedProof: 'off' },
    nativeAspect: 'auto',
    minHeight: { full: 280, reduced: 240 },
    exceptions: { suppressProofAlways: true },
    authoringExtensions: ['eyebrow', 'ctaHidden'],
  },
  'ion-fmid-1cta': {
    id: 'ion-fmid-1cta',
    register: 'featured',
    orientation: 'horizontal',
    mediaEdge: 'left',
    scanAnchor: 'label-led',
    placement: { kind: 'unrestricted' },
    nativeAxes: { ...DEFAULT_AXES, shippedProof: 'on', proofPlacement: 'stack-grid' },
    nativeAspect: '16/9',
    minHeight: { full: 420, reduced: 320 },
    exceptions: {},
    authoringExtensions: ['eyebrow', 'proofSuppressed', 'ctaHidden'],
  },
  'ion-f2': {
    id: 'ion-f2',
    register: 'featured',
    orientation: 'horizontal',
    mediaEdge: 'left',
    scanAnchor: 'label-led',
    placement: { kind: 'unrestricted' },
    nativeAxes: { ...DEFAULT_AXES, shippedProof: 'on', proofPlacement: 'stack-grid' },
    nativeAspect: '4/3',
    minHeight: { full: 420, reduced: 320 },
    exceptions: {},
    authoringExtensions: ['eyebrow', 'proofSuppressed', 'ctaHidden'],
  },
};

// --- Cardinality helpers ----------------------------------------------------

export type IdentityAxisKey = keyof typeof IDENTITY_AXIS_VALUES;
export type PairNativeAxisKey = keyof typeof PAIR_NATIVE_AXIS_VALUES;
export type StructuralAxisKey = keyof typeof STRUCTURAL_AXIS_VALUES;

export function identityComboCount(): number {
  return (Object.values(IDENTITY_AXIS_VALUES) as unknown as readonly string[][])
    .reduce((acc, vals) => acc * vals.length, 1);
}

export function pairNativeComboCount(): number {
  return (Object.values(PAIR_NATIVE_AXIS_VALUES) as unknown as readonly string[][])
    .reduce((acc, vals) => acc * vals.length, 1);
}

export function structuralComboCount(): number {
  return (Object.values(STRUCTURAL_AXIS_VALUES) as unknown as readonly string[][])
    .reduce((acc, vals) => acc * vals.length, 1);
}

export function totalAxisSpacePerShell(): number {
  return identityComboCount() * pairNativeComboCount();
}

export function layoutComboCount(): number {
  return LAYOUT_IDS.length;
}

// Total combo space across the lab: layouts × identity × pair-native × shells.
// Structural axes (lane / preset / shellPicker) are display filters rather than
// independent multipliers, so they aren't folded in here.
export function totalLabComboCount(): number {
  const shellCount = Object.keys(SHELL_CONTRACTS).length;
  return layoutComboCount() * identityComboCount() * pairNativeComboCount() * shellCount;
}
