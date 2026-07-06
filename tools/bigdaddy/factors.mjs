// factors.mjs — the BIG-DADDY OFAT factor matrix.
//
// Every toggle in the live /canvas chrome, mapped to LOW / MID / HIGH values,
// held against the Clean baseline (Clean SVG style + chrome defaults). Probed
// live from the running app on 2026-06-14 (see tools/bigdaddy/README notes).
//
// kind: 'dropdown' → set via the listbox by its label; values are option labels.
//       'slider'   → set the <input type=range> by its own label span; values are numbers.
//       'mode3d'   → Geometry mode (driven via __ddSet.setGeometryMode for reliability).
//       'style3d'  → 3D style dropdown (Native/Hatch/SVG-port).
// Each factor lists exactly three { level, value } so every factor = 3 panels (L/M/H).

// ── 2D PEN / STYLE / SHADING / COLOR toggles ─────────────────────────────────
// `section` = the collapsible cluster that must be expanded for the control to mount.
// `baseStyle` = the SVG-style preset the control LIVES under, set as the held OFAT
//   baseline before flipping this one factor:
//     'Clean'            — style/palette/texture controls exist under Clean.
//     'Rough hand-drawn' — pen/multi-stroke/shading controls only mount under a
//                          rough-family style (probed live: Clean has just 4 ctrls).
//   The Clean SCREENSHOT is always also captured as the per-source comparison
//   reference, so the vision pass still diffs every panel against Clean.
export const FACTORS_2D = [
  // SVG style itself is a factor (sweeps the named presets low→high "treatment").
  { id: 'svgStyle', label: 'SVG style', kind: 'dropdown', section: null, baseStyle: 'Clean',
    levels: [['L', 'Outline only'], ['M', 'Sketchy'], ['H', 'Bold ink']] },
  // Multi-stroke density: single → triple → heavy.
  { id: 'multiStroke', label: 'Multi-stroke', kind: 'dropdown', section: 'MULTI-STROKE', baseStyle: 'Rough hand-drawn',
    levels: [['L', 'single'], ['M', 'triple'], ['H', 'heavy']] },
  { id: 'endpoint', label: 'Endpoint', kind: 'dropdown', section: 'MULTI-STROKE', baseStyle: 'Rough hand-drawn',
    levels: [['L', 'protrude'], ['M', 'long-overshoot'], ['H', 'kink']] },
  { id: 'sketching', label: 'Sketching style', kind: 'dropdown', section: 'MULTI-STROKE', baseStyle: 'Rough hand-drawn',
    levels: [['L', 'loose-overlap'], ['M', 'parallel-pass'], ['H', 'cross-rotate']] },
  { id: 'penTip', label: 'Pen tip', kind: 'dropdown', section: 'MULTI-STROKE', baseStyle: 'Rough hand-drawn',
    levels: [['L', 'fineliner'], ['M', 'pencil-2b'], ['H', 'charcoal']] },
  // sliders (min / mid / max)
  { id: 'wobble', label: 'Wobble', kind: 'slider', section: 'MULTI-STROKE', baseStyle: 'Rough hand-drawn',
    levels: [['L', 0], ['M', 1.0], ['H', 2.0]] },
  { id: 'jaggedness', label: 'Jaggedness', kind: 'slider', section: 'MULTI-STROKE', baseStyle: 'Rough hand-drawn',
    levels: [['L', 0], ['M', 1.0], ['H', 2.0]] },
  { id: 'simplify', label: 'Simplify', kind: 'slider', section: 'MULTI-STROKE', baseStyle: 'Rough hand-drawn',
    levels: [['L', 0], ['M', 1.0], ['H', 2.0]] },
  { id: 'bowing', label: 'Bowing', kind: 'slider', section: 'MULTI-STROKE', baseStyle: 'Rough hand-drawn',
    levels: [['L', 0], ['M', 1.25], ['H', 2.5]] },
  { id: 'strokeWidth', label: 'Stroke width', kind: 'slider', section: 'MULTI-STROKE', baseStyle: 'Rough hand-drawn',
    levels: [['L', 0.5], ['M', 1.75], ['H', 3.0]] },
  { id: 'curve', label: 'Curve', kind: 'slider', section: 'MULTI-STROKE', baseStyle: 'Rough hand-drawn',
    levels: [['L', 0], ['M', 0.75], ['H', 1.5]] },
  // ── SHADING ──
  { id: 'fillStyle', label: 'Fill style', kind: 'dropdown', section: 'SHADING', baseStyle: 'Rough hand-drawn',
    levels: [['L', 'solid'], ['M', 'cross-hatch'], ['H', 'dots']] },
  { id: 'hachureGap', label: 'Hachure gap', kind: 'slider', section: 'SHADING', baseStyle: 'Rough hand-drawn',
    levels: [['L', 1], ['M', 6], ['H', 12]] },
  { id: 'hachureAngle', label: 'Hachure angle', kind: 'slider', section: 'SHADING', baseStyle: 'Rough hand-drawn',
    levels: [['L', -90], ['M', 0], ['H', 90]] },
  { id: 'fillDensity', label: 'Fill density', kind: 'slider', section: 'SHADING', baseStyle: 'Rough hand-drawn',
    levels: [['L', 0], ['M', 0.6], ['H', 1.2]] },
  { id: 'fillOpacity', label: 'Fill opacity', kind: 'slider', section: 'SHADING', baseStyle: 'Rough hand-drawn',
    levels: [['L', 0], ['M', 0.5], ['H', 1.0]] },
  { id: 'inkIntensity', label: 'Ink intensity', kind: 'slider', section: 'SHADING', baseStyle: 'Rough hand-drawn',
    levels: [['L', 0], ['M', 0.5], ['H', 1.0]] },
  // ── COLOR / PALETTE (exist under Clean) ──
  { id: 'strokePalette', label: 'Stroke palette', kind: 'dropdown', section: 'COLOR / PALETTE', baseStyle: 'Clean',
    levels: [['L', 'primary'], ['M', 'accent'], ['H', 'inverted']] },
  { id: 'fillPalette', label: 'Fill palette', kind: 'dropdown', section: 'COLOR / PALETTE', baseStyle: 'Clean',
    levels: [['L', 'primary'], ['M', 'accent'], ['H', 'inverted']] },
  { id: 'texture', label: 'Texture', kind: 'dropdown', section: 'COLOR / PALETTE', baseStyle: 'Clean',
    levels: [['L', 'light'], ['M', 'heavy'], ['H', 'canvas']] },
];

