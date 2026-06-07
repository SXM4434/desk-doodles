// SmartHachureChrome — restyled for Desk Doodles vertical right-panel context.
//
// PRESERVES verbatim from Hero8Shell.tsx (the functional truth):
//   - Cluster groupings per 09-LOCKED-MODEL.md I-13
//   - has() conditional reveal per MODIFIER_SETS_BY_STYLE
//   - sub-conditionals (hachureGap only if fillStyle hachure-family,
//     sketchingStyle only if multiStroke != off/single, etc.)
//   - All modifier wirings via setMod
//   - applyStylePreset for Reset
//
// CHANGES from Hero8 for app-context:
//   - Vertical sections (Hero8 was horizontal cluster rows that worked in a top
//     toolbar but broke in a vertical side panel)
//   - Each control on its own row, full-width-ish
//   - Section headers as visible H labels per cluster
//   - Sliders show label + value inline, full-width track below
//   - Reset to preset = bottom of panel, full-width button
import { type CSSProperties, type ReactNode } from 'react';
import { IS } from '../../lib/typography';
import { Dropdown } from './Dropdown';
import { Slider } from './Slider';
import { useF3SvgStyle, F3_SVG_STYLES } from '../../state/F3SvgStyleContext';
import {
  useF3RoughModifiers,
  MULTI_STROKE_STEPS, type MultiStrokeStep,
  FILL_STYLE_STEPS, type FillStyleStep,
  PALETTE_MODE_STEPS, type PaletteModeStep,
  TEXTURE_STEPS, type TextureStep,
  DOT_PATTERN_STEPS, type DotPatternStep,
  ENDPOINT_BEHAVIOR_STEPS, type EndpointBehaviorStep,
  SKETCHING_STYLE_STEPS, type SketchingStyleStep,
  PEN_TIP_STEPS, type PenTipStep,
} from '../../state/F3RoughModifiersContext';
import { applyStylePreset } from '../canvas/SvgStyleTransform';
import { SLIDER_SPECS, MODIFIER_SETS_BY_STYLE, UNIVERSAL_MODIFIERS } from './modifierSpecs';

const SECTION_LABEL: CSSProperties = {
  fontFamily: IS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--dir-text-secondary)',
  margin: 0,
};

const SECTION_NOTE: CSSProperties = {
  fontFamily: IS,
  fontSize: 10,
  color: 'var(--dir-text-body-soft)',
  margin: 0,
  fontStyle: 'italic',
};

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
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
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <h3 style={SECTION_LABEL}>{title}</h3>
        {note && <span style={SECTION_NOTE}>{note}</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        // Override Dropdown width — fill row.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any}
    >
      {children}
    </div>
  );
}

