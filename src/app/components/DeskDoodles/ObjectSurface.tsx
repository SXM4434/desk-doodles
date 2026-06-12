import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { IS } from '../../lib/typography';
import { PILL, CTA, SECTION_LABEL, RAISED_SHADOW } from '../../lib/chromeStyles';
import { ObjectCard } from './ObjectCard';
import { Slider } from '../chrome/Slider';
import { Dropdown } from '../chrome/Dropdown';
import {
  SLIDER_SPECS,
  MODIFIER_SETS_BY_STYLE,
  UNIVERSAL_MODIFIERS,
} from '../chrome/modifierSpecs';
import {
  F3SvgStyleProvider,
  useF3SvgStyle,
  F3_SVG_STYLES,
  type F3SvgStyle,
} from '../../state/F3SvgStyleContext';
import {
  F3RoughModifiersProvider,
  useF3RoughModifiers,
  type F3ModifiersState,
  MULTI_STROKE_STEPS, type MultiStrokeStep,
  FILL_STYLE_STEPS, type FillStyleStep,
  PALETTE_MODE_STEPS, type PaletteModeStep,
  TEXTURE_STEPS, type TextureStep,
  DOT_PATTERN_STEPS, type DotPatternStep,
  ENDPOINT_BEHAVIOR_STEPS, type EndpointBehaviorStep,
  SKETCHING_STYLE_STEPS, type SketchingStyleStep,
  PEN_TIP_STEPS, type PenTipStep,
  DEFAULT_MODIFIERS,
} from '../../state/F3RoughModifiersContext';
import { applyStylePreset } from '../canvas/SvgStyleTransform';
import { findDoodleBySvg, updateDoodleConfig, updateDoodleSvg } from '../../lib/publish';
import { DrawSurface, strokesToObjectMarkup, capStrokes, type Stroke, type StrokePoint } from './DrawSurface';
import { normalizeSvgSize } from '../../lib/normalizeInput';

// ─── ObjectSurface — the one morphing object panel (modes, never nested) ──────
// Per docs/design/object-model-and-desk-architecture.md §"The one object
// surface": ONE component, mode driven by context. Create lives in DrawPanel;
// this is the INSPECT side — click your own object → Edit; click someone
// else's → Sandbox. DeskPage holds a single activeSurface slot so this and
// DrawPanel can never both be open (nesting is structurally impossible).
//
// FULL CONTROL COLUMN (Sebs 2026-06-11, more-toggles-better): both modes show
// the per-style FULL control set — the same spec tables the desk chrome reads
// (MODIFIER_SETS_BY_STYLE + UNIVERSAL_MODIFIERS + SLIDER_SPECS), rendered
// generically like SmartHachureChrome but compact. SmartHachureChrome.tsx is
// the conditional-truth source — its has()/sub-conditional structure is
// mirrored 1:1 in SurfaceControls below; if the chrome gains/changes a row,
// mirror it there AND here.
//
// SCOPED LIVE RESTYLE (both modes): the embedded ObjectCard renders its art
// through SvgStyleTransform, which reads style + modifiers from context. We
// wrap JUST the card in fresh nested F3SvgStyleProvider/F3RoughModifiers-
// Provider instances — the nested providers shadow the app-root ones for the
// card subtree ONLY, so the card re-renders through the IDENTICAL desk render
// path with local values while the desk behind keeps reading the untouched
// global context (it cannot restyle).
//   · SANDBOX (someone else's): viewer config — play, nothing saves, close
//     discards. Local control state dies on unmount.
//   · EDIT (yours): initialized from the OBJECT's render_config (D-6 record;
//     pen fallback for legacy null-config rows); Done persists the edited
//     config onto the record via update_my_doodle_config (schema-v4).

export type ObjectSurfaceMode = 'edit' | 'sandbox';

/** The shape persisted in doodles.render_config (D-6) — mirrors DeskPage's
 *  ObjectRenderConfig (defined there; not imported to avoid a module cycle:
 *  DeskPage already imports ObjectSurface). */
export type SurfaceRenderConfig = {
  svgStyle: F3SvgStyle;
  modifiers: F3ModifiersState;
  /** Extras (e.g. `strokes` — the recorded gesture) pass through every hop
   *  UNTOUCHED (strokes-in-the-record contract): a config save that rebuilt
   *  only {svgStyle, modifiers} would silently destroy the source strokes. */
  [extra: string]: unknown;
};

export type ObjectSurfaceData = {
  svgMarkup: string;
  name?: string | null;
  why?: string | null;
  owner?: string | null;
  createdAt?: string | null;
  /** Supabase row id. Optional — when the caller doesn't pass it (DeskPage
   *  today), Edit resolves it itself via findDoodleBySvg (content-hash). */
  id?: string | null;
  /** The object's stored render_config (raw jsonb). Optional — same fallback:
   *  resolved from the row when absent. Parsed defensively either way. */
  renderConfig?: unknown;
};

