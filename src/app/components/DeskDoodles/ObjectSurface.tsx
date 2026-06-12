import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { IS } from '../../lib/typography';
import { PILL, CTA, SECTION_LABEL, RAISED_SHADOW } from '../../lib/chromeStyles';
import { ObjectCard } from './ObjectCard';
import { Slider } from '../chrome/Slider';
import { Dropdown } from '../chrome/Dropdown';
import { SLIDER_SPECS } from '../chrome/modifierSpecs';
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
} from '../../state/F3RoughModifiersContext';
import { applyStylePreset } from '../canvas/SvgStyleTransform';

// ─── ObjectSurface — the one morphing object panel (modes, never nested) ──────
// Per docs/design/object-model-and-desk-architecture.md §"The one object
// surface": ONE component, mode driven by context. Create lives in DrawPanel;
// this is the INSPECT side — click your own object → Edit; click someone
// else's → Sandbox. DeskPage holds a single activeSurface slot so this and
// DrawPanel can never both be open (nesting is structurally impossible).
//
// SANDBOX LIVE CONTROLS (design doc §"one object surface" Sandbox row): play
// with someone else's doodle through VIEWER config — their markup re-renders
// through YOUR control values, nothing saves, close discards. The mechanism:
// the embedded ObjectCard renders its art through SvgStyleTransform, which
// reads style + modifiers from context. In Sandbox we wrap JUST the card in
// fresh nested F3SvgStyleProvider/F3RoughModifiersProvider instances — the
// nested providers shadow the app-root ones for the card subtree ONLY, so the
// card re-renders through the IDENTICAL desk render path with local values
// while the desk behind keeps reading the untouched global context (it cannot
// restyle). Local control state is plain useState here; it dies on close, so
// reopen always starts back at the desk's real values.

export type ObjectSurfaceMode = 'edit' | 'sandbox';

export type ObjectSurfaceData = {
  svgMarkup: string;
  name?: string | null;
  why?: string | null;
  owner?: string | null;
  createdAt?: string | null;
};

/** Sync bridge between ObjectSurface's plain local state and the NESTED
 *  providers wrapping the sandbox card. It runs inside the nested scope, so
 *  setState/replace here touch only the card's shadowed context — never the
 *  global one. useLayoutEffect so the sync lands before paint (no flash of
 *  provider-default style on open). The `state !== mods` guard makes the
 *  replace() settle in one pass (replace stores the same object reference,
 *  so the re-run after the state change is a no-op). */
