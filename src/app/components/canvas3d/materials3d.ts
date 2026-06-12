// ─── materials3d — Native style's material presets (FS port, plain data) ────
// Implements docs/design/3d-mode-controls-spec.md §3 "Native's Material
// sub-dropdown": the SIX real Free Stroke presets (every one `implemented:
// true` in FS's own registry — the dither/ASCII/texture families are labeled
// shells even at the source and are NOT ported, per the no-stub rule).
//
// PROVENANCE: free-stroke origin/main lib/style-system.ts MATERIAL_PARAMS
// (L339-460) + MODE_MATERIAL_DEFAULTS (L460-466), read via `git show
// origin/main:lib/style-system.ts` 2026-06-12. SURFACE params verbatim per
// D-C; COLORS follow the RATIFIED COLOR POLICY (spec footer, Sebs 2026-06-12,
// supersedes FS preset colors): ink-black across everything — every preset
// renders in the SINGLE warm-graphite ink (INK_3D_DEFAULT); presets differ
// ONLY in surface qualities (roughness/metalness/sheen/clearcoat), never in
// hue or value. Hue-carrying FS channels are re-registered: sheenColor → the
// warm-graphite sheen register (SHEEN_GRAPHITE below — see its comment for
// why D2-E's paper sheen floods at sheen 1.0); Signal's emissive → the ink
// range's light end #383632 (the glow survives as a value whisper, the teal
// does not). Original FS hex kept in comments for the provenance trail.
//
// PURITY: no three import — this file feeds both the chrome dropdown (main
// chunk) and the lazy scene. The scene turns these plain numbers into
// MeshPhysicalMaterial instances.

// ─── Ink register (conversion-semantics-spec §7 / amendment D2-E) ───────────
// Monochrome warm-graphite ink. Locked range #121110 (primary, L*≈7) →
// #383632 (body, L*≈23) on the warm axis; default ≈ #2A2622 — the warm-axis
// sibling of FS's proven charcoal #26262b. This REPLACES the out-of-register
// #5A5043 (caption-ink tier — the "bronze/clay tan" read Sebs flagged).
// Exact hex = 06-16 identity-pass call; the range locks now.

export const INK_3D_DEFAULT = '#2A2622';
export const INK_3D_RANGE = { darkest: '#121110', lightest: '#383632' } as const;

/** Short alias for the preset table below (ratified single ink). */
const INK = INK_3D_DEFAULT;
/** Sheen register for the FULL-sheen presets (softGel/rubber, sheen 1.0).
 *  D2-E's paper-tinted #d8c9ae was calibrated for the old single material at
 *  sheen 0.35 — at sheen 1.0 it FLOODS the ink to beige (caught on the
 *  2026-06-12 material sweep screenshots: softGel/rubber read tan, breaking
 *  the ratified everything-black policy). A warm-graphite sheen keeps the
 *  satin/balloon surface identity while the object stays read-as-black. */
const SHEEN_GRAPHITE = '#6b6258';

export type MaterialPresetId =
  | 'ink'
  | 'softGel'
  | 'matteClay'
  | 'glossyPlastic'
  | 'rubber'
  | 'signal';

export type MaterialParams3D = {
  color: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  reflectivity: number;
  sheen: number;
  sheenRoughness: number;
  sheenColor: string;
  emissive: string;
  emissiveIntensity: number;
  envMapIntensity: number;
};

/** FS MATERIAL_PARAMS — surface params verbatim, colors re-registered to the
 *  single ink (six real presets; 'custom' deliberately not ported — its
 *  slider panel is the spec's "only if free" stretch). */