// ─── render_config parsing (defensive — the column is anon-writable) ─────────
// Local mirror of DeskPage.parseRenderConfig (same key-by-key validation:
// style must be a real F3SvgStyle; numbers must be finite; enum strings are
// checked against their step lists; unknown keys fall back to defaults).

const MODIFIER_ENUMS: Partial<Record<keyof F3ModifiersState, readonly string[]>> = {
  multiStroke: MULTI_STROKE_STEPS,
  fillStyle: FILL_STYLE_STEPS,
  strokePalette: PALETTE_MODE_STEPS,
  fillPalette: PALETTE_MODE_STEPS,
  risoSecondaryColor: PALETTE_MODE_STEPS,
  texture: TEXTURE_STEPS,
  dotPattern: DOT_PATTERN_STEPS,
  endpointBehavior: ENDPOINT_BEHAVIOR_STEPS,
  sketchingStyle: SKETCHING_STYLE_STEPS,
  penTip: PEN_TIP_STEPS,
};

function parseSurfaceConfig(raw: unknown): SurfaceRenderConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const style = rec.svgStyle;
  if (typeof style !== 'string' || !F3_SVG_STYLES.some((s) => s.id === style)) {
    return null;
  }
  const modifiers: F3ModifiersState = { ...DEFAULT_MODIFIERS };
  const rawMods = rec.modifiers;
  if (rawMods && typeof rawMods === 'object') {
    for (const key of Object.keys(DEFAULT_MODIFIERS) as (keyof F3ModifiersState)[]) {
      const v = (rawMods as Record<string, unknown>)[key];
      if (v == null || typeof v !== typeof DEFAULT_MODIFIERS[key]) continue;
      if (typeof v === 'number' && !Number.isFinite(v)) continue;
      const allowed = MODIFIER_ENUMS[key];
      if (typeof v === 'string' && allowed && !allowed.includes(v)) continue;
      (modifiers as Record<string, unknown>)[key] = v;
    }
  }
  // Spread-then-override: extras (strokes etc.) ride through untouched.
  return { ...rec, svgStyle: style as F3SvgStyle, modifiers };
}

/** Sync bridge between ObjectSurface's plain local state and the NESTED
 *  providers wrapping the card. It runs inside the nested scope, so
 *  setState/replace here touch only the card's shadowed context — never the
 *  global one. useLayoutEffect so the sync lands before paint (no flash of
 *  provider-default style on open). The `state !== mods` guard makes the
 *  replace() settle in one pass (replace stores the same object reference,
 *  so the re-run after the state change is a no-op). */
function SurfaceRenderScope({
  svgStyle,
  mods,
  children,
}: {
  svgStyle: F3SvgStyle;
  mods: F3ModifiersState;
  children: ReactNode;
}) {
  const styleCtx = useF3SvgStyle();
  const modsCtx = useF3RoughModifiers();
  useLayoutEffect(() => {
    if (styleCtx.state !== svgStyle) styleCtx.setState(svgStyle);
  }, [styleCtx, svgStyle]);
  useLayoutEffect(() => {
    if (modsCtx.state !== mods) modsCtx.replace(mods);
  }, [modsCtx, mods]);
  return <>{children}</>;
}

// ─── SurfaceControls — the FULL per-style control set, compact ───────────────
// Generic render off the SAME spec tables the desk chrome uses. Structure +
// every sub-conditional mirrors SmartHachureChrome.tsx (the source of truth
// for which control shows when); only the layout is compact (mini headers,
// no collapsible clusters — the column scrolls instead). Per
// feedback_more_toggles_better: full ranges, full steps, nothing trimmed.

type NumericModKey = keyof typeof SLIDER_SPECS & keyof F3ModifiersState;

const MINI_HEADER: CSSProperties = {
  ...SECTION_LABEL,
  marginTop: 6,
  paddingTop: 10,
  borderTop: '1px solid var(--dir-border)',
};

