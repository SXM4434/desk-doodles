import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { PILL } from '../../lib/chromeStyles';

// Collapse motion: ~260ms ease-out (Material "standard" curve). The inner
// content slides via transform (composite-only) while the outer width
// transition stays under 300ms to bound the layout-reflow cost.
const DURATION = 260;
const EASE = 'cubic-bezier(0.2, 0, 0, 1)';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** Persisted panel open state, keyed per page+side in localStorage. */
export function usePanelOpen(
  key: string,
  defaultOpen = true,
): [boolean, () => void, (v: boolean) => void] {
  const storageKey = `dd.panel.${key}`;
  const [open, setOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved === null ? defaultOpen : saved === '1';
  });
  useEffect(() => {
    localStorage.setItem(storageKey, open ? '1' : '0');
  }, [open, storageKey]);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  return [open, toggle, setOpen];
}

/**
 * ⌘\ / Ctrl+\ minimizes or restores every registered panel at once
 * (Figma "Minimize UI" convention). The header PanelToggles never collapse,
 * so a visible escape hatch always remains — never shortcut-only recovery.
 */
export function useMinimizeUi(
  panels: Array<{ open: boolean; setOpen: (v: boolean) => void }>,
) {
  const ref = useRef(panels);
  ref.current = panels;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        const anyOpen = ref.current.some((p) => p.open);
        ref.current.forEach((p) => p.setOpen(!anyOpen));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

/**
 * Fixed-but-collapsible side panel (Figma UI3 model). Place as a direct child
 * of a `display: flex` row next to a `flex: 1` main; the panel keeps layout
 * space while open and releases it when collapsed. Visual styling of the
 * panel surface (bg, borders, padding, overflow) is passed via `style`.
 * When closed the content is visibility-hidden after the slide, removing it
 * from the tab order and accessibility tree (React 18 — no `inert`).
 */
export function CollapsiblePanel({
  side,
  open,
  width,
  id,
  style,
  children,
}: {
  side: 'left' | 'right';
  open: boolean;
  width: number;
  id?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const reduced = usePrefersReducedMotion();
  const outer: CSSProperties = {
    width: open ? width : 0,
    flexShrink: 0,
    overflow: 'hidden',
    transition: reduced ? 'none' : `width ${DURATION}ms ${EASE}`,
  };
  const inner: CSSProperties = {
    width,
    height: '100%',
    boxSizing: 'border-box',
    transform: open
      ? 'translateX(0)'
      : `translateX(${side === 'left' ? -width : width}px)`,
    opacity: open ? 1 : 0,
    visibility: open ? 'visible' : 'hidden',
    transition: reduced
      ? `opacity 150ms linear, visibility 0s linear ${open ? 0 : 150}ms`
      : `transform ${DURATION}ms ${EASE}, opacity ${DURATION}ms ${EASE}, visibility 0s linear ${open ? 0 : DURATION}ms`,
    ...style,
  };
  return (
    <div style={outer} aria-hidden={!open}>
      <aside id={id} style={inner}>
        {children}
      </aside>
    </div>
  );
}

const TOGGLE: CSSProperties = {
  ...PILL,
  padding: '4px 10px',
  fontSize: 10,
};

/**
 * Header pill that toggles a CollapsiblePanel. Lives in the page header
 * chrome (toggles always in chrome, never in the panel/canvas). Chevron
 * points toward the edge the panel collapses into and flips when collapsed.
 */
export function PanelToggle({
  side,
  open,
  label,
  onToggle,
  controlsId,
}: {
  side: 'left' | 'right';
  open: boolean;
  label: string;
  onToggle: () => void;
  controlsId?: string;
}) {
  const text =
    side === 'left'
      ? open
        ? `◀ ${label}`
        : `${label} ▶`
      : open
        ? `${label} ▶`
        : `◀ ${label}`;
  const isMac =
    typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().includes('MAC');
  const shortcut = isMac ? '⌘\\' : 'Ctrl+\\';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controlsId}
      title={`${open ? 'Hide' : 'Show'} ${label} panel (${shortcut})`}
      style={TOGGLE}
    >
      {text}
    </button>
  );
}