export const MATERIAL_PARAMS_3D: Record<MaterialPresetId, MaterialParams3D> = {
  // Dark glossy gel-ink: the brand default.
  ink: {
    color: INK, // FS ink #26262b → ratified single ink
    roughness: 0.3,
    metalness: 0.0,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
    reflectivity: 0.6,
    sheen: 0.0,
    sheenRoughness: 0.5,
    sheenColor: '#000000',
    emissive: '#000000',
    emissiveIntensity: 0,
    envMapIntensity: 1.1,
  },
  // Softer, fuller balloon/gel feel — best for Inflate / Solid.
  softGel: {
    color: INK, // FS softGel #454b57 → ratified single ink
    roughness: 0.5,
    metalness: 0.0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.5,
    reflectivity: 0.4,
    sheen: 1.0,
    sheenRoughness: 0.65,
    sheenColor: SHEEN_GRAPHITE, // FS #8fa6bd (blue) → warm-graphite sheen register
    emissive: '#000000',
    emissiveIntensity: 0,
    envMapIntensity: 0.8,
  },
  // Matte dry clay: the clear "no highlight" opposite of glossy.
  matteClay: {
    color: INK, // FS matteClay #6f6457 → ratified single ink
    roughness: 1.0,
    metalness: 0.0,
    clearcoat: 0.0,
    clearcoatRoughness: 1.0,
    reflectivity: 0.08,
    sheen: 0.0,
    sheenRoughness: 0.5,
    sheenColor: '#000000',
    emissive: '#000000',
    emissiveIntensity: 0,
    envMapIntensity: 0.12,
  },
  // Smooth shiny plastic — the "wet/glossy" end.
  glossyPlastic: {
    color: INK, // FS glossyPlastic #1b1d24 → ratified single ink
    roughness: 0.06,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    reflectivity: 0.9,
    sheen: 0.0,
    sheenRoughness: 0.5,
    sheenColor: '#000000',
    emissive: '#000000',
    emissiveIntensity: 0,
    envMapIntensity: 1.8,
  },
  // Soft rubber: satin, no hard highlight — warmer sibling of matteClay.
  rubber: {
    color: INK, // FS rubber #33312f → ratified single ink
    roughness: 0.92,
    metalness: 0.0,
    clearcoat: 0.04,
    clearcoatRoughness: 0.95,
    reflectivity: 0.15,
    sheen: 1.0,
    sheenRoughness: 0.8,
    sheenColor: SHEEN_GRAPHITE, // FS #9a8a78 → warm-graphite sheen register
    emissive: '#000000',
    emissiveIntensity: 0,
    envMapIntensity: 0.3,
  },
  // Digital "signal": metallic teal with a cool emissive — screen-lit read.
  signal: {
    color: INK, // FS signal #16242c → ratified single ink
    roughness: 0.2,
    metalness: 0.6,
    clearcoat: 0.6,
    clearcoatRoughness: 0.16,
    reflectivity: 0.8,
    sheen: 0.0,
    sheenRoughness: 0.5,
    sheenColor: '#000000',
    emissive: '#383632', // FS teal #1f6e8c → ink-range light end (value whisper, no hue)
    emissiveIntensity: 0.7,
    envMapIntensity: 1.4,
  },
};

/** FS MODE_MATERIAL_DEFAULTS verbatim — applied only while the user has NOT
 *  explicitly picked a material (materialUserOverride false). A user pick
 *  always wins; geometry is never touched by this map (I-1 spirit in FS's own
 *  code, spec §3). 'auto' takes rod's default (ink) — auto's per-stroke
 *  resolution is geometry-level; the live material is one pick. */
export const MODE_MATERIAL_DEFAULTS_3D: Record<
  'auto' | 'rod' | 'extrude' | 'inflate' | 'solid',
  MaterialPresetId
> = {
  auto: 'ink',
  rod: 'ink',
  extrude: 'glossyPlastic',
  solid: 'matteClay',
  inflate: 'softGel',
};

/** Chrome dropdown inventory — the full real set, locked order (spec §3). */
export const MATERIAL_PRESET_OPTIONS: Array<{
  id: MaterialPresetId;
  label: string;
  detail: string;
}> = [
  // Detail copy describes SURFACE QUALITY only — every preset is the same
  // ink-black (ratified policy); what changes is how the light sits on it.
  { id: 'ink', label: 'Ink', detail: 'Glossy gel-ink — hard tight clearcoat highlight.' },
  { id: 'softGel', label: 'Soft Gel', detail: 'Full balloon feel — broad soft sheen, gentle highlight.' },
  { id: 'matteClay', label: 'Matte Clay', detail: 'Chalky dry clay — fully rough, zero highlight.' },
  { id: 'glossyPlastic', label: 'Glossy Plastic', detail: 'Mirror-sharp clearcoat + strong reflections — the wet end.' },
  { id: 'rubber', label: 'Rubber', detail: 'Satin rubber — soft broad sheen, no hard highlight.' },
  { id: 'signal', label: 'Signal', detail: 'Metallic, faint inner glow — the screen-lit read, hue-free.' },
];
