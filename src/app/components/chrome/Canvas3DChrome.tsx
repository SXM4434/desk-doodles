// ─── Canvas3DChrome — the 3D-mode right panel (round-7 chrome split) ────────
// Implements docs/design/3d-mode-controls-spec.md §5 under the LOCKED split
// rule: in 3D mode the right panel shows 3D controls ONLY — the 2D SVG chrome
// (SmartHachureChrome) renders ONLY under the SVG-port style, where it drives
// the ported treatment. The 2D panel never renders in 3D mode; this panel
// never renders in 2D mode (DeskDoodlesCanvas owns the swap).
//
// Layout (spec §5 + the RATIFIED THREE-TIER AMENDMENT, top to bottom):
//   1. MODE — stays in the page header (2D|3D pill pair, unchanged).
//   2. TIER 1 (shared) — 3D STYLE cluster: style dropdown + the active
//      style's set: Native → FS material sub-dropdown (6 real presets, D-C,
//      ink-black locked) · Hatch → the LIVE 2D Shading sliders (same
//      F3RoughModifiers state — one math, two renderers) · SVG-port → the
//      entire SmartHachureChrome (mounted at the panel bottom).
//   3. GEOMETRY cluster — mode dropdown + TIER 3 (per-mode property sliders,
//      spec §2; Auto hides them + shows the explainer chip, D-D). TIER 2
//      (per-mode style-family pickers) = the amendment's fast-follow rock —
//      slots between the mode dropdown and the sliders when it lands.
//   4. Round-8 AI engine row — reserved, nothing visible (spec §2.5).
//
// FULL control sets, never trimmed (Sebs round 7 +
// feedback_more_toggle_options_better). Pills via chromeStyles
// (feedback_fully_rounded_pill_ui). Collapse keys `c3d.cluster.*` persisted
// via usePanelOpen, matching the 2D chrome's house pattern.

import { type CSSProperties, type ReactNode } from 'react';
import { IS } from '../../lib/typography';
import { PILL, SECTION_LABEL } from '../../lib/chromeStyles';
import { Dropdown } from './Dropdown';
import { Slider } from './Slider';
import { usePanelOpen } from './CollapsiblePanel';
import { SmartHachureChrome } from './SmartHachureChrome';
import { SLIDER_SPECS } from './modifierSpecs';
import {
  GEOMETRY_MODE_OPTIONS,
  STYLE3D_OPTIONS,
  useCanvas3D,
  type Style3D,
} from '../../state/Canvas3DContext';
import { useF3RoughModifiers } from '../../state/F3RoughModifiersContext';
import {
  EXTRUDE_SLIDER_SPECS,
  EXTRUDE_TINY_WIDTH,
  INFLATE_SLIDER_SPECS,
  ROD_SLIDER_SPECS,
  SOLID_SLIDER_SPECS,
  extrudeBevelAutoDisabled,
  extrudeEffectiveDepth,
  extrudeWidthFromSlider,
  type Param3DSliderSpec,
} from '../canvas3d/modeParams';
import { MATERIAL_PRESET_OPTIONS } from '../canvas3d/materials3d';
import type { GeometryModeSetting } from '../../lib/geometry3d/strokeTo3d';

const SECTION_NOTE: CSSProperties = {
  fontFamily: IS,
  fontSize: 10,
  color: 'var(--dir-text-body-soft)',
  margin: 0,
  fontStyle: 'italic',
};

/** Honest status chip — explainer / auto-disable notes (never silent). */
const STATUS_CHIP: CSSProperties = {
  fontFamily: IS,
  fontSize: 10,
  lineHeight: 1.5,
  color: 'var(--dir-text-secondary)',
  background: 'var(--dir-bg)',
  border: '1px solid var(--dir-border)',
  borderRadius: 12,
  padding: '8px 12px',
};

/** Section — local twin of SmartHachureChrome's private cluster section
 *  (same look; that component doesn't export it). Collapse persisted. */