export function SurfaceControls({
  svgStyle,
  mods,
  onStyle,
  onMod,
  onReset,
}: {
  svgStyle: F3SvgStyle;
  mods: F3ModifiersState;
  onStyle: (s: F3SvgStyle) => void;
  onMod: <K extends keyof F3ModifiersState>(key: K, value: F3ModifiersState[K]) => void;
  onReset: () => void;
}) {
  const declared = MODIFIER_SETS_BY_STYLE[svgStyle] ?? UNIVERSAL_MODIFIERS;
  const has = (k: string) => declared.includes(k);

  // Compact numeric row — same SLIDER_SPECS min/max/step as the desk chrome.
  const num = (
    key: NumericModKey,
    label: string,
    opts: { unit?: string; title?: string } = {},
  ) => (
    <Slider
      key={key}
      label={label}
      value={mods[key] as number}
      min={SLIDER_SPECS[key].min}
      max={SLIDER_SPECS[key].max}
      step={SLIDER_SPECS[key].step}
      unit={opts.unit}
      title={opts.title}
      onChange={(v) => onMod(key, v as F3ModifiersState[NumericModKey])}
    />
  );

  // Cluster presence — same grouping logic as the chrome (I-13 clusters).
  const hasStrokeBlock =
    has('wobble') || has('jaggedness') || has('simplification') ||
    has('bowing') || has('strokeWidth') ||
    has('curveDamp') || has('multiStroke') || has('endpointBehavior') ||
    has('sketchingStyle') || has('penTip');
  const hasShadingBlock =
    has('fillStyle') || has('hachureGap') || has('hachureAngle') || has('fillDensity');
  const hasSurfaceBlock =
    has('blurAmount') || has('bleed') || has('dotSize') || has('dotSpacing') ||
    has('dotScatter') || has('dotPattern') || has('grainIntensity') || has('smudgeAmount') ||
    has('pressureVariance') || has('offsetDistance') || has('offsetAngle') ||
    has('colorShift') || has('registrationError');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* STYLE — always visible (the master pick). */}
      <Dropdown
        label="SVG style"
        value={svgStyle}
        sections={[{
          heading: 'SVG render style',
          options: F3_SVG_STYLES.map((s) => ({ value: s.id, label: s.label, detail: s.detail })),
        }]}
        onChange={(v) => onStyle(v as F3SvgStyle)}
        popoverWidth={360}
      />

      {/* MULTI-STROKE — Cluster 1 per I-13 */}
      {hasStrokeBlock && (
        <>
          <div style={MINI_HEADER}>Multi-stroke</div>
          {has('multiStroke') && (
            <Dropdown
              label="Multi-stroke"
              value={mods.multiStroke}
              sections={[{
                heading: 'Multi-stroke',
                options: MULTI_STROKE_STEPS.map((s) => ({ value: s, label: s })),
              }]}
              onChange={(v) => onMod('multiStroke', v as MultiStrokeStep)}
              popoverWidth={220}
            />
          )}
          {has('endpointBehavior') && (
            <Dropdown
              label="Endpoint"
              value={mods.endpointBehavior}
              sections={[{
                heading: 'Endpoint behavior (playground)',
                options: ENDPOINT_BEHAVIOR_STEPS.map((s) => ({
                  value: s, label: s,
                  detail: s === 'clean' ? 'Sharp corners at vertices'
                    : s === 'protrude' ? 'Slight overshoot at corners'
                    : s === 'long-overshoot' ? 'Heavy overshoot — sketchbook look'
                    : 'Kinked corners (random angle)',
                })),
              }]}
              onChange={(v) => onMod('endpointBehavior', v as EndpointBehaviorStep)}
              popoverWidth={320}
            />
          )}
          {has('sketchingStyle') && mods.multiStroke !== 'off' && mods.multiStroke !== 'single' && (
            <Dropdown
              label="Sketching style"
              value={mods.sketchingStyle}
              sections={[{
                heading: 'Layered-stroke pacing (playground)',
                options: SKETCHING_STYLE_STEPS.map((s) => ({
                  value: s, label: s,
                  detail: s === 'single-pass' ? 'Layers stack on same path'
                    : s === 'loose-overlap' ? 'Layers offset along segment'
                    : s === 'parallel-pass' ? 'Concentric outward layers'
                    : 'Crisscross rotation per layer',
                })),
              }]}
              onChange={(v) => onMod('sketchingStyle', v as SketchingStyleStep)}
              popoverWidth={340}
            />
          )}
          {has('penTip') && (
            <Dropdown
              label="Pen tip"
              value={mods.penTip}
              sections={[{
                heading: 'Pen-tip preset (perfect-freehand)',
                options: PEN_TIP_STEPS.map((s) => ({
                  value: s,
                  label: s,
                  detail:
                    s === 'plain' ? 'Plain stroke — uniform width, no taper'
                    : s === 'ballpoint' ? 'Clean uniform stroke, slight endpoint thinning'
                    : s === 'fineliner' ? 'Thin uniform stroke, hard caps'
                    : s === 'pencil-hb' ? 'Mild width variation, light grain'
                    : s === 'pencil-2b' ? 'Stronger width variation, heavier grain'
                    : s === 'felt-tip' ? 'Thicker uniform stroke, soft caps'
                    : s === 'chisel' ? 'Strong width variation, calligraphic'
                    : 'Heavy variable width, edge-jittered grain',
                })),
              }]}
              onChange={(v) => onMod('penTip', v as PenTipStep)}
              popoverWidth={360}
            />
          )}
          {has('wobble') &&
            num('wobble', mods.wobble > 1.4 ? 'Wobble ⚠ Excalidraw zone' : 'Wobble')}
          {has('jaggedness') && num('jaggedness', 'Jaggedness')}
          {has('simplification') &&
            num('simplification', 'Simplify', {
              title:
                "Geometry fidelity on drawn/uploaded paths: low = faithful (keeps every wiggle), high = essential (smooths to clean lines). 1.0 = today's baseline.",
            })}
          {has('bowing') && num('bowing', 'Bowing')}
          {has('strokeWidth') && num('strokeWidth', 'Stroke width')}
          {has('curveDamp') &&
            num('curveDamp', 'Curve', {
              title: 'Above ~0.8 straightens curves enough that Bowing reads as off (spec §6.7)',
            })}
        </>
      )}

      {/* SHADING — Cluster 3 per I-13 */}
      {hasShadingBlock && (
        <>
          <div style={MINI_HEADER}>Shading</div>
          {has('fillStyle') && (
            <Dropdown
              label="Fill style"
              value={mods.fillStyle}
              sections={[{
                heading: 'Fill style',
                options: FILL_STYLE_STEPS.map((s) => ({ value: s, label: s })),
              }]}
              onChange={(v) => onMod('fillStyle', v as FillStyleStep)}
              popoverWidth={240}
            />
          )}
          {has('hachureGap') && (mods.fillStyle === 'hachure' || mods.fillStyle === 'cross-hatch' || mods.fillStyle === 'zigzag-line' || mods.fillStyle === 'zigzag' || mods.fillStyle === 'dashed') &&
            num('hachureGap', 'Hachure gap', { unit: 'px' })}
          {has('hachureAngle') && (mods.fillStyle === 'hachure' || mods.fillStyle === 'cross-hatch' || mods.fillStyle === 'dashed' || mods.fillStyle === 'zigzag-line') &&
            num('hachureAngle', 'Hachure angle', { unit: '°' })}
          {has('fillDensity') && mods.fillStyle !== 'none' && num('fillDensity', 'Fill density')}
        </>
      )}

      {/* SURFACE TEXTURE — Cluster 4 per I-13 */}
      {hasSurfaceBlock && (
        <>
          <div style={MINI_HEADER}>Surface texture</div>
          {has('blurAmount') && num('blurAmount', 'Blur amount')}
          {has('bleed') && num('bleed', 'Bleed')}
          {has('dotSize') && num('dotSize', 'Dot size')}
          {has('dotSpacing') && num('dotSpacing', 'Dot spacing', { unit: 'px' })}
          {has('dotScatter') && num('dotScatter', 'Dot scatter')}
          {has('dotPattern') && (
            <Dropdown
              label="Dot pattern"
              value={mods.dotPattern}
              sections={[{ heading: 'Dot pattern', options: DOT_PATTERN_STEPS.map((s) => ({ value: s, label: s })) }]}
              onChange={(v) => onMod('dotPattern', v as DotPatternStep)}
              popoverWidth={220}
            />
          )}
          {has('grainIntensity') && num('grainIntensity', 'Grain')}
          {has('smudgeAmount') && num('smudgeAmount', 'Smudge')}
          {has('pressureVariance') && num('pressureVariance', 'Pressure variance')}
          {has('offsetDistance') && num('offsetDistance', 'Offset distance', { unit: 'px' })}
          {has('offsetAngle') && num('offsetAngle', 'Offset angle', { unit: '°' })}
          {has('colorShift') && num('colorShift', 'Color shift')}
          {has('risoSecondaryColor') && (
            <Dropdown
              label="Riso secondary color"
              value={mods.risoSecondaryColor}
              sections={[{
                heading: 'Risograph secondary-layer color',
                options: PALETTE_MODE_STEPS.map((s) => ({
                  value: s, label: s,
                  detail: s === 'source' ? 'Falls back to accent' : `Renders in var(--dir-${s === 'neutral' ? 'text-body' : s})`,
                })),
              }]}
              onChange={(v) => onMod('risoSecondaryColor', v as PaletteModeStep)}
              popoverWidth={340}
            />
          )}
          {has('registrationError') && num('registrationError', 'Registration error')}
        </>
      )}

      {/* COLOR / PALETTE — Cluster 5 per I-13 (universal — always present) */}
      <div style={MINI_HEADER}>Color / palette</div>
      {has('inkIntensity') && num('inkIntensity', 'Ink intensity')}
      {has('fillOpacity') && num('fillOpacity', 'Fill opacity')}
      {has('strokePalette') && (
        <>
          <Dropdown
            label="Stroke palette"
            value={mods.strokePalette}
            sections={[{
              heading: 'Stroke (outline) color',
              options: PALETTE_MODE_STEPS.map((s) => ({
                value: s, label: s,
                detail: s === 'source' ? 'Use the SVG source colors (default)' : `Override ALL strokes to var(--dir-${s === 'neutral' ? 'text-body' : s})`,
              })),
            }]}
            onChange={(v) => onMod('strokePalette', v as PaletteModeStep)}
            popoverWidth={320}
          />
          <Dropdown
            label="Fill palette"
            value={mods.fillPalette}
            sections={[{
              heading: 'Fill color',
              options: PALETTE_MODE_STEPS.map((s) => ({
                value: s, label: s,
                detail: s === 'source' ? 'Use the SVG source fills (default)' : `Override ALL fills to var(--dir-${s === 'neutral' ? 'text-body-soft' : s})`,
              })),
            }]}
            onChange={(v) => onMod('fillPalette', v as PaletteModeStep)}
            popoverWidth={320}
          />
        </>
      )}
      {has('texture') && svgStyle !== 'wet-ink' && svgStyle !== 'charcoal' && (
        <Dropdown
          label="Texture"
          value={mods.texture}
          sections={[{ heading: 'Texture', options: TEXTURE_STEPS.map((s) => ({ value: s, label: s })) }]}
          onChange={(v) => onMod('texture', v as TextureStep)}
          popoverWidth={260}
        />
      )}
      {has('textureIntensity') && (mods.texture !== 'none' || svgStyle === 'wet-ink' || svgStyle === 'charcoal') &&
        num('textureIntensity', 'Texture intensity')}

      {/* Reset — same semantics as the chrome: DEFAULT baseline + style preset. */}
      <button
        onClick={onReset}
        title={`Reset controls to the ${svgStyle} style preset`}
        style={{ ...PILL, width: '100%', marginTop: 6, padding: '8px 14px', background: 'var(--dir-bg)' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dir-raised)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--dir-bg)')}
      >
        Reset to {svgStyle} preset
      </button>
    </div>
  );
}