function SandboxRenderScope({
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

export function ObjectSurface({
  mode,
  object,
  onClose,
  onDelete,
  onSave,
  rightInset = 0,
}: {
  mode: ObjectSurfaceMode;
  object: ObjectSurfaceData;
  onClose: () => void;
  /** Edit mode only — delete this (your own) object. */
  onDelete?: () => void;
  /** Edit mode only — persist the edited name/why (called on Done). */
  onSave?: (name: string | null, why: string | null) => void;
  /** px width of the desk's open right controls panel. The scrim reserves this
   *  much padding on the right so the modal centers over the DESK working area,
   *  not behind the open panel. 0 (default) = center over the raw viewport. */
  rightInset?: number;
}) {
  const isSandbox = mode === 'sandbox';
  // Local editable copy of name/why for Edit mode (save layer is a follow-up;
  // for now the card is editable so the shape is right, persistence next).
  const [name, setName] = useState(object.name ?? '');
  const [why, setWhy] = useState(object.why ?? '');

  // ── Sandbox baseline — the GLOBAL desk style + modifiers, captured ONCE at
  // open (useState initializer, never re-read). The sandbox controls start
  // here so the card opens looking exactly like the object does on the desk,
  // and divergence is measured against this. Reading the global context is
  // read-only — the sandbox never writes back to it.
  const globalStyleCtx = useF3SvgStyle();
  const globalModsCtx = useF3RoughModifiers();
  const [baseline] = useState(() => ({
    style: globalStyleCtx.state,
    mods: globalModsCtx.state,
  }));

  // Sandbox-local viewer config — plain useState, scoped to this surface.
  // Unmount (close) discards everything; reopen re-captures the baseline.
  const [sbStyle, setSbStyle] = useState<F3SvgStyle>(baseline.style);
  const [sbWobble, setSbWobble] = useState(baseline.mods.wobble);
  const [sbStrokeWidth, setSbStrokeWidth] = useState(baseline.mods.strokeWidth);
  const [sbFillDensity, setSbFillDensity] = useState(baseline.mods.fillDensity);

  /** Style switch mirrors the desk chrome's merge semantics: picking a style
   *  merges its preset onto the baseline (so "Bold ink" actually reads as bold
   *  ink), and the sliders snap to the merged values so readouts stay truthful.
   *  Picking the baseline style back returns to the desk's exact values. */
  const handleSandboxStyle = (next: F3SvgStyle) => {
    setSbStyle(next);
    const merged =
      next === baseline.style ? baseline.mods : applyStylePreset(baseline.mods, next);
    setSbWobble(merged.wobble);
    setSbStrokeWidth(merged.strokeWidth);
    setSbFillDensity(merged.fillDensity);
  };

  // The full modifier state fed to the nested provider: baseline (or baseline
  // + style preset) with the three live slider values layered on top.
  const sandboxMods = useMemo<F3ModifiersState>(() => {
    const base =
      sbStyle === baseline.style ? baseline.mods : applyStylePreset(baseline.mods, sbStyle);
    return {
      ...base,
      wobble: sbWobble,
      strokeWidth: sbStrokeWidth,
      fillDensity: sbFillDensity,
    };
  }, [baseline, sbStyle, sbWobble, sbStrokeWidth, sbFillDensity]);

  // Quiet divergence affordance — true once any control left the desk values.
  const sandboxDiverged =
    sbStyle !== baseline.style ||
    sbWobble !== baseline.mods.wobble ||
    sbStrokeWidth !== baseline.mods.strokeWidth ||
    sbFillDensity !== baseline.mods.fillDensity;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
    // left). Default 0 leaves the base 32px padding untouched.
    paddingRight: 32 + rightInset,
  };

  const panel: CSSProperties = {
    background: 'var(--dir-raised)',
    border: '1px solid var(--dir-border)',
    // Sandbox gets a distinct dashed edge so it never reads as "your editable
    // object" (read-only-vs-ephemeral signposting).
    borderStyle: isSandbox ? 'dashed' : 'solid',
    borderRadius: 16,
    boxShadow: RAISED_SHADOW,
    padding: 20,
    // Sandbox is a MINI DESK (Sebs 2026-06-11): art beside controls, the same
    // side-by-side grammar as the big desk (canvas + right panel) — wide panel,
    // no vertical scroll. Edit (no control column yet) keeps the card width.
    width: isSandbox ? 'min(700px, calc(100vw - 64px))' : 'min(360px, calc(100vw - 64px))',
    maxHeight: 'calc(100vh - 64px)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    fontFamily: IS,
  };

  // The embedded card — the modal panel IS the card; no card-inside-a-card.
  const card = (
    <ObjectCard
      svgMarkup={object.svgMarkup}
      name={isSandbox ? object.name : name}
      why={isSandbox ? object.why : why}
      owner={object.owner}
      createdAt={object.createdAt}
      embedded
      editable={!isSandbox}
      onNameChange={setName}
      onWhyChange={setWhy}
    />
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
          {/* Sandbox wraps JUST the card in nested providers so the art
              re-renders through the desk's own SvgStyleTransform path with the
              LOCAL values; Edit renders under the global context as before. */}
          <div style={{ flex: '1 1 300px', minWidth: 280 }}>
            {isSandbox ? (
              <F3SvgStyleProvider>
                <F3RoughModifiersProvider>
                  <SandboxRenderScope svgStyle={sbStyle} mods={sandboxMods}>
                    {card}
                  </SandboxRenderScope>
                </F3RoughModifiersProvider>
              </F3SvgStyleProvider>
            ) : (
              card
            )}
          </div>

        {/* Sandbox control column — viewer config BESIDE the card (mini desk):
            style dropdown + the three core feel sliders (same specs as the
            desk chrome, so the ranges match what the maker had). */}
        {isSandbox && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              flex: '1 1 260px',
              minWidth: 240,
              borderLeft: '1px solid var(--dir-border)',
              paddingLeft: 18,
              alignSelf: 'stretch',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span style={SECTION_LABEL}>Restyle</span>
              {/* Quiet divergence note — fades in once values leave the desk's;
                  fixed slot (opacity, not mount) so the strip never jumps. */}
              <span
                aria-hidden={!sandboxDiverged}
                style={{
                  fontFamily: IS,
                  fontSize: 10,
                  fontStyle: 'italic',
                  color: 'var(--dir-text-body-soft)',
                  whiteSpace: 'nowrap',
                  opacity: sandboxDiverged ? 1 : 0,
                  transition: 'opacity 0.25s',
                }}
              >
                restyled locally — nothing saves
              </span>
            </div>

            <Dropdown
              label="SVG style"
              value={sbStyle}
              sections={[
                {
                  heading: 'SVG render style',
                  options: F3_SVG_STYLES.map((s) => ({
                    value: s.id,
                    label: s.label,
                    detail: s.detail,
                  })),
                },
              ]}
              onChange={(v) => handleSandboxStyle(v as F3SvgStyle)}
            />

            <Slider
              label="Wobble"
              value={sbWobble}
              min={SLIDER_SPECS.wobble.min}
              max={SLIDER_SPECS.wobble.max}
              step={SLIDER_SPECS.wobble.step}
              onChange={setSbWobble}
            />
            <Slider
              label="Stroke width"
              value={sbStrokeWidth}
              min={SLIDER_SPECS.strokeWidth.min}
              max={SLIDER_SPECS.strokeWidth.max}
              step={SLIDER_SPECS.strokeWidth.step}
              onChange={setSbStrokeWidth}
            />
            <Slider
              label="Fill density"
              value={sbFillDensity}
              min={SLIDER_SPECS.fillDensity.min}
              max={SLIDER_SPECS.fillDensity.max}
              step={SLIDER_SPECS.fillDensity.step}
              onChange={setSbFillDensity}
            />
          </div>
        )}
        </div>

        <footer style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          {isSandbox ? (
            // Just Close in Sandbox for now. The "Remix as mine" button returns
            // when the fork-into-new-owned-object write lands (no greyed stub).
            <button onClick={onClose} style={PILL}>Close</button>
          ) : (
            <>
              <button
                onClick={onDelete}
                disabled={!onDelete}
                title="Remove this doodle from the desk"
                style={{ ...PILL, borderColor: 'var(--dir-border)', color: 'var(--dir-text-body-soft)' }}
              >
                Delete
              </button>
              <button
                onClick={() => {
                  // Persist the edited name/why, then close. Empty → null.
                  onSave?.(name.trim() || null, why.trim() || null);
                  onClose();
                }}
                style={CTA}
              >
                Done
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