function Section({ title, note, collapseKey, defaultOpen = true, children }: {
  title: string;
  note?: string;
  collapseKey?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, toggle] = usePanelOpen(collapseKey ?? 'c3d.cluster.pinned', defaultOpen);
  const expanded = !collapseKey || open;
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '18px 18px',
        borderBottom: '1px solid var(--dir-border)',
      }}
    >
      {collapseKey ? (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 8,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <h3 style={{ ...SECTION_LABEL }}>{title}</h3>
            {note && <p style={SECTION_NOTE}>{note}</p>}
          </span>
          <span
            aria-hidden
            style={{
              fontFamily: IS,
              fontSize: 9,
              color: 'var(--dir-text-secondary)',
              transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.15s',
            }}
          >
            ▾
          </span>
        </button>
      ) : (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h3 style={{ ...SECTION_LABEL }}>{title}</h3>
          {note && <p style={SECTION_NOTE}>{note}</p>}
        </span>
      )}
      {expanded && children}
    </section>
  );
}

/** Boolean control as a labeled On|Off pill pair (house tablist idiom). */
function TogglePills({
  label,
  value,
  onChange,
  title,
  disabled,
  disabledNote,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  title?: string;
  disabled?: boolean;
  disabledNote?: string;
}) {
  return (
    <div
      title={disabled ? disabledNote : title}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
    >
      <span
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--dir-text-secondary)',
        }}
      >
        {label}
      </span>
      <div
        role="group"
        aria-label={label}
        style={{
          display: 'inline-flex',
          border: '1px solid var(--dir-border)',
          borderRadius: 999,
          overflow: 'hidden',
          opacity: disabled ? 0.45 : 1,
        }}
      >
        {([true, false] as const).map((v) => (
          <button
            key={String(v)}
            type="button"
            aria-pressed={value === v}
            disabled={disabled}
            onClick={() => onChange(v)}
            style={{
              ...PILL,
              border: 'none',
              borderRadius: 0,
              padding: '4px 12px',
              fontSize: 10,
              cursor: disabled ? 'not-allowed' : 'pointer',
              background: value === v ? 'var(--dir-accent)' : 'transparent',
              color: value === v ? 'var(--dir-bg)' : 'var(--dir-text-body)',
            }}
          >
            {v ? 'On' : 'Off'}
          </button>
        ))}
      </div>
    </div>
  );
}

function SpecSlider({
  spec,
  value,
  onChange,
}: {
  spec: Param3DSliderSpec;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Slider
      label={spec.label}
      value={value}
      min={spec.min}
      max={spec.max}
      step={spec.step}
      unit={spec.unit}
      precision={spec.precision}
      title={spec.title}
      onChange={onChange}
    />
  );
}