export function ObjectSurface({
  mode,
  object,
  onClose,
  onDelete,
  onObjectUpdate,
  onSave,
  onConfigSave,
  rightInset = 0,
}: {
  mode: ObjectSurfaceMode;
  object: ObjectSurfaceData;
  onClose: () => void;
  /** Edit mode only — delete this (your own) object. */
  onDelete?: () => void;
  /** Edit mode only — persist the edited name/why (called on Done). */
  onSave?: (name: string | null, why: string | null) => void;
  /** Edit mode only (Re-draw) — hands the regenerated svg + config back so
   *  the desk object updates in place (persistence runs in the surface). */
  onObjectUpdate?: (svgMarkup: string, config: SurfaceRenderConfig) => void;
  /** Edit mode only — the optimistic local config update at Done: lets the
   *  caller (DeskPage) re-pin the desk object to the edited config without a
   *  reload. Fired BEFORE the persist resolves, and regardless of its result
   *  (the popup's note covers the not-persisted case honestly). */
  onConfigSave?: (config: SurfaceRenderConfig) => void;
  /** px width of the desk's open right controls panel. The scrim reserves this
   *  much padding on the right so the modal centers over the DESK working area,
   *  not behind the open panel. 0 (default) = center over the raw viewport. */
  rightInset?: number;
}) {
  const isSandbox = mode === 'sandbox';
  // Local editable copy of name/why for Edit mode.
  const [name, setName] = useState(object.name ?? '');
  const [why, setWhy] = useState(object.why ?? '');

  // ── Baseline — what the controls OPEN at, and what divergence is measured
  // against. Priority: the object's own render_config (prop, then row lookup
  // below) → the global pen values (legacy null-config rows; also the first
  // paint while a lookup is in flight). Reading the global context here is
  // read-only — this surface never writes back to it.
  const globalStyleCtx = useF3SvgStyle();
  const globalModsCtx = useF3RoughModifiers();
  const propConfig = useMemo(
    () => parseSurfaceConfig(object.renderConfig),
    [object.renderConfig],
  );
  const [baseline, setBaseline] = useState<SurfaceRenderConfig>(() =>
    propConfig ?? { svgStyle: globalStyleCtx.state, modifiers: globalModsCtx.state },
  );

  // Surface-local control state — plain useState, scoped to this popup.
  // Unmount (close) discards everything; reopen re-derives the baseline.
  const [surfStyle, setSurfStyle] = useState<F3SvgStyle>(baseline.svgStyle);
  const [surfMods, setSurfMods] = useState<F3ModifiersState>(baseline.modifiers);
  // True once the user touched any control — gates the async baseline swap
  // (never clobber in-progress play) and Edit's Done persist (untouched
  // controls keep the exact legacy name/why-only Done behavior).
  const dirtyRef = useRef(false);
  const [, forceDirtyPaint] = useState(false);

  // The row id used by Edit's Done persist — from props when the caller has
  // it; otherwise recovered by the lookup below.
  const [rowId, setRowId] = useState<string | null>(object.id ?? null);

  // ── Row lookup (once, on open) — recovers id + stored render_config when
  // the caller didn't pass them (DeskPage today). Edit scopes to YOUR rows;
  // Sandbox matches any maker so its baseline is the object's real desk look
  // (post-D-7 objects render from their own record, not the pen). Best-effort:
  // a miss leaves the pen-values baseline.
  useEffect(() => {
    if (object.id && propConfig) return; // caller passed everything — no lookup
    let cancelled = false;
    findDoodleBySvg(object.svgMarkup, isSandbox ? 'any' : 'mine')
      .then((row) => {
        if (cancelled || !row) return;
        setRowId((prev) => prev ?? row.id);
        if (propConfig) return; // prop config wins over the row's
        const cfg = parseSurfaceConfig(row.render_config);
        if (cfg && !dirtyRef.current) {
          setBaseline(cfg);
          setSurfStyle(cfg.svgStyle);
          setSurfMods(cfg.modifiers);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Open-time snapshot by design — the popup unmounts between opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markDirty = () => {
    if (!dirtyRef.current) {
      dirtyRef.current = true;
      forceDirtyPaint(true); // divergence note may need a paint
    }
  };

  const setSurfMod = <K extends keyof F3ModifiersState>(key: K, value: F3ModifiersState[K]) => {
    markDirty();
    setSurfMods((prev) => ({ ...prev, [key]: value }));
  };

  /** Style switch — desk-chrome semantics (SmartHachureChrome onChange):
   *  apply the new style's preset onto the CURRENT modifier state, so picking
   *  "Bold ink" actually reads as bold ink and the visible rows snap to the
   *  style's own calibration. */
  const handleStyle = (next: F3SvgStyle) => {
    markDirty();
    setSurfStyle(next);
    setSurfMods((prev) => applyStylePreset(prev, next));
  };

  /** Reset — chrome semantics: DEFAULT baseline + this style's preset (true
   *  per-style baseline, including keys presets don't carry). */
  const handleReset = () => {
    markDirty();
    setSurfMods(applyStylePreset(DEFAULT_MODIFIERS, surfStyle));
  };

  // Quiet divergence affordance — true once any control left the baseline.
  const diverged =
    surfStyle !== baseline.svgStyle ||
    (Object.keys(DEFAULT_MODIFIERS) as (keyof F3ModifiersState)[]).some(
      (k) => surfMods[k] !== baseline.modifiers[k],
    );

  // ── Edit Done — name/why save (unchanged) + the config persist (v4) ───────
  const [saving, setSaving] = useState(false);
  // True after a persist came back false (RPC absent / row not ours / no row
  // id) — the quiet "saved locally" note. The next Done just closes: the
  // config is already applied optimistically and re-firing would loop.
  const [configNote, setConfigNote] = useState(false);

  const handleDone = async () => {
    // Persist the edited name/why exactly as before. Empty → null.
    onSave?.(name.trim() || null, why.trim() || null);

    // Controls untouched → legacy behavior: nothing config-related to do.
    if (!dirtyRef.current) {
      onClose();
      return;
    }

    const config: SurfaceRenderConfig = { ...baseline, svgStyle: surfStyle, modifiers: surfMods };
    // Optimistic local update — ALWAYS (the caller re-pins the desk object;
    // the note below covers the not-persisted case honestly).
    onConfigSave?.(config);

    if (configNote) {
      // Already noted "saved locally" — second Done is just a close.
      onClose();
      return;
    }

    let persisted = false;
    if (rowId) {
      setSaving(true);
      persisted = await updateDoodleConfig(rowId, config).catch(() => false);
      setSaving(false);
    }
    if (persisted) onClose();
    else setConfigNote(true); // quiet one-liner, stays open so it's seen
  };

  // ── RE-DRAW (round 4): reopen the recorded gesture, modify, save back ────
  // The record keeps the hand: render_config.strokes (written at Done by the
  // create flow) reload into the draw canvas, editable; Done re-runs the same
  // markup path the create flow uses and persists svg + config in one v5 RPC.
  const [redrawing, setRedrawing] = useState(false);
  const [redrawMode, setRedrawMode] = useState<'draw' | 'style'>('draw');
  const redrawStrokesRef = useRef<Stroke[]>([]);
  const [redrawCount, setRedrawCount] = useState(0);
  // Local art override so the card refreshes instantly after a re-draw save.
  const [artMarkup, setArtMarkup] = useState(object.svgMarkup);
  const storedStrokes = useMemo<StrokePoint[][] | null>(() => {
    const raw = (baseline as Record<string, unknown>).strokes;
    if (!Array.isArray(raw) || raw.length === 0) return null;
    const ok = raw.every(
      (st) =>
        Array.isArray(st) &&
        st.length >= 2 &&
        st.every(
          (pt) =>
            Array.isArray(pt) && pt.length === 3 && pt.every((n) => Number.isFinite(n)),
        ),
    );
    return ok ? (raw as StrokePoint[][]) : null;
  }, [baseline]);

  const handleRedrawDone = async () => {
    const drawn = redrawStrokesRef.current;
    if (drawn.length === 0) return;
    const markup = normalizeSvgSize(strokesToObjectMarkup(drawn), 180);
    const config: SurfaceRenderConfig = {
      ...baseline,
      svgStyle: surfStyle,
      modifiers: surfMods,
      strokes: capStrokes(drawn),
    };
    // Optimistic everywhere: the card + the desk object update immediately.
    setArtMarkup(markup);
    setBaseline(config);
    onObjectUpdate?.(markup, config);
    setRedrawing(false);
    let persisted = false;
    if (rowId) {
      setSaving(true);
      persisted = await updateDoodleSvg(rowId, markup, config).catch(() => false);
      setSaving(false);
    }
    if (!persisted) setConfigNote(true); // honest local-save note (needs v5)
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // ── Card-height measurement → the controls column's internal-scroll cap.
  // The column must never make the popup taller than the card row wants to be
  // (it scrolls internally instead) — and heights vary with content + machine,
  // so MEASURE via ResizeObserver, never estimate static pixels
  // (feedback_no_static_pixels_when_viewport_relative). The panel's own
  // maxHeight (viewport-bound) stays as the outer guard.
  const cardColRef = useRef<HTMLDivElement | null>(null);
  const [cardH, setCardH] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = cardColRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      setCardH(el.getBoundingClientRect().height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scrim: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 300,
    background: 'color-mix(in srgb, var(--dir-text-primary) 28%, transparent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    // When the desk's right controls panel is open, reserve its width so flex-
    // centering happens in the remaining desk area (modal stops feeling shoved
    // left). Default 0 leaves the base 32px padding untouched. The inner min()
    // CLAMPS the reservation on narrow viewports: an unclamped 32+360px right
    // pad at ~420px wide left NEGATIVE space and crushed the popup to a sliver
    // (caught by playwright 2026-06-11) — the popup keeps ≥~352px and slides
    // under the panel instead, which wins on small screens.
    paddingRight:
      rightInset > 0
        ? `max(32px, min(${32 + rightInset}px, calc(100vw - 384px)))`
        : 32,
  };

  const panel: CSSProperties = {
    position: 'relative',
    background: 'var(--dir-raised)',
    border: '1px solid var(--dir-border)',
    // Sandbox gets a distinct dashed edge so it never reads as "your editable
    // object" (read-only-vs-ephemeral signposting).
    borderStyle: isSandbox ? 'dashed' : 'solid',
    borderRadius: 16,
    boxShadow: RAISED_SHADOW,
    padding: 20,
    // MINI DESK in both modes now (Sebs 2026-06-11): art beside the FULL
    // control column, the same side-by-side grammar as the big desk.
    width: 'min(720px, calc(100vw - 64px))',
    // The popup itself must NOT grow past the viewport — internal scrolling
    // (the controls column, then the panel itself) absorbs overflow.
    maxHeight: 'calc(100vh - 64px)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    fontFamily: IS,
  };

  // The embedded card — the modal panel IS the card; no card-inside-a-card.
  // BOTH modes wrap it in the nested-provider scope so it re-renders live
  // through the surface-local values: Sandbox = viewer config (discarded),
  // Edit = the object's config being edited (persisted on Done). The desk
  // behind keeps reading the untouched global context either way.
  const card = (
    <F3SvgStyleProvider>
      <F3RoughModifiersProvider>
        <SurfaceRenderScope svgStyle={surfStyle} mods={surfMods}>
          <ObjectCard
            svgMarkup={artMarkup}
            name={isSandbox ? object.name : name}
            why={isSandbox ? object.why : why}
            owner={object.owner}
            createdAt={object.createdAt}
            embedded
            editable={!isSandbox}
            onNameChange={setName}
            onWhyChange={setWhy}
          />
        </SurfaceRenderScope>
      </F3RoughModifiersProvider>
    </F3SvgStyleProvider>
  );

  return (
    <div onClick={onClose} style={scrim}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isSandbox ? 'Explore doodle' : 'Edit doodle'}
        onClick={(e) => e.stopPropagation()}
        style={panel}
      >
        {/* Sandbox banner — the why of the unsaved scope, persistent. */}
        {isSandbox && (
          <div
            style={{
              ...SECTION_LABEL,
              color: 'var(--dir-text-body-soft)',
              textTransform: 'none',
              letterSpacing: 0,
              fontSize: 11,
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            Sandbox — play with someone else’s doodle. Nothing here saves.
          </div>
        )}

        {/* MINI-DESK ROW (Sebs 2026-06-11): card on the left, controls on the
            right — the same side-by-side grammar as the big desk, so the
            surface reads as a miniature of it instead of a scrolling stack.
            flexWrap lets narrow viewports fall back to stacked. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'flex-start' }}>
          <div ref={cardColRef} style={{ flex: '1 1 300px', minWidth: 280 }}>
            {card}
          </div>

          {/* The FULL control column (both modes) — header pinned, controls
              scroll internally when taller than the card. */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              flex: '1 1 260px',
              minWidth: 240,
              borderLeft: '1px solid var(--dir-border)',
              paddingLeft: 18,
              // Cap to the measured card height (floor keeps the column usable
              // on near-empty cards); undefined on first paint → the panel's
              // viewport maxHeight guards until the observer fires.
              maxHeight: cardH != null ? Math.max(cardH, 320) : undefined,
              minHeight: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 8,
                flexShrink: 0,
              }}
            >
              <span style={SECTION_LABEL}>Restyle</span>
              {/* Quiet divergence note — Sandbox ONLY (nothing saves there).
                  Fixed slot (opacity, not mount) so the strip never jumps. */}
              {isSandbox && (
                <span
                  aria-hidden={!diverged}
                  style={{
                    fontFamily: IS,
                    fontSize: 10,
                    fontStyle: 'italic',
                    color: 'var(--dir-text-body-soft)',
                    whiteSpace: 'nowrap',
                    opacity: diverged ? 1 : 0,
                    transition: 'opacity 0.25s',
                  }}
                >
                  restyled locally — nothing saves
                </span>
              )}
            </div>

            <div
              style={{
                flex: '1 1 auto',
                minHeight: 0,
                overflowY: 'auto',
                paddingRight: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <SurfaceControls
                svgStyle={surfStyle}
                mods={surfMods}
                onStyle={handleStyle}
                onMod={setSurfMod}
                onReset={handleReset}
              />
            </div>
          </div>
        </div>

        {/* Quiet persist-fallback note (Edit) — shown when the config could
            not be written to the record (schema-v4 RPC absent / row not
            reachable). Honest: the restyle DID apply locally via onConfigSave. */}
        {!isSandbox && configNote && (
          <div
            style={{
              fontFamily: IS,
              fontSize: 10,
              fontStyle: 'italic',
              color: 'var(--dir-text-body-soft)',
            }}
          >
            saved locally — couldn’t reach the desk record (schema v4/v5)
          </div>
        )}

        {/* RE-DRAW STAGE — covers the card UI; the recorded gesture reloads
            into the live-styled canvas (rendered under THIS object's current
            edit-state config via the same nested-provider scope), editable.
            Done re-runs the create flow's markup path + persists via v5. */}
        {redrawing && storedStrokes && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 5,
              background: 'var(--dir-raised)',
              borderRadius: 16,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={SECTION_LABEL}>Re-draw — your original strokes, editable</span>
              {(['draw', 'style'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setRedrawMode(m)}
                  aria-pressed={redrawMode === m}
                  style={{
                    ...PILL,
                    padding: '4px 12px',
                    background: redrawMode === m ? 'var(--dir-text-primary)' : 'var(--dir-bg)',
                    color: redrawMode === m ? 'var(--dir-bg)' : 'var(--dir-text-primary)',
                  }}
                >
                  {m === 'draw' ? 'Sketch' : 'Style'}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
              <F3SvgStyleProvider>
                <F3RoughModifiersProvider>
                  <SurfaceRenderScope svgStyle={surfStyle} mods={surfMods}>
                    <DrawSurface
                      mode="svg"
                      input="draw"
                      hideActions
                      fill
                      styled={redrawMode === 'style'}
                      initialStrokes={storedStrokes}
                      onStrokesChange={(st) => { redrawStrokesRef.current = st; setRedrawCount(st.length); }}
                    />
                  </SurfaceRenderScope>
                </F3RoughModifiersProvider>
              </F3SvgStyleProvider>
            </div>
            <footer style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <button onClick={() => setRedrawing(false)} style={PILL}>Back</button>
              <button
                onClick={() => void handleRedrawDone()}
                disabled={redrawCount === 0 || saving}
                style={{ ...CTA, opacity: redrawCount === 0 || saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving…' : 'Done'}
              </button>
            </footer>
          </div>
        )}

        <footer style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          {isSandbox ? (
            // Just Close in Sandbox for now. The "Remix as mine" button returns
            // when the fork-into-new-owned-object write lands (no greyed stub).
            <button onClick={onClose} style={PILL}>Close</button>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={onDelete}
                  disabled={!onDelete}
                  title="Remove this doodle from the desk"
                  style={{ ...PILL, borderColor: 'var(--dir-border)', color: 'var(--dir-text-body-soft)' }}
                >
                  Delete
                </button>
                {storedStrokes ? (
                  <button
                    onClick={() => { redrawStrokesRef.current = []; setRedrawCount(0); setRedrawMode('draw'); setRedrawing(true); }}
                    disabled={saving}
                    title="Reopen the drawing with your original strokes"
                    style={PILL}
                  >
                    Re-draw
                  </button>
                ) : (
                  <span
                    style={{
                      fontFamily: IS,
                      fontSize: 10,
                      fontStyle: 'italic',
                      color: 'var(--dir-text-body-soft)',
                    }}
                  >
                    drawn before re-editing existed
                  </span>
                )}
              </div>
              <button
                onClick={() => void handleDone()}
                disabled={saving}
                style={{ ...CTA, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving…' : 'Done'}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