// ── 3D GEOMETRY / STYLE toggles (active only in 3D view after convert) ───────
export const FACTORS_3D = [
  // geometry mode: rod (L, thinnest) → extrude (M) → inflate (H, fullest volume)
  { id: 'geoMode', label: 'Geometry mode', kind: 'mode3d', section: null,
    levels: [['L', 'rod'], ['M', 'extrude'], ['H', 'inflate']] },
  { id: 'style3d', label: '3D style', kind: 'style3d', section: null,
    levels: [['L', 'Native'], ['M', 'Hatch'], ['H', 'SVG-port']] },
  { id: 'material', label: 'Material', kind: 'dropdown3d', section: null,
    levels: [['L', 'Matte Clay'], ['M', 'Glossy Plastic'], ['H', 'Signal']] },
  { id: 'polish', label: 'Polish', kind: 'slider', section: null,
    levels: [['L', 0], ['M', 0.5], ['H', 1.0]] },
  { id: 'reflection', label: 'Reflection', kind: 'slider', section: null,
    levels: [['L', 0], ['M', 0.5], ['H', 1.0]] },
  { id: 'sheen', label: 'Sheen', kind: 'slider', section: null,
    levels: [['L', 0], ['M', 0.5], ['H', 1.0]] },
  { id: 'outline3d', label: 'Outline', kind: 'slider', section: null,
    levels: [['L', 0], ['M', 0.5], ['H', 1.0]] },
];

// Quick stage tallies (for the harness report line).
export const TALLY = {
  factors2d: FACTORS_2D.length,
  factors3d: FACTORS_3D.length,
  panels2dPerSource: 1 /*clean*/ + FACTORS_2D.length * 3,
  panels3dPerSource: 1 /*clean*/ + FACTORS_3D.length * 3,
};