export function SmartHachureChrome() {
  const { state: svgStyle, setState: setSvgStyle } = useF3SvgStyle();
  const { state: mods, set: setMod } = useF3RoughModifiers();

  const declared = MODIFIER_SETS_BY_STYLE[svgStyle] ?? UNIVERSAL_MODIFIERS;
  const has = (k: keyof typeof SLIDER_SPECS | string) => declared.includes(k);

  // For convenient sub-grouping inside Multi-Stroke section
  const hasMultiStrokeBlock =
    has('wobble') || has('roughness') || has('bowing') || has('strokeWidth') ||
    has('curveTightness') || has('multiStroke') || has('endpointBehavior') ||
    has('sketchingStyle') || has('penTip');

  const hasShadingBlock =
    has('fillStyle') || has('hachureGap') || has('hachureAngle') || has('fillDensity');

  const hasSurfaceBlock =
    has('blurAmount') || has('bleed') || has('dotSize') || has('dotSpacing') ||
    has('dotScatter') || has('dotPattern') || has('grainIntensity') || has('smudgeAmount') ||
    has('pressureVariance') || has('offsetDistance') || has('offsetAngle') ||
    has('colorShift') || has('registrationError');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        fontFamily: IS,
        color: 'var(--dir-text-body)',
      }}
    >
      {/* STYLE PICKER */}
      <Section title="Style">
        <Dropdown
          label="SVG style"
          value={svgStyle}
          sections={[{
            heading: 'SVG render style',
            options: F3_SVG_STYLES.map((s) => ({ value: s.id, label: s.label, detail: s.detail })),
          }]}
          onChange={(v) => setSvgStyle(v as typeof svgStyle)}
          width={undefined}
          popoverWidth={360}
        />
      </Section>

      {/* MULTI-STROKE — Cluster 1 per I-13 */}
      {hasMultiStrokeBlock && (
        <Section title="Multi-stroke" note="Path / motion · cluster 1">
          {has('multiStroke') && (
            <Row>
              <Dropdown
                label="Multi-stroke"
                value={mods.multiStroke}
                sections={[{
                  heading: 'Multi-stroke',
                  options: MULTI_STROKE_STEPS.map((s) => ({ value: s, label: s })),
                }]}
                onChange={(v) => setMod('multiStroke', v as MultiStrokeStep)}
                popoverWidth={220}
              />
            </Row>
          )}
          {has('endpointBehavior') && (
            <Row>
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
                onChange={(v) => setMod('endpointBehavior', v as EndpointBehaviorStep)}
                popoverWidth={320}
              />
            </Row>
          )}
          {has('sketchingStyle') && mods.multiStroke !== 'off' && mods.multiStroke !== 'single' && (
            <Row>
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
                onChange={(v) => setMod('sketchingStyle', v as SketchingStyleStep)}
                popoverWidth={340}
              />
            </Row>
          )}
          {has('penTip') && (
            <Row>
              <Dropdown
                label="Pen tip"
                value={mods.penTip}
                sections={[{
                  heading: 'Pen-tip preset (perfect-freehand)',
                  options: PEN_TIP_STEPS.map((s) => ({
                    value: s, label: s,
                    detail:
                      s === 'plain' ? 'Plain stroke — uniform width, no taper'
                      : s === 'ballpoint' ? 'Clean uniform, slight endpoint thinning'
                      : s === 'fineliner' ? 'Thin uniform, hard caps'
                      : s === 'pencil-hb' ? 'Mild width variation, light grain'
                      : s === 'pencil-2b' ? 'Stronger variation, heavier grain'
                      : s === 'felt-tip' ? 'Thicker uniform, soft caps'
                      : s === 'chisel' ? 'Strong width variation (calligraphic)'
                      : 'Heavy variable width, edge-jittered grain',
                  })),
                }]}
                onChange={(v) => setMod('penTip', v as PenTipStep)}
                popoverWidth={360}
              />
            </Row>
          )}
          {has('wobble') && (
            <Slider
              label={mods.wobble > 1.4 ? 'Wobble ⚠ Excalidraw zone' : 'Wobble'}
              value={mods.wobble}
              min={SLIDER_SPECS.wobble.min}
              max={SLIDER_SPECS.wobble.max}
              step={SLIDER_SPECS.wobble.step}
              onChange={(v) => setMod('wobble', v)}
            />
          )}
          {has('roughness') && (
            <Slider label="Roughness" value={mods.roughness} min={SLIDER_SPECS.roughness.min} max={SLIDER_SPECS.roughness.max} step={SLIDER_SPECS.roughness.step} onChange={(v) => setMod('roughness', v)} />
          )}
          {has('bowing') && (
            <Slider label="Bowing" value={mods.bowing} min={SLIDER_SPECS.bowing.min} max={SLIDER_SPECS.bowing.max} step={SLIDER_SPECS.bowing.step} onChange={(v) => setMod('bowing', v)} />
          )}
          {has('strokeWidth') && (
            <Slider label="Stroke width" value={mods.strokeWidth} min={SLIDER_SPECS.strokeWidth.min} max={SLIDER_SPECS.strokeWidth.max} step={SLIDER_SPECS.strokeWidth.step} onChange={(v) => setMod('strokeWidth', v)} />
          )}
          {has('curveTightness') && (
            <Slider label="Curve" value={mods.curveTightness} min={SLIDER_SPECS.curveTightness.min} max={SLIDER_SPECS.curveTightness.max} step={SLIDER_SPECS.curveTightness.step} onChange={(v) => setMod('curveTightness', v)} />
          )}
        </Section>
      )}

      {/* SHADING — Cluster 3 per I-13 */}
      {hasShadingBlock && (
        <Section title="Shading" note="Fill style + density · cluster 3">
          {has('fillStyle') && (
            <Row>
              <Dropdown
                label="Fill style"
                value={mods.fillStyle}
                sections={[{
                  heading: 'Fill style',
                  options: FILL_STYLE_STEPS.map((s) => ({ value: s, label: s })),
                }]}
                onChange={(v) => setMod('fillStyle', v as FillStyleStep)}
                popoverWidth={240}
              />
            </Row>
          )}
          {has('hachureGap') && (mods.fillStyle === 'hachure' || mods.fillStyle === 'cross-hatch' || mods.fillStyle === 'zigzag-line' || mods.fillStyle === 'zigzag' || mods.fillStyle === 'dashed') && (
            <Slider label="Hachure gap" value={mods.hachureGap} min={SLIDER_SPECS.hachureGap.min} max={SLIDER_SPECS.hachureGap.max} step={SLIDER_SPECS.hachureGap.step} unit="px" onChange={(v) => setMod('hachureGap', v)} />
          )}
          {has('hachureAngle') && (mods.fillStyle === 'hachure' || mods.fillStyle === 'cross-hatch' || mods.fillStyle === 'dashed' || mods.fillStyle === 'zigzag-line') && (
            <Slider label="Hachure angle" value={mods.hachureAngle} min={SLIDER_SPECS.hachureAngle.min} max={SLIDER_SPECS.hachureAngle.max} step={SLIDER_SPECS.hachureAngle.step} unit="°" onChange={(v) => setMod('hachureAngle', v)} />
          )}
          {has('fillDensity') && mods.fillStyle !== 'none' && (
            <Slider label="Fill density" value={mods.fillDensity} min={SLIDER_SPECS.fillDensity.min} max={SLIDER_SPECS.fillDensity.max} step={SLIDER_SPECS.fillDensity.step} onChange={(v) => setMod('fillDensity', v)} />
          )}
        </Section>
      )}

      {/* SURFACE TEXTURE — Cluster 4 per I-13 */}
      {hasSurfaceBlock && (
        <Section title="Surface texture" note="Substrate / grain / register · cluster 4">
          {has('blurAmount') && <Slider label="Blur amount" value={mods.blurAmount} min={SLIDER_SPECS.blurAmount.min} max={SLIDER_SPECS.blurAmount.max} step={SLIDER_SPECS.blurAmount.step} onChange={(v) => setMod('blurAmount', v)} />}
          {has('bleed') && <Slider label="Bleed" value={mods.bleed} min={SLIDER_SPECS.bleed.min} max={SLIDER_SPECS.bleed.max} step={SLIDER_SPECS.bleed.step} onChange={(v) => setMod('bleed', v)} />}
          {has('dotSize') && <Slider label="Dot size" value={mods.dotSize} min={SLIDER_SPECS.dotSize.min} max={SLIDER_SPECS.dotSize.max} step={SLIDER_SPECS.dotSize.step} onChange={(v) => setMod('dotSize', v)} />}
          {has('dotSpacing') && <Slider label="Dot spacing" value={mods.dotSpacing} min={SLIDER_SPECS.dotSpacing.min} max={SLIDER_SPECS.dotSpacing.max} step={SLIDER_SPECS.dotSpacing.step} unit="px" onChange={(v) => setMod('dotSpacing', v)} />}
          {has('dotScatter') && <Slider label="Dot scatter" value={mods.dotScatter} min={SLIDER_SPECS.dotScatter.min} max={SLIDER_SPECS.dotScatter.max} step={SLIDER_SPECS.dotScatter.step} onChange={(v) => setMod('dotScatter', v)} />}
          {has('dotPattern') && (
            <Row>
              <Dropdown
                label="Dot pattern"
                value={mods.dotPattern}
                sections={[{ heading: 'Dot pattern', options: DOT_PATTERN_STEPS.map((s) => ({ value: s, label: s })) }]}
                onChange={(v) => setMod('dotPattern', v as DotPatternStep)}
                popoverWidth={220}
              />
            </Row>
          )}
          {has('grainIntensity') && <Slider label="Grain" value={mods.grainIntensity} min={SLIDER_SPECS.grainIntensity.min} max={SLIDER_SPECS.grainIntensity.max} step={SLIDER_SPECS.grainIntensity.step} onChange={(v) => setMod('grainIntensity', v)} />}
          {has('smudgeAmount') && <Slider label="Smudge" value={mods.smudgeAmount} min={SLIDER_SPECS.smudgeAmount.min} max={SLIDER_SPECS.smudgeAmount.max} step={SLIDER_SPECS.smudgeAmount.step} onChange={(v) => setMod('smudgeAmount', v)} />}
          {has('pressureVariance') && <Slider label="Pressure variance" value={mods.pressureVariance} min={SLIDER_SPECS.pressureVariance.min} max={SLIDER_SPECS.pressureVariance.max} step={SLIDER_SPECS.pressureVariance.step} onChange={(v) => setMod('pressureVariance', v)} />}
          {has('offsetDistance') && <Slider label="Offset distance" value={mods.offsetDistance} min={SLIDER_SPECS.offsetDistance.min} max={SLIDER_SPECS.offsetDistance.max} step={SLIDER_SPECS.offsetDistance.step} unit="px" onChange={(v) => setMod('offsetDistance', v)} />}
          {has('offsetAngle') && <Slider label="Offset angle" value={mods.offsetAngle} min={SLIDER_SPECS.offsetAngle.min} max={SLIDER_SPECS.offsetAngle.max} step={SLIDER_SPECS.offsetAngle.step} unit="°" onChange={(v) => setMod('offsetAngle', v)} />}
          {has('colorShift') && <Slider label="Color shift" value={mods.colorShift} min={SLIDER_SPECS.colorShift.min} max={SLIDER_SPECS.colorShift.max} step={SLIDER_SPECS.colorShift.step} onChange={(v) => setMod('colorShift', v)} />}
          {has('risoSecondaryColor') && (
            <Row>
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
                onChange={(v) => setMod('risoSecondaryColor', v as PaletteModeStep)}
                popoverWidth={340}
              />
            </Row>
          )}
          {has('registrationError') && <Slider label="Registration error" value={mods.registrationError} min={SLIDER_SPECS.registrationError.min} max={SLIDER_SPECS.registrationError.max} step={SLIDER_SPECS.registrationError.step} onChange={(v) => setMod('registrationError', v)} />}
        </Section>
      )}

      {/* COLOR / PALETTE — Cluster 5 per I-13 */}
      <Section title="Color / palette" note="Ink + palette overrides · cluster 5">
        {has('inkIntensity') && <Slider label="Ink intensity" value={mods.inkIntensity} min={SLIDER_SPECS.inkIntensity.min} max={SLIDER_SPECS.inkIntensity.max} step={SLIDER_SPECS.inkIntensity.step} onChange={(v) => setMod('inkIntensity', v)} />}
        {has('fillOpacity') && <Slider label="Fill opacity" value={mods.fillOpacity} min={SLIDER_SPECS.fillOpacity.min} max={SLIDER_SPECS.fillOpacity.max} step={SLIDER_SPECS.fillOpacity.step} onChange={(v) => setMod('fillOpacity', v)} />}
        {has('paletteMode') && (
          <>
            <Row>
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
                onChange={(v) => setMod('strokePalette', v as PaletteModeStep)}
                popoverWidth={320}
              />
            </Row>
            <Row>
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
                onChange={(v) => setMod('fillPalette', v as PaletteModeStep)}
                popoverWidth={320}
              />
            </Row>
          </>
        )}
        {has('texture') && svgStyle !== 'wet-ink' && svgStyle !== 'charcoal' && (
          <Row>
            <Dropdown
              label="Texture"
              value={mods.texture}
              sections={[{ heading: 'Texture', options: TEXTURE_STEPS.map((s) => ({ value: s, label: s })) }]}
              onChange={(v) => setMod('texture', v as TextureStep)}
              popoverWidth={260}
            />
          </Row>
        )}
        {has('textureIntensity') && (mods.texture !== 'none' || svgStyle === 'wet-ink' || svgStyle === 'charcoal') && (
          <Slider label="Texture intensity" value={mods.textureIntensity} min={SLIDER_SPECS.textureIntensity.min} max={SLIDER_SPECS.textureIntensity.max} step={SLIDER_SPECS.textureIntensity.step} onChange={(v) => setMod('textureIntensity', v)} />
        )}
      </Section>

      {/* Reset — bottom, full-width */}
      <div style={{ padding: '18px' }}>
        <button
          onClick={() => {
            const next = applyStylePreset(mods, svgStyle);
            Object.keys(next).forEach((k) => {
              const key = k as keyof typeof next;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setMod(key, (next as any)[key]);
            });
          }}
          title={`Reset modifiers to the ${svgStyle} style preset`}
          style={{
            width: '100%',
            padding: '10px 16px',
            border: '1px solid var(--dir-border)',
            background: 'var(--dir-bg)',
            color: 'var(--dir-text-primary)',
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderRadius: 999,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dir-raised)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--dir-bg)')}
        >
          Reset to {svgStyle} preset
        </button>
      </div>
    </div>
  );
}
