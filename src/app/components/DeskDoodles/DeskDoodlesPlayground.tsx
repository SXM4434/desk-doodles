import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from '../../lib/typography';
import {
  F3_TROPHY_WALL_SUBJECTS,
  type F3SubjectId,
  type F3TrophyWallShapeId,
} from '../../lib/items/identitySet';
import { PinShape } from '../../lib/items/PinShape';
import { SvgStyleTransform } from '../canvas/SvgStyleTransform';
import { F3_SVG_STYLES, useF3SvgStyle } from '../../state/F3SvgStyleContext';
import {
  useF3RoughModifiers,
  MULTI_STROKE_STEPS,
  FILL_STYLE_STEPS,
  PALETTE_MODE_STEPS,
  TEXTURE_STEPS,
  ENDPOINT_BEHAVIOR_STEPS,
  SKETCHING_STYLE_STEPS,
  PEN_TIP_STEPS,
} from '../../state/F3RoughModifiersContext';

type CanvasMode = 'svg' | '3d';

type PlacedItem = {
  id: string;
  shape: F3TrophyWallShapeId;
  x: number;
  y: number;
};

const PILL: CSSProperties = {
  borderRadius: 999,
  fontFamily: IS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  border: '1px solid var(--dir-border)',
  background: 'transparent',
  color: 'var(--dir-text-body)',
  padding: '6px 14px',
  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
};

const PILL_ACTIVE: CSSProperties = {
  ...PILL,
  background: 'var(--dir-accent)',
  color: 'var(--dir-bg)',
  borderColor: 'var(--dir-accent)',
};

const CTA: CSSProperties = {
  ...PILL,
  background: 'var(--dir-cta-bg)',
  color: 'var(--dir-cta-text)',
  borderColor: 'var(--dir-cta-border)',
};

const SECTION_LABEL: CSSProperties = {
  fontFamily: IS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--dir-text-secondary)',
  margin: 0,
};