export function Canvas3DChrome() {
  const {
    geometryMode,
    setGeometryMode,
    style3d,
    setStyle3d,
    materialPreset,
    setMaterialPreset,
    materialUserOverride,
    modeParams,
    setRodParams,
    setExtrudeParams,
    setInflateParams,
    setSolidParams,
  } = useCanvas3D();
  const { state: mods, set: setMod } = useF3RoughModifiers();

  const effWidth = extrudeWidthFromSlider(modeParams.extrude.width);
  const effDepth = extrudeEffectiveDepth(modeParams.extrude.width, modeParams.extrude.depthMult);
  const bevelAutoOff = extrudeBevelAutoDisabled(modeParams.extrude.width);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Pinned header — names the surface (split-rule landmark). */}
      <Section title="3D controls" note="Geometry + style for the 3D render — 2D pen controls live under the SVG-port style.">
        <></>
      </Section>

      {/* ── 3D STYLE cluster (spec §5.3, default open) ── */}
      <Section title="3D style" note="Native · Hatch · SVG-port — each swaps its own param set" collapseKey="c3d.cluster.style">
        <Dropdown
          label="3D style"
          value={style3d}
          sections={[
            {
              heading: '3D style',
              options: STYLE3D_OPTIONS.map((o) => ({
                value: o.id,
                label: o.label,
                detail: o.detail,
              })),
            },
          ]}
          onChange={(v) => setStyle3d(v as Style3D)}
          popoverWidth={300}
        />

        {style3d === 'native' && (
          <>
            <Dropdown
              label="Material"
              value={materialPreset}
              sections={[
                {
                  heading: 'Material',
                  subheading: 'Free Stroke presets, verbatim — recolor rides the identity pass.',
                  options: MATERIAL_PRESET_OPTIONS.map((o) => ({
                    value: o.id,
                    label: o.label,
                    detail: o.detail,
                  })),
                },
              ]}
              onChange={(v) => setMaterialPreset(v as (typeof MATERIAL_PRESET_OPTIONS)[number]['id'])}
              popoverWidth={300}
            />
            {!materialUserOverride && (
              <p style={SECTION_NOTE}>
                Following the mode's default material — an explicit pick survives mode switches.
              </p>
            )}
          </>
        )}

        {style3d === 'hatch' && (
          <>
            <p style={SECTION_NOTE}>
              The SAME Shading sliders as the 2D pen — one math, two renderers. Move
              them and the 3D re-hatches live.
            </p>
            <Slider
              label="Hachure gap"
              value={mods.hachureGap}
              min={SLIDER_SPECS.hachureGap.min}
              max={SLIDER_SPECS.hachureGap.max}
              step={SLIDER_SPECS.hachureGap.step}
              unit="px"
              onChange={(v) => setMod('hachureGap', v)}
            />
            <Slider
              label="Hachure angle"
              value={mods.hachureAngle}
              min={SLIDER_SPECS.hachureAngle.min}
              max={SLIDER_SPECS.hachureAngle.max}
              step={SLIDER_SPECS.hachureAngle.step}
              unit="°"
              onChange={(v) => setMod('hachureAngle', v)}
            />
            <Slider
              label="Stroke width"
              value={mods.strokeWidth}
              min={SLIDER_SPECS.strokeWidth.min}
              max={SLIDER_SPECS.strokeWidth.max}
              step={SLIDER_SPECS.strokeWidth.step}
              unit="px"
              onChange={(v) => setMod('strokeWidth', v)}
            />
            <Slider
              label="Ink intensity"
              value={mods.inkIntensity}
              min={SLIDER_SPECS.inkIntensity.min}
              max={SLIDER_SPECS.inkIntensity.max}
              step={SLIDER_SPECS.inkIntensity.step}
              onChange={(v) => setMod('inkIntensity', v)}
            />
          </>
        )}

        {style3d === 'svg-port' && (
          <p style={SECTION_NOTE}>
            M8 v1 bridge: the full 2D chrome below drives the ported treatment —
            fill style picks the mark grammar, wobble bends the marks, Shading sets
            density; the ink outline rides the form's edges. Mark-for-mark SVG
            projection (TAM path) is the post-makeathon upgrade.
          </p>
        )}
      </Section>

      {/* ── GEOMETRY cluster (spec §5.2, default open) ── */}
      <Section title="Geometry" note="Mode + the active mode's full param set" collapseKey="c3d.cluster.geometry">
        <Dropdown
          label="Geometry mode"
          value={geometryMode}
          sections={[
            {
              heading: 'Geometry mode',
              subheading: 'Auto is a default value, not a hidden rule — pick a mode and ALL strokes take it.',
              options: GEOMETRY_MODE_OPTIONS.map((o) => ({
                value: o.id,
                label: o.label,
                detail: o.detail,
              })),
            },
          ]}
          onChange={(v) => setGeometryMode(v as GeometryModeSetting)}
          popoverWidth={300}
        />

        {geometryMode === 'auto' && (
          // D-D: Auto hides per-mode sliders; the explainer chip says why.
          <div style={STATUS_CHIP}>
            Shape decides: open stroke → rod · closed stroke → extrude, at the tuned
            defaults. Pick an explicit mode to reveal its parameter set.
          </div>
        )}

        {geometryMode === 'rod' && (
          <>
            <SpecSlider
              spec={ROD_SLIDER_SPECS.radius}
              value={modeParams.rod.radius}
              onChange={(v) => setRodParams({ radius: v })}
            />
            <TogglePills
              label="End caps"
              value={modeParams.rod.caps}
              onChange={(v) => setRodParams({ caps: v })}
              title="Spherical caps inset 0.35×radius along the tangent — rounded ink tip, not a bead"
            />
            <TogglePills
              label="Joint blobs"
              value={modeParams.rod.jointBlobs}
              onChange={(v) => setRodParams({ jointBlobs: v })}
              title="Spheres at sharp corners fill the tube's pinch crease — the ink-blob feel"
            />
            {modeParams.rod.jointBlobs && (
              <SpecSlider
                spec={ROD_SLIDER_SPECS.jointSensitivityDeg}
                value={modeParams.rod.jointSensitivityDeg}
                onChange={(v) => setRodParams({ jointSensitivityDeg: v })}
              />
            )}
          </>
        )}

        {geometryMode === 'extrude' && (
          <>
            <SpecSlider
              spec={EXTRUDE_SLIDER_SPECS.width}
              value={modeParams.extrude.width}
              onChange={(v) => setExtrudeParams({ width: v })}
            />
            <SpecSlider
              spec={EXTRUDE_SLIDER_SPECS.depthMult}
              value={modeParams.extrude.depthMult}
              onChange={(v) => setExtrudeParams({ depthMult: v })}
            />
            {/* FS debug readout (spec §2.2 — the inverse map ports too). */}
            <p style={{ ...SECTION_NOTE, fontVariantNumeric: 'tabular-nums' }}>
              effective width {effWidth.toFixed(3)}w · depth {effDepth.toFixed(3)}w
            </p>
            <TogglePills
              label="Bevel"
              value={modeParams.extrude.bevel}
              onChange={(v) => setExtrudeParams({ bevel: v })}
              title="Rounded extrusion edges (constants, not sliders — FS DEFAULT_EXTRUDE_PARAMS)"
            />
            {bevelAutoOff && modeParams.extrude.bevel && (
              // Spec §2.2: auto-disable below tiny width is a CHIP, never silent.
              <div style={STATUS_CHIP}>
                Bevel auto-off — width {effWidth.toFixed(3)}w is under the{' '}
                {EXTRUDE_TINY_WIDTH.toFixed(2)}w floor; edges would swallow the face.
              </div>
            )}
          </>
        )}

        {geometryMode === 'inflate' && (
          <>
            <SpecSlider
              spec={INFLATE_SLIDER_SPECS.baseRadius}
              value={modeParams.inflate.baseRadius}
              onChange={(v) => setInflateParams({ baseRadius: v })}
            />
            <SpecSlider
              spec={INFLATE_SLIDER_SPECS.tipRadius}
              value={modeParams.inflate.tipRadius}
              onChange={(v) => setInflateParams({ tipRadius: v })}
            />
            <SpecSlider
              spec={INFLATE_SLIDER_SPECS.pressureInfluence}
              value={modeParams.inflate.pressureInfluence}
              onChange={(v) => setInflateParams({ pressureInfluence: v })}
            />
            {/* D-A: Puff ships — FS's signature inflate feel. */}
            <SpecSlider
              spec={INFLATE_SLIDER_SPECS.puff}
              value={modeParams.inflate.puff}
              onChange={(v) => setInflateParams({ puff: v })}
            />
          </>
        )}

        {geometryMode === 'solid' && (
          <>
            <SpecSlider
              spec={SOLID_SLIDER_SPECS.inkRadius}
              value={modeParams.solid.inkRadius}
              onChange={(v) => setSolidParams({ inkRadius: v })}
            />
            <SpecSlider
              spec={SOLID_SLIDER_SPECS.depth}
              value={modeParams.solid.depth}
              onChange={(v) => setSolidParams({ depth: v })}
            />
            {/* D-B: Holes defaults ON. HONESTY GATE: the toggle is wired
                through the scene's options, but the geometry engine's solid
                builder doesn't accept a holes flag yet (cross-rock option
                need, filed). Disabled-with-note until it lands — never a
                silent no-op (project_f3_styles_must_all_be_real). */}
            <TogglePills
              label="Holes"
              value={modeParams.solid.holes}
              onChange={(v) => setSolidParams({ holes: v })}
              disabled
              disabledNote="Wired, awaiting the geometry engine's holes option — donut holes currently always preserve (the default ON behavior)."
            />
            <div style={STATUS_CHIP}>
              Holes toggle lands with the geometry engine's option — today the engine
              always preserves holes (the ON default).
            </div>
          </>
        )}
      </Section>

      {/* The chrome-split rule's ONLY 2D appearance in 3D mode: the entire 2D
          chrome mounts HERE, under SVG-port, driving the ported treatment
          (spec §5.3). It does not reappear as the separate 2D panel. */}
      {style3d === 'svg-port' && <SmartHachureChrome />}
    </div>
  );
}
