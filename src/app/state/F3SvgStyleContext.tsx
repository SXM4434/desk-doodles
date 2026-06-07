import { createContext, useContext, useState, type ReactNode } from 'react';

// F3 SVG style toggle — cross-path render-treatment dimension.
//
// Per F3-toggle-architecture.md (2026-06-01): every Style option must have
// BOTH an SVG implementation AND a 3D implementation (same Style value, same
// register, different implementation per path). 3D versions come in Phase 3.

export type F3SvgStyle =
  | 'clean'
  | 'outline-only'
  | 'rough-handdrawn'
  | 'sketchy'
  | 'bold-ink'
  | 'wet-ink'
  | 'stipple'
  | 'charcoal'
  | 'risograph'
  | 'newsprint'
  | 'wireframe';

export type F3SvgStyleMeta = {
  id: F3SvgStyle;
  label: string;
  detail: string;
  /** True if this style uses rough.js-family parameters (modifiers section applies). */
  isRoughFamily: boolean;
};

export const F3_SVG_STYLES: F3SvgStyleMeta[] = [
  { id: 'clean',           label: 'Clean',           detail: 'Source SVG as drawn. Crisp vectors.', isRoughFamily: false },
  { id: 'outline-only',    label: 'Outline only',    detail: 'Strip fills; keep strokes only. Pure line illustration register.', isRoughFamily: false },
  { id: 'rough-handdrawn', label: 'Rough hand-drawn', detail: 'rough.js multi-stroke jittered Bezier. Sibling-coherent with playground.', isRoughFamily: true },
  { id: 'sketchy',         label: 'Sketchy',         detail: 'Gentler rough — lower roughness, fewer strokes. Quick-draft register.', isRoughFamily: true },
  { id: 'bold-ink',        label: 'Bold ink',        detail: 'Heavier strokes (~2.5+), less jitter — confident felt-tip register.', isRoughFamily: true },
  { id: 'wet-ink',         label: 'Wet ink',         detail: 'Soft edges via feGaussianBlur filter — bleeding-paper feel.', isRoughFamily: false },
  { id: 'stipple',         label: 'Stipple',         detail: 'Dot-pattern fills. Pointillist register.', isRoughFamily: true },
  { id: 'charcoal',        label: 'Charcoal',        detail: 'feTurbulence filter overlay on strokes — graphite register.', isRoughFamily: false },
  { id: 'risograph',       label: 'Risograph',       detail: 'Each path duplicated in 2 colors with offset — print-shop register.', isRoughFamily: false },
  { id: 'newsprint',       label: 'Newsprint',       detail: 'Dot-pattern fills via SVG pattern — newspaper register.', isRoughFamily: false },
  { id: 'wireframe',       label: 'Wireframe',       detail: 'Bounding-box / simplified outline only, no fills — schematic register.', isRoughFamily: false },
];

type Ctx = {
  state: F3SvgStyle;
  setState: (v: F3SvgStyle) => void;
};

const F3SvgStyleCtx = createContext<Ctx | null>(null);

export function F3SvgStyleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<F3SvgStyle>('clean');
  return <F3SvgStyleCtx.Provider value={{ state, setState }}>{children}</F3SvgStyleCtx.Provider>;
}

export function useF3SvgStyle(): Ctx {
  const v = useContext(F3SvgStyleCtx);
  if (!v) throw new Error('useF3SvgStyle must be used inside F3SvgStyleProvider');
  return v;
}

export function isRoughFamilyStyle(s: F3SvgStyle): boolean {
  return F3_SVG_STYLES.find((m) => m.id === s)?.isRoughFamily ?? false;
}