export function DeskDoodlesPlayground() {
  // Force Smart Hachure v2 ON for the playground — the engine is gated behind
  // ?smartHachure=1 in SvgStyleTransform. Playground always opts in.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('smartHachure') !== '1') {
      url.searchParams.set('smartHachure', '1');
      window.history.replaceState({}, '', url.toString());
      // Reload so SvgStyleTransform reads the param on mount.
      window.location.reload();
    }
  }, []);

  const [mode, setMode] = useState<CanvasMode>('svg');
  const [items, setItems] = useState<PlacedItem[]>([]);
  const [activeSubject, setActiveSubject] = useState<F3SubjectId>('sketching');
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const { state: svgStyle, setState: setSvgStyle } = useF3SvgStyle();
  const { state: mods, set: setMod, reset: resetMods } = useF3RoughModifiers();

  const activeSubjectDef = F3_TROPHY_WALL_SUBJECTS.find((s) => s.id === activeSubject);

  const addItem = useCallback((shape: F3TrophyWallShapeId) => {
    setItems((prev) => {
      const offset = (prev.length % 8) * 32;
      const rowOffset = Math.floor(prev.length / 8) * 32;
      return [
        ...prev,
        {
          id: `${shape}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          shape,
          x: 80 + offset,
          y: 80 + rowOffset + offset * 0.5,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, item: PlacedItem) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      dragOffsetRef.current = {
        dx: e.clientX - rect.left,
        dy: e.clientY - rect.top,
      };
      setDraggingId(item.id);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingId || !canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - canvasRect.left - dragOffsetRef.current.dx;
      const y = e.clientY - canvasRect.top - dragOffsetRef.current.dy;
      setItems((prev) => prev.map((i) => (i.id === draggingId ? { ...i, x, y } : i)));
    },
    [draggingId],
  );

  const handlePointerUp = useCallback(() => setDraggingId(null), []);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--dir-bg)',
        color: 'var(--dir-text-primary)',
        fontFamily: IS,
        overflow: 'hidden',
      }}
    >
      {/* ─── Top chrome ─────────────────────────────────────────────── */}
      <header
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--dir-border)',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 16,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NavLink
            to="/"
            style={{
              fontFamily: ISe,
              fontSize: 17,
              letterSpacing: '-0.01em',
              color: 'var(--dir-text-primary)',
              textDecoration: 'none',
            }}
          >
            Desk Doodles
          </NavLink>
          <button
            onClick={() => setLeftOpen((v) => !v)}
            title={leftOpen ? 'Hide items panel' : 'Show items panel'}
            style={{ ...PILL, padding: '4px 10px', fontSize: 10 }}
          >
            {leftOpen ? '◀ Items' : 'Items ▶'}
          </button>
        </div>

        <div
          style={{
            display: 'inline-flex',
            border: '1px solid var(--dir-border)',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          {(['svg', '3d'] as CanvasMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                ...PILL,
                border: 'none',
                borderRadius: 0,
                background: mode === m ? 'var(--dir-accent)' : 'transparent',
                color: mode === m ? 'var(--dir-bg)' : 'var(--dir-text-body)',
              }}
            >
              {m === 'svg' ? '2D' : '3D'}
            </button>
          ))}
        </div>

        <div style={{ justifySelf: 'end', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setRightOpen((v) => !v)}
            title={rightOpen ? 'Hide controls panel' : 'Show controls panel'}
            style={{ ...PILL, padding: '4px 10px', fontSize: 10 }}
          >
            {rightOpen ? 'Controls ▶' : '◀ Controls'}
          </button>
          <button disabled style={{ ...CTA, opacity: 0.4, cursor: 'not-allowed' }}>
            Publish
          </button>
        </div>
      </header>

      {/* ─── Body: left panel + canvas + right panel ──────────────── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* LEFT PANEL — items picker (column-within-panel) */}
        {leftOpen && (
          <aside
            style={{
              width: 360,
              borderRight: '1px solid var(--dir-border)',
              background: 'var(--dir-raised)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--dir-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={SECTION_LABEL}>Items</span>
              <span style={{ ...SECTION_LABEL, color: 'var(--dir-text-body-soft)' }}>
                {items.length} placed
              </span>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '110px 1fr', minHeight: 0 }}>
              {/* Vertical category column (NN/G pattern: text labels, all visible) */}
              <nav
                style={{
                  borderRight: '1px solid var(--dir-border)',
                  overflowY: 'auto',
                  padding: '8px 0',
                }}
              >
                {F3_TROPHY_WALL_SUBJECTS.map((subj) => {
                  const active = subj.id === activeSubject;
                  return (
                    <button
                      key={subj.id}
                      onClick={() => setActiveSubject(subj.id)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 14px',
                        background: active ? 'var(--dir-bg)' : 'transparent',
                        border: 'none',
                        borderLeft: `2px solid ${active ? 'var(--dir-accent)' : 'transparent'}`,
                        color: active ? 'var(--dir-text-primary)' : 'var(--dir-text-body)',
                        fontFamily: IS,
                        fontSize: 12,
                        fontWeight: active ? 600 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      {subj.displayName}
                    </button>
                  );
                })}
              </nav>

              {/* Items grid (visually dominant) */}
              <div
                style={{
                  overflowY: 'auto',
                  padding: 12,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                  alignContent: 'start',
                }}
              >
                {activeSubjectDef?.forms.map((form) => (
                  <button
                    key={form.shape}
                    onClick={() => addItem(form.shape)}
                    title={form.label}
                    style={{
                      // No card chrome — just the SVG. Per Sebs's "no cards, just items in a grid".
                      background: 'transparent',
                      border: 'none',
                      padding: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      borderRadius: 8,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dir-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      style={{
                        aspectRatio: '1 / 1',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PinShape shape={form.shape} />
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: IS,
                        fontSize: 9,
                        color: 'var(--dir-text-body-soft)',
                        letterSpacing: '0.02em',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                      }}
                    >
                      {form.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* MAIN CANVAS */}
        <main
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{
            flex: 1,
            position: 'relative',
            background: 'var(--dir-bg)',
            overflow: 'auto',
            cursor: draggingId ? 'grabbing' : 'default',
          }}
        >
          {items.length === 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--dir-text-body-soft)',
                fontFamily: IS,
                fontSize: 12,
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              Pick items from the left panel.<br />
              Twist Smart Hachure controls on the right to see them re-render.<br />
              Drag any item to move it. Hover and click ✕ to remove.
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              onPointerDown={(e) => handlePointerDown(e, item)}
              style={{
                position: 'absolute',
                left: item.x,
                top: item.y,
                width: 140,
                cursor: draggingId === item.id ? 'grabbing' : 'grab',
                touchAction: 'none',
                userSelect: 'none',
              }}
            >
              <SvgStyleTransform>
                <PinShape shape={item.shape} />
              </SvgStyleTransform>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item.id);
                }}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  border: '1px solid var(--dir-border)',
                  background: 'var(--dir-bg)',
                  color: 'var(--dir-text-body)',
                  fontFamily: IS,
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  opacity: 0,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onPointerEnter={(e) => (e.currentTarget.style.opacity = '1')}
              >
                ✕
              </button>
            </div>
          ))}
        </main>

        {/* RIGHT PANEL — Smart Hachure controls */}
        {rightOpen && (
          <aside
            style={{
              width: 280,
              borderLeft: '1px solid var(--dir-border)',
              background: 'var(--dir-raised)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--dir-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={SECTION_LABEL}>Smart Hachure</span>
              <button
                onClick={resetMods}
                style={{ ...PILL, padding: '4px 10px', fontSize: 9 }}
              >
                Reset
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Style">
                <Select
                  value={svgStyle}
                  options={F3_SVG_STYLES.map((s) => ({ value: s.id, label: s.label }))}
                  onChange={(v) => setSvgStyle(v as typeof svgStyle)}
                />
              </Field>

              <Field label="Multi-stroke">
                <Select
                  value={mods.multiStroke}
                  options={MULTI_STROKE_STEPS.map((v) => ({ value: v, label: v }))}
                  onChange={(v) => setMod('multiStroke', v as typeof mods.multiStroke)}
                />
              </Field>

              <Field label="Fill style">
                <Select
                  value={mods.fillStyle}
                  options={FILL_STYLE_STEPS.map((v) => ({ value: v, label: v }))}
                  onChange={(v) => setMod('fillStyle', v as typeof mods.fillStyle)}
                />
              </Field>

              <Field label="Endpoint">
                <Select
                  value={mods.endpointBehavior}
                  options={ENDPOINT_BEHAVIOR_STEPS.map((v) => ({ value: v, label: v }))}
                  onChange={(v) => setMod('endpointBehavior', v as typeof mods.endpointBehavior)}
                />
              </Field>

              <Field label="Sketching style">
                <Select
                  value={mods.sketchingStyle}
                  options={SKETCHING_STYLE_STEPS.map((v) => ({ value: v, label: v }))}
                  onChange={(v) => setMod('sketchingStyle', v as typeof mods.sketchingStyle)}
                />
              </Field>

              <Field label="Pen tip">
                <Select
                  value={mods.penTip}
                  options={PEN_TIP_STEPS.map((v) => ({ value: v, label: v }))}
                  onChange={(v) => setMod('penTip', v as typeof mods.penTip)}
                />
              </Field>

              <Field label="Texture">
                <Select
                  value={mods.texture}
                  options={TEXTURE_STEPS.map((v) => ({ value: v, label: v }))}
                  onChange={(v) => setMod('texture', v as typeof mods.texture)}
                />
              </Field>

              <Field label="Stroke palette">
                <Select
                  value={mods.strokePalette}
                  options={PALETTE_MODE_STEPS.map((v) => ({ value: v, label: v }))}
                  onChange={(v) => setMod('strokePalette', v as typeof mods.strokePalette)}
                />
              </Field>

              <Field label="Fill palette">
                <Select
                  value={mods.fillPalette}
                  options={PALETTE_MODE_STEPS.map((v) => ({ value: v, label: v }))}
                  onChange={(v) => setMod('fillPalette', v as typeof mods.fillPalette)}
                />
              </Field>

              <Slider
                label="Wobble"
                value={mods.wobble}
                min={0} max={2} step={0.05}
                onChange={(v) => setMod('wobble', v)}
              />

              <Slider
                label="Roughness"
                value={mods.roughness}
                min={0} max={12} step={0.1}
                onChange={(v) => setMod('roughness', v)}
              />

              <Slider
                label="Stroke width"
                value={mods.strokeWidth}
                min={0.1} max={10} step={0.1}
                onChange={(v) => setMod('strokeWidth', v)}
              />

              <Slider
                label="Ink intensity"
                value={mods.inkIntensity}
                min={0} max={1} step={0.02}
                onChange={(v) => setMod('inkIntensity', v)}
              />

              <Slider
                label="Fill opacity"
                value={mods.fillOpacity}
                min={0} max={1} step={0.02}
                onChange={(v) => setMod('fillOpacity', v)}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/* ─── Field shells ────────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={SECTION_LABEL}>{label}</span>
      {children}
    </div>
  );
}

function Select({
  value, options, onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        fontFamily: IS,
        fontSize: 12,
        padding: '8px 12px',
        borderRadius: 999,
        border: '1px solid var(--dir-border)',
        background: 'var(--dir-bg)',
        color: 'var(--dir-text-primary)',
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage:
          "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23383632' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 14px center',
        paddingRight: 32,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Slider({
  label, value, min, max, step, onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={SECTION_LABEL}>{label}</span>
        <span
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--dir-text-body)',
          }}
        >
          {value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          accentColor: 'var(--dir-accent)',
        }}
      />
    </div>
  );
}
